// Own rectangle/polygon/grid constructions for individually addressed sources.
// The checker enumerates occupied unit squares and exposed edges; solutions use
// elementary area/perimeter formulas. No archived drawing is an input here.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const prefix='visual-wave3-';
const kind=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const integer=(v,k,min=1,max=10000)=>assert.ok(Number.isSafeInteger(v)&&v>=min&&v<=max,k);
const rect=(x,y,w,h,label='')=>({x,y,w,h,label});
const dims=(s,a,b,text,side=1)=>s.dimensions.push({a,b,text,side});
const hd=(s,a,b,y,text,side=-1)=>dims(s,[a,y],[b,y],text,side);
const vd=(s,x,a,b,text,side=-1)=>dims(s,[x,a],[x,b],text,side);
const unit=p=>p.unit||'см';
const amount=(n,p)=>n+' '+unit(p);
const areaLabel=p=>unit(p)+'²';
const cornerKinds=new Set(['square-cut','corner-area','choose-expression','wrong-expression','corner-perimeter','inverse-width','floor-cost','tile-boxes']);

export function sceneFor(q){
 const p=q.params,k=kind(q),s={rects:[],holes:[],polygons:[],auxRects:[],dimensions:[],labels:[],grid:false,notes:[]};
 if(cornerKinds.has(k)){
  s.rects=[rect(0,0,p.w,p.h)];s.holes=[rect(p.w-p.cw,0,p.cw,p.ch)];
  hd(s,0,p.w,p.h,amount(p.w,p),1);vd(s,0,0,p.h,k==='inverse-width'?'h = ?':amount(p.h,p));
  hd(s,p.w-p.cw,p.w,0,amount(p.cw,p));vd(s,p.w,p.ch,0,amount(p.ch,p),1);
  if(k==='inverse-width')s.labels.push({x:(p.w-p.cw)/2,y:p.h/2,text:'S = '+p.remaining+' '+areaLabel(p)});
 }else switch(k){
 case 'two-rectangles':
  s.rects=[rect(0,0,p.aw,p.ah,'I'),rect(p.aw,p.ah-p.bh,p.bw,p.bh,'II')];
  hd(s,0,p.aw,0,amount(p.aw,p));vd(s,0,0,p.ah,amount(p.ah,p));
  hd(s,p.aw,p.aw+p.bw,p.ah,amount(p.bw,p),1);vd(s,p.aw+p.bw,p.ah-p.bh,p.ah,amount(p.bh,p),1);break;
 case 'diagonal-half':
  s.polygons=[[[0,0],[p.w,0],[0,p.h]]];s.auxRects=[rect(0,0,p.w,p.h)];
  hd(s,0,p.w,0,amount(p.w,p));vd(s,0,0,p.h,amount(p.h,p));break;
 case 'three-pillars':
  s.rects=[rect(0,0,p.pillarW,p.pillarH),rect(p.pillarW+p.gap,0,p.pillarW,p.pillarH),rect(p.pillarW,0,p.gap,p.bridgeH)];
  hd(s,0,p.pillarW,p.pillarH,amount(p.pillarW,p),1);
  hd(s,p.pillarW,p.pillarW+p.gap,0,amount(p.gap,p));vd(s,0,0,p.pillarH,amount(p.pillarH,p));
  vd(s,p.pillarW+p.gap,0,p.bridgeH,amount(p.bridgeH,p),-1);break;
 case 't-shape':{
  const x=(p.barW-p.stemW)/2;s.rects=[rect(0,0,p.barW,p.barH),rect(x,p.barH,p.stemW,p.stemH)];
  hd(s,0,p.barW,0,amount(p.barW,p));vd(s,0,0,p.barH,amount(p.barH,p));
  hd(s,x,x+p.stemW,p.barH+p.stemH,amount(p.stemW,p),1);vd(s,x+p.stemW,p.barH,p.barH+p.stemH,amount(p.stemH,p),1);break;
 }
 case 'grid-area':
 case 'l-grid-perimeter':
 case 'cross-area-perimeter':
 case 'stair-perimeter':
  s.grid=true;s.rects=p.cells.map(([x,y])=>rect(x,y,1,1));
  {const bottom=Math.max(...p.cells.map(c=>c[1])),left=Math.min(...p.cells.filter(c=>c[1]===bottom).map(c=>c[0]));
   hd(s,left,left+1,bottom+1,p.side+' см',1);}break;
 case 'inner-garden':
  s.rects=[rect(0,0,p.w,p.h)];s.holes=[rect(p.holeX,p.holeY,p.cw,p.ch)];
  hd(s,0,p.w,p.h,amount(p.w,p),1);vd(s,0,0,p.h,amount(p.h,p));
  hd(s,p.holeX,p.holeX+p.cw,p.holeY,amount(p.cw,p));vd(s,p.holeX+p.cw,p.holeY,p.holeY+p.ch,amount(p.ch,p),1);break;
 case 'four-corners':
  s.rects=[rect(0,0,p.w,p.w)];s.holes=[rect(0,0,p.cut,p.cut),rect(p.w-p.cut,0,p.cut,p.cut),rect(0,p.w-p.cut,p.cut,p.cut),rect(p.w-p.cut,p.w-p.cut,p.cut,p.cut)];
  hd(s,0,p.w,p.w,amount(p.w,p),1);hd(s,0,p.cut,0,amount(p.cut,p));break;
 case 'wall-openings':
  s.rects=[rect(0,0,p.w,p.h)];s.holes=[rect(p.windowX,p.windowY,p.windowW,p.windowH),rect(p.doorX,p.h-p.doorH,p.doorW,p.doorH)];
  hd(s,0,p.w,0,amount(p.w,p));vd(s,0,0,p.h,amount(p.h,p));
  s.notes.push('Терезе: '+p.windowW+' × '+p.windowH+' м; есік: '+p.doorW+' × '+p.doorH+' м');break;
 case 'cross-paths':
  s.rects=[rect(0,0,p.w,p.h)];s.holes=[rect((p.w-p.path)/2,0,p.path,p.h),rect(0,(p.h-p.path)/2,p.w,p.path)];
  hd(s,0,p.w,0,amount(p.w,p));vd(s,0,0,p.h,amount(p.h,p));s.notes.push('Екі жолдың әрқайсысының ені '+p.path+' м');break;
 case 'notch-paint':
  s.rects=[rect(0,0,p.w,p.h)];s.holes=[rect((p.w-p.cw)/2,0,p.cw,p.ch)];
  hd(s,0,p.w,p.h,amount(p.w,p),1);vd(s,0,0,p.h,amount(p.h,p));
  hd(s,(p.w-p.cw)/2,(p.w+p.cw)/2,0,amount(p.cw,p));vd(s,(p.w+p.cw)/2,0,p.ch,amount(p.ch,p),1);break;
 case 'rectangle-triangle':
  s.rects=[rect(0,0,p.w,p.h)];s.polygons=[[[p.w,0],[p.w,p.h],[p.w+p.leg,p.h]]];
  hd(s,0,p.w,0,amount(p.w,p));vd(s,0,0,p.h,amount(p.h,p));
  hd(s,p.w,p.w+p.leg,p.h,amount(p.leg,p),1);break;
 case 'overlap-union':
  s.rects=[rect(0,0,p.aw,p.ah,'I'),rect(p.aw-p.ow,p.ah-p.bh,p.bw,p.bh,'II')];
  hd(s,0,p.aw,0,amount(p.aw,p));vd(s,0,0,p.ah,amount(p.ah,p));
  hd(s,p.aw-p.ow,p.aw-p.ow+p.bw,p.ah,amount(p.bw,p),1);vd(s,p.aw-p.ow+p.bw,p.ah-p.bh,p.ah,amount(p.bh,p),1);
  s.notes.push('Ортақ бөлік: '+p.ow+' × '+p.bh+' см');break;
 case 'outer-border':
  s.rects=[rect(0,0,p.w+2*p.border,p.h+2*p.border)];s.holes=[rect(p.border,p.border,p.w,p.h)];
  hd(s,p.border,p.border+p.w,p.border,amount(p.w,p),1);vd(s,p.border,p.border,p.border+p.h,amount(p.h,p));
  hd(s,p.border+p.w,p.w+2*p.border,(p.h+2*p.border)/2,amount(p.border,p),1);break;
 case 'longitudinal-strip':
  s.rects=[rect(0,0,p.w,p.h)];s.holes=[rect(0,(p.h-p.path)/2,p.w,p.path)];
  hd(s,0,p.w,0,amount(p.w,p));vd(s,0,0,p.h,amount(p.h,p));s.notes.push('Жолдың ені '+p.path+' м');break;
 default:throw new Error('Unknown native composite scene '+k);
 }
 const all=[...s.rects,...s.holes,...s.auxRects],xs=all.flatMap(r=>[r.x,r.x+r.w]),ys=all.flatMap(r=>[r.y,r.y+r.h]);
 for(const poly of s.polygons)for(const [x,y]of poly){xs.push(x);ys.push(y);}
 s.width=Math.max(...xs);s.height=Math.max(...ys);return s;
}

