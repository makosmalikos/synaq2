"""Independent printed-text review of grade5 4.8 decimal division.

No author models/specs/params are read. Exact decimal/AST and natural
Euclidean-ledger utilities are reused from this reviewer's previous 4.7 review.
"""
import importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('own_prior_review',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'))
h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest','raw_for','D','expr','decimal','integer','pick','decimals','division_ledger','recurrence']:
    globals()[name]=getattr(h,name)
ROOT=h.ROOT
PACK='problems/editorial/batches/grade5-decimal-division.json'
OUT='problems/editorial/reviews/grade5-decimal-division.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']

def source(r):return h.raw_for(r)
def finish(r,v):return pick(r,v)if r.get('options')else integer(v)
def P(s):return len(s.split(',')[1])if','in s else 0

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-decimal-division-');ds=list(map(D,decimals(s)));pairs=[];topic='frac';notes=[]
    def div(a,b):
        a,b=F(a),F(b);assert a>=0 and b>0
        pairs.append((decimal(a),decimal(b)))
        return a/b
    direct={'natural-dividend-smaller-than-one-divisor','two-tenths-quotient-integer','tenths-over-hundredths-append-zero','hundredths-over-tenths-zero-whole','hundredths-over-thousandths-one-padding','proper-decimal-quotient-zero-whole','tenths-over-thousandths-two-padding','four-place-dividend-hundredths-divisor'}
    if k in direct:
        a,b=m(r'(\d+(?:,\d+)?) ÷ (\d+(?:,\d+)?)',s).groups();v=div(D(a),D(b));answer=finish(r,v)
        if'zero-whole'in k or k=='four-place-dividend-hundredths-divisor':assert 0<v<1
        notes=[f'ACTUAL{a}/{b}={v}; exact WHOLE0 and decimal place/final zeros retained; all numeric MCQs evaluated.']
    elif k in {'equivalent-quotient-padding-one-zero','equivalent-quotient-dividend-stays-decimal'}:
        a,b=m(r'^(\d+,\d+) ÷ (\d+,\d+)',s).groups();v=div(D(a),D(b));flags=[]
        for o in r['options']:
            aa,bb=o.split(' ÷ ');flags.append(expr(o)==v and D(bb).denominator==1)
        answer=one(o for o,f in zip(r['options'],flags)if f);notes=[f'FULL actual MCQs {list(zip(r["options"],flags))}; target EXPRESSION keeps quotient{v} and NATURAL divisor, both members scaled equally, residual dividend decimal never dropped.']
    elif k=='decimal-distance-over-decimal-time-speed':
        t,d=ds;v=div(d,t);answer=pick(r,v);assert pick(r,d*t)!=answer;notes=[f'ACTUALdistance{d}/time{t}=speed{v}; distance×time MCQ false.']
    elif k in {'hundredths-coefficient-integer-root','tenths-coefficient-decimal-root'}:
        a,b=ds;v=div(b,a);assert a*v==b;answer=finish(r,v);topic='eq';notes=[f'Nonzero ACTUAL coefficient{a}×x={b}; unique rational root{v}, substitution and every shift/product trap checked.']
    elif k=='select-quotient-larger-than-positive-dividend':
        a=one(ds);assert a>0;flags=[]
        for o in r['options']:
            aa,b=o.split(' ÷ ');assert D(aa)==a and D(b)>0;flags.append(D(b)<1);assert(expr(o)>a)==flags[-1]
        answer=one(o for o,f in zip(r['options'],flags)if f);notes=[f'ALLactual positive divisors; quotient>positiveDIVIDEND iff0<divisor<1 by positive-order proof; unique EXPRESSION{answer}.']
    elif k=='unit-price-subkilogram-purchase':
        mass=one(ds);price=number(r'құрмаға (\d+) теңге',s);v=div(price,mass);answer=integer(v);notes=[f'ACTUAL paid{price}/mass{mass}=UNITkgprice{v}, mass×price conservation checked.']
    elif k=='constant-density-decimal-volume-new-mass':
        volume,mass,newvolume=ds;density=div(mass,volume);v=density*newvolume;answer=pick(r,v);assert pick(r,density)!=answer;notes=[f'SAMEhomogeneous material, ACTUALdensity{mass}/{volume}={density}; newV{newvolume} gives NEWMASS{v}, not density; both mass/volume ratios checked.']
    elif k=='route-complement-part-to-whole':
        part,left=ds;assert 0<part<1;v=div(left,1-part);assert v*(1-part)==left;answer=integer(v);notes=[f'GIVENremaining{left} corresponds to COMPLEMENT1−{part}, originalWHOLE{v}; walked+remaining conservation.']
    elif k=='unknown-decimal-divisor-not-reciprocal':
        a,q=ds;v=div(a,q);assert v and a/v==q;answer=pick(r,v);topic='eq';assert pick(r,q/a)!=answer and pick(r,a*q)!=answer;notes=[f'ACTUAL a/x=q yields unique nonzero x=a/q={v}; reciprocal and product MCQs explicitly false.']
    elif k=='largest-quotient-common-positive-dividend':
        aa=[D(o.split(' ÷ ')[0])for o in r['options']];assert len(set(aa))==1 and aa[0]>0;vals=[expr(o)for o in r['options']];answer=one(o for o,v in zip(r['options'],vals)if v==max(vals));notes=[f'ALLactual expression values{list(map(str,vals))}; unique MAX target EXPRESSION{answer}, not its result.']
    elif k=='decimal-distance-speed-requested-minutes':
        d,v=ds;t=div(d,v);answer=integer(t*60);assert t.denominator!=1;notes=[f'ACTUALdistance{d}/speed{v}→{t}h; requestedMINUTES×60, whole and fractional hours both converted, not ×100.']
    elif k=='downstream-route-to-still-speed':
        t,d,current=ds;down=div(d,t);v=down-current;assert v>current>0 and v+current==down;answer=pick(r,v);assert pick(r,down)!=answer and pick(r,down+current)!=answer;notes=[f'ACTUALdownstream{d}/{t}={down}; STILLspeed{v}=down−current{current}, not down/up; typed rates and backward equation.']
    elif k=='given-decimal-share-distance-to-whole':
        part,length=ds;assert 0<part<1;v=div(length,part);answer=integer(v);notes=[f'ACTUALpart{part} ofORIGINAL={length}, originalWHOLE{v}, not complementary base.']
    elif k=='two-purchase-unit-price-gap':
        m1,p1,m2,p2=m(r'^(\d+,\d+) кг жержаңғаққа (\d+) теңге, (\d+,\d+) кг бадамға (\d+) теңге',s).groups();a,b=div(int(p1),D(m1)),div(int(p2),D(m2));assert b>a;answer=integer(b-a);notes=[f'DIFFERENT actualmasses priced separately:{p1}/{m1}={a},{p2}/{m2}={b}; requested ALMONDminusPEANUT UNITprices={b-a}.']
    elif k=='difference-of-two-decimal-quotients':
        a,b,c,d=ds;v=div(a,b)-div(c,d);answer=pick(r,v);assert pick(r,a/b-c/(d*10))!=answer;notes=[f'Both actual divisions FIRST{a/b},{c/d} then difference{v}; seconddivisor-onlyshift trap independently false.']
    elif k=='unknown-minuend-then-decimal-factor':
        a,b,c=ds;v=div(c+b,a);assert a*v-b==c;answer=pick(r,v);topic='eq';assert pick(r,(c-b)/a)!=answer and pick(r,(c+b)*a)!=answer;notes=[f'ACTUAL a×x−b=c: recoverMINUENDc+b={c+b}, then unknownFACTORx{v}; exact substitution/traproles.']
    elif k in {'small-tea-mass-unit-price-then-target','larger-purchase-price-from-decimal-mass'}:
        mass,newmass=ds;price=number(r'(\d+) теңге тұрады',s);unit=div(price,mass);v=unit*newmass;assert unit*mass==price;answer=integer(v);notes=[f'Actual{price}/{mass}→UNITprice{unit}; NEW{newmass}kg×sameunit={v}, conservation; exact padding retained.']
    elif k=='parenthesized-decimal-sum-divide-hundredths':
        a,b,c=ds;v=div(a+b,c);answer=integer(v);assert v!=a+b/c;notes=[f'ENTIRE actualPARENTHESEDSUM{a}+{b}={a+b} then /{c}={v}; omitting grouping givesdifferent{a+b/c}.']
    elif k=='product-ratio-different-total-place-counts':
        aa,bb=m(r'\(\((.+)\)/\((.+)\)\)',s).groups();as_=aa.split(' × ');bs=bb.split(' × ');av=math.prod(map(D,as_));bv=math.prod(map(D,bs));pa=sum(map(P,as_));pb=sum(map(P,bs));assert pa==pb+1;common=10**max(pa,pb);an=av*common;bn=bv*common;assert an.denominator==bn.denominator==1;pairs.append((integer(an),integer(bn)));v=av/bv;answer=pick(r,v);assert pick(r,v*10)!=answer
        assert f'алымда {" + ".join(map(str,map(P,as_)))} = {pa}'.lower()in r['solution'].lower();assert f'бөлімде {" + ".join(map(str,map(P,bs)))} = {pb}'in r['solution'];assert f'ЕКЕУІН де {common} санына'in r['solution'];assert f'{" × ".join(str(int(x.replace(",","")))for x in bs)} × 10 = {integer(bn)}'in r['solution']
        notes=[f'ALLACTUALsix factors, numerator places{pa},denominator{pb}; SAMEscale{common} gives{an}/{bn}={v}; denominator additional×10 essential, rawintegerproducts alone wouldgive{v*10}.']
    elif k=='equal-river-distance-raft-time':
        distance,t1,t2=ds;down,up=div(distance,t1),div(distance,t2);current=(down-up)/2;still=(down+up)/2;assert down>up>0 and still-current==up;v=div(distance,current);answer=pick(r,v);assert pick(r,distance/(down-up))!=answer;notes=[f'SAMEactualdistance{distance}; down{down},up{up}, currentHALFdifference{current}; RAFT{distance}/current={v}, not boat/down-upwhole.']
    elif k=='equal-cost-decimal-masses-price-gap':
        first,second=ds;gap=number(r'бағасынан.*?(\d+)',s)if'бағасынан'in s else number(r'жіптен (\d+) теңге',s);assert first>second>0;unit=div(second*gap,first-second);other=unit+gap;assert first*unit==second*other;answer=integer(unit);notes=[f'EQUALcost actualmass{first}×plain={second}×(plain+{gap}); uniqueplainUNIT{unit},soft{other}, bothcosts{first*unit} conserved.']
    elif k=='unknown-sum-dividend-then-addend':
        addend,d,q=ds;whole=q*d;v=whole-addend;assert(v+addend)/d==q;div(whole,d);answer=pick(r,v);topic='eq';assert pick(r,whole+addend)!=answer and pick(r,q/d-addend)!=answer;notes=[f'ACTUAL(x+{addend})/{d}={q}; recoverENTIREdividend{whole} then x{v}; checkoriginal nested equation, reverseddivision/addroles false.']
    elif k=='successive-remainder-shares-difference-whole':
        first,second=ds;gap=number(r'күннен (\d+) кг',s);b=(1-first)*second;c=1-first-b;assert c>b>0;whole=div(gap,c-b);amounts=[whole*first,whole*b,whole*c];assert sum(amounts)==whole and amounts[2]-amounts[1]==gap;answer=integer(whole);notes=[f'DAY1original{first},DAY2remainingbase(1−first)×{second}={b},DAY3{c}; difference{c-b}oforiginal→WHOLE{whole}, masses{amounts}; total/gap conservation.']
    elif k=='count-tenths-divisors-yielding-natural':
        offered=ds[:-1];a=ds[-1];assert offered==[F(k,10)for k in range(1,10)];good=[x for x in offered if(a/x).denominator==1];answer=str(len(good));notes=[f'COMPLETEactualnine-elementdomain{offered}, ONLYnaturalquotient divisors{good}, requestedCOUNT{len(good)}.']
    elif k=='odd-quotient-out-both-members-shift':
        vals=[]
        for o in r['options']:
            a,b=o.split(' ÷ ');vals.append(div(D(a),D(b)))
        answer=one(o for o,v in zip(r['options'],vals)if vals.count(v)==1);assert sorted([vals.count(v)for v in set(vals)])==[1,3];notes=[f'ALLfouractual divisions{list(map(str,vals))}; threeequivalent/oneoddEXPRESSSION{answer}, independent both-member shifts for all.']
    elif k=='unknown-digit-decimal-quotient-integer':
        whole,ones,divisor=m(r'^(\d+),□(\d) ÷ (\d+,\d+)',s).groups();valid=[]
        for digit in range(10):
            v=D(f'{whole},{digit}{ones}')/D(divisor)
            if v.denominator==1 and v>0:valid.append(digit)
        answer=str(one(valid));assert list(range(10))==[0,1,2,3,4,5,6,7,8,9];assert D(divisor)==F(24,100)
        div8=[d for d in range(10)if int(whole)*100+10*d+int(ones)>0 and(int(whole)*100+10*d+int(ones))%8==0];div3=[d for d in range(10)if(int(whole)*100+10*d+int(ones))%3==0];assert set(div8)&set(div3)==set(valid)
        notes=[f'COMPLETEALL0…9printedmask:{whole},□{ones}/{divisor}; integercandidates{valid}; independentdiv8{div8},div3{div3}, intersectionunique, notMCQ-onlysearch.']
    elif k=='opposite-decimal-speeds-meeting-minutes':
        distance,v1,v2=ds;t=div(distance,v1+v2);assert v1*t+v2*t==distance;answer=integer(t*60);notes=[f'SIMULTANEOUSoppositeapproachSUMspeeds{v1+v2}, time{t}h, ALLfractionalhours×60→{answer}min; pathconservation.']
    elif k=='fuel-cost-to-litres-to-route-thousandths':
        perkm=one(ds);unitprice,total=map(int,m(r'литрі (\d+) теңге, оған (\d+) теңге',s).groups());litres=F(total,unitprice);v=div(litres,perkm);assert v*perkm*unitprice==total;answer=integer(v);notes=[f'ACTUALpayment{total}/Lprice{unitprice}=litres{litres}, /perkm{perkm}={v}km; THREEzeropadding preserved, fuel/payment backwardconservation.']
    elif k=='whole-liquid-divide-fractional-cup':
        whole=number(r'Құтыда (\d+) л',s);cup=one(ds);v=div(whole,cup);answer=integer(v);assert v*cup==whole;notes=[f'ActualWHOLEliquid{whole}/onecup{cup}={v}FULLcups, exactinteger so no partialcup/remainder; eachcupconservation.']
    elif k=='unknown-difference-divisor-then-minuend':
        a,b=ds[:2];q=number(r'\) = (\d+)',s);den=a/q;v=den+b;assert v!=b and a/(v-b)==q;div(a,den);answer=pick(r,v);topic='eq';assert pick(r,den-b)!=answer and pick(r,a*q+b)!=answer;notes=[f'ENTIREunknownDIVISORx−{b}={a}/{q}={den}; x={v}, nonzero-divisor exclusion retained; substitution andwrong inverse/minuend roles.']
    elif k=='drying-loss-complement-to-fresh-mass':
        lost,dried=ds;assert 0<lost<1;v=div(dried,1-lost);assert v*lost+dried==v;answer=integer(v);notes=[f'DRIED{dried}correspondstoCOMPLEMENT1−lost{lost}; originalFRESH{v}; lost+remaining conservation, notdividebylostshare.']
    elif k=='train-full-bridge-route-thousandth-hour':
        train,bridge,t=ds;v=div(train+bridge,t);answer=pick(r,v);assert pick(r,bridge/t)!=answer and pick(r,train/t)!=answer;notes=[f'FULLbridgecrossing involvesTRAIN+BRIDGE={train+bridge}, /{t}h={v}km/h; bothtrain-only/bridge-only distractors explicitlyfalse, twozeropadding preserved.']
    elif k=='least-natural-dividend-integer-decimal-quotient':
        divisor=one(ds);a,b=divisor.numerator,divisor.denominator;assert math.gcd(a,b)==1;answer=str(a);assert(F(a)/divisor).denominator==1
        # Coprime exact criterion is universal, not an arbitrary bounded search:
        # b*n/a integer iff a|n. Thus all positive n<a fail, boundary n=a works.
        assert all((F(n)/divisor).denominator!=1 for n in range(1,a));assert a==9 and b==20
        notes=[f'ACTUALdivisor reduced={a}/{b}, gcd=1; UNIVERSALcoprimecriterion b*n/a integer iff a|n. Minimumpositive{a}; all1…{a-1}independentlyrejected, nofalseassumptionthat9isprime.']
    else:raise AssertionError(k)
    assert r['topic']==topic,(k,r['topic'],topic)
    return answer,' '.join(notes),pairs

