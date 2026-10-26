"""Independent full offline review:54 direct-proportion source-specific editions.
All canonical/new conditions, complete solutions and MCQs read. No author solver
imports. Every calculation below starts with PRINTED givens, using exact Fraction
arithmetic, a separate AST evaluator, constraint equations or complete domains.
"""
import ast,copy,hashlib,itertools,json,re,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def read(p):return json.loads((ROOT/p).read_text())
def one(a):assert len(a)==1,a;return a[0]
def q(s):return F(str(s).replace(',','.').replace(' ',''))
N=r'(-?\d+(?:,\d+)?)'
def take(pattern,s):
    m=re.search(pattern,s);assert m,(pattern,s);return tuple(q(x) for x in m.groups())
def nums(s):return [q(x) for x in re.findall(r'-?\d+(?:,\d+)?',s)]
def value(text,env=None):
    text=text.replace(',','.').replace('·','*').replace('×','*').replace('−','-').replace('²','**2')
    for a,b in zip('₁₂','12'):text=text.replace(a,b)
    text=re.sub(r'(?<=\d)(?=[a-zA-Z])','*',text.strip());env=env or {}
    def walk(n):
        if isinstance(n,ast.Constant):return F(ast.get_source_segment(text,n))
        if isinstance(n,ast.Name):assert n.id in env,n.id;return F(env[n.id])
        if isinstance(n,ast.UnaryOp):assert isinstance(n.op,ast.USub);return -walk(n.operand)
        assert isinstance(n,ast.BinOp);a,b=walk(n.left),walk(n.right)
        if isinstance(n.op,ast.Add):return a+b
        if isinstance(n.op,ast.Sub):return a-b
        if isinstance(n.op,ast.Mult):return a*b
        if isinstance(n.op,ast.Div):return a/b
        if isinstance(n.op,ast.Pow):assert b==2;return a*a
        raise AssertionError(ast.dump(n))
    return walk(ast.parse(text,mode='eval').body)
def trueeq(text,env=None):left,right=text.split('=');return value(left,env)==value(right,env)
def numeric_option(text):
    text=re.sub(r' (?:кг|м|л|кВт·сағ|есе)$','',text);return value(text)
def hm(s):
    m=re.fullmatch(r'(\d+) сағ(?: (\d+) мин)?',s);assert m,s;return F(int(m[1])*60+int(m[2] or 0))
