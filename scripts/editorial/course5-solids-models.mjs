import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='course5-solids';
export const SOURCE_INDICES=[0, 1, 3, 4, 6, 9, 11, 12, 14, 17, 18, 19, 20, 21, 22, 27, 28, 29, 31, 32, 33, 34, 39, 43, 44, 46];
const refs=[{"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level1.json", "sourceId": "0ba43a12d70a744b"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level1.json", "sourceId": "3b207ca7cce74fdc"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level1.json", "sourceId": "4df02f9084cc44d6"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level1.json", "sourceId": "7453c9dd94671925"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level1.json", "sourceId": "e121ca0485d74ee5"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level2.json", "sourceId": "c9953db9a286aca2"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level2.json", "sourceId": "f2ca33783c679ba4"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level2.json", "sourceId": "fbeac7e14f948353"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level3.json", "sourceId": "5c374677aeb36abb"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level3.json", "sourceId": "fa3c309a80b33fc6"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-leveltest.json", "sourceId": "36853e979d098a55"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-leveltest.json", "sourceId": "b4f03fb56ee76b4c"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-leveltest.json", "sourceId": "ed2fe33a6cd80be3"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level1.json", "sourceId": "157438f2aad07cf5"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level1.json", "sourceId": "36262dc321cd95b9"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level1.json", "sourceId": "b96cdba0fff432d1"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level1.json", "sourceId": "c2ff8388de4f2d51"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level1.json", "sourceId": "e5341eb1a2f2e129"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level2.json", "sourceId": "1a81117c106ce18b"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level2.json", "sourceId": "30dc896e14ec6481"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level2.json", "sourceId": "4b6fa9eb6f26531b"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level2.json", "sourceId": "556fdcbd14e8fded"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level2.json", "sourceId": "ed18e30b001d8254"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level3.json", "sourceId": "3fd21ce8f9e46a3a"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level3.json", "sourceId": "a1f79abcadd42656"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-leveltest.json", "sourceId": "42fc4a77201767ae"}];
export const SPECS=[
  [
    "equal-edge",
    "Тікбұрышты қораптың табаны «KLMN», үстіңгі жағы «PQRS» деп белгіленген. Тік қырлар KP, LQ, MR, NS. KL қырына қай қыр міндетті түрде тең?",
    "SR",
    "Бір бағыттағы төрт қыр тең: KL, NM, PQ, SR. Басқа өлшемдер өзара тең болуы міндетті емес.",
    [],
    [],
    [
      "LM",
      "KP",
      "QR",
      "SR"
    ]
  ],
  [
    "front-area",
    "Қораптың ұзындығы «10», ені «6», биіктігі «4» см. Суретте ұзындығы мен биіктігі бойынша орналасқан алдыңғы жағы боялған. Боялған жақтың ауданы қанша?",
    "40",
    "Алдыңғы жақтың ауданы 10 × 4 = 40 см². Үсті 60, бүйірі 24 см²; алдыңғы периметрі 28 см.",
    [
      10,
      6,
      4
    ],
    [
      "Ұзындық, см",
      "Ені, см",
      "Биіктік, см"
    ],
    [
      "60",
      "24",
      "40",
      "28"
    ]
  ],
  [
    "net-dimensions",
    "Қораптың жазбасы бірлік торда салынған: бір тор қабырғасы «1» см. Жазбаға қарап ұзындығын, енін және биіктігін осы ретпен тап.",
    "6, 4, 3",
    "Жолақтағы жақтар 6 × 3 және 4 × 3. Қақпақтар 6 × 4. Демек өлшемдер 6, 4, 3 см. Толық жазбаның 20 × 11 өлшемдерін қорап өлшемдерімен шатастырма.",
    [
      1
    ],
    [
      "Бір тор қабырғасы, см"
    ],
    [
      "6, 4, 3",
      "20, 11, 3",
      "6, 4, 4",
      "6, 3, 1"
    ]
  ],
  [
    "edge-sum",
    "Ұзындығы «9», ені «5», биіктігі «4» см қораптың барлық қырларының ұзындықтарының қосындысын тап.",
    "72",
    "Әр өлшем төрт рет кездеседі: 4 × (9 + 5 + 4) = 72 см.",
    [
      9,
      5,
      4
    ],
    [
      "Ұзындық, см",
      "Ені, см",
      "Биіктік, см"
    ]
  ],
  [
    "cube-surface",
    "Қыры «5» см кубтың жазбасы көрсетілген. Осы кубтың толық бетінің ауданын тап.",
    "150",
    "Кубтың алты жағы бар. Бір жағы 25 см². Толық беті 6 × 25 = 150 см².",
    [
      5
    ],
    [
      "Куб қыры, см"
    ]
  ],
  [
    "net-surface",
    "Бір торының қабырғасы «1» см болатын торда қораптың жазбасы салынған. Барлық бетінің ауданын тап.",
    "122",
    "Жазба өлшемдерінен қораптың қырлары 7, 4, 3 см. Үш жақтың аудандары 28, 21, 12. Екі еселегенде 2 × (28 + 21 + 12) = 122 см².",
    [
      1
    ],
    [
      "Бір тор қабырғасы, см"
    ]
  ],
  [
    "shortest-edge-route",
    "Кішкентай робот қырлары «8», «5», «3» см қораптың бір төбесінен оған қарама-қарсы төбесіне тек қырлармен жүреді. Ең қысқа жол қанша?",
    "16",
    "Үш бағыттың әрқайсысынан кемінде бір қыр өту керек. Қысқа жол 8 + 5 + 3 = 16 см.",
    [
      8,
      5,
      3
    ],
    [
      "Ұзындық, см",
      "Ені, см",
      "Биіктік, см"
    ],
    [
      "16",
      "32",
      "64",
      "40"
    ]
  ],
  [
    "strip-volume",
    "Қорап жазбасындағы төрт бүйір жақтың тұтас жолағы «30» см, биіктігі «5» см. Табанның бір қабырғасы «4» см. Қораптың көлемін тап.",
    "220",
    "Табан қабырғаларының қосындысы 30 ÷ 2 = 15 см. Екіншісі 15 − 4 = 11 см. Көлемі 11 × 4 × 5 = 220 см³.",
    [
      30,
      5,
      4
    ],
    [
      "Төрт жақ жолағы, см",
      "Биіктік, см",
      "Табан ені, см"
    ]
  ],
  [
    "face-areas-edge-sum",
    "Қораптың алдыңғы, үстіңгі және оң жақтарының аудандары тиісінше «40», «32», «20» см². Барлық қырларының ұзындықтарын қос.",
    "68",
    "Ұзындықтың квадраты 40 × 32 ÷ 20 = 64. Ұзындығы 8, ені 4, биіктігі 5 см. Қырлар қосындысы 4 × (8 + 4 + 5) = 68 см.",
    [
      40,
      32,
      20
    ],
    [
      "Алдыңғы аудан, см²",
      "Үстіңгі аудан, см²",
      "Бүйір аудан, см²"
    ]
  ],
  [
    "open-box-volume",
    "Өлшемі «26» × «18» см картонның төрт бұрышынан қабырғасы «4» см шаршы қиылды. Жиектері бүктеліп, қақпақсыз қорап жасалды. Көлемі қандай?",
    "720",
    "Түбі 26 − 8 = 18 және 18 − 8 = 10 см. Биіктігі 4 см. Көлемі 18 × 10 × 4 = 720 см³.",
    [
      26,
      18,
      4
    ],
    [
      "Картон ұзындығы, см",
      "Картон ені, см",
      "Қиық қыры, см"
    ]
  ],
  [
    "net-perimeter",
    "Қыры «4» см кубтың суреттегі жазбасының сыртқы шекарасының ұзындығын тап.",
    "56",
    "Алты шаршыда 24 қабырға, бес ортақ қабырғада 10 қабырға іште қалады. Сыртта 14. Периметр 14 × 4 = 56 см.",
    [
      4
    ],
    [
      "Куб қыры, см"
    ]
  ],
  [
    "joined-cubes-surface",
    "Қыры «3» см болатын «5» кубты суреттегідей бір қабатты Г тәрізді пішінге жапсырды. Фигураның толық бетінің ауданы қанша?",
    "198",
    "Бес кубта 30 жақ бар. Төрт жанасу сегіз жақты іште қалдырады. Сыртқы жақ саны 22, бір жақтың ауданы 9. Толық бет 22 × 9 = 198 см².",
    [
      3,
      5
    ],
    [
      "Куб қыры, см",
      "Куб саны"
    ],
    [
      "198",
      "270",
      "216",
      "180"
    ]
  ],
  [
    "opposite-face",
    "Қораптың табаны «TUVW», үсті «XYZA». Тік қырлары TX, UY, VZ, WA. TUYX алдыңғы жағына қай жақ қарама-қарсы?",
    "WVZA",
    "Алдыңғы жақтағы төбелер T, U, Y, X. Оларға ортақ төбесі жоқ артқы жақ W, V, Z, A болады.",
    [],
    [],
    [
      "UVZY",
      "WVZA",
      "TWAX",
      "XYZA"
    ]
  ],
  [
    "cut-perimeter-sum",
    "Ұзындығы «12», ені «7» см қағаз еніне параллель қызыл сызықпен екі тіктөртбұрышқа қиылды. Екі бөліктің периметрлерінің қосындысы қанша?",
    "52",
    "Бастапқы периметр 2 × (12 + 7) = 38 см. Қию шекарасы екі рет қосылады: 2 × 7 = 14 см. Қосындысы 52 см.",
    [
      12,
      7
    ],
    [
      "Ұзындық, см",
      "Ені, см"
    ]
  ],
  [
    "triangle-reassembly-area",
    "Қабырғасы «10» см шаршы екі диагональмен төрт тең үшбұрышқа бөлінді. Осындай екі үшбұрыштан жаңа шаршы құрастырылды. Жаңа шаршының ауданы қанша?",
    "50",
    "Бастапқы аудан 100 см². Бір үшбұрыш 25, екеуі 50 см². Жаңа шаршының ауданы 50 см².",
    [
      10
    ],
    [
      "Шаршы қабырғасы, см"
    ],
    [
      "25",
      "50",
      "100",
      "20"
    ]
  ],
  [
    "net-surface",
    "Жазбадағы қораптың ұзындығы «7», ені «4», биіктігі «3» см. Жазбаның, яғни кеткен картонның ауданын тап.",
    "122",
    "Жақтар жұп-жұбымен тең. Аудан 2 × (7 × 4 + 7 × 3 + 4 × 3) = 122 см².",
    [
      7,
      4,
      3
    ],
    [
      "Ұзындық, см",
      "Ені, см",
      "Биіктік, см"
    ],
    [
      "122",
      "61",
      "84",
      "42"
    ]
  ],
  [
    "triomino-count",
    "Суреттегі торкөзді фигураны әрқайсысы «3» тордан тұратын бірдей бұрыштарға бөлуге болады. Неше бөлік шығады?",
    "9",
    "Қатарларда 7, 6, 5, 4, 3, 2 тор бар, барлығы 27. Әр бөлік 3 тордан: 27 ÷ 3 = 9. Бұрыштармен толық жабу бөлек тексерілді.",
    [
      3
    ],
    [
      "Бір бөліктегі тор саны"
    ]
  ],
  [
    "net-perimeter",
    "Қыры «6» см кубтың жазбасын сыртқы шекарасы бойымен қиып алады. Қиюға кеткен шекара ұзындығы қанша?",
    "84",
    "Шекарада 14 бірлік қабырға бар. Периметр 14 × 6 = 84 см.",
    [
      6
    ],
    [
      "Куб қыры, см"
    ]
  ],
  [
    "frame-hole-area",
    "Төрт бірдей «8» × «3» см тіктөртбұрыш суреттегідей шаршы жиек құрайды. Ортадағы шаршы тесіктің ауданы қандай?",
    "25",
    "Үлкен шаршы қабырғасы 11 см, ауданы 121. Төрт тіктөртбұрыш ауданы 96. Тесік ауданы 121 − 96 = 25 см². Оның қабырғасы 8 − 3 = 5 см.",
    [
      8,
      3
    ],
    [
      "Тіктөртбұрыш ұзындығы, см",
      "Тіктөртбұрыш ені, см"
    ]
  ],
  [
    "count-squares",
    "Тіктөртбұрыш «4» қатар және «5» баған бірдей шаршыға бөлінген. Барлық өлшемдегі шаршыларды қосып сана.",
    "40",
    "Бірлік шаршы 20, 2 × 2 шаршы 12, 3 × 3 шаршы 6, 4 × 4 шаршы 2. Барлығы 40.",
    [
      4,
      5
    ],
    [
      "Қатар саны",
      "Баған саны"
    ]
  ],
  [
    "stair-perimeter",
    "Суреттегі баспалдақтың ені мен биіктігі «5» тордан. Бір тор қабырғасы «3» см. Фигураның периметрін тап.",
    "60",
    "Төменгі және сол жақ 5-тен, баспалдақ 5 көлденең және 5 тік қабырғадан тұрады. Шекара 20 бірлік. Периметр 20 × 3 = 60 см.",
    [
      5,
      3
    ],
    [
      "Баспалдақ саны",
      "Бір тор қабырғасы, см"
    ]
  ],
  [
    "square-open-box-volume",
    "Қабырғасы «24» см шаршы картонның әр бұрышынан қыры «4» см шаршы қиылды. Жиектері бүктеліп, қақпақсыз қорап жасалды. Көлемін тап.",
    "1024",
    "Түбінің қабырғасы 24 − 8 = 16 см, биіктігі 4 см. Көлемі 16 × 16 × 4 = 1024 см³.",
    [
      24,
      4
    ],
    [
      "Картон қабырғасы, см",
      "Қиық қыры, см"
    ]
  ],
  [
    "cut-cuboid-edges",
    "Қораптың ұзындығы «8», ені «5», биіктігі «4» см. Суреттегі жазба шығу үшін қораптың кейбір қырлары қиылған. Қиылған қырлар ұзындығының қосындысын тап.",
    "40",
    "Барлық қырлар 68 см. Ішкі бүктеу сызықтары 3 × 4 + 2 × 8 = 28 см. Қиылғаны 68 − 28 = 40 см. Жазба периметрі 80 см.",
    [
      8,
      5,
      4
    ],
    [
      "Ұзындық, см",
      "Ені, см",
      "Биіктік, см"
    ]
  ],
  [
    "stair-reassembly-side",
    "«18» × «8» см қағаз қызыл сатылы сызықпен екі бөлікке бөлінді. Осы бөліктерден қабаттаспай, бос орынсыз шаршы жасалды. Оның қабырғасы неше сантиметр?",
    "12",
    "Аудан сақталады: 18 × 8 = 144 см². 12 × 12 = 144, демек шаршы қабырғасы 12 см. Оң бөлікті 6 см солға, 4 см жоғары жылжыту осы шаршыны береді.",
    [
      18,
      8
    ],
    [
      "Бастапқы ұзындық, см",
      "Бастапқы ені, см"
    ],
    [
      "26",
      "13",
      "12",
      "144"
    ]
  ],
  [
    "count-rectangles",
    "Суреттегі тор «3» қатар және «5» бағаннан тұрады. Шаршыларды да қосып, барлық тіктөртбұрыштарды сана.",
    "90",
    "Төрт көлденең сызықтан екеуін 6 тәсілмен, алты тік сызықтан екеуін 15 тәсілмен аламыз. Барлығы 6 × 15 = 90.",
    [
      3,
      5
    ],
    [
      "Қатар саны",
      "Баған саны"
    ]
  ],
  [
    "three-face-width-volume",
    "Қорап жазбасында биіктігі «7» см, тар жақтың ені «6» см. Тар, кең, тар үш жақтың жалпы ұзындығы «27» см. Қораптың көлемін тап.",
    "630",
    "Кең жақ ені 27 − 6 − 6 = 15 см. Көлем 15 × 6 × 7 = 630 см³.",
    [
      7,
      6,
      27
    ],
    [
      "Биіктік, см",
      "Тар жақ ені, см",
      "Үш жақ ұзындығы, см"
    ]
  ]
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),txt=(id,x,y,s,size=18)=>`<text id="${id}" x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#29486d">${esc(s)}</text>`,rect=(id,x,y,w,h,fill='#bed5f3')=>`<rect id="${id}" x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#8aa8cc"/>`;
export function draw(i){const g=SOURCE_INDICES[i],[,,,,v,labels]=SPECS[i];let body='',start=250,geom={};
 function net(a,b,h,grid=false){const s=Math.min(300/(2*a+2*b),190/(2*b+h)),x=25,y=25+b*s,widths=[a,b,a,b];let xx=x;geom={type:'cuboid-net',dimensions:[a,b,h]};widths.forEach((w,j)=>{body+=rect('net-face-'+j,xx,y,w*s,h*s,j%2?'#cfc3ee':'#bed5f3');xx+=w*s;});body+=rect('net-face-4',x,y-b*s,a*s,b*s,'#b4e3d3')+rect('net-face-5',x,y+h*s,a*s,b*s,'#b4e3d3');if(grid)for(let j=0;j<6;j++){const rw=j<4?widths[j]:a,rh=j<4?h:b,rx=j<4?x+widths.slice(0,j).reduce((n,k)=>n+k,0)*s:x,ry=j<4?y:j===4?y-b*s:y+h*s;for(let k=1;k<rw;k++)body+=`<line id="grid-v-${j}-${k}" x1="${rx+k*s}" y1="${ry}" x2="${rx+k*s}" y2="${ry+rh*s}" stroke="#9fb3ce"/>`;for(let k=1;k<rh;k++)body+=`<line id="grid-h-${j}-${k}" x1="${rx}" y1="${ry+k*s}" x2="${rx+rw*s}" y2="${ry+k*s}" stroke="#9fb3ce"/>`;}}
 function cells(c,unit=1){geom={type:'cells',cells:c,unit};const w=Math.max(...c.map(p=>p[0]))+1,h=Math.max(...c.map(p=>p[1]))+1,s=Math.min(290/w,185/h);c.forEach(([x,y],j)=>body+=rect('cell-'+j,30+x*s,25+y*s,s,s));}
 if([0,1,4,11,14,20].includes(g)){const dims=g===0?[9,5,4]:g===20?[8,4,5]:g===14?[8,4,5]:v;const[a,b,h]=dims,s=Math.min(270/(a+.4*b),155/(h+.3*b)),p=(x,y,z)=>[35+s*(x+.4*y),200-s*(z+.3*y)];geom={type:'cuboid',dimensions:dims};for(const[id,ps,color]of[['front',[[0,0,0],[a,0,0],[a,0,h],[0,0,h]],g===1?'#7faee9':'#bed5f3'],['side',[[a,0,0],[a,b,0],[a,b,h],[a,0,h]],'#cfc3ee'],['top',[[0,0,h],[a,0,h],[a,b,h],[0,b,h]],'#b4e3d3']])body+=`<polygon id="${id}" points="${ps.map(t=>p(...t).join(',')).join(' ')}" fill="${color}" stroke="#7b98be"/>`;if([0,20].includes(g)){body+=`<polyline id="hidden-edges" points="${[p(0,0,0),p(0,b,0),p(a,b,0)].map(t=>t.join(',')).join(' ')}" stroke="#7b98be" fill="none" stroke-dasharray="4 4"/><line id="hidden-vertical" x1="${p(0,b,0)[0]}" y1="${p(0,b,0)[1]}" x2="${p(0,b,h)[0]}" y2="${p(0,b,h)[1]}" stroke="#7b98be" stroke-dasharray="4 4"/>`;const letters=g===0?'KLMNPQRS':'TUVWXYZA',points=[[0,0,0],[a,0,0],[a,b,0],[0,b,0],[0,0,h],[a,0,h],[a,b,h],[0,b,h]];points.forEach((pt,j)=>{const[x,y]=p(...pt);body+=txt('vertex-'+j,x+(j===0||j===4?-10:8),y+(j<4?18:-8),letters[j],16);});}}
 else if([3,9,12,27,39,46].includes(g)){const dims=g===3?[6,4,3]:g===9?[7,4,3]:g===12?[11,4,5]:g===46?[15,6,7]:v;net(...dims,[3,9].includes(g));}
 else if([6,18,29].includes(g)){const c=[[0,0],[1,0],[1,1],[2,1],[2,2],[3,2]];cells(c,v[0]);}
 else if([17,34].includes(g)){const[a,b,cut]=g===17?v:[v[0],v[0],v[1]],s=Math.min(295/a,190/b);geom={type:'cut-card',dimensions:[a,b,cut]};body+=rect('card',30,25,a*s,b*s);[[0,0],[a-cut,0],[0,b-cut],[a-cut,b-cut]].forEach(([x,y],j)=>body+=rect('cut-'+j,30+x*s,25+y*s,cut*s,cut*s,'#f6e2b0'));}
 else if(g===19){cells([[0,0],[1,0],[2,0],[0,1],[0,2]],v[0]);body+=txt('layer-caption',180,220,'Бір қабат: әр тор — бір куб',15);}
 else if(g===21){const[a,b]=v,s=Math.min(290/a,180/b);geom={type:'cut-rectangle',dimensions:v};body+=rect('paper',30,25,a*s,b*s)+`<line id="cut-line" x1="${30+a*s*.4}" y1="25" x2="${30+a*s*.4}" y2="${25+b*s}" stroke="#df6765" stroke-width="3"/>`;}
 else if(g===22){const a=v[0],s=180/a;geom={type:'diagonal-square',side:a};body+=rect('square',85,25,180,180)+`<polygon id="quarter" points="85,205 265,205 175,115" fill="#f6e2b0"/><path id="diagonals" d="M85 25L265 205M265 25L85 205" stroke="#df6765" stroke-width="3" fill="none"/>`;}
 else if(g===28){cells([7,6,5,4,3,2].flatMap((n,y)=>Array.from({length:n},(_,x)=>[x,y])));}
 else if(g===31){const[a,b]=v,s=180/(a+b);geom={type:'frame',dimensions:v};[[b,0,a,b],[a,b,b,a],[0,a,a,b],[0,0,b,a]].forEach(([x,y,w,h],j)=>body+=rect('frame-'+j,85+x*s,25+y*s,w*s,h*s,j%2?'#cfc3ee':'#bed5f3'));}
 else if([32,44].includes(g)){const[rows,cols]=v;cells(Array.from({length:rows*cols},(_,j)=>[j%cols,Math.floor(j/cols)]));}
 else if(g===33){cells(Array.from({length:v[0]},(_,y)=>Array.from({length:y+1},(_,x)=>[x,y])).flat(),v[1]);}
 else if(g===43){const[a,b]=v,s=290/a;geom={type:'stair-cut',dimensions:v,cut:[[a/3,0],[a/3,b/2],[2*a/3,b/2],[2*a/3,b]]};body+=rect('paper',30,25,a*s,b*s)+`<polyline id="stair-cut" points="${geom.cut.map(([x,y])=>[30+x*s,25+y*s].join(',')).join(' ')}" stroke="#df6765" stroke-width="3" fill="none"/>`;}
 const cols=v.length>5?2:1;v.forEach((x,j)=>{const xx=cols===1?180:90+j%2*180,yy=start+Math.floor(j/cols)*52;body+=txt('input-'+j,xx,yy,labels[j],14)+txt('value-'+j,xx,yy+25,x,22);});const height=start+Math.ceil(v.length/cols)*52+15;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">Геометриялық есеп сызбасы</title><metadata id="geometry">${esc(JSON.stringify(geom))}</metadata><metadata id="actual-inputs">${esc(JSON.stringify(v))}</metadata><rect width="360" height="${height}" rx="18" fill="#f6f9ff"/>${body}</svg>\n`;}
function row(s,i){const[k,statement,answer,solution,,,options]=s,ref=refs[i],source=JSON.parse(fs.readFileSync(new URL('../../'+ref.sourceFile,import.meta.url))).questions.find(q=>q.id===ref.sourceId),image=`/figures/synaq-editions/${name}-${i}-native.svg`;assert.equal(source.options?.length||0,options?.length||0);return{editionId:`${name}-${i}`,modelId:`${name}-${k}`,grade:5,topic:[0,3,18,19,20,28,29,32,33,44].includes(SOURCE_INDICES[i])?'spat':'geo',difficulty:'medium',minimumPlan:'pro',params:{number:i},sourceRefs:[ref],sourceAnswerAvailability:'all_saved_text_official_solutions_options_and_complete_givens_recomputed',adaptationChanges:['26 full source/new conditions official/new solutions and all source/new choices read. New explicit data, labels, native grids and solids preserve required geometric reasoning. Source12 saved image unavailable; its complete official solution records22/4/3 and the reconstruction is disclosed in review.','26 own SVGs replace saved artwork, with exact cuboid nets polygons grids cutouts and congruent-triomino tiling. All previews inspected343px; same author computational review, not another human. Standard+ local only.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,...(options?{options}:{}),image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const i=Number(r.editionId.split('-').at(-1));assert.ok(SPECS[i]);assert.equal(canonicalEdition(r),canonicalEdition(row(SPECS[i],i)),'Unreviewed shifts/sets task');return{answer:r.answer,checks:['actual units remainders Venn cells checked','own native SVG','Standard+ only']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){SPECS.forEach((_,i)=>fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${i}-native.svg`,import.meta.url),draw(i)));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'26 grade5 geometry and solids localStandard+' ,sourceOccurrences:26,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions},null,2)+'\n');console.log({authored:26,choices:editions.reduce((s,r)=>s+(r.options?.length||0),0)});}
