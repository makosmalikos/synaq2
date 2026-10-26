import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='course4-productivity';
const refs=[{"sourceFile": "problems/sources/zerek/courses/4-math-6-1-level1.json", "sourceId": "b6ba9780f5ceb7be"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-1-level1.json", "sourceId": "ba421786a1b06ed8"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-1-level2.json", "sourceId": "519191597782f56b"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-1-level2.json", "sourceId": "a5116b3467313e3a"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-1-level2.json", "sourceId": "c988fb8c7993034e"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-1-level2.json", "sourceId": "f6fb2a1ab42eb153"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-1-level3.json", "sourceId": "611126b699b9256c"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-1-level3.json", "sourceId": "67c93b362b688dbb"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-1-level3.json", "sourceId": "a22865d2c3f5b553"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-1-level3.json", "sourceId": "adefe80a96da3542"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-1-level3.json", "sourceId": "b0b60b4f9ed46f37"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-1-leveltest.json", "sourceId": "1d0b99070d520dbd"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-1-leveltest.json", "sourceId": "af2d1ef9967383ac"}];
export const SPECS=[
  [
    "rate",
    "Баспа құрылғысы «5» сағатта «1500» кітап шығарды. Сағатына неше кітап шығарады?",
    "300",
    "Өнімділік 1500 ÷ 5 = 300 кітап/сағ.",
    [
      5,
      1500
    ],
    [
      "Уақыт, сағ",
      "Кітап саны"
    ]
  ],
  [
    "work",
    "Наубайшы сағатына «54» нан пісіреді. «8» сағатта неше нан пісіреді?",
    "432",
    "Жұмыс көлемі 54 × 8 = 432 нан.",
    [
      54,
      8
    ],
    [
      "Бір сағатта",
      "Уақыт, сағ"
    ]
  ],
  [
    "remaining-time",
    "Тігінші «96» сөмке тігуі керек. Алғашқы «6» күнде күніне «9» сөмкеден тікті. Қалғанын күніне «14» сөмкеден тіксе, тағы неше күн керек?",
    "3",
    "Тігілгені 6 × 9 = 54 сөмке. Қалғаны 96 − 54 = 42. Уақыт 42 ÷ 14 = 3 күн.",
    [
      96,
      6,
      9,
      14
    ],
    [
      "Тапсырыс саны",
      "Алғашқы күн саны",
      "Алғашқы өнімділік",
      "Жаңа өнімділік"
    ]
  ],
  [
    "clock-work",
    "Наубайхана сағатына «135» бөлке пісіреді. Сағат «5»-тен «14»-ке дейін үзіліссіз жұмыс істеді. Неше бөлке пісірді?",
    "1215",
    "Уақыт 14 − 5 = 9 сағат. Жұмыс 135 × 9 = 1215 бөлке.",
    [
      135,
      5,
      14
    ],
    [
      "Бір сағатта",
      "Басталу сағаты",
      "Аяқталу сағаты"
    ]
  ],
  [
    "fraction-remaining-time",
    "Баспахана «1800» кітаптың «1/3» бөлігін басып болды. Сағатына «200» кітап басса, қалғанына неше сағат керек?",
    "6",
    "Басылғаны 1800 ÷ 3 = 600. Қалғаны 1800 − 600 = 1200. Уақыт 1200 ÷ 200 = 6 сағат.",
    [
      1800,
      "1/3",
      200
    ],
    [
      "Тапсырыс саны",
      "Басылған бөлік",
      "Бір сағатта"
    ]
  ],
  [
    "compare-workers",
    "Шебер «8» сағат бойы сағатына «19» бөлшек, шәкірт «10» сағат бойы сағатына «14» бөлшек жасады. Кім көп және неше бөлшекке?",
    "шебер, 12 бөлшекке",
    "Шебер 8 × 19 = 152 бөлшек, шәкірт 10 × 14 = 140 бөлшек жасады. Шебер 152 − 140 = 12 бөлшекке көп жасады.",
    [
      8,
      19,
      10,
      14
    ],
    [
      "Шебер уақыты, сағ",
      "Шебер өнімділігі",
      "Шәкірт уақыты, сағ",
      "Шәкірт өнімділігі"
    ],
    [
      "екеуі бірдей",
      "шәкірт, 12 бөлшекке",
      "шебер, 12 бөлшекке",
      "шәкірт, 6 бөлшекке"
    ]
  ],
  [
    "equal-work-rate-difference",
    "Шебер мен шәкірт бөлек жұмыс істеп, бірдей бөлшек санын жасады. Шебер «5», шәкірт «8» сағат жұмыс істеді. Шебер сағатына «6» бөлшек артық жасайды. Әрқайсысы неше бөлшек жасады?",
    "80",
    "Уақыт айырмасы 8 − 5 = 3 сағат. Шәкірттің өнімділігі 6 × 5 ÷ 3 = 10. Шебердікі 16. Әрқайсысы 10 × 8 = 80 бөлшек жасады.",
    [
      5,
      8,
      6
    ],
    [
      "Шебер уақыты, сағ",
      "Шәкірт уақыты, сағ",
      "Өнімділік айырмасы"
    ]
  ],
  [
    "cycle-production-difference",
    "Шебер әр «4» минутта «3» бөлшек, шәкірт әр «6» минутта «3» бөлшек жасайды. «2» сағатта шебер неше бөлшек артық жасайды?",
    "30",
    "Екі сағат 120 минут. Шебер 120 ÷ 4 × 3 = 90, шәкірт 120 ÷ 6 × 3 = 60 бөлшек жасайды. Айырма 90 − 60 = 30.",
    [
      4,
      3,
      6,
      3,
      2
    ],
    [
      "Шебер, минут",
      "Осы уақытта бөлшек",
      "Шәкірт, минут",
      "Осы уақытта бөлшек",
      "Барлық уақыт, сағ"
    ]
  ],
  [
    "increased-rate-total-time",
    "Шебер «360» бөлшек жасауы керек. Алғашқы «4» сағатта сағатына «30» бөлшек жасады, кейін өнімділігін «2» есе арттырды. Жұмысты барлығы неше сағатта бітірді?",
    "8",
    "Алғашқы жұмыс 4 × 30 = 120. Қалғаны 360 − 120 = 240. Жаңа өнімділік 60, оған 240 ÷ 60 = 4 сағат керек. Барлығы 4 + 4 = 8 сағат.",
    [
      360,
      4,
      30,
      2
    ],
    [
      "Барлық бөлшек",
      "Алғашқы уақыт, сағ",
      "Алғашқы өнімділік",
      "Арту еселігі"
    ]
  ],
  [
    "arithmetic-progressive-work",
    "Шебер бірінші сағатта «12» бөлшек, әр келесі сағатта алдыңғыдан «3» бөлшек артық жасады. «6» сағатта барлығы неше бөлшек жасайды?",
    "117",
    "Сағаттар бойынша 12, 15, 18, 21, 24, 27 бөлшек. Қосындысы 12 + 15 + 18 + 21 + 24 + 27 = 117.",
    [
      12,
      3,
      6
    ],
    [
      "Бірінші сағатта",
      "Әр сағаттағы өсім",
      "Сағат саны"
    ],
    [
      "27",
      "117",
      "72",
      "162"
    ]
  ],
  [
    "planned-vs-actual-time",
    "Баспа тапсырысты «8» күнде күніне «420» кітаптан бітіруді жоспарлады. Алғашқы «3» күн жоспар бойынша, кейін күніне «700» кітап шығарды. Барлығы неше күн жұмыс істеді?",
    "6",
    "Тапсырыс 8 × 420 = 3360 кітап. Алғашқысы 3 × 420 = 1260. Қалғаны 3360 − 1260 = 2100. Оған 2100 ÷ 700 = 3 күн. Барлығы 3 + 3 = 6 күн.",
    [
      8,
      420,
      3,
      700
    ],
    [
      "Жоспарлы күн саны",
      "Жоспарлы өнімділік",
      "Алғашқы күн саны",
      "Жаңа өнімділік"
    ]
  ],
  [
    "mixed-time-cycle-work",
    "Шебер әр «4» минутта «5» бөлшек жасайды. «2» сағат «20» минутта неше бөлшек жасайды?",
    "175",
    "Уақыт 140 минут. Цикл саны 140 ÷ 4 = 35. Бөлшек саны 35 × 5 = 175.",
    [
      4,
      5,
      2,
      20
    ],
    [
      "Бір цикл, мин",
      "Циклдегі бөлшек",
      "Сағат",
      "Қосымша минут"
    ]
  ],
  [
    "remaining-time",
    "Баспа «1260» парақ дайындауы керек. Алғашқы «4» сағатта сағатына «210» парақ дайындады. Қалғанын сағатына «105» парақтан жасаса, тағы неше сағат керек?",
    "4",
    "Дайыны 4 × 210 = 840. Қалғаны 1260 − 840 = 420. Қалған уақыт 420 ÷ 105 = 4 сағат.",
    [
      1260,
      4,
      210,
      105
    ],
    [
      "Барлық парақ",
      "Алғашқы уақыт, сағ",
      "Алғашқы өнімділік",
      "Жаңа өнімділік"
    ]
  ]
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),txt=(id,x,y,s,size=18)=>`<text id="${id}" x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#29486d">${esc(s)}</text>`;
export function draw(i){const[,,,,v,labels]=SPECS[i];let body='',start=35;if(i===4){start=145;const[n,d]=v[1].split('/').map(Number);for(let j=0;j<d;j++)body+=`<rect id="fraction-piece-${j}" x="${30+j*300/d}" y="35" width="${300/d}" height="40" fill="${j<n?'#abc9ee':'#eee7f7'}" stroke="#94aeca"/>`;body+=txt('fraction-caption',180,113,'Көк бөлік — басылғаны',16);}
 if(i===6){start=190;for(let k=0;k<2;k++){body+=txt('worker-label-'+k,180,30+k*70,k?'Шәкірт':'Шебер',15);for(let j=0;j<v[k];j++)body+=`<rect id="time-${k}-${j}" x="${30+j*300/v[k]}" y="${42+k*70}" width="${300/v[k]}" height="30" fill="${k?'#d9c9ec':'#bdd4f1'}" stroke="#94aeca"/>`;}}
 if(i===9){start=235;const[first,step,n]=v,last=first+step*(n-1),scale=125/last;for(let j=0;j<n;j++){const val=first+step*j;body+=`<rect id="hour-${j}" x="${25+j*310/n}" y="${165-val*scale}" width="${260/n}" height="${val*scale}" fill="${j%2?'#d9c9ec':'#bdd4f1'}"/>`+txt('hour-number-'+j,25+j*310/n+130/n,188,j+1,14)+txt('hour-value-'+j,25+j*310/n+130/n,155-val*scale,val,14);}}
 v.forEach((x,j)=>body+=txt('input-'+j,180,start+j*52,labels[j],14)+txt('value-'+j,180,start+j*52+27,x,23));const height=start+v.length*52+15;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">Өнімділік уақыт және жұмыс</title><metadata id="actual-inputs">${esc(JSON.stringify(v))}</metadata><rect width="360" height="${height}" rx="18" fill="#f6f9ff"/>${body}</svg>\n`;}
function row(s,i){const[k,statement,answer,solution,,,options]=s,ref=refs[i],source=JSON.parse(fs.readFileSync(new URL('../../'+ref.sourceFile,import.meta.url))).questions.find(q=>q.id===ref.sourceId),image=`/figures/synaq-editions/${name}-${i}-native.svg`;assert.equal(source.options?.length||0,options?.length||0);return{editionId:`${name}-${i}`,modelId:`${name}-${k}`,grade:4,topic:'word',difficulty:'medium',minimumPlan:'pro',params:{number:i},sourceRefs:[ref],sourceAnswerAvailability:'all_saved_text_official_solutions_options_and_complete_givens_recomputed',adaptationChanges:['All13 full saved/new conditions official/new solutions and8 source/new options read. Changed rates durations outputs contexts and fraction preserve work-rate identities, equal work, cycle counts, progression and requested quantity.','13 original SVGs replace13 saved pictures without tracing. Actual equal-work strips, fractional completed pieces and progressive hourly bars independently checked. Standard+ local only; same author computational reviewer, not another human.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,...(options?{options}:{}),image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const i=Number(r.editionId.split('-').at(-1));assert.ok(SPECS[i]);assert.equal(canonicalEdition(r),canonicalEdition(row(SPECS[i],i)),'Unreviewed shifts/sets task');return{answer:r.answer,checks:['actual units remainders Venn cells checked','own native SVG','Standard+ only']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){SPECS.forEach((_,i)=>fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${i}-native.svg`,import.meta.url),draw(i)));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'13 grade4 topic6-1 productivity localStandard+' ,sourceOccurrences:13,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions},null,2)+'\n');console.log({authored:13,choices:editions.reduce((s,r)=>s+(r.options?.length||0),0)});}
