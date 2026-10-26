// Native statistics and enumeration visuals; bars/dots/tree paths bind exact data.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const prefix='visual-wave11-',kind=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
export function permutations(tokens){if(!tokens.length)return [''];return tokens.flatMap((t,i)=>permutations(tokens.filter((_,j)=>j!==i)).map(s=>t+s));}
export function diagonals(n){assert.ok(Number.isInteger(n)&&n>=4);const pairs=[];for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)if(b-a!==1&&!(a===0&&b===n-1))pairs.push([a,b]);return pairs;}
export function independentlyCalculate(q){
 const p=q.params,k=kind(q);let answer,checks;
 if(p.scene==='bars'){const vals=p.values||p.frequencies;assert.equal(vals.length,p.categories.length);assert.ok(vals.every(v=>Number.isSafeInteger(v)&&v>=0&&v<=p.max));assert.ok(p.step>0&&p.labelEvery>0&&p.max%p.step===0);}
 if(p.scene==='dots'){assert.equal(p.categories.length,p.frequencies.length);assert.ok(p.frequencies.every(v=>Number.isInteger(v)&&v>=0&&v<=8));}
 switch(k){
 case 'axis-mean':{const sum=p.first+p.second;assert.ok(Number.isInteger(sum/2));answer=String(sum/2);checks={sum,halfDistance:(p.second-p.first)/2};break;}
 case 'scaled-bar-mean':
 case 'unit-bar-mean':{const sum=p.values.reduce((s,v)=>s+v,0);assert.equal(sum%p.values.length,0);answer=String(sum/p.values.length);checks={sum,count:p.values.length};break;}
 case 'bar-frequency-mode':
 case 'dot-frequency-mode':{const max=Math.max(...p.frequencies),idx=p.frequencies.map((v,i)=>v===max?i:null).filter(i=>i!==null);assert.equal(idx.length,1,'Unique mode');answer=String(p.categories[idx[0]]);checks={maxFrequency:max,total:p.frequencies.reduce((s,n)=>s+n,0)};assert.notEqual(String(max),answer,'Preserve value-versus-frequency distinction');break;}
 case 'bar-range':{const min=Math.min(...p.values),max=Math.max(...p.values);answer=String(max-min);checks={min,max};break;}
 case 'odd-card-median':{assert.equal(p.values.length%2,1);const ordered=[...p.values].sort((a,b)=>a-b);answer=String(ordered[Math.floor(ordered.length/2)]);checks={ordered};assert.notEqual(p.values[Math.floor(p.values.length/2)],Number(answer),'Physical middle must not accidentally reveal median');break;}
 case 'polygon-diagonals':{assert.equal(p.labels.length,p.polygon.length);assert.equal(p.polygon.length,6,'This authored model depicts a hexagon');const pairs=diagonals(p.labels.length);answer=String(pairs.length);checks={pairs:pairs.map(([a,b])=>p.labels[a]+p.labels[b])};break;}
 case 'missing-permutation':{assert.equal(p.tokens.length,3);assert.equal(new Set(p.tokens).size,3);const all=permutations(p.tokens);assert.equal(new Set(p.paths).size,p.paths.length);assert.ok(p.paths.every(s=>all.includes(s)));const absent=all.filter(s=>!p.paths.includes(s));assert.equal(absent.length,1);answer=absent[0];checks={all,displayed:p.paths};break;}
 case 'unequal-menu-tree':{const counts=p.branches.map(r=>r.leaves.length);assert.ok(counts.some(v=>v!==counts[0]),'Unequal allowed branch counts');assert.equal(new Set(p.branches.flatMap(r=>r.leaves.map(v=>r.label+v))).size,counts.reduce((s,n)=>s+n,0));answer=String(counts.reduce((s,n)=>s+n,0));checks={counts};break;}
 default:throw Error('Known statistics model '+k);
 }
 return {answer,checks};
}
function core(q){
 const p=q.params;
 switch(kind(q)){
 case 'axis-mean':return 'Сандық түзуде A және B нүктелері көрсетілген. Олардың координаталарының арифметикалық ортасын таңдаңыз.';
 case 'scaled-bar-mean':return 'Үйірме төрт күн бойы ашықхат дайындады. Диаграммадағы бір көлденең жолақ '+p.step+' ашықхатқа тең, астындағы сандар — күндер. Бір күнде орта есеппен неше ашықхат дайындалған?';
 case 'unit-bar-mean':return 'Бес оқушының бір аптада шешкен есептерінің саны диаграммада берілген. Төмендегі 1–5 — оқушылардың реттік нөмірлері. Бір оқушы орта есеппен неше есеп шешкен?';
 case 'bar-frequency-mode':return 'Логикалық жұмыс бағаларының жиілік диаграммасы берілген: төменде баға, тігінен сол бағаны алған оқушылар саны. Бағалардың модасы қай сан?';
 case 'dot-frequency-mode':return 'Нүктелі диаграммада әр нүкте бір футбол ойынын, ал төмендегі сан сол ойында соғылған гол санын білдіреді. Гол санының модасын табыңыз.';
 case 'bar-range':return 'Бес күн ішінде үйірмеге келген балалар саны диаграммада көрсетілген. Бір көлденең аралық 1 балаға тең. Күндік бала сандарының өзгеру құлашы неге тең?';
 case 'odd-card-median':return 'Карточкаларда жеті сан берілген. Оларды өсу ретімен орналастырып, сандар қатарының медианасын табыңыз.';
 case 'polygon-diagonals':return 'ABCDEF алтыбұрышы берілген. Көршілес емес екі төбені қосатын кесінді диагональ деп аталады. Алтыбұрышта неше түрлі диагональ бар?';
 case 'missing-permutation':return 'P, Q, R әріптерінің әрқайсысын бір рет қолданып құрастырылатын барлық үш әріпті нұсқалар ағашқа жазылған, бірақ бір толық жолы түсіп қалған. Әр жолды солдан оңға қарай оқыңыз. Қай нұсқа жетіспейді?';
 case 'unequal-menu-tree':return 'Түскі асқа P немесе Q сорпасының бірі таңдалады. Әр сорпаға қосуға болатын екінші тағамдар ғана ағашта нөмірлермен берілген. Неше түрлі рұқсат етілген түскі ас жиынтығы бар?';
 default:throw Error('Known condition');
 }
}
export const statementFor=q=>core(q)+(q.options?'':' Жауапқа тек санды жазыңыз.');
export function solutionFor(q){
 const p=q.params,k=kind(q),r=independentlyCalculate(q);
 switch(k){
 case 'axis-mean':return 'A('+p.first+'), B('+p.second+'). Координаталардың қосындысы '+p.first+' + '+p.second+' = '+r.checks.sum+'. Арифметикалық орта '+r.checks.sum+' : 2 = '+r.answer+'. '+r.checks.halfDistance+' — жарты арақашықтық, ол координаталардың ортасы емес.';
 case 'scaled-bar-mean':
 case 'unit-bar-mean':return 'Бағаналардан '+p.values.join(', ')+' мәндерін оқимыз. Қосынды '+p.values.join(' + ')+' = '+r.checks.sum+'. Бақылау саны '+r.checks.count+', сондықтан орта '+r.checks.sum+' : '+r.checks.count+' = '+r.answer+'.';
 case 'bar-frequency-mode':return 'Бағалар мен жиіліктері: '+p.categories.map((v,i)=>v+' — '+p.frequencies[i]+' оқушы').join('; ')+'. Ең үлкен жиілік '+r.checks.maxFrequency+', ол '+r.answer+' бағасына тиесілі. Сондықтан мода '+r.answer+', жиіліктің өзі емес.';
 case 'dot-frequency-mode':return 'Әр гол санының үстіндегі нүктелерді санаймыз: '+p.categories.map((v,i)=>v+' гол — '+p.frequencies[i]+' ойын').join('; ')+'. Ең көп ойын '+r.checks.maxFrequency+', ал сол бағанның гол саны '+r.answer+'. Мода — '+r.answer+' гол.';
 case 'bar-range':return 'Күндік мәндер '+p.values.join(', ')+'. Ең көбі '+r.checks.max+', ең азы '+r.checks.min+'. Өзгеру құлашы '+r.checks.max+' − '+r.checks.min+' = '+r.answer+'. Күндердің нөмірлері бұл есепте дерек мәндері емес.';
 case 'odd-card-median':return 'Өсу реті: '+r.checks.ordered.join(', ')+'. Жеті санның дәл ортасы — реттелген қатардың 4-орны, яғни '+r.answer+'. Бастапқы карточкалардың ортаңғы орнындағы '+p.values[3]+' санын бірден алуға болмайды.';
 case 'polygon-diagonals':return 'Жаңа диагональдарды ретімен тіземіз: A-дан AC, AD, AE; B-ден BD, BE, BF; C-ден CE, CF; D-ден DF. Қалғандары осы тізімде бар. Саны 3 + 3 + 2 + 1 = '+r.answer+'. Көршілес төбелер қабырға береді, диагональ емес.';
 case 'missing-permutation':return 'Барлық алты нұсқа: '+r.checks.all.join(', ')+'. Ағашта '+p.paths.join(', ')+' жолдары көрсетілген. Тек '+r.answer+' жолы жоқ. Әр нұсқада үш әріптің әрқайсысы бір рет қолданылады.';
 case 'unequal-menu-tree':return 'P сорпасына '+r.checks.counts[0]+' екінші тағам, Q сорпасына '+r.checks.counts[1]+' екінші тағам рұқсат етілген. Әр соңғы бұтақ бір жиынтық береді: '+r.checks.counts.join(' + ')+' = '+r.answer+'. Екі сорпаға да ең үлкен тармақ санын көбейтуге болмайды: рұқсат етілген нұсқалар саны бірдей емес.';
 default:throw Error('Known solution');
 }
}
export function descriptionFor(q){
 const p=q.params;
 switch(p.scene){
 case 'axis':return 'Бірлік сандық түзу. A '+p.first+', B '+p.second+' координатасында.';
 case 'bars':return p.horizontalLabel+': '+p.categories.map((v,i)=>v+' — '+(p.values||p.frequencies)[i]).join('; ')+'. Тік шкаланың бір тор аралығы '+p.step+' '+p.verticalLabel+'.';
 case 'dots':return 'Әр нүкте бір ойын. Гол саны мен нүкте жиіліктері: '+p.categories.map((v,i)=>v+' — '+p.frequencies[i]).join('; ')+'.';
 case 'cards':return 'Солдан оңға карточкалар: '+p.values.join(', ')+'.';
 case 'polygon':return 'A, B, C, D, E, F ретімен қосылған дөңес алтыбұрыш. Тек шекара қабырғалары сызылған; диагональдар салынбаған.';
 case 'permutation-tree':return 'Ағаштың солдан оңға оқылатын көрсетілген толық жолдары: '+p.paths.join(', ')+'.';
 case 'menu-tree':return 'Сорпа-тағам ағашы: '+p.branches.map(r=>r.label+' сорпасынан '+r.leaves.join(', ')+' тағамдарына бұтақтар шығады').join('; ')+'.';
 default:throw Error('Known scene');
 }
}
export function svgFor(q){
 const p=q.params,blue='#315ce8',purple='#8459ce',ink='#203549',soft='#dbe5f1';let body='';
 const line=(x1,y1,x2,y2,color=ink,width=2,extra='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
 const text=(x,y,t,size=23,color=ink,extra='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+esc(t)+'</text>';
 const center=(x,y,t,size=23,color=ink)=>text(x,y,t,size,color,'text-anchor="middle"');
 const circle=(x,y,r,color=blue,extra='')=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+color+'" '+extra+'/>';
 if(p.scene==='axis'){
  const X=v=>36+(v-p.min)*408/(p.max-p.min),y=190;body+=line(30,y,452,y)+'<path d="M 452 190 L 443 185 L 443 195 Z" fill="'+ink+'"/>';
  for(let v=p.min;v<=p.max;v++)body+=line(X(v),y-6,X(v),y+6,ink,1.4)+center(X(v),y+28,v,18);
  for(const [label,v]of [['A',p.first],['B',p.second]])body+=circle(X(v),y,6,blue,'data-point="'+label+'" data-coordinate="'+v+'"')+center(X(v),y-23,label,25,blue);
 }else if(p.scene==='bars'){
  const values=p.values||p.frequencies,x0=62,x1=445,top=60,bottom=280,H=bottom-top,Y=v=>bottom-v/p.max*H,spacing=(x1-x0)/p.categories.length,bw=Math.min(46,spacing*0.58);
  for(let v=0;v<=p.max;v+=p.step){body+=line(x0,Y(v),x1,Y(v),soft,1,'data-grid-value="'+v+'"');if(v%p.labelEvery===0)body+=text(x0-10,Y(v)+5,v,17,ink,'text-anchor="end"');}
  body+=line(x0,top-6,x0,bottom)+line(x0,bottom,x1+5,bottom)+text(x0-2,35,p.verticalLabel,18);
  p.categories.forEach((c,i)=>{const x=x0+spacing*(i+0.5);body+='<rect data-category="'+c+'" data-value="'+values[i]+'" x="'+(x-bw/2)+'" y="'+Y(values[i])+'" width="'+bw+'" height="'+(bottom-Y(values[i]))+'" rx="3" fill="'+(i%2?purple:blue)+'"/>'+center(x,307,c,20);});
  body+=center((x0+x1)/2,340,p.horizontalLabel,19);
 }else if(p.scene==='dots'){
  const y=282,X=i=>65+i*58;body+=line(40,y,445,y)+text(50,40,'● — 1 ойын',19,purple);
  p.categories.forEach((v,i)=>{body+=center(X(i),312,v,21);for(let n=0;n<p.frequencies[i];n++)body+=circle(X(i),y-22-n*24,7,blue,'data-category="'+v+'" data-observation="'+(n+1)+'"');});body+=center(240,344,'Гол саны',19);
 }else if(p.scene==='cards'){
  p.values.forEach((v,i)=>{const x=41+i*58;body+='<rect data-card-value="'+v+'" x="'+x+'" y="150" width="50" height="70" rx="10" fill="'+(i%2?'#f1edff':'#eaf0ff')+'" stroke="'+blue+'" stroke-width="2"/>'+center(x+25,195,v,28);});
 }else if(p.scene==='polygon'){
  const P=([x,y])=>[240+(x-2.5)*55,180-(y-2)*55],coords=p.polygon.map(P),offsets=[[-20,7],[0,26],[0,26],[20,7],[0,-16],[0,-16]];
  body+='<polygon data-vertices="'+p.polygon.map(v=>v.join(',')).join(';')+'" points="'+coords.map(v=>v.join(',')).join(' ')+'" fill="#eef0ff" stroke="'+blue+'" stroke-width="3"/>';coords.forEach((v,i)=>body+=center(v[0]+offsets[i][0],v[1]+offsets[i][1],p.labels[i],24));
 }else if(p.scene==='permutation-tree'){
  const first=new Map(p.tokens.map((t,i)=>[t,[65,180,295][i]])),leafYs=[40,95,180,265,320];body+='<rect x="8" y="160" width="74" height="40" rx="9" fill="#eaf0ff" stroke="'+blue+'"/>'+center(45,186,'Бастау',18);
  for(const token of p.tokens){const y=first.get(token);body+=line(82,180,137,y,soft,2)+circle(150,y,15,blue)+center(150,y+7,token,22,'#fff');}
  p.paths.forEach((s,i)=>{const y=leafYs[i],parentY=first.get(s[0]);body+=line(166,parentY,271,y,purple,2,'data-tree-prefix="'+s.slice(0,2)+'"')+circle(286,y,15,purple)+center(286,y+7,s[1],22,'#fff')+line(302,y,404,y,blue,2)+circle(420,y,15,blue,'data-path="'+s+'"')+center(420,y+7,s[2],22,'#fff');});
 }else if(p.scene==='menu-tree'){
  body+='<rect x="10" y="170" width="68" height="40" rx="9" fill="#eaf0ff" stroke="'+blue+'"/>'+center(44,196,'Ас',23);
  const ys=p.branches.map((b,i)=>b.leaves.map((_,j)=>b.leaves.length===1?(i?285:107.5):(i?240:40)+j*(i?90:135)/(b.leaves.length-1)));
  p.branches.forEach((branch,i)=>{const cy=ys[i].reduce((s,v)=>s+v,0)/ys[i].length;body+=line(78,190,162,cy,soft,2)+circle(180,cy,17,purple)+center(180,cy+8,branch.label,25,'#fff');branch.leaves.forEach((v,j)=>{const y=ys[i][j];body+=line(198,cy,386,y,blue,2)+circle(405,y,16,blue,'data-path="'+branch.label+v+'"')+center(405,y+7,v,23,'#fff');});});
 }else throw Error('Known native statistics scene');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-labelledby="title desc"><title id="title">Деректер мен нұсқалар</title><desc id="desc">'+esc(descriptionFor(q))+'</desc><rect width="480" height="360" rx="18" fill="#fff"/><g font-family="Arial, sans-serif" stroke-linecap="round" stroke-linejoin="round">'+body+'</g></svg>';
}
export function verifyEdition(q){
 const r=independentlyCalculate(q);assert.equal(r.answer,q.answer,'Independent statistics/enumeration answer');assert.equal(statementFor(q),q.statement,'Exact parameter-bound statement');assert.equal(solutionFor(q),q.solution,'Exact parameter-bound solution');assert.equal(descriptionFor(q),q.figureDescription,'Exact accessible description');assert.equal(sha(svgFor(q)),q.figureSha256,'Exact native SVG digest');
 if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(v=>v===r.answer).length,1);}
 return {answer:r.answer,checks:Object.entries(r.checks).map(([key,value])=>key+': '+JSON.stringify(value))};
}
