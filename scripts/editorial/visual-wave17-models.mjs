import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {parseAffine} from './visual-wave10-models.mjs';
import {svgFor as positiveGraphSVG,descriptionFor as positiveGraphDescription} from './visual-wave15-models.mjs';
const prefix='visual-wave17-',kind=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a;};
const rational=(n,d)=>{assert.ok(Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&d!==0);const g=gcd(n,d),s=d<0?-1:1;return {n:n/g*s,d:d/g*s};};
const slope=points=>{assert.equal(points.length,2);const a=points[0],b=points[1],r=rational(b[1]-a[1],b[0]-a[0]);assert.ok(points.every(([x,y])=>y*r.d===x*r.n),'Direct proportional line goes through origin');return r;};
export function independentlyCalculate(q){
 const p=q.params,k=kind(q);let answer,checks;
 switch(k){
 case 'negative-coefficient-forward':{const r=slope(p.lines[0].points),n=r.n*p.queryX;assert.equal(n%r.d,0);answer=String(n/r.d);checks={coefficient:r,query:p.queryX};break;}
 case 'signed-fractional-coefficient':{const [x,y]=p.point,r=rational(y,x),actual=slope(p.lines[0].points);assert.deepEqual(r,actual);const matches=q.options.filter(t=>{const [v,c]=parseAffine(t);assert.equal(v.n,0);return c.n*r.d===r.n*c.d;});assert.equal(matches.length,1);answer=matches[0];checks={point:p.point,coefficient:r};break;}
 case 'scaled-cycle-speed':{const points=p.series[0].points,nonzero=points.find(v=>v[0]>0);assert.ok(nonzero&&nonzero[1]%nonzero[0]===0);const speed=nonzero[1]/nonzero[0];assert.ok(points.every(([t,s])=>s===t*speed));answer=String(speed);checks={point:nonzero,speed};break;}
 case 'target-negative-slope-line':{const parsed=parseAffine(p.targetFormula.replace(/^y\s*=\s*/,''));assert.equal(parsed[1].n,0);assert.ok(parsed[0].n<0,'This addressed target has negative slope');const good=p.lines.filter(l=>{const r=slope(l.points);return r.n*parsed[0].d===parsed[0].n*r.d;});assert.equal(good.length,1);answer=good[0].label;checks={targetCoefficient:parsed[0],lineCoefficients:p.lines.map(l=>({label:l.label,...slope(l.points)}))};break;}
 case 'positive-point-coefficient':{const r=rational(p.point[1],p.point[0]);assert.deepEqual(r,slope(p.lines[0].points));assert.equal(r.d,1);assert.ok(r.n>0);answer=String(r.n);checks={point:p.point,coefficient:r};break;}
 default:throw Error('Known proportional target '+k);
 }
 return {answer,checks};
}
function core(q){
 const p=q.params;
 switch(kind(q)){
 case 'negative-coefficient-forward':return 'Координаталық жазықтықта y = kx тура пропорционалдығы салынған. x = '+p.queryX+' болғанда y неге тең?';
 case 'signed-fractional-coefficient':return 'Тура пропорционалдық графигінде M нүктесі белгіленген. y = kx формуласындағы k коэффициентін таңдаңыз. Таңба мен координаталардың ретін ескеріңіз.';
 case 'scaled-cycle-speed':return 'Велосипедшінің жүрген жолы қозғалыс уақытына тура пропорционал. График бойынша оның тұрақты жылдамдығы неше км/сағ? Тік шкаладағы бір тор аралығын ескеріңіз.';
 case 'target-negative-slope-line':return 'a, b, c, d түзулерінің әрқайсысы координаталар басы арқылы өтеді. Қай түзу '+p.targetFormula+' формуласына сәйкес келеді?';
 case 'positive-point-coefficient':return 'A нүктесі арқылы өтетін y = kx графигі берілген. Пропорционалдық коэффициенті k-ны табыңыз.';
 default:throw Error('Known condition');
 }
}
export const statementFor=q=>core(q)+(q.options?'':' Жауапқа тек санды жазыңыз.');
export function solutionFor(q){
 const p=q.params,r=independentlyCalculate(q);
 switch(kind(q)){
 case 'negative-coefficient-forward':return 'Түзу ('+p.queryX+'; '+r.answer+') нүктесінен өтеді. Тексеру: k = '+r.checks.coefficient.n+'/'+r.checks.coefficient.d+', сондықтан y = ('+r.checks.coefficient.n+'/'+r.checks.coefficient.d+') × ('+p.queryX+') = '+r.answer+'. Теріс коэффициент пен теріс x көбейтілгенде y оң болады.';
 case 'signed-fractional-coefficient':return 'M('+p.point.join('; ')+'). k = y/x = '+p.point[1]+'/('+p.point[0]+') = '+r.answer+'. Түзу II және IV ширектерден өтеді, сондықтан коэффициент теріс. x/y кері қатынасын алуға болмайды.';
 case 'scaled-cycle-speed':return 'Графикте '+r.checks.point[0]+' сағатта '+r.checks.point[1]+' км. v = s/t = '+r.checks.point[1]+' : '+r.checks.point[0]+' = '+r.answer+' км/сағ. Тексеру: '+r.answer+' × '+r.checks.point[0]+' = '+r.checks.point[1]+'. Бір тік ұсақ аралық '+p.yStep+' км.';
 case 'target-negative-slope-line':{const c=r.checks.targetCoefficient,x=2*c.d,y=2*c.n;return 'Берілген формула бойынша x = '+x+' болса, y = '+y+'. Осы ('+x+'; '+y+') нүктесінен '+r.answer+' түзуі өтеді. Таңбасы оң түзулер сәйкес емес; теріс түзулердің көлбеуліктерін де нүктемен тексеру керек. Дұрыс түзу '+r.answer+'.';}
 case 'positive-point-coefficient':return 'A('+p.point.join('; ')+'). k = y/x = '+p.point[1]+' : '+p.point[0]+' = '+r.answer+'. Координаталар басы мен осы нүкте арқылы өтетін түзу y = '+r.answer+'x формуласын береді.';
 default:throw Error('Known solution');
 }
}
export function descriptionFor(q){
 const p=q.params;if(p.scene==='speed')return positiveGraphDescription(q);
 return 'Бірдей бірлік масштабты координаталық тор, әр ұсақ аралық1. '+p.lines.map(l=>(l.label||'Берілген')+' түзуінің екі нүктесі '+l.points.map(v=>'('+v.join('; ')+')').join(' және ')).join('; ')+'. '+(p.point?(kind(q)==='signed-fractional-coefficient'?'M':'A')+'('+p.point.join('; ')+') белгіленген.':'');
}
export function svgFor(q){
 const p=q.params;if(p.scene==='speed')return positiveGraphSVG(q);
 const blue='#315ce8',purple='#8459ce',ink='#203549',soft='#dbe5f1',X=x=>240+20*x,Y=y=>180-20*y;let body='';
 const line=(A,B,color=ink,width=2,extra='')=>'<line x1="'+A[0]+'" y1="'+A[1]+'" x2="'+B[0]+'" y2="'+B[1]+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
 const text=(x,y,t,size=21,color=ink,extra='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+esc(t)+'</text>';
 const center=(x,y,t,size=21,color=ink)=>text(x,y,t,size,color,'text-anchor="middle" stroke="#fff" stroke-width="4" paint-order="stroke"');
 for(let n=-7;n<=7;n++){body+=line([X(-7),Y(n)],[X(7),Y(n)],soft,1)+line([X(n),Y(-7)],[X(n),Y(7)],soft,1);if(n&&n%2===0)body+=center(X(n),Y(0)+22,n,18)+text(X(0)-12,Y(n)+6,n,18,ink,'text-anchor="end"');}
 body+=line([X(-7),Y(0)],[X(7)+8,Y(0)],ink,1.8)+line([X(0),Y(-7)],[X(0),Y(7)-8],ink,1.8)+text(X(0)+9,Y(0)+20,0,18)+text(X(7)+15,Y(0)+7,'x',21)+text(X(0)+10,Y(7)-10,'y',21);
 p.lines.forEach((l,i)=>{const color=[blue,purple,'#249b81','#d07f27'][i],pix=l.points.map(([x,y])=>[X(x),Y(y)]);body+=line(...pix,color,2.7,'data-line="'+(l.label||'main')+'" data-coordinates="'+l.points.map(v=>v.join(',')).join(';')+'"');if(l.label){const pt=l.points.at(-1);body+=center(X(pt[0])+14,Y(pt[1])+(l.labelDy??-10),l.label,23,color);}});
 if(p.point){const [x,y]=p.point,name=kind(q)==='signed-fractional-coefficient'?'M':'A';body+='<circle data-marked-point="'+x+','+y+'" cx="'+X(x)+'" cy="'+Y(y)+'" r="5" fill="'+purple+'"/>'+center(X(x)-17,Y(y)-12,name,24,purple)+line([X(x),Y(0)],[X(x),Y(y)],purple,1.3,'stroke-dasharray="4 4"')+line([X(0),Y(y)],[X(x),Y(y)],purple,1.3,'stroke-dasharray="4 4"');}
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-labelledby="title desc"><title id="title">Тура пропорционалдық</title><desc id="desc">'+esc(descriptionFor(q))+'</desc><rect width="480" height="360" rx="18" fill="#fff"/><g font-family="Arial, sans-serif" stroke-linecap="round" stroke-linejoin="round">'+body+'</g></svg>';
}
export function verifyEdition(q){
 const r=independentlyCalculate(q);assert.equal(r.answer,q.answer,'Independent proportionality answer');assert.equal(statementFor(q),q.statement,'Exact parameter-bound statement');assert.equal(solutionFor(q),q.solution,'Exact parameter-bound solution');assert.equal(descriptionFor(q),q.figureDescription,'Exact accessible description');assert.equal(sha(svgFor(q)),q.figureSha256,'Exact native SVG digest');if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(v=>v===r.answer).length,1);}
 return {answer:r.answer,checks:Object.entries(r.checks).map(([k,v])=>k+': '+JSON.stringify(v))};
}
