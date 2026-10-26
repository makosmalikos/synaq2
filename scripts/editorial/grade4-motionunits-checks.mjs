/** Author printed-given / unit / full trajectory domains. Not external review. */
import fs from 'node:fs';import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './grade4-motionunits-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-motionunits-wave26.json',import.meta.url))).editions;
const keys=['6 м','3 000 м/сағ','300','7000','7500','400','7 200 м/сағ','7','270','48','45 км','=','1 100 м/мин','700','12 мин','шаңғышы, велосипедші, конькиші','30','165','72 км/сағ','09:09','Дина','210','294','1 200 м/мин','56','Бірінші көлік жылдам, 300 м/мин артық','1 800 м','2 250 м','20 мин','08:10','1200','6 м/с','6400','>','18','17:35','18','600 м/мин'];
const num=s=>Number(s.replaceAll(' ','')),take=(re,s)=>{const m=re.exec(s);assert(m,[re,s]);return m;},quot=(a,b)=>{assert.equal(a%b,0);return a/b;},sign=(a,b)=>a<b?'<':a>b?'>':'=';
function match(r,n,unit=''){assert(Number.isSafeInteger(n)&&n>=0);if(r.options){const fmt=String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+(unit?' '+unit:'');assert.equal(r.answer,fmt);assert.equal(r.options.filter(o=>o===fmt).length,1);}else assert.equal(+r.answer,n);}
let domains=0,fullIntegerCases=0,clockMinuteCases=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement,k=r.modelId.replace('grade4-motionunits-','');verifyEdition(r);assert.equal(r.answer,keys[i]);
 switch(k){
 case 'meters-per-minute-seconds-distance':{const [v,t]=take(/ (\d+) м\/мин[\s\S]*?\. (\d+) секундта/,s).slice(1).map(Number);match(r,quot(v*t,60),'м');assert(t<60&&t>0);break;}
 case 'kmh-to-mh':{const v=+take(/^(\d+) км\/сағ/,s)[1];match(r,v*1000,'м/сағ');assert(s.includes('м/сағ бірлігімен'));break;}
 case 'ms-to-mmin':{const v=+take(/жылдамдығы (\d+) м\/с/,s)[1];match(r,v*60);break;}
 case 'kmh-minutes-distance-m':{const [v,t]=take(/ (\d+) км\/сағ[\s\S]*? (\d+) минут жүрді/,s).slice(1).map(Number);match(r,quot(v*1000*t,60));break;}
 case 'kmh-to-mmin':{const v=+take(/^(\d+) км\/сағ/,s)[1];match(r,quot(v*1000,60),'м/мин');break;}
 case 'ms-to-mh':{const v=+take(/^(\d+) м\/с/,s)[1];match(r,v*60*60,'м/сағ');assert(s.includes('м/сағ бірлігімен'));break;}
 case 'mmin-to-ms':{const v=+take(/^(\d+) м\/мин/,s)[1];match(r,quot(v,60),'м/с');break;}
 case 'mmin-hours-distance-km':{const [v,t]=take(/ (\d[\d ]*) м\/мин[\s\S]*? (\d+) сағат жүрді/,s).slice(1).map(num);match(r,quot(v*t*60,1000));break;}
 case 'mmin-to-kmh':{const v=+take(/жылдамдығы (\d+) м\/мин/,s)[1];match(r,quot(v*60,1000));break;}
 case 'half-hour-km-distance':{const [v,t]=take(/ (\d+) км\/сағ[\s\S]*? (\d+) минут жүрді/,s).slice(1).map(Number);assert.equal(t,30);match(r,quot(v*t,60),'км');break;}
 case 'compare-kmh-mmin':{const [a,b]=take(/^(\d+) км\/сағ □ (\d+) м\/мин/,s).slice(1).map(Number);assert.equal(sign(a*1000,b*60),r.answer);assert.equal(a*1000,b*60);break;}
 case 'mixed-speeds-distance-gap-m':{const [a,b,t]=take(/ (\d+) м\/мин, [\s\S]*? (\d+) км\/сағ[\s\S]*?\. (\d+) минутта/,s).slice(1).map(Number);match(r,quot(b*1000*t,60)-a*t);break;}
 case 'same-road-mixed-speeds-time':{const [v,t,w]=take(/ (\d+) км\/сағ[\s\S]*? (\d+) минутта[\s\S]*?жолды (\d+) м\/мин/,s).slice(1).map(Number);match(r,quot(v*1000*t,w*60),'мин');break;}
 case 'mixed-speed-order':{const [a,b,c]=take(/Велосипедші (\d+) км\/сағ, шаңғышы (\d+) м\/мин, конькиші (\d+) м\/с/,s).slice(1).map(Number),vals={'велосипедші':a*1000,'шаңғышы':b*60,'конькиші':c*3600},expected=Object.keys(vals).sort((a,b)=>vals[a]-vals[b]).join(', ');assert.equal(r.answer,expected);assert.equal(new Set(Object.values(vals)).size,3);break;}
 case 'kmh-km-time-min':{const [v,d]=take(/ (\d+) км\/сағ[\s\S]*? (\d+) км жүрді/,s).slice(1).map(Number);match(r,quot(d*60,v));break;}
 case 'two-stage-mixed-units-distance':{const [a,h,m,b,t]=take(/алдымен (\d+) км\/сағ[\s\S]*? (\d+) сағат (\d+) минут, содан соң (\d[\d ]*) м\/мин[\s\S]*? (\d+) минут жүрді/,s).slice(1).map(num);assert.notEqual(a*1000,b*60);assert.equal(m,30);match(r,quot(a*(h*60+m)*1000+b*t*60,60000));break;}
 case 'ms-to-kmh':{const v=+take(/жылдамдығы (\d+) м\/с/,s)[1];match(r,quot(v*3600,1000),'км/сағ');break;}
 case 'arrival-clock-mixed-distance':{const [h,m,v,km,meters]=take(/(\d+):(\d+) кезінде[\s\S]*? (\d+) км\/сағ[\s\S]*? (\d+) км (\d+) м жүрді/,s).slice(1).map(Number),road=km*1000+meters,t=quot(road*60,v*1000),end=h*60+m+t;assert.equal(String(Math.floor(end/60)).padStart(2,'0')+':'+String(end%60).padStart(2,'0'),r.answer);assert(m+t>=60);break;}
 case 'greatest-mixed-distance':{const m=take(/(\S+): (\d+) км\/сағ, (\d+) мин; (\S+): (\d+) м\/мин, (\d+) сағ; (\S+): (\d+) м\/с, (\d+) сағ; (\S+): (\d+) км\/сағ, (\d+) сағ/,s),a=quot(+m[2]*1000* +m[3],60),b=+m[5]*+m[6]*60,c=+m[8]*+m[9]*3600,d=+m[11]*+m[12]*1000,vals=[a,b,c,d],names=[m[1],m[4],m[7],m[10]];assert.equal(names[vals.indexOf(Math.max(...vals))],r.answer);assert.equal(b,d);assert(c>a&&a>b);break;}
 case 'ms-versus-mmin-one-minute-gap':{const [a,b,t]=take(/көлік (\d+) м\/с, екінші көлік (\d+) м\/мин[\s\S]*?\. (\d+) минутта/,s).slice(1).map(Number);match(r,(a*60-b)*t);assert.equal(t,1);break;}
 case 'mmin-mixed-time-distance-km':case 'mmin-mixed-time-distance-m':{const [v,h,m]=take(/ (\d[\d ]*) м\/мин[\s\S]*? (\d+) сағат (\d+) минут жүрді/,s).slice(1).map(num),meters=v*(h*60+m);match(r,k.endsWith('-km')?quot(meters,1000):meters);assert(h>0&&m>0&&m<60);break;}
 case 'km-mixed-time-speed-mmin':{const [h,m,d]=take(/Көлік (\d+) сағат (\d+) минутта (\d+) км/,s).slice(1).map(Number);match(r,quot(d*1000,h*60+m),'м/мин');break;}
 case 'km-minutes-speed-kmh':{const [t,d]=take(/Автобус (\d+) минутта (\d+) км/,s).slice(1).map(Number);match(r,quot(d*60,t));break;}
 case 'kmh-versus-mmin-who-gap':{const [a,b]=take(/Бірінші көлік (\d+) км\/сағ, екінші көлік (\d[\d ]*) м\/мин/,s).slice(1).map(num),diff=quot(a*1000,60)-b;assert.equal(r.answer,`Бірінші көлік жылдам, ${diff} м/мин артық`);assert.equal(diff,300);break;}
 case 'equal-late-early-distance':{const [a,late,b,early]=take(/ (\d+) м\/мин жылдамдықпен жүрсе сабаққа (\d+) минут кешігеді, (\d+) м\/мин жылдамдықпен жүрсе (\d+) минут ерте/,s).slice(1).map(Number),good=[];for(let d=1;d<=20000;d++){fullIntegerCases++;if(d*b-d*a===(late+early)*a*b)good.push(d);}assert.deepEqual(good,[num(r.answer.replace(' м',''))]);assert.equal(good[0]/a-late,good[0]/b+early);assert.equal(late,early);assert(s.includes('бір уақытта үйінен'));break;}
 case 'meeting-first-mixed-distance':{const [km,meters,a,b]=take(/арасы (\d+) км (\d+) м[\s\S]*?Дина (\d+) км\/сағ, Мерей (\d+) км\/сағ/,s).slice(1).map(Number),road=km*1000+meters,n=quot(road*a,a+b);match(r,n,'м');assert.notEqual(a,b);assert(s.includes('бір-біріне қарсы'));break;}
 case 'delayed-catch-mixed-speed':{const [slow,delay,fastKmh]=take(/ (\d+) м\/мин[\s\S]*?\. (\d+) минуттан соң[\s\S]*? (\d+) км\/сағ/,s).slice(1).map(Number),fast=quot(fastKmh*1000,60),good=[];for(let t=0;t<=1000;t++){fullIntegerCases++;if(fast*t===slow*(delay+t))good.push(t);}assert.deepEqual(good,[num(r.answer.replace(' мин',''))]);assert(r.options.includes(`${delay+good[0]} мин`));assert(r.options.includes(`${quot(slow*delay,fast)} мин`));break;}
 case 'same-arrival-mixed-speed-clock':{const [h1,m1,slow,h2,m2,fastKmh]=take(/(\d+):(\d+) кезінде (\d+) м\/мин[\s\S]*? (\d+):(\d+) кезінде (\d+) км\/сағ/,s).slice(1).map(Number),start1=h1*60+m1,start2=h2*60+m2,fast=quot(fastKmh*1000,60),good=[];for(let end=start2;end<1440;end++){clockMinuteCases++;if(slow*(end-start1)===fast*(end-start2))good.push(end);}assert.equal(good.length,1);const end=good[0];assert.equal(String(Math.floor(end/60)).padStart(2,'0')+':'+String(end%60).padStart(2,'0'),r.answer);assert.equal(end-start2,20);break;}
 case 'compare-ms-mmin':{const [a,b]=take(/^(\d+) м\/с □ (\d[\d ]*) м\/мин/,s).slice(1).map(num);assert.equal(sign(a*60,b),r.answer);assert(a<b&&a*60>b);break;}
 case 'kmh-mixed-distance-time-min':{const [v,km,meters]=take(/ (\d+) км\/сағ[\s\S]*? (\d+) км (\d+) м жол/,s).slice(1).map(Number);match(r,quot((km*1000+meters)*60,v*1000));break;}
 case 'train-arrival-clock':{const [h,m,v,km]=take(/(\d+):(\d+) кезінде шығып, (\d[\d ]*) м\/мин[\s\S]*? (\d+) км жүрді/,s).slice(1).map(num),duration=quot(km*1000,v),end=h*60+m+duration;assert.equal(duration,120);assert.equal(String(Math.floor(end/60)).padStart(2,'0')+':'+String(end%60).padStart(2,'0'),r.answer);break;}
 case 'mixed-speeds-distance-gap-km':{const [a,b,t]=take(/Мотоциклші (\d+) км\/сағ, жүк көлігі (\d+) м\/мин[\s\S]*?\. (\d+) минутта/,s).slice(1).map(Number);match(r,quot(a*1000*t-b*t*60,60000));break;}
 default:assert.fail(k);
 }domains++;
 const ref=r.sourceRefs[0],q=JSON.parse(fs.readFileSync(ref.sourceFile)).questions.find(q=>q.id===ref.sourceId),clean=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(r.statement),clean(q.statement));
}
let rejected=0,invalid=0;
function find(v,path=[]){if(typeof v==='number')return path;if(Array.isArray(v)){for(let i=0;i<v.length;i++){const p=find(v[i],[...path,i]);if(p)return p;}}else if(v&&typeof v==='object'){for(const k of Object.keys(v)){const p=find(v[k],[...path,k]);if(p)return p;}}return null;}
function mutate(r,path,value){const row=structuredClone(r);let p=row.params;for(let i=0;i<path.length-1;i++)p=p[path[i]];p[path.at(-1)]=value;return row;}
for(const r of rows){for(const key of ['answer','statement','solution','options']){if(key==='options'&&!r.options)continue;const bad=structuredClone(r);bad[key]=key==='options'?[...r.options].reverse():r[key]+' altered';assert.throws(()=>verifyEdition(bad));rejected++;}const path=find(r.params);if(path){let n=r.params;for(const k of path)n=n[k];assert.throws(()=>verifyEdition(mutate(r,path,n+1)));rejected++;const inv=mutate(r,path,-1);assert.throws(()=>{Object.assign(inv,renderEdition(inv));verifyEdition(inv);});invalid++;}}
const clockRow=structuredClone(rows.find(r=>r.modelId.endsWith('same-arrival-mixed-speed-clock')));clockRow.params.secondMinute=60;assert.throws(()=>renderEdition(clockRow));invalid++;
const equal=structuredClone(rows.find(r=>r.modelId.endsWith('two-stage-mixed-units-distance')));equal.params.firstKmh=60;assert.throws(()=>renderEdition(equal));invalid++;
console.log(JSON.stringify({fixtures:38,printedGivenDomains:domains,fullIntegerCases,clockMinuteCases,sourceStatementMatches:0,tamperRejected:rejected,invalidParametersRejected:invalid,status:'passed'}));
