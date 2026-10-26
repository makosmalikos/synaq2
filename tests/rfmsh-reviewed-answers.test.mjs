// Independent arithmetic / exhaustive enumeration checks for the bounded pool.
// Conditions and solutions are bound by the editorial content hash, rather than
// accepting a task merely because someone gave it a numeric difficulty tag.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {POOL} from '../frontend/src/bank.js';
const require=createRequire(import.meta.url),review=require('../backend/data/rfmshReviewedLevels.json');
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>i+a);
const gcd=(a,b)=>b?gcd(b,a%b):a, sum=xs=>xs.reduce((a,b)=>a+b,0), product=xs=>xs.reduce((a,b)=>a*b,1);
const digits=n=>String(n).split('').map(Number), prime=n=>n>=2&&range(2,Math.max(2,Math.floor(Math.sqrt(n)))).every(d=>d===n||n%d!==0);
const first=xs=>{assert.equal(xs.length,1);return xs[0];};
function paths(x,y){const table=Array.from({length:x+1},()=>Array(y+1).fill(0));table[0][0]=1;for(let a=0;a<=x;a++)for(let b=0;b<=y;b++){if(a===2&&b===1){table[a][b]=0;continue;}if(a||b)table[a][b]=(a?table[a-1][b]:0)+(b?table[a][b-1]:0);}return table[x][y];}
function boyArrangements(){let count=0;function permute(prefix,left){if(!left.length){if(prefix.every((n,i)=>!i||n<4||prefix[i-1]<4))count++;return;}for(const n of left)permute([...prefix,n],left.filter(x=>x!==n));}permute([],range(0,6));return count;}
const expected={
 v2_1:65*4/13-3,v2_2:13*12+10,v3_1:21*4/7,v3_3:225*180/gcd(225,180),v3_7:360-227,v3_8:1440*5/144,v4_2:2*3,v4_3:72/12,v4_6:.35*300+.15*200,v1_7:(2+340-1)%7+1,
 v1_12:sum(range(-10,10).filter(x=>9<2*x+3&&2*x+3<=13)),v2_6:4.5*100/(600/24),v2_10:99*7,v3_11:2*(70+140/70),v3_26:sum(range(6,10))-sum(range(1,5)),v4_1:(15+13+32)/(12+3),v4_5:30*2.5,v5_4:gcd(15,30)*gcd(12,16),v5_8:34.2/1.9+(5.55-3.3)-.25,v5_9:38*2,v5_23:sum(range(-50,50).filter(x=>Math.abs(3*x-17)<5)),v7_2:4*14/8,v7_5:12*7-11*7,v7_9:(4*13+2*19)/6,v9_3:54/.18,
 v1_2:(25-3*5)/2,
 synaq_fit_rf_02:first(range(10,99).filter(n=>sum(digits(n))===11&&Number(String(n).split('').reverse().join(''))-n===27)),
 synaq_fit2_rf_01:Math.abs((3*30+20*.5)-20*6),synaq_fit2_rf_02:(2*3/2)*(3*4/2),synaq_fit_rf_04:4+3,synaq_fit_rf_07:((50/2-5)/2)*((50/2+5)/2),synaq_fit2_rf_05:25/(1-1/4-1/3),synaq_fit2_rf_07:range(101,500).find(n=>[6,8,10].every(d=>n%d===1)),v1_14:(2*-1- -5)+(2*4-0),
 synaq_fit4_rf_08:range(2000,2999).filter(n=>n%10===7&&sum(digits(n))===15&&new Set(digits(n)).size===4).length,
 synaq_fit_rf_01:Math.max(...range(100,999).filter(n=>n%2===1&&n%5===0&&n%7===0)),synaq_fit_rf_05:(29-10*2)/(5-2),synaq_fit2_rf_03:range(100,999).filter(n=>sum(digits(n))===5).length,
 synaq_fit2_rf_09:Math.max(...range(1,14).map(a=>a*(15-a))),synaq_fit2_rf_11:range(1,100).find(n=>n*(n+1)/2>100),synaq_fit3_rf_02:400/(5-3),synaq_fit3_rf_03:Math.min(...range(1,72).filter(a=>72%a===0).map(a=>2*(a+72/a))),synaq_fit3_rf_04:Number(7n**2026n%10n),synaq_fit3_rf_08:5+6+1,synaq_fit3_rf_09:11/2-(-7/2),
 synaq_fit4_rf_02:first(range(10,99).filter(n=>sum(digits(n))===9&&n-Number(String(n).split('').reverse().join(''))===27)),synaq_fit4_rf_05:6*5/2-3*2/2,synaq_fit4_rf_06:2*(3*8+8)/(3-1),synaq_fit4_rf_07:12/(1-(1-1/3)*(1-1/2)),v1_6:2,v1_17:2210/.85-2210,v1_18:2*(2*3+2*7+3*7),v2_5:((441-15)/6)*((441-15)/6+5),v2_8:1944*(9/10-2/15-3/5),v2_14:Math.max(...range(-100,100).filter(x=>(1-2*x)/7-3 < -x-(2*x+3)/5)),v2_15:gcd(2*3*25*49*11,2*9*5*7*11*13),
 synaq_fit_rf_03:paths(4,3),synaq_fit2_rf_04:boyArrangements(),
 v1_16:product(Object.values(first(range(0,20).flatMap(m=>range(0,20-m).map(w=>({m,w,c:20-m-w}))).filter(x=>20*x.m+5*x.w+3*x.c===200)))),
 v3_12:first(range(-100,100).filter(x=>x!==4&&2-3/(4-x)!==0&&Math.abs(2-5/(2-3/(4-x))-7)<1e-10)),v3_20:(10/(3/11-(1-3/11)/4))*(1-3/11)*3/4,v3_24:product(range(1,8))/2**7,v3_25:1/(1/30-(1-6/30)/40),
 v4_9:first(range(1,9).filter(n=>[n,n+2,n+6,n+8].every(prime)))+8,v4_16:2*first(range(1,100).filter(k=>6*k-17>0&&6*k-17<2*k&&6*k-17+13*k===40)),v7_17:56/((1-2/7)*(1-2/3)-4/21),v2_29:range(1,2024).find(n=>n*n%2024===0),v3_27:7.5*(1+5/3),v3_29:100*(1-.9*.9),v4_18:32/(22-6)*(15+6+22),v4_23:10*(4+2.4*2)*1.5/(2.4*2-4),v5_14:60/(1/3-1/5-1/(18+45/60)),v5_19:130/2-1,v5_21:range(1,4).reduce(n=>2*n+3,8),v5_25:1000*(1-4.8*(1-.4)/30),v7_19:(sum([45,50,50,55])-100)/2,v7_30:sum(range(-100,100).filter(x=>Math.abs(Math.abs(2*x-20)-21)<=3)),v9_30:sum(digits(BigInt('7'.repeat(50))+BigInt('9'.repeat(50))))
};

test('all 78 reviewed RFMSH keys agree with independent arithmetic and finite-domain oracles',()=>{
 assert.deepEqual(new Set(Object.keys(expected)),new Set(review.records.map(q=>q.id)));
 for(const [id,answer] of Object.entries(expected)){
  assert.ok(Number.isFinite(answer),id);assert.ok(Math.abs(answer-Math.round(answer))<1e-8,id);
  assert.equal(BigInt(POOL.find(q=>q.id===id).answer),BigInt(Math.round(answer)),id);
 }
});
