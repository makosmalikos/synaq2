/** Author-side checks: actual printed givens, complete ledgers/subsets/menu
 * choices, and an independent UTC-calendar arrival. No editorial self-signature. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './grade4-rubles-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-rubles-wave19.json',import.meta.url))).editions;
const keys=['4 күн','760 копейка','14 жыл 3 ай','70 рубль 90 копейка','1 000 + 500 + 500','19 рубль 50 копейка','1400','445','4 рубль 55 копейка','9 тәулік 4 сағ','516','476','2300','6 қызыл, 9 ақ','4 тәулік 15 сағ','7625','103 сағ','8','19000','Жетеді, 96 доллар қалады','229','14 мин 10 с','850','34 жас','585','4','4','микротолқынды пеш, үтік, шаңсорғыш','5','26 сағ 55 мин','Жұма, 14 сағ 25 мин','907','8 рубль 35 копейка','155','4 апта 3 күн','456','6 қызыл, 8 ақ','сорпа, қазақша ет, шұбат','42'];
const num=s=>Number(s.replaceAll(' ','')),take=(re,s)=>{const m=re.exec(s);assert(m,[re,s]);return m;};
const bases={'апта':7,'күн':1,'тәулік':24,'сағ':60,'мин':60,'с':1,'жыл':12,'ай':1,'рубль':100,'копейка':1};
function mixed(text,parent,child,base){const re=new RegExp(`^(?:(\\d[\\d ]*) ${parent}(?: (\\d+) ${child})?|(\\d[\\d ]*) ${child})$`);const m=take(re,text);return m[3]?num(m[3]):num(m[1])*base + +(m[2]||0);}
const rm=s=>mixed(s,'рубль','копейка',100),hm=s=>mixed(s,'сағ','мин',60),ms=s=>mixed(s,'мин','с',60),wd=s=>mixed(s,'апта','күн',7),dh=s=>mixed(s,'тәулік','сағ',24),ym=s=>mixed(s,'жыл','ай',12);
const extractItems=s=>[...s.matchAll(/([^;:]+) — (\d[\d ]*) рубль/g)].map(m=>[m[1].trim(),num(m[2])]);
function menu(s){const a=take(/Бірінші тағамдар: (.+?)\. Екінші тағамдар: (.+?)\. Сусындар: (.+?)\./,s);const groups=a.slice(1).map(text=>text.split(', ').map(item=>{const m=take(/^(.+) (\d+) теңге$/,item);return [m[1],+m[2]];}));let all=[{names:[],price:0}];for(const group of groups)all=all.flatMap(p=>group.map(([name,price])=>({names:[...p.names,name],price:p.price+price})));return all;}
function powerset(items){if(!items.length)return [[]];const [first,...rest]=items;return powerset(rest).flatMap(a=>[a,[first,...a]]);}
let domains=0,subsetCases=0,menuCases=0,integerCases=0,calendarCases=0;
assert.equal(rows.length,39);
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement,k=r.modelId.replace('grade4-rubles-','');assert.equal(r.answer,keys[i]);assert.equal(verifyEdition(r).answer,keys[i]);
 if(['week-borrow-difference','day-hour-borrow-difference','ruble-borrow-difference','ruble-no-borrow-difference'].includes(k)){
  const [left,right]=s.replace(' айырмасын таңдаңыз.','').split(' − '),convert=k.startsWith('week')?wd:k.startsWith('day')?dh:rm,wanted=convert(left)-convert(right);assert.deepEqual(r.options.filter(o=>convert(o)===wanted),[r.answer]);if(r.editionId.endsWith('7ce7be5541990758'))assert(!r.answer.includes('апта'));domains++;continue;
 }
 switch(k){
 case 'greatest-ruble-amount':{const vals=r.options.map(rm),best=Math.max(...vals);assert.equal(vals.filter(v=>v===best).length,1);assert.equal(r.options[vals.indexOf(best)],r.answer);break;}
 case 'year-month-carry-sum':{const m=take(/^(\d+) жыл (\d+) ай \+ (\d+) ай/,s),total=+m[1]*12 + +m[2] + +m[3];assert.deepEqual(r.options.filter(o=>ym(o)===total),[r.answer]);break;}
 case 'kopecks-to-mixed':{const total=num(take(/^(\d[\d ]*) копейканы/,s)[1]);assert.deepEqual(r.options.filter(o=>rm(o)===total),[r.answer]);break;}
 case 'exact-note-sum':{const target=num(take(/^(\d[\d ]*) рубльді/,s)[1]),sums=r.options.map(o=>o.split(' + ').map(num).reduce((a,b)=>a+b,0));assert.deepEqual(r.options.filter((o,i)=>sums[i]===target),[r.answer]);break;}
 case 'mixed-unit-price':{const m=take(/Бір маркер (\d+) рубль (\d+) копейка[\s\S]*?Бірдей (\d+) маркердің/,s),price=+m[1]*100 + +m[2],n=+m[3];assert.deepEqual(r.options.filter(o=>rm(o)===price*n),[r.answer]);break;}
 case 'rubles-to-kopecks':{assert.equal(+take(/^(\d+) рубльді/,s)[1]*100,+r.answer);break;}
 case 'hour-minute-difference':{const [a,b]=s.replace(/ айырмасын минутпен[\s\S]*/,'').split(' − ');assert.equal(hm(a)-hm(b),+r.answer);break;}
 case 'day-hour-carry-sum':{const [a,b]=s.replace(' қосындысын таңдаңыз.','').split(' + ');assert.deepEqual(r.options.filter(o=>dh(o)===dh(a)+dh(b)),[r.answer]);break;}
 case 'minutes-seconds-total':{const m=take(/әуенді (\d+) мин (\d+) с/,s);assert.equal(+m[1]*60 + +m[2],+r.answer);break;}
 case 'equal-item-cost':{const m=take(/табақша (\d+) рубль[\s\S]*?Бірдей (\d+) табақшаның/,s);assert.equal(+m[1]*+m[2],+r.answer);break;}
 case 'same-price-other-count':{const m=take(/^(\d+) қаламға (\d+) рубль (\d+) копейка[\s\S]*?\. (\d+) қарындаштың/,s);assert.equal((+m[2]*100 + +m[3])*+m[4]/+m[1],+r.answer);break;}
 case 'two-yarn-colours':{const m=take(/Бірдей бағадағы (\d+) шумақ[\s\S]*?Қызыл жіпке (\d+) рубль, ақ жіпке (\d+) рубль/,s),[count,red,white]=m.slice(1).map(Number),solutions=[];for(let a=1;a<count;a++)for(let b=1;b<count;b++)if(a+b===count&&red*b===white*a)solutions.push([a,b]);assert.equal(solutions.length,1);assert.equal(`${solutions[0][0]} қызыл, ${solutions[0][1]} ақ`,r.answer);integerCases++;break;}
 case 'cheaper-ticket-change':{const m=take(/билеті (\d[\d ]*) теңге, ұшақ билеті (\d[\d ]*) теңге[\s\S]*?алып, (\d[\d ]*) теңгелік (\d+) қағаз/,s),[a,b,note,count]=m.slice(1).map(num);assert.equal(note*count-Math.min(a,b),+r.answer);break;}
 case 'days-hours-total':{const m=take(/^(\d+) тәулік (\d+) сағ/,s),n=+m[1]*24 + +m[2];assert.equal(num(r.answer.replace(' сағ','')),n);break;}
 case 'equal-product-pairs':{const m=take(/Нан (\d+) рубль[\s\S]*?қорабы (\d+) рубль[\s\S]*?барлығы (\d[\d ]*) рубль/,s),[a,b,total]=m.slice(1).map(num),solutions=[];for(let n=1;n<=total;n++)if(n*a+n*b===total)solutions.push(n);assert.deepEqual(solutions,[+r.answer]);integerCases++;break;}
 case 'appliance-budget-remainder':{const budget=num(take(/Отбасы (\d[\d ]*) рубль бөлді/,s)[1]),items=extractItems(s);assert.equal(items.length,4);assert.equal(budget-items.reduce((a,[,v])=>a+v,0),+r.answer);break;}
 case 'budget-enough':{const m=take(/Дүкенге (\d+) доллар[\s\S]*?бағалары (\d+), (\d+), (\d+) доллар/,s),[budget,...costs]=m.slice(1).map(Number),spent=costs.reduce((a,b)=>a+b,0);assert(budget>spent);assert.equal(`Жетеді, ${budget-spent} доллар қалады`,r.answer);break;}
 case 'price-from-change':{const m=take(/Бірдей (\d+) шоколадқа (\d+) рубль[\s\S]*? (\d+) рубль қайтарым/,s),[count,paid,change]=m.slice(1).map(Number);assert.equal((paid-change)/count,+r.answer);break;}
 case 'three-track-duration':{const text=take(/ұзақтығы (.+?)\. Олар/,s)[1],total=text.split('; ').map(ms).reduce((a,b)=>a+b,0);assert.deepEqual(r.options.filter(o=>ms(o)===total),[r.answer]);break;}
 case 'least-menu-price':{const all=menu(s);assert.equal(all.length,18);assert.equal(Math.min(...all.map(a=>a.price)),+r.answer);menuCases+=all.length;break;}
 case 'three-generation-age':{const m=take(/(\d+) жас үлкен,[\s\S]*? (\d+) жас кіші[\s\S]*?қосындысы (\d+)/,s),[young,old,total]=m.slice(1).map(Number),hits=[];for(let age=1;age<=100;age++)if(age>young&&(age-young)+age+(age+old)===total)hits.push(age);assert.equal(hits.length,1);assert.equal(num(r.answer.replace(' жас','')),hits[0]);integerCases++;break;}
 case 'two-purchase-balances':{const m=take(/Самал (\d+) раушангүл алса, (\d+) рублі[\s\S]*?; (\d+) раушангүл алса, (\d+) рублі/,s),[a,leftA,b,leftB]=m.slice(1).map(Number),hits=[];for(let price=1;price<=Math.max(leftA,leftB);price++)if(a*price+leftA===b*price+leftB)hits.push(a*price+leftA);assert.deepEqual(hits,[+r.answer]);integerCases++;break;}
 case 'maximum-distinct-appliances':{const budget=num(take(/(\d[\d ]*) рубльге ең көп/,s)[1]),items=extractItems(s),all=powerset(items);assert.equal(items.length,7);assert.equal(all.length,128);const good=all.filter(a=>a.reduce((v,[,p])=>v+p,0)<=budget);assert.equal(Math.max(...good.map(a=>a.length)),+r.answer);subsetCases+=all.length;break;}
 case 'two-note-high-count':{const m=take(/^(\d+) рубль тек (\d+) және (\d+) рубльдік[\s\S]*?Барлығы (\d+) қағаз/,s),[total,low,high,count]=m.slice(1).map(Number),hits=[];for(let a=0;a<=count;a++)for(let b=0;b<=count;b++)if(a+b===count&&a*high+b*low===total)hits.push(a);assert.deepEqual(hits,[+r.answer]);integerCases++;break;}
 case 'exact-remaining-appliances':{const m=take(/Отбасында (\d[\d ]*) рубль[\s\S]*?Алдымен (\d[\d ]*) рубльге/,s),left=num(m[1])-num(m[2]),items=extractItems(s),all=powerset(items),exact=all.filter(a=>a.reduce((v,[,p])=>v+p,0)===left);assert.equal(all.length,16);assert.equal(exact.length,1);const wanted=new Set(exact[0].map(([name])=>name));const valid=r.options.filter(o=>{const names=o.split(', ');return names.length===wanted.size&&names.every(n=>wanted.has(n));});assert.deepEqual(valid,[r.answer]);subsetCases+=all.length;break;}
 case 'three-yarn-colours':{const m=take(/бірдей (\d+) шумақ[\s\S]*?қызылына (\d+), ағына (\d+), көгіне (\d+) рубль/,s),[count,red,white,blue]=m.slice(1).map(Number),hits=[];for(let a=1;a<count;a++)for(let b=1;b<count;b++)for(let c=1;c<count;c++)if(a+b+c===count&&red*b===white*a&&red*c===blue*a)hits.push(b);assert.deepEqual(hits,[+r.answer]);integerCases++;break;}
 case 'daily-training-total':{const m=take(/Рауан (\d+) апта (\d+) күн[\s\S]*?сайын (\d+) сағ (\d+) мин/,s),[weeks,days,hours,minutes]=m.slice(1).map(Number),total=(weeks*7+days)*(hours*60+minutes);assert.deepEqual(r.options.filter(o=>hm(o)===total),[r.answer]);break;}
 case 'multi-day-train-arrival':{const weekdays=['дүйсенбі','сейсенбі','сәрсенбі','бейсенбі','жұма','сенбі','жексенбі'],m=take(/Пойыз ([а-яәіңғүұқөһ]+) күні (\d+) сағ (\d+) мин[\s\S]*?Жолда (\d+) тәулік (\d+) сағ (\d+) мин/,s),day=weekdays.indexOf(m[1]);assert(day>=0);const [h,minute,days,dh,dm]=m.slice(2).map(Number),date=new Date(Date.UTC(2024,0,1+day,h,minute));date.setUTCMinutes(date.getUTCMinutes()+days*1440+dh*60+dm);const answerDay=weekdays[(date.getUTCDay()+6)%7],o=take(/^([^,]+), (.+)$/,r.answer);assert.equal(o[1].toLowerCase(),answerDay);assert.equal(hm(o[2]),date.getUTCHours()*60+date.getUTCMinutes());calendarCases++;break;}
 case 'mixed-to-kopecks':{const m=take(/^(\d+) рубль (\d+) копейка/,s);assert.equal(+m[1]*100 + +m[2],+r.answer);break;}
 case 'two-item-price-factor':{const m=take(/табақша (\d+) рубль[\s\S]*?одан (\d+) есе[\s\S]*?\. (\d+) табақша мен (\d+) саптаяқ/,s),[price,factor,plates,cups]=m.slice(1).map(Number);assert.equal(price*plates+price/factor*cups,+r.answer);break;}
 case 'greatest-menu-choice':{const all=menu(s),max=Math.max(...all.map(a=>a.price)),best=all.filter(a=>a.price===max);assert.equal(best.length,1);assert.equal(best[0].names.join(', '),r.answer);menuCases+=all.length;break;}
 default:assert.fail(k);
 }domains++;
}
let rejected=0,invalid=0;
for(const row of rows){for(const key of ['answer','statement','solution','options']){if(key==='options'&&!row.options)continue;const bad=structuredClone(row);bad[key]=key==='options'?[...row.options].reverse():row[key]+' altered';assert.throws(()=>verifyEdition(bad));rejected++;}const key=Object.keys(row.params).find(k=>typeof row.params[k]==='number');if(key){const changed=structuredClone(row);changed.params[key]++;assert.throws(()=>verifyEdition(changed));rejected++;const bad=structuredClone(row);bad.params[key]=-1;assert.throws(()=>{Object.assign(bad,renderEdition(bad));verifyEdition(bad);});invalid++;}}
for(const k of ['week-borrow-difference','day-hour-borrow-difference','ruble-borrow-difference']){const row=structuredClone(rows.find(r=>r.modelId===`grade4-rubles-${k}`));row.params.a[1]=row.params.b[1];assert.throws(()=>renderEdition(row));invalid++;}
console.log(JSON.stringify({fixtures:39,printedGivenDomains:domains,fullSubsetCases:subsetCases,fullMenuCases:menuCases,completeIntegerLedgers:integerCases,independentCalendarArrivals:calendarCases,tamperRejected:rejected,invalidParametersRejected:invalid,status:'passed'}));
