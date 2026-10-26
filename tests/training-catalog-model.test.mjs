import test from 'node:test';
import assert from 'node:assert/strict';
import { trainingCatalog, trainingSubject, trainingTopicCount, trainingTopicName } from '../frontend/src/trainingCatalogModel.js';
import { STATIC_TOPICS } from '../frontend/src/topicCatalog.generated.js';

test('all populated catalog topics appear exactly once, including science, reading and custom categories', () => {
  const topics = [...STATIC_TOPICS,
    {id:'custom-kazakh',block:'lang_kaz',count:2,name:'Мәтін',nameRu:'Текст'},
    {id:'custom-unknown',block:'new-kind',count:1,name:'Жаңа'},
    {id:'empty',block:'math',count:2,gradableCount:0},
  ];
  const listed = trainingCatalog(topics).flatMap(group => group.topics.map(topic => topic.id));
  assert.deepEqual([...listed].sort(), topics.filter(topic=>trainingTopicCount(topic)>0).map(topic=>topic.id).sort());
  assert.equal(new Set(listed).size, listed.length);
  assert.equal(trainingSubject({block:'science'}),'science');
  assert.equal(trainingSubject({block:'reading'}),'language');
  assert.equal(trainingSubject({block:'lang_kaz'}),'language');
  assert.equal(trainingSubject({block:'new-kind'}),'other');
});

test('subject and bilingual search combine without mutating original topic order or free topic', () => {
  const topics = [{id:'free',block:'math',count:8,name:'Теңдеулер',nameRu:'Уравнения',schools:['БИЛ']},
    {id:'other',block:'logic',count:9,name:'Заңдылықтар',nameRu:'Закономерности',schools:['НИШ']}];
  assert.equal(trainingCatalog(topics,{subject:'logic',query:'заң'}).flatMap(g=>g.topics)[0].id,'other');
  assert.equal(trainingCatalog(topics,{query:' уРАВ '}).flatMap(g=>g.topics)[0].id,'free');
  assert.equal(trainingCatalog(topics,{query:'ниш'}).flatMap(g=>g.topics)[0].id,'other');
  assert.deepEqual(trainingCatalog(topics,{subject:'math',query:'ниш'}),[]);
  assert.equal(topics[0].id,'free');
  assert.equal(trainingTopicName({id:'reading',name:'Оқу сауаттылығы'},'ru'),'Грамотность чтения');
  assert.equal(trainingCatalog([{id:'reading',block:'reading',count:2,name:'Оқу сауаттылығы'}],{query:'чтени'}).length,1);
});

test('older server topic IDs have readable bilingual names and retain their original identity', () => {
  const topics = [{ id: 'speed', name: 'speed', block: 'legacy', count: 3 },
    { id: 'logic', name: 'logic', block: 'legacy', count: 4 }];
  assert.equal(trainingTopicName(topics[0], 'ru'), 'Скорость');
  assert.equal(trainingTopicName(topics[0], 'kk'), 'Жылдамдық');
  assert.equal(trainingSubject(topics[1]), 'logic');
  assert.equal(trainingCatalog(topics, { query: 'жылдам' })[0].topics[0].id, 'speed');
  assert.equal(trainingTopicName({ ...topics[0], nameRu: 'Скорость работы' }, 'ru'), 'Скорость работы');
  assert.equal(topics[0].name, 'speed');
});
