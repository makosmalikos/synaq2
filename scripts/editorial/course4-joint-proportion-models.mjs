import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='course4-joint-proportion';
const refs=[{"sourceFile": "problems/sources/zerek/courses/4-math-6-2-level1.json", "sourceId": "20dba74c5befe5d0"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-2-level1.json", "sourceId": "34df6c7fe9d04e68"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-2-level1.json", "sourceId": "f9f7cecace9e3809"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-2-level2.json", "sourceId": "654bedc600683531"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-2-level2.json", "sourceId": "7958843fd8a6b4a6"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-2-level2.json", "sourceId": "9166bb0550e1a28b"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-2-level3.json", "sourceId": "0af701734e68f921"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-2-level3.json", "sourceId": "3643ce2db8eb975e"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-2-level3.json", "sourceId": "c5277583f881156b"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-2-level3.json", "sourceId": "ce466839bed44efa"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-2-leveltest.json", "sourceId": "1271606f7a913882"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-2-leveltest.json", "sourceId": "64c71ca9db431f25"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-2-leveltest.json", "sourceId": "a08a02db5f1d77a5"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-3-level1.json", "sourceId": "14aefdda5c4fe6eb"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-3-level1.json", "sourceId": "a8ac7af585bd22d8"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-3-level1.json", "sourceId": "fde4591214417e0f"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-3-level2.json", "sourceId": "22764d31ae065c23"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-3-level2.json", "sourceId": "7968e54aab99b26c"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-3-level2.json", "sourceId": "ae6296a7077c0319"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-3-level2.json", "sourceId": "e5411e47f838edff"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-3-level3.json", "sourceId": "015da0a398cd4fb0"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-3-level3.json", "sourceId": "0aac1e00c147e338"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-3-level3.json", "sourceId": "768fe6f554059b19"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-3-level3.json", "sourceId": "ab36e3d7a6089ed0"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-3-leveltest.json", "sourceId": "453a6bca9a2e8a2d"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-3-leveltest.json", "sourceId": "859425eae0d63d42"}, {"sourceFile": "problems/sources/zerek/courses/4-math-6-3-leveltest.json", "sourceId": "d3b1ba4686b83c25"}];
export const SPECS=[
  [
    "missing-rate",
    "Екі құрылғы бірге сағатына «72» кәдесый жасайды. Біріншісі сағатына «43» кәдесый жасайды. Екіншісінің сағаттық өнімділігін тап.",
    "29",
    "Екінші құрылғы 72 − 43 = 29 кәдесый/сағ жасайды.",
    [
      72,
      43
    ],
    [
      "Бірге, дана/сағ",
      "Бірінші, дана/сағ"
    ]
  ],
  [
    "joint-output",
    "Бірінші аспаз сағатына «8», екіншісі «13» торт безендіреді. Бірге «5» сағатта неше торт безендіреді?",
    "105",
    "Бірлескен өнімділік 8 + 13 = 21. Барлығы 21 × 5 = 105 торт.",
    [
      8,
      13,
      5
    ],
    [
      "Бірінші, дана/сағ",
      "Екінші, дана/сағ",
      "Бірге істеген уақыт"
    ]
  ],
  [
    "joint-time",
    "Екі тазалаушы күніне тиісінше «36» және «54» м² кілем тазалайды. «540» м² кілемді бірге неше күнде тазалайды?",
    "6",
    "Күніне 36 + 54 = 90 м². Уақыт 540 ÷ 90 = 6 күн. Өнімділіктер айырмасына бөлу 30, тек біріншіге бөлу 15 күн береді.",
    [
      36,
      54,
      540
    ],
    [
      "Бірінші, м²/күн",
      "Екінші, м²/күн",
      "Барлық аудан, м²"
    ],
    [
      "6",
      "30",
      "90",
      "15"
    ]
  ],
  [
    "join-later",
    "Бірінші шебер «3» сағат жалғыз істеп, сағатына «18» ойыншық жасады. Оған сағатына «14» ойыншық жасайтын екінші шебер қосылды. Тағы «4» сағат бірге істеді. Барлығы неше ойыншық жасалды?",
    "182",
    "Жалғыз 3 × 18 = 54. Бірге сағатына 18 + 14 = 32, төрт сағатта 32 × 4 = 128. Барлығы 54 + 128 = 182.",
    [
      3,
      18,
      14,
      4
    ],
    [
      "Жалғыз уақыт, сағ",
      "Бірінші, дана/сағ",
      "Екінші, дана/сағ",
      "Бірге уақыт, сағ"
    ]
  ],
  [
    "other-alone-time",
    "Екі сорғы «840» л су құятын ыдысты бірге «8» минутта толтырады. Біріншісі жалғыз «24» минутта толтырады. Екіншісі жалғыз неше минутта толтырады?",
    "12",
    "Бірлескен өнімділік 840 ÷ 8 = 105 л/мин. Біріншінікі 840 ÷ 24 = 35. Екіншінікі 105 − 35 = 70. Уақыт 840 ÷ 70 = 12 минут.",
    [
      840,
      8,
      24
    ],
    [
      "Көлем, л",
      "Бірге уақыт, мин",
      "Бірінші жалғыз, мин"
    ],
    [
      "70",
      "12",
      "32",
      "16"
    ]
  ],
  [
    "both-alone-times",
    "Ұзындығы «1800» м жолақты бірінші құрылғы «36», екіншісі «72» күнде бояйды. Бір уақытта қарама-қарсы шетінен бастаса, бірге неше күнде бітіреді?",
    "24",
    "Күніне 1800 ÷ 36 = 50 және 1800 ÷ 72 = 25 м. Бірге 75 м/күн. Уақыт 1800 ÷ 75 = 24 күн.",
    [
      1800,
      36,
      72
    ],
    [
      "Ұзындық, м",
      "Бірінші жалғыз, күн",
      "Екінші жалғыз, күн"
    ],
    [
      "24",
      "108",
      "36",
      "54"
    ]
  ],
  [
    "worker-leaves",
    "Үш шебер «480» бөлшек жасауға кірісті. Олар сағатына тиісінше «12», «18», «10» бөлшек жасайды. «6» сағаттан кейін үшіншісі кетті. Қалғанын алғашқы екеуі тағы неше сағатта бітіреді?",
    "8",
    "Үшеуі сағатына 12 + 18 + 10 = 40 бөлшек жасайды. Алты сағатта 240, қалғаны 240. Екеуінің өнімділігі 30. Қалған уақыт 240 ÷ 30 = 8 сағат.",
    [
      480,
      12,
      18,
      10,
      6
    ],
    [
      "Тапсырыс, дана",
      "Бірінші, дана/сағ",
      "Екінші, дана/сағ",
      "Үшінші, дана/сағ",
      "Үшеуі істеген сағат"
    ],
    [
      "8",
      "6",
      "16",
      "12"
    ]
  ],
  [
    "inflow-outflow",
    "Бос резервуарға екі құбырдан сағатына «70» және «50» м³ су келеді, үшіншісімен сағатына «40» м³ су ағады. «640» м³ резервуар неше сағатта толады?",
    "8",
    "Таза өсім 70 + 50 − 40 = 80 м³/сағ. Уақыт 640 ÷ 80 = 8 сағат.",
    [
      70,
      50,
      40,
      640
    ],
    [
      "Бірінші кіріс, м³/сағ",
      "Екінші кіріс, м³/сағ",
      "Шығыс, м³/сағ",
      "Көлем, м³"
    ]
  ],
  [
    "pairwise-rates",
    "Аян мен Дана сағатына бірге «38», Дана мен Ерке «34», Аян мен Ерке «32» бұйым жасайды. Үшеуі «6» сағатта неше бұйым жасайды?",
    "312",
    "Қосындыларда әрқайсысы екі рет саналған. 38 + 34 + 32 = 104. Бірлескен өнімділік 104 ÷ 2 = 52. Алты сағатта 52 × 6 = 312.",
    [
      38,
      34,
      32,
      6
    ],
    [
      "Аян + Дана, дана/сағ",
      "Дана + Ерке, дана/сағ",
      "Аян + Ерке, дана/сағ",
      "Уақыт, сағ"
    ]
  ],
  [
    "rate-ratio",
    "Ағасы інісінен сағатына «4» есе көп бөлшек жасайды. Екеуі «5» сағатта «200» бөлшек жасады. Інісі сағатына неше бөлшек жасайды?",
    "8",
    "Бірге сағатына 200 ÷ 5 = 40 бөлшек. Үлес саны 1 + 4 = 5. Інісі 40 ÷ 5 = 8, ағасы 32 бөлшек/сағ жасайды.",
    [
      4,
      5,
      200
    ],
    [
      "Өнімділік еселігі",
      "Бірге уақыт, сағ",
      "Барлық бөлшек"
    ],
    [
      "8",
      "20",
      "10",
      "32"
    ]
  ],
  [
    "other-alone-time",
    "Екі сорғы «900» м³ суды бірге «6» сағатта айдайды. Біріншісі жалғыз «9» сағатта айдайды. Екіншісіне жалғыз неше сағат керек?",
    "18",
    "Бірге 900 ÷ 6 = 150 м³/сағ. Бірінші 900 ÷ 9 = 100. Екінші 50 м³/сағ. Уақыт 900 ÷ 50 = 18 сағат.",
    [
      900,
      6,
      9
    ],
    [
      "Көлем, м³",
      "Бірге уақыт, сағ",
      "Бірінші жалғыз, сағ"
    ],
    [
      "12",
      "18",
      "3",
      "50"
    ]
  ],
  [
    "missing-rate",
    "Екі бригада бірге күніне «85» м құбыр орнатады. Біріншісі күніне «49» м орнатса, екіншісі неше метр орнатады?",
    "36",
    "Екіншінің өнімділігі 85 − 49 = 36 м/күн.",
    [
      85,
      49
    ],
    [
      "Бірге, м/күн",
      "Бірінші, м/күн"
    ]
  ],
  [
    "join-later",
    "Дана «4» сағат жалғыз кесте тікті, сағатына «28» қатардан. Оған сағатына «42» қатар тігетін Ерке қосылып, тағы «5» сағат бірге тікті. Барлығы неше қатар тігілді?",
    "462",
    "Жалғыз 4 × 28 = 112 қатар. Бірге сағатына 28 + 42 = 70 қатар, бес сағатта 350. Барлығы 112 + 350 = 462 қатар.",
    [
      4,
      28,
      42,
      5
    ],
    [
      "Жалғыз уақыт, сағ",
      "Бірінші, қатар/сағ",
      "Екінші, қатар/сағ",
      "Бірге уақыт, сағ"
    ]
  ],
  [
    "first-share",
    "Қораптардың массасы бірдей. Бірінші дүкенде «7», екіншісінде «5» қорап күріш бар. Барлығы «720» кг. Бірінші дүкендегі күріш неше килограмм?",
    "420",
    "Қорап саны 7 + 5 = 12. Бір қорап 720 ÷ 12 = 60 кг. Біріншісінде 60 × 7 = 420 кг.",
    [
      7,
      5,
      720
    ],
    [
      "Бірінші қорап саны",
      "Екінші қорап саны",
      "Жалпы масса, кг"
    ]
  ],
  [
    "unit-share",
    "Бірдей қаптағы жарманың «6» қабы бір қоймада, «4» қабы екінші қоймада. Барлығы «600» кг. Бір қаптың массасын тап.",
    "60",
    "Барлығы 6 + 4 = 10 қап. Бір қапта 600 ÷ 10 = 60 кг.",
    [
      6,
      4,
      600
    ],
    [
      "Бірінші қап саны",
      "Екінші қап саны",
      "Жалпы масса, кг"
    ],
    [
      "100",
      "300",
      "60",
      "150"
    ]
  ],
  [
    "direct-proportion",
    "Сорғы тұрақты өнімділікпен «6» минутта «540» л су айдайды. «10» минутта неше литр айдайды?",
    "900",
    "Минутына 540 ÷ 6 = 90 л. Он минутта 90 × 10 = 900 л.",
    [
      6,
      540,
      10
    ],
    [
      "Бастапқы минут",
      "Бастапқы су, л",
      "Жаңа уақыт, мин"
    ],
    [
      "5400",
      "3240",
      "90",
      "900"
    ]
  ],
  [
    "mixed-time-proportion",
    "Құрылғы «15» минутта «90» м² еден жуады. Сол қарқынмен «2» сағат «15» минутта неше шаршы метр жуады?",
    "810",
    "Уақыт 2 × 60 + 15 = 135 минут. Ол бастапқы уақыттан 135 ÷ 15 = 9 есе ұзақ. Аудан 90 × 9 = 810 м².",
    [
      15,
      90,
      2,
      15
    ],
    [
      "Бастапқы минут",
      "Бастапқы аудан, м²",
      "Сағат",
      "Қосымша минут"
    ]
  ],
  [
    "difference-share",
    "Массалары бірдей «4» жәшік алма мен «7» жәшік алмұрт бірге «165» кг. Алмұрт жәшіктері алма жәшіктерінен неше килограмм ауыр?",
    "45",
    "Жәшік саны 4 + 7 = 11. Бір жәшік 165 ÷ 11 = 15 кг. Айырма 7 − 4 = 3 жәшік, 15 × 3 = 45 кг.",
    [
      4,
      7,
      165
    ],
    [
      "Алма жәшігі",
      "Алмұрт жәшігі",
      "Жалпы масса, кг"
    ],
    [
      "15",
      "105",
      "45",
      "60"
    ]
  ],
  [
    "ordered-two-shares",
    "Мектеп бірдей бағамен бірінші топқа «8», екінші топқа «3» сөмке алды. Барлығы «35200» тг төледі. Бірінші және екінші топ сөмкелерінің құнын ретімен тап.",
    "25600 және 9600",
    "Барлығы 11 сөмке. Бір сөмке 35200 ÷ 11 = 3200 тг. Бірінші топ 3200 × 8 = 25600, екінші 3200 × 3 = 9600 тг.",
    [
      8,
      3,
      35200
    ],
    [
      "Бірінші топ саны",
      "Екінші топ саны",
      "Жалпы құны, тг"
    ],
    [
      "25600 және 9600",
      "9600 және 25600",
      "17600 және 17600",
      "32000 және 3200"
    ]
  ],
  [
    "difference-share",
    "Бірдей өнімді екі құрылғы бірге «2640» л су айдады. Біріншісі «8», екіншісі «4» сағат істеді. Біріншісі неше литр артық айдады?",
    "880",
    "Барлық құрылғы-сағат 8 + 4 = 12. Сағатына 2640 ÷ 12 = 220 л. Артық уақыт 4 сағат, артық су 220 × 4 = 880 л.",
    [
      2640,
      8,
      4
    ],
    [
      "Барлық су, л",
      "Бірінші уақыт, сағ",
      "Екінші уақыт, сағ"
    ],
    [
      "1320",
      "880",
      "1760",
      "220"
    ]
  ],
  [
    "three-second-share",
    "Үш үйірме бірдей бағамен тиісінше «28», «24», «18» билет алды. Барлығы «112000» тг төледі. Екінші үйірме неше теңге төледі?",
    "38400",
    "Билет саны 28 + 24 + 18 = 70. Бір билет 112000 ÷ 70 = 1600. Екіншісі 1600 × 24 = 38400 тг.",
    [
      28,
      24,
      18,
      112000
    ],
    [
      "Бірінші саны",
      "Екінші саны",
      "Үшінші саны",
      "Жалпы құны, тг"
    ]
  ],
  [
    "three-difference-total",
    "Үш дүкен бірдей бағамен «5», «3», «9» қорап шай алды. Үшіншісі біріншіден «64000» тг артық төледі. Барлығы неше теңге төледі?",
    "272000",
    "Артық қорап 9 − 5 = 4. Бір қорап 64000 ÷ 4 = 16000 тг. Барлығы 5 + 3 + 9 = 17 қорап, 16000 × 17 = 272000 тг.",
    [
      5,
      3,
      9,
      64000
    ],
    [
      "Бірінші саны",
      "Екінші саны",
      "Үшінші саны",
      "Артық төлем, тг"
    ],
    [
      "128000",
      "272000",
      "144000",
      "1088000"
    ]
  ],
  [
    "ratio-share",
    "Айша мен Дана бірдей бағамен дәптер алды. Айша Данадан «4» есе көп дәптер алды. Барлығы «7500» тг төледі. Айша неше теңге төледі?",
    "6000",
    "Үлес саны 4 + 1 = 5. Дана 7500 ÷ 5 = 1500, Айша 1500 × 4 = 6000 тг төледі.",
    [
      4,
      7500
    ],
    [
      "Санының еселігі",
      "Жалпы төлем, тг"
    ]
  ],
  [
    "weighted-price",
    "Дүкеннен «6» бірдей қалам мен «3» бірдей маркерге «27000» тг төленді. Маркер қаламнан «3» есе қымбат. Бір маркердің бағасын тап.",
    "5400",
    "Үлес саны 6 + 3 × 3 = 15. Қалам 27000 ÷ 15 = 1800 тг. Маркер 1800 × 3 = 5400 тг.",
    [
      6,
      3,
      27000,
      3
    ],
    [
      "Қалам саны",
      "Маркер саны",
      "Жалпы төлем, тг",
      "Баға еселігі"
    ],
    [
      "3000",
      "1800",
      "5400",
      "6750"
    ]
  ],
  [
    "three-difference-share",
    "Өнімділігі бірдей үш құрылғы «4», «5», «7» күн істеп, «6400» бұйым жасады. Үшіншісі біріншіден неше бұйым артық жасады?",
    "1200",
    "Құрылғы-күн саны 4 + 5 + 7 = 16. Күніне 6400 ÷ 16 = 400 бұйым. Артық күн 7 − 4 = 3. Айырма 400 × 3 = 1200.",
    [
      4,
      5,
      7,
      6400
    ],
    [
      "Бірінші күн саны",
      "Екінші күн саны",
      "Үшінші күн саны",
      "Жалпы бұйым"
    ],
    [
      "1200",
      "1600",
      "400",
      "2800"
    ]
  ],
  [
    "second-share",
    "Бағасы бірдей «9» м көк және «3» м ақ лентаға «21600» тг төленді. Ақ лента неше теңге тұрады?",
    "5400",
    "Барлығы 9 + 3 = 12 м. Метрі 21600 ÷ 12 = 1800 тг. Ақ лента 1800 × 3 = 5400 тг.",
    [
      9,
      3,
      21600
    ],
    [
      "Көк лента, м",
      "Ақ лента, м",
      "Жалпы төлем, тг"
    ],
    [
      "5400",
      "16200",
      "1800",
      "10800"
    ]
  ],
  [
    "two-difference-total",
    "Бірінші мектеп «15», екіншісі «9» бірдей сөздік алды. Біріншісі «13200» тг артық төледі. Екеуі бірге неше теңге төледі?",
    "52800",
    "Артық сөздік 15 − 9 = 6. Бір сөздік 13200 ÷ 6 = 2200 тг. Барлығы 15 + 9 = 24 сөздік, құны 2200 × 24 = 52800 тг.",
    [
      15,
      9,
      13200
    ],
    [
      "Бірінші саны",
      "Екінші саны",
      "Артық төлем, тг"
    ]
  ]
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),txt=(id,x,y,s,size=18)=>`<text id="${id}" x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#29486d">${esc(s)}</text>`;
export function draw(i){const[,,,,v,labels]=SPECS[i];let body='',start=35;
 const shares=({13:[v[0],v[1]],14:[v[0],v[1]],17:[v[0],v[1]],18:[v[0],v[1]],19:[v[1],v[2]],20:v.slice(0,3),21:v.slice(0,3),22:[v[0],1],23:[v[0],v[1]*v[3]],24:v.slice(0,3),25:v.slice(0,2),26:v.slice(0,2)})[i];
 if(shares){const sum=shares.reduce((a,b)=>a+b,0);let x=30;shares.forEach((s,j)=>{body+=`<rect id="share-${j}" x="${x}" y="40" width="${s*300/sum}" height="42" rx="4" fill="${['#bed5f3','#cfc3ee','#b4e3d3'][j]}"/>`+txt('share-label-'+j,x+s*150/sum,66,s,18);x+=s*300/sum;});body+=txt('share-caption',180,110,i===23?'Баға үлестері':'Бірдей үлестер',15);start=145;}
 if([3,6,12].includes(i)){const t=i===6?v[4]:v[0];body+=txt('stage-caption',180,27,i===6?'Үшеуі бірге → екеуі бірге':'Жалғыз → екеуі бірге',16);body+=`<path d="M35 62H325" stroke="#92a8c6" stroke-width="3"/><circle cx="105" cy="62" r="6" fill="#6558c8"/>`+txt('stage-first',105,94,t+' сағ',16)+txt('stage-second',265,94,i===6?'? сағ':v[3]+' сағ',16);start=135;}
 v.forEach((x,j)=>body+=txt('input-'+j,180,start+j*52,labels[j],14)+txt('value-'+j,180,start+j*52+27,x,23));const height=start+v.length*52+15;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">Бірлескен жұмыс және пропорционал үлестер</title><metadata id="actual-inputs">${esc(JSON.stringify(v))}</metadata><rect width="360" height="${height}" rx="18" fill="#f6f9ff"/>${body}</svg>\n`;}
function row(s,i){const[k,statement,answer,solution,,,options]=s,ref=refs[i],source=JSON.parse(fs.readFileSync(new URL('../../'+ref.sourceFile,import.meta.url))).questions.find(q=>q.id===ref.sourceId),image=`/figures/synaq-editions/${name}-${i}-native.svg`;assert.equal(source.options?.length||0,options?.length||0);return{editionId:`${name}-${i}`,modelId:`${name}-${k}`,grade:4,topic:'word',difficulty:'medium',minimumPlan:'pro',params:{number:i},sourceRefs:[ref],sourceAnswerAvailability:'all_saved_text_official_solutions_options_and_complete_givens_recomputed',adaptationChanges:['All27 full source/new conditions official/new solutions and60 source/new choices read. Changed quantities and contexts preserve requested work rates times proportional shares and all distractor roles.','27 own native SVGs replace all source art, with proportional share strips and work-stage timelines; verified at343px. Separate computational check by same author, not another human. Standard+ local only.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,...(options?{options}:{}),image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const i=Number(r.editionId.split('-').at(-1));assert.ok(SPECS[i]);assert.equal(canonicalEdition(r),canonicalEdition(row(SPECS[i],i)),'Unreviewed shifts/sets task');return{answer:r.answer,checks:['actual units remainders Venn cells checked','own native SVG','Standard+ only']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){SPECS.forEach((_,i)=>fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${i}-native.svg`,import.meta.url),draw(i)));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'27 grade4 joint work and proportional shares localStandard+' ,sourceOccurrences:27,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions},null,2)+'\n');console.log({authored:27,choices:editions.reduce((s,r)=>s+(r.options?.length||0),0)});}
