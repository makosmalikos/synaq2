import assert from 'node:assert/strict';
const n=x=>String(x).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const gcd=(a,b)=>b?gcd(b,a%b):a;
const result=(answer,statement,solution,checks)=>({answer:String(answer),statement,solution,checks});
const all=(low,high,predicate)=>{assert(high-low<=100000);const out=[];for(let x=low;x<=high;x++)if(predicate(x))out.push(x);return out;};
const unique=values=>{assert.equal(values.length,1,'The written constraints must determine a unique answer');return values[0];};

const models={
  'grade4-double-neighbour-remainders':p=>{
    const period=p.first*p.second/gcd(p.first,p.second),a=period-1;
    assert(p.first>1&&p.second>1);assert.equal(all(1,a,x=>x%p.first===p.first-1&&x%p.second===p.second-1).length,1);
    return result(a,`Бір натурал санды ${p.first} санына бөлгенде қалдық ${p.first-1}, ал ${p.second} санына бөлгенде қалдық ${p.second-1} шығады. Осы екі шартқа сай ең кіші санды табыңдар.`,`Екі қалдық та өз бөлгішінен 1-ге кем. Санға 1 қоссақ, ${p.first} және ${p.second} сандарына қалдықсыз бөлінеді. Олардың ең кіші оң ортақ еселігі ${period}. Ізделген сан: ${period} − 1 = ${a}.`,['positive common period','all smaller natural numbers checked']);
  },
  'grade4-largest-digit-remainder':p=>{
    const low=10**(p.digits-1),high=10**p.digits-1;assert(p.remainder<p.divisor);
    const values=all(low,high,x=>x%p.divisor===p.remainder),a=Math.max(...values),q=Math.floor(a/p.divisor);
    return result(a,`${p.divisor} санына бөлгенде қалдық ${p.remainder} шығатын ең үлкен ${p.digits} таңбалы натурал санды табыңдар.`,`Жоғарғы шек — ${n(high)}. Шартқа сай ең үлкен сан ${p.divisor} · ${q} + ${p.remainder} = ${n(a)}. Одан кейінгі осындай сан ${n(a+p.divisor)} болады, ол ${p.digits} таңбалы сан емес.`,['complete digit interval enumerated','next congruent number exceeds the upper bound']);
  },
  'grade4-shifted-remainder':p=>{
    assert(p.remainder<p.divisor);const a=(p.remainder+p.add)%p.divisor;
    return result(a,`Белгісіз санды ${p.divisor} санына бөлгенде қалдық ${p.remainder} болды. Осы санға ${p.add} қосып, қайтадан ${p.divisor} санына бөлсе, қалдық қандай болады?`,`Бөлгіштің толық еселіктері қалдыққа әсер етпейді. Қалдыққа ${p.add} қосамыз: ${p.remainder} + ${p.add} = ${p.remainder+p.add}. Осы санды ${p.divisor} санына бөлгендегі қалдық — ${a}.`,['remainder transformed independently of the unknown quotient']);
  },
  'grade4-reversed-multiply-divide':p=>{
    const original=p.mistakenQuotient*p.factor,a=original*p.factor;
    return result(a,`Есепте бір санды ${p.factor} санына көбейту керек еді. Оқушы оны қателесіп ${p.factor} санына бөліп, ${n(p.mistakenQuotient)} жауабын алды. Қате орындалған бөлу қалдықсыз болды. Дұрыс көбейтінді қандай?`,`Алдымен бастапқы санды қалпына келтіреміз: ${n(p.mistakenQuotient)} · ${p.factor} = ${n(original)}. Енді сұралған көбейтуді орындаймыз: ${n(original)} · ${p.factor} = ${n(a)}.`,['two different inverse/forward steps; mistaken result is not the original number']);
  },
  'grade4-complete-bundle-top-up':p=>{
    const r=p.total%p.size,a=(p.size-r)%p.size;
    assert.equal(all(0,a-1,k=>(p.total+k)%p.size===0).length,0);
    return result(a,`Шеберханада ${n(p.total)} төсбелгі бар. Әр бумада дәл ${p.size} төсбелгі болуы үшін жетпегенін ғана қосады. Бәрін толық бумаларға бөлуге ең аз неше төсбелгі қосу керек?`,`Қазір ${n(p.total)} : ${p.size} бөлуінің қалдығы ${r}. Ең жақын толық бумаға ${a} төсбелгі жетпейді. ${n(p.total)} + ${a} = ${n(p.total+a)}, бұл сан ${p.size} санына қалдықсыз бөлінеді.`,['zero additions allowed when already divisible','all smaller additions tested']);
  },
  'grade4-incomplete-quotient-length':p=>{
    const q=Math.floor(p.dividend/p.divisor),r=p.dividend%p.divisor,a=String(q).length;
    return result(a,`${n(p.dividend)} санын ${p.divisor} санына қалдықпен бөлгенде шыққан толымсыз бөліндіде неше цифр болады?`,`Толымсыз бөлінді ${n(q)}, қалдық ${r}: ${n(p.dividend)} = ${n(q)} · ${p.divisor} + ${r}. ${n(q)} саны ${a} цифрдан тұрады.`,['quotient digit count distinguished from the dividend and remainder']);
  },
  'grade4-quotient-remainder-total':p=>{
    const q=Math.floor(p.dividend/p.divisor),r=p.dividend%p.divisor;
    return result(q+r,`${n(p.dividend)} санын ${p.divisor} санына қалдықпен бөлгенде шыққан толымсыз бөлінді мен қалдықтың қосындысын табыңдар.`,`${n(p.dividend)} = ${q} · ${p.divisor} + ${r}. Толымсыз бөлінді ${q}, қалдық ${r}. Сұралған қосынды: ${q} + ${r} = ${q+r}.`,['dividend reconstructed from the quotient and remainder']);
  },
  'grade4-two-division-reconstruction':p=>{
    assert(p.lastTwo<100);const values=all(p.quotient*10,p.quotient*10+9,x=>x%100===p.lastTwo),a=unique(values);
    return result(a,`Бір санды 10 санына бөлгенде толымсыз бөлінді ${p.quotient} шығады. Сол санды 100 санына бөлгендегі қалдық ${p.lastTwo}. Бастапқы санды табыңдар.`,`Бірінші шарт бойынша сан ${n(p.quotient*10)} және ${n(p.quotient*10+9)} аралығында. Осы аралықта соңғы екі цифры ${String(p.lastTwo).padStart(2,'0')} болатын жалғыз сан — ${n(a)}. Тексеру: толымсыз бөлінді ${p.quotient}, ал 100 санына бөлгендегі қалдық ${p.lastTwo}.`,['entire ten-number candidate interval checked','unique intersection of both division constraints']);
  },
  'grade4-remainder-multiple-of-quotient':p=>{
    assert(p.multiplier>1);const q=Math.floor((p.divisor-1)/p.multiplier),r=p.multiplier*q,a=p.divisor*q+r;
    assert(q>0&&r<p.divisor);
    return result(a,`Бір натурал санды ${p.divisor} санына бөлгенде қалдық толымсыз бөліндіден ${p.multiplier} есе үлкен болды. Осы шартқа сай ең үлкен санды табыңдар.`,`Қалдық ${p.divisor} санынан кіші. Толымсыз бөлінді ${q} болғанда қалдық ${q} · ${p.multiplier} = ${r}; келесі бөліндіде ол ${(q+1)*p.multiplier} болып, бөлгіштен кем болмай қалады. Ең үлкен сан: ${q} · ${p.divisor} + ${r} = ${n(a)}.`,['remainder bound determines the largest admissible quotient']);
  },
  'grade4-bounded-equal-quotient-remainder':p=>{
    assert(p.lower>=1000&&p.upper===9999);
    const values=all(p.lower+1,p.upper,x=>Math.floor(x/p.divisor)===x%p.divisor),a=Math.min(...values),q=Math.floor(a/p.divisor);assert(Number.isFinite(a));
    return result(a,`Төрт таңбалы сан ${n(p.lower)} санынан үлкен. Оны ${p.divisor} санына бөлгенде толымсыз бөлінді мен қалдық бірдей болады. Осындай ең кіші санды табыңдар.`,`Бөлінді мен қалдықты q десек, сан ${p.divisor} · q + q түрінде. q = ${q} алғанда сан ${n(a)}, ал q = ${q-1} алғанда ${(p.divisor+1)*(q-1)} — берілген төменгі шектен аспайды. Қалдық ${q} < ${p.divisor}. Сондықтан ең кішісі ${n(a)}.`,['four-digit and strict lower bounds enforced','all candidates in the written interval enumerated']);
  },
  'grade4-fixed-thousands-and-remainder':p=>{
    assert(p.remainder<100);const low=p.thousandsQuotient*1000,high=low+999,values=all(low,high,x=>x%100===p.remainder),a=Math.max(...values);
    return result(a,`Санды 1000 санына бөлгенде толымсыз бөлінді ${p.thousandsQuotient}, ал 100 санына бөлгенде қалдық ${p.remainder} болады. Осы шарттарға сай ең үлкен санды табыңдар.`,`Бірінші шарт санды ${n(low)}–${n(high)} аралығына орналастырады. Екінші шарт бойынша соңғы екі цифры ${String(p.remainder).padStart(2,'0')}. Жүздіктер цифрын 9 етіп алсақ, ең үлкен сан ${n(a)} болады.`,['full thousand-number interval checked for the maximum']);
  },
  'grade4-digit-interval-remainder-count':p=>{
    const low=10**(p.digits-1),high=10**p.digits-1;assert(p.remainder<p.divisor);
    const values=all(low,high,x=>x%p.divisor===p.remainder);
    return result(values.length,`${p.divisor} санына бөлгенде қалдық ${p.remainder} шығатын ${p.digits} таңбалы натурал сандар нешеу?`,`Ең кішісі ${n(values[0])}, ең үлкені ${n(values.at(-1))}. Көршілес осындай сандардың айырмасы ${p.divisor}. Саны: (${n(values.at(-1))} − ${n(values[0])}) : ${p.divisor} + 1 = ${values.length}. Екі шеткі сан да есептеледі.`,['complete digit-length interval enumerated; inclusive endpoints']);
  },
  'grade4-shared-decimal-remainder-minimum':p=>{
    assert(p.remainder<10);const values=all(1000,9999,x=>[10,100,1000].every(d=>x%d===p.remainder)),a=Math.min(...values);
    return result(a,`Төрт таңбалы санды 10, 100 және 1000 сандарына бөлгенде үш жағдайда да қалдық ${p.remainder} болады. Осындай ең кіші санды табыңдар.`,`1000 санына бөлгендегі қалдық ${p.remainder} болғандықтан, соңғы үш цифр ${String(p.remainder).padStart(3,'0')}. Алғашқы цифрды 1 етіп аламыз: ${n(a)}. Бұл санды 10 және 100 сандарына бөлгенде де қалдық ${p.remainder}.`,['all three congruences checked over all four-digit numbers']);
  },
  'grade4-largest-quotient-remainder-sum':p=>{
    const candidates=[];for(let q=0;q<p.total;q++){const r=p.total-q;if(r>0&&r<p.divisor)candidates.push(q*p.divisor+r);}
    const a=Math.max(...candidates),q=Math.floor(a/p.divisor),r=a%p.divisor;
    return result(a,`Бір санды ${p.divisor} санына бөлгенде толымсыз бөлінді мен қалдықтың қосындысы ${p.total} болады. Қалдық 0 емес. Осы шартқа сай ең үлкен санды табыңдар.`,`Қалдық кемінде 1, сондықтан бөлінді ең көбі ${p.total-1}. Ең үлкен сан бөлінді ${q}, қалдық ${r} болғанда шығады: ${q} · ${p.divisor} + ${r} = ${n(a)}. Қалған мүмкін жұптардың бәрі кіші сан береді.`,['every nonzero-remainder pair with the given sum checked']);
  },
  'grade4-largest-equal-quotient-remainder':p=>{
    const q=p.divisor-1,a=p.divisor*q+q;
    return result(a,`Бір санды ${p.divisor} санына бөлгенде толымсыз бөлінді мен қалдық бірдей болады. Осы шартқа сай ең үлкен санды табыңдар.`,`Қалдық бөлгіштен кіші, сондықтан ол ең көбі ${q}. Бөлінді де ${q} болады. Ізделген сан: ${p.divisor} · ${q} + ${q} = ${n(a)}. Оларды бірге арттырсақ, қалдық бөлгішке тең болып, рұқсат етілген шектен шығады.`,['the largest legal remainder maximizes both identical components']);
  },
  'grade4-reconstruct-then-new-remainder':p=>{
    assert(p.firstRemainder<p.firstDivisor);const original=p.firstDivisor*p.firstQuotient+p.firstRemainder,q=Math.floor(original/p.nextDivisor),a=original%p.nextDivisor;
    return result(a,`Санды ${p.firstDivisor} санына бөлгенде толымсыз бөлінді ${p.firstQuotient}, қалдық ${p.firstRemainder} шығады. Осы санды ${p.nextDivisor} санына бөлгендегі қалдықты табыңдар.`,`Бастапқы сан: ${p.firstDivisor} · ${p.firstQuotient} + ${p.firstRemainder} = ${n(original)}. Жаңа бөлу: ${n(original)} = ${p.nextDivisor} · ${q} + ${a}. Қалдық ${a} < ${p.nextDivisor}.`,['original number uniquely reconstructed before changing the divisor']);
  },
  'grade4-remainder-under-factor-divisor':p=>{
    assert(p.firstDivisor%p.nextDivisor===0&&p.remainder<p.firstDivisor);const a=p.remainder%p.nextDivisor;
    return result(a,`Белгісіз санды ${p.firstDivisor} санына бөлгенде қалдық ${p.remainder} шығады. Сол санды ${p.nextDivisor} санына бөлгендегі қалдық қандай болады?`,`${p.firstDivisor} саны ${p.nextDivisor} санына қалдықсыз бөлінеді. Демек бастапқы санның ${p.firstDivisor} еселіктерінен тұратын бөлігі жаңа қалдыққа әсер етпейді. ${p.remainder} = ${p.nextDivisor} · ${Math.floor(p.remainder/p.nextDivisor)} + ${a}. Жаңа қалдық — ${a}.`,['smaller divisor is a factor of the original divisor; result independent of unknown quotient']);
  },
  'grade4-largest-legal-remainder':p=>result(p.divisor-1,`Санды ${p.divisor} санына қалдықпен бөлгенде қалдық ең көп дегенде қандай сан болуы мүмкін?`,`Қалдық 0-ден кем емес және ${p.divisor} санынан кіші. Сондықтан ең үлкені ${p.divisor-1}. Мысалы, ${2*p.divisor-1} = ${p.divisor} · 1 + ${p.divisor-1}.`,['sharp remainder upper bound attained by an explicit example']),
  'grade4-count-digit-multiples':p=>{
    const low=10**(p.digits-1),high=10**p.digits-1,first=Math.ceil(low/p.divisor),last=Math.floor(high/p.divisor),a=last-first+1;
    assert.equal(all(low,high,x=>x%p.divisor===0).length,a);
    return result(a,`Неше ${p.digits} таңбалы натурал сан ${p.divisor} санына қалдықсыз бөлінеді?`,`Ең кіші осындай сан ${p.divisor} · ${first} = ${n(p.divisor*first)}, ең үлкені ${p.divisor} · ${last} = ${n(p.divisor*last)}. Көбейткіштер ${first}–${last} аралығында, екі шеті де кіреді. Саны: ${last} − ${first} + 1 = ${a}.`,['multiple-index bounds agree with exhaustive digit-interval enumeration']);
  },
  'grade4-smallest-digit-remainder':p=>{
    const low=10**(p.digits-1),high=10**p.digits-1;assert(p.remainder<p.divisor);
    const q=Math.ceil((low-p.remainder)/p.divisor),a=p.divisor*q+p.remainder;assert(a<=high&&a-p.divisor<low);
    return result(a,`${p.divisor} санына бөлгенде қалдық ${p.remainder} шығатын ең кіші ${p.digits} таңбалы натурал санды табыңдар.`,`Ізделген сан ${p.divisor} · q + ${p.remainder} түрінде. q = ${q-1} алғанда ${n(a-p.divisor)} шығады, оның цифры аз. Келесі мән: ${p.divisor} · ${q} + ${p.remainder} = ${n(a)}. Бұл ${p.digits} таңбалы және шартқа сай.`,['first congruent number reaches the lower digit bound; predecessor does not']);
  },
  'grade4-divisor-linked-to-quotient':p=>{
    const candidates=all(1,p.dividend,d=>p.dividend%d===0&&p.dividend/d===p.ratio*d),a=unique(candidates),q=p.dividend/a;
    return result(a,`${n(p.dividend)} саны қалдықсыз бөлінді. Бөлінді бөлгіштен ${p.ratio} есе үлкен болды. Бөлгішті табыңдар.`,`Бөлгішті d десек, бөлінді ${p.ratio} · d, сондықтан d · d = ${n(p.dividend)} : ${p.ratio} = ${p.dividend/p.ratio}. ${a} · ${a} = ${p.dividend/p.ratio}. Демек бөлгіш ${a}. Тексеру: ${n(p.dividend)} : ${a} = ${q}, ал ${q} = ${p.ratio} · ${a}.`,['positive exact divisor uniquely found; quotient ratio verified']);
  },
  'grade4-smallest-two-digit-divisor':p=>{
    const values=all(10,99,d=>p.quotient*d>=100&&p.quotient*d<=999),a=Math.min(...values);
    return result(a,`Үш таңбалы санды екі таңбалы санға қалдықсыз бөлгенде бөлінді ${p.quotient} болды. Бөлгіштің ең кіші мүмкін мәнін табыңдар.`,`Бөлінгіш ${p.quotient} · d түрінде және кемінде 100 болуы керек. d = ${a-1} алсақ, ${p.quotient*(a-1)} — екі таңбалы. d = ${a} алсақ, ${p.quotient*a} — үш таңбалы. Сондықтан ең кіші бөлгіш ${a}.`,['all two-digit divisors checked against the three-digit product bounds']);
  },
  'grade4-hidden-division-digit':p=>{
    assert(/^[0-9?]+$/.test(p.template)&&p.template.split('?').length===2);
    const candidates=[];for(let digit=0;digit<=9;digit++){const text=p.template.replace('?',String(digit));if(text[0]==='0')continue;const number=Number(text)*p.scale;if(number%p.divisor===0)candidates.push({digit,number,quotient:number/p.divisor});}
    const found=unique(candidates),a=p.target==='digit'?found.digit:found.quotient;
    const pattern=p.template.replace('?','□')+' '+String(p.scale).slice(1);
    return result(a,`${pattern} санындағы □ таңбасы бір цифрды жасырып тұр. Сан 0-ден басталмайды және ${p.divisor} санына қалдықсыз бөлінеді. ${p.target==='digit'?'Жасырылған цифрды':'Бөліндіні'} табыңдар.`,`Жасырылған орынға 0–9 цифрларын қойып тексереміз. Сан 0-ден басталмайтын және қалдықсыз бөлінетін жалғыз нұсқа — ${n(found.number)}. Себебі ${n(found.number)} : ${p.divisor} = ${found.quotient}. Жасырылған цифр ${found.digit}, бөлінді ${found.quotient}. Сұралған жауап — ${a}.`,['all ten possible hidden digits checked; exactly one valid number','requested digit and quotient distinguished']);
  },
};

export function renderEdition(row){
  assert.equal(row.grade,4);assert(models[row.modelId]);
  const output=models[row.modelId](row.params);assert(output.statement&&output.solution&&output.answer);return output;
}
export function verifyEdition(row){
  const output=renderEdition(row);for(const key of ['statement','answer','solution'])assert.equal(row[key],output[key],`${row.editionId}: ${key} must remain bound to the givens`);
  assert(row.sourceRefs?.length===1&&row.adaptationChanges?.length>=2);
  return {answer:output.answer,checks:['exact integer/remainder constraints','statement and solution bound to authored givens',...output.checks]};
}
