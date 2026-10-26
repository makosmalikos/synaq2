import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='course4-motion';
const refs=[{"sourceFile": "problems/sources/zerek/courses/4-math-3-1-level1.json", "sourceId": "2fbed7491cceda74"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-1-level1.json", "sourceId": "b71e79621fd5cbaa"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-1-level1.json", "sourceId": "c8395288d49c56b3"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-1-level1.json", "sourceId": "f937a025770742f5"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-1-level2.json", "sourceId": "0a050a5776ae0a5e"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-1-level2.json", "sourceId": "1e100434829128ed"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-1-level2.json", "sourceId": "b68249be8110c21f"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-1-level3.json", "sourceId": "35692cdbe954bac2"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-1-level3.json", "sourceId": "b616fe65dc7da8cc"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-1-level3.json", "sourceId": "c62386521283eae9"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-1-level3.json", "sourceId": "fd1b9c117385e4e5"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-1-level3.json", "sourceId": "ffcc6e02c8c4f49d"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-1-leveltest.json", "sourceId": "6a225e965bc75dfa"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-1-leveltest.json", "sourceId": "9a37e31cb7499453"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-2-level1.json", "sourceId": "5ae7722936f54a68"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-2-level1.json", "sourceId": "c01efc63d08f18a0"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-2-level2.json", "sourceId": "0b52d0ce9f9e21ba"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-2-level2.json", "sourceId": "0f1a18b4cd9eb9ca"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-2-level2.json", "sourceId": "80c42b2d76a97766"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-2-level3.json", "sourceId": "02f6b65714075638"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-2-level3.json", "sourceId": "1133247489fcc676"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-2-level3.json", "sourceId": "11e981a6f80a721a"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-2-level3.json", "sourceId": "15749dc13f87416e"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-2-level3.json", "sourceId": "19620e5d9fc5eebd"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-2-level3.json", "sourceId": "9e3b3d10e89838cc"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-2-level3.json", "sourceId": "a6e8e3516cd6a847"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-2-level3.json", "sourceId": "fa0254ac948d0f7e"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-2-leveltest.json", "sourceId": "7c201699cb2bd8ce"}, {"sourceFile": "problems/sources/zerek/courses/4-math-3-2-leveltest.json", "sourceId": "d3a6a1d2ad474674"}];
export const SPECS=[
  [
    "distance",
    "Нұрәлі үйден кітапханаға «90» м/мин жылдамдықпен «8» минут жүрді. Жол ұзындығы неше метр?",
    "720",
    "Жол = жылдамдық × уақыт. 90 × 8 = 720 м.",
    [
      90,
      8
    ],
    [
      "Жылдамдық, м/мин",
      "Уақыт, мин"
    ]
  ],
  [
    "table-speed",
    "Кестедегі автобус «9» сағатта «540» км жүрді. Оның жылдамдығы неше км/сағ?",
    "60",
    "Жылдамдық = жол ÷ уақыт. 540 ÷ 9 = 60 км/сағ.",
    [
      9,
      540
    ],
    [
      "Уақыт, сағ",
      "Жол, км"
    ]
  ],
  [
    "duration",
    "Велосипедші «18» км/сағ жылдамдықпен «72» км жүрді. Жолда неше сағат болды?",
    "4",
    "Уақыт = жол ÷ жылдамдық. 72 ÷ 18 = 4 сағат.",
    [
      18,
      72
    ],
    [
      "Жылдамдық, км/сағ",
      "Жол, км"
    ]
  ],
  [
    "distance",
    "Көлік «80» км/сағ жылдамдықпен «4» сағат жүрді. Жүрген жолын километрмен табыңыз.",
    "320",
    "80 × 4 = 320 км.",
    [
      80,
      4
    ],
    [
      "Жылдамдық, км/сағ",
      "Уақыт, сағ"
    ]
  ],
  [
    "two-stage-distance",
    "Шағын автобус алғашқы «2» сағатта «65» км/сағ, келесі «3» сағатта «75» км/сағ жылдамдықпен жүрді. Барлық жол неше километр?",
    "355",
    "Бірінші жол 2 × 65 = 130 км. Екінші жол 3 × 75 = 225 км. Барлығы 130 + 225 = 355 км.",
    [
      2,
      65,
      3,
      75
    ],
    [
      "Бірінші уақыт, сағ",
      "Бірінші жылдамдық, км/сағ",
      "Екінші уақыт, сағ",
      "Екінші жылдамдық, км/сағ"
    ]
  ],
  [
    "remaining-stage-time",
    "Жорық жолы «39» км. Алғашқы «4» сағатта топ «6» км/сағ жылдамдықпен жүрді. Қалған жолдағы жылдамдығы «5» км/сағ. Қалған бөлікке неше сағат жұмсалды?",
    "3",
    "Алғашқы бөлік 4 × 6 = 24 км. Қалғаны 39 − 24 = 15 км. Оған 15 ÷ 5 = 3 сағат кетеді.",
    [
      39,
      4,
      6,
      5
    ],
    [
      "Барлық жол, км",
      "Бірінші уақыт, сағ",
      "Бірінші жылдамдық, км/сағ",
      "Қалғандағы жылдамдық, км/сағ"
    ]
  ],
  [
    "remaining-time",
    "Қалалар арасы «640» км. Көлік «80» км/сағ жылдамдықпен «3» сағат жүрді. Осы жылдамдық сақталса, қалған жолға неше сағат керек?",
    "5 сағ",
    "Жүргені 80 × 3 = 240 км. Қалғаны 640 − 240 = 400 км. Қалған уақыт 400 ÷ 80 = 5 сағат. Бүкіл жолға 8 сағат кетеді.",
    [
      640,
      80,
      3
    ],
    [
      "Барлық жол, км",
      "Жылдамдық, км/сағ",
      "Өткен уақыт, сағ"
    ],
    [
      "3 сағ",
      "8 сағ",
      "5 сағ",
      "4 сағ"
    ]
  ],
  [
    "shuttle-distance",
    "Арасы «84» км екі ауылдан велосипедшілер бір мезгілде бір-біріне қарсы шықты. Жылдамдықтары «12» және «16» км/сағ. Біріншісінен ұшқан шыбын «35» км/сағ жылдамдықпен екіншісіне жетіп, бірден кері бұрылады. Осылай велосипедшілер кездескенше тоқтамай ұшады. Шыбынның барлық жолы неше километр?",
    "105",
    "Кездесу жылдамдығы 12 + 16 = 28 км/сағ. Кездесуге 84 ÷ 28 = 3 сағат кетеді. Шыбын да 3 сағат ұшады: 35 × 3 = 105 км.",
    [
      84,
      12,
      16,
      35
    ],
    [
      "Бастапқы аралық, км",
      "A жылдамдығы, км/сағ",
      "B жылдамдығы, км/сағ",
      "Шыбын, км/сағ"
    ]
  ],
  [
    "opposite-separation",
    "Екі саяхатшы бір нүктеден бір мезгілде қарама-қарсы бағытта «3» және «5» км/сағ жылдамдықпен шықты. «4» сағаттан соң аралары қанша болады?",
    "32 км",
    "Аралары сағатына 3 + 5 = 8 км өседі. 8 × 4 = 32 км.",
    [
      3,
      5,
      4
    ],
    [
      "A жылдамдығы, км/сағ",
      "B жылдамдығы, км/сағ",
      "Уақыт, сағ"
    ],
    [
      "20 км",
      "8 км",
      "12 км",
      "32 км"
    ]
  ],
  [
    "meeting-time",
    "Қалалар арасы «480» км. Екі көлік бір мезгілде екі қаладан бір-біріне қарсы «85» және «75» км/сағ жылдамдықпен шықты. Неше сағаттан кейін кездеседі?",
    "3",
    "Жақындау жылдамдығы 85 + 75 = 160 км/сағ. Уақыт 480 ÷ 160 = 3 сағат.",
    [
      480,
      85,
      75
    ],
    [
      "Бастапқы аралық, км",
      "A жылдамдығы, км/сағ",
      "B жылдамдығы, км/сағ"
    ]
  ],
  [
    "chase-time",
    "Жаяу саяхатшы велосипедшіден «30» км алда. Екеуі бір мезгілде бір бағытта шықты. Жаяу адам «5», велосипедші «15» км/сағ жылдамдықпен жүрді. Велосипедші оны неше сағатта қуып жетеді?",
    "3 сағ",
    "Велосипедші сағатына 15 − 5 = 10 км жақындайды. 30 ÷ 10 = 3 сағат. Жаяу адамның да қозғалысы ескеріледі.",
    [
      30,
      5,
      15
    ],
    [
      "Бастапқы аралық, км",
      "Алдағы адам, км/сағ",
      "Арттағы велосипедші, км/сағ"
    ],
    [
      "3 сағ",
      "2 сағ",
      "10 сағ",
      "6 сағ"
    ]
  ],
  [
    "train-clearance",
    "Ұзындығы «240» м пойыз «24» м/с жылдамдықпен «720» м туннельден өтеді. Пойыздың басы кірген сәттен соңғы вагоны толық шыққанға дейін неше секунд өтеді?",
    "40",
    "Толық өту жолы 240 + 720 = 960 м. Уақыт 960 ÷ 24 = 40 секунд.",
    [
      240,
      24,
      720
    ],
    [
      "Пойыз ұзындығы, м",
      "Жылдамдық, м/с",
      "Туннель ұзындығы, м"
    ]
  ],
  [
    "same-direction-gap",
    "Мотоцикл мен автобус бір нүктеден бір мезгілде бір бағытта шықты. Жылдамдықтары «75» және «55» км/сағ. «3» сағаттан соң аралары қанша?",
    "60 км",
    "Аралықтың өсуі сағатына 75 − 55 = 20 км. 20 × 3 = 60 км.",
    [
      75,
      55,
      3
    ],
    [
      "A жылдамдығы, км/сағ",
      "B жылдамдығы, км/сағ",
      "Уақыт, сағ"
    ],
    [
      "225 км",
      "20 км",
      "60 км",
      "390 км"
    ]
  ],
  [
    "meeting-time",
    "Екі ауылдың арасы «72» км. Велосипедші мен жаяу адам екі ауылдан бір мезгілде бір-біріне қарсы шықты. Жылдамдықтары «13» және «5» км/сағ. Кездесуге неше сағат кетеді?",
    "4",
    "13 + 5 = 18 км/сағ. 72 ÷ 18 = 4 сағат.",
    [
      72,
      13,
      5
    ],
    [
      "Бастапқы аралық, км",
      "A жылдамдығы, км/сағ",
      "B жылдамдығы, км/сағ"
    ]
  ],
  [
    "mixed-distance-speed",
    "Дана «3» км «600» м жолды «40» минутта өтті. Жылдамдығы неше м/мин?",
    "90",
    "3 км 600 м = 3600 м. 3600 ÷ 40 = 90 м/мин.",
    [
      3,
      600,
      40
    ],
    [
      "Километр",
      "Қосымша метр",
      "Уақыт, мин"
    ]
  ],
  [
    "mixed-distance-duration",
    "Шаңғышы «250» м/мин жылдамдықпен «4» км жол өтті. Неше минут жүрді?",
    "16",
    "4 км = 4000 м. 4000 ÷ 250 = 16 минут.",
    [
      250,
      4
    ],
    [
      "Жылдамдық, м/мин",
      "Жол, км"
    ]
  ],
  [
    "mixed-walk-duration",
    "Үйден мұражайға дейін «1» км «680» м. Марат «80» м/мин жылдамдықпен жүреді. Мұражайға неше минутта жетеді?",
    "21",
    "Жол 1680 м. Уақыт 1680 ÷ 80 = 21 минут.",
    [
      1,
      680,
      80
    ],
    [
      "Километр",
      "Қосымша метр",
      "Жылдамдық, м/мин"
    ]
  ],
  [
    "arrival-difference",
    "Үйден стадионға дейін «1» км «800» м. Айша «75» м/мин жылдамдықпен жаяу, Нұржан «18» км/сағ жылдамдықпен велосипедпен жүреді. Бірге шықса, Нұржан неше минут бұрын жетеді?",
    "18",
    "Жол 1800 м. Айша 1800 ÷ 75 = 24 минут жүреді. Велосипед жылдамдығы 300 м/мин, уақыты 1800 ÷ 300 = 6 минут. Айырмасы 24 − 6 = 18 минут.",
    [
      1,
      800,
      75,
      18
    ],
    [
      "Километр",
      "Қосымша метр",
      "Жаяу, м/мин",
      "Велосипед, км/сағ"
    ]
  ],
  [
    "arrival-clock",
    "Автобус «8» сағат «50» минутта шықты. «84» км/сағ жылдамдықпен «322» км жүрді. Қалаға сағат нешеде жетеді?",
    "12 сағ 40 мин",
    "Жол уақыты 322 × 60 ÷ 84 = 230 минут, яғни 3 сағат 50 минут. 8 сағат 50 минутқа қосқанда 12 сағат 40 минут болады.",
    [
      8,
      50,
      84,
      322
    ],
    [
      "Шығу сағаты",
      "Шығу минуты",
      "Жылдамдық, км/сағ",
      "Жол, км"
    ],
    [
      "13 сағ 0 мин",
      "12 сағ 40 мин",
      "12 сағ 20 мин",
      "11 сағ 40 мин"
    ]
  ],
  [
    "train-mixed-clearance",
    "Ұзындығы «360» м пойыз «72» км/сағ жылдамдықпен «1440» м туннельден өтеді. Басы кіргеннен соңғы вагоны толық шыққанға дейін қанша уақыт өтеді?",
    "90 с",
    "72 км/сағ = 20 м/с. Толық өту жолы 360 + 1440 = 1800 м. Уақыт 1800 ÷ 20 = 90 секунд.",
    [
      360,
      72,
      1440
    ],
    [
      "Пойыз ұзындығы, м",
      "Жылдамдық, км/сағ",
      "Туннель ұзындығы, м"
    ],
    [
      "45 с",
      "90 с",
      "72 с",
      "18 с"
    ]
  ],
  [
    "mixed-meeting",
    "Арасы «9» км екі ауылдан велосипедші «18» км/сағ және жаяу адам «150» м/мин жылдамдықпен бір мезгілде бір-біріне қарсы шықты. Неше минутта кездеседі?",
    "20",
    "Велосипедші 300 м/мин жүреді. Екеуі минутына 300 + 150 = 450 м жақындайды. 9000 ÷ 450 = 20 минут.",
    [
      9,
      18,
      150
    ],
    [
      "Аралық, км",
      "Велосипед, км/сағ",
      "Жаяу, м/мин"
    ]
  ],
  [
    "mixed-shuttle-distance",
    "Арасы «3» км екі нүктеден Айбар мен Ермек бір мезгілде бір-біріне қарсы «75» және «45» м/мин жылдамдықпен жүрді. Айбармен шыққан ит «24» км/сағ жылдамдықпен балалардың арасында кездескенше тоқтамай ары-бері жүгірді. Иттің барлық жолы неше метр?",
    "10000",
    "Жақындау 75 + 45 = 120 м/мин. Балалар 3000 ÷ 120 = 25 минутта кездеседі. Ит жылдамдығы 400 м/мин. Оның жолы 400 × 25 = 10000 м.",
    [
      3,
      75,
      45,
      24
    ],
    [
      "Аралық, км",
      "A жылдамдығы, м/мин",
      "B жылдамдығы, м/мин",
      "Ит, км/сағ"
    ]
  ],
  [
    "circular-lap",
    "Ұзындығы «600» м айналма жолда екі жүгіруші бір жерден бір мезгілде бір бағытта шықты. Біріншісі «6» м/с, екіншісі «300» м/мин жүгіреді. Біріншісі екіншісінен бір толық айналым артып, оны алғаш рет қашан қуып жетеді?",
    "10 мин",
    "Екінші жылдамдық 300 ÷ 60 = 5 м/с. Салыстырмалы жылдамдық 6 − 5 = 1 м/с. Қуып жету 600 ÷ 1 = 600 секунд, яғни 10 минут. Бірінші жүгірушінің бір айналымы ғана 100 секунд болады.",
    [
      600,
      6,
      300
    ],
    [
      "Айналым ұзындығы, м",
      "Бірінші, м/с",
      "Екінші, м/мин"
    ],
    [
      "10 мин",
      "5 мин",
      "1 мин 40 с",
      "60 мин"
    ]
  ],
  [
    "mixed-chase-time",
    "Ит мысықтың артынан бір бағытта жүгірді. Алғашқы аралық «84» м. Ит «10» м/с, мысық «420» м/мин жүгіреді. Ит оны неше секундта қуып жетеді?",
    "28",
    "Мысық 420 ÷ 60 = 7 м/с жүгіреді. Жақындау жылдамдығы 10 − 7 = 3 м/с. 84 ÷ 3 = 28 секунд.",
    [
      84,
      10,
      420
    ],
    [
      "Алғашқы аралық, м",
      "Ит, м/с",
      "Мысық, м/мин"
    ]
  ],
  [
    "journey-with-wait",
    "Қалаға дейін «27» км. Жандос алғашқы «9» км-ді велосипедпен «300» м/мин жылдамдықпен жүрді. Автобусты «7» минут күтіп, қалғанын «90» км/сағ жылдамдықпен жүрді. Барлық жолға күтуімен бірге неше минут кетті?",
    "49",
    "Велосипедпен 9000 ÷ 300 = 30 минут. Қалған 18 км-ді автобус 1500 м/мин жылдамдықпен 12 минутта өтеді. Барлығы 30 + 7 + 12 = 49 минут.",
    [
      27,
      9,
      300,
      7,
      90
    ],
    [
      "Барлық жол, км",
      "Бірінші бөлік, км",
      "Велосипед, м/мин",
      "Күту, мин",
      "Автобус, км/сағ"
    ]
  ],
  [
    "mixed-opposite-separation",
    "Екі пойыз бір стансадан бір мезгілде қарама-қарсы бағытта «90» км/сағ және «1200» м/мин жылдамдықпен шықты. «40» минуттан кейін аралары неше километр болады?",
    "108",
    "Бірінші пойыз 1500 м/мин жүреді. Аралық минутына 1500 + 1200 = 2700 м өседі. 2700 × 40 = 108000 м, яғни 108 км.",
    [
      90,
      1200,
      40
    ],
    [
      "A жылдамдығы, км/сағ",
      "B жылдамдығы, м/мин",
      "Уақыт, мин"
    ]
  ],
  [
    "delayed-meeting-distance",
    "Екі қаланың арасы «168» км. Жеңіл көлік «10» сағат «0» минутта «72» км/сағ жылдамдықпен шықты. Қарсы бағыттағы автобус екінші қаладан «10» сағат «30» минутта «1000» м/мин жылдамдықпен шықты. Кездескенге дейін жеңіл көлік неше километр жүрді?",
    "108",
    "Алғашқы 30 минутта көлік 36 км жүрді. Қалғаны 168 − 36 = 132 км. Автобус 60 км/сағ жүреді. Қосынды жылдамдық 72 + 60 = 132 км/сағ. Бірге қозғалған уақыт 1 сағат. Көлік жолы 36 + 72 = 108 км.",
    [
      168,
      10,
      0,
      72,
      10,
      30,
      1000
    ],
    [
      "Аралық, км",
      "Көлік шығу сағаты",
      "Көлік шығу минуты",
      "Көлік, км/сағ",
      "Автобус шығу сағаты",
      "Автобус шығу минуты",
      "Автобус, м/мин"
    ]
  ],
  [
    "delayed-chase-clock",
    "Нұрлан «7» сағат «10» минутта «80» м/мин жылдамдықпен жаяу шықты. Әкесі сол үйден оның артынан «7» сағат «26» минутта «24» км/сағ жылдамдықпен велосипедпен шықты. Әкесі оны сағат нешеде қуып жетеді?",
    "7 сағ 30 мин",
    "Нұрланның артық уақыты 16 минут, жолы 80 × 16 = 1280 м. Әкесі 400 м/мин жүреді. Жақындау 400 − 80 = 320 м/мин. Қуу 1280 ÷ 320 = 4 минут. 7 сағат 26 минуттан кейін 4 минут — 7 сағат 30 минут.",
    [
      7,
      10,
      80,
      7,
      26,
      24
    ],
    [
      "Бірінші шығу сағаты",
      "Бірінші шығу минуты",
      "Жаяу, м/мин",
      "Әке шығу сағаты",
      "Әке шығу минуты",
      "Велосипед, км/сағ"
    ],
    [
      "7 сағ 30 мин",
      "7 сағ 14 мин",
      "7 сағ 42 мин",
      "7 сағ 29 мин"
    ]
  ],
  [
    "mixed-distance-meeting",
    "Екі ауылдың арасы «19» км «200» м. Бір мезгілде бір-біріне қарсы шыққан велосипедшілердің жылдамдықтары «300» м/мин және «18» км/сағ. Олар неше минуттан соң кездеседі?",
    "32",
    "Екінші велосипедші 300 м/мин жүреді. Қосынды жылдамдық 600 м/мин. Аралық 19200 м. 19200 ÷ 600 = 32 минут.",
    [
      19,
      200,
      300,
      18
    ],
    [
      "Километр",
      "Қосымша метр",
      "A жылдамдығы, м/мин",
      "B жылдамдығы, км/сағ"
    ]
  ]
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),txt=(id,x,y,s,size=18)=>`<text id="${id}" x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#29486d">${esc(s)}</text>`;
export function route(i){return[7,9,13,20,21,26,28].includes(i)?'meet':[8,25].includes(i)?'apart':[10,23,27].includes(i)?'chase':[12,17].includes(i)?'parallel':[4,5,24].includes(i)?'stages':[11,19].includes(i)?'train':i===22?'circle':i===1?'table':'single';}
const arrow=(id,x1,y,x2)=>`<line id="${id}" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#6389d5" stroke-width="4"/><polygon id="${id}-head" points="${x2},${y} ${x2+(x2>x1?-10:10)},${y-6} ${x2+(x2>x1?-10:10)},${y+6}" fill="#6389d5"/>`;
export function draw(i){const[,,,,v,labels]=SPECS[i],mode=route(i);let body='',start=180;
 if(mode==='table'){start=150;body=`<rect id="table" x="20" y="25" width="320" height="98" rx="10" fill="#e3ecfc"/>`+txt('table-v',73,58,'v, км/сағ')+txt('table-t',180,58,'t, сағ')+txt('table-s',287,58,'S, км')+txt('table-unknown',73,101,'?')+txt('table-time',180,101,v[0])+txt('table-distance',287,101,v[1]);}
 else if(mode==='train'){const len=v[0],tun=v[2],scale=300/(len+tun),split=30+len*scale;body=`<rect id="train-body" x="30" y="75" width="${len*scale}" height="38" rx="8" fill="#b9cdf4" stroke="#7795bd"/><rect id="tunnel" x="${split}" y="60" width="${tun*scale}" height="70" rx="8" fill="#d4cfec" stroke="#9d91bf"/>`+arrow('route-0',40,40,120)+txt('train-label',30+len*scale/2,151,'Пойыз',16)+txt('tunnel-label',split+tun*scale/2,151,'Туннель',16);}
 else if(mode==='circle'){body=`<circle id="track" cx="180" cy="90" r="57" fill="none" stroke="#c5d7ed" stroke-width="14"/><path id="lap-0" d="M 180 147 A 57 57 0 0 0 237 90" fill="none" stroke="#6389d5" stroke-width="4"/><path id="lap-1" d="M 180 162 A 72 72 0 0 0 252 90" fill="none" stroke="#9c80c1" stroke-width="4"/><polygon id="lap-head-0" points="237,86 230,99 244,99" fill="#6389d5"/><polygon id="lap-head-1" points="252,86 245,99 259,99" fill="#9c80c1"/>`+txt('circle-caption',180,89,'Бір бағыт',16);start=192;}
 else{body=`<line id="road" x1="25" y1="125" x2="335" y2="125" stroke="#c6d7ed" stroke-width="3"/>`;
 if(mode==='meet')body+=arrow('route-0',45,75,140)+arrow('route-1',315,75,220)+txt('route-A',45,48,'A')+txt('route-B',315,48,'B');
 else if(mode==='apart')body+=arrow('route-0',170,75,45)+arrow('route-1',190,75,315)+txt('route-A',45,48,'A')+txt('route-B',315,48,'B')+`<circle id="origin" cx="180" cy="125" r="6" fill="#9b80bd"/>`;
 else if(mode==='chase')body+=arrow('route-0',45,75,140)+arrow('route-1',220,75,315)+txt('route-A',45,48,i===10?'Велосипед':i===23?'Ит':'Әкесі',15)+txt('route-B',260,48,i===10?'Жаяу':i===23?'Мысық':'Нұрлан',15);
 else if(mode==='parallel')body+=arrow('route-0',45,65,315)+arrow('route-1',45,105,315)+txt('route-A',25,70,'A',14)+txt('route-B',25,110,'B',14);
 else if(mode==='stages')body+=arrow('route-0',35,75,160)+arrow('route-1',200,75,325)+txt('route-A',95,48,'1-бөлік',16)+txt('route-B',265,48,'2-бөлік',16);
 else body+=arrow('route-0',45,75,315)+txt('single-caption',180,48,'Жол бағыты',16);
 if([7,21].includes(i))body+=txt('shuttle-caption',180,155,'Арасында тоқтамай ары-бері',16);
 }
 v.forEach((x,j)=>{const two=v.length>4;body+=txt('input-'+j,two?(j%2?265:95):180,start+(two?Math.floor(j/2)*45:j*43),labels[j],two?12:14)+txt('value-'+j,two?(j%2?265:95):180,start+23+(two?Math.floor(j/2)*45:j*43),x,20);});const height=start+Math.ceil(v.length/(v.length>4?2:1))*45+15;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">Қозғалыс бағыты мен шарттағы деректер</title><metadata id="actual-inputs">${esc(JSON.stringify(v))}</metadata><metadata id="route-mode">${mode}</metadata><rect width="360" height="${height}" rx="18" fill="#f6f9ff"/>${body}</svg>\n`;}
function row(s,i){const[k,statement,answer,solution,,,options]=s,ref=refs[i],source=JSON.parse(fs.readFileSync(new URL('../../'+ref.sourceFile,import.meta.url))).questions.find(q=>q.id===ref.sourceId),image=`/figures/synaq-editions/${name}-${i}-native.svg`;assert.equal(source.options?.length||0,options?.length||0);return{editionId:`${name}-${i}`,modelId:`${name}-${k}`,grade:4,topic:'motion',difficulty:'medium',minimumPlan:'pro',params:{number:i},sourceRefs:[ref],sourceAnswerAvailability:'all_saved_text_official_solutions_options_and_complete_givens_recomputed',adaptationChanges:['All29 full saved/new conditions official/new solutions and32 source/new options read. Changed speeds distances times people and route numbers preserve requested quantity, speed units, directions, timing and response format.','29 original SVG diagrams replace29 archived source illustrations without tracing. Table-only source1 givens480km and6hours confirmed in archived image. Full train clearance and simultaneous or delayed motion recomputed. Standard+ local only; same author separate computational checker, not another human.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,...(options?{options}:{}),image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const i=Number(r.editionId.split('-').at(-1));assert.ok(SPECS[i]);assert.equal(canonicalEdition(r),canonicalEdition(row(SPECS[i],i)),'Unreviewed shifts/sets task');return{answer:r.answer,checks:['actual units remainders Venn cells checked','own native SVG','Standard+ only']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){SPECS.forEach((_,i)=>fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${i}-native.svg`,import.meta.url),draw(i)));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'29 grade4 motion topics3-1 and3-2 localStandard+' ,sourceOccurrences:29,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions},null,2)+'\n');console.log({authored:29,choices:editions.reduce((s,r)=>s+(r.options?.length||0),0)});}