export function occupiedCells(q){
 const s=sceneFor(q);
 for(const r of [...s.rects,...s.holes]){
  integer(r.x,'grid-aligned x',0,100);integer(r.y,'grid-aligned y',0,100);
  integer(r.w,'positive width',1,100);integer(r.h,'positive height',1,100);
 }
 assert.ok(s.width<=100&&s.height<=100);
 const occupied=new Set();
 for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){
  const inside=r=>x+.5>r.x&&x+.5<r.x+r.w&&y+.5>r.y&&y+.5<r.y+r.h;
  if(s.rects.some(inside)&&!s.holes.some(inside))occupied.add(x+','+y);
 }
 return occupied;
}
const polygonArea=points=>Math.abs(points.reduce((sum,[x,y],i)=>{const next=points[(i+1)%points.length];return sum+x*next[1]-y*next[0];},0))/2;
const boundaryEdges=cells=>{
 const out=[];for(const cell of cells){const [x,y]=cell.split(',').map(Number);
  if(!cells.has(x+','+(y-1)))out.push([[x,y],[x+1,y]]);
  if(!cells.has((x+1)+','+y))out.push([[x+1,y],[x+1,y+1]]);
  if(!cells.has(x+','+(y+1)))out.push([[x+1,y+1],[x,y+1]]);
  if(!cells.has((x-1)+','+y))out.push([[x,y+1],[x,y]]);
 }return out;
};
function validate(q){
 const p=q.params,k=kind(q);
 assert.ok(['см','м'].includes(unit(p)),'Explicit length units');
 for(const [name,v]of Object.entries(p))if(typeof v==='number')integer(v,name,name.endsWith('X')||name.endsWith('Y')?0:1);
 if(cornerKinds.has(k)||k==='notch-paint'){assert.ok(p.cw<p.w&&p.ch<p.h);if(k==='square-cut')assert.ok(p.w===p.h&&p.cw===p.ch);}
 if(p.cells){assert.ok(p.cells.length>=3&&p.cells.length<=36);assert.equal(new Set(p.cells.map(c=>c.join(','))).size,p.cells.length);integer(p.side,'cell side');}
 if(k==='grid-area'||k==='stair-perimeter'){
  assert.ok(Array.isArray(p.rows)&&p.rows.length>=2);p.rows.forEach(v=>integer(v,'row width',1,10));
  const display=k==='stair-perimeter'?[...p.rows].reverse():p.rows;
  const expected=display.flatMap((length,y)=>Array.from({length},(_,x)=>[x,y].join(','))).sort();
  assert.deepEqual(p.cells.map(c=>c.join(',')).sort(),expected,'Exact cells must match the stated rows');
  if(k==='stair-perimeter')assert.deepEqual(p.rows,Array.from({length:p.rows.length},(_,i)=>p.rows.length-i),'One complete descending square staircase');
 }
 if(k==='l-grid-perimeter'){
  const n=p.cells.length,expected=[...Array.from({length:n-1},(_,y)=>[0,y].join(',')),[1,n-2].join(',')].sort();
  assert.deepEqual(p.cells.map(c=>c.join(',')).sort(),expected,'Exact connected L topology');
 }
 if(k==='cross-area-perimeter')assert.deepEqual(p.cells.map(c=>c.join(',')).sort(),['1,0','0,1','1,1','2,1','1,2'].sort(),'Exactly the central square and its four neighbours');
 if(k==='two-rectangles')assert.ok(p.bh<p.ah);
 if(k==='three-pillars')assert.ok(p.bridgeH<p.pillarH);
 if(k==='t-shape')assert.ok(p.stemW<p.barW&&(p.barW-p.stemW)%2===0);
 if(k==='four-corners')assert.ok(2*p.cut<p.w);
 if(k==='cross-paths')assert.ok(p.path<p.w&&p.path<p.h&&(p.w-p.path)%2===0&&(p.h-p.path)%2===0);
 if(k==='longitudinal-strip')assert.ok(p.path<p.h&&(p.h-p.path)%2===0);
 if(k==='notch-paint')assert.equal((p.w-p.cw)%2,0);
 if(k==='inner-garden')assert.ok(p.holeX>0&&p.holeY>0&&p.holeX+p.cw<p.w&&p.holeY+p.ch<p.h);
 if(k==='wall-openings'){
  assert.ok(p.windowX>0&&p.windowY>0&&p.windowX+p.windowW<p.w&&p.windowY+p.windowH<p.h);
  assert.ok(p.doorX>p.windowX+p.windowW&&p.doorX+p.doorW<p.w&&p.doorH<p.h);
 }
 if(k==='overlap-union')assert.ok(p.ow>0&&p.ow<p.aw&&p.ow<p.bw&&p.bh<p.ah);
 if(k==='rectangle-triangle')assert.ok(p.w>p.h,'The full common side is the stated short rectangle side');
 if(['notch-paint','floor-cost','tile-boxes','outer-border','longitudinal-strip','cross-paths','wall-openings'].includes(k)&&p.context!=='frame')assert.equal(p.unit,'м');
 if(k==='outer-border')assert.ok(['pool','frame'].includes(p.context));
 return p;
}
const simpleExpr=s=>{
 assert.match(s,/^\d+(?: [×+−] \d+)*$/,'Only authored integer arithmetic choices are accepted');
 const terms=s.split(' '),products=[];let sign=1,current=Number(terms[0]);
 for(let i=1;i<terms.length;i+=2){const op=terms[i],v=Number(terms[i+1]);if(op==='×')current*=v;else{products.push(sign*current);sign=op==='−'?-1:1;current=v;}}
 products.push(sign*current);return products.reduce((a,b)=>a+b,0);
};
export function expressionOptions(q){
 const p=q.params;
 if(kind(q)==='choose-expression')return [p.w+' × '+p.h+' − '+p.cw+' × '+p.ch,(p.w-p.cw)+' × '+(p.h-p.ch),p.w+' × '+p.h+' + '+p.cw+' × '+p.ch,p.w+' × '+p.h+' − '+p.cw+' − '+p.ch];
 if(kind(q)==='wrong-expression')return [p.w+' × '+(p.h-p.ch)+' + '+(p.w-p.cw)+' × '+p.ch,p.w+' × '+p.h+' − '+p.cw+' × '+p.ch,(p.w-p.cw)+' × '+p.h+' + '+p.cw+' × '+(p.h-p.ch),p.w+' × '+p.h+' − '+p.cw+' × '+(p.h-p.ch)];
 return null;
}

