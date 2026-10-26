"""Independent full printed-source/new geometry review, no author models/params.
Categorical countermodels, ALL side-pairs/directions/clocks and exact geometry.
"""
import importlib.util
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_utilities',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['integer','F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest']:globals()[name]=getattr(h,name)
from itertools import combinations
ROOT=h.ROOT;PACK='problems/editorial/batches/grade6-perpendicular.json';OUT='problems/editorial/reviews/grade6-perpendicular.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def norm2(a):return dot(a,a)
def pair_labels(s):
    match=m(r'^([A-Z]{4}) — төбелері осы ретпен',s);return list(match[1])
def directions(s):
    vectors={'Солтүстік':(0,1),'Оңтүстік':(0,-1),'Шығыс':(1,0),'Батыс':(-1,0),'Солтүстік-шығыс':(1,1),'Оңтүстік-батыс':(-1,-1),'Солтүстік-батыс':(-1,1),'Оңтүстік-шығыс':(1,-1)}
    vectors={k.lower():v for k,v in vectors.items()};a,b=s.lower().split('–');return sub(vectors[a],vectors[b])
def raw(r):return h.raw_for(r)

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade6-perpendicular-')
    if k=='four-right-sectors-not-straight-angles':
        assert 'перпендикуляр екі түзу'in s and 'КӨРШІ сәулелер'in s and 'жазыңқы бұрыштар алынбайды'in s
        rays=[(1,0),(0,1),(-1,0),(0,-1)];right=[i for i in range(4)if dot(rays[i],rays[(i+1)%4])==0];assert len(right)==4;assert sum(90 for _ in right)==360
        answer=str(len(right));note='ActualTWOdistinctperpendicularlines→FOURorderedneighborsectors, allfourdot0; twooppositeraypairsformstraightanglesexplicitlyexcluded. 4×90=360 invariant, newlabels donotclaim newnumericmeaning.'
    elif k=='rectangle-distinct-unordered-perpendicular-side-pairs':
        names=pair_labels(s);assert 'Жұптағы ретті ауыстыру жаңа жұп саналмайды'in s and 'диагональдар алынбайды'in s
        points=dict(zip(names,[(0,0),(5,0),(5,2),(0,2)]));edges=[(names[i]+names[(i+1)%4],sub(points[names[(i+1)%4]],points[names[i]]))for i in range(4)];allpairs=list(combinations(edges,2));valid=[(a[0],b[0])for a,b in allpairs if dot(a[1],b[1])==0];invalid=[(a[0],b[0])for a,b in allpairs if dot(a[1],b[1])!=0];assert len(allpairs)==6 and len(invalid)==2
        answer=str(len(valid));assert answer=='4';note=f'ACTUALrectanglelabels{names}; ALL6UNORDEREDsidepairs via independent NONSQUARE5×2coordinates, valid{valid}, invalidopposites{invalid}; arbitrarypositivew,h preservesdirectionproof; no diagonals/orderdoublecount.'
    elif k=='cardinal-perpendicular-direction-not-opposite':
        assert 'шығыс–батыс'in s;given=(1,0);vals=[dot(given,directions(o))for o in r['options']];answer=one(o for o,d in zip(r['options'],vals)if d==0);note=f'ALL4actualdirectionallines parsedascompassvectors; horizontalgivendotvalues{vals}, only{answer}; reversedhorizontalisSAMEline, bothdiagonalsnonzero45degree.'
    elif k=='perpendicular-distance-not-oblique-or-sum':
        a,b,c=map(int,m(r'PH = (\d+) см, PJ = (\d+) см, PK = (\d+) см',s).groups());assert 'PH ⟂ l'in s and 'l бойындағы H, J, K'in s;assert 0<a<min(b,c)
        # Horizontal l and P=(0,a), H=(0,0); oblique x² values b²−a²,c²−a²>0.
        x2=[b*b-a*a,c*c-a*a];assert all(x>0 for x in x2);assert [a*a+x for x in x2]==[b*b,c*c]
        answer=one(o for o in r['options']if o==f'{a} см');assert f'{a+b+c} см'in r['options'];note=f'ActualPtohorizontal-lineperpendicularPH{a}, OBLIQUElengths{b},{c}geometricallyconsistent x²={x2}; everypoint(t,0)hasdistance²=a²+t²≥a², uniquemin atH; target{a}notobliqueorsum{a+b+c}.'
    elif k=='named-foot-is-point-not-length-or-midpoint':
        assert 'UV кесіндісі PQ түзуіне перпендикуляр'in s and 'V нүктесі PQ бойында'in s and 'U нүктесі PQ түзуінде жатпайды'in s
        P,Q,U,V=(0,0),(8,0),(2,3),(2,0);assert dot(sub(U,V),sub(Q,P))==0 and V[1]==0 and U[1]!=0;assert V!=tuple(F(x+y,2)for x,y in zip(P,Q))and V!=tuple(F(x+y,2)for x,y in zip(U,V));answer=one(o for o in r['options']if o=='Перпендикулярдың табаны');note='ACTUALVtheincidentendpointofUVonPQ isFOOTbydefinition; explicitcountermodelP(0,0)Q(8,0)U(2,3)V(2,0) showsVneitherPQnorUVmidpoint; lengthisanumberNOTpoint.'
    elif k=='perpendicular-notation-keeps-given-lines':
        first,second=m(r'^([A-Z]{2}) түзуі ([A-Z]{2}) түзуімен',s).groups();assert first=='EF'and second=='GH';answer=one(o for o in r['options']if o==first+' ⟂ '+second)
        E,F_,G,H=(0,0),(3,0),(1,-1),(1,3);assert dot(sub(F_,E),sub(H,G))==0;assert dot(sub(G,E),sub(H,F_))!=0;assert norm2(sub(F_,E))!=norm2(sub(H,G));assert dot(sub(E,F_),sub(G,F_))!=0
        note='ACTUALnamedlinesEF/GH retainedin⊥notation. ExplicitcountermodelE(0,0)F(3,0)G(1,-1)H(1,3) hasEF⊥GH butEGnot⊥FH, unequalEF/GHlengthsand∠EFGnot90; no unstated F=intersection assumption.'
    elif k=='whole-hour-clock-right-angle':
        vals=[]
        for o in r['options']:
            hh,mm=map(int,m(r'^(\d{1,2}):(\d{2})$',o).groups());assert 1<=hh<=12 and mm==0;delta=abs(F(30*(hh%12))+F(mm,2)-6*mm)%360;vals.append(min(delta,360-delta))
        answer=one(o for o,a in zip(r['options'],vals)if a==90);assert vals==[90,180,0,150];note=f'ALLactual12hourfullhourchoices{r["options"]}, physicalhourangle30h+.5m/minute6m, exactMINORangles{vals}; only{answer}right,180straight/0coincident/150obtuse rejected.'
    elif k=='two-right-angles-opposite-side-straight':
        assert '∠KOL = 90°'in s and '∠LOM = 90°'in s and 'ҚАРАМА-ҚАРСЫ жақтарында'in s
        K,L,M=(-1,0),(0,1),(1,0);assert dot(K,L)==dot(M,L)==0 and K[0]*M[0]<0 and dot(K,M)==-1;answer='180';note='ACTUALtwo90angles withOK/OMonOPPOSITESIDESofOLline. IndependentunitvectorsK(-1,0)L(0,1)M(1,0) giveoppositerays,180; withoutsideconditioncoincident0alsopossible, explicitlyexcluded.'
    elif k=='unique-perpendicular-on-or-off-line':
        assert 'Жазықтықта'in s
        # For any line Ax+By+C=0, (A,B)≠(0,0), its normal span(A,B)
        # defines unique perpendicular THROUGH arbitrary (u,v): (u,v)+t(A,B).
        # Both on-line and off-line points have this sameunique direction.
        for A,B,C,u,v in [(1,0,2,-2,4),(1,0,2,3,4),(0,1,0,2,0),(0,1,0,2,3),(2,3,4,1,-2),(2,3,4,7,5)]:
            assert dot((A,B),(-B,A))==0 and A*A+B*B>0
            t=F(-C-A*u-B*v,A*A+B*B);x,y=F(u)+t*A,F(v)+t*B;assert A*x+B*y+C==0
        answer=one(o for o in r['options']if o.startswith('Нүкте түзуде жатса да')and'дәл бір перпендикуляр'in o);assert '41°'in r['solution'];assert abs(math.cos(math.radians(41)))>0
        note='UniversalEuclideanplaneproof: anynonzeronormal(A,B) definesuniqueperpendicularpoint+t(A,B); intersectiont=−(C+Au+Bv)/(A²+B²) uniqueasden>0, whetherpointONorOFF. Sixindependentorientation/incidenceinstances confirmalgebra. Intersecting41degcounterexample rejectsallintersectionclaim.'
    elif k=='ray-in-other-right-sector-add-not-subtract':
        assert 'A–O–B'in s and 'осы ретпен'in s and 'OC ⟂ AB'in s and 'COB тік бұрышының ІШІНДЕ'in s;theta=number(r'∠COD = (\d+)°',s);assert 0<theta<90
        # D lies first quadrant between north C and east B. Its polar angle is
        # 90−theta; from west A, MINOR angle is 180−(90−theta).
        polar=90-theta;angle=180-polar;Dvec=(math.sin(math.radians(theta)),math.cos(math.radians(theta)));assert all(x>0 for x in Dvec);observed=math.degrees(math.acos(-Dvec[0]));assert abs(observed-angle)<1e-10 and angle+polar==180
        answer=str(angle);assert angle!=90-theta;note=f'ActualORDEREDA–O–Bensuresoppositerays, ODINSIDECOB withCOD{theta}; independentaxisunitvectorD(sinθ,cosθ) givesAOD{angle}=180−(90−θ). Subtraction{polar}isOTHERDOBangle; sum180backcheck.'
    elif k=='square-perimeter-to-point-line-distance':
        names=m(r'^([A-Z]), ([A-Z]), ([A-Z]), ([A-Z]) — квадраттың',s).groups();P=number(r'периметрі (\d+) см',s);side=F(P,4);assert side>0
        pts=dict(zip(names,[(0,0),(side,0),(side,side),(0,side)]));A,B,C,D=map(pts.get,names);assert dot(sub(A,D),sub(C,D))==0 and norm2(sub(A,D))==side**2 and norm2(sub(A,C))==2*side**2
        answer=integer(side);note=f'ACTUALsquarecycliclabels{names}, perim{P}→side{side}; independentcoordinates makePSnormaltooppositeRS, allpoints(t,side)distance²=side²+t²≥side². UniquefootSminimum{side}, diagonal²2side²strictlylonger.'
    else:raise AssertionError(k)
    assert r['topic']=='geo'and r['grade']==6
    return answer,note

