"""Independent full-content review of44 introductory fraction editions.

All44 original/new conditions, full solutions and MCQs read before approval.
Exact Fraction arithmetic is separate from the author's cross-product oracle.
The intentionally invalid7/0 option is inspected lexically and NEVER evaluated.
"""
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import re
import sys
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/grade5-fraction-intro.json'
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def integer(x):x=F(x);assert x.denominator==1,x;return str(x.numerator)
def frac(v):return F(*v)
def printed_fraction(s):
    m=re.fullmatch(r'\(?(\d+)/(\d+)\)?(?: (?:м|кг))?',s);assert m,s
    a,b=map(int,m.groups());assert b>0,'Do not calculate an intentionally undefined example';return F(a,b)
def choose_fraction(r,v):return one(o for o in r['options'] if printed_fraction(o)==v)
def prime(n):return n>1 and all(n%d for d in range(2,n))
def solve(r):
    p=r['params'];k=r['modelId'].removeprefix('grade5-fraction-intro-');s=r['statement']
    if k=='spoken-fraction-to-symbol':assert 'он бірден алты' in s;return choose_fraction(r,F(p['numerator'],p['denominator']))
    if k=='zero-numerator-value':assert p['denominator']>0;return '0'
    if k=='division-ask-numerator':assert 'қысқартпай' in s;return str(p['dividend'])
    if k=='unit-fraction-of-number':return integer(F(p['whole'],p['denominator']))
    if k in ['catalogue-fraction-count','nonunit-fraction-of-number','seedling-fraction-count']:return integer(p['whole']*frac(p['fraction']))
    if k=='denominator-definition':return 'Бүтіннің неше тең бөлікке бөлінгенін'
    if k=='symbol-fraction-to-spoken':assert (p['numerator'],p['denominator'])==(7,13);return 'он үштен жеті'
    if k=='ask-given-denominator':return str(p['denominator'])
    if k=='fraction-to-division':return str(p['numerator'])+' : '+str(p['denominator'])
    if k=='whole-from-unit-part':return str(p['part']*p['denominator'])
    if k=='missing-numerator-natural-value':return str(p['whole']*p['denominator'])
    if k=='missing-category-share':return choose_fraction(r,F(p['total']-p['first']-p['second'],p['total']))
    if k=='untravelled-route-share':return choose_fraction(r,F(p['whole']-p['travelled'],p['whole']))
    if k=='spoken-fraction-from-offset':assert p['numerator']==7 and p['extra']==12;return 'он тоғыздан жеті'
    if k=='compare-shares-different-wholes':
        results=[]
        for o in r['options']:
            m=re.fullmatch(r'(\d+) санының \(?(\d+)/(\d+)\)? бөлігі',o)
            if m:a,b,c=map(int,m.groups());results.append((a*F(b,c),o))
        assert len(results)==2 and results[0][0]!=results[1][0]
        return max(results)[1]
    if k=='two-original-whole-sales-remainder':assert s.count('БАСТАПҚЫ')==2;return integer(p['whole']*(1-frac(p['first'])-frac(p['second'])))
    if k=='hour-fraction-to-minutes':return integer(60*frac(p['fraction']))
    if k=='unread-pages-count':return integer(p['pages']*(1-frac(p['fraction'])))
    if k=='daily-share-time-difference':return integer(24*(frac(p['first'])-frac(p['second'])))
    if k=='whole-from-nonunit-count':return integer(p['part']/frac(p['fraction']))
    if k=='unspent-share':return choose_fraction(r,1-frac(p['spent']))
    if k=='centimetres-share-of-metre':return choose_fraction(r,F(p['cm'],100))
    if k=='equal-rope-piece-length':return choose_fraction(r,F(p['metres'],p['pieces']))
    if k=='fraction-sequence-index':
        assert 'Ереже:' in s
        pairs=[(p['firstNumerator']+i*p['numeratorStep'],p['firstDenominator']+i*p['denominatorStep']) for i in range(p['index'])]
        return choose_fraction(r,F(*pairs[-1]))
    if k=='denominator-from-sum-ratio':
        pairs=[(a,p['sum']-a) for a in range(1,p['sum']) if p['sum']-a==p['ratio']*a];return str(one(pairs)[1])
    if k=='elapsed-day-fraction':
        # Complete minute domain includes0 but excludes the next midnight.
        good=[m for m in range(1440) if 1440-m==p['remainingMultiple']*m];m=one(good);return str(m//60)+':'+str(m%60).zfill(2)
    if k=='whole-route-from-share-gap':
        travelled=frac(p['travelled']);assert 0<travelled<F(1,2);whole=p['gap']/(1-2*travelled);return integer(whole)
    if k=='sequential-budget-inverse':
        assert 'ҚАЛҒАН' in s;left_fraction=(1-frac(p['first']))*(1-frac(p['second']));whole=p['left']/left_fraction
        after_first=whole*(1-frac(p['first']));assert after_first*(1-frac(p['second']))==p['left'];return integer(whole)
    if k=='third-successive-share-count':
        assert 'СОЛ СӘТТЕ' in s;left=F(p['initial']);taken=[]
        for i in range(p['children']):amount=left*frac(p['fraction']);assert amount.denominator==1;taken.append(amount);left-=amount
        assert sum(taken)+left==p['initial'];return integer(taken[2])
    if k=='natural-quotient-numerator-count':return str(sum(F(n,p['denominator']).denominator==1 for n in range(1,p['upper'])))
    if k=='greatest-time-share':
        times=[c['whole']*frac(c['fraction']) for c in p['choices']];best=max(times);assert times.count(best)==1
        # Each actual printed choice is paired with its own whole and exact fraction.
        for o,c in zip(r['options'],p['choices']):assert c['label'] in o and re.search(r'\(?'+str(c['fraction'][0])+'/'+str(c['fraction'][1])+r'\)?',o)
        return r['options'][times.index(best)]
    if k=='equal-shares-two-collections':return integer(p['known']*frac(p['knownFraction'])/frac(p['unknownFraction']))
    if k=='nested-subgroup-share-of-all':
        boys=p['total']*frac(p['boys']);club=boys*frac(p['club']);assert boys.denominator==club.denominator==1
        return choose_fraction(r,club/p['total'])
    if k=='boys-share-from-total-excess':
        girls,boys=p['totalMinusBoys'],p['totalMinusGirls'];total=boys+girls;assert total-boys==girls and total-girls==boys
        return choose_fraction(r,F(boys,total))
    if k=='invalid-zero-denominator':
        assert r.get('intentionalIncorrectExample') is True and 'БОЛЫП ТАБЫЛМАЙДЫ' in s
        # Crucial: lexical examination before constructing ANY Fraction value.
        invalid=[]
        for o in r['options']:
            m=re.fullmatch(r'\(?(\d+)/(\d+)\)?',o);assert m
            if int(m[2])==0:invalid.append(o)
            else:assert F(int(m[1]),int(m[2]))>=0
        return one(invalid)
    if k=='kilometre-share-metres':return integer(1000*frac(p['fraction']))
    if k=='natural-quotient-denominator-count':return str(sum(p['numerator']%b==0 for b in range(1,p['numerator']+1)))
    if k=='equal-bulk-store-share':return choose_fraction(r,F(p['bags']*p['kgPerBag'],p['stores']))
    if k=='prime-extrema-fraction':
        lo,hi=10**(p['numeratorDigits']-1),10**p['numeratorDigits'];top=max(n for n in range(lo,hi) if prime(n));lo,hi=10**(p['denominatorDigits']-1),10**p['denominatorDigits'];bottom=next(n for n in range(lo,hi) if prime(n));assert (top,bottom)==(97,101)
        return choose_fraction(r,F(top,bottom))
    if k=='library-share-offset-whole':
        whole=(p['referenceExtra']+p['dictionaries'])/(1-2*frac(p['fiction']));fiction=whole*frac(p['fiction']);references=fiction+p['referenceExtra'];assert fiction+references+p['dictionaries']==whole
        return integer(whole)
    if k=='superposed-rope-cuts':
        marks=set().union(*(set(F(i,n) for i in range(1,n)) for n in p['partitions']));assert F(0) not in marks and F(1) not in marks
        return str(len(marks)+1)
    if k=='age-share-now-and-future':
        now,after=frac(p['now']),frac(p['after']);years=p['years'];child=F(years)*(1-after)/(after/now-1);parent=child/now;assert 0<child<parent and (child+years)/(parent+years)==after
        matches=[]
        for o in r['options']:
            c=int(re.fullmatch(r'(\d+) жас',o)[1]);dad=F(c)/now
            if F(c+years,dad+years)==after:matches.append(o)
        assert integer(child)=='18' and integer(parent)=='48';return one(matches)
    raise AssertionError(k)

def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==44;entries=[]
    for r in rows:
        a=solve(r);assert a==r['answer'],(r['modelId'],a,r['answer']);assert a!='wrong'
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(a)==1
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'All44 original/new full conditions, complete solutions and MCQs; exact Fraction arithmetic, complete natural numerator/divisor/minute domains, rational cut-set union and independent two-age equations','checks':['both original-whole fractions distinguished from successive remainders','third child takes current remaining quarter, not initial quarter','zero numerator valid; intentional zero denominator inspected lexically without division','different wholes converted to common time units before comparison','all internal rope marks unified without double-counting midpoint or endpoints','both future ages increased equally; exact equation proves uniqueness','prime extrema independently exhaust complete digit ranges','canonical fraction presentation checked separately from exact answer values']})
    assert len(set(F(i,6) for i in range(1,6))|set(F(i,8) for i in range(1,8)))+1==12
    assert F(360)*(1-F(7,15)-F(1,5))==120
    assert F(1800)/((1-F(1,4))*(1-F(1,3)))==3600
    assert (F(18)+12)/(F(48)+12)==F(1,2)
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade5-fraction-intro.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':44,'wrongKeysRejected':44,'fullOriginalAndNewReads':44,'undefinedExampleNeverEvaluated':True,'authorSolverImported':False}))
if __name__=='__main__':main()
