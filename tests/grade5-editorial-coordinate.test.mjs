import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {verifyEdition} from '../scripts/editorial/grade5-coordinate-models.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade5-coordinate.json',import.meta.url),'utf8'));
const count=(lo,hi,predicate)=>{let n=0;for(let i=lo;i<=hi;i++)if(predicate(i))n++;return n;};
function oracle(r){const p=r.params,k=r.modelId.replace('grade5-ray-','');let x=0;
 switch(k){
 case'notation':{const good=r.options.filter(text=>{const m=text.match(/нүктесінің координатасы:? (\d+)/);return text.startsWith(p.label+' ' )&&m&&Number(m[1])===p.coordinate;});assert.equal(good.length,1);return good[0];}
 case'missing-definition':return'оң бағыт';
 case'coordinate-from-distance':for(let c=0;c<1000;c++)if(c*p.unit===p.distance)return String(c);throw Error('No coordinate');
 case'move-right':x=p.start;for(let i=0;i<p.step;i++)x++;return String(x);
 case'origin-distance':for(let i=0;i<p.coordinate;i++)x+=p.unit;return String(x);
 case'origin-coordinate':return'0';
 case'unique-point':return'1';
 case'only-interior-point':{const a=[];for(let n=p.left+1;n<p.right;n++)a.push(n);assert.equal(a.length,1);return String(a[0]);}
 case'nearest-natural':return'1';
 case'interior-count':return String(count(1,p.right,n=>n>p.left&&n<p.right));
 case'move-left':x=p.start;for(let i=0;i<p.step;i++)x--;return String(x);
 case'nearest-label':{const a=Object.entries(p.points).filter(([c,n])=>Object.values(p.points).every(v=>Math.abs(n)<=Math.abs(v)));assert.equal(a.length,1);return a[0][0];}
 case'direct-coordinate':return String(p.coordinate);
 case'pair-gap':{const matches=[];for(const choice of r.options){const [left,right]=choice.split(' және ');if(Math.abs(p.points[left]-p.points[right])===p.gap)matches.push(choice);}assert.equal(matches.length,1);return matches[0];}
 case'walking-time':for(let t=0;t<1000;t++)if(p.speed*t===p.coordinate*p.unit)return String(t);throw Error('No time');
 case'opposite-time':for(let t=0;t<1000;t++)if(p.speedA*t===p.coordinate*p.unit-p.speedB*t)return String(t);throw Error('No encounter');
 case'two-moves':x=p.start;for(let i=0;i<p.right;i++)x++;for(let i=0;i<p.left;i++)x--;return String(x);
 case'grid-length':for(let i=p.left;i<p.right;i++)x+=p.cells;return String(x);
 case'midpoint':for(let c=p.left;c<=p.right;c++)if(c-p.left===p.right-c)return String(c);throw Error('No midpoint');
 case'two-coordinates':{let a,b;for(let c=0;c<1000;c++){if(c*p.unit===p.distanceA)a=c;if(c*p.unit===p.distanceB)b=c;}assert.ok(a!==undefined&&b!==undefined);return`A(${a}), B(${b})`;}
 case'possible-points':{const a=[];for(let n=0;n<=p.center+p.radius;n++)if(Math.abs(n-p.center)===p.radius)a.push(n);assert.equal(a.length,2);return a.join(' және ');}
 case'coordinate-from-motion':{let km=0;for(let t=0;t<p.time;t++)km+=p.speed;for(let c=0;c<=km;c++)if(c*p.unit===km)return String(c);throw Error('No coordinate');}
 case'two-point-distance':for(let c=p.left;c<p.right;c++)x+=p.unit;return String(x);
 case'endpoint-from-midpoint':for(let c=p.middle;c<1000;c++)if(p.middle-p.left===c-p.middle)return String(c);throw Error('No endpoint');
 case'double-midpoint':for(let b=p.middle;b<1000;b++)if(p.middle===b-p.middle)return String(b);throw Error('No endpoint');
 case'median-location':{let min=Infinity,best=[];for(let c=1;c<=Math.max(...p.points);c++){const score=p.points.reduce((n,x)=>n+Math.abs(x-c),0);if(score<min){best=[c];min=score;}else if(score===min)best.push(c);}assert.equal(best.length,1);return String(best[0]);}
 case'catch-coordinate':for(let t=0;t<1000;t++)if(p.fast*t===p.ahead*p.unit+p.slow*t)return String(p.fast*t/p.unit);throw Error('No catch');
 case'partition-point':for(let step=1;step<=p.right-p.left;step++){const points=[p.left];for(let i=0;i<p.parts;i++)points.push(points.at(-1)+step);if(points.at(-1)===p.right)return String(points[p.index]);}throw Error('No partition');
 case'inclusive-count':return String(count(p.left,p.right,n=>Number.isInteger(n)));
 case'day-night-climb':{let pos=0;for(let day=1;day<=1000;day++){for(let j=0;j<p.up;j++){pos++;if(pos>=p.target)return String(day);}for(let j=0;j<p.down;j++)pos--;}throw Error('No arrival');}
 case'point-progression':{let pos=p.first;for(let index=1;index<p.index;index++)pos+=p.step;return String(pos);}
 case'two-hop-impossible':{const reachable=new Set();for(let b=0;b<100;b++)for(let c=0;c<100;c++)if(Math.abs(p.start-b)===p.firstStep&&Math.abs(b-c)===p.secondStep)reachable.add(c);const absent=p.candidates.filter(c=>!reachable.has(c));assert.equal(absent.length,1);return String(absent[0]);}
 case'bounded-natural-count':return String(count(1,p.center+p.radius,n=>Math.abs(n-p.center)<=p.radius));
 case'internal-ratio-point':for(let c=p.left+1;c<p.right;c++)if(c-p.left===p.ratio*(p.right-c))return String(c);throw Error('No ratio point');
 case'coordinate-ratio-gap':for(let l=1;l<1000;l++){const k=l+p.gap;if(k===p.multiple*l)return String(k);}throw Error('No relative coordinate');
 case'coordinate-gap':for(let c=p.left;c<p.right;c++)x++;return String(x);
 case'false-ray-claim':return'Көрінетін соңғы белгі сәуленің соңғы нүктесі болады';
 case'repeated-digit-extremes':{const ns=[];for(let n=10;n<100;n++){const ds=String(n).split('').map(Number);if(ds[0]===ds[1]&&ds.every(d=>d>=p.minDigit&&d<=p.maxDigit))ns.push(n);}return String(ns.at(-1)-ns[0]);}
 case'hourly-progress-sum':{let position=0,distance=p.first;for(let h=0;h<p.hours;h++){position+=distance;distance+=p.step;}return String(position);}
 case'distinct-distances':{const a=[];for(const left of p.points)for(const right of p.points)if(right>left){let d=0;for(let j=left;j<right;j++)d++;if(!a.includes(d))a.push(d);}return String(a.length);}
 case'meeting-coordinate':for(let t=0;t<1000;t++){const a=p.left*p.unit+p.speedA*t,b=p.right*p.unit-p.speedB*t;if(a===b)return String(a/p.unit);}throw Error('No meeting');
 case'trisection-middle':{let c,d;for(let i=p.left+1;i<p.right;i++)for(let j=i+1;j<p.right;j++)if(i-p.left===j-i&&j-i===p.right-j){assert.equal(c,undefined);c=i;d=j;}for(let e=c;e<=d;e++)if(e-c===d-e)return String(e);throw Error('No trisection midpoint');}
 default:throw Error('No independent coordinate oracle '+k);
 }
}
test('all46 nonvisual ray sources keep individual sourceRefs and await external review',()=>{assert.equal(data.editions.length,46);assert.equal(new Set(data.editions.flatMap(r=>r.sourceRefs.map(s=>s.sourceId))).size,46);for(const row of data.editions){assert.equal(row.grade,5);assert.equal(row.minimumPlan,'pro');assert.equal(row.editorialStatus,'awaiting_independent_review');const ref=row.sourceRefs[0];const q=JSON.parse(fs.readFileSync(new URL('../'+ref.sourceFile,import.meta.url),'utf8')).questions.find(q=>q.id===ref.sourceId);assert.ok(q.checked);assert.equal(q.images.length,0);assert.notEqual(q.statement,row.statement);if(row.options){assert.equal(row.options.length,4);assert.equal(new Set(row.options).size,4);assert.equal(row.options.filter(x=>x===row.answer).length,1);}}});
for(const row of data.editions)test(row.editionId+' is independently solved, unique and text-bound',()=>{assert.equal(row.answer,oracle(row));assert.equal(verifyEdition(row).answer,row.answer);assert.throws(()=>verifyEdition({...row,answer:'wrong'}));assert.throws(()=>verifyEdition({...row,statement:row.statement+' 7'}));assert.throws(()=>verifyEdition({...row,solution:row.solution+' 7'}));assert.throws(()=>verifyEdition({...row,params:{...row.params,unreviewedExtra:17}}));});
