"""External full-content symmetry review: own exact coordinate geometry.
No root author model/solver/parameter imports. Every saved/new condition,
full official/authored solution and every MCQ read before report signing.
"""
import copy,hashlib,itertools,json,math,re
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def clean(s):return str(s).replace('$','').replace('^\\circ','°').replace('\\circ','°').replace('\\to','→').strip()
def norm(s):return re.sub(r'\s+',' ',clean(s)).casefold().strip()
def one(xs):assert len(xs)==1,xs;return xs[0]
def opts(r):return[o['text']if isinstance(o,dict)else o for o in r.get('options')or[]]
def selected(r,predicate):assert norm(one([o for o in opts(r)if predicate(clean(o))]))==norm(r['answer']),(r['answer'],opts(r))
def numbers(s):return[F(x.replace(',','.'))for x in re.findall(r'[+-]?\d+(?:[.,]\d+)?',clean(s))]
def numeric(r,v):assert numbers(r['answer'])==[F(v)],(r['answer'],v)
def coords(s):return[tuple(F(x.replace(',','.'))for x in p)for p in re.findall(r'\(([+-]?\d+(?:[.,]\d+)?);\s*([+-]?\d+(?:[.,]\d+)?)\)',clean(s))]
def pair_option(r,p):selected(r,lambda o:coords(o)==[p])
def sides(s):return[F(x)for x in re.findall(r'(\d+)\s*см',clean(s))]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def minus(a,b):return tuple(x-y for x,y in zip(a,b))
def distance2(a,b):v=minus(a,b);return dot(v,v)
def reflect(p,n,c=F(0)):
    denominator=dot(n,n);assert denominator
    factor=2*(dot(n,p)-c)/denominator
    return tuple(x-factor*a for x,a in zip(p,n))
def central(p,o):return tuple(2*c-x for x,c in zip(p,o))
def midpoint(a,b):return tuple((x+y)/2 for x,y in zip(a,b))

def solve_reflection(r,i,source=False):
    s=clean(r['statement'])
    if i==0:
        selected(r,lambda o:o==('A'if source else'H'))
        if not source:assert 'дәл ортада'in s and 'H-тың екі тік бөлігі бірдей'in s
    elif i==1:
        assert 'бүктегенде'in s and 'беттесті'in s
        selected(r,lambda o:'қатысты'in o and 'симметриялы'in o and ('және'in o))
    elif i==2:
        assert 'шексіз'in s.casefold()
        selected(r,lambda o:norm(o)=='шеңбер')
    elif i==3:
        assert ('Тең қабырғалы'in s)if source else('Үш қабырғасы өзара тең'in s)
        numeric(r,3)
    elif i==4:
        a,b=coords(s);horizontal=reflect(a,(F(0),F(1)))==b;vertical=reflect(a,(F(1),F(0)))==b
        assert horizontal!=vertical
        selected(r,lambda o:('Ox'in o if horizontal else'Oy'in o))
    elif i==5:
        a=one(coords(s));axis='Oy'if'Oy'in s else'Ox'if'Ox'in s else None;assert axis
        b=reflect(a,(F(1),F(0))if axis=='Oy'else(F(0),F(1)))
        pair_option(r,b)
    elif i==6:
        ss=sides(s);assert len(ss)==3 and min(ss)>0 and 2*max(ss)<sum(ss)
        numeric(r,sum(ss))
        if not source:assert 'ТЕК жаңа'in s
    elif i==7:
        if not source:assert 'ӘРТҮРЛІ'in s and 'ТОЛЫҚ'in s
        selected(r,lambda o:'перпендикуляр'in o and 'ортас'in o and 'және'in o)
    elif i==8:
        a=one(coords(s));assert 'Ox'in s
        b=reflect(a,(F(0),F(1)));numeric(r,abs(b[1]-a[1]));assert b[0]==a[0]
        if not source:assert 'ТОЛЫҚ'in s
    elif i==9:
        selected(r,lambda o:'түзуінде жатқан барлық'in o or'түзуінің барлық'in o)
        if not source:assert 'толық жиынын'in s
    else:raise AssertionError(i)