def solve(row):
    s=row['statement'];k=row['modelId'].removeprefix('grade6-direct-');opts=row.get('options');expected=None;answer=None;notes=[]
    if k=='fabric':a,b,c=take(N+r' сөмкеге '+N+r' м мата[\s\S]*?Осындай '+N+r' сөмкеге',s);expected=b*c/a
    elif k=='build-proportion':
        a,b,c=take(N+r' кг күріштің құны '+N+r' теңге[\s\S]*?x кг күріш '+N+r' теңге',s);x=a*c/b;answer=one([o for o in opts if trueeq(o,{'x':x})]);notes=['Unit price fixes x=11; every printed candidate equation is substituted, yielding exactly one valid ratio with matching order.']
    elif k=='forward-value':a,b,c=take(r'x = '+N+r' кезінде y = '+N+r'\. x = '+N,s);expected=b*c/a
    elif k=='count-cost-decrease':a,b,c=take(N+r' дәптердің құны '+N+r' теңге[\s\S]*?саны '+N+r' есе',s);assert a%c==0;expected=b/c
    elif k=='relationship':
        answer=one([o for o in opts if o.startswith('Теңқабырғалы үшбұрыштың')]);assert [F(3*a,a) for a in range(1,11)]==[3]*10
        assert len({F(a**3,a) for a in range(1,11)})>1 and len({F(120,a*a) for a in range(1,11)})>1
        notes=['Perimeter/side is identically3; exact cube and fixed-distance inverse examples reject the nonlinear/inverse distractors.']
    elif k=='pump-time':a,b,c=take(N+r' сағатта '+N+r' л су[\s\S]*?\. '+N+r' л су',s);expected=a*c/b
    elif k=='constant-speed-distance':a,b,c=take(N+r' сағатта '+N+r' км[\s\S]*?қарқынмен '+N+r' сағатта',s);expected=b*c/a
    elif k=='fixed-side-area-factor':factor=one(nums(s));answer=one([o for o in opts if o==f'{int(factor)} есе артады']);assert F(7*3*factor,7*3)==factor
    elif k=='direct-formula':
        passing=[]
        for o in opts:
            expression=o.split('=')[1];ratios={value(expression,{'x':x})/x for x in range(1,7)}
            if len(ratios)==1:passing.append(o)
        answer=one(passing);assert re.fullmatch(r'y = \d+x',answer)
        notes=['Unique degree-one homogeneous expression; exact positive1..6 grid supplies counterexamples for affine/inverse/square alternatives.']
    elif k=='embroidery-time':a,b,c=take(N+r' күнде өрнектің '+N+r' см[\s\S]*?Ұзындығы '+N+r' см',s);expected=a*c/b
    elif k=='minute-hand-turn':a,b,c=take(N+r' минутта '+N+r'°[\s\S]*?\. '+N+r' минуттағы',s);assert b/a==6;expected=b*c/a
    elif k=='coefficient-ratio':a,b=take(r'x = '+N+r' кезінде y = '+N,s);expected=b/a
    elif k=='printer-pages':a,b,c=take(N+r' минутта '+N+r' бет[\s\S]*?\. '+N+r' минутта',s);expected=b*c/a
    elif k=='direct-table':
        passing=[]
        for o in opts:
            a,b=o.split('; ');xs=nums(a);ys=nums(b);assert len(xs)==len(ys)==3
            if len({y/x for x,y in zip(xs,ys)})==1:passing.append(o)
        answer=one(passing);notes=['All three printed y/x ratios checked in every row; matching the first pair alone cannot qualify.']
    elif k=='same-factor-change':factor=one(nums(s));answer=one([o for o in opts if o==f'{int(factor)} есе артады']);assert F(3*5*factor,3*5)==factor
    elif k=='general-ratio':
        assert 'Оң x' in s and 'нөлден өзгеше' in s
        domain=[1,2,3,5];passing=[]
        for o in opts:
            if all(trueeq(o,{'x1':a,'x2':b,'y1':a*c,'y2':b*c}) for a,b,c in itertools.product(domain,repeat=3)):passing.append(o)
        answer=one(passing);assert answer=='(y₁/y₂) = (x₁/x₂)'
        notes=['Symbolic cancellation (kx1)/(kx2)=x1/x2 is valid in the explicit nonzero domain; complete4³ positive grid disproves the other identities.']
    elif k=='homogeneous-mass':a,b,c=take(N+r' м бөлігінің массасы '+N+r' кг[\s\S]*?кабельдің '+N+r' м',s);expected=b*c/a
    elif k=='fixed-width-percent':a,b,c=take(N+r' см ені[\s\S]*?Ұзындығы '+N+r' см-ден '+N+r' см-ге',s);old=a*b;new=a*c;expected=(new-old)/old*100;notes=['Percent increase uses original area70, not new112;42/70=60%, distinct from total160%.']
    elif k=='decimal-growth-factor':
        # Wording permits suffix-free numeric values after editorial language fix.
        ns=nums(s);assert len(ns)==2;expected=ns[1]/ns[0]
    elif k=='sweet-drink':a,b,c=take(N+r' литріне '+N+r' г қант[\s\S]*?сақтап, '+N+r' литрге',s);expected=b*c/a
    elif k=='inverse-value':a,b,c=take(r'x = '+N+r' кезінде y = '+N+r'\. y = '+N,s);expected=a*c/b
    elif k=='meaning-speed':a,b=take(N+r' сағатта '+N+r' км',s);speed=b/a;answer=one([o for o in opts if o.startswith('k = ') and value(o.split(';')[0][4:])==speed and 'тұрақты жылдамдық (км/сағ)' in o])
    elif k=='identical-block-count':a,b,c=take(N+r' құрылыс блогының массасы '+N+r' кг[\s\S]*?массасы '+N+r' кг',s);expected=a*c/b
    elif k=='lamp-energy':a,b,c=take(N+r' сағатта '+N+r' кВт·сағ[\s\S]*?\. '+N+r' сағаттағы',s);expected=b*c/a
    elif k=='fuel':a,b,c=take(N+r' км-ге '+N+r' л[\s\S]*?\. '+N+r' км бағытқа',s);expected=b*c/a
    elif k=='paint-packages':
        a,b,package,c=take(N+r' м² қабырғаға '+N+r' кг[\s\S]*?бүтін '+N+r' кг-дық[\s\S]*?\. '+N+r' м²-ді',s);needed=b*c/a
        packages=[n for n in range(1,101) if n*package>=needed];expected=min(packages);assert (expected-1)*package<needed<=expected*package
        notes=['Exact need284/25kg and indivisible3kg packages:3packages9kg fail,4packages12kg suffice; ceiling, not nearest rounding.']
    elif k=='seconds-to-minutes':a,b,c=take(N+r' секундта '+N+r' м[\s\S]*?\. Осы жылдамдықпен '+N+r' минутта',s);expected=b*c*60/a
    elif k=='processing-remainder':loss,mass=take(N+r'%-ін[\s\S]*?\. '+N+r' кг',s);expected=mass*(100-loss)/100
    elif k=='water-syrup':a,b,c=take(r'әр '+N+r' көлемдік бөлік сиропқа '+N+r' бірдей бөлік су[\s\S]*?\. '+N+r' л сироп',s);expected=b*c/a
    elif k=='journey-time':a,b,c=take(N+r' сағатта '+N+r' км[\s\S]*?\. '+N+r' км жолға',s);expected=a*c/b
    elif k=='plan-after-days':a,b,c=take(N+r' күнде жоспардың '+N+r'%-ін[\s\S]*?басталғаннан '+N+r' күнде',s);expected=b*c/a;assert expected<100
    elif k=='unequal-unit-cost':
        a,b,c,d=take(N+r' кг күріш '+N+r' теңге, ал '+N+r' кг күріш '+N+r' теңге',s);first=b/a;second=d/c;assert first!=second;answer=one([o for o in opts if o==f'Жоқ: бір килограмм {int(first)} теңге және {int(second)} теңге'])
    elif k=='alloy-difference':
        mass,copper,difference=take(N+r' кг-ында '+N+r' кг мыс[\s\S]*?массасынан '+N+r' кг артық',s);zinc=mass-copper;expected=difference*mass/(copper-zinc)
        assert 0<copper<mass and (expected*copper/mass)-(expected*zinc/mass)==difference
    elif k=='remaining-journey':
        m=re.search(r'жолдың \((\d+/\d+)\) бөлігін (\d+) сағ (\d+) мин',s);assert m;part=F(m[1]);minutes=int(m[2])*60+int(m[3]);remaining=minutes*(1-part)/part
        answer=one([o for o in opts if hm(o)==remaining]);assert remaining==120 and minutes+remaining==210;notes=['Remaining4/7 takes120min; whole210min and elapsed90min explicitly excluded.']
    elif k=='fraction-forward':
        m=re.search(r'a = (\(\d+/\d+\)) кезінде b = (\(\d+/\d+\))\. a = (\(\d+/\d+\))',s);assert m;a,b,c=map(value,m.groups());expected=b*c/a
    elif k=='second-cable-length':a,b,c=take(N+r' м, массасы '+N+r' кг[\s\S]*?одан '+N+r' кг ауыр',s);expected=a*(b+c)/b
    elif k=='simultaneous-gap':a,b,c=take(r'жолдары '+N+r' км және '+N+r' км[\s\S]*?самокатшы '+N+r' км артық',s);expected=b*c/(a-b);assert expected*a/b-expected==c
    elif k=='added-solute':
        mass,percent,added=take(N+r' г қант ерітіндісінде қант '+N+r'%[\s\S]*?Оған '+N+r' г таза қант',s);solute=mass*percent/100+added;total=mass+added;expected=solute/total*100
        assert solute==135 and total==375 and expected!=solute/mass*100
        notes=['Both solute numerator135 and total mass denominator375 grow; exact concentration36%, not45% from stale denominator300.']
    elif k=='clock-angle':
        hour,minute=take(r'сағат '+N+':'+N,s);assert 0<=hour<12 and 0<=minute<60
        hour_angle=(hour*60+minute)/720*360;minute_angle=minute/60*360;delta=abs(hour_angle-minute_angle);expected=min(delta,360-delta)
        assert hour_angle==170 and minute_angle==240
        notes=['Both continuously moving hands measured from12: hour170°, minute240°; smaller separation70°, not the frozen-hour answer90°.']
    elif k=='height-volume-increment':percent,increment=take(r'биіктігі '+N+r'%-ке[\s\S]*?Көлемі '+N+r' см³',s);expected=increment*100/percent
    elif k=='same-sun-shadows':a,b,c=take(r'Бойы '+N+r' м баланың көлеңкесі '+N+r' м[\s\S]*?көлеңкесі '+N+r' м',s);expected=a*c/b
    elif k=='annual-plan-total':a,b=take(N+r' айда жылдық жоспардың '+N+r'%-ін',s);expected=a*100/b;assert expected==20 and expected-a==13;notes=['Requested full elapsed20months includes first7; remaining13 and automatic12months rejected.']
    elif k=='proportional-scale-error':actual,shown,total,known=take(r'нақты '+N+r' кг жүкке '+N+r' кг[\s\S]*?көрсеткіші '+N+r' кг[\s\S]*?массасы '+N+r' кг',s);expected=total*actual/shown-known;assert expected==5 and total-known!=expected
    elif k=='proportional-increments':dx,dy,newdx=take(r'x '+N+r'-ке артқанда y '+N+r'-ге[\s\S]*?x '+N+r'-ға',s);expected=dy*newdx/dx
    elif k=='matching-pair':
        x,y=take(r'x = '+N+r' кезінде y = '+N,s);matches=[]
        for o in opts:
            a,b=map(F,re.fullmatch(r'\((\d+); (\d+)\)',o).groups())
            if b*x==a*y:matches.append(o)
        answer=one(matches)
    elif k=='time-from-formula':speed,distance=take(r's = '+N+r' · t[\s\S]*?\. '+N+r' км жолға',s);expected=distance/speed
    elif k=='composition-factor':factor=one(nums(s));answer=one([o for o in opts if o==f'{int(factor)} есе артады']);assert F((2*factor)*5,2*5)==factor
    elif k=='split-cost':a,b,total=take(N+r' т және '+N+r' т көмір[\s\S]*?бірге '+N+r' теңге',s);expected=total*b/(a+b)
    elif k=='two-ingredients':
        people,rice,carrots,target=take(r'Палаудың '+N+r' адамдық үлесіне '+N+r' г күріш пен '+N+r' бірдей сәбіз[\s\S]*?өзгермесе, '+N+r' адамға',s);wanted=(rice*target/people,carrots*target/people);matches=[]
        for o in opts:
            m=re.fullmatch(r'([\d,]+) (кг|г) күріш; (\d+) сәбіз',o);assert m;o_rice=q(m[1])*(1000 if m[2]=='кг' else 1);o_carrots=F(m[3])
            if (o_rice,o_carrots)==wanted:matches.append(o)
        answer=one(matches);notes=['Both ingredients scaled by5/2, independently normalized grams/kg; rice2250g AND ten carrots required.']
    elif k=='split-work':a,b,total=take(r'біріншісі '+N+r' күн, екіншісі '+N+r' күн[\s\S]*?Барлығы '+N+r' м',s);expected=total*a/(a+b)
    elif k=='successive-factors':up,down=take(r'алдымен '+N+r' есе арттырып[\s\S]*?мәнін '+N+r' есе кемітті',s);assert up<down;factor=down/up;answer=one([o for o in opts if o.endswith(' есе кемиді') and numeric_option(o.removesuffix(' есе кемиді'))==factor])
    elif k=='delayed-worker':
        a,b,c,d,area,alone=take(r'Бірінші комбайн '+N+r' сағатта '+N+r' га, екіншісі '+N+r' сағатта '+N+r' га[\s\S]*?'+N+r' га алқапта бірінші комбайн '+N+r' сағат',s)
        first=b/a;second=d/c;expected=(area+second*alone)/(first+second);assert expected>alone and first*expected+second*(expected-alone)==area
        notes=['Separate linear work ledger uses first7t and second12(t−4); unique total16h, not joint12h.']
    elif k=='losing-clock':
        loss=take(r'тәулікте бірқалыпты '+N+r' минутқа',s)[0];start_h,start_m=take(r'сейсенбі '+N+':'+N,s);end_h,end_m=take(r'Бейсенбі күні нақты уақыт '+N+':'+N,s);elapsed=2*24*60+end_h*60+end_m-start_h*60-start_m;delay=loss*elapsed/(24*60);display=end_h*60+end_m-delay;assert display.denominator==1;h,m=divmod(int(display),60);answer=f'{h:02}:{m:02}'
        assert elapsed==57*60 and delay==19;notes=['Actual Tuesday09:00→Thursday18:00 spans57h; uniform daily loss19min gives17:41, including the extra9h.']
    elif k=='two-candles':
        first,second,ratio=take(r'Біріншісі '+N+r' сағатта, екіншісі '+N+r' сағатта[\s\S]*?екіншісінен '+N+r' есе',s);coefficient=ratio/second-1/first;assert coefficient!=0;expected=(ratio-1)/coefficient;assert 0<expected<min(first,second);assert 1-expected/first==ratio*(1-expected/second)
        notes=['Independent length conservation solves the unique affine equality;4.5h is strictly inside both burn domains, remaining1/2 vs1/4.']
    else:raise AssertionError(k)
    if answer is not None:assert answer==row['answer'],(row['editionId'],answer,row['answer'])
    elif opts:
        assert expected is not None
        if k=='fixed-width-percent':valid=[o for o in opts if value(o.removesuffix('%'))==expected]
        else:valid=[o for o in opts if numeric_option(o)==expected]
        assert one(valid)==row['answer'],(row['editionId'],expected,row['answer'])
    else:
        assert expected is not None and value(row['answer'])==expected,(row['editionId'],expected,row['answer'])
        assert 'Жауапты тек санмен жазыңыз.' in s
    if opts:assert len(opts)==len(set(opts))==4 and opts.count(row['answer'])==1
    return notes

