const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const { getStandardBank } = require('../backend/lib/standard-bank');
const { findTrainingQuestion } = require('../backend/lib/training-question');
const { loadPublishedBank } = require('../backend/lib/published-bank');
const { fakeFirestore } = require('./helpers/fake-firestore.cjs');
const root = path.resolve(__dirname, '..');
const editions = getStandardBank();
const { isFreePreview } = require('../backend/lib/free-preview');

test('every reviewed edition is server-only and resolves through the server registry', async () => {
  const { POOL } = await import('../frontend/src/bank.js');
  const report = JSON.parse(fs.readFileSync(path.join(root, 'problems/reviews/synaq-standard-editions.json'), 'utf8'));
  assert.ok(editions.length >= 51, 'The original verified batch must be retained');
  assert.equal(editions.length, report.summary.verifiedEditions);
  assert.deepEqual(new Set(editions.map(q => q.id)), new Set(report.records.map(q => q.id)));
  assert.equal(new Set(editions.map(q => q.id)).size, editions.length);
  const publicIds = new Set(POOL.map(q => q.id));
  assert.ok(Object.isFrozen(editions));
  for (const q of editions) {
    assert.match(q.id, /^synaq_adapted_/);
    assert.equal(q.minimumPlan, 'pro'); assert.equal(q.editorialStatus, 'verified');
    assert.equal(publicIds.has(q.id), false, q.id);
    assert.equal(POOL.some(free => free.statement === q.statement), false, q.id);
    const resolved = await findTrainingQuestion(null, q.id);
    assert.equal(resolved, q); assert.ok(resolved.answer != null && resolved.solution);
  }
  assert.equal(POOL.some(q => q.id.startsWith('zerek_') || q.id.startsWith('synaq_adapted_')), false);
});

test('real private topics and questions require public Standard or higher without returning keys', async () => {
  const content = require('../api/learning').content(fakeFirestore());
  const ids = new Set(editions.map(q => q.id));
  const topics = [...new Set(editions.map(q => q.topic))];
  const plans = ['free', 'standard', 'pro', 'mentor'];
  const catalogs = new Map();
  for (const plan of plans) {
    catalogs.set(plan, await content.getTrainingTopics({ plan, gradeCeiling: 6 }));
    for (const topicId of topics) {
      const rows = await content.getTrainingQuestions({ plan, gradeCeiling: 6, topicId, mixed: false, excludeIds: [], limit: 100000 });
      const privateRows = rows.filter(q => ids.has(q.id));
      const expected = editions.filter(q => q.topic === topicId && (['pro','mentor'].includes(plan) || isFreePreview(q)));
      assert.deepEqual(new Set(privateRows.map(q => q.id)), new Set(expected.map(q => q.id)), `${plan}:${topicId}`);
      for (const q of rows) {
        assert.equal(Object.hasOwn(q,'answer'), false); assert.equal(Object.hasOwn(q,'solution'), false);
        assert.equal(q.id.startsWith('zerek_'), false);
      }
    }
  }
  for (const topicId of topics) {
    const count = plan => catalogs.get(plan).find(t => t.id === topicId)?.count || 0;
    assert.equal(count('free'), count('standard'), topicId);
    assert.equal(count('pro'), count('mentor'), topicId);
    assert.equal(count('pro') - count('free'), editions.filter(q => q.topic === topicId && !isFreePreview(q)).length, topicId);
  }
});

test('the real statistics topic is private and follows the server grade ceiling across bounded batches', async () => {
  const content = require('../api/learning').content(fakeFirestore());
  const statistics = editions.filter(q => q.topic === 'stats');
  assert.ok(statistics.length > 0);
  assert.ok(statistics.some(q => q.grade === 6));
  assert.ok(statistics.some(q => q.grade === 4));
  const request = { topicId:'stats', mixed:false, excludeIds:[], limit:60 };
  async function collectEligible(options, expected) {
    const expectedIds = new Set(expected.map(q => q.id));
    const seen = new Map();
    for (let batch = 0; batch <= Math.ceil(expected.length / request.limit); batch++) {
      const rows = await content.getTrainingQuestions({...request,...options,excludeIds:[...seen.keys()]});
      assert.ok(rows.length <= request.limit, 'A request must respect its batch limit');
      if (!rows.length) break;
      for (const row of rows) {
        assert.ok(expectedIds.has(row.id), `Unexpected plan/grade access: ${row.id}`);
        assert.equal(seen.has(row.id), false, 'Excluded questions must not repeat');
        assert.ok(row.grade <= options.gradeCeiling);
        assert.equal(Object.hasOwn(row, 'answer'), false);
        assert.equal(Object.hasOwn(row, 'solution'), false);
        seen.set(row.id, row);
      }
    }
    assert.deepEqual(new Set(seen.keys()), expectedIds, 'Every eligible question must remain reachable');
  }
  for (const options of [{plan:'free',gradeCeiling:6},{plan:'standard',gradeCeiling:6},{plan:'pro',gradeCeiling:4},{plan:'mentor',gradeCeiling:5}]) {
    const expected=['pro','mentor'].includes(options.plan) ? statistics.filter(q=>q.grade<=options.gradeCeiling) : [];
    await collectEligible(options, expected);
    const topic=(await content.getTrainingTopics(options)).find(t=>t.id==='stats');
    assert.equal(topic?.count||0,expected.length);
  }
  for(const plan of ['pro','mentor']){
    await collectEligible({plan,gradeCeiling:6}, statistics);
    assert.equal((await content.getTrainingTopics({plan,gradeCeiling:6})).find(t=>t.id==='stats').count,statistics.length);
  }
});

