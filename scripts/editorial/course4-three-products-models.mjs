import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='course4-three-products';
const refs=[{"sourceFile": "problems/sources/zerek/courses/4-math-5-11-level1.json", "sourceId": "41ed5ab83fd8d5e2"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-11-level1.json", "sourceId": "976b822b6d5bdbbf"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-11-level1.json", "sourceId": "c0b27a756349bec5"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-11-level1.json", "sourceId": "f27d6cd31180ddc2"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-11-level2.json", "sourceId": "29ad8922b686a548"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-11-level2.json", "sourceId": "33bf6ee80bc60534"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-11-level2.json", "sourceId": "50252955c57cf27d"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-11-level2.json", "sourceId": "ca5009666bf9cbe0"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-11-level2.json", "sourceId": "ede8e4e303995a28"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-11-level3.json", "sourceId": "67c4c60f4a1330a0"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-11-level3.json", "sourceId": "a4285ad98e1fb7b1"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-11-leveltest.json", "sourceId": "6e5ab28f7d84b0f1"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-11-leveltest.json", "sourceId": "9fc355bfc0f94e92"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-9-level1.json", "sourceId": "7f31c6e5a373b5a6"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-9-level1.json", "sourceId": "83416668321276a4"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-9-level1.json", "sourceId": "bfcc59ad99307e96"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-9-level1.json", "sourceId": "da77833f8ecbbf7c"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-9-level2.json", "sourceId": "2314c369b50bf824"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-9-level2.json", "sourceId": "79390ce3469bfd5a"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-9-level3.json", "sourceId": "0ec8efd810c27881"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-9-level3.json", "sourceId": "6300df8ba1addadf"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-9-level3.json", "sourceId": "8cc64d2370d6377c"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-9-level3.json", "sourceId": "a2748218c53aa8b4"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-9-level3.json", "sourceId": "b3dc66e0e34cce86"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-9-leveltest.json", "sourceId": "053591b5307d9177"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-9-leveltest.json", "sourceId": "9010ebb0dfe9c8eb"}];
export const SPECS=[
  [
    "column-product",
    "Бағанмен есептеңіз: «795 × 306».",
    "243270",
    "Бірліктер: 795 × 6 = 4770. Ондықтар нөл. Жүздіктер: 795 × 300 = 238500. Барлығы 4770 + 238500 = 243270.",
    [
      795,
      306
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ]
  ],
  [
    "quotient",
    "Бұрышпен бөліңіз: «230052 ÷ 57».",
    "4036",
    "230 ÷ 57 бүтін бөлігі 4, қалдық 2. Келесі 0-ді түсіргенде 20 саны 57-ден кіші — бөліндіге нөл. 205 ÷ 57 бүтін бөлігі 3, қалдық 34. 342 ÷ 57 = 6. Жауап 4036.",
    [
      230052,
      57
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "operation-order",
    "Өрнектің мәнін табыңыз: «1500 − 1296 ÷ 36 × 7».",
    "1248",
    "Алдымен бөлу: 1296 ÷ 36 = 36. Көбейту: 36 × 7 = 252. Соңында азайту: 1500 − 252 = 1248.",
    [
      1500,
      1296,
      36,
      7
    ],
    [
      "Азайғыш",
      "Бөлінгіш",
      "Бөлгіш",
      "Көбейткіш"
    ],
    [
      "1464",
      "1248",
      "10248",
      "252"
    ]
  ],
  [
    "ticket-cost",
    "Мұражайға «152» оқушы барды. Бір билет «420» теңге. Барлық билет неше теңге?",
    "63840",
    "152 × 420 = 63840 теңге.",
    [
      152,
      420
    ],
    [
      "Оқушы саны",
      "Билет бағасы, ₸"
    ]
  ],
  [
    "proportional-distance",
    "Пойыз «28» сағатта «1904» км жүрді. Сол жылдамдықпен «45» сағатта неше километр жүреді?",
    "3060",
    "Жылдамдығы 1904 ÷ 28 = 68 км/сағ. Жаңа жол 68 × 45 = 3060 км.",
    [
      28,
      1904,
      45
    ],
    [
      "Бастапқы уақыт, сағ",
      "Бастапқы жол, км",
      "Жаңа уақыт, сағ"
    ]
  ],
  [
    "lost-final-zero",
    "Ермек «718 × 530» көбейтіндісін «38054» деп жазды. Бұл жауап қате. Дұрыс көбейтіндіні таңдаңыз.",
    "380540",
    "718 × 53 = 38054. Көбейткіш 530 болғандықтан тағы бір нөл тіркеледі: 380540. Бұл 700 × 500 = 350000 санынан артық.",
    [
      718,
      530,
      38054
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш",
      "Қате жауап"
    ],
    [
      "359000",
      "38054",
      "380540",
      "3805400"
    ]
  ],
  [
    "quotient-and-remainder",
    "«32000» қарындашты «156»-дан қорапқа салды. Неше толық қорап, неше қарындаш қалды?",
    "205 қорап, 20 қарындаш артылады",
    "156 × 205 = 31980. Қалдық 32000 − 31980 = 20. Демек 205 толық қорап, 20 қарындаш.",
    [
      32000,
      156
    ],
    [
      "Қарындаш саны",
      "Қорап сыйымдылығы"
    ],
    [
      "215 қорап, 20 қарындаш артылады",
      "204 қорап, 176 қарындаш артылады",
      "205 қорап, 20 қарындаш артылады",
      "206 қорап, 136 қарындаш артылады"
    ]
  ],
  [
    "remaining-area-rooms",
    "Мұражай ауданы «25480» м², қоймалары «8920» м². Қалған жер әрқайсысы «720» м² залдарға бөлінді. Неше зал бар?",
    "23",
    "Залдарға қалғаны 25480 − 8920 = 16560 м². Зал саны 16560 ÷ 720 = 23.",
    [
      25480,
      8920,
      720
    ],
    [
      "Барлық аудан, м²",
      "Қойма ауданы, м²",
      "Бір зал, м²"
    ]
  ],
  [
    "proportional-price",
    "Бірдей «18» кітап «35100» теңге тұрады. Кітапхана осындай «136» кітапқа қанша төлейді?",
    "265200",
    "Бір кітап 35100 ÷ 18 = 1950 теңге. Барлығы 1950 × 136 = 265200 теңге.",
    [
      18,
      35100,
      136
    ],
    [
      "Бастапқы кітап саны",
      "Бастапқы құны, ₸",
      "Жаңа кітап саны"
    ]
  ],
  [
    "hidden-dividend",
    "Әр □ — жасырылған цифр. «5□□82 ÷ 137 = □□6» қалдықсыз бөлуіндегі бөлінгішті табыңыз.",
    "52882",
    "137 × 386 = 52882. Берілген екі қалыпқа да осы ғана сәйкес келеді.",
    [
      "5□□82",
      "137",
      "□□6"
    ],
    [
      "Бөлінгіш",
      "Бөлгіш",
      "Бөлінді"
    ],
    [
      "52882",
      "50142",
      "54252",
      "55622"
    ]
  ],
  [
    "hidden-first-factor",
    "Әр □ — жасырылған цифр. «3□□ × □9 = □□332» теңдігіндегі бірінші көбейткішті табыңыз.",
    "308",
    "308 × 79 = 24332. Барлық жасырылған цифрлар тексерілгенде осы жалғыз шешім шығады.",
    [
      "3□□",
      "□9",
      "□□332"
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш",
      "Көбейтінді"
    ]
  ],
  [
    "quotient",
    "Бұрышпен бөліңіз: «181790 ÷ 343».",
    "530",
    "1817 ÷ 343 бүтін бөлігі 5, қалдық 102. 1029 ÷ 343 = 3. Соңғы нөл сақталады. Жауап 530.",
    [
      181790,
      343
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "product-distribution",
    "Әрқайсысында «126» кітап бар «48» жәшік келді. Барлық кітап «108» сөреге тең қойылды. Бір сөреде неше кітап?",
    "56",
    "Барлығы 126 × 48 = 6048 кітап. Бір сөреде 6048 ÷ 108 = 56 кітап.",
    [
      126,
      48,
      108
    ],
    [
      "Жәшіктегі кітап",
      "Жәшік саны",
      "Сөре саны"
    ]
  ],
  [
    "column-product",
    "Бағанмен есептеңіз: «4576 × 314».",
    "1436864",
    "Бірліктер 4576 × 4 = 18304. Ондықтар 4576 × 10 = 45760. Жүздіктер 4576 × 300 = 1372800. Қосындысы 1436864.",
    [
      4576,
      314
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ]
  ],
  [
    "rectangle-area",
    "Тіктөртбұрыш егістіктің ұзындығы «1326» м, ені «427» м. Ауданы неше шаршы метр?",
    "566202",
    "Аудан 1326 × 427 = 566202 м².",
    [
      1326,
      427
    ],
    [
      "Ұзындық, м",
      "Ені, м"
    ]
  ],
  [
    "raw-tens-partial",
    "«3184 × 352» бағандық көбейтуіндегі екінші толымсыз көбейтіндінің жолында қандай сан жазылады? Ондық разрядқа жылжытпай, жолдың өзіндегі цифрлардан құралған санды жазыңыз.",
    "15920",
    "Ондық цифр 5. Жолда 3184 × 5 = 15920 жазылады. Оның толық разрядтық мәні 159200, бірақ сұрақ жолдағы сан туралы.",
    [
      3184,
      352
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ],
    [
      "3184",
      "6368",
      "9552",
      "15920"
    ]
  ],
  [
    "column-product",
    "Бағанмен есептеңіз: «4253 × 304».",
    "1292912",
    "Бірліктер 4253 × 4 = 17012. Ондықтар нөл. Жүздіктер 4253 × 300 = 1275900. Барлығы 17012 + 1275900 = 1292912.",
    [
      4253,
      304
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ]
  ],
  [
    "raw-second-nonzero-partial",
    "«3816 × 407» көбейтуінде нөлдік жол жазылмайды. Екінші жазылатын толымсыз көбейтінді жолындағы сан қандай? Жолдағы цифрлардан құралған санды, разрядқа жылжытпай жазыңыз.",
    "15264",
    "Бірінші жол 3816 × 7 = 26712. Нөлдік ондық жол өткізіледі. Екінші жол 3816 × 4 = 15264, оның жүздік разрядтағы толық мәні 1526400.",
    [
      3816,
      407
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ],
    [
      "0",
      "26712",
      "15264",
      "3816"
    ]
  ],
  [
    "area-difference",
    "Бірінші тікбұрышты егістік «1248» м × «506» м, екіншісі «1085» м × «423» м. Біріншісінің ауданы неше шаршы метр артық?",
    "172533",
    "Бірінші аудан 1248 × 506 = 631488 м². Екіншісі 1085 × 423 = 458955 м². Айырма 631488 − 458955 = 172533 м².",
    [
      1248,
      506,
      1085,
      423
    ],
    [
      "Бірінші ұзындық, м",
      "Бірінші ені, м",
      "Екінші ұзындық, м",
      "Екінші ені, м"
    ]
  ],
  [
    "original-area",
    "Ені «326» м тікбұрышты егістіктің ұзындығын «120» м арттырғанда ауданы «508560» м² болды. Бастапқы ауданы неше шаршы метр?",
    "469440",
    "Қосылған жолақ ауданы 326 × 120 = 39120 м². Бастапқы аудан 508560 − 39120 = 469440 м².",
    [
      326,
      120,
      508560
    ],
    [
      "Ені, м",
      "Қосылған ұзындық, м",
      "Жаңа аудан, м²"
    ]
  ],
  [
    "hidden-first-factor",
    "Әр □ — жасырылған цифр. «1□4□ × 301 = 4□5747» теңдігіндегі бірінші көбейткішті табыңыз.",
    "1647",
    "1647 × 301 = 495747. Қалыптарға сәйкес жалғыз бірінші көбейткіш 1647.",
    [
      "1□4□",
      "301",
      "4□5747"
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш",
      "Көбейтінді"
    ]
  ],
  [
    "hidden-multiplier-digit",
    "«3456 × 2□9 = 929664» теңдігіндегі □ орнындағы цифрды табыңыз.",
    "6",
    "929664 ÷ 3456 = 269. Сондықтан жасырылған ондық цифр 6.",
    [
      "3456",
      "2□9",
      "929664"
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш",
      "Көбейтінді"
    ],
    [
      "6",
      "5",
      "7",
      "4"
    ]
  ],
  [
    "hundreds-shift-error",
    "Марат «4536 × 304» көбейтті. Ол «18144» және «13608» толымсыз көбейтінділерін дұрыс тапты, бірақ екіншісін бір ғана разряд жылжытып, «154224» алды. Дұрыс көбейтінді қандай?",
    "1378944",
    "Екінші жол жүздіктерге тиесілі, сондықтан 13608 × 100 = 1360800. Дұрыс қосынды 18144 + 1360800 = 1378944. Қате нәтиже 18144 + 136080 = 154224.",
    [
      4536,
      304,
      18144,
      13608,
      154224
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш",
      "Бірлік жолы",
      "Жүздік жолы",
      "Қате нәтиже"
    ],
    [
      "1378944",
      "1379944",
      "154224",
      "31752"
    ]
  ],
  [
    "product-from-raw-partials",
    "Үш таңбалы санды үш таңбалы санға көбейткенде бірліктен бастап ретімен толымсыз көбейтінді жолдары «1728», «3456», «2592» болды. Бұлар — жылжытылмаған жолдар. Толық көбейтіндіні табыңыз.",
    "295488",
    "Бірлік мәні 1728, ондық мәні 34560, жүздік мәні 259200. Қосынды 1728 + 34560 + 259200 = 295488. Мысалы, 864 × 342 осындай жолдар береді.",
    [
      1728,
      3456,
      2592
    ],
    [
      "Бірлік жолы",
      "Ондық жолы",
      "Жүздік жолы"
    ]
  ],
  [
    "hidden-first-factor",
    "Әр □ — жасырылған цифр. «2□2□ × 307 = 77□789» теңдігіндегі бірінші көбейткішті табыңыз.",
    "2527",
    "2527 × 307 = 775789. Қалған нұсқалар берілген қалыпқа сәйкес келмейді.",
    [
      "2□2□",
      "307",
      "77□789"
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш",
      "Көбейтінді"
    ],
    [
      "2227",
      "2523",
      "2567",
      "2527"
    ]
  ],
  [
    "column-product",
    "Бағанмен есептеңіз: «4536 × 214».",
    "970704",
    "Бірліктер 4536 × 4 = 18144. Ондықтар 4536 × 10 = 45360. Жүздіктер 4536 × 200 = 907200. Барлығы 18144 + 45360 + 907200 = 970704.",
    [
      4536,
      214
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ]
  ]
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),txt=(id,x,y,s,size=18)=>`<text id="${id}" x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#29486d">${esc(s)}</text>`;
export function draw(i){const[,,,,v,labels]=SPECS[i];let body='',start=35;const mul=[0,5,10,13,15,16,17,20,21,24,25].includes(i),div=[1,9,11].includes(i);if(mul){start=195;body+=`<text id="operand-a" x="320" y="60" text-anchor="end" font-family="monospace" font-size="26" fill="#29486d">${esc(v[0])}</text><text id="operator" x="45" y="104" font-size="25" fill="#29486d">×</text><text id="operand-b" x="320" y="104" text-anchor="end" font-family="monospace" font-size="26" fill="#29486d">${esc(v[1])}</text><line id="column-rule" x1="35" y1="117" x2="330" y2="117" stroke="#93aace" stroke-width="2"/>`;if(v.length===3)body+=`<text id="shown-result" x="320" y="155" text-anchor="end" font-family="monospace" font-size="26" fill="${i===5?'#b45368':'#29486d'}">${esc(v[2])}</text>`;if(i===5)body+=txt('error-label',100,155,'Қате нәтиже',14);}
 if(div){start=190;body+=`<text id="operand-a" x="185" y="60" text-anchor="end" font-family="monospace" font-size="26" fill="#29486d">${esc(v[0])}</text><text id="operand-b" x="300" y="60" text-anchor="end" font-family="monospace" font-size="28" fill="#29486d">${esc(v[1])}</text><line id="division-vertical" x1="210" y1="30" x2="210" y2="140" stroke="#93aace" stroke-width="2"/><line id="division-horizontal" x1="210" y1="78" x2="320" y2="78" stroke="#93aace" stroke-width="2"/>`+txt('shown-quotient',275,120,i===9?v[2]:'?',27);}
 if(i===2){start=130;body+=txt('expression',180,65,`${v[0]} − ${v[1]} ÷ ${v[2]} × ${v[3]}`,21);}
 if([14,18,19].includes(i)){start=210;const dims=i===18?[[v[0],v[1]],[v[2],v[3]]]:i===19?[[v[2]/v[0]-v[1],v[0]],[v[1],v[0]]]:[[v[0],v[1]]],s=Math.min(...dims.flatMap(([a,b])=>[(dims.length>1?135:280)/a,125/b]));dims.forEach(([a,b],k)=>body+=`<rect id="field-${k}" x="${dims.length>1?30+k*180:35}" y="30" width="${a*s}" height="${b*s}" fill="${k?'#dbcff0':'#d2e7dc'}" stroke="#8dafa3" stroke-width="2"/>`);}
 v.forEach((x,j)=>body+=txt('input-'+j,180,start+j*52,labels[j],14)+txt('value-'+j,180,start+j*52+27,x,23));const height=start+v.length*52+15;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">Үш таңбалы көбейту және қорытынды есептер</title><metadata id="actual-inputs">${esc(JSON.stringify(v))}</metadata><rect width="360" height="${height}" rx="18" fill="#f6f9ff"/>${body}</svg>\n`;}
function row(s,i){const[k,statement,answer,solution,,,options]=s,ref=refs[i],source=JSON.parse(fs.readFileSync(new URL('../../'+ref.sourceFile,import.meta.url))).questions.find(q=>q.id===ref.sourceId),image=`/figures/synaq-editions/${name}-${i}-native.svg`;assert.equal(source.options?.length||0,options?.length||0);return{editionId:`${name}-${i}`,modelId:`${name}-${k}`,grade:4,topic:'word',difficulty:'medium',minimumPlan:'pro',params:{number:i},sourceRefs:[ref],sourceAnswerAvailability:'all_saved_text_official_solutions_options_and_complete_givens_recomputed',adaptationChanges:['All26 full saved/new conditions official/new solutions and36 source/new choices read. Changed three-digit multipliers divisors costs areas partials and masks preserve requested quantities, raw row numbers versus scaled place values and omitted shift errors.','26 original native SVGs replace26 source pictures without tracing. Exhaustive hidden digits, order of operations, long division, raw partial factor witnesses and actual grid geometry independently checked. Standard+ local only; same author computational reviewer, not another human.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,...(options?{options}:{}),image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const i=Number(r.editionId.split('-').at(-1));assert.ok(SPECS[i]);assert.equal(canonicalEdition(r),canonicalEdition(row(SPECS[i],i)),'Unreviewed shifts/sets task');return{answer:r.answer,checks:['actual units remainders Venn cells checked','own native SVG','Standard+ only']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){SPECS.forEach((_,i)=>fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${i}-native.svg`,import.meta.url),draw(i)));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'26 grade4 topics5-9 and5-11 localStandard+' ,sourceOccurrences:26,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions},null,2)+'\n');console.log({authored:26,choices:editions.reduce((s,r)=>s+(r.options?.length||0),0)});}
