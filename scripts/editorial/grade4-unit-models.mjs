import assert from 'node:assert/strict';
const unit=(label,dimension,factor,possessive)=>({label,dimension,factor:BigInt(factor),possessive});
const units={
  mg:unit('мг','mass',1),g:unit('г','mass',1000),kg:unit('кг','mass',1000000),c:unit('ц','mass',100000000),t:unit('т','mass',1000000000),
  mm2:unit('мм²','area',1),cm2:unit('см²','area',100),dm2:unit('дм²','area',10000),m2:unit('м²','area',1000000),ar:unit('а','area',100000000),ha:unit('га','area',10000000000),km2:unit('км²','area',1000000000000),
  mm3:unit('мм³','volume',1),cm3:unit('см³','volume',1000),dm3:unit('дм³','volume',1000000),m3:unit('м³','volume',1000000000),litre:unit('л','volume',1000000),
  second:unit('с','duration',1),minute:unit('мин','duration',60),hour:unit('сағ','duration',3600,'сағаттың'),day:unit('тәулік','duration',86400,'тәуліктің'),week:unit('апта','duration',604800),
  month:unit('ай','calendar',1),year:unit('жыл','calendar',12,'жылдың'),century:unit('ғасыр','calendar',1200,'ғасырдың'),
};
const n=x=>String(x).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
function get(name){assert(units[name],`Unknown unit ${name}`);return units[name];}
function quantity(value){assert(Number.isSafeInteger(value)&&value>=0&&value<=1e9);return BigInt(value);}
function divide(a,b){assert(b>0n&&a%b===0n,'This grade-4 edition requires a whole-number unit result');return a/b;}
const facts={
  'kg:mg':'1 кг = 1000 г және 1 г = 1000 мг, сондықтан 1 кг = 1 000 000 мг.',
  'm2:dm2':'1 м = 10 дм. Аудан үшін екі бағытты да есептейміз: 1 м² = 10 · 10 = 100 дм².',
  'm2:cm2':'1 м = 100 см. Сондықтан 1 м² = 100 · 100 = 10 000 см².',
  'cm2:mm2':'1 см = 10 мм. Сондықтан 1 см² = 10 · 10 = 100 мм².',
  'm3:dm3':'1 м = 10 дм. Көлем үшін үш бағытты есептейміз: 1 м³ = 10 · 10 · 10 = 1000 дм³.',
  'dm3:cm3':'1 дм = 10 см. Сондықтан 1 дм³ = 10 · 10 · 10 = 1000 см³.',
  'cm3:mm3':'1 см = 10 мм. Сондықтан 1 см³ = 10 · 10 · 10 = 1000 мм³.',
  'dm3:mm3':'1 дм = 100 мм. Сондықтан 1 дм³ = 100 · 100 · 100 = 1 000 000 мм³.',
  'litre:cm3':'1 л = 1 дм³, ал 1 дм³ = 1000 см³.',
  'ha:ar':'1 га = 10 000 м² және 1 а = 100 м². Сондықтан 1 га = 100 а.',
  'km2:ha':'1 км² = 1 000 000 м², ал 1 га = 10 000 м². Демек 1 км² = 100 га.',
  'ar:m2':'1 ар — қабырғасы 10 м шаршының ауданы: 1 а = 10 · 10 = 100 м².',
};

