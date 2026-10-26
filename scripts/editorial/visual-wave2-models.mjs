// Native, authored protractors. No source SVG/raster/path is read or copied.
// The independent calculation uses direction vectors and enumeration, while
// the written solutions use scale readings and elementary angle identities.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const prefix='visual-wave2-';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const degree=(n,label='degree')=>assert.ok(Number.isSafeInteger(n)&&n>=0&&n<360,label);
const round=n=>{assert.ok(Math.abs(n-Math.round(n))<1e-7,'An exact integer degree is required');return Math.round(n);};
const vec=d=>[Math.cos(d*Math.PI/180),Math.sin(d*Math.PI/180)];
const directionAngle=(a,b)=>{const u=vec(a),v=vec(b);return round(Math.acos(Math.min(1,Math.max(-1,u[0]*v[0]+u[1]*v[1])))*180/Math.PI);};
const ray=(p,label)=>{const r=p.rays.find(r=>r.label===label);assert.ok(r,'Missing ray '+label);return r.mark;};
const angle=(p,a,b)=>directionAngle(ray(p,a),ray(p,b));
const inner=(p,label)=>ray(p,label);
const outer=(p,label)=>180-ray(p,label);
const midDirection=(a,b)=>{const u=vec(a),v=vec(b),x=u[0]+v[0],y=u[1]+v[1];assert.ok(Math.hypot(x,y)>1e-7,'A straight angle has no unique internal bisector in this model');return round((Math.atan2(y,x)*180/Math.PI+360)%360);};
const point=(a,r)=>[240+r*Math.cos(a*Math.PI/180),236-r*Math.sin(a*Math.PI/180)];
const n=v=>Number(v.toFixed(3));
const model=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const angleName=(a,b)=>'∠'+a+'O'+b;
const scalePhrase=s=>s==='outer'?'сыртқы қара':'ішкі көк';
const reading=(p,label,scale='inner')=>scale==='outer'?outer(p,label):inner(p,label);
const yesAnswer=d=>'Иә: '+d+'° және '+d+'°';
const noAnswer=(a,b)=>'Жоқ: '+a+'° және '+b+'°';

function validate(q){
 const p=q.params;assert.ok(p&&Array.isArray(p.rays)&&p.rays.length>=2&&p.rays.length<=7);
 assert.equal(new Set(p.rays.map(r=>r.label)).size,p.rays.length,'Unique point labels');
 assert.equal(new Set(p.rays.map(r=>r.mark)).size,p.rays.length,'Distinct geometric rays');
 for(const r of p.rays){
  assert.match(r.label,/^[A-NP-Z]$/);degree(r.mark);
  assert.ok(r.mark<=180||r.outside===true&&model(q)==='external-supplement','Only the explicitly external-angle model may put a ray below the protractor');
  assert.ok(!(r.pointOnly&&r.outside),'Candidate point must be on the instrument');
 }
 assert.ok(Number.isSafeInteger(p.rotation)&&Math.abs(p.rotation)<=20,'The whole instrument rotates within its mobile bounds');
 if(p.scale)assert.ok(['inner','outer'].includes(p.scale));
 if(p.goal!==undefined)assert.ok(Number.isSafeInteger(p.goal)&&p.goal>0&&p.goal<180);
 return p;
}

