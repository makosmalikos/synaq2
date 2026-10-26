// Offline triage only. This neither imports a bank nor publishes source content.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {editionHash} from './edition-review.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const hash = editionHash;
const hasVisual = q => Boolean(q.images?.length || q.svg?.length || /\[Image:|<img\b|<svg\b/i.test((q.statement || '') + ' ' + (q.statementHtml || '')));
const assetKey = src => {
  if (typeof src !== 'string') return null;
  try {
    const pathname = new URL(src, 'https://zerek.app').pathname;
    const at = pathname.indexOf('/questions/');
    return at < 0 ? pathname : pathname.slice(at);
  } catch { return src; }
};

// A heuristic queue label is deliberately not a claim about the exact topology.
// Every authored edition still needs a source-specific skill and drawing review.
export function visualFamily(statement, title = '') {
  const text = String(statement || '').normalize('NFKC').toLowerCase();
  const rules = [
    ['solid-net', /жайма|развертк|развёртк/],
    ['clock-hands', /сағат(?:тық|тың)?\s+тіл|минут(?:тық|тың)?\s+тіл|сағат.{0,25}бұрыш|циферблат|(?:кіші|үлкен)\s+тіл/],
    ['abacus-place-value', /есепшот|абак/],
    ['thermometer', /термометр/],
    ['venn-set-regions', /эйлер|венн|жиын/],
    ['figure-enumeration', /(?:неше|қанша|барлық).{0,65}(?:үшбұрыш|тіктөртбұрыш|шаршы(?!\s*(?:[сдмк]?м(?!\p{L})|метр|сантиметр|дециметр|миллиметр|километр)))|(?:үшбұрыш|тіктөртбұрыш|шаршы).{0,45}(?:саны|сана)/u],
    ['matchstick-construction', /шырпы|таяқша|спичк/],
    ['symmetry-transform', /симметри|оське қатысты|осіне қатысты|айналдыру|фигура.{0,30}бұру|бұрылу бұрыш|шағылдыр|параллель көшір/],
    ['coordinate-plane', /координаталық жазық|абсцисс|ординат|координаталар жүйе/],
    ['number-line-interval', /сан аралы|санаралық|аралықтардың.{0,30}(?:қиылыс|бірік)|координаталық (?:түзу|сәуле)/],
    ['pie-chart', /(?:дөңгелек|секторлық).{0,25}диаграм|диаграм.{0,25}(?:сектор|дөңгелек)/],
    ['line-chart', /график|сызықтық.{0,20}диаграм/],
    ['bar-chart', /баған|диаграм/],
    ['map-scale-route', /масштаб|карта/],
    ['data-table', /кесте/],
    ['stacked-cubes', /(?:текше|куб).{0,65}(?:неше|қанша|саны)|(?:неше|қанша).{0,65}(?:текше|куб)/],
    ['solid-measurement', /параллелепипед|көлем|бетінің аудан|бет ауданы/],
    ['angle-relations', /бұрыш|сәулелер/],
    ['circle-measurement', /шеңбер|дөңгелек(?!теу)/],
    ['shaded-parts', /боялған|боялмаған|көлеңкелен|бөлігі|бөлшек/],
    ['grid-measurement', /торкөз|тор көз|ұяшық/],
    ['polygon-measurement', /аудан|периметр|тікбұрыш|тіктөртбұрыш|үшбұрыш|шаршы/],
    ['ruler-segment', /сызғыш|кесінді|ұзындық/],
    ['visual-pattern', /заңдылық|сәйкестік|орнына|орнындағы|\? белгі/],
    ['illustrated-word-problem', /теңге|билет|сатыл|сатып|жолаушы|сағат|км|метр|жылдамдық/],
  ];
  for (const [family, re] of rules) if (re.test(text)) return {family, basis:'statement_heuristic'};
  if (/геометр|фигура/i.test(title)) return {family:'unclassified-geometry', basis:'title_fallback_requires_review'};
  return {family:'unclassified-visual', basis:'manual_review_required'};
}

export function buildVisualInventory() {
  const courseVectors = read('problems/sources/zerek/courses/vector-manifest.json').files;
  const collectionVectors = read('problems/sources/zerek/vector-manifest.json').files;
  const assets = [...courseVectors.map(v => ({...v, group:'courses'})), ...collectionVectors.map(v => ({...v,group:'collections'}))];
  const lookup = new Map(assets.map(v => [assetKey(v.src || v.sourceUrl),v]));
  const records = [], all = [];
  const add = (q, context) => {
    const row = {...context, sourceSha256:hash(q), visual:hasVisual(q)};
    all.push(row); if (!row.visual) return;
    const refs = (q.images || []).map(i => assetKey(typeof i === 'string' ? i : i.src)).filter(Boolean);
    const drawings = refs.map(key => lookup.get(key));
    const missing = refs.filter((_,i) => !drawings[i]);
    const existing = drawings.filter(Boolean);
    const reconstructionPath = !refs.length || missing.length ? 'missing_or_unlinked_source_figure'
      : existing.some(v => v.sourceAdapted || /adapted_from_source_solution/.test(v.method || '')) ? 'source_solution_editorial_reconstruction'
      : existing.every(v => /constructed/.test(v.method || '') && !/linework/.test(v.method || '')) ? 'reviewed_native_source_structure'
      : 'source_visual_transcription_required';
    records.push({...row, ...visualFamily(q.statement, context.title), reconstructionPath,
      sourceAssets:[...new Set(refs)], sourceVectorImages:[...new Set(existing.map(v=>v.image))], missingAssets:missing,
      sourceStatement:q.statement || '', sourceAnswer:q.sourceAnswer ?? null,
      authoringStatus:'not_rewritten', sourceTopologyReviewedForNewEdition:false});
  };
  const courseDir = 'problems/sources/zerek/courses';
  for (const name of fs.readdirSync(path.join(root, courseDir)).sort()) {
    if (!/^[456]-math-.*-level(?:1|2|3|test)\.json$/.test(name)) continue;
    const file = `${courseDir}/${name}`, data = read(file);
    if (data.status !== 'captured' || ![4,5,6].includes(data.grade)) continue;
    (data.questions || []).forEach((q,index) => add(q,{occurrenceId:`course:${name}#${index}`,group:'courses',
      sourceId:q.sourceContentId || q.id,sourceFile:file,sourceIndex:index,grade:data.grade,level:data.level,title:data.title}));
  }
  const catalog = read('problems/sources/zerek/catalog.json');
  for (const entry of catalog.collections) {
    const collectionId = entry.path.split('/').at(-1), file=`problems/sources/zerek/collections/${collectionId}.json`;
    const data=read(file), gradeText=(data.title || '')+' '+(entry.card || '');
    const gradeMatch=gradeText.match(/\b([1-9])\s*[-–]?\s*(?:сынып|класс)/i);
    const grade=gradeMatch ? Number(gradeMatch[1]) : null;
    (data.questions || []).forEach((q,index) => add(q,{occurrenceId:`collection:${collectionId}#${index}`,group:'collections',
      sourceId:q.sourceContentId || q.id || `zerek_${collectionId}_${String(q.number || index+1).padStart(2,'0')}`,
      sourceFile:file,sourceIndex:index,sourceNumber:q.number || index+1,grade,
      gradeScope:grade===null?'requires_individual_skill_review':grade>=4&&grade<=6?'explicit_4_6':'outside_explicit_4_6',
      title:data.title || entry.title,school:data.school || entry.school}));
  }
  const countBy = (fn,subset=records) => {
    const out={};for (const row of subset) {const k=String(fn(row));out[k]=(out[k]||0)+1;}return out;
  };
  const familySummary={};for(const row of records){
    const s=familySummary[row.family] ||= {occurrences:0,byGrade:{},byReconstructionPath:{},examples:[]};s.occurrences++;
    const g=row.grade??'unknown';s.byGrade[g]=(s.byGrade[g]||0)+1;
    s.byReconstructionPath[row.reconstructionPath]=(s.byReconstructionPath[row.reconstructionPath]||0)+1;
    if(s.examples.length<4)s.examples.push(row.occurrenceId);
  }
  const used=new Set(records.flatMap(r=>r.sourceAssets));
  return {schemaVersion:1,createdAt:'2026-10-23',scope:'All saved canonical 4–6 course occurrences and catalog collections, without network access.',
    policy:{sourceImages:'Archived visual evidence only; traced paths are never used as authored SYNAQ drawings.',
      familyLabels:'Heuristic queues, not reviewed model coverage. A source reference alone never marks a source occurrence rewritten.',
      unknownCollectionGrade:'Retained for individual skill review; a number after FEMO is never treated as a school grade.',
      sourceMethod:'A constructed source diagram can suggest a mathematical structure, but every new edition still requires new parameters, new prose, a new SVG and independent review.',
      noPublication:true},
    summary:{canonicalSourceOccurrences:all.length,visualSourceOccurrences:records.length,
      courseSourceOccurrences:all.filter(r=>r.group==='courses').length,collectionSourceOccurrences:all.filter(r=>r.group==='collections').length,
      courseVectorAssets:courseVectors.length,collectionVectorAssets:collectionVectors.length,
      uniqueArchivedVectorAssets:assets.length,usedNormalizedImageSources:used.size,
      sourceAssetsNotLinkedToCanonicalVisualRecords:assets.filter(a=>!used.has(assetKey(a.src||a.sourceUrl))).length,
      visualByGroup:countBy(r=>r.group),visualByGrade:countBy(r=>r.grade??'unknown'),
      courseVisualByGrade:countBy(r=>r.grade,records.filter(r=>r.group==='courses')),
      byReconstructionPath:countBy(r=>r.reconstructionPath),newVerifiedEditionsInThisInventory:0},
    families:familySummary,records,
    assets:assets.map(a=>({group:a.group,sourceAsset:assetKey(a.src||a.sourceUrl),archivedVector:a.image,sourceVectorMethod:a.method,
      sourceAdapted:!!a.sourceAdapted,canReuseSourcePathsAsOwnDrawing:false,linkedOccurrenceIds:records.filter(r=>r.sourceAssets.includes(assetKey(a.src||a.sourceUrl))).map(r=>r.occurrenceId)}))};
}

if(process.argv[1] === fileURLToPath(import.meta.url)) {
  const inventory=buildVisualInventory();
  if(process.argv.includes('--write')){
    const file=path.join(root,'problems/editorial/batches/visual-inventory.json');
    fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(inventory,null,2)+'\n');
  }
  console.log(JSON.stringify({summary:inventory.summary,families:inventory.families},null,2));
}
