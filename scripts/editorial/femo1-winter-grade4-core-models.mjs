import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='femo1-winter-grade4-core',sources={F1W4:'938792aa-3b19-4148-b0a6-a727766c6c3b'};
export const SPECS=[
  [
    "F1W4",
    1,
    "motion",
    "same-time-race-distance-proportion",
    "Ерасыл мен Дамир 120 метрге бірге жүгірді. Ерасыл әр 6 метр жүгірген уақытта Дамир 5 метр жүгіреді. Ерасыл мәреге жеткенде Дамир неше метр жүгірген болады?",
    "100",
    "Ерасылдың толық жолында 120 ÷ 6 = 20 бірдей уақыт бөлігі бар. Сол уақыт ішінде Дамир 20 × 5 = 100 метр жүгіреді. Тексеру: 120 ÷ 6 = 100 ÷ 5 = 20."
  ],
  [
    "F1W4",
    2,
    "num",
    "uniform-goods-price-factor-then-part-sold-remaining-value",
    "Бірдей блокноттардың жалпы құны 9000 теңге еді. Әр блокноттың бағасы 3 есе өскеннен кейін барлық блокноттың (1/3) бөлігі сатылды. Қалған блокноттардың жалпы құны неше теңге?",
    "18000",
    "Баға өскеннен кейін барлық блокнот 9000 × 3 = 27000 теңге тұрады. Оның үштен бірі сатылып, (2/3) бөлігі қалды. Қалған құн 27000 × (2/3) = 18000 теңге. Мысалы, бірдей бағалы 30 блокноттың 10-ы сатылып, 20-сы қалады."
  ],
  [
    "F1W4",
    3,
    "geo",
    "folded-cube-net-opposite-shaded-face",
    "Суреттегі жазбаны ортақ қабырғалары бойымен бүктеп текше жасаңыз. Боялған жақ текшенің астыңғы жағында болса, үстіңгі жағында қай әріп тұрады?",
    "М",
    "Төрт шаршыдан тұратын тік жолақты бүктегенде бір шаршыны аттап орналасқан жақтар қарама-қарсы болады. Боялған жаққа қарсы жақта М әрпі тұр. Қалған қарама-қарсы жұптар К мен Н және Л мен П. Сондықтан үстіңгі жақ — М.",
    [
      "Л",
      "К",
      "П",
      "М"
    ]
  ],
  [
    "F1W4",
    4,
    "num",
    "two-clubs-union-full-group-intersection",
    "Үйірме күніне келген 32 оқушының 18-і шахматқа, 21-і робот құрастыруға қатысты. Әр оқушы кемінде бір үйірмеге қатысты. Екі үйірмеге де қатысқан оқушы нешеу?",
    "7",
    "Екі тізімдегі жазбалар 18 + 21 = 39. Әр оқушы кемінде бір рет бар, бірақ адам саны 32. Артық 39 − 32 = 7 жазба екі тізімде де тұрған оқушылардан келеді. Тек шахматқа 11, тек роботқа 14, екеуіне де 7: барлығы 32."
  ],
  [
    "F1W4",
    5,
    "num",
    "two-player-games-win-loss-score-total-games",
    "Аяна мен Арман бірнеше ойын ойнады, тең ойын болмады. Әр жеңіске 3 ұпай, әр жеңіліске 1 ұпай берілді. Аяна 4 ойында жеңді, Арман барлығы 10 ұпай жинады. Барлығы неше ойын болды?",
    "6",
    "Аяна жеңген төрт ойында Арман жеңіліп, 4 ұпай алды. Қалған 10 − 4 = 6 ұпай Арманның жеңістерінен. Әр жеңіске 3 ұпай болғандықтан, ол 2 ойында жеңді. Ойын саны 4 + 2 = 6. Тексеру: Арманның ұпайы 4 × 1 + 2 × 3 = 10."
  ],
  [
    "F1W4",
    6,
    "logic",
    "distinct-four-digit-word-plus-digit-sum",
    "«overline(SYNA) + S + Y + N + A = 2025» ребусын шешіңіз. Әріптер әртүрлі цифрларды білдіреді, S нөл емес. Үстінен сызық қойылған өрнек — төрттаңбалы сан. Жауапқа сол санды жазыңыз.",
    "2016",
    "Разрядтарға бөлсек, 1001 × S + 101 × Y + 11 × N + 2 × A = 2025. S кемінде 3 болса, сол жақ 3003-тен кем емес. S = 1 болса, Y тек 9 бола алады, бірақ қалған екі әртүрлі цифрмен қажетті қалдықты жинау мүмкін емес. S = 2 болса, қалған қосынды 23. Бұдан Y = 0, N = 1, A = 6. Тексеру: 2016 + 2 + 0 + 1 + 6 = 2025."
  ],
  [
    "F1W4",
    8,
    "num",
    "four-ages-all-three-person-sums-extreme-difference",
    "Төрт баланың кез келген үшеуінің жастарының қосындылары 27, 24, 21 және 30. Ең үлкені мен ең кішісінің жастарының айырмасы неше жыл?",
    "9",
    "Төрт қосындыда әр бала үш рет саналады. Барлық жас қосындысы (27 + 24 + 21 + 30) ÷ 3 = 34. Жастар 34-тен әр қосындыны азайтқанда табылады: 7, 10, 13, 4. Ең үлкені 13, ең кішісі 4; айырмасы 13 − 4 = 9 жыл."
  ],
  [
    "F1W4",
    9,
    "logic",
    "letter-omission-assignment-observed-outputs-correct-count",
    "30 оқушының бір бөлігі S әрпін, қалғандары Y әрпін білмейді; басқа әріптерді бәрі біледі. Білмеген әрпін сөзде жазбай кетеді. Мұғалім 10 оқушыға SNA, 12 оқушыға YNA, қалғандарына SYNA жазуды тапсырды. Нәтижеде SNA 12 рет, YNA 13 рет жазылды. Өз тапсырмасындағы сөзді дұрыс жазған неше оқушы бар?",
    "17",
    "SYNA жазуы тиіс оқушылар 30 − 10 − 12 = 8. Олардың ешқайсысы толық сөзді жаза алмайды: әрқайсысы SNA не YNA жазады. Осы екі жазу барлығы 12 + 13 = 25 рет шыққан. Оның 8-і толық сөзді қате жазғандардан келеді. Қалған 25 − 8 = 17 жазба — өз тапсырмасын дұрыс орындағандар."
  ]
];
export const figurePath='/figures/synaq-editions/femo1-winter4-cube-net-native.svg';
export function drawFigure(){let body='';for(const[c,r,label]of[[1,0,''],[1,1,'К'],[1,2,'М'],[1,3,'Н'],[0,1,'Л'],[2,1,'П']]){const x=102+52*c,y=35+52*r;body+=`<g id="face-${c}-${r}"><rect x="${x}" y="${y}" width="52" height="52" fill="${label?'#fff':'#dfd3f7'}" stroke="#637aac" stroke-width="2.3"/>${label?`<text x="${x+26}" y="${y+34}" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#2a416e">${label}</text>`:''}</g>`;}return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 280" role="img" aria-labelledby="title"><title id="title">Текшенің алты жақтан тұратын жазбасы</title><rect width="360" height="280" rx="22" fill="#f5f8ff"/>${body}</svg>\n`;}
function row(s){const[w,n,topic,kind,statement,answer,solution,options]=s;return{editionId:`${name}-${w.toLowerCase()}-${n}`,modelId:name+'-'+kind,grade:4,topic,difficulty:[3,6,9].includes(n)?'hard':'medium',minimumPlan:'pro',params:{work:w,number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${sources[w]}.json`,sourceId:String(n)}],sourceAnswerAvailability:options?'captured_mcq_key_cross_checked_with_full_official_solution':'not_captured_answer_recomputed_from_full_official_solution',adaptationChanges:['All8full frozen/new conditions and full official/newsolutions/oneMCQset plus archivednetraster read. Race120with6:5, fictionaluniformnotebooks9000×3then1/3sold, two-club32/18/21, game3/1with4and10, newdistinctSYNA2025, age27/24/21/30 and omission30/10/12/12/13 replace original numbers/names/letters/Applepriceeventclaim. Exact targets/methods/difficulty preserved.','Newnativecube net usesdifferentcrossshape withverticalfourband andfive Cyrilliclabels, not originalbitmap or tracedoutline. Actual6faces folded byintegerorthonormal frames; all24properrotations retainopposites. Full4536distinctleadingnonzero digitassignments and allabilityallocationmodels checked. Question7drilledcube remainsseparate and is not silently countedasprocessed.','Same root author separates exact computation, no separatehumanreviewer. Standard+localonly,8editionsnot8claimednewmeanings.'],editorialStatus:'awaiting_independent_computational_review',statement:statement+(options?'':' Жауапқа тек санды жазыңыз.'),answer,solution,...(options?{options}:{}),...(n===3?{image:figurePath,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+figurePath,import.meta.url))).digest('hex')}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-${s[0].toLowerCase()}-${s[1]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed full condition/target/solution/key/MCQ/source');return{answer:r.answer,checks:['all8full source/newconditions/full official/newsolutions/oneMCQset/archivednetraster read','exact fullletter/digit allocationdomains, rotatedfoldednativecube opposites, alloriginal arithmetic/race/score/age conservation','same author not separate human reviewer; localStandard+']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){fs.writeFileSync(new URL('../../frontend/public'+figurePath,import.meta.url),drawFigure());const editions=buildEditions();assert.equal(editions.length,8);editions.forEach(verifyEdition);fs.writeFileSync(new URL('../../problems/editorial/batches/'+name+'.json',import.meta.url),JSON.stringify({schemaVersion:1,scope:'Eight frozen FEMO1wintergrade4coretasks; drilledcube7separate rewritten, localStandard+, not8semanticstories.',sourceOccurrences:8,distinctModels:8,editions},null,2)+'\n');console.log(JSON.stringify({authored:8,figures:1}));}
