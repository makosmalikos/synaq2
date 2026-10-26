import assert from 'node:assert/strict';
const n=x=>String(x).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const names={10:'ондыққа',100:'жүздікке',1000:'мыңдыққа',10000:'ондық мыңға',100000:'жүздік мыңға',1000000:'миллионға'};
export function halfUp(number,unit){assert(Number.isSafeInteger(number)&&number>=0&&names[unit]);return Math.floor((number+unit/2)/unit)*unit;}
const interval=(target,unit)=>{assert(names[unit]&&target%unit===0&&target>=unit);return [target-unit/2,target+unit/2-1];};
const range=(low,high,test=()=>true)=>{assert(high-low<=100000);const out=[];for(let x=low;x<=high;x++)if(test(x))out.push(x);return out;};
const output=(answer,statement,solution,checks,options)=>({answer:String(answer),statement:statement[0].toUpperCase()+statement.slice(1)+' Дәл ортасында тұрған сан жоғары жаққа дөңгелектеледі.',solution,checks,...(options?{options}:{} )});
const models={
  'grade4-round-to-place':p=>{
    const a=halfUp(p.number,p.unit),lower=Math.floor(p.number/p.unit)*p.unit,upper=lower+p.unit;
    return output(a,`${n(p.number)} санын ${names[p.unit]} дейін дөңгелектеп, нәтижесін санмен жазыңдар.`,`Көршілес еселіктер: ${n(lower)} және ${n(upper)}. Қашықтықтар: ${n(p.number-lower)} және ${n(upper-p.number)}. Ең жақын еселік ${n(a)}${p.number-lower===upper-p.number?' (тең қашықтықта жоғарысын аламыз)':''}.`,['exact half-up integer rounding','distance to both neighbours compared']);
  },
  'grade4-rounding-choice':p=>{
    const hits=p.candidates.filter(x=>halfUp(x,p.unit)===p.target);assert.equal(hits.length,1);
    const answer=hits[0],options=p.candidates.map(String);
    return output(answer,`${names[p.unit]} дейін дөңгелектегенде ${n(p.target)} шығатын санды таңдаңдар.`,`Нұсқаларды тексереміз: ${p.candidates.map(v=>`${n(v)} → ${n(halfUp(v,p.unit))}`).join('; ')}. Талапқа сай жалғыз сан — ${n(answer)}.`,['all choices rounded','one matching choice'],options);
  },
  'grade4-rounding-inverse-extreme':p=>{
    const [low,high]=interval(p.target,p.unit),a=p.maximum?high:low;
    assert(halfUp(low,p.unit)===p.target&&halfUp(high,p.unit)===p.target&&halfUp(low-1,p.unit)!==p.target&&halfUp(high+1,p.unit)!==p.target);
    return output(a,`${names[p.unit]} дейін дөңгелектегенде ${n(p.target)} шығатын ең ${p.maximum?'үлкен':'кіші'} натурал санды табыңдар.`,`Дөңгелектеуге сай толық аралық: ${n(low)}–${n(high)}, екі шеті де кіреді. ${p.maximum?'Келесі':'Алдыңғы'} ${n(p.maximum?high+1:low-1)} саны басқа еселікке дөңгелектеледі. Ізделген ${p.maximum?'ең үлкен':'ең кіші'} сан — ${n(a)}.`,['both included and both excluded interval endpoints checked']);
  },
  'grade4-distinct-code-then-round':p=>{
    assert(new Set(p.digits).size===p.digits.length&&p.digits.length===7);
    const sorted=[...p.digits].sort((a,b)=>b-a),largest=Number(sorted.join('')),a=halfUp(largest,p.unit);
    return output(a,`${p.digits.join(', ')} цифрларының әрқайсысын бір рет қолданып, ең үлкен жеті таңбалы санды құрастырыңдар. Шыққан санды ${names[p.unit]} дейін дөңгелектеп, соңғы нәтижені жазыңдар.`,`Ең үлкен сан үшін цифрларды кему ретімен жазамыз: ${n(largest)}. Оны ${names[p.unit]} дейін дөңгелектегенде ${n(a)} шығады.`,['seven distinct given digits used once','lexicographic maximum precedes rounding']);
  },
  'grade4-rounding-set-difference':p=>{
    const [low,high]=interval(p.target,p.coarse),values=range(low,high,x=>halfUp(x,p.coarse)===p.target&&halfUp(x,p.fine)!==p.target);
    const [fineLow,fineHigh]=interval(p.target,p.fine);assert(fineLow>=low&&fineHigh<=high);
    return output(values.length,`${names[p.coarse]} дейін дөңгелектегенде ${n(p.target)} шығатын, бірақ ${names[p.fine]} дейін дөңгелектегенде ${n(p.target)} шықпайтын натурал сандар нешеу?`,`Бірінші аралық ${n(low)}–${n(high)}: ${high-low+1} сан. Екінші аралық ${n(fineLow)}–${n(fineHigh)}: ${fineHigh-fineLow+1} сан; ол бірінші аралықтың ішінде. Айырмасы: ${high-low+1} − ${fineHigh-fineLow+1} = ${values.length}.`,['set difference agrees with full interval enumeration']);
  },
  'grade4-two-rounding-max':p=>{
    const a=interval(p.firstTarget,p.firstUnit),b=interval(p.secondTarget,p.secondUnit),low=Math.max(a[0],b[0]),high=Math.min(a[1],b[1]);assert(low<=high);
    assert(halfUp(high,p.firstUnit)===p.firstTarget&&halfUp(high,p.secondUnit)===p.secondTarget);
    return output(high,`Санды ${names[p.firstUnit]} дейін дөңгелектегенде ${n(p.firstTarget)}, ал ${names[p.secondUnit]} дейін дөңгелектегенде ${n(p.secondTarget)} шығады. Екі шартқа сай ең үлкен санды табыңдар.`,`Бірінші аралық ${n(a[0])}–${n(a[1])}, екіншісі ${n(b[0])}–${n(b[1])}. Ортақ аралық ${n(low)}–${n(high)}. Оның ең үлкені ${n(high)}.`,['intersection nonempty','maximum satisfies both rounding conditions']);
  },
  'grade4-rounding-interval-width':p=>{
    const [low,high]=interval(p.target,p.unit);
    return output(high-low,`${names[p.unit]} дейін дөңгелектегенде ${n(p.target)} шығатын натурал сандардың ең үлкені мен ең кішісінің айырмасын табыңдар.`,`Шеткі сандар: ${n(low)} және ${n(high)}. Олардың айырмасы ${n(high)} − ${n(low)} = ${high-low}. Бұл аралықтағы сандар саны емес, екі шеткі санның айырмасы.`,['endpoint difference distinguished from inclusive count']);
  },
  'grade4-digit-bound-rounding-count':p=>{
    const a=interval(p.target,p.unit),low=Math.max(a[0],10**(p.digits-1)),high=Math.min(a[1],10**p.digits-1);assert(high>=low);
    const answer=high-low+1;assert.equal(range(low,high,x=>halfUp(x,p.unit)===p.target).length,answer);
    return output(answer,`${p.digits} таңбалы санды ${names[p.unit]} дейін дөңгелектегенде ${n(p.target)} шығады. Мұндай ${p.digits} таңбалы сандар нешеу?`,`Дөңгелектеу аралығы ${n(a[0])}–${n(a[1])}. ${p.digits} таңбалы сандармен қиылысуы ${n(low)}–${n(high)}. Екі шетті қоса есептегенде ${n(high)} − ${n(low)} + 1 = ${n(answer)} сан.`,['rounding interval intersected with the exact digit-length interval']);
  },
  'grade4-rounded-digit-sum-count':p=>{
    const [low,high]=interval(p.target,p.unit),values=range(low,high,x=>[...String(x)].reduce((s,d)=>s+Number(d),0)===p.sum);assert(values.length>0&&values.length<=20);
    return output(values.length,`${names[p.unit]} дейін дөңгелектегенде ${n(p.target)} шығатын және цифрларының қосындысы ${p.sum} болатын натурал сандар нешеу?`,`Толық тексерілетін аралық: ${n(low)}–${n(high)}. Цифрларының қосындысы ${p.sum} болатын сандар: ${values.map(n).join(', ')}. Барлығы ${values.length} сан.`,['every rounded candidate checked for its actual decimal digit sum']);
  },
  'grade4-rounded-distinct-maximum':p=>{
    const [low,high]=interval(p.target,p.unit),values=range(low,high,x=>String(x).length===p.digits&&new Set(String(x)).size===p.digits),a=Math.max(...values);assert(Number.isFinite(a));
    return output(a,`${names[p.unit]} дейін дөңгелектегенде ${n(p.target)} шығатын, цифрлары әртүрлі ең үлкен ${p.digits} таңбалы санды табыңдар.`,`Дөңгелектеу аралығы ${n(low)}–${n(high)}. Осы аралықты үлкеннен кішіге қарай тексергенде, цифрлары қайталанбайтын алғашқы сан — ${n(a)}. Оның барлық ${p.digits} цифры әртүрлі және ол ${n(p.target)} санына дөңгелектеледі.`,['full rounded interval checked for digit uniqueness and maximum']);
  },
  'grade4-rounded-neighbour-gap':p=>{
    const first=halfUp(p.first,p.unit),second=halfUp(p.second,p.unit);assert(second>first);
    return output(second-first,`${n(p.first)} және ${n(p.second)} сандарының әрқайсысын ${names[p.unit]} дейін дөңгелектеді. Дөңгелектелген екі санның үлкенінен кішісін азайтыңдар.`,`${n(p.first)} → ${n(first)}, ${n(p.second)} → ${n(second)}. Сұралған айырма ${n(second)} − ${n(first)} = ${n(second-first)}. Бастапқы сандардың айырмасын алуға болмайды.`,['both rounding outcomes computed before taking the gap']);
  },
  'grade4-rounded-multiple-count':p=>{
    const [low,high]=interval(p.target,p.unit),values=range(low,high,x=>x%p.divisor===0);
    return output(values.length,`${names[p.unit]} дейін дөңгелектегенде ${n(p.target)} шығатын және ${p.divisor} санына қалдықсыз бөлінетін натурал сандар нешеу?`,`Дөңгелектеу аралығы ${n(low)}–${n(high)}. Осы аралықтағы ${p.divisor} еселіктері: ${values.map(n).join(', ')}. Барлығы ${values.length} сан.`,['divisibility applied only after both rounding endpoints are fixed']);
  },
  'grade4-two-rounding-choice':p=>{
    const matches=p.candidates.filter(x=>halfUp(x,p.firstUnit)===p.firstTarget&&halfUp(x,p.secondUnit)===p.secondTarget);assert.equal(matches.length,1);
    return output(matches[0],`Санды ${names[p.firstUnit]} дейін дөңгелектегенде ${n(p.firstTarget)}, ал ${names[p.secondUnit]} дейін дөңгелектегенде ${n(p.secondTarget)} шығады. Осы екі шартқа сай нұсқаны таңдаңдар.`,`Нұсқалардың екі нәтижесі: ${p.candidates.map(x=>`${n(x)} → ${n(halfUp(x,p.firstUnit))} және ${n(halfUp(x,p.secondUnit))}`).join('; ')}. Екі шартқа да тек ${n(matches[0])} сай.`,['all choices checked against both rounding conditions'],p.candidates.map(String));
  },
};
export function renderEdition(row){assert(row.grade===4&&models[row.modelId]);return models[row.modelId](row.params);}
export function verifyEdition(row){
  const rendered=renderEdition(row);for(const key of ['answer','statement','solution'])assert.equal(row[key],rendered[key],`${row.editionId}: ${key} not bound to authored rounding givens`);
  assert.deepEqual(row.options,rendered.options);assert(row.sourceRefs?.length===1&&row.adaptationChanges?.length>=2);
  return {answer:rendered.answer,checks:['explicit positive-integer half-up convention','exact native condition/solution/options binding',...rendered.checks]};
}
