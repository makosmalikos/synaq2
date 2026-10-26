"""All6 full saved/new conditions, solutions and MCQs read; both343px sheets viewed."""
from fractions import Fraction as F
from itertools import permutations
from pathlib import Path
import hashlib,json,re,sys,xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/visual-wave35-digit-sum-models.json'
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return F(e.get(k))
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes()
    assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
    els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text'];rects=[e for e in els if tag(e)=='rect']
    def at(x,y):return txt(one(e for e in texts if n(e,'x')==x and n(e,'y')==y))
    scene=r['params']['scene']
    if scene=='number-cards':
        cards=[e for e in rects if e.get('fill')=='#f4f7fe'];assert len(cards)==7
        values=[int(at(n(e,'x')+n(e,'width')/2,n(e,'y')+40)) for e in cards]
        sums=[sum(map(int,str(v))) for v in values]
        assert all((v%3==0)==(s%3==0) for v,s in zip(values,sums))
        selected=[v for v in values if v%3==0]
        return str(len(selected)),{'actualPrintedCards':values,'digitSums':sums,'selected':selected}
    if scene=='abacus':
        rods=[e for e in els if tag(e)=='line'];beads=[e for e in els if tag(e)=='ellipse'];assert len(rods)==4
        rods.sort(key=lambda e:n(e,'x1'));digits=[]
        for i,rod in enumerate(rods):
            x=n(rod,'x1');assert x==n(rod,'x2') and n(rod,'y1')==47 and n(rod,'y2')==285
            assert int(at(x,332))==10**(3-i)
            found=[e for e in beads if n(e,'cx')==x];digits.append(len(found))
            assert all(n(e,'rx')==20 and n(e,'ry')==9 for e in found)
            ys=sorted(n(e,'cy') for e in found);assert len(set(ys))==len(ys)
            assert all(b-a==27 for a,b in zip(ys,ys[1:]));assert ys[-1]+9<285
        assert len(beads)==sum(digits);value=sum(d*10**(3-i) for i,d in enumerate(digits))
        assert value%3==sum(digits)%3
        return str(sum(digits)),{'actualBeadCounts':digits,'readNumber':value,'digitSum':sum(digits),'all18BeadsDistinct':True}
    if scene=='bag-parts':
        cells=[e for e in rects if e.get('fill')=='#8eb3ef'];ys=sorted(set(n(e,'y') for e in cells));assert len(ys)==3
        counts=[]
        for i,y in enumerate(ys):
            row=sorted((e for e in cells if n(e,'y')==y),key=lambda e:n(e,'x'));counts.append(len(row))
            assert at(49,y+31)==str(i+1)
            assert all(n(e,'width')==66 and n(e,'height')==46 for e in row)
            assert all(n(a,'x')+66==n(b,'x') for a,b in zip(row,row[1:]))
        assert counts==[2,3,4] and at(443,197)=='? кг'
        assert 'килограммен оң натурал масса' in r['statement']
        total=sum(counts);choices=[int(re.fullmatch(r'(\d+) кг',o)[1]) for o in r['options']]
        answer=one(v for v in choices if v>0 and v%total==0);unit=answer//total
        return f'{answer} кг',{'actualEqualCells':counts,'commonPixelWidth':66,'integerUnitKilograms':unit,'allChoiceRemainders':[v%total for v in choices],'masses':[c*unit for c in counts]}
    if scene in ['three-cards','five-cards']:
        cards=sorted((e for e in rects if e.get('fill')=='#fff1c8'),key=lambda e:n(e,'x'))
        digits=[int(at(n(e,'x')+n(e,'width')/2,196)) for e in cards]
        assert len(set(digits))==len(digits)
        if scene=='three-cards':
            assert len(digits)==3 and 0 in digits
            all_values=[''.join(map(str,p)) for p in permutations(digits)]
            valid=[int(v) for v in all_values if v[0]!='0' and int(v)%3==0]
            assert sorted(valid)==[408,480,804,840]
            return str(len(valid)),{'allSixPermutations':all_values,'noLeadingZeroEligible':valid,'excludedLeadingZero':['048','084']}
        assert len(digits)==5
        possible={d:[int(''.join(map(str,p))) for p in permutations([n for n in digits if n!=d]) if p[0]!=0 and int(''.join(map(str,p)))%3==0] for d in digits}
        omitted=one(d for d,solutions in possible.items() if solutions)
        return str(omitted),{'actualDigitLabels':digits,'remainingSums':{d:sum(digits)-d for d in digits},'allOmissionPermutationCounts':{d:len(v) for d,v in possible.items()},'witness':possible[omitted][0]}
    assert scene=='prices'
    prices=[int(re.fullmatch(r'(\d+) тг',at(x,270))[1]) for x in [88,240,392]]
    assert [at(88,223),at(240,238),at(392,223)]==['Қарындаш','Дәптер','Өшіргіш']
    pencil,notebook,eraser=prices
    fixed,minimumN,minimumE=map(int,re.search(r'Әсет (\d+) қарындаш, кемінде (\d+) дәптер және кемінде (\d+) өшіргіш',r['statement']).groups())
    def all_ways(total):
        return [(a,b) for a in range(minimumN,total//notebook+1) for b in range(minimumE,total//eraser+1) if fixed*pencil+a*notebook+b*eraser==total]
    choices=[int(re.fullmatch(r'(\d+) тг',o)[1]) for o in r['options']]
    feasible={v:all_ways(v) for v in choices};answer=one(v for v,ways in feasible.items() if ways)
    assert feasible[answer]==[(7,16),(14,11),(21,6)]
    # Divisibility is necessary, not sufficient:189 passes9 but cannot buy the required minimums.
    assert 189%9==0 and not all_ways(189)
    assert all(v%9!=0 for v in choices if v!=answer)
    return f'{answer} тг',{'actualPrintedUnitPrices':prices,'fixedPencils':fixed,'minimumNotebookEraser':[minimumN,minimumE],'completeFeasiblePairs':feasible,'divisibleButInfeasibleCanary':189}

def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==6;entries=[]
    for r in rows:
        answer,observed=observe(r);assert answer==r['answer']
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
        assert answer!='wrong-key'
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'All6fullsaved/new conditions, fullsolutions andMCQs read; both343px source/native sheets viewed; independent actual printed-label/shape observer; full permutation and purchase integer domains, no author solver imported','checks':['7actualnumbercards; digit-sum and remainder agree','4physicalrods,18distinctbeads, actualplacevalue labels','2+3+4equal66pxcells; explicitpositiveintegerkgunit','all6digitpermutations; noleadingzero, all5omission cases','allfeasible purchase pairs;189divisibleby9butimpossible minimums'],'observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['bothactual343pxsheets viewed','all labels readable','shapes and prices observed independently of data attributes','new arrangement and values, no reused source bitmap'],'sourceSheet':'output/editorial-visual-wave35/visual-wave35-source-1.png','nativeSheet':'output/editorial-visual-wave35/visual-wave35-contact-1.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave35-digit-sum-models.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':6,'actualShapeAndPrintedLabelChecks':6,'completeFiniteDomains':True,'authorSolverImported':False}))
if __name__=='__main__':main()
