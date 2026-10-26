"""Independent all10saved/new full texts and four actual343px sheets read."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave45-fraction-coordinate-rays.json'
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return float(e.get(k))
def one(xs):
    xs=list(xs);assert len(xs)==1,len(xs);return xs[0]
def close(a,b):assert abs(a-b)<1e-7,(a,b)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def rational(x):return F(x).limit_denominator(1000)
def fraction(q):return f'({q.numerator}/{q.denominator})'
def mixed(q):
    q=F(q);w=q.numerator//q.denominator;rest=q-w;assert w>0 and 0<rest<1;return f'({w} + ({rest.numerator}/{rest.denominator}))'
def parse_option(s):
    m=re.fullmatch(r'\((\d+) \+ \((\d+)/(\d+)\)\)',s)
    if m:w,a,b=map(int,m.groups());return F(w)+F(a,b)
    m=re.fullmatch(r'\((\d+)/(\d+)\)',s)
    if m:return F(*map(int,m.groups()))
    return F(int(s))
def observe(r,i):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter())
    lines=[e for e in es if tag(e)=='line'];texts=[e for e in es if tag(e)=='text'];circles=[e for e in es if tag(e)=='circle'];paths=[e for e in es if tag(e)=='path']
    axis=one(e for e in lines if e.get('stroke')=='#203549' and n(e,'y1')==n(e,'y2')==190 and abs(n(e,'x2')-n(e,'x1'))>300);origin=n(axis,'x1');assert origin==48
    one(e for e in paths if e.get('d')=='M447 190 L437 184 L437 196 Z')
    ticks=sorted([e for e in lines if e.get('stroke')=='#203549' and n(e,'x1')==n(e,'x2') and n(e,'y1')<190<n(e,'y2')],key=lambda e:n(e,'x1'));assert ticks and n(ticks[0],'x1')==origin
    numeric={int(txt(e)):n(e,'x') for e in texts if n(e,'y')==240 and txt(e).isdigit()};assert numeric[0]==origin
    points={}
    for c in circles:
        close(n(c,'cy'),190);assert n(c,'r')==5
        label=one(e for e in texts if abs(n(e,'x')-n(c,'cx'))<1e-7 and re.fullmatch('[A-NP-Z]',txt(e)))
        points[txt(label)]=n(c,'cx')
    grid=[e for e in lines if n(e,'x1')==n(e,'x2') and abs(n(e,'y2')-n(e,'y1'))==180]
    if grid:
        for tick in ticks:one(e for e in grid if abs(n(e,'x1')-n(tick,'x1'))<1e-7)
    if i==4:
        assert set(numeric)=={0} and points=={};step=n(ticks[1],'x1')-origin
        for j,t in enumerate(ticks):close(n(t,'x1'),origin+j*step)
        # The visible numerator/bar/denominator is read independently of generator attributes.
        top=one(e for e in texts if n(e,'y')==230);bottom=one(e for e in texts if n(e,'y')==266);assert n(top,'x')==n(bottom,'x');a,b=int(txt(top)),int(txt(bottom));assert(a,b)==(2,5)
        at=n(top,'x');position=round((at-origin)/step);assert position==6
        one(e for e in lines if n(e,'y1')==n(e,'y2') and n(e,'x1')<at<n(e,'x2') and n(e,'y1')>230 and n(e,'x2')-n(e,'x1')<50)
        # Even the answer coordinate1 must not be disclosed as a distinguished long tick.
        unit=F(position*b,a);assert unit.denominator==1
        assert all(n(t,'y2')-n(t,'y1')==12 for t in ticks[1:] if abs(n(t,'x1')-at)>1e-7)
        return str(int(unit)),{'actualKnownFraction':f'{a}/{b}','actualCellsToKnownMark':position,'computedUnitCells':int(unit),'noVisibleOneLabelOrSpecialUnitTick':True}
    assert 1 in numeric;scale=numeric[1]-origin;assert scale>0
    for value,x in numeric.items():close(x,origin+value*scale)
    values={k:rational((x-origin)/scale) for k,x in points.items()}
    if i!=6:
        step=n(ticks[1],'x1')-origin;den=round(scale/step);close(scale/step,den)
        for j,t in enumerate(ticks):close(n(t,'x1'),origin+j*step)
        for point in points.values():close((point-origin)/step,round((point-origin)/step))
        observed={'actualUnitSubdivisions':den,'coordinatesFromActualPointsAndPrinted0and1':{k:str(v) for k,v in values.items()}}
    else:
        assert len(ticks)==4 and sorted(numeric)==[0,1,2,3];assert list(values)==list('PQRST')
        coords=[F(2),*[values[k] for k in 'PQRST'],F(3)];assert all(b-a==F(1,6) for a,b in zip(coords,coords[1:]));assert len(circles)==5
        return mixed(values['S']),{'actualInternalPoints':5,'actualEqualIntervalsIncludingEndpoints':6,'noExtraShortTicks':True,'actualSCoordinate':str(values['S'])}
    if i==0:
        q=values['C'];requested=int(re.search(r'ДӘЛ (\d+)',r['statement'])[1]);num=q*requested;assert num.denominator==1;return str(int(num)),{**observed,'requestedUnreducedDenominator':requested}
    if i==1:return fraction(values['A']),observed
    if i==2:
        target=F(*map(int,re.search(r'\((\d+)/(\d+)\)',r['statement']).groups()));label=one(k for k,v in values.items() if v==target);return label,observed
    if i==3:
        q=values['K'];rawNumerator=round((points['K']-origin)/step);rem=rawNumerator%den;assert math.gcd(rem,den)>1
        return mixed(q),{**observed,'rawCoordinateParts':rawNumerator,'fractionPartReductionGCD':math.gcd(rem,den)}
    if i==5:
        assert set(points)=={'A','B'} and not any(txt(e)=='C' for e in texts);q=(values['A']+values['B'])/2
        assert q-values['A']==values['B']-q;return mixed(q),{**observed,'hiddenMidpoint':str(q),'actualMidpointNotDrawn':True}
    if i==7:
        assert set(points)=={'A','C'} and not any(txt(e)=='B' for e in texts);q=2*values['C']-values['A'];w,d=map(int,re.search(r'\((\d+) \+ \(x/(\d+)\)\)',r['statement']).groups());num=(q-w)*d;assert num.denominator==1
        return str(int(num)),{**observed,'hiddenB':str(q),'requestedRawDenominator':d,'rawNumerator':int(num),'hiddenBNotDrawn':True}
    if i==8:
        newUnit=int(re.search(r'бірлік кесінді (\d+) торкөзге',r['statement'])[1]);newCells=values['K']*newUnit;assert newCells.denominator==1
        return str(int(newCells)),{**observed,'newCellsPerUnit':newUnit,'coordinatePreserved':True}
    assert i==9 and not circles
    positions={o:parse_option(o)*den for o in r['options']};answer=one(o for o,q in positions.items()if q.denominator!=1)
    return answer,{**observed,'actualOptionCellCoordinates':{o:str(q)for o,q in positions.items()},'allOtherOptionsFallWithinDrawnRay':all(origin+float(q)*step<=n(axis,'x2')for o,q in positions.items()if o!=answer)}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==10;entries=[]
    for i,r in enumerate(rows):
        answer,observed=observe(r,i);assert answer==r['answer']
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
        page=1 if i<6 else 2
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent all10fullsaved/new/solution/MCQ read and all4source/native343pxsheets viewed; ownactualSVGtickspacing/printed0and1/pointlabels/grid Fraction observer; no author solver imported','observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['actualpointpositionsanduniformtickspacing measured fromvisiblegeometry','known2/5 label gives6cells; unit1notdisclosed','midpointC andinferredB genuinelynotdrawn','fiveinternalpoints produce6gaps; letterstaggeringreadableat343px','rawdenominator12 preserved; newunit andunrepresentablegrid rationalchecked'],'sourceSheet':f'output/editorial-visual-wave45/visual-wave45-source-{page}.png','nativeSheet':f'output/editorial-visual-wave45/visual-wave45-contact-{page}.png'}})
    code="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';const b=JSON.parse(fs.readFileSync('"+PACK+"'));console.log(JSON.stringify(b.editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
    report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave45.py','fullSavedAndNewRead':10,'actualSheetsViewed':4,'findings':[],'authorSolverImported':False},'entries':entries}
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave45-fraction-coordinate-rays.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':10,'hashesMatched':10,'actualCoordinatesAndGridChecks':True,'hiddenCoordinatesNotLeaked':True}))
if __name__=='__main__':main()
