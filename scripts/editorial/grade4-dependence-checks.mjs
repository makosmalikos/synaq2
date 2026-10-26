/** Printed-given author checks; this file is not an independent editorial signature. */
import fs from 'node:fs';import assert from 'node:assert/strict';
import{renderEdition,verifyEdition}from'./grade4-dependence-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-dependence-wave28.json',import.meta.url))).editions;
const expected=['4 м','300','1300','7 × 7 × 7','336 м²','63925','140','<','5 мм','126','z × y × x','10200','8 см, 8 см, 5 см','204','=','5400 см³','2300','4 есе өседі','ені 4 м, көлемі 128 м³','36','42','336','360','3','120 см³','48²','768','168 см³','5','729','700','224 м³','<','70','20 дм³','Екінші аквариумға 9 л артық','72'];
const get=(re,s)=>{const m=re.exec(s);assert(m,[re,s]);return m.slice(1).map(Number);},prod=a=>a.reduce((x,y)=>x*y,1),sum=a=>a.reduce((x,y)=>x+y,0),sign=(a,b)=>a<b?'<':a>b?'>':'=';
const d=s=>get(/(\d+) см, (\d+) см, (\d+) см/,s),dims=s=>get(/ұзындығы (\d+) [см]+, ені (\d+) [см]+, (?:биіктігі|тереңдігі) (\d+) [см]+/,s),match=(r,n,u='')=>assert.equal(r.answer,String(n)+(u?' '+u:''));
const decode=s=>s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,t=>'^'+[...t].map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''));
const power=s=>{const[a,b]=get(/(\d+)\^(\d+)/,decode(s));return a**b;};
let printedGivenDomains=0,fullIntegerCases=0,scaleGridCases=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement,k=r.modelId.replace('grade4-dependence-','');verifyEdition(r);assert.equal(r.answer,expected[i]);
 switch(k){
 case'height-from-floor-volume':{const[v,a]=get(/көлемі (\d+) м³[\s\S]*?ауданы (\d+) м²/,s);match(r,v/a,'м');break;}
 case'cube-minus':case'round-tens-cube-minus':{const[a,e,b]=get(/(\d+)\^(\d+) − (\d+)/,decode(s));assert.equal(e,3);match(r,a*a*a-b);if(k.startsWith('round'))assert(a%10===0&&a>=20);break;}
 case'efficient-box-volume':{const t=dims(s);assert.equal(t[0],25);assert.equal(t[2],4);assert(r.solution.includes('(25 × 4)'));match(r,prod(t));break;}
 case'cube-expansion':{const[a,e]=get(/^(\d+)\^(\d+)/,decode(s));assert.equal(e,3);assert.equal(r.answer,Array(e).fill(a).join(' × '));const numeric=r.options.map(o=>o.split(' + ').length>1?sum(o.split(' + ').map(Number)):prod(o.split(' × ').map(Number)));assert.equal(numeric.filter(n=>n===a**e).length,1);break;}
 case'pool-floor-choice':{const[a,b,c]=dims(s);match(r,a*b,'м²');assert(r.options.includes(a*b*c+' м²'));assert(r.options.includes(2*(a+b)+' м²'));break;}
 case'volume-from-floor':{const[a,h]=get(/едені (\d+) м²[\s\S]*?биіктігі (\d+) м/,s);match(r,a*h);break;}
 case'swapped-base-exponent-compare':{const[a,e,b,f]=get(/(\d+)\^(\d+) □ (\d+)\^(\d+)/,decode(s));assert.equal(a,f);assert.equal(e,b);assert.equal(r.answer,sign(a**e,b**f));break;}
 case'length-from-volume-mm':{const[w,h,v]=get(/ені (\d+) мм, биіктігі (\d+) мм, көлемі (\d+) мм³/,s);const matches=[];for(let a=1;a<=v;a++){fullIntegerCases++;if(a*w*h===v)matches.push(a);}assert.deepEqual(matches,[parseInt(r.answer)]);break;}
 case'base-area-open':{const[a,b]=dims(s);match(r,a*b);break;}
 case'reordered-volume-formula':{assert.equal(r.answer,'z × y × x');let rejected=0;for(const[a,b,c]of[[2,3,5],[8,5,3],[4,9,2]]){const vals=[a*b+c,c*b*a,a+b+c,(a+c)*b];assert.equal(vals[1],a*b*c);for(let j=0;j<4;j++)if(j!==1&&vals[j]!==a*b*c)rejected++;}assert(rejected>=6);break;}
 case'missing-boxes-volume':{const[cap]=get(/барлығы (\d+) бірдей/,s),[present]=get(/Қазір (\d+) орын/,s);match(r,(cap-present)*prod(d(s)));break;}
 case'largest-volume-choice':{const ts=r.options.map(d),vs=ts.map(prod),ss=ts.map(sum);assert.equal(r.answer,r.options[vs.indexOf(Math.max(...vs))]);assert.notEqual(vs.indexOf(Math.max(...vs)),ss.indexOf(Math.max(...ss)));break;}
 case'pool-side-area':{const[a,b,c]=dims(s);match(r,2*a*c+2*b*c);assert(s.includes('Түбіне тимей'));break;}
 case'equal-floor-volume-comparison':{const ts=[...s.matchAll(/(\d+) см, (\d+) см, (\d+) см/g)].map(m=>m.slice(1).map(Number));assert.equal(ts.length,2);assert.equal(ts[0][2],ts[1][2]);assert.equal(ts[0][0]*ts[0][1],ts[1][0]*ts[1][1]);assert.equal(r.answer,sign(prod(ts[0]),prod(ts[1])));break;}
 case'mixed-dm-cm-volume':{const[a,b,c]=get(/ұзындығы (\d+) дм, ені (\d+) см, биіктігі (\d+) см/,s);match(r,a*10*b*c,'см³');assert(r.options.includes(a*b*c+' см³'));break;}
 case'efficient-product-choice':{const[a,b,c]=get(/^(\d+) × (\d+) × (\d+)/,s);assert.equal(a*c,100);match(r,a*b*c);assert(r.solution.includes('(4 × 25)'));break;}
 case'height-volume-factor':{const[f]=get(/биіктігін (\d+) есе/,s);assert.equal(r.answer,`${f} есе өседі`);for(let a=1;a<=10;a++)for(let b=1;b<=10;b++)for(let c=1;c<=10;c++){scaleGridCases++;assert.equal(a*b*(c*f),a*b*c*f);}break;}
 case'width-and-volume-from-floor':{const[a,l,h]=get(/едені (\d+) м²\. Ұзындығы (\d+) м, биіктігі (\d+) м/,s);assert.equal(r.answer,`ені ${a/l} м, көлемі ${a*h} м³`);assert.equal(r.options.filter(o=>o===r.answer).length,1);break;}
 case'capacity-from-air-volume':{const ts=get(/өлшемдері (\d+) м, (\d+) м, (\d+) м/,s),[per]=get(/кемінде (\d+) м³/,s),volume=prod(ts),good=[];for(let n=0;n<=volume;n++){fullIntegerCases++;if(n*per<=volume)good.push(n);}match(r,Math.max(...good));assert(s.includes('Осы есептің шарты бойынша'));break;}
 case'base-perimeter-from-volume':{const[v,h,l]=get(/көлемі (\d+) см³, биіктігі (\d+) см, табанының ұзындығы (\d+) см/,s);match(r,2*(l+v/h/l));break;}
 case'dependent-width-height-volume':{const[l,g,f]=get(/ұзындығы (\d+) см[\s\S]*?ұзындығынан (\d+) см[\s\S]*?ұзындығынан (\d+) есе/,s);match(r,l*(l-g)*(l/f));break;}
 case'three-dimension-scale':{const[v,a,b,c]=get(/Көлемі (\d+) см³[\s\S]*?ұзындығын (\d+) есе[\s\S]*?енін (\d+) есе[\s\S]*?Биіктігін (\d+) есе/,s);assert.equal(a,b);match(r,v*a*c/b);for(let x=1;x<=8;x++)for(let y=1;y<=8;y++)for(let z=1;z<=8;z++){scaleGridCases++;assert.equal(BigInt(x*a)*BigInt(y)*BigInt(z*c),BigInt(x*y*z*c)*BigInt(b));}break;}
 case'cube-displacement':{const[l,w,e,n]=get(/табаны (\d+) см × (\d+) см[\s\S]*?қыры (\d+) см болатын (\d+) тұтас/,s);match(r,n*e*e*e/(l*w));assert(s.includes('толық батырылды')&&s.includes('Су төгілмеді'));assert(Math.floor(l/e)*Math.floor(w/e)>=n);break;}
 case'face-areas-volume-choice':{const areas=get(/аудандары (\d+) см², (\d+) см², (\d+) см²/,s).sort((a,b)=>a-b),matches=[];for(let x=1;x<=30;x++)for(let y=x;y<=30;y++)for(let z=y;z<=30;z++){fullIntegerCases++;if(JSON.stringify([x*y,x*z,y*z].sort((a,b)=>a-b))===JSON.stringify(areas))matches.push(x*y*z);}assert.deepEqual(matches,[parseInt(r.answer)]);break;}
 case'three-cube-sum-power':{const edges=d(s),v=sum(edges.map(n=>n*n*n)),vals=r.options.map(power);assert.equal(vals.filter(n=>n===v).length,1);assert.equal(r.answer,r.options[vals.indexOf(v)]);assert.equal(r.options[vals.indexOf(v)].at(-1),'²');break;}
 case'ratio-sides-wire-volume':{const[a,b,w]=get(/енінен (\d+) есе[\s\S]*?биіктігінен (\d+) есе[\s\S]*?қосындысы (\d+) см/,s),good=[];for(let h=1;h<w;h++){fullIntegerCases++;if(4*(a*b*h+b*h+h)===w)good.push(a*b*h*b*h*h);}assert.deepEqual(good,[+r.answer]);break;}
 case'all-sides-additive-gain':{const ts=d(s),[add]=get(/әрқайсысын (\d+) см/,s);match(r,prod(ts.map(n=>n+add))-prod(ts),'см³');assert(r.options.includes(prod(ts.map(n=>n+add))+' см³'));break;}
 case'pool-two-pumps':{const[a,b,c,r1,r2]=get(/өлшемдері (\d+) м, (\d+) м, (\d+) м[\s\S]*?сағатына (\d+) м³[\s\S]*?сағатына (\d+) м³/,s),good=[];for(let t=0;t<=a*b*c;t++){fullIntegerCases++;if(t*r1+t*r2===a*b*c)good.push(t);}assert.deepEqual(good,[+r.answer]);break;}
 case'square-and-cube':{const good=[];for(const n of r.options.map(Number)){let isSquare=false,isCube=false;for(let i=1;i<=n;i++){fullIntegerCases++;if(i*i===n)isSquare=true;if(i*i*i===n)isCube=true;}if(isSquare&&isCube)good.push(n);}assert.deepEqual(good,[+r.answer]);break;}
 case'room-volume-choice':match(r,prod(dims(s)),'м³');break;
 case'cube-square-comparison':{const[a,e,b,f]=get(/(\d+)\^(\d+) □ (\d+)\^(\d+)/,decode(s));assert.equal(e,3);assert.equal(f,2);assert.equal(r.answer,sign(a**e,b**f));break;}
 case'half-warehouse-boxes':{const[a,b,c,box]=get(/өлшемдері (\d+) м, (\d+) м, (\d+) м[\s\S]*?көлемі (\d+) м³/,s);match(r,a*b*c/2/box);break;}
 case'mixed-volume-dm-choice':{const[a,b,c]=get(/ұзындығы (\d+) дм, ені (\d+) см, биіктігі (\d+) см/,s),v=a*10*b*c,values=r.options.map(o=>{const[n]=get(/^(\d+)/,o);return n*(o.endsWith('дм³')?1000:1);});assert.equal(values.filter(n=>n===v).length,1);assert.equal(r.answer,r.options[values.indexOf(v)]);break;}
 case'aquarium-liters-gap':{const ts=[...s.matchAll(/(\d+) см, (\d+) см, (\d+) см/g)].map(m=>m.slice(1).map(Number));assert.equal(ts.length,2);const gap=(prod(ts[1])-prod(ts[0]))/1000;assert.equal(r.answer,`Екінші аквариумға ${gap} л артық`);break;}
 case'initial-volume-from-scaled':{const[f,v]=get(/әрқайсысын (\d+) есе[\s\S]*?көлемі (\d+) см³/,s);match(r,v/(f*f*f));break;}
 default:assert.fail(k);
 }
 const ref=r.sourceRefs[0],o=JSON.parse(fs.readFileSync(ref.sourceFile)),q=o.questions.find(q=>q.id===ref.sourceId);assert.equal(o.status,'captured');assert(q.checked&&q.solution&&q.sourceAnswer&&!q.images?.length);const clean=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(r.statement),clean(q.statement));if(q.options?.length)assert.equal(q.options.filter(x=>x.correct).length,1);printedGivenDomains++;
}
let tamperRejected=0,missingParametersRejected=0;
for(const r of rows){for(const field of['statement','answer','solution','options']){if(field==='options'&&!r.options)continue;const bad=structuredClone(r);bad[field]=field==='options'?[...r.options].reverse():r[field]+' changed';assert.throws(()=>verifyEdition(bad));tamperRejected++;}const bad=structuredClone(r);bad.params={};assert.throws(()=>renderEdition(bad));missingParametersRejected++;}
const guards=[['efficient-box-volume',{dimensions:[24,13,4]}],['cube-expansion',{base:3}],['round-tens-cube-minus',{base:41,subtract:75}],['cube-displacement',{floor:[5,5],cubeEdge:5,cubes:2}],['three-dimension-scale',{volume:90,lengthFactor:3,widthDivisor:2,heightFactor:4,example:[5,6,3]}],['initial-volume-from-scaled',{factor:3,newVolume:1945,example:[6,4,3]}]];
for(const[k,params]of guards)assert.throws(()=>renderEdition({skillFamily:k,params}));
console.log(JSON.stringify({fixtures:rows.length,printedGivenDomains,fullIntegerCases,scaleGridCases,sourceStatementMatches:0,tamperRejected,missingParametersRejected,pedagogicalGuardsRejected:guards.length,status:'passed'}));
