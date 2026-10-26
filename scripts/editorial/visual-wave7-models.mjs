// Native interval, order, balance and inequality diagrams.
// Membership atoms provide an independent endpoint-aware union/intersection oracle.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const prefix='visual-wave7-',kind=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const fmt=n=>String(n).replace('.',',');
export const belongs=(r,x)=>(r.lo===null||x>r.lo||x===r.lo&&r.lc)&&(r.hi===null||x<r.hi||x===r.hi&&r.hc);
const finite=r=>[r.lo,r.hi].filter(x=>x!==null);
const membership=(ranges,op,x)=>op==='intersection'?ranges.every(r=>belongs(r,x)):ranges.some(r=>belongs(r,x));
export function components(ranges,op='union'){
 assert.ok(ranges.length>0);const ends=[...new Set(ranges.flatMap(finite))].sort((a,b)=>a-b);assert.ok(ends.length);
 const atoms=[{lo:null,hi:ends[0],lc:false,hc:false,sample:ends[0]-1}];
 for(let i=0;i<ends.length;i++){const v=ends[i];atoms.push({lo:v,hi:v,lc:true,hc:true,sample:v});if(i+1<ends.length)atoms.push({lo:v,hi:ends[i+1],lc:false,hc:false,sample:(v+ends[i+1])/2});}
 atoms.push({lo:ends.at(-1),hi:null,lc:false,hc:false,sample:ends.at(-1)+1});
 const out=[];for(const a of atoms.filter(a=>membership(ranges,op,a.sample))){const last=out.at(-1),r={lo:a.lo,hi:a.hi,lc:a.lc,hc:a.hc};if(last&&last.hi===r.lo&&(last.hc||r.lc)){last.hi=r.hi;last.hc=r.hc;}else out.push(r);}return out;
}
export function intervalText(r){if(r.lo===r.hi&&r.lo!==null)return '{'+r.lo+'}';return (r.lo===null||!r.lc?'(':'[')+(r.lo===null?'-∞':r.lo)+'; '+(r.hi===null?'+∞':r.hi)+(r.hi===null||!r.hc?')':']');}
const setText=rows=>rows.length?rows.map(intervalText).join(' ∪ '):'∅';
const point=(p,label)=>{const r=p.points.find(r=>r.label===label);assert.ok(r);return r.value;};
function intMembers(ranges,op='intersection'){
 const c=components(ranges,op);assert.ok(c.every(r=>r.lo!==null&&r.hi!==null));const lo=Math.min(...c.map(r=>r.lo)),hi=Math.max(...c.map(r=>r.hi)),a=[];for(let x=Math.floor(lo)-1;x<=Math.ceil(hi)+1;x++)if(membership(ranges,op,x))a.push(x);return a;
}
const rel=(a,op,b)=>op==='<'?a<b:op==='>'?a>b:op==='≤'?a<=b:op==='≥'?a>=b:(()=>{throw Error('Relation');})();
function validate(q){
 const p=q.params;assert.ok(['grid-pair','axis','balance','sum','interval'].includes(p.scene));const k=kind(q);
 if(p.scene==='axis'||p.scene==='interval'){
  assert.ok(Number.isInteger(p.min)&&Number.isInteger(p.max)&&p.min<p.max&&p.max-p.min<=30);
  if(p.points){assert.equal(new Set(p.points.map(r=>r.label)).size,p.points.length);assert.equal(new Set(p.points.map(r=>r.value)).size,p.points.length);for(const r of p.points)assert.ok(Number.isInteger(r.value)&&r.value>=p.min&&r.value<=p.max);}
  if(p.ranges)for(const r of p.ranges){assert.ok(r.lo===null||Number.isInteger(r.lo)&&r.lo>=p.min&&r.lo<=p.max);assert.ok(r.hi===null||Number.isInteger(r.hi)&&r.hi>=p.min&&r.hi<=p.max);assert.ok(typeof r.lc==='boolean'&&typeof r.hc==='boolean');if(r.lo===null)assert.equal(r.lc,false);if(r.hi===null)assert.equal(r.hc,false);if(r.lo!==null&&r.hi!==null)assert.ok(r.lo<r.hi||r.lo===r.hi&&r.lc&&r.hc);}
 }
 if(p.scene==='grid-pair'){assert.equal(p.shapes.length,2);for(const s of p.shapes)assert.ok(Number.isInteger(s.rows)&&Number.isInteger(s.cols)&&s.rows>=2&&s.cols<=10);assert.equal(p.shapes[1].rows,p.shapes[1].cols);assert.ok(p.shapes[0].cols>p.shapes[1].cols);}
 if(p.scene==='balance'){assert.equal(p.lowerSide,'left');assert.ok(p.weights.length===2&&p.weights.every(n=>Number.isInteger(n)&&n>0));assert.ok(p.massCandidates.every(n=>Number.isFinite(n)&&n>0));}
 if(p.scene==='sum'){assert.equal(p.leftHalfUnits.length,2);assert.equal(p.right.length,2);for(let i=0;i<2;i++)assert.ok(Number.isInteger(p.leftHalfUnits[i])&&p.leftHalfUnits[i]/2>p.right[i]);}
 if(k==='negative-scale-order'){assert.ok(Number.isInteger(p.factor)&&p.factor<0);assert.ok(point(p,p.first)<point(p,p.second));}
 if(k==='translated-order'){assert.ok(point(p,p.first)<point(p,p.second)&&p.translation<0);assert.equal(point(p,p.shiftedFirst),point(p,p.first)+p.translation);assert.equal(point(p,p.shiftedSecond),point(p,p.second)+p.translation);}
 if(k==='ray-inequality'){assert.equal(p.ranges.length,1);assert.equal(p.ranges[0].lo,null);assert.equal(p.ranges[0].hc,true);}
 if(k==='system-choice'){assert.equal(p.ranges.length,1);assert.equal(p.ranges[0].lc,true);assert.equal(p.ranges[0].hc,false);}
 if(k==='intersection-length')assert.ok(p.ranges.every(r=>r.lc&&r.hc),'This source intersects closed segments');
 if(k==='linear-parameter')assert.ok(Number.isInteger(p.coefficient)&&p.coefficient>0);
 return p;
}
function linearMatches(p){
 const all=[...new Set(p.ranges.flatMap(finite).concat(p.linearCandidates.map(c=>{assert.notEqual(c.a,0);const root=(c.rhs-c.b)/c.a;assert.ok(Number.isInteger(root));return root;})))].sort((a,b)=>a-b),samples=[all[0]-1,all.at(-1)+1,...all];
 for(let i=1;i<all.length;i++)samples.push((all[i-1]+all[i])/2);
 return p.linearCandidates.filter(c=>samples.every(x=>membership(p.ranges,'union',x)===rel(c.a*x+c.b,c.op,c.rhs)));
}
export function independentlyCalculate(q){
 const p=validate(q),k=kind(q),checks=['Endpoint-aware membership checks each boundary separately from every intervening open cell'];let answer;
 switch(k){
 case 'grid-area-difference':{const areas=p.shapes.map(s=>{let n=0;for(let r=0;r<s.rows;r++)for(let c=0;c<s.cols;c++)n++;return n;});assert.ok(areas[1]>areas[0]);answer=String(areas[1]-areas[0]);break;}
 case 'numeric-order':{const a=point(p,p.first),b=point(p,p.second);assert.ok(a<b&&b<0);answer=a+' < '+b;break;}
 case 'strict-integer-count':{let n=0;for(let x=p.min;x<=p.max;x++)if(point(p,p.first)<x&&x<point(p,p.second))n++;answer=String(n);break;}
 case 'possible-mass':{const sum=p.weights.reduce((a,b)=>a+b,0),a=p.massCandidates.filter(n=>n>sum);assert.equal(a.length,1);answer=fmt(a[0])+' кг';checks.push('The lower left pan is strictly heavier, so equality with total weights is excluded');break;}
 case 'negative-scale-order':{for(let a=-9;a<9;a++)for(let b=a+1;b<=9;b++)assert.ok(p.factor*a>p.factor*b);answer=p.factor+p.first+' > '+p.factor+p.second;checks.push('Negative multiplication reverses every ordered pair, not only the plotted example');break;}
 case 'translated-order':answer=point(p,p.first)+' − '+Math.abs(p.translation)+' < '+point(p,p.second)+' − '+Math.abs(p.translation);break;
 case 'sum-left-sides':{let halves=0;for(const n of p.leftHalfUnits)for(let i=0;i<n;i++)halves++;assert.equal(halves%2,0);answer=String(halves/2);break;}
 case 'transitive-order':assert.ok(point(p,p.upper)>point(p,p.middle)&&point(p,p.middle)>point(p,p.lower));answer=p.upper+' > '+p.lower;break;
 case 'interval-integer-count':answer=String(intMembers(p.ranges,'union').length);break;
 case 'ray-inequality':{assert.equal(p.ranges.length,1);const r=p.ranges[0];assert.equal(r.lo,null);answer='x '+(r.hc?'≤':'<')+' '+r.hi;break;}
 case 'marked-members-count':answer=String(p.points.filter(r=>membership(p.ranges,'union',r.value)).length);break;
 case 'interval-notation':answer=setText(components(p.ranges));break;
 case 'disjoint-statement':assert.equal(components(p.ranges,'intersection').length,0);assert.equal(components(p.ranges,'union').length,2);answer=p.names.join(' ∩ ')+' = ∅';break;
 case 'intersection-notation':answer=setText(components(p.ranges,'intersection'));break;
 case 'union-notation':answer=setText(components(p.ranges,'union'));break;
 case 'intersection-length':{const c=components(p.ranges,'intersection');assert.equal(c.length,1);assert.ok(c[0].lo!==null&&c[0].hi!==null);let length=0;for(let i=c[0].lo;i<c[0].hi;i++)length++;answer=String(length);checks.push('Length is the number of unit gaps, not the count of included integer points');break;}
 case 'linear-inequality-choice':{const a=linearMatches(p);assert.equal(a.length,1);answer=a[0].display;break;}
 case 'linear-parameter':{const r=p.ranges[0];assert.equal(p.ranges.length,1);assert.equal(r.lo,null);assert.equal(r.hc,true);assert.ok(p.coefficient>0);answer=String(p.coefficient*r.hi);break;}
 case 'system-integer-count':answer=String(intMembers(p.ranges,'intersection').length);break;
 case 'system-choice':{const a=components(p.ranges);assert.equal(a.length,1);const r=a[0];assert.ok(r.lo!==null&&r.hi!==null);answer='x '+(r.lc?'≥':'>')+' '+r.lo+' және x '+(r.hc?'≤':'<')+' '+r.hi;break;}
 case 'system-interval':answer=setText(components(p.ranges,'intersection'));break;
 case 'absolute-outside':{const a=components(p.ranges);assert.equal(a.length,2);assert.equal(a[0].lo,null);assert.equal(a[1].hi,null);assert.equal(a[0].hc,false);assert.equal(a[1].lc,false);const center=(a[0].hi+a[1].lo)/2,radius=(a[1].lo-a[0].hi)/2;assert.ok(Number.isInteger(center)&&center>0&&Number.isInteger(radius)&&radius>0);answer='|x - '+center+'| > '+radius;break;}
 case 'absolute-inside':{const a=components(p.ranges);assert.equal(a.length,1);const r=a[0];assert.equal(r.lo,-r.hi);assert.equal(r.lc,false);assert.equal(r.hc,false);answer='|x| < '+r.hi;break;}
 case 'absolute-parameter':{const a=components(p.ranges);assert.equal(a.length,1);const r=a[0];assert.equal(r.lo,-r.hi);assert.equal(r.lc,true);assert.equal(r.hc,true);answer=String(r.hi);break;}
 default:throw Error('Unknown addressed inequality form '+k);
 }return {answer,checks};
}
function conditionCore(q){
 const p=q.params;switch(kind(q)){
 case 'grid-area-difference':return 'Әр торкөз — қабырғасы 1 см шаршы. A тік төртбұрышы мен B шаршысының аудандарын салыстырыңыз. Үлкенінің ауданы екіншісінен неше см²-ге артық?';
 case 'numeric-order':return 'Шкаладан A және B координаталарын оқыңыз. Осы екі санды дұрыс салыстыратын теңсіздікті таңдаңыз.';
 case 'strict-integer-count':return 'A координатасын a, B координатасын b деп алайық. a < x < b шартын қанағаттандыратын неше бүтін x бар?';
 case 'possible-mass':return 'Сол табақтағы асқабақтың массасы x кг. Оң жақтағы кір тастардың массалары килограммен жазылған. Таразының көлбеуін ескерсек, x қай мән болуы мүмкін?';
 case 'negative-scale-order':return 'Түзудегі u және v сандарының орналасуын салыстырыңыз. Төмендегі теңсіздіктердің қайсысы міндетті түрде дұрыс?';
 case 'translated-order':return 'Көк нүктелер бірдей шамаға солға жылжып, қызғылт нүктелердің орнына келді. Екі нұсқар да '+p.translation+' өзгерісін көрсетеді. Дәл осы жылжуды қай теңсіздік сипаттайды?';
 case 'sum-left-sides':return 'Сызбадағы екі дұрыс теңсіздік мүшелеп қосылды. Сызықтың астындағы сұрақ белгісінің орнына қандай сан жазылады?';
 case 'transitive-order':return 'Түзудегі u, v, w сандарының орналасуына сүйеніп, дұрыс тұжырымды таңдаңыз.';
 case 'interval-integer-count':return 'Боялған сан аралығына тиісті бүтін сандардың санын табыңыз. Бос және толтырылған шеткі нүктелерді ескеріңіз.';
 case 'ray-inequality':return 'Боялған сәулеге сәйкес теңсіздікті таңдаңыз. Толтырылған шекара осы жиынға кіреді.';
 case 'marked-members-count':return 'Жоғарғы қатарда сан аралығы, төменгі қатарда бес нүкте бірдей шкаламен берілген. Неше белгіленген нүкте осы аралыққа тиісті?';
 case 'interval-notation':return 'Сызбадағы боялған жиынның сан аралығы түріндегі дұрыс белгіленуін таңдаңыз.';
 case 'disjoint-statement':return p.names[0]+' және '+p.names[1]+' аралықтары екі қатарда бірдей шкаламен көрсетілген. Қай тұжырым дұрыс?';
 case 'intersection-notation':return 'A және B аралықтарының ортақ бөлігін, яғни A ∩ B қиылысуын таңдаңыз.';
 case 'union-notation':return 'A немесе B аралығына кіретін барлық сандарды қамтитын A ∪ B бірігуін таңдаңыз.';
 case 'intersection-length':return 'Екі кесіндінің ортақ бөлігі де кесінді. Осы қиылысу кесіндісінің ұзындығын бірлікпен табыңыз.';
 case 'linear-inequality-choice':return 'Сызбадағы боялған жиын қай сызықтық теңсіздіктің шешімдер жиыны болады?';
 case 'linear-parameter':return 'Суретте '+p.coefficient+'x ≤ b теңсіздігінің шешімдері берілген. b параметрін табыңыз.';
 case 'system-integer-count':return 'Екі қатарда бір жүйедегі теңсіздіктердің шешімдері көрсетілген. Екі шартты бірдей қанағаттандыратын неше бүтін сан бар?';
 case 'system-choice':return 'Сызбадағы боялған жиынды бір мезгілде орындалатын екі шартпен сипаттаңыз. Дұрыс жүйені таңдаңыз.';
 case 'system-interval':return 'Екі қатардағы теңсіздіктер бір жүйеге жатады. Олардың ортақ шешімдер жиынын таңдаңыз.';
 case 'absolute-outside':return 'Бір түзуде боялған екі сәуле көрсетілген. Бұл жиынды модулі бар қай теңсіздік сипаттайды?';
 case 'absolute-inside':return 'Екі бос шекараның арасындағы бөлік боялған. Осы жиынға сәйкес модулі бар теңсіздікті таңдаңыз.';
 case 'absolute-parameter':return 'Сызбада |x| ≤ a теңсіздігінің шешімі берілген. a > 0 параметрінің мәнін табыңыз.';
 default:throw Error('Unknown condition');
 }
}
export const statementFor=q=>conditionCore(q)+(q.options?'':' Жауапқа тек санды жазыңыз.');
export function solutionFor(q){
 const p=q.params,answer=independentlyCalculate(q).answer,k=kind(q);let s;
 switch(k){
 case 'grid-area-difference':{const [a,b]=p.shapes;s='A: '+a.cols+' · '+a.rows+' = '+a.cols*a.rows+' см². B: '+b.cols+' · '+b.rows+' = '+b.cols*b.rows+' см². Сондықтан B ауданы үлкен: '+b.cols*b.rows+' − '+a.cols*a.rows+' = '+answer+' см².';break;}
 case 'numeric-order':s='A('+point(p,'A')+'), B('+point(p,'B')+'). Сол жақтағы сан кіші: '+answer+'. Екі сан да теріс болғанда 0-ден алысырақ орналасқаны кіші болады.';break;
 case 'strict-integer-count':{const a=[];for(let x=point(p,p.first)+1;x<point(p,p.second);x++)a.push(x);s='A('+point(p,p.first)+'), B('+point(p,p.second)+'). Екі шекара да кірмейді. Сәйкес бүтіндер: '+a.join(', ')+'. Барлығы '+answer+'.';break;}
 case 'possible-mass':s='Оң жақтың толық массасы '+p.weights.join(' + ')+' = '+p.weights.reduce((a,b)=>a+b,0)+' кг. Сол табақ төмен, сондықтан асқабақ ауыр: x > '+p.weights.reduce((a,b)=>a+b,0)+'. Нұсқалардың ішінде тек '+answer+' осы шартқа сай; тең масса таразыны көлбеу ұстамас еді.';break;
 case 'negative-scale-order':s='u нүктесі v нүктесінен солда, яғни u < v. Екі жақты '+p.factor+' теріс санына көбейткенде белгі кері бағытқа өзгереді: '+answer+'. Оң санға көбейту немесе екі жаққа бірдей сан қосу белгіні өзгертпейді.';break;
 case 'translated-order':s='Бастапқы сандар '+point(p,p.first)+' және '+point(p,p.second)+'. Екеуіне де '+p.translation+' қосылған: соңғы сандар '+point(p,p.shiftedFirst)+' және '+point(p,p.shiftedSecond)+'. Бірдей сан қосқанда рет сақталады: '+answer+'.';break;
 case 'sum-left-sides':s='Сол жақтар: '+p.leftHalfUnits.map(n=>fmt(n/2)).join(' + ')+' = '+answer+'. Оң жақтар: '+p.right.join(' + ')+' = '+p.right.reduce((a,b)=>a+b,0)+'. Шыққан теңсіздік '+answer+' > '+p.right.reduce((a,b)=>a+b,0)+' — дұрыс.';break;
 case 'transitive-order':s='Солдан оңға қарай '+p.lower+', '+p.middle+', '+p.upper+' орналасқан. Сондықтан '+p.upper+' > '+p.middle+' және '+p.middle+' > '+p.lower+'. Транзитивтілік бойынша '+answer+'.';break;
 case 'interval-integer-count':s='Суреттегі аралық '+setText(components(p.ranges))+'. Бүтіндері: '+intMembers(p.ranges,'union').join(', ')+'. Барлығы '+answer+'. Ашық шекара кірмейді, жабық шекара кіреді.';break;
 case 'ray-inequality':s='Боялған сәуле '+p.ranges[0].hi+' белгісінен солға созылады. Шеткі нүкте толтырылған, сондықтан шекара кіреді: '+answer+'.';break;
 case 'marked-members-count':s='Жиын '+setText(components(p.ranges))+'. Нүктелер: '+p.points.map(r=>r.label+'('+r.value+')').join(', ')+'. Тиістілері '+p.points.filter(r=>membership(p.ranges,'union',r.value)).map(r=>r.label).join(', ')+'. Саны '+answer+'. Шекарадағы нүктелердің тиістілігі шеңбердің бос не толтырылған болуына тәуелді.';break;
 case 'interval-notation':s='Сол шекара '+p.ranges[0].lo+' — '+(p.ranges[0].lc?'жабық':'ашық')+', оң шекара '+p.ranges[0].hi+' — '+(p.ranges[0].hc?'жабық':'ашық')+'. Сондықтан '+answer+'.';break;
 case 'disjoint-statement':s=p.names[0]+' = '+intervalText(p.ranges[0])+', '+p.names[1]+' = '+intervalText(p.ranges[1])+'. Олардың арасында бос орын бар, ортақ сан жоқ. Сондықтан '+answer+'. Бірігуін бір тұтас аралық деп жазсақ, бос орынды қате қосып жібереміз.';break;
 case 'intersection-notation':case 'system-interval':s='Берілген жиындар '+p.ranges.map(intervalText).join(' және ')+'. Екі шарттың да орындалатын бөлігі — '+answer+'. Әр шекараның екі жиынға да тиістілігін жеке тексереміз.';break;
 case 'union-notation':s='Берілген аралықтар '+p.ranges.map(intervalText).join(' және ')+'. Олар қабаттасады; бос орын жоқ. Кемінде біреуіне тиісті сандардың толық жиыны — '+answer+'.';break;
 case 'intersection-length':{const r=components(p.ranges,'intersection')[0];s='Ортақ бөлігі '+intervalText(r)+'. Ұзындығы '+r.hi+' − ('+r.lo+') = '+answer+' бірлік. Бүтін нүктелер саны емес, бірлік аралықтар саны сұралған.';break;}
 case 'linear-inequality-choice':{const c=linearMatches(p)[0];s='Сызба '+setText(components(p.ranges))+' жиынын береді. '+c.display+' теңсіздігінің екі жағын '+c.a+' санына бөлеміз: x > '+((c.rhs-c.b)/c.a)+'. Шекара ашық және сәуле оңға бағытталған, демек сәйкес нұсқа '+answer+'.';break;}
 case 'linear-parameter':s='Суреттен x ≤ '+p.ranges[0].hi+' оқылады. '+p.coefficient+'x ≤ b теңсіздігінің шекарасы b/'+p.coefficient+'. Сондықтан b/'+p.coefficient+' = '+p.ranges[0].hi+', b = '+p.coefficient+' · '+p.ranges[0].hi+' = '+answer+'.';break;
 case 'system-integer-count':s='Екі сәуленің қиылысуы '+setText(components(p.ranges,'intersection'))+'. Бүтін шешімдер: '+intMembers(p.ranges,'intersection').join(', ')+'. Саны '+answer+'.';break;
 case 'system-choice':s='Суреттегі сол шекара '+p.ranges[0].lo+' жабық, оң шекара '+p.ranges[0].hi+' ашық. Екі шарт бір мезгілде орындалуы тиіс: '+answer+'.';break;
 case 'absolute-outside':{const c=components(p.ranges),center=(c[0].hi+c[1].lo)/2,radius=(c[1].lo-c[0].hi)/2;s='Ашық шекаралар '+c[0].hi+' және '+c[1].lo+'. Ортасы ('+c[0].hi+' + '+c[1].lo+') : 2 = '+center+', әр шетке қашықтық '+radius+'. Боялған нүктелер сыртта, шекаралар кірмейді. Сондықтан '+answer+'.';break;}
 case 'absolute-inside':s='Боялған аралық '+setText(components(p.ranges))+'. Бұл 0-ден қашықтығы '+p.ranges[0].hi+' санынан қатаң кіші нүктелер: '+answer+'.';break;
 case 'absolute-parameter':s='Жиын '+setText(components(p.ranges))+', шекаралары 0-ге қатысты симметриялы және жабық. |x| ≤ a шешімі [-a; a] болғандықтан, a = '+answer+'.';break;
 default:throw Error('Unknown solution');
 }return s+'\nЖауап: '+answer+'.';
}
export function descriptionFor(q){
 const p=q.params;let s=statementFor(q)+' ';
 if(p.shapes)s+=p.shapes.map(r=>r.label+': '+r.rows+' жол, '+r.cols+' баған бірлік шаршы').join('; ')+'. ';
 if(p.points)s+=p.numericLabels===false?'Солдан оңға қарай '+[...p.points].sort((a,b)=>a.value-b.value).map(r=>r.label).join(', ')+'. ':'Нүктелер: '+p.points.map(r=>r.label+'('+r.value+')').join(', ')+'. ';
 if(p.ranges)s+=p.ranges.map((r,i)=>(p.names?.[i]||'Қатар '+(i+1))+': сол жақ '+(r.lo===null?'солға шексіз созылады':r.lo+' шекарасы '+(r.lc?'толтырылған':'бос'))+', оң жақ '+(r.hi===null?'оңға шексіз созылады':r.hi+' шекарасы '+(r.hc?'толтырылған':'бос'))).join('; ')+'. ';
 if(p.weights)s+='Сол табақ оң табақтан төмен. Оңдағы кір тастар '+p.weights.join(' және ')+' кг. ';
 if(p.scene==='sum')s+='Берілген жолдар '+p.leftHalfUnits.map((n,i)=>fmt(n/2)+' > '+p.right[i]).join(' және ')+'. Қосындының сол жағы белгісіз, оң жағы '+p.right.reduce((a,b)=>a+b,0)+'. ';
 return s;
}
export function svgFor(q){
 const p=validate(q),scene=p.scene,height=scene==='axis'?(p.translation?260:190):scene==='interval'?(p.points?310:p.ranges.length>1&&!p.sameAxis?330:215):scene==='sum'?260:360;
 const n=x=>Number(x.toFixed(3)),text=(x,y,v,size=22,color='#38557b')=>'<text x="'+n(x)+'" y="'+n(y)+'" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="'+size+'" fill="'+color+'" stroke="white" stroke-width="2.7" paint-order="stroke" stroke-linejoin="round">'+esc(v)+'</text>';
 const line=(x,y,a,b,attrs='')=>'<line x1="'+n(x)+'" y1="'+n(y)+'" x2="'+n(a)+'" y2="'+n(b)+'" '+attrs+'/>';
 let art='';
 const at=v=>48+384*(v-p.min)/(p.max-p.min),axis=(y,labels)=>{let out=line(34,y,448,y,'stroke="#708aa9" stroke-width="1.6" marker-end="url(#tip)"');for(let i=p.min;i<=p.max;i++)out+=line(at(i),y-4,at(i),y+4,'stroke="#849bb6"');for(const i of labels)out+=text(at(i),y+27,i,20);return out;};
 if(scene==='axis'){
  const base=p.translation?172:105;art+=axis(base,p.numericLabels===false?[]:p.labels||[0,1]);
  for(const r of p.points){const shifted=p.translation&&[p.shiftedFirst,p.shiftedSecond].includes(r.label);art+='<circle cx="'+n(at(r.value))+'" cy="'+base+'" r="4.5" fill="'+(shifted?'#ce718a':'#6653c1')+'" data-point="'+r.label+'" data-value="'+r.value+'"/>'+text(at(r.value),shifted?base+59:base-25,r.label,22,shifted?'#b55272':'#5145b3');}
  if(p.translation)for(const [a,b]of[[p.first,p.shiftedFirst],[p.second,p.shiftedSecond]]){const x=at(point(p,a)),y=at(point(p,b)),mid=(x+y)/2;art+='<path d="M'+n(x)+','+base+' Q'+n(mid)+',32 '+n(y)+','+base+'" fill="none" stroke="#8471cf" stroke-width="2.6" marker-end="url(#tip)" data-from="'+point(p,a)+'" data-to="'+point(p,b)+'"/>'+text(mid,84,p.translation,21);}
 }else if(scene==='interval'){
  p.ranges.forEach((r,i)=>{const y=100+(p.sameAxis?0:i*125),color=i%2?'#c77b67':'#697bd3',left=r.lo===null?40:at(r.lo),right=r.hi===null?440:at(r.hi);if(i===0||!p.sameAxis)art+=axis(y,[...new Set(finite(r))]);art+=line(left,y,right,y,'stroke="'+color+'" stroke-width="6" data-interval="'+i+'" data-lo="'+(r.lo===null?'-inf':r.lo)+'" data-hi="'+(r.hi===null?'+inf':r.hi)+'"');
   if(r.lo===null)art+='<path d="M33,'+y+' L45,'+(y-7)+' L45,'+(y+7)+' Z" fill="'+color+'"/>';else art+='<circle cx="'+n(at(r.lo))+'" cy="'+y+'" r="7" fill="'+(r.lc?color:'white')+'" stroke="'+color+'" stroke-width="2.3" data-endpoint="'+r.lo+'" data-closed="'+r.lc+'"/>';
   if(r.hi===null)art+='<path d="M447,'+y+' L435,'+(y-7)+' L435,'+(y+7)+' Z" fill="'+color+'"/>';else art+='<circle cx="'+n(at(r.hi))+'" cy="'+y+'" r="7" fill="'+(r.hc?color:'white')+'" stroke="'+color+'" stroke-width="2.3" data-endpoint="'+r.hi+'" data-closed="'+r.hc+'"/>';
   if(p.sameAxis&&i>0)for(const v of finite(r))art+=text(at(v),y+27,v,20);
   if(p.names?.[i])art+=text(24,y-24,p.names[i],22,color);
  });
  if(p.points){const base=235;art+=axis(base,[0,1]);for(const r of p.points)art+='<circle cx="'+n(at(r.value))+'" cy="'+base+'" r="4.5" fill="#7755bc" data-point="'+r.label+'" data-value="'+r.value+'"/>'+text(at(r.value),base-25,r.label,22,'#6045a1');}
 }else if(scene==='grid-pair'){
  p.shapes.forEach((s,i)=>{const size=21,left=i?285:25,top=185-s.rows*size/2;art+=text(left+s.cols*size/2,top-30,s.label,26);for(let r=0;r<s.rows;r++)for(let c=0;c<s.cols;c++)art+='<rect x="'+n(left+c*size)+'" y="'+n(top+r*size)+'" width="'+size+'" height="'+size+'" fill="'+(i?'#f8ddae':'#cfdefa')+'" stroke="white" stroke-width="1.7" data-cell="'+s.label+':'+r+':'+c+'"/>';});
 }else if(scene==='balance'){
  art+='<path d="M240,124 L210,295 L270,295 Z" fill="#c7d9ef" stroke="#7795bb" stroke-width="1.5"/>'+line(100,161,380,99,'stroke="#706b9e" stroke-width="8"')+'<circle cx="240" cy="130" r="9" fill="#6f67a6"/>';
  for(const [x,y]of[[100,161],[380,99]])art+=line(x,y,x-52,y+103,'stroke="#8b91aa" stroke-width="1.8"')+line(x,y,x+52,y+103,'stroke="#8b91aa" stroke-width="1.8"')+'<path d="M'+(x-58)+','+(y+103)+' Q'+x+','+(y+126)+' '+(x+58)+','+(y+103)+' Z" fill="#b8cce7" stroke="#7895b9" stroke-width="1.5"/>';
  art+='<ellipse cx="100" cy="235" rx="37" ry="29" fill="#efb96a" stroke="#b17b46" stroke-width="1.8"/>'+line(100,206,106,195,'stroke="#7a9b64" stroke-width="4"')+text(100,238,'x кг',22,'#805736');
  p.weights.forEach((v,i)=>{const x=355+i*40;art+='<rect x="'+(x-17)+'" y="162" width="34" height="39" rx="5" fill="#d7d6ec" stroke="#9490b5" stroke-width="1.5"/>'+text(x,181,v,21);});art+=text(382,235,'Кір тастар, кг',18);
 }else if(scene==='sum'){
  for(let i=0;i<2;i++)art+=text(155,65+i*64,fmt(p.leftHalfUnits[i]/2),31)+text(245,65+i*64,'>',31)+text(335,65+i*64,p.right[i],31);
  art+=text(80,129,'+',31)+line(106,169,384,169,'stroke="#8da1bf" stroke-width="2"')+text(155,214,'?',32,'#b56571')+text(245,214,'>',31)+text(335,214,p.right.reduce((a,b)=>a+b,0),31);
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="'+height+'" viewBox="0 0 480 '+height+'" role="img" aria-labelledby="title desc"><title id="title">'+esc(q.figureTitle)+'</title><desc id="desc">'+esc(q.figureDescription)+'</desc><defs><marker id="tip" markerWidth="7" markerHeight="7" refX="5.8" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L7,3.5 L0,7Z" fill="#7186a7"/></marker></defs><rect width="480" height="'+height+'" fill="white"/>'+art+'</svg>\n';
}
export function verifyEdition(q){
 const r=independentlyCalculate(q);assert.equal(q.answer,r.answer,'Independent endpoint-aware answer');assert.equal(q.statement,statementFor(q),'Exact condition');assert.equal(q.solution,solutionFor(q),'Exact worked solution');assert.equal(q.figureDescription,descriptionFor(q),'Exact accessible geometry');assert.equal(q.image,'/figures/synaq-editions/'+q.editionId+'.svg');assert.equal(q.figureSha256,sha(svgFor(q)),'Exact native SVG digest');if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(x=>x===q.answer).length,1);}return {...r,checks:[...r.checks,'Source-specific condition, closure flags, direction, candidate answer, solution and native SVG are bound']};
}
