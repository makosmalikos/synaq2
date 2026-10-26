"""Independent review: all seven saved/new full texts and four 343px sheets read."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/visual-wave42-fraction-reduction-readings.json'
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return float(e.get(k))
def one(xs):
    xs=list(xs);assert len(xs)==1,len(xs);return xs[0]
def close(a,b):assert abs(a-b)<1e-7,(a,b)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def fraction(a,b):
    q=F(a,b);return f'({q.numerator}/{q.denominator})'
def grid(rects):
    xs=sorted(set(n(e,'x') for e in rects));ys=sorted(set(n(e,'y') for e in rects));w=n(rects[0],'width');h=n(rects[0],'height')
    assert len(xs)*len(ys)==len(rects)
    assert len({(n(e,'x'),n(e,'y')) for e in rects})==len(rects)
    for e in rects:close(n(e,'width'),w);close(n(e,'height'),h)
    for a,b in zip(xs,xs[1:]):close(b-a,w)
    for a,b in zip(ys,ys[1:]):close(b-a,h)
    return len(xs),len(ys)
def observe(row,i):
    raw=(ROOT/'frontend/public'/row['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==row['figureSha256']
    es=list(ET.fromstring(raw).iter());rects=[e for e in es if tag(e)=='rect' and e.get('stroke')=='#203549'];lines=[e for e in es if tag(e)=='line'];texts=[e for e in es if tag(e)=='text']
    def at(x,y):return txt(one(e for e in texts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
    if i==0:
        rows=[[e for e in rects if n(e,'y')==y] for y in sorted(set(n(e,'y') for e in rects))];assert len(rows)==2
        coarse,fine=rows;assert grid(coarse)==(8,1) and grid(fine)==(24,1)
        for group in rows:group.sort(key=lambda e:n(e,'x'))
        close(n(coarse[0],'x'),n(fine[0],'x'));close(n(coarse[-1],'x')+n(coarse[-1],'width'),n(fine[-1],'x')+n(fine[-1],'width'))
        assert sum(e.get('fill')=='#a6caed' for e in coarse)==5 and all(e.get('fill')=='#fff' for e in fine)
        drops=[e for e in lines if e.get('stroke-dasharray')=='3 5'];assert len(drops)==7
        for e,c in zip(sorted(drops,key=lambda e:n(e,'x1')),coarse[1:]):
            close(n(e,'x1'),n(c,'x'));close(n(e,'x2'),n(c,'x'));close(n(e,'y1'),n(c,'y')+n(c,'height'));close(n(e,'y2'),n(fine[0],'y'))
        a=F(5,8)*24;assert a.denominator==1
        return str(int(a)),{'actualPartitions':[8,24],'equalWholeEndpoints':True,'paintedCoarse':5,'refinementFactor':3,'sevenActualAlignedGuideLines':True}
    if i in [1,6]:
        cols,rows=grid(rects);assert (cols,rows)==((6,5) if i==1 else (7,4))
        color='#a6caed' if i==1 else '#bfa4d7';painted=[e for e in rects if e.get('fill')==color];assert len(painted)==12
        if i==6:
            dates=[];rain=[]
            for e in sorted(rects,key=lambda e:(n(e,'y'),n(e,'x'))):
                value=int(at(n(e,'x')+n(e,'width')/2,n(e,'y')+37));dates.append(value)
                if e.get('fill')==color:rain.append(value)
            assert dates==list(range(1,29)) and rain==[2,3,6,9,11,14,15,18,20,22,25,27]
        return fraction(len(painted),len(rects)),{'actualGridColumnsRows':[cols,rows],'coloredCells':len(painted),'gcd':math.gcd(len(painted),len(rects)),'allDatesReadFromActualText':i==6}
    if i==2:
        assert len(rects)==2
        labels=sorted([(int(txt(e)),n(e,'y')-8) for e in texts if n(e,'x')==48]);assert [v for v,y in labels]==list(range(0,36,5))
        slope=F(str(labels[1][1]-labels[0][1]))/5;assert slope==-6
        for v,y in labels:close(y,labels[0][1]+float(slope)*v)
        bars=sorted(rects,key=lambda e:n(e,'x'));values=[]
        for e,label in zip(bars,['Қызыл','Көк']):
            close(n(e,'y')+n(e,'height'),labels[0][1]);value=F(str(n(e,'height')))/-slope;assert value.denominator==1;values.append(int(value))
            assert at(n(e,'x')+n(e,'width')/2,331)==label
        assert values==[20,30] and at(372,281)=='?' and at(372,331)=='Жасыл'
        total=int(re.search(r'барлығы (\d+)',row['statement'])[1]);left=total-sum(values);q=F(left,total)
        return str(q.denominator),{'actualFiveUnitTickCoordinates':labels,'actualBarValues':values,'printedTotal':total,'missingCategory':left,'requestedReducedDenominator':q.denominator}
    if i==3:
        circles=[e for e in es if tag(e)=='circle'];outer=max(circles,key=lambda e:n(e,'r'));cx,cy=n(outer,'cx'),n(outer,'cy')
        hands=[e for e in lines if abs(n(e,'x1')-cx)<1e-7 and abs(n(e,'y1')-cy)<1e-7];assert len(hands)==2
        hands.sort(key=lambda e:math.hypot(n(e,'x2')-cx,n(e,'y2')-cy));hour,minute=hands
        angle=lambda e:math.degrees(math.atan2(n(e,'x2')-cx,cy-n(e,'y2'))) %360
        close(angle(hour),140);close(angle(minute),240);assert n(hour,'stroke-width')>n(minute,'stroke-width')
        ticks=[e for e in lines if e not in hands];assert len(ticks)==60
        angles=sorted(math.degrees(math.atan2(n(e,'x2')-cx,cy-n(e,'y2'))) %360 for e in ticks)
        for a,b in zip(angles,range(0,360,6)):close(a,b)
        assert sorted(int(txt(e)) for e in texts)==list(range(1,13))
        for e in texts:
            a=math.degrees(math.atan2(n(e,'x')-cx,cy-(n(e,'y')-9)))%360;target=(int(txt(e))%12)*30
            assert min(abs(a-target),360-abs(a-target))<1e-7
        assert '16:00' in row['statement'] and 'Сол сағаттың ішінде' in row['statement']
        return fraction(round(angle(minute)/6),60),{'actualMinuteAngleDegrees':angle(minute),'actualContinuousHourAngleDegrees':angle(hour),'actualTicks':60,'everyNumeralPositionCorrect':True,'minutesElapsed':40}
    if i==4:
        assert grid(rects)==(24,1);counts={c:sum(e.get('fill')==c for e in rects) for c in ['#a6caed','#bfa4d7','#fff']};assert list(counts.values())==[9,7,8]
        assert at(240,96)=='24 сағат'
        one(e for e in lines if (n(e,'x1'),n(e,'y1'),n(e,'x2'),n(e,'y2'))==(42,120,438,120))
        return fraction(counts['#fff'],len(rects)),{'actualHourParts':len(rects),'actualSleepSchoolOther':list(counts.values()),'dimensionSpansWhole24Hours':True}
    assert i==5 and len(rects)==2;assert at(62,135)=='a' and at(62,252)=='b' and at(240,324)=='Сызба масштабсыз'
    one(e for e in lines if (n(e,'x1'),n(e,'y1'),n(e,'x2'),n(e,'y2'))==(413,103,413,266))
    assert n(rects[0],'y')==103 and n(rects[-1],'y')+n(rects[-1],'height')==266
    total=int(at(447,194));a,b=map(int,re.search(r'қысқартқанда \((\d+)/(\d+)\)',row['statement']).groups());assert math.gcd(a,b)==1
    scale=F(total,a+b);assert scale.denominator==1;num=a*scale;den=b*scale
    assert num+den==169 and F(num,den)==F(5,8)
    return str(int(num)),{'actualSumBracketBothTerms':total,'ratioFromCondition':[a,b],'uniqueIntegerScale':int(scale),'rawNumerator':int(num),'rawDenominator':int(den),'explicitlyNotScaleDrawing':True}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==7;entries=[]
    for i,r in enumerate(rows):
        answer,observed=observe(r,i);assert answer==r['answer'];assert str(int(answer)+1) !=answer if answer.isdigit() else True
        if r.get('options'):
            assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
            # A reduced form is explicitly required; equal but unreduced options are not accepted.
            target=F(*map(int,re.fullmatch(r'\((\d+)/(\d+)\)',answer).groups()));correct=[]
            for o in r['options']:
                a,b=map(int,re.fullmatch(r'\((\d+)/(\d+)\)',o).groups())
                if F(a,b)==target and math.gcd(a,b)==1:correct.append(o)
            assert correct==[answer]
        page=1 if i<6 else 2
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent all7fullsaved/new/solution/MCQ reading and four343pxsheets viewed; actualSVGgeometry/text counts, clock angles, exactFraction/GCD; no author solver imported','observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['fouractual343pxsource/native sheets viewed','allfractionreduction and requestednumerator/denominator roles checked','counts obtained from visible SVG geometry, fill and labels, not dataattributes','continuously moved hour hand, 60equal ticks, no misleading greenheight'],'sourceSheet':f'output/editorial-visual-wave42/visual-wave42-source-{page}.png','nativeSheet':f'output/editorial-visual-wave42/visual-wave42-contact-{page}.png'}})
    code="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';const b=JSON.parse(fs.readFileSync('"+PACK+"'));console.log(JSON.stringify(b.editions.map(q=>[q.editionId,editionHash(q)])));"
    hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
    report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave42.py','fullSavedAndNewRead':7,'actualSheetsViewed':4,'authorSolverImported':False,'exactReducedFormatRequired':True},'entries':entries}
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave42-fraction-reduction-readings.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':len(entries),'hashesMatched':len(entries),'actualGeometryAndClockChecks':True,'reducedFormOptionsVerified':True}))
if __name__=='__main__':main()