export function independentlyCalculate(q){
 const p=validate(q),k=kind(q),s=sceneFor(q),cells=occupiedCells(q),area=cells.size+s.polygons.reduce((a,poly)=>a+polygonArea(poly),0),checks=['Unit squares are enumerated by geometric union and subtraction, rather than using the written solution formula'];
 let answer;
 switch(k){
 case 'choose-expression':
 case 'wrong-expression':{
  const choices=expressionOptions(q),matches=choices.filter(v=>k==='choose-expression'?simpleExpr(v)===area:simpleExpr(v)!==area);
  assert.equal(matches.length,1,'The requested correct/incorrect expression must be unique');answer=matches[0];checks.push('Every expression is independently evaluated with multiplication precedence');break;
 }
 case 'corner-perimeter':
 case 'l-grid-perimeter':
 case 'stair-perimeter':
  answer=String(boundaryEdges(cells).length*(p.side||1));checks.push('Every exposed edge is counted once; shared interior edges are excluded');break;
 case 'cross-area-perimeter':
  answer=(area*p.side*p.side)+' см² және '+boundaryEdges(cells).length*p.side+' см';checks.push('Area is square-scaled but each boundary edge is only length-scaled');break;
 case 'grid-area':answer=String(area*p.side*p.side);break;
 case 'notch-paint':
 case 'floor-cost':
  answer=String(Array.from(cells).reduce(sum=>sum+p.rate,0));checks.push('A separate rate is accumulated for every remaining square metre');break;
 case 'inverse-width':{
  const candidates=[];for(let h=p.ch+1;h<=100;h++){const t={...q,params:{...p,h}};if(occupiedCells(t).size===p.remaining)candidates.push(h);}
  assert.equal(candidates.length,1,'A unique original width must satisfy the remaining-area condition');assert.equal(candidates[0],p.h,'The diagram must correspond to the inferred, unlabelled width');
  answer=String(candidates[0]);checks.push('Every candidate width is tested by actual remaining unit-square count');break;
 }
 case 'tile-boxes':{
  assert.equal(100%p.tileCm,0,'The authored tile fits each whole-metre boundary exactly');
  const n=100/p.tileCm,total=cells.size*n*n;let boxes=0,capacity=0;while(capacity<total){boxes++;capacity+=p.pack;}
  assert.ok(capacity>=total&&(boxes-1)*p.pack<total);answer=String(boxes);
  checks.push('Square-centimetre conversion produces an exact tile grid; whole packs are added until capacity suffices');break;
 }
 default:answer=String(area);
 }
 if(s.polygons.length)checks.push('Each triangular part is independently checked with the polygon shoelace formula; it meets rectangles only on a boundary');
 return {answer,checks};
}

