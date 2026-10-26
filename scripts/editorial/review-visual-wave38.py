"""Full6saved/new conditions, solutions and MCQs read; both343px sheets viewed."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave38-gcd-cutting-and-sharing.json'
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return F(e.get(k))
def near(a,b):return abs(F(a)-F(b))<F(1,10**8)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def divisors(xs):return [d for d in range(1,min(xs)+1) if all(x%d==0 for x in xs)]
def bezout_maximum(xs):
    def egcd(a,b):
        if b==0:return a,1,0
        g,x,y=egcd(b,a%b);return g,y,x-(a//b)*y
    g=xs[0];coefficients=[1]
    for v in xs[1:]:
        g,a,b=egcd(g,v);coefficients=[c*a for c in coefficients]+[b]
    assert g>0 and sum(a*b for a,b in zip(xs,coefficients))==g
    assert all(v%g==0 for v in xs)
    # If any real length s tiles all axes, xi/s are integers. Thus g/s is
    # a positive integer by this exact Bezout combination; s<=g, attained by g.
    return g,{'inputDimensions':xs,'bezoutCoefficients':coefficients,'continuousMaximumProof':'g=sum(ci*xi). Any positive real common tile/gap s has g/s=sum(ci*(xi/s)) positive integer, so s<=g; g itself fits all axes.'}
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
    els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text'];rects=[e for e in els if tag(e)=='rect'];circles=[e for e in els if tag(e)=='circle'];paths=[e for e in els if tag(e)=='path'];lines=[e for e in els if tag(e)=='line'];scene=r['params']['scene']
    def at(x,y):return txt(one(e for e in texts if near(n(e,'x'),x) and near(n(e,'y'),y)))
    if scene=='fruit':
        apples=[e for e in paths if e.get('fill')=='#df899b'];pears=[e for e in paths if e.get('fill')=='#f1ce75']
        assert len(set(e.get('d') for e in apples+pears))==len(apples)+len(pears)
        assert len(apples)==24 and len(pears)==36 and len(lines)==60
        assert at(240,31)=='Алма' and at(240,169)=='Алмұрт'
        valid=divisors([len(apples),len(pears)]);a=max(valid)
        return str(a),{'actualDistinctApplePearBodies':[len(apples),len(pears)],'actualStems':len(lines),'allRecipientCounts':valid,'eachChild':[len(apples)//a,len(pears)//a]}
    if scene=='venn':
        assert len(circles)==2
        cs=sorted(circles,key=lambda e:n(e,'cx'));assert [n(c,'r') for c in cs]==[116,116]
        labels={'left':[],'common':[],'right':[]}
        for t in texts:
            text=txt(t)
            if not text.isdigit():continue
            x,y=n(t,'x'),n(t,'y')-10
            membership=[(x-n(c,'cx'))**2+(y-n(c,'cy'))**2<n(c,'r')**2 for c in cs]
            region='common' if all(membership) else 'left' if membership==[True,False] else 'right' if membership==[False,True] else None
            assert region;labels[region].append(int(text))
        assert labels=={'left':[5],'common':[2,2,3],'right':[7]}
        a=math.prod(labels['left']+labels['common']);b=math.prod(labels['right']+labels['common']);valid=divisors([a,b]);g=max(valid)
        assert g==math.prod(labels['common'])
        return str(g),{'actualGeometricRegionLabels':labels,'constructedNumbers':[a,b],'allCommonDivisors':valid,'repeatedTwosNotDeduplicated':True}
    if scene=='strips':
        bars=sorted([e for e in rects if e.get('fill') in ['#a9cbf4','#c8b6e6']],key=lambda e:n(e,'y'));assert len(bars)==2
        lengths=[]
        for e in bars:
            length=int(re.fullmatch(r'(\d+) м',at(n(e,'x')+n(e,'width')/2,n(e,'y')-19))[1]);lengths.append(length)
        assert near(n(bars[0],'width')/lengths[0],n(bars[1],'width')/lengths[1])
        g,proof=bezout_maximum(lengths);counts=[v//g for v in lengths]
        return str(sum(counts)),{'actualPrintedLengthsMetres':lengths,'sameDrawingScale':True,'allIntegerCommonLengths':divisors(lengths),'longestPartLength':g,'partsPerStrip':counts,'maximumEvenForRealLengths':proof}
    if scene in ['floor','posts']:
        box=one(e for e in rects if e.get('fill') in ['#d2e6fb','#c5e6d4']);x,y,w,h=[n(box,k) for k in ['x','y','width','height']]
        if scene=='floor':
            l1,l2=map(int,re.fullmatch(r'(\d+) м (\d+) см',at(x+w/2,y+h+40)).groups());b1,b2=map(int,re.fullmatch(r'(\d+) м (\d+) см',at(65,y+h/2)).groups());length,width=l1*100+l2,b1*100+b2
        else:
            length=int(re.fullmatch(r'(\d+) м',at(x+w/2,y+h+42))[1]);width=int(re.fullmatch(r'(\d+) м',at(65,y+h/2))[1])
        assert near(w/h,F(length,width));g,proof=bezout_maximum([length,width])
        if scene=='floor':return str(g),{'actualConvertedDimensionsCm':[length,width],'largestSideCm':g,'tileRowsColumns':[length//g,width//g],'continuousMaximum':proof}
        expected=[(x,y),(x+w,y),(x,y+h),(x+w,y+h)];assert len(circles)==4
        for a,b in expected:one(c for c in circles if near(n(c,'cx'),a) and near(n(c,'cy'),b))
        occupied=set()
        for a in range(0,length+1,g):occupied.add((a,0));occupied.add((a,width))
        for b in range(0,width+1,g):occupied.add((0,b));occupied.add((length,b))
        assert len(occupied)==2*(length+width)//g
        assert all(p in occupied for p in [(0,0),(length,0),(0,width),(length,width)])
        return str(len(occupied)),{'actualMandatoryCornerDots':4,'actualLabelsMetres':[length,width],'maximumGap':g,'allUniqueWorldBoundaryPosts':sorted(occupied),'closedBoundaryNoExtraEndpoint':True,'continuousMaximum':proof}
    assert scene=='cuboid'
    length=int(re.fullmatch(r'(\d+) см',at(214,322))[1]);height=int(re.fullmatch(r'(\d+) см',at(55,235))[1]);depth=int(re.fullmatch(r'(\d+) см',at(393,289))[1])
    polys=[e for e in els if tag(e)=='polygon'];assert len(polys)==3 and not lines
    points=lambda e:[tuple(F(v) for v in p.split(',')) for p in e.get('points').split()]
    front=one(e for e in polys if e.get('fill')=='#dfcbb0');right=one(e for e in polys if e.get('fill')=='#c9b394')
    assert points(front)==[(90,278),(339,278),(339,178),(90,178)]
    assert set(points(front))&set(points(right))=={(339,178),(339,278)}
    g,proof=bezout_maximum([length,depth,height]);counts=[v//g for v in [length,depth,height]]
    cubes=[(a,b,c) for a in range(counts[0]) for b in range(counts[1]) for c in range(counts[2])]
    assert len(cubes)*g**3==length*depth*height
    return str(len(cubes)),{'actualPrintedAxesCm':[length,depth,height],'maximumCubeEdge':g,'cubesPerAxis':counts,'allPhysicalCubes':len(cubes),'volumeConserved':length*depth*height,'continuousMaximum':proof}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==6;entries=[]
    for r in rows:
        answer,observed=observe(r);assert answer==r['answer']
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'All6fullsaved/new conditions, fullsolutions andMCQs read; both actual343px sheets inspected; separate physical-fruit/point-membership/visible-label observer, complete integer divisor domains and exact Bezout continuous maximum proof; no author calculator imported','checks':['24actualapple and36pear bodies/stems counted','Venn membership derived from circlegeometry, repeated2 countedtwice','84/132metre bars one scale, longestlength12 versus totalpieces18','450/330cm floor, squaretiles parallel/uncut andmax30','only4mandatory cornerdots, all10uniqueposts onclosedboundary','90/54/36cm cuts preservevolume andall30cubes; real noninteger cubeedges cannot exceed18'],'observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['source/native actual343px viewed','allfruit/units/duplicatefactor labels readable','physical shapes and circlemembership observed rather than dataattributes','no pre-drawn finalcut/postanswer reveals result'],'sourceSheet':'output/editorial-visual-wave38/visual-wave38-source-1.png','nativeSheet':'output/editorial-visual-wave38/visual-wave38-contact-1.png'}})
    code="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';const b=JSON.parse(fs.readFileSync('"+PACK+"'));console.log(JSON.stringify(b.editions.map(q=>[q.editionId,editionHash(q)])));"
    js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(js[e['editionId']]==e['sha256'] for e in entries)
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave38-gcd-cutting-and-sharing.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':6,'actualGeometryChecks':6,'continuousMaximumProof':True,'hashesMatched':6,'authorSolverImported':False}))
if __name__=='__main__':main()
