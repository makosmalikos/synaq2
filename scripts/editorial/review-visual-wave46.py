"""All six saved/new full conditions/solutions/options and two actual343px sheets read."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave46-common-denominator-figures.json'
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return float(e.get(k))
def one(xs):
    xs=list(xs);assert len(xs)==1,len(xs);return xs[0]
def close(a,b):assert abs(a-b)<1e-7,(a,b)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def fraction(q):return f'({q.numerator}/{q.denominator})'
def pair(s):
    m=re.fullmatch(r'\((\d+)/(\d+)\) және \((\d+)/(\d+)\)',s);assert m;return tuple(map(int,m.groups()))
def observe(r,i):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter())
    rects=[e for e in es if tag(e)=='rect' and e.get('stroke')=='#203549'];lines=[e for e in es if tag(e)=='line'];texts=[e for e in es if tag(e)=='text'];circles=[e for e in es if tag(e)=='circle']
    def at(x,y):return txt(one(e for e in texts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
    if i==0:
        assert len(circles)==5 and len(lines)==30;counts=[]
        for j,c in enumerate(circles):
            cx,cy,radius=n(c,'cx'),n(c,'cy'),n(c,'r');assert c.get('fill')=='#a6caed';close(radius,43)
            rays=[e for e in lines if abs(n(e,'x1')-cx)<1e-7 and abs(n(e,'y1')-cy)<1e-7];assert len(rays)==6;angles=[]
            for e in rays:close(math.hypot(n(e,'x2')-cx,n(e,'y2')-cy),radius);angles.append(math.atan2(n(e,'y2')-cy,n(e,'x2')-cx)%(2*math.pi))
            angles.sort()
            for k in range(6):close((angles[(k+1)%6]-angles[k])%(2*math.pi),math.pi/3)
            for other in circles[j+1:]:assert math.hypot(cx-n(other,'cx'),cy-n(other,'cy'))>2*radius
            counts.append(len(rays))
        denominator=int(re.search(r'ДӘЛ (\d+)',r['statement'])[1]);assert denominator==6
        return f'({len(circles)*denominator}/{denominator})',{'actualWholeCircles':5,'equalAngleSectorsPerCircle':counts,'requestedFixedDenominator':denominator}
    if i==1:
        assert len(rects)==16;xs=sorted(set(n(e,'x')for e in rects));ys=sorted(set(n(e,'y')for e in rects));assert len(xs)==len(ys)==4
        assert {(n(e,'x'),n(e,'y'))for e in rects}=={(100+70*c,40+70*r)for c in range(4)for r in range(4)}
        for e in rects:close(n(e,'width'),70);close(n(e,'height'),70)
        painted=sum(e.get('fill')=='#a6caed'for e in rects);assert painted==11;denominator=int(re.search(r'ДӘЛ (\d+)',r['statement'])[1]);factor=F(denominator,len(rects));assert factor.denominator==1
        return f'({int(painted*factor)}/{denominator})',{'actualEqualGridCells':16,'actualPaintedCells':painted,'fixedDenominator':denominator,'bothTermsMultiplier':int(factor)}
    if i in [2,3,5]:
        groups=[[e for e in rects if n(e,'y')==y]for y in sorted(set(n(e,'y')for e in rects))];assert len(groups)==2;parts=[];labels=[]
        for group in groups:
            group.sort(key=lambda e:n(e,'x'));width=n(group[0],'width');height=n(group[0],'height')
            close(n(group[0],'x'),54);close(n(group[-1],'x')+width,450)
            for e in group:close(n(e,'width'),width);close(n(e,'height'),height);assert e.get('fill')in['#a6caed','#fff']
            for a,b in zip(group,group[1:]):close(n(b,'x')-n(a,'x'),width)
            labels.append(at(26,n(group[0],'y')+35));parts.append((sum(e.get('fill')=='#a6caed'for e in group),len(group)))
        assert labels==(['D','M']if i==3 else ['A','B']);observed={'actualWholeLengthsBothPx':396,'actualPaintedAndTotalParts':parts,'actualLabelsInOrder':labels}
        if i==5:
            assert parts==[(12,30),(25,30)];q=[F(a,b)for a,b in parts];den=math.lcm(*(v.denominator for v in q));assert den==30
            for candidate in range(1,den):assert not all((v*candidate).denominator==1 for v in q)
            assert '(12/5) және (5/6)'in r['options'];assert 'Бөлімді ғана' in r['solution']
            return ' және '.join(fraction(v)for v in q),{**observed,'actualReductionGCDs':[math.gcd(a,b)for a,b in parts],'leastCommonDenominator':den,'wrongDenominatorOnlyOptionVerified':'12/5 from12/(30/6)'}
        q=[F(a,b)for a,b in parts];den=math.lcm(*(v.denominator for v in q));assert den==(28 if i==2 else 36)
        for candidate in range(1,den):assert not all((v*candidate).denominator==1 for v in q)
        numerators=[int(v*den)for v in q];answer=' және '.join(f'({a}/{den})'for a in numerators)
        assert parts==([(1,4),(1,7)]if i==2 else[(5,12),(7,18)])
        return answer,{**observed,'gcdOfOriginalDenominators':math.gcd(parts[0][1],parts[1][1]),'leastCommonDenominator':den,'everySmallerPositiveDenominatorRejected':True}
    assert i==4 and len(rects)==3
    top=one(e for e in rects if n(e,'y')==100);lower=sorted([e for e in rects if n(e,'y')==228],key=lambda e:n(e,'x'));assert len(lower)==2
    close(n(top,'x'),n(lower[0],'x'));close(n(top,'width'),n(lower[0],'width'));close(n(lower[0],'x')+n(lower[0],'width'),n(lower[1],'x'))
    start=n(lower[1],'x');end=start+n(lower[1],'width');one(e for e in lines if (n(e,'x1'),n(e,'y1'),n(e,'x2'),n(e,'y2'))==(start,302,end,302));difference=int(at((start+end)/2,337));assert difference==33
    assert at(49,133)=='a' and at(49,261)=='b' and at(240,59)=='Сызба масштабсыз';assert not any(txt(e)in ['44','77']for e in texts)
    a,b=map(int,re.search(r'бөлшегі \((\d+)/(\d+)\)',r['statement']).groups());unit=F(difference,b-a);assert unit.denominator==1;num=a*unit;den=b*unit;assert den-num==difference and F(num,den)==F(a,b)
    return str(int(num)),{'actualBracketCoversOnlyDifference':difference,'reducedRatioFromCondition':[a,b],'commonScale':int(unit),'hiddenNumerator':int(num),'hiddenDenominator':int(den),'answersNotWrittenOnSvg':True}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==6;entries=[]
    for i,r in enumerate(rows):
        answer,observed=observe(r,i);assert answer==r['answer']
        if r.get('options'):
            assert len(set(r['options']))==4 and r['options'].count(answer)==1
            if i in[2,3,5]:
                a,b,c,d=pair(answer);expected=[F(a,b),F(c,d)];valid=[]
                for o in r['options']:
                    x,y,z,t=pair(o)
                    if [F(x,y),F(z,t)]!=expected:continue
                    if i==5:
                        if math.gcd(x,y)==math.gcd(z,t)==1:valid.append(o)
                    elif y==t==math.lcm(expected[0].denominator,expected[1].denominator):valid.append(o)
                assert valid==[answer]
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent all6fullsaved/new/solution/MCQ read and allsource/native343pxfigures viewed; ownactualcircleangles/cellareas/barendpoints/fillcounts/labelbrackets observer, exactFraction and completeLCMminimality; no author solver imported','observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['actual5wholecircles×6equalsectors;16cellarea with11painted','bars same396pxwhole with counted equalcells andorderlabels','both coprime and sharedGCD6 common denominators independently verified minimal','differencebracket33 andno44/77answerleak','twoirreducibleoriginals withtwoactualGCDs; corrected12/5denominatoronlydistractor'],'sourceSheet':'output/editorial-visual-wave46/visual-wave46-source-1.png','nativeSheet':'output/editorial-visual-wave46/visual-wave46-contact-1.png'}})
    code="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';const b=JSON.parse(fs.readFileSync('"+PACK+"'));console.log(JSON.stringify(b.editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
    report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave46.py','fullSavedAndNewRead':6,'actualSheetsViewed':2,'resolvedFinding':'Lastrowincorrectdenominator-only distractor corrected6/5to12/5 and explanatorywording; other5unchanged and all6SVGunchanged.'},'entries':entries}
    if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave46-common-denominator-figures.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':6,'hashesMatched':6,'actualCellGeometryAndLcmMinimality':True,'orderedAndIrreducibleFormatOptions':True}))
if __name__=='__main__':main()
