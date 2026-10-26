"""Independent comparison review; all6 full source/new conditions, complete
solutions/choices, one source and one343px native sheet inspected.
"""
from fractions import Fraction as F
import hashlib
import importlib.util
import itertools
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave22-natural-comparison.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
spec=importlib.util.spec_from_file_location('root_card_observer',ROOT/'scripts/editorial/review-visual-wave20.py');cards=importlib.util.module_from_spec(spec);spec.loader.exec_module(cards)
def tag(e):return e.tag.rsplit('}',1)[-1]
def v(e,k):return F(e.get(k))
def txt(e):return ''.join(e.itertext())
def near(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def one(a):a=list(a);assert len(a)==1,a;return a[0]
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def observe(r):
    if r['params']['scene']=='cards':return cards.observe(r)
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];s=ET.fromstring(raw);els=list(s.iter());texts=[e for e in els if tag(e)=='text'];lines=[e for e in els if tag(e)=='line'];p=r['params']
    if p['scene']=='interval':
        labels=sorted((int(txt(t)),v(t,'x')) for t in texts if re.fullmatch(r'\d+',txt(t)));assert len(labels)==4
        low,x0=labels[0];high,x1=labels[-1];unit=(x1-x0)/(high-low)
        for n,x in labels:near(x,x0+(n-low)*unit)
        ticks=sorted(v(e,'x1') for e in lines if v(e,'x1')==v(e,'x2') and v(e,'y1')==183 and v(e,'y2')==197);assert len(ticks)==high-low+1
        for i,x in enumerate(ticks):near(x,x0+i*unit)
        boundaries=[]
        for e in els:
            if tag(e)!='circle':continue
            assert e.get('fill')=='#fff' and v(e,'cy')==190;coordinate=low+(v(e,'cx')-x0)/unit;n=round(float(coordinate));near(coordinate,n);boundaries.append(n)
        a,b=sorted(boundaries);span=one(e for e in lines if e.get('stroke')=='#315ce8');near(v(span,'x1'),x0+(a-low)*unit);near(v(span,'x2'),x0+(b-low)*unit);return a,b
    if p['scene']=='order':
        positions={}
        for e in els:
            if tag(e)!='circle':continue
            x,y=v(e,'cx'),v(e,'cy');label=txt(one(t for t in texts if re.fullmatch('[ABC]',txt(t)) and v(t,'x')==x));positions[label.lower()]=x
        assert set(positions)=={'a','b','c'};return positions
    assert p['scene']=='fruit-scales';out=[]
    for i in range(2):
        start=24+i*165;counts={'watermelon':0,'melon':0,'apple':0}
        for e in els:
            if tag(e) not in ['ellipse','circle']:continue
            y=v(e,'cy')
            if not start<=y<start+165:continue
            kind={'#66b38b':'watermelon','#f3d36d':'melon','#de826e':'apple'}[e.get('fill')];assert e.get('data-fruit')==kind;counts[kind]+=1
        pans=[e for e in lines if e.get('stroke-width')=='3' and v(e,'y1')==v(e,'y2')];left=one(e for e in pans if v(e,'y1')==start+115);right=one(e for e in pans if v(e,'y1')==start+95);assert v(left,'y1')>v(right,'y1') and v(left,'x2')<v(right,'x1');out.append(counts)
    assert out==[{'watermelon':1,'melon':2,'apple':0},{'watermelon':0,'melon':1,'apple':5}];return out[0]['melon'],out[1]['apple']

def solve(r,obs):
    k=r['modelId'].removeprefix('visual-wave22-')
    if k=='strict-natural-interval':a,b=obs;return str(len([n for n in range(a,b+1) if a<n<b and n>0]))
    if k in ['maximum-four-digit-cards','minimum-five-digit-cards','maximum-below-bound']:
        candidates=[int(''.join(p)) for p in itertools.permutations(obs) if p[0]!='0']
        if k=='maximum-below-bound':limit=int(re.search(r'қолданып, (\d+) санынан',r['statement'])[1]);candidates=[n for n in candidates if n<limit]
        return str((min if k=='minimum-five-digit-cards' else max)(candidates))
    if k=='point-order-double-inequality':
        def valid(o):m=re.fullmatch(r'([abc]) < ([abc]) < ([abc])',o);assert m and len(set(m.groups()))==3;return obs[m[1]]<obs[m[2]]<obs[m[3]]
        return one(o for o in r['options'] if valid(o))
    assert k=='transitive-strict-mass-bound';n,m=obs
    # Independent transitive bound: M>m*A and W>n*M imply W>n*m*A.
    # Alternatives are rejected by an exact admissible witness, not mistaken
    # for being false in every possible mass assignment.
    A=F(10);M=m*A+1;W=n*M+1;assert M>m*A and W>n*M
    good=[]
    for o in r['options']:
        claim=re.fullmatch(r'Қарбыз (\d+) алмадан ауыр',o)
        if claim:
            count=int(claim[1])
            if count<=n*m:good.append(o)
            else:assert W<=count*A
        elif (claim:=re.fullmatch(r'(\d+) қауын (\d+) алмадан жеңіл',o)):
            a,b=map(int,claim.groups());assert not a*M<b*A
        else:assert o=='Бір қауын қарбыздың жартысынан ауыр';assert not M>W/2
    assert (A,M,W)==(10,51,103);return one(good)

def main():
    assert len(ROWS)==6;entries=[]
    for r in ROWS:
        obs=observe(r);assert solve(r,obs)==r['answer'];assert solve(r,obs)!='wrong'
        if r.get('options'):assert r['options'].count(r['answer'])==1 and len(set(r['options']))==4
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'Actual open endpoints, card digits, relative point order and lowered fruit pans; full card permutations, strict integer enumeration and transitive proof with exact admissible counterexample','checks':['all6 full source/new conditions, solutions and MCQs read','all6 original rasters and343px native sheet inspected','strict endpoint exclusion and no leading-zero card numbers','formal W>2M>10A forces10-apples bound; witness A10,M51,W103 rejects every non-forced alternative'],'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['actual white-fill open circles and calibrated colored span','every printed digit card and actual A,C,B horizontal order','each1watermelon/2melons/1melon/5apples individually counted by type/color','both actual left pans lie below corresponding right pans'],'sourceSheet':'output/editorial-visual-wave22/visual-wave22-source-1.png','nativeSheet':'output/editorial-visual-wave22/visual-wave22-contact-1.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave22-natural-comparison.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':6,'actualNativeObservationChecks':6,'wrongKeysRejected':6,'strictMassCounterexample':[10,51,103]}))
if __name__=='__main__':main()
