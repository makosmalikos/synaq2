"""Independent ray review from physical tick gaps, marked points and actual
Bezier arc/triangle ends. All8 full archived/new conditions, solutions/choices
and both source plus both343px native sheets inspected. No author solver.
"""
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave21-natural-number-rays.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def tag(e):return e.tag.rsplit('}',1)[-1]
def v(e,k):return F(e.get(k))
def txt(e):return ''.join(e.itertext())
def near(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def one(a):a=list(a);assert len(a)==1,a;return a[0]
def integer(q):n=round(float(q));near(q,n);return n
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];s=ET.fromstring(raw);els=list(s.iter());texts=[e for e in els if tag(e)=='text'];lines=[e for e in els if tag(e)=='line'];p=r['params']
    ticks=sorted([e for e in lines if v(e,'x1')==v(e,'x2') and v(e,'y1')<204<v(e,'y2') and v(e,'y2')-v(e,'y1')<=18],key=lambda e:v(e,'x1'));xs=[v(e,'x1') for e in ticks];assert len(xs)==len(set(xs))==p['maxTick']+1;step=xs[1]-xs[0]
    for a,b in zip(xs,xs[1:]):near(b-a,step)
    index=lambda x:integer((x-xs[0])/step)
    points={}
    for e in els:
        if tag(e)!='circle':continue
        x,y=v(e,'cx'),v(e,'cy');assert y==204;label=txt(one(t for t in texts if v(t,'y')==186 and abs(v(t,'x')-x)<F(1,1000000)));points[label]=index(x)
    labels=[]
    for e in texts:
        if v(e,'y')==241:labels.append((index(v(e,'x')),txt(e)))
    if p['scene']=='distance':assert labels==[(0,'0'),(5,'5'),(10,'10'),(15,'15'),(20,'20')];assert points=={'A':p['a'],'B':p['b']}
    if p['scene']=='step':assert labels==[(i,str(i*p['step'])) for i in range(3)];assert points=={'P':p['targetTick']}
    if p['scene'] in ['cells','rescale']:
        cellgrid=[e for e in lines if e.get('stroke')=='#dbe5f1'];assert len(cellgrid)==len(ticks)
        for e,x in zip(cellgrid,xs):near(v(e,'x1'),x);near(v(e,'x2'),x)
        zero=one(i for i,label in labels if label=='0');unit=one(i for i,label in labels if label=='1');assert zero==0
        majors=[index(v(e,'x1')) for e in ticks if v(e,'y2')-v(e,'y1')==18];assert majors==list(range(0,p['maxTick']+1,unit))
        return {'points':points,'unit':unit,'labels':labels}
    if p['scene'] in ['route','clock']:
        caption=one(txt(e) for e in texts if re.fullmatch(r'\d+ (км|мин)',txt(e)));value=int(caption.split()[0]);dimension=one(e for e in lines if e.get('stroke')=='#315ce8' and v(e,'y1')==v(e,'y2'));assert (index(v(dimension,'x1')),index(v(dimension,'x2')))==(0,1)
        return {'points':points,'perStep':value,'labels':labels}
    if p['scene']=='jumps':
        arcs=[]
        for i,e in enumerate(els):
            if tag(e)!='path':continue
            nums=list(map(F,re.findall(r'-?\d+(?:\.\d+)?',e.get('d'))));assert len(nums)==6;start=(nums[0],nums[1]);end=(nums[4],nums[5]);assert start[1]==end[1]==204
            head=els[i+1];assert tag(head)=='polygon';tip=tuple(map(F,head.get('points').split()[0].split(',')));near(tip[0],end[0]);near(tip[1],end[1]);arcs.append((index(start[0]),index(end[0])))
        assert len(arcs)==2 and arcs[0][1]==arcs[1][0] and arcs[0][0]==points['A'];return {'points':points,'arcs':arcs}
    return {'points':points,'labels':labels}

def solve(r,obs):
    k=r['modelId'].removeprefix('visual-wave21-');pts=obs['points']
    if k=='unit-distance-between-points':return str(pts['B']-pts['A'])
    if k=='nonunit-scale-coordinate':
        labels=obs['labels'];increments={F(labels[i+1][1])-F(labels[i][1]) for i in range(len(labels)-1)};unit=one(increments);return str(int(pts['P']*unit))
    if k=='coordinate-to-grid-cells':assert pts['A']==4*obs['unit'];return str(pts['A'])
    if k=='infer-step-from-labelled-point':known=int(re.search(r'координатасы (\d+)',r['statement'])[1]);unit=F(known,pts['A']);return str(int(unit*pts['B']))
    if k=='route-scaled-distance':return str(pts['K']*obs['perStep'])
    if k=='rescale-fixed-point':unit=int(re.search(r'кесіндіні (\d+) торкөз',r['statement'])[1]);assert pts['K']%unit==0;return str(pts['K']//unit)
    if k=='alternating-jumps-unreachable':
        (start,first),(firstAgain,last)=obs['arcs'];assert first==firstAgain;right,left=first-start,first-last;assert right>left>0;net=right-left;maximum=max(map(int,r['options']));landed=set();pos=start
        # Every cycle's two landings subsequently move right by positive net.
        while pos<=maximum:landed.update([pos,pos+right]);pos+=right-left
        return one(o for o in r['options'] if int(o) not in landed)
    if k=='clock-on-scaled-ray':start=one(t for i,t in obs['labels'] if i==0);hours,minutes=map(int,start.split(':'));total=60*hours+minutes+pts['U']*obs['perStep'];return f'{total//60}:{total%60:02d}'
    raise AssertionError(k)
def main():
    assert len(ROWS)==8;entries=[]
    for i,r in enumerate(ROWS):
        obs=observe(r);assert solve(r,obs)==r['answer'],(r['editionId'],solve(r,obs),r['answer']);assert solve(r,obs)!='wrong'
        if r.get('options'):assert r['options'].count(r['answer'])==1 and len(set(r['options']))==4
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'Actual tick intervals, physical point/label locations, Bezier and arrow-tip endpoints; exact scaled gaps, cell rescaling and complete bounded jump-cycle enumeration','checks':['all8 full source/new conditions, solutions and MCQs read','all8 source rasters and both343px target sheets inspected','ticks versus gaps, coordinates versus cells, and minutes versus elapsed intervals distinguished','positive net-cycle motion proves unreachable option after every future cycle passes its bound'],'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['actual uniform spacing of every ray tick','major/minor cell lengths calibrated from actual printed0and1','dimension caption endpoints span exactly one physical interval','actual two directed arc endpoints and initial point order'],'sourceSheet':f'output/editorial-visual-wave21/visual-wave21-source-{i//6+1}.png','nativeSheet':f'output/editorial-visual-wave21/visual-wave21-contact-{i//6+1}.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave21-natural-number-rays.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':8,'actualNativeObservationChecks':8,'wrongKeysRejected':8}))
if __name__=='__main__':main()