function baseEdition(row){
  assert.equal(row.grade,4);const p=row.params;
  if(row.modelId==='grade4-measurement-conversion'){
    assert.deepEqual(Object.keys(p),['from','target']);assert(p.from.length>0&&p.from.length<=3);
    const target=get(p.target),parts=p.from.map(part=>{const from=get(part.unit);assert.equal(from.dimension,target.dimension,'Do not mix length/area/volume or calendar years and day durations');return {value:part.value,unit:part.unit,from,converted:divide(quantity(part.value)*from.factor,target.factor)};});
    const answer=parts.reduce((sum,part)=>sum+part.converted,0n).toString(),given=parts.map(part=>`${n(part.value)} ${part.from.label}`).join(' ');
    const steps=parts.map(part=>{
      const fact=facts[`${part.unit}:${p.target}`]||facts[`${p.target}:${part.unit}`]||'';
      if(part.unit===p.target)return `${n(part.value)} ${target.label} өзгермейді`;
      const growing=part.from.factor>=target.factor,factor=growing?divide(part.from.factor,target.factor):divide(target.factor,part.from.factor);
      const relationship=growing?`1 ${part.from.label} = ${n(factor)} ${target.label}`:`1 ${target.label} = ${n(factor)} ${part.from.label}`;
      return `${fact||relationship+'.'} ${n(part.value)} ${growing?'·':':'} ${n(factor)} = ${n(part.converted)} ${target.label}`;
    });
    return {answer,statement:`Берілген шаманы жаңа бірлікпен өрнектеңдер: ${given} = ? ${target.label}.`,
      solution:`Бірліктерді бірдей өлшемге келтіреміз: ${steps.join('; ')}.${parts.length>1?` Барлығын қосамыз: ${parts.map(part=>n(part.converted)).join(' + ')} = ${n(answer)} ${target.label}.`:` Нәтиже: ${n(answer)} ${target.label}.`}`};
  }
  if(row.modelId==='grade4-fraction-of-time-unit'){
    assert.deepEqual(Object.keys(p),['from','numerator','denominator','target']);
    const from=get(p.from),target=get(p.target);assert(from.possessive&&from.dimension===target.dimension&&p.numerator>0&&p.numerator<p.denominator);
    const full=divide(from.factor,target.factor),answer=divide(full*quantity(p.numerator),quantity(p.denominator));
    return {answer:answer.toString(),statement:`Бір ${from.possessive} ${p.numerator}/${p.denominator} бөлігін ${target.label} бірлігімен өрнектеңдер.`,
      solution:`1 ${from.label} = ${n(full)} ${target.label}. Толық уақытты ${p.denominator} тең бөлікке бөлеміз: ${n(full)} : ${p.denominator} = ${n(divide(full,quantity(p.denominator)))} ${target.label}. Осындай ${p.numerator} бөлікті аламыз: ${n(full)} : ${p.denominator} · ${p.numerator} = ${n(answer)} ${target.label}.`};
  }
  if(row.modelId==='grade4-given-year-fraction'){
    assert.deepEqual(Object.keys(p),['days','numerator','denominator']);assert([365,366].includes(p.days)&&p.numerator>0&&p.numerator<p.denominator);
    const answer=divide(quantity(p.days)*quantity(p.numerator),quantity(p.denominator));
    return {answer:answer.toString(),statement:`${p.days===366?'Кібісе':'Кәдімгі'} жылда ${p.days} тәулік бар. Осы жылдың ${p.numerator}/${p.denominator} бөлігі неше тәулік болады?`,
      solution:`Жылдағы ${p.days} тәуліктің берілген бөлігін есептейміз: ${p.days} : ${p.denominator} · ${p.numerator} = ${n(answer)} тәулік.`};
  }
  throw Error('Unknown grade-4 unit model '+row.modelId);
}
export function renderEdition(row){
  const result=baseEdition(row);
  return {...result,statement:result.statement+' Жауапты тек санмен жазыңдар.'};
}
export function verifyEdition(row){
  const expected=renderEdition(row);for(const field of ['answer','statement','solution'])assert.equal(row[field],expected[field],`${row.editionId}: ${field} must remain bound to the dimensional givens`);
  assert(row.sourceRefs?.length===1&&row.adaptationChanges?.length>=2);
  return {answer:expected.answer,checks:['dimensionally consistent unit factors','BigInt exact unit/fraction calculation','no assumed fixed day count for a month/year','native notation bound to every given measurement']};
}
