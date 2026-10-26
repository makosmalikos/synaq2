/** Author checks only. Full external reading and an independent solver are still required. */
import fs from 'node:fs';import assert from 'node:assert/strict';
import {renderEdition,verifyEdition,integerTriples,cornerSurface} from './grade4-cuboids-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-cuboids-wave27.json',import.meta.url))).editions;
const keys=['4','54','Мәдина жасаған қорап','2','Олар бірдей өлшемді тікбұрыштар болады','3','7 см, 4 см, 3 см','7','105','384','6','49 см²','Екінші қорапқа 30 см³ артық','5','160 см³','20','125 см³','56','108','2400','15 см, 3 см, 2 см','Көлемі бұрынғыдай қалады','166','280','24','120 см³','84','Текшенің көлемі 54 см³ артық','52 см²','6','Ауданы өзгермейді','144','432','6 жақ; 12 қыр; 8 төбе','116','96 дм²','72','16 см, 8 см, 4 см','64 см³'];
const get=(re,s)=>{const m=s.match(re);assert(m,[re,s]);return m.slice(1).map(Number);};
const nums=s=>(s.match(/\d+/g)||[]).map(Number),dimNums=s=>get(/(\d+) см, (\d+) см, (\d+) см/,s);
const multiply=a=>a.reduce((x,y)=>x*y,1),add=a=>a.reduce((x,y)=>x+y,0),areas=([a,b,c])=>[a*b,a*c,b*c],surf=t=>2*add(areas(t));
const match=(r,n,unit='')=>assert.equal(r.answer,String(n)+(unit?' '+unit:''));
let printedGivenDomains=0,fullIntegerCases=0,voxelFaceCases=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement,k=r.modelId.replace('grade4-cuboids-','');verifyEdition(r);assert.equal(r.answer,keys[i]);
 switch(k){
 case'equal-length-edges':{
  const [a,b,c]=get(/ұзындығы (\d+) см, ені (\d+) см, биіктігі (\d+) см/,s),[target]=get(/Ұзындығы (\d+) см болатын/,s);let count=0;for(const [u,v]of[[0,1],[0,2],[1,2]])for(const x of[0,1]){const t=[a,b,c];if(t[3-u-v]===target)count+=2;}match(r,count);break;}
 case'largest-face':match(r,Math.max(...areas(dimNums(s))));break;
 case'cube-box-comparison':{const [a]=get(/қыры (\d+) см/,s),b=multiply(dimNums(s));assert(a**3>b&&a<Math.max(...dimNums(s)));assert.equal(r.answer,r.options[0]);break;}
 case'square-faces':{const[a,b,c]=get(/ұзындығы (\d+) см, ені (\d+) см, биіктігі (\d+) см/,s);match(r,2*[[a,b],[a,c],[b,c]].filter(([x,y])=>x===y).length);break;}
 case'opposite-face-claim':assert.equal(r.answer,r.options[1]);assert(r.solution.includes('ортақ қырмен түйіспейді'));break;
 case'vertex-degree':{
  const vertices=Array.from({length:8},(_,i)=>[i&1,(i>>1)&1,(i>>2)&1]),counts=vertices.map(v=>vertices.filter(w=>v.reduce((a,n,i)=>a+(n!==w[i]),0)===1).length);assert.deepEqual(counts,Array(8).fill(3));match(r,counts[0]);break;}
 case'target-volume':{const [target]=get(/дәл (\d+) см³/,s),t=r.options.map(dimNums),vals=t.map(multiply);assert.equal(vals.filter(n=>n===target).length,1);assert.equal(r.answer,r.options[vals.indexOf(target)]);assert(t.some(v=>add(v)===target&&multiply(v)!==target));assert(t.every(v=>v.every(n=>n>1)));break;}
 case'cube-edge-from-wire':{const [wire]=get(/жасауға (\d+) см/,s);assert.equal(wire%12,0);match(r,wire/12);break;}
 case'base-area':{const[a,b]=get(/ұзындығы (\d+) см, ені (\d+) см/,s);match(r,a*b);break;}
 case'cube-surface-open':case'cube-surface-choice':{const[edge]=get(/қыры (\d+) дм/,s);match(r,6*edge**2,k.endsWith('choice')?'дм²':'');assert.notEqual(6*edge**2,edge**3);break;}
 case'face-count':match(r,2*3);break;
 case'cube-single-face':{const[a]=get(/Қыры (\d+) см/,s);match(r,a*a,'см²');break;}
 case'equal-sum-volume-gap':{const values=[...s.matchAll(/(\d+) см, (\d+) см, (\d+) см/g)].map(m=>m.slice(1).map(Number));assert.equal(values.length,2);assert.equal(add(values[0]),add(values[1]));const gap=multiply(values[1])-multiply(values[0]);assert.equal(r.answer,`Екінші қорапқа ${gap} см³ артық`);break;}
 case'height-from-wire':{const [w]=get(/барлығы (\d+) см/,s),[a,b]=get(/ұзындығы (\d+) см, ені (\d+) см/,s);const good=[];for(let c=1;c<w;c++){fullIntegerCases++;if(4*(a+b+c)===w)good.push(c);}assert.deepEqual(good,[+r.answer]);break;}
 case'height-volume-gain':{const[a,b,c]=get(/ұзындығы (\d+) см, ені (\d+) см, бастапқы биіктігі (\d+) см/,s),[d]=get(/биіктігін (\d+) см-ге/,s);match(r,a*b*(c+d)-a*b*c,'см³');assert(r.options.includes(`${a*b*(c+d)} см³`));break;}
 case'wire-remainder':{const [meters,edge]=get(/ұзындығы (\d+) м сымнан қыры (\d+) см/,s);match(r,meters*100-12*edge);break;}
 case'cube-volume-from-surface':{const [surface]=get(/бірге (\d+) см²/,s);const good=[];for(let a=1;a<=surface;a++){fullIntegerCases++;if(6*a*a===surface)good.push(a**3);}assert.deepEqual(good,[parseInt(r.answer)]);break;}
 case'face-area-gap':{const a=areas(dimNums(s));match(r,Math.max(...a)-Math.min(...a));break;}
 case'wire-from-single-face':{const [area]=get(/ауданы (\d+) см²/,s);const good=[];for(let a=1;a<=area;a++){fullIntegerCases++;if(a*a===area)good.push(12*a);}assert.deepEqual(good,[+r.answer]);break;}
 case'mixed-volume-dm':{const [a,b,c]=get(/ұзындығы (\d+) м, ені (\d+) м, биіктігі (\d+) см/,s);match(r,a*100*b*100*c/1000);break;}
 case'largest-wire':{const d=r.options.map(dimNums),w=d.map(t=>4*add(t)),v=d.map(multiply);assert.equal(r.answer,r.options[w.indexOf(Math.max(...w))]);assert.notEqual(w.indexOf(Math.max(...w)),v.indexOf(Math.max(...v)));break;}
 case'reciprocal-volume-scale':{const [f,g]=get(/ұзындығын (\d+) есе[\s\S]*?биіктігін (\d+) есе/,s);assert.equal(f,g);for(let a=1;a<=12;a++)for(let b=1;b<=12;b++)for(let c=1;c<=12;c++){fullIntegerCases++;assert.equal(BigInt(a)*BigInt(b)*BigInt(c*g),BigInt(a*b*c)*BigInt(f));}assert.equal(r.answer,r.options[2]);break;}
 case'box-surface':match(r,surf(dimNums(s)));break;
 case'successive-sides-wire':{const [gap,gap2,w]=get(/биіктігінен (\d+) см[\s\S]*?енінен (\d+) см[\s\S]*?қосындысы (\d+) см/,s);assert.equal(gap,gap2);const good=[];for(let h=1;h<w;h++){fullIntegerCases++;if(4*(3*h+3*gap)===w)good.push(h*(h+gap)*(h+2*gap));}assert.deepEqual(good,[+r.answer]);break;}
 case'largest-integer-cube-tiling':{const d=dimNums(s),max=Math.min(...d),ks=[];for(let k=1;k<=max;k++){fullIntegerCases++;if(d.every(n=>n%k===0))ks.push(k);}const k=ks.at(-1);assert.equal(k,3);match(r,multiply(d)/(k*k*k));break;}
 case'volume-from-increment-layers':{const[a,b,c]=get(/көлемі (\d+) см³-ге[\s\S]*?өсірсе, (\d+) см³[\s\S]*?өсірсе, (\d+) см³/,s);const found=[];for(let x=1;x<=30;x++)for(let y=1;y<=30;y++)for(let z=1;z<=30;z++){fullIntegerCases++;if((x+1)*y*z-x*y*z===a&&x*(y+1)*z-x*y*z===b&&x*y*(z+1)-x*y*z===c)found.push(x*y*z);}assert.deepEqual(found,[parseInt(r.answer)]);break;}
 case'volume-from-face-areas':{const values=get(/аудандары (\d+) см², (\d+) см², (\d+) см²/,s).sort((a,b)=>a-b),found=[];for(let x=1;x<=28;x++)for(let y=x;y<=28;y++)for(let z=y;z<=28;z++){fullIntegerCases++;if(JSON.stringify(areas([x,y,z]).sort((a,b)=>a-b))===JSON.stringify(values))found.push(x*y*z);}assert.deepEqual(found,[+r.answer]);break;}
 case'equal-wire-volume-comparison':{const [w]=get(/қаңқаға (\d+) см/,s),[a,b]=get(/ұзындығы (\d+) см, ені (\d+) см/,s),h=w/4-a-b,gap=(w/12)**3-a*b*h;assert.equal(r.answer,`Текшенің көлемі ${gap} см³ артық`);assert.equal(12*(w/12),4*(a+b+h));break;}
 case'minimum-surface-factor-triples':{const [n]=get(/болатын (\d+) текшенің/,s),found=[];for(let x=1;x<=n;x++)for(let y=1;y<=n;y++)for(let z=1;z<=n;z++){fullIntegerCases++;if(x*y*z===n)found.push(surf([x,y,z]));}match(r,Math.min(...found),'см²');break;}
 case'edge-from-cube-volume-gain':{const [step,gain]=get(/қырын (\d+) см[\s\S]*?көлемі (\d+) см³/,s),good=[];for(let a=1;a<=gain;a++){fullIntegerCases++;if((a+step)**3-a**3===gain)good.push(a);}assert.deepEqual(good,[+r.answer]);break;}
 case'corner-removed-surface':{const[edge,small]=get(/Қыры (\d+) см[\s\S]*?қыры (\d+) см/,s);assert.equal(cornerSurface(edge,small),cornerSurface(edge,small,{removed:true}));assert.equal(r.answer,r.options[1]);break;}
 case'two-painted-faces':{const [edge,small]=get(/Қыры (\d+) см[\s\S]*?қыры (\d+) см/,s),n=edge/small;let count=0;for(let x=0;x<n;x++)for(let y=0;y<n;y++)for(let z=0;z<n;z++){fullIntegerCases++;if(z!==0&&z!==n-1)count++;}match(r,count);break;}
 case'direct-volume':{const[a,b,c]=get(/ұзындығы (\d+) см, ені (\d+) см, биіктігі (\d+) см/,s);match(r,a*b*c);break;}
 case'cube-topology-triple':{const v=Array.from({length:8},(_,n)=>[n&1,(n>>1)&1,(n>>2)&1]);let e=0;for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)if(v[i].reduce((a,n,d)=>a+(n!==v[j][d]),0)===1)e++;const faces=new Set();for(let axis=0;axis<3;axis++)for(const side of[0,1])faces.add(v.map((t,i)=>t[axis]===side?i:null).filter(i=>i!==null).join(','));assert.equal(r.answer,`${faces.size} жақ; ${e} қыр; ${v.length} төбе`);break;}
 case'box-wire-total':match(r,4*add(dimNums(s)));break;
 case'wire-from-surface':{const [area]=get(/ауданы (\d+) см²/,s);const matches=[];for(let a=1;a<=area;a++){fullIntegerCases++;if(6*a*a===area)matches.push(12*a);}assert.deepEqual(matches,[+r.answer]);break;}
 case'equal-cube-volume-choice':{const[edge]=get(/Қыры (\d+) см/,s),ds=r.options.map(dimNums),vols=ds.map(multiply);assert.equal(vols.filter(n=>n===edge**3).length,1);assert.equal(r.answer,r.options[vols.indexOf(edge**3)]);assert(ds.filter((t,i)=>i!==vols.indexOf(edge**3)).every(t=>add(t)===3*edge));break;}
 case'maximum-volume-wire':{const [w]=get(/бірге (\d+) см/,s),found=[];for(let a=1;a<=w/4;a++)for(let b=1;b<=w/4;b++)for(let c=1;c<=w/4;c++){fullIntegerCases++;if(4*(a+b+c)===w)found.push(a*b*c);}match(r,Math.max(...found),'см³');break;}
 default:assert.fail(k);
 }
 const ref=r.sourceRefs[0],capture=JSON.parse(fs.readFileSync(ref.sourceFile)),q=capture.questions.find(q=>q.id===ref.sourceId);assert.equal(capture.status,'captured');assert(q.checked&&q.solution&&q.sourceAnswer&&!q.images?.length);const clean=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(r.statement),clean(q.statement));if(q.options?.length)assert.equal(q.options.filter(o=>o.correct).length,1);printedGivenDomains++;
}
// Enumerate exposed unit faces directly for every original dimension permutation, not through area formulas.
for(const r of rows){const candidates=r.params.dimensions?[r.params.dimensions]:r.params.choices?.every(x=>Array.isArray(x))?r.params.choices:[];for(const [a,b,c]of candidates){let faces=0;for(let x=0;x<a;x++)for(let y=0;y<b;y++)for(let z=0;z<c;z++){if(x===0)faces++;if(x===a-1)faces++;if(y===0)faces++;if(y===b-1)faces++;if(z===0)faces++;if(z===c-1)faces++;voxelFaceCases++;}assert.equal(faces,surf([a,b,c]));}}
// Complete unordered factor domains must equal deduplicated ordered integer domains.
for(let n=1;n<=30;n++)for(const sumFixed of[false,true]){const seen=new Set();for(let x=1;x<=n;x++)for(let y=1;y<=n;y++)for(let z=1;z<=n;z++){fullIntegerCases++;if(sumFixed?x+y+z===n:x*y*z===n)seen.add([x,y,z].sort((a,b)=>a-b).join(','));}assert.deepEqual(new Set(integerTriples(n,{sumFixed}).map(t=>t.join(','))),seen);}
for(let n=2;n<=8;n++)for(let unit=1;unit<=3;unit++){assert.equal(cornerSurface(n*unit,unit),6*n*n*unit*unit);assert.equal(cornerSurface(n*unit,unit,{removed:true}),6*n*n*unit*unit);}
let tamperRejected=0,missingParametersRejected=0;
for(const r of rows){for(const key of['answer','statement','solution','options']){if(key==='options'&&!r.options)continue;const bad=structuredClone(r);bad[key]=key==='options'?[...r.options].reverse():r[key]+' changed';assert.throws(()=>verifyEdition(bad));tamperRejected++;}const bad=structuredClone(r);bad.params={};assert.throws(()=>renderEdition(bad));missingParametersRejected++;}
const bads=[['cube-surface-open',{edge:6,unit:'дм'}],['equal-length-edges',{dimensions:[14,14,5],target:14,choices:[2,4,8,12]}],['reciprocal-volume-scale',{factor:3,example:[12,5,4]}],['largest-wire',{choices:[[10,10,10],[9,9,9],[8,8,8],[7,7,7]]}],['edge-from-cube-volume-gain',{increase:1,volumeGain:128}]];
for(const[k,params]of bads)assert.throws(()=>renderEdition({skillFamily:k,params}));
console.log(JSON.stringify({fixtures:rows.length,printedGivenDomains,fullIntegerCases,voxelFaceCases,sourceStatementMatches:0,tamperRejected,missingParametersRejected,pedagogicalGuardsRejected:bads.length,status:'passed'}));