const cutText=p=>p.w+' '+unit(p)+' × '+p.h+' '+unit(p)+' тіктөртбұрыштың жоғарғы оң бұрышынан '+p.cw+' '+unit(p)+' × '+p.ch+' '+unit(p)+' бөлік алынып тасталған';
export function statementFor(q){
 const p=q.params,k=kind(q),u=unit(p);
 switch(k){
 case 'square-cut':return 'Шебер қабырғасы '+p.w+' см шаршы жапсырманың бір бұрышынан қабырғасы '+p.cw+' см шағын шаршы кесті. Көк түспен көрсетілген жапсырманың ауданы неше см²?';
 case 'corner-area':return 'Макет үшін '+cutText(p)+'. Сызбадағы қалған көк бөліктің ауданын '+u+'² есебімен табыңдар.';
 case 'two-rectangles':return 'Көрме белгісі екі қабаттаспайтын тіктөртбұрыштан құралды. I бөліктің өлшемдері '+p.aw+' × '+p.ah+' см, II бөліктікі '+p.bw+' × '+p.bh+' см. Екі бөлік бірге неше см² орын алады?';
 case 'diagonal-half':return 'Қабырғалары '+p.w+' см және '+p.h+' см тіктөртбұрыш диагональмен екі бірдей бөлікке бөлінді. Көк үшбұрыштың ауданы неше см²?';
 case 'three-pillars':return 'Сөренің П тәрізді алдыңғы панелі қабаттаспайтын үш бөлшектен тұрады: екі тік бөлшектің әрқайсысы '+p.pillarW+' × '+p.pillarH+' см, олардың арасындағы жоғарғы бөлшек '+p.gap+' × '+p.bridgeH+' см. Панельдің ауданын см² есебімен табыңдар.';
 case 't-shape':return 'Т пішінді көрсеткіштің көлденең бөлігі '+p.barW+' × '+p.barH+' см. Оның ортасынан төмен қарай '+p.stemW+' × '+p.stemH+' см тік бөлік жалғанған; бөліктер қабаттаспайды. Көрсеткіштің ауданы неше см²?';
 case 'grid-area':return 'Көк өрнек бірдей торкөздерден құралған. Бір торкөздің қабырғасы '+p.side+' см. Өрнектің ауданын см² есебімен табыңдар.';
 case 'inner-garden':return p.w+' × '+p.h+' м демалыс алаңының ішінде '+p.cw+' × '+p.ch+' м ашық түсті тіктөртбұрышты аймақ бөлінген. Қалған көк аймақтың ауданы неше м²?';
 case 'choose-expression':return cutText(p)+'. Қалған көк фигураның ауданын дұрыс есептейтін өрнекті таңдаңдар.';
 case 'wrong-expression':return cutText(p)+'. Көк фигураның ауданын есептеуге ұсынылған төрт өрнектің біреуі ҚАТЕ. Сол өрнекті табыңдар.';
 case 'four-corners':return 'Қабырғасы '+p.w+' м шаршы аула төрт бұрышындағы төрт бірдей шаршы гүлзардан басқа жерде көгалмен жабылған. Әр гүлзардың қабырғасы '+p.cut+' м. Көк көгалдың ауданы неше м²?';
 case 'wall-openings':return 'Шеберхананың '+p.w+' × '+p.h+' м қабырғасында '+p.windowW+' × '+p.windowH+' м терезе және '+p.doorW+' × '+p.doorH+' м есік бар. Олардың орындарына тұсқағаз жапсырылмайды. Қалған қабырғаға неше м² тұсқағаз қажет?';
 case 'corner-perimeter':return cutText(p)+'. Көк фигураның тек сыртқы шекарасын айналдыра таспа жапсырылады. Неше '+u+' таспа керек?';
 case 'cross-paths':return p.w+' × '+p.h+' м алаңның ортасынан бір-біріне перпендикуляр екі жол өтеді. Екеуі де тиісті қарама-қарсы шеттерге дейін созылған, әрқайсысының ені '+p.path+' м. Жолдардан тыс көк бөліктің ауданы неше м²?';
 case 'notch-paint':return p.w+' × '+p.h+' м еденнің жоғарғы ұзын шетінің ортасынан '+p.cw+' м енді, '+p.ch+' м терең ойық алынып тасталды. Қалған еденнің 1 м²-іне '+p.rate+' г жабын жұмсалады. Барлық көк еденге неше грамм жабын қажет?';
 case 'inverse-width':return 'Ұзындығы '+p.w+' см панельдің жоғарғы оң бұрышынан '+p.cw+' × '+p.ch+' см бөлік кесілгеннен кейін көк бөліктің ауданы '+p.remaining+' см² болды. Бастапқы панельдің h енін табыңдар. Сызбадағы белгісіз өлшемді суреттің масштабынан өлшеуге болмайды.';
 case 'floor-cost':return p.w+' × '+p.h+' м бөлменің бір бұрышындағы '+p.cw+' × '+p.ch+' м кіріктірме шкаф астына еден жабыны төселмейді. Қалған 1 м² еденге материал '+p.rate+' теңге тұрады. Материалдың жалпы құны неше теңге?';
 case 'rectangle-triangle':return 'Кітапхана бұрышындағы төсеніш '+p.w+' × '+p.h+' м тіктөртбұрыштан және оған жалғасқан тікбұрышты үшбұрыштан тұрады. Үшбұрыштың '+p.h+' м катеті тіктөртбұрыштың қысқа қабырғасымен толық беттеседі, екінші катеті '+p.leg+' м. Төсеніштің ауданы неше м²?';
 case 'l-grid-perimeter':return 'Бірдей '+p.cells.length+' шаршыдан Г тәрізді белгі құрастырылды: '+(p.cells.length-1)+' шаршы тік бағана түзеді, соңғысы төменгі шаршының оң жағына толық қабырғасымен жалғасады. Әр шаршының қабырғасы '+p.side+' см. Белгінің сыртқы периметрі неше см?';
 case 'overlap-union':return 'Екі мөлдір карточканың өлшемдері '+p.aw+' × '+p.ah+' см және '+p.bw+' × '+p.bh+' см. Олар сызбадағыдай қабаттасқанда ортақ тіктөртбұрыш '+p.ow+' × '+p.bh+' см болды. Карточкалар бірге жауып тұрған аудан неше см²?';
 case 'outer-border':return (p.context==='pool'?'Жаттығу бассейнінің су беті ':'Қабырғаға ілінетін сурет ')+p.w+' × '+p.h+' '+u+'. Оның сыртын айнала барлық жағынан ені '+p.border+' '+u+' бірдей '+(p.context==='pool'?'жолақ төселді':'жақтау қосылды')+'. Көк '+(p.context==='pool'?'жолақтың':'жақтаудың')+' ауданы неше '+u+'²?';
 case 'tile-boxes':return 'Еден жоспарындағы сыртқы тіктөртбұрыш '+p.w+' × '+p.h+' м. Жоғарғы оң бұрышындағы '+p.cw+' × '+p.ch+' м ойыққа плитка төселмейді. Көк еденге қабырғасы '+p.tileCm+' см шаршы плиткалар қиылмай толық төселеді. Бір қорапта '+p.pack+' плитка бар. Материал жетуі үшін ең аз неше бүтін қорап алу керек?';
 case 'cross-area-perimeter':return 'Бір шаршының төрт жағына тағы төрт бірдей шаршы толық қабырғаларымен жалғанған. Әр шаршының қабырғасы '+p.side+' см. Көк айқыш фигураның ауданы мен сыртқы периметрі көрсетілген дұрыс жұпты таңдаңдар.';
 case 'stair-perimeter':return 'Баспалдақ өрнектің төменнен жоғары қатарларында '+p.rows.join(', ')+' бірдей шаршы бар; қатарлардың сол жақ шеттері тураланған. Шаршының қабырғасы '+p.side+' см. Көк өрнектің периметрі неше см?';
 case 'longitudinal-strip':return p.w+' × '+p.h+' м тікбұрышты алаңды ұзын бойымен бір шетінен екіншісіне дейін ені '+p.path+' м жол қиып өтеді. Жолдан тыс көк бөліктің ауданы неше м²?';
 default:throw new Error('No composite condition '+k);
 }
}

