"""All4saved/new full texts and all source/native343px figures read; final correction reread."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave43-fraction-types-and-measures.json'
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return float(e.get(k))
def one(xs):
    xs=list(xs);assert len(xs)==1,len(xs);return xs[0]
def close(a,b):assert abs(a-b)<1e-7,(a,b)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def frac(a,b):
    q=F(a,b);return f'({q.numerator}/{q.denominator})'
def observe(r,i):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter())
    rects=[e for e in es if tag(e)=='rect' and e.get('stroke')=='#203549'];lines=[e for e in es if tag(e)=='line'];texts=[e for e in es if tag(e)=='text']
    def at(x,y):return txt(one(e for e in texts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
    if i==0:
        assert len(rects)==6;rects.sort(key=lambda e:n(e,'x'))
        assert [e.get('fill') for e in rects]==['#a6caed','#bfa4d7']*3
        for e in rects:close(n(e,'width'),66);close(n(e,'height'),66);close(n(e,'y'),126)
        for a,b in zip(rects,rects[1:]):close(n(a,'x')+n(a,'width'),n(b,'x'))
        labels=sorted((int(txt(e)),n(e,'x')) for e in texts if n(e,'y')==252);assert [v for v,x in labels]==list(range(12))
        for v,x in labels:
            close(x,42+36*v);one(e for e in lines if (n(e,'x1'),n(e,'y1'),n(e,'x2'),n(e,'y2'))==(x,211,x,224))
        close(n(rects[0],'x'),labels[0][1]);close(n(rects[-1],'x')+n(rects[-1],'width'),labels[-1][1]);assert at(240,302)=='метр'
        part=F(11,6);assert part>1
        return 'Бұрыс бөлшек, 1 м-ден артық',{'actualRibbonEqualParts':6,'actualMetreScaleWhole':11,'equalMetreIntervals':11,'eachPartMetres':str(part),'improperAndGreaterThanOne':True}
    if i==1:
        outers=[e for e in rects if e.get('fill')=='none'];cells=[e for e in rects if e.get('fill')!='none'];assert len(outers)==5 and len(cells)==30
        for j,o in enumerate(outers):
            close(n(o,'width'),84);close(n(o,'height'),84)
            inside=[e for e in cells if n(o,'x')<=n(e,'x') and n(e,'x')+n(e,'width')<=n(o,'x')+84 and n(o,'y')<=n(e,'y') and n(e,'y')+n(e,'height')<=n(o,'y')+84];assert len(inside)==6
            assert len(set(n(e,'x') for e in inside))==3 and len(set(n(e,'y') for e in inside))==2
            assert {(n(e,'x'),n(e,'y')) for e in inside}=={(n(o,'x')+28*c,n(o,'y')+42*r) for c in range(3) for r in range(2)}
            for e in inside:close(n(e,'width'),28);close(n(e,'height'),42);assert e.get('fill')=='#a6caed'
            for other in outers[j+1:]:assert n(o,'x')+84<=n(other,'x') or n(other,'x')+84<=n(o,'x') or n(o,'y')+84<=n(other,'y') or n(other,'y')+84<=n(o,'y')
        denominator=int(re.search(r'ДӘЛ (\d+)',r['statement'])[1]);assert denominator==6
        return str(len(outers)*denominator),{'actualSeparateSquareWholes':5,'actualEqualCellsPerSquare':6,'actualEqualCellsTotal':30,'noOverlapAndFullSixCellPartition':True,'prescribedDenominator':denominator}
    if i==2:
        pivot=one(e for e in es if tag(e)=='circle');cx,cy=n(pivot,'cx'),n(pivot,'cy');needle=one(e for e in lines if abs(n(e,'x1')-cx)<1e-7 and abs(n(e,'y1')-cy)<1e-7)
        ticks=[e for e in lines if e is not needle];assert len(ticks)==21
        theta=lambda x,y:math.degrees(math.atan2(cy-y,x-cx))
        ordered=sorted(ticks,key=lambda e:theta(n(e,'x2'),n(e,'y2')),reverse=True)
        for j,e in enumerate(ordered):
            close(theta(n(e,'x2'),n(e,'y2')),180-9*j);close(theta(n(e,'x1'),n(e,'y1')),180-9*j)
            length=math.hypot(n(e,'x2')-n(e,'x1'),n(e,'y2')-n(e,'y1'));close(length,21 if j%2==0 else 12)
        numeric=[e for e in texts if txt(e).isdigit()];assert sorted(int(txt(e)) for e in numeric)==list(range(0,1001,200))
        for e in numeric:close(theta(n(e,'x'),n(e,'y')-8),180-int(txt(e))*180/1000)
        angle=theta(n(needle,'x2'),n(needle,'y2'));close(angle,27);value=round((180-angle)/9)*50;assert value==850
        one(e for e in ordered if abs(theta(n(e,'x2'),n(e,'y2'))-angle)<1e-7)
        assert '50 г' in r['statement'] and 'нөлге теңестірілген' in r['statement']
        return frac(value,1000),{'actualTickCount':21,'actualTickStepGrams':50,'actualNeedleAngleDegrees':angle,'actualScaleReadGrams':value,'gramPerKilogram':1000,'reductionGCD':math.gcd(value,1000),'tareExcludedExplicitly':True}
    assert i==3 and len(rects)==3
    upper=sorted([e for e in rects if n(e,'y')==104],key=lambda e:n(e,'x'));lower=one(e for e in rects if n(e,'y')==222);assert len(upper)==2
    close(n(upper[0],'x'),n(lower,'x'));close(n(upper[0],'width'),n(lower,'width'));close(n(upper[0],'x')+n(upper[0],'width'),n(upper[1],'x'))
    assert at(50,138)=='a' and at(50,256)=='b';difference=int(at(n(upper[1],'x')+n(upper[1],'width')/2,138));total=int(at(449,197))
    one(e for e in lines if (n(e,'x1'),n(e,'y1'),n(e,'x2'),n(e,'y2'))==(408,104,408,270));assert at(240,326)=='Сызба масштабсыз'
    num=F(total+difference,2);den=F(total-difference,2);assert num.denominator==den.denominator==1;num=int(num);den=int(den);g=math.gcd(num,den);assert g>1
    assert (total,difference,num,den,g)==(44,8,26,18,2)
    assert '26 : 2 = 13' in r['solution'] and '18 : 2 = 9' in r['solution']
    return frac(num,den),{'actualDifferenceLabel':difference,'actualSumBracket':total,'rawNumerator':num,'rawDenominator':den,'actualReductionGCD':g,'originalSkillReductionRetained':True,'notScaleExplicit':True}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==4;entries=[]
    for i,r in enumerate(rows):
        answer,observed=observe(r,i);assert answer==r['answer']
        if r.get('options'):assert r['options'].count(answer)==1 and len(set(r['options']))==4
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent all4fullsaved/new/solution/MCQ read and source/native343px sheets viewed; ownactualSVGgeometry/ruler/scaleangles/fills/labels and exactFraction observer; no author solver imported','observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['allsource/native images viewed at343px','rulerwhole11/6parts andfivephysicalwholes each6equalcells','actual21radialticks and850gneedle; tare and1000g/kg','sum44difference8 gives26/18 requiringgcd2 reduction; finalchangedrow fullread again'],'sourceSheet':'output/editorial-visual-wave43/visual-wave43-source-1.png','nativeSheet':'output/editorial-visual-wave43/visual-wave43-contact-1.png'}})
    code="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';const b=JSON.parse(fs.readFileSync('"+PACK+"'));console.log(JSON.stringify(b.editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
    report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave43.py','fullSavedAndNewRead':4,'actualSheetsViewed':2,'resolvedFinding':'Originally13/9alreadyreduced lost source reduction step; onlytarget changed tosum44/diff8 so26/18 needsactualgcd2; finalsolution/figure reread. Other3unchanged.'},'entries':entries}
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave43-fraction-types-and-measures.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':4,'hashesMatched':4,'actualGeometryAndGaugeChecked':True,'actualReductionStepRetained':True}))
if __name__=='__main__':main()
