const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const plans = require('../backend/lib/plans');

const source = fs.readFileSync(`${__dirname}/../api/mock-session.js`, 'utf8');
const secretQuestions = [
  { id: 'q1', num: 1, section: 1, school: 'РФМШ', topic: 'num', statement: '2 + 2?', answer: '4', solution: '2 + 2 = 4' },
  { id: 'q2', num: 2, section: 1, school: 'РФМШ', topic: 'num', statement: '3 + 3?', answer: '6', solution: '3 + 3 = 6' },
];

function fixture({ pro = false, paid = false, realBank = false } = {}) {
  const docs = new Map([
    ['childIndex/kid', { parentUid: 'parent' }],
    ['families/parent', { plan: pro ? 'pro' : 'free' }],
    ['families/parent/children/kid', { code: 'bala' }],
    ...(paid ? [['weeklyMockPasses/pass_parent_2026-09-28', { paid: true, parentUid: 'parent', weekKey: '2026-09-28' }]] : []),
  ]);
  let serial = Promise.resolve();
  const snapshot = (path) => ({ exists: docs.has(path), data: () => docs.get(path) });
  const write = (path, value, options) => docs.set(path, options?.merge ? { ...docs.get(path), ...value } : value);
  const doc = (path) => ({ path, get: async () => snapshot(path),
    collection: (name) => collection(`${path}/${name}`) });
  const collection = (path) => ({ doc: (id) => doc(`${path}/${id}`), get: async () => ({ docs: [] }) });
  const db = { collection, runTransaction(callback) {
    const pending = serial.then(async () => {
      const writes = [];
      const result = await callback({
        get: async (ref) => snapshot(ref.path),
        set: (ref, value, options) => writes.push(['set', ref.path, value, options]),
        create: (ref, value) => {
          if (docs.has(ref.path)) throw Object.assign(Error('exists'), { code: 6 });
          writes.push(['set', ref.path, value]);
        },
        update: (ref, value) => {
          if (!docs.has(ref.path)) throw Error('missing');
          writes.push(['set', ref.path, { ...docs.get(ref.path), ...value }]);
        },
      });
      for (const [, path, value, options] of writes) write(path, value, options);
      return result;
    });
    serial = pending.catch(() => {});
    return pending;
  } };
  const auth = { async verifyIdToken(token, revoked) {
    assert.equal(revoked, true);
    if (token === 'kid') return { uid: 'kid', email: 'bala@synaq.kids' };
    if (token === 'parent') return { uid: 'parent', email: 'parent@example.test' };
    throw Object.assign(Error('expired'), { code: 'auth/id-token-expired' });
  } };
  const mockBank = {
    mockCatalog: async () => [{ code: 'РФМШ', ready: true, count: 2, targetCount: 2, timeLimitMin: 1 }],
    createWeeklyMock: async (_db, school, weekKey) => school === 'РФМШ' ? { school, weekKey, title: 'Пробник', timeLimitMin: 1,
      sections: 1, shortened: false, targetCount: 2, questions: secretQuestions } : null,
    createPreviewMock: async (_db, school) => school === 'РФМШ' ? { school, title: 'РФМШ · Бесплатный ознакомительный пробник', timeLimitMin: 1, sections: 1, shortened: false, targetCount: 2, questions: secretQuestions } : null,
    restoreMock: async (_db, session) => ({ id: session.attemptId, school: session.school, title: session.title,
      timeLimitMin: session.timeLimitMin, sections: session.sections,
      questions: session.questionRefs.map((ref) => ({ ...secretQuestions.find((question) => question.id === ref.id), ...ref })) }),
    gradeMock: async (_db, session, answers) => ({ score: secretQuestions.filter((question) => answers[question.num] === question.answer).length,
      gradable: 2, total: 2, review: secretQuestions.map((question) => ({ qid: question.id, num: question.num,
        statement: question.statement, your: answers[question.num] ?? null, answer: question.answer,
        solution: question.solution, correct: answers[question.num] === question.answer })) }),
    publicMock: (variant) => ({ ...variant, questions: variant.questions.map(({ answer, solution, ...question }) => question) }),
  };
  const context = { module: { exports: {} }, Date, console: { error() {} }, process,
    require(name) {
      if (name === '../shared/nis-exam.mjs') return require('../shared/nis-exam.mjs');
      if (name === '../backend/lib/firebase-admin') return { getAdmin: () => ({ db, auth }) };
      if (name === '../backend/lib/plans') return plans;
      if (name === '../backend/lib/question-access') return require('../backend/lib/question-access');
      if (name === '../backend/lib/mock-bank') return realBank ? require('../backend/lib/mock-bank') : mockBank;
      if (name === '../backend/lib/weekly-mock') return { PRICE_KZT: 2500,
        weeklyWindow: () => ({ weekKey: '2026-09-28', startsAt: 1, endsAt: 2 }),
        passId: (parentUid, weekKey) => `pass_${parentUid}_${weekKey}` };
      throw Error(`unexpected ${name}`);
    } };
  vm.runInNewContext(source, context);
  async function invoke(body, token = 'kid') {
    const req = { method: 'POST', body, headers: { authorization: token ? `Bearer ${token}` : '' } };
    const res = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; },
      json(value) { this.body = JSON.parse(JSON.stringify(value)); return this; } };
    await context.module.exports(req, res);
    return { status: res.statusCode, body: res.body };
  }
  return { docs, invoke };
}

