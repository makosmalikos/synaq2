import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='course4-differences';
const refs=[{"sourceFile": "problems/sources/zerek/courses/4-math-6-4-level1.json", "sourceId": "30af7452c756b2c0"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-4-level1.json", "sourceId": "51183c5ac8333448"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-4-level1.json", "sourceId": "7c7b8690c414fa67"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-4-level1.json", "sourceId": "f46f2d187ef82d7b"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-4-level2.json", "sourceId": "0dd5bfe12dfeba9f"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-4-level2.json", "sourceId": "798c2a3e4c9599c9"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-4-level2.json", "sourceId": "fcffacb57e6b584d"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-4-level3.json", "sourceId": "904bd4fd4f9b615c"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-4-level3.json", "sourceId": "9b901fbe80d136fe"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-4-level3.json", "sourceId": "b9e31d537ef70aab"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-4-level3.json", "sourceId": "c7ebcdaf42558564"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-4-leveltest.json", "sourceId": "66d8d3aa3d0ff8df"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-4-leveltest.json", "sourceId": "ad26967a82d460a0"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-4-leveltest.json", "sourceId": "da217d838b1cf375"}];
export const SPECS=[
  [
    "unit-difference",
    "Дана «14», Ерке «9» бірдей ашықхат алды. Дана «850» тг артық төледі. Бір ашықхаттың бағасы қанша?",
    "170",
    "Артық саны 14 − 9 = 5. Бір ашықхат 850 ÷ 5 = 170 тг.",
    [
      14,
      9,
      850
    ],
    [
      "Бірінші саны",
      "Екінші саны",
      "Төлем айырмасы, тг"
    ]
  ],
  [
    "unit-difference",
    "Екі турист бірдей жылдамдықпен жүрді. Біріншісі «7», екіншісі «4» сағат жолда болып, біріншісі «15» км артық жүрді. Жылдамдығын км/сағ-пен тап.",
    "5",
    "Артық уақыт 7 − 4 = 3 сағат. Жылдамдық 15 ÷ 3 = 5 км/сағ.",
    [
      7,
      4,
      15
    ],
    [
      "Бірінші уақыт, сағ",
      "Екінші уақыт, сағ",
      "Жол айырмасы, км"
    ]
  ],
  [
    "second-share",
    "Бір дүкенге «13», екіншісіне «8» бірдей жәшік өрік әкелді. Біріншісіне «125» кг артық әкелінді. Екінші дүкенге неше килограмм әкелінді?",
    "200",
    "Артық жәшік 13 − 8 = 5. Бір жәшік 125 ÷ 5 = 25 кг. Екіншісінде 25 × 8 = 200 кг.",
    [
      13,
      8,
      125
    ],
    [
      "Бірінші жәшік саны",
      "Екінші жәшік саны",
      "Масса айырмасы, кг"
    ]
  ],
  [
    "second-area",
    "Ені бірдей екі бөлменің ұзындықтары «9» және «6» м. Бірінші бөлменің ауданы «24» м² артық. Екінші бөлменің ауданы неше шаршы метр?",
    "48",
    "Ұзындық айырмасы 9 − 6 = 3 м. Ені 24 ÷ 3 = 8 м. Екінші аудан 6 × 8 = 48 м².",
    [
      9,
      6,
      24
    ],
    [
      "Бірінші ұзындық, м",
      "Екінші ұзындық, м",
      "Аудан айырмасы, м²"
    ]
  ],
  [
    "second-perimeter",
    "Ені бірдей екі тіктөртбұрыштың ұзындықтары «15» және «11» см. Бірінші аудан «36» см² артық. Екіншісінің периметрін тап.",
    "40",
    "Ені 36 ÷ (15 − 11) = 9 см. Периметр 2 × (11 + 9) = 40 см. Аудан 99 см², біріншінің периметрі 48 см.",
    [
      15,
      11,
      36
    ],
    [
      "Бірінші ұзындық, см",
      "Екінші ұзындық, см",
      "Аудан айырмасы, см²"
    ],
    [
      "99",
      "48",
      "22",
      "40"
    ]
  ],
  [
    "second-share",
    "Екі маманға бірдей сағаттық ақы төленеді. Аян «42», Ерке «30» сағат жұмыс істеді. Аян «21600» тг артық алды. Ерке неше теңге алды?",
    "54000",
    "Артық уақыт 42 − 30 = 12 сағат. Сағаттық ақы 21600 ÷ 12 = 1800 тг. Ерке 1800 × 30 = 54000 тг алды.",
    [
      42,
      30,
      21600
    ],
    [
      "Бірінші уақыт, сағ",
      "Екінші уақыт, сағ",
      "Ақы айырмасы, тг"
    ],
    [
      "648000",
      "32400",
      "75600",
      "54000"
    ]
  ],
  [
    "ordered-distances",
    "Жылдамдықтары бірдей екі пойыз «9» және «5» сағат жүрді. Біріншісі «312» км артық жүрді. Екі пойыздың жолын бірінші, екінші ретімен жаз.",
    "702; 390",
    "Артық уақыт 9 − 5 = 4 сағат. Жылдамдық 312 ÷ 4 = 78 км/сағ. Жолдар 78 × 9 = 702 және 78 × 5 = 390 км.",
    [
      9,
      5,
      312
    ],
    [
      "Бірінші уақыт, сағ",
      "Екінші уақыт, сағ",
      "Жол айырмасы, км"
    ],
    [
      "390; 702",
      "2808; 1560",
      "702; 390",
      "702; 1014"
    ]
  ],
  [
    "surplus-deficit",
    "Айша бірдей кітап алмақ. «5» кітап алса «800» тг қалады, «9» кітап алса «1600» тг жетпейді. Бір кітаптың бағасын тап.",
    "600",
    "Қосымша кітап саны 9 − 5 = 4. Оларға 800 + 1600 = 2400 тг керек. Бір кітап 2400 ÷ 4 = 600 тг.",
    [
      5,
      800,
      9,
      1600
    ],
    [
      "Аз кітап саны",
      "Қалған ақша, тг",
      "Көп кітап саны",
      "Жетпейтін ақша, тг"
    ]
  ],
  [
    "common-item",
    "Дана «4» дәптер мен «1» қалам алды. Ерке сондай «10» дәптер мен «1» қаламға «1080» тг артық төледі. Дана барлығы «1400» тг төледі. Бір қаламның бағасын тап.",
    "680",
    "Дәптер санының айырмасы 10 − 4 = 6. Бір дәптер 1080 ÷ 6 = 180 тг. Дәптерлер 180 × 4 = 720 тг. Қалам 1400 − 720 = 680 тг.",
    [
      4,
      1,
      10,
      1,
      1080,
      1400
    ],
    [
      "Бірінші дәптер саны",
      "Бірінші қалам саны",
      "Екінші дәптер саны",
      "Екінші қалам саны",
      "Төлем айырмасы, тг",
      "Бірінші төлем, тг"
    ]
  ],
  [
    "third-share",
    "Үш асхана бірдей бағамен «15», «9», «4» кг күріш алды. Біріншісі екіншісінен «2700» тг артық төледі. Үшіншісі неше теңге төледі?",
    "1800",
    "Масса айырмасы 15 − 9 = 6 кг. Килограмы 2700 ÷ 6 = 450 тг. Үшіншісі 450 × 4 = 1800 тг төледі.",
    [
      15,
      9,
      4,
      2700
    ],
    [
      "Бірінші масса, кг",
      "Екінші масса, кг",
      "Үшінші масса, кг",
      "Төлем айырмасы, тг"
    ],
    [
      "1800",
      "2250",
      "6750",
      "4050"
    ]
  ],
  [
    "clock-total-distance",
    "Екі бала бірдей жылдамдықпен мектепке барады. Аян «7» сағ «10» минутта шығып, «7» сағ «40» минутта жетті. Дана «7» сағ «22» минутта шығып, «7» сағ «40» минутта жетті. Аянның жолы «900» м ұзын. Екеуінің жолын қоссақ неше метр?",
    "3600",
    "Уақыттар 30 және 18 минут. Айырмасы 12 минут. Жылдамдық 900 ÷ 12 = 75 м/мин. Жол қосындысы 75 × (30 + 18) = 3600 м.",
    [
      7,
      10,
      7,
      40,
      7,
      22,
      7,
      40,
      900
    ],
    [
      "Аян шығу сағаты",
      "Аян шығу минуты",
      "Аян жету сағаты",
      "Аян жету минуты",
      "Дана шығу сағаты",
      "Дана шығу минуты",
      "Дана жету сағаты",
      "Дана жету минуты",
      "Жол айырмасы, м"
    ]
  ],
  [
    "first-share",
    "Бірдей бағамен бірінші адам «11», екіншісі «5» кг өрік алды. Біріншісі «2100» тг артық төледі. Бірінші адам неше теңге төледі?",
    "3850",
    "Артық масса 11 − 5 = 6 кг. Килограмы 2100 ÷ 6 = 350 тг. Бірінші төлем 350 × 11 = 3850 тг.",
    [
      11,
      5,
      2100
    ],
    [
      "Бірінші масса, кг",
      "Екінші масса, кг",
      "Төлем айырмасы, тг"
    ]
  ],
  [
    "clock-total-work",
    "Өнімділігі бірдей екі кран істеді. Біріншісі «7» сағ «0» минуттан «16» сағ «0» минутқа дейін, екіншісі «9» сағ «0» минуттан «14» сағ «0» минутқа дейін істеді. Біріншісі «96» т артық көтерді. Барлығы неше тонна көтерді?",
    "336",
    "Уақыттар 9 және 5 сағат. Айырмасы 4. Өнімділік 96 ÷ 4 = 24 т/сағ. Барлығы 24 × (9 + 5) = 336 т.",
    [
      7,
      0,
      16,
      0,
      9,
      0,
      14,
      0,
      96
    ],
    [
      "Бірінші бастау сағаты",
      "Бірінші бастау минуты",
      "Бірінші аяқтау сағаты",
      "Бірінші аяқтау минуты",
      "Екінші бастау сағаты",
      "Екінші бастау минуты",
      "Екінші аяқтау сағаты",
      "Екінші аяқтау минуты",
      "Жүк айырмасы, т"
    ],
    [
      "1344",
      "336",
      "120",
      "216"
    ]
  ],
  [
    "second-area",
    "Ені бірдей екі жер телімінің ұзындықтары «65» және «45» м. Бірінші телімнің ауданы «500» м² артық. Екінші телімнің ауданын тап.",
    "1125",
    "Ұзындық айырмасы 65 − 45 = 20 м. Ені 500 ÷ 20 = 25 м. Екінші аудан 45 × 25 = 1125 м².",
    [
      65,
      45,
      500
    ],
    [
      "Бірінші ұзындық, м",
      "Екінші ұзындық, м",
      "Аудан айырмасы, м²"
    ],
    [
      "2750",
      "500",
      "1625",
      "1125"
    ]
  ]
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),txt=(id,x,y,s,size=18)=>`<text id="${id}" x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#29486d">${esc(s)}</text>`;
export function draw(i){const[,,,,v,labels]=SPECS[i];let body='',start=35;if([3,4,13].includes(i)){const[a,b,d]=v,w=d/(a-b),scale=Math.min(270/a,65/w);[a,b].forEach((x,j)=>{body+=`<rect id="field-${j}" x="35" y="${25+j*100}" width="${x*scale}" height="${w*scale}" fill="${j?'#cfc3ee':'#bed5f3'}" stroke="#94aeca"/>`+txt('length-'+j,35+x*scale/2,110+j*100,x,16);});start=245;}
 if([10,12].includes(i)){body+=txt('clock-0',180,40,`${v[0]}:${String(v[1]).padStart(2,'0')} → ${v[2]}:${String(v[3]).padStart(2,'0')}`,25)+txt('clock-1',180,85,`${v[4]}:${String(v[5]).padStart(2,'0')} → ${v[6]}:${String(v[7]).padStart(2,'0')}`,25);start=130;}
 const cols=v.length>5?2:1;v.forEach((x,j)=>{const xx=cols===1?180:90+j%2*180,yy=start+Math.floor(j/cols)*60;body+=txt('input-'+j,xx,yy,labels[j],cols===1?14:11)+txt('value-'+j,xx,yy+27,x,23);});const height=start+Math.ceil(v.length/cols)*60+15;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">Екі айырма бойынша есеп</title><metadata id="actual-inputs">${esc(JSON.stringify(v))}</metadata><rect width="360" height="${height}" rx="18" fill="#f6f9ff"/>${body}</svg>\n`;}
function row(s,i){const[k,statement,answer,solution,,,options]=s,ref=refs[i],source=JSON.parse(fs.readFileSync(new URL('../../'+ref.sourceFile,import.meta.url))).questions.find(q=>q.id===ref.sourceId),image=`/figures/synaq-editions/${name}-${i}-native.svg`;assert.equal(source.options?.length||0,options?.length||0);return{editionId:`${name}-${i}`,modelId:`${name}-${k}`,grade:4,topic:'word',difficulty:'medium',minimumPlan:'pro',params:{number:i},sourceRefs:[ref],sourceAnswerAvailability:'all_saved_text_official_solutions_options_and_complete_givens_recomputed',adaptationChanges:['14 full source/new conditions official/new solutions and24 choices read. Changed data and contexts preserve equal unit differences clock durations area/perimeter and ordered quantities; all choices separately checked.','14 original native SVGs with measured equal-width rectangles and readable clock panels; no reused source art. Same author computational review, not another human. Standard+ local only.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,...(options?{options}:{}),image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const i=Number(r.editionId.split('-').at(-1));assert.ok(SPECS[i]);assert.equal(canonicalEdition(r),canonicalEdition(row(SPECS[i],i)),'Unreviewed shifts/sets task');return{answer:r.answer,checks:['actual units remainders Venn cells checked','own native SVG','Standard+ only']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){SPECS.forEach((_,i)=>fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${i}-native.svg`,import.meta.url),draw(i)));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'14 grade4 differences localStandard+' ,sourceOccurrences:14,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions},null,2)+'\n');console.log({authored:14,choices:editions.reduce((s,r)=>s+(r.options?.length||0),0)});}
