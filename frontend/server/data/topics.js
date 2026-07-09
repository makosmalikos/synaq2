// 12 тем РФМШ (8 математика + 4 логика). name — kk, nameRu — ru.
export const topics = [
  { id: 'eq',    block: 'math',  name: 'Теңдеулер және ықшамдау',            nameRu: 'Уравнения и упрощение' },
  { id: 'num',   block: 'math',  name: 'Сандар және бөлінгіштік',           nameRu: 'Числа и делимость' },
  { id: 'work',  block: 'math',  name: 'Жұмыс және өнімділік',              nameRu: 'Работа и производительность' },
  { id: 'ratio', block: 'math',  name: 'Бөліктер, қатынастар, қозғалыс',    nameRu: 'Части, отношения, движение' },
  { id: 'geo',   block: 'math',  name: 'Геометрия',                         nameRu: 'Геометрия' },
  { id: 'frac',  block: 'math',  name: 'Есептеулер және бөлшектер',         nameRu: 'Вычисления и дроби' },
  { id: 'pct',   block: 'math',  name: 'Пайыздар',                          nameRu: 'Проценты' },
  { id: 'sys',   block: 'math',  name: 'Теңдеулер жүйесі мен теңсіздіктер', nameRu: 'Системы и неравенства' },
  { id: 'seq',   block: 'logic', name: 'Фигуралар/сандар тізбегі',          nameRu: 'Последовательности' },
  { id: 'mtx',   block: 'logic', name: 'Матрицалар және аналогиялар',       nameRu: 'Матрицы и аналогии' },
  { id: 'spat',  block: 'logic', name: 'Кеңістіктік ойлау',                 nameRu: 'Пространственное мышление' },
  { id: 'comb',  block: 'logic', name: 'Сандық/комбинаторлық логика',       nameRu: 'Числовая/комбинаторная логика' },
];

export const topicById = (id) => topics.find((t) => t.id === id);
