const s=(id,kind,params)=>({id,kind,params});
// All24 remaining2.4 originals, full solutions, keys and allMCQ read.
export const DECIMAL_SPECS=[
 s('408c933a9a3b5ab6','meters-to-centimeters',{meters:8,factor:100}),
 s('996be3636cdc5ceb','divide-ten',{number:4800,divisor:10,choices:[480,48,4800,48000]}),
 s('e779146701b7c4cc','multiply-thousand',{number:36,multiplier:1000}),
 s('0b69f911bec914df','equal-divisions',{first:8300,firstDivisor:100,second:830,secondDivisor:10}),
 s('46af368b8cecaead','cancel-shared-zeros',{number:63000,divisor:700,commonFactor:100,choices:[90,900,9,9000]}),
 s('2c1bc487a032fd6e','unknown-thousand-factor',{number:46,product:46000,choices:[100,10,1000,10000]}),
 s('888e92331d9a76e9','reverse-power-chain',{firstFactor:10,secondFactor:100,result:83000}),
 s('7cc14712abc41592','largest-mixed-length',{choices:[{amount:38,unit:'дм'},{amount:380,unit:'см'},{amount:3850,unit:'мм'},{amount:4,unit:'м'}]}),
 s('d359df1a9c5e62b3','select-target-expression',{target:8000,choices:[[8000,'·',10],[800,'·',100],[80,'·',100],[80000,':',100]]}),
 s('0e561031d085ae74','kopecks-to-rubles',{kopecks:3700,choices:[{rubles:3700,kopecks:0},{rubles:37,kopecks:0},{rubles:370,kopecks:0},{rubles:3,kopecks:70}]}),
 s('0ec0ec9acee4f126','thousand-item-cost',{count:1000,price:70}),
 s('fbc10b8739ed80ea','unequal-power-products',{first:57,firstFactor:1000,second:5700,secondFactor:100}),
 s('df0fdec62af2c728','extra-coefficient-zero',{factors:[600,50,40],choices:[3,5,4,6]}),
 s('9a1d04712c007087','wrong-division-instead-multiplication',{factor:100,wrongResult:38,choices:[38,3800,38000,380000]}),
 s('288b0d01e2f3a102','two-factor-growth',{firstFactor:100,secondFactor:100,exampleFirst:3,exampleSecond:8}),
 s('13c80de48b86c8a6','multiplication-digit-length',{firstFactor:10,firstLength:4,secondFactor:100,secondLength:5,choices:[26,96,260,2600]}),
 s('cee773b2f49243c6','exact-trailing-zero-candidate',{factor:1000,zeros:6,choices:[700,70000,7070,7000]}),
 s('123ebaa9b541b770','correct-zero-equality',{choices:[{a:750,b:40,result:3000},{a:750,b:40,result:30000},{a:600,b:50,result:3000},{a:50,b:80,result:400}]}),
 s('0d3661c19ad277a8','recover-and-redivide',{firstDivisor:10,quotient:6700,secondDivisor:1000}),
 s('d0a74f45394cf797','divide-hundred',{number:70000,divisor:100,choices:[7,700,70,7000]}),
 s('44be58f439333300','unknown-dividend-zero',{divisor:10,quotient:307,choices:[3007,3700,3070,30700]}),
 s('847dfe9d85169777','round-product',{first:600,second:90}),
 s('a7cb2d948f58b3ed','mixed-length-zero-place',{meters:6,centimeters:7,rightCentimeters:670}),
 s('b968dabd9865e423','division-gap',{firstDivisor:1000,secondDivisor:10,gap:198,choices:[2000,19800,200,20000]})
];
