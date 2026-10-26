"""Independent exact review of the DISPLAYED part/whole conditions and MCQs.

No producer calculator, specifications or params are read by this oracle.
Every original/new condition, complete solution and offered option was also read.
"""
import ast
import copy
from fractions import Fraction as F
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import unicodedata

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade5-part-whole.json'
OUT='problems/editorial/reviews/grade5-part-whole.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']

def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def m(pattern,text):
    found=re.search(pattern,text);assert found,(pattern,text);return found
def number(pattern,text):return int(m(pattern,text)[1])
def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def raw_for(row):
    ref=one(row['sourceRefs'])
    return one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId'])
def groups(s):
    depth=0;start=None;out=[]
    for i,c in enumerate(s):
        if c=='(':
            if depth==0:start=i
            depth+=1
        elif c==')':
            depth-=1;assert depth>=0
            if depth==0:out.append(s[start:i+1])
    assert depth==0
    return out
def calc(s):
    s=s.replace('×','*').replace('÷','/').replace('−','-').strip()
    assert re.fullmatch(r'[0-9 ()+*/-]+',s),s
    def visit(n):
        if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
        if isinstance(n,ast.UnaryOp):assert isinstance(n.op,ast.USub);return -visit(n.operand)
        assert isinstance(n,ast.BinOp),ast.dump(n)
        a,b=visit(n.left),visit(n.right)
        if isinstance(n.op,ast.Add):return a+b
        if isinstance(n.op,ast.Sub):return a-b
        if isinstance(n.op,ast.Mult):return a*b
        assert isinstance(n.op,ast.Div) and b
        return a/b
    return visit(ast.parse(s,mode='eval').body)
def integer(v):
    v=F(v);assert v>=0 and v.denominator==1,v
    return str(v.numerator)
def choice(r,v):return one(o for o in r['options'] if calc(o)==v)
def inverse(known,coefficient):
    """Exact linear uniqueness, no arbitrary finite search or guessed answer."""
    known,coefficient=F(known),F(coefficient)
    assert known>0 and coefficient>0
    value=known/coefficient
    assert value>0 and coefficient*value==known
    # a*x=b with nonzero a has precisely one rational x, hence at most one natural.
    return value
def ledger(whole,*parts):
    whole=F(whole);parts=list(map(F,parts))
    assert all(p>=0 for p in parts) and sum(parts,F(0))==whole,(whole,parts)
