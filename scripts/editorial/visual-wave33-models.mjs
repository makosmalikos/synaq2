import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const kind=q=>q.modelId.replace('visual-wave33-','');
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i);
const sum=ns=>ns.reduce((a,b)=>a+b,0);
const divide=(a,b)=>{assert.ok(a>=0&&Number.isSafeInteger(a)&&b>0&&Number.isSafeInteger(b)&&a%b===0,'Exact nonnegative quotient');return a/b;};
export const divisors=n=>range(1,n).filter(d=>n%d===0);
export function sieveState(p){
 const primes=range(2,p.limit).filter(n=>divisors(n).length===2);assert.deepEqual(p.processed,primes.slice(0,p.processed.length));
 const crossed=range(1,p.limit).filter(n=>n===1||p.processed.some(d=>n!==d&&n%d===0));
 const next=range(p.processed.at(-1)+1,p.limit).find(n=>!crossed.includes(n));assert.ok(next);return {crossed,next};
}
export function independentlyCalculate(q){
 const p=q.params,validate=v=>{if(Array.isArray(v)){assert.ok(v.length,'Nonempty parameter list');v.forEach(validate);}else if(typeof v==='number')assert.ok(Number.isSafeInteger(v)&&v>0,'Positive integer parameter');};Object.values(p).forEach(validate);let answer,checks;
 switch(kind(q)){
  case 'next-prime-sieve-step':{assert.equal(p.rows*p.columns,p.limit);checks=sieveState(p);answer=String(checks.next);break;}
  case 'prime-candy-grouping':{assert.ok(p.rowCounts.every(n=>Number.isInteger(n)&&n>0));const total=sum(p.rowCounts),ds=divisors(total);assert.equal(ds.length,2,'No nontrivial prime factor pair');answer='Жоқ, '+total+' — жай сан';checks={total,divisors:ds,nontrivialPairs:[]};break;}
  case 'divide-box-product':{const quotient=divide(p.perBox,p.children);answer=String(p.boxes*quotient);checks={factorQuotient:quotient,total:p.boxes*p.perBox};break;}
  case 'divide-split-sum':{assert.equal(p.amounts.length,2);const portions=p.amounts.map(n=>divide(n,p.perPacket));answer=String(sum(portions));checks={portions,total:sum(p.amounts)};break;}
  case 'divide-two-box-products':{assert.equal(p.groups.length,2);assert.ok(p.groups.every(r=>r.length===2));const parts=p.groups.map(([count,inside])=>count*divide(inside,p.perPacket));answer=String(sum(parts));checks={parts,total:sum(p.groups.map(([n,v])=>n*v))};break;}
  case 'divide-complement-difference':{assert.ok(p.total>p.known);const whole=divide(p.total,p.groups),known=divide(p.known,p.groups);answer=String(whole-known);checks={wholeQuotient:whole,knownQuotient:known,complement:p.total-p.known};break;}
  case 'divide-repeated-withdrawal':{const taken=p.withdrawals*p.each;assert.ok(p.total>taken);answer=String(divide(p.total,p.canister)-p.withdrawals*divide(p.each,p.canister));checks={taken,remaining:p.total-taken,totalCanisters:p.total/p.canister,takenCanisters:taken/p.canister};break;}
  case 'sum-two-residue-diagrams':{assert.equal(p.remainders.length,2);assert.ok(p.remainders.every(r=>Number.isInteger(r)&&r>0&&r<p.divisor));const residues=sum(p.remainders);answer=String(residues%p.divisor);checks={residueSum:residues,extraGroups:Math.floor(residues/p.divisor),validRange:[0,p.divisor-1]};break;}
  case 'sequence-residue-invariant':{assert.ok(p.query>4&&p.step%p.divisor===0);const known=range(0,3).map(i=>p.first+i*p.step),term=p.first+(p.query-1)*p.step;answer=String(term%p.divisor);checks={known,term,increments:p.query-1,invariant:p.first%p.divisor};break;}
  case 'same-remainder-new-books':{assert.ok(p.remainder<p.bundle);const good=q.options.map(Number).filter(n=>Number.isInteger(n)&&n>0&&n%p.bundle===0);assert.equal(good.length,1);answer=String(good[0]);checks={choiceRemainders:q.options.map(n=>+n%p.bundle),witnessBefore:p.bundle*6+p.remainder,witnessAfter:p.bundle*6+p.remainder+good[0]};break;}
  default:throw Error('Known pictured divisibility target');
 }
 return {answer,checks};
}
function core(q){const p=q.params;switch(kind(q)){
 case 'next-prime-sieve-step':return 'Эратосфен елегінің бірнеше қадамы суретте көрсетілген. Көк ұяшықтар — еселіктері тексеріліп болған жай сандар; қызыл сызық түскен сандар алынып тасталған. Енді сызылмаған келесі жай санды таңдап, оның өзінен басқа еселіктерін сызамыз. Қай санның кезегі келді?';
 case 'prime-candy-grouping':return 'Суреттегі кәмпиттердің бәрін қалдықсыз, бірдей мөлшерден қораптарға салу керек. Қорап саны бірден көп, әр қораптағы кәмпит саны да бірден көп болсын. Осындай бөлу мүмкін бе? Дұрыс тұжырымды таңдаңыз.';
 case 'divide-box-product':return 'Барлық қалам қорабы суретте берілген, әрқайсысының ішіндегі қалам саны үстіне жазылған. Қаламдарды '+p.children+' оқушыға тең бөліп берсе, әр оқушы неше қалам алады?';
 case 'divide-split-sum':return 'Көк бөлік — бірінші себеттегі, сары бөлік — екінші себеттегі алма саны. Барлық алманы '+p.perPacket+' алмадан пакеттерге салды. Неше толық пакет шықты?';
 case 'divide-two-box-products':return 'Суреттегі жәшіктердің бәрінде жұмыртқа бар. Әр жәшіктегі саны үстінде жазылған. Барлық жұмыртқаны '+p.perPacket+' жұмыртқадан шағын қораптарға салды. Неше қорап толды?';
 case 'divide-complement-difference':return 'Сызбадағы барлық оқушы екі үйірмеге бөлінген, әр бала тек біреуіне қатысады. Көк бөлік — хор, сары бөлік — би. Би үйірмесін '+p.groups+' тең топқа бөлсе, әр топта неше оқушы болады?';
 case 'divide-repeated-withdrawal':return 'Цистернадағы бастапқы сүт көлемі сызбаның үстінде берілген. Әр көк бөлік — бір рет құйып алынған сүт. Қалғанын '+p.canister+' литрлік бидондарға толық құйғанда, неше бидон толады?';
 case 'sum-two-residue-diagrams':return 'Әр көк тіктөртбұрыш '+p.divisor+' бірліктен құралған толық топты білдіреді, көп нүкте осындай топтардың жалғасын көрсетеді. Қызыл дөңгелектің әрқайсысы — бір қалған бірлік. Суреттегі a + b қосындысын '+p.divisor+' санына бөлгендегі қалдықты табыңыз.';
 case 'sequence-residue-invariant':return 'Координаталық сәуледе тізбектің алғашқы төрт мүшесі белгіленген. Әр келесі мүше алдыңғысынан '+p.step+' санына артық. Осы ережемен '+p.query+'-мүшені '+p.divisor+' санына бөлгенде қандай қалдық шығады?';
 case 'same-remainder-new-books':return 'Суретте кітаптарды бірдей бумаларға бөлудің бастапқы нәтижесі берілген. Әр буманың кітап саны үстінде жазылған; көп нүкте басқа осындай бумаларды білдіреді. Келесі күні жаңа кітаптар қосылған соң бәрін қайтадан '+p.bundle+' кітаптан бумаға бөлгенде, тағы да дәл '+p.remainder+' кітап артылды. Жаңа әкелінген кітап саны қай нұсқа болуы мүмкін?';
 default:throw Error('Known condition');}}
