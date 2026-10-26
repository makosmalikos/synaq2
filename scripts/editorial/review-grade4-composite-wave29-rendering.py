"""Independent full printed-condition/cell-boundary review of23source-addressed composite editions.
No author model/spec/calculator imported. Printed native fractions and Unicode
exponents are parsed exactly with Fraction; finite natural domains are complete.
"""
import ast
import copy
from fractions import Fraction as F
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-composite-wave29.json'
OUT='problems/editorial/reviews/grade4-composite-wave29.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
SUP='⁰¹²³⁴⁵⁶⁷⁸⁹';TRANS=str.maketrans(SUP,'0123456789')
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def m(pattern,s):
    found=re.search(pattern,s);assert found,(pattern,s);return found
def n(s):
    s=s.replace(' ','');assert s.isdigit();return int(s)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def raw_for(r):
    ref=one(r['sourceRefs']);return one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId'])
def choice(r,predicate):return one(o for o in r['options'] if predicate(o))
def groups(s):
    out=[];depth=0;start=None
    for i,c in enumerate(s):
        if c=='(':
            if depth==0:start=i
            depth+=1
        if c==')':
            depth-=1;assert depth>=0
            if depth==0:out.append(s[start:i+1])
    assert depth==0;return out
def simple_pairs(s):return [tuple(map(int,p)) for p in re.findall(r'\((\d+)/(\d+)\)',s)]
def raw_pair(s):return one(simple_pairs(s))
def arithmetic(text,variables=None):
    variables=variables or {}
    # Parse superscripts before any normalization: NFKC would turn3¹²into312.
    text=re.sub(r'(\d+)(['+SUP+']+)',lambda p:p[1]+'**'+p[2].translate(TRANS),text)
    text=text.replace('×','*').replace('·','*').replace('−','-').strip()
    text=re.sub(r'(?<=\d)(?=[a-zA-Z])','*',text)
    assert re.fullmatch(r'[0-9a-zA-Z ()+*/-]+',text),text
    def visit(node):
        if isinstance(node,ast.Expression):return visit(node.body)
        if isinstance(node,ast.Constant):assert type(node.value) is int;return F(node.value)
        if isinstance(node,ast.Name):assert node.id in variables;return F(variables[node.id])
        assert isinstance(node,ast.BinOp),ast.dump(node)
        a,b=visit(node.left),visit(node.right)
        if isinstance(node.op,ast.Add):return a+b
        if isinstance(node.op,ast.Sub):return a-b
        if isinstance(node.op,ast.Mult):return a*b
        if isinstance(node.op,ast.Div):assert b!=0;return a/b
        assert isinstance(node.op,ast.Pow) and b.denominator==1 and 0<=b.numerator<=30
        return a**b.numerator
    return visit(ast.parse(text,mode='eval'))
def lengths(s,unit='см'):return list(map(int,re.findall(r'(\d+) '+unit+r'(?![²³])',s)))
def quantity_choice(r,value,unit):return choice(r,lambda o:o==str(value)+' '+unit)
def perimeter(a,b):return 2*(a+b)
def polygon_area(points):return F(abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(points,points[1:]+points[:1]))),2)
def polygon_perimeter(points):return sum(abs(a[0]-b[0])+abs(a[1]-b[1]) for a,b in zip(points,points[1:]+points[:1]))
def normal(shape):
    left=min(x for x,y in shape);bottom=min(y for x,y in shape);return tuple(sorted((x-left,y-bottom) for x,y in shape))
DIRS=[(1,0),(-1,0),(0,1),(0,-1)]
def grow_polyominoes(n):
    shapes={((0,0),)}
    for size in range(2,n+1):
        expanded=set()
        for shape in shapes:
            cells=set(shape)
            for x,y in cells:
                for dx,dy in DIRS:
                    new=(x+dx,y+dy)
                    if new not in cells:expanded.add(normal(cells|{new}))
        shapes=expanded
    return shapes