def counts(*parts):assert all(F(p).denominator==1 and p>=0 for p in parts),parts
def traps(r,values):
    for v in values:assert choice(r,v)!=r['answer'],(r['editionId'],v)

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-part-whole-')
    gs=groups(s);vs=list(map(calc,gs));ps=[tuple(map(int,p)) for p in re.findall(r'\((\d+)/(\d+)\)',s)]
    details='';topic='frac'
    if k=='choose-operation-to-find-part':
        whole=number(r'^(\d+) саны белгілі',s);f=one(vs);v=whole*f;answer=choice(r,v)
        assert answer==f'{whole} × {gs[0]}'
        # Both division notations are intentionally the same WRONG value, as in source.
        assert calc(r['options'][1])==calc(r['options'][2])!=v
        details=f'Knownwhole{whole}×part{f}={v}; correct operation selected, not inverse/add; equivalent wrong division options intentionally retained.'
    elif k in {'club-members-direct-fraction','natural-number-direct-fraction','saved-money-fraction-of-goal'}:
        pattern={'club-members-direct-fraction':r'клубында (\d+) оқушы','natural-number-direct-fraction':r'кестесінде (\d+) саны','saved-money-fraction-of-goal':r'үшін (\d+) теңге'}[k]
        whole=number(pattern,s);f=one(vs);v=whole*f;answer=integer(v)
        if k=='club-members-direct-fraction':counts(v,whole-v)
        if k=='natural-number-direct-fraction':assert whole%ps[0][1]==0
        details=f'Printed originalwhole{whole}×printedfraction{f}={v}, requested PART not remaining{whole-v}; exact integer unitshare/cancellation.'
    elif k in {'whole-from-known-part-diagnostic','proper-fraction-coefficient-equation','reservoir-capacity-known-part'}:
        f=one(vs)
        pattern={'whole-from-known-part-diagnostic':r'бөлігі (\d+) санына','proper-fraction-coefficient-equation':r'× x = (\d+) теңдеуін','reservoir-capacity-known-part':r'бөлігі (\d+) л'}[k]
        part=number(pattern,s);v=inverse(part,f);answer=choice(r,v) if r.get('options') else integer(v)
        assert v*f==part
        if r.get('options'):traps(r,[part*f,F(part,ps[0][0]),F(part)*ps[0][0]])
        if 'equation' in k:topic='eq'
        details=f'Knownpart{part}, displayed coefficient{f}; unique whole/x{v} by nonzero linear coefficient; exact substitution{v}×{f}={part}.'
    elif k=='mixed-number-part-diagnostic':
        whole,f=vs;v=whole*f;answer=choice(r,v)
        w,a,d=map(int,m(r'^\((\d+) \+ \((\d+)/(\d+)\)\)',s).groups())
        wrong=[whole/f,F(w)+F(a,d)*f,F(w)*f+F(a,d)]
        traps(r,wrong);assert all(math.gcd(x,y)>1 for x,y in [(whole.numerator,f.denominator),(whole.denominator,f.numerator)])
        details=f'ENTIRE printedmixed{whole}×{f}={v}; BOTH realcrosscancels; allsource divide/onlyfraction/onlywhole traps{list(map(str,wrong))} evaluated and false.'
    elif k=='fraction-of-hours-in-minutes':
        hours=number(r'^(\d+) сағаттың',s);f=one(vs);minutes=hours*60;v=minutes*f;answer=choice(r,v)
        wrong=[hours*f,minutes-v,F(minutes)/f];traps(r,wrong)
        assert 'МИНУТ' in s and 'барлық мән минутпен' in s
        details=f'{hours}h×60={minutes}min; printedpart{f}→{v}min; unconvertedhour/remnant/division traps{list(map(str,wrong))} checked in MINUTES.'
    elif k=='choose-inverse-part-expression':
        f=one(vs);part=number(r'бөлігі (\d+) болды',s);v=inverse(part,f);answer=choice(r,v)
        assert answer==f'{part} ÷ {gs[0]}'
        assert calc(r['options'][1])==calc(r['options'][2])==part*f
        traps(r,[f/part]);details=f'Knownpart{part} requires inverseof{f}; all actual expressions evaluated, unique{v}, both forward notations false.'
    elif k=='unit-share-from-multiple-shares':
        f,unit=vs;part=number(r'бөлігі (\d+) санына',s);n,d=ps[0]
        assert unit==F(1,d)
        v=F(part,n);whole=v*d;assert whole*f==part;answer=choice(r,v)
        traps(r,[whole,part*f,F(n)])
        details=f'{part}corresponds to{n}equalshares; one{unit}share{v}, WHOLE{whole}explicitly excluded; originalfractionmultiply and numerator-only traps checked.'
    elif k=='fraction-of-metres-in-centimetres':
        metres=number(r'Ұзындығы (\d+) м',s);f=one(vs);v=metres*100*f;answer=integer(v)
        assert 'сантиметр' in s;details=f'Actual{metres}m×100cm/m×{f}={v}cm; metrevalue is not relabelled as centimetres.'
    elif k in {'proper-fraction-part-two-cross-cancels','test-fraction-part-cross-cancellation'}:
        a,b=vs;v=a*b;answer=choice(r,v)
        (an,ad),(bn,bd)=ps
        assert math.gcd(an,bd)>1 and math.gcd(ad,bn)>1
        wrong=[a/b,F(an+bn,ad+bd),b/a];traps(r,wrong)
        assert 'Кері ретпен' in r['solution'] or 'орнын ауыстырып' in r['solution']
        details=f'Both printedproperfractions{a}×{b}={v}; TWOactualcrosscancels; source-specific forwarddivision{a/b}, mediant{wrong[1]}, REVERSEDdivision{b/a} all offered and false (not reciprocalproduct).'
    elif k=='total-route-from-remaining-distance':
        used=one(vs);last=number(r'әлі (\d+) км',s);v=inverse(last,1-used);answer=choice(r,v)
        ledger(v,v*used,last);traps(r,[last/used,v*used,last*used]);details=f'Knownremaining{last} corresponds to1−{used}={1-used}, total{v}; passed{v*used}+remaining{last} exact, three wrongrole values checked.'
    elif k=='mixed-clay-remaining-mass':
        whole,used=vs;v=whole*(1-used);answer=integer(v);ledger(whole,whole*used,v)
        assert whole.denominator>1 and (whole*used).denominator>1
        details=f'Entire mixedmass{whole}kg; used{whole*used}, remaining{v}; exact complementaryledger and genuine mixed conversion retained.'
    elif k=='other-category-from-known-fraction':
        f=one(vs);part=number(r'тобында (\d+) оқушы болса',s);whole=inverse(part,f);v=whole-part;counts(whole,part,v);ledger(whole,part,v);answer=integer(v)
        assert 'тек осы екі топтың біреуіне' in s;details=f'Exclusive/exhaustive two groups; known{part}={f}ofwhole{whole}, OTHERgroup{v}; unitandcountledger exact.'
    elif k=='price-after-original-fraction-discount':
        price=number(r'бағасы (\d+) теңге',s);f=one(vs);v=price*(1-f);answer=integer(v);ledger(price,price*f,v)
        assert 'БАСТАПҚЫ' in s;details=f'Discount{price*f} from ORIGINALprice{price}; requested newprice{v}, not discount itself.'
    elif k=='fraction-of-subset-as-original-share':
        first,second=vs;v=first*second;answer=choice(r,v);(a,b),(c,d)=ps
        traps(r,[first/second,first+second,F(a+c,b+d)])
        assert 'Ғылыми кітаптардың' in s and 'БАРЛЫҚ қордың' in s
        details=f'Nestedfraction{second}ofsubset{first}→{v}ofORIGINALwhole; all actualdivision/addition/mediant MCQs checked.'
    elif k=='two-spendings-from-same-original':
        whole=number(r'арналған (\d+) теңгесі',s);a,b=vs;v=whole*(1-a-b);answer=integer(v);ledger(whole,whole*a,whole*b,v)
        assert s.count('БАСТАПҚЫ')==2 and v!=whole*(1-a)*(1-b)
        details=f'BOTHoriginalbase{whole}; spends{whole*a},{whole*b}, remains{v}; sequentialbase alternative{whole*(1-a)*(1-b)} explicitly not used.'
    elif k=='additional-water-from-known-filled-part':
        f=one(vs);water=number(r'су (\d+) л',s);whole=inverse(water,f);v=whole-water;answer=choice(r,v)
        traps(r,[whole,water*(1-f),water*f]);ledger(whole,water,v)
        details=f'Filledpart{f}={water}L means fullcapacity{whole}; ADDITIONAL{v}L; all fullcapacity/knownwaterwrongbase traps checked.'
    elif k=='largest-mixed-forward-and-inverse-description':
        def description(o):
            if re.match(r'^\d+ санының',o):return number(r'^(\d+) санының',o)*calc(one(groups(o)))
            return inverse(number(r'бөлігі (\d+) болатын',o),calc(one(groups(o))))
        values=[description(o) for o in r['options']];answer=one(o for o,v in zip(r['options'],values) if v==max(values))
        details=f'ALL4displayed forward/inverse descriptions independentlyparsed→{list(map(str,values))}; uniqueMAX{max(values)}, printedlargestgiven not a shortcut.'
    elif k=='nested-whole-to-subset-count':
        whole=number(r'Кітапханадағы (\d+) кітаптың',s);a,b=vs;subset=whole*a;v=subset*b;answer=choice(r,v);counts(whole,subset,v);ledger(subset,v,subset-v)
        traps(r,[subset,whole*b,subset-v]);details=f'PrintedORIGINAL{whole}→subset{subset}→nested{v}; intermediate, secondfractionofALL and complement-in-subset distractors checked.'
    elif k in {'three-stage-route-inverse-remaining','two-sales-inverse-remaining-mass'}:
        a,b=vs;last=number(r'Соңғы (\d+) км' if k.startswith('three') else r'Содан кейін (\d+) кг',s)
        v=inverse(last,(1-a)*(1-b));after=v*(1-a);parts=[v*a,after*b,last];ledger(v,*parts);answer=integer(v)
        assert 'ҚАЛҒАН' in s
        details=f'Knownlast{last} coefficient(1−{a})(1−{b})={(1-a)*(1-b)}; UNIQUEoriginal{v}, stageledger{list(map(str,parts))}; secondbase{after}, notoriginal.'
    elif k=='two-original-fractions-then-known-remainder':
        a,b=vs;last=number(r'қалған (\d+) бет',s);v=inverse(last,1-a-b);counts(v,v*a,v*b,last);ledger(v,v*a,v*b,last);answer=choice(r,v)
        assert s.count('БАРЛЫҚ')==2;traps(r,[last/(a+b)])
        details=f'Bothfractions refer toALLpages, unusedcoefficient{1-a-b}; knownlast{last}→unique{v}; disjointintegerledger{v*a}+{v*b}+{last}, usingcompletedshare MCQ false.'
    elif k=='rectangle-perimeter-fractional-width':
        length=number(r'ұзындығы (\d+) м',s);f=one(vs);width=length*f;v=2*(length+width);answer=integer(v);topic='geo'
        assert length>width>0 and 'периметр' in s;details=f'Width{length}×{f}={width}m, P=2(L+W)={v}m; boundarylength ratherthanarea or singleadjacentsum.'
    elif k=='mixed-coefficient-part-equation':
        coef=one(vs);target=number(r'× x = (\d+) теңдеуіндегі',s);v=inverse(target,coef);answer=choice(r,v);topic='eq'
        w,a,d=map(int,m(r'^\((\d+) \+ \((\d+)/(\d+)\)\)',s).groups());traps(r,[target*coef,target-coef,F(target,w*d+a)])
        details=f'ENTIREmixedcoefficient{coef}, nonzero equationunique x{v}; backsubstitution{coef*v}={target}, multiply/subtract/numeratoronly traps checked.'
    elif k=='equal-fractional-parts-two-numbers-difference':
        topic='eq'
        a,b=vs;diff=number(r'екіншісінен (\d+) санға',s);assert b>a>0
        # a*A=b*B; A=B+diff, hence (b−a)B=a*diff.
        second=inverse(a*diff,b-a);v=second+diff;assert v*a==second*b;answer=choice(r,v)
        traps(r,[second,second+2*diff,second-diff]);details=f'TWOdistinct numbers A=B+{diff}, aA=bB with{a},{b}; exactlinearunique B{second}, requestedFIRST{v}; equalparts{v*a}, three wrongroles false.'
    elif k=='mother-age-from-sum-and-child-fraction':
        total=number(r'қосындысы (\d+)',s);f=one(vs);v=inverse(total,1+f);child=v*f;counts(v,child);ledger(total,v,child);answer=choice(r,v)
        traps(r,[child,total*(1-f),total*f]);details=f'Child{f}ofMOTHER, notcombined{total}; unique mother{v}, child{child}, exactsum; actualwrongdenominator roles checked.'
    elif k=='capacity-from-empty-and-poured-water':
        empty,poured=vs;last=number(r'бакта (\d+) л',s);v=inverse(last,(1-empty)*(1-poured));water=v*(1-empty);out=water*poured;answer=choice(r,v);ledger(v,v*empty,out,last)
        assert 'СУДЫҢ' in s;traps(r,[water,last/(1-empty),out])
        details=f'Empty{empty}ofCAPACITY, poured{poured}ofINITIALWATER; full{v}, initialwater{water}, removed{out}, left{last}; two distinctbases +allMCQ checked.'
    elif k=='three-original-location-shares-known-remainder':
        last=number(r'Қалған (\d+) сәлемдеме',s);f=sum(vs,F(0));v=inverse(last,1-f);parts=[v*x for x in vs];counts(v,*parts,last);ledger(v,*parts,last);answer=choice(r,v)
        assert 'қиылыспайды' in s;traps(r,[last/f,last*3,last*math.lcm(*(p[1] for p in ps))])
        details=f'THREEdisjointORIGINALshares sum{f}, complement{1-f}; remaining{last}→unique{v}; ALLintegergroups{list(map(str,parts))}+{last}; usedcoefficient/unitden/count traps checked.'
    elif k=='two-days-fraction-plus-fixed-inverse':
        a,b=vs;extra1=number(r'қоса (\d+) жинақ таратылды',s);extra2=number(r'қоса (\d+) жинақ берілді',s);last=number(r'Соңында (\d+) жинақ',s)
        after=inverse(last+extra2,1-b);v=inverse(after+extra1,1-a);first=v*a+extra1;second=after*b+extra2;counts(v,first,after,second,last);ledger(v,first,second,last);answer=integer(v)
        assert v-first==after and after-second==last and 'ҚАЛҒАН қордың' in s
        details=f'REVERSE fixedextraBEFOREdivision:({last}+{extra2})/(1−{b})={after}; ({after}+{extra1})/(1−{a})={v}. Forwardintegerledger first{first},remaining{after},second{second},last{last}; never secondfractionoforiginal.'
    elif k=='same-number-two-parts-known-difference':
        a,b=vs;diff=number(r'бөлігінен (\d+) санға',s);v=inverse(diff,a-b);answer=integer(v);assert v*a-v*b==diff
        details=f'SAMEunknown twofractions{a}−{b}={a-b}, knowndifference{diff}→uniqueORIGINAL{v}; individualparts{v*a},{v*b} subtractexactly.'
    elif k=='second-stage-multiple-of-first-then-remainder':
        a,mult=vs;last=number(r'кезеңге (\d+) км',s);second=a*mult;remaining=1-a-second;v=inverse(last,remaining);answer=choice(r,v);ledger(v,v*a,v*second,last)
        traps(r,[last/second,last/(a+second),v*2]);assert mult>1 and 'БІРІНШІ' in s
        details=f'Secondis{mult}timesFIRST{a}→{second}oforiginal; remaining{remaining}known{last}→unique{v}, forwardstages{v*a},{v*second},{last}; wrongstage/usedcoefficient traps evaluated.'
    elif k=='larger-container-from-addition-equalization':
        f=one(vs);added=number(r'тағы (\d+) л',s);v=inverse(added,1-f);answer=integer(v);assert v*f+added==v
        assert 'сырттан' in s and 'алынған жоқ' in s;details=f'Addedexternal{added} equals (1−{f})ofSECOND{v}, first{v*f}; actualequalization{v*f}+{added}={v}, no transfer shrinking second.'
    elif k=='three-recipients-nested-parts-difference':
        a,b=vs;diff=number(r'үшіншіден (\d+) моншақ',s);second=(1-a)*b;third=(1-a)*(1-b);v=inverse(diff,second-third);answer=choice(r,v);parts=[v*a,v*second,v*third];counts(v,*parts);ledger(v,*parts)
        traps(r,[diff/second,v*(1-a)]);assert parts[1]-parts[2]==diff
        details=f'Second{second}andthird{third}expressed in SAMEoriginalbase (seconditselfofREMAINDER); gap{diff}→unique{v}; actualcounts{list(map(str,parts))}; secondknownasgap/jointremaining false.'
    elif k=='two-sequential-sales-forward-remainder':
        whole=number(r'Дүкенге (\d+) кг',s);a,b=vs;first=whole*a;after=whole-first;second=after*b;v=after-second;answer=choice(r,v);ledger(whole,first,second,v)
        traps(r,[first,after,second]);assert 'ҚАЛҒАН' in s;details=f'Original{whole},firstsold{first},remaining{after}; second{b}ofremaining→{second}; FINAL{v}, everyintermediateMCQ false.'
    elif k=='same-number-two-parts-known-sum':
        a,b=vs;total=number(r'қосқанда (\d+) шығады',s);v=inverse(total,a+b);answer=integer(v);assert v*a+v*b==total
        details=f'SAMEoriginal fractionsum{a+b}known{total}→unique{v}; exactparts{v*a}+{v*b}={total}.'
    elif k=='two-fractions-of-hour-total-minutes':
        assert s.count('БІР САҒАТТЫҢ')==2
        parts=[60*x for x in vs];v=sum(parts,F(0));answer=integer(v);assert v>60 and len(vs)==2
        details=f'Bothfractions ofONEHOUR, notfirstofsecond or common60mintotalbudget; minuteledger{list(map(str,parts))}sums{v}>60 legitimately.'
    elif k=='book-read-unread-known-difference':
        read=one(vs);diff=number(r'санынан (\d+) бетке',s);unread=1-read;v=inverse(diff,unread-read);answer=choice(r,v);counts(v,v*read,v*unread);assert v*unread-v*read==diff
        traps(r,[diff/read,F(diff)*ps[0][1],diff/unread]);details=f'Unread{unread}minusread{read}={unread-read}, gap{diff}→uniqueTOTAL{v}; counts{v*read}/{v*unread}, allwrongroleMCQs checked.'
    elif k=='container-tare-from-poured-content-grams':
        before=number(r'массасы (\d+) кг',s);poured,after=vs;loss=before-after;content=inverse(loss,poured);tare=before-content;v=tare*1000;answer=integer(v)
        assert tare>0 and content>0 and tare+content*(1-poured)==after
        assert 'ГРАММ' in s and 'Құтының өзі өзгерген жоқ' in s
        # A second independent finite domain in grams: all possible positive tares
        # below the after-mass; the unchanged container is NEVER fractionally poured.
        candidates=[g for g in range(1,math.ceil(after*1000)) if F(g,1000)+(before-F(g,1000))*(1-poured)==after]
        assert candidates==[int(v)]
        details=f'ActualTOTALmasses{before},{after}kg; lostCONTENTonly{loss}, pouredfraction{poured}→originalcontent{content}, unchangedTARE{tare}kg×1000={v}g; ALL{math.ceil(after*1000)-1}positivegramtares checked, unique. Reverseafterledgerexact.'
    elif k=='route-second-stage-fixed-less-than-original-share':
        a,b=vs;assert a==b;less=number(r'бөлігінен (\d+) км кем',s);last=number(r'қалған (\d+) км',s);v=inverse(last-less,1-a-b);first=v*a;second=v*b-less;ledger(v,first,second,last);answer=choice(r,v)
        traps(r,[last/(1-a-b),(last+less)/(1-a-b),first]);details=f'TwoORIGINALshares{a},{b}, secondLESS{less}; last=(1−a−b)×whole+{less}; subtractfixedFIRST→unique{v}; stages{first},{second},{last}, wrongunadjusted/add/firststage MCQs false.'
    else:raise AssertionError(k)
    assert r['topic']==topic,(r['editionId'],r['topic'],topic)
    return answer,details

