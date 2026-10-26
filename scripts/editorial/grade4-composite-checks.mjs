/** Author checks. External source/content/math review is still required before delivery. */
import fs from 'node:fs';import assert from 'node:assert/strict';
import{renderEdition,verifyEdition,factorPairs,cellPerimeter}from'./grade4-composite-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-composite-wave29.json',import.meta.url))).editions;
const keys=['Шаршының ауданы үлкен','49 см²','40 см²','52','17 см²','8 см','42 см','176','9','352','200','9 см','108','98','9 см және 6 см','160 см²','32 см','56 см²','38 см','240','7','40 см','16 см²'];
const get=(re,s)=>{const m=re.exec(s);assert(m,[re,s]);return m.slice(1).map(Number);},num=s=>Number(s.match(/^\d+/)[0]);
const match=(r,n,u='')=>{assert.equal(r.answer,String(n)+(u?' '+u:''));if(r.options)assert.equal(r.options.filter(o=>o===r.answer).length,1);};
let printedGivenDomains=0,fullIntegerCases=0,cutGridCells=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement,k=r.modelId.replace('grade4-composite-','');verifyEdition(r);assert.equal(r.answer,keys[i]);
 switch(k){
 case'same-perimeter-area-compare':{const[a,b,c]=get(/ұзындығы (\d+) см, ені (\d+) см[\s\S]*?қабырғасы (\d+) см/,s);assert.equal(2*(a+b),4*c);assert(c*c>a*b);assert.equal(r.answer,'Шаршының ауданы үлкен');break;}
 case'square-area-from-perimeter':{const[p]=get(/бірге (\d+) см/,s);match(r,(p/4)**2,'см²');break;}
 case'rectangle-area-units':{const[a,b]=get(/ұзындығы (\d+) см, ені (\d+) см/,s);match(r,a*b,'см²');assert(r.options.includes(`${a*b} см`));break;}
 case'two-disjoint-rectangles':{const[a,b,c,d]=get(/Біріншісі (\d+) м × (\d+) м, екіншісі (\d+) м × (\d+) м/,s);match(r,a*b+c*d);assert(s.includes('қабаттаспайды'));break;}
 case'unit-square-area':{const[a,n]=get(/қабырғасы (\d+) см болатын (\d+) шаршыдан/,s);assert.equal(a,1);match(r,n*a*a,'см²');assert(r.options.includes(`${n} см`));break;}
 case'square-equal-rectangle-area':{const[a,b]=get(/Өлшемдері (\d+) см × (\d+) см/,s),good=[];for(let n=1;n<=a*b;n++){fullIntegerCases++;if(n*n===a*b)good.push(n);}assert.deepEqual(good,[num(r.answer)]);break;}
 case'row-squares-perimeter':{const[e,n]=get(/Қабырғасы (\d+) см болатын (\d+) бірдей/,s),cells=Array.from({length:n},(_,x)=>[x,0]);match(r,cellPerimeter(cells)*e,'см');assert(r.options.includes(`${4*n*e} см`));break;}
 case'grid-cells-area-mm':{const[e,n]=get(/қабырғасы (\d+) мм[\s\S]*?дәл (\d+) толық/,s);match(r,n*e*e);assert(e>1);break;}
 case'unknown-disjoint-side':{const[total,a,b,w]=get(/ауданы (\d+) см²[\s\S]*?өлшемдері (\d+) см × (\d+) см[\s\S]*?ені (\d+) см/,s);match(r,(total-a*b)/w);break;}
 case'l-floor-tiles':{const[a,b,c,d,e]=get(/едені (\d+) м × (\d+) м[\s\S]*?бұрышынан (\d+) м × (\d+) м[\s\S]*?қабырғасы (\d+) см/,s),cells=[];for(let x=0;x<a*100/e;x++)for(let y=0;y<b*100/e;y++){cutGridCells++;if(!(x<c*100/e&&y<d*100/e))cells.push([x,y]);}match(r,cells.length);assert.equal(cells.length,(a*b-c*d)*10000/(e*e));assert(r.options.includes(String(a*b*10000/(e*e))));break;}
 case'rectangle-floor-tiles':{const[a,b,e]=get(/ұзындығы (\d+) м, ені (\d+) м[\s\S]*?Қабырғасы (\d+) см/,s);assert.equal(a*100%e,0);assert.equal(b*100%e,0);match(r,(a*100/e)*(b*100/e));break;}
 case'restored-square-edge':{const[e,remaining]=get(/қабырғасы (\d+) см[\s\S]*?ауданы (\d+) см²/,s),good=[];for(let n=e+1;n<=remaining+e*e;n++){fullIntegerCases++;if(n*n-e*e===remaining)good.push(n);}assert.deepEqual(good,[num(r.answer)]);break;}
 case'square-split-other-area':{const[e,p]=get(/Қабырғасы (\d+) см[\s\S]*?периметрі (\d+) см/,s),possible=[];for(let x=1;x<e;x++){fullIntegerCases++;if(2*(e+x)===p)possible.push(e*(e-x));}assert.deepEqual(possible,[+r.answer]);break;}
 case'largest-perimeter-fixed-area':{const[area]=get(/Ауданы (\d+) см²/,s),all=[];for(let a=1;a<=area;a++)for(let b=1;b<=area;b++){fullIntegerCases++;if(a*b===area)all.push(2*(a+b));}match(r,Math.max(...all));break;}
 case'two-rectangle-constraints':{const[p,a]=get(/периметрі (\d+) см, ауданы (\d+) см²/,s),valid=r.options.filter(o=>{const[x,y]=get(/^(\d+) см және (\d+) см$/,o);return 2*(x+y)===p&&x*y===a;});assert.deepEqual(valid,[r.answer]);break;}
 case'split-perimeters-area':{const[p,q]=get(/периметрі (\d+) см[\s\S]*?бірге (\d+) см/,s),good=[];for(let a=1;a<=p;a++)for(let b=1;b<a;b++)for(let cut=1;cut<b;cut++){fullIntegerCases++;if(2*(a+b)===p&&2*(a+cut)+2*(a+b-cut)===q)good.push(a*b);}assert.deepEqual([...new Set(good)],[num(r.answer)]);break;}
 case'connected-squares-max-perimeter':{const[e,n]=get(/Қабырғасы (\d+) см болатын (\d+) бірдей/,s);assert.equal(n,7);assert.equal(e,2);match(r,(2*n+2)*e,'см');assert(s.includes('тор бағыттарымен')&&s.includes('бір тұтас'));break;}
 case'diagonal-half-area':{const[a,b]=get(/Ұзындығы (\d+) см, ені (\d+) см/,s);match(r,a*b/2,'см²');assert(s.includes('бір диагоналі'));break;}
 case'rectangle-perimeter-units':{const[a,b]=get(/Қабырғалары (\d+) см және (\d+) см/,s);match(r,2*(a+b),'см');assert(r.options.includes(`${a*b} см²`)&&r.options.includes(`${a*b} см`));break;}
 case'restored-rectangle-width':{const[l,a,b,remaining]=get(/Ұзындығы (\d+) см[\s\S]*?бұрышынан (\d+) см × (\d+) см[\s\S]*?ауданы (\d+) см²/,s);match(r,(remaining+a*b)/l);break;}
 case'corner-cut-perimeter':{const[a,b,c,d]=get(/Өлшемдері (\d+) см × (\d+) см[\s\S]*?бұрышынан (\d+) см × (\d+) см/,s),cells=[];for(let x=0;x<a;x++)for(let y=0;y<b;y++){cutGridCells++;if(!(x<c&&y<d))cells.push([x,y]);}match(r,cellPerimeter(cells),'см');assert.equal(cells.length,a*b-c*d);assert(r.options.includes(`${cells.length} см`));break;}
 case'tiled-rectangle-unit-area':{const[n,m,p]=get(/шаршылар (\d+) қатарға, әр қатарда (\d+) шаршыдан[\s\S]*?периметрі (\d+) см/,s),good=[];for(let e=1;e<=p;e++){fullIntegerCases++;if(2*(n*e+m*e)===p)good.push(e*e);}assert.deepEqual(good,[num(r.answer)]);break;}
 default:assert.fail(k);
 }
 const ref=r.sourceRefs[0],o=JSON.parse(fs.readFileSync(ref.sourceFile)),q=o.questions.find(q=>q.id===ref.sourceId);assert.equal(o.status,'captured');assert(q.checked&&q.solution&&q.sourceAnswer&&!q.images?.length);const clean=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(r.statement),clean(q.statement));if(q.options?.length)assert.equal(q.options.filter(o=>o.correct).length,1);printedGivenDomains++;
}
// All fixed polyominoes through7 squares, not just a selected line/rectangle example.
function normalize(cells){const minX=Math.min(...cells.map(t=>t[0])),minY=Math.min(...cells.map(t=>t[1]));return cells.map(([x,y])=>[x-minX,y-minY]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);}
let shapes=new Map([['0,0',[[0,0]]]]),polyominoes=0;
for(let n=2;n<=7;n++){const next=new Map();for(const cells of shapes.values()){const set=new Set(cells.map(t=>t.join(',')));for(const[x,y]of cells)for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const t=[x+dx,y+dy];if(!set.has(t.join(','))){const normalized=normalize([...cells,t]);next.set(normalized.map(t=>t.join(',')).join(';'),normalized);}}}shapes=next;let max=0;for(const c of shapes.values()){const p=cellPerimeter(c);assert(p<=2*n+2);max=Math.max(max,p);polyominoes++;}assert.equal(max,2*n+2);}
assert.equal(shapes.size,760);assert.equal(Math.max(...[...shapes.values()].map(c=>cellPerimeter(c)))*2,32);
// Full integer rectangle factor domains match all ordered pairs for each area.
for(let area=1;area<=80;area++){const ordered=new Set();for(let a=1;a<=area;a++)for(let b=1;b<=area;b++){fullIntegerCases++;if(a*b===area)ordered.add([Math.min(a,b),Math.max(a,b)].join(','));}assert.deepEqual(new Set(factorPairs(area).map(t=>t.join(','))),ordered);}
let tamperRejected=0,missingParametersRejected=0;
for(const r of rows){for(const key of['statement','answer','solution','options']){if(key==='options'&&!r.options)continue;const bad=structuredClone(r);bad[key]=key==='options'?[...r.options].reverse():r[key]+' changed';assert.throws(()=>verifyEdition(bad));tamperRejected++;}const bad=structuredClone(r);bad.params={};assert.throws(()=>renderEdition(bad));missingParametersRejected++;}
const guards=[['same-perimeter-area-compare',{rectangle:[8,5],squareEdge:7}],['l-floor-tiles',{outer:[6,4],cut:[6,1],tileCm:25,choices:[352,384,16,88]}],['rectangle-floor-tiles',{floor:[5,3],tileCm:40,choices:[20,240,80,120]}],['split-perimeters-area',{perimeter:52,splitTotal:104,choices:[84,160,169,144]}],['tiled-rectangle-unit-area',{rows:3,columns:4,perimeter:55,choices:[12,16,192,64]}]];
for(const[k,params]of guards)assert.throws(()=>renderEdition({skillFamily:k,params}));
console.log(JSON.stringify({fixtures:23,printedGivenDomains,fullIntegerCases,cutGridCells,fixedPolyominoesThrough7:polyominoes,fixedHeptominoes:shapes.size,sourceStatementMatches:0,tamperRejected,missingParametersRejected,pedagogicalGuardsRejected:guards.length,status:'passed'}));
