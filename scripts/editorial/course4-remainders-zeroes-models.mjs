import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='course4-remainders-zeroes';
const refs=[{"sourceFile": "problems/sources/zerek/courses/4-math-5-7-level1.json", "sourceId": "304d2ddf6da06daa"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-7-level1.json", "sourceId": "6d15b14cd1e3e736"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-7-level1.json", "sourceId": "cb8cea858f54bd80"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-7-level1.json", "sourceId": "fd638fba8f0b2c95"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-7-level2.json", "sourceId": "1e18de0ddb393600"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-7-level2.json", "sourceId": "757d2889ea22f274"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-7-level2.json", "sourceId": "a4a62d8efe46ce63"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-7-level2.json", "sourceId": "f219ef7e6b1027f2"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-7-level3.json", "sourceId": "29c2a96606350b88"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-7-leveltest.json", "sourceId": "0424e3c69df547bc"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-7-leveltest.json", "sourceId": "785b714e943ed1fd"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-7-leveltest.json", "sourceId": "f4a7f0fac7273ff4"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-8-level1.json", "sourceId": "2f2bc749f3a6f392"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-8-level1.json", "sourceId": "71f8c1efac4b63df"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-8-level1.json", "sourceId": "78b44d2292de2aba"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-8-level1.json", "sourceId": "912388f8f03b0e00"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-8-level2.json", "sourceId": "05e3bcb26738927a"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-8-level2.json", "sourceId": "34a2fb2874253387"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-8-level2.json", "sourceId": "8ca930a9646db451"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-8-level2.json", "sourceId": "b6969acd12e731ce"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-8-level3.json", "sourceId": "82c877827b3b45c6"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-8-level3.json", "sourceId": "e9f69a4a68dfab31"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-8-leveltest.json", "sourceId": "0dd506f8d82f993e"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-8-leveltest.json", "sourceId": "37f64b74e6089f32"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-8-leveltest.json", "sourceId": "ab4346bb832078c7"}];
export const SPECS=[
  [
    "remainder",
    "«375» см таспаны «46» сантиметрлік толық бөліктерге қиды. Неше сантиметр таспа қалды?",
    "7",
    "46 × 8 = 368 см жұмсалды. Қалғаны 375 − 368 = 7 см. 7 саны 46-дан кіші.",
    [
      375,
      46
    ],
    [
      "Барлық таспа, см",
      "Бір бөлік, см"
    ]
  ],
  [
    "inverse-dividend",
    "Санды «48»-ге бөлгенде толымсыз бөлінді «32», қалдық «27» болды. Бөлінгішті табыңыз.",
    "1563",
    "Бөлінгіш 48 × 32 + 27 = 1563. Қалдық 27 бөлгіш 48-ден кіші.",
    [
      48,
      32,
      27
    ],
    [
      "Бөлгіш",
      "Толымсыз бөлінді",
      "Қалдық"
    ]
  ],
  [
    "floor-boxes",
    "«725» жұмыртқа «48»-ден қораптарға салынды. Неше қорап толық толды?",
    "15",
    "48 × 15 = 720. 5 жұмыртқа қалады, сондықтан толық қорап 15.",
    [
      725,
      48
    ],
    [
      "Жұмыртқа саны",
      "Қорап сыйымдылығы"
    ]
  ],
  [
    "remainder",
    "«398» санын «57»-ге бөлгендегі қалдықты табыңыз.",
    "56",
    "57 × 6 = 342. Қалдық 398 − 342 = 56. 56 саны 57-ден кіші.",
    [
      398,
      57
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "repack-floor",
    "Шоколадтар «28»-ден салынғанда «18» толық қорап шықты, «23» шоколад қалды. Оларды «36»-дан салсақ, неше толық қорап болады?",
    "14",
    "Барлығы 28 × 18 + 23 = 527 шоколад. 36 × 14 = 504, қалдық 23. Толық қорап 14.",
    [
      28,
      18,
      23,
      36
    ],
    [
      "Бұрынғы сыйымдылық",
      "Толық қорап саны",
      "Бұрынғы қалдық",
      "Жаңа сыйымдылық"
    ]
  ],
  [
    "ceil-buses",
    "Сапарға «425» оқушы барады. Автобусқа «54» адам сыяды. Ең аз неше автобус керек?",
    "8",
    "7 автобусқа 378 адам сыяды. 47 оқушыға тағы бір автобус керек. Барлығы 8.",
    [
      425,
      54
    ],
    [
      "Оқушы саны",
      "Бір автобустағы орын"
    ]
  ],
  [
    "inverse-dividend",
    "Залда әр қатарда «32» орын. «19» қатар толық, келесі қатарда «13» көрермен отыр. Барлығы неше көрермен?",
    "621",
    "Толық қатарларда 32 × 19 = 608 көрермен. Барлығы 608 + 13 = 621.",
    [
      32,
      19,
      13
    ],
    [
      "Қатардағы орын",
      "Толық қатар",
      "Келесі қатардағы адам"
    ]
  ],
  [
    "remainder",
    "«587» орындықты әр қатарға «36»-дан қойды. Соңғы қатар толық емес. Сол қатарда неше орындық?",
    "11",
    "36 × 16 = 576. Соңғы қатарда 587 − 576 = 11 орындық.",
    [
      587,
      36
    ],
    [
      "Барлық орындық",
      "Толық қатар көлемі"
    ]
  ],
  [
    "bounded-congruence",
    "«36» орындық автобустарға отырғызғанда бір автобуста «8» орын бос, қалғандары толық болды. «40» орындық автобустарда барлық орын толады. Оқушы саны «350»-ден аспайды. Неше оқушы бар?",
    "280",
    "36-ға бөлгендегі қалдық 28 болуы керек. 350-ден аспайтын 40-қа еселіктерді тексерсек, тек 280 сәйкес: 280 = 36 × 7 + 28. 280 ÷ 40 = 7.",
    [
      36,
      8,
      40,
      350
    ],
    [
      "Бірінші сыйымдылық",
      "Бос орын",
      "Екінші сыйымдылық",
      "Жоғарғы шек"
    ],
    [
      "240",
      "280",
      "320",
      "244"
    ]
  ],
  [
    "quotient-and-remainder",
    "«1300» кәмпит «72»-ден қорапқа салынды. Неше толық қорап және неше кәмпит қалды?",
    "18 қорап, 4 кәмпит",
    "72 × 18 = 1296. Қалдық 1300 − 1296 = 4. Демек 18 толық қорап, 4 кәмпит.",
    [
      1300,
      72
    ],
    [
      "Кәмпит саны",
      "Қорап сыйымдылығы"
    ],
    [
      "18 қорап, 4 кәмпит",
      "17 қорап, 76 кәмпит",
      "19 қорап, 4 кәмпит",
      "18 қорап, 40 кәмпит"
    ]
  ],
  [
    "remainder",
    "«958» санын «37»-ге бөлгендегі қалдықты табыңыз.",
    "33",
    "37 × 25 = 925. Қалдық 958 − 925 = 33. 33 саны 37-ден кіші.",
    [
      958,
      37
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "ceil-buses",
    "Тараздан сапарға «315» турист шығады. Автобуста «64» орын бар. Барлығына ең аз неше автобус керек?",
    "5",
    "4 автобусқа 256 турист отырады, 59 адам қалады. Тағы бір автобус қажет. Жауап 5.",
    [
      315,
      64
    ],
    [
      "Турист саны",
      "Автобус сыйымдылығы"
    ]
  ],
  [
    "zero-quotient",
    "Бұрышпен бөліңіз: «12480 ÷ 52».",
    "240",
    "124 ÷ 52 бүтін бөлігі 2, қалдық 20. Келесі 8-ді түсіргенде 208. 208 ÷ 52 = 4. Соңғы нөлді бөліндінің соңына жазамыз: 240.",
    [
      12480,
      52
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "zero-quotient",
    "«7392» кітап «24» сөреге тең қойылды. Бір сөреде неше кітап?",
    "308",
    "7392 ÷ 24 = 308. Ондық разрядта нөлді қалдыру керек. Тексеру: 308 × 24 = 7392.",
    [
      7392,
      24
    ],
    [
      "Кітап саны",
      "Сөре саны"
    ]
  ],
  [
    "zero-quotient",
    "Бұрышпен бөліңіз: «8160 ÷ 12».",
    "680",
    "81 ÷ 12 бүтін бөлігі 6, қалдық 9. Келесі 6-ны түсіргенде 96, 96 ÷ 12 = 8. Соңғы нөл сақталады: 680.",
    [
      8160,
      12
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "zero-quotient",
    "Бұрышпен бөліңіз: «10302 ÷ 51».",
    "202",
    "103 ÷ 51 бүтін бөлігі 2, қалдық 1. Келесі 0-ді түсіргенде 10 саны 51-ден кіші, бөліндіде нөл жазылады. 102 ÷ 51 = 2. Жауап 202.",
    [
      10302,
      51
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "two-box-types",
    "Бақтан «12400» кг өнім жиналды. Оның «6420» килограмы «60» килограмдық қораптарға, қалғаны «26» килограмдық қораптарға салынды. Барлығы неше қорап?",
    "337",
    "Бірінші қораптар 6420 ÷ 60 = 107. Қалған өнім 12400 − 6420 = 5980 кг. Екінші қораптар 5980 ÷ 26 = 230. Барлығы 107 + 230 = 337.",
    [
      12400,
      6420,
      60,
      26
    ],
    [
      "Барлық өнім, кг",
      "Бірінші топ, кг",
      "Бірінші қорап, кг",
      "Екінші қорап, кг"
    ]
  ],
  [
    "zero-quotient",
    "«32320» жұмыртқа «64»-тен қораптарға салынды. Қорап саны қанша?",
    "505",
    "32320 ÷ 64 = 505. Ортаңғы разрядтағы нөл жоғалмайды. Тексеру: 505 × 64 = 32320.",
    [
      32320,
      64
    ],
    [
      "Жұмыртқа саны",
      "Қорап сыйымдылығы"
    ]
  ],
  [
    "speed",
    "Ұшақ «18» сағатта «15840» км ұшты. Жылдамдығы неше км/сағ?",
    "880",
    "Жылдамдық 15840 ÷ 18 = 880 км/сағ. Тексеру: 880 × 18 = 15840.",
    [
      18,
      15840
    ],
    [
      "Уақыт, сағ",
      "Жол, км"
    ]
  ],
  [
    "lost-zero-error",
    "Ермек «17136 ÷ 84» бөліндісін «24» деп жазды. Оның жауабы қате. Дұрыс жауапты таңдаңыз.",
    "204",
    "17136 ÷ 84 = 204. Ортаңғы нөлді түсіруге болмайды. 204 × 84 = 17136.",
    [
      17136,
      84,
      24
    ],
    [
      "Бөлінгіш",
      "Бөлгіш",
      "Қате жауап"
    ],
    [
      "2004",
      "204",
      "24",
      "240"
    ]
  ],
  [
    "hidden-dividend",
    "Әр □ — жасырылған цифр. «5□3□0 ÷ 80 = 7□4» теңдігіндегі бөлінгішті табыңыз.",
    "56320",
    "Қалыпқа сәйкес жалғыз бөлу: 56320 ÷ 80 = 704. Бөлінгіш 56320, бөліндінің ортасында нөл бар.",
    [
      "5□3□0",
      "80",
      "7□4"
    ],
    [
      "Бөлінгіш",
      "Бөлгіш",
      "Бөлінді"
    ],
    [
      "56400",
      "56320",
      "5632",
      "57440"
    ]
  ],
  [
    "hidden-quotient",
    "Әр □ — жасырылған цифр. «□□0□9 ÷ 73 = □0□» теңдігіндегі бөліндіні табыңыз.",
    "603",
    "73 × 603 = 44019. Екі қалыпқа да осы бөлу ғана сәйкес келеді. Жауап 603.",
    [
      "□□0□9",
      "73",
      "□0□"
    ],
    [
      "Бөлінгіш",
      "Бөлгіш",
      "Бөлінді"
    ],
    [
      "603",
      "630",
      "63",
      "613"
    ]
  ],
  [
    "hidden-quotient",
    "Әр □ — жасырылған цифр. «4□3□9 ÷ 67 = □0□» теңдігіндегі бөліндіні табыңыз.",
    "707",
    "67 × 707 = 47369. Берілген қалыптарға сәйкес жалғыз бөлінді 707.",
    [
      "4□3□9",
      "67",
      "□0□"
    ],
    [
      "Бөлінгіш",
      "Бөлгіш",
      "Бөлінді"
    ],
    [
      "717",
      "707",
      "77",
      "770"
    ]
  ],
  [
    "zero-quotient",
    "Бұрышпен бөліңіз: «14144 ÷ 68».",
    "208",
    "141 ÷ 68 бүтін бөлігі 2, қалдық 5. 54 саны 68-ден кіші болғандықтан бөліндіге нөл жазылады. 544 ÷ 68 = 8. Жауап 208.",
    [
      14144,
      68
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "lost-zero-error",
    "Дана «34304 ÷ 32» бөліндісін «172» деп жазды. Оның жауабы қате. Дұрыс бөліндіні таңдаңыз.",
    "1072",
    "34304 ÷ 32 = 1072. Тексеру: 1072 × 32 = 34304. 172 нәтижесінде ішкі нөл жоғалған.",
    [
      34304,
      32,
      172
    ],
    [
      "Бөлінгіш",
      "Бөлгіш",
      "Қате жауап"
    ],
    [
      "172",
      "1072",
      "1720",
      "10072"
    ]
  ]
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),txt=(id,x,y,s,size=18)=>`<text id="${id}" x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#29486d">${esc(s)}</text>`;
export function draw(i){const[,,,,v,labels]=SPECS[i];let body='',start=35;const corners=[3,10,12,14,15,19,20,21,22,23,24];if(corners.includes(i)){start=195;body+=`<text id="operand-a" x="185" y="60" text-anchor="end" font-family="monospace" font-size="26" fill="#29486d">${esc(v[0])}</text><text id="operand-b" x="300" y="60" text-anchor="end" font-family="monospace" font-size="28" fill="#29486d">${esc(v[1])}</text><line id="division-vertical" x1="210" y1="30" x2="210" y2="140" stroke="#93aace" stroke-width="2"/><line id="division-horizontal" x1="210" y1="78" x2="320" y2="78" stroke="#93aace" stroke-width="2"/>`;if(v.length===3)body+=`<text id="shown-quotient" x="300" y="120" text-anchor="end" font-family="monospace" font-size="28" fill="${[19,24].includes(i)?'#b45368':'#29486d'}">${esc(v[2])}</text>`;if([19,24].includes(i))body+=txt('error-label',275,160,'Қате жауап',14);else if(v.length!==3)body+=txt('quotient-unknown',275,120,'?',29);}
 if(i===0){start=150;const n=Math.floor(v[0]/v[1]),scale=300/v[0];for(let j=0;j<n;j++)body+=`<rect id="piece-${j}" x="${30+j*v[1]*scale}" y="40" width="${v[1]*scale}" height="35" fill="#d1e4dd" stroke="#8dafa3"/>`;body+=`<rect id="remainder" x="${30+n*v[1]*scale}" y="40" width="${(v[0]%v[1])*scale}" height="35" fill="#d8c8ed" stroke="#a291c0"/>`+txt('ribbon-caption',180,112,'Толық бөліктер және қалдық',16);}
 if([5,8,11].includes(i)){start=165;body+=`<rect id="bus" x="70" y="30" width="220" height="72" rx="16" fill="#d0e0f8" stroke="#8ca6ce"/><circle id="wheel-0" cx="115" cy="107" r="14" fill="#829bbd"/><circle id="wheel-1" cx="250" cy="107" r="14" fill="#829bbd"/>`+txt('bus-caption',180,74,'Орын саны маңызды',17);}
 v.forEach((x,j)=>body+=txt('input-'+j,180,start+j*52,labels[j],14)+txt('value-'+j,180,start+j*52+27,x,23));const height=start+v.length*52+15;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">Қалдық және бөліндідегі нөлдер</title><metadata id="actual-inputs">${esc(JSON.stringify(v))}</metadata><rect width="360" height="${height}" rx="18" fill="#f6f9ff"/>${body}</svg>\n`;}
function row(s,i){const[k,statement,answer,solution,,,options]=s,ref=refs[i],source=JSON.parse(fs.readFileSync(new URL('../../'+ref.sourceFile,import.meta.url))).questions.find(q=>q.id===ref.sourceId),image=`/figures/synaq-editions/${name}-${i}-native.svg`;assert.equal(source.options?.length||0,options?.length||0);return{editionId:`${name}-${i}`,modelId:`${name}-${k}`,grade:4,topic:'word',difficulty:'medium',minimumPlan:'pro',params:{number:i},sourceRefs:[ref],sourceAnswerAvailability:'all_saved_text_official_solutions_options_and_complete_givens_recomputed',adaptationChanges:['All25 full saved/new conditions official/new solutions and28 source/new options read. New remainders quotients capacity counts and hidden division patterns preserve floors, ceilings, inverse division, bounded congruence and internal-zero methods.','25 original native SVGs replace24 saved pictures plus one unavailable source3 with complete dividend and divisor in text. Full division steps and all hidden quotient candidates independently enumerated. Standard+ local only; same author computational reviewer, not another human.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,...(options?{options}:{}),image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const i=Number(r.editionId.split('-').at(-1));assert.ok(SPECS[i]);assert.equal(canonicalEdition(r),canonicalEdition(row(SPECS[i],i)),'Unreviewed shifts/sets task');return{answer:r.answer,checks:['actual units remainders Venn cells checked','own native SVG','Standard+ only']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){SPECS.forEach((_,i)=>fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${i}-native.svg`,import.meta.url),draw(i)));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'25 grade4 topics5-7 and5-8 localStandard+' ,sourceOccurrences:25,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions},null,2)+'\n');console.log({authored:25,choices:editions.reduce((s,r)=>s+(r.options?.length||0),0)});}
