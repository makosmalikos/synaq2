"""Full10saved/new conditions/MCQs/solutions read; four actual343px sheets viewed."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from collections import defaultdict
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave41-pictured-fraction-wholes.json'
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return float(e.get(k))
def near(a,b):return abs(a-b)<1e-7
def points(e):return [tuple(map(float,p.split(','))) for p in e.get('points').split()]
def area(ps):return abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(ps,ps[1:]+ps[:1])))/2
def cross(a,b,c):return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
def hull(ps):
    ps=sorted(set(ps));lower=[];upper=[]
    for p in ps:
        while len(lower)>1 and cross(lower[-2],lower[-1],p)<=1e-7:lower.pop()
        lower.append(p)
    for p in reversed(ps):
        while len(upper)>1 and cross(upper[-2],upper[-1],p)<=1e-7:upper.pop()
        upper.append(p)
    return lower[:-1]+upper[:-1]
def disjoint_interiors(a,b):
    for poly in [a,b]:
        for p,q in zip(poly,poly[1:]+poly[:1]):
            axis=(q[1]-p[1],p[0]-q[0]);pa=[x*axis[0]+y*axis[1] for x,y in a];pb=[x*axis[0]+y*axis[1] for x,y in b]
            if max(pa)<=min(pb)+1e-7 or max(pb)<=min(pa)+1e-7:return True
    return False
def polygon_partition(polys):
    ps=[points(e) for e in polys];whole=hull([p for poly in ps for p in poly]);sizes=[area(p) for p in ps]
    assert all(v>0 for v in sizes);assert abs(sum(sizes)-area(whole))<1e-6
    for i,a in enumerate(ps):
        for b in ps[i+1:]:assert disjoint_interiors(a,b),'Native regions overlap'
    return sizes,whole
def option(r,a,b):
    target=F(a,b)
    return one(o for o in r['options'] if (m:=re.fullmatch(r'\((\d+)/(\d+)\)',o)) and F(int(m[1]),int(m[2]))==target)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
    els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text'];rects=[e for e in els if tag(e)=='rect' and e.get('stroke')=='#203549'];polys=[e for e in els if tag(e)=='polygon'];paths=[e for e in els if tag(e)=='path'];lines=[e for e in els if tag(e)=='line'];scene=r['params']['scene']
    def at(x,y):return txt(one(e for e in texts if near(n(e,'x'),x) and near(n(e,'y'),y)))
    if scene in ['triangle','hexagon','unequal']:
        sizes,whole=polygon_partition(polys);painted=[v for e,v in zip(polys,sizes) if e.get('fill')=='#ba9dd8'];shade=sum(painted);total=sum(sizes)
        if scene in ['triangle','hexagon']:
            assert all(abs(a-sizes[0])<1e-6 for a in sizes)
            a=len(polys)-len(painted) if scene=='hexagon' else len(painted)
            if scene=='hexagon':assert len(whole)==6 and len(polys)==6 and 'БОЯЛМАҒАН' in r['statement']
            else:assert len(whole)==3 and len(polys)==9
            return option(r,a,len(polys)),{'actualPolygonPieces':len(polys),'actualPaintedPieces':len(painted),'allAreasEqual':True,'wholeConvexHullVertices':len(whole),'partitionWithoutHolesOrOverlaps':True,'requestedUnshaded':scene=='hexagon'}
        assert len(polys)==9 and len(painted)==6
        assert sorted(set(round(a) for a in sizes))==[4900,9800,19600]
        assert round(total)==280**2 and round(shade)==53900
        # Exact integer coordinates: area ratio11/16, not object-count6/9.
        ratio=F(round(shade),round(total));assert ratio==F(11,16) and ratio!=F(6,9)
        one(e for e in lines if (n(e,'x1'),n(e,'y1'),n(e,'x2'),n(e,'y2'))==(100,175,380,175) and n(e,'stroke-width')==2.5)
        one(e for e in lines if (n(e,'x1'),n(e,'y1'),n(e,'x2'),n(e,'y2'))==(240,35,240,315) and n(e,'stroke-width')==2.5)
        return option(r,ratio.numerator,ratio.denominator),{'allActualRegionAreas':sizes,'paintedRegionAreas':painted,'totalArea':round(total),'paintedArea':round(shade),'exactAreaFraction':str(ratio),'wrongShapeCountFraction':'6/9','allNineRegionsDisjointCoverWholeSquare':True}
    if scene in ['grid','removed','travel','group','route']:
        assert rects;rects.sort(key=lambda e:(n(e,'y'),n(e,'x')));sizes=[n(e,'width')*n(e,'height') for e in rects];assert all(abs(a-sizes[0])<1e-6 for a in sizes)
        xs=sorted(set(n(e,'x') for e in rects));ys=sorted(set(n(e,'y') for e in rects));width=n(rects[0],'width');height=n(rects[0],'height')
        assert len(xs)*len(ys)==len(rects)
        assert all(near(b-a,width) for a,b in zip(xs,xs[1:]));assert all(near(b-a,height) for a,b in zip(ys,ys[1:]))
        colored={color:sum(e.get('fill')==color for e in rects) for color in ['#ba9dd8','#a2c8ef','#fff']};total=len(rects)
        if scene=='grid':return option(r,colored['#ba9dd8'],total),{'actualRowsColumns':[len(ys),len(xs)],'physicalPaintedCells':colored['#ba9dd8'],'equalAreaCells':total}
        assert len(ys)==1
        if scene=='removed':
            assert 'БЕРІЛГЕН БӨЛІКТЕР САНЫНА' in r['statement'];remaining=colored['#fff']
            return str(remaining),{'actualEqualRibbonParts':total,'actualNoncontiguousRemovedParts':colored['#ba9dd8'],'remainingNumeratorUsingOriginalDenominator':remaining,'denominatorPreserved':total}
        if scene=='group':
            known=int(re.search(r'олардың саны (\d+)',r['statement'])[1]);unit=F(known,colored['#a2c8ef']);assert unit.denominator==1
            return str(int(unit)*total),{'actualEqualGroups':total,'actualKnownBlueGroups':colored['#a2c8ef'],'printedKnownChildren':known,'childrenPerGroup':int(unit)}
        dimension=one(e for e in lines if n(e,'y1')==n(e,'y2')==122 and abs(n(e,'x2')-n(e,'x1'))>20)
        start,end=n(dimension,'x1'),n(dimension,'x2');value=int(re.fullmatch(r'(\d+) км',at((start+end)/2,99))[1]);assert near(end,xs[-1]+width)
        for x in [start,end]:one(e for e in lines if (n(e,'x1'),n(e,'y1'),n(e,'x2'),n(e,'y2'))==(x,116,x,128))
        if scene=='travel':
            assert near(start,xs[0]);km=F(value,total)*colored['#fff'];assert km.denominator==1
            return str(int(km)),{'actualWholeDimensionKm':value,'dimensionSpansAllParts':total,'busBlueParts':colored['#a2c8ef'],'taxiWhiteParts':colored['#fff'],'taxiKm':int(km)}
        assert scene=='route';white=[e for e in rects if e.get('fill')=='#fff'];assert near(start,n(white[0],'x'))
        covered=(end-start)/width;assert near(covered,len(white));unit=F(value,len(white));assert unit.denominator==1
        return str(int(unit)*total),{'actualWholeParts':total,'actualColors':colored,'actualDimensionOnlyCoversWhiteParts':len(white),'printedRemainingKm':value,'kmPerPart':int(unit),'wholeKm':int(unit)*total}
    assert scene in ['pie','circles']
    grouped=defaultdict(list)
    for e in paths:
        m=re.fullmatch(r'M ([-\d.e+]+) ([-\d.e+]+) L ([-\d.e+]+) ([-\d.e+]+) A ([-\d.e+]+) ([-\d.e+]+) 0 0 1 ([-\d.e+]+) ([-\d.e+]+) Z',e.get('d'));assert m,e.get('d')
        cx,cy,x,y,rx,ry,z,t=map(float,m.groups());assert near(rx,ry) and near(math.hypot(x-cx,y-cy),rx) and near(math.hypot(z-cx,t-cy),rx)
        start=math.atan2(y-cy,x-cx)%(2*math.pi);end=math.atan2(t-cy,z-cx)%(2*math.pi);angle=(end-start)%(2*math.pi)
        grouped[(cx,cy,rx)].append((start,end,angle,e.get('fill')=='#ba9dd8'))
    observed=[];labels=[]
    for (cx,cy,radius),sectors in sorted(grouped.items(),key=lambda p:(p[0][1],p[0][0])):
        count=len(sectors);assert all(abs(s[2]-2*math.pi/count)<1e-7 for s in sectors);assert abs(sum(s[2] for s in sectors)-2*math.pi)<1e-7
        starts=sorted(s[0] for s in sectors);gaps=[(starts[(i+1)%count]-starts[i])%(2*math.pi) for i in range(count)];assert all(abs(g-2*math.pi/count)<1e-7 for g in gaps)
        painted=sum(s[3] for s in sectors);observed.append([count,painted]);labels.append(at(cx,cy+radius+23) if scene=='circles' else None)
    if scene=='pie':
        count,painted=one(observed);assert count==12
        return option(r,painted,count),{'actualEqualAnglePieSectors':count,'actualPaintedSectors':painted,'angleCoverageExactlyOneCircle':True}
    assert labels==list('ABCD')
    a,b=map(int,re.search(r'Қай дөңгелектің \((\d+)/(\d+)\)',r['statement']).groups());selected=one(label for label,(total,painted) in zip(labels,observed) if F(painted,total)==F(a,b))
    return selected,{'actualCirclesAllSectorAndPaintCounts':dict(zip(labels,observed)),'targetFromCondition':f'{a}/{b}','everyCircleEqualAnglesAndFullCoverage':True}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==10;entries=[]
    for i,r in enumerate(rows):
        answer,observed=observe(r);assert answer==r['answer']
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
        page=1 if i<6 else 2
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'Full10saved/new conditions, allMCQs and fullsolutions read; all4actual source/native343px sheets viewed; own actual SVG polygon SAT/area/hull partition, sectorangle and bracketendpoint observer, exact ratio/whole arithmetic; no author generator/calculator imported','checks':['9equaltriangle polygons/noholes/nointerioroverlap;12actualgridcells','everyactualcirclearc has equalangle, allangles cover exactly2pi','cutribbon noncontiguous5removed/7remaining, original12denominator','168kmbracket coverswhole8parts,35kmbracket only5whiteparts of12','known12children map to4blueof9equalgroups, notsinglechildpercell','unequal9regions/6painted exact53900of78400=11/16, not6/9','regularhexagon6equaltriangleareas,unshaded4of6 requested'],'observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['bothpages actualsource/native viewed','sectors/unequalregions andbracketlabels readable','physical geometry and fills observed rather than dataattributes','freshpartition/parameters rather than source tracing'],'sourceSheet':f'output/editorial-visual-wave41/visual-wave41-source-{page}.png','nativeSheet':f'output/editorial-visual-wave41/visual-wave41-contact-{page}.png'}})
    code="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';const b=JSON.parse(fs.readFileSync('"+PACK+"'));console.log(JSON.stringify(b.editions.map(q=>[q.editionId,editionHash(q)])));"
    js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(js[e['editionId']]==e['sha256'] for e in entries)
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave41-pictured-fraction-wholes.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':10,'actualPolygonArcAndDimensionChecks':10,'unequalAreaFraction':'11/16','hashesMatched':10,'authorSolverImported':False}))
if __name__=='__main__':main()
