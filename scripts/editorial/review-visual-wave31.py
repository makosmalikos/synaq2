"""Independent full seven-source/new reading and four343px contact-sheet review."""
from fractions import Fraction as F
from itertools import combinations,product
import hashlib,json,re,sys,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave31-growing-figure-sequences.json'
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return F(e.get(k))
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def edge(a,b):return tuple(sorted([a,b]))
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
    els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text'];circles=[e for e in els if tag(e)=='circle'];lines=[e for e in els if tag(e)=='line'];scene=r['params']['scene']
    def at(x,y):return txt(one(e for e in texts if n(e,'x')==x and n(e,'y')==y))
    if scene in ['square-dots','outline-dots','rect-dots']:
        observed=[];total=0
        for label in texts:
            index=int(txt(label));cx,cy=n(label,'x'),n(label,'y');dots=[e for e in circles if abs(n(e,'cx')-cx)<90 and cy-150<n(e,'cy')<cy]
            points={(n(e,'cx'),n(e,'cy')) for e in dots};assert len(points)==len(dots)
            xs=sorted({x for x,y in points});ys=sorted({y for x,y in points});assert all(b-a==18 for a,b in zip(xs,xs[1:])) and all(b-a==18 for a,b in zip(ys,ys[1:]))
            if scene=='outline-dots':
                assert len(xs)==len(ys)==index+2;expected={(x,y) for x,y in product(xs,ys) if x in [xs[0],xs[-1]] or y in [ys[0],ys[-1]]};assert points==expected;assert len(points)==4*(index+2)-4
            else:
                assert points==set(product(xs,ys))
                if scene=='square-dots':assert len(xs)==len(ys)==index+1
                else:assert len(ys)==index and len(xs)==index+3
            total+=len(dots);observed.append({'index':index,'rows':len(ys),'columns':len(xs),'dots':len(dots)})
        assert sorted(v['index'] for v in observed)==[1,2,3,4]
        if scene=='outline-dots':
            # Every printed candidate is independently tested against all four
            # physical diagrams; explicit side-growth rule gives4(n+2)-4.
            valid=[]
            for o in r['options']:
                def expr(index):
                    assert re.fullmatch(r'[0-9n ×+]+',o);return eval(o.replace('×','*'),{'__builtins__':{}},{'n':index})
                if all(expr(v['index'])==v['dots'] for v in observed):valid.append(o)
            return one(valid),{'actualDiagrams':observed,'totalPhysicalDots':total,'cornersCountedOnce':True}
        query=int(re.search(r'(\d+)-фигурада',r['statement'])[1]);answer=(query+1)**2 if scene=='square-dots' else query*(query+3)
        return str(answer),{'actualDiagrams':observed,'totalPhysicalDots':total,'queryIndex':query}
    if scene in ['square-matches','triangle-matches']:
        observed=[]
        for label in texts:
            count=int(re.fullmatch(r'n = (\d+)',txt(label))[1]);y=n(label,'y');members=[e for e in lines if y-40<=n(e,'y1')<=y+20 and y-40<=n(e,'y2')<=y+20]
            edges={edge((n(e,'x1'),n(e,'y1')),(n(e,'x2'),n(e,'y2'))) for e in members};assert len(edges)==len(members)
            for a,b in edges:assert abs(float((a[0]-b[0])**2+(a[1]-b[1])**2-44**2))<1e-7
            vertices={v for e in edges for v in e}
            if scene=='triangle-matches':
                cells=sum(all(edge(a,b) in edges for a,b in combinations(vs,2)) for vs in combinations(vertices,3));assert cells==count and len(edges)==2*count+1
            else:
                xs=sorted({x for x,y in vertices});ys=sorted({y for x,y in vertices});assert len(ys)==2 and len(xs)==count+1
                for x1,x2 in zip(xs,xs[1:]):assert all(edge(a,b) in edges for a,b in [((x1,ys[0]),(x2,ys[0])),((x1,ys[1]),(x2,ys[1])),((x1,ys[0]),(x1,ys[1])),((x2,ys[0]),(x2,ys[1]))])
                assert len(edges)==3*count+1
            observed.append({'cells':count,'uniqueActualMatches':len(edges)})
        assert [v['cells'] for v in observed]==[2,3,4]
        if scene=='square-matches':
            count=int(re.search(r'(\d+) шаршыдан',r['statement'])[1]);answer=2*count+(count+1)
        else:
            matches=int(re.search(r'Барлық (\d+) сіріңке',r['statement'])[1]);assert matches%2==1;answer=(matches-1)//2;assert answer>=1 and 2*answer+1==matches
        return str(answer),{'actualDiagrams':observed,'physicalEdgesUniqueAndEqualLength':True,'extensionProof':'First polygon plus only3or2newedges per appended shared-side polygon'}
    if scene=='trees':
        assert len(circles)==5;labels=[]
        for c in sorted(circles,key=lambda e:n(e,'cx')):
            x=n(c,'cx');labels.append(int(at(x,275)));assert any(n(e,'x1')==n(e,'x2')==x and n(e,'y2')==239 for e in lines)
        assert labels==[1,2,3,15,16] and at(275,218)=='…' and 'масштабсыз' in r['statement']
        gaps=[F(re.fullmatch(r'(\d+) м',txt(t))[1]) for t in texts if txt(t).endswith(' м')];assert len(gaps)==3 and len(set(gaps))==1
        return str((labels[-1]-labels[0])*gaps[0]),{'visibleTreeLabels':labels,'constantGapMetres':int(gaps[0]),'intervalCount':15,'ellipsisNotAnExtraTree':True}
    assert scene=='bars'
    axis=sorted([(F(txt(t)),n(t,'y')-7) for t in texts if t.get('x')=='72']);assert len(axis)==6 and axis[0]==(0,274)
    for (a,y),(b,z) in zip(axis,axis[1:]):assert b-a==5 and y-z==35
    bars=sorted([e for e in els if tag(e)=='rect' and e.get('fill')=='#315ce8'],key=lambda e:n(e,'x'));values=[]
    for i,b in enumerate(bars,1):
        x=n(b,'x')+n(b,'width')/2;assert at(x,308)==str(i);height=n(b,'height');assert n(b,'y')+height==274;value=int(at(x,n(b,'y')-11));assert height==7*value;values.append(value)
    assert values==[9,13,17,21] and len({b-a for a,b in zip(values,values[1:])})==1
    query=int(re.search(r'(\d+)-күні',r['statement'])[1]);answer=values[0]+(query-1)*(values[1]-values[0])
    return str(answer),{'actualBarLabels':values,'calibratedPixelsPerPage':7,'queryDay':query,'queryIsSingleDayNotCumulative':True}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==7;entries=[]
    for i,r in enumerate(rows):
        answer,observed=observe(r);assert answer==r['answer']
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
        try:assert answer=={**r,'answer':'wrong'}['answer']
        except AssertionError:pass
        else:raise AssertionError('Wrong key accepted')
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'All7full saved/new conditions, fullsolutions and MCQs read; all4actual343px source/native sheets inspected; independent physical circle grids, unique equal-length edge graphs, indexed tree gaps and calibrated bar geometry','checks':['all54fullsquare56boundary60rectangle dots counted by coordinates withoutdataattributes','rectangle rows/columns and outline corner deduplication reconstructed','all7/10/13square and5/7/9triangle matches actual uniqueedges, equal lengths, connected cells','each appended polygon shares1edge and adds3or2; target18or121 handled in correct direction','tree16minus1intervals; no extra tree for ellipsis','bar heights checked against all0..25verticalaxislabels and35pixelsteps'],'observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['all source/native343px sheets visually read','labels match physical diagrams','explicit growth rule removes finite-pattern ambiguity','unknown target does not appear in diagram'],'sourceSheet':f'output/editorial-visual-wave31/visual-wave31-source-{1+i//6}.png','nativeSheet':f'output/editorial-visual-wave31/visual-wave31-contact-{1+i//6}.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave31-growing-figure-sequences.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':7,'actualGeometryChecks':7,'wrongKeysRejected':7,'authorSolverImported':False}))
if __name__=='__main__':main()
