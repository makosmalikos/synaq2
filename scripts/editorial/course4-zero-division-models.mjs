import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='course4-zero-division';
const refs=[{"sourceFile": "problems/sources/zerek/courses/4-math-5-4-level1.json", "sourceId": "3564e1c799ca1c82"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-4-level1.json", "sourceId": "56263952f8e3970b"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-4-level1.json", "sourceId": "58686ff0efe8f7fd"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-4-level1.json", "sourceId": "86bf5434af16a6d2"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-4-level2.json", "sourceId": "2353eeb723b62e7b"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-4-level2.json", "sourceId": "614702ec22420412"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-4-level2.json", "sourceId": "72f1ec3313326607"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-4-level2.json", "sourceId": "acc14d2f88b5ec9b"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-4-level3.json", "sourceId": "2f8d7d4e3f55b984"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-4-level3.json", "sourceId": "37bb195fd9c0257b"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-4-level3.json", "sourceId": "780fdce5313818b7"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-4-leveltest.json", "sourceId": "86aaa3d227b14104"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-4-leveltest.json", "sourceId": "cd978537d34fbd92"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-4-leveltest.json", "sourceId": "d20f032f7672519b"}];
export const SPECS=[
  [
    "quotient",
    "Бұрышпен бөліңіз: «33600 ÷ 80».",
    "420",
    "Бөлінгіш пен бөлгішті 10-ға қысқартамыз. 3360 ÷ 8 = 420. Тексеру: 420 × 80 = 33600.",
    [
      33600,
      80
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "quotient",
    "«18600» кг сәбізді «60» килограмнан қаптарға салды. Неше қап шықты?",
    "310",
    "Қап саны 18600 ÷ 60 = 310. Тексеру: 310 × 60 = 18600 кг.",
    [
      18600,
      60
    ],
    [
      "Барлық масса, кг",
      "Бір қап, кг"
    ]
  ],
  [
    "price",
    "Кітапхана бірдей «90» кітапқа «135000» теңге төледі. Бір кітаптың бағасы неше теңге?",
    "1500",
    "Бір кітап 135000 ÷ 90 = 1500 теңге. Тексеру: 1500 × 90 = 135000.",
    [
      90,
      135000
    ],
    [
      "Кітап саны",
      "Барлық құны, ₸"
    ]
  ],
  [
    "quotient",
    "Бұрышпен бөліңіз: «196800 ÷ 800».",
    "246",
    "Екі санды 100-ге қысқартамыз. 1968 ÷ 8 = 246. Тексеру: 246 × 800 = 196800.",
    [
      196800,
      800
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "rectangle-perimeter",
    "Тіктөртбұрыш бақтың ауданы «72000» м², ұзындығы «400» м. Бір қатар қоршауға неше метр сым қажет?",
    "1160 м",
    "Бақтың ені 72000 ÷ 400 = 180 м. Периметрі: 400 + 180 = 580, 580 × 2 = 1160 м.",
    [
      72000,
      400
    ],
    [
      "Аудан, м²",
      "Ұзындық, м"
    ],
    [
      "180 м",
      "4400 м",
      "580 м",
      "1160 м"
    ]
  ],
  [
    "nested-bundles",
    "«45000» парақ «50»-ден бумаға байланды. Әр «30» бума бір жәшікке салынды. Неше толық жәшік шықты?",
    "30",
    "Бума саны 45000 ÷ 50 = 900. Жәшік саны 900 ÷ 30 = 30.",
    [
      45000,
      50,
      30
    ],
    [
      "Барлық парақ",
      "Бумадағы парақ",
      "Жәшіктегі бума"
    ]
  ],
  [
    "rectangle-perimeter",
    "Тіктөртбұрыш алаңның ауданы «168000» м², ені «400» м. Периметрі неше метр?",
    "1640",
    "Ұзындығы 168000 ÷ 400 = 420 м. 420 + 400 = 820, 820 × 2 = 1640 м.",
    [
      168000,
      400
    ],
    [
      "Аудан, м²",
      "Ені, м"
    ]
  ],
  [
    "quotient",
    "Пойыз «1890» км жолды «90» км/сағ жылдамдықпен жүрді. Неше сағат жүрді?",
    "21 сағ",
    "Уақыт 1890 ÷ 90 = 21 сағат. Тексеру: 90 × 21 = 1890 км.",
    [
      1890,
      90
    ],
    [
      "Жол, км",
      "Жылдамдық, км/сағ"
    ],
    [
      "21 сағ",
      "1980 сағ",
      "19 сағ",
      "210 сағ"
    ]
  ],
  [
    "minimum-buses",
    "Көрмеге «4390» оқушы барады. Автобусқа «60» оқушы сыяды. Барлығын бір мезгілде жеткізуге ең аз неше автобус керек?",
    "74",
    "73 автобусқа 4380 оқушы сыяды, 10 оқушы қалады. Оларға тағы бір автобус қажет. 73 + 1 = 74.",
    [
      4390,
      60
    ],
    [
      "Оқушы саны",
      "Автобус сыйымдылығы"
    ]
  ],
  [
    "two-products-distribute",
    "Шеберхана «1600» моншақтан «30» қорап және «1800» моншақтан «20» қорап жұмсады. Оларды «700» бұйымға тең бөлді. Бір бұйымға неше моншақ тиді?",
    "120",
    "Бірінші топ 1600 × 30 = 48000 моншақ. Екінші топ 1800 × 20 = 36000 моншақ. Барлығы 84000. Бір бұйымға 84000 ÷ 700 = 120 моншақ.",
    [
      1600,
      30,
      1800,
      20,
      700
    ],
    [
      "Бірінші қораптағы саны",
      "Бірінші қорап саны",
      "Екінші қораптағы саны",
      "Екінші қорап саны",
      "Бұйым саны"
    ]
  ],
  [
    "floor-quotient",
    "«6830» санын «70»-ке қалдықпен бөлгендегі толымсыз бөліндіні табыңыз.",
    "97",
    "6830 = 97 × 70 + 40. Қалдық 40 саны 70-тен кіші. Толымсыз бөлінді 97.",
    [
      6830,
      70
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "speed-duration",
    "Көлік «80» км/сағ жылдамдықпен «1680» км жүрді. Неше сағат жолда болды?",
    "21",
    "Уақыт 1680 ÷ 80 = 21 сағат. Тексеру: 21 × 80 = 1680.",
    [
      80,
      1680
    ],
    [
      "Жылдамдық, км/сағ",
      "Жол, км"
    ]
  ],
  [
    "remainder",
    "«7540» санын «90»-ға бөлгендегі қалдықты табыңыз.",
    "70",
    "7540 = 83 × 90 + 70. Қалдық 70 саны 90-нан кіші. Жауап 70.",
    [
      7540,
      90
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "quotient",
    "Бұрышпен бөліңіз: «49600 ÷ 80».",
    "620",
    "Екі санды 10-ға қысқартамыз: 4960 ÷ 8 = 620. Тексеру: 620 × 80 = 49600.",
    [
      49600,
      80
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ]
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),txt=(id,x,y,s,size=18)=>`<text id="${id}" x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#29486d">${esc(s)}</text>`;
export function draw(i){const[,,,,v,labels]=SPECS[i];let body='',start=35;if([0,3,10,12,13].includes(i)){start=190;body+=`<text id="operand-a" x="185" y="60" text-anchor="end" font-family="monospace" font-size="28" fill="#29486d">${v[0]}</text><text id="operand-b" x="300" y="60" text-anchor="end" font-family="monospace" font-size="28" fill="#29486d">${v[1]}</text><line id="division-vertical" x1="210" y1="30" x2="210" y2="140" stroke="#93aace" stroke-width="2"/><line id="division-horizontal" x1="210" y1="78" x2="320" y2="78" stroke="#93aace" stroke-width="2"/>`+txt('quotient-unknown',275,120,'?',29);}
 if([4,6].includes(i)){start=210;const side=v[1],other=v[0]/side,s=Math.min(280/side,135/other);body+=`<rect id="field" x="35" y="30" width="${side*s}" height="${other*s}" fill="#d2e7dc" stroke="#8dafa3" stroke-width="2"/>`+txt('field-label',175,188,'Тіктөртбұрыш',16);}
 if(i===8){start=180;body+=`<rect id="bus" x="70" y="40" width="220" height="72" rx="16" fill="#d0e0f8" stroke="#8ca6ce"/><circle id="wheel-0" cx="115" cy="117" r="14" fill="#829bbd"/><circle id="wheel-1" cx="250" cy="117" r="14" fill="#829bbd"/>`+txt('bus-caption',180,84,'Бәріне орын керек',17);}
 v.forEach((x,j)=>body+=txt('input-'+j,180,start+j*52,labels[j],14)+txt('value-'+j,180,start+j*52+27,x,23));const height=start+v.length*52+15;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">Бөлу есебінің деректері</title><metadata id="actual-inputs">${esc(JSON.stringify(v))}</metadata><rect width="360" height="${height}" rx="18" fill="#f6f9ff"/>${body}</svg>\n`;}
function row(s,i){const[k,statement,answer,solution,,,options]=s,ref=refs[i],source=JSON.parse(fs.readFileSync(new URL('../../'+ref.sourceFile,import.meta.url))).questions.find(q=>q.id===ref.sourceId),image=`/figures/synaq-editions/${name}-${i}-native.svg`;assert.equal(source.options?.length||0,options?.length||0);return{editionId:`${name}-${i}`,modelId:`${name}-${k}`,grade:4,topic:'word',difficulty:'medium',minimumPlan:'pro',params:{number:i},sourceRefs:[ref],sourceAnswerAvailability:'all_saved_text_official_solutions_options_and_complete_givens_recomputed',adaptationChanges:['All14 saved/new conditions official/new solutions and8 source/new choices read. New dividends divisors objects areas and capacities preserve trailing-zero division, floor quotient, true unscaled remainder and ceiling-capacity distinctions.','14 original SVGs replace14 saved source diagrams without tracing. Exact long division at every cancelled-zero scale independently checked. Standard+ local only; same author separate computational checker, not another human.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,...(options?{options}:{}),image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const i=Number(r.editionId.split('-').at(-1));assert.ok(SPECS[i]);assert.equal(canonicalEdition(r),canonicalEdition(row(SPECS[i],i)),'Unreviewed shifts/sets task');return{answer:r.answer,checks:['actual units remainders Venn cells checked','own native SVG','Standard+ only']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){SPECS.forEach((_,i)=>fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${i}-native.svg`,import.meta.url),draw(i)));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'14 grade4 topic5-4 zero-ending division localStandard+' ,sourceOccurrences:14,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions},null,2)+'\n');console.log({authored:14,choices:editions.reduce((s,r)=>s+(r.options?.length||0),0)});}
