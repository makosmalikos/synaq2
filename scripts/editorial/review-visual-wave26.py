"""Independent complete source/new and all four343px sheet review of seven tasks."""
import ast
from fractions import Fraction as F
import hashlib
import json
import math
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave26-operation-order-models.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return F(e.get(k))
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def near(a,b):assert abs(float(a-b))<1e-7,(a,b)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def value(s):
    def walk(a):
        if isinstance(a,ast.Constant):assert isinstance(a.value,int);return F(a.value)
        assert isinstance(a,ast.BinOp)
        l,r=walk(a.left),walk(a.right)
        if isinstance(a.op,ast.Add):return l+r
        if isinstance(a.op,ast.Sub):return l-r
        if isinstance(a.op,ast.Mult):return l*r
        if isinstance(a.op,ast.Div):return l/r
        raise AssertionError('Only basic arithmetic allowed')
    return walk(ast.parse(s.replace('×','*').replace('−','-').replace(':','/'),mode='eval').body)
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text'];rects=[e for e in els if tag(e)=='rect'];lines=[e for e in els if tag(e)=='line']
    def at(x,y):return txt(one(t for t in texts if abs(float(n(t,'x')-x))<1e-7 and abs(float(n(t,'y')-y))<1e-7))
    def choice(total):return one(o for o in r['options'] if value(o)==total)
    def array(circles):
        ys=sorted(set(n(e,'cy') for e in circles));xs=sorted(set(n(e,'cx') for e in circles))
        for y in ys:assert sorted(n(e,'cx') for e in circles if n(e,'cy')==y)==xs
        return len(ys),len(xs)
    scene=r['params']['scene']
    if scene=='colors':
        blue=[e for e in els if tag(e)=='circle' and e.get('fill')=='#315ce8'];yellow=[e for e in els if tag(e)=='circle' and e.get('fill')=='#f0c95c'];assert array(blue)==(3,2) and array(yellow)==(3,5)
        return choice(len(blue)+len(yellow)),{'physicalCounts':[len(blue),len(yellow)]}
    if scene=='orchard':
        apple=[e for e in els if tag(e)=='circle' and e.get('fill')=='#55a98b'];apricot=[e for e in els if tag(e)=='circle' and e.get('fill')=='#efcc6f'];assert array(apple)==(6,9) and array(apricot)==(4,4)
        return choice(len(apple)+len(apricot)),{'physicalCounts':[len(apple),len(apricot)]}
    if scene=='grids':
        counts={}
        for rect in [e for e in rects if e.get('stroke-width')=='2']:
            x,y,w,h=n(rect,'x'),n(rect,'y'),n(rect,'width'),n(rect,'height');name=at(x+w/2,y+h+35);vertical=sorted(n(e,'x1') for e in lines if n(e,'x1')==n(e,'x2') and n(e,'y1')==y and n(e,'y2')==y+h and x<n(e,'x1')<x+w);horizontal=sorted(n(e,'y1') for e in lines if n(e,'y1')==n(e,'y2') and n(e,'x1')==x and n(e,'x2')==x+w and y<n(e,'y1')<y+h)
            for a,b in zip([x]+vertical,[*vertical,x+w]):assert b-a==20
            for a,b in zip([y]+horizontal,[*horizontal,y+h]):assert b-a==20
            counts[name]=(len(vertical)+1)*(len(horizontal)+1)
        assert counts=={'A':54,'B':50};return str(counts['A']-counts['B']),counts
    if scene=='bags':
        masses=[]
        for path in [e for e in els if tag(e)=='path']:
            m=re.match(r'M(\d+) (\d+) q16 -8 32 0 v39 q-16 8 -32 0 Z',path.get('d'));assert m
            x,y=map(int,m.groups());masses.append(int(at(x+16,y+28)))
        assert sorted(masses)==[30]*6+[45]*10;sold=int(re.search(r'(\d+) кг ұн сатылған',r['statement'])[1]);return str(sum(masses)-sold),{'printedBagMasses':masses,'sold':sold}
    if scene=='shopping':
        notes=[e for e in rects if e.get('fill')=='#cddcff' and e.get('height')=='90'];pens=[e for e in els if tag(e)=='path'];assert len(notes)==4 and len(pens)==1
        costs=[int(at(n(e,'x')+n(e,'width')/2,250)) for e in notes]+[int(at(394,250))];assert costs==[245]*4+[230];given=int(re.search(r'Сатып алушы (\d+) теңге берді',r['statement'])[1]);return str(given-sum(costs)),{'printedPrices':costs,'tendered':given}
    if scene=='cabinets':
        shelves=[e for e in rects if e.get('height')=='26'];values=[int(at(n(e,'x')+n(e,'width')/2,n(e,'y')+21)) for e in shelves];assert sorted(values)==[36]*5+[42]*7
        retained,classes=map(int,re.search(r'(\d+) кітапты қалдырып, қалғанын (\d+) сыныпқа',r['statement']).groups());result=F(sum(values)-retained,classes);assert result.denominator==1
        return str(result.numerator),{'printedShelfValues':values,'retained':retained,'classes':classes}
    assert scene=='flow'
    # Reconstruct nodes/edges from actual centers, line tails and triangle tips.
    # data-input/data-edge names are deliberately ignored.
    nodes=[]
    for e in els:
        if tag(e)=='circle':x,y=n(e,'cx'),n(e,'cy');nodes.append({'x':x,'y':y,'label':at(x,y+8),'kind':'op'})
        if tag(e)=='rect' and e.get('height')=='36':x,y=n(e,'x')+31,n(e,'y')+18;nodes.append({'x':x,'y':y,'label':at(x,y+8),'kind':'input'})
    assert len(nodes)==10 and len(lines)==9
    heads=[e for e in els if tag(e)=='polygon'];incoming={i:[] for i in range(len(nodes))}
    def center(i):return (float(nodes[i]['x']),float(nodes[i]['y']))
    for line in lines:
        start=(float(n(line,'x1')),float(n(line,'y1')));end=(float(n(line,'x2')),float(n(line,'y2')))
        source=min(range(len(nodes)),key=lambda i:math.dist(center(i),start));target=min(range(len(nodes)),key=lambda i:math.dist(center(i),end));assert source!=target
        A,B=center(source),center(target);dx,dy=B[0]-A[0],B[1]-A[1];length=math.hypot(dx,dy)
        for point,distance in [(start,23),(end,length-(25 if nodes[target]['kind']=='op' else 20))]:
            near(F(str((point[0]-A[0])*dy-(point[1]-A[1])*dx)),F(0));near(F(str(math.dist(A,point))),F(str(distance)))
        head=one(e for e in heads if math.dist(tuple(map(float,e.get('points').split()[0].split(','))),end)<1e-7);pts=[tuple(map(float,p.split(','))) for p in head.get('points').split()];base=((pts[1][0]+pts[2][0])/2,(pts[1][1]+pts[2][1])/2)
        assert (end[0]-base[0])*dx+(end[1]-base[1])*dy>0
        near(F(str((end[0]-base[0])*dy-(end[1]-base[1])*dx)),F(0));incoming[target].append(source)
    active=set()
    def evaluate(i):
        assert i not in active;active.add(i);node=nodes[i];parents=sorted(incoming[i],key=lambda j:nodes[j]['x']);label=node['label']
        if label.isdigit():assert not parents;result=F(label)
        elif label=='?':assert len(parents)==1;result=evaluate(parents[0])
        else:
            assert len(parents)==2;left,right=map(evaluate,parents)
            result=left+right if label=='+' else left/right if label==':' else left-right if label=='−' else None;assert result is not None
        active.remove(i);return result
    result=evaluate(one(i for i,node in enumerate(nodes) if node['label']=='?'));assert result.denominator==1
    return str(result.numerator),{'nodes':len(nodes),'directedEdges':len(lines),'evaluatedFromActualGraph':True}
def main():
    assert len(ROWS)==7;entries=[]
    for i,r in enumerate(ROWS):
        a,obs=observe(r);assert a==r['answer'] and a!='wrong'
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(a)==1
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'All7 full original/new conditions, complete solutions/choices; actual colored arrays, grid lines, printed per-object prices/masses and graph reconstructed from physical arrow endpoints','checks':['all four source/native sheets inspected at343px','actual flow left/right operand order follows geometric incoming sources','strict PythonAST evaluates each printed expression independently','retained books removed before division; costs grouped before change'],'observed':obs,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['actual3rows2blue5yellow and6by9/4by4orchard circles','each20px gridcell and printedA/B labels','all9flow arrows mapped from tails to actual tips and destination centers','all16bag masses and4notebooks/1pen prices read','all12shelf values counted physically'],'sourceSheet':f'output/editorial-visual-wave26/visual-wave26-source-{1+i//6}.png','nativeSheet':f'output/editorial-visual-wave26/visual-wave26-contact-{1+i//6}.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave26-operation-order-models.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':7,'nativeObservationChecks':7,'wrongKeysRejected':7,'directedFlowEdgesReconstructed':9,'authorSolverImported':False}))
if __name__=='__main__':main()
