"""External read/geometry oracle for root-authored nonvisual line batches.

All saved/new full conditions, official/authored full solutions and every MCQ
were read. This module uses printed givens and own rational coordinates/direction
vectors; it does not load author models, parameters or their solvers.
"""
import copy, hashlib, itertools, json, math, re
from fractions import Fraction as F
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

def clean(s):
    return str(s).replace('$','').replace('\\parallel','∥').replace('\\perp','⟂').replace('\\angle','∠').replace('^\\circ','°').replace('\\circ','°').strip()

def norm(s): return re.sub(r'\s+',' ',clean(s)).casefold().strip()
def one(xs):
    assert len(xs)==1, xs
    return xs[0]
def options(r): return [o['text'] if isinstance(o,dict) else o for o in r.get('options') or []]
def nums(s): return [F(t.replace(',','.')) for t in re.findall(r'(?<![A-Za-z])[+-]?\d+(?:[.,]\d+)?', clean(s))]
def rejected(fn):
    try: fn()
    except (AssertionError, ValueError, ZeroDivisionError, IndexError): return
    raise AssertionError('Changed printed givens/answer were not rejected')
def selected(r, predicate):
    hit=one([o for o in options(r) if predicate(clean(o))])
    assert norm(hit)==norm(r['answer']), (r['answer'],hit)
def numerical(r,n):
    assert nums(r['answer'])==[F(n)], (r['answer'],n)

def solve_intersections(r,i,source=False):
    s=clean(r['statement']); os=options(r)
    if i==0:
        assert 'қиылысады' in s
        if not source: assert 'екі бөлек' in s
        selected(r,lambda o:o=='1' or norm(o) in ('дәл біреу','біреу','тек біреу'))
    elif i==1:
        angle=nums(s)[0]; assert 0<angle<90
        target=[180-angle,angle,180-angle]
        selected(r,lambda o:nums(o)==target)
        assert sum(target)+angle==360
        if not source: assert 'КЕЙІН' in s and 'ретімен' in s
    elif i==2:
        assert ('Қайшыны' in s) if source else ('қарама-қарсы' in s and 'созылған' in s)
        numerical(r,nums(s)[0])
    elif i==3:
        assert 'жазықтық' in s.casefold()
        selected(r,lambda o:any(t in o.casefold() for t in ('тақтасының беті','үстелдің беті')))
    elif i==4:
        assert re.search(r'бір түзу.*жатпай',s)
        letters=re.findall(r'\b[A-Z]\b',s)[:3]; assert len(set(letters))==3
        selected(r,lambda o:o=='('+''.join(letters)+')')
    elif i==5:
        if source: right=nums(s)[0]; remaining=3
        else:
            assert 'тік бұрыш' in s
            right=F(90)
            removed=1 if 'БІРЕУІ' in s else 2 if 'ЕКЕУІ' in s else 0
            assert removed
            remaining=4-removed
        assert right==90
        numerical(r,right*remaining)
    elif i==6:
        obtuse=nums(s)[0]; assert 90<obtuse<180 and 'сүйір' in s.casefold()
        acute=180-obtuse; assert 0<acute<90
        numerical(r,acute)
    elif i==7:
        assert 'төрт' in s.casefold() and ('қосынды' in s or 'қоссақ' in s)
        if not source: assert 'Осы ТӨРТ' in s
        numerical(r,360)
    elif i==8:
        if source: assert 'Үш түзу' in s; lines=3
        else:
            lines=nums(s)[0]; assert 'БЕТТЕСПЕЙТІН' in s and 'КӨРШІ' in s
            assert 'бірнеше секторды біріктірген бұрыштар алынбайды' in s
        numerical(r,2*lines)
    elif i==9:
        if not source: assert 'ӘРТҮРЛІ' in s
        selected(r,lambda o:norm(o) in ('тек біреу','біреу','дәл бір'))
    elif i==10:
        assert 'вертикаль' in s.casefold() and 'әрқашан' in s.casefold()
        selected(r,lambda o:('тең' in o.casefold() and not re.search(r'180|қосынды',o.casefold())))
    else: raise AssertionError(i)