export const statementFor=q=>core(q)+(q.options?'':' Жауапқа тек санды жазыңыз.');
export function solutionFor(q){const p=q.params,{answer,checks:c}=independentlyCalculate(q);switch(kind(q)){
 case 'next-prime-sieve-step':return 'Көкпен '+p.processed.join(' және ')+' жай сандары белгіленген. Олардың өздерінен басқа еселіктері сызылған, 1 де жай сан болмағандықтан алынып тасталған. '+p.processed.at(-1)+' санынан кейінгі сызылмаған ең кіші сан '+answer+'. Оның 1 мен өзінен басқа бөлгіші жоқ. Енді осы '+answer+' санының өзінен басқа еселіктерін сызамыз; сызылып қойған құрамаларға қайта қадам бастамаймыз.';
 case 'prime-candy-grouping':return 'Қатарлардағы кәмпит сандары '+p.rowCounts.join(' + ')+' = '+c.total+'. Тең бөлу үшін қорап саны '+c.total+' санының бөлгіші болуы керек. Толық бөлгіштер тізімі '+c.divisors.join(', ')+': бұл жай сан. Бір қорап алуға болмайды; '+c.total+' қорапқа бөлсек әрқайсысында бір кәмпит қалады, ол да шартқа сай емес. Екі көбейткіші де бірден үлкен жұп жоқ. Сондықтан бөлу мүмкін емес.';
 case 'divide-box-product':return 'Суретте '+p.boxes+' қорап, әрқайсысында '+p.perBox+' қалам. ('+p.boxes+' × '+p.perBox+') : '+p.children+' = '+p.boxes+' × ('+p.perBox+' : '+p.children+') = '+p.boxes+' × '+c.factorQuotient+' = '+answer+'. Бір көбейткішті бөлгенде жеткілікті, екі көбейткішті қатар бөлмейміз. Тексеру: '+c.total+' : '+p.children+' = '+answer+'.';
 case 'divide-split-sum':return 'Себеттерде '+p.amounts.join(' және ')+' алма. Қосындыны бөлек бөлеміз: ('+p.amounts.join(' + ')+') : '+p.perPacket+' = '+p.amounts.map(n=>n+' : '+p.perPacket).join(' + ')+' = '+c.portions.join(' + ')+' = '+answer+'. Екі қосылғыш та '+p.perPacket+' санына бөлінеді. Тексеру: '+c.total+' : '+p.perPacket+' = '+answer+'.';
 case 'divide-two-box-products':return 'Бірінші қатарда '+p.groups[0][0]+' жәшік, әрқайсысы '+p.groups[0][1]+' жұмыртқадан; екіншісінде '+p.groups[1][0]+' жәшік, әрқайсысы '+p.groups[1][1]+' жұмыртқадан. ('+p.groups.map(([n,v])=>n+' × '+v).join(' + ')+') : '+p.perPacket+' = '+p.groups.map(([n,v])=>n+' × ('+v+' : '+p.perPacket+')').join(' + ')+' = '+c.parts.join(' + ')+' = '+answer+'. Тексеру: барлығы '+c.total+' жұмыртқа; '+c.total+' : '+p.perPacket+' = '+answer+'.';
 case 'divide-complement-difference':return 'Барлығы '+p.total+' оқушы, хорда '+p.known+', сондықтан биде '+p.total+' − '+p.known+' = '+c.complement+'. Айырманы бөлу қасиеті: ('+p.total+' − '+p.known+') : '+p.groups+' = '+p.total+' : '+p.groups+' − '+p.known+' : '+p.groups+' = '+c.wholeQuotient+' − '+c.knownQuotient+' = '+answer+'. Тексеру: '+p.groups+' × '+answer+' = '+c.complement+'.';
 case 'divide-repeated-withdrawal':return 'Сызбада '+p.withdrawals+' көк бөлік, әрқайсысы '+p.each+' л. Алынғаны '+p.withdrawals+' × '+p.each+' = '+c.taken+' л. Қалғаны '+p.total+' − '+c.taken+' = '+c.remaining+' л. Бидон саны ('+p.total+' − '+p.withdrawals+' × '+p.each+') : '+p.canister+' = '+c.totalCanisters+' − '+c.takenCanisters+' = '+answer+'. Көбейтіндіні бөлгенде '+p.each+' : '+p.canister+' жеткілікті; алу саны '+p.withdrawals+' қайта бөлінбейді.';
 case 'sum-two-residue-diagrams':return 'Суреттегі толық топтар '+p.divisor+' санына бөлінеді. Қалған бірліктер a үшін '+p.remainders[0]+', b үшін '+p.remainders[1]+'. Олардың қосындысы '+p.remainders.join(' + ')+' = '+c.residueSum+'. '+c.residueSum+' = '+p.divisor+' × '+c.extraGroups+' + '+answer+', сондықтан қалдық '+answer+'. Ол 0 мен '+(p.divisor-1)+' аралығында. '+c.residueSum+' санын сол күйі қалдық деуге болмайды: одан тағы толық топ құралады.';
 case 'sequence-residue-invariant':return 'Көрсетілген мүшелер '+c.known.join(', ')+'. '+p.query+'-мүшеге дейін '+c.increments+' өсім бар: '+p.first+' + '+p.step+' × '+c.increments+' = '+c.term+'. '+p.step+' саны '+p.divisor+' санына бөлінетіндіктен, өсімдер қалдықты өзгертпейді. Бірінші мүшенің қалдығы '+p.first+' : '+p.divisor+' амалында '+c.invariant+', демек сұралған қалдық '+answer+'. Тексеру: '+c.term+' = '+p.divisor+' × '+Math.floor(c.term/p.divisor)+' + '+answer+'.';
 case 'same-remainder-new-books':return 'Бастапқыда да, кейін де '+p.remainder+' кітап артық. Екі жалпы саннан осы қалдықты алып тастасақ, екеуі де '+p.bundle+' санына бөлінеді. Сондықтан олардың айырмасы, яғни жаңа кітап саны '+p.bundle+' санына еселік болуы керек. Нұсқалардың қалдықтары: '+q.options.map((v,i)=>v+' → '+c.choiceRemainders[i]).join('; ')+'. Тек '+answer+' = '+p.bundle+' × '+(+answer/p.bundle)+' жарайды. Мысалы, бастапқы сан '+c.witnessBefore+' болса, кейін '+c.witnessAfter+'; екеуін '+p.bundle+' санына бөлгенде де қалдық '+p.remainder+'.';
 default:throw Error('Known solution');}}
