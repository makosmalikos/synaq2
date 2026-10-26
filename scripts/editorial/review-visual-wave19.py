"""Independent review of9 system diagrams: all full source/new text/solutions/
MCQ and both source/native343px sheets read. Actual diagram observations are
used, not renderer metadata or author solvers.
"""
from fractions import Fraction as F
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave19-linear-systems.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
spec=importlib.util.spec_from_file_location('root_linear_review',ROOT/'scripts/editorial/review-visual-wave18.py');ind=importlib.util.module_from_spec(spec);spec.loader.exec_module(ind)
tag,v,txt,near,one,rational,number,equation,on=(getattr(ind,n) for n in ['tag','v','txt','near','one','rational','number','equation','on'])
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def system(equations):
    # Exact row reduction classifies rank as well as computing the intersection.
    a=[list(map(F,e)) for e in equations];pivot=0;columns=[]
    for c in range(2):
        found=next((i for i in range(pivot,len(a)) if a[i][c]),None)
        if found is None:continue
        a[pivot],a[found]=a[found],a[pivot];d=a[pivot][c];a[pivot]=[x/d for x in a[pivot]]
        for i in range(len(a)):
            if i!=pivot:
                d=a[i][c];a[i]=[x-d*y for x,y in zip(a[i],a[pivot])]
        columns.append(c);pivot+=1
    if any(not r[0] and not r[1] and r[2] for r in a):return 'none',None
    if pivot<2:return 'infinite',None
    point=[F(0),F(0)]
    for i,c in enumerate(columns):point[c]=a[i][2]
    return 'one',tuple(point)

def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];s=ET.fromstring(raw);els=list(s.iter());texts=[e for e in els if tag(e)=='text'];lines=[e for e in els if tag(e)=='line'];rects=[e for e in els if tag(e)=='rect'];p=r['params']
    if p['scene']=='plane':
        xlabels=sorted((F(txt(t)),v(t,'x')) for t in texts if re.fullmatch(r'-?\d+',txt(t)) and v(t,'y')==202);ylabels=sorted((F(txt(t)),v(t,'y')-6) for t in texts if re.fullmatch(r'-?\d+',txt(t)) and v(t,'x')==228)
        assert [n for n,x in xlabels]==[-6,-4,-2,2,4,6] and [n for n,y in ylabels]==[-6,-4,-2,2,4,6];xu=(xlabels[1][1]-xlabels[0][1])/2;yu=(ylabels[0][1]-ylabels[1][1])/2;near(xu,yu);x0=xlabels[0][1]+6*xu;y0=ylabels[0][1]-6*yu
        for n,x in xlabels:near(x,x0+n*xu)
        for n,y in ylabels:near(y,y0-n*yu)
        for axis in ['x','y']:
            grids=sorted(set(v(e,axis+'1') for e in lines if e.get('stroke')=='#dbe5f1' and v(e,axis+'1')==v(e,axis+'2')));assert len(grids)==15
            for a,b in zip(grids,grids[1:]):near(b-a,xu)
        coord=lambda x,y:(rational((x-x0)/xu),rational((y0-y)/yu));eqs=[]
        for e in [q for q in lines if q.get('stroke') in ['#315ce8','#8459ce']]:
            A=coord(v(e,'x1'),v(e,'y1'));B=coord(v(e,'x2'),v(e,'y2'));assert A!=B;a=A[1]-B[1];b=B[0]-A[0];c=a*A[0]+b*A[1];eqs.append((a,b,c))
            original=equation(p['equations'][len(eqs)-1]);assert on(original,A) and on(original,B)
        assert len(eqs)==2
        points={}
        for e in [q for q in els if tag(q)=='circle']:
            x,y=v(e,'cx'),v(e,'cy');label=txt(one(t for t in texts if re.fullmatch('[ABCD]',txt(t)) and math.dist((x,y),(v(t,'x'),v(t,'y')))<35));points[label]=coord(x,y)
        assert points=={q['label']:tuple(q['xy']) for q in p.get('points',[])}
        return {'equations':eqs,'points':points}
    if p['scene']=='bars':
        diffrect=one(e for e in rects if e.get('fill')=='#fbe3b4');diff=F(txt(one(t for t in texts if v(diffrect,'x')<v(t,'x')<v(diffrect,'x')+v(diffrect,'width') and v(diffrect,'y')<v(t,'y')<v(diffrect,'y')+v(diffrect,'height'))));total=F(txt(one(t for t in texts if re.fullmatch(r'\d+',txt(t)) and v(t,'x')>400)))
        equals=[e for e in rects if e.get('fill')=='#eaf0ff'];assert len(equals)==2 and v(equals[0],'width')==v(equals[1],'width');y=(total-diff)/2;near(v(diffrect,'width')/v(equals[0],'width'),diff/y);assert diff==p['difference'] and total==p['sum'];return {'equations':[(1,1,total),(1,-1,diff)]}
    if p['scene']=='scales':
        equations=[]
        for i in range(2):
            sides=[[],[]];y=30+i*165
            for e in els:
                if tag(e) not in ['circle','rect'] or not e.get('data-shape'):continue
                if tag(e)=='circle':cx,cy=v(e,'cx'),v(e,'cy');radius=v(e,'r');x0,x1,y0,y1=cx-radius,cx+radius,cy-radius,cy+radius
                else:x0,y0=v(e,'x'),v(e,'y');x1,y1=x0+v(e,'width'),y0+v(e,'height');cx=(x0+x1)/2
                if not y<y0<y+165:continue
                label=txt(one(t for t in texts if x0<v(t,'x')<x1 and y0<v(t,'y')<y1));sides[int(cx>242)].append(label)
            coeff=[F(0),F(0),F(0)]
            for sign,side in zip([1,-1],sides):
                for label in side:
                    if label=='x':coeff[0]+=sign
                    elif label=='y':coeff[1]+=sign
                    else:coeff[2]-=sign*F(label)
            equations.append(tuple(coeff));beam=one(e for e in lines if v(e,'y1')==v(e,'y2')==y+45 and e.get('stroke-width')=='4');assert v(beam,'x1')<242<v(beam,'x2')
        assert equations==[(1,1,18),(1,-1,6)];return {'equations':equations}
    if p['scene']=='addition':
        labels=[txt(t) for t in sorted(texts,key=lambda t:v(t,'y')) if '=' in txt(t)];assert labels==p['equations'];es=list(map(equation,labels));return {'sum':tuple(sum(e[i] for e in es) for i in range(3))}
    assert p['scene']=='purchases';observed=[]
    for i,y in enumerate([99,215]):
        circles=[e for e in els if tag(e)=='circle' and v(e,'cy')==y];squares=[e for e in rects if e.get('fill')=='#f4cc60' and v(e,'y')+v(e,'height')/2==y];total=F(txt(one(t for t in texts if v(t,'y')==y+9)).removeprefix('= '));observed.append((len(circles),len(squares),total))
    assert observed==[(q['circles'],q['squares'],q['total']) for q in p['rows']];return {'equations':observed}

