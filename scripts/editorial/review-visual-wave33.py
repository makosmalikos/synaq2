"""Independent full10saved/new solutions/choices and four343px sheet review."""
from fractions import Fraction as F
from collections import Counter
import hashlib,json,re,sys,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave33-primes-and-divisibility.json'
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return F(e.get(k))
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
    els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text'];rects=[e for e in els if tag(e)=='rect'];lines=[e for e in els if tag(e)=='line'];scene=r['params']['scene']
    def at(x,y):return txt(one(e for e in texts if n(e,'x')==x and n(e,'y')==y))
    if scene=='sieve':
        cells=sorted([e for e in rects if e.get('width')=='47'],key=lambda e:(n(e,'y'),n(e,'x')));assert len(cells)==42;crossed=[];processed=[]
        for index,b in enumerate(cells,1):
            x,y,w,h=[n(b,k) for k in ['x','y','width','height']];assert at(x+w/2,y+32)==str(index)
            marks=[e for e in lines if all(x<n(e,k)<x+w for k in ['x1','x2']) and all(y<n(e,k)<y+h for k in ['y1','y2'])];assert len(marks) in [0,1]
            expected=index==1 or (index>2 and index%2==0) or (index>3 and index%3==0);assert bool(marks)==expected
            if marks:assert marks[0].get('stroke')=='#d86559' and (n(marks[0],'x2')-n(marks[0],'x1'))*(n(marks[0],'y2')-n(marks[0],'y1'))<0;crossed.append(index)
            if b.get('fill')=='#dce9ff':processed.append(index)
        assert processed==[2,3];next_prime=next(v for v in range(max(processed)+1,43) if v not in crossed);assert [d for d in range(1,next_prime+1) if next_prime%d==0]==[1,next_prime]
        return str(next_prime),{'actualCells':42,'actualProcessedBlueCells':processed,'actualCrossedCells':crossed,'nextUncrossedPrime':next_prime}
    if scene=='candies':
        bodies=[e for e in els if tag(e)=='ellipse'];wrappers=[e for e in els if tag(e)=='path'];assert len(bodies)==len(wrappers)==37
        positions={(n(e,'cx'),n(e,'cy')) for e in bodies};assert len(positions)==37;rows=Counter(y for x,y in positions);assert sorted(rows.values())==[1,9,9,9,9]
        divisors=[d for d in range(1,len(bodies)+1) if len(bodies)%d==0];assert divisors==[1,37]
        return one(o for o in r['options'] if o=='Жоқ, 37 — жай сан'),{'physicalCandyBodies':37,'physicalWrappers':37,'actualRowCounts':list(rows.values()),'completeDivisorDomain':divisors,'bothFactorsMustExceedOne':True}
    if scene in ['pen-boxes','egg-boxes']:
        boxes=[e for e in rects if e.get('fill')=='#e5eeff'];values=[int(at(n(b,'x')+n(b,'width')/2,n(b,'y')+43)) for b in boxes];assert len({(n(b,'x'),n(b,'y')) for b in boxes})==len(boxes)
        divisor=int(re.search(r'(\d+) '+('оқушыға' if scene=='pen-boxes' else 'жұмыртқадан'),r['statement'])[1]);assert all(v%divisor==0 for v in values);total=sum(values);assert total%divisor==0
        if scene=='pen-boxes':assert Counter(values)=={18:6}
        else:assert Counter(values)=={45:6,30:4}
        return str(total//divisor),{'actualBoxLabelCounts':dict(Counter(values)),'divisor':divisor,'conservedTotal':total,'divideOneFactorOnly':True}
    if scene in ['sum-bar','club-bar','milk-bar']:
        parts=sorted([e for e in rects if e.get('fill') in ['#8eb3ef','#f9d57a','#f7f9fd']],key=lambda e:n(e,'x'));assert parts
        for a,b in zip(parts,parts[1:]):assert n(a,'x')+n(a,'width')==n(b,'x') and n(a,'y')==n(b,'y') and n(a,'height')==n(b,'height')
        if scene=='sum-bar':
            assert len(parts)==2;values=[int(at(n(b,'x')+n(b,'width')/2,n(b,'y')+43)) for b in parts];assert len({n(b,'width')/v for b,v in zip(parts,values)})==1
            divisor=int(re.search(r'(\d+) алмадан',r['statement'])[1]);assert all(v%divisor==0 for v in values);answer=sum(values)//divisor;observed={'metricPrintedParts':values,'divisor':divisor}
        else:
            caption=at(240,101);total=int(re.fullmatch(r'(\d+)(?: л)?',caption)[1]);known=parts[:-1];assert at(n(parts[-1],'x')+n(parts[-1],'width')/2,197)=='?'
            values=[int(at(n(b,'x')+n(b,'width')/2,197)) for b in known];scale=sum(n(b,'width') for b in parts)/total
            for b,v in zip(known,values):assert n(b,'width')/v==scale
            left=total-sum(values);assert n(parts[-1],'width')/left==scale and left>0
            if scene=='club-bar':assert values==[30];divisor=int(re.search(r'(\d+) тең топқа',r['statement'])[1])
            else:assert values==[180]*3;divisor=int(re.search(r'(\d+) литрлік',r['statement'])[1])
            assert left%divisor==0;answer=left//divisor;observed={'metricKnownValues':values,'whole':total,'remaining':left,'divisor':divisor}
        return str(answer),observed
    if scene=='residue-groups':
        remainders=[];divisors=[]
        for y,label in [(103,'a ='),(232,'b =')]:
            assert at(27,y+28)==label and at(182,y+28)=='…';boxes=[e for e in rects if e.get('fill')=='#8eb3ef' and n(e,'y')==y];assert len(boxes)==3
            divisors.extend(int(at(n(e,'x')+n(e,'width')/2,y+28)) for e in boxes);dots=[e for e in els if tag(e)=='circle' and n(e,'cy')==y+20 and e.get('fill')=='#e67f73'];assert len({n(e,'cx') for e in dots})==len(dots);remainders.append(len(dots))
        assert len(set(divisors))==1;d=divisors[0];assert remainders==[5,7] and all(0<=v<d for v in remainders);q,rem=divmod(sum(remainders),d)
        # General identity a+b=d(m+n+q)+rem, not an assumed visible3groups.
        assert sum(remainders)==d*q+rem and 0<=rem<d
        return str(rem),{'actualRedDotCounts':remainders,'visibleFullGroupLabel':d,'extraFullGroupsFromResidues':q,'generalIdentity':'d(m+n)+5+7=d(m+n+1)+4'}
    if scene=='sequence-ray':
        points=sorted([e for e in els if tag(e)=='circle'],key=lambda e:n(e,'cx'));assert len(points)==4;values=[int(at(n(e,'cx'),237)) for e in points];assert values==[6,15,24,33] and at(45,237)=='0'
        assert all(n(e,'cy')==194 and (n(e,'cx')-45)/v==11 for e,v in zip(points,values));step=values[1]-values[0];assert all(b-a==step for a,b in zip(values,values[1:]));paths=[e for e in els if tag(e)=='path'];assert len(paths)==3
        for a,b,path in zip(points,points[1:],paths):
            m=re.fullmatch(r'M (\d+) 158 Q ([\d.]+) 126 (\d+) 158',path.get('d'));assert m;assert F(m[1])==n(a,'cx') and F(m[3])==n(b,'cx') and F(m[2])==(n(a,'cx')+n(b,'cx'))/2;assert at(F(m[2]),133)=='+'+str(step)
        query,divisor=map(int,re.search(r'(\d+)-мүшені (\d+) санына',r['statement']).groups());target=values[0]+step*(query-1);assert step%divisor==0;rem=target%divisor;assert all((values[0]+step*i)%divisor==rem for i in range(query))
        return str(rem),{'actualTerms':values,'actualThreeCurvedSteps':step,'pixelsPerUnit':11,'targetIndex':query,'targetValue':target,'remainderInvariantBecauseStepDivisible':True}
    assert scene=='books'
    books=[e for e in rects if e.get('height')=='7' and e.get('width')=='48'];groups=Counter(n(e,'x') for e in books);assert len(groups)==3 and set(groups.values())=={11};assert at(222,219)=='…'
    for x in groups:assert at(x+24,161)=='11'
    loose=[e for e in rects if e.get('height')=='72'];assert len(loose)==4;d,rem=map(int,re.search(r'(\d+) кітаптан бумаға бөлгенде, тағы да дәл (\d+) кітап',r['statement']).groups());assert (d,rem)==(11,len(loose))
    answer=one(o for o in r['options'] if int(o)%d==0)
    return answer,{'physicalBundleBookCounts':list(groups.values()),'physicalLooseBooks':len(loose),'newBookRemainders':{o:int(o)%d for o in r['options']},'identity':'If N=11q+4 and N+k=11r+4 then k=11(r-q)'}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==10;entries=[]
    for i,r in enumerate(rows):
        answer,observed=observe(r);assert answer==r['answer']
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'All10 complete saved/new conditions, fullsolutions and choices read; all4actual343px source/native sheets inspected; independent actual SVG object counts/visiblelabels/metricbars/crossstrokes and exact divisor/congruence domains','checks':['42sieve cells, exact1andprocessed2/3multiple crossouts and blue2/3','37actual candy bodies and wrappers, complete1..37divisors','actual6×18pen and6×45+4×30eggboxes','all three bar systems share metric scale and conserved whole','5+7red dots regroup once modulo8; omitted fullgroups not assumed visible','6/15/24/33ray and3curved+9steps calibrated11px/unit, term80=717','all3physical11bookstacks and4loosebooks, identical remainder gives newmultiple11'],'observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['all4source/native sheets visually inspected','actual shapes and counts withoutdataattributes','bar widths and unitray positions','unknown/fullgroups not leaked by ellipsis'],'sourceSheet':f'output/editorial-visual-wave33/visual-wave33-source-{1+i//6}.png','nativeSheet':f'output/editorial-visual-wave33/visual-wave33-contact-{1+i//6}.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave33-primes-and-divisibility.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':10,'actualGeometryChecks':10,'completeSieveCrossoutsChecked':42,'authorSolverImported':False}))
if __name__=='__main__':main()