export function independentlyCalculate(q){
 const p=validate(q),kind=model(q),checks=['Direction vectors are recomputed from the authored marks, independently of the SVG coordinates'];
 let answer;
 switch(kind){
 case 'baseline-reading':
  assert.ok(p.scale==='outer'?ray(p,p.base)===180:ray(p,p.base)===0,'Zero must match the selected scale');
  answer=String(angle(p,p.base,p.target));checks.push('The correct zero row is selected from the baseline direction');break;
 case 'named-target-reading':
  assert.ok(p.rays.length>=3);answer=String(angle(p,p.base,p.target));checks.push('Only the two requested rays are used; the distractor ray is ignored');break;
 case 'construction-point':{
  const matches=p.rays.filter(r=>r.pointOnly&&directionAngle(ray(p,p.base),r.mark)===p.goal);
  assert.equal(matches.length,1,'A unique marked construction point is required');answer=matches[0].label;
  checks.push('Every candidate point is tested against the requested angle, including the reverse-scale distractor');break;
 }
 case 'external-supplement':
  assert.equal(angle(p,p.visible,p.opposite),180,'The below-instrument ray is geometrically opposite the measured ray');
  assert.ok(ray(p,p.opposite)>180);answer=String(angle(p,p.base,p.opposite));
  checks.push('The requested ray below the instrument is opposite the visible ray; their adjacent angles sum to 180');break;
 case 'bisector-check':{
  const a=angle(p,p.base,p.middle),b=angle(p,p.middle,p.target);
  assert.equal(a+b,angle(p,p.base,p.target),'The candidate ray lies inside the requested angle');
  answer=a===b?yesAnswer(a):noAnswer(a,b);
  checks.push('Both adjacent angles are separately measured and compared; a candidate is not assumed to bisect');break;
 }
 case 'nonzero-reading':
 case 'named-ray-difference':
 case 'difference-rays':
 case 'mixed-scale-reading':
  assert.ok(ray(p,p.base)>0&&ray(p,p.base)<180&&ray(p,p.target)>0&&ray(p,p.target)<180,'Both requested rays must be away from zero');
  answer=String(angle(p,p.base,p.target));checks.push('The smaller angle is recomputed using both ray vectors, not mixed scale rows');break;
 case 'baseline-supplement':
  assert.equal(angle(p,p.baselineLeft,p.baselineRight),180);answer=String(angle(p,p.target,p.baselineLeft));
  checks.push('The opposite baseline is included rather than the measured acute angle returned');break;
 case 'construct-bisector':{
  assert.equal(ray(p,p.base),0,'This construction has a zero-origin boundary');
  assert.ok(!p.rays.some(r=>r.label===p.future),'The unknown bisector is not drawn as a supplied answer');
  const mid=midDirection(ray(p,p.base),ray(p,p.target));answer=String(mid);
  checks.push('The internal bisector is obtained from the sum of unit direction vectors');break;
 }
 case 'adjacent-difference':{
  const a=angle(p,p.first,p.middle),b=angle(p,p.middle,p.last);assert.ok(b>a);assert.equal(a+b,angle(p,p.first,p.last));
  answer=String(b-a);checks.push('Two adjacent measured angles are compared, rather than returning either one');break;
 }
 case 'bisector-offset':{
  const mid=midDirection(ray(p,p.first),ray(p,p.last));assert.ok(!p.rays.some(r=>r.label===p.future),'The requested bisector is not drawn in the supplied diagram');
  answer=String(directionAngle(ray(p,p.middle),mid));checks.push('The missing bisector direction is constructed before its angle to the third ray is measured');break;
 }
 case 'bisector-crossscale':{
  assert.ok(!p.rays.some(r=>r.label===p.future),'The requested bisector is not drawn in the supplied diagram');const mid=midDirection(ray(p,p.base),ray(p,p.target));
  answer=String(mid);checks.push('The nonzero-origin angle is bisected and the result is expressed on the requested inner scale');break;
 }
 case 'equal-angle':{
  const target=angle(p,p.base,p.target),matches=p.candidates.filter(([a,b])=>angle(p,a,b)===target);
  assert.equal(matches.length,1,'A unique equal-angle option is required');answer=angleName(...matches[0]);
  checks.push('All named candidate angle pairs are measured and exactly one is equal');break;
 }
 case 'pair-sum':{
  let sum=0,count=0;for(let a=0;a<p.rays.length;a++)for(let b=a+1;b<p.rays.length;b++){sum+=directionAngle(p.rays[a].mark,p.rays[b].mark);count++;}
  assert.equal(count,p.rays.length*(p.rays.length-1)/2);answer=String(sum);
  checks.push('Every unordered ray pair is enumerated exactly once, including the straight angle');break;
 }
 case 'identify-ray':{
  const matches=p.rays.filter(r=>r.label!==p.base&&angle(p,p.base,r.label)===p.goal);assert.equal(matches.length,1);
  answer='O'+matches[0].label;checks.push('Each named ray is tested from the stated baseline, including the opposite-scale trap');break;
 }
 case 'twice-angle':{
  assert.ok(!p.rays.some(r=>r.label===p.future),'The requested new ray is not a supplied answer');
  assert.equal(ray(p,p.base),0);const d=angle(p,p.base,p.target);assert.ok(d>0&&d*2<180);
  // Compose the measured unit direction with itself (complex multiplication).
  const [x,y]=vec(d),doubled=round(Math.atan2(2*x*y,x*x-y*y)*180/Math.PI);answer=String(doubled);
  checks.push('The measured direction is composed with itself, within the same half-plane');break;
 }
 case 'supplement-difference':{
  assert.equal(angle(p,p.left,p.right),180);const a=angle(p,p.target,p.right),b=angle(p,p.left,p.target);
  assert.equal(a+b,180);assert.ok(a>b);answer=String(a-b);checks.push('Both supplementary angles are measured before their difference is taken');break;
 }
 case 'acute-count':{
  let count=0;for(let a=0;a<p.rays.length;a++)for(let b=a+1;b<p.rays.length;b++)if(directionAngle(p.rays[a].mark,p.rays[b].mark)<90)count++;
  answer=String(count);checks.push('All unordered pairs are checked against the strict acute threshold; exactly 90 degrees is excluded');break;
 }
 default:throw new Error('Unsupported authored model '+kind);
 }
 return {answer,checks};
}

