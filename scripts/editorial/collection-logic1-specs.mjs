// All20 canonical conditions and FULL official solutions read. No MCQs exist.
// sourceAnswer is null for all20: do not claim that an answer key was captured.
export const collection='3106530b-4359-419d-93d1-29624fdc3976';
export const logicSpecs=[
 [1,'future-age-fixed-difference',{variant:1,child:'Айсұлу',adult:'әкесі',adultAge:42,childAge:10,factor:3},'6'],
 [2,'future-age-fixed-difference',{variant:2,child:'Әлия',adult:'анасы',adultAge:44,childAge:8,factor:3},'10'],
 [3,'future-age-fixed-difference',{variant:3,child:'Данияр',adult:'әкесі',adultAge:46,childAge:6,factor:3},'14'],
 [4,'future-age-fixed-difference',{variant:4,child:'Меруерт',adult:'анасы',adultAge:39,childAge:13,factor:2},'13'],
 [5,'fixed-members-age-sum',{variant:1,people:3,sum:87,years:6,reference:'now_to_future'},'105'],
 [6,'fixed-members-age-sum',{variant:2,people:3,sum:64,years:5,reference:'past_to_now'},'79'],
 [7,'fixed-members-age-sum',{variant:3,people:4,sum:96,years:7,reference:'now_to_future'},'124'],
 [8,'fixed-members-age-sum',{variant:4,people:5,sum:143,years:4,reference:'past_to_now'},'163'],
 [9,'opposing-simultaneous-time',{variant:1,firstSpeed:52,secondSpeed:68,distance:360},'3'],
 [10,'opposing-simultaneous-distance',{firstSpeed:16,secondSpeed:12,hours:5},'140'],
 [11,'opposing-simultaneous-time',{variant:2,firstSpeed:32,secondSpeed:46,distance:468},'6'],
 [12,'opposing-simultaneous-time',{variant:3,firstSpeed:48,secondSpeed:72,distance:840},'7'],
 [13,'fixed-person-days',{variant:1,firstWorkers:15,firstDays:12,newWorkers:5,activity:'көрме сөрелерін құрастыру'},'36'],
 [14,'fixed-person-days',{variant:2,firstWorkers:10,firstDays:6,newWorkers:3,activity:'бірдей көшеттерді отырғызу'},'20'],
 [15,'fixed-person-days',{variant:3,firstWorkers:14,firstDays:9,newWorkers:6,activity:'бақтағы ағаштарды бұтау'},'21'],
 [16,'fixed-person-days',{variant:4,firstWorkers:16,firstDays:15,newWorkers:10,activity:'жиһаздың бір тапсырысын дайындау'},'24'],
 [17,'inverse-percent-whole',{variant:1,percent:18,part:81},'450'],
 [18,'inverse-percent-whole',{variant:2,percent:20,part:160},'800'],
 [19,'inverse-percent-whole',{variant:3,percent:25,part:365},'1460'],
 [20,'inverse-percent-whole',{variant:4,percent:35,part:224},'640'],
].map(([number,kind,params,handExpected])=>({number,kind,params,handExpected}));
