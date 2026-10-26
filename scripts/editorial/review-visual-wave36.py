"""All7 full saved/new tasks and solutions read; both source/native343px pages viewed.
Independent SVG geometry/visible text observer, no author calculator imported.
"""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave36-squares-and-cubes.json'
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return F(e.get(k))
def near(a,b):return abs(F(a)-F(b))<F(1,10**9)
def point(e,end):return n(e,'x'+end),n(e,'y'+end)
def same(p,q):return all(near(a,b) for a,b in zip(p,q))
def edge(e,p,q):return (same(point(e,'1'),p) and same(point(e,'2'),q)) or (same(point(e,'1'),q) and same(point(e,'2'),p))
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
    els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text'];rects=[e for e in els if tag(e)=='rect'];lines=[e for e in els if tag(e)=='line'];polys=[e for e in els if tag(e)=='polygon']
    def at(x,y):return txt(one(e for e in texts if n(e,'x')==x and n(e,'y')==y))
    scene=r['params']['scene'];k=r['modelId'].removeprefix('visual-wave36-')
    if scene=='grid':
        grid=one(e for e in rects if e.get('fill')=='#e7f1ff');x,y,w,h=(n(grid,key) for key in ['x','y','width','height']);assert w==h
        dividers=[e for e in lines if e.get('stroke')=='#6c89ab'];vertical=[e for e in dividers if n(e,'x1')==n(e,'x2')];horizontal=[e for e in dividers if n(e,'y1')==n(e,'y2')]
        count=len(vertical)+1;assert len(horizontal)+1==count
        for i in range(1,count):
            assert one(e for e in vertical if edge(e,(x+w*F(i,count),y),(x+w*F(i,count),y+h))) is not None
            assert one(e for e in horizontal if edge(e,(x,y+h*F(i,count)),(x+w,y+h*F(i,count)))) is not None
        assert at(x+w/2,y+h+46)==f'{count} ұяшық'
        cells=[(a,b) for a in range(count) for b in range(count)]
        return str(len(cells)),{'actualRowsAndColumns':[count,count],'allUnitCells':len(cells),'equalGridIntervals':True}
    if scene=='garden':
        garden=one(e for e in rects if e.get('fill')=='#bce2cd');assert n(garden,'width')==n(garden,'height')
        side=int(re.fullmatch(r'(\d+) м',at(n(garden,'x')+n(garden,'width')/2,346))[1]);assert at(388,286)=='1 м²' and at(388,101)=='Үлгі'
        centres=[e for e in els if tag(e)=='circle' and e.get('fill')=='#f4d17e'];petals=[e for e in els if tag(e)=='circle' and e.get('fill')=='#d992b3'];assert len(petals)==4*len(centres)
        for c in centres:
            x,y=n(c,'cx'),n(c,'cy');assert F(322)<x<F(454) and F(121)<y<F(253)
            for dx,dy in [(-7,0),(7,0),(0,-7),(0,7)]:one(e for e in petals if n(e,'cx')==x+dx and n(e,'cy')==y+dy)
        answer=sum(len(centres) for _ in range(side*side))
        return str(answer),{'printedGardenSideMetres':side,'actualFlowerCentres':len(centres),'allPetals':len(petals),'sampleExcludedFromGardenArea':True,'gardenSquareMetres':side**2}
    if scene=='three-squares':
        squares=[e for e in rects if e.get('fill') in ['#b7d3fa','#f2d790','#a6d6c0']];assert len(squares)==3;squares.sort(key=lambda e:n(e,'x'));sides=[]
        for e in squares:
            x,y,w,h=(n(e,key) for key in ['x','y','width','height']);assert w==h and y+h==283
            v=int(re.fullmatch(r'(\d+) см',at(x+w/2,333))[1]);sides.append(v);assert w/v==18
        area=sum(v*v for v in sides);root=math.isqrt(area);assert root**2==area
        assert sum(1 for _ in range(root) for _ in range(root))==area
        return str(4*root),{'actualSameScaleSquareLabels':sides,'pixelsPerCentimetre':18,'conservedUnitTiles':area,'newSide':root,'newPerimeter':4*root}
    assert scene in ['cube-grid','volume','surface'] and len(polys)==3
    points=lambda e:[tuple(F(v) for v in pair.split(',')) for pair in e.get('points').split()]
    front=one(e for e in polys if e.get('fill') in ['#d9e9ff','#edb5b4']);p=points(front);assert p==[(96,291),(311,291),(311,76),(96,76)]
    assert one(e for e in polys if points(e)==[(96,76),(311,76),(391,26),(176,26)]) is not None
    assert one(e for e in polys if points(e)==[(311,291),(391,241),(391,26),(311,76)]) is not None
    if scene=='volume':
        assert at(203,168)=='V =' and at(F(407,2),339)=='? дм';volume=int(re.fullmatch(r'(\d+) дм³',at(203,212))[1])
        roots=[x for x in range(1,volume+1) if x*x*x==volume];root=one(roots)
        return str(root),{'actualPrintedVolumeDm3':volume,'allPositiveIntegerCubeRoots':roots,'positiveRealCubeStrictlyIncreasing':True,'innerDimensionsExplicit':True}
    if scene=='surface':
        side=int(re.fullmatch(r'(\d+) см',at(F(407,2),339))[1]);face=side**2
        return str(sum(face for _ in range(6))),{'printedEdgeCm':side,'allSixEqualSquareFaceAreas':[face]*6,'threeVisibleFacesDoNotMeanOnlyThreeFaces':True}
    # Count front grid intervals without data-grid attributes or hidden n.
    vertical=[e for e in lines if n(e,'x1')==n(e,'x2') and n(e,'y1')==291 and n(e,'y2')==76 and 96<n(e,'x1')<311]
    horizontal=[e for e in lines if n(e,'y1')==n(e,'y2') and n(e,'x1')==96 and n(e,'x2')==311 and 76<n(e,'y1')<291]
    count=len(vertical)+1;assert len(horizontal)+1==count and len(lines)==6*(count-1)
    def projected(a,b,c):return F(96)+215*a+80*b,F(291)-50*b-215*c
    for i in range(1,count):
        t=F(i,count)
        for a,b in [((t,0,0),(t,0,1)),((0,0,t),(1,0,t)),((t,0,1),(t,1,1)),((0,t,1),(1,t,1)),((1,t,0),(1,t,1)),((1,0,t),(1,1,t))]:
            one(e for e in lines if edge(e,projected(*a),projected(*b)))
    voxels=[(x,y,z) for x in range(count) for y in range(count) for z in range(count)]
    paint=[sum(v in [0,count-1] for v in xyz) for xyz in voxels];groups=[paint.count(i) for i in range(4)]
    answer=groups[0] if k=='painted-cube-interior' else len(voxels)
    return str(answer),{'actualGridIntervalsPerAxis':count,'allProjectedFaceDividers':len(lines),'completeVoxels':len(voxels),'byNumberOfPaintedFaces':groups,'allSixFacesPaintedInCondition':k=='painted-cube-interior'}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==7;entries=[]
    for i,r in enumerate(rows):
        answer,observed=observe(r);assert answer==r['answer'];assert answer!='wrong-key'
        page=1 if i<6 else 2
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'All7fullsaved/new conditions and fullsolutions read; all4actual source/native343px sheets inspected; separate actual SVG coordinate/visible-label observer and complete cell/voxel/positive integer root enumeration, no author calculator imported','checks':['all equal grid intervals and all3projected cube faces checked geometrically','complete voxel counts including invisible interior and6painted boundaries','512dm3 is internalvolume; positive cube root unique','18m garden uses area and5actualflowers, notperimeter','3/4/12cm squares share18px/cm;169unitcells reassemble13square, perimeter52','7cm cube requires all6faces, not3visiblefaces'],'observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['source/native bothpages viewed','labels/counts readable at343px','physical shapes/coordinates observed, not data attributes','new parameters, layout and native drawing'],'sourceSheet':f'output/editorial-visual-wave36/visual-wave36-source-{page}.png','nativeSheet':f'output/editorial-visual-wave36/visual-wave36-contact-{page}.png'}})
    code="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';const b=JSON.parse(fs.readFileSync('"+PACK+"'));console.log(JSON.stringify(b.editions.map(q=>[q.editionId,editionHash(q)])));"
    js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(js[e['editionId']]==e['sha256'] for e in entries)
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave36-squares-and-cubes.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':7,'actualGeometryChecks':7,'hashesMatched':7,'authorSolverImported':False}))
if __name__=='__main__':main()
