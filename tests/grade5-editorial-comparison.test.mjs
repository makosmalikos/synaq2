import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {verifyEdition} from '../scripts/editorial/grade5-comparison-models.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade5-comparison.json',import.meta.url),'utf8'));
const sign=(a,b)=>a===b?'=':a-b>0?'>':'<';
function placeholder(p){const i=p.pattern.indexOf('?'),weight=10**(p.pattern.length-i-1),base=Number(p.pattern.replace('?','0'));const ds=[];for(let d=i===0?1:0;d<10;d++){const n=base+d*weight;if(p.relation==='<'?n<p.bound:n>p.bound)ds.push(d);}return ds;}
function oracle(r){const p=r.params,k=r.modelId.replace('grade5-comparison-','');switch(k){
 case'compare-numbers':return sign(BigInt(p.left),BigInt(p.right));
 case'correct-inequality':{const trueChoices=p.choices.filter(([a,b,o])=>sign(a,b)===o);assert.equal(trueChoices.length,1);const[a,b,o]=trueChoices[0];return`${a} ${o} ${b}`;}
 case'maximum':return String(p.numbers.slice().sort((a,b)=>a-b).at(-1));
 case'only-between':{const xs=p.numbers.filter(n=>p.lower<n&&n<p.upper);assert.equal(xs.length,1);return String(xs[0]);}
 case'natural-truth':return'Натурал сандар 1-ден басталады';
 case'only-interior':{let found;for(let n=p.lower+1;n<p.upper;n++){assert.equal(found,undefined);found=n;}return String(found);}
 case'double-inequality':return[p.lower,p.middle,p.upper].sort((a,b)=>a-b).join(' < ');
 case'compare-length':{const metresInCm=Number(BigInt(p.metres)*100n);return sign(metresInCm,p.centimetres);}
 case'coordinate-side':assert.ok(p.left<p.right);return p.side==='left'?`${p.labels[0]} нүктесі ${p.labels[1]} нүктесінің сол жағында`:`${p.labels[1]} нүктесі ${p.labels[0]} нүктесінің оң жағында`;
 case'min-digits':return'1'+'0'.repeat(p.digits-1);
 case'longest-metres':{const lengths=[];for(const[k,m]of p.lengths){let metres=m;for(let i=0;i<k;i++)metres+=1000;lengths.push(metres);}return String(lengths.sort((a,b)=>b-a)[0]);}
 case'minimum':return String(p.numbers.slice().sort((a,b)=>b-a).at(-1));
 case'max-natural-below':for(let n=p.limit;n>=1;n--)if(n<p.limit)return String(n);throw Error('No natural below');
 case'minimum-name':{const names=Object.keys(p.savings).filter(name=>Object.values(p.savings).every(v=>p.savings[name]<=v));assert.equal(names.length,1);return names[0];}
 case'ascending-order':return p.numbers.slice().sort((a,b)=>a-b).join('; ');
 case'number-length-compare':{const loLeft=Number('1'+'0'.repeat(p.leftDigits-1)),hiRight=Number('9'.repeat(p.rightDigits));assert.ok(loLeft>hiRight);return'>';}
 case'ordered-coordinate':{let remaining=p.points.slice();for(let i=1;i<p.index;i++){const smallest=remaining.reduce((a,b)=>a<b?a:b);remaining=remaining.filter(v=>v!==smallest);}return String(remaining.reduce((a,b)=>a<b?a:b));}
 case'placeholder-allowed':return placeholder(p).join(', ');
 case'strict-count':{let count=0;for(let n=p.lower;n<=p.upper;n++)if(n>p.lower&&n<p.upper)count++;return String(count);}
 case'three-digit-above':{let count=0;for(let n=100;n<1000;n++)if(n>p.limit)count++;return String(count);}
 case'placeholder-min':return String(placeholder(p)[0]);
 case'placeholder-max':return String(placeholder(p).at(-1));
 case'mixed-unit-choice':{const values=p.choices.map(c=>c.kind==='length'?[c.metres*1000,c.centimetres*10]:c.kind==='mass'?[(c.tonnes*1000+c.kilograms)*1000,c.right*1000]:c.kind==='seconds'?[c.minutes*60,c.seconds]:[c.hours*3600,c.minutes*60]);const valid=values.map(([x,y],i)=>sign(x,y)===p.choices[i].relation?i:-1).filter(i=>i>=0);assert.equal(valid.length,1);return r.options[valid[0]];}
 case'minutes-strict-min':{let n=0;while(n<=p.hours*60+p.minutes)n++;return String(n);}
 case'transitive-shortest':return'Алма ағашы';
 case'bounded-digit-code':{const lastTwo=p.tens*10+p.units;const xs=[];for(let prefix=10;prefix<100;prefix++){const n=prefix*100+lastTwo;if(n>p.lower&&n<p.upper)xs.push(n);}assert.equal(xs.length,1);return String(xs[0]);}
 case'max-distinct-below':{let greatest;for(let n=10**(p.digits-1);n<p.limit;n++)if(new Set(String(n)).size===p.digits)greatest=n;assert.ok(greatest);return String(greatest);}
 case'three-number-chain':return p.numbers.slice().sort((a,b)=>a-b).join(' < ');
 case'repeated-digit-count':{let count=0;for(let n=p.lower+1;n<p.upper;n++)if(String(n).length===p.digits&&new Set(String(n)).size===1)count++;return String(count);}
 case'boundary-truth':assert.equal(Number('1'+'0'.repeat(p.digits))-Number('9'.repeat(p.digits)),1);return`Ең үлкен ${p.digits} таңбалы сан ең кіші ${p.digits+1} таңбалы саннан 1-ге кем`;
 case'reverse-count':{let count=0;for(let tens=1;tens<=9;tens++)for(let units=0;units<=9;units++){const n=10*tens+units;if(n>=p.lower&&n<=p.upper&&tens>units)count++;}return String(count);}
 case'increasing-max-below':{const xs=[];for(let a=1;a<=9;a++)for(let b=a+1;b<=9;b++)for(let c=b+1;c<=9;c++){const n=100*a+10*b+c;if(n<p.limit)xs.push(n);}return String(xs.sort((a,b)=>b-a)[0]);}
 case'independent-placeholders':{const minA=Number(p.first.replaceAll('?','0')),maxA=Number(p.first.replaceAll('?','9')),minB=Number(p.second.replaceAll('?','0')),maxB=Number(p.second.replaceAll('?','9'));assert.ok(minA<maxB&&maxA>minB);return'Анықтауға болмайды';}
 case'permutation-min-above':{const digits=p.digits.slice().sort().join('');for(let n=p.bound+1;n<10**p.digits.length;n++)if(String(n).split('').sort().join('')===digits)return String(n);throw Error('No permutation');}
 case'pattern-count-below':{const pattern=new RegExp('^'+p.pattern.replaceAll('?','[0-9]')+'$');let count=0;for(let n=10**(p.pattern.length-1);n<p.bound;n++)if(pattern.test(String(n)))count++;return String(count);}
 case'second-rank':{function perms(xs){return xs.length?xs.flatMap((x,i)=>perms(xs.filter((_,j)=>i!==j)).map(a=>[x,...a])):[[]];}const fits=perms(p.order).filter(xs=>xs.indexOf(p.order[1])<xs.indexOf(p.order[2])&&xs.indexOf(p.order[3])>xs.indexOf(p.order[2])&&xs.indexOf(p.order[0])<xs.indexOf(p.order[1]));assert.equal(fits.length,1);return fits[0][1];}
 case'max-coordinate':return String(p.points.slice().sort((a,b)=>b-a)[0]);
 case'read-double-inequality':assert.ok(p.lower<p.middle&&p.middle<p.upper);return`${p.middle} саны ${p.lower} санынан үлкен және ${p.upper} санынан кіші`;
 case'mass-sort':{const parsed=p.items.map(item=>{const m=/^(?:(\d+)\s*т\s*)?(\d+)\s*кг$/.exec(item.label);assert.ok(m);const kg=Number(m[1]||0)*1000+Number(m[2]);assert.equal(kg,item.kg);return{label:item.label,kg};});return parsed.sort((a,b)=>a.kg-b.kg).map(v=>v.label).join('; ');}
 case'word-order-chain':return'Жасыл < Қызыл < Көк';
 case'interval-digit-sum-count':{let n=0;for(let a=0;a<=9;a++)for(let b=0;b<=9;b++)for(let c=0;c<=9;c++){const value=100*a+10*b+c;if(value>p.lower&&value<p.upper&&a+b+c===p.sum)n++;}return String(n);}
 case'extreme-descriptions':{let greedy='';for(let digit=9;greedy.length<p.distinctDigits;digit--)greedy+=digit;const values=[Number('9'.repeat(p.smallDigits)),Number(greedy),Number('1'+'0'.repeat(p.largeDigits-1)),p.benchmark];const greatest=values.map((n,i)=>values.every(x=>n>=x)?i:-1).filter(i=>i>=0);assert.equal(greatest.length,1);return r.options[greatest[0]];}
 case'decreasing-min-above':{const xs=[];for(let a=1;a<=9;a++)for(let b=0;b<a;b++)for(let c=0;c<b;c++){const n=100*a+10*b+c;if(n>p.limit)xs.push(n);}return String(xs.sort((a,b)=>a-b)[0]);}
 default:throw Error('No independent comparison oracle '+k);
 }}
