// Publish only the completed, reviewed batch; source course progress stays separate.
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const base='problems/sources/zerek/courses/';
const tasks=read('output/zerek-courses/ready.json');
const review=read(base+'review-dispositions.json');
const vectors=read(base+'vector-manifest.json');
if(review.summary.unresolved!==0||review.summary.ready!==tasks.length)throw Error('Incomplete review');
if(new Set(tasks.map(q=>q.id)).size!==tasks.length)throw Error('Duplicate IDs');
for(const q of tasks){
 if(![4,5,6].includes(q.grade)||!q.practiceOnly)throw Error('Outside authorized course scope');
 if(!review.records.some(r=>r.id===q.id&&r.status==='ready'))throw Error('Missing review '+q.id);
 if(!q.answer||!q.solution||!q.statement||/[\\$]/.test([q.statement,q.answer,q.solution,...(q.options||[])].join(' ')))throw Error('Incomplete presentation '+q.id);
 if(q.options&&q.options.filter(a=>a===q.answer).length!==1)throw Error('Invalid key '+q.id);
 if(q.image){
  const v=vectors.files.find(v=>v.image===q.image);
  const bytes=fs.readFileSync('frontend/public'+q.image);
  if(v?.visualReview!=='verified'||v.sha256!==crypto.createHash('sha256').update(bytes).digest('hex'))throw Error('Unreviewed diagram '+q.image);
 }
}
fs.writeFileSync('frontend/src/zerekCourseQuestions.js',
 '// Reviewed base-level Zerek course exercises, grades 4–6. All are practice-only.\n'+
 '// Permission, proof records and source links: problems/reviews/zerek-courses-2026-10-22.json.\n'+
 'export const zerekCourseQuestions = '+JSON.stringify(tasks,null,2)+';\n');
const catalog=read('problems/sources/zerek/course-topics-4-6.json');
const report={date:'2026-10-22',source:'https://zerek.app/courses',
 permission:'User confirmed permission from the author and explicitly authorized answer submissions in the working account for all grade 4–6 courses. Grade 7 excluded by user.',
 scope:{grades:[4,5,6],excludedGrades:[7],capturedLevel:1,selectedTopics:11,catalogTopics:catalog.courses.reduce((n,c)=>n+c.topics.length,0),completeCourses:false,practiceOnly:true},
 summary:review.summary,
 review:['Every answer checked against a condition-derived arithmetic model, symbolic relation or documented conceptual/diagram review. This is agent review, not a second teacher’s certification.',
 '1427 supported formula presentations checked for unchanged mathematical value; 578 explicit arithmetic equalities in solutions checked.',
 'Four explanations contain deliberate wrong-answer examples or contradictions; reviewed in context and retained.',
 'Two remainder-division explanations rewritten as exact dividend = divisor × quotient + remainder equalities.',
 '24 diagrams constructed as native SVG and visually compared. One unavailable abacus source image reconstructed from its complete written condition.',
 'Exact duplicate screening uses complete statements, choices and diagram references; this is not a semantic uniqueness count.'],
 references:{tasks:'frontend/src/zerekCourseQuestions.js',proofs:base+'review-dispositions.json',source:base,vectors:base+'vector-manifest.json',model:'scripts/review-zerek-courses.py'},
 remaining:'160 other topic paths in the grade 4–6 catalog, plus higher levels/tests within the selected topics; additional enrolment-gated trainers not imported.'};
fs.writeFileSync('problems/reviews/zerek-courses-2026-10-22.json',JSON.stringify(report,null,2)+'\n');
const inventory=read('problems/sources/zerek/course-inventory.json');
inventory.status='partially_imported_grades_4_6';
inventory.importScope={grades:[4,5,6],excludedGrades:[7],reason:'User: 7 класс не нужен',topics:11,questions:tasks.length,level:1,report:'problems/reviews/zerek-courses-2026-10-22.json'};
fs.writeFileSync('problems/sources/zerek/course-inventory.json',JSON.stringify(inventory,null,2)+'\n');
console.log(`Published ${tasks.length} local course tasks; grade 7 excluded.`);
