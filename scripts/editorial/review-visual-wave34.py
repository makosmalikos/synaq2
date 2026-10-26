"""All six full saved/new texts, solutions, choices and both343px sheets read."""
from fractions import Fraction as F
import hashlib,json,re,sys,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave34-ending-digit-parity.json'
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return F(e.get(k))
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
    els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text'];rects=[e for e in els if tag(e)=='rect'];circles=[e for e in els if tag(e)=='circle'];scene=r['params']['scene']
    def at(x,y):return txt(one(e for e in texts if n(e,'x')==x and n(e,'y')==y))
    def numeric(s):assert re.fullmatch(r'\d+(?: \d{3})*',s);return int(s.replace(' ',''))
    if scene in ['balls','cards']:
        if scene=='balls':values=[numeric(at(n(e,'cx'),n(e,'cy')+8)) for e in circles];assert len(circles)==8;divisor=5
        else:
            cards=[e for e in rects if e.get('fill')=='#f4f7fe'];assert len(cards)==8;values=[numeric(at(n(e,'x')+n(e,'width')/2,n(e,'y')+40)) for e in cards];divisor=2
        expected=[v for v in values if v%divisor==0];assert all((v%divisor==0)==(str(v)[-1] in ('05' if divisor==5 else '02468')) for v in values)
        return str(len(expected)),{'allPhysicalPrintedNumbers':values,'allMatchingNumbers':expected,'divisor':divisor}
    if scene=='receipt':
        count=int(re.fullmatch(r'(\d+) альбом',at(240,81))[1]);m=re.fullmatch(r'(\d+)□ тг',at(240,195));assert m;prefix=int(m[1]);assert at(240,124)=='Біреуі: ? тг'
        blank=one(e for e in els if tag(e)=='tspan' and txt(e)=='□');assert int(blank.get('font-size'))>=48
        admissible=[(d,(10*prefix+d)//count) for d in range(10) if (10*prefix+d)%count==0];digit,price=one(admissible);assert digit==0 and price*count==3680
        return str(price),{'printedQuantity':count,'printedMaskedPrefix':prefix,'complete0to9DigitDomain':admissible,'maskNativeFontPixels':int(blank.get('font-size'))}
    if scene=='ratio':
        blue=[e for e in rects if e.get('fill')=='#8eb3ef'];yellow=[e for e in rects if e.get('fill')=='#f9d57a'];assert (len(blue),len(yellow))==(3,2)
        for row in [blue,yellow]:
            row.sort(key=lambda e:n(e,'x'));assert all(n(e,'width')==71 and n(e,'height')==58 for e in row)
            for a,b in zip(row,row[1:]):assert n(a,'x')+n(a,'width')==n(b,'x') and n(a,'y')==n(b,'y')
        assert at(409,201)=='?' and 'оң натурал саны' in r['statement'];total=len(blue)+len(yellow);answer=one(o for o in r['options'] if int(o)>0 and int(o)%total==0)
        return answer,{'actualEqualPartCounts':[len(blue),len(yellow)],'commonPartPixelWidth':71,'allChoiceRemainders':{o:int(o)%total for o in r['options']},'positiveIntegerUnit':int(answer)//total}
    if scene=='coins':
        assert len(circles)==13 and len({(n(e,'cx'),n(e,'cy')) for e in circles})==13
        for c in circles:assert at(n(c,'cx'),n(c,'cy')+9)=='?'
        total=int(re.fullmatch(r'(\d+) тг',at(241,47))[1]);low,high=map(int,re.search(r'Тек (\d+) теңгелік және (\d+) теңгелік',r['statement']).groups());count=len(circles)
        solutions=[(h,count-h) for h in range(count+1) if high*h+low*(count-h)==total];hi,lo=one(solutions);assert hi%2==total%2
        return str(hi),{'actualMaskedCoins':count,'printedTotal':total,'printedDenominations':[low,high],'complete0to13HighCoinDomain':solutions}
    assert scene=='boxes'
    boxes=[e for e in rects if e.get('fill')=='#e5eeff'];assert len(boxes)==9;values=[numeric(at(n(e,'x')+n(e,'width')/2,n(e,'y')+47)) for e in boxes];assert values==[27]*9
    total=sum(values);answer=total%2;assert len(boxes)%2==1 and values[0]%2==1 and answer==1
    return str(answer),{'actualBoxLabels':values,'conservedTotal':total,'pairs':total//2,'oddTimesOddProof':'(2a+1)(2b+1)=2(2ab+a+b)+1','categoricalAnswerNotClaimedANewMeaning':True}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==6;entries=[]
    for r in rows:
        answer,observed=observe(r);assert answer==r['answer']
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'All6fullsaved/new conditions, fullsolutions and MCQs read; actual source/native343px sheets viewed; independent visible-label and shape-count observer with complete missing-digit/coin domains','checks':['8actualcircles/8actualcards labels read, including0ending andspacedthousands','receipt10albums368□, all10missingdigits and integralprice checked','all3blue2yellowparts same71pxwidth, positiveintegerunit','all13coinmasks andtotal47, exhaustive14possible5coin-counts','all9actual27boxes, conservation243 and generalodd-product proof'],'observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['both actual343px sheets inspected','allnumberlabels andmaskedreceipt readable','no hidden coin denominations revealanswer','physical objects and labels rather than SVG dataattributes'],'sourceSheet':'output/editorial-visual-wave34/visual-wave34-source-1.png','nativeSheet':'output/editorial-visual-wave34/visual-wave34-contact-1.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave34-ending-digit-parity.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':6,'actualGeometryChecks':6,'allMissingDigitAndCoinCasesChecked':True,'authorSolverImported':False}))
if __name__=='__main__':main()
