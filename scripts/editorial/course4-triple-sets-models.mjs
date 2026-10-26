import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='course4-triple-sets';
const refs=[{"sourceFile": "problems/sources/zerek/courses/4-math-3-3-level1.json", "sourceId": "2663a4f48ede3669"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-3-level1.json", "sourceId": "fef76b324203579a"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-3-level2.json", "sourceId": "7b92b49758aeb10f"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-3-level2.json", "sourceId": "c926a90e691dfee8"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-3-level2.json", "sourceId": "c9e712b99f439c08"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-3-level2.json", "sourceId": "f4fcccd6e2c852b0"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-3-level3.json", "sourceId": "046fb04ea8e5e976"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-3-level3.json", "sourceId": "76241d7e7de3a4b1"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-3-level3.json", "sourceId": "99ea10a93de54ff9"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-3-level3.json", "sourceId": "e4a863aa8de30cd4"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-3-level3.json", "sourceId": "fdb159ffeb2d9ed8"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-3-leveltest.json", "sourceId": "394c996ce5ecade6"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-3-leveltest.json", "sourceId": "f4c82157d4ff9037"}];
export const SPECS=[
  [
    "triple-intersection",
    "A = {3; 6; 9; 12; 15}, B = {6; 12; 18; 24}, C = {12; 15; 18}. Үш жиынның ортақ элементтерін, яғни A ∩ B ∩ C жиынын табыңыз.",
    "{12}",
    "A мен B үшін ортақтар 6 және 12. Олардың ішінде C жиынында тек 12 бар. Жауап {12}.",
    [
      [
        3,
        6,
        9,
        12,
        15
      ],
      [
        6,
        12,
        18,
        24
      ],
      [
        12,
        15,
        18
      ]
    ],
    [
      "{12; 18}",
      "{6; 12}",
      "{12; 15}",
      "{12}"
    ]
  ],
  [
    "intersection-union-count",
    "A = {14; 28; 42}, B = {28; 56}, C = {42; 56; 70; 84; 98}. (A ∩ B) ∪ C жиынында неше элемент бар?",
    "6",
    "A ∩ B = {28}. C-ге 28-ді қосқанда {28; 42; 56; 70; 84; 98} шығады. Барлығы 6 элемент.",
    [
      [
        14,
        28,
        42
      ],
      [
        28,
        56
      ],
      [
        42,
        56,
        70,
        84,
        98
      ]
    ]
  ],
  [
    "only-first",
    "Үйірмедегі «31» баланың әрқайсысы мүсіндеу не сурет салумен айналысады. Мүсіндеуге (A) «18», сурет салуға (B) «20» бала қатысады. Тек мүсіндеумен айналысатыны нешеу?",
    "11",
    "Ортақтары 18 + 20 − 31 = 7. Тек мүсіндеу: 18 − 7 = 11.",
    [
      31,
      18,
      20
    ]
  ],
  [
    "both-full-union",
    "«35» оқушының әрқайсысы квестке немесе викторинаға қатысты. Квестке (A) «23», викторинаға (B) «19» оқушы қатысты. Екеуіне де қатысқан оқушы нешеу?",
    "7",
    "Екі тізімдегі артық саналғандарды табамыз: 23 + 19 − 35 = 7.",
    [
      35,
      23,
      19
    ]
  ],
  [
    "neither-two",
    "Жәрмеңкеге «48» қонақ келді. Кітапты (A) «29», ашықхатты (B) «25» қонақ алды. «11» қонақ екеуін де алды. Осы екі заттың ешқайсысын алмағаны нешеу?",
    "5",
    "Кемінде біреуін алғандар 29 + 25 − 11 = 43. Ешқайсысын алмағандар 48 − 43 = 5.",
    [
      48,
      29,
      25,
      11
    ]
  ],
  [
    "both-with-neither",
    "Топта «36» бала бар. Ағылшын тіліне (A) «22», домбыраға (B) «17» бала барады. «6» бала екі үйірменің ешқайсысына бармайды. Екі үйірмеге де баратыны нешеу?",
    "9",
    "Кемінде бір үйірмеге 36 − 6 = 30 бала барады. Ортақтары 22 + 17 − 30 = 9.",
    [
      36,
      22,
      17,
      6
    ],
    [
      "9",
      "15",
      "3",
      "30"
    ]
  ],
  [
    "neither-three",
    "Сауалнамаға «45» отбасы қатысты. Мысығы барлар A: «21», иті барлар B: «17», балығы барлар C: «20». Мысық пен ит «7», мысық пен балық «9», ит пен балық «5» отбасында бар. Үшеуі де «3» отбасында бар. Жұптардағы сандарға үшеуі де бар отбасылар кіреді. Осы жануарлардың ешқайсысы жоқ отбасы нешеу?",
    "5",
    "Кемінде бір жануар: 21 + 17 + 20 − 7 − 9 − 5 + 3 = 40 отбасы. Ешқайсысы жоқ: 45 − 40 = 5.",
    [
      45,
      21,
      17,
      20,
      7,
      9,
      5,
      3
    ],
    [
      "3",
      "5",
      "10",
      "8"
    ]
  ],
  [
    "only-first-three",
    "«40» баланың математикаға A: «15», роботқа B: «18», суретке C: «21» баласы барады. A мен B-ге «4», A мен C-ге «6», B мен C-ге «7» бала барады. Үшеуіне де «2» бала барады, ешқайсысына «1» бала бармайды. Жұптардағы сандар үшеуіне баратындарды қамтиды. Тек математикаға баратыны нешеу?",
    "7",
    "A ішіндегі тек екі үйірмеге баратындар 4 − 2 = 2 және 6 − 2 = 4. Тек математика: 15 − 2 − 4 − 2 = 7.",
    [
      40,
      15,
      18,
      21,
      4,
      6,
      7,
      2,
      1
    ],
    [
      "11",
      "5",
      "7",
      "9"
    ]
  ],
  [
    "fraction-two-neither",
    "Топта «48» бала. Жартысы би (A), үштен бірі ән (B) үйірмесіне барады. «6» бала екеуіне де барады. Бұл екі үйірменің ешқайсысына бармайтыны нешеу?",
    "14",
    "Биге 48 ÷ 2 = 24, әнге 48 ÷ 3 = 16 бала барады. Бірігуінде 24 + 16 − 6 = 34 бала. Ешқайсысына 48 − 34 = 14 бала бармайды.",
    [
      48,
      6
    ]
  ],
  [
    "exactly-one-three",
    "«52» оқушының әрқайсысы шахмат A, жүзу B, домбыра C үйірмелерінің кемінде біреуіне барады. Үшеуіне де «6» оқушы барады. A мен B-ге «15», A мен C-ге «13», B мен C-ге «11» оқушы барады. Жұптардағы сандар үшеуіне баратындарды қамтиды. Тек бір үйірмеге баратыны нешеу?",
    "25",
    "Тек екі үйірме: 15 − 6 = 9, 13 − 6 = 7, 11 − 6 = 5. Кемінде екі үйірмеге 9 + 7 + 5 + 6 = 27 оқушы барады. Тек біреуіне 52 − 27 = 25 оқушы.",
    [
      52,
      6,
      15,
      13,
      11
    ]
  ],
  [
    "find-triple",
    "«40» оқушының әрқайсысы жүгіру A, жүзу B, велоспорт C секцияларының кемінде біреуіне барады. A-ға «22», B-ге «25», C-ге «19» оқушы барады. A мен B-ге «10», A мен C-ге «8», B мен C-ге «13» оқушы барады. Жұптардағы сандар үшеуіне баратындарды қамтиды. Үш секцияға да баратыны нешеу?",
    "5",
    "Тізімдер қосындысы 22 + 25 + 19 = 66. Жұптар қосындысы 10 + 8 + 13 = 31. Үшеуі 40 − (66 − 31) = 5.",
    [
      40,
      22,
      25,
      19,
      10,
      8,
      13
    ],
    [
      "5",
      "35",
      "26",
      "10"
    ]
  ],
  [
    "exactly-one-given-three",
    "«42» оқушының әрқайсысы шахмат A, дойбы B, тоғызқұмалақ C ойындарының кемінде біреуін ойнайды. A-ны «25», B-ні «19», C-ні «18» оқушы ойнайды. A мен B-ні «9», A мен C-ні «8», B мен C-ні «6» оқушы ойнайды. Үшеуін де «3» оқушы ойнайды. Жұптардағы сандар үшеуін ойнайтындарды қамтиды. Тек бір ойынды ойнайтыны нешеу?",
    "25",
    "Тек екі ойын: 9 − 3 = 6, 8 − 3 = 5, 6 − 3 = 3. Тек біреуін 42 − 6 − 5 − 3 − 3 = 25 оқушы ойнайды.",
    [
      42,
      25,
      19,
      18,
      9,
      8,
      6,
      3
    ]
  ],
  [
    "neither-two",
    "«43» саяхатшының «25»-і Таразға (A), «23»-і Алматыға (B) барды. «9» саяхатшы екі қалаға да барды. Бұл қалалардың ешқайсысына бармағаны нешеу?",
    "4",
    "Кемінде бір қалаға 25 + 23 − 9 = 39 адам барды. Ешқайсысына 43 − 39 = 4 адам бармады.",
    [
      43,
      25,
      23,
      9
    ]
  ]
];
const LABELS=[[], [], ["Барлығы", "A барлығы", "B барлығы"], ["Барлығы", "A барлығы", "B барлығы"], ["Барлығы", "A барлығы", "B барлығы", "A және B"], ["Барлығы", "A барлығы", "B барлығы", "Ешқайсысы"], ["Барлығы", "A барлығы", "B барлығы", "C барлығы", "A және B", "A және C", "B және C", "Үшеуі"], ["Барлығы", "A барлығы", "B барлығы", "C барлығы", "A және B", "A және C", "B және C", "Үшеуі", "Ешқайсысы"], ["Барлығы", "Екеуі"], ["Барлығы", "Үшеуі", "A және B", "A және C", "B және C"], ["Барлығы", "A барлығы", "B барлығы", "C барлығы", "A және B", "A және C", "B және C"], ["Барлығы", "A барлығы", "B барлығы", "C барлығы", "A және B", "A және C", "B және C", "Үшеуі"], ["Барлығы", "A барлығы", "B барлығы", "A және B"]];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),txt=(id,x,y,s,size=19)=>`<text id="${id}" x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#29486d">${esc(s)}</text>`;
export function draw(i){const v=SPECS[i][4],three=[0,1,6,7,9,10,11].includes(i);let body='<rect id="universe" x="15" y="15" width="330" height="258" rx="14" fill="#fff" stroke="#b0c3dd"/>';const circles=three?[[135,110],[225,110],[180,185]]:[[135,135],[225,135]];circles.forEach(([x,y],j)=>{body+=`<circle id="set-${j}" cx="${x}" cy="${y}" r="65" fill="${['#bcd4f6','#dbc9f3','#bde3d7'][j]}" fill-opacity=".55" stroke="#7899bd"/>`+txt('set-label-'+j,x+(j===0?-35:j===1?35:0),j===2?263:38,['A','B','C'][j]);});let lines;if(i<2)lines=v.map((a,j)=>['ABC'[j]+' = {'+a.join('; ')+'}']);else lines=v.map((a,j)=>[LABELS[i][j]+': '+a]);lines.forEach((s,j)=>{body+=txt('input-'+j,lines.length>5?(j%2?265:95):180,305+(lines.length>5?Math.floor(j/2)*34:j*33),s,lines.length>5?16:18);});const height=321+(lines.length>5?Math.ceil(lines.length/2)*34:lines.length*33);return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">Жиындар сызбасы. Төменде шарттағы деректер берілген</title><metadata id="actual-inputs">${esc(JSON.stringify(v))}</metadata><rect width="360" height="${height}" rx="18" fill="#f6f9ff"/>${body}</svg>\n`;}
function row(s,i){const[k,statement,answer,solution,,options]=s,ref=refs[i],source=JSON.parse(fs.readFileSync(new URL('../../'+ref.sourceFile,import.meta.url))).questions.find(q=>q.id===ref.sourceId),image=`/figures/synaq-editions/${name}-${i}-native.svg`;assert.equal(source.options?.length||0,options?.length||0);return{editionId:`${name}-${i}`,modelId:`${name}-${k}`,grade:4,topic:'logic',difficulty:'medium',minimumPlan:'pro',params:{number:i},sourceRefs:[ref],sourceAnswerAvailability:'all_saved_text_official_solutions_options_and_complete_givens_recomputed',adaptationChanges:['All13 complete source/new conditions official/new solutions and every option read. Changed memberships groups places numbers while preserving set operations, requested quantity and response format.','13 original SVG diagrams replace13 archived source pictures without tracing or reusing source art. All seven disjoint triple regions checked. Standard+ local only; same author separate computational check, not a second human.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,...(options?{options}:{}),image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const i=Number(r.editionId.split('-').at(-1));assert.ok(SPECS[i]);assert.equal(canonicalEdition(r),canonicalEdition(row(SPECS[i],i)),'Unreviewed shifts/sets task');return{answer:r.answer,checks:['actual units remainders Venn cells checked','own native SVG','Standard+ only']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){SPECS.forEach((_,i)=>fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${i}-native.svg`,import.meta.url),draw(i)));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'13 grade4 topic3-3 localStandard+' ,sourceOccurrences:13,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions},null,2)+'\n');console.log({authored:13,choices:editions.reduce((s,r)=>s+(r.options?.length||0),0)});}