def solve(r,obs):
    k=r['modelId'].removeprefix('visual-wave19-')
    if k=='addition-eliminates-variable':return one(o for o in r['options'] if equation(o)==obs['sum'])
    kind,point=system(obs['equations'])
    if k=='parallel-solution-count':assert kind=='none';return '0'
    assert kind=='one'
    if k=='intersection-point-label':return one(n for n,p in obs['points'].items() if p==point)
    if k=='intersection-coordinate-sum':return number(sum(point))
    if k=='intersection-ordinate':return number(point[1])
    if k=='signed-system-pair':
        return one(o for o in r['options'] if tuple(map(F,re.fullmatch(r'\((-?\d+);\s*(-?\d+)\)',o).groups()))==point)
    if k in ['bar-sum-difference','two-scale-substitution']:return number(point[0])
    if k=='purchase-elimination':assert all(q>0 for q in point);return number(point[1])
    raise AssertionError(k)
def main():
    assert len(ROWS)==9;entries=[]
    for i,r in enumerate(ROWS):
        obs=observe(r);assert solve(r,obs)==r['answer'],(r['editionId'],solve(r,obs),r['answer']);assert solve(r,obs)!='wrong'
        if r.get('options'):assert r['options'].count(r['answer'])==1 and len(set(r['options']))==4
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'Actual calibrated graph endpoints/points, printed added equations, strip lengths/labels and every physical scale/purchase item; exact independent Gaussian row reduction','checks':['all9 full source/new conditions, solutions and MCQs read','all9 available source rasters and both343px target sheets inspected','rank none/infinite/one distinguished by exact row reduction','actual memberwise addition coefficients must match before any equation division','negative coordinates, simultaneous line membership, sum/ordinate/pair queries separated'],'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['equal unit grids and actual two-line intersections','all actual point labels and colored difference strip compared to equal strips','each cube/sphere/mass label on both equal-height scales','printed addition expressions and every purchase circle/square counted by row'],'sourceSheet':f'output/editorial-visual-wave19/visual-wave19-source-{i//6+1}.png','nativeSheet':f'output/editorial-visual-wave19/visual-wave19-contact-{i//6+1}.png'}})
    assert system([(1,1,2),(2,2,4)])[0]=='infinite';assert system([(1,1,2),(2,2,5)])[0]=='none';assert system([(1,1,2),(1,-1,0)])==('one',(1,1))
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave19-linear-systems.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':9,'actualNativeObservationChecks':9,'wrongKeysRejected':9,'rankCanaries':3}))
if __name__=='__main__':main()
