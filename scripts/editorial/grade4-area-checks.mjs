import fs from 'node:fs';
import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './grade4-area-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-area-wave15.json',import.meta.url),'utf8')).editions;
const expected=['6','=','150','1030','12','535','4 700 а = 470 000 м²','980 дм²','3550','4 090 дм²','4 га','8','<','26500','13','11 800 м²','17 бала, 12 жылқы','250 м және 80 м','175 а','199 га','160','10','12 а','>','655','665 м²','21'];
assert.equal(rows.length,expected.length);let mutations=0;
for(const[i,row]of rows.entries()){
 assert.equal(row.answer,expected[i],row.editionId);assert.equal(verifyEdition(row).answer,row.answer);assert.equal(row.grade,4);assert.equal(row.minimumPlan,'pro');assert.equal(row.editorialStatus,'draft');if(!row.options)assert.match(row.statement,/Жауапқа тек сан/);
 for(const field of ['statement','answer','solution']){const bad=structuredClone(row);bad[field]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));mutations++;}
 if(row.options){const bad=structuredClone(row);bad.options[0]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));mutations++;}
 const bad=structuredClone(row);function mutate(value){for(const key of Object.keys(value)){if(typeof value[key]==='number'){value[key]++;return true;}if(value[key]&&typeof value[key]==='object'&&mutate(value[key]))return true;}return false;}assert(mutate(bad.params));assert.throws(()=>verifyEdition(bad));mutations++;
}
const find=kind=>rows.find(r=>r.modelId===`grade4-area-${kind}`),plain=s=>Number(s.replaceAll(' ','')),leading=s=>plain(s.match(/^[\d ]+/)[0]);
// Separate SI-area reader derives square units by squaring linear millimetres;
// hectare and are are100m/10m squares. The model uses a square-centimetre table.
const sideMm={'дм²':100n,'м²':1000n,'а':10000n,'га':100000n,'км²':1000000n};
function parsed(s){const m=s.match(/^([\d ]+) (дм²|м²|а|га|км²)$/);assert(m,s);return BigInt(m[1].replaceAll(' ',''))*sideMm[m[2]]**2n;}
for(const kind of ['greatest-area','least-area']){const row=find(kind),vs=row.options.map(parsed),best=vs.reduce((a,b)=>kind.startsWith('greatest')?(a>b?a:b):(a<b?a:b));assert.equal(row.options[vs.indexOf(best)],row.answer);assert.equal(vs.filter(v=>v===best).length,1);}
assert.equal(find('greatest-area').options.map(parsed).filter(v=>v===38000n*1000000n).length,2);assert.equal(find('least-area').options.map(parsed).filter(v=>v===2000000n*1000000n).length,2);
const dimensionless=find('same-area-quotient');assert.equal(dimensionless.answer,'6');assert(dimensionless.options.includes('6 а'));assert.equal(find('hectare-are-quotient').answer,'8');
const dimensional=rows.find(r=>r.modelId.endsWith('scalar-area-division')&&r.options);assert.equal(dimensional.answer,'12 а');assert(dimensional.options.includes('12'));assert.equal(rows.find(r=>r.modelId.endsWith('scalar-area-division')&&!r.options).answer,'150');
for(const row of rows.filter(r=>r.modelId.endsWith('four-legged-animal-count'))){const[p_heads,p_legs]=[row.params.heads,row.params.legs],answers=[];for(let two=0;two<=p_heads;two++)for(let four=0;four<=p_heads;four++)if(two+four===p_heads&&2*two+4*four===p_legs)answers.push(four);assert.deepEqual(answers,[Number(row.answer)]);}
const horse=find('children-horses-count');assert.deepEqual(horse.options.map(o=>{const[a,b]=o.match(/\d+/g).map(Number);return{heads:a+b,legs:2*a+4*b};}),[{heads:29,legs:82},{heads:29,legs:92},{heads:29,legs:80},{heads:29,legs:84}]);
const target=find('rectangle-target-hectares');assert.equal(target.options.filter(o=>{const[a,b]=o.match(/\d+/g).map(Number);return a*b===20000;}).length,1);assert.equal(target.options.find(o=>o.startsWith('250 м')),target.answer);
const oldArea=find('area-before-rescaling');assert.equal(parsed(oldArea.answer)*12n,21n*10000000000n);assert(oldArea.options.includes('300 а'));assert.equal(2100/(3+4),300);assert.notEqual(parsed('300 а')*12n,21n*10000000000n);
const edges=[];for(let side=1;side<=1600;side++)if(side*side===1600)edges.push(side);assert.deepEqual(edges,[40]);assert.equal(4*edges[0],Number(find('square-plot-fence').answer));
const rectangles=[];for(let len=31;len<=1200;len++)if(30*len===1200)rectangles.push(len-30);assert.deepEqual(rectangles,[Number(find('rectangle-length-excess').answer)]);
const split=[];for(let smaller=0;smaller<=200;smaller++){const larger=200-smaller;if(larger-smaller===36)split.push(larger*100);}assert.deepEqual(split,[leading(find('land-sum-gap-larger').answer)]);
assert.equal(1200-165-500,535);assert.equal(900-900/5-55,leading(find('fractional-house-garden').answer));assert.equal(9*100+80,980);assert.equal(40*100-450,3550);assert.equal(90+40*100,4090);assert.equal(12*100-170,1030);assert.equal(50000/10000+700/100,12);assert.equal(30000-3500,26500);assert.equal(700-45,655);assert.equal(8*10000<80060,true);assert.equal(50000>49900,true);
const invalid=[['same-area-quotient',{second:124}],['scalar-area-division',{divisor:8}],['are-minus-square-metres',{m2:1201}],['mixed-area-sum-hectares',{m2:50001}],['plot-yard-remainder',{gardenSotyks:13}],['square-metre-dm-difference',{dm2:4001}],['hectare-are-quotient',{ares:77}],['square-metre-cm-comparison',{rightCm2:81000}],['hectare-minus-square-metres',{m2:35000}],['four-legged-animal-count',{legs:95}],['land-sum-gap-larger',{gapAres:37}],['children-horses-count',{heads:30}],['rectangle-target-hectares',{hectares:3}],['area-before-rescaling',{lengthFactor:2}],['square-plot-fence',{sotyks:17}],['rectangle-length-excess',{widthM:31}],['hectare-minus-ares',{ares:701}],['fractional-house-garden',{houseDivisor:7}]];
for(const[kind,patch]of invalid){const bad=structuredClone(find(kind));Object.assign(bad.params,patch);assert.throws(()=>renderEdition(bad),kind);}
console.log(JSON.stringify({editions:rows.length,fixtureAnswers:expected.length,independentPrintedUnitDomains:2,completeHeadLegDomains:3,exactSquareAndRectangleSearch:2,sumGapSearch:201,quantityDimensionChecks:4,rejectedMutations:mutations,rejectedInvalidDomains:invalid.length,status:'passed',independentEditorialReview:'pending'}));
