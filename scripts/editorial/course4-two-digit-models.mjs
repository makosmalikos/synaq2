import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='course4-two-digit';
const refs=[{"sourceFile": "problems/sources/zerek/courses/4-math-5-5-level1.json", "sourceId": "35f8ee106f162579"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-5-level1.json", "sourceId": "7412eb6f8003c972"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-5-level1.json", "sourceId": "8ca7db3ac3f040f9"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-5-level1.json", "sourceId": "e7e7f92376fcda31"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-5-level2.json", "sourceId": "17160aab3868c275"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-5-level2.json", "sourceId": "1dbaa95d55b13a35"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-5-level2.json", "sourceId": "74f899b9ba697d14"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-5-level3.json", "sourceId": "1eae6e034fcd800d"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-5-level3.json", "sourceId": "9f385d449b6a3512"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-5-level3.json", "sourceId": "a1ac71e8b09b732a"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-5-level3.json", "sourceId": "e229940ffc033f5c"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-5-leveltest.json", "sourceId": "1363c661fe6e4a9d"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-5-leveltest.json", "sourceId": "74cb999a194ffba9"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-5-leveltest.json", "sourceId": "b9fb2e03ef02f56c"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-6-level1.json", "sourceId": "4a08b3d079f2d9ea"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-6-level1.json", "sourceId": "4fce3d3faac6ba88"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-6-level1.json", "sourceId": "c2bc8eebf9cd5655"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-6-level1.json", "sourceId": "d4c73c59d3bf697a"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-6-level1.json", "sourceId": "e24a1bb65591f0c2"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-6-level2.json", "sourceId": "89236f47b62ae612"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-6-level2.json", "sourceId": "905277cbc802935f"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-6-level2.json", "sourceId": "fe2074122ab54bd4"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-6-level3.json", "sourceId": "55e61052de66a4a0"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-6-level3.json", "sourceId": "67efed538b5f448a"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-6-leveltest.json", "sourceId": "5f13c3d12f909506"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-6-leveltest.json", "sourceId": "c7b73de882c8f104"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-6-leveltest.json", "sourceId": "dc2dbca3764277d3"}];
export const SPECS=[
  [
    "distance",
    "Пойыз «76» км/сағ жылдамдықпен «16» сағат жүрді. Жүрген жолы неше километр?",
    "1216",
    "Жол жылдамдық пен уақыттың көбейтіндісі. 76 × 16 = 1216 км.",
    [
      76,
      16
    ],
    [
      "Жылдамдық, км/сағ",
      "Уақыт, сағ"
    ]
  ],
  [
    "column-product",
    "Бағанмен есептеңіз: «458 × 37».",
    "16946",
    "Бірліктер: 458 × 7 = 3206. Ондықтар: 458 × 30 = 13740. Барлығы 3206 + 13740 = 16946.",
    [
      458,
      37
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ]
  ],
  [
    "first-partial",
    "«364 × 58» көбейтуіндегі бірінші толымсыз көбейтіндіні табыңыз.",
    "2912",
    "Бірінші толымсыз көбейтінді бірліктерден шығады: 364 × 8 = 2912. Ондықтардан 18200, толық көбейтінді 21112 болады.",
    [
      364,
      58
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ],
    [
      "18200",
      "2912",
      "21112",
      "1820"
    ]
  ],
  [
    "seats",
    "Залда «24» қатар бар, әр қатарда «32» орын. Барлығы неше орын?",
    "768",
    "Орын саны 24 × 32 = 768. Қосу немесе ондықтарды жылжытпай қосу дұрыс емес.",
    [
      24,
      32
    ],
    [
      "Қатар саны",
      "Қатардағы орын"
    ],
    [
      "768",
      "748",
      "56",
      "192"
    ]
  ],
  [
    "rectangle-area",
    "Тіктөртбұрыш алаңның ұзындығы «135» м, ені «56» м. Ауданы қанша?",
    "7560 м²",
    "Аудан 135 × 56 = 7560 м². 191 — екі қабырғаның қосындысы, 382 — периметр.",
    [
      135,
      56
    ],
    [
      "Ұзындық, м",
      "Ені, м"
    ],
    [
      "7560 м²",
      "191 м²",
      "756 м²",
      "382 м²"
    ]
  ],
  [
    "opposite-distance",
    "Бір нүктеден бір мезгілде қарама-қарсы шыққан көліктер «78» және «86» км/сағ жүреді. «14» сағаттан кейін аралары неше километр?",
    "2296",
    "Алшақтау жылдамдығы 78 + 86 = 164 км/сағ. 164 × 14 = 2296 км.",
    [
      78,
      86,
      14
    ],
    [
      "Бірінші, км/сағ",
      "Екінші, км/сағ",
      "Уақыт, сағ"
    ]
  ],
  [
    "two-products",
    "Дүкенге «22» килограмнан «34» жәшік алма және «17» килограмнан «26» жәшік алмұрт келді. Барлығы неше килограмм жеміс?",
    "1190",
    "Алма 22 × 34 = 748 кг. Алмұрт 17 × 26 = 442 кг. Барлығы 748 + 442 = 1190 кг.",
    [
      22,
      34,
      17,
      26
    ],
    [
      "Алма, бір жәшік кг",
      "Алма жәшік саны",
      "Алмұрт, бір жәшік кг",
      "Алмұрт жәшік саны"
    ]
  ],
  [
    "hidden-first-factor",
    "Әр □ — жасырылған цифр. «3□8 × 27 = 9□96» теңдігіндегі бірінші көбейткішті табыңыз.",
    "348",
    "348 × 27 = 9396. Осы маскаларға сәйкес келетін басқа цифр жоқ. Бірінші көбейткіш 348.",
    [
      "3□8",
      "27",
      "9□96"
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш",
      "Көбейтінді"
    ]
  ],
  [
    "hidden-product",
    "Әр □ — жасырылған цифр. «2□7 × 3□ = 8□29» теңдігіндегі толық көбейтіндіні табыңыз.",
    "8029",
    "Бірліктер бойынша екінші көбейткіш 37 болады. Барлық цифрларды тексергенде 217 × 37 = 8029 ғана сәйкес келеді.",
    [
      "2□7",
      "3□",
      "8□29"
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш",
      "Көбейтінді"
    ]
  ],
  [
    "tens-shift-error",
    "Ермек «348 × 36» көбейтті. Бірінші толымсыз көбейтінді «2088» — дұрыс. Екінші толымсыз көбейтіндіні «348 × 30» үшін «1044» деп, бірліктерден бастап жылжытпай жазып қосты. Дұрыс жауап оның жауабынан қаншаға артық?",
    "9396",
    "Ермектің жауабы 2088 + 1044 = 3132. Дұрысы 2088 + 10440 = 12528. Айырмасы 12528 − 3132 = 9396.",
    [
      348,
      36,
      2088,
      1044
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш",
      "Бірінші толымсыз",
      "Жылжытылмаған екінші"
    ]
  ],
  [
    "product-from-first-partial",
    "Белгісіз санды «34»-ке көбейткенде бірінші толымсыз көбейтінді «1416» шықты. Толық көбейтіндіні табыңыз.",
    "12036",
    "Белгісіз сан 1416 ÷ 4 = 354. Толық көбейтінді 354 × 34 = 12036. Ондықтар 10620 болады.",
    [
      34,
      1416
    ],
    [
      "Екінші көбейткіш",
      "Бірінші толымсыз"
    ],
    [
      "12136",
      "48144",
      "2478",
      "12036"
    ]
  ],
  [
    "second-partial",
    "«386 × 64» көбейтуіндегі екінші толымсыз көбейтіндіні толық сан түрінде, ондық разрядын ескеріп табыңыз.",
    "23160",
    "Екінші толымсыз көбейтінді 386 × 60 = 23160. Біріншісі 1544, толық көбейтінді 24704.",
    [
      386,
      64
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ],
    [
      "20160",
      "24704",
      "1544",
      "23160"
    ]
  ],
  [
    "column-product",
    "Бағанмен есептеңіз: «574 × 39».",
    "22386",
    "Бірліктер: 574 × 9 = 5166. Ондықтар: 574 × 30 = 17220. Барлығы 5166 + 17220 = 22386.",
    [
      574,
      39
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ]
  ],
  [
    "hidden-first-factor",
    "Әр □ — жасырылған цифр. «4□6 × 23 = 1□258» теңдігіндегі бірінші көбейткіш қандай?",
    "446",
    "446 × 23 = 10258. Қалған ұсынылған сандар көбейтінді маскасына сәйкес келмейді.",
    [
      "4□6",
      "23",
      "1□258"
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш",
      "Көбейтінді"
    ],
    [
      "476",
      "456",
      "436",
      "446"
    ]
  ],
  [
    "quotient",
    "«1224» дәптер «34» оқушыға тең берілді. Бір оқушы неше дәптер алды?",
    "36",
    "1224 ÷ 34 = 36. Тексеру: 36 × 34 = 1224.",
    [
      1224,
      34
    ],
    [
      "Дәптер саны",
      "Оқушы саны"
    ]
  ],
  [
    "unit-price",
    "Бірдей «24» кітапқа «7920» теңге төленді. Бір кітап неше теңге?",
    "330",
    "7920 ÷ 24 = 330 теңге. Тексеру: 330 × 24 = 7920.",
    [
      24,
      7920
    ],
    [
      "Кітап саны",
      "Барлық құн, ₸"
    ]
  ],
  [
    "speed",
    "Көлік «16» сағатта «1152» км жүрді. Жылдамдығын табыңыз.",
    "72 км/сағ",
    "Жылдамдық 1152 ÷ 16 = 72 км/сағ. Тексеру: 72 × 16 = 1152.",
    [
      16,
      1152
    ],
    [
      "Уақыт, сағ",
      "Жол, км"
    ],
    [
      "62 км/сағ",
      "82 км/сағ",
      "1136 км/сағ",
      "72 км/сағ"
    ]
  ],
  [
    "quotient",
    "Есептеңіз: «616 ÷ 77».",
    "8",
    "77 × 8 = 616. Сондықтан 616 ÷ 77 = 8.",
    [
      616,
      77
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "quotient",
    "Бұрышпен бөліңіз: «4134 ÷ 53».",
    "78",
    "413 ÷ 53 бүтін бөлігі 7, қалдық 42. Соңғы 4-ті түсіргенде 424 шығады. 424 ÷ 53 = 8. Бөлінді 78.",
    [
      4134,
      53
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "nested-shelves",
    "Кітапхана «2016» кітапты сөрелерге «42»-ден қойды. Әр шкафта «16» сөре бар. Неше шкаф толық толды?",
    "3",
    "Сөре саны 2016 ÷ 42 = 48. Шкаф саны 48 ÷ 16 = 3.",
    [
      2016,
      42,
      16
    ],
    [
      "Кітап саны",
      "Сөредегі кітап",
      "Шкафтағы сөре"
    ]
  ],
  [
    "rectangle-perimeter",
    "Тіктөртбұрыш бақшаның ауданы «1512» м², ені «28» м. Периметрі қандай?",
    "164 м",
    "Ұзындығы 1512 ÷ 28 = 54 м. Жарты периметр 54 + 28 = 82 м. Периметр 82 × 2 = 164 м.",
    [
      1512,
      28
    ],
    [
      "Аудан, м²",
      "Ені, м"
    ],
    [
      "108 м",
      "164 м",
      "54 м",
      "82 м"
    ]
  ],
  [
    "same-speed-duration",
    "Айша «18» минутта «1296» м жүрді. Осы жылдамдықпен «2304» м-ге неше минут жұмсайды?",
    "32",
    "Жылдамдық 1296 ÷ 18 = 72 м/мин. Жаңа уақыт 2304 ÷ 72 = 32 минут.",
    [
      18,
      1296,
      2304
    ],
    [
      "Бастапқы уақыт, мин",
      "Бастапқы жол, м",
      "Жаңа жол, м"
    ]
  ],
  [
    "first-leg-duration",
    "Пойыз бірінші бөлікті «84» км/сағ жылдамдықпен жүрді. Екінші бөлікті «76» км/сағ жылдамдықпен «6» сағатта өтті. Барлық жол «1128» км. Бірінші бөлікке неше сағат кетті?",
    "8 сағ",
    "Екінші бөлік 76 × 6 = 456 км. Біріншісі 1128 − 456 = 672 км. Уақыты 672 ÷ 84 = 8 сағат. Барлық уақыт 14 сағат.",
    [
      84,
      76,
      6,
      1128
    ],
    [
      "Бірінші, км/сағ",
      "Екінші, км/сағ",
      "Екінші уақыт, сағ",
      "Барлық жол, км"
    ],
    [
      "14 сағ",
      "9 сағ",
      "7 сағ",
      "8 сағ"
    ]
  ],
  [
    "hidden-dividend-digit",
    "«4□12 ÷ 62» бөлуі қалдықсыз. □ орнындағы цифр қандай?",
    "7",
    "4712 ÷ 62 = 76. Жасырылған цифр 7. Өзге цифрлар қалдықсыз бөлінетін сан бермейді.",
    [
      "4□12",
      "62"
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "quotient",
    "Бұрышпен бөліңіз: «5621 ÷ 73».",
    "77",
    "562 ÷ 73 бүтін бөлігі 7, қалдық 51. Соңғы 1-ді түсіргенде 511. 511 ÷ 73 = 7. Бөлінді 77.",
    [
      5621,
      73
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "hidden-dividend-digit",
    "«5□04 ÷ 68» бөлуі қалдықсыз. □ орнына қандай цифр келеді?",
    "3",
    "5304 ÷ 68 = 78. Жасырылған цифр 3. Барлық он цифрды тексеру жалғыз шешім береді.",
    [
      "5□04",
      "68"
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ]
  ],
  [
    "proportional-price",
    "Бірдей «18» доп «11430» теңге тұрады. Осындай «12» доп қанша тұрады?",
    "7620",
    "Бір доп 11430 ÷ 18 = 635 теңге. Он екі доп 635 × 12 = 7620 теңге.",
    [
      18,
      11430,
      12
    ],
    [
      "Бастапқы доп саны",
      "Бастапқы құны, ₸",
      "Жаңа доп саны"
    ]
  ]
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),txt=(id,x,y,s,size=18)=>`<text id="${id}" x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#29486d">${esc(s)}</text>`;
export function draw(i){const[,,,,v,labels]=SPECS[i];let body='',start=35;const mul=[1,2,7,8,11,12,13].includes(i),div=[17,18,23,24,25].includes(i);if(mul){start=195;body+=`<text id="operand-a" x="300" y="60" text-anchor="end" font-family="monospace" font-size="28" fill="#29486d">${esc(v[0])}</text><text id="operator" x="45" y="104" font-size="25" fill="#29486d">×</text><text id="operand-b" x="300" y="104" text-anchor="end" font-family="monospace" font-size="28" fill="#29486d">${esc(v[1])}</text><line id="column-rule" x1="35" y1="117" x2="315" y2="117" stroke="#93aace" stroke-width="2"/>`;if(v.length===3)body+=`<text id="shown-result" x="300" y="155" text-anchor="end" font-family="monospace" font-size="28" fill="#29486d">${esc(v[2])}</text>`;}
 if(div){start=190;body+=`<text id="operand-a" x="185" y="60" text-anchor="end" font-family="monospace" font-size="28" fill="#29486d">${esc(v[0])}</text><text id="operand-b" x="300" y="60" text-anchor="end" font-family="monospace" font-size="28" fill="#29486d">${esc(v[1])}</text><line id="division-vertical" x1="210" y1="30" x2="210" y2="140" stroke="#93aace" stroke-width="2"/><line id="division-horizontal" x1="210" y1="78" x2="320" y2="78" stroke="#93aace" stroke-width="2"/>`+txt('quotient-unknown',275,120,'?',29);}
 if([3,4,20].includes(i)){start=200;const a=i===20?v[0]/v[1]:i===3?v[1]:v[0],b=i===3?v[0]:v[1],s=Math.min(280/a,125/b);body+=`<rect id="field" x="35" y="30" width="${a*s}" height="${b*s}" fill="#d2e7dc" stroke="#8dafa3" stroke-width="2"/>`;if(i===3){for(let x=1;x<a;x++)body+=`<line id="seat-col-${x}" x1="${35+x*s}" y1="30" x2="${35+x*s}" y2="${30+b*s}" stroke="#8dafa3" stroke-width=".5"/>`;for(let y=1;y<b;y++)body+=`<line id="seat-row-${y}" x1="35" y1="${30+y*s}" x2="${35+a*s}" y2="${30+y*s}" stroke="#8dafa3" stroke-width=".5"/>`;}}
 if(i===5){start=155;body+=`<line id="left-direction" x1="170" y1="70" x2="45" y2="70" stroke="#6d93d1" stroke-width="4"/><polygon id="left-head" points="45,70 57,63 57,77" fill="#6d93d1"/><line id="right-direction" x1="190" y1="70" x2="315" y2="70" stroke="#6d93d1" stroke-width="4"/><polygon id="right-head" points="315,70 303,63 303,77" fill="#6d93d1"/>`+txt('direction-caption',180,110,'Қарама-қарсы бағыт',16);}
 v.forEach((x,j)=>body+=txt('input-'+j,180,start+j*52,labels[j],14)+txt('value-'+j,180,start+j*52+27,x,23));const height=start+v.length*52+15;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">Екі таңбалы көбейту мен бөлу деректері</title><metadata id="actual-inputs">${esc(JSON.stringify(v))}</metadata><rect width="360" height="${height}" rx="18" fill="#f6f9ff"/>${body}</svg>\n`;}
function row(s,i){const[k,statement,answer,solution,,,options]=s,ref=refs[i],source=JSON.parse(fs.readFileSync(new URL('../../'+ref.sourceFile,import.meta.url))).questions.find(q=>q.id===ref.sourceId),image=`/figures/synaq-editions/${name}-${i}-native.svg`;assert.equal(source.options?.length||0,options?.length||0);return{editionId:`${name}-${i}`,modelId:`${name}-${k}`,grade:4,topic:'word',difficulty:'medium',minimumPlan:'pro',params:{number:i},sourceRefs:[ref],sourceAnswerAvailability:'all_saved_text_official_solutions_options_and_complete_givens_recomputed',adaptationChanges:['All27 full saved/new conditions official/new solutions and36 source/new options read. New operands people costs routes hidden masks and units preserve partial products, full products, omitted tens shifts, division and requested quantity.','27 original native SVGs replace27 source pictures without tracing. Every hidden operand and divisor digit exhaustively checked; full division steps and place-value partial products independently calculated. Standard+ local only; same author computational reviewer, not another human.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,...(options?{options}:{}),image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const i=Number(r.editionId.split('-').at(-1));assert.ok(SPECS[i]);assert.equal(canonicalEdition(r),canonicalEdition(row(SPECS[i],i)),'Unreviewed shifts/sets task');return{answer:r.answer,checks:['actual units remainders Venn cells checked','own native SVG','Standard+ only']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){SPECS.forEach((_,i)=>fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${i}-native.svg`,import.meta.url),draw(i)));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'27 grade4 topics5-5 and5-6 localStandard+' ,sourceOccurrences:27,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions},null,2)+'\n');console.log({authored:27,choices:editions.reduce((s,r)=>s+(r.options?.length||0),0)});}