test('server creates an answer-free mock session for the linked child', async () => {
  const f = fixture({ paid: true });
  const catalog = await f.invoke({ action: 'catalog' });
  assert.equal(catalog.status, 200);
  const started = await f.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', excludeQuestionIds: [] });
  assert.equal(started.status, 200);
  assert.equal(started.body.diagnostic, false);
  assert.equal(started.body.weekKey, '2026-09-28');
  assert.equal(started.body.test.questions.length, 2);
  assert.equal(Object.hasOwn(started.body.test.questions[0], 'answer'), false);
  assert.equal(Object.hasOwn(started.body.test.questions[0], 'solution'), false);
  const stored = f.docs.get('mockSessions/kid_attempt_12345678');
  assert.deepEqual(stored.questionRefs.map((question) => Object.keys(question).sort()), [
    ['id', 'num', 'section', 'subject'], ['id', 'num', 'section', 'subject'],
  ]);
});

test('server grades and persists a verified result exactly once', async () => {
  const f = fixture({ paid: true });
  await f.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', excludeQuestionIds: [] });
  const first = await f.invoke({ action: 'submit', id: 'attempt_12345678', answers: { 1: '4', 2: '0' }, score: 99 });
  assert.equal(first.status, 200);
  assert.equal(first.body.result.score, 1);
  assert.equal(first.body.result.verified, true);
  assert.equal(f.docs.get('results/kid/mocks/attempt_12345678').score, 1);
  assert.equal(f.docs.get('results/kid/mocks/attempt_12345678').weekKey, '2026-09-28');
  const replay = await f.invoke({ action: 'submit', id: 'attempt_12345678', answers: { 1: '0', 2: '6' } });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.result.score, 1);
  assert.equal(replay.body.result.review[0].your, '4');
});

test('completed resume and duplicate submit redact only withdrawn or paid mock review snapshots', async () => {
  const f=fixture({paid:true}),id='attempt_redacted1';
  await f.invoke({action:'start',id,school:'РФМШ',excludeQuestionIds:[]});
  await f.invoke({action:'submit',id,answers:{1:'4',2:'6'}});
  const stored=f.docs.get(`results/kid/mocks/${id}`);
  const first=JSON.stringify(stored.review[0]);
  stored.review.push({qid:'zerek_crypt_01',statement:'withdrawn secret',answer:'hidden',solution:'private',image:'/old.svg',options:['hidden','x'],your:'x',num:3,correct:false});
  for(const body of [{action:'resume',id},{action:'submit',id,answers:{1:'4',2:'6'}}]){
    const response=await f.invoke(body);assert.equal(response.status,200);
    assert.equal(JSON.stringify(response.body.result.review[0]),first);
    assert.equal(response.body.result.score,2);
    const closed=response.body.result.review[2];assert.equal(closed.unavailable,true);
    for(const field of ['statement','answer','solution','image','options','your'])assert.equal(Object.hasOwn(closed,field),false,field);
  }
});