test('48 nonvisual comparison sources keep authored conditions, native notation and external-review status',()=>{assert.equal(data.editions.length,48);assert.equal(new Set(data.editions.map(r=>r.sourceRefs[0].sourceId)).size,48);for(const r of data.editions){assert.equal(r.grade,5);assert.equal(r.minimumPlan,'pro');assert.equal(r.editorialStatus,'awaiting_independent_review');const ref=r.sourceRefs[0],q=JSON.parse(fs.readFileSync(new URL('../'+ref.sourceFile,import.meta.url),'utf8')).questions.find(q=>q.id===ref.sourceId);assert.ok(q.checked);assert.equal(q.images.length,0);assert.notEqual(q.statement,r.statement);assert.doesNotMatch(r.statement+r.solution,/[\\$]/);if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(v=>v===r.answer).length,1);}}});
for(const row of data.editions)test(row.editionId+' independently solved and binding cannot silently drift',()=>{assert.equal(row.answer,oracle(row));assert.equal(verifyEdition(row).answer,row.answer);for(const key of['statement','solution'])assert.throws(()=>verifyEdition({...row,[key]:row[key]+' 23'}));assert.throws(()=>verifyEdition({...row,answer:'wrong'}));assert.throws(()=>verifyEdition({...row,params:{...row.params,unreviewedExtra:29}}));});

test('mixed-length minimum retains the source digit-count comparison skill',()=>{const row=data.editions.find(r=>r.sourceRefs[0].sourceId==='a5bca47f839248d6');assert.equal(new Set(row.params.numbers.map(n=>String(n).length)).size,2);assert.ok(row.params.numbers.some(n=>String(n).length===4));assert.ok(row.params.numbers.some(n=>String(n).length===5));});

test('mixed dimensions and near-valued described extrema preserve the original comparison skills',()=>{const mixed=data.editions.find(r=>r.sourceRefs[0].sourceId==='2ac01c9e64db2ce7');assert.equal(new Set(mixed.params.choices.map(c=>c.kind)).size,4);const e=data.editions.find(r=>r.sourceRefs[0].sourceId==='41628ae469e97fc1');assert.equal(e.params.distinctDigits,e.params.largeDigits);assert.equal(String(e.params.benchmark).slice(0,2),'98');});