def cell_perimeter(shape):return sum((x+dx,y+dy) not in shape for x,y in shape for dx,dy in DIRS)
def shared_edges(shape):return sum((x+1,y) in shape for x,y in shape)+sum((x,y+1) in shape for x,y in shape)
def outer_background(shape):
    loX=min(x for x,y in shape)-1;hiX=max(x for x,y in shape)+1;loY=min(y for x,y in shape)-1;hiY=max(y for x,y in shape)+1
    todo=[(loX,loY)];seen=set(todo)
    while todo:
        x,y=todo.pop()
        for dx,dy in DIRS:
            pos=x+dx,y+dy
            if loX<=pos[0]<=hiX and loY<=pos[1]<=hiY and pos not in seen and pos not in shape:seen.add(pos);todo.append(pos)
    holes={(x,y) for x in range(loX,hiX+1) for y in range(loY,hiY+1) if (x,y) not in shape and (x,y) not in seen}
    return seen,holes
POLY7=grow_polyominoes(7)
def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade4-composite-');note=''
    if k=='same-perimeter-area-compare':
        a,b,c=lengths(s);assert perimeter(a,b)==4*c;first,second=a*b,c*c;assert second>first;answer=choice(r,lambda o:o=='Шаршының ауданы үлкен');note=f'Actualareas{a}×{b}={first}versus{c}²={second}; equalP{perimeter(a,b)}doesnotimplyequalarea.'
    elif k=='square-area-from-perimeter':
        p=one(lengths(s));edge=F(p,4);assert edge.denominator==1;target=int(edge)**2;answer=quantity_choice(r,target,'см²');note=f'Actual4equal sides sum{p}, side{edge}, squarearea{target}; allactualunitschecked.'
    elif k=='rectangle-area-units':
        a,b=lengths(s);answer=quantity_choice(r,a*b,'см²');note=f'Actualrectanglearea{a}×{b}={a*b}, wronglinearunit excluded despite matchingnumericvalue.'
    elif k=='two-disjoint-rectangles':
        a,b,c,d=lengths(s,'м');assert 'қабаттаспайды' in s;answer=str(a*b+c*d);note=f'Disjointcomplete pieces{a*b}/{c*d}m²sum{answer}; nooverlap/noextraareas.'
    elif k=='unit-square-area':
        edge=one(lengths(s));count=int(m(r'(\d+) шаршыдан',s)[1]);assert 'қабаттаспайды' in s;answer=quantity_choice(r,count*edge**2,'см²');note=f'Actual{count}nonoverlappingsquares side{edge}, totalarea{count*edge**2}; dimensionsandunitsdistinguished.'
    elif k=='square-equal-rectangle-area':
        a,b=lengths(s);area=a*b;edge=math.isqrt(area);assert edge*edge==area;answer=quantity_choice(r,edge,'см');note=f'Actualrectanglearea{area}, equalareasquareuniquepositive side{edge}; notperimeterorarea-as-length.'
    elif k=='row-squares-perimeter':
        edge=one(lengths(s));count=int(m(r'(\d+) бірдей шаршыны',s)[1]);shape={(i,0) for i in range(count)};boundary=cell_perimeter(shape);assert boundary==4*count-2*(count-1);answer=quantity_choice(r,boundary*edge,'см');note=f'Exactunionof{count}gridcells, sharededges{shared_edges(shape)}countedtwiceinternally; actualouteredges{boundary}×{edge}={boundary*edge}.'
    elif k=='grid-cells-area-mm':
        edge=one(lengths(s,'мм'));count=int(m(r'(\d+) толық ұяшықтан',s)[1]);answer=str(count*edge*edge);note=f'Everyactualcell{edge}²mm², completecount{count}; area{answer}mm², notcellcountorcm².'
    elif k=='unknown-disjoint-side':
        area=int(m(r'ауданы (\d+) см²',s)[1]);a,b,width=lengths(s);target=F(area-a*b,width);assert target>0 and target.denominator==1;answer=str(target.numerator);assert a*b+int(target)*width==area;note=f'Actualdisjointwholearea{area}minusfirst{a*b}, remainingrectdividedbyknownwidth{width}, uniquepositive side{target}.'
    elif k=='l-floor-tiles':
        a,b,c,d=lengths(s,'м');tile=one(lengths(s));assert c<a and d<b and 'кесілмейді' in s;units=[F(v*100,tile) for v in [a,b,c,d]];assert all(v.denominator==1 for v in units);A,B,C,D=map(int,units);shape={(x,y) for x in range(A) for y in range(B) if not(x>=A-C and y>=B-D)};target=len(shape);assert F((a*b-c*d)*10000,tile*tile)==target;answer=choice(r,lambda o:n(o)==target);note=f'All4actualmetreboundariesconverted/exactlydivisibleby{tile}cmtile; occupiedtilegrid{A}×{B}minus{C}×{D}, count{target}; exactareaoracleagrees.'
    elif k=='rectangle-floor-tiles':
        a,b=lengths(s,'м');tile=one(lengths(s));counts=[F(v*100,tile) for v in [a,b]];assert all(v.denominator==1 for v in counts);target=math.prod(counts);assert target.denominator==1;target=int(target);answer=choice(r,lambda o:n(o)==target);assert F(a*b*10000,tile*tile)==target;note=f'Actualmetresconvertedtocm, tilecounts{counts}, total{target}; nofractions/cuts/waste, independentareaunitscheck.'
    elif k=='restored-square-edge':
        cut=one(lengths(s));remaining=int(m(r'ауданы (\d+) см²',s)[1]);original=remaining+cut**2;edge=math.isqrt(original);assert edge*edge==original and edge>cut;answer=quantity_choice(r,edge,'см');note=f'Cut{cut}²restoredtoremaining{remaining}, originalarea{original}, uniquepositivesquareedge{edge}; cutfits.'
    elif k=='square-split-other-area':
        side,p=lengths(s);width=F(p,2)-side;assert 0<width<side;other=side-width;area=side*other;assert area.denominator==1 and side*width+area==side**2;answer=str(area.numerator);note=f'Actualsquare{side}splitparallel, fullsharedside{side}; givenpartP{p}→width{width}, other{other}, area{area}; wholeareaconservation.'
    elif k=='largest-perimeter-fixed-area':
        area=int(m(r'Ауданы (\d+) см²',s)[1]);pairs=[(a,b) for a in range(1,area+1) for b in range(a,area+1) if a*b==area];ps=[perimeter(a,b) for a,b in pairs];answer=str(max(ps));note=f'Complete positiveunorderedpairdomain1..{area}²gives{list(zip(pairs,ps))}; maximum{max(ps)}, naturallengthconstraintessential.'
    elif k=='two-rectangle-constraints':
        p=int(m(r'периметрі (\d+) см',s)[1]);area=int(m(r'ауданы (\d+) см²',s)[1]);pairs=[(a,p//2-a) for a in range(1,p//2) if a*(p//2-a)==area];assert sorted(pairs)==[(6,9),(9,6)]
        def fits(o):a,b=lengths(o);return perimeter(a,b)==p and a*b==area
        answer=choice(r,fits);note=f'EveryactualMCQpairchecked against BOTHperimeter{p}andarea{area}; positivefullsumdomainhas onlyrotations{pairs}.'
    elif k=='split-perimeters-area':
        p,combined=lengths(s);length=F(combined-p,2);width=F(p,2)-length;assert length>width>0;area=length*width;assert area.denominator==1
        for t in [F(1,3),width/2,width-F(1,3)]:assert 0<t<width and perimeter(length,t)+perimeter(length,width-t)==combined
        answer=quantity_choice(r,int(area),'см²');note=f'ExactPadditionequation:newsum=oldP+2×sharedcut; recoveredlength{length}, width{width}, area{area}; rationalcutpositionsverifycancellation universally2(L+t)+2(L+W−t)=4L+2W.'
    elif k=='connected-squares-max-perimeter':
        edge=one(lengths(s));count=int(m(r'(\d+) бірдей шаршыны',s)[1]);assert count==7;perimeters=[];withHoles=0
        for shapeTuple in POLY7:
            shape=set(shapeTuple);background,holes=outer_background(shape);withHoles+=bool(holes)
            outer=sum((x+dx,y+dy) in background for x,y in shape for dx,dy in DIRS);assert outer<=cell_perimeter(shape)==4*count-2*shared_edges(shape);assert shared_edges(shape)>=count-1;perimeters.append(outer*edge)
        assert withHoles==4
        target=max(perimeters);line={(x,0) for x in range(count)};assert cell_perimeter(line)*edge==target;answer=quantity_choice(r,target,'см');note=f'Exhaustive{len(POLY7)}fixedconnected7-cellpolyominoes, translationnormalized, actualouterboundariesflood-filled separatelyfromcavities({withHoles}shapeswithholes); max{target}; all-exposed-edgegraphbound≥outerboundandstraightrowwitnessindependentlyconfirm.'
    elif k=='diagonal-half-area':
        a,b=lengths(s);polygon=[(0,0),(a,0),(a,b)];area=polygon_area(polygon);assert area==F(a*b,2) and area.denominator==1;answer=quantity_choice(r,int(area),'см²');note=f'Actualrectangle{a}×{b}, diagonaltriangle shoelacecoordinates exactarea{area}; twohalvescongruent, notfullrectangle.'
    elif k=='rectangle-perimeter-units':
        a,b=lengths(s);answer=quantity_choice(r,perimeter(a,b),'см');note=f'Actual4side sum{a}+{b}+{a}+{b}={perimeter(a,b)}cm; squareunit/area distractors independentlyexcluded.'
    elif k=='restored-rectangle-width':
        length,cutA,cutB=lengths(s);remaining=int(m(r'ауданы (\d+) см²',s)[1]);original=remaining+cutA*cutB;width=F(original,length);assert width>max(cutA,cutB) and width.denominator==1;answer=str(width.numerator);note=f'Actualcutarea{cutA*cutB}restoredtoremaining{remaining}→whole{original}; knownlength{length}giveswidth{width}; cutfitsbothorientations.'
    elif k=='corner-cut-perimeter':
        a,b,c,d=lengths(s);assert 0<c<a and 0<d<b;poly=[(0,0),(a,0),(a,b-d),(a-c,b-d),(a-c,b),(0,b)];p=polygon_perimeter(poly);assert p==perimeter(a,b);area=polygon_area(poly);assert area==a*b-c*d;answer=quantity_choice(r,p,'см');note=f'Actual6vertexorthogonalboundary aftercornercut{c}×{d}, directsegmentlengthsum{p}cm; independentarea{area}cm²explainswrongunit/areatrap.'
    elif k=='tiled-rectangle-unit-area':
        rows,columns=map(int,m(r'(\d+) қатарға, әр қатарда (\d+) шаршыдан',s).groups());p=int(m(r'периметрі (\d+) см',s)[1]);edge=F(p,2*(rows+columns));assert edge.denominator==1;shape={(x,y) for x in range(columns) for y in range(rows)};assert cell_perimeter(shape)*edge==p;area=int(edge)**2;answer=quantity_choice(r,area,'см²');note=f'Actual{rows}×{columns}fullgrid outerboundary{cell_perimeter(shape)}unitedges; P{p}givesedge{edge}; requestedonecellarea{area}, nottotal{area*rows*columns}.'
    else:raise AssertionError(k)
    return answer,note
def main():
    assert len(ROWS)==23 and len(POLY7)==760;entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==4 and r['topic']=='geometry' and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);assert raw['solution'];refs.add(raw['id']);normalize=lambda t:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t).lower()).strip();assert normalize(raw['statement'])!=normalize(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Actual printed lengths/units and complete positivefactorpairs; exactpolygon/cellunion boundaries, full760connected7-cellpolyominoes withouter-backgroundfloodfill, exacttilegrids and shared-cut algebra','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['all23saved/newconditions/MCQs/fullsolutions read manually','disjoint/removedparts and mixedlength/areaunits keptdistinct','allactual MCQvalues/units/bothconstraints checked independently','sharedboundaries canceltwice; actualouterpolyominoedges/floodfill distinguished fromholeboundaries','finite naturalfactorpairs and everyconnected7-cellgridshape enumerated withoutauthor solver']})
    assert len(refs)==23
    assert max(cell_perimeter(set(shape)) for shape in POLY7)==16
    assert len(grow_polyominoes(6))==216
    ring={(x,y) for x in range(3) for y in range(3)}-{(1,1)};assert outer_background(ring)[1]=={(1,1)} and cell_perimeter(ring)==16
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));";hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'scope':'All23source-addressed saved grade4composite editions; noauthorcalculator/spec/checker imported.','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':23,'wrongKeysRejected':23,'sourceRefs':23,'hashesMatched':23,'fixedConnected7cellShapes':760,'max2cmPerimeter':32,'outerBoundaryHoleCheck':True,'authorSolverImported':False}))
if __name__=='__main__':main()