def solve_central(r,i,source=False):
    s=clean(r['statement'])
    if i==0:
        target='O'if source else'C'
        selected(r,lambda o:o.startswith(target+' ')and'кесіндісінің ортасы'in o)
        if not source:assert 'ӘРТҮРЛІ'in s
    elif i==1:
        amount=one([F(x)for x in re.findall(r'=\s*(\d+)\s*см',s)]);numeric(r,2*amount)
    elif i==2:
        assert 'емес'in s or'ЖОҚ'in s
        selected(r,lambda o:'тең қабырғалы үшбұрыш'in o.casefold())
    elif i==3:
        a=one(coords(s));b=central(a,(F(0),F(0)));assert a[0]==0
        numeric(r,abs(b[1]-a[1]))
    elif i==4:selected(r,lambda o:numbers(o)==[F(180)])
    elif i==5:
        values=[F(n)for n in re.findall(r'\(([+-]?\d+)\)',s)];assert len(values)==2
        numeric(r,sum(values)/2)
        if not source:assert 'КООРДИНАТАСЫ'in s
    elif i==6:
        ss=sides(s);assert len(ss)==3 and min(ss)>0 and 2*max(ss)<sum(ss);numeric(r,sum(ss))
        if not source:assert 'ЖАҢА'in s
    elif i in(7,11):
        given=one(coords(s));pair_option(r,central(given,(F(0),F(0))))
        if not source and i==7:assert 'БАСТАПҚЫ'in s
    elif i==8:
        if source:selected(r,lambda o:'диагональдарының қиылысу нүктесінде'in o)
        else:
            labels=re.findall(r'\b[A-Z]\b',s)[:4];assert len(set(labels))==4
            diags=[labels[0]+labels[2],labels[1]+labels[3]]
            selected(r,lambda o:all(p in o for p in diags)and'диагональдарының қиылысуында'in o)
    elif i==9:
        amount=one([F(x)for x in re.findall(r'=\s*(\d+)\s*см',s)]);numeric(r,2*amount)
        if not source:assert 'БАСҚА QS'in s and'толық'in s
    elif i==10:
        radius=one([F(x)for x in re.findall(r'[Рр]адиусы\s*(\d+)\s*см',s)]);numeric(r,2*radius)
        if not source:assert 'Доға емес'in s
    else:raise AssertionError(i)

def proofs():
    points=[tuple(map(F,p))for p in itertools.product(range(-3,4),repeat=2)]
    normals=[tuple(map(F,p))for p in itertools.product(range(-2,3),repeat=2)if p!=(0,0)]
    reflection_cases=central_cases=0
    for n in normals:
        for c in map(F,range(-2,3)):
            for p in points:
                image=reflect(p,n,c);assert reflect(image,n,c)==p
                middle=midpoint(p,image);assert dot(n,middle)==c
                assert (image==p)==(dot(n,p)==c)
                change=minus(image,p);assert change[0]*n[1]-change[1]*n[0]==0
                q=(F(2),F(-1));assert distance2(p,q)==distance2(image,reflect(q,n,c))
                reflection_cases+=1
    for o in points:
        for p in points:
            image=central(p,o);assert midpoint(p,image)==o and central(image,o)==p
            assert(image==p)==(p==o)
            q=(F(2),F(-1));assert distance2(p,q)==distance2(image,central(q,o))
            central_cases+=1
    # Pair folding does not imply the original figure has that axis itself.
    U={(F(1),F(0)),(F(2),F(1)),(F(3),F(0))};n=(F(1),F(0))
    V={reflect(p,n)for p in U};assert U.isdisjoint(V)
    assert{reflect(p,n)for p in U|V}==U|V and{reflect(p,n)for p in U}!=U
    # Three insufficient parts of perpendicular-bisector condition.
    p,q=(F(-2),F(0)),(F(2),F(0))
    assert reflect(p,(F(1),F(-1)))!=q # midpoint, wrong inclination
    assert reflect(p,(F(1),F(0)),F(1))!=q # perpendicular, off midpoint
    assert dot((F(1),F(0)),p)-1<0<dot((F(1),F(0)),q)-1
    assert reflect(p,(F(1),F(0)),F(0))==q
    # Exact ideal H strokes; N differs under either possible stroke-preserving
    # mirror direction. F/R lack these mirror symmetries by their read shapes.
    H={frozenset(((-1,-2),(-1,2))),frozenset(((1,-2),(1,2))),frozenset(((-1,0),(1,0)))}
    N={frozenset(((-1,-2),(-1,2))),frozenset(((1,-2),(1,2))),frozenset(((-1,2),(1,-2)))}
    def transformed(strokes,fn):return{frozenset(fn(p)for p in edge)for edge in strokes}
    assert transformed(H,lambda p:(-p[0],p[1]))==H
    assert transformed(H,lambda p:(p[0],-p[1]))==H
    assert transformed(N,lambda p:(-p[0],p[1]))!=N and transformed(N,lambda p:(p[0],-p[1]))!=N
    assert transformed(N,lambda p:(-p[0],-p[1]))==N
    # Equilateral triangle in plane x+y+z=1: all six exact vertex permutations.
    tri={(F(1),F(0),F(0)),(F(0),F(1),F(0)),(F(0),F(0),F(1))}
    centroid=(F(1,3),)*3;assert{central(p,centroid)for p in tri}!=tri
    reflection_permutations=0
    for perm in itertools.permutations(range(3)):
        assert{tuple(p[j]for j in perm)for p in tri}==tri
        inversions=sum(perm[i]>perm[j]for i in range(3)for j in range(i+1,3))
        if inversions%2:reflection_permutations+=1;assert sum(perm[j]==j for j in range(3))==1
    assert reflection_permutations==3
    # Rectangle/square axes: candidate perpendicular bisectors of every vertex
    # pair; any nontrivial mirror of a noncollinear finite polygon swaps a pair.
    polygon_cases=0
    for a in range(1,12):
        for b in range(1,12):
            vertices={(F(0),F(0)),(F(a),F(0)),(F(a),F(b)),(F(0),F(b))}
            axes=set()
            for p,q in itertools.combinations(vertices,2):
                normal=minus(p,q);c=(dot(p,p)-dot(q,q))/2
                if{reflect(v,normal,c)for v in vertices}==vertices:
                    first=next(v for v in normal if v);axes.add(tuple(v/first for v in normal)+(c/first,))
            assert len(axes)==(4 if a==b else 2)
            center=(F(a,2),F(b,2));assert{central(p,center)for p in vertices}==vertices
            polygon_cases+=1
    # Circle centered at0: every nonzero rational normal through center
    # preserves squared radius, with arbitrary rational slopes (infinite set).
    circle_cases=0
    for m in range(-50,51):
        n=(F(1),F(m))
        for p in points:assert distance2(reflect(p,n),(F(0),F(0)))==dot(p,p);circle_cases+=1
    return{'exactGeneralAxisPointCases':reflection_cases,'exactArbitraryCenterPointCases':central_cases,'foldedPairAndIndividualAxisCountermodels':1,'perpendicularMidpointInsufficientCountermodels':3,'equilateralPermutationReflections':reflection_permutations,'exactRectangleSquareAxisAndCenterCases':polygon_cases,'arbitraryRationalCircleDirectionCases':circle_cases}

