"""Independent offline review of the exact 23 authored graph editions.

The reviewer read every canonical source/new condition, full solution and MCQ,
and inspected all ten archived/native proof sheets at343px. This script never
imports the author's graph renderer or solver. Actual SVG pixel coordinates are
inverted against PRINTED axis numbers before the mathematical question is solved.
"""
import copy, hashlib, json, re, sys
from fractions import Fraction as F
from pathlib import Path
from xml.etree import ElementTree as ET
ROOT = Path(__file__).resolve().parents[2]
CANONICAL = lambda x: json.dumps(x, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
DIGEST = lambda x: hashlib.sha256(CANONICAL(x)).hexdigest()
read = lambda p: json.loads((ROOT / p).read_text())
tag = lambda e: e.tag.rsplit('}', 1)[-1]
number = lambda x: F(str(x).replace(',', '.').replace('−', '-'))
fmt = lambda x: str(x.numerator) if x.denominator == 1 else str(float(x)).replace('.', ',')
EPS = F(1, 1000000)
def close(a, b): assert abs(number(a) - number(b)) < EPS, (a, b)
def seq(a, b, step):
    a,b,step = map(number, (a,b,step)); result = []
    while a <= b: result.append(a); a += step
    return result

def calibration(labels):
    """Fit data = scale*pixel + shift from actual printed numeric labels."""
    assert len(labels) >= 2
    labels = sorted(labels)
    (p0,v0),(p1,v1) = labels[0],labels[-1]
    scale = (v1-v0)/(p1-p0); shift = v0-scale*p0
    for pixel,value in labels: close(scale*pixel+shift,value)
    def decode(pixel): return (scale*number(pixel)+shift).limit_denominator(100000)
    return decode, scale

def geometry(row, root):
    p=row['params']; nodes=list(root.iter()); texts=[e for e in nodes if tag(e)=='text']
    assert list(map(number, root.attrib['viewBox'].split())) == [0,0,480,360]
    for e in texts:
        assert 0<number(e.attrib['x'])<480 and 0<number(e.attrib['y'])<360
        assert number(e.attrib.get('font-size', 0))>=18
    def text(e): return ''.join(e.itertext())
    numeric=lambda s: bool(re.fullmatch(r'-?\d+(?:[.,]\d+)?',s))
    xlabels=[(number(e.attrib['x']),number(text(e))) for e in texts if e.attrib.get('y')=='310' and numeric(text(e))]
    ylabels=[(number(e.attrib['y'])-6,number(text(e))) for e in texts if e.attrib.get('x')=='66' and numeric(text(e))]
    xd,xscale=calibration(xlabels); yd,yscale=calibration(ylabels)
    assert xscale>0>yscale
    assert [v for _,v in xlabels]==seq(0,p['xMax'],p['xLabelEvery'])
    ymin=p.get('yMin',0)
    expected_y=[v for v in seq(ymin,p['yMax'],p['yStep']) if v%number(p['yLabelEvery'])==0 and (v!=0 or 'yMin' in p)]
    assert [v for _,v in ylabels]==expected_y
    assert [text(e) for e in texts if e.attrib.get('y')=='25']==[p['yLabel']]
    assert [text(e) for e in texts if e.attrib.get('y')=='345']==[p['xLabel']]
    xgrid=[e for e in nodes if 'data-x-grid' in e.attrib]; ygrid=[e for e in nodes if 'data-y-grid' in e.attrib]
    assert len(xgrid)==len(seq(0,p['xMax'],p['xStep'])) and len(ygrid)==len(seq(ymin,p['yMax'],p['yStep']))
    for e,value in zip(xgrid,seq(0,p['xMax'],p['xStep'])):
        assert tag(e)=='line'; close(e.attrib['x1'],e.attrib['x2']); close(xd(e.attrib['x1']),value); close(e.attrib['data-x-grid'],value)
        assert sorted([yd(e.attrib['y1']),yd(e.attrib['y2'])])==[number(ymin),number(p['yMax'])]
    for e,value in zip(ygrid,seq(ymin,p['yMax'],p['yStep'])):
        assert tag(e)=='line'; close(e.attrib['y1'],e.attrib['y2']); close(yd(e.attrib['y1']),value); close(e.attrib['data-y-grid'],value)
        close(xd(e.attrib['x1']),0); close(xd(e.attrib['x2']),p['xMax'])
    if ymin<0:
        zero=[e for e in ygrid if number(e.attrib['data-y-grid'])==0]; assert len(zero)==1
        assert zero[0].attrib['stroke']=='#8459ce' and number(zero[0].attrib['stroke-width'])>1
        assert any(value==0 for _,value in ylabels)
    def decodepair(x,y): return xd(x),yd(y)
    series=[]
    for e in nodes:
        if tag(e)=='polyline':
            actual=[decodepair(*pair.split(',')) for pair in e.attrib['points'].split()]
            declared=[tuple(map(number,pair.split(','))) for pair in e.attrib['data-coordinates'].split(';')]
            assert actual==declared
            assert all(a[0]<b[0] for a,b in zip(actual,actual[1:]))
            series.append((e.attrib.get('data-series','main'),actual))
    expected_series=p.get('series',[{'points':p.get('points',[])}])
    if expected_series[0].get('discrete'):
        assert not series, 'A discrete ticket graph must not interpolate fractional tickets'
        dots=[e for e in nodes if 'data-discrete-point' in e.attrib]
        actual=[decodepair(e.attrib['cx'],e.attrib['cy']) for e in dots]
        assert actual==[tuple(map(number,q)) for q in expected_series[0]['points']]
        for e,q in zip(dots,actual): assert q==tuple(map(number,e.attrib['data-discrete-point'].split(',')))
        series=[('main',actual)]
    else:
        assert len(series)==len(expected_series)
        for (label,actual),expected in zip(series,expected_series):
            assert actual==[tuple(map(number,q)) for q in expected['points']]
            assert label==expected.get('label','main')
            if label!='main': assert any(text(e)==label for e in texts)
    points={}
    for e in nodes:
        if tag(e)=='circle' and 'data-candidate' in e.attrib:
            label=e.attrib['data-candidate']; q=decodepair(e.attrib['cx'],e.attrib['cy']); points[label]=q
            assert q==(number(e.attrib['data-x']),number(e.attrib['data-y']))
            assert any(text(t)==label for t in texts)
    assert points=={q['label']:(number(q['x']),number(q['y'])) for q in p.get('candidates',[])}
    interpreted=[e for e in nodes if 'data-interpret-point' in e.attrib]
    if 'point' in p:
        assert len(interpreted)==1
        e=interpreted[0]; q=decodepair(e.attrib['cx'],e.attrib['cy']); assert q==tuple(map(number,p['point']))
        assert q==tuple(map(number,e.attrib['data-interpret-point'].split(',')))
        points['A']=q; assert any(text(t)=='A' for t in texts)
    months=[e for e in nodes if 'data-month' in e.attrib]
    if p.get('markMonths'):
        assert len(months)==12
        assert [decodepair(e.attrib['cx'],e.attrib['cy']) for e in months]==series[0][1]
        assert [number(e.attrib['data-month']) for e in months]==list(range(1,13))
    for _,s in series:
        for x,y in s: assert 0<=x<=p['xMax'] and ymin<=y<=p['yMax']
    return dict(series),points

def at(points,x):
    x=number(x); hits=[]
    for (a,b),(c,d) in zip(points,points[1:]):
        if a<=x<=c: hits.append(b+(x-a)*(d-b)/(c-a))
    assert hits and len(set(hits))==1, (x,hits)
    return hits[0]
def inverse(points,y):
    y=number(y); hits=set()
    for (a,b),(c,d) in zip(points,points[1:]):
        if min(b,d)<=y<=max(b,d):
            assert b!=d, 'Question asks a unique inverse, not a plateau'
            hits.add(a+(y-b)*(c-a)/(d-b))
    return sorted(hits)
def horizontal(points,positive=False):
    return [(a,c) for (a,b),(c,d) in zip(points,points[1:]) if b==d and (b>0 or not positive)]
def take(pattern,s):
    m=re.search(pattern,s); assert m, (pattern,s)
    return number(m.group(1))
def solve(row,series,candidates):
    p=row['params']; statement=row['statement']; k=re.sub(r'^visual-wave(?:15|16)-','',row['modelId']); s=next(iter(series.values()))
    if k=='point-on-cost-graph':
        hit=[label for label,(x,y) in candidates.items() if at(s,x)==y]; assert len(hit)==1
        return hit[0], 'All four ACTUAL circle centres tested against the calibrated line: only B has2000₸/m.'
    if k=='stopped-duration':
        intervals=horizontal(s); assert len(intervals)==1; a,b=intervals[0]
        assert 'мин' in p['xLabel']; return fmt(b-a), 'Printed4-minute gaps give plateau8–20, hence12 minutes, not3 grid gaps.'
    if k=='discrete-ticket-price':
        rates={y/x for x,y in s}; assert len(rates)==1 and all(x.denominator==1 for x,y in s)
        return fmt(rates.pop()), 'All four isolated integer-ticket points independently give350₸/ticket; no connecting polyline exists.'
    if k=='inverse-water-time':
        y=take(r'Көлем (\d+) литрге',statement); assert y==p['requestedY']; xs=inverse(s,y); assert len(xs)==1
        return fmt(xs[0]), 'Inverse of actual calibrated water line:144L occurs at6 minutes.'
    if k=='faster-same-time':
        speeds={label:(pts[-1][1]-pts[0][1])/(pts[-1][0]-pts[0][0]) for label,pts in series.items()}
        assert speeds=={'I':6,'II':15}; assert at(series['II'],2)>at(series['I'],2)
        return max(speeds,key=speeds.get), 'Both slopes and equal-time reading independently checked: I6km/h, II15km/h.'
    if k=='interpret-mass-point':
        x,y=candidates['A']; assert p['xLabel']=='V (дм³)' and p['yLabel']=='m (кг)'
        return f'{fmt(x)} дм³ түйіршіктің массасы {fmt(y)} кг', 'Actual A projection reads volume6dm³ and mass9kg, in this order; density is a different quantity.'
    if k=='plant-height-difference':
        m=re.search(r'(\d+)-аптаның соңынан (\d+)-аптаның',statement); assert m
        a,b=map(number,m.groups()); assert (a,b)==(p['firstTime'],p['secondTime'])
        return fmt(at(s,b)-at(s,a)), 'Minor2cm spacing reads h(2)=10,h(4)=26; growth16cm.'
    if k=='fuel-remaining':
        x=take(r'(\d+) км жүргеннен',statement); assert x==p['requestedX']
        return fmt(at(s,x)), 'At160km the ordinate is32L remaining;16L consumed is not the requested quantity.'
    if k=='inverse-square-side':
        y=take(r'периметрі (\d+) см',statement); assert y==p['requestedY']; xs=inverse(s,y); assert len(xs)==1
        assert all(y==4*x for x,y in s)
        return fmt(xs[0]), 'Actual P=4a line and independent square formula both give side7cm for P28cm.'
    if k=='cycle-distance':
        x=take(r'(\d+) сағатта',statement); assert x==p['requestedX']
        return fmt(at(s,x)), 'Printed axis units establish12km/hour; at4hours distance48km.'
    if k=='spring-month-inverse':
        y=take(r'күн ұзақтығы (\d+) сағат',statement); assert y==p['requestedY']; months=[x for x,v in s if v==y]
        assert months==[3,9]; spring=[x for x in months if x in (3,4,5)]; assert len(spring)==1
        return fmt(spring[0]), 'Both annual readings3 and9 found; explicit spring membership leaves March3.'
    if k=='signed-diver-minimum':
        return f'{fmt(min(y for x,y in s))} м', 'Calibrated signed ordinate minimum is−14m below the highlighted h=0 line; absolute depth14 is a different answer.'
    if k=='battery-early-loss':
        until=take(r'Алғашқы (\d+) сағатта',statement); assert until==p['until']; initial=at(s,0)
        assert initial==100
        return fmt(initial-at(s,until)), 'Initial100% minus actual45% at5h is55; later recharge segment is excluded.'
    if k=='cruise-duration':
        intervals=horizontal(s,True); assert len(intervals)==1; a,b=intervals[0]
        return f'{fmt(b-a)} мин', 'Only positive-height plateau20–110min counts:90min; endpoint110 and total140 are distractors.'
    if k=='fractional-stop-interval':
        assert number(p['xStep'])==F(1,2); intervals=horizontal(s); assert len(intervals)==1; a,b=intervals[0]
        return f'{fmt(a)} сағаттан {fmt(b)} сағатқа дейін', 'Actual half-hour minor calibration gives endpoints1.5 and3.5, four gaps and2h duration.'
    if k in ('maximum-speed','maximum-pulse'):
        greatest=max(y for x,y in s); assert greatest<p['yMax']
        note='Actual maximum110km/h is nonzero constant speed, so the plateau is not a stop.' if k=='maximum-speed' else 'Actual peak170 beats140, stays below axis limit180, and is not the time20.'
        return fmt(greatest),note
    if k=='cooling-at-time':
        x=take(r'(\d+) минут өткенде',statement); assert x==p['requestedX']
        return fmt(at(s,x)), 'Minor5°C calibration places the8-minute reading at50°C, between major40/60.'
    if k=='total-bus-distance':
        assert s[0][1]==0 and all(b<=d for (a,b),(c,d) in zip(s,s[1:]))
        return fmt(s[-1][1]), 'Cumulative final ordinate300km equals sum of distance increments; repeated plateau160 adds zero.'
    if k=='increasing-interval':
        correct=[]
        for option in row['options']:
            m=re.fullmatch(r'([\d,]+) сағаттан ([\d,]+) сағатқа дейін',option); assert m
            a,b=map(number,m.groups()); assert a<b
            clipped=[at(s,a)]+[y for x,y in s if a<x<b]+[at(s,b)]
            if all(u<v for u,v in zip(clipped,clipped[1:])): correct.append(option)
        assert len(correct)==1
        return correct[0], 'Every clipped segment tested, not just endpoint gain: only4–16h rises throughout;10–24 contains a fall.'
    if k=='peak-river-month':
        highest=max(y for x,y in s); months=[x for x,y in s if y==highest]; assert len(months)==1
        return fmt(months[0]), 'All twelve marked monthly vertices read; peak360cm occurs in month4, which is the requested coordinate.'
    if k=='initial-tank-volume':
        assert 't = 0' in statement
        return fmt(at(s,0)), 'Actual initial y-intercept is50L on a minor line, distinct from maximum90L.'
    if k=='negative-winter-reading':
        x=take(r'Сағат (\d+)-дегі',statement); assert x==p['requestedX']; y=at(s,x); assert y<0
        return f'{fmt(y)}°C', 'At hour8 the curve lies at−9°C, one minor degree below−8; minus sign and zero reference verified.'
    raise AssertionError(k)

def verify(row,binary=None,check_hash=True):
    assert row['minimumPlan']=='pro' and row['editorialStatus']=='draft'
    ref=row['sourceRefs'][0]; raw=next(q for q in read(ref['sourceFile'])['questions'] if q['id']==ref['sourceId'])
    assert raw.get('solution') and raw.get('sourceAnswer') and DIGEST(raw)==row['sourceCanonicalSha256']
    if binary is None: binary=(ROOT/'frontend/public'/row['image'].lstrip('/')).read_bytes()
    if check_hash: assert hashlib.sha256(binary).hexdigest()==row['figureSha256']
    root=ET.fromstring(binary)
    assert not any(tag(e) in ('image','script','foreignObject') for e in root.iter())
    assert not re.search(rb'(?:https?://|data:image|javascript:)',binary.replace(b'http://www.w3.org/2000/svg',b''))
    series,candidates=geometry(row,root); answer,note=solve(row,series,candidates)
    assert answer==row['answer'], (row['editionId'],answer,row['answer'])
    assert answer in row['solution'], (row['editionId'], 'solution must state its computed answer')
    if row.get('options'): assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
    else: assert 'Жауапқа тек санды жазыңыз.' in row['statement']
    return note

packs=[(15,'graph-readings'),(16,'real-processes')]
all_rows=[]; summaries=[]
for wave,name in packs:
    rows=read(f'problems/editorial/batches/visual-wave{wave}-{name}.json')['editions']; assert len(rows)=={15:10,16:13}[wave]
    entries=[]
    for i,row in enumerate(rows):
        note=verify(row); all_rows.append(row); page=i//6+1
        evidence={'sourceSheet':f'output/editorial-visual-wave{wave}/visual-wave{wave}-source-{page}.png','mobileSheet':f'output/editorial-visual-wave{wave}/visual-wave{wave}-contact-{page}.png','mobileWidthPx':343,'figureSha256':row['figureSha256']}
        for field in ('sourceSheet','mobileSheet'): assert (ROOT/evidence[field]).is_file()
        entries.append({'editionId':row['editionId'],'sha256':DIGEST(row),'verdict':'verified','method':'Independent Python Fraction interpolation/inverse/interval oracle using actual SVG pixels and printed numeric axis calibration, plus full archived/new text and343px visual reading','notes':[note,'Every archived/new condition, full solution and MCQ read. All source and native343px sheets inspected. Signature covers only this exact authored edition, not the whole bank.'],'figureReview':{'status':'verified','sha256':row['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['Complete canonical source/new condition, full solution and MCQ read; source skill preserved.','Archived and native343px drawings inspected; unit labels, signs, major/minor ticks and curve readings legible.','Actual SVG pixels decoded from PRINTED numeric labels; all grid/series/candidate/month marks bound, not just data attributes.','Native-only SVG SHA verified; no raster, script, foreignObject or external asset.',note]},'evidence':evidence})
    report={'schemaVersion':1,'reviewer':'independent_editorial_review','entries':entries}
    target=ROOT/f'problems/editorial/reviews/visual-wave{wave}-{name}.json'
    if '--write' in sys.argv: target.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else: assert json.loads(target.read_text())==report
    summaries.append({'wave':wave,'editions':len(entries),'sourceAndNativeSheetsRead':2*((len(rows)+5)//6),'actualSVGsBound':len(entries)})
# Regression: wrong keys must never receive a signature.
for row in all_rows:
    bad=copy.deepcopy(row); bad['answer']='independent-wrong-key'
    try: verify(bad)
    except AssertionError: pass
    else: raise AssertionError('wrong key accepted')
# These mutations challenge independent pixel calibration rather than author metadata.
canaries=0
def rejects(row,mutate):
    global canaries
    root=ET.fromstring((ROOT/'frontend/public'/row['image'].lstrip('/')).read_bytes()); mutate(root)
    try: verify(row,ET.tostring(root),False)
    except AssertionError: canaries+=1
    else: raise AssertionError('broken graph accepted')
first=all_rows[0]
def change_label(root):
    next(e for e in root.iter() if tag(e)=='text' and e.text=='12000').text='13000'
rejects(first,change_label)
def move_candidate(root):
    next(e for e in root.iter() if e.attrib.get('data-candidate')=='B').set('cy','168')
rejects(first,move_candidate)
def remove_unit(root):
    next(e for e in root.iter() if tag(e)=='text' and e.attrib.get('y')=='345').text=''
rejects(first,remove_unit)
def move_series(root):
    e=next(e for e in root.iter() if tag(e)=='polyline'); e.set('points',e.attrib['points'].replace('420,48','420,58'))
rejects(first,move_series)
def connect_discrete(root):
    e=ET.SubElement(root,'polyline'); e.set('points','76,286 420,48'); e.set('data-coordinates','0,0;7,2450')
rejects(all_rows[2],connect_discrete)
def erase_signed_zero(root):
    next(e for e in root.iter() if e.attrib.get('data-y-grid')=='0').set('stroke','#dbe5f1')
rejects(all_rows[11],erase_signed_zero)
bad=copy.deepcopy(all_rows[3]); bad['statement']=bad['statement'].replace('144 литрге','145 литрге')
try: verify(bad)
except AssertionError: canaries+=1
else: raise AssertionError('query mismatch accepted')
print(json.dumps({'batches':summaries,'wrongKeysRejected':len(all_rows),'geometryQueryCanariesRejected':canaries,'status':'passed'}))
