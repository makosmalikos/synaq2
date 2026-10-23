import fs from 'node:fs';
import {courseTaskTopic} from './zerek-course-topic.mjs';
import {courseAdaptationMetadata} from './zerek-course-provenance.mjs';
import {POOL} from '../frontend/src/bank.js';
import {zerekReviewedQuestions} from '../frontend/src/zerekReviewedQuestions.js';
import {zerekImportedQuestions} from '../frontend/src/zerekImportedQuestions.js';
import {zerekCourseQuestions} from '../frontend/src/zerekCourseQuestions.js';
const base='problems/sources/zerek/courses/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const audit=read(base+'expansion-audit.json');
const normalize=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').replaceAll('−','-').toLowerCase();
const signature=q=>JSON.stringify([normalize(q.statement),(q.options||[]).map(normalize).sort(),q.image||'']);
// Original editions are now an offline archive. They still participate in source
// deduplication even though none of them is imported into the client/active POOL.
const seen=new Map([...POOL,...zerekReviewedQuestions,...zerekImportedQuestions,...zerekCourseQuestions].map(q=>[signature(q),q.id]));
const tasks=[],records=[];

for(const r of audit.records){
 if(r.status!=='source_review_ready'){records.push({...r,prepared:undefined});continue;}
 if(r.images?.length>1)throw Error('Multiple-diagram layout needs review '+r.sourceContentId);
 const q={id:'zerek_course_extra_'+r.sourceContentId,school:'Математика',subject:'math',lang:'kk',grade:r.grade,topic:courseTaskTopic(r.title,r.prepared.statement),difficulty:r.level==='test'?'medium':['','basic','medium','hard'][r.level],practiceOnly:true,...r.prepared,...courseAdaptationMetadata(r),source:'Zerek · '+r.title,sourceUrl:r.sourceUrl,sourceContentId:r.sourceContentId};
 if(!q.options)delete q.options;
 if(r.images?.length)q.image=r.images[0];
 if(q.image&&!fs.existsSync('frontend/public'+q.image))throw Error('Missing local figure');
 const key=signature(q);
 if(seen.has(key)){records.push({...r,prepared:undefined,status:'duplicate',duplicateOf:seen.get(key)});continue;}
 seen.set(key,q.id);tasks.push(q);records.push({...r,prepared:undefined,status:'published_local',id:q.id});
}
fs.writeFileSync('frontend/src/zerekCourseExpansionQuestions.js','// OFFLINE SOURCE ARCHIVE: not imported into the active platform.\n// Reviewed source keys/diagrams: problems/sources/zerek/courses/expansion-dispositions.json.\n// Only separately authored, verified editions may enter the server-only Standard bank.\nexport const zerekCourseExpansionQuestions = '+JSON.stringify(tasks,null,2)+';\n');
const counts=rows=>rows.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{});
const report={source:'https://zerek.app/courses',grades:[4,5,6],excludedGrades:[7],deployment:'offline_archive_pending_editorial_adaptation',permission:'Author reuse permission and course answer submissions explicitly authorized by user.',sourceReview:'Source key and detailed explanation retained; exact supported relations checked. Independent target computation recorded only where implemented. This is not second-teacher certification.',summary:{...audit.summary,status:counts(records),publishedLocal:tasks.length,preparedLocal:tasks.length,activeOriginalTasks:0,activeBank:POOL.length},records};
fs.writeFileSync(base+'expansion-dispositions.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('problems/reviews/zerek-course-expansion.json',JSON.stringify({...report,records:undefined,references:{perQuestion:base+'expansion-dispositions.json',tasks:'frontend/src/zerekCourseExpansionQuestions.js'}},null,2)+'\n');
console.log(JSON.stringify(report.summary,null,2));
