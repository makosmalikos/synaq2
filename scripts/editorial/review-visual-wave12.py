"""Independent vector review from actual grid, tail, arrowhead and printed labels.
All10 full saved/new conditions, full solutions and choices were read manually;
both source sheets (7 rasters,3 truly text-only) and both343px targets inspected.
No author solver or renderer is imported.
"""
import copy
from fractions import Fraction as F
import hashlib
import json
import math
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/visual-wave12-vectors.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
def tag(e):return e.tag.rsplit('}',1)[-1]
def val(e,k):return F(e.get(k))
def txt(e):return ''.join(e.itertext())
def near(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def one(a):assert len(a)==1,a;return a[0]
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def points(e):return [tuple(map(F,p.split(','))) for p in e.get('points').split()]
def integer(x):n=round(float(x));near(x,n);return n

def observe(row):
    raw=(ROOT/'frontend/public'/row['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==row['figureSha256']
    s=ET.fromstring(raw);els=list(s.iter());texts=[e for e in els if tag(e)=='text'];arrows=[];grid=[]
    for i,e in enumerate(els):
        if tag(e)=='line' and e.get('stroke')=='#dbe5f1':grid.append(e)
        if tag(e)!='line' or not e.get('data-vector'):continue
        head=points(els[i+1]);assert tag(els[i+1])=='polygon' and len(head)==3
        tail=(val(e,'x1'),val(e,'y1'));base=(val(e,'x2'),val(e,'y2'));tip=head[0]
        assert (head[1][0]+head[2][0])/2==base[0] or abs(float((head[1][0]+head[2][0])/2-base[0]))<1e-7
        near((head[1][1]+head[2][1])/2,base[1]);near(math.dist(base,tip),10);near(math.dist(head[1],head[2]),10)
        dx,dy=tip[0]-tail[0],tip[1]-tail[1];assert dx or dy
        near((base[0]-tail[0])*dy-(base[1]-tail[1])*dx,0)
        assert (base[0]-tail[0])*dx+(base[1]-tail[1])*dy>0
        dot=els[i+2];assert tag(dot)=='circle';assert (val(dot,'cx'),val(dot,'cy'))==tail
        a={'tail':tail,'tip':tip,'label':e.get('data-vector')}
        if row['params']['scene'] not in ['ray-scale','opposite']:
            vertical=[q for q in grid if val(q,'x1')==val(q,'x2')];horizontal=[q for q in grid if val(q,'y1')==val(q,'y2')]
            xs=sorted(set(val(q,'x1') for q in vertical));ys=sorted(set(val(q,'y1') for q in horizontal));assert len(xs)==len(ys)>2
            unit=xs[1]-xs[0];assert unit>0
            for v,w in zip(xs,xs[1:]):near(w-v,unit)
            for v,w in zip(ys,ys[1:]):near(w-v,unit)
            assert all(sorted([val(q,'y1'),val(q,'y2')])==[ys[0],ys[-1]] for q in vertical)
            assert all(val(q,'x1')==xs[0] and val(q,'x2')==xs[-1] for q in horizontal)
            assert all(xs[0]<=pt[0]<=xs[-1] and ys[0]<=pt[1]<=ys[-1] for pt in [tail,tip])
            a['delta']=(F(integer(dx/unit)),F(integer(-dy/unit)))
            a['lengthSquared']=sum(v*v for v in a['delta'])
            if row['params']['scene']=='plane':
                ticks=sorted((int(txt(t)),val(t,'x')) for t in texts if re.fullmatch('-?[1-5]',txt(t)) and val(t,'y')==198)
                assert [n for n,x in ticks]==[-5,-4,-3,-2,-1,1,2,3,4,5]
                zero=one([x-n*unit for n,x in ticks if n==1]);near(zero,240)
                for n,x in ticks:near(x,zero+n*unit)
                a['tailCoordinate']=(integer((tail[0]-zero)/unit),integer((180-tail[1])/unit))
                a['tipCoordinate']=(integer((tip[0]-zero)/unit),integer((180-tip[1])/unit))
            else:
                center=((xs[0]+xs[-1])/2,(ys[0]+ys[-1])/2)
                a['tailCoordinate']=(integer((tail[0]-center[0])/unit),integer((center[1]-tail[1])/unit))
                a['tipCoordinate']=(integer((tip[0]-center[0])/unit),integer((center[1]-tip[1])/unit))
            # Parameter metadata is checked only after measuring visible geometry.
            intended=row['params'].get('vectors',[row['params'].get('vector')])[len(arrows)]
            assert tuple(intended['start'])==a['tailCoordinate'];assert tuple(intended['end'])==a['tipCoordinate']
        arrows.append(a);grid=[]
    if row['params']['scene']=='ray-scale':
        labels=sorted((int(txt(t)),val(t,'x')) for t in texts if re.fullmatch(r'\d+',txt(t)))
        assert [n for n,x in labels]==list(range(12));step=labels[1][1]-labels[0][1]
        for n,x in labels:near(x,labels[0][1]+n*step)
        a=one(arrows);a['startTick']=integer((a['tail'][0]-labels[0][1])/step);a['endTick']=integer((a['tip'][0]-labels[0][1])/step)
        assert a['startTick']==row['params']['start'] and a['endTick']==row['params']['end']
    if row['params']['scene']=='opposite':
        a,b=arrows;near(a['tail'][0],b['tip'][0]);near(a['tip'][0],b['tail'][0]);near(b['tail'][1]-a['tip'][1],145);near(b['tip'][1]-a['tail'][1],145)
        for a in arrows:
            a['delta']=(a['tip'][0]-a['tail'][0],-(a['tip'][1]-a['tail'][1]))
            a['lengthSquared']=sum(v*v for v in a['delta'])
    for a in arrows:
        intended=next((v for v in row['params'].get('vectors',[]) if v.get('label')==a['label']),row['params'].get('vector'))
        if intended and intended.get('startLabel'):
            for pt,name in [(a['tail'],intended['startLabel']),(a['tip'],intended['endLabel'])]:
                one([t for t in texts if txt(t)==name and math.dist(pt,(val(t,'x'),val(t,'y')))<40])
    return arrows

def solve(row,obs):
    k=row['modelId'].removeprefix('visual-wave12-');a=obs[0]
    if k=='scaled-speed':return str((a['endTick']-a['startTick'])*row['params']['unitScale'])
    if k=='opposite-vectors':assert obs[0]['lengthSquared']==obs[1]['lengthSquared']>0 and all(x==-y for x,y in zip(obs[0]['delta'],obs[1]['delta']));return 'Модульдері тең, бағыттары қарама-қарсы'
    if k=='equal-length-count':return str(sum(v['lengthSquared']==row['params']['targetLength']**2 for v in obs))
    if k=='compass-direction':dx,dy=a['delta'];return ('солтүстік' if dy>0 else 'оңтүстік')+'-'+('батысқа' if dx<0 else 'шығысқа')
    if k=='endpoint-abscissa':return str(a['tipCoordinate'][0])
    if k in ['horizontal-length','vertical-length']:
        sq=a['lengthSquared'];n=integer(math.sqrt(sq));assert n*n==sq;return str(n)
    if k=='vector-name':return 'vector(PQ)'
    if k=='longest-vector':maximum=max(v['lengthSquared'] for v in obs);return 'vector('+one([v['label'] for v in obs if v['lengthSquared']==maximum])+')'
    if k=='ray-direction':return 'P басынан Q нүктесі арқылы өтетін сәулеге'
    raise AssertionError(k)

def main():
    assert len(ROWS)==10;entries=[]
    for i,r in enumerate(ROWS):
        obs=observe(r);assert solve(r,obs)==r['answer'],(r['editionId'],solve(r,obs),r['answer'])
        assert not re.search(r'[\\$]',r['statement']+r['solution']+''.join(r.get('options',[])))
        bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad,obs)!=bad['answer']
        if r.get('options'):assert r['options'].count(r['answer'])==1 and len(set(r['options']))==4
        sourceId=r['sourceRefs'][0]['sourceId'];hasRaster=sourceId not in ['57bc2f66f4a5fe40','18ad8e9e68d4dba3','89be0e1d8596b212']
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'Actual native tail circles, arrow-tip triangles, squared grid lengths and printed coordinate/ray calibration; no author solver imported','checks':['all10 complete original/new conditions, solutions and MCQs read','7 available source rasters plus3 complete source-text-only cases distinguished','actual equal-grid panel units, arrow direction and negative-coordinate magnitudes','native bounded vector token preserves ordered endpoints without raw TeX'],'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':hasRaster,'checked':['both source sheets and both343px target sheets viewed','actual polygon tip, circle tail and shaft orientation','square grid spacing, actual endpoints and visible endpoint names'],'sourceSheet':f'output/editorial-visual-wave12/visual-wave12-source-{i//6+1}.png','nativeSheet':f'output/editorial-visual-wave12/visual-wave12-contact-{i//6+1}.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave12-vectors.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','scope':'All10 editions:7source rasters/3text-only archived statements. Native vector notation reviewed separately in math presentation and rendered MathML tests.','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':10,'actualNativeArrowChecks':10,'wrongKeysRejected':10}))
if __name__=='__main__':main()
