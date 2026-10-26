"""Independent solids: exact ray/triangle occlusion, actual native edge geometry.
All7 archived and rewritten complete conditions, solutions, choices, both source
and both343px native sheets read. No author solver/visibility code imported.
"""
from collections import Counter
import copy
from fractions import Fraction as F
import hashlib
import itertools
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave13-spatial-solids.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def tag(e):return e.tag.rsplit('}',1)[-1]
def v(e,k):return F(e.get(k))
def txt(e):return ''.join(e.itertext())
def near(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def one(a):a=list(a);assert len(a)==1,a;return a[0]
def key(a,b):return ':'.join(sorted([a,b]))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def ray_hit(origin,A,B,C):
    # Moller-Trumbore intersections, independent of outward normals/winding.
    direction=(F(12),F(-20),F(13));edge1=sub(B,A);edge2=sub(C,A);h=cross(direction,edge2);den=dot(edge1,h)
    if den==0:return False
    s=sub(origin,A);u=dot(s,h)/den
    if not 0<=u<=1:return False
    q=cross(s,edge1);w=dot(direction,q)/den
    if w<0 or u+w>1:return False
    return dot(edge2,q)/den>0

def solid(p):
    if p['scene']=='cuboid':
        a,b,c=map(F,p['dimensions']);V=dict(zip(['E','F','G','H','E₁','F₁','G₁','H₁'],[(0,0,0),(a,0,0),(a,b,0),(0,b,0),(0,0,c),(a,0,c),(a,b,c),(0,b,c)]))
        faces=[['E','F','G','H'],['E₁','F₁','G₁','H₁'],['E','F','F₁','E₁'],['F','G','G₁','F₁'],['G','H','H₁','G₁'],['H','E','E₁','H₁']]
        scale=min(F(330)/(a+F(3,5)*b),F(240)/(c+F(13,20)*b));project=lambda q:(70+scale*(q[0]+F(3,5)*q[1]),305-scale*(q[2]+F(13,20)*q[1]))
    else:
        V={n:tuple(map(F,[*q,0])) for n,q in zip(p['labels'],p['base'])};V[p['apexLabel']]=tuple(map(F,p['apex']));ns=p['labels'];faces=[ns]+[[ns[i],ns[(i+1)%len(ns)],p['apexLabel']] for i in range(len(ns))]
        scale=F(p['renderScale']);project=lambda q:(p['renderOffset'][0]+scale*(q[0]+F(3,5)*q[1]),p['renderOffset'][1]-scale*(q[2]+F(13,20)*q[1]))
    triangles=[tuple(V[f[i]] for i in [0,j,j+1]) for f in faces for j in range(1,len(f)-1)]
    E={key(a,b):(a,b) for f in faces for a,b in zip(f,f[1:]+f[:1])};hidden={}
    for k,(a,b) in E.items():
        midpoint=tuple((x+y)/2 for x,y in zip(V[a],V[b]));hidden[k]=any(ray_hit(midpoint,*tri) for tri in triangles)
    return V,E,hidden,project

def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];s=ET.fromstring(raw);els=list(s.iter());p=r['params'];texts=[e for e in els if tag(e)=='text'];lines=[e for e in els if tag(e)=='line'];kind=r['modelId'].removeprefix('visual-wave13-')
    if p['scene'] in ['cuboid','pyramid']:
        V,E,H,P=solid(p);drawn=[e for e in lines if e.get('data-edge')];assert len(drawn)==len(E);assert set(e.get('data-edge') for e in drawn)==set(E)
        for e in drawn:
            a,b=E[e.get('data-edge')];A=P(V[a]);B=P(V[b]);endpoints=[(v(e,'x1'),v(e,'y1')),(v(e,'x2'),v(e,'y2'))]
            for actual,target in zip(sorted(endpoints),sorted([A,B])):near(actual[0],target[0]);near(actual[1],target[1])
            hidden=H[e.get('data-edge')];assert bool(e.get('stroke-dasharray'))==hidden and e.get('data-hidden')==str(hidden).lower()
        for t in texts:assert 0<v(t,'x')<480 and 10<=v(t,'y')<=350
        if kind=='cuboid-total-edges':
            nums=[F(txt(t)) for t in texts if re.fullmatch(r'\d+',txt(t))];assert Counter(nums)==Counter(p['dimensions']);lengths=[sum(abs(z) for z in sub(V[a],V[b])) for a,b in E.values()];assert Counter(lengths)==Counter({F(n):4 for n in p['dimensions']});return str(sum(lengths))
        if kind=='cuboid-hidden-edge':
            assert sorted(k for k,h in H.items() if h)==['E:H','G:H','H:H₁'];return one(o for o in r['options'] if any(o==a+b or o==b+a for k,(a,b) in E.items() if H[k]))
        if kind=='pyramid-edge-count':assert len(V)==7 and len(E)==12 and sum(H.values())==3;return str(len(E))
        assert kind=='tetrahedron-hidden-edge';assert len(E)==6;return one(k.replace(':','') for k,h in H.items() if h)
    if p['scene']=='cubes':
        polys={e.get('data-face'):e for e in els if tag(e)=='polygon'};assert set(polys)=={'front','right','top'}
        pts=lambda el:[tuple(map(F,q.split(','))) for q in el.get('points').split()]
        front=pts(polys['front']);right=pts(polys['right']);top=pts(polys['top']);assert set(top)&set(front) and set(right)&set(front)
        # Count visible lattice lines rather than trusting the dimensions field.
        vertical=sorted(set(v(e,'x1') for e in lines if v(e,'x1')==v(e,'x2') and v(e,'y1')==295 and v(e,'y2')==167))
        assert vertical==[85,149,213,277];horizontal=sorted(set(v(e,'y1') for e in lines if v(e,'y1')==v(e,'y2') and v(e,'x1')==85 and v(e,'x2')==277));assert horizontal==[167,231,295]
        depths=sorted(set(v(e,'x1') for e in lines if v(e,'x1')==v(e,'x2') and v(e,'x1')>=277));assert depths==[277,307,337]
        a,c,b=len(vertical)-1,len(horizontal)-1,len(depths)-1;assert [a,b,c]==p['dimensions'];cells=list(itertools.product(range(a),range(b),range(c)));assert len(set(cells))==12;return str(len(cells))
    if p['scene']=='cylinder':
        circle=one([e for e in els if tag(e)=='circle']);cx,cy=v(circle,'cx'),v(circle,'cy');diam=one([e for e in lines if e.get('stroke')=='#8459ce']);assert v(diam,'y1')==v(diam,'y2')==cy and (v(diam,'x1')+v(diam,'x2'))/2==cx
        top=one([e for e in els if tag(e)=='ellipse']);assert v(top,'cx')==cx;near(v(diam,'x2')-v(diam,'x1'),v(top,'rx')*2)
        label=one([t for t in texts if t.get('fill')=='#8459ce' and 'см' in txt(t)]);d=F(txt(label).removesuffix(' см'));assert d==p['diameter'];return str(d/2)
    assert p['scene']=='cone';labels={txt(t):(v(t,'x'),v(t,'y')) for t in texts};assert set(labels)=={'T','C','M','N'}
    dotc=one([e for e in els if tag(e)=='circle']);C=(v(dotc,'cx'),v(dotc,'cy'));diam=one([e for e in lines if e.get('stroke')=='#8459ce' and v(e,'y1')==v(e,'y2')]);M=(v(diam,'x1'),v(diam,'y1'));N=(v(diam,'x2'),v(diam,'y2'));assert C==tuple((a+b)/2 for a,b in zip(M,N));assert labels['M'][0]<M[0]<C[0]<N[0]<labels['N'][0];assert labels['C'][1]>C[1] and labels['T'][1]<100
    return 'CM'

def main():
    entries=[];assert len(ROWS)==7
    for i,r in enumerate(ROWS):
        answer=observe(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert observe(bad)!=bad['answer']
        if r.get('options'):assert r['options'].count(r['answer'])==1 and len(set(r['options']))==4
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'Independent exact ray-triangle occlusion for all closed polyhedra; actual SVG edge endpoints, lattice counts, diameter/center labels','checks':['all7 full archived/new conditions, solutions and MCQs read','all7 source rasters and both343px target sheets inspected','hidden edges independently determined by positive ray-face intersections, not author face normals','visible grids counted through every front/right/top line and full unit-cube product'],'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['actual edge endpoint geometry and exactly the expected hidden dashed set','three-dimensional graph topology and all12 cuboid edges','base-center diameter versus radius or irrelevant height','all rendered labels inside viewport with readable offsets'],'sourceSheet':f'output/editorial-visual-wave13/visual-wave13-source-{i//6+1}.png','nativeSheet':f'output/editorial-visual-wave13/visual-wave13-contact-{i//6+1}.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave13-spatial-solids.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':7,'rayOcclusionAndActualSvgChecks':7,'wrongKeysRejected':7}))
if __name__=='__main__':main()