const intro='Транспортирдің әр кіші бөлігі 1°-қа тең. ';
export function statementFor(q){
 const p=q.params,kind=model(q),lead=intro+(p.rotation?'Құрал қағазда бұрылып тұр. ':'');
 switch(kind){
 case 'baseline-reading':return lead+'O — центр, O'+p.base+' сәулесі '+scalePhrase(p.scale)+' шкаланың нөлімен беттеседі. '+angleName(p.base,p.target)+' бұрышын градуспен жазыңдар.';
 case 'named-target-reading':return lead+'Сызбадағы '+p.rays.map(r=>'O'+r.label).join(', ')+' сәулелеріне назар аударыңдар. '+angleName(p.base,p.target)+' бұрышын өлшеңдер; басқа сәулені есепке алмаңдар.';
 case 'construction-point':return lead+'Дана O'+p.base+' сәулесінен бастап '+p.goal+'° бұрыш салмақ. Екінші қабырғасы құралда белгіленген қай нүкте арқылы өтуі керек? Нүктенің әрпін таңдаңдар.';
 case 'external-supplement':return lead+p.visible+', O және '+p.opposite+' бір түзудің бойында, O олардың арасында жатыр. O'+p.opposite+' сәулесі құралдың төменгі жағында берілген. '+angleName(p.base,p.opposite)+' бұрышын табыңдар.';
 case 'bisector-check':return lead+'Әли O'+p.middle+' сәулесін '+angleName(p.base,p.target)+' бұрышының биссектрисасы деп атады. Оның пікірі дұрыс па? Екі бөліктің өлшемі көрсетілген жауапты таңдаңдар.';
 case 'nonzero-reading':return lead+'Бұл жолы '+angleName(p.base,p.target)+' бұрышының ешбір қабырғасы шкаланың нөлімен беттеспейді. Бұрыштың өлшемін табыңдар.';
 case 'difference-rays':return lead+'O'+p.reference+' сәулесі нөлдік бағытты көрсетеді. '+angleName(p.base,p.target)+' бұрышын өлшеңдер.';
 case 'named-ray-difference':return lead+p.baselineLeft+', O және '+p.baselineRight+' бір түзудің бойында. Үш көлбеу сәуленің ішінен '+angleName(p.base,p.target)+' бұрышын ғана өлшеңдер.';
 case 'baseline-supplement':return lead+p.baselineLeft+', O және '+p.baselineRight+' бір түзудің бойында, O олардың арасында. '+angleName(p.target,p.baselineLeft)+' бұрышын градуспен табыңдар.';
 case 'construct-bisector':return lead+'O'+p.future+' сәулесін '+angleName(p.base,p.target)+' бұрышының биссектрисасы етіп салу керек. Ол ішкі көк шкаланың қай белгісі арқылы өтеді? O'+p.future+' әзірше сызылмаған.';
 case 'adjacent-difference':return lead+angleName(p.middle,p.last)+' бұрышы '+angleName(p.first,p.middle)+' бұрышынан неше градус үлкен?';
 case 'bisector-offset':return lead+'O'+p.future+' сәулесі '+angleName(p.first,p.last)+' бұрышын тең екіге бөлуі керек. Осы сәуле салынғанда '+angleName(p.middle,p.future)+' неше градус болады? O'+p.future+' суретте әлі салынбаған.';
 case 'mixed-scale-reading':return lead+'Сәулелер екі шкалада да әртүрлі сандарға сәйкес келеді. Бір шкаланы ғана пайдаланып, '+angleName(p.base,p.target)+' бұрышын табыңдар.';
 case 'bisector-crossscale':return lead+angleName(p.base,p.target)+' бұрышының O'+p.future+' биссектрисасын салғанда, ол ішкі көк шкалада қай санға сәйкес келеді? Биссектриса сызбада берілмеген.';
 case 'equal-angle':return lead+'Төмендегі бұрыштардың қайсысы '+angleName(p.base,p.target)+' бұрышына тең? Әр бұрыштың екі қабырғасын да ескеріңдер.';
 case 'pair-sum':return lead+'Белгіленген '+p.rays.length+' сәуленің әр жұбы арасындағы кіші бұрышты бір реттен есептеңдер. Жазыңқы бұрыш та есепке кіреді. Осы бұрыштардың өлшемдерінің қосындысы неше градус?';
 case 'identify-ray':return lead+'O'+p.base+' сәулесінен басталатын '+p.goal+'° бұрыштың екінші қабырғасы қай сәуле болады? Сәуленің атын таңдаңдар.';
 case 'twice-angle':return lead+angleName(p.base,p.future)+' бұрышын '+angleName(p.base,p.target)+' бұрышынан екі есе үлкен етіп, сол жарты жазықтықта салу керек. O'+p.future+' ішкі көк шкаланың қай белгісі арқылы өтеді?';
 case 'supplement-difference':return lead+p.left+', O және '+p.right+' бір түзудің бойында. '+angleName(p.target,p.right)+' бұрышы '+angleName(p.left,p.target)+' бұрышынан неше градус үлкен?';
 case 'acute-count':return lead+'Белгіленген '+p.rays.length+' сәуленің әр жұбы арасындағы кіші бұрыш қарастырылады. Неше сүйір бұрыш бар? Өлшемі дәл 90° болатын бұрышты санамаңдар.';
 default:throw new Error('No condition for '+kind);
 }
}

