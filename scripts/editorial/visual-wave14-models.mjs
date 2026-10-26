import assert from 'node:assert/strict';
import crypto from 'node:crypto';
// Reuse the reviewed exact parser, never evaluated source code or model answers.
import {parseAffine} from './visual-wave10-models.mjs';
const prefix='visual-wave14-',kind=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const exactValue=(formula,x)=>{const rhs=formula.replace(/^y\s*=\s*/,''),[a,b]=parseAffine(rhs);return {n:a.n*x*b.d+b.n*a.d,d:a.d*b.d};};
export function matchesAll(formula,xs,ys){assert.equal(xs.length,ys.length);return xs.every((x,i)=>{const v=exactValue(formula,x);return v.n===ys[i]*v.d;});}
export function isFunction(panel){return panel.xs.every(x=>panel.links.filter(r=>r[0]===x).length===1)&&panel.links.every(([x,y])=>panel.xs.includes(x)&&panel.ys.includes(y));}
export function independentlyCalculate(q){
 const p=q.params,k=kind(q);let answer,checks;
 switch(k){
 case 'shuffled-arrow-formula':
 case 'proportional-table-formula':{const good=q.options.filter(f=>matchesAll(f,p.xs,p.ys));assert.equal(good.length,1);answer=good[0];checks={pairs:p.xs.map((x,i)=>[x,p.ys[i]])};break;}
 case 'variable-rectangle-area':answer=String(p.fixed*p.value);checks={formula:'S = '+p.fixed+'a',value:p.value};break;
 case 'single-valued-gallery':{const good=p.panels.map((panel,i)=>isFunction(panel)?i+1:null).filter(Boolean);assert.equal(good.length,1);answer=String(good[0]);checks={outDegrees:p.panels.map(t=>t.xs.map(x=>t.links.filter(r=>r[0]===x).length))};break;}
 case 'equal-mark-perimeter':assert.equal(p.equalMarks,3);answer=String(p.value*3);checks={formula:'P = 3a',equalSides:3};break;
 case 'temperature-time-max':{const max=Math.max(...p.ys),good=p.xs.filter((x,i)=>p.ys[i]===max);assert.equal(good.length,1);answer=String(good[0]);checks={maxTemperature:max};break;}
 case 'fare-inverse-table':{const good=p.xs.filter((x,i)=>p.ys[i]===p.requested);assert.equal(good.length,1);assert.ok(p.xs.every((x,i)=>p.ys[i]===x*p.fare));answer=String(good[0]);checks={fare:p.fare,requestedRevenue:p.requested};break;}
 case 'independent-table-step':{const dx=p.xs.slice(1).map((v,i)=>v-p.xs[i]);assert.ok(dx.length>0&&dx.every(v=>v===dx[0]&&v>0));answer=String(dx[0]);checks={independentSteps:dx,dependentSteps:p.ys.slice(1).map((v,i)=>v-p.ys[i])};break;}
 case 'formula-table-error':{const wrong=p.xs.filter((x,i)=>!matchesAll(p.formula,[x],[p.ys[i]]));assert.equal(wrong.length,1);answer='x = '+wrong[0];checks={expected:p.xs.map(x=>{const v=exactValue(p.formula,x);assert.equal(v.n%v.d,0);return v.n/v.d;})};break;}
 case 'candle-hourly-loss':{const rates=p.ys.slice(1).map((h,i)=>{const dt=p.xs[i+1]-p.xs[i],dh=p.ys[i]-h;assert.ok(dt>0&&dh>0&&dh%dt===0);return dh/dt;});assert.ok(rates.length&&rates.every(v=>v===rates[0]));answer=String(rates[0]);checks={hourlyRates:rates};break;}
 default:throw Error('Known dependency model '+k);
 }
 return {answer,checks};
}
function core(q){
 const p=q.params;
 switch(kind(q)){
 case 'shuffled-arrow-formula':return 'Әр x санына y саны нұсқар арқылы сәйкестендірілген. Оң жақтағы сандардың жазылу ретіне емес, нұсқарлардың ұштарына қараңыз. Барлық сәйкестікті қай формула береді?';
 case 'variable-rectangle-area':return 'Тіктөртбұрыштың ауданын a қабырғасына тәуелді формуламен өрнектеңіз. a = '+p.value+' см болғандағы ауданын табыңыз.';
 case 'single-valued-gallery':return 'Қай сызбада x-тің әр мәнінен y-тің дәл бір мәніне нұсқар шығады? Әртүрлі x сандарына бірдей y сәйкес келуі мүмкін.';
 case 'equal-mark-perimeter':return 'Үшбұрыштың қабырғаларындағы бірдей сызықшалар олардың тең екенін білдіреді. P-ның a-ға тәуелділік формуласын қолданып, a = '+p.value+' см болғанда периметрдің сандық мәнін табыңыз.';
 case 'temperature-time-max':return 'Кестеде күн бойы өлшенген ауа температурасы берілген. Кестедегі қай сағатта температура ең жоғары болды?';
 case 'proportional-table-formula':return 'Кестенің әр бағанында x пен y мәндері берілген. Барлық бағанға сәйкес келетін формуланы таңдаңыз.';
 case 'fare-inverse-table':return 'Кестеде бірдей бағамен сатылған билеттерден түскен S теңгенің билет саны n-ге тәуелділігі берілген. Түсім '+p.requested+' теңге болса, неше билет сатылған?';
 case 'independent-table-step':return 'Кестеде қозғалыс уақыты t және жүрген жол s берілген. Тәуелсіз айнымалы t бойынша кестенің қадамы неше сағат?';
 case 'formula-table-error':return 'Оқушы '+p.formula+' формуласы бойынша кесте толтырғанда бір бағандағы y мәнін қате жазған. Қате қай x мәнінің бағанында?';
 case 'candle-hourly-loss':return 'Шамның жану уақыты t мен қалған биіктігі h кестеде көрсетілген. Шам әр сағатта неше сантиметрге қысқарады?';
 default:throw Error('Known condition');
 }
}
export const statementFor=q=>core(q)+(q.options?'':' Жауапқа тек санды жазыңыз.');
export function solutionFor(q){
 const p=q.params,k=kind(q),r=independentlyCalculate(q);
 switch(k){
 case 'shuffled-arrow-formula':return 'Нұсқарларды оқимыз: '+p.xs.map((x,i)=>x+' → '+p.ys[i]).join(', ')+'. '+r.answer+' әр жұпқа сай келеді: '+p.xs.map((x,i)=>'x = '+x+' үшін y = '+p.ys[i]).join('; ')+'. Басқа нұсқалар бірінші жұпқа сай болғанымен, келесі жұптарда бұзылады.';
 case 'variable-rectangle-area':return 'Аудан екі қабырғаның көбейтіндісі: S = '+p.fixed+'a. a = '+p.value+' болса, S = '+p.fixed+' × '+p.value+' = '+r.answer+' см². a — тәуелсіз, S — тәуелді айнымалы.';
 case 'single-valued-gallery':return 'Сызбаларда әр x-тен шығатын нұсқар сандары ретімен: '+r.checks.outDegrees.map((a,i)=>(i+1)+': '+a.join(', ')).join('; ')+'. Тек 3-сызбада әрқайсысы 1. Екі әртүрлі x-тің бір y-ке келуі рұқсат етілген, себебі әр x-тің өз шығысы жалғыз.';
 case 'equal-mark-perimeter':return 'Үш қабырғаның теңдік белгілері бірдей, сондықтан әрқайсысы a см. P = a + a + a = 3a. a = '+p.value+' кезінде P = 3 × '+p.value+' = '+r.answer+' см.';
 case 'temperature-time-max':return 'Температуралар '+p.ys.join(', ')+'. Ең үлкені '+r.checks.maxTemperature+'°C. Сол бағандағы уақыт '+r.answer+' сағат. Температураны уақытпен шатастырмау керек.';
 case 'proportional-table-formula':return 'Әр бағанда y : x = '+p.ys.map((y,i)=>y+' : '+p.xs[i]).join(' = ')+' = 9. Демек, '+r.answer+'. Бір бағанға ғана сәйкес келу жеткіліксіз: барлық жұп тексеріледі.';
 case 'fare-inverse-table':return 'Кестенің түсім жолынан '+p.requested+' санын табамыз. Оның үстіндегі билет саны '+r.answer+'. Тексеру: бір билет '+p.fare+' теңге, '+r.answer+' × '+p.fare+' = '+p.requested+' теңге.';
 case 'independent-table-step':return 'Уақыт жолы '+p.xs.join(', ')+'. Көршілес уақыттардың айырмасы үнемі '+r.answer+' сағат. Жолдың әр өзгерісі '+r.checks.dependentSteps[0]+' км, бірақ ол тәуелді айнымалының қадамы; сұралғаны t қадамы.';
 case 'formula-table-error':return 'Формуладан шығатын дұрыс y мәндері '+r.checks.expected.join(', ')+'. Кестедегілер '+p.ys.join(', ')+'. Айырмашылық тек '+r.answer+' бағанында. Қалған бағандар формулаға сай.';
 case 'candle-hourly-loss':return 'Биіктіктер '+p.ys.join(', ')+' см. Көршілес уақыттар '+(p.xs[1]-p.xs[0])+' сағатқа өзгереді. Әр аралықта шам '+(p.ys[0]-p.ys[1])+' см қысқарады; бір сағатта '+(p.ys[0]-p.ys[1])+' : '+(p.xs[1]-p.xs[0])+' = '+r.answer+' см.';
 default:throw Error('Known solution');
 }
}
export function descriptionFor(q){
 const p=q.params;
 if(p.scene==='mapping')return 'Сол жақта x мәндері '+p.xs.join(', ')+', оң жақта y сандары жоғарыдан төмен '+p.displayY.join(', ')+'. Нұсқарлар '+p.xs.map((x,i)=>x+' → '+p.ys[i]).join('; ')+'.';
 if(p.scene==='function-gallery')return 'Төрт сызба. '+p.panels.map((t,i)=>(i+1)+'-сызба: x = '+t.xs.join(', ')+', y = '+t.ys.join(', ')+', нұсқарлар '+t.links.map(v=>v.join(' → ')).join('; ')).join('. ')+'.';
 if(p.scene==='rectangle')return 'Тіктөртбұрыштың көлденең қабырғасы a см, тік қабырғасы '+p.fixed+' см.';
 if(p.scene==='equilateral')return 'Үшбұрыштың әр қабырғасында бірдей бір сызықша бар. Төменгі қабырға a см деп жазылған.';
 return 'Екі жолды кесте. '+p.labels[0]+': '+p.xs.join(', ')+'. '+p.labels[1]+': '+p.ys.join(', ')+'. Бір бағанда тұрғандар өзара сәйкес.';
}
export function svgFor(q){
 const p=q.params,blue='#315ce8',purple='#8459ce',ink='#203549',soft='#dbe5f1';let body='';
 const line=(A,B,color=ink,width=2,extra='')=>'<line x1="'+A[0]+'" y1="'+A[1]+'" x2="'+B[0]+'" y2="'+B[1]+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
 const text=(x,y,t,size=23,color=ink,extra='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+esc(t)+'</text>';
 const center=(x,y,t,size=23,color=ink)=>text(x,y,t,size,color,'text-anchor="middle"');
 function arrow(A,B,extra=''){
  const dx=B[0]-A[0],dy=B[1]-A[1],len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,b=[B[0]-8*ux,B[1]-8*uy];
  return line(A,b,purple,1.7,extra)+'<polygon points="'+[B,[b[0]+4*uy,b[1]-4*ux],[b[0]-4*uy,b[1]+4*ux]].map(v=>v.join(',')).join(' ')+'" fill="'+purple+'"/>';
 }
 if(p.scene==='table'){
  const n=p.xs.length,x=25,y=117,w=430,h=64,labelW=80,cellW=(w-labelW)/n;
  for(let r=0;r<2;r++){body+='<rect x="'+x+'" y="'+(y+r*h)+'" width="'+w+'" height="'+h+'" fill="'+(r?'#f6f3ff':'#eaf0ff')+'" stroke="'+blue+'" stroke-width="2"/>'+center(x+labelW/2,y+r*h+40,p.labels[r],18);}
  body+=line([x+labelW,y],[x+labelW,y+2*h],blue,1.6);
  for(let i=0;i<n;i++){const cx=x+labelW+(i+0.5)*cellW;if(i)body+=line([x+labelW+i*cellW,y],[x+labelW+i*cellW,y+2*h],blue,1.4);body+=center(cx,y+41,p.xs[i],23)+center(cx,y+h+41,p.ys[i],p.ys.some(n=>Math.abs(n)>=1000)?21:23);body+='<g data-column="'+i+'" data-independent="'+p.xs[i]+'" data-dependent="'+p.ys[i]+'"/>';}
 }else if(p.scene==='mapping'){
  const ys=[65,140,215,290],L=105,R=375;body+=center(L,31,'x',25,blue)+center(R,31,'y',25,blue);
  p.xs.forEach((x,i)=>{const j=p.displayY.indexOf(p.ys[i]);assert.ok(j>=0);body+=arrow([L+24,ys[i]],[R-24,ys[j]],'data-map-x="'+x+'" data-map-y="'+p.ys[i]+'"');});
  for(let i=0;i<4;i++)body+='<circle cx="'+L+'" cy="'+ys[i]+'" r="23" fill="#eaf0ff" stroke="'+blue+'" stroke-width="2"/>'+center(L,ys[i]+8,p.xs[i],24)+'<circle cx="'+R+'" cy="'+ys[i]+'" r="23" fill="#f1edff" stroke="'+purple+'" stroke-width="2"/>'+center(R,ys[i]+8,p.displayY[i],24);
 }else if(p.scene==='function-gallery'){
  p.panels.forEach((panel,i)=>{const ox=(i%2)*240,oy=Math.floor(i/2)*180,L=ox+60,R=ox+180,Y=[55,103,151];body+=text(ox+13,22+oy,i+1,18,purple)+center(L,22+oy,'x',18)+center(R,22+oy,'y',18);for(const [x,y]of panel.links){const a=panel.xs.indexOf(x),b=panel.ys.indexOf(y);body+=arrow([L+17,oy+Y[a]],[R-17,oy+Y[b]],'data-panel="'+(i+1)+'" data-map-x="'+x+'" data-map-y="'+y+'"');}for(let j=0;j<3;j++)for(const [cx,v]of [[L,panel.xs[j]],[R,panel.ys[j]]])body+='<circle cx="'+cx+'" cy="'+(oy+Y[j])+'" r="16" fill="#eaf0ff" stroke="'+blue+'" stroke-width="1.6"/>'+center(cx,oy+Y[j]+7,v,21);});
 }else if(p.scene==='rectangle'){
  const scale=Math.min(330/p.value,220/p.fixed),w=p.value*scale,h=p.fixed*scale,x=(480-w)/2,y=(360-h)/2;body+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="#eaf0ff" stroke="'+blue+'" stroke-width="3"/>'+center(240,y+h+35,'a',26)+center(x-25,180,p.fixed,26);
 }else if(p.scene==='equilateral'){
  const A=[100,290],B=[380,290],C=[240,290-Math.sqrt(3)*140],pts=[A,B,C];body+='<polygon points="'+pts.map(v=>v.join(',')).join(' ')+'" fill="#eef0ff" stroke="'+blue+'" stroke-width="3"/>';for(let i=0;i<3;i++){const a=pts[i],b=pts[(i+1)%3],m=[(a[0]+b[0])/2,(a[1]+b[1])/2],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),u=[dy/len*9,-dx/len*9];body+=line([m[0]-u[0],m[1]-u[1]],[m[0]+u[0],m[1]+u[1]],purple,2.5,'data-equal-mark="'+i+'"');}body+=center(240,330,'a',26);
 }else throw Error('Known dependency scene');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-labelledby="title desc"><title id="title">Тәуелділік сызбасы</title><desc id="desc">'+esc(descriptionFor(q))+'</desc><rect width="480" height="360" rx="18" fill="#fff"/><g font-family="Arial, sans-serif" stroke-linecap="round" stroke-linejoin="round">'+body+'</g></svg>';
}
export function verifyEdition(q){
 const r=independentlyCalculate(q);assert.equal(r.answer,q.answer,'Independent dependence answer');assert.equal(statementFor(q),q.statement,'Exact parameter-bound statement');assert.equal(solutionFor(q),q.solution,'Exact parameter-bound solution');assert.equal(descriptionFor(q),q.figureDescription,'Exact accessible description');assert.equal(sha(svgFor(q)),q.figureSha256,'Exact native SVG digest');if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(v=>v===r.answer).length,1);}
 return {answer:r.answer,checks:Object.entries(r.checks).map(([k,v])=>k+': '+JSON.stringify(v))};
}