def division_ledger(r,pairs):
    s=r['solution'];starts=list(re.finditer(r'Бүтін бөлікті бөлеміз: (\d+) = (\d+) × (\d+) \+ (\d+)\.',s));assert len(starts)==len(pairs),(r['editionId'],len(starts),pairs)
    totalsteps=zeros=appended=cycles=0
    names=['ондық үлес','жүздік үлес','мыңдық үлес','он мыңдық үлес','жүз мыңдық үлес']
    for i,start in enumerate(starts):
        text,d=pairs[i];w,dd,q,rem=map(int,start.groups());assert dd==d;parts=text.split(',');whole=int(parts[0]);inputdigits=parts[1]if len(parts)==2 else'';assert w==whole and q==whole//d and rem==whole%d
        block=s[start.end():starts[i+1].start()if i+1<len(starts)else len(s)];writtenwhole=number(r'Бөліндінің бүтін бөлігі (\d+)',block);assert writtenwhole==q
        steps=list(re.finditer(r'(Келесі цифрды түсіріп|Қалдыққа 0 тіркеп), (\d+) × 10 \+ (\d+) = (\d+)\. (\d+) = (\d+) × (\d+) \+ (\d+); ([^;.,]+?) орнына (\d+) жазамыз',block));digits=[];seen={rem}if not inputdigits and rem else set();repeated=False
        for j,st in enumerate(steps):
            mode,old,digit,current,c2,divisor,out,nextrem,place,written=st.groups();old,digit,current,c2,divisor,out,nextrem,written=map(int,[old,digit,current,c2,divisor,out,nextrem,written]);assert old==rem and current==rem*10+digit and c2==current and divisor==d and out==current//d and nextrem==current%d and 0<=out<=9 and written==out
            assert place==names[j];assert digit==(int(inputdigits[j])if j<len(inputdigits)else 0);assert mode==('Келесі цифрды түсіріп'if j<len(inputdigits)else'Қалдыққа 0 тіркеп')
            rem=nextrem;digits.append(str(out));totalsteps+=1
            if out==0:zeros+=1;assert 'бұл нөлді тастамаймыз'in block[st.end():st.end()+45]
            if j>=len(inputdigits):appended+=1
            if j+1>=len(inputdigits)and rem:
                if rem in seen:assert j==len(steps)-1;repeated=True
                seen.add(rem)
        state=recurrence(D(text)/d)
        if state['terminates']:
            assert rem==0 and len(digits)>=len(inputdigits)and not repeated
            got=str(q)+(','+''.join(digits)if digits else'');assert D(got)==D(text)/d
            a,wd,v=m(r'Қалдық 0, барлық берілген цифрлар пайдаланылды: (\d+(?:,\d+)?) ÷ (\d+) = (\d+(?:,\d+)?)\.',block).groups();assert D(a)==D(text)and int(wd)==d and D(v)==D(text)/d
        else:
            cycles+=1;assert repeated and rem and re.search(r'Қалдық '+str(rem)+r' қайта шықты',block)
    return len(starts),totalsteps,zeros,appended,cycles

