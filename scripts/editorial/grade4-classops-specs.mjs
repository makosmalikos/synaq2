const s=(id,kind,params)=>({id,kind,params});
// All23 remaining canonical1.4 source statements, keys and full solutions were read.
export const CLASSOPS_SPECS=[
 s('5066977e60eaed4e','digit-boundary',{digits:9,direction:'minimum'}),
 s('9743c0fe2973626a','class-arithmetic',{left:9,right:2,scale:100000,operation:'subtract'}),
 s('f250a9b0760ec1f6','class-arithmetic',{left:58,right:7,scale:1000,operation:'add'}),
 s('c64b1b564a35751b','digit-boundary',{digits:9,direction:'maximum',choices:[99999999,1000000000,999999999,999999990]}),
 s('cd70eaaa7396878e','remove-tens',{thousands:8,hundreds:3,tens:5,units:6}),
 s('f4fb50edb17fe706','target-expression',{target:80000,expressions:[[73000,'+',700],[8000,'+',8000],[96000,'−',16000],[90000,'−',6000]]}),
 s('3682a39f5f77d925','compare-populations',{firstMale:3180,firstFemale:3260,secondTotal:6600,secondMale:3190}),
 s('7c587007b9dbe013','remove-ten-thousands',{millions:8,tenThousands:4,hundreds:9,units:2}),
 s('2d4d9d66707e7ba7','distinct-boundary',{digits:9,direction:'minimum'}),
 s('62c0fad4d3d339e9','distinct-boundary',{digits:9,direction:'maximum',choices:[987654321,987654312,999999999,876543210]}),
 s('c851a47a70cf3493','compare-differences',{left:[7000000,400000],right:[6700000,80000]}),
 s('67850b36ae8e5f08','subtract-near-thousand',{start:853000}),
 s('20e98596f93a8c22','four-letter-cryptarithm',{multiplier:6,upperExclusive:500}),
 s('b5d423f092f80be6','operation-swap',{observed:68400,delta:2000}),
 s('e36824844591248d','minimum-digit-sum',{digits:9,sum:79,choices:[999999997,799999999,709999999,889999999]}),
 s('a1ae83fd27e1d1af','last-fixed-length-term',{start:210012,step:110011,digits:6,choices:[990099,870078,980089,999999]}),
 s('338e710e2809dde9','missing-subtrahend',{minuend:83624,subtrahendPattern:'??6?0',differencePattern:'28?34',choices:[64690,54690,54790,55690]}),
 s('054d124609a154eb','three-letter-cryptarithm',{multiplier:6}),
 s('b6e6f4f08c20b668','maximum-distinct-ending',{digits:9,ending:4,choices:[987653214,986753214,987653204,987654324]}),
 s('5d3015cdbd2c8c45','class-arithmetic',{left:5,right:4,scale:100000,operation:'add'}),
 s('7fc0a80f3ddd2b48','adjacent-digit-boundaries',{digits:9,choices:[10,0,90000001,1]}),
 s('df1242a8f8efb27d','prefix-cryptarithm',{multiplier:7}),
 s('ca5450025376088e','descending-term-index',{start:18400,step:400,target:14000,choices:[13,12,11,10]})
];