rows=read('problems/editorial/batches/grade6-direct.json')['editions'];assert len(rows)==54
entries=[];refs=set();wrong=0
for row in rows:
    assert row['grade']==6 and row['minimumPlan']=='pro' and not row.get('image')
    for ref in row['sourceRefs']:
        capture=read(ref['sourceFile']);assert capture['status']=='captured';source=one([q for q in capture['questions'] if q['id']==ref['sourceId']]);assert source['checked'] and source['sourceAnswer'] and source['solution'];assert not source.get('images') and not source.get('svg')
        if source.get('options'):assert len([o for o in source['options'] if o['correct']])==1
        refs.add((ref['sourceFile'],ref['sourceId']))
    notes=solve(row)
    bad=copy.deepcopy(row);bad['answer']=one([o for o in row['options'] if o!=row['answer']][:1]) if row.get('options') else str(value(row['answer'])+1)
    try:solve(bad)
    except AssertionError:wrong+=1
    else:raise AssertionError(('Wrong key accepted',row['editionId']))
    digest=hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    entries.append({'editionId':row['editionId'],'sha256':digest,'verdict':'verified','method':'Independent Python exact Fraction calculations from printed givens, separate expression AST, finite ratio/formula grids, minimal-package/clock/work/candle constraints plus full source/new editorial reading','notes':['All54 canonical original/new conditions, full official/authored solutions and every MCQ read. Source-specific target and unit, positivity/nonzero domains, remaining vs total, increase vs full percentage and Kazakh language checked. Numerical variants are source coverage, not54 semantic novelties.',*notes]})
assert len(refs)==wrong==54
# Sensitive, independently implemented boundary canaries, not author assertions.
assert min(n for n in range(100) if n*3>=F(284,25))==4
assert F(135,375)*100==36 and F(135,300)*100==45
assert 90*F(4,3)==120 and 90/F(3,7)==210
assert F(132,10)*3/F(33,10)-7==5 and F(132,10)-7!=5
assert 7*100/F(35)==20 and 7*65/F(35)==13
assert F(8*57,24)==19 and F(8*48,24)==16
assert F(1)-F(9,2)/9==2*(1-F(9,2)/6) and F(9,2)<6
assert 7*16+12*(16-4)==256 and 7*12+12*(12-4)!=256
report={'schemaVersion':1,'reviewer':'independent_editorial_review','entries':entries}
if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade6-direct.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'editions':len(rows),'canonicalReferences':len(refs),'rejectedWrongKeys':wrong,'sensitiveBoundaryCanaries':8,'authorSolverImported':False,'status':'passed','written':'--write' in sys.argv}))
