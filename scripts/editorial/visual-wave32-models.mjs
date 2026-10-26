import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const kind = q => q.modelId.replace('visual-wave32-', '');
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
export const divisors = n => Array.from({length:n}, (_, i) => i + 1).filter(d => n % d === 0);
export const factorPairs = n => divisors(n).filter(d => d * d <= n).map(d => [d, n / d]);
export function toggledLamps(n) {
  const lit = Array(n + 1).fill(false);
  for (let pupil = 1; pupil <= n; pupil++) for (let lamp = pupil; lamp <= n; lamp += pupil) lit[lamp] = !lit[lamp];
  return Array.from({length:n}, (_, i) => i + 1).filter(i => lit[i]);
}
export function independentlyCalculate(q) {
  const p = q.params;
  for (const v of Object.values(p)) if (typeof v === 'number') assert.ok(Number.isSafeInteger(v) && v > 0, 'Positive integer parameter');
  let answer, checks;
  switch (kind(q)) {
    case 'pictured-divisor-choice': {
      const total = p.rows * p.columns, choices = q.options.map(Number);
      assert.ok(choices.every(n => Number.isSafeInteger(n) && n > 0));
      const good = choices.filter(n => total % n === 0);
      assert.equal(good.length, 1, 'One equal-distribution option');
      answer = String(good[0]); checks = {total, portions:total / good[0], remainders:choices.map(n => total % n)}; break;
    }
    case 'sealed-box-strict-maximum': {
      const eligible = Array.from({length:p.boxes + 1}, (_, n) => n * p.perBox).filter(n => n < p.limit);
      assert.ok(eligible.length > 1, 'At least one nonempty available selection');
      answer = String(eligible.at(-1)); checks = {eligible, boxesTaken:+answer / p.perBox, availableTotal:p.boxes * p.perBox}; break;
    }
    case 'first-multiple-ray': {
      assert.deepEqual(p.labels.map(r => r[0]), [2, 3, 4]);
      const candidates = p.labels.map(([index, value]) => value / index);
      assert.ok(candidates.every(n => Number.isInteger(n) && n > 0 && n === candidates[0]), 'Consistent positive first multiple');
      answer = String(candidates[0]); checks = {indexes:p.labels.map(r => r[0]), labelledValues:p.labels.map(r => r[1])}; break;
    }
    case 'largest-square-cut-count': {
      const common = divisors(p.length).filter(d => p.width % d === 0), side = common.at(-1);
      answer = String((p.length / side) * (p.width / side));
      checks = {common, side, along:p.length / side, across:p.width / side, wholeArea:p.length * p.width}; break;
    }
    case 'unordered-garden-factor-pairs': {
      const pairs = factorPairs(p.area); answer = String(pairs.length); checks = {pairs, includesSquare:pairs.some(([a,b]) => a === b)}; break;
    }
    case 'factor-difference-perimeter': {
      const pairs = factorPairs(p.area), good = pairs.filter(([a,b]) => b - a === p.difference);
      assert.equal(good.length, 1, 'Unique natural side pair');
      const [short, long] = good[0]; answer = String(2 * (short + long)); checks = {pairs, short, long, difference:long - short}; break;
    }
    case 'divisor-parity-lamps': {
      assert.equal(p.rows * p.columns, p.lamps, 'Every initial lamp is explicitly drawn');
      const lit = toggledLamps(p.lamps), oddDivisors = Array.from({length:p.lamps}, (_, i) => i + 1).filter(n => divisors(n).length % 2 === 1);
      assert.deepEqual(lit, oddDivisors);
      assert.ok(lit.every(n => Number.isInteger(Math.sqrt(n))));
      answer = String(lit.length); checks = {lit, nextSquare:(lit.length + 1) ** 2, allInitiallyOff:true}; break;
    }
    default: throw Error('Known visual divisor skill');
  }
  return {answer, checks};
}
function core(q) {
  const p = q.params;
  switch (kind(q)) {
    case 'pictured-divisor-choice': return 'Суреттегі алмалардың бәрін достарға бірдей мөлшерде, қалдықсыз бөліп беру керек. Берілген нұсқалардың ішінен бұл алмаларды неше досқа тең бөліп беруге болатынын таңдаңыз.';
    case 'sealed-box-strict-maximum': return 'Суретте бар қораптардың әрқайсысында үстіне жазылғандай қарындаш бар. Қорапты ашуға болмайды, тек бүтін қораптар алынады. Осы қораптардан '+p.limit+' қарындаштан қатаң аз болатын ең көп неше қарындаш алуға болады?';
    case 'first-multiple-ray': return 'Координаталық сәуледе 0-ден бастап бірдей аралықпен x санының бірінші, екінші, үшінші және төртінші оң еселіктері берілген. Бірінші еселіктің мәні x деп белгіленген. x санын табыңыз.';
    case 'largest-square-cut-count': return 'Өлшемдері суретте көрсетілген қағазды қалдық қалдырмай бірдей шаршыларға бөледі. Шаршы қабырғасы сантиметрмен натурал сан және мүмкіндігінше ең үлкен болуы керек. Барлығы неше шаршы шығады?';
    case 'unordered-garden-factor-pairs': return 'Ауданы суретте берілген бақшаның a және b қабырғалары метрмен натурал сандар. Қабырғаларының орнын ауыстырғанда бірдей өлшемдегі бақша шығады деп есептейміз. Шаршы да есепке кіреді. Неше түрлі өлшем жұбы болуы мүмкін? Сызба масштабсыз.';
    case 'factor-difference-perimeter': return 'Сызбада тіктөртбұрыштың ауданы мен қабырғалары белгіленген. x — натурал сан, сызба масштабсыз. Периметрі неше сантиметр екенін таңдаңыз.';
    case 'divisor-parity-lamps': return 'Суретте 1-ден '+p.lamps+'-ге дейін нөмірленген '+p.lamps+' шам бар, бастапқыда бәрі сөніп тұр. '+p.lamps+' оқушы кезекпен әрекет етеді: k-нөмірлі оқушы нөмірі k санына еселік барлық шамның күйін бір рет ауыстырады. Яғни жанған шамды сөндіреді, сөнгенін жағады. Бірінші оқушыдан '+p.lamps+'-нөмірлі оқушыға дейін осы ереже орындалған соң, неше шам жанып тұрады?';
    default: throw Error('Known condition');
  }
}
export const statementFor = q => core(q) + (q.options ? '' : ' Жауапқа тек санды жазыңыз.');
export function solutionFor(q) {
  const p=q.params, r=independentlyCalculate(q), c=r.checks;
  switch (kind(q)) {
    case 'pictured-divisor-choice': return 'Алмалар '+p.rows+' қатарда, әр қатарда '+p.columns+' алмадан: '+p.rows+' × '+p.columns+' = '+c.total+'. Достар саны осы санның бөлгіші болуы керек. Нұсқаларға бөлгендегі қалдықтар: '+q.options.map((n,i) => c.total+' : '+n+' — қалдық '+c.remainders[i]).join('; ')+'. Тек '+r.answer+' досқа бөлгенде қалдық жоқ, әрқайсысына '+c.portions+' алмадан тиеді.';
    case 'sealed-box-strict-maximum': return 'Барлығы '+p.boxes+' қорап бар, әрқайсысында '+p.perBox+' қарындаш. Алынатын сан '+p.perBox+' санына еселік әрі '+c.availableTotal+' санынан аспайды. '+p.limit+' санынан аз қолжетімді сандар: '+c.eligible.join(', ')+'. Ең үлкені '+r.answer+' = '+c.boxesTaken+' × '+p.perBox+'. Келесі '+(+r.answer+p.perBox)+' саны '+p.limit+' шегінен қатаң аз емес, сондықтан жарамайды. '+c.boxesTaken+' қорап қолжетімді '+p.boxes+' қораптан аспайды.';
    case 'first-multiple-ray': return 'Екінші еселік '+p.labels[0][1]+' = 2 × x, сондықтан x = '+p.labels[0][1]+' : 2 = '+r.answer+'. Үшінші еселік: 3 × '+r.answer+' = '+p.labels[1][1]+', төртіншісі: 4 × '+r.answer+' = '+p.labels[2][1]+'. Көрші нүктелер арасындағы тұрақты айырма да '+r.answer+'. Екінші еселікті x-тің өзімен шатастырмаймыз.';
    case 'largest-square-cut-count': return 'Шаршының қабырғасы '+p.length+' және '+p.width+' сандарының ортақ бөлгіші болуы керек. Ортақ бөлгіштер: '+c.common.join(', ')+'. Ең үлкені '+c.side+' см. Ұзындық бойымен '+p.length+' : '+c.side+' = '+c.along+', ені бойымен '+p.width+' : '+c.side+' = '+c.across+' шаршы сыяды. Барлығы '+c.along+' × '+c.across+' = '+r.answer+'. Ауданды тексеру: '+r.answer+' × '+c.side+' × '+c.side+' = '+c.wholeArea+' см², бастапқы қағаз ауданына тең.';
    case 'unordered-garden-factor-pairs': return 'a × b = '+p.area+'. Қайталауды болдырмау үшін a ≤ b деп аламыз. Барлық жұп: '+c.pairs.map(([a,b]) => a+' × '+b).join('; ')+'. '+Math.sqrt(p.area)+' × '+Math.sqrt(p.area)+' шаршысы бір рет саналады. Қабырғаларды керісінше жазу жаңа бақша бермейді. Сондықтан '+r.answer+' түрлі өлшем жұбы бар.';
    case 'factor-difference-perimeter': return 'Қабырғалар '+p.area+' санының натурал көбейткіштер жұбы, ал айырмасы '+p.difference+'. Жұптар: '+c.pairs.map(([a,b]) => a+' × '+b).join('; ')+'. Айырмасы '+p.difference+' болатын жалғыз жұп — '+c.short+' және '+c.long+'. Тексеру: '+c.short+' × '+c.long+' = '+p.area+'. Периметр 2 × ('+c.short+' + '+c.long+') = '+r.answer+' см. Екі көрші қабырғаның қосындысы ғана толық периметр болмайды.';
    case 'divisor-parity-lamps': return 'n-нөмірлі шамды нөмірі n санының бөлгіші болатын оқушылар ауыстырады. Ол бастапқыда сөнгендіктен, тек ауыстыру саны тақ болса ғана соңында жанады. Бөлгіштер d және n : d болып жұптасады. Тек n толық квадрат болса, √n бөлгіші өзімен жұптасады да, бөлгіш саны тақ болады. '+p.lamps+' санынан аспайтын толық квадраттар: '+c.lit.join(', ')+'. Келесі квадрат '+(c.lit.length+1)+' × '+(c.lit.length+1)+' = '+c.nextSquare+' > '+p.lamps+'. Демек, '+r.answer+' шам жанады.';
    default: throw Error('Known solution');
  }
}
export function descriptionFor(q) {
  const p=q.params;
  switch (p.scene) {
    case 'apples': return p.rows+' қатар, әр қатарда '+p.columns+' алма. Әр алма бөлек салынған.';
    case 'boxes': return p.boxes+' жабық қорап, әрқайсысының үстінде '+p.perBox+' саны жазылған.';
    case 'ray': return 'Координаталық сәуледе бірдей аралықпен 0, x, '+p.labels.map(r => r[1]).join(', ')+' белгілері орналасқан. x — бірінші оң еселік.';
    case 'paper': return 'Қағаз тіктөртбұрыш: ұзындығы '+p.length+' см, ені '+p.width+' см. Ішкі бөлу сызықтары көрсетілмеген.';
    case 'garden': return 'Масштабсыз тіктөртбұрыштың қабырғалары a м және b м, ауданы '+p.area+' м². a мен b-ның нақты мәндері көрсетілмеген.';
    case 'factor-rectangle': return 'Масштабсыз тіктөртбұрыштың қабырғалары x см және x + '+p.difference+' см, ауданы '+p.area+' см². Қабырғалардың сандық шешімі көрсетілмеген.';
    case 'lamps': return p.rows+' қатарда '+p.columns+' шамнан, нөмірлері 1-ден '+p.lamps+'-ге дейін ретімен берілген. Барлығы бастапқы сөнген күйінде көрсетілген.';
    default: throw Error('Known diagram');
  }
}
export function svgFor(q) {
  const p=q.params, ink='#203549'; let b='';
  const text=(x,y,t,size=25,extra='') => '<text x="'+x+'" y="'+y+'" text-anchor="middle" fill="'+ink+'" font-size="'+size+'" '+extra+'>'+esc(t)+'</text>';
  const line=(a,z,extra='',color=ink,width=1.7) => '<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+z[0]+'" y2="'+z[1]+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
  if (p.scene==='apples') {
    const step=45, left=240-(p.columns-1)*step/2, top=72;
    for(let r=0;r<p.rows;r++) for(let c=0;c<p.columns;c++) {const x=left+c*step,y=top+r*step;b+='<g data-apple="'+r+','+c+'"><path d="M '+x+' '+(y-10)+' C '+(x-19)+' '+(y-24)+' '+(x-23)+' '+(y+9)+' '+(x-8)+' '+(y+17)+' Q '+x+' '+(y+22)+' '+(x+8)+' '+(y+17)+' C '+(x+23)+' '+(y+9)+' '+(x+19)+' '+(y-24)+' '+x+' '+(y-10)+' Z" fill="#ee7665" stroke="#a65049" stroke-width="1.3"/>'+line([x,y-11],[x+3,y-20],'','#77583b',2)+'<ellipse cx="'+(x+9)+'" cy="'+(y-18)+'" rx="7" ry="3.8" transform="rotate(-25 '+(x+9)+' '+(y-18)+')" fill="#68a87e"/></g>';}
  } else if (p.scene==='boxes') {
    for(let i=0;i<p.boxes;i++){const x=54+(i%4)*100,y=91+Math.floor(i/4)*133;b+='<g data-box="'+i+'"><rect x="'+x+'" y="'+y+'" width="73" height="76" rx="5" fill="#f7dba5" stroke="#916c39" stroke-width="1.7"/>'+line([x,y+21],[x+73,y+21],'','#916c39')+line([x+36.5,y],[x+36.5,y+21],'','#916c39')+text(x+36.5,y+56,p.perBox,27)+'</g>';}
  } else if (p.scene==='ray') {
    const y=188,start=45,step=80;b+=line([start,y],[449,y])+line([449,y],[438,y-7])+line([449,y],[438,y+7]);
    for(let i=0;i<=4;i++){const x=start+i*step,label=i===0?'0':i===1?'x':p.labels.find(r=>r[0]===i)[1];b+=line([x,y-10],[x,y+10],'data-index="'+i+'"')+text(x,y+46,label,27);}
  } else if (['paper','garden','factor-rectangle'].includes(p.scene)) {
    const width=p.scene==='paper'?315:300,height=p.scene==='paper'?180:170,x=90,y=95;
    b+='<rect data-outer="rectangle" x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" rx="0" fill="#eff5ff" stroke="#315ce8" stroke-width="2.4"/>';
    if(p.scene==='paper')b+=text(x+width/2,y-24,p.length+' см',27)+text(45,y+height/2+8,p.width+' см',25);
    else {b+=text(x+width/2,y-24,p.scene==='garden'?'a м':'x + '+p.difference+' см',27)+text(45,y+height/2+8,p.scene==='garden'?'b м':'x см',25)+text(x+width/2,y+height/2+9,'S = '+p.area+(p.scene==='garden'?' м²':' см²'),27);}
  } else if(p.scene==='lamps') {
    for(let n=1;n<=p.lamps;n++){const x=37.5+((n-1)%p.columns)*45,y=20+Math.floor((n-1)/p.columns)*40;b+='<g data-lamp="'+n+'" data-initial="off"><circle cx="'+x+'" cy="'+y+'" r="8" fill="#e3e9f1" stroke="#76879b" stroke-width="1.5"/>'+line([x-3,y+8],[x+3,y+8],'','#76879b',2)+text(x,y+23,n,20)+'</g>';}
  } else throw Error('Known native scene');
  return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-labelledby="title desc"><title id="title">Бөлгіштер мен еселіктер</title><desc id="desc">'+esc(descriptionFor(q))+'</desc><rect width="480" height="360" rx="18" fill="#fff"/><g font-family="Arial,sans-serif" stroke-linecap="round" stroke-linejoin="round">'+b+'</g></svg>';
}
export function verifyEdition(q) {
  const r=independentlyCalculate(q);
  assert.equal(q.answer,r.answer,'Independent divisor visual target');
  assert.equal(q.statement,statementFor(q)); assert.equal(q.solution,solutionFor(q)); assert.equal(q.figureDescription,descriptionFor(q)); assert.equal(q.figureSha256,sha(svgFor(q)));
  if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(v=>v===r.answer).length,1);}
  return {answer:r.answer,checks:Object.entries(r.checks).map(([k,v])=>k+': '+JSON.stringify(v))};
}
