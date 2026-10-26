/** Author checks using printed givens, BFS minima, generating-function counts,
 * and complete integer coin ledgers. No independent editorial signature. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './grade4-currency-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-currency-wave18.json',import.meta.url))).editions;
const keys=['40 цент','28','20 цент','5 000 + 2 000 + 2 000 + 1 000 теңге','5','4 еуро 7 цент','100 + 50 + 20 + 20 + 10 цент','15 еуро','609 цент','14','1300','100 + 50 + 20 + 2 + 2 доллар','60','13','12','<','5','8','8','60','6','7','11 еуро 55 цент','50, 50, 50 цент','10','6','Еуромен 440 теңгеге арзан','10','80','29','6','20 еуролық 4 және 5 еуролық 4','Әмірде 8, Айшада 10','18','1 235 цент','30 цент','6','7','10','Нұрда 13, Мәдинада 7'];
const num=s=>Number(s.replaceAll(' ','')),take=(re,s)=>{const m=re.exec(s);assert(m,[re,s]);return m;},smallNumeric=s=>num(s.replace(/ (?:цент|еуро)$/,''));
function mixed(s){const m=/^(\d+) еуро(?: (\d+) цент)?$/.exec(s);if(m)return +m[1]*100 + +(m[2]||0);return num(take(/^([\d ]+) цент$/,s)[1]);}
function leastByBFS(total,allowed){let sums=new Set([0]);for(let count=0;count<=total;count++){if(sums.has(total))return count;const next=new Set();for(const v of sums)for(const c of allowed)if(v+c<=total)next.add(v+c);sums=next;}assert.fail('Not reachable');}
function allTwo(total,count,high,low){const pairs=[];for(let a=0;a<=count;a++)for(let b=0;b<=count;b++)if(a+b===count&&a*high+b*low===total)pairs.push([a,b]);assert.equal(pairs.length,1);return pairs[0];}
let domains=0,bfsDomains=0,coinDomains=0,unorderedDomains=0;
assert.equal(rows.length,40);
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement,k=r.modelId.replace('grade4-currency-','');assert.equal(r.answer,keys[i]);assert.equal(verifyEdition(r).answer,keys[i]);
 switch(k){
 case 'missing-denomination':{const values=take(/мәндері: ([\d, ]+) (?:цент|еуро)\./,s)[1].split(', ').map(num);const missing=r.options.filter(o=>!values.includes(smallNumeric(o)));assert.deepEqual(missing,[r.answer]);break;}
 case 'uniform-coin-change':{const m=take(/^(\d+) (?:еуро|доллар)(?: (\d+) цент)? ақшаны тек (\d+) центтік/,s),total=+m[1]*100 + +(m[2]||0),coin=+m[3];assert.equal(total/coin,+r.answer);assert.equal(total%coin,0);break;}
 case 'dollar-fraction-cents':{const d=+take(/Доллардың 1\/(\d+) бөлігін/,s)[1];assert.equal(100/d,smallNumeric(r.answer));break;}
 case 'exact-denomination-sum':case 'nonmatching-denomination-sum':{const total=num(take(/^([\d ]+) (?:теңге|цент|доллар) сомасын/,s)[1]);const evaluate=o=>o.replace(/ (?:теңге|цент|доллар)$/,'').split(' + ').map(num).reduce((a,b)=>a+b,0);const accepted=r.options.filter(o=>k==='exact-denomination-sum'?evaluate(o)===total:evaluate(o)!==total);assert.deepEqual(accepted,[r.answer]);break;}
 case 'minimum-money-count':{const m=take(/^Бұл есепте ([\d, ]+) (?:цент|еуро|доллар) номиналдары[\s\S]*?бар\. ([\d ]+) (?:цент|еуро|доллар) сомасын/,s),allowed=m[1].split(', ').map(num),total=num(m[2]);assert.equal(leastByBFS(total,allowed),+r.answer);bfsDomains++;break;}
 case 'greatest-mixed-amount':{const v=r.options.map(mixed),max=Math.max(...v);assert.equal(v.filter(x=>x===max).length,1);assert.equal(r.options[v.indexOf(max)],r.answer);break;}
 case 'mixed-money-cents':{const m=take(/^(\d+) (?:доллар|еуро) (\d+) цент неше/,s);assert.equal(+m[1]*100 + +m[2],smallNumeric(r.answer));break;}
 case 'cents-to-euros':{const cents=num(take(/Жинақта ([\d ]+) еуроцент/,s)[1]);assert.equal(cents/100,+r.answer);break;}
 case 'whole-dollar-cents':{const n=+take(/Әмиянда (\d+) доллар/,s)[1];assert.equal(n*100,+r.answer);break;}
 case 'uniform-banknote-change':{const m=take(/^([\d ]+) теңгені түгелдей (\d+) теңгелік/,s);assert.equal(num(m[1])/+m[2],+r.answer);break;}
 case 'equal-banknote-counts':{const m=take(/Динара ([\d ]+) теңгені ([\d ]+) және ([\d ]+) теңгелік/,s),[total,a,b]=m.slice(1).map(num),hits=[];for(let n=0;n<=total/Math.min(a,b);n++)if(n*a+n*b===total)hits.push(n*2);assert.deepEqual(hits,[+r.answer]);coinDomains++;break;}
 case 'mixed-cent-comparison':{const m=take(/^(\d+) еуро (\d+) цент □ (\d+) цент/,s),a=+m[1]*100 + +m[2],b=+m[3];assert.equal(a<b?'<':a>b?'>':'=',r.answer);break;}
 case 'two-euro-coin-counts':{const m=take(/тек (\d+) және (\d+) еуролық[\s\S]*?Барлығы (\d+) монета, жалпы сома (\d+) еуро/,s),[high,low,count,total]=m.slice(1).map(Number);assert.equal(allTwo(total,count,high,low)[0],+r.answer);coinDomains++;break;}
 case 'multiple-banknote-change':{const m=take(/^(\d+) долларлық (\d+) қағаз ақшаны түгел (\d+) долларлық/,s);assert.equal(+m[1]*+m[2]/+m[3],+r.answer);break;}
 case 'mixed-euro-change':{const m=take(/бағасы (\d+) еуро (\d+) цент\. Оған (\d+) еуро/,s),change=+m[3]*100-(+m[1]*100 + +m[2]);assert.deepEqual(r.options.filter(o=>mixed(o)===change),[r.answer]);break;}
 case 'valid-coin-triple':{const m=take(/жиынында ([\d, ]+) центтік[\s\S]*?сомасы (\d+) цент/,s),allowed=m[1].split(', ').map(num),total=+m[2];const valid=r.options.filter(o=>{const ns=o.replace(' цент','').split(', ').map(num);return ns.length===3&&ns.every(n=>allowed.includes(n))&&ns.reduce((a,b)=>a+b,0)===total;});assert.deepEqual(valid,[r.answer]);let full=[];for(const a of allowed)for(const b of allowed)for(const c of allowed)if(a<=b&&b<=c&&a+b+c===total)full.push([a,b,c]);assert.deepEqual(full,[[50,50,50]]);coinDomains++;break;}
 case 'purchase-remainder':{const m=take(/Аружанда (\d+) доллар[\s\S]*?Ол (\d+) долларлық[\s\S]*?әрқайсысы (\d+) доллар/,s),[cash,fixed,each]=m.slice(1).map(Number),counts=[];for(let n=0;n<=cash;n++)if(fixed+n*each<=cash)counts.push(n);const most=Math.max(...counts);assert.equal(cash-fixed-most*each,+r.answer);assert(fixed+(most+1)*each>cash);break;}
 case 'two-cent-coin-counts':{const m=take(/^(\d+) еуро(?: (\d+) цент)? ақшаны тек (\d+) және (\d+) центтік[\s\S]*?Барлығы (\d+) монета/,s),total=+m[1]*100 + +(m[2]||0),high=+m[3],low=+m[4],count=+m[5];assert.equal(allTwo(total,count,high,low)[1],+r.answer);coinDomains++;break;}
 case 'fixed-rate-price-comparison':{const m=take(/кәдесый (\d+) доллар немесе (\d+) еуро[\s\S]*?1 доллар = (\d+) теңге, 1 еуро = (\d+) теңге/,s),[d,e,dr,er]=m.slice(1).map(Number),a=d*dr,b=e*er;assert(a>b);assert.equal(`Еуромен ${a-b} теңгеге арзан`,r.answer);assert(s.includes('шартты бағам')&&s.includes('Комиссия жоқ'));break;}
 case 'unordered-denomination-ways':{const m=take(/^([\d ]+) (?:теңге|цент) сомасын тек ([\d, ]+) (?:теңге|цент) номиналдарымен/,s),total=num(m[1]),allowed=m[2].split(', ').map(num);const dp=Array(total+1).fill(0);dp[0]=1;for(const coin of allowed)for(let a=coin;a<=total;a++)dp[a]+=dp[a-coin];assert.equal(dp[total],+r.answer);assert(s.includes('Реті маңызды емес')&&s.includes('нөл дана'));unorderedDomains++;break;}
 case 'equal-cent-coin-counts':{const m=take(/^(\d+) және (\d+) центтік[\s\S]*?сомасы (\d+) доллар/,s),[a,b,d]=m.slice(1).map(Number),answers=[];for(let n=0;n<=d*100;n++)if(n*a+n*b===d*100)answers.push(n*2);assert.deepEqual(answers,[+r.answer]);coinDomains++;break;}
 case 'two-note-configuration':{const m=take(/^(\d+) еуроны тек (\d+) және (\d+) еуролық[\s\S]*?Барлығы (\d+) қағаз/,s),[total,high,low,count]=m.slice(1).map(Number),wanted=allTwo(total,count,high,low);const accepted=r.options.filter(o=>{const a=take(/^(\d+) еуролық (\d+) және (\d+) еуролық (\d+)$/,o);return +a[1]===high&&+a[3]===low&&+a[2]===wanted[0]&&+a[4]===wanted[1];});assert.deepEqual(accepted,[r.answer]);coinDomains++;break;}
 case 'spending-equalization':{const m=take(/барлығы (\d+) монета[\s\S]*?Әмір (\d+), Айша (\d+) монетаны/,s),[total,spentA,spentB]=m.slice(1).map(Number),solutions=[];for(let a=spentA;a<=total;a++)for(let b=spentB;b<=total;b++)if(a+b===total&&a-spentA===b-spentB)solutions.push([a,b]);assert.equal(solutions.length,1);assert.equal(`Әмірде ${solutions[0][0]}, Айшада ${solutions[0][1]}`,r.answer);coinDomains++;break;}
 case 'two-tenge-note-counts':{const m=take(/^([\d ]+) теңге тек ([\d ]+) және ([\d ]+) теңгелік[\s\S]*?Барлығы (\d+) қағаз/,s),[total,high,low,count]=m.slice(1).map(num);assert.equal(allTwo(total,count,high,low)[1],+r.answer);coinDomains++;break;}
 case 'transfer-equalization':{const m=take(/барлығы (\d+) монета[\s\S]*?Мәдинаға (\d+) монета берсе/,s),[total,give]=m.slice(1).map(Number),solutions=[];for(let a=give;a<=total;a++)for(let b=0;b<=total;b++)if(a+b===total&&a-give===b+give)solutions.push([a,b]);assert.equal(solutions.length,1);assert.equal(`Нұрда ${solutions[0][0]}, Мәдинада ${solutions[0][1]}`,r.answer);coinDomains++;break;}
 default:assert.fail(k);
 }domains++;
}
let rejected=0,invalid=0;
for(const row of rows){for(const key of ['answer','statement','solution','options']){if(key==='options'&&!row.options)continue;const bad=structuredClone(row);bad[key]=key==='options'?[...row.options].reverse():row[key]+' altered';assert.throws(()=>verifyEdition(bad));rejected++;}const key=Object.keys(row.params).find(k=>typeof row.params[k]==='number');if(key){const changed=structuredClone(row);changed.params[key]++;assert.throws(()=>verifyEdition(changed));rejected++;const bad=structuredClone(row);bad.params[key]=-1;assert.throws(()=>{Object.assign(bad,renderEdition(bad));verifyEdition(bad);});invalid++;}}
// A noncanonical coin set must not inherit the canonical greedy explanation.
const broken=structuredClone(rows[4]);broken.params.allowed=[1,3,4];assert.throws(()=>renderEdition(broken));invalid++;
console.log(JSON.stringify({fixtures:40,printedGivenDomains:domains,independentBFSCoinMinima:bfsDomains,completeIntegerCoinDomains:coinDomains,generatingFunctionUnorderedCounts:unorderedDomains,tamperRejected:rejected,invalidParametersRejected:invalid,status:'passed'}));