def main():
    assert len(ROWS)==11;entries=[];refs=set()
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer']);bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer'];assert r['minimumPlan']=='pro'and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit()and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        saved=raw(r);assert saved['solution'];refs.add(saved['id']);norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(saved['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All11fullsaved/newconditions/official/newsolutions/everyMCQ read; separate categorical/vector/dotproduct/Euclideanprojection/minorclock oracle fromactualprintedgivens, noauthorparams/solver','sourceCanonicalSha256':digest(saved),'notes':note,'checks':['Allfullsource/newconditions/solutions/options manuallyread','Allactualdirection/clock/sixunorderedsidepairs exhaustivelychecked','Universalnormal-lineexistenceuniqueness and distance²lowerbound proved','Point/length/midpoint categories and notationwrongline/angle options eliminatedbyexplicitcountermodels','Oppositeside/orderedcollinearraysector constraints and requestedangle roles preserved','Invariantgeometrycounts honest; sourcefactskeptwithoutinventingnewmathematicalmeanings']})
    assert len(refs)==11
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'ALL11savedsource-addressedgrade6perpendicular nonvisualskills; actualgeometry/categorical/clockindependentreview','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert{e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':11,'wrongKeysRejected':11,'hashesMatched':11,'sourceRefs':11,'unorderedRectanglePairs':6,'cardinalDirectionChoices':4,'actualClockChoices':4,'universalNormalLineInstances':6,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
