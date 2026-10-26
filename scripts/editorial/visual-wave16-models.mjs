import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {graphValue} from './visual-wave15-models.mjs';
const prefix='visual-wave16-',kind=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),fmt=n=>String(n).replace('.',',');
const at=(p,x)=>{const r=graphValue(p.points,x),n=r.n/r.d;assert.ok(Number.isInteger(n),'Exact integer process reading');return n;};
export function horizontalIntervals(points){return points.slice(1).map((b,i)=>({start:points[i][0],end:b[0],value:b[1]})).filter((r,i)=>points[i][1]===points[i+1][1]);}
export function strictlyIncreasingOver(points,start,end){
 assert.ok(start<end&&start>=points[0][0]&&end<=points.at(-1)[0]);return points.slice(1).every((b,i)=>{const a=points[i];return Math.max(a[0],start)>=Math.min(b[0],end)||b[1]>a[1];});
}
export function independentlyCalculate(q){
 const p=q.params,k=kind(q);let answer,checks;assert.ok(p.yMin<p.yMax);for(const [x,y]of p.points)assert.ok(x>=0&&x<=p.xMax&&y>=p.yMin&&y<=p.yMax);
 switch(k){
 case 'spring-month-inverse':{const all=p.points.filter(([n,h])=>h===p.requestedY).map(r=>r[0]),spring=all.filter(n=>[3,4,5].includes(n));assert.ok(all.length>=2);assert.equal(spring.length,1);answer=String(spring[0]);checks={allMonths:all,springMonths:[3,4,5]};break;}
 case 'signed-diver-minimum':{const min=Math.min(...p.points.map(r=>r[1]));assert.ok(min<0);answer=min+' м';checks={minimum:min,firstPlateau:horizontalIntervals(p.points)[0].value};break;}
 case 'battery-early-loss':{const initial=at(p,0),after=at(p,p.until);assert.equal(initial,100,'This source form uses100% initial charge');assert.ok(after<initial);answer=String(initial-after);checks={initial,after,until:p.until};break;}
 case 'cruise-duration':{const intervals=horizontalIntervals(p.points).filter(r=>r.value>0);assert.equal(intervals.length,1);const r=intervals[0];answer=(r.end-r.start)+' мин';checks={interval:r};break;}
 case 'fractional-stop-interval':{const intervals=horizontalIntervals(p.points);assert.equal(intervals.length,1);const r=intervals[0];answer=fmt(r.start)+' сағаттан '+fmt(r.end)+' сағатқа дейін';checks={interval:r};break;}
 case 'maximum-speed':answer=String(Math.max(...p.points.map(r=>r[1])));checks={maximum:Number(answer)};break;
 case 'maximum-pulse':answer=String(Math.max(...p.points.map(r=>r[1])));checks={maximum:Number(answer),axisLimit:p.yMax};assert.ok(Number(answer)<p.yMax);break;
 case 'cooling-at-time':answer=String(at(p,p.requestedX));checks={point:[p.requestedX,Number(answer)]};assert.ok(p.points.slice(1).every((r,i)=>r[1]<p.points[i][1]));break;
 case 'total-bus-distance':assert.ok(p.points.slice(1).every((r,i)=>r[1]>=p.points[i][1]));answer=String(p.points.at(-1)[1]);checks={finalTime:p.points.at(-1)[0],total:Number(answer)};break;
 case 'increasing-interval':{const good=p.intervals.filter(r=>strictlyIncreasingOver(p.points,r.start,r.end));assert.equal(good.length,1);answer=good[0].display;checks={start:good[0].start,end:good[0].end};break;}
 case 'peak-river-month':{const max=Math.max(...p.points.map(r=>r[1])),good=p.points.filter(r=>r[1]===max);assert.equal(good.length,1);answer=String(good[0][0]);checks={peakHeight:max};break;}
 case 'initial-tank-volume':assert.equal(p.points[0][0],0);answer=String(p.points[0][1]);checks={initialVolume:Number(answer),laterMaximum:Math.max(...p.points.map(r=>r[1]))};break;
 case 'negative-winter-reading':{const y=at(p,p.requestedX);assert.ok(y<0);answer=y+'°C';checks={time:p.requestedX,temperature:y};break;}
 default:throw Error('Known process target '+k);
 }
 return {answer,checks};
}
function core(q){
 const p=q.params;
 switch(kind(q)){
 case 'spring-month-inverse':return 'Диаграммада ай ортасындағы күн ұзақтығы берілген: 1 — қаңтар, 12 — желтоқсан. Көктемгі айлардың қайсысында күн ұзақтығы '+p.requestedY+' сағат болған? Ай нөмірін жазыңыз.';
 case 'signed-diver-minimum':return 'Сүңгуірдің су бетіне қатысты h орны уақытқа тәуелді көрсетілген. Су беті h = 0, су астындағы орындар теріс. Оның жеткен ең төменгі орнының h мәнін таңдаңыз.';
 case 'battery-early-loss':return 'Телефон заряды уақыт бойынша өзгерген. Алғашқы '+p.until+' сағатта заряд неше пайызға азайған? Кейінгі зарядталу бөлігін бұл аралыққа қоспаңыз.';
 case 'cruise-duration':return 'Ұшақ биіктігінің уақытқа тәуелділігі берілген. Ұшақ неше минут бойы бірдей оң биіктікте ұшқан?';
 case 'fractional-stop-interval':return 'Жаяу жүргіншінің жүрген жолы уақытқа тәуелді берілген. Ол қай уақыт аралығында бір орында тұрған? Бір ұсақ тор аралығы жарты сағат екенін ескеріңіз.';
 case 'maximum-speed':return 'Автокөлік жылдамдығының уақытқа тәуелділік графигі берілген. Оның ең үлкен жылдамдығы неше км/сағ?';
 case 'maximum-pulse':return 'Жүгіру жаттығуы кезінде пульс минутына соғу санымен тіркелген. График бойынша ең жоғары пульсті таңдаңыз.';
 case 'cooling-at-time':return 'Ыстық сусын суып жатыр. Құйылғаннан '+p.requestedX+' минут өткенде оның температурасы неше градус Цельсий болған?';
 case 'total-bus-distance':return 'Автобустың жинақталған жүрген жолы графикпен берілген. Бүкіл сапарда автобус барлығы неше километр жүрген?';
 case 'increasing-interval':return 'Ауа температурасының тәулік ішіндегі графигі берілген. Ұсынылған қай аралықта температура тек өскен?';
 case 'peak-river-month':return 'Өзен деңгейі жылдың ай нөміріне тәуелді көрсетілген. Су деңгейі ең жоғары болған айдың нөмірін табыңыз.';
 case 'initial-tank-volume':return 'Бактағы су көлемінің өзгерісі графикпен берілген. Бақылау басталғанда, t = 0 сәтінде, бакта неше литр су болған?';
 case 'negative-winter-reading':return 'Қыстағы ауа температурасының тәулік ішіндегі бөлігі графикте көрсетілген. Сағат '+p.requestedX+'-дегі температураны таңдаңыз.';
 default:throw Error('Known condition');
 }
}
export const statementFor=q=>core(q)+(q.options?'':' Жауапқа тек санды жазыңыз.');
export function solutionFor(q){
 const p=q.params,r=independentlyCalculate(q);
 switch(kind(q)){
 case 'spring-month-inverse':return p.requestedY+' сағат деңгейіндегі айлар '+r.checks.allMonths.join(' және ')+'. Көктем айлары 3, 4, 5. Осы шартқа сәйкес келетіні '+r.answer+'. Екінші қиылысу — күзгі ай.';
 case 'signed-diver-minimum':return 'Графиктің ең төменгі көлденең бөлігі '+r.checks.minimum+' м деңгейінде. Сондықтан жауап '+r.answer+'. '+Math.abs(r.checks.minimum)+' м — су бетінен қашықтық, бірақ сұралған h орны теріс таңбамен беріледі. Алғашқы тоқтау '+r.checks.firstPlateau+' м, ол ең төменгі емес.';
 case 'battery-early-loss':return 'Бастапқы заряд '+r.checks.initial+'%, '+p.until+' сағаттан кейін '+r.checks.after+'%. Азаюы '+r.checks.initial+' − '+r.checks.after+' = '+r.answer+'%. Кейін зарядталған бөлік осы алғашқы аралыққа кірмейді.';
 case 'cruise-duration':return 'Биіктік өзгермейтін бөлік '+r.checks.interval.start+' минуттан '+r.checks.interval.end+' минутқа дейін. Ұзақтығы '+r.checks.interval.end+' − '+r.checks.interval.start+' = '+r.answer+'. Соңғы уақыттың өзін немесе биіктікті уақыт деп алуға болмайды.';
 case 'fractional-stop-interval':return 'Жол '+r.checks.interval.value+' км деңгейінде өзгермейтін бөлік t = '+fmt(r.checks.interval.start)+' сағатта басталып, t = '+fmt(r.checks.interval.end)+' сағатта аяқталады. Сондықтан '+r.answer+'. Торкөз саны мен сағат саны бірдей емес.';
 case 'maximum-speed':return 'Графиктің ең биік көлденең бөлігі '+r.answer+' км/сағ деңгейінде. Мұнда көлденең сызық тоқтауды емес, тұрақты жылдамдықты білдіреді, себебі тік ось жылдамдықты көрсетеді.';
 case 'maximum-pulse':return 'Ең жоғары график деңгейі '+r.answer+' соғу/мин. Бұл '+(Number(r.answer)-10)+' пен '+(Number(r.answer)+10)+' арасындағы ұсақ торда. Осьтің шегі '+p.yMax+', бірақ график оған жетпейді.';
 case 'cooling-at-time':return 'Уақыт осіндегі '+p.requestedX+' минуттан графикке жоғары оқимыз. Нүкте '+r.answer+'°C деңгейінде. Тік тордың бір аралығы '+p.yStep+'°C; 40 пен 60 арасындағы ортаңғы мән 50.';
 case 'total-bus-distance':return 'Жинақталған жолдың соңғы нүктесі t = '+r.checks.finalTime+' сағатта '+r.answer+' км көрсетеді. Көлденең бөлікте жол қосылмаған. Барлық нүктенің биіктіктерін қосу қажет емес.';
 case 'increasing-interval':return r.checks.start+' сағаттан '+r.checks.end+' сағатқа дейін графиктің барлық бөліктері солдан оңға қарай жоғары көтеріледі. Оған дейін және одан кейін төмендейтін бөліктер бар. Сондықтан '+r.answer+'.';
 case 'peak-river-month':return 'Графиктің ең үлкен ординатасы '+r.checks.peakHeight+' см. Сол нүктенің ай нөмірі '+r.answer+'. Сұрақ су биіктігін емес, айды сұрайды.';
 case 'initial-tank-volume':return 't = 0 нүктесіндегі көлем '+r.answer+' л. Ол тік осьтегі бастапқы қиылысу. Кейінгі ең үлкен '+r.checks.laterMaximum+' л көлем бастапқы көлем емес.';
 case 'negative-winter-reading':return 't = '+p.requestedX+' сағаттағы нүкте нөл деңгейінен төмен, '+r.checks.temperature+'°C-де орналасқан. Бір ұсақ аралық '+p.yStep+'°C. Минус таңбасы міндетті: жауап '+r.answer+'.';
 default:throw Error('Known solution');
 }
}
export function descriptionFor(q){
 const p=q.params;return 'Көлденең ось '+p.xLabel+': 0–'+p.xMax+', ұсақ қадам '+fmt(p.xStep)+'. Тік ось '+p.yLabel+': '+p.yMin+'–'+p.yMax+', ұсақ қадам '+p.yStep+'. '+(p.yMin<0?'Нөл деңгейі жеке қою сызықпен белгіленген. ':'')+'Сынық сызық төбелері '+p.points.map(v=>'('+v.map(fmt).join('; ')+')').join(', ')+'.';
}
export function svgFor(q){
 const p=q.params,blue='#315ce8',purple='#8459ce',ink='#203549',soft='#dbe5f1',left=76,right=420,top=48,bottom=286,X=x=>left+x/p.xMax*(right-left),Y=y=>bottom-(y-p.yMin)/(p.yMax-p.yMin)*(bottom-top);let body='';
 const line=(x1,y1,x2,y2,color=ink,width=2,extra='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
 const text=(x,y,t,size=21,color=ink,extra='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+esc(t)+'</text>';
 const center=(x,y,t,size=21,color=ink)=>text(x,y,t,size,color,'text-anchor="middle" stroke="#fff" stroke-width="4" paint-order="stroke"');
 const nx=p.xMax/p.xStep,ny=(p.yMax-p.yMin)/p.yStep;assert.ok(Number.isInteger(nx)&&Number.isInteger(ny));
 for(let i=0;i<=nx;i++){const v=i*p.xStep;body+=line(X(v),top,X(v),bottom,soft,1,'data-x-grid="'+v+'"');if(Number.isInteger(v/p.xLabelEvery))body+=center(X(v),310,fmt(v),18);}
 for(let i=0;i<=ny;i++){const v=p.yMin+i*p.yStep;body+=line(left,Y(v),right,Y(v),v===0?purple:soft,v===0?1.6:1,'data-y-grid="'+v+'"');if(v%p.yLabelEvery===0)body+=text(left-10,Y(v)+6,v,18,ink,'text-anchor="end"');}
 body+=line(left,bottom,right+6,bottom,ink,2)+line(left,bottom,left,top-7,ink,2)+text(left-2,25,p.yLabel,19)+center((left+right)/2,345,p.xLabel,20);
 body+='<polyline data-coordinates="'+p.points.map(v=>v.join(',')).join(';')+'" points="'+p.points.map(([x,y])=>X(x)+','+Y(y)).join(' ')+'" fill="none" stroke="'+blue+'" stroke-width="3"/>';
 if(p.markMonths)for(const [x,y]of p.points)body+='<circle data-month="'+x+'" cx="'+X(x)+'" cy="'+Y(y)+'" r="4" fill="'+blue+'"/>';
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-labelledby="title desc"><title id="title">Процестің графигі</title><desc id="desc">'+esc(descriptionFor(q))+'</desc><rect width="480" height="360" rx="18" fill="#fff"/><g font-family="Arial, sans-serif" stroke-linecap="round" stroke-linejoin="round">'+body+'</g></svg>';
}
export function verifyEdition(q){
 const r=independentlyCalculate(q);assert.equal(r.answer,q.answer,'Independent process answer');assert.equal(statementFor(q),q.statement,'Exact parameter-bound statement');assert.equal(solutionFor(q),q.solution,'Exact parameter-bound solution');assert.equal(descriptionFor(q),q.figureDescription,'Exact accessible description');assert.equal(sha(svgFor(q)),q.figureSha256,'Exact native SVG digest');if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(v=>v===r.answer).length,1);}
 return {answer:r.answer,checks:Object.entries(r.checks).map(([k,v])=>k+': '+JSON.stringify(v))};
}
