// ГЕНЕРАТОРЫ ПОХОЖИХ ЗАДАЧ ("такие же задачи генерируй").
// Каждый генератор параметризован: возвращает {topic, statement, answer, solution}
// со случайными числами, но сохраняет тип задачи из реальных вариантов РФМШ.

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

// Тип: «куры/овцы» (В2 №4, В4 №7) — головы и ноги.
function genHeadsLegs() {
  const chickens = rnd(5, 25);
  const animals = rnd(3, 20);       // 4-ногие
  const heads = chickens + animals;
  const legs = chickens * 2 + animals * 4;
  return {
    topic: 'work', difficulty: 2, generated: true,
    statement: `Во дворе ${heads} голов и ${legs} ног (двуногие и четвероногие). Сколько двуногих?`,
    answer: String(chickens),
    solution: `c+d=${heads}, 2c+4d=${legs}. Отсюда d=${animals}, c=${chickens}.`,
  };
}

// Тип: две последовательные скидки/наценки (В3 №15, В4 №17).
function genTwoPercents() {
  const p1 = rnd(1, 4) * 5;   // 5..20
  const p2 = rnd(1, 4) * 5;
  const k = (1 + p1 / 100) * (1 + p2 / 100);
  const pct = Math.round((k - 1) * 10000) / 100;
  return {
    topic: 'pct', difficulty: 2, generated: true,
    statement: `Цену повысили на ${p1}%, затем новую цену — ещё на ${p2}%. На сколько процентов выросла первоначальная цена?`,
    answer: `${pct}%`,
    solution: `(1+${p1}/100)·(1+${p2}/100) = ${k.toFixed(4)} → рост на ${pct}%.`,
  };
}

// Тип: части по отношению (В3 №1, В9 №4).
function genRatioParts() {
  const a = rnd(2, 6), b = rnd(2, 6);
  const unit = rnd(3, 12);
  const total = (a + b) * unit;
  const bigger = Math.max(a, b) * unit;
  return {
    topic: 'ratio', difficulty: 1, generated: true,
    statement: `Отношение двух чисел ${a}:${b}, их сумма ${total}. Найдите большее число.`,
    answer: String(bigger),
    solution: `Частей ${a + b}, ${total}/${a + b}=${unit}. Большее = ${Math.max(a, b)}·${unit} = ${bigger}.`,
  };
}

// Тип: две трубы/совместная работа (В2 №3).
function genPipes() {
  const t1 = rnd(2, 8), t2 = rnd(2, 12);
  const together = (t1 * t2) / (t1 + t2);
  return {
    topic: 'work', difficulty: 2, generated: true,
    statement: `Первая труба наполняет бассейн за ${t1} ч, вторая за ${t2} ч. За сколько часов наполнят вместе?`,
    answer: Number.isInteger(together) ? String(together) : together.toFixed(2),
    solution: `1/${t1} + 1/${t2} = (${t1}+${t2})/(${t1}·${t2}). Время = ${t1}·${t2}/(${t1}+${t2}) ч.`,
  };
}

const generators = { genHeadsLegs, genTwoPercents, genRatioParts, genPipes };

// Вернуть n сгенерированных задач (случайные типы или по теме).
function generate(n = 5, topic = null) {
  const pool = Object.values(generators);
  const out = [];
  for (let i = 0; i < n; i++) {
    const g = pool[rnd(0, pool.length - 1)]();
    if (!topic || g.topic === topic) out.push({ id: `gen_${Date.now()}_${i}`, ...g });
    else i--; // если нужна конкретная тема — пробуем снова
    if (out.length >= n) break;
  }
  return out;
}

module.exports = { generate, generators };