export function solutionFor(q){
 const p=q.params,kind=model(q),d=(a,b)=>Math.abs(inner(p,a)-inner(p,b));
 switch(kind){
 case 'baseline-reading':return 'Нөл O'+p.base+' бағытында тұрған '+scalePhrase(p.scale)+' шкаланы оқимыз. O'+p.target+' белгісі '+reading(p,p.target,p.scale)+'°-қа сәйкес келеді. Жауабы: '+reading(p,p.target,p.scale)+'°.';
 case 'named-target-reading':return 'Ішкі шкалада O'+p.base+' — '+inner(p,p.base)+'°, O'+p.target+' — '+inner(p,p.target)+'°. Олардың айырмасы '+d(p.base,p.target)+'°. Өзге сәуле бұл бұрыштың қабырғасы емес.';
 case 'construction-point':{
  const found=p.rays.find(r=>r.pointOnly&&Math.abs(r.mark-inner(p,p.base))===p.goal);
  return 'O'+p.base+' нөлдік бағытынан '+p.goal+'°-ты ішкі шкаладан белгілейміз. Сол белгіде '+found.label+' нүктесі тұр. Қарама-қарсы шкаладағы '+p.goal+' саны басқа бағытты береді.';
 }
 case 'external-supplement':return angleName(p.base,p.visible)+' = '+d(p.base,p.visible)+'°. '+p.visible+'O'+p.opposite+' — түзу, сондықтан сұралған бұрыш 180° − '+d(p.base,p.visible)+'° = '+(180-d(p.base,p.visible))+'°.';
 case 'bisector-check':{
  const a=d(p.base,p.middle),b=d(p.middle,p.target);
  return angleName(p.base,p.middle)+' = '+a+'°, '+angleName(p.middle,p.target)+' = '+b+'°. '+(a===b?'Бұл екі өлшем тең, демек сәуле бұрыштың биссектрисасы.':'Өлшемдер тең емес, сондықтан бұл сәуле биссектриса болмайды.');
 }
 case 'nonzero-reading':
 case 'mixed-scale-reading':
 case 'difference-rays':
 case 'named-ray-difference':return 'Бір ғана ішкі шкаламен оқимыз: O'+p.base+' — '+inner(p,p.base)+'°, O'+p.target+' — '+inner(p,p.target)+'°. Үлкен саннан кішісін азайтамыз: '+Math.max(inner(p,p.base),inner(p,p.target))+'° − '+Math.min(inner(p,p.base),inner(p,p.target))+'° = '+d(p.base,p.target)+'°. Екі шкаланың сандарын араластыруға болмайды.';
 case 'baseline-supplement':return angleName(p.baselineRight,p.target)+' = '+d(p.baselineRight,p.target)+'°. Жазыңқы бұрыш 180°, сондықтан '+angleName(p.target,p.baselineLeft)+' = 180° − '+d(p.baselineRight,p.target)+'° = '+(180-d(p.baselineRight,p.target))+'°.';
 case 'construct-bisector':return angleName(p.base,p.target)+' = '+d(p.base,p.target)+'°. Оның жартысы '+d(p.base,p.target)+'° : 2 = '+d(p.base,p.target)/2+'°. Нөл O'+p.base+' бағытында болғандықтан, ізделген ішкі белгі — '+(inner(p,p.base)+inner(p,p.target))/2+'°.';
 case 'adjacent-difference':return angleName(p.first,p.middle)+' = '+inner(p,p.middle)+'° − '+inner(p,p.first)+'° = '+d(p.first,p.middle)+'°. '+angleName(p.middle,p.last)+' = '+inner(p,p.last)+'° − '+inner(p,p.middle)+'° = '+d(p.middle,p.last)+'°. Айырмасы: '+d(p.middle,p.last)+'° − '+d(p.first,p.middle)+'° = '+(d(p.middle,p.last)-d(p.first,p.middle))+'°.';
 case 'bisector-offset':{
  const m=(inner(p,p.first)+inner(p,p.last))/2;
  return 'Биссектриса ішкі шкаладағы ('+inner(p,p.first)+'° + '+inner(p,p.last)+'°) : 2 = '+m+'° белгісінен өтеді. O'+p.middle+' — '+inner(p,p.middle)+'°, сондықтан ізделген бұрыш '+Math.max(m,inner(p,p.middle))+'° − '+Math.min(m,inner(p,p.middle))+'° = '+Math.abs(m-inner(p,p.middle))+'°.';
 }
 case 'bisector-crossscale':{
  const out=(outer(p,p.base)+outer(p,p.target))/2;
  return 'Сыртқы шкаладағы шеткі белгілер: '+outer(p,p.base)+'° және '+outer(p,p.target)+'°. Биссектриса олардың ортасында: ('+outer(p,p.base)+' + '+outer(p,p.target)+') : 2 = '+out+'°. Сол бағыттың ішкі белгісі 180° − '+out+'° = '+(180-out)+'°.';
 }
 case 'equal-angle':{
  const target=d(p.base,p.target),matches=p.candidates.filter(([a,b])=>d(a,b)===target);
  return angleName(p.base,p.target)+' = '+target+'°. Нұсқаларды жеке тексереміз: '+p.candidates.map(([a,b])=>angleName(a,b)+' = '+d(a,b)+'°').join('; ')+'. Тең бұрыш — '+angleName(...matches[0])+'.';
 }
 case 'pair-sum':{
  const ordered=[...p.rays].sort((a,b)=>a.mark-b.mark),groups=ordered.slice(0,-1).map((r,i)=>ordered.slice(i+1).map(s=>s.mark-r.mark)),sums=groups.map(g=>g.reduce((a,b)=>a+b,0));
  return 'Әр жұпты бір рет аламыз. '+groups.map((g,i)=>ordered[i].label+' сәулесінен: '+g.join(' + ')+' = '+sums[i]+'°').join('; ')+'. Барлығы: '+sums.join(' + ')+' = '+sums.reduce((a,b)=>a+b,0)+'°.';
 }
 case 'identify-ray':{
  const found=p.rays.find(r=>r.label!==p.base&&Math.abs(r.mark-inner(p,p.base))===p.goal);
  return 'Нөл O'+p.base+' бағытында. Ішкі шкаладағы '+p.goal+'° белгісіне O'+found.label+' сәулесі сәйкес келеді. Екінші шкаладан дәл сол санды іздеу басқа сәулені таңдауға әкеледі.';
 }
 case 'twice-angle':return 'Алдымен '+angleName(p.base,p.target)+' = '+d(p.base,p.target)+'° екенін оқимыз. Екі есесі: '+d(p.base,p.target)+'° × 2 = '+d(p.base,p.target)*2+'°. Бұл 180°-тан кіші, сондықтан берілген жарты жазықтықта ішкі шкаланың '+d(p.base,p.target)*2+'° белгісін аламыз.';
 case 'supplement-difference':{
  const a=d(p.target,p.right),b=d(p.left,p.target);
  return angleName(p.target,p.right)+' = '+a+'°, '+angleName(p.left,p.target)+' = 180° − '+a+'° = '+b+'°. Екеуінің айырмасы: '+a+'° − '+b+'° = '+(a-b)+'°.';
 }
 case 'acute-count':{
  const ordered=[...p.rays].sort((a,b)=>a.mark-b.mark),pairs=[];for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++)if(ordered[j].mark-ordered[i].mark<90)pairs.push(angleName(ordered[i].label,ordered[j].label));
  return 'Кіші бұрыштың өлшемі шкала белгілерінің айырмасына тең. Айырмасы 90°-тан кіші жұптар: '+pairs.join(', ')+'. Барлығы '+pairs.length+' сүйір бұрыш. Айырмасы дәл 90° болса, ол тік бұрыш және бұл санға кірмейді.';
 }
 default:throw new Error('No solution for '+kind);
 }
}