export function solutionFor(q){
 const p=q.params,k=kind(q),cut=p.cw*p.ch,a=p.w*p.h-cut;
 switch(k){
 case 'square-cut':case 'corner-area':return 'Толық аудан '+p.w+' × '+p.h+' = '+p.w*p.h+' '+areaLabel(p)+'. Кесілген бөлік '+p.cw+' × '+p.ch+' = '+cut+' '+areaLabel(p)+'. Қалғаны: '+p.w*p.h+' − '+cut+' = '+a+' '+areaLabel(p)+'.';
 case 'two-rectangles':return 'Қабаттасу жоқ: аудандар қосылады. '+p.aw+' × '+p.ah+' + '+p.bw+' × '+p.bh+' = '+p.aw*p.ah+' + '+p.bw*p.bh+' = '+(p.aw*p.ah+p.bw*p.bh)+' см².';
 case 'diagonal-half':return 'Диагональ тіктөртбұрышты тең екіге бөледі. '+p.w+' × '+p.h+' : 2 = '+p.w*p.h+' : 2 = '+p.w*p.h/2+' см².';
 case 'three-pillars':return 'Екі тік бөліктің ауданы '+p.pillarW+' × '+p.pillarH+' × 2 = '+2*p.pillarW*p.pillarH+' см². Аралық бөліктің ауданы '+p.gap+' × '+p.bridgeH+' = '+p.gap*p.bridgeH+' см². Қосындысы '+(2*p.pillarW*p.pillarH+p.gap*p.bridgeH)+' см².';
 case 't-shape':return 'Екі бөлік ортақ аудансыз жалғасқан. '+p.barW+' × '+p.barH+' + '+p.stemW+' × '+p.stemH+' = '+p.barW*p.barH+' + '+p.stemW*p.stemH+' = '+(p.barW*p.barH+p.stemW*p.stemH)+' см².';
 case 'grid-area':return 'Қатарлардағы торкөздер саны '+p.rows.join(' + ')+' = '+p.cells.length+'. Бір торкөз '+p.side+' × '+p.side+' = '+p.side*p.side+' см². Жалпы аудан '+p.cells.length+' × '+p.side*p.side+' = '+p.cells.length*p.side*p.side+' см².';
 case 'inner-garden':return 'Үлкен ауданнан ішкі ақ бөлікті азайтамыз: '+p.w+' × '+p.h+' − '+p.cw+' × '+p.ch+' = '+p.w*p.h+' − '+cut+' = '+a+' м².';
 case 'choose-expression':return 'Алынған бөлік ауданға кірмейді, сондықтан толық ауданнан оның ауданын азайтамыз: '+expressionOptions(q)[0]+' = '+a+' '+areaLabel(p)+'. Тек өлшемдерді азайту немесе аудандарды қосу бұл фигураны бермейді.';
 case 'wrong-expression':return 'Көк аудан '+a+' '+areaLabel(p)+'. Өрнектердің мәндері ретімен: '+expressionOptions(q).map(simpleExpr).join(', ')+'. Соңғы өрнек қиылған бөліктің '+p.ch+' '+unit(p)+' биіктігінің орнына '+(p.h-p.ch)+' '+unit(p)+' алады, сондықтан ол қате.';
 case 'four-corners':return 'Бір гүлзар '+p.cut+' × '+p.cut+' = '+p.cut*p.cut+' м². Төрт гүлзар '+4*p.cut*p.cut+' м². Көгал: '+p.w+' × '+p.w+' − '+4*p.cut*p.cut+' = '+(p.w*p.w-4*p.cut*p.cut)+' м².';
 case 'wall-openings':return 'Қабырға '+p.w*p.h+' м², терезе '+p.windowW*p.windowH+' м², есік '+p.doorW*p.doorH+' м². Тұсқағаз: '+p.w*p.h+' − '+p.windowW*p.windowH+' − '+p.doorW*p.doorH+' = '+(p.w*p.h-p.windowW*p.windowH-p.doorW*p.doorH)+' м².';
 case 'corner-perimeter':return 'Кесілген бұрыштағы '+p.cw+' '+unit(p)+' және '+p.ch+' '+unit(p)+' шеттердің орнына дәл сондай екі шет қосылды. Сондықтан периметр өзгермейді: 2 × ('+p.w+' + '+p.h+') = '+2*(p.w+p.h)+' '+unit(p)+'.';
 case 'cross-paths':return 'Жолдардың ортақ '+p.path+' × '+p.path+' бөлігі екі рет алынбауы керек. Қалған аудан '+p.w+' × '+p.h+' − '+p.w+' × '+p.path+' − '+p.h+' × '+p.path+' + '+p.path+' × '+p.path+' = '+(p.w-p.path)*(p.h-p.path)+' м². Бұл ('+p.w+' − '+p.path+') × ('+p.h+' − '+p.path+') өрнегімен де тексеріледі.';
 case 'notch-paint':return 'Еден '+p.w+' × '+p.h+' − '+p.cw+' × '+p.ch+' = '+a+' м². Жабын массасы '+a+' × '+p.rate+' = '+a*p.rate+' г.';
 case 'inverse-width':return 'Кесілген бөлікті қайта қосқанда толық аудан '+p.remaining+' + '+p.cw+' × '+p.ch+' = '+(p.remaining+cut)+' см². h = '+(p.remaining+cut)+' : '+p.w+' = '+(p.remaining+cut)/p.w+' см. Тексеру: '+p.w+' × '+p.h+' − '+cut+' = '+p.remaining+' см².';
 case 'floor-cost':return 'Материал төселетін аудан '+p.w+' × '+p.h+' − '+p.cw+' × '+p.ch+' = '+a+' м². Құны '+a+' × '+p.rate+' = '+a*p.rate+' теңге.';
 case 'rectangle-triangle':return 'Тіктөртбұрыш '+p.w+' × '+p.h+' = '+p.w*p.h+' м². Үшбұрыш '+p.h+' × '+p.leg+' : 2 = '+p.h*p.leg/2+' м². Жалпы '+(p.w*p.h+p.h*p.leg/2)+' м².';
 case 'l-grid-perimeter':{
  const n=p.cells.length,shared=n-1,edges=4*n-2*shared;return 'Шаршылардың жеке қабырғалары '+n+' × 4 = '+4*n+'. '+shared+' ортақ қабырғаның әрқайсысы екі рет ішке кетеді. Сыртқы '+4*n+' − '+2*shared+' = '+edges+' қабырға қалады. Периметр '+edges+' × '+p.side+' = '+edges*p.side+' см.';
 }
 case 'overlap-union':return 'Бөлек аудандар '+p.aw*p.ah+' және '+p.bw*p.bh+' см². Ортақ '+p.ow*p.bh+' см² екі рет саналды. Біріккен аудан '+p.aw*p.ah+' + '+p.bw*p.bh+' − '+p.ow*p.bh+' = '+(p.aw*p.ah+p.bw*p.bh-p.ow*p.bh)+' см².';
 case 'outer-border':return 'Сыртқы өлшемдер: '+p.w+' + 2 × '+p.border+' = '+(p.w+2*p.border)+' '+unit(p)+' және '+p.h+' + 2 × '+p.border+' = '+(p.h+2*p.border)+' '+unit(p)+'. Жолақ ауданы '+(p.w+2*p.border)+' × '+(p.h+2*p.border)+' − '+p.w+' × '+p.h+' = '+((p.w+2*p.border)*(p.h+2*p.border)-p.w*p.h)+' '+areaLabel(p)+'.';
 case 'tile-boxes':{
  const per=100/p.tileCm,tiles=a*per*per,boxes=Math.ceil(tiles/p.pack);
  return 'Еденнің ауданы '+p.w+' × '+p.h+' − '+p.cw+' × '+p.ch+' = '+a+' м². 1 м қабырғаға '+per+' плитка, 1 м²-ге '+per+' × '+per+' = '+per*per+' плитка керек. Барлығы '+a+' × '+per*per+' = '+tiles+' плитка. '+(boxes-1)+' қорапта '+(boxes-1)*p.pack+' ғана, '+boxes+' қорапта '+boxes*p.pack+' плитка бар. Ең азы '+boxes+' қорап.';
 }
 case 'cross-area-perimeter':return 'Аудан 5 × '+p.side+' × '+p.side+' = '+5*p.side*p.side+' см². Ортаңғы шаршының шеттері іште, төрт сыртқы шаршының әрқайсысының 3 шеті ашық: 4 × 3 × '+p.side+' = '+12*p.side+' см.';
 case 'stair-perimeter':return 'Төменгі қабырға мен сол жақ қабырға бірге '+2*p.rows.length*p.side+' см. Сатылардың барлық көлденең бөліктері '+p.rows.length*p.side+' см, тік бөліктері де '+p.rows.length*p.side+' см. Периметр '+4*p.rows.length*p.side+' см.';
 case 'longitudinal-strip':return 'Жолдың еніне тең бөлікті алып тастағанда тиімді ен '+p.h+' − '+p.path+' = '+(p.h-p.path)+' м. Көк аудан '+p.w+' × '+(p.h-p.path)+' = '+p.w*(p.h-p.path)+' м².';
 default:throw new Error('No composite solution '+k);
 }
}

