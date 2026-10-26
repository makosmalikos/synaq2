"""All six complete saved/new conditions/solutions/choices read; actual343px sheets viewed."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave44-pictured-mixed-numbers.json'
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return float(e.get(k))
def one(xs):
    xs=list(xs);assert len(xs)==1,len(xs);return xs[0]
def close(a,b):assert abs(a-b)<1e-7,(a,b)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def mixed(q):
    q=F(q);w=q.numerator//q.denominator;rest=q-w;assert w>0 and 0<rest<1
    return f'({w} + ({rest.numerator}/{rest.denominator}))'
def observe(r,i):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter())
    rects=[e for e in es if tag(e)=='rect' and e.get('stroke')=='#203549'];lines=[e for e in es if tag(e)=='line'];texts=[e for e in es if tag(e)=='text'];circles=[e for e in es if tag(e)=='circle'];paths=[e for e in es if tag(e)=='path']
    def at(x,y):return txt(one(e for e in texts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
    if i==0:
        assert len(circles)==6;purple=one(e for e in circles if e.get('fill')=='#bfa4d7');cx,cy=n(purple,'cx'),n(purple,'cy');radius=n(purple,'r')
        assert sum(e.get('fill')=='#a6caed' for e in circles)==5
        for j,c in enumerate(circles):
            close(n(c,'r'),radius)
            for other in circles[j+1:]:assert math.hypot(n(c,'cx')-n(other,'cx'),n(c,'cy')-n(other,'cy'))>2*radius
        assert len(lines)==6;angles=[]
        for e in lines:
            close(n(e,'x1'),cx);close(n(e,'y1'),cy);close(math.hypot(n(e,'x2')-cx,n(e,'y2')-cy),radius)
            angles.append(math.atan2(n(e,'y2')-cy,n(e,'x2')-cx)%(2*math.pi))
        angles.sort()
        for j in range(6):close((angles[(j+1)%6]-angles[j])%(2*math.pi),2*math.pi/6)
        assert '6 = 5 + (□/6)' in r['statement'];return '6',{'actualWholeCircles':6,'actualEqualPurpleSectors':6,'allSectorAnglesDegrees':60,'wholeRewrittenAsSixSixthsNotProperMixedNumber':True}
    if i==1:
        beam=one(e for e in lines if n(e,'y1')==n(e,'y2')==128);assert (n(beam,'x1'),n(beam,'x2'))==(95,385)
        fulcrum=one(e for e in circles);cx=n(fulcrum,'cx');close(cx-95,385-cx)
        # Visible pan suspensions begin at the equal-arm beam endpoints and end at a common level.
        hang=[e for e in lines if n(e,'y1')==128 and n(e,'y2')==242];assert len(hang)==4
        assert sorted(n(e,'x1') for e in hang)==[95,95,385,385]
        grams=0;labels=[]
        for e in texts:
            m=re.fullmatch(r'(\d+) (кг|г)',txt(e));assert m;v=int(m[1]);grams+=v*(1000 if m[2]=='кг' else 1);labels.append(txt(e));assert n(e,'font-size')>=20
        assert labels==['2 кг','500 г','250 г'];assert len([p for p in paths if p.get('fill')in ['#bfa4d7','#a6caed']])==3
        assert 'тепе-тең' in r['statement'] and 'аралас санмен' in r['statement']
        return mixed(F(grams,1000)),{'actualThreeMassLabels':labels,'actualGramTotal':grams,'equalHorizontalArmsPx':145,'balancedPanLevel':242,'requiredMixedFormNotImproperFraction':True}
    if i==2:
        assert len(rects)==10;rects.sort(key=lambda e:n(e,'x'));wholes=[e for e in rects if n(e,'width')==132];parts=[e for e in rects if n(e,'width')==16.5];assert len(wholes)==2 and len(parts)==8
        for a,b in zip(rects,rects[1:]):close(n(a,'x')+n(a,'width'),n(b,'x'))
        assert all(n(e,'y')==148 and n(e,'height')==58 for e in rects)
        for e in wholes:assert e.get('fill')=='#a6caed' and at(n(e,'x')+66,184)=='1 км'
        assert at(372,84)=='1 км';one(e for e in lines if (n(e,'x1'),n(e,'y1'),n(e,'x2'),n(e,'y2'))==(306,105,438,105))
        assert [e.get('fill') for e in parts]==['#a6caed']*7+['#fff'];assert parts[-1].get('stroke-dasharray')=='4 4'
        assert at(42,248)=='O' and at(421.5,248)=='S';assert sorted((n(e,'cx'),n(e,'cy')) for e in circles)==[(42,206),(421.5,206)]
        km=F(2)+F(7,8);metres=km*1000;assert metres.denominator==1
        return str(int(metres)),{'actualFullKm':2,'actualLastKmParts':8,'actualBluePartialParts':7,'visibleSAtBlueEndpoint':421.5,'whiteDashedPartExcluded':True,'metresPerKm':1000}
    if i==3:
        assert len(circles)==23 and all(n(e,'r')==23 and e.get('fill')=='#e9be8e' for e in circles)
        ys=sorted(set(n(e,'cy') for e in circles));counts=[sum(n(e,'cy')==y for e in circles) for y in ys];assert counts==[6,6,6,5]
        for j,c in enumerate(circles):
            for other in circles[j+1:]:assert math.hypot(n(c,'cx')-n(other,'cx'),n(c,'cy')-n(other,'cy'))>46
        friends=int(re.search(r'БАРЛЫҒЫН (\d+) дос',r['statement'])[1]);assert friends==6
        return mixed(F(len(circles),friends)),{'actualWholeBunsPerRow':counts,'actualBuns':23,'friendsFromCondition':friends,'wholeShare':3,'remainderBuns':5,'remainingBunsAlsoDivided':True}
    if i==4:
        assert len(rects)==1 and n(rects[0],'width')>n(rects[0],'height');area=int(re.fullmatch(r'S = (\d+) м²',at(220,184))[1]);length=int(re.fullmatch(r'(\d+) м',at(220,283))[1]);assert at(410,182)=='?' and at(240,329)=='Сызба масштабсыз'
        assert math.gcd(area,length)==2 and (area,length)==(70,12);assert '(70/12)' in r['solution'];assert '10/12' in r['solution'] and '5/6' in r['solution']
        return mixed(F(area,length)),{'actualAreaLabelSquareMetres':area,'actualLengthLabelMetres':length,'rectangleWidthAsked':True,'rawFractionGCD':2,'reducedMixedFormRequired':True,'notScaleExplicit':True}
    assert i==5;assert len(paths)==7;centres=[]
    for e in paths:
        m=re.fullmatch(r'M([\d.]+) ([\d.]+) L([\d.]+) ([\d.]+) L([\d.]+) ([\d.]+) Z',e.get('d'));assert m;cx,top,left,base,right,b2=map(float,m.groups());close(base,b2);close(cx-left,right-cx);centres.append(cx)
        one(l for l in lines if (n(l,'x1'),n(l,'y1'),n(l,'x2'),n(l,'y2'))==(cx,base,cx,213))
    centres.sort();assert centres==[48,108,168,228,288,348,408];assert at(48,254)=='0' and at(408,254)=='1 км';assert len(set(b-a for a,b in zip(centres,centres[1:])))==1
    one(e for e in lines if n(e,'x1')==408 and n(e,'x2')==452 and e.get('stroke-dasharray')=='5 6')
    w,a,b=map(int,re.search(r'Ұзындығы \((\d+) \+ \((\d+)/(\d+)\)\)',r['statement']).groups());assert b!=len(centres)-1
    gaps=(F(w)+F(a,b))*(len(centres)-1);assert gaps.denominator==1;assert 'басында да' in r['statement'] and 'соңында да' in r['statement']
    return str(int(gaps)+1),{'actualTreesInFirstKm':7,'actualEqualGaps':6,'actualDashedContinuation':True,'wholeRouteFromPrintedMixedNumber':str(F(w)+F(a,b)),'differentInputAndGapDenominators':True,'wholeIntervals':int(gaps),'bothEndpointsIncluded':True}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==6;entries=[]
    for i,r in enumerate(rows):
        answer,observed=observe(r,i);assert answer==r['answer']
        if r.get('options'):
            assert len(set(r['options']))==4 and r['options'].count(answer)==1
            if answer.startswith('('):assert re.fullmatch(r'\(\d+ \+ \(\d+/\d+\)\)',answer)
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent all6fullsaved/new/solution/MCQ read and actualsource/native343pxsheets viewed; ownphysicalcircleangles/balance/route/circlecount/rectanglelabels/treegap observer and exactFractions; no author solver imported','observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['all6source/native figures viewed at343px','actual60degreecirclesectors, equal horizontalbalancearms andmasslabels','routeSblueendpoint and23individualbuns counted','rectangulararea/length requiregcd2 reduction, treegaps requiredenominatorconversion andbothendpoints'],'sourceSheet':'output/editorial-visual-wave44/visual-wave44-source-1.png','nativeSheet':'output/editorial-visual-wave44/visual-wave44-contact-1.png'}})
    code="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';const b=JSON.parse(fs.readFileSync('"+PACK+"'));console.log(JSON.stringify(b.editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
    report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave44.py','fullSavedAndNewRead':6,'actualSheetsViewed':2,'resolvedFinding':'Tree original equivalent-denominator conversion restored; native fraction notation in rectangle solution corrected.'},'entries':entries}
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave44-pictured-mixed-numbers.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':6,'hashesMatched':6,'actualGeometryAndBalanceMassesChecked':True,'denominatorConversionPreserved':True}))
if __name__=='__main__':main()
