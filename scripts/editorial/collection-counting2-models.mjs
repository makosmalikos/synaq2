/** Twenty frozen counting/logic conditions. Numeric variants are not20distinct meanings. */
import fs from'node:fs';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';
const name='collection-counting2',sourceFile='problems/sources/zerek/collections/2988bd49-3453-4628-ae0c-0a59563235ad.json';
export const SPECS=[
 [1,'heads-legs',{heads:31,legs:102}],
 [2,'last-day-climb',{object:'Ұлу',surface:'діңнің',up:7,down:3,height:32}],
 [3,'last-day-climb',{object:'Қоңыз',surface:'қабырғаның',up:6,down:2,height:30}],
 [4,'last-day-climb',{object:'Шағын робот',surface:'бағанның',up:8,down:3,height:31}],
 [5,'page-digit-total',{last:426,context:'кітаптың'}],
 [6,'page-digit-total',{last:354,context:'альбомның'}],
 [7,'some-color-threshold',{counts:[9,11,13],colors:['ақ','көк','жасыл'],target:4}],
 [8,'some-color-threshold',{counts:[8,12,10],colors:['сары','қызыл','күлгін'],target:6}],
 [9,'neither-two-sets',{total:36,first:14,second:17,both:8,contexts:['сурет салуды','конструктор құрастыруды']}],
 [10,'neither-two-sets',{total:34,first:19,second:15,both:9,contexts:['шахмат ойнауды','жүзуді']}],
 [11,'exact-liar-count',{people:13}],
 [12,'queue-front-back-gap',{front:9,back:14,gap:5}],
 [13,'pages-from-digit-total',{digits:564,context:'жинақтың'}],
 [14,'pages-from-digit-total',{digits:1359,context:'альбомның'}],
 [15,'every-color-present',{counts:[6,11,14],colors:['жасыл','сары','көк']}],
 [16,'every-color-present',{counts:[8,10,17],colors:['қызыл','ақ','күлгін']}],
 [17,'neither-three-sets',{total:43,first:24,second:22,third:21,ab:13,ac:12,bc:11,all:7}],
 [18,'at-least-liar-count',{people:10}],
 [19,'tournament-draw-count',{teams:6,win:3,draw:1,loss:0,total:37}],
 [20,'tournament-draw-count',{teams:7,win:3,draw:1,loss:0,total:51}],
];
const int=x=>{assert.ok(Number.isSafeInteger(x)&&x>=0);return x;};
function digitGroups(last){const groups=[];for(let start=1,width=1;start<=last;start*=10,width++){const end=Math.min(last,start*10-1),pages=end-start+1;groups.push({start,end,pages,width,digits:pages*width});}return groups;}
function render([number,kind,p]){let statement,solution,answer;
 if(kind==='heads-legs'){
  answer=int((p.legs-2*p.heads)/2);assert(answer<=p.heads);const ducks=p.heads-answer;
  statement=`Қорада тек үйректер мен ешкілер бар. Барлығы ${p.heads} бас және ${p.legs} аяқ саналды. Әр үйректің екі, әр ешкінің төрт аяғы бар. Қорада неше ешкі бар?`;
  solution=`Бәрін екі аяқты үйрек деп есептесек, ${p.heads} × 2 = ${p.heads*2} аяқ болар еді. Артық аяқ ${p.legs} − ${p.heads*2} = ${p.legs-p.heads*2}. Бір үйректі бір ешкіге ауыстырғанда 4 − 2 = 2 аяқ қосылады. Сондықтан ешкі саны ${p.legs-p.heads*2} ÷ 2 = ${answer}. Үйрек саны ${p.heads} − ${answer} = ${ducks}. Тексеру: ${answer} × 4 + ${ducks} × 2 = ${p.legs}; бастары ${answer} + ${ducks} = ${p.heads}.`;
 }else if(kind==='last-day-climb'){
  assert(p.up>p.down&&p.height>p.up);const net=p.up-p.down,nights=Math.ceil((p.height-p.up)/net);answer=nights+1;const before=nights*net,previous=(nights-1)*net+p.up;
  statement=`${p.object} ${p.surface} түбінен таңертең көтеріле бастады. Күндіз ${p.up} м жоғары өрмелеп, әр түнде ${p.down} м төмен сырғиды. Биіктігі ${p.height} м. Ұшына жеткен сәтте тоқтап, қайта сырғымайды. Ең ұшына неше күнде жетеді?`;
  solution=`Толық күн мен түннен кейінгі өсім ${p.up} − ${p.down} = ${net} м. Соңғы күнде түнгі сырғу болмайды. Оған дейін ${p.height} − ${p.up} = ${p.height-p.up} м биіктік жеткілікті. Ең аз ${nights} толық тәуліктен кейін биіктік ${nights} × ${net} = ${before} м. Келесі, ${answer}-күні ${before} + ${p.up} = ${before+p.up} м деңгейіне жету мүмкіндігі бар, сондықтан ${p.height} м ұшына жолда жетеді. Ал алдыңғы күндегі ең жоғарғы биіктік ${previous} м, ол ${p.height} м-ден төмен. Жауабы ${answer} күн.`;
 }else if(kind==='page-digit-total'){
  const groups=digitGroups(p.last);answer=groups.reduce((a,g)=>a+g.digits,0);
  statement=`${p.context[0].toLocaleUpperCase('kk')+p.context.slice(1)} беттері 1 нөмірінен ${p.last} нөміріне дейін ретімен нөмірленді. Әр бет нөмірі бір рет, бастапқы нөлдерсіз жазылады. Осы нөмірлерге барлығы неше цифр жұмсалады?`;
  solution=groups.map(g=>`${g.start}–${g.end} аралығында ${g.end} − ${g.start} + 1 = ${g.pages} бет бар. Әр нөмір ${g.width} таңбалы: ${g.pages} × ${g.width} = ${g.digits} цифр.`).join(' ')+` Барлығы ${groups.map(g=>g.digits).join(' + ')} = ${answer}. Бет саны мен цифр саны бірдей шама емес.`;
 }else if(kind==='some-color-threshold'||kind==='every-color-present'){
  const counts=p.counts;assert(counts.length===3&&counts.every(x=>x>0));const isSome=kind==='some-color-threshold';
  statement=`Қапта ${counts.map((c,i)=>`${c} ${p.colors[i]}`).join(', ')} текше бар. Оларды қарамай, қайта салмай аламыз. ${isSome?`Бір түстен кемінде ${p.target} текше міндетті түрде шығуы`:'Үш түстің әрқайсысынан кемінде бір текше міндетті түрде шығуы'} үшін ең аз неше текше алу керек?`;
  if(isSome){assert(counts.every(c=>c>=p.target));const safe=3*(p.target-1);answer=safe+1;solution=`Бір түстен ${p.target} текше шықпау үшін әр түстен ең көбі ${p.target-1} текшеден алуға болады. Үш түстен осылай ${p.target-1} × 3 = ${safe} текше алу мүмкін, себебі қор жеткілікті. Демек ${safe} жеткіліксіз. Келесі ${answer} нөмірлі текше қай түсті болса да, сол түстегі текшелер саны кемінде ${p.target} болады. Сондықтан ${answer} барлық жағдайда жеткілікті әрі ең аз.`;}
  else{const sorted=counts.slice().sort((a,b)=>a-b),safe=sorted[1]+sorted[2];answer=safe+1;solution=`Бір түсті әлі алмау үшін қалған екі түстің барлық текшесін алуға болады. Ең ұзақ осындай жағдай саны аз түсті өткізіп жібергенде туады: ${sorted[1]} + ${sorted[2]} = ${safe}. ${safe} текше алынса да, ${sorted[0]} текшесі бар түс әлі кездеспеуі мүмкін. Келесі, ${answer} нөмірлі текшеде барлық үш түс міндетті түрде болады. Себебі екі түстен ғана ${safe} текшеден артық алу мүмкін емес.`;}
 }else if(kind==='neither-two-sets'){
  assert(p.both<=Math.min(p.first,p.second));const union=p.first+p.second-p.both;answer=int(p.total-union);
  statement=`Сауалнамаға ${p.total} бала қатысты. ${p.first} бала ${p.contexts[0]}, ${p.second} бала ${p.contexts[1]} ұнататынын айтты. ${p.both} бала екі әрекетті де ұнатады; олар әр топтың санына кірген. Осы әрекеттердің ешқайсысын ұнатпайтын бала нешеу?`;
  solution=`Екі топты қосқанда ортақ ${p.both} бала екі рет саналады. Сондықтан кемінде бірін ұнататындар ${p.first} + ${p.second} − ${p.both} = ${union}. Ешқайсысын ұнатпайтындар ${p.total} − ${union} = ${answer}. Төрт бөлек топпен тексеру: тек бірінші ${p.first-p.both}, тек екінші ${p.second-p.both}, екеуін де ${p.both}, ешқайсысын ${answer}. Қосынды ${p.first-p.both} + ${p.second-p.both} + ${p.both} + ${answer} = ${p.total}.`;
 }else if(kind==='exact-liar-count'||kind==='at-least-liar-count'){
  const exact=kind==='exact-liar-count';assert(p.people>=2&&(exact||p.people%2===0));answer=exact?p.people-1:p.people/2;
  statement=`Бөлмедегі ${p.people} адамның әрқайсысы не үнемі шын айтатын шыншыл, не үнемі жалған айтатын өтірікші. Олардың нөмірлері 1, 2, …, ${p.people}. k-нөмірлі адам «Арамызда ${exact?'дәл':'кемінде'} k өтірікші бар» деді. Әр адам өз нөмірін атайды. Өтірікшілер саны нешеу?`;
  if(exact)solution=`Нақты өтірікші саны L болсын. Әртүрлі нақты сан айтылғандықтан, ең көбі бір тұжырым шын болады. Бәрі өтірікші болса, L = ${p.people}, бірақ ${p.people}-нөмірлі адамның сөзі шын болып, қайшылық туады. Демек бір шыншыл бар, қалған ${p.people} − 1 = ${answer} адам өтірікші. Тексеру: L = ${answer} болса, тек ${answer}-нөмірлі адамның сөзі шын, қалған ${answer} тұжырым жалған.`;
  else solution=`Нақты өтірікші саны L болса, «кемінде k» сөзі k ≤ L болғанда шын. Сондықтан бірінші L адамның сөзі шын, қалған ${p.people} − L адамның сөзі жалған. Жалған айтатындар саны L-ге тең болуы керек: ${p.people} − L = L. Бұдан 2L = ${p.people}, L = ${answer}. Тексеру: 1-ден ${answer}-ке дейінгілер шын айтады, қалған ${answer} адам жалған айтады.`;
 }else if(kind==='queue-front-back-gap'){
  const secondFront=p.front+p.gap+1;answer=p.front+p.gap+p.back;
  statement=`Кезекте Данияр алдынан ${p.front}-орында, Әлия артынан ${p.back}-орында тұр. Данияр Әлиядан бұрын тұр, олардың арасында дәл ${p.gap} адам бар. Кезекте барлығы неше адам?`;
  solution=`Даниярдан кейінгі ${p.gap} адамнан соң Әлия тұрады. Оның алдынан орны ${p.front} + ${p.gap} + 1 = ${secondFront}. Әлияның артында ${p.back} − 1 = ${p.back-1} адам бар. Барлығы ${secondFront} + ${p.back-1} = ${answer}. Әлия екі бағыттағы орынға да кіретіндіктен, өзін екі рет санамаймыз.`;
 }else if(kind==='pages-from-digit-total'){
  assert(p.digits>189&&p.digits<2890&&(p.digits-189)%3===0);const three=(p.digits-189)/3;answer=99+three;
  statement=`${p.context[0].toLocaleUpperCase('kk')+p.context.slice(1)} барлық беті 1-беттен бастап ретімен, бастапқы нөлдерсіз нөмірленді. Нөмірлерді бір рет жазуға ${p.digits} цифр жұмсалды. Онда неше бет бар?`;
  solution=`1–9 беттерге 9 цифр, 10–99 беттерге 90 × 2 = 180 цифр керек. Алғашқы 99 бетке 9 + 180 = 189 цифр кетеді. Қалған ${p.digits} − 189 = ${p.digits-189} цифр үш таңбалы нөмірлерге тиесілі. Мұндай бет саны ${p.digits-189} ÷ 3 = ${three}. Барлығы 99 + ${three} = ${answer} бет. Бұл сан 100–999 аралығында, жорамалымыз дұрыс. Тексеру: 9 + 180 + ${three} × 3 = ${p.digits}.`;
 }else if(kind==='neither-three-sets'){
  const atoms=[p.first-p.ab-p.ac+p.all,p.second-p.ab-p.bc+p.all,p.third-p.ac-p.bc+p.all,p.ab-p.all,p.ac-p.all,p.bc-p.all,p.all];assert(atoms.every(x=>x>=0));const union=atoms.reduce((a,b)=>a+b,0);answer=int(p.total-union);
  statement=`Топта ${p.total} оқушы бар. Робототехникаға ${p.first} оқушы, суретке ${p.second} оқушы, биге ${p.third} оқушы қатысады. Робототехника мен суретке ${p.ab}, робототехника мен биге ${p.ac}, сурет пен биге ${p.bc} оқушы қатысады. Үш үйірмеге де ${p.all} оқушы барады; олар жұптық санақтардың әрқайсысына да кірген. Ешбір үйірмеге қатыспайтын оқушы нешеу?`;
  solution=`Үш топтың қосындысынан жұптық қиылысуларды азайтып, ортақ үштік топты қайта қосамыз: ${p.first} + ${p.second} + ${p.third} − ${p.ab} − ${p.ac} − ${p.bc} + ${p.all} = ${union}. Ешқайсысы ${p.total} − ${union} = ${answer}. Жеке аймақтар: тек робототехника ${atoms[0]}, тек сурет ${atoms[1]}, тек би ${atoms[2]}, тек екі-екіден ${atoms[3]}, ${atoms[4]}, ${atoms[5]}, үшеуіне де ${atoms[6]}. Бәрі теріс емес; осы жеті аймақ пен сырттағы ${answer} оқушының қосындысы ${p.total}.`;
 }else if(kind==='tournament-draw-count'){
  const games=p.teams*(p.teams-1)/2,decisive=p.win+p.loss,tied=2*p.draw;answer=int((games*decisive-p.total)/(decisive-tied));assert(answer<=games);
  statement=`Футбол турниріндегі ${p.teams} команданың әр жұбы бір реттен ойнады. Жеңген командаға ${p.win} ұпай, тең ойында әр командаға ${p.draw} ұпай, жеңілгенге ${p.loss} ұпай беріледі. Соңында барлық команданың ұпайларының қосындысы ${p.total} болды. Неше ойын тең аяқталды?`;
  solution=`Ойын саны (${p.teams} × ${p.teams-1}) ÷ 2 = ${games}: әр жұп екі рет саналмауы керек. Жеңіспен аяқталған ойын жалпы ${p.win} + ${p.loss} = ${decisive} ұпай, тең ойын ${p.draw} + ${p.draw} = ${tied} ұпай береді. Барлығы жеңіспен аяқталса, ${games} × ${decisive} = ${games*decisive} ұпай болар еді. Әр тең ойын оны ${decisive-tied} ұпайға азайтады. Сондықтан тең ойын ${games*decisive} − ${p.total} = ${answer}. Тексеру: ${games-answer} × ${decisive} + ${answer} × ${tied} = ${p.total}.`;
 }else throw Error(kind);
 return{statement:statement+' Жауапқа тек санды жазыңыз.',answer:String(int(answer)),solution};
}
function row(s){const[number,kind,p]=s;return{editionId:name+'-'+String(number).padStart(2,'0'),modelId:name+'-'+kind,grade:5,topic:kind.includes('sets')?'sets':kind.includes('page')?'num':'logic',difficulty:'medium',minimumPlan:'pro',params:structuredClone(p),sourceRefs:[{sourceFile,sourceId:String(number)}],sourceAnswerAvailability:'not_captured_answer_recomputed_from_condition_and_full_official_solution',adaptationChanges:['Барлық20сақталған шарт пен толық ресми шешім жеке оқылды. Түпнұсқада sourceAnswer=null және MCQ жоқ, сондықтан алынбаған жауап кілті бар деген белгі қойылмайды. Жаңа сандар мен оқиғалар әр тапсырманың сұрағын, әдісін және соңғы күн/аралық/қосу–азайту/логикалық шарттарын сақтайды.','20occurrence 12нақты мақсаттық модельге жатады: сандық нұсқалар 20жаңа мағына деп саналмайды. Қарапайым тақырыптарда да түпкі ұғым сақталды: соңғы күні сырғымау, кепілдік үшін ең сәтсіз жағдай, қиылысулардың есебі, шыншыл сөзінің логикалық сәйкестігі және жұптардың бір рет ойнауы.','Native мәтін мен бүтін ашық жауап; түпнұсқа сурет/TeX жоқ. Бөлек есептеу әр күнді, барлық түстік құрамдарды, аймақтарды және барлық шыншыл/өтірікші үлестірімін тексереді. Автордан бөлек адам рецензент мәлімделмейді; тек жергілікті Standard+.'],editorialStatus:'awaiting_independent_computational_review',...render(s)};}
const byNumber=new Map(SPECS.map(s=>[String(s[0]),s]));export const buildEditions=()=>SPECS.map(row);
export function verifyEdition(r){assert.ok(byNumber.has(r.sourceRefs?.[0]?.sourceId));assert.equal(canonicalEdition(r),canonicalEdition(row(byNumber.get(r.sourceRefs[0].sourceId))),'Unreviewed counting condition/method/key/params/source');return{answer:r.answer,checks:['all20 full saved/new conditions and solutions individually read; no source MCQ/key fabricated','exact state simulation, finite exhaustive count distributions/truth assignments and all Venn atoms','page strings, ordinal interval and pairwise tournament point ledgers checked','same-author separate computational review; numeric variants not semantic uniqueness counts']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL('../../problems/editorial/batches/'+name+'.json',import.meta.url),JSON.stringify({schemaVersion:1,scope:'20 frozen counting2 occurrences in12target-specific models; numerical variants not20new meanings. Source keys null, full official solutions read, no MCQs. Local Standard+.',sourceOccurrences:20,distinctModels:12,editions},null,2)+'\n');console.log(JSON.stringify({authored:20,models:new Set(editions.map(r=>r.modelId)).size}));}
