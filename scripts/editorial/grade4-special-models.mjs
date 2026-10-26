import assert from 'node:assert/strict';

const grouped=x=>String(x).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
export function renderEdition(row){
  assert.equal(row.grade,4);assert.equal(row.modelId,'grade4-paired-alternating-sum');
  assert.deepEqual(Object.keys(row.params),['top']);
  const top=row.params.top;assert(Number.isSafeInteger(top)&&top>2&&top<=100000&&top%2===0);
  const pairs=top/2;
  return {answer:String(pairs),
    statement:`Математикалық ойынның карточкалары 1-ден ${grouped(top)}-ге дейін ретімен нөмірленген, екі шеткі нөмір де кіреді. Барлық жұп нөмірдің қосындысынан барлық тақ нөмірдің қосындысын азайтыңдар. Нәтиже қандай?`,
    solution:`Әр жұп нөмірді оның алдындағы тақ нөмірмен жұптаймыз: 2 − 1 = 1, 4 − 3 = 1, …, ${grouped(top)} − ${grouped(top-1)} = 1. Барлығы ${grouped(top)} : 2 = ${grouped(pairs)} жұп бар. Әр жұп 1 береді, сондықтан айырма ${grouped(pairs)}.`};
}
export function verifyEdition(row){
  const rendered=renderEdition(row);for(const key of ['answer','statement','solution'])assert.equal(row[key],rendered[key]);
  let even=0n,odd=0n;
  for(let v=1;v<=row.params.top;v++)if(v%2===0)even+=BigInt(v);else odd+=BigInt(v);
  assert.equal((even-odd).toString(),rendered.answer);
  assert.equal(row.sourceRefs?.length,1);
  return {answer:rendered.answer,checks:['explicit inclusive interval','even upper endpoint','pair count','independent exhaustive BigInt sum of odd and even labels']};
}
