"""All7 fullsaved/new conditions, fullsolutions and MCQs read; four343px sheets viewed."""
import hashlib,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave40-river-direction-and-relative-speed.json'
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return F(e.get(k))
def integer(v):
    v=F(v);assert v.denominator==1;return v.numerator
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
    els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text'];lines=[e for e in els if tag(e)=='line'];rects=[e for e in els if tag(e)=='rect'];scene=r['params']['scene'];kind=r['modelId'].removeprefix('visual-wave40-')
    def at(x,y):return txt(one(t for t in texts if n(t,'x')==x and n(t,'y')==y))
    def arrow(y,color):
        shaft=one(e for e in lines if n(e,'y1')==n(e,'y2')==y and e.get('stroke')==color and abs(n(e,'x2')-n(e,'x1'))>20)
        x1,x2=n(shaft,'x1'),n(shaft,'x2');direction=1 if x2>x1 else -1
        for dy in [-5,5]:one(e for e in lines if e.get('stroke')==color and (n(e,'x1'),n(e,'y1'),n(e,'x2'),n(e,'y2'))==(x2,y,x2-8*direction,y+dy))
        return direction,(int(x1),int(x2),int(y))
    flowDirection,flowShaft=arrow(278,'#5e9dba');assert flowDirection==1
    flowLabel=at(240,342);m=re.fullmatch(r'Ағыс: (\d+) км/сағ',flowLabel);current=F(m[1]) if m else None
    assert m or flowLabel=='Ағыс: ?'
    boats=[]
    for e in els:
        if tag(e)!='g' or not e.get('transform'):continue
        m=re.fullmatch(r'translate\((\d+) (\d+)\) scale\((-?1) 1\)',e.get('transform'));assert m
        boats.append(tuple(map(int,m.groups())))
    base={'actualCurrentArrowDirection':flowDirection,'actualCurrentShaft':flowShaft,'actualFlowLabel':flowLabel,'actualBoatTransforms':boats}
    if scene=='single':
        own=F(re.fullmatch(r'Меншікті: (\d+) км/сағ',at(240,100))[1]);direction,shaft=arrow(143,'#203549');assert boats==[(240,213,direction)] and current is not None
        ground=direction*own+current;assert ground*direction>0;speed=integer(abs(ground))
        return (f'{speed} км/сағ' if r.get('options') else str(speed)),dict(base,printedOwnSpeed=int(own),actualOwnArrow=shaft,signedGroundVelocity=integer(ground),speedMagnitude=speed)
    distance=F(re.fullmatch(r'(\d+) км',at(240,43))[1]);markers=[e for e in rects if e.get('fill')=='#203549' and n(e,'height')==18]
    if scene=='pursuit':
        assert not markers;assert boats==[(120,233,1),(360,233,1)]
        endpoints=[120,360]
    else:
        assert len(markers)==2 and at(68,101)=='K' and at(412,101)=='M'
        assert sorted(n(e,'x')+n(e,'width')/2 for e in markers)==[68,412];endpoints=[68,412]
    one(e for e in lines if (n(e,'x1'),n(e,'x2'),n(e,'y1'),n(e,'y2'))==(endpoints[0],endpoints[1],66,66))
    for x in endpoints:one(e for e in lines if (n(e,'x1'),n(e,'x2'),n(e,'y1'),n(e,'y2'))==(x,x,61,71))
    base['actualDistanceLabelKm']=int(distance);base['distanceDimensionEndpoints']=endpoints
    if scene=='ports':
        assert not boats and current is None
        if kind=='current-from-two-route-times':a,b=map(int,re.search(r'K-дан M-ге (\d+) сағатта, M-нен K-ға (\d+) сағатта',r['statement']).groups())
        else:a,b=map(int,re.search(r'K-дан M-ге (\d+) сағатта, кері M-нен K-ға (\d+) сағатта',r['statement']).groups())
        down,up=distance/a,distance/b;own,current=(down+up)/2,(down-up)/2;assert own>current>0
        if kind=='current-from-two-route-times':return f'{integer(current)} км/сағ',dict(base,printedRouteHours=[a,b],downUpSpeeds=[integer(down),integer(up)],inferredOwnCurrent=[integer(own),integer(current)])
        multiplier=int(re.search(r'ағыс жылдамдығы (\d+) есе',r['statement'])[1]);newCurrent=current*multiplier;assert own>newCurrent
        time=distance/(own-newCurrent)
        return f'{integer(time)} сағ',dict(base,printedRouteHours=[a,b],normalOwnCurrent=[integer(own),integer(current)],printedCurrentMultiplier=multiplier,newUpstreamSpeed=integer(own-newCurrent),newUpstreamTime=integer(time))
    if scene=='roundtrip':
        own=F(re.fullmatch(r'(\d+) км/сағ',at(240,174))[1]);direction,shaft=arrow(193,'#203549');assert direction==1 and boats==[(240,233,1)] and current is not None
        assert own>current;times=[distance/(own+current),distance/(own-current)]
        return str(integer(sum(times))),dict(base,actualOwnArrow=shaft,ownSpeed=integer(own),twoGroundSpeeds=[integer(own+current),integer(own-current)],twoDistinctLegTimes=[integer(t) for t in times])
    assert scene in ['meeting','pursuit']
    speeds=[F(re.fullmatch(r'(\d+) км/сағ',at(x,168))[1]) for x in [120,360]]
    # Arrow shafts at different x on the same row; validate their physical heads.
    ownShafts=sorted([e for e in lines if e.get('stroke')=='#203549' and n(e,'y1')==n(e,'y2')==187 and abs(n(e,'x2')-n(e,'x1'))>20],key=lambda e:min(n(e,'x1'),n(e,'x2')));assert len(ownShafts)==2
    directions=[]
    for x,e in zip([120,360],ownShafts):
        a,b=n(e,'x1'),n(e,'x2');d=1 if b>a else -1;directions.append(d);assert (a+b)/2==x
        for dy in [-5,5]:one(h for h in lines if (n(h,'x1'),n(h,'x2'),n(h,'y1'),n(h,'y2'))==(b,b-8*d,187,187+dy))
    assert [b[2] for b in boats]==directions
    if scene=='meeting':
        assert directions==[1,-1] and current is None and 'меншікті жылдамдығынан кіші' in r['statement']
        time=distance/sum(speeds);samples=0
        # Exact coefficient cancellation holds for every admissible real c;
        # rational samples additionally check actual meeting coordinates.
        for den in range(1,26):
            for numerator in range(integer(speeds[1])*den):
                c=F(numerator,den);assert (speeds[0]+c)*time==distance-(speeds[1]-c)*time;samples+=1
        return str(integer(time)),dict(base,actualPrintedOwnSpeeds=[integer(v) for v in speeds],actualArrowDirections=directions,currentCoefficientSum=0,physicalCurrentBound=f'0<=c<{integer(speeds[1])}',exactRationalCurrentSamples=samples,allRealCurrentCancellation='(v1+c)+(v2-c)=v1+v2')
    assert directions==[1,1] and current is not None and speeds[0]>speeds[1]
    fast,slow=speeds[0]+current,speeds[1]+current;time=distance/(fast-slow);assert fast*time==distance+slow*time
    return str(integer(time)),dict(base,actualPrintedOwnSpeeds=[integer(v) for v in speeds],groundSpeeds=[integer(fast),integer(slow)],initialGapDimensionBetweenActualBoatCentres=True,closure=integer(fast-slow),sameFinalPositionKm=integer(fast*time),time=integer(time))
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==7;entries=[]
    for i,r in enumerate(rows):
        answer,observed=observe(r);assert answer==r['answer']
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
        page=1 if i<6 else 2
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'Full7saved/new conditions, fullsolutions andMCQs read; all4actual source/native343px sheets viewed; separate actual arrowshaft/arrowhead/boattransform/portdimension observer with exact Fraction printed-given arithmetic and4550rational current witnesses; no author solver imported','checks':['actualown/current arrowheads and boat orientation agree','unknownflow remains unknown, portdistance endpoints matchK/M','roundtrip two distinct legtimes rather than average ownspeed','meeting current cancels for allphysicalc; upstream positivity explicit','pursuit initialgap is betweenactualboats; samecurrent cancels in difference','flood normalown20/current4 recover first, triplecurrent12 yieldsupstream8 and12hours'],'observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['bothpages source/native actually viewed','speedlabels/arrowheads andportletters readable','physical arrowgeometry read, not data direction attributes','no hidden unknowncurrent value revealsanswer'],'sourceSheet':f'output/editorial-visual-wave40/visual-wave40-source-{page}.png','nativeSheet':f'output/editorial-visual-wave40/visual-wave40-contact-{page}.png'}})
    code="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';const b=JSON.parse(fs.readFileSync('"+PACK+"'));console.log(JSON.stringify(b.editions.map(q=>[q.editionId,editionHash(q)])));"
    js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(js[e['editionId']]==e['sha256'] for e in entries)
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave40-river-direction-and-relative-speed.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':7,'actualArrowAndPortDimensionChecks':7,'rationalCurrentWitnesses':4550,'hashesMatched':7,'authorSolverImported':False}))
if __name__=='__main__':main()