test('weekly mock requires Pro or the current paid weekly pass', async () => {
  const free = fixture();
  assert.equal((await free.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', excludeQuestionIds: [] })).status, 402);
  const paid = fixture({ paid: true });
  assert.equal((await paid.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', excludeQuestionIds: [] })).status, 200);
  const pro = fixture({ pro: true });
  assert.equal((await pro.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', excludeQuestionIds: [] })).body.diagnostic, false);
  assert.equal((await pro.invoke({ action: 'start', id: 'attempt_87654321', school: 'РФМШ', excludeQuestionIds: [] })).status, 200);
});

test('parents, forged sessions and malformed answers cannot submit a mock', async () => {
  const f = fixture({ paid: true });
  assert.equal((await f.invoke({ action: 'catalog' }, 'parent')).status, 403);
  assert.equal((await f.invoke({ action: 'resume', id: 'missing_12345678' })).status, 404);
  await f.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', excludeQuestionIds: [] });
  assert.equal((await f.invoke({ action: 'submit', id: 'attempt_12345678', answers: { 1: { correct: true } } })).status, 400);
});


test('a previous week pass does not unlock the current week and stale starts refresh', async () => {
  const f = fixture();
  f.docs.set('weeklyMockPasses/pass_parent_2026-09-21', { paid: true });
  assert.equal((await f.invoke({ action: 'catalog' })).body.weekly.access, false);
  assert.equal((await f.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', weekKey: '2026-09-21', excludeQuestionIds: [] })).status, 409);
});

test('sessions started before weekly rollout can still save a result', async () => {
  const f = fixture({ pro: true });
  await f.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', excludeQuestionIds: [] });
  delete f.docs.get('mockSessions/kid_attempt_12345678').weekKey;
  const response = await f.invoke({ action: 'submit', id: 'attempt_12345678', answers: { 1: '4' } });
  assert.equal(response.status, 200);
  assert.equal(f.docs.get('results/kid/mocks/attempt_12345678').weekKey, null);
});

test('mock start/resume expose server time and expired start retries cannot reopen old sessions', async () => {
 const f=fixture({paid:true});
 const request={action:'start',id:'attempt_clock_1234',school:'РФМШ',excludeQuestionIds:[]};
 const started=await f.invoke(request);assert.equal(started.status,200);
 assert.equal(typeof started.body.serverNow,'number');assert.ok(started.body.serverNow>=started.body.startedAt);
 const resumed=await f.invoke({action:'resume',id:request.id});assert.equal(typeof resumed.body.serverNow,'number');
 const stored=f.docs.get('mockSessions/kid_'+request.id);stored.expiresAt=Date.now()-1;
 assert.equal((await f.invoke(request)).status,410);
});

test('Free preview starts without a purchase, restores, grades and does not unlock weekly mocks', async () => {
  const f = fixture();
  const catalog = await f.invoke({ action: 'catalog' });
  assert.deepEqual(catalog.body.previews.map(s => s.code), ['РФМШ']);
  assert.equal(catalog.body.weekly.access, false);
  const request = { action: 'start', id: 'free_preview_attempt', school: 'РФМШ', preview: true, excludeQuestionIds: [] };
  const start = await f.invoke(request);
  assert.equal(start.status, 200); assert.equal(start.body.preview, true); assert.equal(start.body.weekKey, null);
  assert.match(start.body.test.title, /Бесплатный/);
  assert.equal(start.body.test.questions.some(q => q.answer || q.solution), false);
  assert.equal((await f.invoke({ action: 'resume', id: request.id })).body.preview, true);
  assert.equal((await f.invoke({ ...request, preview: false })).status, 409, 'Cannot reclassify a stored attempt');
  assert.equal((await f.invoke({ ...request, id: 'paid_weekly_attempt', preview: false })).status, 402);
  const result = await f.invoke({ action: 'submit', id: request.id, answers: { 1: '4', 2: '6' } });
  assert.equal(result.status, 200); assert.equal(result.body.result.score, 2);
  assert.equal(result.body.result.preview, true); assert.equal(result.body.result.weekKey, null);
  assert.equal((await f.invoke({ action: 'resume', id: request.id })).body.completed, true);
  assert.equal([...f.docs.keys()].some(key => key.startsWith('weeklyMockPasses/')), false);
});

test('preview cannot select NIS, spoof its flag, avoid auth or bypass start limits', async () => {
  const f = fixture(), request = { action: 'start', id: 'free_preview_test', school: 'РФМШ', preview: true, excludeQuestionIds: [] };
  assert.equal((await f.invoke({ ...request, school: 'НИШ' })).status, 404);
  assert.equal((await f.invoke({ ...request, preview: 'true' })).status, 400);
  assert.equal((await f.invoke(request, 'parent')).status, 403);
  assert.equal((await f.invoke(request, null)).status, 401);
  for (let i = 0; i < 3; i++) assert.equal((await f.invoke({ ...request, id: `free_preview_limit_${i}` })).status, 200);
  assert.equal((await f.invoke({ ...request, id: 'free_preview_over_limit' })).status, 429);
});

test('real RFMSH format and weight survive server start, resume, submit and completed resume', async () => {
  const f=fixture({realBank:true}),id='real_rfmsh_format';
  const start=await f.invoke({action:'start',id,school:'РФМШ',preview:true,excludeQuestionIds:[],scoring:'forged',timeLimitMin:999});
  assert.equal(start.status,200);assert.equal(start.body.test.scoring,'rfmsh');
  assert.equal(start.body.test.maxPoints,150);
  assert.equal(start.body.deadline-start.body.startedAt,120*60000);
  const stored=f.docs.get(`mockSessions/kid_${id}`);
  assert.equal(stored.scoring,'rfmsh');assert.equal(stored.examFormat,'rfmsh-7-2026');
  assert.deepEqual(stored.questionRefs.map(q=>q.examLevel),Array(10).fill('A').concat(Array(10).fill('B'),Array(10).fill('C')));
  const resumed=await f.invoke({action:'resume',id});assert.equal(resumed.body.test.questions[20].examPoints,7);
  assert.ok(resumed.body.test.questions.every(q=>!q.options&&!Object.hasOwn(q,'answer')));
  const {POOL}=await import('../frontend/src/bank.js');
  const answers=Object.fromEntries(stored.questionRefs.filter(q=>[1,11,21].includes(q.num)).map(q=>[q.num,String(POOL.find(item=>item.id===q.id).answer)]));
  const submitted=await f.invoke({action:'submit',id,answers,points:150,score:30});
  assert.equal(submitted.status,200);assert.equal(submitted.body.result.points,15);assert.equal(submitted.body.result.maxPoints,150);
  assert.equal(submitted.body.result.score,3);assert.equal(submitted.body.result.scoring,'rfmsh');
  const again=await f.invoke({action:'resume',id});assert.equal(again.body.result.points,15);
  assert.equal(again.body.result.review[20].examLevel,'C');
});

test('NIS server locks previous blocks, separates day two and grades only its saved snapshots', async () => {
  const f=fixture({pro:true,realBank:true}), id='nis_phases_123456';
  let response=await f.invoke({action:'start',id,school:'НИШ',excludeQuestionIds:[]});
  assert.equal(response.status,200);assert.equal(response.body.test.examFormat,'nis-sections-2026-v1');
  assert.equal(response.body.nis.phase,0);assert.equal(response.body.deadline-response.body.startedAt,3600000);
  assert.equal((await f.invoke({action:'submit',id,answers:{}})).status,409);
  assert.equal((await f.invoke({action:'phase',id,op:'save',phase:1,revision:1,answers:{'41':'А'}})).status,409);
  assert.equal((await f.invoke({action:'phase',id,op:'save',phase:0,revision:1,answers:{'180':'injected'}})).status,409);
  response=await f.invoke({action:'phase',id,op:'advance',phase:0,revision:1,answers:{'1':'draft'}});
  assert.equal(response.status,200);assert.equal(response.body.nis.phase,1);
  response=await f.invoke({action:'phase',id,op:'save',phase:0,revision:9,answers:{'1':'changed'}});
  assert.equal(response.body.nis.answers['1'],'draft');
  await f.invoke({action:'phase',id,op:'advance',phase:1,revision:1,answers:{}});
  response=await f.invoke({action:'phase',id,op:'advance',phase:2,revision:1,answers:{}});
  assert.equal(response.body.nis.waiting,true);assert.equal(response.body.nis.deadline,null);
  const resumed=await f.invoke({action:'resume',id});assert.equal(resumed.body.nis.waiting,true);
  assert.equal((await f.invoke({action:'submit',id,answers:{}})).status,409);
  response=await f.invoke({action:'phase',id,op:'begin-day2'});const end=response.body.deadline;
  assert.ok(end-Date.now()>7199000);
  assert.equal((await f.invoke({action:'phase',id,op:'begin-day2'})).body.deadline,end);
  response=await f.invoke({action:'phase',id,op:'advance',phase:3,revision:1,answers:{'121':'saved language'}});
  assert.equal(response.body.nis.ready,true);
  const done=await f.invoke({action:'submit',id,answers:{'1':'forged','121':'forged'}});
  assert.equal(done.status,200);assert.equal(done.body.result.review[0].your,'draft');
  assert.equal(done.body.result.review[120].your,'saved language');
  const replay=await f.invoke({action:'submit',id,answers:{}});assert.deepEqual(replay.body,done.body);
  assert.equal((await f.invoke({action:'phase',id,op:'begin-day2'})).status,409);
});

test('NIS resume reconciles elapsed first-day blocks without starting the second-day timer', async()=>{
  const f=fixture({pro:true,realBank:true}),id='nis_offline_12345';
  await f.invoke({action:'start',id,school:'НИШ',excludeQuestionIds:[]});
  const key=`mockSessions/kid_${id}`,session=f.docs.get(key),past=Date.now()-7200001;
  session.nis={...session.nis,phaseStartedAt:past,deadline:past+3600000,answers:{'1':'saved'}};
  const resumed=await f.invoke({action:'resume',id});assert.equal(resumed.status,200);
  assert.equal(resumed.body.nis.phase,3);assert.equal(resumed.body.nis.waiting,true);
  assert.equal(resumed.body.answers['1'],'saved');assert.equal(resumed.body.nis.elapsedSec,7200);
});
