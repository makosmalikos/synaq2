/** Individual saved river-motion editions. Offline drafts; no self-review. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
import {SPECS} from './grade5-river-specs.mjs';
const sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-10').map(q=>[q.sourceId,q]));
const one=xs=>{assert.equal(xs.length,1);return xs[0];},div=(a,b)=>{assert.ok(Number.isSafeInteger(a)&&Number.isSafeInteger(b)&&a>=0&&b>0&&a%b===0,`Noninteger river quantity ${a}/${b}`);return a/b;};
const speed=(v,u)=>{assert.ok(v>u&&u>0);return{down:v+u,up:v-u};};
const clock=h=>`${h}:00`;
function render(kind,p){let s,z,a,options;for(const n of Object.values(p).filter(n=>typeof n==='number'))assert.ok(Number.isSafeInteger(n)&&n>0);if(p.own&&p.current)speed(p.own,p.current);
 switch(kind){
 case'raft-distance':{
  a=p.current*p.hours;s=`Моторы мен ескегі жоқ бақылау салы өзен ағысымен ${p.hours} сағат жылжыды. Су ағысы ${p.current} км/сағ болса, сал неше километр жүрді?`;
  z=`Сал суға қатысты өздігінен жүрмейді; жағалауға қатысты жылдамдығы ағысқа тең, ${p.current} км/сағ. Жолы ${p.current} × ${p.hours} = ${a} км. Тексеру: ${a} : ${p.hours} = ${p.current} км/сағ.`;break;
 }
 case'current-from-own-down':{
  a=p.down-p.own;assert.ok(a>0&&p.own>a);options=p.choices.map(n=>`${n} км/сағ`);a+= ' км/сағ';
  s=`Құтқару катерінің тынық судағы жылдамдығы ${p.own} км/сағ. Өзен ағысымен ол ${p.down} км/сағ жылдамдықпен жүреді. Ағыс жылдамдығын таңдаңдар.`;
  z=`Ағыс катердің тынық судағы жылдамдығына қосылады: ${p.own} + u = ${p.down}. Сондықтан u = ${p.down} − ${p.own} = ${p.down-p.own} км/сағ. Екі берілген жылдамдықтың бірі меншікті болғандықтан, айырманы екіге бөлмейміз. Тексеру: ${p.own} + ${p.down-p.own} = ${p.down}.`;break;
 }
 case'raft-speed':{
  s=`Өзен суы жағалауға қатысты ${p.current} км/сағ жылдамдықпен ағады. Моторсыз, ескексіз сал судың өзімен бірге жылжиды. Оның жағалауға қатысты жылдамдығы қандай?`;
  a=`${p.current} км/сағ`;options=['0 км/сағ',`${2*p.current} км/сағ`,a,'Салдың массасын білу керек'];
  z=`Салдың суға қатысты жылдамдығы 0, ал судың жағалауға қатысты жылдамдығы ${p.current} км/сағ. Қосынды 0 + ${p.current} = ${p.current} км/сағ. Бұл модельде сал ағыспен бірге жүреді, массасы сұралған жылдамдықты есептеуге қажет емес.`;break;
 }
 case'downstream-direction':{
  assert.ok(p.outHours>p.backHours);a=`${p.secondPort} айлағынан ${p.firstPort} айлағына`;options=[`${p.firstPort} айлағынан ${p.secondPort} айлағына`,a,'Екі бағытта да','Анықтауға дерек жетпейді'];
  s=`Шартты өзен картасында екі айлақ «${p.firstPort}» және «${p.secondPort}» деп белгіленген. Бір катер бірінші айлақтан екіншісіне ${p.outHours} сағатта, ал кері бағытта ${p.backHours} сағатта жетті. Жол бірдей, катердің суға қатысты жылдамдығы өзгермеді, өзен ағысы тұрақты. Қай бағыт ағыспен сәйкес келеді?`;
  z=`Бірдей жолда аз уақыт жұмсалған бағыттың жылдамдығы үлкен. ${p.backHours} < ${p.outHours}, сондықтан кері бағыт жылдамырақ. Ағыспен жылдамдық v + u, қарсы бағытта v − u; u > 0 болғандықтан v + u үлкен. Демек ${a}. Нақты жердің географиясын білудің қажеті жоқ.`;break;
 }
 case'own-from-two-speeds':case'current-from-two-speeds':{
  const own=div(p.down+p.up,2),current=div(p.down-p.up,2);speed(own,current);a=kind==='own-from-two-speeds'?own:current;
  s=`Өзенде бір катер ағыспен ${p.down} км/сағ, ал ағысқа қарсы ${p.up} км/сағ жылдамдықпен жүзеді. ${kind==='own-from-two-speeds'?'Оның тынық судағы меншікті жылдамдығы':'Өзен ағысының жылдамдығы'} неше км/сағ?`;
  z=kind==='own-from-two-speeds'?`Екі бағыттағы жылдамдықтарды қосқанда ағыс әсері жойылады: (v + u) + (v − u) = 2v. ${p.down} + ${p.up} = ${2*own}, сондықтан v = ${2*own} : 2 = ${own} км/сағ.`:`Бағыттар жылдамдығының айырмасында ағыс екі рет есептеледі: (v + u) − (v − u) = 2u. ${p.down} − ${p.up} = ${2*current}, сондықтан u = ${2*current} : 2 = ${current} км/сағ.`;
  z+=` Тексеру: меншікті жылдамдық ${own}, ағыс ${current}; ${own} + ${current} = ${p.down}, ${own} − ${current} = ${p.up}.`;break;
 }
 case'downstream-boat-distance':case'supply-boat-downstream-distance':case'upstream-distance':{
  const downstream=kind!=='upstream-distance',v=downstream?p.own+p.current:p.own-p.current;a=v*p.hours;
  s=kind==='supply-boat-downstream-distance'?`Зерттеу стансасына жүк жеткізетін қайықтың меншікті жылдамдығы ${p.own} км/сағ, ағыс жылдамдығы ${p.current} км/сағ. Қайық ағыспен ${p.hours} сағатта неше километр жүреді?`:`${downstream?'Табиғатты бақылау тобы':'Сынама жинаушы мамандар'} меншікті жылдамдығы ${p.own} км/сағ моторлы қайықпен ${downstream?'ағыспен':'ағысқа қарсы'} ${p.hours} сағат жүзді. Ағыс жылдамдығы ${p.current} км/сағ. Жүрген жолын километрмен табыңдар.`;
  z=`${downstream?'Ағыспен ағыс жылдамдығы қосылады':'Ағысқа қарсы ағыс жылдамдығы азайтылады'}: ${p.own} ${downstream?'+':'−'} ${p.current} = ${v} км/сағ. Жол ${v} × ${p.hours} = ${a} км. Кері тексеру: ${a} : ${p.hours} = ${v}; ${v} ${downstream?'−':'+'} ${p.current} = ${p.own}. Меншікті жылдамдықты бірден уақытқа көбейту ағыстың әсерін жоғалтады.`;break;
 }
 case'speed-difference-theorem':{
  a='Ағыс жылдамдығының екі есесіне';options=[a,'Ағыс жылдамдығына','Қайықтың меншікті жылдамдығына','Меншікті жылдамдықтың екі есесіне'];
  s='Қайықтың суға қатысты жылдамдығы v, тұрақты ағыс жылдамдығы u болсын, v > u > 0. Бір қайықтың ағыспен жылдамдығынан ағысқа қарсы жылдамдығын азайтқанда айырма қандай шамаға тең?';
  z='Ағыспен жылдамдық v + u, қарсы жылдамдық v − u. Айырма (v + u) − (v − u) = v + u − v + u = 2u. Меншікті жылдамдық жойылады. Мысалы, v = 18, u = 4 кезінде 22 − 14 = 8 = 2 × 4. Қорытынды мысалға ғана емес, әрбір v > u үшін орындалатын теңдікке сүйенеді.';break;
 }
 case'own-from-down-current':case'own-from-up-current':{
  const down=kind==='own-from-down-current';a=down?p.down-p.current:p.up+p.current;assert.ok(a>p.current);
  s=down?`Саяхат қайығының ағыспен жылдамдығы ${p.down} км/сағ, ағыс жылдамдығы ${p.current} км/сағ. Қайық тынық суда неше км/сағ жылдамдықпен жүзеді?`:`Патруль катерінің ағысқа қарсы жылдамдығы ${p.up} км/сағ. Ағыс жылдамдығы ${p.current} км/сағ болса, оның меншікті жылдамдығын таңдаңдар.`;
  if(p.choices){options=p.choices.map(n=>`${n} км/сағ`);a+=' км/сағ';}
  const v=down?p.down-p.current:p.up+p.current;
  z=down?`Ағыспен жылдамдыққа ағыс қосылып қойған. Оны алып тастаймыз: v = ${p.down} − ${p.current} = ${v} км/сағ. Тексеру: ${v} + ${p.current} = ${p.down}.`:`Ағысқа қарсы жылдамдық v − u. Меншікті жылдамдықты табу үшін айырмаға ағысты қайта қосамыз: v = ${p.up} + ${p.current} = ${v} км/сағ. Тексеру: ${v} − ${p.current} = ${p.up}. Меншікті жылдамдық қарсы бағыттағы нақты жылдамдықтан үлкен.`;break;
 }
 case'lake-distance-extraneous-current':{
  a=p.own*p.hours;options=p.choices.map(n=>`${n} км`);a+=' км';
  s=`Арна ағысының жылдамдығы ${p.current} км/сағ. Арна құятын көлде ағыс жоқ деп алынады. Меншікті жылдамдығы ${p.own} км/сағ қайық тек осы көлде ${p.hours} сағат жүзді. Көлдегі жүрген жолын таңдаңдар.`;
  z=`Сұралған қозғалыс толықтай ағынсыз көлде өтті. Сондықтан жылдамдық ${p.own} км/сағ, арнадағы ${p.current} км/сағ ағыс бұл бөлікке қолданылмайды. Жол ${p.own} × ${p.hours} = ${p.own*p.hours} км. Ағысты қосқандағы ${(p.own+p.current)*p.hours} және азайтқандағы ${(p.own-p.current)*p.hours} км бұл жағдайға сәйкес емес.`;break;
 }
 case'time-from-given-downspeed':{
  a=div(p.distance,p.down);s=`Су автобусының ағыспен жүргендегі нақты жылдамдығы ${p.down} км/сағ. Осы бағыттағы ${p.distance} км сапар неше сағатқа созылады?`;
  z=`Нақты ағыспен жылдамдық дайын берілген. Уақыт ${p.distance} : ${p.down} = ${a} сағат. Тексеру: ${p.down} × ${a} = ${p.distance} км. Ағыс белгісіз әрі оны қайта қосудың қажеті жоқ.`;break;
 }
 case'current-from-raft-trip':{
  const current=div(p.distance,p.hours);a=`${current} км/сағ`;options=p.choices.map(n=>`${n} км/сағ`);
  s=`Суға ілесе ағатын сал ${p.hours} сағатта ${p.distance} км жерге жетті. Ағыс тұрақты. Ағыстың жылдамдығын таңдаңдар.`;
  z=`Салдың меншікті жылдамдығы 0, демек оның жағалауға қатысты жылдамдығы ағысқа тең. Ағыс ${p.distance} : ${p.hours} = ${current} км/сағ. Тексеру: ${current} × ${p.hours} = ${p.distance} км. Салдың жылдамдығын екіге бөлмейміз және қашықтықты уақытқа көбейтпейміз.`;break;
 }
 case'distance-from-given-upspeed':{
  a=p.up*p.hours;s=`Байдарканың жағалауға қатысты ағысқа қарсы жылдамдығы ${p.up} км/сағ деп өлшенді. Осы бағытта ${p.hours} сағат жүрген жолын километрмен табыңдар.`;
  z=`Берілген ${p.up} км/сағ жылдамдық ағыс әсерінен кейінгі нақты жылдамдық. Сондықтан жол ${p.up} × ${p.hours} = ${a} км. Тексеру: ${a} : ${p.hours} = ${p.up}. Ағысты одан екінші рет азайтуға болмайды.`;break;
 }
 case'downstream-time':case'upstream-time':{
  const down=kind==='downstream-time',v=down?p.own+p.current:p.own-p.current,n=div(p.distance,v);a=n;if(p.choices){options=p.choices.map(x=>`${x} сағат`);a=`${n} сағат`;}
  s=`Меншікті жылдамдығы ${p.own} км/сағ моторлы қайық ${p.current} км/сағ жылдамдықпен ағатын өзенде ${down?'ағыспен':'ағысқа қарсы'} ${p.distance} км жүзді. Жүзу уақыты неше сағат?`;
  z=`Алдымен нақты бағыт жылдамдығын табамыз: ${p.own} ${down?'+':'−'} ${p.current} = ${v} км/сағ. Уақыт ${p.distance} : ${v} = ${n} сағат. Кері тексеру: ${v} × ${n} = ${p.distance} км. Уақытты меншікті жылдамдықпен не ағыс жылдамдығымен бөлек есептемейміз.`;break;
 }
 case'own-from-two-trips':case'current-from-two-trips':{
  const down=div(p.downDistance,p.downHours),up=div(p.upDistance,p.upHours),own=div(down+up,2),current=div(down-up,2);speed(own,current);a=kind==='own-from-two-trips'?own:current;
  s=`Моторлы қайық ағыспен ${p.downHours} сағатта ${p.downDistance} км, ал ағысқа қарсы ${p.upHours} сағатта ${p.upDistance} км жүрді. ${kind==='own-from-two-trips'?'Қайықтың меншікті':'Ағыстың'} жылдамдығын км/сағ бірлігімен табыңдар.`;
  z=`Ағыспен жылдамдық ${p.downDistance} : ${p.downHours} = ${down} км/сағ. Қарсы жылдамдық ${p.upDistance} : ${p.upHours} = ${up} км/сағ. ${kind==='own-from-two-trips'?`Меншікті жылдамдық қосындының жартысы: (${down} + ${up}) : 2 = ${own}.`:`Ағыс айырманың жартысы: (${down} − ${up}) : 2 = ${current}.`} Екі түрлі жолдың уақыттарын жай орташалауға болмайды. Тексеру: ${own} + ${current} = ${down}, ${own} − ${current} = ${up}; ${down} × ${p.downHours} = ${p.downDistance}, ${up} × ${p.upHours} = ${p.upDistance}.`;
  if(p.choices){options=p.choices.map(n=>`${n} км/сағ`);a+=' км/сағ';}break;
 }
 case'up-to-down-distance':case'down-to-up-distance':{
  const toDown=kind==='up-to-down-distance',own=toDown?p.up+p.current:p.down-p.current,v=toDown?own+p.current:own-p.current;speed(own,p.current);a=v*p.hours;
  s=toDown?`Қайықтың ағысқа қарсы жылдамдығы ${p.up} км/сағ, ағыс ${p.current} км/сағ. Ол ағыспен ${p.hours} сағатта неше километр жүзеді?`:`Катер ағыспен ${p.down} км/сағ жылдамдықпен жүреді. Ағыс ${p.current} км/сағ. Катер осы өзенде ағысқа қарсы ${p.hours} сағатта қанша километр жүреді?`;
  z=`Алдымен меншікті жылдамдық: ${toDown?p.up:p.down} ${toDown?'+':'−'} ${p.current} = ${own} км/сағ. Одан қажетті бағытқа өтеміз: ${own} ${toDown?'+':'−'} ${p.current} = ${v} км/сағ. Жол ${v} × ${p.hours} = ${a} км. Берілген бір бағыттан екінші бағытқа ауысқанда ағыс екі рет ${toDown?'қосылады':'азайтылады'}. Тексеру: бағыттар айырмасы ${2*p.current} км/сағ.`;
  if(p.choices){options=p.choices.map(n=>`${n} км`);a+=' км';}break;
 }
 case'boat-matches-raft-route':{
  const d=p.current*p.raftHours,v=p.own+p.current,n=div(d,v);a=`${n} сағат`;options=p.choices.map(n=>`${n} сағат`);
  s=`Сал өзенде ${p.raftHours} сағат ағып жүрді. Ағыс ${p.current} км/сағ. Меншікті жылдамдығы ${p.own} км/сағ қайық дәл сол қашықтықты ағыспен неше сағатта өтеді?`;
  z=`Салдың жолы ${p.current} × ${p.raftHours} = ${d} км. Қайық ағыспен ${p.own} + ${p.current} = ${v} км/сағ жылдамдықпен жүреді. Сол жолға қажетті уақыт ${d} : ${v} = ${n} сағат. Тексеру: ${v} × ${n} = ${d}; сал мен қайықтың жолдары тең, уақыттары әртүрлі.`;break;
 }
 case'difference-from-current':{
  a=`${2*p.current} км/сағ`;options=[`${p.current} км/сағ`,'0 км/сағ',a,'Меншікті жылдамдықсыз есептелмейді'];
  s=`Өзен ағысы ${p.current} км/сағ. Қайықтың меншікті жылдамдығы ағыстан үлкен және екі бағытта өзгермейді. Оның ағыспен жылдамдығы ағысқа қарсы жылдамдығынан неше км/сағ артық?`;
  z=`Меншікті жылдамдықты v десек, айырма (v + ${p.current}) − (v − ${p.current}) = ${2*p.current} км/сағ. Ағыс бір бағытта қосылып, екінші бағытта азайғандықтан, айырмаға екі рет кіреді. v жойылады, оның нақты мәні қажет емес.`;break;
 }
 case'swimmer-downstream-minutes':{
  const v=p.own+p.current;a=div(p.distance,v);s=`Айсұлудың тынық судағы жүзу жылдамдығы ${p.own} м/мин. Ағысы ${p.current} м/мин арнада ағыспен ${p.distance} м жүзуге неше минут жұмсайды?`;
  z=`Ағыспен жылдамдық ${p.own} + ${p.current} = ${v} м/мин. Уақыт ${p.distance} : ${v} = ${a} минут. Барлық қашықтық метрмен, жылдамдық метр/минутпен берілген, қосымша сағатқа ауыстыру қажет емес. Тексеру: ${v} × ${a} = ${p.distance} м.`;break;
 }
 case'boat-raft-separation':{
  const boat=(p.own+p.current)*p.hours,raft=p.current*p.hours,n=boat-raft;a=`${n} км`;options=p.choices.map(n=>`${n} км`);
  s=`Бір айлақтан бір уақытта сал және моторлы қайық ағыспен шықты. Қайықтың меншікті жылдамдығы ${p.own} км/сағ, ағыс ${p.current} км/сағ. ${p.hours} сағаттан кейін олардың бір-бірінен қашықтығын таңдаңдар.`;
  z=`Қайықтың орны: (${p.own} + ${p.current}) × ${p.hours} = ${boat} км. Салдың орны: ${p.current} × ${p.hours} = ${raft} км. Бір бағытта жүргендіктен аралары ${boat} − ${raft} = ${n} км. Немесе салыстырмалы жылдамдық (${p.own} + ${p.current}) − ${p.current} = ${p.own}; ${p.own} × ${p.hours} = ${n}. Қайықтың жеке жолын жауап қылмаймыз.`;break;
 }
 case'river-then-lake-total':{
  const river=(p.own+p.current)*p.riverHours,lake=p.own*p.lakeHours;a=river+lake;
  s=`Қайық алдымен өзен ағысымен ${p.riverHours} сағат, содан соң ағынсыз көлде ${p.lakeHours} сағат жүзді. Меншікті жылдамдығы ${p.own} км/сағ, өзен ағысы ${p.current} км/сағ. Екі бөлікте жүрген жалпы жолды километрмен табыңдар.`;
  z=`Өзен бөлігі: (${p.own} + ${p.current}) × ${p.riverHours} = ${river} км. Көлде ағыс жоқ: ${p.own} × ${p.lakeHours} = ${lake} км. Жалпы жол ${river} + ${lake} = ${a} км. Көлдегі бөлікке өзен ағысын қосу дұрыс емес.`;break;
 }
 case'positive-upstream-headway':{
  const n=one(p.choices.filter(v=>v>p.current));a=`${n} м/мин`;options=p.choices.map(v=>`${v} м/мин`);
  s=`Оқу арнасындағы су ${p.current} м/мин жылдамдықпен ағады. Ойыншық моторлы қайықты ағысқа қарсы бағыттады. Қай меншікті жылдамдықта қайық жағалауға қатысты ағысқа қарсы алға жылжиды?`;
  z=`Алға жылжу үшін v − ${p.current} > 0, яғни v > ${p.current} болуы керек. Нұсқалар: ${p.choices.map(v=>v>p.current?`${v} > ${p.current}: қарсы бағытта ${v-p.current} м/мин ілгерілейді`:v===p.current?`${v} = ${p.current}: жағалауға қатысты бір орында қалады`:`${v} < ${p.current}: ағыс оны төмен алып кетеді`).join('; ')}. Тек ${n} м/мин кезінде айырма оң.`;break;
 }
 case'raft-time-without-distance':{
  assert.ok(p.upDays>p.downDays);const d=p.downDays*p.upDays,down=div(d,p.downDays),up=div(d,p.upDays),current=div(down-up,2),n=div(d,current);a=`${n} тәулік`;options=p.choices.map(v=>`${v} тәулік`);
  s=`Бір су жолын кеме ағыспен ${p.downDays} тәулікте, қарсы бағытта ${p.upDays} тәулікте өтеді. Кеменің меншікті жылдамдығы мен ағыс өзгермейді. Моторсыз сал осы жолды ағыспен неше тәулікте өтеді? Жолдың нақты ұзындығы берілмеген.`;
  z=`Жолды шартты ${d} бөлік деп алуға болады: барлық жылдамдық осы бірдей өлшеммен өзгереді. Ағыспен ${d} : ${p.downDays} = ${down}, қарсы ${d} : ${p.upDays} = ${up} бөлік/тәулік. Ағыс (${down} − ${up}) : 2 = ${current} бөлік/тәулік. Салдың уақыты ${d} : ${current} = ${n} тәулік. Егер жол мен барлық жылдамдық бірдей санға көбейсе, уақыт өзгермейді; сондықтан шартты жол таңдау жауапқа әсер етпейді.`;break;
 }
 case'own-current-ratio-trip':{
  assert.ok(p.ratio>1);const down=div(p.downDistance,p.downHours),current=div(down,p.ratio+1),own=p.ratio*current,up=own-current,n=up*p.upHours;a=`${n} км`;options=p.choices.map(v=>`${v} км`);
  s=`Қайықтың меншікті жылдамдығы ағыс жылдамдығының ${p.ratio} есесіне тең. Ол ағыспен ${p.downHours} сағатта ${p.downDistance} км жүрді. Сол қайық ағысқа қарсы ${p.upHours} сағатта неше километр жүреді?`;
  z=`Ағыс 1 бөлік болса, меншікті жылдамдық ${p.ratio} бөлік, ағыспен ${p.ratio+1} бөлік. Нақты ағыспен жылдамдық ${p.downDistance} : ${p.downHours} = ${down} км/сағ. Бір бөлік ${down} : ${p.ratio+1} = ${current}, меншікті жылдамдық ${own}. Қарсы жылдамдық ${own} − ${current} = ${up}. Ізделген жол ${up} × ${p.upHours} = ${n} км. Тексеру: (${own} + ${current}) × ${p.downHours} = ${p.downDistance}.`;break;
 }
 case'equal-route-distance-inverse':{
  assert.ok(p.upHours>p.downHours);const current=div(p.own*(p.upHours-p.downHours),p.upHours+p.downHours),d=(p.own+current)*p.downHours;assert.equal(d,(p.own-current)*p.upHours);a=`${d} км`;options=p.choices.map(n=>`${n} км`);
  s=`Меншікті жылдамдығы ${p.own} км/сағ катер екі айлақтың арасын ағыспен ${p.downHours} сағатта, кері бағытта ${p.upHours} сағатта өтеді. Екі бағыттағы қашықтық бірдей. Айлақтардың арақашықтығын таңдаңдар.`;
  z=`Ағыссыз есептеген екі жол айырмасы ${p.own} × ${p.upHours} − ${p.own} × ${p.downHours} = ${p.own*(p.upHours-p.downHours)} км. Оны ағыс баруда ${p.downHours}, қайтуда ${p.upHours} сағат әсер етіп теңестіреді. Сондықтан u × (${p.downHours} + ${p.upHours}) = ${p.own*(p.upHours-p.downHours)}, u = ${current}. Жол (${p.own} + ${current}) × ${p.downHours} = ${d} км. Кері тексеру: (${p.own} − ${current}) × ${p.upHours} = ${d} км. Қалған нұсқалар: ${p.own*p.downHours} км болса, ағыспен жылдамдық ${p.own} болып, ағыс нөл шығар еді; онда екі уақыт тең болуы керек. ${p.own*p.upHours} км болса, қарсы жылдамдықтың өзі ${p.own} болып, тағы ағыс нөл шығар еді. Ал ${p.choices.at(-1)} км жолды ${p.downHours} сағатта өту үшін жылдамдық ${2*p.own} км/сағ шамасынан да артық болуы керек, себебі ${2*p.own} × ${p.downHours} = ${2*p.own*p.downHours} < ${p.choices.at(-1)}. Ондай ағыс меншікті жылдамдықтан асып, қайық қарсы жүзе алмас еді. Тек ${d} км екі бағыттағы шартты орындайды.`;break;
 }
 case'round-trip-with-stop':{
  const {down,up}=speed(p.own,p.current),out=div(p.distance,down),back=div(p.distance,up);a=out+p.stopHours+back;
  s=`Экспедиция қайығы айлақтан ${p.distance} км төмендегі бекетке ағыспен барып, онда ${p.stopHours} сағат тұрды да, бастапқы айлаққа қайтты. Меншікті жылдамдығы ${p.own} км/сағ, ағыс ${p.current} км/сағ. Бастапқы шыққан сәттен қайтып келгенге дейін барлығы неше сағат өтті?`;
  z=`Баруда жылдамдық ${down}, уақыт ${p.distance} : ${down} = ${out} сағат. Қайтуда жылдамдық ${up}, уақыт ${p.distance} : ${up} = ${back} сағат. Бекеттегі ${p.stopHours} сағат та жалпы уақытқа кіреді. Барлығы ${out} + ${p.stopHours} + ${back} = ${a} сағат. Екі бағыттағы жол бірдей: ${down} × ${out} = ${up} × ${back} = ${p.distance} км.`;break;
 }
 case'raft-time-known-route':{
  const down=div(p.distance,p.downHours),up=div(p.distance,p.upHours),current=div(down-up,2);a=div(p.distance,current);
  s=`Кеме екі бекеттің арасындағы ${p.distance} км жолды ағыспен ${p.downHours} сағатта, қарсы бағытта ${p.upHours} сағатта өтті. Сол өзендегі сал дәл осы жолды ағыспен неше сағатта өтеді?`;
  z=`Кеменің нақты жылдамдықтары ${p.distance} : ${p.downHours} = ${down} және ${p.distance} : ${p.upHours} = ${up} км/сағ. Ағыс (${down} − ${up}) : 2 = ${current} км/сағ. Сал осы ағыс жылдамдығымен жүреді, уақыты ${p.distance} : ${current} = ${a} сағат. Тексеру: ${current} × ${a} = ${p.distance} км.`;break;
 }
 case'boat-turns-to-meet-raft':{
  const down=div(p.distance,p.downHours),own=down-p.current,up=own-p.current;speed(own,p.current);const raft=p.current*p.downHours,gap=p.distance-raft,returnHours=div(gap,up+p.current);a=p.downHours+returnHours;
  s=`Бір айлақтан сал мен моторлы қайық бір уақытта ағыспен шықты. Қайық ${p.distance} км төмендегі бекетке ${p.downHours} сағатта жетіп, тоқтамай кері бұрылды. Ағыс ${p.current} км/сағ, қайықтың меншікті жылдамдығы өзгермейді. Қайық салмен бастапқы шыққан сәттен неше сағат өткенде кездеседі?`;
  z=`Қайық ағыспен ${p.distance} : ${p.downHours} = ${down} км/сағ жүреді. Меншікті жылдамдығы ${down} − ${p.current} = ${own}, қарсы жылдамдығы ${up}. Бұрылу сәтінде сал ${p.current} × ${p.downHours} = ${raft} км жерде, аралары ${p.distance} − ${raft} = ${gap} км. Енді жақындасу жылдамдығы ${up} + ${p.current} = ${own}. Кері бөліктегі уақыт ${gap} : ${own} = ${returnHours} сағат. Жалпы уақыт ${p.downHours} + ${returnHours} = ${a}. Тексеру: сал ${p.current} × ${a} = ${p.current*a} км; қайық ${p.distance} − ${up} × ${returnHours} = ${p.current*a} км жерде.`;break;
 }
 case'swimmer-lost-float-separation':{
  const upstream=(p.own-p.current)*p.minutes,drift=p.current*p.minutes,n=upstream+drift;a=`${n} м`;options=p.choices.map(x=>`${x} м`);
  s=`Жүзуші ағысқа қарсы жаттығып келе жатқанда шағын қалтқысы босап, сумен бірге төмен аға бастады. Ол мұны ${p.minutes} минуттан соң байқады. Жүзушінің тынық судағы жылдамдығы ${p.own} м/мин, ағыс ${p.current} м/мин. Сол сәтте жүзуші мен қалтқының арасы неше метр болды?`;
  z=`Жүзуші ағысқа қарсы (${p.own} − ${p.current}) × ${p.minutes} = ${upstream} м жылжыды. Қалтқы қарсы жаққа ${p.current} × ${p.minutes} = ${drift} м ақты. Екеуі екі жаққа кеткендіктен аралары ${upstream} + ${drift} = ${n} м. Салыстырмалы жылдамдық (${p.own} − ${p.current}) + ${p.current} = ${p.own}; ${p.own} × ${p.minutes} = ${n}.`;break;
 }
 case'river-lake-roundtrip-comparison':{
  const {down,up}=speed(p.own,p.current),river=div(p.distance,down)+div(p.distance,up),lake=2*div(p.distance,p.own),delta=river-lake;assert.ok(delta>0);a=`Өзенде ${delta} сағатқа ұзақ`;options=[`Көлде ${delta} сағатқа ұзақ`,'Екі уақыт тең',`Өзенде ${2*delta} сағатқа ұзақ`,a];
  s=`Бір қайықтың меншікті жылдамдығы ${p.own} км/сағ. Бірінші тәжірибеде ол ағысы ${p.current} км/сағ өзенде, екіншісінде ағынсыз көлде барып-қайтты. Әр тәжірибеде БІР БАҒЫТТАҒЫ жол ${p.distance} км, қайтар жол да ${p.distance} км. Тоқтау болған жоқ. Қай тәжірибе қанша сағатқа ұзақ?`;
  z=`Өзенде бару ${p.distance} : ${down} = ${div(p.distance,down)}, қайту ${p.distance} : ${up} = ${div(p.distance,up)} сағат; қосынды ${river}. Көлде екі бағыттың әрқайсысына ${p.distance} : ${p.own} = ${div(p.distance,p.own)} сағат, қосынды ${lake}. Айырма ${river} − ${lake} = ${delta} сағат, өзенде ұзақ. Ағысқа қарсы баяу қозғалысқа көбірек уақыт кететіндіктен, ағыстың көмегі мен кедергісі уақыт бойынша жай жойылмайды.`;break;
 }
 case'turn-before-origin-distance':{
  const out=(p.own+p.current)*p.downHours,back=(p.own-p.current)*p.upHours;assert.ok(out>back);a=out-back;
  s=`Қайық айлақтан ағыспен ${p.downHours} сағат жүріп, кейін кері бұрылып ағысқа қарсы ${p.upHours} сағат жүзді. Меншікті жылдамдығы ${p.own} км/сағ, ағыс ${p.current} км/сағ. Қайық қазір бастапқы айлақтан неше километр қашық?`;
  z=`Алғашқы жол (${p.own} + ${p.current}) × ${p.downHours} = ${out} км. Кері жүргені (${p.own} − ${p.current}) × ${p.upHours} = ${back} км. ${back} < ${out}, сондықтан айлаққа әлі жеткен жоқ. Айлақтан қашықтық ${out} − ${back} = ${a} км. Қосынды ${out+back} км бүкіл жүрген жол болар еді, бірақ ол сұралған шама емес.`;break;
 }
 case'groundspeed-ratio-to-own-ratio':{
  const ratio=div(p.downUpRatio+1,p.downUpRatio-1);a=`${ratio} есе`;options=p.choices.map(x=>`${x} есе`);
  s=`Қайықтың ағыспен жылдамдығы ағысқа қарсы жылдамдығының ${p.downUpRatio} есесіне тең. Меншікті жылдамдық пен ағыс тұрақты, қарсы жүзгенде қайық алға жылжиды. Меншікті жылдамдық ағыс жылдамдығының неше есесіне тең?`;
  z=`Қарсы жылдамдықты 1 бөлік десек, ағыспен ${p.downUpRatio} бөлік. Меншікті жылдамдық — қосындының жартысы, ағыс — айырманың жартысы. Олардың қатынасында бірдей 2 бөлгіші қысқарады: (${p.downUpRatio} + 1) : (${p.downUpRatio} − 1) = ${ratio}. Мысалы, ағыс 4, меншікті ${ratio*4} км/сағ болса, жылдамдықтар ${ratio*4+4} және ${ratio*4-4}; қатынасы ${p.downUpRatio}.`;break;
 }
 case'up-from-lake-down':{
  const current=p.down-p.own,up=p.own-current;speed(p.own,current);a=`${up} км/сағ`;options=p.choices.map(x=>`${x} км/сағ`);
  s=`Қайық ағынсыз көлде ${p.own} км/сағ, ал өзен ағысымен ${p.down} км/сағ жылдамдықпен жүзеді. Сол өзенде ағысқа қарсы жылдамдығын таңдаңдар.`;
  z=`Көлдегі ${p.own} км/сағ — меншікті жылдамдық. Ағыс ${p.down} − ${p.own} = ${current} км/сағ. Қарсы бағытта ${p.own} − ${current} = ${up} км/сағ. Тексеру: ${up} + ${current} = ${p.own}, ${p.own} + ${current} = ${p.down}. Ағыс жылдамдығын жауап қылмаймыз.`;break;
 }
 case'raft-distance-from-groundspeeds':{
  const current=div(p.down-p.up,2);assert.ok(current>0);a=current*p.hours;
  s=`Катер ағыспен ${p.down} км/сағ, қарсы бағытта ${p.up} км/сағ жылдамдықпен жүрді. Осы өзенге жіберілген моторсыз сал ${p.hours} сағатта неше километр ағады?`;
  z=`Ағыс екі нақты жылдамдықтың айырмасының жартысы: (${p.down} − ${p.up}) : 2 = ${current} км/сағ. Сал дәл осы жылдамдықпен жүреді. Жолы ${current} × ${p.hours} = ${a} км. Айырманы екіге бөлмей алу жолды да екі есе арттырып жіберер еді.`;break;
 }
 case'lake-speed-from-down-trip':{
  const down=div(p.distance,p.hours);a=down-p.current;assert.ok(a>p.current);
  s=`Байдарка ағысымен ${p.hours} сағатта ${p.distance} км жүреді. Өзен ағысы ${p.current} км/сағ. Байдарка ағынсыз көлде неше км/сағ жылдамдықпен жүзер еді?`;
  z=`Ағыспен нақты жылдамдық ${p.distance} : ${p.hours} = ${down} км/сағ. Көлде ағыс қосылмайды, сондықтан меншікті жылдамдық ${down} − ${p.current} = ${a} км/сағ. Тексеру: (${a} + ${p.current}) × ${p.hours} = ${p.distance}.`;break;
 }
 case'upstream-metres-from-minutes':{
  const up=p.own-p.current,perMinute=div(up*1000,60),n=perMinute*p.minutes;a=`${n} м`;options=p.choices.map(x=>`${x} м`);
  s=`Қайықтың меншікті жылдамдығы ${p.own} км/сағ, ағыс ${p.current} км/сағ. Қайық ағысқа қарсы ${p.minutes} минутта неше метр жүреді?`;
  z=`Қарсы жылдамдық ${p.own} − ${p.current} = ${up} км/сағ. Бір сағаттағы ${up*1000} метрді 60 минутқа бөлеміз: ${up*1000} : 60 = ${perMinute} м/мин. Жол ${perMinute} × ${p.minutes} = ${n} м. Шикі ${up} × ${p.minutes} көбейтіндісі бірліктері үйлеспегендіктен метр емес. Ағыспен есептеу басқа нәтиже береді.`;break;
 }
 case'staggered-raft-separation':{
  assert.ok(p.firstHour<p.secondHour&&p.secondHour<p.observeHour);const first=p.current*(p.observeHour-p.firstHour),second=p.current*(p.observeHour-p.secondHour),n=first-second;a=`${n} км`;options=p.choices.map(x=>`${x} км`);
  s=`Тұрақты ағысы ${p.current} км/сағ өзенде бір айлақтан бірінші сал ${clock(p.firstHour)}, екіншісі ${clock(p.secondHour)} уақытында жіберілді. Екеуі де ағыспен бірге жүреді. Сол күні ${clock(p.observeHour)} уақытында олардың арасы қанша километр болады?`;
  z=`Бірінші сал ${p.observeHour-p.firstHour} сағатта ${first} км, екіншісі ${p.observeHour-p.secondHour} сағатта ${second} км жүреді. Орындар айырмасы ${first} − ${second} = ${n} км. Екі салдың жылдамдығы бірдей, сондықтан аралары екінші сал шыққаннан кейін өзгермейді: ${p.current} × (${p.secondHour} − ${p.firstHour}) = ${n}.`;break;
 }
 case'lake-down-up-three-observations':{
  const own=div(p.lakeDistance,p.lakeHours),down=div(p.downDistance,p.downHours),current=down-own,up=own-current;speed(own,current);a=div(p.upDistance,up);
  s=`Қайық ағынсыз көлде ${p.lakeHours} сағатта ${p.lakeDistance} км жүрді. Өзенде ағыспен ${p.downHours} сағатта ${p.downDistance} км өтті. Меншікті жылдамдығы өзгермесе, осы өзенде ағысқа қарсы ${p.upDistance} км жолға неше сағат қажет?`;
  z=`Көлден меншікті жылдамдық ${p.lakeDistance} : ${p.lakeHours} = ${own} км/сағ. Өзенде ағыспен ${p.downDistance} : ${p.downHours} = ${down} км/сағ, демек ағыс ${down} − ${own} = ${current}. Қарсы жылдамдық ${own} − ${current} = ${up}. Уақыт ${p.upDistance} : ${up} = ${a} сағат. Тексеру: ${up} × ${a} = ${p.upDistance}.`;break;
 }
 case'maximum-returnable-excursion':{
  const {down,up}=speed(p.own,p.current),d=div(p.totalHours*down*up,down+up),out=div(d,up),back=div(d,down);a=`${d} км`;options=p.choices.map(x=>`${x} км`);
  s=`Топтың қайықпен сапарға барлығы ${p.totalHours} сағаты бар. Олар айлақтан ағысқа қарсы жүзіп, сол айлаққа ағыспен қайтуы тиіс; аялдамайды. Қайықтың меншікті жылдамдығы ${p.own} км/сағ, ағыс ${p.current} км/сағ. Айлақтан ең алыс неше километрге барып үлгереді?`;
  z=`Бару жылдамдығы ${up}, қайту жылдамдығы ${down} км/сағ. ${d} км қашықтыққа бару ${d} : ${up} = ${out}, қайту ${d} : ${down} = ${back} сағат; ${out} + ${back} = ${p.totalHours}. Осы қашықтықтан үлкен кез келген жол екі оң уақытты да арттырады, демек шектен асады. ${Math.min(...p.choices)} км жақынырақ болғандықтан аз уақыт алады, бірақ бар уақытты толық пайдаланбайды; ${p.choices.filter(x=>x>d).join(' және ')} км нұсқалары алысырақ болғандықтан уақыт шегінен асады. Сондықтан максимум ${d} км. Бару мен қайту уақыттары тең емес.`;break;
 }
 case'breakdown-drift-return':{
  const {down,up}=speed(p.own,p.current),out=up*p.upHours,drift=p.current*p.driftHours,remaining=out-drift;assert.ok(remaining>0);const back=div(remaining,down);a=p.upHours+p.driftHours+back;
  s=`Қайық бастапқы айлақтан ағысқа қарсы ${p.upHours} сағат жүрді. Моторы бұзылған соң ${p.driftHours} сағат бойы ескексіз, су ағысымен айлаққа қарай ақты. Жөнделгеннен кейін бірден ағыспен айлаққа оралды. Меншікті жылдамдығы ${p.own} км/сағ, ағыс ${p.current} км/сағ. Шыққаннан оралғанға дейін барлығы неше сағат өтті?`;
  z=`Алғаш айлақтан ұзағаны ${up} × ${p.upHours} = ${out} км. Ағып тұрған кезде айлаққа ${p.current} × ${p.driftHours} = ${drift} км жақындады, әлі ${out} − ${drift} = ${remaining} км қалды. Жөнделген қайық ағыспен ${down} км/сағ жүреді: қайту ${remaining} : ${down} = ${back} сағат. Барлығы ${p.upHours} + ${p.driftHours} + ${back} = ${a}. Тексеру: ${drift} + ${down} × ${back} = ${out}; ағып жүрген жолды алшақтау деп қосқан жоқпыз.`;break;
 }
 case'delayed-boat-catches-raft':{
  const head=p.current*p.delayHours,down=p.own+p.current,catchHours=div(head,p.own),meeting=down*catchHours;assert.equal(meeting,p.current*(p.delayHours+catchHours));a=meeting;
  s=`Сал айлақтан ағыспен жіберілді. ${p.delayHours} сағаттан кейін сол айлақтан оның соңынан моторлы қайық шықты. Ағыс ${p.current} км/сағ, қайықтың меншікті жылдамдығы ${p.own} км/сағ. Жылдамдықтар тұрақты. Қайық салды бастапқы айлақтан неше километр қашықтықта қуып жетеді?`;
  z=`Қайық шыққанда салдың алшақтығы ${p.current} × ${p.delayHours} = ${head} км. Қайық ағыспен ${down} км/сағ, сал ${p.current} км/сағ жүреді; жақындасу жылдамдығы ${down} − ${p.current} = ${p.own}. Қуып жетуге ${head} : ${p.own} = ${catchHours} сағат. Кездесу орны ${down} × ${catchHours} = ${meeting} км. Тексеру: сал ${p.current} × (${p.delayHours} + ${catchHours}) = ${meeting} км жерде. Сұралғаны қуып жету уақыты не бастапқы алшақтық емес.`;break;
 }
 default:throw Error('Unsupported saved river model '+kind);
 }
 assert.ok(s&&z);if(options){options=options.map(String);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===String(a)).length,1);}else{assert.match(String(a),/^\d+$/);s+=' Жауапқа тек санды жазыңыз.';}
 assert.ok(!/[\\$]/.test(s+z));return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const specs=new Map(SPECS.map(spec=>['grade5-river-'+spec.id,spec]));
export function renderEdition(row){const spec=specs.get(row.editionId);assert.ok(spec);assert.equal(row.modelId,'grade5-river-'+spec.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(spec.params));return render(spec.kind,row.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src);return{editionId:'grade5-river-'+spec.id,modelId:'grade5-river-'+spec.kind,grade:5,topic:'word',difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Барлық 47 бастапқы шарт, толық шешім және жауап нұсқалары жеке оқылды. Суға қатысты меншікті жылдамдық пен жағалауға қатысты нақты жылдамдық, сал мен моторлы қайық, тынық көл мен ағынды өзен ажыратылды.',
 'Әр дереккөзге жаңа сандармен қазақша редакция жасалды. Бірдей жолдың кері есептері, екі нысанның өзгеретін орындары, ағып жүрген уақыт, аялдама, минут-метр түрлендіруі, жалпы уақыт пен кездесу орнының айырмасы сақталды.',
 'Сандық редакциялар жаңа дербес математикалық мағына саны деп саналмайды. Барлық ашық жауап тек бүтін сан; шамалы не сөздік жауаптар MCQ арқылы. Ағысы тұрақты стандартты модель мен қарсы бағытта алға жүру шарты қолданылды.',spec.note
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(r=>[r.editionId,r]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const field of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan'])assert.equal(canonicalEdition(row[field]),canonicalEdition(e[field]));const r=renderEdition(row);for(const field of['statement','solution','options'])assert.equal(canonicalEdition(row[field]),canonicalEdition(r[field]),'Unbound river '+field);assert.equal(row.answer,r.answer);return{answer:r.answer,checks:['individual saved river-motion condition tied to fixed source-specific parameters','exact integer unit ledger and independent forward inverse checks','own versus ground speeds, passive drift, both moving positions and requested quantity retained','full native statement solution MCQ keys and metadata exact-bound','independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const row of editions)verifyEdition(row);const out={schemaVersion:1,scope:'All47 saved nonvisual grade5 topic2.10 sources individually rewritten offline. Numerical variants and model IDs are not independent semantic meanings. Awaiting independent content review.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-river.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
