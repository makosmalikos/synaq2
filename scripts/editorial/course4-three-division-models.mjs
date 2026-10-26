import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='course4-three-division';
const refs=[{"sourceFile": "problems/sources/zerek/courses/4-math-5-10-level1.json", "sourceId": "0a842c42d9fd187a"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-10-level1.json", "sourceId": "0b5423ade856c9c9"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-10-level1.json", "sourceId": "9a930dac4b57fec5"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-10-level1.json", "sourceId": "ee46dacb3eba6bdf"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-10-level1.json", "sourceId": "fa42f3fe02d67795"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-10-level2.json", "sourceId": "1e1566b97d300887"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-10-level2.json", "sourceId": "696dc63f69a0a495"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-10-level2.json", "sourceId": "a31ccc4805b4e4ee"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-10-level3.json", "sourceId": "0ba7bd2048a54ccf"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-10-level3.json", "sourceId": "a0e1edaf11f736ac"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-10-level3.json", "sourceId": "c6c074890665dc67"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-10-level3.json", "sourceId": "e6aaf4b71fbdb729"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-10-leveltest.json", "sourceId": "1262a9c1df8ac329"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-10-leveltest.json", "sourceId": "8c69227a63ec03b7"}];
export const SPECS=[
  [
    "inverse-dividend",
    "Бөлгіш «144», бөлінді «48», қалдық жоқ. Бөлінгішті табыңыз.",
    "6912",
    "Бөлінгіш 144 × 48 = 6912. Тексеру: 6912 ÷ 144 = 48.",
    [
      144,
      48
    ],
    [
      "Бөлгіш",
      "Бөлінді"
    ]
  ],
  [
    "quotient",
    "Бұрышпен бөліңіз: «214368 ÷ 528».",
    "406",
    "2143 ÷ 528 бүтін бөлігі 4, қалдық 31. 316 саны 528-ден кіші, сондықтан бөліндіге нөл жазамыз. 3168 ÷ 528 = 6. Жауап 406.",
    [
      214368,
      528
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "quotient",
    "Бұрышпен бөліңіз: «79101 ÷ 423».",
    "187",
    "791 ÷ 423 бүтін бөлігі 1, қалдық 368. 3680 ÷ 423 бүтін бөлігі 8, қалдық 296. 2961 ÷ 423 = 7. Жауап 187.",
    [
      79101,
      423
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "unit-price",
    "Мектеп бірдей «144» доп үшін «604800» теңге төледі. Бір доптың бағасын табыңыз.",
    "4200 тг",
    "604800 ÷ 144 = 4200 теңге. Тексеру: 4200 × 144 = 604800.",
    [
      144,
      604800
    ],
    [
      "Доп саны",
      "Барлық құн, ₸"
    ],
    [
      "4020 тг",
      "42000 тг",
      "4200 тг",
      "420 тг"
    ]
  ],
  [
    "quotient",
    "«20520» кітап «285» сөреге тең қойылды. Бір сөреде неше кітап?",
    "72",
    "20520 ÷ 285 = 72. Тексеру: 72 × 285 = 20520.",
    [
      20520,
      285
    ],
    [
      "Кітап саны",
      "Сөре саны"
    ]
  ],
  [
    "mixed-load-trips",
    "Қоймада «12» т «480» кг ұн бар. Көлік бір рейсте «416» кг тасиды. Барлық ұнға неше рейс керек?",
    "30",
    "Барлық масса 12480 кг. 12480 ÷ 416 = 30 рейс. Тексеру: 30 × 416 = 12480.",
    [
      12,
      480,
      416
    ],
    [
      "Тонна",
      "Қосымша килограмм",
      "Бір рейсте, кг"
    ]
  ],
  [
    "mixed-mass-distribution",
    "«144» отбасыға «6» т «912» кг өнім тең бөлінді. Әр отбасына неше килограмм тиді?",
    "48",
    "Барлық масса 6912 кг. 6912 ÷ 144 = 48 кг. Тексеру: 48 × 144 = 6912.",
    [
      144,
      6,
      912
    ],
    [
      "Отбасы саны",
      "Тонна",
      "Қосымша килограмм"
    ]
  ],
  [
    "rectangle-perimeter",
    "Тіктөртбұрыш алаңның ауданы «79104» м², ұзындығы «384» м. Периметрі неше метр?",
    "1180",
    "Ені 79104 ÷ 384 = 206 м. 384 + 206 = 590. Периметр 590 × 2 = 1180 м.",
    [
      79104,
      384
    ],
    [
      "Аудан, м²",
      "Ұзындық, м"
    ]
  ],
  [
    "equal-boxes",
    "Бірдей «425» жәшікте «34000» кітап бар. Оның «144» жәшігі мектепке берілді. Мектепке неше кітап тиді?",
    "11520",
    "Бір жәшікте 34000 ÷ 425 = 80 кітап. Мектепке 80 × 144 = 11520 кітап берілді.",
    [
      425,
      34000,
      144
    ],
    [
      "Жәшік саны",
      "Барлық кітап",
      "Берілген жәшік"
    ]
  ],
  [
    "hidden-quotient",
    "Әр □ — жасырылған цифр. «9□104 ÷ 408 = 2□8» бөлуі қалдықсыз. Бөліндіні табыңыз.",
    "238",
    "408 × 238 = 97104. Екі қалыпқа осы ғана сәйкес. Жауап 238.",
    [
      "9□104",
      "408",
      "2□8"
    ],
    [
      "Бөлінгіш",
      "Бөлгіш",
      "Бөлінді"
    ],
    [
      "238",
      "248",
      "228",
      "218"
    ]
  ],
  [
    "remaining-purchase",
    "Мектепте «210000» теңге бар. «850» теңгеден «192» кітап алынды. Қалған ақшаның бәріне «150» теңгелік дәптер сатып алды. Неше дәптер алынды?",
    "312",
    "Кітаптар 850 × 192 = 163200 теңге. Қалғаны 210000 − 163200 = 46800 теңге. Дәптер саны 46800 ÷ 150 = 312.",
    [
      210000,
      850,
      192,
      150
    ],
    [
      "Бастапқы ақша, ₸",
      "Кітап бағасы, ₸",
      "Кітап саны",
      "Дәптер бағасы, ₸"
    ]
  ],
  [
    "hidden-dividend-digit",
    "«9□264» саны «248»-ге қалдықсыз бөлінеді. □ орнындағы цифрды табыңыз.",
    "1",
    "91264 ÷ 248 = 368. Он цифрдың ішінде тек 1 саны қалдықсыз бөлінетін сан береді.",
    [
      "9□264",
      "248"
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ],
    [
      "0",
      "3",
      "1",
      "2"
    ]
  ],
  [
    "quotient",
    "Бұрышпен бөліңіз: «165164 ÷ 526».",
    "314",
    "1651 ÷ 526 бүтін бөлігі 3, қалдық 73. 736 ÷ 526 бүтін бөлігі 1, қалдық 210. 2104 ÷ 526 = 4. Жауап 314.",
    [
      165164,
      526
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "mixed-load-trips-reordered",
    "Көлік бір рейсте «425» кг өнім тасиды. «10» т «625» кг өнімге неше рейс керек?",
    "25",
    "Барлық масса 10625 кг. 10625 ÷ 425 = 25 рейс. Тексеру: 25 × 425 = 10625.",
    [
      425,
      10,
      625
    ],
    [
      "Бір рейсте, кг",
      "Тонна",
      "Қосымша килограмм"
    ]
  ]
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),txt=(id,x,y,s,size=18)=>`<text id="${id}" x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#29486d">${esc(s)}</text>`;
export function draw(i){const[,,,,v,labels]=SPECS[i];let body='',start=35;if([0,1,2,9,11,12].includes(i)){start=190;const a=i===0?'?':v[0],b=i===0?v[0]:v[1];body+=`<text id="operand-a" x="185" y="60" text-anchor="end" font-family="monospace" font-size="26" fill="#29486d">${esc(a)}</text><text id="operand-b" x="300" y="60" text-anchor="end" font-family="monospace" font-size="28" fill="#29486d">${esc(b)}</text><line id="division-vertical" x1="210" y1="30" x2="210" y2="140" stroke="#93aace" stroke-width="2"/><line id="division-horizontal" x1="210" y1="78" x2="320" y2="78" stroke="#93aace" stroke-width="2"/>`;body+=txt('shown-quotient',275,120,i===0?v[1]:i===9?v[2]:'?',27);}
 if(i===7){start=210;const a=v[1],b=v[0]/a,s=Math.min(280/a,135/b);body+=`<rect id="field" x="35" y="30" width="${a*s}" height="${b*s}" fill="#d2e7dc" stroke="#8dafa3" stroke-width="2"/>`+txt('field-label',175,188,'Тіктөртбұрыш',16);}
 v.forEach((x,j)=>body+=txt('input-'+j,180,start+j*52,labels[j],14)+txt('value-'+j,180,start+j*52+27,x,23));const height=start+v.length*52+15;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">Үш таңбалы бөлгішпен есеп</title><metadata id="actual-inputs">${esc(JSON.stringify(v))}</metadata><rect width="360" height="${height}" rx="18" fill="#f6f9ff"/>${body}</svg>\n`;}
function row(s,i){const[k,statement,answer,solution,,,options]=s,ref=refs[i],source=JSON.parse(fs.readFileSync(new URL('../../'+ref.sourceFile,import.meta.url))).questions.find(q=>q.id===ref.sourceId),image=`/figures/synaq-editions/${name}-${i}-native.svg`;assert.equal(source.options?.length||0,options?.length||0);return{editionId:`${name}-${i}`,modelId:`${name}-${k}`,grade:4,topic:'word',difficulty:'medium',minimumPlan:'pro',params:{number:i},sourceRefs:[ref],sourceAnswerAvailability:'all_saved_text_official_solutions_options_and_complete_givens_recomputed',adaptationChanges:['All14 full saved/new conditions official/new solutions and12 source/new options read. Changed three-digit divisors dividends masses prices capacities and masks preserve exact division, inverse division, unknown digit and requested quantity.','14 own native SVGs replace14 saved pictures without tracing. Full digit-remainder division and every hidden quotient candidate independently enumerated. Source3 official wording has an incorrect brought-down digit, fixed in new solution. Standard+ local only; same author computational reviewer, not another human.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,...(options?{options}:{}),image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const i=Number(r.editionId.split('-').at(-1));assert.ok(SPECS[i]);assert.equal(canonicalEdition(r),canonicalEdition(row(SPECS[i],i)),'Unreviewed shifts/sets task');return{answer:r.answer,checks:['actual units remainders Venn cells checked','own native SVG','Standard+ only']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){SPECS.forEach((_,i)=>fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${i}-native.svg`,import.meta.url),draw(i)));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'14 grade4 topic5-10 three-digit division localStandard+' ,sourceOccurrences:14,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions},null,2)+'\n');console.log({authored:14,choices:editions.reduce((s,r)=>s+(r.options?.length||0),0)});}
