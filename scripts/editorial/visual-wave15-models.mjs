// Graph readings use exact integer cross-products; native scales use the same units.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const prefix='visual-wave15-',kind=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
export function graphValue(points,x){
 for(let i=1;i<points.length;i++){const [a,b]=[points[i-1],points[i]];assert.ok(b[0]>a[0]);if(a[0]<=x&&x<=b[0])return {n:a[1]*(b[0]-a[0])+(x-a[0])*(b[1]-a[1]),d:b[0]-a[0]};}
 throw Error('Requested input lies in the drawn graph domain');
}
const integer=r=>{assert.equal(r.n%r.d,0,'Exact integer reading');return r.n/r.d;};
export function graphInverse(points,y){
 const xs=[];for(let i=1;i<points.length;i++){const [a,b]=[points[i-1],points[i]];if(Math.min(a[1],b[1])<=y&&y<=Math.max(a[1],b[1])){assert.notEqual(a[1],b[1],'No interval of inverse answers');const x=integer({n:a[0]*(b[1]-a[1])+(y-a[1])*(b[0]-a[0]),d:b[1]-a[1]});if(!xs.includes(x))xs.push(x);}}
 assert.equal(xs.length,1,'Unique drawn inverse');return xs[0];
}
export function independentlyCalculate(q){
 const p=q.params,k=kind(q);let answer,checks;const main=p.series[0].points;
 for(const s of p.series)for(const [x,y]of s.points)assert.ok(x>=0&&x<=p.xMax&&y>=0&&y<=p.yMax);
 switch(k){
 case 'point-on-cost-graph':{const matches=p.candidates.filter(r=>{const v=graphValue(main,r.x);return v.n===r.y*v.d;});assert.equal(matches.length,1);answer=matches[0].label;checks={candidateCoordinates:p.candidates.map(r=>[r.label,r.x,r.y])};break;}
 case 'stopped-duration':{const stops=main.slice(1).map((b,i)=>({a:main[i],b})).filter(({a,b})=>a[1]===b[1]);assert.equal(stops.length,1);answer=String(stops[0].b[0]-stops[0].a[0]);checks={start:stops[0].a[0],end:stops[0].b[0],level:stops[0].a[1]};break;}
 case 'discrete-ticket-price':{const rates=main.map(([n,c])=>{assert.ok(n>0&&Number.isInteger(n)&&c%n===0);return c/n;});assert.ok(rates.every(v=>v===rates[0]));answer=String(rates[0]);checks={rates};break;}
 case 'inverse-water-time':
 case 'inverse-square-side':{const x=graphInverse(main,p.requestedY);answer=String(x);checks={point:[x,p.requestedY]};break;}
 case 'faster-same-time':{const at=p.series.map(s=>({label:s.label,value:integer(graphValue(s.points,p.comparisonTime))})),max=Math.max(...at.map(r=>r.value)),good=at.filter(r=>r.value===max);assert.equal(good.length,1);answer=good[0].label;checks={atSameTime:at,time:p.comparisonTime};break;}
 case 'interpret-mass-point':{const v=graphValue(main,p.point[0]);assert.equal(v.n,p.point[1]*v.d);answer=p.point[0]+' дм³ түйіршіктің массасы '+p.point[1]+' кг';checks={volume:p.point[0],mass:p.point[1]};break;}
 case 'plant-height-difference':{const first=integer(graphValue(main,p.firstTime)),second=integer(graphValue(main,p.secondTime));assert.ok(second>first);answer=String(second-first);checks={firstHeight:first,secondHeight:second};break;}
 case 'fuel-remaining':
 case 'cycle-distance':{const y=integer(graphValue(main,p.requestedX));answer=String(y);checks={point:[p.requestedX,y]};break;}
 default:throw Error('Known graph target '+k);
 }
 return {answer,checks};
}
function core(q){
 const p=q.params;
 switch(kind(q)){
 case 'point-on-cost-graph':return 'Графикте таспаның C құнының оның ℓ ұзындығына тәуелділігі берілген. A, B, C, D нүктелерінің қайсысы график сызығының дәл бойында жатыр?';
 case 'stopped-duration':return 'Данияр жаяу жүріп, жолда аялдады. Графикте жүрген жолының уақытқа тәуелділігі көрсетілген. Ол неше минут қозғалмай тұрды? Уақыт шкаласының бір аралығына назар аударыңыз.';
 case 'discrete-ticket-price':return 'Көрме билеттерінің жалпы құны билет санына тәуелді түрде жеке нүктелермен берілген. Әр билет бірдей бағамен сатылады. Бір билеттің бағасы неше теңге?';
 case 'inverse-water-time':return 'Ыдыста жиналған судың көлемі графикте көрсетілген. Көлем '+p.requestedY+' литрге неше минутта жетеді?';
 case 'faster-same-time':return 'Екі қатысушы бір мезгілде бір жерден шыққан. Олардың жүрген жолдары I және II графиктерімен берілген. Қай график жылдамдығы үлкен қатысушыға тиесілі?';
 case 'interpret-mass-point':return 'График түйіршіктің m массасының V көлеміне тәуелділігін көрсетеді. Белгіленген A нүктесі нені білдіреді?';
 case 'plant-height-difference':return 'Көшет биіктігінің аптаға тәуелділік графигі берілген. '+p.firstTime+'-аптаның соңынан '+p.secondTime+'-аптаның соңына дейін көшет неше сантиметрге өскен?';
 case 'fuel-remaining':return 'Автокөліктегі отынның қалған көлемі жүрілген жолға тәуелді графикпен берілген. '+p.requestedX+' км жүргеннен кейін неше литр отын қалады?';
 case 'inverse-square-side':return 'Квадраттың P периметрі оның a қабырғасына тәуелді. Графикті пайдаланып, периметрі '+p.requestedY+' см квадраттың қабырғасы неше сантиметр болатынын табыңыз.';
 case 'cycle-distance':return 'Велосипедшінің жүрген жолы уақытқа тәуелді графикпен берілген. '+p.requestedX+' сағатта ол неше километр жүрген?';
 default:throw Error('Known condition');
 }
}
export const statementFor=q=>core(q)+(q.options?'':' Жауапқа тек санды жазыңыз.');
export function solutionFor(q){
 const p=q.params,r=independentlyCalculate(q);
 switch(kind(q)){
 case 'point-on-cost-graph':return 'График әр метрге 2000 теңге көрсетеді. A(2; 2000) төмен, C(4; 6000) төмен, D(5; 8000) төмен. B(3; 6000) үшін 3 × 2000 = 6000, сондықтан тек B графикте жатыр.';
 case 'stopped-duration':return 'Жол '+r.checks.level+' м деңгейінде өзгермейтін көлденең бөлік '+r.checks.start+' минутта басталып, '+r.checks.end+' минутта аяқталады. Аялдау '+r.checks.end+' − '+r.checks.start+' = '+r.answer+' минут. Үш ұсақ тор аралығының әрқайсысы '+p.xStep+' минут екенін ескереміз.';
 case 'discrete-ticket-price':return 'Мысалы, 2 билет 700 теңге, сондықтан бір билет 700 : 2 = '+r.answer+' теңге. Қалған нүктелер де сол бағаны береді: 1050 : 3 = 1750 : 5 = 2100 : 6 = '+r.answer+'. Билет саны бөлшек болмайтындықтан, нүктелерді үздіксіз сызықпен қоспаймыз.';
 case 'inverse-water-time':return 'Көлем осіндегі '+p.requestedY+' л мәнінен графикке дейін көлденең, одан уақыт осіне тік бағытпен оқимыз: t = '+r.answer+' мин. Графиктен минутына 24 л, '+r.answer+' × 24 = '+p.requestedY+' л.';
 case 'faster-same-time':return p.comparisonTime+' сағатта '+r.checks.atSameTime.map(r=>r.label+' графигі '+r.value+' км').join(', ')+'. Бірдей уақытта II көбірек жол жүреді: 30 : 2 = 15 км/сағ, ал I үшін 12 : 2 = 6 км/сағ. Сондықтан жылдамы '+r.answer+'.';
 case 'interpret-mass-point':return 'A нүктесінің абсциссасы V = '+p.point[0]+' дм³, ординатасы m = '+p.point[1]+' кг. Демек, '+r.answer+'. Координаталардың мағынасы мен ретін ауыстыруға болмайды.';
 case 'plant-height-difference':return 'Бір тік тор аралығы '+p.yStep+' см. '+p.firstTime+' аптада h = '+r.checks.firstHeight+' см, '+p.secondTime+' аптада h = '+r.checks.secondHeight+' см. Өсімі '+r.checks.secondHeight+' − '+r.checks.firstHeight+' = '+r.answer+' см. Сұралғаны соңғы биіктік емес, өзгерісі.';
 case 'fuel-remaining':{const initial=p.series[0].points[0][1],spent=initial-Number(r.answer);return 'Жол осіндегі '+p.requestedX+' км мәніне сәйкес график ординатасы '+r.answer+' л. Басында '+initial+' л болған. '+p.requestedX+' км-де '+spent+' л жұмсалған, ал сұралған қалғаны '+initial+' − '+spent+' = '+r.answer+' л.';}
 case 'inverse-square-side':return 'P = '+p.requestedY+' деңгейінен графикке көлденең барып, a осіне түсеміз: a = '+r.answer+' см. Тексеру: P = 4a, 4 × '+r.answer+' = '+p.requestedY+' см.';
 case 'cycle-distance':return 't = '+p.requestedX+' сағаттағы график биіктігі '+r.answer+' км. График бір сағатта 12 км жолды көрсетеді, сондықтан 12 × '+p.requestedX+' = '+r.answer+' км.';
 default:throw Error('Known solution');
 }
}
export function descriptionFor(q){
 const p=q.params;return 'Көлденең ось '+p.xLabel+', 0–'+p.xMax+', бір аралық '+p.xStep+'. Тік ось '+p.yLabel+', 0–'+p.yMax+', бір аралық '+p.yStep+'. '+p.series.map(s=>(s.label||'Негізгі')+' '+(s.discrete?'жеке нүктелері':'сынық сызық төбелері')+': '+s.points.map(v=>'('+v.join('; ')+')').join(', ')).join('. ')+'. '+(p.candidates?'Белгіленген нүктелер '+p.candidates.map(r=>r.label+'('+r.x+'; '+r.y+')').join(', ')+'.':p.point?'A('+p.point.join('; ')+') белгіленген.':'');
}
export function svgFor(q){
 const p=q.params,blue='#315ce8',purple='#8459ce',ink='#203549',soft='#dbe5f1',left=76,right=420,top=48,bottom=286,X=x=>left+x/p.xMax*(right-left),Y=y=>bottom-y/p.yMax*(bottom-top);let body='';
 const line=(x1,y1,x2,y2,color=ink,width=2,extra='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
 const text=(x,y,t,size=21,color=ink,extra='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+esc(t)+'</text>';
 const center=(x,y,t,size=21,color=ink)=>text(x,y,t,size,color,'text-anchor="middle" stroke="#fff" stroke-width="4" paint-order="stroke"');
 assert.ok(p.xMax%p.xStep===0&&p.yMax%p.yStep===0);
 for(let n=0;n<=p.xMax;n+=p.xStep){body+=line(X(n),top,X(n),bottom,soft,1,'data-x-grid="'+n+'"');if(n%p.xLabelEvery===0)body+=center(X(n),310,n,18);}
 for(let n=0;n<=p.yMax;n+=p.yStep){body+=line(left,Y(n),right,Y(n),soft,1,'data-y-grid="'+n+'"');if(n&&n%p.yLabelEvery===0)body+=text(left-10,Y(n)+6,n,18,ink,'text-anchor="end"');}
 body+=line(left,bottom,right+8,bottom,ink,2)+line(left,bottom,left,top-7,ink,2)+text(left-2,25,p.yLabel,19)+center((left+right)/2,345,p.xLabel,20);
 for(const [i,s]of p.series.entries()){
  const color=i?purple:blue;
  if(s.discrete)for(const pt of s.points)body+='<circle data-discrete-point="'+pt.join(',')+'" cx="'+X(pt[0])+'" cy="'+Y(pt[1])+'" r="6" fill="'+color+'"/>';
  else body+='<polyline data-series="'+(s.label||'main')+'" data-coordinates="'+s.points.map(v=>v.join(',')).join(';')+'" points="'+s.points.map(([x,y])=>X(x)+','+Y(y)).join(' ')+'" fill="none" stroke="'+color+'" stroke-width="3"/>';
  if(s.label){const pt=s.points.at(-1);body+=center(X(pt[0])+(s.labelDx??18),Y(pt[1])+(s.labelDy??-9),s.label,22,color);}
 }
 for(const r of p.candidates||[]){body+='<circle data-candidate="'+r.label+'" data-x="'+r.x+'" data-y="'+r.y+'" cx="'+X(r.x)+'" cy="'+Y(r.y)+'" r="5" fill="'+ink+'"/>'+center(X(r.x)+(r.dx??12),Y(r.y)+(r.dy??-12),r.label,23);}
 if(p.point){const [x,y]=p.point;body+=line(X(x),bottom,X(x),Y(y),purple,1.4,'stroke-dasharray="5 4"')+line(left,Y(y),X(x),Y(y),purple,1.4,'stroke-dasharray="5 4"')+'<circle data-interpret-point="'+x+','+y+'" cx="'+X(x)+'" cy="'+Y(y)+'" r="5" fill="'+purple+'"/>'+center(X(x)+17,Y(y)-15,'A',24,purple);}
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-labelledby="title desc"><title id="title">Шамалардың графигі</title><desc id="desc">'+esc(descriptionFor(q))+'</desc><rect width="480" height="360" rx="18" fill="#fff"/><g font-family="Arial, sans-serif" stroke-linecap="round" stroke-linejoin="round">'+body+'</g></svg>';
}
export function verifyEdition(q){
 const r=independentlyCalculate(q);assert.equal(r.answer,q.answer,'Independent graph answer');assert.equal(statementFor(q),q.statement,'Exact parameter-bound statement');assert.equal(solutionFor(q),q.solution,'Exact parameter-bound solution');assert.equal(descriptionFor(q),q.figureDescription,'Exact accessible description');assert.equal(sha(svgFor(q)),q.figureSha256,'Exact native SVG digest');if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(v=>v===r.answer).length,1);}
 return {answer:r.answer,checks:Object.entries(r.checks).map(([k,v])=>k+': '+JSON.stringify(v))};
}
