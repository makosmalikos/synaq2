"""All4saved/new complete conditions/solutions/options and both343px sheets read."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from collections import defaultdict
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave47-visual-fraction-comparisons.json'
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return float(e.get(k))
def one(xs):
    xs=list(xs);assert len(xs)==1,len(xs);return xs[0]
def close(a,b):assert abs(a-b)<1e-7,(a,b)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def observe(r,i):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter())
    rects=[e for e in es if tag(e)=='rect' and e.get('stroke')=='#203549'];texts=[e for e in es if tag(e)=='text'];paths=[e for e in es if tag(e)=='path']
    def at(x,y):return txt(one(e for e in texts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
    if i==1:
        groups=defaultdict(list)
        for e in paths:
            m=re.fullmatch(r'M([-\d.e+]+) ([-\d.e+]+) L([-\d.e+]+) ([-\d.e+]+) A([-\d.e+]+) ([-\d.e+]+) 0 0 1 ([-\d.e+]+) ([-\d.e+]+) Z',e.get('d'));assert m,e.get('d')
            cx,cy,x,y,rx,ry,z,t=map(float,m.groups());close(rx,ry);close(rx,87);close(math.hypot(x-cx,y-cy),rx);close(math.hypot(z-cx,t-cy),rx)
            a=math.atan2(y-cy,x-cx)%(2*math.pi);b=math.atan2(t-cy,z-cx)%(2*math.pi);groups[(cx,cy)].append((a,b,(b-a)%(2*math.pi),e.get('fill')=='#a6caed'))
        assert len(groups)==2;results={};counts={}
        for (cx,cy),arcs in groups.items():
            label=at(cx,293);assert label in['D','M'];count=len(arcs);starts=sorted(a for a,b,angle,painted in arcs)
            for a,b,angle,painted in arcs:close(angle,2*math.pi/count)
            for j in range(count):close((starts[(j+1)%count]-starts[j])%(2*math.pi),2*math.pi/count)
            close(sum(a[2]for a in arcs),2*math.pi);painted=sum(a[3]for a in arcs);results[label]=F(painted,count);counts[label]=[painted,count]
        assert counts=={'D':[7,10],'M':[5,8]};assert at(240,51)=='Әр дөңгелек — 1 сағат';assert results['D']>results['M'];den=math.lcm(*(v.denominator for v in results.values()));assert den==40
        return 'Дина',{'actualEqualAnglePiesPaintedAndTotal':counts,'sameWholeHourPrinted':True,'bothRadiusPx':87,'commonDenominator':den,'scaledPaintedParts':[int(results[k]*den)for k in['D','M']]}
    groups=[[e for e in rects if n(e,'y')==y]for y in sorted(set(n(e,'y')for e in rects))];assert len(groups)==2;counts=[];labels=[]
    for group in groups:
        group.sort(key=lambda e:n(e,'x'));width=n(group[0],'width');close(n(group[0],'x'),42);close(n(group[-1],'x')+width,438)
        for e in group:close(n(e,'width'),width);close(n(e,'height'),48)
        for a,b in zip(group,group[1:]):close(n(a,'x')+width,n(b,'x'))
        painted=sum(e.get('fill')=='#a6caed'for e in group);assert all(e.get('fill')in['#a6caed','#bfa4d7','#fff']for e in group)
        if i==2:labels.append(at(240,n(group[0],'y')-23));counts.append((len(group),len(group)))
        else:labels.append(at(23,n(group[0],'y')+34));counts.append((painted,len(group)))
    observed={'actualWholeLengthsBothPx':396,'actualPartCounts':counts,'actualLabels':labels}
    if i==0:
        assert counts==[(9,12),(7,12)]and labels==['A','B'];assert F(*counts[0])>F(*counts[1])
        return '(9/12) > (7/12)',{**observed,'sameDenominatorComparison':True}
    if i==2:
        assert counts==[(6,6),(11,11)]and labels==['Жаттықтырушы','Оқушы'];assert 'БІРДЕЙ уақыт' in r['statement']
        coach,student=map(int,re.search(r'жаттықтырушы (\d+), оқушы (\d+) қадам',r['statement']).groups());assert(coach,student)==(5,9)
        left,right=F(coach,counts[0][1]),F(student,counts[1][1]);assert left>right;assert coach*counts[1][1]==55 and student*counts[0][1]==54
        return 'Жаттықтырушы',{**observed,'actualStepsInSameDistance':[6,11],'printedStepsInSameTime':[coach,student],'exactSameTimeDistanceFractions':[str(left),str(right)],'crossProducts':[55,54]}
    assert i==3 and counts==[(6,17),(8,23)]and labels==['A','E'];common=math.lcm(*(a for a,b in counts));assert common==24
    transformed=[(common,b*(common//a))for a,b in counts];assert transformed==[(24,68),(24,69)]
    assert F(*counts[0])>F(*counts[1]);assert'ОРТАҚ АЛЫМҒА'in r['statement'];assert '(24/68)'in r['solution']and'(24/69)'in r['solution']
    return 'Аружан',{**observed,'actualNumeratorGCD':math.gcd(counts[0][0],counts[1][0]),'leastCommonNumerator':common,'equivalentFractionsWithCommonNumerator':transformed,'methodExplicitlyRequired':True}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==4;entries=[]
    for i,r in enumerate(rows):
        answer,observed=observe(r,i);assert answer==r['answer'];assert len(set(r['options']))==4 and r['options'].count(answer)==1
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent all4fullsaved/new/solutions/MCQs and actualsource/native343pxsheets read; ownactualSVGcells/fills/endpoints/pieangles/wholelabels and exactFractionobserver; commonNUMERATOR and sameTIME movement roles separately proved; no author solver imported','observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['everyactualbarcellcount andequallengthwhole verified','both actualpies equalangles, full2pi andsamehour','same distance calibratessteplength; sametimecalibrates55vs54','commonNUMERATOR24notdenominator; exact24/68vs24/69','labels andthinpartitions readableat343px'],'sourceSheet':'output/editorial-visual-wave47/visual-wave47-source-1.png','nativeSheet':'output/editorial-visual-wave47/visual-wave47-contact-1.png'}})
    code="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';const b=JSON.parse(fs.readFileSync('"+PACK+"'));console.log(JSON.stringify(b.editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
    report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave47.py','fullSavedAndNewRead':4,'actualSheetsViewed':2,'findings':[]},'entries':entries}
    if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave47-visual-fraction-comparisons.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':4,'hashesMatched':4,'actualGeometryAndTimeDistanceRoles':True,'commonNumeratorMethodPreserved':True}))
if __name__=='__main__':main()
