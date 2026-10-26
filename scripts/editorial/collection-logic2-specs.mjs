// All20 saved conditions/FULLofficialsolutions/everyMCQ read, no newcapture.
// Only17/18 have capturedMCQkeys. The remaining18sourceAnswer fields are null.
export const collection='3cc70c0d-729a-40b5-94d4-d9508815555c';
export const logicSpecs=[
 [1,'discount-final-price',{variant:1,item:'спорт сөмкесі',price:12600,discount:25},'9450'],
 [2,'discount-final-price',{variant:2,item:'баскетбол добы',price:9400,discount:20},'7520'],
 [3,'discount-final-price',{variant:3,item:'роликті коньки',price:13600,discount:15},'11560'],
 [4,'discount-final-price',{variant:4,item:'кітап жиынтығы',price:10400,discount:50},'5200'],
 [5,'past-age-ratio-younger-now',{variant:1,older:'Нұрай',younger:'Арсен',gap:12,yearsAgo:5,factor:3},'11'],
 [6,'past-age-ratio-younger-now',{variant:2,older:'Сезім',younger:'Олжас',gap:9,yearsAgo:4,factor:2},'13'],
 [7,'three-age-consecutive-gaps-oldest',{variant:1,names:['Аян','Нұрия','Дәурен'],firstGap:2,secondGap:3,total:31},'13'],
 [8,'three-age-consecutive-gaps-oldest',{variant:2,names:['Айша','Самат','Інжу'],firstGap:5,secondGap:2,total:39},'16'],
 [9,'delayed-same-route-catch-time',{variant:1,slowSpeed:21,delay:2,fastSpeed:35},'3'],
 [10,'delayed-same-route-catch-time',{variant:2,slowSpeed:18,delay:4,fastSpeed:36},'4'],
 [11,'whole-train-through-tunnel',{variant:1,trainLength:120,speed:24,tunnelLength:816},'39'],
 [12,'whole-train-through-tunnel',{variant:2,trainLength:150,speed:15,tunnelLength:930},'72'],
 [13,'equal-path-roundtrip-average',{variant:1,firstSpeed:30,returnSpeed:90},'45'],
 [14,'equal-path-roundtrip-average',{variant:2,firstSpeed:25,returnSpeed:100},'40'],
 [15,'two-pipes-common-work-rate',{variant:1,firstHours:12,secondHours:24},'8'],
 [16,'two-pipes-common-work-rate',{variant:2,firstHours:20,secondHours:60},'15'],
 [17,'equal-up-down-percent-new-base',{variant:1,percent:30},'9% арзандады'],
 [18,'equal-up-down-percent-new-base',{variant:2,percent:50},'25% арзандады'],
 [19,'profit-percent-purchase-base',{variant:1,purchase:2400,sale:2760},'15'],
 [20,'profit-percent-purchase-base',{variant:2,purchase:4200,sale:6510},'55'],
].map(([number,kind,params,handExpected])=>({number,kind,params,handExpected}));