export function descriptionFor(q){const p=q.params;switch(p.scene){
 case 'sieve':return '1-ден '+p.limit+'-ге дейін '+p.rows+' қатар '+p.columns+' баған кесте. '+p.processed.join(', ')+' ұяшықтары көк. 1 және олардың өздерінен басқа еселіктері қызыл сызықпен сызылған; қалған сандар сызылмаған.';
 case 'candies':return 'Қатарлардағы кәмпит саны: '+p.rowCounts.join(', ')+'. Әр кәмпит жеке салынған.';
 case 'pen-boxes':return p.boxes+' жабық қалам қорабы, әрқайсысының үстінде '+p.perBox+' саны бар.';
 case 'sum-bar':return 'Бірінші көк бөлікте '+p.amounts[0]+', екінші сары бөлікте '+p.amounts[1]+' алма жазылған. Ортақ толық саны берілмеген.';
 case 'egg-boxes':return p.groups.map(([n,v])=>n+' жәшік, әрқайсысының үстінде '+v+' саны').join('; ')+'.';
 case 'club-bar':return 'Бүтін кесінді '+p.total+' оқушы; көк бөлікте '+p.known+' оқушы, сары бөлікте сұрақ белгісі. Бөліктер бір-бірін қайталамайды.';
 case 'milk-bar':return 'Бүтін кесінді '+p.total+' л; '+p.withdrawals+' көк бөліктің әрқайсысында '+p.each+' л жазылған. Қалған бөлікте сұрақ белгісі.';
 case 'residue-groups':return 'a және b жолдарында '+p.divisor+' бірліктен толық көк топтар мен жалғасуды білдіретін көп нүкте бар; соңында тиісінше '+p.remainders.join(' және ')+' қызыл жеке дөңгелек.';
 case 'sequence-ray':return 'Координаталық сәуледе 0 нүктесі және '+range(0,3).map(i=>p.first+i*p.step).join(', ')+' тізбек мүшелері бар; көрші мүшелердің үстінде +'+p.step+' қадамдары жазылған.';
 case 'books':return 'Әрқайсысы '+p.bundle+' кітаптан үш көрсетілген бума, арада басқа бумаларды білдіретін көп нүкте; соңында '+p.remainder+' жеке кітап бар.';
 default:throw Error('Known diagram');}}