export function svgFor(q){
 const p=validate(q),title=esc(q.figureTitle),desc=esc(q.figureDescription);
 const text=(x,y,value,size=20,color='#213448',attrs='')=>'<text x="'+n(x)+'" y="'+n(y)+'" font-family="Arial,sans-serif" font-size="'+size+'" fill="'+color+'" text-anchor="middle" dominant-baseline="middle" paint-order="stroke" stroke="white" stroke-width="3" stroke-linejoin="round" '+attrs+'>'+esc(value)+'</text>';
 const line=(a,b,attrs='')=>'<line x1="'+n(a[0])+'" y1="'+n(a[1])+'" x2="'+n(b[0])+'" y2="'+n(b[1])+'" '+attrs+'/>';
 const plate='<path d="M60 236 A180 180 0 0 1 420 236 L420 249 L60 249Z" fill="#edf6ff" fill-opacity=".52" stroke="#7187a4" stroke-width="1.6"/>';
 const ticks=Array.from({length:181},(_,d)=>{
  const major=d%10===0,mid=d%5===0;
  return line(point(d,180),point(d,major?163:mid?168:174),'data-tick="'+d+'" stroke="'+(major?'#38516c':'#738aa4')+'" stroke-width="'+(major?1.4:mid?1.1:.85)+'"');
 }).join('');
 const rays=p.rays.map((r,i)=>{
  const color=r.pointOnly?'#d12d7c':['#6356ce','#df5a3b','#008a8c','#ba3b85','#347d21','#305ed0'][i%6];
  const loc=point(r.mark,r.outside?70:r.pointOnly?180:191),label=point(r.mark,r.outside?90:208);
  return (r.pointOnly?'':line([240,236],loc,'data-ray="'+r.label+'" data-mark="'+r.mark+'" stroke="'+color+'" stroke-width="2.5" stroke-linecap="round"'))+
   '<circle cx="'+n(loc[0])+'" cy="'+n(loc[1])+'" r="'+(r.pointOnly?3.7:2.3)+'" fill="'+color+'"/>'+
   text(label[0],label[1],r.label,21,color,'font-weight="700" data-point-label="'+r.label+'"');
 }).join('');
 // At 343px, 20-degree labels avoid crowding. Every individual degree and
 // every longer five/ten-degree mark is nevertheless geometrically present.
 const labels=Array.from({length:181},(_,d)=>d).filter(d=>d%20===0).map(d=>{
  const out=point(d,153),inn=point(d,110);if(d===0||d===180){out[1]-=12;inn[1]-=12;}
  return text(out[0],out[1],180-d,21,'#24364c','data-scale="outer" data-direction="'+d+'"')+
   text(inn[0],inn[1],d,21,'#1c64c5','data-scale="inner" data-direction="'+d+'"');
 }).join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-labelledby="title desc"><title id="title">'+title+'</title><desc id="desc">'+desc+'</desc><rect width="480" height="360" fill="white"/><g transform="rotate('+p.rotation+' 240 236)" data-instrument-rotation="'+p.rotation+'">'+plate+ticks+rays+labels+'<circle cx="240" cy="236" r="3.5" fill="#162e49"/>'+text(240,261,'O',21,'#182f4a','font-weight="700"')+'</g>'+text(114,351,'1 кіші бөлік = 1°',15,'#45607f')+text(368,351,'Көк шкала — ішкі',15,'#1c64c5')+'</svg>\n';
}

export function verifyEdition(q){
 const result=independentlyCalculate(q);
 assert.equal(q.answer,result.answer,'Independent mathematical answer');
 assert.equal(q.statement,statementFor(q),'Exact condition bound to parameters');
 assert.equal(q.solution,solutionFor(q),'Exact worked solution bound to parameters');
 assert.equal(q.image,'/figures/synaq-editions/'+q.editionId+'.svg','Native asset path');
 assert.equal(q.figureSha256,sha(svgFor(q)),'Native SVG digest bound to exact parameters');
 if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(x=>x===q.answer).length,1,'Exactly one correct option');}
 return {...result,checks:[...result.checks,'The condition, solution, accessible figure and SVG digest are all bound to the same authored parameters']};
}
