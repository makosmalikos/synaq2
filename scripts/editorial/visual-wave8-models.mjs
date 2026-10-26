// Independent plane/symmetry models and native vector drawings.
// Polygon symmetries use exact integer cross products on rational centroids.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const prefix='visual-wave8-',kind=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const point=(p,label)=>{const r=p.points.find(r=>r.label===label);assert.ok(r,'Known point '+label);return r;};
const xy=r=>'('+r.x+'; '+r.y+')';
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a;};
const edgeKey=(a,b)=>[a,b].sort((a,b)=>a-b).join(':');
function mappingPreservesEdges(poly,map){
 const edges=new Set(poly.map((_,i)=>edgeKey(i,(i+1)%poly.length)));
 return map.length===poly.length&&new Set(map).size===poly.length&&map.every((a,i)=>edges.has(edgeKey(a,map[(i+1)%map.length])));
}
export function symmetryAxes(poly){
 const N=poly.length,sx=poly.reduce((s,p)=>s+p[0],0),sy=poly.reduce((s,p)=>s+p[1],0),directions=new Map();
 const add=(dx,dy)=>{if(!dx&&!dy)return;const g=gcd(dx,dy);dx/=g;dy/=g;if(dx<0||dx===0&&dy<0){dx=-dx;dy=-dy;}directions.set(dx+':'+dy,[dx,dy]);};
 poly.forEach(([x,y],i)=>{add(N*x-sx,N*y-sy);const next=poly[(i+1)%N];add(N*(x+next[0])-2*sx,N*(y+next[1])-2*sy);});
 return [...directions.values()].filter(([dx,dy])=>{
  const den=dx*dx+dy*dy,map=poly.map(([x,y])=>{const wx=N*x-sx,wy=N*y-sy,dot=wx*dx+wy*dy,nx=(sx-wx)*den+2*dx*dot,ny=(sy-wy)*den+2*dy*dot;return poly.findIndex(([a,b])=>N*a*den===nx&&N*b*den===ny);});
  return !map.includes(-1)&&mappingPreservesEdges(poly,map);
 });
}
export function hasCentralSymmetry(poly){
 const N=poly.length,sx=poly.reduce((s,p)=>s+p[0],0),sy=poly.reduce((s,p)=>s+p[1],0),map=poly.map(([x,y])=>poly.findIndex(([a,b])=>N*a===2*sx-N*x&&N*b===2*sy-N*y));
 return !map.includes(-1)&&mappingPreservesEdges(poly,map);
}
export function twiceArea(poly){let a=0;for(let i=0;i<poly.length;i++){const p=poly[i],r=poly[(i+1)%poly.length];a+=p[0]*r[1]-p[1]*r[0];}return Math.abs(a);}
function validate(q){
 const p=q.params,k=kind(q);assert.ok(['plane','gallery','angle','axis'].includes(p.scene));
 if(p.points){assert.equal(new Set(p.points.map(r=>r.label)).size,p.points.length);assert.equal(new Set(p.points.map(r=>r.x+':'+r.y)).size,p.points.length);for(const r of p.points){assert.ok(Number.isInteger(r.x)&&Number.isInteger(r.y));if(p.scene==='plane')assert.ok(Math.abs(r.x)<=5&&Math.abs(r.y)<=5);}}
 if(p.scene==='gallery'){assert.ok(p.polygons.length===4||p.polygons.length===6);for(const poly of p.polygons){assert.ok(poly.length>=3&&poly.length<=9);assert.equal(new Set(poly.map(p=>p.join(':'))).size,poly.length);assert.ok(twiceArea(poly)>0);for(const pt of poly)assert.ok(pt.length===2&&pt.every(Number.isInteger));}}
 if(p.scene==='angle')assert.ok(Number.isInteger(p.half)&&p.half>25&&p.half<55);
 if(p.scene==='axis')assert.ok(Number.isInteger(p.min)&&Number.isInteger(p.max)&&p.min<p.max&&p.points.every(r=>r.x>=p.min&&r.x<=p.max&&r.y===0));
 if(k==='horizontal-length')assert.equal(point(p,p.first).y,point(p,p.second).y);
 if(k==='mirror-choice'||k==='mirror-separation'){assert.equal(p.axes,false);assert.equal(p.mirrorX,0);assert.ok(point(p,p.target).x<0);}
 if(k==='line-central-image')assert.ok(point(p,p.center).x>point(p,p.target).x,'This source has its original point to the left of its centre');
 if(k==='central-triangle-area'){const a=point(p,'A'),b=point(p,'B'),c=point(p,'C'),o=point(p,p.center);assert.equal(a.y,b.y);assert.equal(a.x,c.x);assert.ok(b.x>a.x&&c.y>a.y&&o.x>b.x&&o.y>c.y);}
 return p;
}
export function independentlyCalculate(q){
 const p=validate(q),k=kind(q),checks=['Every plotted coordinate is an exact grid position, with x/y order and axes membership checked separately'];let answer;
 switch(k){
 case 'ordinate':answer=String(point(p,p.target).y);break;
 case 'axes-count':answer=String(p.points.filter(r=>r.x===0||r.y===0).length);break;
 case 'axis-coordinate':{const r=point(p,p.target);assert.equal(r.x,0);assert.ok(r.y<0);answer=xy(r);break;}
 case 'quadrant-two-count':answer=String(p.points.filter(r=>r.x<0&&r.y>0).length);checks.push('Axis points are excluded from the quadrant');break;
 case 'horizontal-length':{let n=0;for(let x=Math.min(point(p,p.first).x,point(p,p.second).x);x<Math.max(point(p,p.first).x,point(p,p.second).x);x++)n++;answer=String(n);break;}
 case 'point-coordinate':answer=xy(point(p,p.target));break;
 case 'coordinate-choice':{const r=p.points.filter(r=>r.x===p.requested[0]&&r.y===p.requested[1]);assert.equal(r.length,1);answer=r[0].label;break;}
 case 'axis-symmetry-count':{const a=p.polygons.map(symmetryAxes);answer=String(a.filter(r=>r.length>0).length);checks.push('Every candidate reflection maps the full vertex set and all boundary edges, using exact rational-centroid arithmetic');break;}
 case 'bisector-angle':{let n=0;for(let side=0;side<2;side++)for(let d=0;d<p.half;d++)n++;answer=String(n);checks.push('A reflection axis through the angle vertex halves the angle');break;}
 case 'mirror-choice':{const a=point(p,p.target),r=p.points.filter(r=>r.label!==p.target&&r.x===2*p.mirrorX-a.x&&r.y===a.y);assert.equal(r.length,1);answer=r[0].label;break;}
 case 'mirror-separation':{const a=point(p,p.target),x=2*p.mirrorX-a.x;let n=0;for(let i=a.x;i<x;i++)n++;answer=String(n);checks.push('The full point-to-image distance doubles the perpendicular distance to the mirror');break;}
 case 'central-figure-choice':{const a=p.polygons.map((poly,i)=>hasCentralSymmetry(poly)?i+1:null).filter(Boolean);assert.equal(a.length,1);answer=String(a[0]);checks.push('Half-turn symmetry is tested independently from reflection-axis symmetry');break;}
 case 'origin-central-point':{const a=point(p,p.target),r=p.points.filter(r=>r.label!==p.target&&r.x+a.x===0&&r.y+a.y===0);assert.equal(r.length,1);answer=r[0].label;break;}
 case 'line-central-image':{const a=point(p,p.target).x,c=point(p,p.center).x;let reflected=c;for(let i=0;i<Math.abs(c-a);i++)reflected+=Math.sign(c-a);answer=String(reflected);break;}
 case 'central-triangle-area':{const poly=p.triangle.map(label=>{const r=point(p,label);return [r.x,r.y];}),c=point(p,p.center),image=poly.map(([x,y])=>[2*c.x-x,2*c.y-y]);assert.equal(twiceArea(poly),twiceArea(image));assert.equal(twiceArea(image)%2,0);answer=String(twiceArea(image)/2);checks.push('The reflected triangle is constructed by equal midpoint vectors; its area is recomputed by a separate shoelace traversal');break;}
 default:throw Error('Unknown source-specific form '+k);
 }return {answer,checks};
}
function conditionCore(q){
 const p=q.params;switch(kind(q)){
 case 'ordinate':return 'Жазықтықтағы B және M нүктелеріне қараңыз. B нүктесінің ординатасы қандай сан?';
 case 'axes-count':return 'Координаталық жазықтықта жеті нүкте берілген. Олардың нешеуі координаталар осьтерінің бірінде жатыр?';
 case 'axis-coordinate':return 'C нүктесі белгіленген. Оның координаталарын (абсцисса; ордината) ретімен таңдаңыз.';
 case 'quadrant-two-count':return 'Белгіленген жеті нүктенің нешеуі II ширектің ішінде жатыр? Осьте жатқан нүкте ширекке кірмейді.';
 case 'horizontal-length':return 'Бірлік тордағы A және B нүктелерін қосатын көлденең кесіндінің ұзындығы неше бірлік?';
 case 'point-coordinate':return 'Түзулер мен бірлік белгілерді пайдаланып, A нүктесінің координаталарын дұрыс ретпен таңдаңыз.';
 case 'coordinate-choice':return 'Қай белгіленген нүктенің координаталары ('+p.requested.join('; ')+') жұбына тең?';
 case 'axis-symmetry-count':return 'Торкөздерде алты фигура берілген. Олардың нешеуінде кемінде бір симметрия осі бар? Ось бойымен бүктегенде екі бөлік толық беттесуі керек.';
 case 'bisector-angle':return 'k түзуі — ABC бұрышының симметрия осі, D нүктесі осы түзуде жатыр. Берілген жарты бұрышты пайдаланып, ABC бұрышының градустық өлшемін табыңыз.';
 case 'mirror-choice':return 'k тік түзуіне қатысты A нүктесіне симметриялы болатын нүктені таңдаңыз. Бір көлденең жол мен оське дейінгі қашықтықты бірге ескеріңіз.';
 case 'mirror-separation':return 'Торкөз қабырғасы 1 см. k түзуіне қатысты A нүктесінің A₁ бейнесі салынса, AA₁ кесіндісінің толық ұзындығы неше сантиметр болады?';
 case 'central-figure-choice':return 'Төрт фигураның қайсысы бір нүкте төңірегінде 180° бұрылғанда өзімен толық беттеседі? Фигураның нөмірін таңдаңыз.';
 case 'origin-central-point':return 'Координаталар басы O нүктесіне қатысты A нүктесінің центрлік симметриялы бейнесі қай белгіленген нүкте болады?';
 case 'line-central-image':return 'Сандық түзуде P нүктесі симметрия центрі болсын. A нүктесінің осы центрге қатысты A₁ бейнесінің координатасын табыңыз.';
 case 'central-triangle-area':return 'Бірлік торда ABC үшбұрышы мен O нүктесі берілген. O центріне қатысты осы үшбұрыштың бейнесі салынды. Бейненің ауданы неше бірлік шаршыға тең?';
 default:throw Error('Unknown condition');
 }
}
export const statementFor=q=>conditionCore(q)+(q.options?'':' Жауапқа тек санды жазыңыз.');
export function solutionFor(q){
 const p=q.params,k=kind(q),answer=independentlyCalculate(q).answer;let s;
 switch(k){
 case 'ordinate':s='B'+xy(point(p,'B'))+'. Ордината — екінші координата, сондықтан '+answer+'. M'+xy(point(p,'M'))+' нүктесінің абсциссасымен шатастырмау керек.';break;
 case 'axes-count':s='Осьте жатқан нүктеде x = 0 немесе y = 0 болады. Шартқа сай нүктелер: '+p.points.filter(r=>r.x===0||r.y===0).map(r=>r.label+xy(r)).join(', ')+'. Саны '+answer+'.';break;
 case 'axis-coordinate':s='C нүктесі Oy осінде, сондықтан абсциссасы 0. Ординатасы '+point(p,'C').y+'. Координаталар жұбы '+answer+'.';break;
 case 'quadrant-two-count':s='II ширекте x < 0 және y > 0. Осы екі шартты да қанағаттандыратындар '+p.points.filter(r=>r.x<0&&r.y>0).map(r=>r.label+xy(r)).join(', ')+'. Саны '+answer+'. Бір координатасы 0 болса, нүкте осьте жатады.';break;
 case 'horizontal-length':s='A'+xy(point(p,'A'))+', B'+xy(point(p,'B'))+'. Ординаталары бірдей. Көлденең ұзындық '+Math.max(point(p,'A').x,point(p,'B').x)+' − ('+Math.min(point(p,'A').x,point(p,'B').x)+') = '+answer+' бірлік.';break;
 case 'point-coordinate':s='A нүктесінен Ox бағыты бойынша '+point(p,'A').x+', Oy бағыты бойынша '+point(p,'A').y+' оқылады. Алдымен абсцисса, сосын ордината: '+answer+'.';break;
 case 'coordinate-choice':s='Нүктелер: '+p.points.map(r=>r.label+xy(r)).join(', ')+'. Сұралған жұпқа тек '+answer+' нүктесі сәйкес.';break;
 case 'axis-symmetry-count':s=p.polygons.map((poly,i)=>{const count=symmetryAxes(poly).length;return (i+1)+'-фигурада '+count+' ось бар';}).join('; ')+'. Осьтік симметриясы барлары '+p.polygons.map((poly,i)=>symmetryAxes(poly).length?i+1:null).filter(Boolean).join(', ')+'. Барлығы '+answer+'. Қиғаш параллелограмм мен қабырғалары әртүрлі тік үшбұрыш үшін бүктелген бөліктер беттеспейді.';break;
 case 'bisector-angle':s='k бойымен шағылдырғанда BA сәулесі BC сәулесіне көшеді. Екі жарты бұрыш тең: ABD = DBC = '+p.half+'°. Сондықтан ABC = '+p.half+' + '+p.half+' = '+answer+'°.';break;
 case 'mirror-choice':{const a=point(p,'A');s='A нүктесі k-дан солға '+Math.abs(a.x)+' торкөзде. Бейне сол көлденең жолда, k-дан оңға '+Math.abs(a.x)+' торкөзде жатуы тиіс. Екі шартқа тек '+answer+' нүктесі сай.';break;}
 case 'mirror-separation':s='A нүктесі k-дан '+Math.abs(point(p,'A').x)+' торкөз, яғни '+Math.abs(point(p,'A').x)+' см солда. Оның бейнесі дәл сондай қашықтықта оңда. AA₁ = '+Math.abs(point(p,'A').x)+' + '+Math.abs(point(p,'A').x)+' = '+answer+' см.';break;
 case 'central-figure-choice':s='Әр фигураны 180° бұрып тексереміз. '+answer+'-фигурада қарама-қарсы төбелер бір орта нүктеге қатысты жұптасады; қабырғалары да беттеседі. Қалған үш фигурада кемінде бір төбе не қабырға өз орнына көшпейді. Сондықтан дұрыс нөмір '+answer+'.';break;
 case 'origin-central-point':{const a=point(p,'A');s='A'+xy(a)+'. O центріне қатысты бейненің екі координатасының да таңбасы ауысады: ('+(-a.x)+'; '+(-a.y)+'). Бұл — '+answer+' нүктесі.';break;}
 case 'line-central-image':{const a=point(p,'A').x,c=point(p,'P').x;s='A('+a+'), P('+c+'). AP қашықтығы '+c+' − ('+a+') = '+(c-a)+'. P-дан сол бағытпен тағы '+(c-a)+' бірлік жүрсек, '+c+' + '+(c-a)+' = '+answer+'. Тексеру: ('+a+' + '+answer+') : 2 = '+c+'.';break;}
 case 'central-triangle-area':{const a=point(p,'A'),b=point(p,'B'),c=point(p,'C'),w=Math.abs(b.x-a.x),h=Math.abs(c.y-a.y);s='AB көлденең '+w+' торкөз, AC тік '+h+' торкөз. Тік үшбұрыш ауданы '+w+' · '+h+' : 2 = '+answer+' бірлік шаршы. Центрлік симметрия фигураны 180° бұрады және ауданын сақтайды, сондықтан бейне ауданы да '+answer+'.';break;}
 default:throw Error('Unknown solution');
 }return s+'\nЖауап: '+answer+'.';
}
export function descriptionFor(q){
 const p=q.params;let s=statementFor(q)+' ';
 if(p.scene==='plane'){
  if(p.axes!==false)s+='Бірлік координаталар: '+p.points.map(r=>r.label+xy(r)).join(', ')+'. ';
  else if(p.mirrorX===0){const a=point(p,p.target);s+='k — тік түзу. '+p.points.map(r=>r.label+': k-дан '+Math.abs(r.x)+' тор '+(r.x<0?'солға':'оңға')+', A жолынан '+(r.y===a.y?'жылжымаған':Math.abs(r.y-a.y)+' тор '+(r.y>a.y?'жоғары':'төмен'))).join('; ')+'. ';}
  else if(p.triangle){const a=point(p,'A'),b=point(p,'B'),c=point(p,'C');s+='AB көлденең '+Math.abs(b.x-a.x)+' тор, AC тік '+Math.abs(c.y-a.y)+' тор; A бұрышы тік. O үшбұрыштан оң жақта және жоғарыда. ';}
 }
 if(p.scene==='axis')s+='Белгіленген координаталар: '+p.points.map(r=>r.label+'('+r.x+')').join(', ')+'. A₁ берілмеген. ';
 if(p.scene==='gallery')s+='Әр фигураның жергілікті торындағы (баған; қатар) төбелері, шекара бойымен: '+p.polygons.map((poly,i)=>(i+1)+': '+poly.map(pt=>'('+pt.join('; ')+')').join(', ')).join(' | ')+'. ';
 if(p.scene==='angle')s+='BA және BC сәулелері k түзуінің екі жағында; D осы осьте. ABD = '+p.half+'°. Төменгі жарты бұрыштың өлшемі берілмеген. ';
 return s;
}
export function svgFor(q){
 const p=validate(q),scene=p.scene,height=scene==='axis'?220:360,n=x=>Number(x.toFixed(4));
 const text=(x,y,v,size=22,color='#3f587c')=>'<text x="'+n(x)+'" y="'+n(y)+'" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="'+size+'" fill="'+color+'" stroke="white" stroke-width="2.8" paint-order="stroke" stroke-linejoin="round">'+esc(v)+'</text>';
 const line=(x,y,a,b,attrs='')=>'<line x1="'+n(x)+'" y1="'+n(y)+'" x2="'+n(a)+'" y2="'+n(b)+'" '+attrs+'/>';let art='';
 const x=v=>240+26*v,y=v=>180-26*v;
 if(scene==='plane'){
  for(let i=-6;i<=6;i++)art+=line(x(i),y(-6),x(i),y(6),'stroke="#dde7f4" stroke-width="1"')+line(x(-6),y(i),x(6),y(i),'stroke="#dde7f4" stroke-width="1"');
  if(p.axes!==false){art+=line(x(-6)-5,y(0),x(6)+8,y(0),'stroke="#6f87ac" stroke-width="1.8" marker-end="url(#tip)"')+line(x(0),y(-6)+5,x(0),y(6)-8,'stroke="#6f87ac" stroke-width="1.8" marker-end="url(#tip)"');
   for(let i=-5;i<=5;i++)if(i){art+=text(x(i),y(0)+19,i,17)+text(x(0)-19,y(i),i,17);}art+=text(x(0)+10,y(0)+18,'0',17)+text(x(6)+21,y(0)-6,'x',20)+text(x(0)+21,y(6)-6,'y',20);
  }
  if(p.mirrorX===0)art+=line(x(0),y(-6),x(0),y(6),'stroke="#c39361" stroke-width="2" stroke-dasharray="7 5"')+text(x(0)+15,y(6)-4,'k',23,'#ab7c4d');
  if(p.triangle)art+='<polygon points="'+p.triangle.map(label=>{const r=point(p,label);return n(x(r.x))+','+n(y(r.y));}).join(' ')+'" fill="#c7d9fa" stroke="#6a80ba" stroke-width="2"/>';
  if(p.segment){const a=point(p,p.segment[0]),b=point(p,p.segment[1]);art+=line(x(a.x),y(a.y),x(b.x),y(b.y),'stroke="#8b72cd" stroke-width="3"');}
  if(p.guides)for(const label of p.guides){const a=point(p,label);art+=line(x(a.x),y(a.y),x(a.x),y(0),'stroke="#b7a9dc" stroke-dasharray="4 4"')+line(x(a.x),y(a.y),x(0),y(a.y),'stroke="#b7a9dc" stroke-dasharray="4 4"');}
  for(const a of p.points){const center=a.label===p.center,dy=a.dy??(p.axes!==false&&a.y===-1?16:-12);art+='<circle cx="'+n(x(a.x))+'" cy="'+n(y(a.y))+'" r="4.4" fill="'+(center?'#ad7763':'#6954b5')+'" data-point="'+a.label+'" data-x="'+a.x+'" data-y="'+a.y+'"/>'+text(x(a.x)+(a.dx??14),y(a.y)+dy,a.label,22,center?'#93654f':'#5a42ab');}
 }else if(scene==='axis'){
  const at=v=>48+384*(v-p.min)/(p.max-p.min),base=115;art+=line(33,base,448,base,'stroke="#7186a8" stroke-width="1.8" marker-end="url(#tip)"');for(let i=p.min;i<=p.max;i++)art+=line(at(i),base-5,at(i),base+5,'stroke="#8099b9"');art+=text(at(0),base+25,'0',20)+text(at(1),base+25,'1',20);for(const a of p.points)art+='<circle cx="'+n(at(a.x))+'" cy="'+base+'" r="4.4" fill="#6e59bc" data-point="'+a.label+'" data-x="'+a.x+'" data-y="0"/>'+text(at(a.x),base-25,a.label,23);
 }else if(scene==='gallery'){
  const cols=p.polygons.length===6?3:2,size=p.polygons.length===6?14:18;
  p.polygons.forEach((poly,i)=>{const xs=poly.map(r=>r[0]),ys=poly.map(r=>r[1]),mx=(Math.min(...xs)+Math.max(...xs))/2,my=(Math.min(...ys)+Math.max(...ys))/2,cx=(i%cols+.5)*480/cols,cy=100+Math.floor(i/cols)*180,xx=v=>cx+(v-mx)*size,yy=v=>cy+(v-my)*size;
   for(let c=Math.min(...xs)-1;c<=Math.max(...xs)+1;c++)art+=line(xx(c),yy(Math.min(...ys)-1),xx(c),yy(Math.max(...ys)+1),'stroke="#edf1f7"');for(let r=Math.min(...ys)-1;r<=Math.max(...ys)+1;r++)art+=line(xx(Math.min(...xs)-1),yy(r),xx(Math.max(...xs)+1),yy(r),'stroke="#edf1f7"');
   art+='<polygon points="'+poly.map(([a,b])=>n(xx(a))+','+n(yy(b))).join(' ')+'" fill="'+(i%2?'#f8deb4':'#cedbfa')+'" stroke="'+(i%2?'#b68d60':'#6c83b8')+'" stroke-width="1.8" data-polygon="'+(i+1)+'" data-vertices="'+poly.map(r=>r.join(',')).join(';')+'"/>'+text(cx,22+Math.floor(i/cols)*180,i+1,24);
  });
 }else if(scene==='angle'){
  const bx=100,by=180,r=220,rad=p.half*Math.PI/180,up=[bx+r*Math.cos(rad),by-r*Math.sin(rad)],down=[bx+r*Math.cos(rad),by+r*Math.sin(rad)];
  art+=line(bx,by,up[0],up[1],'stroke="#7b64bc" stroke-width="2.6" data-ray-degrees="'+p.half+'"')+line(bx,by,down[0],down[1],'stroke="#7b64bc" stroke-width="2.6" data-ray-degrees="'+(-p.half)+'"')+line(bx,by,405,by,'stroke="#bd9b66" stroke-width="2" stroke-dasharray="7 5"');
  const rr=65,end=[bx+rr*Math.cos(rad),by-rr*Math.sin(rad)];art+='<path d="M'+(bx+rr)+','+by+' A'+rr+','+rr+' 0 0,0 '+n(end[0])+','+n(end[1])+'" fill="none" stroke="#a58bc8" stroke-width="1.8"/>'+text(bx+91*Math.cos(rad/2),by-91*Math.sin(rad/2),p.half+'°',22)+text(bx-16,by+6,'B',24)+text(up[0]+14,up[1]-8,'A',24)+text(down[0]+14,down[1]+8,'C',24)+text(368,by-16,'D',23)+text(417,by+2,'k',23,'#a38355');
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="'+height+'" viewBox="0 0 480 '+height+'" role="img" aria-labelledby="title desc"><title id="title">'+esc(q.figureTitle)+'</title><desc id="desc">'+esc(q.figureDescription)+'</desc><defs><marker id="tip" markerWidth="7" markerHeight="7" refX="5.8" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L7,3.5 L0,7Z" fill="#7186a8"/></marker></defs><rect width="480" height="'+height+'" fill="white"/>'+art+'</svg>\n';
}
export function verifyEdition(q){
 const r=independentlyCalculate(q);assert.equal(q.answer,r.answer,'Independent grid/symmetry answer');assert.equal(q.statement,statementFor(q),'Exact condition');assert.equal(q.solution,solutionFor(q),'Exact solution');assert.equal(q.figureDescription,descriptionFor(q),'Exact accessible givens');assert.equal(q.image,'/figures/synaq-editions/'+q.editionId+'.svg');assert.equal(q.figureSha256,sha(svgFor(q)),'Native SVG digest');if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(x=>x===q.answer).length,1);}return {...r,checks:[...r.checks,'Source-specific skill, exact geometry, coordinate order, answer, solution and native SVG are bound']};
}