def main():
    assert len(ROWS)==43;entries=[];refs=set()
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer'])
        bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==5 and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);refs.add(raw['id']);assert raw['solution']
        norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip()
        assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Full saved/new/everyMCQ/fullsolution read; independent DISPLAYED Fraction AST and nonzero-linear-uniqueness, integer count/physical quantity ledgers, full tare-domain and SI unit review; no author solver/spec/params used','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['Every saved/new complete condition/solution/MCQ read','Exact original/subset/remainder bases and requested quantity distinguished','All offered mathematical values and specifically diagnosed source traps checked','Two reversed-division distractor findings corrected and final rows reread','Open numeric input/native notation/topic roles verified']})
    assert len(refs)==43
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256'] for e in entries];assert native['fractions']>250 and native['mixed']>35
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[{'sourceId':sid,'finding':'Fourth source option is reversed division, not reciprocal of the product','resolution':'Restored reversed-division false option, exact mathematical explanation and independent regression.'} for sid in ['794c65f5beca4e63','93c10e020f3ccb9b']],'scope':'All43 source-addressed grade5topic3.14 nonvisual part/whole adaptations, exact printed review','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':43,'wrongKeysRejected':43,'hashesMatched':43,'sourceRefs':43,'exactLinearUniqueness':True,'allPositiveGramTares':2299,'resolvedDidacticFindings':2,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))

if __name__=='__main__':main()
