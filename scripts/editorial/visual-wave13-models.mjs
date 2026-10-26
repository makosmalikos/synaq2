// Native solids. Hidden-edge visibility follows 3D face normals, not styling guesses.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const prefix='visual-wave13-',kind=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const edgeKey=(a,b)=>[a,b].sort().join(':');
export function solidEdges(vertices,faces){
 const rows=new Map(),view=[0.6,-1,0.65];
 for(const face of faces){
  const A=vertices[face[0]],B=vertices[face[1]],C=vertices[face[2]],normal=cross(sub(B,A),sub(C,A)),visible=dot(normal,view)>0;assert.ok(normal.some(Boolean));
  for(let i=0;i<face.length;i++){const a=face[i],b=face[(i+1)%face.length],key=edgeKey(a,b);if(!rows.has(key))rows.set(key,{a,b,key,faces:[],visible:false});const row=rows.get(key);row.faces.push(face.join(''));row.visible||=visible;}
 }
 for(const r of rows.values())assert.equal(r.faces.length,2,'Each closed convex solid edge belongs to two faces');
 return [...rows.values()];
}
export function cuboid(p){
 const [a,b,c]=p.dimensions,vertices={E:[0,0,0],F:[a,0,0],G:[a,b,0],H:[0,b,0],'E₁':[0,0,c],'F₁':[a,0,c],'G₁':[a,b,c],'H₁':[0,b,c]};
 const faces=[['E','H','G','F'],['E₁','F₁','G₁','H₁'],['E','F','F₁','E₁'],['F','G','G₁','F₁'],['G','H','H₁','G₁'],['H','E','E₁','H₁']];
 return {vertices,faces,edges:solidEdges(vertices,faces)};
}
export function pyramid(p){
 const vertices=Object.fromEntries(p.base.map((v,i)=>[p.labels[i],[...v,0]]));vertices[p.apexLabel]=p.apex;
 const faces=[p.labels.slice().reverse(),...p.labels.map((l,i)=>[l,p.labels[(i+1)%p.labels.length],p.apexLabel])];return {vertices,faces,edges:solidEdges(vertices,faces)};
}
export function independentlyCalculate(q){
 const p=q.params,k=kind(q);let answer,checks;
 switch(k){
 case 'cuboid-hidden-edge':{const data=cuboid(p),hidden=data.edges.filter(e=>!e.visible),matches=p.candidates.filter(([a,b])=>hidden.some(e=>e.key===edgeKey(a,b)));assert.equal(matches.length,1);answer=matches[0].join('');checks={hiddenEdges:hidden.map(r=>r.key),totalEdges:data.edges.length};break;}
 case 'packed-unit-cubes':{assert.ok(p.dimensions.every(n=>Number.isInteger(n)&&n>=2&&n<=4));const cells=[];for(let x=0;x<p.dimensions[0];x++)for(let y=0;y<p.dimensions[1];y++)for(let z=0;z<p.dimensions[2];z++)cells.push([x,y,z]);answer=String(cells.length);checks={layers:p.dimensions[2],cellsPerLayer:p.dimensions[0]*p.dimensions[1]};break;}
 case 'cylinder-radius':assert.ok(p.diameter>0&&p.diameter%2===0&&p.height>0);answer=String(p.diameter/2);checks={diameter:p.diameter,irrelevantHeight:p.height};break;
 case 'cone-radius-name':{assert.equal(p.center,'C');assert.ok(p.rim.includes('M')&&p.rim.includes('N'));answer='CM';checks={center:p.center,rim:p.rim,diameter:'MN',height:'TC'};break;}
 case 'cuboid-total-edges':{const data=cuboid(p),lengths=data.edges.map(e=>{const d=sub(data.vertices[e.a],data.vertices[e.b]);assert.equal(d.filter(v=>v!==0).length,1);return Math.abs(d.find(v=>v!==0));});answer=String(lengths.reduce((s,n)=>s+n,0));checks={edgeLengths:lengths,totalEdges:lengths.length};assert.equal(lengths.length,12);break;}
 case 'pyramid-edge-count':{const data=pyramid(p);answer=String(data.edges.length);checks={baseEdges:p.base.length,lateralEdges:p.base.length,hiddenEdges:data.edges.filter(e=>!e.visible).map(e=>e.key)};assert.equal(data.edges.length,p.base.length*2);break;}
 case 'tetrahedron-hidden-edge':{const data=pyramid(p),hidden=data.edges.filter(e=>!e.visible);assert.equal(hidden.length,1);answer=[hidden[0].a,hidden[0].b].sort().join('');checks={hiddenEdge:hidden[0].key,totalEdges:data.edges.length};assert.equal(data.edges.length,6);break;}
 default:throw Error('Known solid model '+k);
 }
 return {answer,checks};
}
function core(q){
 switch(kind(q)){
 case 'cuboid-hidden-edge':return 'EFGHE₁F₁G₁H₁ тікбұрышты параллелепипеді кескінделген. Үзік сызықпен көрсетілген, көрінбейтін қырды таңдаңыз.';
 case 'packed-unit-cubes':return 'Тұтас дене бірдей кубтардан жиналған, ішінде бос орын жоқ. Кейбір кубтар артқы және төменгі қабаттарда жасырын тұр. Денеде барлығы неше куб бар?';
 case 'cylinder-radius':return 'Цилиндрдің биіктігі мен табанының диаметрі суретте сантиметрмен берілген. Табан радиусы неше сантиметр?';
 case 'cone-radius-name':return 'Конуста T — төбе, C — табан шеңберінің центрі, M мен N шеңбердің бойында жатыр. Табан радиусын білдіретін кесіндіні таңдаңыз.';
 case 'cuboid-total-edges':return 'Тікбұрышты параллелепипедтің үш өлшемі суретте дециметрмен берілген. Оның барлық 12 қырының ұзындықтарының қосындысы неше дециметр? Көрінбейтін қырлар да есепке алынады.';
 case 'pyramid-edge-count':return 'Кескіндегі пирамиданың барлық қырларын санаңыз. Үзік сызықпен көрсетілген қырлар да осы денеге жатады. Қыр саны нешеу?';
 case 'tetrahedron-hidden-edge':return 'TPQR үшбұрышты пирамидасы кескінделген. Қай қыр басқа жақтарының артында қалып, үзік сызықпен көрсетілген?';
 default:throw Error('Known condition');
 }
}
export const statementFor=q=>core(q)+(q.options?'':' Жауапқа тек санды жазыңыз.');
export function solutionFor(q){
 const p=q.params,r=independentlyCalculate(q);
 switch(kind(q)){
 case 'cuboid-hidden-edge':return 'Артқы төменгі H төбесіне келетін EH, GH және HH₁ қырлары көрінбейді, сондықтан үзік көрсетілген. Нұсқалардағы FF₁, E₁H₁ және GG₁ тұтас сызылған. Дұрыс қыр HH₁.';
 case 'packed-unit-cubes':return 'Төменгі қабатта '+p.dimensions[0]+' × '+p.dimensions[1]+' = '+r.checks.cellsPerLayer+' куб. Осындай '+r.checks.layers+' қабат бар. Барлығы '+r.checks.cellsPerLayer+' × '+r.checks.layers+' = '+r.answer+' куб. Тек сыртынан көрінген кубтармен шектелмейміз.';
 case 'cylinder-radius':return 'Табан центрі арқылы өткен толық кесінді '+p.diameter+' см — диаметр. Радиус оның жартысы: '+p.diameter+' : 2 = '+r.answer+' см. '+p.height+' см — цилиндрдің биіктігі, ол табан радиусы емес.';
 case 'cone-radius-name':return 'Радиус шеңбер центрінен шеңбердің бойына барады. C — центр, M — шеңбер нүктесі, сондықтан CM — радиус. MN — диаметр, TC — биіктік, TM — жасаушы.';
 case 'cuboid-total-edges':return 'Әр өлшемге тең төрт қыр бар: '+p.dimensions.join(', ')+'. Барлық қырлар қосындысы 4 × ('+p.dimensions.join(' + ')+') = 4 × '+p.dimensions.reduce((s,n)=>s+n,0)+' = '+r.answer+' дм.';
 case 'pyramid-edge-count':return 'Табанда A, B, C, D, E, F — 6 төбе, демек 6 табан қыры бар. Төбе S осы алты төбенің әрқайсысымен жалғасады: тағы 6 бүйір қыр. Барлығы 6 + 6 = '+r.answer+'. Үзік сызықтар да саналады.';
 case 'tetrahedron-hidden-edge':return 'Пирамиданың TQ, PQ, TR және басқа алдыңғы қырлары тұтас көрсетілген. P мен R төбелерін жалғаған табанның артқы PR қыры ғана үзік сызылған. Сондықтан жауап PR.';
 default:throw Error('Known solution');
 }
}
export function descriptionFor(q){
 const p=q.params,k=kind(q);
 if(p.scene==='cuboid'){const data=cuboid(p);return 'Тікбұрышты EFGHE₁F₁G₁H₁ денесі. '+(k==='cuboid-total-edges'?'Үш өлшемі '+p.dimensions.join(', ')+' дм. ':'')+'Үзік қырлар '+data.edges.filter(e=>!e.visible).map(e=>e.a+e.b).join(', ')+'. Басқалары тұтас.';}
 if(p.scene==='cubes')return 'Бос орны жоқ куб блогы: алдыңғы беті '+p.dimensions[0]+' баған мен '+p.dimensions[2]+' қатар, оң бетінің тереңдігі '+p.dimensions[1]+' куб. Әр бетте кубтардың шекаралары көрсетілген.';
 if(p.scene==='cylinder')return 'Цилиндр табанының диаметрі '+p.diameter+' см; ол табан центрі арқылы өтеді. Тік биіктігі '+p.height+' см. Табанның артқы жартысы үзік сызықпен берілген.';
 if(p.scene==='cone')return 'T төбесі, C табан центрі, M мен N табанның сол және оң шетінде. TC тік биіктігі мен MN центр арқылы өтетін кесіндісі үзік берілген. TM мен TN бүйір шеттері тұтас.';
 const data=pyramid(p);return p.labels.join(', ')+' — табан төбелері; '+p.apexLabel+' — жоғарғы төбе. Әр табан төбесі жоғарғы төбемен жалғасқан. Үзік қырлар '+data.edges.filter(e=>!e.visible).map(e=>e.a+e.b).join(', ')+'.';
}
export function svgFor(q){
 const p=q.params,k=kind(q),blue='#315ce8',purple='#8459ce',ink='#203549';let body='';
 const line=(A,B,color=ink,width=2,extra='')=>'<line x1="'+A[0]+'" y1="'+A[1]+'" x2="'+B[0]+'" y2="'+B[1]+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
 const text=(x,y,t,size=24,color=ink,extra='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+esc(t)+'</text>';
 const center=(x,y,t,size=24,color=ink)=>text(x,y,t,size,color,'text-anchor="middle" stroke="#fff" stroke-width="5" paint-order="stroke"');
 const poly=(coords,color,extra='')=>'<polygon points="'+coords.map(v=>v.join(',')).join(' ')+'" fill="'+color+'" stroke="'+blue+'" stroke-width="2" '+extra+'/>';
 const dim=(A,B,t)=>line(A,B,ink,1.5)+center((A[0]+B[0])/2,(A[1]+B[1])/2+8,t,25);
 if(p.scene==='cuboid'){
  const data=cuboid(p),[a,b,c]=p.dimensions,scale=Math.min(330/(a+0.6*b),240/(c+0.65*b)),P=([x,y,z])=>[70+scale*(x+0.6*y),305-scale*(z+0.65*y)];
  for(const e of data.edges.filter(e=>!e.visible).concat(data.edges.filter(e=>e.visible)))body+=line(P(data.vertices[e.a]),P(data.vertices[e.b]),blue,2.5,'data-edge="'+e.key+'" data-hidden="'+(!e.visible)+'"'+(!e.visible?' stroke-dasharray="7 5"':''));
  if(k==='cuboid-hidden-edge')for(const [name,v]of Object.entries(data.vertices)){const [x,y]=P(v),dx=name.startsWith('F')||name.startsWith('G')?14:-15,dy=name.includes('₁')?-9:19;body+=center(x+dx,y+dy,name,22);}
  else{
   const E=P(data.vertices.E),F=P(data.vertices.F),G=P(data.vertices.G),F1=P(data.vertices['F₁']);
   body+=dim([E[0],E[1]+22],[F[0],F[1]+22],a)+dim([F[0]+18,F[1]+12],[G[0]+18,G[1]+12],b)+dim([F[0]+27,F[1]],[F1[0]+27,F1[1]],c);
  }
 }else if(p.scene==='cubes'){
  const [a,b,c]=p.dimensions,scale=64,P=([x,y,z])=>[85+scale*x+30*y,295-30*y-scale*z];
  body+=poly([[0,0,0],[a,0,0],[a,0,c],[0,0,c]].map(P),'#dce8ff','data-face="front"')+poly([[a,0,0],[a,b,0],[a,b,c],[a,0,c]].map(P),'#dfd8ff','data-face="right"')+poly([[0,0,c],[a,0,c],[a,b,c],[0,b,c]].map(P),'#f2f6ff','data-face="top"');
  for(let x=0;x<=a;x++)body+=line(P([x,0,0]),P([x,0,c]),blue,1.6)+line(P([x,0,c]),P([x,b,c]),blue,1.6);
  for(let z=0;z<=c;z++)body+=line(P([0,0,z]),P([a,0,z]),blue,1.6)+line(P([a,0,z]),P([a,b,z]),blue,1.6);
  for(let y=0;y<=b;y++)body+=line(P([a,y,0]),P([a,y,c]),blue,1.6)+line(P([0,y,c]),P([a,y,c]),blue,1.6);
 }else if(p.scene==='cylinder'){
  const cx=240,top=65,bottom=255,h=bottom-top,rx=p.diameter/2*h/p.height,ry=31;
  body+='<ellipse cx="'+cx+'" cy="'+top+'" rx="'+rx+'" ry="'+ry+'" fill="#edf1ff" stroke="'+blue+'" stroke-width="2.5"/>'+line([cx-rx,top],[cx-rx,bottom],blue,2.5)+line([cx+rx,top],[cx+rx,bottom],blue,2.5);
  body+='<path d="M '+(cx-rx)+' '+bottom+' A '+rx+' '+ry+' 0 0 1 '+(cx+rx)+' '+bottom+'" fill="none" stroke="'+blue+'" stroke-width="2" stroke-dasharray="7 5"/><path d="M '+(cx-rx)+' '+bottom+' A '+rx+' '+ry+' 0 0 0 '+(cx+rx)+' '+bottom+'" fill="none" stroke="'+blue+'" stroke-width="2.5"/>';
  body+=line([cx-rx,bottom],[cx+rx,bottom],purple,2)+center(cx,bottom+56,p.diameter+' см',25,purple)+dim([cx+rx+29,top],[cx+rx+29,bottom],p.height+' см')+'<circle cx="'+cx+'" cy="'+bottom+'" r="4" fill="'+ink+'"/>'+center(cx,bottom-12,'O',21);
 }else if(p.scene==='cone'){
  const T=[240,45],C=[240,255],M=[95,255],N=[385,255],ry=35;
  body+='<path d="M 95 255 A 145 '+ry+' 0 0 1 385 255" fill="none" stroke="'+blue+'" stroke-width="2" stroke-dasharray="7 5"/><path d="M 95 255 A 145 '+ry+' 0 0 0 385 255" fill="none" stroke="'+blue+'" stroke-width="2.5"/>'+line(T,M,blue,2.5)+line(T,N,blue,2.5)+line(T,C,purple,1.8,'stroke-dasharray="6 5"')+line(M,N,purple,1.8,'stroke-dasharray="6 5"')+'<circle cx="240" cy="255" r="4" fill="'+ink+'"/>';
  for(const [n,v,d]of [['T',T,[0,-15]],['C',C,[13,22]],['M',M,[-15,12]],['N',N,[15,12]]])body+=center(v[0]+d[0],v[1]+d[1],n,24);
 }else if(p.scene==='pyramid'){
  const data=pyramid(p),scale=p.renderScale,P=([x,y,z])=>[p.renderOffset[0]+scale*(x+0.6*y),p.renderOffset[1]-scale*(z+0.65*y)];
  for(const e of data.edges.filter(e=>!e.visible).concat(data.edges.filter(e=>e.visible)))body+=line(P(data.vertices[e.a]),P(data.vertices[e.b]),blue,2.4,'data-edge="'+e.key+'" data-hidden="'+(!e.visible)+'"'+(!e.visible?' stroke-dasharray="7 5"':''));
  for(const [name,v]of Object.entries(data.vertices)){const xy=P(v),off=p.labelOffsets[name]||[0,20];body+=center(xy[0]+off[0],xy[1]+off[1],name,23);}
 }else throw Error('Known solid scene');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-labelledby="title desc"><title id="title">Кеңістіктегі фигура</title><desc id="desc">'+esc(descriptionFor(q))+'</desc><rect width="480" height="360" rx="18" fill="#fff"/><g font-family="Arial, sans-serif" stroke-linecap="round" stroke-linejoin="round">'+body+'</g></svg>';
}
export function verifyEdition(q){
 const r=independentlyCalculate(q);assert.equal(r.answer,q.answer,'Independent spatial answer');assert.equal(statementFor(q),q.statement,'Exact parameter-bound statement');assert.equal(solutionFor(q),q.solution,'Exact parameter-bound solution');assert.equal(descriptionFor(q),q.figureDescription,'Exact accessible description');assert.equal(sha(svgFor(q)),q.figureSha256,'Exact native SVG digest');if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(v=>v===r.answer).length,1);}
 return {answer:r.answer,checks:Object.entries(r.checks).map(([k,v])=>k+': '+JSON.stringify(v))};
}
