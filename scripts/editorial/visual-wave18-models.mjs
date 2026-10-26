import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const prefix='visual-wave18-';
const kind=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
// Parse the actual printed integer linear equation; never evaluate arbitrary code.
export function parseEquation(text){
 const sides=text.replace(/\s/g,'').split('=');assert.equal(sides.length,2);
 const parse=s=>{assert.ok(s.length,'Nonempty equation side');const result=[0,0,0];let at=0;while(at<s.length){const m=/^([+-]?)(\d*)([xy]?)/.exec(s.slice(at));assert.ok(m&&m[0].length&&m[0]!=='+'&&m[0]!=='-','Bounded linear term');assert.ok(m[2]||m[3]);if(at)assert.ok(m[1],'Terms require explicit sign');const n=(m[1]==='-'?-1:1)*(m[2]?Number(m[2]):1);assert.ok(Number.isSafeInteger(n));result[m[3]==='x'?0:m[3]==='y'?1:2]+=n;at+=m[0].length;}return result;};
 const a=parse(sides[0]),b=parse(sides[1]);return {a:a[0]-b[0],b:a[1]-b[1],c:b[2]-a[2]};
}
const on=(e,[x,y])=>e.a*x+e.b*y===e.c;
export const parsePair=t=>{const m=/^\((-?\d+);\s*(-?\d+)\)$/.exec(t);assert.ok(m,'Printed coordinate pair');return [Number(m[1]),Number(m[2])];};
export function independentlyCalculate(q){
 const p=q.params;let answer,checks;if(p.scene==='plane'){assert.ok(p.samples.length>=2);assert.ok(p.samples.every(xy=>on(parseEquation(p.equation),xy)),'Every described graph sample lies on the drawn line');}
 switch(kind(q)){
 case 'equation-table':{const e=parseEquation(p.equation);assert.notEqual(e.b,0);for(const [x,y]of p.columns)if(y!==null)assert.ok(on(e,[x,y]),'Every known column solves equation');const blank=p.columns.filter(v=>v[1]===null);assert.equal(blank.length,1);const n=e.c-e.a*blank[0][0];assert.ok(n%e.b===0);answer=String(n/e.b);checks={equation:e,unknownX:blank[0][0]};break;}
 case 'point-equation':{const e=parseEquation(p.equation),good=p.points.filter(v=>on(e,v.xy));assert.equal(good.length,1);answer=good[0].label;checks={residuals:p.points.map(v=>[v.label,e.a*v.xy[0]+e.b*v.xy[1]-e.c])};break;}
 case 'balance-two-variables':{assert.ok(p.nx>0&&p.ny>0&&p.xMass>0);const residual=p.total-p.nx*p.xMass;assert.ok(residual>0);assert.equal(residual%p.ny,0);answer=String(residual/p.ny);checks={knownMass:p.nx*p.xMass,remainingMass:residual,yCount:p.ny};break;}
 case 'graph-solution-pair':{const e=parseEquation(p.equation),good=q.options.filter(t=>on(e,parsePair(t)));assert.equal(good.length,1);answer=good[0];checks={equation:e,optionResiduals:q.options.map(t=>{const [x,y]=parsePair(t);return e.a*x+e.b*y-e.c;})};break;}
 case 'vertical-equation':
 case 'intercept-equation':{const samples=p.samples;assert.equal(samples.length,2);assert.notDeepEqual(samples[0],samples[1]);const good=q.options.filter(t=>samples.every(xy=>on(parseEquation(t),xy)));assert.equal(good.length,1);assert.ok(samples.every(xy=>on(parseEquation(p.equation),xy)));answer=good[0];checks={samples,optionSampleFits:q.options.map(t=>samples.map(xy=>on(parseEquation(t),xy)))};break;}
 case 'graph-ordinate':{const e=parseEquation(p.equation);assert.notEqual(e.b,0);const n=e.c-e.a*p.queryX;assert.ok(n%e.b===0);answer=String(n/e.b);checks={equation:e,queryX:p.queryX};break;}
 default:throw Error('Known linear visual target');
 }
 return {answer,checks};
}
function core(q){const p=q.params;switch(kind(q)){
 case 'equation-table':return 'Кестенің әр бағанында '+p.equation+' теңдеуінің бір шешімі берілген. Сұрақ белгісінің орнына қандай сан жазылады?';
 case 'point-equation':return 'Координаталық тордағы қай нүкте '+p.equation+' теңдеуінің шешімін береді? Координаталардың ретін сақтаңыз.';
 case 'balance-two-variables':return 'Таразы тепе-теңдікте. Бірдей x жүктерінің әрқайсысы '+p.xMass+' кг. Бірдей y жүктерінің әрқайсысы неше килограмм?';
 case 'graph-solution-pair':return 'Суреттегі түзу екі айнымалысы бар теңдеудің графигі. Қай сандар жұбы осы теңдеудің шешімі болады?';
 case 'vertical-equation':return 'Координаталық жазықтықта тік түзу салынған. Осы түзудің теңдеуін таңдаңыз.';
 case 'graph-ordinate':return 'Түзудің графигінен абсциссасы '+p.queryX+' болатын нүктенің ординатасын табыңыз.';
 case 'intercept-equation':return 'Суреттегі көлбеу түзудің теңдеуі қайсы? Екі осьпен қиылысу нүктелерін де ескеріңіз.';
 default:throw Error('Known condition');
}}
export const statementFor=q=>core(q)+(q.options?'':' Жауапқа тек санды жазыңыз.');
export function solutionFor(q){const p=q.params,r=independentlyCalculate(q);switch(kind(q)){
 case 'equation-table':return 'Белгісіз ұяшықтың бағанында x = '+r.checks.unknownX+'. '+p.equation+' теңдеуіне осы x-ті қойғанда y = '+r.answer+' шығады. Белгілі бағандардың әрқайсысы да теңдеуді қанағаттандырады.';
 case 'point-equation':{const v=p.points.find(v=>v.label===r.answer),e=parseEquation(p.equation);return r.answer+'('+v.xy.join('; ')+') үшін '+e.a+' × ('+v.xy[0]+') + ('+e.b+') × ('+v.xy[1]+') = '+e.c+'. Қалған нүктелерді қойғанда сол жақ '+r.checks.residuals.filter(v=>v[0]!==r.answer).map(v=>e.c+v[1]).join(', ')+' болады; бұлар '+e.c+' санына тең емес.';}
 case 'balance-two-variables':return 'Сол табақта '+p.nx+' дана x және '+p.ny+' дана y бар. Теңдеу: '+p.nx+'x + '+p.ny+'y = '+p.total+'. x = '+p.xMass+' болса, x жүктері '+r.checks.knownMass+' кг. y жүктерінің жалпы массасы '+p.total+' − '+r.checks.knownMass+' = '+r.checks.remainingMass+' кг. Бір y жүгінің массасы '+r.checks.remainingMass+' : '+p.ny+' = '+r.answer+' кг.';
 case 'graph-solution-pair':return 'Графиктегі нүктенің координаталары теңдеудің шешімі болады. '+r.answer+' нүктесі түзуге тиесілі. Тексеру үшін график '+p.samples.map(v=>'('+v.join('; ')+')').join(' және ')+' нүктелерінен өтеді. Координаталардың орындарын ауыстыру басқа нүктені береді.';
 case 'vertical-equation':return 'Түзудегі барлық нүктенің x координатасы '+p.samples[0][0]+', ал y әртүрлі болуы мүмкін. Сондықтан дұрыс теңдеу: '+r.answer+'. Тек бір нүктені емес, осы түзудің барлық нүктелерін сипаттау керек.';
 case 'graph-ordinate':return 'x = '+p.queryX+' тік тор сызығы берілген түзумен y = '+r.answer+' деңгейінде қиылысады. Тексеру: '+p.samples.map(v=>'('+v.join('; ')+')').join(' және ')+' нүктелері бір түзуде жатыр. Ізделген нүкте ('+p.queryX+'; '+r.answer+').';
 case 'intercept-equation':return 'Түзу '+p.samples.map(v=>'('+v.join('; ')+')').join(' және ')+' нүктелерінен өтеді. '+r.answer+' теңдеуі осы екі жұп үшін де орындалады. Басқа нұсқалардың әрқайсысы кемінде бір қиылысу нүктесіне сәйкес емес.';
 default:throw Error('Known solution');
}}
export function descriptionFor(q){const p=q.params;if(p.scene==='table')return 'Екі жолды кесте. Жолдар x және y. Бағандар: '+p.columns.map(([x,y])=>'x='+x+', y='+(y===null?'сұрақ белгісі':y)).join('; ')+'.';if(p.scene==='balance')return 'Тепе-тең таразы: сол табақта '+p.nx+' x және '+p.ny+' y жүгі, оң табақта '+p.total+' кг. Бірдей әріптер бірдей массаны білдіреді.';return 'Бірдей бірлік масштабы бар координаталық тор, бір ұсақ аралық 1. '+(p.points?p.points.map(v=>v.label+'('+v.xy.join('; ')+')').join('; '):'Түзу '+p.samples.map(v=>'('+v.join('; ')+')').join(' және ')+' нүктелерінен өтеді')+'.';}
export function lineBoundary(e,lo=-7,hi=7){const points=[];if(e.b)for(const x of [lo,hi]){const y=(e.c-e.a*x)/e.b;if(y>=lo&&y<=hi)points.push([x,y]);}if(e.a)for(const y of [lo,hi]){const x=(e.c-e.b*y)/e.a;if(x>=lo&&x<=hi&&!points.some(v=>v[0]===x&&v[1]===y))points.push([x,y]);}assert.equal(points.length,2);return points;}
export function svgFor(q){const p=q.params,blue='#315ce8',purple='#8459ce',ink='#203549',soft='#dbe5f1';let body='';const line=(a,b,color=ink,width=2,extra='')=>'<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';const text=(x,y,t,size=23,color=ink,extra='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+esc(t)+'</text>';const center=(x,y,t,size=23,color=ink)=>text(x,y,t,size,color,'text-anchor="middle" stroke="#fff" stroke-width="4" paint-order="stroke"');
 if(p.scene==='table'){const n=p.columns.length+1,w=400/n,left=40,top=112;for(let r=0;r<2;r++)for(let c=0;c<n;c++){const v=c?p.columns[c-1][r]:['x','y'][r];body+='<rect x="'+(left+c*w)+'" y="'+(top+r*65)+'" width="'+w+'" height="65" fill="'+(c?'#fff':'#eaf0ff')+'" stroke="'+ink+'" stroke-width="2"/>'+center(left+(c+.5)*w,top+r*65+42,v===null?'?':v,30,v===null?purple:ink);} }
 else if(p.scene==='balance'){const beamY=126,trayY=236;body+=line([92,beamY],[380,beamY],ink,5)+line([236,beamY],[236,286],ink,7)+'<path d="M202 296 L270 296 L236 272 Z" fill="'+ink+'"/>';for(const [cx,width]of [[135,202],[373,126]]){body+=line([cx,beamY],[cx-width/2,trayY],ink,1.8)+line([cx,beamY],[cx+width/2,trayY],ink,1.8)+'<path d="M'+(cx-width/2)+' '+trayY+' h'+width+' l-10 12 h-'+(width-20)+' Z" fill="#eaf0ff" stroke="'+ink+'" stroke-width="2"/>';}
  const weights=Array(p.nx).fill('x').concat(Array(p.ny).fill('y'));assert.ok(weights.length<=6);weights.forEach((v,i)=>{const x=42+i*36;body+='<rect data-weight="'+v+'" x="'+x+'" y="199" width="33" height="37" rx="5" fill="'+(v==='x'?'#dfe8ff':'#e9ddff')+'" stroke="'+ink+'" stroke-width="1.5"/>'+center(x+16.5,225,v,24);});body+='<rect data-total-kg="'+p.total+'" x="337" y="177" width="74" height="59" rx="8" fill="#eaf0ff" stroke="'+ink+'" stroke-width="2"/>'+center(374,214,p.total,29)+center(374,165,'кг',21);}
 else{const X=x=>240+20*x,Y=y=>180-20*y;for(let n=-7;n<=7;n++){body+=line([X(-7),Y(n)],[X(7),Y(n)],soft,1)+line([X(n),Y(-7)],[X(n),Y(7)],soft,1);if(n&&n%2===0)body+=center(X(n),Y(0)+22,n,18)+text(X(0)-12,Y(n)+6,n,18,ink,'text-anchor="end"');}body+=line([X(-7),Y(0)],[X(7)+8,Y(0)],ink,1.8)+line([X(0),Y(-7)],[X(0),Y(7)-8],ink,1.8)+text(X(0)+8,Y(0)+20,0,18)+text(X(7)+15,Y(0)+7,'x')+text(X(0)+10,Y(7)-10,'y');if(p.equation&&p.scene!=='points'){const ends=lineBoundary(parseEquation(p.equation));body+=line(ends[0].map((v,i)=>i?Y(v):X(v)),ends[1].map((v,i)=>i?Y(v):X(v)),blue,3,'data-equation="'+esc(p.equation)+'"');}
  for(const v of p.points||[]){body+='<circle data-point="'+v.label+'" data-coordinate="'+v.xy.join(',')+'" cx="'+X(v.xy[0])+'" cy="'+Y(v.xy[1])+'" r="5" fill="'+purple+'"/>'+center(X(v.xy[0])+(v.labelDx??14),Y(v.xy[1])+(v.labelDy??-10),v.label,23,purple);}}
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-labelledby="title desc"><title id="title">Теңдеу және график</title><desc id="desc">'+esc(descriptionFor(q))+'</desc><rect width="480" height="360" rx="18" fill="#fff"/><g font-family="Arial,sans-serif" stroke-linecap="round" stroke-linejoin="round">'+body+'</g></svg>';
}
export function verifyEdition(q){const r=independentlyCalculate(q);assert.equal(r.answer,q.answer,'Independent two-variable target');assert.equal(statementFor(q),q.statement);assert.equal(solutionFor(q),q.solution);assert.equal(descriptionFor(q),q.figureDescription);assert.equal(sha(svgFor(q)),q.figureSha256);if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(v=>v===r.answer).length,1);}return {answer:r.answer,checks:Object.entries(r.checks).map(([k,v])=>k+': '+JSON.stringify(v))};}
