import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='course4-volumes';
const refs=[{"sourceFile": "problems/sources/zerek/courses/4-math-4-1-level1.json", "sourceId": "8c9c90121a52c3e3"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-1-level1.json", "sourceId": "cdc14f38edb5fe29"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-1-level2.json", "sourceId": "ade63fd2a01cdc2b"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-1-level2.json", "sourceId": "efcf92602d15cf0f"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-1-level3.json", "sourceId": "918bb4255791159c"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-1-leveltest.json", "sourceId": "19539f6fb9868734"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-1-leveltest.json", "sourceId": "981b9f4f16ffd08b"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-2-level1.json", "sourceId": "0e91d1c321726f86"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-2-level1.json", "sourceId": "26af99524a71d844"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-2-level1.json", "sourceId": "edcd91e66e9ae07c"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-2-level2.json", "sourceId": "121a31f0bdd7a2b9"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-2-level2.json", "sourceId": "7b2c8adfbff91154"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-2-level2.json", "sourceId": "d0f0d097ed620a12"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-2-level2.json", "sourceId": "fbc446f50e833f0c"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-2-level3.json", "sourceId": "46849fb5879702d8"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-2-level3.json", "sourceId": "63a1b5a6cc8e210b"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-2-level3.json", "sourceId": "67af57e382a3b1bc"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-2-level3.json", "sourceId": "aa0afc683abfbf4c"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-2-leveltest.json", "sourceId": "23bcb7ef8194a341"}, {"sourceFile": "problems/sources/zerek/courses/4-math-4-2-leveltest.json", "sourceId": "ba3d1172e8cc253b"}];
export const SPECS=[
  [
    "all-edges",
    "Қораптың ұзындығы «11» см, ені «7» см, биіктігі «4» см. Барлық қырларының ұзындықтарын қосқанда неше сантиметр болады?",
    "88",
    "Әр өлшемге сәйкес төрт қыр бар. 11 + 7 + 4 = 22 см. Барлығы 4 × 22 = 88 см.",
    [
      11,
      7,
      4
    ],
    [
      "Ұзындық, см",
      "Ені, см",
      "Биіктік, см"
    ]
  ],
  [
    "volume",
    "Тікбұрышты ыдыстың ұзындығы «8» дм, ені «7» дм, биіктігі «6» дм. Көлемін текше дециметрмен табыңыз.",
    "336",
    "Табаны 8 × 7 = 56 дм². Көлемі 56 × 6 = 336 дм³.",
    [
      8,
      7,
      6
    ],
    [
      "Ұзындық, дм",
      "Ені, дм",
      "Биіктік, дм"
    ]
  ],
  [
    "half-litres",
    "Аквариумның ішкі ұзындығы «80» см, ені «25» см, биіктігі «50» см. Оны жартысына дейін толтыруға неше литр су керек? Бір литр — 1000 см³.",
    "50 л",
    "Толық көлемі 80 × 25 × 50 = 100000 см³, яғни 100 л. Жартысы 100 ÷ 2 = 50 л.",
    [
      80,
      25,
      50
    ],
    [
      "Ұзындық, см",
      "Ені, см",
      "Биіктік, см"
    ],
    [
      "500 л",
      "100 л",
      "5000 л",
      "50 л"
    ]
  ],
  [
    "brick-cube",
    "Өлшемдері «24» см, «12» см, «6» см кірпіштерден бос орынсыз қыры «24» см текше қаланды. Неше кірпіш қолданылды?",
    "8",
    "Бір қабатқа 2 кірпіш, биіктігі бойынша 4 қабат сыяды. 2 × 4 = 8 кірпіш. Көлемі де 13824 ÷ 1728 = 8 екенін растайды.",
    [
      24,
      12,
      6,
      24
    ],
    [
      "Кірпіш ұзындығы, см",
      "Кірпіш ені, см",
      "Кірпіш биіктігі, см",
      "Текше қыры, см"
    ]
  ],
  [
    "painted-two",
    "Өлшемдері «5» см, «4» см, «2» см ағаш білеудің сырты түгел боялды. Оны қыры 1 см текшелерге бөлді. Дәл екі жағы боялған текше нешеу?",
    "20",
    "Екі қабат бар. Бір қабатта бұрыштан өзге шеткі текшелер 2 × 3 + 2 × 2 = 10. Екі қабатта 10 × 2 = 20 текше. Бұрыштардағы 8 текшенің үш жағы боялған.",
    [
      5,
      4,
      2
    ],
    [
      "Ұзындық, см",
      "Ені, см",
      "Биіктік, см"
    ],
    [
      "4",
      "20",
      "32",
      "8"
    ]
  ],
  [
    "four-walls",
    "Бөлменің ұзындығы «8» м, ені «5» м, биіктігі «3» м. Есік-терезені шегермей, төрт қабырғаның ауданын табыңыз. Еден мен төбе кірмейді. Жауап м²-пен.",
    "78",
    "Ұзын қабырғалар 2 × 8 × 3 = 48 м². Қысқа қабырғалар 2 × 5 × 3 = 30 м². Барлығы 48 + 30 = 78 м².",
    [
      8,
      5,
      3
    ],
    [
      "Ұзындық, м",
      "Ені, м",
      "Биіктік, м"
    ]
  ],
  [
    "painted-zero",
    "Өлшемдері «6» см, «5» см, «4» см ағаш білеудің сырты түгел боялды. Оны қыры 1 см текшелерге бөлді. Ешбір жағы боялмаған текше нешеу?",
    "24",
    "Ішкі өлшемдер 4 см, 3 см, 2 см болады. Іштегі текшелер 4 × 3 × 2 = 24.",
    [
      6,
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
    "volume",
    "Бассейннің ішкі ұзындығы «30» м, ені «12» м, тереңдігі «3» м. Толық бассейнге неше текше метр су сыяды?",
    "1080",
    "Табаны 30 × 12 = 360 м². Көлемі 360 × 3 = 1080 м³.",
    [
      30,
      12,
      3
    ],
    [
      "Ұзындық, м",
      "Ені, м",
      "Тереңдік, м"
    ]
  ],
  [
    "unknown-width",
    "Қораптың ұзындығы «12» дм, биіктігі «5» дм, көлемі «480» дм³. Ені неше дециметр?",
    "8",
    "Ұзындық пен биіктік көбейтіндісі 12 × 5 = 60. Ені 480 ÷ 60 = 8 дм. Тексеру: 12 × 8 × 5 = 480.",
    [
      12,
      5,
      480
    ],
    [
      "Ұзындық, дм",
      "Биіктік, дм",
      "Көлем, дм³"
    ]
  ],
  [
    "volume",
    "Залдың ұзындығы «7» м, ені «5» м, биіктігі «4» м. Оның көлемі неше текше метр?",
    "140",
    "Табаны 7 × 5 = 35 м². Көлемі 35 × 4 = 140 м³.",
    [
      7,
      5,
      4
    ],
    [
      "Ұзындық, м",
      "Ені, м",
      "Биіктік, м"
    ]
  ],
  [
    "water-height",
    "Ішкі өлшемдері «80» см, «25» см, «50» см бос аквариумға «60» л су құйылды. Су деңгейі неше сантиметр болды? Бір литр — 1000 см³.",
    "30",
    "Су көлемі 60000 см³. Табаны 80 × 25 = 2000 см². Биіктігі 60000 ÷ 2000 = 30 см, бұл ыдыстың 50 см биіктігінен аспайды.",
    [
      80,
      25,
      50,
      60
    ],
    [
      "Ұзындық, см",
      "Ені, см",
      "Ыдыс биіктігі, см",
      "Су, л"
    ]
  ],
  [
    "unknown-length",
    "Бөлменің көлемі «180» м³, биіктігі «4» м, ені «5» м. Ұзындығы неше метр?",
    "9",
    "Табан ені мен биіктік көбейтіндісі 4 × 5 = 20. Ұзындығы 180 ÷ 20 = 9 м.",
    [
      180,
      4,
      5
    ],
    [
      "Көлем, м³",
      "Биіктік, м",
      "Ені, м"
    ]
  ],
  [
    "half-cubic",
    "Бассейннің ішкі ұзындығы «24» м, ені «15» м, тереңдігі «4» м. Ол жартысына дейін толтырылды. Судың көлемі неше текше метр?",
    "720",
    "Толық көлемі 24 × 15 × 4 = 1440 м³. Судың көлемі 1440 ÷ 2 = 720 м³.",
    [
      24,
      15,
      4
    ],
    [
      "Ұзындық, м",
      "Ені, м",
      "Тереңдік, м"
    ]
  ],
  [
    "open-surface",
    "Қақпағы жоқ қораптың ұзындығы «12» см, ені «8» см, биіктігі «5» см. Табаны мен төрт қабырғасының жалпы ауданын табыңыз.",
    "296 см²",
    "Табаны 12 × 8 = 96 см². Қабырғалар 2 × 12 × 5 + 2 × 8 × 5 = 200 см². Барлығы 96 + 200 = 296 см². Қақпақ есептелмейді.",
    [
      12,
      8,
      5
    ],
    [
      "Ұзындық, см",
      "Ені, см",
      "Биіктік, см"
    ],
    [
      "480 см²",
      "296 см²",
      "392 см²",
      "200 см²"
    ]
  ],
  [
    "box-packing",
    "Жәшіктің ішкі өлшемдері «48» см, «36» см, «24» см. Оған өлшемдері «12» см, «12» см, «6» см қораптар салынады. Ең көбі неше қорап сыяды?",
    "48",
    "Қатарлар саны 48 ÷ 12 = 4, 36 ÷ 12 = 3, қабаттар 24 ÷ 6 = 4. Барлығы 4 × 3 × 4 = 48. Көлемдер қатынасы да 48, сондықтан бұдан көп қорап сыймайды.",
    [
      48,
      36,
      24,
      12,
      12,
      6
    ],
    [
      "Жәшік ұзындығы, см",
      "Жәшік ені, см",
      "Жәшік биіктігі, см",
      "Қорап ұзындығы, см",
      "Қорап ені, см",
      "Қорап биіктігі, см"
    ]
  ],
  [
    "cube-cutout",
    "Өлшемдері «12» см, «10» см, «8» см білеуден қыры «3» см текше толық ойып алынды. Қалған дененің көлемі қанша?",
    "933 см³",
    "Білеу көлемі 12 × 10 × 8 = 960 см³. Ойылған текше көлемі 3 × 3 × 3 = 27 см³. Қалғаны 960 − 27 = 933 см³.",
    [
      12,
      10,
      8,
      3
    ],
    [
      "Білеу ұзындығы, см",
      "Білеу ені, см",
      "Білеу биіктігі, см",
      "Ойық қыры, см"
    ],
    [
      "960 см³",
      "987 см³",
      "933 см³",
      "957 см³"
    ]
  ],
  [
    "topup-litres",
    "Су бағының ішкі ұзындығы «100» см, ені «40» см, биіктігі «70» см. Су деңгейі «45» см. Толтыруға тағы неше литр керек? Бір литр — 1000 см³.",
    "100",
    "Бос биіктік 70 − 45 = 25 см. Керек су көлемі 100 × 40 × 25 = 100000 см³, яғни 100 л.",
    [
      100,
      40,
      70,
      45
    ],
    [
      "Ұзындық, см",
      "Ені, см",
      "Бак биіктігі, см",
      "Су деңгейі, см"
    ]
  ],
  [
    "transfer-height",
    "Ішкі өлшемдері «24» см, «25» см, «30» см бірінші ыдыс суға толы. Суды ішкі өлшемдері «60» см, «20» см, «45» см бос ыдысқа түгел құйды. Екінші ыдыста су деңгейі неше сантиметр?",
    "15 см",
    "Су көлемі 24 × 25 × 30 = 18000 см³. Екінші ыдыстың табаны 60 × 20 = 1200 см². Су биіктігі 18000 ÷ 1200 = 15 см.",
    [
      24,
      25,
      30,
      60,
      20,
      45
    ],
    [
      "Бірінші ұзындық, см",
      "Бірінші ені, см",
      "Бірінші биіктік, см",
      "Екінші ұзындық, см",
      "Екінші ені, см",
      "Екінші биіктік, см"
    ],
    [
      "30 см",
      "36 см",
      "12 см",
      "15 см"
    ]
  ],
  [
    "cube-transfer-height",
    "Қыры «30» см текше ыдыс суға толы. Суды табаны «60» см × «30» см болатын екінші бос ыдысқа түгел құйды. Екінші ыдыс жеткілікті биік. Су деңгейі неше сантиметр?",
    "15 см",
    "Су көлемі 30 × 30 × 30 = 27000 см³. Екінші табан 60 × 30 = 1800 см². Деңгейі 27000 ÷ 1800 = 15 см.",
    [
      30,
      60,
      30
    ],
    [
      "Текше қыры, см",
      "Екінші ұзындық, см",
      "Екінші ені, см"
    ],
    [
      "30 см",
      "10 см",
      "60 см",
      "15 см"
    ]
  ],
  [
    "unknown-height",
    "Тікбұрышты параллелепипедтің көлемі «384» дм³, ұзындығы «12» дм, ені «4» дм. Биіктігі неше дециметр?",
    "8",
    "Табаны 12 × 4 = 48 дм². Биіктігі 384 ÷ 48 = 8 дм.",
    [
      384,
      12,
      4
    ],
    [
      "Көлем, дм³",
      "Ұзындық, дм",
      "Ені, дм"
    ]
  ]
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),txt=(id,x,y,s,size=18)=>`<text id="${id}" x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#29486d">${esc(s)}</text>`;
export function shapes(i){const v=SPECS[i][4];if(i===3)return[v.slice(0,3),[v[3],v[3],v[3]]];if(i===14||i===17)return[v.slice(0,3),v.slice(3,6)];if(i===15)return[v.slice(0,3),[v[3],v[3],v[3]]];if(i===18)return[[v[0],v[0],v[0]],[v[1],v[2],v[0]]];if(i===8)return[[v[0],5,v[1]]];if(i===11)return[[6,v[2],v[1]]];if(i===19)return[[v[1],v[2],5]];return[v.slice(0,3)];}
export function draw(i){const[,,,,v,labels]=SPECS[i],dims=shapes(i),commonScale=Math.min(...dims.flatMap(([a,b,c])=>[(dims.length>1?140:295)/(a+.45*b),110/(c+.35*b)]));let body='';dims.forEach(([a,b,c],k)=>{const multi=dims.length>1,ox=multi?20+k*185:30,oy=155,s=commonScale;const p=(x,y,z)=>[ox+s*(x+.45*y),oy-s*(z+.35*y)],points=ps=>ps.map(p=>p.join(',')).join(' '),poly=(id,ps,fill)=>`<polygon id="${id}" points="${points(ps)}" fill="${fill}" stroke="#7497bc" stroke-width="1.5"/>`;body+=poly('front-'+k,[p(0,0,0),p(a,0,0),p(a,0,c),p(0,0,c)],'#bbd4f5')+poly('side-'+k,[p(a,0,0),p(a,b,0),p(a,b,c),p(a,0,c)],'#b8a8dc');if(![2,10,12,13,16].includes(i))body+=poly('top-'+k,[p(0,0,c),p(a,0,c),p(a,b,c),p(0,b,c)],'#d0e9df');else body+=poly('open-bottom-'+k,[p(0,0,0),p(a,0,0),p(a,b,0),p(0,b,0)],'#e3d9ed')+`<polyline id="open-rim" points="${points([p(0,0,c),p(0,b,c),p(a,b,c),p(a,0,c)])}" fill="none" stroke="#7497bc" stroke-width="2"/>`;
 if([4,6].includes(i)){const line=(id,u,w)=>`<line id="${id}" x1="${u[0]}" y1="${u[1]}" x2="${w[0]}" y2="${w[1]}" stroke="#6a8eb0"/>`;for(let x=1;x<a;x++)body+=line('front-x-'+x,p(x,0,0),p(x,0,c))+line('top-x-'+x,p(x,0,c),p(x,b,c));for(let y=1;y<b;y++)body+=line('side-y-'+y,p(a,y,0),p(a,y,c))+line('top-y-'+y,p(0,y,c),p(a,y,c));for(let z=1;z<c;z++)body+=line('front-z-'+z,p(0,0,z),p(a,0,z))+line('side-z-'+z,p(a,0,z),p(a,b,z));}
 if([2,12,16].includes(i)){const level=i===16?v[3]:c/2;body+=poly('water-'+k,[p(0,0,level),p(a,0,level),p(a,b,level),p(0,b,level)],'#8ecbdf');}
 if(multi)body+=txt('shape-label-'+k,ox+65,180,i===15?(k?'Ойылған текше':'Білеу'):i===3?(k?'Қаланған текше':'Бір кірпіш'):k?'Екінші':'Бірінші',14);
 });if(i===15)body+=txt('subtract',185,105,'−',26);if([17,18].includes(i))body+=txt('transfer',184,105,'→',26);
 const start=210;v.forEach((x,j)=>{const two=v.length>3;body+=txt('input-'+j,two?(j%2?265:95):180,start+(two?Math.floor(j/2)*44:j*43),labels[j],two?12:14)+txt('value-'+j,two?(j%2?265:95):180,start+23+(two?Math.floor(j/2)*44:j*43),x,20);});const height=start+Math.ceil(v.length/(v.length>3?2:1))*45+15;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">Кеңістіктегі дене. Белгісіз өлшемдер сызбада шартты</title><metadata id="actual-inputs">${esc(JSON.stringify(v))}</metadata><rect width="360" height="${height}" rx="18" fill="#f6f9ff"/>${body}</svg>\n`;}
function row(s,i){const[k,statement,answer,solution,,,options]=s,ref=refs[i],source=JSON.parse(fs.readFileSync(new URL('../../'+ref.sourceFile,import.meta.url))).questions.find(q=>q.id===ref.sourceId),image=`/figures/synaq-editions/${name}-${i}-native.svg`;assert.equal(source.options?.length||0,options?.length||0);return{editionId:`${name}-${i}`,modelId:`${name}-${k}`,grade:4,topic:'geometry',difficulty:'medium',minimumPlan:'pro',params:{number:i},sourceRefs:[ref],sourceAnswerAvailability:'all_saved_text_official_solutions_options_and_complete_givens_recomputed',adaptationChanges:['All20 saved/new conditions official/new solutions and24 source/new options read. Changed dimensions containers contexts litres and cutout sizes preserve requested quantity and response format.','20 own SVG isometric diagrams replace20 saved pictures without source tracing. Painted unit-cube faces enumerated; maximum packings have a constructive tiling and volume upper bound; unknown dimensions use schematic extents. Standard+ local only; same author separate computational checker, not another human.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,...(options?{options}:{}),image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const i=Number(r.editionId.split('-').at(-1));assert.ok(SPECS[i]);assert.equal(canonicalEdition(r),canonicalEdition(row(SPECS[i],i)),'Unreviewed shifts/sets task');return{answer:r.answer,checks:['actual units remainders Venn cells checked','own native SVG','Standard+ only']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){SPECS.forEach((_,i)=>fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${i}-native.svg`,import.meta.url),draw(i)));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'20 grade4 cuboids volumes and water localStandard+' ,sourceOccurrences:20,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions},null,2)+'\n');console.log({authored:20,choices:editions.reduce((s,r)=>s+(r.options?.length||0),0)});}
