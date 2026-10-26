const s=(id,kind,params)=>({id,kind,params});
// All24 remaining canonical nonvisual1.10 conditions, keys, full solutions and MCQs read.
export const TIME_SPECS=[
 s('fac63e35c3987993','minutes-to-hours',{total:311,choices:[[3,11],[5,11],[5,21],[31,1]]}),
 s('32feb8eb854a7dfb','spoken-time-before',{nextHour:9,before:20,choices:[[8,40],[9,40],[8,20],[9,20]]}),
 s('c9eae2203a8596e4','greatest-duration',{choices:[['fraction-hour',2],['seconds',1980],['minutes',35],['fraction-hour',3]]}),
 s('31aecf3b2509fd77','seconds-to-minutes',{total:1375,choices:[[22,5],[13,55],[137,5],[22,55]]}),
 s('9f3487add97fd929','correct-fraction-equality',{choices:[['day-hour',3,8],['year-month',4,4],['hour-minute',5,20],['century-year',4,400]]}),
 s('6f19de16e841512b','fraction-complement',{total:840,denominator:4}),
 s('27f9a0368d386ccf','reduce-by-fraction',{total:360,denominator:4,choices:[90,356,270,180]}),
 s('2f6b4e0339bb4348','weekly-session-duration',{sessions:3,hours:1,minutes:20}),
 s('601bafa8651d54b3','spoken-lesson-finish',{nextHour:10,before:15,duration:50,choices:[[10,35],[10,50],[9,35],[11,35]]}),
 s('b7e2cbb9da1bc7f0','days-to-weeks',{days:123,choices:[[17,4],[17,3],[12,3],[18,4]]}),
 s('04a043a376789641','age-century-inverse',{denominator:5,multiplier:4}),
 s('7061206a038614b6','age-sum-century-fraction',{denominator:5,sumMultiplier:4,grandRatio:3}),
 s('57d5705b0983f2bf','large-seconds-interval',{seconds:1500000,choices:[[17,18,'day'],[17,18,'hour'],[1,2,'day'],[1,2,'week']]}),
 s('e73eed412505f1a0','elapsed-remaining-fraction',{denominator:3,choices:[6,8,18,12]}),
 s('3bc44c27efc72782','concert-with-intermissions',{firstCount:7,firstMinutes:3,secondCount:3,secondMinutes:6,songs:2,choirDenominator:4,gapMinutes:3}),
 s('0e569804237d5e32','maximum-weekday-count',{days:366,weekday:1}),
 s('aa718b9905069318','overnight-spoken-duration',{nextHour:9,before:20,finishHour:3,finishMinute:30,choices:[[6,50],[7,10],[5,50],[6,10]]}),
 s('ef1562e1d7551995','slow-clock-delay',{periodHours:12,lossMinutes:1,targetDenominator:2}),
 s('f178c04680eff43f','last-day-weekday',{days:366,firstWeekday:3,choices:[3,4,5,2]}),
 s('0a4212ae73f1c581','greatest-clock-interval',{choices:[{type:'numeric-overnight',start:[23,10],end:[2,5]},{type:'spoken-before-half',nextHour:10,before:15,endHour:12},{type:'spoken-quarter-before',startHour:8,nextHour:11,before:15},{type:'numeric-day',start:[7,35],end:[10,25]}]}),
 s('ae04d9a9c07b228b','seconds-to-minutes',{total:1420,choices:[[23,40],[14,20],[23,4],[24,40]]}),
 s('a3adc469b6c4d409','spoken-evening-finish',{nextHour:8,before:15,hours:2,minutes:35,choices:[[22,20],[21,20],[23,20],[22,35]]}),
 s('8e3359e6e048185e','age-half-plus-century',{denominator:5}),
 s('7bbbf60cb049d3e5','first-march-weekday',{yearDays:365,februaryDays:28,firstWeekday:4,choices:[6,4,0,1]})
];