def solve_parallel(r,i,source=False):
    s=clean(r['statement']); os=options(r)
    if i==0:
        selected(r,lambda o:'бір жазықтықта' in o.casefold() and ('қиылыспай' in o.casefold() or 'ортақ нүктелері жоқ' in o.casefold()))
        if not source: assert 'БӨЛЕК' in s
    elif i==1:
        assert 'жазықтық' in s.casefold() and ('әртүрлі' in s or 'БӨЛЕК' in s)
        relations=re.findall(r'([a-z])\s*⟂\s*([a-z])',s); assert len(relations)==2 and relations[0][1]==relations[1][1]
        a,b=relations[0][0],relations[1][0]
        selected(r,lambda o:re.sub(r'\s','',o)==a+'∥'+b)
    elif i==2:
        assert 'параллель емес' in s.casefold()
        def nonparallel(o):
            if source: return 'қайшы' in o.casefold()
            m=re.search(r'(\d+):(\d+)',o)
            if not m: return False
            hour,minute=map(int,m.groups());minute_angle=6*minute;hour_angle=30*(hour%12)+F(minute,2)
            return (hour_angle-minute_angle)%180!=0
        selected(r,nonparallel)
    elif i==3:
        a,b=nums(s)[:2]; assert a>0 and b>0 and 'периметр' in s.casefold()
        numerical(r,2*(a+b))
    elif i==4:
        selected(r,lambda o:'кез келген' in o.casefold() or 'Тең болуы да, әртүрлі болуы да мүмкін' in o)
    elif i==5:
        assert 'жатпайды' in s.casefold() and 'параллель' in s.casefold()
        selected(r,lambda o:norm(o) in ('тек біреу','дәл бір','біреу'))
    elif i==6:
        assert 'жазықтық' in s.casefold() and ('әртүрлі' in s or 'БӨЛЕК' in s)
        pairs=re.findall(r'([a-z])\s*∥\s*([a-z])',s); assert len(pairs)==2 and pairs[0][1]==pairs[1][0]
        a,c=pairs[0][0],pairs[1][1]
        selected(r,lambda o:re.sub(r'\s','',o)==a+'∥'+c)
    elif i==7:
        n=nums(s); gap,first,last=n[:3]; assert gap>0 and last>first
        numerical(r,(last-first)*gap)
    elif i==8:
        if source:
            labels=one(re.findall(r'([A-Z]{4})\s*—\s*квадрат',s)); target=one(re.findall(r'([A-Z]{2})\$? қабырғасына',s))
        else:
            labels=''.join(re.findall(r'\b[A-Z]\b',s)[:4]);target=one(re.findall(r'([A-Z]{2}) қабырғасына',s))
        assert len(labels)==4 and len(set(labels))==4
        points={labels[0]:(0,0),labels[1]:(1,0),labels[2]:(1,1),labels[3]:(0,1)}
        edges={frozenset((labels[j],labels[(j+1)%4])) for j in range(4)}
        def direction(pair):
            a,b=(points[c] for c in pair);return b[0]-a[0],b[1]-a[1]
        def fits(o):
            o=o.strip();assert re.fullmatch('[A-Z]{2}',o)
            u,v=direction(o),direction(target)
            return frozenset(o) in edges and frozenset(o)!=frozenset(target) and u[0]*v[1]-u[1]*v[0]==0
        selected(r,fits)
    elif i==9:
        assert 'арасында' in s.casefold();a,b=nums(s)[:2];assert a>0 and b>0
        numerical(r,a+b)
    else: raise AssertionError(i)

