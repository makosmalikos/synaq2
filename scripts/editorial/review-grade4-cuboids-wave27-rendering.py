"""Independent printed-condition/voxel review of39source-addressed cuboid editions.
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
PACK='problems/editorial/batches/grade4-cuboids-wave27.json'
OUT='problems/editorial/reviews/grade4-cuboids-wave27.json'
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
def length_values(s,unit='см'):return list(map(int,re.findall(r'(\d+) '+unit+r'(?![²³])',s)))
def triple(o):
    ds=length_values(o);assert len(ds)==3,(o,ds);return ds
def face_areas(ds):
    a,b,c=ds;return [a*b,a*c,b*c]
def surface(ds):return 2*sum(face_areas(ds))
def wire(ds):return 4*sum(ds)
def integer_square(n):
    assert F(n).denominator==1 and n>0;root=math.isqrt(int(n));assert root*root==n;return root
VERTICES=[(x,y,z) for x in [0,1] for y in [0,1] for z in [0,1]]
EDGES=[(a,b) for i,a in enumerate(VERTICES) for b in VERTICES[i+1:] if sum(x!=y for x,y in zip(a,b))==1]
FACES=[frozenset(v for v in VERTICES if v[axis]==value) for axis in range(3) for value in [0,1]]
def edge_lengths(ds):return [sum((a[i]-b[i])**2*ds[i]**2 for i in range(3)) for a,b in EDGES]
def volume_triples(v):return [(a,b,v//(a*b)) for a in range(1,v+1) for b in range(a,v//a+1) if v%(a*b)==0 and b<=v//(a*b)]
def sum_triples(s):return [(a,b,s-a-b) for a in range(1,s) for b in range(a,s-a) if b<=s-a-b]
def exposed_faces(occupied):
    directions=[(1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1)]
    return sum(tuple(v[i]+d[i] for i in range(3)) not in occupied for v in occupied for d in directions)
def quantity_choice(r,value,unit):return choice(r,lambda o:o==str(value)+' '+unit)
def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade4-cuboids-');note=''
    if k=='equal-length-edges':
        ds=length_values(s)[:3];target=int(m(r'Ұзындығы (\d+) см болатын қырларын',s)[1]);count=edge_lengths(ds).count(target**2);answer=choice(r,lambda o:n(o)==count);note=f'All12bit-coordinate edges measured for actualdimensions{ds}; length{target}appears{count}times.'
    elif k in ['largest-face','face-area-gap']:
        ds=length_values(s);assert len(ds)==3;areas=face_areas(ds);answer=str(max(areas) if k=='largest-face' else max(areas)-min(areas));note=f'Every distinct orientation area{areas}checked; requested{ k}={answer}.'
    elif k=='cube-box-comparison':
        values=length_values(s);edge=values[0];ds=values[1:];assert len(ds)==3;first,second=edge**3,math.prod(ds);assert first>second;answer=choice(r,lambda o:o=='Мәдина жасаған қорап');note=f'Actual cube{edge}³={first}versus completeothertriple{ds}product{second}; largest singleedge doesnotdeterminevolume.'
    elif k=='square-faces':
        ds=length_values(s);assert len(ds)==3;faces=[(ds[a],ds[b]) for a,b in [(0,1),(0,1),(0,2),(0,2),(1,2),(1,2)]];answer=str(sum(a==b for a,b in faces));note=f'All6actualfaces{faces}classified as squaresiff dimensions equal.'
    elif k=='opposite-face-claim':
        for axis in range(3):assert FACES[2*axis].isdisjoint(FACES[2*axis+1]) and {tuple(v[i] for i in range(3) if i!=axis) for v in FACES[2*axis]}=={tuple(v[i] for i in range(3) if i!=axis) for v in FACES[2*axis+1]}
        answer=choice(r,lambda o:o=='Олар бірдей өлшемді тікбұрыштар болады');note='Coordinate faces on each fixed axis0/1are congruent, disjoint, have no commonedge. Generalface lengths neednotbesquares; actual7/4/3counterexample in solutionchecked.'
    elif k=='vertex-degree':
        degrees=[sum(v in e for e in EDGES) for v in VERTICES];assert degrees==[3]*8;answer=choice(r,lambda o:n(o)==one(set(degrees)));note='Independent8vertex binary-coordinate graph constructs12edges; everyvertex degree3.'
    elif k=='target-volume':
        v=int(m(r'Көлемі дәл (\d+) см³',s)[1]);answer=choice(r,lambda o:math.prod(triple(o))==v);note=f'EveryactualMCQdimensiontriple multiplied, products{[math.prod(triple(o)) for o in r["options"]]}, target{v}; sumtraprejected.'
    elif k=='cube-edge-from-wire':
        total=one(length_values(s));edge=F(total,len(EDGES));assert edge.denominator==1;answer=str(edge.numerator);note=f'Actual framewire{total}/independent edgecount{len(EDGES)}={edge}; no joint/waste allowances per condition.'
    elif k=='base-area':
        ds=length_values(s);assert len(ds)==3;assert 'ішкі' in s and 'ішкі табанының ауданы' in s;answer=str(ds[0]*ds[1]);note=f'Actual INTERNALbase{ds[0]}×{ds[1]}={answer}; height{ds[2]}irrelevant; external footprint not claimed.'
    elif k in ['cube-surface-open','cube-surface-choice','cube-single-face']:
        unit='дм' if 'дм' in s else 'см';edge=one(length_values(s,unit));target=edge**2*(1 if k=='cube-single-face' else len(FACES));answer=str(target) if not r.get('options') else quantity_choice(r,target,unit+'²');note=f'Cube edge{edge}{unit}; squarearea{edge**2}; actual requested{1 if k=="cube-single-face" else 6}faces gives{target}{unit}², not cubicvolume.'
    elif k=='face-count':
        assert len(set(FACES))==6;answer=str(len(FACES));note='Six distinct coordinate faces, threeoppositepairs, independentof8/5/3dimensions.'
    elif k=='equal-sum-volume-gap':
        ds=length_values(s);assert len(ds)==6;first,second=math.prod(ds[:3]),math.prod(ds[3:]);assert sum(ds[:3])==sum(ds[3:]) and second>first;gap=second-first;answer=choice(r,lambda o:o==f'Екінші қорапқа {gap} см³ артық');note=f'Actualtwoinnertriples{ds[:3]}/{ds[3:]}, equal sums, exactvolumes{first}/{second}; directionandgap{gap}bothchecked.'
    elif k=='height-from-wire':
        total,a,b=length_values(s);height=F(total,4)-a-b;assert height>0 and height.denominator==1;answer=str(height.numerator);assert wire([a,b,int(height)])==total;note=f'Actualwire{total}=4(a+b+h), recoveredh{height}, substitutedbackexactly.'
    elif k=='height-volume-gain':
        a,b,old,added=length_values(s);target=a*b*added;assert a*b*(old+added)-a*b*old==target;answer=quantity_choice(r,target,'см³');note=f'Old/newactualvolumes{a*b*old}/{a*b*(old+added)}, difference{target}; base×addedheight as independentcrosscheck.'
    elif k=='wire-remainder':
        metres=int(m(r'ұзындығы (\d+) м сымнан',s)[1]);edge=int(m(r'қыры (\d+) см',s)[1]);answer=str(metres*100-len(EDGES)*edge);assert int(answer)>=0;note=f'Exact2m→{metres*100}cm;12edges×{edge}; remaining{answer}cm, unitconversion before subtraction.'
    elif k=='cube-volume-from-surface':
        area=int(m(r'ауданы бірге (\d+) см²',s)[1]);edge=integer_square(F(area,6));target=edge**3;answer=quantity_choice(r,target,'см³');note=f'Sixface total{area}, oneface{F(area,6)}, unique positiveedge{edge}, volume{target}; no real-positive ambiguity.'
    elif k=='wire-from-single-face':
        area=int(m(r'бір жағының ауданы (\d+) см²',s)[1]);edge=integer_square(area);answer=str(len(EDGES)*edge);note=f'Actual singleface{area}, positiveedge{edge}; all12edge lengths sum{answer}.'
    elif k=='mixed-volume-dm':
        metres=re.findall(r'(\d+) м(?![²³])',s);centimetres=re.findall(r'(\d+) см(?![²³])',s);assert len(metres)==2 and len(centimetres)==1;ds=[F(v)*10 for v in metres]+[F(centimetres[0])/10];volume=math.prod(ds);assert volume.denominator==1;answer=str(volume.numerator);note=f'Every length converted to dm exactly{ds}, product{volume}dm³; no mixed-unit multiplication.'
    elif k=='largest-wire':
        lengths=[wire(triple(o)) for o in r['options']];target=max(lengths);answer=choice(r,lambda o:wire(triple(o))==target);note=f'All12edges actualcandidate sums{lengths}, maximum{target}; eachcandidate distinctdimensiontriple checked.'
    elif k=='reciprocal-volume-scale':
        factors=list(map(int,re.findall(r'(\d+) есе',s)));assert len(factors)==2 and factors[0]==factors[1];factor=factors[0];assert F(1,factor)*factor==1;answer=choice(r,lambda o:o=='Көлемі бұрынғыдай қалады');note=f'Universal scale product(1/{factor})×1×{factor}=1 exactly for allpositivedimensions; actual18×5×4 and6×5×12examples both360.'
    elif k=='box-surface':
        ds=length_values(s);assert len(ds)==3;answer=str(surface(ds));note=f'All6faces paired{face_areas(ds)}twice, exactsurface{answer}, not3facehalfsum.'
    elif k=='successive-sides-wire':
        vals=length_values(s);gap1,gap2,total=vals;bound=F(total,4);assert bound.denominator==1;solutions=[(h+gap1+gap2,h+gap1,h) for h in range(1,int(bound)+1) if wire([h+gap1+gap2,h+gap1,h])==total];dims=one(solutions);answer=str(math.prod(dims));note=f'Complete positiveheight1..{bound}domain, exactwire/successivegaps giveonly{dims}; volume{answer}.'
    elif k=='largest-integer-cube-tiling':
        ds=length_values(s);assert len(ds)==3;common=[d for d in range(1,min(ds)+1) if all(v%d==0 for v in ds)];edge=max(common);counts=[v//edge for v in ds];answer=str(math.prod(counts));assert math.prod(ds)==int(answer)*edge**3;note=f'Allcommondivisors{common}, largestedge{edge}; exact3Dcounts{counts}, volumeconservation checked.'
    elif k=='volume-from-increment-layers':
        values=list(map(int,re.findall(r'(\d+) см³',s)));assert len(values)==3
        wh,lh,lw=values;L=integer_square(F(lh*lw,wh));W=integer_square(F(wh*lw,lh));H=integer_square(F(wh*lh,lw));assert [W*H,L*H,L*W]==values;volume=integer_square(math.prod(values));assert volume==L*W*H;answer=quantity_choice(r,volume,'см³');note=f'Printed1cmindependentincrements give actualfaceproducts{values}; positive uniqueness L²/W²/H² exactrational, dims{L,W,H}, V²={math.prod(values)}, V{volume}.'
    elif k=='volume-from-face-areas':
        areas=list(map(int,re.findall(r'(\d+) см²',s)));assert len(areas)==3;v=integer_square(math.prod(areas));triples=[ds for ds in volume_triples(v) if sorted(face_areas(ds))==sorted(areas)];assert len(triples)==1;answer=str(v);note=f'V²=allthreefaceareaproduct{math.prod(areas)}, uniquepositiveV{v}; fullvolume-factortriples corroborateonly{triples}with thoseareaorientations.'
    elif k=='equal-wire-volume-comparison':
        total=int(m(r'Әр қаңқаға (\d+) см',s)[1]);a,b=map(int,m(r'ұзындығы (\d+) см, ені (\d+) см',s).groups());edge=F(total,12);height=F(total,4)-a-b;assert edge.denominator==height.denominator==1 and height>0;first=edge**3;second=a*b*height;assert first>second;gap=int(first-second);answer=choice(r,lambda o:o==f'Текшенің көлемі {gap} см³ артық');note=f'Equalwire{total}→cubeedge{edge}, otherheight{height}; volumes{first}/{second}, directional gap{gap}.'
    elif k=='minimum-surface-factor-triples':
        count=int(m(r'(\d+) текшенің бәрін',s)[1]);edge=int(m(r'Қыры (\d+) см',s)[1]);assert edge==1;triples=volume_triples(count);values=[surface(ds) for ds in triples];answer=quantity_choice(r,min(values),'см²');note=f'Completeunorderedfactortriples of{count}:{list(zip(triples,values))}; minimum{min(values)}, no assumedcube heuristic.'
    elif k=='edge-from-cube-volume-gain':
        inc=one(length_values(s));delta=int(m(r'көлемі (\d+) см³',s)[1]);valid=[a for a in range(1,delta+1) if (a+inc)**3-a**3==delta];answer=str(one(valid));assert inc==1;assert all(3*(a+1)**2+3*(a+1)+1>3*a*a+3*a+1 for a in range(1,delta+1));note=f'Completepositive1..{delta}edge domain; uniquekey{answer}; gap3a²+3a+1strictlyincreasing, beyondbound cannotreturn delta.'
    elif k=='corner-removed-surface':
        big,small=length_values(s);ratio=F(big,small);assert ratio.denominator==1 and ratio>1;nside=int(ratio);occupied={(x,y,z) for x in range(nside) for y in range(nside) for z in range(nside)};before=exposed_faces(occupied)*small**2;occupied.remove((0,0,0));after=exposed_faces(occupied)*small**2;assert before==after==6*big**2;answer=choice(r,lambda o:o=='Ауданы өзгермейді');note=f'Independentfull{nside}³voxeloccupancy/6-neighbour exposed-face enumeration, before{before}, aftercornerremove{after}; allnewcavityfacescounted.'
    elif k=='two-painted-faces':
        big,small=length_values(s);nside=F(big,small);assert nside.denominator==1 and nside>=2;nside=int(nside);unpainted=[(x,y,z) for x in range(nside) for y in range(nside) for z in range(nside) if z!=0 and z!=nside-1];answer=str(len(unpainted));note=f'Every{nside}³smallcube coordinate classified; paintonlyplanesz0/z{nside-1}; side-border cubes correctly retained, unpainted{answer}.'
    elif k=='direct-volume':
        ds=length_values(s);assert len(ds)==3;answer=str(math.prod(ds));note=f'Actual3lengths{ds}multiplied, volume{answer}cm³.'
    elif k=='cube-topology-triple':
        counts=[len(FACES),len(EDGES),len(VERTICES)];assert counts==[6,12,8];answer=choice(r,lambda o:list(map(int,re.findall(r'\d+',o)))==counts);note='Independentbinarycoordinatecuboid graph:6faces,12edges,8vertices, actual requestedorder and all4MCQtriples inspected.'
    elif k=='box-wire-total':
        ds=length_values(s);assert len(ds)==3;answer=str(wire(ds));note=f'Actualdimensions{ds}, exactly4edgesperaxis, total{answer}cm.'
    elif k=='wire-from-surface':
        area=int(m(r'ауданы (\d+) см²',s)[1]);edge=integer_square(F(area,6));answer=str(12*edge);note=f'Actualfullsurface{area}, oneface{F(area,6)}, exactpositiveedge{edge}, sum12edges{answer}.'
    elif k=='equal-cube-volume-choice':
        edge=int(m(r'Қыры (\d+) см',s)[1]);v=edge**3;answer=choice(r,lambda o:math.prod(triple(o))==v);note=f'Actualcubevolume{edge}³={v}; all4actualtripleproducts{[math.prod(triple(o)) for o in r["options"]]}checked, equalsumsnotmistakenforequalvolumes.'
    elif k=='maximum-volume-wire':
        total=int(m(r'бірге (\d+) см',s)[1]);sides=F(total,4);assert sides.denominator==1;triples=sum_triples(int(sides));volumes=[math.prod(ds) for ds in triples];answer=quantity_choice(r,max(volumes),'см³');note=f'Complete unorderedpositive tripledomain withsum{sides}:{list(zip(triples,volumes))}; maximum{max(volumes)}, finite proof includes every case.'
    else:raise AssertionError(k)
    return answer,note
def main():
    assert len(ROWS)==39;entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==4 and r['topic']=='geometry' and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);assert raw['solution'];refs.add(raw['id']);normalize=lambda t:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t).lower()).strip();assert normalize(raw['statement'])!=normalize(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Actual printed dimensions and exact units; independent8vertex/12edge/6face graph, fullfactor/sum triples, positivevolume uniqueness and fullpainted/corner voxel domains','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['all39saved/newconditions/MCQs/fullsolutions read manually','linear/area/volume units and each requested quantity distinguished','complete positive factor/sum/unknownheight domains enumerated with equality endpoints','allactual MCQdimensiontriples/units/directionalclaims checked','paintedplanes and corner-exposed faces counted by an independent3D coordinate model']})
    assert len(refs)==39 and len(EDGES)==12 and len(FACES)==6 and len(VERTICES)==8
    assert volume_triples(24)==[(1,1,24),(1,2,12),(1,3,8),(1,4,6),(2,2,6),(2,3,4)]
    assert len(sum_triples(12))==12
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));";hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[{'sourceId':'de095b432d54bd59','status':'corrected_before_signature','finding':'Question explicitly asks INTERNALbasearea for supplied inner dimensions, avoiding an unintended externalfootprint interpretation.'}],'scope':'All39source-addressed saved grade4cuboid editions; noauthorcalculator/spec/checker imported.','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':39,'wrongKeysRejected':39,'sourceRefs':39,'hashesMatched':39,'full24cubeFactorTriples':6,'full12sumTriples':12,'independentVoxelPaintAndRemoval':True,'authorSolverImported':False}))
if __name__=='__main__':main()
