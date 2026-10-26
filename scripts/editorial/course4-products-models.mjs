import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='course4-products';
const refs=[{"sourceFile": "problems/sources/zerek/courses/4-math-5-1-level1.json", "sourceId": "71f911349fb4c7c1"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-1-level1.json", "sourceId": "e4b3d8f7d3db4f44"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-1-level1.json", "sourceId": "f1930aac28c621d4"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-1-level2.json", "sourceId": "03c682540e09fc72"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-1-level2.json", "sourceId": "05bceca246502d40"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-1-level2.json", "sourceId": "4fa810b406ff26ce"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-1-level2.json", "sourceId": "837fb29b386161ea"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-1-level3.json", "sourceId": "06b435e1cbbeebb3"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-1-level3.json", "sourceId": "c62d34fc3e1f6e00"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-1-leveltest.json", "sourceId": "169ebfbb4bdb0cf4"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-1-leveltest.json", "sourceId": "7ca464c85d024f7f"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-2-level1.json", "sourceId": "2505a93f2eb73649"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-2-level1.json", "sourceId": "c3a70735de245d61"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-2-level2.json", "sourceId": "0c1c804cc63f8303"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-2-level2.json", "sourceId": "55f816fc4fd0c554"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-2-level2.json", "sourceId": "6480fe351cebc68c"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-2-level2.json", "sourceId": "8545e25a4931490f"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-2-level2.json", "sourceId": "c7c292752ac29f0d"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-2-level2.json", "sourceId": "ee45ff4441fa0b66"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-2-level3.json", "sourceId": "0655e62c6544416d"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-2-level3.json", "sourceId": "f991b183ce34a1c8"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-2-leveltest.json", "sourceId": "8644a6eb43e6d11c"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-2-leveltest.json", "sourceId": "bc11073e911a2387"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-2-leveltest.json", "sourceId": "ceeaba1b7d9de1d2"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-3-level1.json", "sourceId": "1f2b3b842e3626fe"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-3-level1.json", "sourceId": "7a08018014e76ae9"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-3-level1.json", "sourceId": "8ad676727d118c82"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-3-level1.json", "sourceId": "dc67e2363eafd4d4"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-3-level2.json", "sourceId": "156383e896b9e196"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-3-level2.json", "sourceId": "b21d816ee29f735a"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-3-level2.json", "sourceId": "fa75b85744dc5ff7"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-3-level3.json", "sourceId": "1b9013093208e9fb"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-3-level3.json", "sourceId": "d88789010971249a"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-3-leveltest.json", "sourceId": "14c6813bce9600eb"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-3-leveltest.json", "sourceId": "aaa10a904a0486c1"}, {"sourceFile": "problems/sources/zerek/courses/4-math-5-3-leveltest.json", "sourceId": "e5a25c97e0cb34c1"}];
export const SPECS=[
  [
    "three-factor-product",
    "Мәдениет орталығында «5» зал бар. Әр залда «6» қатар, әр қатарда «14» орын. Барлығы неше орын?",
    "420",
    "Бір залда 6 × 14 = 84 орын. Бес залда 84 × 5 = 420 орын.",
    [
      5,
      6,
      14
    ],
    [
      "Зал саны",
      "Қатар саны",
      "Қатардағы орын"
    ]
  ],
  [
    "two-stage-division",
    "«120» оқушы «3» автобусқа тең отырды. Әр автобуста олар «5» бірдей топқа бөлінді. Бір топта неше оқушы?",
    "8",
    "Бір автобуста 120 ÷ 3 = 40 оқушы. Бір топта 40 ÷ 5 = 8 оқушы.",
    [
      120,
      3,
      5
    ],
    [
      "Барлық оқушы",
      "Автобус саны",
      "Бір автобустағы топ"
    ]
  ],
  [
    "three-factor-product",
    "Мектепке «5» жәшік маркер әкелді. Әр жәшікте «8» қаптама, әр қаптамада «12» маркер. Барлығы неше маркер?",
    "480",
    "Бір жәшікте 8 × 12 = 96 маркер. Барлығы 96 × 5 = 480 маркер.",
    [
      5,
      8,
      12
    ],
    [
      "Жәшік саны",
      "Бір жәшіктегі қаптама",
      "Бір қаптамадағы маркер"
    ],
    [
      "101",
      "25",
      "96",
      "480"
    ]
  ],
  [
    "three-stage-division",
    "«840» жапсырма «4» сыныпқа тең бөлінді. Әр сыныпта «5» топ бар. Әр топтағы «6» бала оларды тең алды. Бір балаға неше жапсырма тиді?",
    "7",
    "Бір сыныпқа 840 ÷ 4 = 210. Бір топқа 210 ÷ 5 = 42. Бір балаға 42 ÷ 6 = 7 жапсырма.",
    [
      840,
      4,
      5,
      6
    ],
    [
      "Жапсырма саны",
      "Сынып саны",
      "Бір сыныптағы топ",
      "Бір топтағы бала"
    ],
    [
      "42",
      "7",
      "140",
      "35"
    ]
  ],
  [
    "product-distribution",
    "«10» қорап кітаптың әрқайсысында «4» бума, әр бумада «18» кітап. Кітаптар «6» сөреге тең қойылды. Бір сөреде неше кітап?",
    "120",
    "Барлығы 10 × 4 × 18 = 720 кітап. Бір сөреде 720 ÷ 6 = 120 кітап.",
    [
      10,
      4,
      18,
      6
    ],
    [
      "Қорап саны",
      "Қораптағы бума",
      "Бумадағы кітап",
      "Сөре саны"
    ]
  ],
  [
    "three-factor-product",
    "Дүкенде «40» жәшік сусын бар. Бір жәшікте «15» бөтелке. Бір бөтелке «250» теңге. Барлық сусынның құны неше теңге?",
    "150000",
    "Бөтелке саны 40 × 15 = 600. Құны 600 × 250 = 150000 теңге.",
    [
      40,
      15,
      250
    ],
    [
      "Жәшік саны",
      "Бөтелке саны",
      "Бір бөтелке, ₸"
    ]
  ],
  [
    "product-minus-vacant",
    "Театрда «4» бөлім, әр бөлімде «12» қатар, қатарда «18» орын бар. «39» орын бос қалды. Қалғандары толды. Неше көрермен отырды?",
    "825",
    "Барлық орын 4 × 12 × 18 = 864. Көрермендер 864 − 39 = 825.",
    [
      4,
      12,
      18,
      39
    ],
    [
      "Бөлім саны",
      "Бөлімдегі қатар",
      "Қатардағы орын",
      "Бос орын"
    ]
  ],
  [
    "overlapping-products",
    "a, b, c — натурал сандар. «a × b × c = 336», «a × b = 42», «b × c = 56». b-ны табыңыз.",
    "7",
    "c = 336 ÷ 42 = 8. a = 336 ÷ 56 = 6. b = 42 ÷ 6 = 7. Тексеру: 6 × 7 × 8 = 336.",
    [
      336,
      42,
      56
    ],
    [
      "a × b × c",
      "a × b",
      "b × c"
    ],
    [
      "14",
      "42",
      "7",
      "6"
    ]
  ],
  [
    "river-crossing",
    "«5» саяхатшы өзеннен өтуі керек. Қайық пен екі бала бастапқы жағада. Қайық бір саяхатшыны ғана немесе бір-екі баланы алып өте алады. Саяхатшы мен бала бірге сыймайды. Соңында барлық саяхатшы арғы бетте, екі бала мен қайық бастапқы жағада болуы керек. Бір бағыттағы жүріс — бір қатынау. Ең аз неше қатынау?",
    "20",
    "Бір саяхатшыға: екі бала өтеді, бір бала қайтады, саяхатшы өтеді, екінші бала қайтады. Төрт қатынаудан кейін балалар мен қайық бастапқы жағада. Бес саяхатшыға 5 × 4 = 20 қатынау. Рұқсат етілген барлық күйлер бойынша қысқа жол да 20.",
    [
      5
    ],
    [
      "Саяхатшы саны"
    ]
  ],
  [
    "two-stage-division",
    "Кітапхана «1440» кітапты «6» сөреге тең қойды. Әр сөредегі кітап «8» бірдей бумаға бөлінді. Бір бумада неше кітап?",
    "30",
    "Бір сөреде 1440 ÷ 6 = 240 кітап. Бір бумада 240 ÷ 8 = 30 кітап.",
    [
      1440,
      6,
      8
    ],
    [
      "Кітап саны",
      "Сөре саны",
      "Сөредегі бума"
    ]
  ],
  [
    "unknown-middle-factor",
    "«8» қораптың әрқайсысында бірдей бума бар. Бір бумада «12» дәптер. Барлығы «1920» дәптер әкелді. Бір қорапта неше бума?",
    "20",
    "Бір қорапта 1920 ÷ 8 = 240 дәптер. Бума саны 240 ÷ 12 = 20. Барлық қорапта 160 бума бар.",
    [
      8,
      12,
      1920
    ],
    [
      "Қорап саны",
      "Бумадағы дәптер",
      "Барлық дәптер"
    ],
    [
      "96",
      "160",
      "240",
      "20"
    ]
  ],
  [
    "expression-product",
    "Көбейтіндіні табыңыз: «80 × 700».",
    "56000",
    "8 × 7 = 56. Көбейткіштердің соңындағы үш нөлді тіркейміз: 56000.",
    [
      80,
      700
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ]
  ],
  [
    "expression-product",
    "Бір қорапта «30» қалам бар. «400» қорапта неше қалам?",
    "12000",
    "30 × 400 = 12000 қалам.",
    [
      30,
      400
    ],
    [
      "Қораптағы қалам",
      "Қорап саны"
    ]
  ],
  [
    "nested-loads",
    "Бір пойызда «12» вагон. Әр вагонға «40» т жүк сыяды. «4320» т жүкті тасуға неше толық пойыз керек?",
    "9",
    "Бір пойыз 12 × 40 = 480 т тасиды. 4320 ÷ 480 = 9 пойыз. Барлық вагон саны 108.",
    [
      12,
      40,
      4320
    ],
    [
      "Пойыздағы вагон",
      "Бір вагон, т",
      "Барлық жүк, т"
    ],
    [
      "36",
      "108",
      "9",
      "432"
    ]
  ],
  [
    "load-count",
    "Бір вагонға «80» т жүк сыяды. «7200» т жүкті тасу үшін неше вагон қажет?",
    "90",
    "7200 ÷ 80 = 90 вагон.",
    [
      80,
      7200
    ],
    [
      "Бір вагон, т",
      "Барлық жүк, т"
    ]
  ],
  [
    "two-costs",
    "Мектеп «3200» теңгеден «40» баскетбол добын, «4500» теңгеден «30» волейбол добын алды. Барлық құны неше теңге?",
    "263000",
    "Бірінші доптар 3200 × 40 = 128000 теңге. Екіншілері 4500 × 30 = 135000 теңге. Барлығы 128000 + 135000 = 263000 теңге.",
    [
      3200,
      40,
      4500,
      30
    ],
    [
      "Бірінші баға, ₸",
      "Бірінші саны",
      "Екінші баға, ₸",
      "Екінші саны"
    ]
  ],
  [
    "three-factor-product",
    "Қоймада «60» дәптерден «400» бума бар. Бір дәптер «80» теңге. Барлық дәптер неше теңге?",
    "1920000",
    "Дәптер саны 60 × 400 = 24000. Құны 24000 × 80 = 1920000 теңге.",
    [
      60,
      400,
      80
    ],
    [
      "Бумадағы дәптер",
      "Бума саны",
      "Дәптер бағасы, ₸"
    ]
  ],
  [
    "proportional-boxes",
    "Бірдей «40» қорапта «2800» алмұрт бар. Осындай «90» қорапта неше алмұрт?",
    "6300",
    "Бір қорапта 2800 ÷ 40 = 70 алмұрт. 90 қорапта 70 × 90 = 6300.",
    [
      40,
      2800,
      90
    ],
    [
      "Бастапқы қорап",
      "Бастапқы алмұрт",
      "Жаңа қорап саны"
    ]
  ],
  [
    "remaining-days",
    "Ұзындығы «48000» м жол күніне «600» метрден жөнделеді. Жұмыс «50» күн жүрді. Қалғанын бітіруге тағы неше күн керек?",
    "30",
    "Толық жұмысқа 48000 ÷ 600 = 80 күн. Қалғаны 80 − 50 = 30 күн.",
    [
      48000,
      600,
      50
    ],
    [
      "Барлық жол, м",
      "Бір күнде, м",
      "Өткен күн"
    ]
  ],
  [
    "shared-payment",
    "«50» балаға «1800» теңгелік билет алынды. Демеуші «30000» теңге төледі. Қалғанын балалар тең төледі. Бір бала неше теңге төледі?",
    "1200",
    "Билеттер 50 × 1800 = 90000 теңге. Қалғаны 90000 − 30000 = 60000 теңге. Бір балаға 60000 ÷ 50 = 1200 теңге.",
    [
      50,
      1800,
      30000
    ],
    [
      "Бала саны",
      "Билет бағасы, ₸",
      "Демеуші төледі, ₸"
    ]
  ],
  [
    "wrong-divisor",
    "Марат санды «300»-ге бөлудің орнына «30»-ға бөліп, «4200» алды. Дұрыс нәтиже қандай?",
    "420",
    "Бастапқы сан 4200 × 30 = 126000. Дұрыс нәтиже 126000 ÷ 300 = 420.",
    [
      300,
      30,
      4200
    ],
    [
      "Дұрыс бөлгіш",
      "Қате бөлгіш",
      "Қате нәтиже"
    ],
    [
      "42",
      "42000",
      "4200",
      "420"
    ]
  ],
  [
    "wrong-operation",
    "Дана санды «40»-қа көбейтудің орнына «200»-ге бөліп, «90» алды. Дұрыс нәтиже қандай?",
    "720000",
    "Бастапқы сан 90 × 200 = 18000. Оны 40-қа көбейтеміз: 18000 × 40 = 720000.",
    [
      40,
      200,
      90
    ],
    [
      "Дұрыс көбейткіш",
      "Қате бөлгіш",
      "Қате нәтиже"
    ],
    [
      "72000",
      "7200000",
      "3600",
      "720000"
    ]
  ],
  [
    "expression-quotient",
    "Бөліндіні табыңыз: «72000 ÷ 800».",
    "90",
    "Бөлінгіш пен бөлгішті 100-ге қысқартамыз. 720 ÷ 8 = 90.",
    [
      72000,
      800
    ],
    [
      "Бөлінгіш",
      "Бөлгіш"
    ],
    [
      "90",
      "9000",
      "900",
      "9"
    ]
  ],
  [
    "double-half-route",
    "Пойыз «80» км/сағ жылдамдықпен «40» сағатта барлық жолдың жартысын өтті. Толық жол неше километр?",
    "6400",
    "Жартысы 80 × 40 = 3200 км. Толық жол 3200 × 2 = 6400 км.",
    [
      80,
      40
    ],
    [
      "Жылдамдық, км/сағ",
      "Жарты жол уақыты, сағ"
    ]
  ],
  [
    "column-product",
    "Бағанмен есептеңіз: «1740 × 500».",
    "870000",
    "1740 × 500 = 870000. Соңғы нөлдер разрядтарына сәйкес сақталады.",
    [
      1740,
      500
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ]
  ],
  [
    "column-product",
    "Бағанмен есептеңіз: «3250 × 40».",
    "130000",
    "3250 × 40 = 130000. Соңғы нөлдер разрядтарына сәйкес сақталады.",
    [
      3250,
      40
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ]
  ],
  [
    "column-product",
    "Бағанмен есептеңіз: «9070 × 30».",
    "272100",
    "9070 × 30 = 272100. Соңғы нөлдер разрядтарына сәйкес сақталады.",
    [
      9070,
      30
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ]
  ],
  [
    "expression-product",
    "Бір үстел «5400» теңге. «40» үстелдің құны қанша? Жауап теңгемен.",
    "216000",
    "5400 × 40 = 216000 теңге.",
    [
      5400,
      40
    ],
    [
      "Үстел бағасы, ₸",
      "Үстел саны"
    ]
  ],
  [
    "opposite-separation",
    "Екі велосипедші бір жерден бір мезгілде қарама-қарсы бағытта «280» және «320» м/мин жылдамдықпен шықты. «40» минуттан кейін аралары неше метр?",
    "24000",
    "Аралары минутына 280 + 320 = 600 м өседі. 600 × 40 = 24000 м.",
    [
      280,
      320,
      40
    ],
    [
      "Бірінші, м/мин",
      "Екінші, м/мин",
      "Уақыт, мин"
    ]
  ],
  [
    "omitted-zero",
    "Ермек «6800 × 40» көбейтіндісін «27200» деп жазды. Қай тұжырым дұрыс?",
    "Бір нөлді тіркемеген, дұрысы 272000",
    "68 × 4 = 272. Соңғы нөлдер үшеу: дұрыс көбейтінді 272000. 27200 нәтижесі дұрыс жауаптан 10 есе кем.",
    [
      6800,
      40,
      27200
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш",
      "Жазылған нәтиже"
    ],
    [
      "Қате жоқ",
      "Бір нөлді тіркемеген, дұрысы 272000",
      "Екі нөлді тіркемеген, дұрысы 2720000",
      "Артық нөл тіркеген, дұрысы 2720"
    ]
  ],
  [
    "centners",
    "Бір қапта «60» кг күріш. Қоймада «400» қап бар. Барлық масса неше центнер? Бір центнер — 100 кг.",
    "240 ц",
    "Масса 60 × 400 = 24000 кг. Центнермен 24000 ÷ 100 = 240 ц.",
    [
      60,
      400
    ],
    [
      "Бір қап, кг",
      "Қап саны"
    ],
    [
      "2400 ц",
      "240 ц",
      "24 ц",
      "24000 ц"
    ]
  ],
  [
    "hidden-leading-digit",
    "Теңдіктегі □ орнына қандай цифр келеді: «□60 × 40 = 26400»?",
    "6",
    "26400 ÷ 40 = 660. Сондықтан □ = 6.",
    [
      "□60",
      "40",
      "26400"
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш",
      "Көбейтінді"
    ],
    [
      "6",
      "4",
      "5",
      "7"
    ]
  ],
  [
    "hidden-product",
    "Әр □ — жасырылған цифр. «5□0 × 70 = 3□500» теңдігіндегі толық көбейтіндіні табыңыз.",
    "38500",
    "5□ санын 7-ге көбейткенде соңғы цифр 5. Бұл □ = 5 болғанда ғана орындалады. 550 × 70 = 38500. Екінші шаршыда 8 тұр.",
    [
      "5□0",
      "70",
      "3□500"
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш",
      "Көбейтінді"
    ]
  ],
  [
    "column-product",
    "Бағанмен есептеңіз: «7280 × 60».",
    "436800",
    "728 × 6 = 4368. Екі соңғы нөлді тіркейміз: 436800.",
    [
      7280,
      60
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ]
  ],
  [
    "hidden-middle-digit",
    "Теңдіктегі □ орнындағы цифрды табыңыз: «3□0 × 80 = 28000».",
    "5",
    "28000 ÷ 80 = 350. Демек □ = 5.",
    [
      "3□0",
      "80",
      "28000"
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш",
      "Көбейтінді"
    ]
  ],
  [
    "column-product",
    "Есептеңіз: «706 × 4000».",
    "2824000",
    "706 × 4 = 2824. Үш соңғы нөлді тіркейміз: 2824000.",
    [
      706,
      4000
    ],
    [
      "Бірінші көбейткіш",
      "Екінші көбейткіш"
    ]
  ]
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),txt=(id,x,y,s,size=18)=>`<text id="${id}" x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#29486d">${esc(s)}</text>`;
export function draw(i){const[,,,,v,labels]=SPECS[i];let body='',start=35;if([11,24,25,26,29,31,32,33,34,35].includes(i)){start=200;const a=v[0],b=v[1],op=i===22?'÷':'×';body+=`<text id="operand-a" x="300" y="60" text-anchor="end" font-family="monospace" font-size="29" fill="#29486d">${esc(a)}</text><text id="operator" x="45" y="104" font-size="25" fill="#29486d">${op}</text><text id="operand-b" x="300" y="104" text-anchor="end" font-family="monospace" font-size="29" fill="#29486d">${esc(b)}</text><line id="column-rule" x1="35" y1="117" x2="315" y2="117" stroke="#93aace" stroke-width="2"/>`;if(v.length===3)body+=`<text id="shown-result" x="300" y="155" text-anchor="end" font-family="monospace" font-size="29" fill="#29486d">${esc(v[2])}</text>`;}
 if(i===22){start=190;body+=`<text id="operand-a" x="185" y="60" text-anchor="end" font-family="monospace" font-size="29" fill="#29486d">${v[0]}</text><text id="operand-b" x="300" y="60" text-anchor="end" font-family="monospace" font-size="29" fill="#29486d">${v[1]}</text><line id="division-vertical" x1="210" y1="30" x2="210" y2="140" stroke="#93aace" stroke-width="2"/><line id="division-horizontal" x1="210" y1="78" x2="320" y2="78" stroke="#93aace" stroke-width="2"/>`+txt('quotient-unknown',275,120,'?',29);}
 if(i===8){start=182;body+=`<rect id="river" x="140" y="25" width="80" height="120" rx="15" fill="#d0e5f9"/><path id="boat" d="M 155 108 L 205 108 L 196 123 L 164 123 Z" fill="#c4b5dd"/>`;for(let j=0;j<v[0];j++)body+=`<circle id="traveller-${j}" cx="${40+j%3*30}" cy="${45+Math.floor(j/3)*36}" r="9" fill="#c4d6f0" stroke="#6b8db3"/>`;for(let j=0;j<2;j++)body+=`<circle id="child-${j}" cx="${170+j*20}" cy="95" r="7" fill="#d8c5eb" stroke="#8c75af"/>`;body+=txt('return-caption',180,165,'Екі бала мен қайық қайтады',15);}
 if(i===28){start=160;body+=`<line id="left-direction" x1="170" y1="70" x2="45" y2="70" stroke="#6d93d1" stroke-width="4"/><polygon id="left-head" points="45,70 57,63 57,77" fill="#6d93d1"/><line id="right-direction" x1="190" y1="70" x2="315" y2="70" stroke="#6d93d1" stroke-width="4"/><polygon id="right-head" points="315,70 303,63 303,77" fill="#6d93d1"/>`+txt('direction-caption',180,110,'Бір жерден қарама-қарсы',16);}
 v.forEach((x,j)=>{body+=txt('input-'+j,180,start+j*52,labels[j],14)+txt('value-'+j,180,start+j*52+27,x,23);});const height=start+v.length*52+15;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">Көбейткіштер бөлу және есеп шарты</title><metadata id="actual-inputs">${esc(JSON.stringify(v))}</metadata><rect width="360" height="${height}" rx="18" fill="#f6f9ff"/>${body}</svg>\n`;}
function row(s,i){const[k,statement,answer,solution,,,options]=s,ref=refs[i],source=JSON.parse(fs.readFileSync(new URL('../../'+ref.sourceFile,import.meta.url))).questions.find(q=>q.id===ref.sourceId),image=`/figures/synaq-editions/${name}-${i}-native.svg`;assert.equal(source.options?.length||0,options?.length||0);return{editionId:`${name}-${i}`,modelId:`${name}-${k}`,grade:4,topic:'word',difficulty:'medium',minimumPlan:'pro',params:{number:i},sourceRefs:[ref],sourceAnswerAvailability:'all_saved_text_official_solutions_options_and_complete_givens_recomputed',adaptationChanges:['All36 complete saved/new conditions official/new solutions and source/new options read. Changed quantities contexts money loads zero endings and digit masks preserve requested quantity, mathematical method and response format.','36 original native SVGs replace35 saved pictures and one unavailable source25 with complete multiplication operands in text. Boat crossings independently checked by shortest-path search, digit masks by exhaustive enumeration. Standard+ local only; same author computational reviewer, not another human.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,...(options?{options}:{}),image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const i=Number(r.editionId.split('-').at(-1));assert.ok(SPECS[i]);assert.equal(canonicalEdition(r),canonicalEdition(row(SPECS[i],i)),'Unreviewed shifts/sets task');return{answer:r.answer,checks:['actual units remainders Venn cells checked','own native SVG','Standard+ only']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){SPECS.forEach((_,i)=>fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${i}-native.svg`,import.meta.url),draw(i)));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'36 grade4 products topics5-1 to5-3 localStandard+' ,sourceOccurrences:36,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions},null,2)+'\n');console.log({authored:36,choices:editions.reduce((s,r)=>s+(r.options?.length||0),0)});}