export function svgFor(q){
 validate(q);const p=q.params,s=sceneFor(q),cells=occupiedCells(q),scale=Math.min(265/s.width,205/s.height),ox=240-s.width*scale/2,oy=155-s.height*scale/2;
 const pt=([x,y])=>[ox+x*scale,oy+y*scale],n=v=>Number(v.toFixed(3));
 const text=(x,y,value,size=23,color='#20374f')=>'<text x="'+n(x)+'" y="'+n(y)+'" font-family="Arial,sans-serif" font-size="'+size+'" text-anchor="middle" dominant-baseline="middle" fill="'+color+'" stroke="white" stroke-width="4" paint-order="stroke" stroke-linejoin="round">'+esc(value)+'</text>';
 const box=(r,attrs)=>{const [x,y]=pt([r.x,r.y]);return '<rect x="'+n(x)+'" y="'+n(y)+'" width="'+n(r.w*scale)+'" height="'+n(r.h*scale)+'" '+attrs+'/>';};
 const colors=['#a8bfff','#c3d7ff','#b7c1f4'];
 let art=s.auxRects.map(r=>box(r,'fill="white" stroke="#899ab6" stroke-width="1.5" stroke-dasharray="6 5"')).join('');
 art+=s.rects.map((r,i)=>box(r,'fill="'+colors[s.grid?0:i%3]+'" fill-opacity="'+(kind(q)==='overlap-union'?'.72':'1')+'" '+(s.grid?'stroke="white" stroke-width="1"':''))).join('');
 art+=s.holes.map(r=>box(r,'fill="#fff7e9" stroke="#d49648" stroke-width="1.5" stroke-dasharray="5 4"')).join('');
 art+=s.polygons.map(poly=>'<polygon points="'+poly.map(v=>pt(v).map(n).join(',')).join(' ')+'" fill="#a8bfff" stroke="#496fa7" stroke-width="2.3"/>').join('');
 art+='<path d="'+boundaryEdges(cells).map(([a,b])=>{const u=pt(a),v=pt(b);return 'M'+n(u[0])+','+n(u[1])+'L'+n(v[0])+','+n(v[1]);}).join(' ')+'" fill="none" stroke="#496fa7" stroke-width="2.3" stroke-linecap="square"/>';
 // Visible internal seams distinguish the non-overlapping supplied parts.
 if(['two-rectangles','three-pillars','t-shape','overlap-union'].includes(kind(q)))art+=s.rects.map(r=>box(r,'fill="none" stroke="#587cba" stroke-width="1.4" stroke-dasharray="5 4"')).join('');
 const dimension=s.dimensions.map(d=>{
  const a=pt(d.a),b=pt(d.b),horizontal=d.a[1]===d.b[1],off=d.side*24;
  const x1=a[0]+(horizontal?0:off),y1=a[1]+(horizontal?off:0),x2=b[0]+(horizontal?0:off),y2=b[1]+(horizontal?off:0);
  const t=horizontal?[[(x1+x2)/2,(y1+y2)/2-13]]:[[(x1+x2)/2+d.side*25,(y1+y2)/2]];
  const line='<path d="M'+n(x1)+','+n(y1)+'L'+n(x2)+','+n(y2)+' '+(horizontal?'M'+n(x1)+','+n(y1-4)+'v8 M'+n(x2)+','+n(y2-4)+'v8':'M'+n(x1-4)+','+n(y1)+'h8 M'+n(x2-4)+','+n(y2)+'h8')+'" fill="none" stroke="#667d98" stroke-width="1.2"/>';
  return line+text(t[0][0],t[0][1],d.text);
 }).join('');
 art+=s.labels.map(l=>{const [x,y]=pt([l.x,l.y]);return text(x,y,l.text,20);}).join('');
 art+=s.rects.filter(r=>r.label).map(r=>{const [x,y]=pt([r.x+r.w/2,r.y+r.h/2]);return text(x,y,r.label,20);}).join('');
 const notes=[...s.notes,...(kind(q)==='inverse-width'?['h өлшемі масштабтан өлшенбейді']:[])];
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-labelledby="title desc"><title id="title">'+esc(q.figureTitle)+'</title><desc id="desc">'+esc(q.figureDescription)+'</desc><rect width="480" height="360" fill="white"/>'+art+dimension+notes.map((t,i)=>text(240,313+i*22,t,16,'#476381')).join('')+text(240,350,'Көк бөлік есепке алынады',16,'#4164a7')+'</svg>\n';
}
export function verifyEdition(q){
 const result=independentlyCalculate(q);
 assert.equal(q.answer,result.answer,'Independent composite mathematical answer');
 assert.equal(q.statement,statementFor(q),'Condition bound to authored dimensions');
 assert.equal(q.solution,solutionFor(q),'Worked solution bound to authored dimensions');
 assert.equal(q.image,'/figures/synaq-editions/'+q.editionId+'.svg');
 assert.equal(q.figureSha256,sha(svgFor(q)),'Native figure hash bound to exact dimensions and topology');
 if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(x=>x===q.answer).length,1);}
 if(expressionOptions(q))assert.deepEqual(q.options,expressionOptions(q));
 return {...result,checks:[...result.checks,'Condition, units, native regions, answer and SVG hash are bound to the same source-specific edition']};
}