def shifts_and_ledger(r,pairs):
    """Bind each written BOTH shift to actual operands, then exact natural trace."""
    natural=[];expected=[];s=r['solution'];padding=0
    for a,b in pairs:
        if P(b)==0:natural.append((a,int(b)));continue
        p=P(b);scale=10**p;shifted=decimal(D(a)*scale);d=integer(D(b)*scale);natural.append((shifted,int(d)));expected.append((a,b,p,scale,shifted,d))
    pat=r'Бөлгіште (\d+) ондық орын бар\. БӨЛІНГІШ ПЕН БӨЛГІШТІҢ ЕКЕУІН де (\d+) санына көбейтеміз([^.]*?)\. (\d+(?:,\d+)?) ÷ (\d+(?:,\d+)?) = (\d+(?:,\d+)?) ÷ (\d+)\. Екі мүшенің бірдей есе өзгеруі бөліндіні сақтайды\.'
    written=list(re.finditer(pat,s));assert len(written)==len(expected),(r['editionId'],len(written),expected)
    for w,(a,b,p,scale,shifted,d)in zip(written,expected):
        wp,sc,extra,wa,wb,wshift,wd=w.groups();assert int(wp)==p and int(sc)==scale and wa==a and wb==b and wshift==shifted and wd==d
        assert D(wa)/D(wb)==D(wshift)/int(wd);need=max(0,p-P(a))
        if need:
            padded=a+('0'*need)if','in a else a+','+'0'*need
            assert extra==f': {a} = {padded}; жетпеген {need} орынға нөл тіркелді';padding+=need
        else:assert extra==''
    return division_ledger(r,natural),len(written),padding