test('published admin ID collisions cannot replace private editions or grant free access', async () => {
  assert.ok(editions.length >= 51);
  const q=editions[0];
  const db=fakeFirestore({[`bankTasks/${q.id}`]:{...q,status:'published',minimumPlan:'free',editorialStatus:'draft',sourceProvider:'admin',statement:'Collision should never be selected',answer:'wrong'}});
  assert.equal(await findTrainingQuestion(db,q.id),q);
  const matches=(await loadPublishedBank(db)).filter(row=>row.id===q.id);
  assert.equal(matches.length,1);assert.equal(matches[0],q);
  const content=require('../api/learning').content(db);
  for(const plan of ['free','standard','pro','mentor']){
    const rows=await content.getTrainingQuestions({plan,gradeCeiling:6,topicId:q.topic,mixed:false,excludeIds:[],limit:100000});
    assert.equal(rows.some(row=>row.statement==='Collision should never be selected'),false);
    assert.equal(rows.some(row=>row.id===q.id),['pro','mentor'].includes(plan));
  }
});

const extensions=['','.js','.jsx','.mjs','.cjs','.ts','.tsx','.json'];
function clientDependencies(entry, projectRoot, seen=new Set()) {
  const full=path.resolve(entry);
  assert.equal(full.startsWith(path.join(projectRoot,'backend')+path.sep),false,`Client dependency reaches server code/data: ${full}`);
  if(seen.has(full))return seen;seen.add(full);
  if(!/\.[cm]?[jt]sx?$/.test(full))return seen;
  const source=fs.readFileSync(full,'utf8'), specs=[];
  assert.doesNotMatch(source,/\bimport\.meta\.glob\b/,`A client glob needs explicit dependency review: ${full}`);
  for(const match of source.matchAll(/\b(?:import|export)\s+(?:[^'";]*?\bfrom\s*)?(['"])([^'"]+)\1/g))specs.push(match[2]);
  for(const match of source.matchAll(/\b(?:import|require)\s*\(([^)]*)\)/g)){
    const literal=match[1].match(/^\s*(['"])([^'"]+)\1\s*(?:,.*)?$/s);
    assert.ok(literal,`Nonliteral module loading needs explicit dependency review: ${full}`);specs.push(literal[2]);
  }
  for(const match of source.matchAll(/\bnew\s+URL\s*\(\s*(['"])([^'"]+)\1/g))specs.push(match[2]);
  for(const raw of specs){
    const spec=raw.replace(/[?#].*$/,'');let target;
    if(spec.startsWith('file:'))target=fileURLToPath(spec);
    else if(spec.startsWith('/@fs/'))target=spec.slice('/@fs'.length);
    else if(spec.startsWith('/src/'))target=path.resolve(projectRoot,'frontend',spec.slice(1));
    else if(spec.startsWith('.'))target=path.resolve(path.dirname(full),spec);
    else continue;
    const candidates=[...extensions.map(ext=>target+ext),...extensions.slice(1).map(ext=>path.join(target,'index'+ext))];
    const resolved=candidates.find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile());
    assert.ok(resolved,`Unresolved client dependency ${raw} from ${full}`);
    clientDependencies(resolved,projectRoot,seen);
  }
  return seen;
}

test('frontend dependencies, including lazy routes and reexports, cannot reach the private server bank', () => {
  const vite=fs.readFileSync(path.join(root,'frontend/vite.config.js'),'utf8');
  assert.doesNotMatch(vite,/\balias\s*:/,'New aliases must be included in the private-bank dependency review');
  const deps=clientDependencies(path.join(root,'frontend/src/main.jsx'),root);
  for(const name of ['PlatformApp.jsx','Admin.jsx','AdminLessons.jsx','bank.js'])assert.ok([...deps].some(file=>file.endsWith(path.sep+name)),`Graph must cover lazy ${name}`);
});

test('the dependency boundary catches direct, lazy, reexported, CommonJS and URL asset edges', () => {
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'synaq-client-boundary-'));
  try{
    fs.mkdirSync(path.join(tmp,'frontend/src'),{recursive:true});fs.mkdirSync(path.join(tmp,'backend/data'),{recursive:true});
    fs.writeFileSync(path.join(tmp,'backend/data/private.json'),'[]');
    fs.writeFileSync(path.join(tmp,'frontend/src/bridge.js'),"export * from '../../backend/data/private.json';");
    const entry=path.join(tmp,'frontend/src/main.jsx');
    for(const source of [
      "import bank from '../../backend/data/private.json?raw';",
      "export * from './bridge.js';",
      "const load=()=>import('../../backend/data/private.json');",
      "const load=require('./bridge');",
      "const asset=new URL('../../backend/data/private.json',import.meta.url);",
    ]){
      fs.writeFileSync(entry,source);assert.throws(()=>clientDependencies(entry,tmp),/reaches server code\/data/,source);
    }
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