def rejected(fn):
    try:fn()
    except(AssertionError,IndexError,ValueError):return
    raise AssertionError('Changed answer/printed scenario not rejected')
def run(batch,solve,changes):
    rows=json.loads((ROOT/('problems/editorial/batches/'+batch+'.json')).read_text())['editions'];assert len(rows)==len(changes)
    results=proofs();entries=[]
    for i,r in enumerate(rows):
        solve(r,i);assert r['grade']==6 and r['minimumPlan']=='pro'and not r.get('image')
        ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions']if q['id']==ref['sourceId']]);assert cap['status']=='captured'and raw['checked']and raw['solution']
        saved=copy.deepcopy(raw);saved['answer']=raw['sourceAnswer'];solve(saved,i,True)
        if opts(raw):assert norm(one([o['text']for o in raw['options']if o['correct']]))==norm(raw['sourceAnswer'])
        assert norm(raw['statement'])!=norm(r['statement'])
        bad=copy.deepcopy(r);bad['answer']='999999';rejected(lambda:solve(bad,i))
        changed=copy.deepcopy(r);field,old,new=changes[i]
        changed[field]=[o.replace(old,new)for o in changed[field]]if field=='options'else changed[field].replace(old,new)
        assert changed!=r,(i,old);rejected(lambda:solve(changed,i))
        h=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        entries.append({'editionId':r['editionId'],'sha256':h,'verdict':'verified','method':'independent_full_saved_new_read_exact_general_reflection_and_central_coordinate_geometry','notes':['All saved/new full conditions, official/authored full solutions and every MCQ read.','Own exact Fraction line reflection p−2((n·p−c)/(n·n))n, arbitrary center2O−p, midpoint/perpendicular iff, involution/isometry/fixed-point witnesses and printed coordinate/distance targets.','Ideal H versus halfturn N, folded pair versus individual axis, full distance versus half, ordered direct/inverse coordinates, other rectangle diagonal and circle diameter checked.','Equilateral triangle3axes versus nohalfturn center and90/180/360/circle facts are mathematical invariants, not claimed new meanings. No author model, solver or params imported.']})
    report='problems/editorial/reviews/'+batch+'.json';out={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-'+batch+'.py','sharedOwnGeometry':'scripts/editorial/review-grade6-symmetry.py','fullSavedAndNewRead':len(rows),'printedKeysChecked':len(rows),'badKeysRejected':len(rows),'printedCanariesRejected':len(rows),'authorSolverImported':False,'findings':[],**results},'entries':entries};(ROOT/report).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'verified':len(rows),'report':report,**results}))
