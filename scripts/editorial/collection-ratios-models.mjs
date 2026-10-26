import assert from 'node:assert/strict';
const positive=(...xs)=>xs.forEach(x=>assert(Number.isSafeInteger(x)&&x>0,'Positive safe integer required'));
const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a;};
const exact=(a,b)=>{positive(a,b);assert.equal(a%b,0,'Integral target required');return a/b;};
const ratio=(a,b)=>{positive(a,b);const g=gcd(a,b);return `${a/g} : ${b/g}`;};
const fraction=(a,b)=>{positive(a,b);const g=gcd(a,b);return `(${a/g}/${b/g})`;};
const decimal=s=>{assert(typeof s==='string'&&/^\d+\.\d+$/.test(s));const [a,b]=s.split('.');return{n:Number(a+b),d:10**b.length};};
const comma=s=>String(s).replace('.',',');
const open=(statement,n,solution)=>{positive(n);return{statement:statement+' Жауапқа тек санды жазыңыз.',answer:String(n),solution};};
const choice=(statement,options,index,solution)=>{options=options.map(String);assert.equal(options.length,4);assert.equal(new Set(options).size,4,'Distinct options required');assert(index>=0&&index<4);return{statement,options,answer:options[index],solution};};
const required={
 'integer-ratio':['a','b'],'ordered-parts':['a','b'],'larger-share':['total','a','b'],'decimal-ratio':['a','b'],'known-first-share':['a','b','first'],'difference-smaller':['a','b','gap'],'metres-centimetres':['metres','centimetres'],'largest-triangle-angle':['a','b','c'],'recipe-known-second':['a','b','second'],'proportion-first-term':['denominator','first','second'],'segment-first-part':['total','a','b'],'hours-minutes':['hours','minutes'],'middle-of-three-shares':['total','a','b','c'],'future-age-ratio':['adult','child','years'],'rectangle-perimeter-to-area':['a','b','perimeter'],
 'fractional-ratio':['an','ad','bn','bd'],'unequal-decimal-places':['a','b'],'second-colour-share':['total','a','b'],'sum-larger-number':['total','a','b'],'align-middle-three-ratio':['a','b','b2','c'],'mixture-gap-to-total':['a','b','gap'],'square-area-ratio':['a','b'],'read-part-of-book':['total','a','b'],'add-only-first-group':['total','a','b','added'],'known-first-to-total-money':['a','b','first'],'shortest-triangle-side':['a','b','c','perimeter'],'sum-to-second-symbolic':['a','b'],'constant-unit-price':['firstKg','firstCost','targetKg'],'equal-addition-changes-ratio':['a','b','added','nextA','nextB'],'group-gap-to-total':['a','b','gap'],
 'chain-to-outer-ratio':['a','b','b2','c'],'three-ratio-range-sum':['a','b','c','gap'],'first-spending-equalizes':['a','b','spent'],'first-to-whole-fraction':['a','b'],'remove-first-equalizes':['a','b','removed'],'add-first-component-alloy':['total','a','b','targetA','targetB'],'weighted-linear-ratio':['a','b','leftX','leftY','rightX','rightY'],'rectangle-area-to-perimeter':['a','b','area'],'age-ratio-two-times':['a','b','years','nextA','nextB'],'fixed-work-inverse-worker-count':['firstWorkers','firstDays','nextWorkers'],'smallest-circle-arc':['a','b','c'],'girls-leave-changes-ratio':['a','b','left','nextA','nextB'],'add-to-smaller-equalizes':['a','b','added'],'triangle-angle-classification':['a','b','c'],'drink-litre-to-millilitre-share':['a','b','litres'],
};
export function renderEdition(row){
 const p=row.params,k=row.skillFamily;assert(required[k],`Unknown ratio skill ${k}`);assert.deepEqual(Object.keys(p).sort(),required[k].toSorted());
 for(const key of required[k])if(typeof p[key]==='number')positive(p[key]);else decimal(p[key]);
 let g,u,n,a,b,c,s,left,right,first,second,total;
 switch(k){
 case'integer-ratio':
  assert(p.b>p.a);g=gcd(p.a,p.b);assert(g>1);a=p.a/g;b=p.b/g;
  return choice(`Екі мүшені бірдей санға бөліп, ${p.a} : ${p.b} қатынасын ең қарапайым түрге келтіріңіз.`,[`${b} : ${a}`,`${a} : ${b}`,`${a} : ${a+b}`,`${b} : ${a+b}`],1,`Ең үлкен ортақ бөлгіш ${g}. Екі мүшені де соған бөлеміз: ${p.a} : ${g} = ${a}, ${p.b} : ${g} = ${b}. Қысқарған қатынас ${a} : ${b}. Ретін ауыстырсақ кері қатынас шығады, ал қосындыны алу басқа қатынас береді.`);
 case'ordered-parts':
  assert(p.b>p.a);g=gcd(p.a,p.b);a=p.a/g;b=p.b/g;
  return choice(`Шеберханада ${p.a} жасыл және ${p.b} сары қағаз парағы бар. ЖАСЫЛ парақтар санының САРЫ парақтар санына қатынасын таңдаңыз.`,[`${b} : ${a}`,`${a} : ${a+b}`,`${a} : ${b}`,`${b} : ${a+b}`],2,`Сұралған рет — жасыл, содан кейін сары: ${p.a} : ${p.b}. Екі санды ${g} санына бөлсек ${a} : ${b} болады. Барлық парақ ${p.a+p.b}, бірақ бұл есепте бір бөлікті барлық санмен емес, екінші бөлікпен салыстырамыз.`);
 case'larger-share':
  assert(p.b>p.a);u=exact(p.total,p.a+p.b);n=p.b*u;
  return open(`Екі көрме сөресіне ${p.total} кәдесыйды ${p.a} : ${p.b} қатынасымен бөлді. Көбірек кәдесый қойылған сөреде нешеу бар?`,n,`Барлық үлес ${p.a} + ${p.b} = ${p.a+p.b}. Бір үлес ${p.total} : ${p.a+p.b} = ${u}. Үлкен бөлік ${p.b} × ${u} = ${n}, кіші бөлік ${p.a*u}. Тексеру: ${p.a*u} + ${n} = ${p.total}.`);
 case'decimal-ratio':case'unequal-decimal-places':{
  const x=decimal(p.a),y=decimal(p.b),scale=Math.max(x.d,y.d);assert(y.n/y.d>x.n/x.d||k==='unequal-decimal-places');a=x.n*(scale/x.d);b=y.n*(scale/y.d);g=gcd(a,b);assert(g>1);if(k==='unequal-decimal-places')assert.notEqual(x.d,y.d);else assert.equal(x.d,y.d);const ans=ratio(a,b),inv=ratio(b,a);
  const opts=k==='decimal-ratio'?[ans,inv,ratio(a,a+b),ratio(b,a+b)]:[inv,ratio(a,b*10),ratio(a*10,b),ans];
  return choice(`${comma(p.a)} : ${comma(p.b)} ондық сандар қатынасын бүтін, өзара жай мүшелер арқылы жазыңыз.`,opts,k==='decimal-ratio'?0:3,`Екі санды да бірдей ${scale} санына көбейтеміз: ${a} : ${b}. Енді екі мүшені ${g} санына бөліп, ${ans} аламыз. Қатынастың бір мүшесін ғана басқа дәрежедегі онға көбейту оның мәнін өзгертеді. Тексеру үшін қысқарған екі мүшені ${g} санына көбейткенде ${a} және ${b} шығады.`);
 }
 case'known-first-share':
  u=exact(p.first,p.a);n=p.b*u;
  return open(`Роботтехника тобында үлкен және кіші өлшемді бөлшектер саны ${p.a} : ${p.b} қатынасындай. Үлкен өлшемді бөлшек ${p.first} дана болса, кіші өлшемді бөлшек неше дана?`,n,`Бір үлес ${p.first} : ${p.a} = ${u} бөлшек. Екінші топ ${p.b} үлес: ${p.b} × ${u} = ${n}. Тексеру: ${p.first} : ${n} = ${p.a} : ${p.b}.`);
 case'difference-smaller':
  assert(p.b>p.a);u=exact(p.gap,p.b-p.a);n=p.a*u;
  return open(`Екі санның қатынасы ${p.a} : ${p.b}. Үлкен сан кішісінен ${p.gap} артық. КІШІ санды табыңыз.`,n,`Айырма ${p.b} − ${p.a} = ${p.b-p.a} үлеске сәйкес. Бір үлес ${p.gap} : ${p.b-p.a} = ${u}. Кіші сан ${p.a} × ${u} = ${n}; үлкені ${p.b*u}. Тексеру: ${p.b*u} − ${n} = ${p.gap}.`);
 case'metres-centimetres':
  a=p.metres*100;b=p.centimetres;assert(a>b&&a%b===0);n=a/b;
  return choice(`Ұзындығы ${p.metres} м жіп пен ${p.centimetres} см таспаның ұзындықтарын дәл осы ретпен салыстырыңыз. Қысқарған қатынас қайсы?`,['1 : '+n,`${p.metres} : ${p.centimetres}`,`${p.centimetres} : ${p.metres}`,`${n} : 1`],3,`Алдымен бірлік ортақ болуы керек: ${p.metres} м = ${a} см. Сондықтан ${a} : ${b} қатынасын ${b} санына бөлеміз де, ${n} : 1 аламыз. Метр мен сантиметр сандарын бірден салыстыруға болмайды.`);
 case'largest-triangle-angle':
  assert(p.a<p.b&&p.b<p.c);u=exact(180,p.a+p.b+p.c);n=u*p.c;
  return open(`Үшбұрыштың ішкі бұрыштары ${p.a} : ${p.b} : ${p.c} қатынасында. Ең үлкен бұрыштың градустық өлшемін табыңыз.`,n,`Үшбұрыш бұрыштарының қосындысы 180°. Үлес саны ${p.a} + ${p.b} + ${p.c} = ${p.a+p.b+p.c}. Бір үлес 180 : ${p.a+p.b+p.c} = ${u}°. Бұрыштар ${u*p.a}°, ${u*p.b}°, ${n}°; ең үлкені ${n}°. Олардың қосындысы 180°.`);
 case'recipe-known-second':
  u=exact(p.second,p.b);n=u*p.a;
  return open(`Құрғақ қоспада тұз бен күріш массалары ${p.a} : ${p.b} қатынасында. Күріштің массасы ${p.second} г. Осы рецептке неше грамм тұз қажет?`,n,`Күріштің ${p.b} үлесі ${p.second} г, сондықтан бір үлес ${p.second} : ${p.b} = ${u} г. Тұз ${p.a} үлес: ${p.a} × ${u} = ${n} г. Тұз массасын толық қоспа массасымен шатастырмаймыз.`);
 case'proportion-first-term':
  n=exact(p.denominator*p.first,p.second);
  return open(`Пропорциядағы белгісіз бірінші мүшені есептеңіз: x : ${p.denominator} = ${p.first} : ${p.second}.`,n,`Айқыш көбейтсек ${p.second} × x = ${p.denominator} × ${p.first} = ${p.denominator*p.first}. Екі жағын ${p.second} санына бөліп, x = ${n} аламыз. Тексеру: ${n} × ${p.second} = ${p.denominator*p.first}.`);
 case'segment-first-part':
  u=exact(p.total,p.a+p.b);n=u*p.a;
  return open(`Ұзындығы ${p.total} см PQ кесіндісінің ішінде R нүктесі жатыр. PR : RQ = ${p.a} : ${p.b}. PR бөлігінің ұзындығы неше сантиметр?`,n,`R кесіндінің ішінде болғандықтан PR + RQ = ${p.total} см. Барлық үлес ${p.a+p.b}, бір үлес ${p.total} : ${p.a+p.b} = ${u} см. PR = ${p.a} × ${u} = ${n} см. RQ = ${p.b*u} см; екі бөлік қосылса ${p.total} см.`);
 case'hours-minutes':
  a=p.hours*60;b=p.minutes;assert(a>b&&a%b===0);n=a/b;
  return choice(`Бір үйірме ${p.hours} сағат, қысқа үзіліс ${p.minutes} минутқа созылады. Үйірме уақытының үзіліс уақытына қысқарған қатынасын таңдаңыз.`,[`${n} : 1`,`${p.hours} : ${p.minutes}`,`1 : ${n}`,`${p.minutes} : ${p.hours}`],0,`${p.hours} сағат = ${a} минут. Екі уақытты ортақ минутпен жазсақ ${a} : ${p.minutes}. Екі мүшені ${p.minutes} санына бөліп, ${n} : 1 аламыз. 1 : ${n} — кері реттегі қатынас.`);
 case'middle-of-three-shares':
  u=exact(p.total,p.a+p.b+p.c);n=p.b*u;
  return open(`Үш сыныпқа ${p.total} дәптерді бірінші : екінші : үшінші ретімен ${p.a} : ${p.b} : ${p.c} қатынасында таратты. ЕКІНШІ сынып неше дәптер алады?`,n,`Барлық үлес ${p.a} + ${p.b} + ${p.c} = ${p.a+p.b+p.c}. Бір үлес ${p.total} : ${p.a+p.b+p.c} = ${u}. Екінші сыныпқа ${p.b} × ${u} = ${n} дәптер. Басқа бөліктер ${p.a*u} және ${p.c*u}; үшеуінің қосындысы ${p.total}.`);
 case'future-age-ratio':
  assert(p.adult>p.child);a=p.adult+p.years;b=p.child+p.years;g=gcd(a,b);assert(g>1);return choice(`Анасы қазір ${p.adult} жаста, қызы ${p.child} жаста. ${p.years} жылдан кейін анасының жасының қызының жасына қысқарған қатынасы қандай болады?`,[ratio(p.adult,p.child),ratio(a,p.child),ratio(a,b),ratio(p.adult,b)],2,`Екеуінің де жасы бірдей ${p.years} жылға өседі: анасы ${p.adult} + ${p.years} = ${a}, қызы ${p.child} + ${p.years} = ${b} жаста болады. ${a} : ${b} қатынасын ${g} санына қысқартсақ ${ratio(a,b)}. Бастапқы қатынасты сол күйі қалдыруға немесе біреуінің жасын ғана арттыруға болмайды.`);
 case'rectangle-perimeter-to-area':
  assert(p.b>p.a);s=exact(p.perimeter,2);u=exact(s,p.a+p.b);a=p.a*u;b=p.b*u;n=a*b;
  return open(`Тіктөртбұрыштың қысқа және ұзын қабырғалары ${p.a} : ${p.b} қатынасындай, ал периметрі ${p.perimeter} см. Ауданы неше см²?`,n,`Көршілес екі қабырғаның қосындысы ${p.perimeter} : 2 = ${s} см. Бір үлес ${s} : (${p.a} + ${p.b}) = ${u} см. Қабырғалар ${p.a} × ${u} = ${a} см және ${p.b} × ${u} = ${b} см. Аудан ${a} × ${b} = ${n} см². Тексеру: 2 × (${a} + ${b}) = ${p.perimeter} см.`);
 case'fractional-ratio':
  assert(p.an<p.ad&&p.bn<p.bd);a=p.an*p.bd;b=p.bn*p.ad;g=gcd(a,b);assert(g>1);return choice(`Бөлшек мүшелері бар (${p.an}/${p.ad}) : (${p.bn}/${p.bd}) қатынасын қысқартыңыз.`,[ratio(b,a),ratio(a,b),ratio(p.an*p.bn,p.ad*p.bd),ratio(p.an,p.bn)],1,`Бірінші бөлшекті екіншісіне бөлеміз: (${p.an}/${p.ad}) : (${p.bn}/${p.bd}) = ((${p.an} × ${p.bd})/(${p.ad} × ${p.bn})) = (${a}/${b}). Алым мен бөлімді ${g} санына қысқартқанда ${fraction(a,b)} шығады. Демек қатынас ${ratio(a,b)}. Бөлшектерді көбейту бөлудің орнына жүрмейді.`);
 case'second-colour-share':
  u=exact(p.total,p.a+p.b);n=p.b*u;
  return open(`Қорапта жасыл және күлгін моншақтар ғана бар. Олардың саны ${p.a} : ${p.b} қатынасында, барлығы ${p.total}. КҮЛГІН моншақ нешеу?`,n,`Жасыл мен күлгін бірге ${p.a+p.b} үлес. Бір үлес ${p.total} : ${p.a+p.b} = ${u}. Күлгіннің ${p.b} үлесі ${p.b} × ${u} = ${n}. Жасылы ${p.a*u}; қосындысы ${p.total}.`);
 case'sum-larger-number':
  assert(p.a>p.b);u=exact(p.total,p.a+p.b);n=p.a*u;
  return open(`Екі оң санның қосындысы ${p.total}, ал бірінші санның екіншіге қатынасы ${p.a} : ${p.b}. Үлкен санды есептеңіз.`,n,`Бірінші үлес ${p.a} үлкен болғандықтан үлкен сан бірінші орында. Үлестер қосындысы ${p.a+p.b}; бір үлес ${p.total} : ${p.a+p.b} = ${u}. Үлкен сан ${p.a} × ${u} = ${n}, кішісі ${p.b*u}. Қосынды ${n} + ${p.b*u} = ${p.total}.`);
 case'align-middle-three-ratio':
  a=p.a*p.b2;b=p.b*p.b2;c=p.c*p.b;g=gcd(gcd(a,b),c);assert.equal(g,1);return choice(`Оң a, b, c сандары үшін a : b = ${p.a} : ${p.b}, ал b : c = ${p.b2} : ${p.c}. a : b : c қатынасын бір қатарға келтіріңіз.`,[`${a} : ${b} : ${c}`,`${p.a} : ${p.b} : ${p.c}`,`${p.a} : ${b} : ${p.c}`,`${a} : ${p.b} : ${c}`],0,`Екі жазбадағы b бірдей болуы керек. Біріншісін ${p.b2} санына көбейтсек a : b = ${a} : ${b}. Екіншісін ${p.b} санына көбейтсек b : c = ${b} : ${c}. Сондықтан a : b : c = ${a} : ${b} : ${c}. Ортақ b мүшесін теңестірмей үш мүшені тіркей салуға болмайды.`);
 case'mixture-gap-to-total':
  assert(p.a>p.b);u=exact(p.gap,p.a-p.b);n=(p.a+p.b)*u;
  return open(`Жаңғақ пен кепкен жидек массалары ${p.a} : ${p.b} қатынасында. Жаңғақ жидектен ${p.gap} г ауыр. Қоспаның толық массасы неше грамм?`,n,`Масса айырмасы ${p.a} − ${p.b} = ${p.a-p.b} үлес. Бір үлес ${p.gap} : ${p.a-p.b} = ${u} г. Толық масса (${p.a} + ${p.b}) × ${u} = ${n} г. Жаңғақ ${p.a*u} г, жидек ${p.b*u} г; айырмасы ${p.gap} г.`);
 case'square-area-ratio':
  assert(p.b>p.a&&gcd(p.a,p.b)===1);return choice(`Екі шаршының қабырғаларының қатынасы ${p.a} : ${p.b}. Бірінші шаршы ауданының екіншісінің ауданына қатынасы қандай?`,[ratio(p.a,p.b),ratio(p.b*p.b,p.a*p.a),ratio(p.a*p.a,p.b*p.b),ratio(p.a**3,p.b**3)],2,`Шаршы ауданы қабырғаның квадратына тең. Бірдей ұзындық үлесін k десек, аудандар ${p.a*p.a}k² және ${p.b*p.b}k² болады. k² қысқарады, сондықтан қатынас ${ratio(p.a*p.a,p.b*p.b)}. Қабырға қатынасын сол күйі алу ауданның екінші дәрежесін ескермейді; кубтау көлемге қатысты.`);
 case'read-part-of-book':
  u=exact(p.total,p.a+p.b);n=p.a*u;
  return open(`Ернұрдың ${p.total} беттік кітабында оқылған беттердің оқылмаған беттерге қатынасы ${p.a} : ${p.b}. Ол неше бет оқыған?`,n,`Кітаптың барлық беті ${p.a+p.b} үлес. Бір үлес ${p.total} : ${p.a+p.b} = ${u} бет. Оқылған бет ${p.a} × ${u} = ${n}, оқылмағаны ${p.b*u}. Оқылған мен оқылмаған қосындысы ${p.total}.`);
 case'add-only-first-group':
  u=exact(p.total,p.a+p.b);a=p.a*u;b=p.b*u;left=a+p.added;assert.notEqual(left,b);return choice(`Үйірмедегі ${p.total} баланың ұлдар : қыздар қатынасы ${p.a} : ${p.b}. Үйірмеге тағы ${p.added} ұл қосылды, қыздар саны өзгермеді. Енді ұлдар санының қыздар санына қатынасы қандай?`,[ratio(p.a,p.b),ratio(left,b),ratio(p.a+p.added,p.b),'1 : 1'],1,`Бір үлес ${p.total} : (${p.a} + ${p.b}) = ${u}. Бастапқыда ұл ${a}, қыз ${b}. Тек ұлдар саны өседі: ${a} + ${p.added} = ${left}. Жаңа қатынас ${left} : ${b} = ${ratio(left,b)}. ${p.added} санын үлес коэффициентіне емес, нақты бала санына қосамыз.`);
 case'known-first-to-total-money':
  u=exact(p.first,p.a);n=(p.a+p.b)*u;
  return open(`Екі сыныптың жобаға жинаған ақшасы бірінші : екінші ретімен ${p.a} : ${p.b} қатынасында. Бірінші сынып ${p.first} теңге жинады. Екеуі бірге неше теңге жинаған?`,n,`Бір үлес ${p.first} : ${p.a} = ${u} теңге. Екінші жинақ ${p.b} × ${u} = ${p.b*u} теңге. Жалпы ${p.first} + ${p.b*u} = ${n} теңге. Белгілі бірінші бөлік толық ақша емес.`);
 case'shortest-triangle-side':
  assert(p.a<p.b&&p.b<p.c&&p.a+p.b>p.c);u=exact(p.perimeter,p.a+p.b+p.c);n=p.a*u;
  return open(`Үшбұрыш қабырғалары ${p.a} : ${p.b} : ${p.c} қатынасында. Периметрі ${p.perimeter} см болса, ең қысқа қабырғасы неше сантиметр?`,n,`Үлес саны ${p.a+p.b+p.c}; бір үлес ${p.perimeter} : ${p.a+p.b+p.c} = ${u} см. Қабырғалар ${n}, ${p.b*u}, ${p.c*u} см. Ең қысқасы ${n} см. ${n} + ${p.b*u} > ${p.c*u} болғандықтан мұндай үшбұрыш бар, ал барлық қабырға қосындысы ${p.perimeter} см.`);
 case'sum-to-second-symbolic':
  return choice(`a және b — оң сандар, a : b = ${p.a} : ${p.b}. Қосындының екінші санға қатынасын, яғни (a + b) : b мәнін таңдаңыз.`,[ratio(p.a+p.b,p.b),ratio(p.a,p.a+p.b),ratio(p.b,p.a+p.b),ratio(p.a+p.b,p.a)],0,`a = ${p.a}k, b = ${p.b}k, мұнда k > 0. Қосынды (${p.a} + ${p.b})k = ${p.a+p.b}k. Оны b = ${p.b}k санымен салыстырсақ (${p.a+p.b}k) : (${p.b}k) = ${ratio(p.a+p.b,p.b)}. Бөлімде a емес, дәл b берілген.`);
 case'constant-unit-price':
  u=exact(p.firstCost,p.firstKg);n=u*p.targetKg;
  return open(`Бірдей бағамен сатылатын алмұрттың ${p.firstKg} килограмы ${p.firstCost} теңге тұрады. ${p.targetKg} килограмының құны неше теңге?`,n,`Килограмм бағасы ${p.firstCost} : ${p.firstKg} = ${u} теңге. Қажет құн ${u} × ${p.targetKg} = ${n} теңге. Масса неше есе артса, бірлік баға өзгермегенде толық құн да сонша есе артады.`);
 case'equal-addition-changes-ratio':
  assert(p.b>p.a);u=exact(p.added*(p.nextB-p.nextA),p.nextA*p.b-p.nextB*p.a);n=p.a*u;assert.equal((n+p.added)*p.nextB,(p.b*u+p.added)*p.nextA);
  return open(`Екі оң сан ${p.a} : ${p.b} қатынасында. ЕКЕУІНЕ ДЕ ${p.added} қосқанда олардың қатынасы ${p.nextA} : ${p.nextB} болды. Бастапқы кіші санды табыңыз.`,n,`Бастапқы сандар ${p.a}k және ${p.b}k. Жаңа қатынас бойынша ${p.nextB} × (${p.a}k + ${p.added}) = ${p.nextA} × (${p.b}k + ${p.added}). Ашсақ ${p.nextB*p.a}k + ${p.nextB*p.added} = ${p.nextA*p.b}k + ${p.nextA*p.added}. Сондықтан ${p.nextB*p.added-p.nextA*p.added} = ${p.nextA*p.b-p.nextB*p.a}k, k = ${u}. Кіші сан ${p.a} × ${u} = ${n}. Тексеру: ${n+p.added} : ${p.b*u+p.added} = ${p.nextA} : ${p.nextB}.`);
 case'group-gap-to-total':
  assert(p.b>p.a);u=exact(p.gap,p.b-p.a);n=(p.a+p.b)*u;
  return open(`Би тобының ұлдар : қыздар қатынасы ${p.a} : ${p.b}. Қыздар ұлдардан ${p.gap} адам көп. Топта барлығы неше бала бар?`,n,`Айырма ${p.b} − ${p.a} = ${p.b-p.a} үлеске тең. Бір үлес ${p.gap} : ${p.b-p.a} = ${u} бала. Барлық бала (${p.a} + ${p.b}) × ${u} = ${n}. Ұл ${p.a*u}, қыз ${p.b*u}; айырмасы ${p.gap}.`);
 case'chain-to-outer-ratio':
  a=p.a*p.b2;b=p.b*p.b2;c=p.c*p.b;assert(a!==c);return choice(`Оң сандар үшін a : b = ${p.a} : ${p.b} және b : c = ${p.b2} : ${p.c}. Тек шеткі a мен c сандарының қатынасын табыңыз.`,[ratio(p.a,p.c),ratio(p.a*p.c,p.b*p.b2),ratio(c,a),ratio(a,c)],3,`Ортақ b мүшесін ${b} үлеске келтіреміз: a : b = ${a} : ${b}, b : c = ${b} : ${c}. Сондықтан a : c = ${a} : ${c} = ${ratio(a,c)}. Алғашқы мен соңғы коэффициенттерді b мүшесін теңестірмей салыстыруға болмайды.`);
 case'three-ratio-range-sum':
  assert(p.a<p.b&&p.b<p.c);u=exact(p.gap,p.c-p.a);n=(p.a+p.b+p.c)*u;
  return open(`Үш сан ${p.a} : ${p.b} : ${p.c} қатынасымен берілген. Ең үлкені ең кішісінен ${p.gap} артық. Үш санның қосындысы қанша?`,n,`Шеткі сандар айырмасы ${p.c} − ${p.a} = ${p.c-p.a} үлес. Бір үлес ${p.gap} : ${p.c-p.a} = ${u}. Сандар ${p.a*u}, ${p.b*u}, ${p.c*u}; қосындысы ${n}. Тексеру: ${p.c*u} − ${p.a*u} = ${p.gap}.`);
 case'first-spending-equalizes':
  assert(p.a>p.b);u=exact(p.spent,p.a-p.b);n=p.a*u;
  return open(`Айша мен Даниярдың бастапқы ақшасы ${p.a} : ${p.b} қатынасында. Айша ${p.spent} теңгеге дәптер алғаннан кейін екеуінің ақшасы теңесті; Данияр ақша жұмсамады. Айшада БАСТАПҚЫДА неше теңге болды?`,n,`Айша жұмсаған ${p.spent} теңге бастапқы айырмаға тең. Айырма ${p.a-p.b} үлес, бір үлес ${p.spent} : ${p.a-p.b} = ${u} теңге. Айшаның бастапқы ақшасы ${p.a} × ${u} = ${n}. Соңында ${n} − ${p.spent} = ${p.b*u} теңге қалады; бұл Даниярдың өзгермеген ақшасына тең.`);
 case'first-to-whole-fraction':
  return choice(`Сыныпта ұлдар санының қыздар санына қатынасы ${p.a} : ${p.b}. Ұлдар барлық оқушы санының қандай бөлігін құрайды?`,[fraction(p.a,p.a+p.b),fraction(p.a,p.b),fraction(p.b,p.a+p.b),fraction(p.b-p.a,p.b)],0,`Барлық оқушы ${p.a} + ${p.b} = ${p.a+p.b} үлес. Ұлдарға ${p.a} үлес тиесілі, демек олардың барлыққа қатысты үлесі ${fraction(p.a,p.a+p.b)}. ${fraction(p.a,p.b)} бөлшегі ұлдарды барлық оқушымен емес, тек қыздармен салыстырады.`);
 case'remove-first-equalizes':
  assert(p.a>p.b);u=exact(p.removed,p.a-p.b);n=(p.a+p.b)*u;
  return open(`Қызыл және көк текшелер саны ${p.a} : ${p.b} қатынасында еді. Қызыл текшенің ${p.removed} данасын алып тастағанда екі түстің саны тең болды. Бастапқыда барлығы неше текше болған?`,n,`Алынған ${p.removed} текше бастапқы айырма, яғни ${p.a-p.b} үлес. Бір үлес ${p.removed} : ${p.a-p.b} = ${u}. Бастапқы толық сан (${p.a} + ${p.b}) × ${u} = ${n}. Қызыл ${p.a*u}, көк ${p.b*u}; қызылдан ${p.removed} алсақ ${p.b*u} қалады.`);
 case'add-first-component-alloy':
  u=exact(p.total,p.a+p.b);first=p.a*u;second=p.b*u;a=exact(second*p.targetA,p.targetB);n=a-first;positive(n);
  return open(`${p.total} г мыс-мырыш қорытпасында мыс : мырыш = ${p.a} : ${p.b}. Массаны жоғалтпай, ТЕК МЫС қосып, қатынасты ${p.targetA} : ${p.targetB} ету керек. Неше грамм мыс қосылады?`,n,`Бір үлес ${p.total} : (${p.a} + ${p.b}) = ${u} г. Бастапқы мыс ${first} г, мырыш ${second} г. Мырыш өзгермейді. Жаңа қатынаста мыс ${second} × ${p.targetA} : ${p.targetB} = ${a} г болуы керек. Қосылатын мыс ${a} − ${first} = ${n} г. Соңғы толық масса ${p.total+n} г; тексеру: ${a} : ${second} = ${p.targetA} : ${p.targetB}.`);
 case'weighted-linear-ratio':
  assert(p.a!==p.b);assert.equal(p.leftY,1);assert.equal(p.rightX,1);left=p.leftX*p.a+p.leftY*p.b;right=p.rightX*p.a+p.rightY*p.b;assert(left!==right);return choice(`x және y — оң сандар, x : y = ${p.a} : ${p.b}. (${p.leftX}x + y) : (x + ${p.rightY}y) қатынасын қысқартыңыз.`,[ratio(p.a+p.leftX,p.b+p.leftY),ratio(right,left),ratio(left,right),ratio(p.a,p.b)],2,`x = ${p.a}k, y = ${p.b}k деп аламыз, k > 0. Алымдағы өрнек ${p.leftX} × ${p.a}k + ${p.b}k = ${left}k. Екінші өрнек ${p.a}k + ${p.rightY} × ${p.b}k = ${right}k. Ортақ k қысқарады, қатынас ${ratio(left,right)}. Коэффициентті x пен y мәндерінің екеуіне бірдей қолданбаймыз.`);
 case'rectangle-area-to-perimeter':
  assert(p.a>p.b);s=exact(p.area,p.a*p.b);u=Math.sqrt(s);positive(u);a=p.a*u;b=p.b*u;n=2*(a+b);
  return open(`Тіктөртбұрыштың ұзындығы мен ені ${p.a} : ${p.b} қатынасында. Ауданы ${p.area} см². Периметрі неше сантиметр?`,n,`Қабырғалар ${p.a}k және ${p.b}k см болсын, k > 0. Аудан ${p.a*p.b}k² = ${p.area}; сондықтан k² = ${s}, k = ${u}. Ұзындығы ${a} см, ені ${b} см. Периметр 2 × (${a} + ${b}) = ${n} см. Тексеру: ${a} × ${b} = ${p.area} см².`);
 case'age-ratio-two-times':
  assert(p.a>p.b);u=exact(p.years*(p.nextA-p.nextB),p.nextB*p.a-p.nextA*p.b);a=p.a*u;b=p.b*u;assert(a-b>=18&&a<90);n=b;
  return open(`Әкесі мен ұлының қазіргі жастары ${p.a} : ${p.b} қатынасында. ${p.years} жылдан кейін олардың жастарының қатынасы ${p.nextA} : ${p.nextB} болады. Ұлы қазір неше жаста?`,n,`Қазіргі жастары ${p.a}k және ${p.b}k. Екеуіне де ${p.years} қосылады: ${p.nextB} × (${p.a}k + ${p.years}) = ${p.nextA} × (${p.b}k + ${p.years}). Осыдан ${p.nextB*p.a-p.nextA*p.b}k = ${p.years*(p.nextA-p.nextB)}, k = ${u}. Ұлы ${p.b} × ${u} = ${n} жаста, әкесі ${a} жаста. Кейінгі жастары ${a+p.years} және ${b+p.years}; қатынасы ${p.nextA} : ${p.nextB}.`);
 case'fixed-work-inverse-worker-count':
  assert(p.nextWorkers>p.firstWorkers);total=p.firstWorkers*p.firstDays;n=exact(total,p.nextWorkers);
  return open(`Өнімділігі бірдей ${p.firstWorkers} шебер тапсырысты ${p.firstDays} күнде орындайды. Сол тапсырысты дәл сондай қарқынмен ${p.nextWorkers} шебер бірге неше күнде бітіреді? Барлығы бір уақытта бастайды.`,n,`Тапсырысқа ${p.firstWorkers} × ${p.firstDays} = ${total} шебер-күн жұмыс керек. ${p.nextWorkers} шеберге уақыт ${total} : ${p.nextWorkers} = ${n} күн. Жұмыс көлемі өзгермегенде шебер саны артса, уақыт кемиді. Тексеру: ${p.nextWorkers} × ${n} = ${total}.`);
 case'smallest-circle-arc':
  assert(p.a<p.b&&p.b<p.c);u=exact(360,p.a+p.b+p.c);n=p.a*u;
  return open(`Шеңбер өзара қабаттаспайтын үш доғаға бөлінді. Доғалардың градустық өлшемдері ${p.a} : ${p.b} : ${p.c} қатынасында. Ең кіші доғаның градустық өлшемі қанша?`,n,`Толық шеңбер 360°. Барлық үлес ${p.a+p.b+p.c}; бір үлес 360 : ${p.a+p.b+p.c} = ${u}°. Ең кіші доға ${p.a} × ${u} = ${n}°. Қалғандары ${p.b*u}° және ${p.c*u}°; үшеуі 360° береді. Мұнда үшбұрыштағы 180° қосындысын қолданбаймыз.`);
 case'girls-leave-changes-ratio':
  u=exact(p.nextA*p.left,p.nextA*p.b-p.nextB*p.a);a=p.a*u;b=p.b*u;assert(b>p.left);n=a+b;
  return open(`Үйірмеде ұлдар : қыздар = ${p.a} : ${p.b}. ${p.left} қыз басқа топқа ауысқан соң ұлдар : қыздар қатынасы ${p.nextA} : ${p.nextB} болды. Ұлдар саны өзгермеді. Бастапқыда үйірмеде барлығы неше бала бар еді?`,n,`Бастапқы ұл ${p.a}k, қыз ${p.b}k. Жаңа қатынастан ${p.nextB} × ${p.a}k = ${p.nextA} × (${p.b}k − ${p.left}). Сондықтан ${p.nextA*p.b-p.nextB*p.a}k = ${p.nextA*p.left}, k = ${u}. Бастапқы сандар ${a} және ${b}; толық сан ${a} + ${b} = ${n}. Тексеру: ${a} : ${b-p.left} = ${p.nextA} : ${p.nextB}.`);
 case'add-to-smaller-equalizes':
  assert(p.b>p.a);u=exact(p.added,p.b-p.a);n=p.b*u;
  return open(`Екі сан ${p.a} : ${p.b} қатынасында. Тек кіші санға ${p.added} қосқанда ол үлкен санға тең болды. Бастапқы ҮЛКЕН санды табыңыз.`,n,`Қосылған ${p.added} бастапқы айырмаға тең. Бір үлес ${p.added} : (${p.b} − ${p.a}) = ${u}. Үлкен сан ${p.b} × ${u} = ${n}, кіші сан ${p.a*u}. Тексеру: ${p.a*u} + ${p.added} = ${n}.`);
 case'triangle-angle-classification':
  assert(p.a<p.b&&p.b<p.c&&p.c===p.a+p.b);u=exact(180,p.a+p.b+p.c);assert.equal(p.c*u,90);return choice(`Үшбұрыштың үш ішкі бұрышы ${p.a} : ${p.b} : ${p.c} қатынасында. Оны бұрыштары бойынша қалай жіктейміз?`,['Сүйір бұрышты','Тік бұрышты','Доғал бұрышты','Теңқабырғалы'],1,`Бір үлес 180 : (${p.a} + ${p.b} + ${p.c}) = ${u}°. Бұрыштар ${p.a*u}°, ${p.b*u}°, ${p.c*u}°. Бір бұрышы 90° болғандықтан үшбұрыш тік бұрышты. Үш бұрышы бірдей емес, сондықтан теңқабырғалы емес; доғал бұрыш та жоқ.`);
 case'drink-litre-to-millilitre-share':{
  const d=decimal(p.litres);total=exact(d.n*1000,d.d);u=exact(total,p.a+p.b);n=p.b*u;
  return open(`Жеміс сусынының су : шырын көлемдері ${p.a} : ${p.b} қатынасында. Дайын сусын ${comma(p.litres)} л. Қоспада неше миллилитр шырын бар? Көлемдер қосылады деп есептеңіз.`,n,`Алдымен толық көлемді ауыстырамыз: ${comma(p.litres)} л = ${total} мл. Барлық үлес ${p.a+p.b}; бір үлес ${total} : ${p.a+p.b} = ${u} мл. Шырын ${p.b} × ${u} = ${n} мл, су ${p.a*u} мл. Қосындысы ${total} мл. Сұралғаны судың емес, шырынның көлемі.`);
 }
 default:throw Error(k);
 }
}
export function verifyEdition(row){assert.equal(row.grade,6);assert.equal(row.minimumPlan,'pro');const expected=renderEdition(row);for(const f of['statement','answer','solution','options'])assert.deepEqual(row[f],expected[f],`Changed ${f}`);assert(!/[\\$]|undefined|NaN|<\/?(?:script|img|svg)/i.test(row.statement+row.solution));return{answer:expected.answer,checks:['all45_saved_collection_conditions_official_solutions_keys_and_choices_individually_read','canonical_collection_number_is_file_scoped_not_question_id','ordered_ratio_part_to_part_vs_part_to_whole_and_sum_gap_targets_preserved','exact_decimal_fraction_unit_normalization_and_common_middle_alignment','one_sided_change_vs_both_age_or_number_changes_with_positive_integral_domains','triangle180_circle360_square_area_scale_and_rectangle_root_steps_bound','complete_statement_solution_options_answer_bind_individual_params','draft_requires_external_independent_content_math_review_before_standard_release']};}
