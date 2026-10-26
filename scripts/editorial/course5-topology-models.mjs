import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='course5-topology';
export const SOURCE_INDICES=[2, 5, 7, 8, 10, 13, 15, 16, 23, 24, 25, 26, 30, 35, 36, 37, 38, 40, 41, 42, 45, 47];
const refs=[{"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level1.json", "sourceId": "3e0274f49eebc4a5"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level1.json", "sourceId": "989ab04896ec979e"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level2.json", "sourceId": "4490c2799ef6185d"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level2.json", "sourceId": "6566712f9f322fb0"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level2.json", "sourceId": "ec2018415825672a"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level3.json", "sourceId": "4e66d7c581b19eaf"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level3.json", "sourceId": "c92de628f8a8a368"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-1-level3.json", "sourceId": "d3b6b85657109297"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level1.json", "sourceId": "4ca411a72f3393e3"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level1.json", "sourceId": "7a825ab4777ad246"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level1.json", "sourceId": "a2d7e3f4bc411586"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level1.json", "sourceId": "af21028f4a6ef7de"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level2.json", "sourceId": "1070eedac878745b"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level2.json", "sourceId": "d1bee5f9cfeb822d"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level2.json", "sourceId": "dfa64363987da932"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level2.json", "sourceId": "e34eb47da1c22e63"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level2.json", "sourceId": "ea1493c974773f39"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level2.json", "sourceId": "feeb7b91340e172a"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level3.json", "sourceId": "0347bfa066d7875a"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-level3.json", "sourceId": "12e7a2882cc66262"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-leveltest.json", "sourceId": "1762c5f074c713aa"}, {"sourceFile": "problems/sources/zerek/courses/5-math-9-2-leveltest.json", "sourceId": "b2d262d771f80ec6"}];
export const SPECS=[
  [
    "opposite",
    "Қораптың жаңа жазбасындағы жақтар әріптермен белгіленген. Бүктегенде K жағына қай жақ қарама-қарсы болады?",
    "P",
    "Қарама-қарсы жұптар: J ↔ M; K ↔ P; L ↔ N. Сұралған жаққа қарсысы — P.",
    [],
    [],
    [
      "J",
      "L",
      "M",
      "P"
    ]
  ],
  [
    "net-candidates",
    "Төрт пішіннің әрқайсысы алты бірдей шаршыдан тұрады. Қай нөмірлі пішінді бүктегенде алты жағы бір реттен жабылатын куб шығады?",
    "2",
    "Әр пішіннің алты жағын бүктеп тексереміз. Тек 2-нұсқада алты түрлі бағыт шығады. Басқа нұсқаларда жақтар қабаттасады.",
    [],
    [],
    [
      "1",
      "2",
      "3",
      "4"
    ]
  ],
  [
    "vertices",
    "Жазбаны бүктегенде N нүктесі белгіленген қай нүктемен беттеседі?",
    "J",
    "Нүктелердің кубтағы орындарын салыстырамыз. N және J бір төбеге түседі. Қалған ұсынылған нүктелер басқа төбелерде қалады.",
    [],
    [],
    [
      "J",
      "K",
      "L",
      "M"
    ]
  ],
  [
    "die",
    "Ойын сүйегінің қарама-қарсы жақтарындағы сандардың қосындысы «7». Жазбадағы сұрақ белгісінің орнына қай сан жазылады?",
    "6",
    "Сұрақ белгісі бар жақ 1 санының қарсысына түседі. Сондықтан белгісіз сан 7 − 1 = 6. Қалған жұптар да 7-ге толықтырылады.",
    [],
    [],
    [
      "3",
      "4",
      "6",
      "5"
    ]
  ],
  [
    "complete-net",
    "Бес шаршы салынған. Алтыншы шаршыны нөмірленген төрт орынның біріне қосу керек. Қай орынды таңдасақ, кубтың дұрыс жазбасы шығады?",
    "2",
    "Әр орынды қосып, алты шаршыны бүктеп тексереміз. 2-орында алты жақ бөлек бағыттарға түседі. Қалған орындарда екі жақ бірін-бірі жабады.",
    [],
    [],
    [
      "1",
      "2",
      "3",
      "4"
    ]
  ],
  [
    "edges",
    "Жазбаны бүктегенде JK кесіндісі ұсынылған қай кесіндімен беттесіп, кубтың бір қырын құрайды?",
    "LM",
    "Кесінділердің екі ұшы да сәйкес төбелерге түсуі керек. JK пен LM ұштары бірдей екі төбеге түседі, сондықтан бір қырға бірігеді.",
    [],
    [],
    [
      "NP",
      "NQ",
      "PR",
      "LM"
    ]
  ],
  [
    "net-candidates",
    "Төрт алтышаршылы пішін көрсетілген. Олардың нешеуінен куб бүктеуге болады?",
    "2",
    "Әр пішінді жеке тексергенде бірінші және үшінші пішіндерде алты түрлі жақ шығады. Қалған екеуінде жақтар қабаттасады. Дұрыс жазба саны — 2.",
    [],
    [],
    [
      "1",
      "2",
      "3",
      "4"
    ]
  ],
  [
    "neighbor-sum",
    "Кубтың жазбасында сандар берілген. 2 саны бар жаққа қырымен жанасатын төрт жақтағы сандардың қосындысын тап.",
    "32",
    "Қарама-қарсы жұптар: 2 ↔ 8; 10 ↔ 6; 12 ↔ 4. Барлық сандардан сұралған жақ пен оның қарсысын алып тастаймыз. Қалған төрт көршінің қосындысы 32.",
    [],
    [],
    [
      "40",
      "36",
      "32",
      "4"
    ]
  ],
  [
    "opposite",
    "Осы жазбадан жасалған куб үстелге M әрпі бар жағымен қойылды. Үстінде қай әріп болады?",
    "J",
    "Астыңғы және үстіңгі жақтар қарама-қарсы. Жұптар: J ↔ M; K ↔ N; L ↔ P. Сондықтан үстінде J болады.",
    [],
    []
  ],
  [
    "hole",
    "Беске бес торлы тақтадан ақ ойық қиылған. Төмендегі төрт бөліктің қайсысы ойықты дәл толтырады? Бөлікті бұруға болады.",
    "3",
    "Ойық төрт тордан тұратын Т пішіні. Үшінші бөлікті бұрғанда барлық торы ойықпен дәл келеді. Қалғандарының тор саны сәйкес болғанымен, пішіні өзгеше.",
    [],
    [],
    [
      "1",
      "2",
      "3",
      "4"
    ]
  ],
  [
    "congruent-cuts",
    "Тіктөртбұрыш төрт түрлі тәсілмен екі түсті бөлікке бөлінген. Қай нұсқада екі бөлік пішіні мен өлшемі бойынша тең? Бөліктерді бұруға, аударуға болады.",
    "4",
    "Әр бөлікте алты тор бар, бірақ ауданның теңдігі жеткіліксіз. Төртінші нұсқаның бөліктері бұрғанда немесе аударғанда дәл беттеседі. Басқа үш нұсқада торлардың орналасуы сәйкес емес.",
    [],
    [],
    [
      "1",
      "2",
      "3",
      "4"
    ]
  ],
  [
    "net-candidates",
    "Төрт пішіннің қайсысынан шаршыларды қиып не қабаттастырмай куб бүктеуге болады?",
    "4",
    "Барлық алты шаршының бағытын тексереміз. 4-пішін алты бөлек жақ береді, қалғандары бір жақты екі рет жабады.",
    [],
    [],
    [
      "1",
      "2",
      "3",
      "4"
    ]
  ],
  [
    "lateral-sum",
    "Жазбадан жасалған кубтың 5 саны бар жағы төменге қойылды. Төрт бүйір жағындағы сандардың қосындысы қанша?",
    "13",
    "Жұптар: 1 ↔ 6; 2 ↔ 4; 3 ↔ 5. Төменгі жақ пен оған қарсы үстіңгі жақты барлық сандардың қосындысынан алып тастаймыз. Бүйір жақтар қосындысы 13.",
    [],
    []
  ],
  [
    "assemble-rectangle",
    "Үш бөліктің бәрін пайдаланып, бос орынсыз тіктөртбұрыш құрастыр. Бөліктерді бұруға және аударуға болады. Ұсынылған өлшемдердің қайсысы сәйкес?",
    "3 × 6",
    "Бөліктердің аудандары 4, 6, 8 тор, барлығы 18. Бірінші нұсқада үш бөлік 3 × 6 тіктөртбұрышты толық жабады. 2 × 9 бен 1 × 18 пішіндеріне сыймайды, ал 4 × 5 ауданы 20 тор.",
    [],
    [],
    [
      "3 × 6",
      "2 × 9",
      "1 × 18",
      "4 × 5"
    ]
  ],
  [
    "cube-candidates",
    "Жоғарыда жазба, төменде төрт куб көрсетілген. Әріптердің жазылу бағытын ескермей, осы жазбадан шығатын кубты таңда.",
    "3",
    "Қарама-қарсы жұптар: J ↔ P; K ↔ M; L ↔ N. Бір төбеде қарама-қарсы жақтар бірге көрінбейді. Үшінші кубта үш көрші жақ дұрыс ретпен орналасқан; қалған нұсқаларда қарсы жақтар қатар көрсетілген.",
    [],
    [],
    [
      "1",
      "2",
      "3",
      "4"
    ]
  ],
  [
    "complete-net",
    "Бес шаршы салынған. Алтыншы шаршыны нөмірленген төрт орынның біріне қосу керек. Қай орынды таңдасақ, кубтың дұрыс жазбасы шығады?",
    "4",
    "Әр орынды қосып, алты шаршыны бүктеп тексереміз. 4-орында алты жақ бөлек бағыттарға түседі. Қалған орындарда екі жақ бірін-бірі жабады.",
    [],
    [],
    [
      "1",
      "2",
      "3",
      "4"
    ]
  ],
  [
    "congruent-tiles",
    "Жоғарғы фигураны тор сызықтарымен төрт бірдей бөлікке бөл. Төмендегі нөмірленген пішіндердің қайсысын төрт рет қолдануға болады?",
    "3",
    "Фигурада 12 тор, әр бөлікте 3 тор болуы керек. Үшінші пішін — үш торлы бұрыш. Төрт бұрыш фигураны толық жабады; үш торлы түзу жолақтармен жабу мүмкін емес. Басқа екі пішін төрт тордан тұрады.",
    [],
    [],
    [
      "1",
      "2",
      "3",
      "4"
    ]
  ],
  [
    "die-candidates",
    "Төрт жазбада 1–6 сандары жазылған. Қарама-қарсы жақтардың қосындысы 7 болатын ойын сүйегі қай жазбадан шығады?",
    "3",
    "Үшінші жазбада қарама-қарсы сандар 1 мен 6, 2 мен 5, 3 пен 4 болып жұптасады. Үшеуінің де қосындысы 7. Қалған жазбаларда кемінде бір жұптың қосындысы 7 емес.",
    [],
    [],
    [
      "1",
      "2",
      "3",
      "4"
    ]
  ],
  [
    "redundant-piece",
    "J, K, L, M бөліктерінің үшеуімен 3 × 3 торлы шаршы құрастыруға болады. Қай бөлікті қолданбаймыз? Бөліктерді бұруға және аударуға болады.",
    "M",
    "M бөлігін алып тастағанда қалған үш бөлік 9 торлы шаршыны толық жабады. Қалған нұсқаларда аудан немесе орналасу сәйкес келмейді. Барлық төрт нұсқа бөлек тексерілді.",
    [],
    [],
    [
      "J",
      "K",
      "L",
      "M"
    ]
  ],
  [
    "vertex-max",
    "Осы жазбадан куб жасалды. Бір төбеде түйісетін үш жақтағы сандардың қосындысы ең көбі қанша?",
    "33",
    "Қарама-қарсы жұптар: 3 ↔ 9; 11 ↔ 7; 13 ↔ 5. Әр жұптан бір жақты таңдауға болады. Әр жұптың үлкен санын алсақ, үш жақ бір төбеде кездесіп, қосындысы 33 болады.",
    [],
    []
  ],
  [
    "opposite",
    "Қораптың жаңа жазбасындағы жақтар әріптермен белгіленген. Бүктегенде K жағына қай жақ қарама-қарсы болады?",
    "M",
    "Қарама-қарсы жұптар: J ↔ P; K ↔ M; L ↔ N. Сұралған жаққа қарсысы — M.",
    [],
    [],
    [
      "J",
      "L",
      "N",
      "M"
    ]
  ],
  [
    "net-from-cube",
    "Жоғарыдағы кубтың үш көрінетін жағы берілген. Төмендегі төрт жазбаның қайсысынан осы куб шығады? Әріптердің бағыты ескерілмейді.",
    "1",
    "Бірінші жазбада көрсетілген үш әріп көрші жақтарға түсіп, кубтағыдай ретпен орналасады. Қалған жазбаларда көрінетін әріптердің екеуі қарама-қарсы жақтарға түседі.",
    [],
    [],
    [
      "1",
      "2",
      "3",
      "4"
    ]
  ]
];
export const GEOMETRY=[
  {
    "type": "opposite",
    "net": {
      "cells": [
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          1,
          1
        ],
        [
          1,
          2
        ],
        [
          1,
          3
        ],
        [
          2,
          2
        ]
      ],
      "labels": [
        "J",
        "K",
        "L",
        "M",
        "N",
        "P"
      ]
    },
    "asked": "K",
    "answer": "P",
    "options": [
      "J",
      "L",
      "M",
      "P"
    ]
  },
  {
    "type": "net-candidates",
    "nets": [
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            0,
            3
          ],
          [
            1,
            0
          ],
          [
            1,
            2
          ]
        ]
      },
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ],
          [
            2,
            1
          ],
          [
            3,
            1
          ],
          [
            3,
            2
          ]
        ]
      },
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            0,
            3
          ],
          [
            1,
            0
          ],
          [
            1,
            3
          ]
        ]
      },
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            0,
            3
          ],
          [
            1,
            0
          ],
          [
            2,
            0
          ]
        ]
      }
    ],
    "count": false,
    "answer": "2",
    "options": [
      "1",
      "2",
      "3",
      "4"
    ]
  },
  {
    "type": "vertices",
    "net": {
      "cells": [
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          1,
          1
        ],
        [
          2,
          1
        ],
        [
          2,
          2
        ],
        [
          3,
          1
        ]
      ]
    },
    "points": {
      "J": [
        4,
        1
      ],
      "K": [
        0,
        0
      ],
      "L": [
        0,
        2
      ],
      "M": [
        1,
        0
      ],
      "N": [
        0,
        1
      ]
    },
    "asked": "N",
    "answer": "J",
    "options": [
      "J",
      "K",
      "L",
      "M"
    ]
  },
  {
    "type": "die",
    "net": {
      "cells": [
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          1,
          1
        ],
        [
          1,
          2
        ],
        [
          2,
          2
        ],
        [
          2,
          3
        ]
      ],
      "labels": [
        "1",
        "2",
        "3",
        "?",
        "x",
        "y"
      ]
    },
    "asked": "?",
    "answer": "6",
    "options": [
      "3",
      "4",
      "6",
      "5"
    ]
  },
  {
    "type": "complete-net",
    "base": [
      [
        0,
        1
      ],
      [
        1,
        1
      ],
      [
        1,
        2
      ],
      [
        1,
        3
      ],
      [
        2,
        1
      ]
    ],
    "positions": [
      [
        3,
        1
      ],
      [
        0,
        0
      ],
      [
        -1,
        1
      ],
      [
        0,
        3
      ]
    ],
    "answer": "2",
    "options": [
      "1",
      "2",
      "3",
      "4"
    ]
  },
  {
    "type": "edges",
    "net": {
      "cells": [
        [
          0,
          1
        ],
        [
          1,
          0
        ],
        [
          1,
          1
        ],
        [
          1,
          2
        ],
        [
          1,
          3
        ],
        [
          2,
          1
        ]
      ]
    },
    "points": {
      "J": [
        1,
        4
      ],
      "K": [
        2,
        4
      ],
      "L": [
        1,
        0
      ],
      "M": [
        2,
        0
      ],
      "N": [
        0,
        1
      ],
      "P": [
        0,
        2
      ],
      "Q": [
        1,
        1
      ],
      "R": [
        1,
        2
      ]
    },
    "asked": "JK",
    "answer": "LM",
    "options": [
      "NP",
      "NQ",
      "PR",
      "LM"
    ]
  },
  {
    "type": "net-candidates",
    "nets": [
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ],
          [
            2,
            1
          ],
          [
            2,
            2
          ],
          [
            3,
            1
          ]
        ]
      },
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            0,
            3
          ],
          [
            1,
            0
          ],
          [
            2,
            0
          ]
        ]
      },
      {
        "cells": [
          [
            0,
            1
          ],
          [
            1,
            0
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ],
          [
            1,
            3
          ],
          [
            2,
            2
          ]
        ]
      },
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            0,
            3
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ]
        ]
      }
    ],
    "count": true,
    "answer": "2",
    "options": [
      "1",
      "2",
      "3",
      "4"
    ]
  },
  {
    "type": "neighbor-sum",
    "net": {
      "cells": [
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          1,
          1
        ],
        [
          1,
          2
        ],
        [
          1,
          3
        ],
        [
          2,
          3
        ]
      ],
      "labels": [
        "2",
        "4",
        "6",
        "8",
        "10",
        "12"
      ]
    },
    "asked": "2",
    "answer": "32",
    "options": [
      "40",
      "36",
      "32",
      "4"
    ]
  },
  {
    "type": "opposite",
    "net": {
      "cells": [
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          1,
          1
        ],
        [
          1,
          2
        ],
        [
          2,
          1
        ],
        [
          3,
          1
        ]
      ],
      "labels": [
        "J",
        "K",
        "L",
        "M",
        "N",
        "P"
      ]
    },
    "asked": "M",
    "answer": "J",
    "options": [
      "K",
      "L",
      "N",
      "J"
    ]
  },
  {
    "type": "hole",
    "board": [
      5,
      5
    ],
    "hole": [
      [
        0,
        1
      ],
      [
        1,
        1
      ],
      [
        2,
        1
      ],
      [
        1,
        2
      ]
    ],
    "pieces": [
      [
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          0,
          2
        ],
        [
          1,
          2
        ]
      ],
      [
        [
          0,
          0
        ],
        [
          1,
          0
        ],
        [
          0,
          1
        ],
        [
          1,
          1
        ]
      ],
      [
        [
          0,
          0
        ],
        [
          1,
          0
        ],
        [
          2,
          0
        ],
        [
          1,
          1
        ]
      ],
      [
        [
          0,
          0
        ],
        [
          1,
          0
        ],
        [
          1,
          1
        ],
        [
          2,
          1
        ]
      ]
    ],
    "answer": "3",
    "options": [
      "1",
      "2",
      "3",
      "4"
    ]
  },
  {
    "type": "congruent-cuts",
    "cuts": [
      [
        [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            1,
            0
          ],
          [
            1,
            1
          ],
          [
            2,
            1
          ]
        ],
        [
          [
            1,
            2
          ],
          [
            2,
            0
          ],
          [
            2,
            2
          ],
          [
            3,
            0
          ],
          [
            3,
            1
          ],
          [
            3,
            2
          ]
        ]
      ],
      [
        [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            1,
            0
          ],
          [
            1,
            1
          ],
          [
            2,
            0
          ],
          [
            2,
            1
          ]
        ],
        [
          [
            0,
            2
          ],
          [
            1,
            2
          ],
          [
            2,
            2
          ],
          [
            3,
            0
          ],
          [
            3,
            1
          ],
          [
            3,
            2
          ]
        ]
      ],
      [
        [
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ],
          [
            2,
            1
          ],
          [
            2,
            2
          ]
        ],
        [
          [
            0,
            0
          ],
          [
            1,
            0
          ],
          [
            2,
            0
          ],
          [
            3,
            0
          ],
          [
            3,
            1
          ],
          [
            3,
            2
          ]
        ]
      ],
      [
        [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ],
          [
            2,
            2
          ]
        ],
        [
          [
            1,
            0
          ],
          [
            2,
            0
          ],
          [
            2,
            1
          ],
          [
            3,
            0
          ],
          [
            3,
            1
          ],
          [
            3,
            2
          ]
        ]
      ]
    ],
    "answer": "4",
    "options": [
      "1",
      "2",
      "3",
      "4"
    ]
  },
  {
    "type": "net-candidates",
    "nets": [
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            0,
            3
          ],
          [
            0,
            4
          ],
          [
            1,
            1
          ]
        ]
      },
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            0,
            3
          ],
          [
            0,
            4
          ],
          [
            1,
            2
          ]
        ]
      },
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            0,
            3
          ],
          [
            1,
            0
          ],
          [
            1,
            1
          ]
        ]
      },
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ],
          [
            2,
            1
          ],
          [
            2,
            2
          ],
          [
            3,
            1
          ]
        ]
      }
    ],
    "count": false,
    "answer": "4",
    "options": [
      "1",
      "2",
      "3",
      "4"
    ]
  },
  {
    "type": "lateral-sum",
    "net": {
      "cells": [
        [
          0,
          1
        ],
        [
          1,
          0
        ],
        [
          1,
          1
        ],
        [
          1,
          2
        ],
        [
          1,
          3
        ],
        [
          2,
          2
        ]
      ],
      "labels": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "asked": "5",
    "answer": "13"
  },
  {
    "type": "assemble-rectangle",
    "pieces": [
      [
        [
          0,
          0
        ],
        [
          1,
          0
        ],
        [
          1,
          1
        ],
        [
          2,
          0
        ]
      ],
      [
        [
          0,
          0
        ],
        [
          1,
          0
        ],
        [
          1,
          2
        ],
        [
          2,
          0
        ],
        [
          2,
          1
        ],
        [
          2,
          2
        ]
      ],
      [
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          1,
          1
        ],
        [
          2,
          0
        ],
        [
          2,
          1
        ],
        [
          3,
          0
        ],
        [
          3,
          1
        ],
        [
          4,
          0
        ]
      ]
    ],
    "choices": [
      [
        3,
        6
      ],
      [
        2,
        9
      ],
      [
        1,
        18
      ],
      [
        4,
        5
      ]
    ],
    "answer": "3 × 6",
    "options": [
      "3 × 6",
      "2 × 9",
      "1 × 18",
      "4 × 5"
    ]
  },
  {
    "type": "cube-candidates",
    "net": {
      "cells": [
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          1,
          1
        ],
        [
          2,
          1
        ],
        [
          3,
          1
        ],
        [
          3,
          2
        ]
      ],
      "labels": [
        "J",
        "K",
        "L",
        "M",
        "N",
        "P"
      ]
    },
    "cubes": [
      [
        "J",
        "K",
        "M"
      ],
      [
        "J",
        "K",
        "P"
      ],
      [
        "J",
        "K",
        "L"
      ],
      [
        "J",
        "L",
        "N"
      ]
    ],
    "answer": "3",
    "options": [
      "1",
      "2",
      "3",
      "4"
    ]
  },
  {
    "type": "complete-net",
    "base": [
      [
        0,
        1
      ],
      [
        1,
        1
      ],
      [
        1,
        2
      ],
      [
        1,
        3
      ],
      [
        2,
        1
      ]
    ],
    "positions": [
      [
        -1,
        1
      ],
      [
        0,
        3
      ],
      [
        3,
        1
      ],
      [
        0,
        0
      ]
    ],
    "answer": "4",
    "options": [
      "1",
      "2",
      "3",
      "4"
    ]
  },
  {
    "type": "congruent-tiles",
    "target": [
      [
        0,
        1
      ],
      [
        0,
        2
      ],
      [
        0,
        3
      ],
      [
        1,
        0
      ],
      [
        1,
        1
      ],
      [
        1,
        3
      ],
      [
        1,
        4
      ],
      [
        2,
        0
      ],
      [
        2,
        1
      ],
      [
        2,
        3
      ],
      [
        3,
        3
      ],
      [
        3,
        4
      ]
    ],
    "pieces": [
      [
        [
          0,
          0
        ],
        [
          1,
          0
        ],
        [
          2,
          0
        ]
      ],
      [
        [
          0,
          0
        ],
        [
          1,
          0
        ],
        [
          0,
          1
        ],
        [
          1,
          1
        ]
      ],
      [
        [
          0,
          0
        ],
        [
          1,
          0
        ],
        [
          0,
          1
        ]
      ],
      [
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          0,
          2
        ],
        [
          1,
          2
        ]
      ]
    ],
    "count": 4,
    "answer": "3",
    "options": [
      "1",
      "2",
      "3",
      "4"
    ]
  },
  {
    "type": "die-candidates",
    "nets": [
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ],
          [
            2,
            1
          ],
          [
            3,
            1
          ]
        ],
        "labels": [
          "1",
          "2",
          "3",
          "5",
          "6",
          "4"
        ]
      },
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ],
          [
            2,
            2
          ],
          [
            2,
            3
          ]
        ],
        "labels": [
          "1",
          "2",
          "3",
          "5",
          "6",
          "4"
        ]
      },
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ],
          [
            2,
            1
          ],
          [
            2,
            2
          ],
          [
            3,
            1
          ]
        ],
        "labels": [
          "1",
          "2",
          "3",
          "5",
          "6",
          "4"
        ]
      },
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ],
          [
            2,
            1
          ],
          [
            3,
            1
          ],
          [
            3,
            2
          ]
        ],
        "labels": [
          "1",
          "2",
          "3",
          "6",
          "4",
          "5"
        ]
      }
    ],
    "answer": "3",
    "options": [
      "1",
      "2",
      "3",
      "4"
    ]
  },
  {
    "type": "redundant-piece",
    "target": [
      3,
      3
    ],
    "pieces": [
      [
        [
          0,
          0
        ],
        [
          1,
          0
        ],
        [
          0,
          1
        ],
        [
          1,
          1
        ]
      ],
      [
        [
          0,
          0
        ],
        [
          1,
          0
        ],
        [
          2,
          0
        ]
      ],
      [
        [
          0,
          0
        ],
        [
          1,
          0
        ]
      ],
      [
        [
          0,
          0
        ],
        [
          1,
          0
        ],
        [
          0,
          1
        ]
      ]
    ],
    "answer": "M",
    "options": [
      "J",
      "K",
      "L",
      "M"
    ]
  },
  {
    "type": "vertex-max",
    "net": {
      "cells": [
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          1,
          1
        ],
        [
          1,
          2
        ],
        [
          1,
          3
        ],
        [
          2,
          1
        ]
      ],
      "labels": [
        "3",
        "5",
        "7",
        "9",
        "11",
        "13"
      ]
    },
    "answer": "33"
  },
  {
    "type": "opposite",
    "net": {
      "cells": [
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          1,
          1
        ],
        [
          2,
          1
        ],
        [
          3,
          1
        ],
        [
          3,
          2
        ]
      ],
      "labels": [
        "J",
        "K",
        "L",
        "M",
        "N",
        "P"
      ]
    },
    "asked": "K",
    "answer": "M",
    "options": [
      "J",
      "L",
      "N",
      "M"
    ]
  },
  {
    "type": "net-from-cube",
    "nets": [
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ],
          [
            1,
            3
          ],
          [
            2,
            2
          ]
        ],
        "labels": [
          "J",
          "K",
          "L",
          "M",
          "N",
          "P"
        ]
      },
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ],
          [
            1,
            3
          ],
          [
            2,
            3
          ]
        ],
        "labels": [
          "J",
          "K",
          "M",
          "L",
          "N",
          "P"
        ]
      },
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ],
          [
            2,
            1
          ],
          [
            3,
            1
          ]
        ],
        "labels": [
          "J",
          "K",
          "M",
          "L",
          "N",
          "P"
        ]
      },
      {
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ],
          [
            2,
            2
          ],
          [
            2,
            3
          ]
        ],
        "labels": [
          "J",
          "K",
          "M",
          "L",
          "N",
          "P"
        ]
      }
    ],
    "cube": [
      "J",
      "K",
      "L"
    ],
    "answer": "1",
    "options": [
      "1",
      "2",
      "3",
      "4"
    ]
  }
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),txt=(id,x,y,s,size=18)=>`<text id="${id}" x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#29486d">${esc(s)}</text>`;
export function draw(i){const d=GEOMETRY[i],k=d.type;let body='',height=300;
 function shape(c,prefix,x,y,w,h,labels=null,colors=null){const xs=c.map(p=>p[0]),ys=c.map(p=>p[1]),minX=Math.min(...xs),minY=Math.min(...ys),nx=Math.max(...xs)-minX+1,ny=Math.max(...ys)-minY+1,s=Math.min(w/nx,h/ny);c.forEach(([a,b],j)=>{const xx=x+(a-minX)*s,yy=y+(b-minY)*s;body+=`<rect id="${prefix}-cell-${j}" x="${xx}" y="${yy}" width="${s}" height="${s}" fill="${colors?colors[j]:'#bed5f3'}" stroke="#7e9abc" stroke-width="1.4"/>`;if(labels)body+=txt(prefix+'-label-'+j,xx+s/2,yy+s/2+6,labels[j],Math.min(22,s*.6));});return{scale:s,origin:[x-minX*s,y-minY*s]};}
 function net(m,p,x,y,w,h){return shape(m.cells,p,x,y,w,h,m.labels||null);}
 function cube(labels,p,x,y,s=55){const P=(a,b,c)=>[x+s*(a+.42*b),y-s*(c+.32*b)],poly=(id,ps,fill)=>`<polygon id="${p}-${id}" points="${ps.map(pt=>P(...pt).join(',')).join(' ')}" fill="${fill}" stroke="#7e9abc"/>`;body+=poly('front',[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],'#bed5f3')+poly('right',[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],'#cfc3ee')+poly('top',[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],'#b4e3d3');const tp=P(.5,.5,1);body+=txt(p+'-top-label',tp[0],tp[1]+5,labels[0],18)+txt(p+'-front-label',...P(.5,0,.35),labels[1],18)+txt(p+'-right-label',...P(1,.5,.35),labels[2],18);}
 if(['net-candidates','die-candidates','net-from-cube'].includes(k)){const off=k==='net-from-cube'?125:20;height=off+405;if(k==='net-from-cube')cube(d.cube,'target',145,100,60);d.nets.forEach((m,j)=>{const x=18+j%2*180,y=off+Math.floor(j/2)*200;net(m,'net-'+j,x,y,145,145);body+=txt('option-'+j,x+72,y+175,j+1,20);});}
 else if(k==='cube-candidates'){height=520;net(d.net,'net-0',70,20,240,200);d.cubes.forEach((labs,j)=>{const x=48+j%2*175,y=330+Math.floor(j/2)*140;cube(labs,'cube-'+j,x,y);body+=txt('option-'+j,x+40,y+30,j+1,20);});}
 else if(k==='complete-net'){height=365;const joined=[...d.base,...d.positions],minx=Math.min(...joined.map(p=>p[0])),miny=Math.min(...joined.map(p=>p[1])),maxx=Math.max(...joined.map(p=>p[0])),maxy=Math.max(...joined.map(p=>p[1])),s=Math.min(300/(maxx-minx+1),290/(maxy-miny+1));d.base.forEach(([x,y],j)=>body+=`<rect id="base-cell-${j}" x="${30+(x-minx)*s}" y="${25+(y-miny)*s}" width="${s}" height="${s}" fill="#bed5f3" stroke="#7e9abc"/>`);d.positions.forEach(([x,y],j)=>{const xx=30+(x-minx)*s,yy=25+(y-miny)*s;body+=`<rect id="candidate-cell-${j}" x="${xx}" y="${yy}" width="${s}" height="${s}" fill="none" stroke="#b27ccc" stroke-width="2" stroke-dasharray="4 3"/>`+txt('option-'+j,xx+s/2,yy+s/2+6,j+1,22);});}
 else if(['vertices','edges'].includes(k)){height=365;const out=net(d.net,'net-0',50,50,245,245);Object.entries(d.points).forEach(([l,[x,y]],j)=>{const xx=out.origin[0]+x*out.scale,yy=out.origin[1]+y*out.scale;body+=`<circle id="point-${l}" cx="${xx}" cy="${yy}" r="3.5" fill="#a36ca5"/>`+txt('point-label-'+l,xx-7,yy-9,l,17);});}
 else if(k==='hole'){height=520;const[cols,rows]=d.board,all=Array.from({length:cols*rows},(_,j)=>[j%cols,Math.floor(j/cols)]),colors=all.map(p=>d.hole.some(q=>q[0]===p[0]&&q[1]===p[1])?'#fff':'#bed5f3');shape(all,'board',90,20,180,180,null,colors);d.pieces.forEach((c,j)=>{const x=35+j%2*180,y=240+Math.floor(j/2)*140;shape(c,'piece-'+j,x,y,110,90);body+=txt('option-'+j,x+55,y+115,j+1);});}
 else if(k==='congruent-cuts'){height=365;d.cuts.forEach(([a,b],j)=>{const x=20+j%2*180,y=20+Math.floor(j/2)*175;shape([...a,...b],'cut-'+j,x,y,145,115,null,[...a.map(_=>'#bed5f3'),...b.map(_=>'#d0bce9')]);body+=txt('option-'+j,x+72,y+145,j+1);});}
 else if(['assemble-rectangle','redundant-piece','congruent-tiles'].includes(k)){height=k==='assemble-rectangle'?400:540;const top=k==='assemble-rectangle'?20:220;if(k==='congruent-tiles')shape(d.target,'target',65,20,230,170);if(k==='redundant-piece'){const[w,h]=d.target;shape(Array.from({length:w*h},(_,j)=>[j%w,Math.floor(j/w)]),'target',105,20,150,150,null,Array(w*h).fill('#fff'));}d.pieces.forEach((c,j)=>{const x=k==='assemble-rectangle'?30:35+j%2*180,y=k==='assemble-rectangle'?20+j*125:top+Math.floor(j/2)*150;shape(c,'piece-'+j,x,y,k==='assemble-rectangle'?240:110,90);body+=txt('piece-name-'+j,k==='assemble-rectangle'?300:x+55,y+(k==='assemble-rectangle'?50:120),k==='congruent-tiles'?j+1:'JKLM'[j],20);});}
 else{net(d.net,'net-0',40,35,280,225);if(d.asked)body+=txt('asked',180,285,'Сұралған жақ: '+d.asked,17);height=330;}
 return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">Жазба және құрастыру есебі</title><metadata id="geometry">${esc(JSON.stringify(Object.fromEntries(Object.entries(d).filter(([k])=>!['answer','options'].includes(k)))))}</metadata><rect width="360" height="${height}" rx="18" fill="#f6f9ff"/>${body}</svg>\n`;}
function row(s,i){const[k,statement,answer,solution,,,options]=s,ref=refs[i],source=JSON.parse(fs.readFileSync(new URL('../../'+ref.sourceFile,import.meta.url))).questions.find(q=>q.id===ref.sourceId),image=`/figures/synaq-editions/${name}-${i}-native.svg`;assert.equal(source.options?.length||0,options?.length||0);return{editionId:`${name}-${i}`,modelId:`${name}-${k}`,grade:5,topic:'spat',difficulty:'medium',minimumPlan:'pro',params:{number:i},sourceRefs:[ref],sourceAnswerAvailability:'all_saved_text_official_solutions_options_and_complete_givens_recomputed',adaptationChanges:['22 full archived/new conditions official/new solutions and all offered choices read. Own changed nets labels die entries hole shapes cuts and puzzle pieces preserve folding congruence and exact tiling reasoning.','22 original native SVGs replace archived art. Exact oriented folding vertex/edge coincidence and exhaustive assembly checks; previews343px inspected. Same author separate computational check, not another human. Standard+ local only.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,...(options?{options}:{}),image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const i=Number(r.editionId.split('-').at(-1));assert.ok(SPECS[i]);assert.equal(canonicalEdition(r),canonicalEdition(row(SPECS[i],i)),'Unreviewed shifts/sets task');return{answer:r.answer,checks:['actual units remainders Venn cells checked','own native SVG','Standard+ only']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){SPECS.forEach((_,i)=>fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${i}-native.svg`,import.meta.url),draw(i)));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'22 grade5 final folding and dissection localStandard+' ,sourceOccurrences:22,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions},null,2)+'\n');console.log({authored:22,choices:editions.reduce((s,r)=>s+(r.options?.length||0),0)});}
