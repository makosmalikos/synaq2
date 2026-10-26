/** Author-side finite/printed-given checks; these are not independent editorial approval. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './grade4-time-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-time-wave17.json',import.meta.url))).editions;
const expected=['5 сағ 11 мин','8 сағ 40 мин','35 мин','22 мин 55 с','тәуліктің үштен бірі = 8 сағ','630','270','240','10 сағ 35 мин','17 апта 4 тәулік','20','20','17 мен 18 тәуліктің арасында','6:00','87','53','6 сағ 50 мин','15','жұма','23 сағ 10 мин уақытынан келесі күнгі 2 сағ 5 мин уақытына дейін','23 мин 40 с','22 сағ 20 мин','40','дүйсенбі'];
const count=s=>Number(s.replaceAll(' ','')),words={'бір':1,'екі':2,'үш':3,'төрт':4,'бес':5,'алты':6,'жеті':7,'сегіз':8,'тоғыз':9,'он':10,'он бір':11,'он екі':12,'он бес':15,'жиырма':20},week=['дүйсенбі','сейсенбі','сәрсенбі','бейсенбі','жұма','сенбі','жексенбі'];
const take=(re,s)=>{const m=re.exec(s);assert(m,[re,s]);return m;};
const denominator=s=>/жарты/.test(s)?2:/үштен/.test(s)?3:/төрттен/.test(s)?4:/бестен/.test(s)?5:assert.fail('Unknown printed fraction');
function hm(s){const m=take(/^(\d+) сағ(?: (\d+) мин)?$/,s);return +m[1]*60 + +(m[2]||0);}
function ms(s){const m=take(/^(\d+) мин(?: (\d+) с)?$/,s);return +m[1]*60 + +(m[2]||0);}
function before(s,evening=false){const m=take(/«([^»]+) минутсыз ([^»]+)»/,s),minus=words[m[1]],next=words[m[2]];assert(minus&&next);return (next+(evening?12:0))*60-minus;}
let domains=0,weekdayStarts=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement,k=r.modelId.replace('grade4-time-','');assert.equal(r.answer,expected[i]);assert.equal(verifyEdition(r).answer,expected[i]);let answer;
 switch(k){
 case 'minutes-to-hours':{const total=+take(/^(\d+) минутты/,s)[1];const matches=r.options.filter(o=>hm(o)===total);assert.deepEqual(matches,[r.answer]);break;}
 case 'seconds-to-minutes':{const total=count(take(/^([\d ]+) секундты/,s)[1]);assert.deepEqual(r.options.filter(o=>ms(o)===total),[r.answer]);break;}
 case 'spoken-time-before':{assert.deepEqual(r.options.filter(o=>hm(o)===before(s)),[r.answer]);break;}
 case 'greatest-duration':{const values=r.options.map(o=>o.startsWith('сағаттың')?3600/denominator(o):o.endsWith(' с')?count(o.slice(0,-2)):count(o.slice(0,-4))*60),largest=Math.max(...values);assert.equal(values.filter(v=>v===largest).length,1);assert.equal(r.options[values.indexOf(largest)],r.answer);break;}
 case 'correct-fraction-equality':{const truths=r.options.filter(o=>{const [left,right]=o.split(' = '),d=denominator(left);const whole=left.startsWith('тәуліктің')?24:left.startsWith('жылдың')?12:left.startsWith('сағаттың')?60:left.startsWith('ғасырдың')?100:assert.fail(left);return whole/d===Number(right.split(' ')[0]);});assert.deepEqual(truths,[r.answer]);break;}
 case 'fraction-complement':{const total=+take(/Мектептегі (\d+) оқушының/,s)[1],d=denominator(s);let left=0;for(let a=1;a<=total;a++)if(a% d!==0)left++;assert.equal(left,+r.answer);break;}
 case 'reduce-by-fraction':{const total=+take(/^(\d+) санын/,s)[1],d=denominator(s);answer=total*(d-1)/d;assert.equal(String(answer),r.answer);break;}
 case 'weekly-session-duration':{const m=take(/аптасына (\d+) рет[\s\S]*?Әр жаттығу (\d+) сағ (\d+) мин/,s);let total=0;for(let n=0;n<+m[1];n++)total+=+m[2]*60 + +m[3];assert.equal(String(total),r.answer);break;}
 case 'spoken-lesson-finish':{const start=before(s),duration=+take(/Сабақ (\d+) минут жүрді/,s)[1];assert.deepEqual(r.options.filter(o=>hm(o)===start+duration),[r.answer]);break;}
 case 'days-to-weeks':{const total=+take(/^(\d+) тәулікті/,s)[1];const parse=o=>{const m=take(/^(\d+) апта(?: (\d+) тәулік)?$/,o);return +m[1]*7 + +(m[2]||0);};assert.deepEqual(r.options.filter(o=>parse(o)===total),[r.answer]);break;}
 case 'age-century-inverse':{const multiplier=+take(/Жасымның (\d+) есесіне/,s)[1],part=100/denominator(s),hits=[];for(let age=1;age<=100;age++)if(age*multiplier+part===100)hits.push(age);assert.deepEqual(hits,[+r.answer]);break;}
 case 'age-sum-century-fraction':{const multiple=+take(/бірінен (\d+) есе/,s)[1],ratio=+take(/жасынан (\d+) есе/,s)[1],sum=100/denominator(s)*multiple,hits=[];for(let child=1;child<=100;child++)for(let grand=child+1;grand<=100;grand++)if(grand===ratio*child&&grand+child===sum)hits.push(child);assert.deepEqual(hits,[+r.answer]);break;}
 case 'large-seconds-interval':{const total=count(take(/^([\d ]+) секунд/,s)[1]);const accepted=r.options.filter(o=>{const m=take(/^(\d+) мен (\d+) (тәуліктің|сағаттың|аптаның) арасында$/,o),unit=m[3]==='тәуліктің'?24*60*60:m[3]==='сағаттың'?60*60:7*24*60*60;return +m[1]*unit<total&&total<+m[2]*unit;});assert.deepEqual(accepted,[r.answer]);break;}
 case 'elapsed-remaining-fraction':{const d=denominator(s),hits=[];for(let minute=0;minute<1440;minute++)if(minute*d===1440-minute)hits.push(minute);assert.equal(hits.length,1);assert.deepEqual(r.options.filter(o=>+o.split(':')[0]*60===hits[0]),[r.answer]);break;}
 case 'concert-with-intermissions':{const m=take(/Концертте (\d+) күйдің әрқайсысы (\d+) минуттан, тағы (\d+) күйдің әрқайсысы (\d+) минуттан[\s\S]*?хор (\d+) ән[\s\S]*?арасында (\d+) минут/,s);const [a,da,b,db,c,gap]=m.slice(1).map(Number),d=denominator(s),pieces=[...Array(a).fill('first'),...Array(b).fill('second'),...Array(c).fill('choir')];const gaps=pieces.slice(1).map((_,i)=>[i,i+1]);assert.equal(gaps.length,pieces.length-1);assert.equal(String(a*da+b*db+60/d+gaps.length*gap),r.answer);break;}
 case 'maximum-weekday-count':{const m=take(/Ұзақтығы (\d+) тәулік болатын жылда ([а-яәіңғүұқөһ]+) күндерінің/,s),days=+m[1],target=week.indexOf(m[2]);assert(target>=0);const totals=[];for(let start=0;start<7;start++){let n=0;for(let day=0;day<days;day++)if((start+day)%7===target)n++;totals.push(n);weekdayStarts++;}assert.equal(String(Math.max(...totals)),r.answer);assert.equal(Math.min(...totals),52);break;}
 case 'overnight-spoken-duration':{const start=before(s,true),word=take(/түнгі «([^»]+) жарымда»/,s)[1],end=words[word]*60+30+1440;assert.deepEqual(r.options.filter(o=>hm(o)===end-start),[r.answer]);break;}
 case 'slow-clock-delay':{const m=take(/әр (\d+) сағат өткенде (\d+) минутқа/,s),period=+m[1],lost=+m[2],target=60/denominator(s);let hour=0,delay=0;while(delay<target){hour+=period;delay+=lost;}assert.equal(delay,target);assert.equal(String(hour/24),r.answer);break;}
 case 'last-day-weekday':{const m=take(/^(\d+) тәуліктен тұратын жылдың 1 қаңтары — ([а-яәіңғүұқөһ]+)\./,s),days=+m[1];let weekday=week.indexOf(m[2]);assert(weekday>=0);for(let day=2;day<=days;day++)weekday=(weekday+1)%7;assert.equal(week[weekday],r.answer);break;}
 case 'greatest-clock-interval':{const totals=r.options.map(o=>{
  if(o.includes('келесі күнгі')){const [a,b]=o.split(' уақытынан келесі күнгі ');return hm(b.replace(' уақытына дейін',''))+1440-hm(a);}
  if(o.startsWith('«')){const start=before(o),end=words[take(/«([^»]+) жарымға»/,o)[1]]*60+30;return end-start;}
  if(o.includes('ширек өткен')){const start=+take(/сағат (\d+)-ден/,o)[1]*60+15;return before(o)-start;}
  const [a,b]=o.split(' уақытынан ');return hm(b.replace(' уақытына дейін',''))-hm(a);
 });assert.deepEqual(totals,[175,165,150,170]);const max=Math.max(...totals);assert.equal(totals.filter(v=>v===max).length,1);assert.equal(r.options[totals.indexOf(max)],r.answer);break;}
 case 'spoken-evening-finish':{const start=before(s,true),m=take(/да, (\d+) сағ (\d+) мин созылды/,s),end=start+ +m[1]*60 + +m[2];assert.deepEqual(r.options.filter(o=>hm(o)===end),[r.answer]);break;}
 case 'age-half-plus-century':{const d=denominator(s.replace('жартысына','')),part=100/d,hits=[];for(let age=1;age<=100;age++)if(age/2+part===age)hits.push(age);assert.deepEqual(hits,[+r.answer]);break;}
 case 'first-march-weekday':{const m=take(/1 қаңтар — ([а-яәіңғүұқөһ]+)\./,s),feb=+take(/ақпанда (\d+) күн/,s)[1];let weekday=week.indexOf(m[1]);for(const days of [31,feb])for(let d=0;d<days;d++)weekday=(weekday+1)%7;assert.equal(week[weekday],r.answer);assert.equal(feb,28);break;}
 default:assert.fail(k);
 }domains++;
}
let rejected=0,invalid=0;
for(const row of rows){for(const key of ['answer','statement','solution','options']){if(key==='options'&&!row.options)continue;const bad=structuredClone(row);bad[key]=key==='options'?[...row.options].reverse():row[key]+' altered';assert.throws(()=>verifyEdition(bad));rejected++;}
 const key=Object.keys(row.params).find(k=>typeof row.params[k]==='number');if(key){const changed=structuredClone(row);changed.params[key]++;assert.throws(()=>verifyEdition(changed));rejected++;const bad=structuredClone(row);bad.params[key]=-1;assert.throws(()=>{Object.assign(bad,renderEdition(bad));verifyEdition(bad);});invalid++;}}
console.log(JSON.stringify({fixtures:24,printedGivenDomains:domains,completeCalendarStartingWeekdays:weekdayStarts,completeAgeAndMinuteDomains:true,tamperRejected:rejected,invalidParametersRejected:invalid,status:'passed'}));