export function svgFor(q){const p=q.params,ink='#203549';let b='';
 const text=(x,y,t,size=25,extra='')=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" fill="'+ink+'" font-size="'+size+'" '+extra+'>'+esc(t)+'</text>';
 const line=(a,z,extra='',color=ink,width=1.6)=>'<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+z[0]+'" y2="'+z[1]+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
 const rect=(x,y,w,h,fill,extra='')=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+fill+'" stroke="'+ink+'" stroke-width="1.5" '+extra+'/>';
 const box=(x,y,value,extra='')=>'<g '+extra+'>'+rect(x,y,46,57,'#e5eeff')+line([x,y+16],[x+46,y+16])+text(x+23,y+43,value,25)+'</g>';
 const bracket=(x1,x2,y,t)=>line([x1,y],[x2,y])+line([x1,y-5],[x1,y+5])+line([x2,y-5],[x2,y+5])+text((x1+x2)/2,y-15,t,25);
 if(p.scene==='sieve'){
  const {crossed}=sieveState(p),cell=47,left=75,top=37;
  for(let n=1;n<=p.limit;n++){const x=left+((n-1)%p.columns)*cell,y=top+Math.floor((n-1)/p.columns)*cell;b+=rect(x,y,cell,cell,p.processed.includes(n)?'#dce9ff':'#fff','data-sieve-number="'+n+'"')+text(x+cell/2,y+32,n,25);if(crossed.includes(n))b+=line([x+8,y+cell-9],[x+cell-8,y+8],'data-crossed="'+n+'"','#d86559',2.2);}
 }else if(p.scene==='candies'){
  for(const [r,count]of p.rowCounts.entries())for(let c=0;c<count;c++){const x=72+c*42,y=76+r*45;b+='<g data-candy="'+r+','+c+'"><path d="M '+(x-13)+' '+y+' L '+(x-20)+' '+(y-8)+' L '+(x-20)+' '+(y+8)+' Z M '+(x+13)+' '+y+' L '+(x+20)+' '+(y-8)+' L '+(x+20)+' '+(y+8)+' Z" fill="#e9ad64" stroke="#a7713e" stroke-width="1.2"/><ellipse cx="'+x+'" cy="'+y+'" rx="13" ry="10" fill="#f8d38f" stroke="#a7713e" stroke-width="1.4"/></g>';}
 }else if(p.scene==='pen-boxes'){
  for(let i=0;i<p.boxes;i++)b+=box(101+(i%3)*118,93+Math.floor(i/3)*128,p.perBox,'data-pen-box="'+i+'"');
 }else if(p.scene==='egg-boxes'){
  for(const [r,[count,value]]of p.groups.entries())for(let i=0;i<count;i++)b+=box(65+i*59,100+r*130,value,'data-egg-row="'+r+'" data-box="'+i+'"');
 }else if(p.scene==='sum-bar'){
  let x=93;for(const [i,value]of p.amounts.entries()){const w=value*3;b+=rect(x,146,w,68,i?'#f9d57a':'#8eb3ef','data-part="'+i+'"')+text(x+w/2,189,value,27);x+=w;}
 }else if(p.scene==='club-bar'){
  const x=90,y=152,scale=300/p.total,known=p.known*scale;b+=bracket(x,x+300,116,p.total)+rect(x,y,known,70,'#8eb3ef','data-known="'+p.known+'"')+rect(x+known,y,300-known,70,'#f9d57a','data-unknown="complement"')+text(x+known/2,y+45,p.known,27)+text(x+known+(300-known)/2,y+45,'?',29);
 }else if(p.scene==='milk-bar'){
  const x=60,y=152,scale=360/p.total,each=p.each*scale;b+=bracket(x,x+360,116,p.total+' л');for(let i=0;i<p.withdrawals;i++)b+=rect(x+i*each,y,each,70,'#8eb3ef','data-withdrawal="'+i+'"')+text(x+(i+.5)*each,y+45,p.each,22);const used=p.withdrawals*each;b+=rect(x+used,y,360-used,70,'#f7f9fd','data-remaining="unknown"')+text(x+used+(360-used)/2,y+45,'?',29);
 }else if(p.scene==='residue-groups'){
  for(let row=0;row<2;row++){const y=103+row*129;b+=text(27,y+28,row?'b =':'a =',24);for(const x of [64,113,213])b+=rect(x,y,40,40,'#8eb3ef')+text(x+20,y+28,p.divisor,25);b+=text(182,y+28,'…',29);for(let i=0;i<p.remainders[row];i++)b+='<circle data-residue-row="'+row+'" cx="'+(284+i*22)+'" cy="'+(y+20)+'" r="7" fill="#e67f73" stroke="'+ink+'" stroke-width="1.1"/>';}
 }else if(p.scene==='sequence-ray'){
  const x0=45,y=194,scale=11;b+=line([x0,y],[455,y])+line([455,y],[444,y-7])+line([455,y],[444,y+7])+line([x0,y-9],[x0,y+9])+text(x0,y+43,0,25);
  for(let i=0;i<4;i++){const value=p.first+i*p.step,x=x0+value*scale;b+='<circle data-term="'+(i+1)+'" data-value="'+value+'" cx="'+x+'" cy="'+y+'" r="5" fill="#315ce8"/>'+text(x,y+43,value,27);if(i<3){const z=x+p.step*scale;b+='<path data-step="'+i+'" d="M '+x+' 158 Q '+((x+z)/2)+' 126 '+z+' 158" fill="none" stroke="#5682df" stroke-width="1.8"/>'+line([z,158],[z-11,158],'','#5682df',1.8)+line([z,158],[z-5,148],'','#5682df',1.8)+text((x+z)/2,133,'+'+p.step,23);}}
 }else if(p.scene==='books'){
  for(const [i,x]of [61,137,270].entries()){for(let j=0;j<p.bundle;j++)b+=rect(x,243-j*7,48,7,j%2?'#8eb3ef':'#b9cdef','data-bundle="'+i+'" data-book="'+j+'"');b+=line([x+24,250-p.bundle*7],[x+24,250],'','#bc8c42',3)+text(x+24,238-p.bundle*7,p.bundle,27);}b+=text(222,219,'…',31);for(let i=0;i<p.remainder;i++)b+=rect(350+i*23,178,14,72,i%2?'#f9d57a':'#8eb3ef','data-loose-book="'+i+'"');
 }else throw Error('Known native scene');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-labelledby="title desc"><title id="title">Жай сандар мен бөлінгіштік</title><desc id="desc">'+esc(descriptionFor(q))+'</desc><rect width="480" height="360" rx="18" fill="#fff"/><g font-family="Arial,sans-serif" stroke-linecap="round" stroke-linejoin="round">'+b+'</g></svg>';
}
export function verifyEdition(q){const r=independentlyCalculate(q);assert.equal(q.answer,r.answer,'Independent prime/divisibility visual target');assert.equal(q.statement,statementFor(q));assert.equal(q.solution,solutionFor(q));assert.equal(q.figureDescription,descriptionFor(q));assert.equal(q.figureSha256,sha(svgFor(q)));if(q.options){assert.equal(q.options.length,new Set(q.options).size);assert.equal(q.options.filter(v=>v===r.answer).length,1);}return {answer:r.answer,checks:Object.entries(r.checks).map(([k,v])=>k+': '+JSON.stringify(v))};}