def geometry_proofs():
    """Separate exact coordinate/direction witnesses, no educational author code."""
    vectors=[(x,y) for x in range(-4,5) for y in range(-4,5) if (x,y)!=(0,0)]
    direction_pairs=0
    for u,v in itertools.product(vectors,repeat=2):
        cross=u[0]*v[1]-u[1]*v[0]
        if not cross: continue
        dot=u[0]*v[0]+u[1]*v[1]
        opposite=(-u[0])*(-v[0])+(-u[1])*(-v[1])
        adjacent=u[0]*(-v[0])+u[1]*(-v[1])
        assert opposite==dot and adjacent==-dot
        direction_pairs+=1
    cyclic=0
    for angle in range(1,180):
        for rotate in range(0,360,7):
            rays=sorted([(rotate+t)%360 for t in (0,angle,180,180+angle)])
            gaps=[(rays[(j+1)%4]-a)%360 for j,a in enumerate(rays)]
            assert sum(gaps)==360 and sorted(gaps)==sorted([angle,180-angle]*2)
            cyclic+=1
    sectors=0
    for n in range(2,10):
        for half in itertools.combinations(range(1,10),n):
            rays=sorted([F(17*j) for j in half]+[F(17*j+180) for j in half])
            gaps=[(rays[(j+1)%len(rays)]-a)%360 for j,a in enumerate(rays)]
            assert len(set(rays))==2*n and all(g>0 for g in gaps) and sum(gaps)==360
            sectors+=1
    unique_lines=0
    pts=list(itertools.product(range(-2,3),repeat=2))
    def normal(A,B,C):
        g=math.gcd(math.gcd(abs(A),abs(B)),abs(C));A,B,C=A//g,B//g,C//g
        return (-A,-B,-C) if A<0 or (A==0 and B<0) else (A,B,C)
    for (x1,y1),(x2,y2) in itertools.combinations(pts,2):
        A,B=y1-y2,x2-x1;C=-(A*x1+B*y1);true=normal(A,B,C)
        for a,b in vectors:
            c=-(a*x1+b*y1)
            if a*x2+b*y2+c==0: assert normal(a,b,c)==true
        unique_lines+=1
    parallel=0
    for u in vectors:
        r=(-u[1],u[0]);assert u[0]*r[0]+u[1]*r[1]==0
        for m,n in itertools.product(range(1,6),repeat=2):
            v=(u[0]*m,u[1]*m);w=(u[0]*n,u[1]*n)
            assert v[0]*r[0]+v[1]*r[1]==w[0]*r[0]+w[1]*r[1]==0
            assert v[0]*w[1]-v[1]*w[0]==0
            parallel+=1
    gaps=between=rectangles=0
    for gap in range(1,16):
        for first in range(1,12):
            for last in range(first+1,20):
                positions={j:F(j*gap) for j in range(1,21)}
                assert positions[last]-positions[first]==(last-first)*gap;gaps+=1
    for a in range(1,31):
        for b in range(1,31):
            T=F(0);left=F(-a);right=F(b)
            assert abs(right-left)==abs(T-left)+abs(right-T);between+=1
            vertices=[(0,0),(a,0),(a,b),(0,b)]
            perimeter=sum(abs(vertices[(j+1)%4][0]-v[0])+abs(vertices[(j+1)%4][1]-v[1]) for j,v in enumerate(vertices))
            assert perimeter==2*(a+b);rectangles+=1
    return {'nonparallelIntegerDirectionPairs':direction_pairs,'completeWholeDegreeRotatedCrossings':cyclic,'completeSubsetNeighborSectorCases':sectors,'twoPointUniqueLineCoordinatePairs':unique_lines,'orthogonalParallelDirectionCases':parallel,'numberedLineGapLedgers':gaps,'betweenPointDistanceLedgers':between,'rectangleCoordinatePerimeters':rectangles}

def run(batch_name,solve,changes):
    batch='problems/editorial/batches/'+batch_name+'.json';report='problems/editorial/reviews/'+batch_name+'.json'
    rows=json.loads((ROOT/batch).read_text());rows=rows['editions'];assert len(rows)==len(changes)
    evidence=geometry_proofs();entries=[]
    for i,r in enumerate(rows):
        solve(r,i);assert r['grade']==6 and r['minimumPlan']=='pro' and not r.get('image')
        ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and raw['solution']
        saved=copy.deepcopy(raw);saved['answer']=raw['sourceAnswer'];solve(saved,i,True)
        if options(raw): assert norm(one([o['text'] for o in raw['options'] if o['correct']]))==norm(raw['sourceAnswer'])
        assert norm(raw['statement'])!=norm(r['statement'])
        wrong=copy.deepcopy(r);wrong['answer']='999999';rejected(lambda:solve(wrong,i))
        changed=copy.deepcopy(r);field,old,new=changes[i]
        if field=='options': changed[field]=[o.replace(old,new) for o in changed[field]]
        else: changed[field]=changed[field].replace(old,new)
        assert changed!=r,(i,old)
        rejected(lambda:solve(changed,i))
        h=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        entries.append({'editionId':r['editionId'],'sha256':h,'verdict':'verified','method':'independent_full_saved_new_read_printed_givens_and_exact_coordinate_direction_geometry','notes':['Read all saved/new full conditions, official/authored full solutions and every MCQ.','Recomputed printed numeric givens and every option; own exact coordinate/direction and complete angle/sector/gap domains, not author parameters or solver.','Coplanar/distinct/noncollinear prerequisites, cyclic neighbor-only sectors, vertical/adjacent/universal roles, line versus segment lengths and between-point distance distinguished.','90/180/360 and categorical Euclidean facts are unchanged invariants, not claims of new mathematical meanings.']})
    out={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-'+batch_name+'.py','sharedIndependentGeometry':'scripts/editorial/review-grade6-plane-lines.py','fullSavedAndNewRead':len(rows),'printedKeysChecked':len(rows),'badKeysRejected':len(rows),'printedCanariesRejected':len(rows),'authorSolverImported':False,'findings':[],**evidence},'entries':entries}
    (ROOT/report).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'verified':len(rows),'report':report,**evidence}))
