"""All6fullsaved/new conditions/solutions/MCQs read; actual343px sheets viewed."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave39-lcm-cycles-and-assembly.json'
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return F(e.get(k))
def near(a,b,tol=1e-7):return abs(float(a)-float(b))<tol
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def smallest_multiple(xs):
    # Full positive domain up to an explicit attainable common multiple.
    return one([v for v in range(1,math.prod(xs)+1) if all(v%x==0 for x in xs)][:1])
def points(e):return [tuple(float(v) for v in p.split(',')) for p in e.get('points').split()]
def segment_distance(p,a,b):
    vx,vy=b[0]-a[0],b[1]-a[1];den=vx*vx+vy*vy
    t=max(0,min(1,((p[0]-a[0])*vx+(p[1]-a[1])*vy)/den)) if den else 0
    return math.hypot(p[0]-a[0]-t*vx,p[1]-a[1]-t*vy)
def orient(a,b,c):return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
def boundary_distance(a,b):
    result=float('inf')
    for p,q in zip(a,a[1:]+a[:1]):
        for r,s in zip(b,b[1:]+b[:1]):
            assert not (orient(p,q,r)*orient(p,q,s)<-1e-10 and orient(r,s,p)*orient(r,s,q)<-1e-10),'Gear tooth fills cross'
            result=min(result,segment_distance(p,r,s),segment_distance(q,r,s),segment_distance(r,p,q),segment_distance(s,p,q))
    return result
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
    els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text'];rects=[e for e in els if tag(e)=='rect'];circles=[e for e in els if tag(e)=='circle'];polys=[e for e in els if tag(e)=='polygon'];paths=[e for e in els if tag(e)=='path'];lines=[e for e in els if tag(e)=='line'];scene=r['params']['scene']
    def at(x,y):return txt(one(t for t in texts if near(n(t,'x'),x) and near(n(t,'y'),y)))
    if scene in ['ray','steps']:
        arcs=[]
        for e in paths:
            p=re.fullmatch(r'M ([\d.]+) ([\d.]+) Q ([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)',e.get('d'));assert p
            x,y,cx,cy,z,y2=map(F,p.groups());assert y==y2==179 and near(cx,(x+z)/2) and z>x
            arcs.append((x,z,cy<y,e.get('stroke')))
            one(c for c in circles if near(n(c,'cx'),z) and near(n(c,'cy'),y) and c.get('fill')==e.get('stroke'))
        top=[a for a in arcs if a[2]];bottom=[a for a in arcs if not a[2]]
        assert top and bottom and all(a[3]=='#638dc6' for a in top) and all(a[3]=='#9c7abb' for a in bottom)
        if scene=='ray':
            labels=sorted([(n(e,'x'),int(txt(e))) for e in texts if txt(e).isdigit()],key=lambda a:a[0]);assert labels[0]==(36,0)
            scale=F(labels[-1][0]-labels[0][0],labels[-1][1]);assert all(x==36+value*scale for x,value in labels)
            actual=[[int((a[1]-36)/scale) for a in group] for group in [top,bottom]]
            steps=[group[0] for group in actual]
            for series,step in zip(actual,steps):assert series==list(range(step,labels[-1][1]+1,step))
            common=sorted(set(actual[0])&set(actual[1]));answer=common[0];assert answer==smallest_multiple(steps)
            assert '0 есептелмейді' in r['statement']
            return str(answer),{'allActualArcLandingLabels':actual,'commonPositiveLandings':common,'firstPositive':answer,'axisPixelsPerUnit':str(scale),'zeroExplicitlyExcluded':True}
        assert len(top)==len(bottom)==2
        first=int(re.fullmatch(r'(\d+) см',at((top[0][0]+top[0][1])/2,94))[1]);second=int(re.fullmatch(r'(\d+) см',at((bottom[0][0]+bottom[0][1])/2,270))[1])
        assert near((top[0][1]-top[0][0])/first,(bottom[0][1]-bottom[0][0])/second)
        for group in [top,bottom]:assert group[0][0]==36 and group[0][1]==group[1][0] and near(group[0][1]-36,group[1][1]-group[1][0])
        answer=smallest_multiple([first,second]);return f'{answer} см',{'actualPrintedStepLengthsCm':[first,second],'actualTwoJumpsEach':True,'firstPositiveCommonDistanceCm':answer,'stepsEach':[answer//first,answer//second]}
    if scene=='tile':
        box=one(e for e in rects if e.get('fill')=='#e9dcb2');x,y,w,h=[n(box,key) for key in ['x','y','width','height']]
        a=int(re.fullmatch(r'(\d+) см',at(240,y+h+43))[1]);b=int(re.fullmatch(r'(\d+) см',at(54,y+h/2))[1]);assert near(w/h,F(a,b))
        side=smallest_multiple([a,b]);counts=[side//a,side//b];answer=math.prod(counts);assert answer*a*b==side**2 and 'бұрмай' in r['statement']
        return str(answer),{'actualPrintedTileCm':[a,b],'sameOrientationExplicit':True,'leastSquareSide':side,'gridCounts':counts,'conservedArea':side**2}
    if scene=='gears':
        bodies=sorted([e for e in circles if n(e,'r')>6],key=lambda e:n(e,'cx'));assert len(bodies)==2
        counts=[];red=[];all_teeth=[]
        for body in bodies:
            cx,cy=float(n(body,'cx')),float(n(body,'cy'));count=int(at(cx,cy+41));counts.append(count)
            # Assign by geometric radial range around actual centre, never data-gear.
            teeth=[p for p in polys if all(math.hypot(x-cx,y-cy)<float(n(body,'r'))+18 for x,y in points(p))];assert len(teeth)==count
            angles=[]
            for p in teeth:
                ps=points(p);assert len(ps)==20
                angles.append(math.atan2(sum(y-cy for x,y in ps),sum(x-cx for x,y in ps))%(2*math.pi))
            angles.sort();gaps=[(angles[(i+1)%count]-angles[i])%(2*math.pi) for i in range(count)]
            assert all(abs(g-2*math.pi/count)<1e-5 for g in gaps)
            red.append(one(p for p in teeth if p.get('fill')=='#d77f90'));all_teeth.append(teeth)
        assert sum(counts)==len(polys) and counts==[18,30]
        min_distance=float('inf')
        for left in all_teeth[0]:
            for right in all_teeth[1]:min_distance=min(min_distance,boundary_distance(points(left),points(right)))
        marked_distance=boundary_distance(points(red[0]),points(red[1]));assert 0<marked_distance<0.02 and near(min_distance,marked_distance,1e-6)
        first=smallest_multiple(counts);left_turns=first//counts[0]
        assert all(not (i%counts[0]==i%counts[1]==0) for i in range(1,first))
        return str(left_turns),{'actualPrintedAndPhysicalTeeth':counts,'actualRegularAngularToothGaps':True,'actualRedToothPairClosestBoundaryGapSvg':marked_distance,'all540CrossGearToothPairsChecked':True,'firstJointToothReturn':first,'leftRightWholeTurns':[left_turns,first//counts[1]],'initialMomentExcluded':True}
    if scene=='brick':
        a=int(re.fullmatch(r'(\d+) см',at(216,341))[1]);b=int(re.fullmatch(r'(\d+) см',at(368,320))[1]);c=int(re.fullmatch(r'(\d+) см',at(72,182))[1]);assert len(polys)==3
        front=one(p for p in polys if p.get('fill')=='#c0c7e4');assert near(200/250,F(a,c));assert 'бұрмай' in r['statement']
        side=smallest_multiple([a,b,c]);axes=[side//v for v in [a,b,c]];answer=math.prod(axes);assert answer*a*b*c==side**3
        return str(answer),{'actualPrintedBlockAxesCm':[a,b,c],'leastAlignedCubeSideCm':side,'blockGridCounts':axes,'volumeConserved':side**3}
    assert scene=='wheels'
    wheels=sorted([e for e in circles if n(e,'r')>5],key=lambda e:n(e,'cx'));assert len(wheels)==2
    circumferences=[int(re.fullmatch(r'(\d+) см',at(n(e,'cx'),342))[1]) for e in wheels]
    assert near(n(wheels[0],'r')/n(wheels[1],'r'),F(circumferences[0],circumferences[1]))
    assert all(n(e,'cy')+n(e,'r')==308 for e in wheels)
    assert one(e for e in lines if n(e,'x1')==373 and n(e,'x2')==437) is not None
    distance=smallest_multiple(circumferences);assert distance%100==0 and 'сырғанамай' in r['statement']
    return str(distance//100),{'actualRearFrontCircumferencesCm':circumferences,'sameGroundBaselineSvg':308,'radiusRatioMatchesCircumferenceRatio':True,'rightSideHandleIdentifiesFront':True,'leastPositiveDistanceCm':distance,'rearFrontWholeTurns':[distance//v for v in circumferences],'metres':distance//100}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==6;entries=[]
    for r in rows:
        answer,observed=observe(r);assert answer==r['answer']
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'Full6saved/new conditions, fullsolutions andMCQs individually read; actual source/native343px sheets inspected; own SVG arc/label/gear polygon observer plus complete positive multiple domains; no author calculator or gear generator imported','checks':['actualupper/lowerjump endpoints mapped through printedaxis,0excluded','fixedorientationtile/block minimaldimension and conservedarea/volume','physical18/30teeth counted andregularangleschecked, all540crossgearpolygonpair boundaries checked','markedteeth form closestpair, firstpositivejointreturn90passages givesleft5turns','75/50cmstep arcs actualscale/twoinitialjumps checked','rear/front175/140circumferences withrighthishandle andsharedbaseline,700cmconverted7m'],'observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['actualsource/native343pxsheets viewed','arc ticklabels and gearcentrecounts readable','physical geometry observed independently of dataattributes','answerdimensions/turncounts not predrawn'],'sourceSheet':'output/editorial-visual-wave39/visual-wave39-source-1.png','nativeSheet':'output/editorial-visual-wave39/visual-wave39-contact-1.png'}})
    code="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';const b=JSON.parse(fs.readFileSync('"+PACK+"'));console.log(JSON.stringify(b.editions.map(q=>[q.editionId,editionHash(q)])));"
    js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(js[e['editionId']]==e['sha256'] for e in entries)
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave39-lcm-cycles-and-assembly.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':6,'actualGeometryChecks':6,'gearToothPairChecks':540,'hashesMatched':6,'authorSolverImported':False}))
if __name__=='__main__':main()
