// Native line geometry: integer incidence/direction tests and exact angle data.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const kind=q=>{assert.ok(q.modelId.startsWith('visual-wave9-'));return q.modelId.slice(13);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const vector=(a,b)=>a.map((v,i)=>b[i]-v);
export const parallel=(a,b)=>{assert.ok(a.some(Boolean)&&b.some(Boolean));return a.every((x,i)=>a.every((y,j)=>x*b[j]===y*b[i]));};
export const perpendicular=(a,b)=>{assert.ok(a.some(Boolean)&&b.some(Boolean));return a.reduce((s,x,i)=>s+x*b[i],0)===0;};
const angle=(a,b)=>{const d=((a-b)%360+360)%360;return Math.min(d,360-d);};
const byName=(p,n)=>{const r=p.points.find(r=>r.label===n);assert.ok(r,'Known point '+n);return [r.x,r.y];};
const ray=(p,n)=>{const r=p.rays.find(r=>r.label===n);assert.ok(r,'Known ray '+n);return r.degrees;};
export function parallelPolygonPairs(poly){
 const edges=poly.map((p,i)=>vector(p,poly[(i+1)%poly.length])),pairs=[];
 for(let a=0;a<edges.length;a++)for(let b=a+1;b<edges.length;b++)if(parallel(edges[a],edges[b]))pairs.push([a,b]);
 return pairs;
}
export function independentlyCalculate(q){
 const p=q.params,k=kind(q);let answer,checks;
 switch(k){
 case 'off-line':{const v=vector(p.linePoint,p.lineOther),out=p.points.filter(r=>{const d=vector(p.linePoint,[r.x,r.y]);return d.some(Boolean)&&!parallel(v,d);});assert.equal(out.length,1);answer=out[0].label;checks={offLine:answer};break;}
 case 'named-supplement':
 case 'adjacent-supplement':
 case 'right-complement':
 case 'outside-right':{
  const given=angle(ray(p,p.given[0]),ray(p,p.given[1])),target=angle(ray(p,p.target[0]),ray(p,p.target[1]));
  assert.equal(given,p.givenDegrees);const expected=k.endsWith('supplement')?180-given:k==='right-complement'?90-given:90+given;
  assert.equal(target,expected);assert.ok(given>0&&given<180&&target>0&&target<180);
  answer=String(target);checks={given,target,relation:k};break;
 }
 case 'opposite-pair':{const sectors=p.sectorLabels,good=p.choices.filter(([a,b])=>Math.abs(sectors.indexOf(a)-sectors.indexOf(b))===2);assert.equal(good.length,1);answer='∠'+good[0][0]+' және ∠'+good[0][1];checks={oppositeSectors:good[0]};break;}
 case 'point-line-distance':{const a=byName(p,'A');answer=String(Math.abs(a[0]-p.lineX));checks={horizontalUnitGaps:Number(answer),distractorSlant:byName(p,'B')};break;}
 case 'closest-line':{const distances=p.points.map(r=>({label:r.label,distance:Math.abs(r.x-p.lineX)})),min=Math.min(...distances.map(r=>r.distance)),good=distances.filter(r=>r.distance===min);assert.equal(good.length,1);answer=good[0].label;checks={distances};break;}
 case 'perpendicular-pair':{const good=p.pairs.map(([a,b],i)=>perpendicular(a,b)?i+1:null).filter(Boolean);assert.equal(good.length,1);answer=String(good[0]);checks={pairDots:p.pairs.map(([a,b])=>a.reduce((s,v,i)=>s+v*b[i],0))};break;}
 case 'cuboid-parallels':{const v=vector(p.vertices[p.reference[0]],p.vertices[p.reference[1]]),matches=p.edges.filter(([a,b])=>!([a,b].includes(p.reference[0])&&[a,b].includes(p.reference[1]))&&parallel(v,vector(p.vertices[a],p.vertices[b])));assert.equal(matches.length,3);answer=matches.map(([a,b])=>a+b).join(', ');checks={parallelEdges:matches,referenceVector:v};break;}
 case 'quadrilateral-parallels':{const matches=parallelPolygonPairs(p.points.map(r=>[r.x,r.y]));assert.equal(matches.length,1);const [a,b]=matches[0],names=p.points.map(r=>r.label);answer=names[a]+names[(a+1)%4]+' ∥ '+names[b]+names[(b+1)%4];checks={edgePairs:matches};break;}
 case 'parallel-segments':{const ref=p.segments[0].direction,matches=p.segments.slice(1).filter(r=>parallel(ref,r.direction));answer=String(matches.length);checks={parallelNames:matches.map(r=>r.labels.join(''))};break;}
 case 'parallel-through':{const good=p.lines.filter(r=>parallel(p.reference.direction,r.direction));assert.equal(good.length,1);assert.ok(!parallel(p.reference.direction,vector(p.reference.point,p.through)));answer=good[0].label;checks={parallelLine:answer};break;}
 case 'octagon-pairs':{const pairs=parallelPolygonPairs(p.polygon);answer=String(pairs.length);checks={edgePairs:pairs};break;}
 case 'parallel-distance':{assert.ok(p.unitMm>0);answer=String(Math.abs(p.firstY-p.secondY)*p.unitMm);checks={unitGaps:Math.abs(p.firstY-p.secondY),unitMm:p.unitMm};break;}
 default:throw Error('Unknown line model '+k);
 }
 return {answer,checks};
}
function core(q){
 const p=q.params;
 switch(kind(q)){
 case 'off-line':return 'Сызбада бір түзу мен төрт нүкте берілген. Қай нүкте осы түзудің бойында жатпайды?';
 case 'named-supplement':return 'AB және CD түзулері O нүктесінде қиылысады. Суреттегі BOD бұрышы '+p.givenDegrees+'°. AOD бұрышының градустық өлшемін табыңыз.';
 case 'adjacent-supplement':return 'a және b түзулері қиылысады. '+p.givenDegrees+'° бұрышына іргелес тұрған, сұрақ белгісімен көрсетілген бұрыш неше градус?';
 case 'opposite-pair':return 'Екі түзу қиылысқанда пайда болған бұрыштар 1–4 сандарымен белгіленген. Қай жұп вертикаль бұрыштардан тұрады?';
 case 'point-line-distance':return 'Торкөздің қабырғасы 1 бірлік. A нүктесінен ℓ түзуіне дейінгі ең қысқа қашықтық неше бірлік? Суреттегі AB кесіндісі де берілген.';
 case 'right-complement':return 'AB ⟂ CD. OE сәулесі AOC тік бұрышының ішінде жатыр. AOE бұрышы '+p.givenDegrees+'° болса, EOC бұрышы неше градус?';
 case 'outside-right':return 'OA ⟂ OB. OC сәулесі AOB тік бұрышының сыртында, ал OB сәулесі AOC бұрышының ішінде жатыр. BOC бұрышы '+p.givenDegrees+'°. AOC бұрышы неше градус?';
 case 'closest-line':return 'Бірлік торда k түзуі мен A, B, C, D нүктелері салынған. k түзуіне ең жақын нүктені таңдаңыз.';
 case 'perpendicular-pair':return 'Төрт жұп түзу бірдей шаршы торда берілген. Қай нөмірлі жұптың түзулері өзара перпендикуляр?';
 case 'cuboid-parallels':return 'JKLMJ₁K₁L₁M₁ — тікбұрышты параллелепипед. Бөлектелген JJ₁ қырын қоспай, оған параллель қалған үш қырдың толық тізімін таңдаңыз. Үзік сызықтар көрінбейтін қырларды білдіреді.';
 case 'quadrilateral-parallels':return 'Шаршы торда MNPQ төртбұрышы салынған. Оның қабырғалары туралы қай тұжырым дұрыс?';
 case 'parallel-segments':return 'Алты кесінді бірдей өлшемді шаршы торларда көрсетілген. AB-дан басқа неше кесінді AB кесіндісіне параллель? Кесінділердің ұзындығы бірдей болуы міндетті емес.';
 case 'parallel-through':return 'A нүктесі t түзуінде жатпайды. A арқылы жүргізілген p, q, r түзулерінің қайсысы t түзуіне параллель?';
 case 'octagon-pairs':return 'Шаршы тордағы ABCDEFGH сегізбұрышының өзара параллель қабырғаларының неше жұбы бар? Әр жұпты бір рет қана санаңыз.';
 case 'parallel-distance':return 'a және b — тор сызықтары бойымен өтетін параллель түзулер. Бір торкөздің қабырғасы '+p.unitMm+' мм. Екі түзудің арақашықтығы неше миллиметр?';
 default:throw Error('Unknown statement');
 }
}
export const statementFor=q=>core(q)+(q.options?'':' Жауапқа тек санды жазыңыз.');
export function solutionFor(q){
 const p=q.params,k=kind(q),r=independentlyCalculate(q);let s;
 switch(k){
 case 'off-line':s='A, B, C нүктелері бір түзу бойында: олардың орындары сол бағытпен жалғасады. D нүктесі түзуден бөлек орналасқан, сондықтан жауап D.';break;
 case 'named-supplement':s='OA және OB — қарама-қарсы сәулелер. AOD пен BOD іргелес бұрыштарының қосындысы 180°. AOD = 180 − '+p.givenDegrees+' = '+r.answer+'°. Тексеру: '+r.answer+' + '+p.givenDegrees+' = 180.';break;
 case 'adjacent-supplement':s='Ортақ қабырғадан басқа екі қабырға бір түзудің қарама-қарсы сәулелері болады. Демек, ізделген бұрыш '+p.givenDegrees+'°-пен бірге жазыңқы бұрыш құрайды: 180 − '+p.givenDegrees+' = '+r.answer+'°.';break;
 case 'opposite-pair':s='Жоғарғы оң жақтағы ∠2-ге төменгі сол жақтағы ∠3 қарама-қарсы орналасқан. Олардың қабырғалары бір-бірінің созындылары, сондықтан ∠2 және ∠3 — вертикаль жұп. ∠4 пен ∠1 де вертикаль, бірақ ол жұп жауап нұсқаларында жоқ.';break;
 case 'point-line-distance':s='ℓ тік түзуіне перпендикуляр бағыт — көлденең бағыт. A-дан ℓ-ге дейін көлденең бойымен '+r.answer+' бірлік аралық бар. Қиғаш AB кесіндісі бұдан ұзын, сондықтан оны қашықтық деп алуға болмайды.';break;
 case 'right-complement':s='AOC = 90°. OE осы тік бұрышты AOE және EOC бөліктеріне бөледі. EOC = 90 − '+p.givenDegrees+' = '+r.answer+'°. Екі бөлік қосылғанда 90° шығады.';break;
 case 'outside-right':s='OB сәулесі ізделген AOC бұрышының ішінде болғандықтан, AOC = AOB + BOC = 90 + '+p.givenDegrees+' = '+r.answer+'°. Азайтуға болмайды: OC тік бұрыштың сыртында жатыр.';break;
 case 'closest-line':s='k тік болғандықтан, әр нүктеден оған дейінгі көлденең тор аралықтарын санаймыз: '+r.checks.distances.map(t=>t.label+' — '+t.distance).join(', ')+'. Ең аз қашықтық C нүктесінде. Нүктенің жоғары не төмен тұруы бұл қашықтықты өзгертпейді.';break;
 case 'perpendicular-pair':s='2-жұпта екі түзу торкөз диагональдары бойымен қарама-қарсы бағытта көлбеу жүреді. Әрқайсысы көлденеңмен 45° жасайды, сондықтан олардың арасындағы бұрыш 45 + 45 = 90°. Қалған жұптарда тік бұрыш жоқ.';break;
 case 'cuboid-parallels':s='JJ₁ биіктік бағытымен өтеді. Осы бағыттағы қалған қырлар — KK₁, LL₁, MM₁. Әрқайсысы JJ₁-мен ортақ тікбұрышты жақтың қарама-қарсы қыры болады немесе сол бағыттағы қырға параллель. Толық тізімде 3 қыр бар; JJ₁ өзін санамаймыз.';break;
 case 'quadrilateral-parallels':s='M-нен N-ге 2 торкөз оңға, 4 торкөз жоғары жүреміз: әр 1 оңға — 2 жоғары. Q-дан P-ға 3 оңға, 6 жоғары: тағы да әр 1 оңға — 2 жоғары. Сондықтан MN ∥ PQ. NP үшін 5 оңға, 1 жоғары, MQ үшін 4 оңға, 1 төмен, яғни бұл екеуі параллель емес.';break;
 case 'parallel-segments':s='AB бағыты: 2 торкөз оңға, 1 жоғары. CD бағыты 4 оңға, 2 жоғары — сол бағыт; EF те 2 оңға, 1 жоғары. GH, KL, MN бағыттары бұдан өзгеше. AB-дың өзін қоспағанда, параллель кесінділер CD және EF, саны '+r.answer+'.';break;
 case 'parallel-through':s='t бойымен әр 3 торкөз оңға жылжығанда 1 торкөз жоғары көтерілеміз. p түзуі де дәл осы бағытпен өтеді. q үшін 1 оңға — 2 жоғары, r үшін 2 оңға — 1 жоғары: екеуі де t-ға параллель емес. Дұрыс түзу p.';break;
 case 'octagon-pairs':{const names=p.labels,pairs=r.checks.edgePairs.map(([a,b])=>names[a]+names[(a+1)%8]+' ∥ '+names[b]+names[(b+1)%8]);s='Торкөздер бойынша бірдей бағыттағы қабырғаларды салыстырамыз: '+pairs.join('; ')+'. DE мен HA бағыттары қалған қабырғалармен жұптаспайды. Сондықтан '+r.answer+' жұп.';break;}
 case 'parallel-distance':s='Түзулердің арақашықтығын оларға перпендикуляр тік бағытпен өлшейміз. Арада '+r.checks.unitGaps+' торкөз бар. Әрқайсысы '+p.unitMm+' мм: '+r.checks.unitGaps+' × '+p.unitMm+' = '+r.answer+' мм.';break;
 default:throw Error('Unknown solution');
 }
 return s;
}
export function descriptionFor(q){
 const p=q.params,k=kind(q);
 if(p.scene==='angles')return 'O нүктесінен сәулелер: '+p.rays.map(r=>r.label+' — оңға бағыттан сағат тіліне қарсы '+r.degrees+'° бағытында').join('; ')+'. '+(p.given?'Берілген '+p.given.join('O')+' бұрышы '+p.givenDegrees+'°. Ізделген бұрыш '+p.target.join('O')+'.':'Жоғарғы оң сектордан сағат тіліне қарсы сектор белгілері '+p.sectorLabels.join(', ')+'.');
 if(k==='cuboid-parallels')return 'Тікбұрышты JKLMJ₁K₁L₁M₁ денесі. JK = 6, KL = 4, JJ₁ = 3 шартты бірлік; JJ₁ бөлектелген. J, K, L, M — төменгі, индексті нүктелер — оларға сәйкес жоғарғы төбелер. Үзік сызық — жасырын қыр.';
 if(k==='perpendicular-pair')return 'Төрт шаршы тор. Түзулердің бағыттары әр торда оңға-жоғары бірлік векторларымен: '+p.pairs.map((v,i)=>(i+1)+': '+v.map(x=>'('+x.join('; ')+')').join(' және ')).join('; ')+'.';
 if(k==='parallel-segments')return 'Бірдей бірлік тордағы кесінді бағыттары: '+p.segments.map(r=>r.labels.join('')+': '+r.direction[0]+' оңға, '+r.direction[1]+' жоғары').join('; ')+'.';
 if(k==='octagon-pairs')return 'Бірлік тордағы сегізбұрыштың реттелген төбелері: '+p.polygon.map((v,i)=>p.labels[i]+'('+v.join('; ')+')').join(', ')+'.';
 if(k==='parallel-through')return 'Бірлік тор. t: ('+p.reference.point.join('; ')+') нүктесі, бағыты ('+p.reference.direction.join('; ')+'). A('+p.through.join('; ')+'). A арқылы өтетіндер: '+p.lines.map(r=>r.label+' бағыты ('+r.direction.join('; ')+')').join(', ')+'.';
 if(k==='parallel-distance')return 'Шаршы торда a мен b көлденең. a жолы '+p.firstY+', b жолы '+p.secondY+' шартты координатасында. Бір ұяшық '+p.unitMm+' мм.';
 return 'Бірлік тордағы нүктелер: '+p.points.map(r=>r.label+'('+r.x+'; '+r.y+')').join(', ')+'. '+(p.lineX!==undefined?'Тік '+(k==='point-line-distance'?'ℓ':'k')+' түзуінің көлденең орны '+p.lineX+'.':k==='off-line'?'Түзу ('+p.linePoint.join('; ')+') және ('+p.lineOther.join('; ')+') нүктелері арқылы өтеді.':'M, N, P, Q ретімен қосылған.');
}
export function svgFor(q){
 const p=q.params,k=kind(q),blue='#315ce8',purple='#8459ce',ink='#203549',soft='#dbe5f1';let body='';
 const line=(x1,y1,x2,y2,color=ink,width=2.5,extra='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
 const text=(x,y,t,size=20,color=ink,extra='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+esc(t)+'</text>';
 const label=(x,y,t)=>text(x,y,t,21,ink,'text-anchor="middle" stroke="#fff" stroke-width="5" paint-order="stroke"');
 const grid=(xmin,xmax,ymin,ymax,project)=>{
  let s='';for(let x=xmin;x<=xmax;x++){const a=project([x,ymin]),b=project([x,ymax]);s+=line(...a,...b,soft,1);}
  for(let y=ymin;y<=ymax;y++){const a=project([xmin,y]),b=project([xmax,y]);s+=line(...a,...b,soft,1);}return s;
 };
 const project=([x,y])=>[240+x*26,180-y*26];
 function point(r,P=project){
  const [x,y]=P([r.x,r.y]);return '<circle data-point="'+r.label+'" data-x="'+r.x+'" data-y="'+r.y+'" cx="'+x+'" cy="'+y+'" r="5" fill="'+blue+'"/>'+label(x+(r.dx??12),y+(r.dy??-12),r.label);
 }
 function infinite(P,d,project,xmin=-6,xmax=6,ymin=-5,ymax=5,color=blue,extra=''){
  const cuts=[];
  for(const x of [xmin,xmax])if(d[0]){const t=(x-P[0])/d[0],y=P[1]+t*d[1];if(y>=ymin&&y<=ymax)cuts.push([x,y]);}
  for(const y of [ymin,ymax])if(d[1]){const t=(y-P[1])/d[1],x=P[0]+t*d[0];if(x>=xmin&&x<=xmax)cuts.push([x,y]);}
  const unique=cuts.filter((a,i)=>!cuts.slice(0,i).some(b=>a.every((v,n)=>Math.abs(v-b[n])<1e-8)));assert.equal(unique.length,2);return line(...project(unique[0]),...project(unique[1]),color,3,extra);
 }
 if(p.scene==='angles'){
  const [ox,oy]=p.origin||[240,180],R=p.rayLength||160,polar=(deg,r)=>[ox+Math.cos(deg*Math.PI/180)*r,oy-Math.sin(deg*Math.PI/180)*r];
  for(const r of p.rays){const xy=polar(r.degrees,R);body+=line(ox,oy,...xy,blue,3,'data-ray="'+r.label+'" data-degrees="'+r.degrees+'"');if(!p.noRayLabels){const a=polar(r.degrees,R+16);body+=label(...a,r.label);}}
  for(const l of p.lineLabels||[])body+=label(...polar(l.degrees,R+18),l.label);
  body+='<circle cx="'+ox+'" cy="'+oy+'" r="4" fill="'+ink+'"/>'+label(ox-14,oy+20,'O');
  const arc=(pair,r,t,offset=25)=>{
   const a=ray(p,pair[0]),b=ray(p,pair[1]);let end=b;while(end<a)end+=360;assert.ok(end-a<180.00001);const s=polar(a,r),e=polar(end,r),m=polar((a+end)/2,r+offset);
   return '<path d="M '+s.join(' ')+' A '+r+' '+r+' 0 0 0 '+e.join(' ')+'" fill="none" stroke="'+purple+'" stroke-width="2"/>'+text(m[0],m[1]+7,t,22,purple,'text-anchor="middle" stroke="#fff" stroke-width="5" paint-order="stroke"');
  };
  if(p.given){body+=arc(p.given,p.givenRadius||60,p.givenDegrees+'°',p.givenOffset||30);body+=arc(p.target,p.targetRadius||85,'?',p.targetOffset||25);}
  if(p.rightMark)body+='<path d="M '+(ox+22)+' '+oy+' L '+(ox+22)+' '+(oy-22)+' L '+ox+' '+(oy-22)+'" fill="none" stroke="'+ink+'" stroke-width="1.6"/>';
  if(p.sectorLabels)for(let i=0;i<4;i++){const a=p.rays[i].degrees,b=p.rays[(i+1)%4].degrees+(i===3?360:0),xy=polar((a+b)/2,73);body+=text(xy[0],xy[1]+9,p.sectorLabels[i],29,purple,'text-anchor="middle"');}
 }else if(p.scene==='perp-gallery'){
  for(const [i,pair]of p.pairs.entries()){
   const ox=120+(i%2)*240,oy=98+Math.floor(i/2)*172,P=([x,y])=>[ox+19*x,oy-19*y];
   body+=grid(-4,4,-3,3,P)+text(ox-90,oy-64,i+1,21,ink);
   for(const [j,d]of pair.entries())body+=infinite([0,0],d,P,-4,4,-3,3,j?purple:blue,'data-pair="'+(i+1)+'" data-direction="'+d.join(',')+'"');
  }
 }else if(p.scene==='cuboid'){
  const P=([x,y,z])=>[100+38*x+22*y,280-30*y-45*z];
  for(const [a,b]of p.edges){const ref=[a,b].includes('J')&&[a,b].includes('J₁'),hidden=[a,b].includes('M');body+=line(...P(p.vertices[a]),...P(p.vertices[b]),ref?'#ef8b35':blue,ref?5:2.6,'data-edge="'+a+b+'"'+(hidden?' stroke-dasharray="7 5"':''));}
  for(const [name,v]of Object.entries(p.vertices)){const [x,y]=P(v),right=name.startsWith('K')||name.startsWith('L');body+=label(x+(right?14:-14),y+(name.includes('₁')?0:16),name);}
 }else if(p.scene==='segments'){
  for(const [i,r]of p.segments.entries()){
   const ox=80+(i%3)*160,oy=105+Math.floor(i/3)*168,P=([x,y])=>[ox+20*(x-2),oy-20*(y-2)];
   body+=grid(0,4,0,4,P)+text(ox-52,oy-60,r.labels.join(''),20,i?ink:blue);
   const [dx,dy]=r.direction,a=[Math.floor((4-dx)/2),Math.floor((4-dy)/2)],b=[a[0]+dx,a[1]+dy],A=P(a),B=P(b);
   body+=line(...A,...B,i?purple:blue,3,'data-segment="'+r.labels.join('')+'" data-direction="'+r.direction.join(',')+'" data-grid-start="'+a.join(',')+'" data-grid-end="'+b.join(',')+'"');
   body+='<circle cx="'+A[0]+'" cy="'+A[1]+'" r="3" fill="'+ink+'"/><circle cx="'+B[0]+'" cy="'+B[1]+'" r="3" fill="'+ink+'"/>';
   body+=label(A[0]-9,A[1]+19,r.labels[0])+label(B[0]+9,B[1]-10,r.labels[1]);
  }
 }else if(p.scene==='octagon'){
  const P=([x,y])=>[240+(x-4.5)*30,180-(y-4)*30];body+=grid(-1,10,-1,9,P);
  body+='<polygon data-vertices="'+p.polygon.map(v=>v.join(',')).join(';')+'" points="'+p.polygon.map(P).map(v=>v.join(',')).join(' ')+'" fill="#eef0ff" stroke="'+blue+'" stroke-width="3"/>';
  const offsets=[[-14,0],[0,20],[0,20],[14,0],[14,0],[0,-14],[0,-14],[-14,0]];
  p.polygon.forEach((v,i)=>{const xy=P(v);body+=label(xy[0]+offsets[i][0],xy[1]+offsets[i][1],p.labels[i]);});
 }else{
  body+=grid(-6,6,-5,5,project);
  if(k==='off-line')body+=infinite(p.linePoint,vector(p.linePoint,p.lineOther),project);
  if(k==='point-line-distance'||k==='closest-line'){body+=line(...project([p.lineX,-5]),...project([p.lineX,5]),purple,3)+label(project([p.lineX,5])[0]+15,37,k==='point-line-distance'?'ℓ':'k');if(k==='point-line-distance')body+=line(...project(byName(p,'A')),...project(byName(p,'B')),'#e79a56',2.3);}
  if(k==='quadrilateral-parallels')body+='<polygon data-vertices="'+p.points.map(r=>r.x+','+r.y).join(';')+'" points="'+p.points.map(r=>project([r.x,r.y]).join(',')).join(' ')+'" fill="#e8f2ff" stroke="'+blue+'" stroke-width="3"/>';
  if(k==='parallel-through'){body+=infinite(p.reference.point,p.reference.direction,project,-6,6,-5,5,ink)+label(422,project([6,1/3])[1]-10,'t');for(const r of p.lines){body+=infinite(p.through,r.direction,project,-6,6,-5,5,blue,'data-line="'+r.label+'" data-direction="'+r.direction.join(',')+'"');body+=label(r.labelX,r.labelY,r.label);}body+=point({label:'A',x:p.through[0],y:p.through[1],dx:-13,dy:20});}
  if(k==='parallel-distance')for(const [n,y]of [['a',p.firstY],['b',p.secondY]])body+=line(...project([-6,y]),...project([6,y]),n==='a'?purple:blue,3,'data-row="'+y+'"')+label(424,project([6,y])[1]+7,n);
  for(const r of p.points||[])body+=point(r);
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-labelledby="title desc"><title id="title">Түзулер мен бұрыштар</title><desc id="desc">'+esc(descriptionFor(q))+'</desc><rect width="480" height="360" rx="18" fill="#fff"/><g font-family="Arial, sans-serif" stroke-linecap="round" stroke-linejoin="round">'+body+'</g></svg>';
}
export function verifyEdition(q){
 const r=independentlyCalculate(q);assert.equal(r.answer,q.answer,'Independent line geometry answer');
 assert.equal(statementFor(q),q.statement,'Exact parameter-bound statement');assert.equal(solutionFor(q),q.solution,'Exact parameter-bound solution');assert.equal(descriptionFor(q),q.figureDescription,'Exact accessible description');assert.equal(sha(svgFor(q)),q.figureSha256,'Exact native SVG digest');
 if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(v=>v===r.answer).length,1);}
 return {answer:r.answer,checks:Object.entries(r.checks).map(([name,value])=>name+': '+JSON.stringify(value))};
}