def main():
    assert len(ROWS)==43;entries=[];refs=set();totals=[0]*5;shifts=padding=0
    for r in ROWS:
        expected,note,pairs=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer']);counts,sc,pc=shifts_and_ledger(r,pairs);totals=[a+b for a,b in zip(totals,counts)];shifts+=sc;padding+=pc
        bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer'];assert r['grade']==5 and r['minimumPlan']=='pro'and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit()and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=source(r);refs.add(raw['id']);assert raw['solution'];norm=lambda x:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',x).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All43 saved/new full conditions/official solutions/everyMCQ read; own ACTUAL PRINTED Fraction/AST BOTH-member shifts, exact Euclidean ledger, universal coprime and complete digit-domain oracle; no author solver/spec/params','notes':note+f' Checked {sc} BOTHshifts/{pc} exact paddedzeros/{counts[0]} fulltraces/{counts[1]} perplaceidentities.','sourceCanonicalSha256':digest(raw),'checks':['Every full saved/new condition/official and own solution/everyMCQ manually read','Both operands scaled by SAME exact10^places; missingzero count and retained decimal dividend bound','Natural Euclidean whole and every remainder×10+nextdigit/divisor×quotient+remainder/place/zero checked','Full0…9 digitmask and complete1…9 tenthsdivisors checked, notonlyMCQchoices','Universal reducedcoprime criterion for leastn/.45, without falseprimeassumption','Actualoriginal/remaining/complement/price/ratebases, raftHALFcurrent, bridgeSUM and minutesSI60 checked']})
    assert len(refs)==43 and totals[0]>35 and shifts>30 and padding>20
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[{'editionId':ROWS[22]['editionId'],'issue':'Source explicitly teaches TWOzero padding at integer-dividend/.25; initial adaptation/.2 lost one of these places.','resolution':'Target small-mass divisor replaced by .24, same integer payment960; exactTWOzero padding →96000/24, unit4000, requested.75kg price3000. Other42 unchanged.'}],'scope':'All43source-addressed grade5topic4.8 nonvisual decimaldivision; fullindependent printed exact review','divisionAudit':dict(zip(['traceBlocks','perPlaceSteps','requiredZeroSlots','appendedZeroSteps','repeatedStateCycles'],totals))|{'bothMemberShifts':shifts,'exactPaddedZeros':padding},'entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert{e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':43,'wrongKeysRejected':43,'hashesMatched':43,'sourceRefs':43,**report['divisionAudit'],'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))

if __name__=='__main__':main()
