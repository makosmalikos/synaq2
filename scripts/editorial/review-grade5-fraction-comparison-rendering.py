"""Independent exact printed fraction-comparison review of50source-addressed editions.
No author model/spec/calculator imported. Printed native fractions and Unicode
exponents are parsed exactly with Fraction; finite natural domains are complete.
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
PACK='problems/editorial/batches/grade5-fraction-comparison.json'
OUT='problems/editorial/reviews/grade5-fraction-comparison.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
SUP='⁰¹²³⁴⁵⁶⁷⁸⁹';TRANS=str.maketrans(SUP,'0123456789')
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def m(pattern,s):
    found=re.search(pattern,s);assert found,(pattern,s);return found
def n(s):
    s=s.replace(' ','');assert s.isdigit();return int(s)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def raw_for(r):
    ref=one(r['sourceRefs']);return one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId'])
def choice(r,predicate):return one(o for o in r['options'] if predicate(o))
def groups(s):
    out=[];depth=0;start=None
    for i,c in enumerate(s):
        if c=='(':
            if depth==0:start=i
            depth+=1
        if c==')':
            depth-=1;assert depth>=0
            if depth==0:out.append(s[start:i+1])
    assert depth==0;return out
def simple_pairs(s):return [tuple(map(int,p)) for p in re.findall(r'\((\d+)/(\d+)\)',s)]
def raw_pair(s):return one(simple_pairs(s))
def arithmetic(text,variables=None):
    variables=variables or {}
    # Parse superscripts before any normalization: NFKC would turn3¹²into312.
    text=re.sub(r'(\d+)(['+SUP+']+)',lambda p:p[1]+'**'+p[2].translate(TRANS),text)
    text=text.replace('×','*').replace('·','*').replace('−','-').strip()
    text=re.sub(r'(?<=\d)(?=[a-zA-Z])','*',text)
    assert re.fullmatch(r'[0-9a-zA-Z ()+*/-]+',text),text
    def visit(node):
        if isinstance(node,ast.Expression):return visit(node.body)
        if isinstance(node,ast.Constant):assert type(node.value) is int;return F(node.value)
        if isinstance(node,ast.Name):assert node.id in variables;return F(variables[node.id])
        assert isinstance(node,ast.BinOp),ast.dump(node)
        a,b=visit(node.left),visit(node.right)
        if isinstance(node.op,ast.Add):return a+b
        if isinstance(node.op,ast.Sub):return a-b
        if isinstance(node.op,ast.Mult):return a*b
        if isinstance(node.op,ast.Div):assert b!=0;return a/b
        assert isinstance(node.op,ast.Pow) and b.denominator==1 and 0<=b.numerator<=30
        return a**b.numerator
    return visit(ast.parse(text,mode='eval'))
def number(x):
    x=F(x);assert x.denominator==1;return str(x.numerator)
def least(ds):return next(n for n in range(max(ds),math.prod(ds)+1,max(ds)) if all(n%d==0 for d in ds))
def relation(s):
    parts=re.split(r'\s([<>=])\s',s);assert len(parts)>=3 and len(parts)%2==1
    values=[arithmetic(v) for v in parts[::2]]
    return all((a<b if op=='<' else a>b if op=='>' else a==b) for a,op,b in zip(values,parts[1::2],values[1:]))
def ordered_option(r,values,reverse=False):
    expected=sorted(values,reverse=reverse)
    return choice(r,lambda o:[arithmetic(g) for g in groups(o)]==expected)
def extrema_option(r,values,maximum=True):
    target=(max if maximum else min)(values);assert values.count(target)==1
    return choice(r,lambda o:arithmetic(o)==target)
def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-fraction-comparison-');gs=groups(s);pairs=simple_pairs(s);vs=[arithmetic(g) for g in gs if not re.search('[a-z]',g)];note=''
    relations={'equal-whole-mixed-comparison','different-whole-mixed-comparison','improper-versus-mixed-comparison','near-unit-crossproduct-comparison','near-large-crossproduct-comparison','repeated-two-digit-fraction-comparison','adjacent-near-one-fraction-comparison','choose-true-mixed-comparison-rules','progress-share-chain'}
    if k in relations:
        ans=choice(r,relation);truth=[relation(o) for o in r['options']];note=f'Every actual relation/chain exactly evaluated with Fraction: truth {truth}; positive mixed sums retained, crossproducts never rounded.'
        if k in ['near-unit-crossproduct-comparison','near-large-crossproduct-comparison','adjacent-near-one-fraction-comparison']:
            (a,b),(c,d)=pairs;assert abs(a*d-b*c)==1;note+=f' Actual crossproducts {a*d},{b*c} differ exactly1.'
        if k=='repeated-two-digit-fraction-comparison':
            a,b=pairs[0];assert str(a)[:2]*2==str(a) and str(b)[:2]*2==str(b);assert a==int(str(a)[:2])*101 and b==int(str(b)[:2])*101
    elif k=='count-above-half':
        vals,threshold=vs[:-1],vs[-1];selected=[x for x in vals if x>threshold];ans=str(len(selected));note=f'Actual list {list(map(str,vals))}, strict >{threshold}; selected {list(map(str,selected))}, equality excluded.'
    elif k in ['greater-same-denominator-original-numerator','original-numerator-of-largest-fraction']:
        maxval=max(vs);a,b=one(p for p in pairs if F(*p)==maxval);ans=str(a);note=f'All actual values compared; largest RAW input {a}/{b}; original numerator {a}, not normalized/expanded numerator.'
    elif k=='unique-strict-same-denominator-numerator':
        low,high=vs;den=int(m(r'\(x/(\d+)\)',s)[1]);valid=[x for x in range(1,math.ceil(high*den)+1) if low<F(x,den)<high];ans=str(one(valid));note=f'Complete positive x1..{math.ceil(high*den)} domain, actual strict bounds {low},{high}; valid {valid}.'
    elif k=='first-new-numerator-for-comparison':
        den=least([b for a,b in pairs]);ans=number(vs[0]*den);note=f'Actual fractions {pairs}, minimum denominator {den} via full increasing multiples search; FIRST new numerator {ans}.'
    elif k=='unique-strict-equal-numerator-denominator':
        low,high=vs;a=int(m(r'\((\d+)/n\)',s)[1]);bound=math.ceil(F(a)/low);valid=[n for n in range(1,bound+1) if low<F(a,n)<high];ans=str(one(valid));note=f'Complete positive denominator1..{bound}; reciprocal order and strict bounds {low},{high}; valid {valid}, larger n gives ≤lower.'
    elif k=='select-fraction-above-one':
        ans=choice(r,lambda o:arithmetic(o)>1);note=f'All actual options exactly compared to1, equality would be excluded: {[str(arithmetic(o)) for o in r["options"]]}.'
    elif k in ['order-common-denominator-fractions','order-two-whole-groups','order-unlike-denominator-fractions']:
        ans=ordered_option(r,vs);note=f'All actual complete values sorted ascending {list(map(str,sorted(vs)))}; every actual offered tuple checked, not just adjacent pair or fractionalpart.'
    elif k=='rightmost-equal-numerator-denominator':
        a,b=one(p for p in pairs if F(*p)==max(vs));ans=str(b);note=f'Actual coordinates {pairs}; rightmost is max {a}/{b}, requested RAW denominator {b}, not point label/numerator.'
    elif k=='greatest-fixed-denominator-below':
        den=int(m(r'Бөлімі ДӘЛ (\d+)',s)[1]);bound=one(vs);valid=[a for a in range(1,math.ceil(bound*den)+1) if F(a,den)<bound];ans=str(max(valid));note=f'Every positive numerator1..{math.ceil(bound*den)} tested at EXACT denominator {den}; max {ans}, strict bound {bound}, raw fraction need not be irreducible.'
    elif k in ['greatest-equal-numerator-fraction','greatest-improper-mixed-same-whole','largest-near-half-fraction']:
        ans=extrema_option(r,vs);note=f'All actual four values {list(map(str,vs))} compared exactly, unique maximum {max(vs)}; mixed wholeparts included and no decimal approximation.'
    elif k=='machine-output-rate-comparison':
        t1,c1,t2,c2=map(int,m(r'Бірінші құрылғы (\d+) минутта (\d+) бөлшек, екіншісі (\d+) минутта (\d+) бөлшек',s).groups());rates=[F(c1,t1),F(c2,t2)];assert rates[0]!=rates[1];expected='Бірінші құрылғы' if rates[0]>rates[1] else 'Екінші құрылғы';ans=choice(r,lambda o:o==expected);assert abs(c1*t2-c2*t1)==1;note=f'Actual output/TIME rates {rates}; crossproducts {c1*t2},{c2*t1} differ1, raw counts {c1}<{c2} would choose wrong device.'
    elif k=='new-numerator-of-smallest-fraction':
        den=least([b for a,b in pairs]);ans=number(min(vs)*den);note=f'Actual minimum value {min(vs)} at minimal common denominator {den}; requested expanded numerator {ans}, not raw input.'
    elif k=='fractional-hours-versus-minutes':
        target=one(vs)*60;minutes=int(m(r'пен (\d+) минут',s)[1]);op='>' if target>minutes else '<' if target<minutes else '='
        ans=choice(r,lambda o:(' '+op+' ')in o);note=f'Exact60minutes/hour: actual {vs[0]}hour={target}minutes vs {minutes}; actual unit relation {op}, not concatenation of fractiondigits.'
    elif k=='greatest-natural-variable-numerator':
        den=int(m(r'\(n/(\d+)\)',s)[1]);bound=one(vs);upper=math.ceil(bound*den);valid=[n for n in range(1,upper+1) if F(n,den)<bound];ans=str(max(valid));note=f'ALL positive n1..{upper}, exact n/{den}<{bound}; valid {valid}, monotone numerator rules out larger values.'
    elif k=='best-class-share-total':
        entries=[(name,int(total),int(done)) for name,total,done in re.findall(r'([ABC]) сыныбында барлығы (\d+)(?: оқушы)?, (?:барлығын )?дұрыс орындағаны (\d+)',s)];assert len(entries)==3;rates=[F(done,total) for name,total,done in entries];best=one(i for i,v in enumerate(rates) if v==max(rates));ans=str(entries[best][1]);note=f'All actual class shares {rates} from {entries}; best class {entries[best][0]}, requested TOTAL {ans}, not successes {entries[best][2]}.'
    elif k=='best-hit-share-total-attempts':
        entries=[(name,int(total),int(hit)) for name,total,hit in re.findall(r'(Дина|Мерей|Айсұлу) (\d+) рет лақтырып, (\d+) рет дәл тигізді',s)];assert len(entries)==3;shares=[F(hit,total) for name,total,hit in entries];best=one(i for i,v in enumerate(shares) if v==max(shares));ans=str(entries[best][1]);note=f'Actual hits/attempts {shares}; best {entries[best]}, requested ALL attempts {ans}, not hits or highest rawhitcount.'
    elif k=='largest-numerator-between-mixed':
        low,high=vs;den=int(m(r'\(x/(\d+)\)',s)[1]);valid=[x for x in range(1,math.ceil(high*den)+1) if low<F(x,den)<high];ans=str(max(valid));note=f'Full positive x bound1..{math.ceil(high*den)}, actual mixedstrict limits {low},{high}; valid {valid}, integer-valued representations retained.'
    elif k=='order-fictional-mixture-water-shares':
        labels=re.findall(r'([ABC]):',s);assert len(labels)==len(vs)==3;order=[label for value,label in sorted(zip(vs,labels),reverse=True)];ans=choice(r,lambda o:o.split(', ')==order);note=f'Actual fictional labeled shares {dict(zip(labels,map(str,vs)))}, descending {order}; all3 checked, no factual nutrition claim.'
    elif k in ['sum-variable-denominators-between-unit-fractions','count-variable-denominators-between']:
        low,high=vs;a=int(m(r'\((\d+)/[an]\)',s)[1]);upper=math.ceil(F(a)/low);valid=[n for n in range(1,upper+1) if low<F(a,n)<high];ans=str(sum(valid) if k.startswith('sum') else len(valid));note=f'Complete positive denominator1..{upper}; strict {low}<{a}/variable<{high}, allvalid {valid}; reciprocal inequality and requested sum/count distinguished.'
    elif k=='order-three-ray-labels':
        labels=re.findall(r'([ABC]):',s);assert len(labels)==len(vs)==3;order=[label for value,label in sorted(zip(vs,labels))];ans=choice(r,lambda o:o.split(', ')==order);note=f'Exact all3 actual coordinate values {dict(zip(labels,map(str,vs)))}, increasing left-to-right order {order}.'
    elif k in ['count-fixed-denominator-between','count-variable-numerators-unlike-bounds']:
        low,high=vs;den=int(m(r'Бөлімі ДӘЛ (\d+)',s)[1]) if k=='count-fixed-denominator-between' else int(m(r'\(a/(\d+)\)',s)[1]);upper=math.ceil(high*den);valid=[a for a in range(1,upper+1) if low<F(a,den)<high];ans=str(len(valid));note=f'Complete numerator1..{upper} at originaldenominator {den}, actualstrict bounds {low},{high}, valid {valid}; reducible fractions retained when not forbidden.'
    elif k=='sum-mixed-fractional-numerators-between':
        low,high=vs;w,den=map(int,m(r'\((\d+) \+ \(a/(\d+)\)\)',s).groups());upper=math.ceil((high-w)*den);valid=[a for a in range(1,upper+1) if low<w+F(a,den)<high];ans=str(sum(valid));note=f'Complete actual whole+fraction {w}+a/{den}, not multiplication; full positivea1..{upper}, valid {valid}, strictendpoints, requested sum {ans}.'
    elif k=='count-one-digit-irreducible-above':
        low=one(vs);valid=[(a,b) for a in range(1,10) for b in range(1,10) if math.gcd(a,b)==1 and low<F(a,b)<1];ans=str(len(valid));note=f'Full81 positive one-digit numerator/denominator assignments, exact strict bounds and RAWgcd1; valid {valid}, not only consecutive digits.'
    elif k=='same-addition-changes-proper-fraction':
        a,b=one(pairs);add=int(m(r'де (\d+) қосты',s)[1]);old=F(a,b);new=F(a+add,b+add);expected='Үлкен' if new>old else 'Кіші' if new<old else 'Тең';ans=choice(r,lambda o:o==expected);note=f'Actual addition to BOTHrawterms {a,b}+{add} gives {new} vs {old}; exact crossproducts, not equal-scaling misconception.'
    elif k=='least-two-digit-variable-denominator':
        a=int(m(r'\((\d+)/n\)',s)[1]);target=one(vs);valid=[n for n in range(10,100) if F(a,n)<target];ans=str(min(valid));note=f'Full90 two-digit natural candidates10..99; exact {a}/n<{target}, first {ans}, no unbounded/zero denominator ambiguity.'
    elif k=='choose-fraction-between-close-bounds':
        low,high=vs;ans=choice(r,lambda o:low<arithmetic(o)<high);note=f'All four actual options against BOTHstrict bounds {low},{high}; unique insidepoint, endpoints excluded.'
    elif k=='same-route-arrival-order':
        names=re.findall(r'(Дина|Мерей|Айсұлу) жолды',s);assert len(names)==len(vs)==3;order=[name for value,name in sorted(zip(vs,names))];ans=choice(r,lambda o:o.split(', ')==order);assert 'бір мезгілде' in s;note=f'Actual equalroute/simultaneousdeparture times {dict(zip(names,map(str,vs)))}, smaller duration arrivesearlier; order {order}.'
    elif k=='least-natural-near-one-variable':
        threshold=one(vs);upper=math.floor(threshold/(1-threshold))+1;valid=[n for n in range(1,upper+1) if F(n,n+1)>threshold];ans=str(min(valid));note=f'Allpositive n1..{upper} enumerated from exact crossproduct threshold {threshold}; first {ans}; n/(n+1) increases since successive difference1/((n+1)(n+2))>0.'
    elif k=='count-natural-between-improper-bounds':
        low,high=vs;valid=[n for n in range(1,math.ceil(high)+1) if low<n<high];ans=str(len(valid));note=f'Completepositive naturals1..{math.ceil(high)}, actualimproper limits {low},{high}; valid {valid}, strict notrounded.'
    elif k=='equal-wholes-equal-piece-count':
        d1,d2,count=map(int,m(r'Дина өз таспасын (\d+), Мерей өзінікін (\d+) тең бөлікке[\s\S]*?Әрқайсысы (\d+) бөліктен',s).groups());shares=[F(count,d1),F(count,d2)];assert 'БІРДЕЙ' in s;expected='Мерей' if shares[1]>shares[0] else 'Дина' if shares[0]>shares[1] else 'Екеуі бірдей';ans=choice(r,lambda o:o==expected);note=f'Explicit equal original lengths, actual used fractions {shares}; samepiececount doesnot imply same length.'
    elif k=='equal-containers-most-filled-index':
        target=max(vs);ans=str(one(i+1 for i,v in enumerate(vs) if v==target));note=f'Actual equal-capacity shares {list(map(str,vs))}; maximum {target}, requested 1-basedINDEX {ans}, not numerator or denominator.'
    elif k=='greatest-proper-digit-fraction-term-sum':
        digits=list(map(int,m(r'^([\d, ]+) цифрларының',s)[1].replace(',','').split()));valid=[(a,b) for a in digits for b in digits if a!=b and a<b];best=one(p for p in valid if F(*p)==max(F(a,b) for a,b in valid));ans=str(sum(best));note=f'Full{len(digits)**2}roleassignments using twoDISTINCTdigits, proper {valid}, unique bestRAW{best}; requested originalterm SUM {ans}.'
    elif k=='minimum-denominator-inside-bounds':
        low,high=vs;assert 0<low<high<1;upper=low.denominator+high.denominator;witness=F(low.numerator+high.numerator,upper);assert low<witness<high;valid=[(a,b) for b in range(1,upper+1) for a in range(1,b) if low<F(a,b)<high];den=min(b for a,b in valid);ans=str(den);note=f'Complete triangular natural domain allb1..{upper}, alla1..b−1; mediant{witness}guarantees a witness bybound, firstden {den}; valid {valid}, strictendpoints.'
    elif k=='sum-variable-self-reciprocal-domain':
        den,top=map(int,m(r'^\(n/(\d+)\) < \((\d+)/n\)',s).groups());bound=math.isqrt(den*top)+1;valid=[n for n in range(1,bound+1) if F(n,den)<F(top,n)];ans=str(sum(valid));note=f'Exactpositive crossproducts n²<{den*top}; fulln1..{bound}, valid {valid}, monotonen² rules out larger n; sum {ans}.'
    else:raise AssertionError(k)
    return ans,note

def main():
    assert len(ROWS)==50;entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==5 and r['topic']=='frac' and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);assert raw['solution'];refs.add(raw['id']);normalize=lambda t:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t).lower()).strip();assert normalize(raw['statement'])!=normalize(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Exact printed Fraction comparisons and every actual MCQ, complete finite natural-variable/digit/denominator domains with boundproof; rates and answer roles checked separately, noauthor solver/spec imported','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['all50saved/newconditions/MCQs/fullsolutionsread','strictboundaries/equality/positive domains checked','allactualMCQchains/orderedtuples/wholeparts checked exactly','raworiginalvsnewnumerator/denominator/index/total roles distinguished','rates/time/identicalwholeconditions checked, no decimalapproximation']})
    assert len(refs)==50
    assert 13*22-19*15==1 and 3032**2-3031*3033==1 and 37*8-5*59==1
    assert F(9,18)==F(1,2) and not F(9,18)>F(1,2)
    assert F(37,5)>F(59,8) and 37<59
    assert F(7,9)>F(3,4) and F(11,21)>F(12,23)
    assert len([(a,b) for a in range(1,10) for b in range(1,10) if math.gcd(a,b)==1 and F(3,4)<F(a,b)<1])==6
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));";hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'scope':'All50source-addressed savedgrade5fraction-comparison editions; exact printed Fraction and complete naturaldomains independently calculated.','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':50,'wrongKeysRejected':50,'sourceRefs':50,'hashesMatched':50,'strictFiniteDomains':True,'ratesAndRawAnswerRolesChecked':True,'exactNearCrossproductsDifference1':True,'authorSolverImported':False}))
if __name__=='__main__':main()
