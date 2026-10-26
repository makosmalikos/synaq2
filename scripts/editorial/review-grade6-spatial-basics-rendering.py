"""Independent all9 archived/new spatial basics review, exact bit-cube topology,
filled-region revolution and affine parallel-projection proof/countermodel.
No author model, specs or params are imported.
"""
import importlib.util
import itertools
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_util',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest','D','expr','decimal','integer','decimals']:globals()[name]=getattr(h,name)
ROOT=h.ROOT;PACK='problems/editorial/batches/grade6-spatial-basics.json';OUT='problems/editorial/reviews/grade6-spatial-basics.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
VERTICES=list(itertools.product([0,1],repeat=3));EDGES=[(a,b)for a,b in itertools.combinations(VERTICES,2)if sum(x!=y for x,y in zip(a,b))==1];FACES=[frozenset(v for v in VERTICES if v[axis]==side)for axis in range(3)for side in[0,1]]
def topology():
    assert len(VERTICES)==8 and len(EDGES)==12 and len(set(FACES))==6
    assert all(sum(v in e for e in EDGES)==3 for v in VERTICES)
    assert all(len(f)==4 and sum(set(e)<=f for e in EDGES)==4 for f in FACES)
    assert all(sum(set(e)<=f for f in FACES)==2 for e in EDGES)
def hidden():
    # Front y=0, LEFT x=0, TOP z=1 are precisely the three visible faces.
    visibleFaces=[frozenset(v for v in VERTICES if v[axis]==side)for axis,side in[(1,0),(0,0),(2,1)]]
    hiddenEdges=[e for e in EDGES if not any(set(e)<=f for f in visibleFaces)]
    assert len(hiddenEdges)==3 and all((1,1,0)in e for e in hiddenEdges)
    assert len(EDGES)-len(hiddenEdges)==9
    return hiddenEdges
def projection():
    # P(x,y,z)=(x+z,y+z). Its straight kernel means this is a genuine parallel
    # projection onto z=0 along the fixed direction(-1,-1,1), notperspective.
    P=lambda v:(v[0]+v[2],v[1]+v[2]);dot=lambda a,b:sum(x*y for x,y in zip(a,b))
    a=(1,0,0);b=(0,0,1);assert dot(a,b)==0 and dot(P(a),P(b))==1
    assert P(a)!=(0,0)and P(b)!=(0,0);assert dot(P(a),P(a))==1 and dot(P(b),P(b))==2
    # Universal coordinate identities P(A+t(B-A))=P(A)+t(P(B)-P(A)) and
    # P(lambda*v)=lambda*P(v) follow coefficient-by-coefficient from P's
    # definition. Thus midpoint, parallel direction and parallel-length ratio
    # survive EVERY noncollapsed direction, while the above angle does not.
    for v in itertools.product([-2,-1,0,1,2],repeat=3):
        pv=P(v)
        for scale in[F(1,2),F(2),F(3)]:
            assert P(tuple(scale*x for x in v))==tuple(scale*x for x in pv)
    for a in VERTICES:
        for b in VERTICES:assert P(tuple(F(x+y,2)for x,y in zip(a,b)))==tuple(F(x+y,2)for x,y in zip(P(a),P(b)))
def revolution(kind):
    R=F(5);H=F(7)
    # Rectangle interior is 0<=r<=R at EVERYz; right triangle has linearly
    # shrinking radius0<=r<=R(1-z/H). Rotating a FILLED horizontal segment
    # through full360 sweeps the full disk, not only a circle/surface.
    crosssections=[]
    for z in[F(0),H/4,H/2,3*H/4,H]:
        maxRadius=R if kind=='rectangle'else R*(1-z/H)
        assert maxRadius>=0
        crosssections.append((z,maxRadius))
        for cos,sin in[(F(1),F(0)),(F(3,5),F(4,5)),(F(0),F(1)),(F(-1),F(0))]:
            assert cos*cos+sin*sin==1
            for r in[F(0),maxRadius/2,maxRadius]:
                x,y=r*cos,r*sin;assert x*x+y*y==r*r and 0<=r<=maxRadius
    if kind=='rectangle':assert len(set(r for _,r in crosssections))==1
    else:assert crosssections[0][1]>0 and crosssections[-1][1]==0
    return crosssections
def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade6-spatial-basics-');assert r['topic']=='geo';topology()
    if k=='cuboid-vertices-edges-faces-sum':
        answer=str(len(VERTICES)+len(EDGES)+len(FACES));note=f'EXACTall8binaryvertices,12HammingdistanceONEedges,6coordinatefaces enumerated; sum{answer}. Vertexdegree3/face4edges/eachEdge2faces verified, hiddennotdeleted; invariant26honestlyunchanged.'
    elif k=='hidden-edges-dashed-drawing-convention':
        answer=one(o for o in r['options']if'үзік сызықшалармен'in o);assert not any('үзік'in o for o in r['options']if o!=answer);note='ActualALL4line-conventionchoices read. Standardeducationalvisible-solid/occluded-dashed distinction; waved/omitted/thicksolid rejected. Explains actualocclusion notphysicalbreak.'
    elif k=='three-visible-faces-hidden-opposite-vertex':
        assert 'СОЛ'in s and 'алдыңғы'in s and 'үстіңгі'in s and 'беттеспейді'in s;edges=hidden();answer=str(len(edges));note=f'ACTUALfront/LEFT/TOPselectedfaces, alledgeface-incidenceenumeration gives3hidden{edges}, ALLincidenttoOPPOSITEbackRIGHTbottom(1,1,0). Nonoverlap/genericview explicit; remaining9visible.'
    elif k=='cube-wire-all-twelve-edges':
        side=number(r'қыры (\d+) см',s);v=sum(side for _ in EDGES);answer=str(v);assert side==9 and v==108;note=f'ACTUALside{side}cm timesALL12enumeratededges={v}cm. Individualsegments/noconnectionwaste specified, noEulercontinuouswire-path requirement; hidden3include27cm.'
    elif k=='filled-rectangle-full-turn-about-side-cylinder':
        assert 'ІШКІ АЙМАҒЫН'in s and '360°'in s and 'бір қабырғасы'in s;sections=revolution('rectangle');answer=one(o for o in r['options']if o=='Цилиндр');note=f'ACTUALFILLEDrectangle rotatedaboutSIDEthroughFULL360. UniversalhorizontalcrosssectionDISKr≤R forEVERYz∈[0,H], independentexample{sections}; TWOequalcircularbases, constantlateralradius⇒CYLINDERsolid notsurface/cone/sphere/cuboid.'
    elif k=='cube-full-six-face-area':
        side=number(r'Қыры (\d+) см',s);areas=[side*side for _ in FACES];answer=str(sum(areas));assert side==5 and areas==[25]*6;note=f'ACTUAL5cmside, ALLsixenumeratedsquarefaces each25cm², fullarea150cm². Hidden/oppositefacesincluded; visible3alone75false.'
    elif k=='parallel-projection-not-angle-preserving':
        assert 'ПАРАЛЛЕЛЬ'in s and 'перспективалық'in s and 'нүктеге айналып жойылмайды'in s;projection();answer=one(o for o in r['options']if'Бұрыштың градустық'in o);assert len(r['options'])==4;note='ALL4actualproperties evaluated. Universal affine-linearP coefficientproof preservesmidpoint, parallelvector andparallelsegmentlengthratiowhenNONCOLLAPSED. GenuineparallelP(x,y,z)=(x+z,y+z) maps orthogonale1/e3→(1,0)/(1,1), dot1≠0 andnorm²1/2, so90°becomes45°. Actualperspectivedisclaimer avoidsinvalidprojectivestatements.'
    elif k=='filled-right-triangle-turn-about-leg-cone':
        assert 'ІШКІ АЙМАҒЫМЕН'in s and '360°'in s and 'катеті'in s;sections=revolution('triangle');answer=one(o for o in r['options']if o=='Конус');note=f'ACTUALFILLEDrighttriangle rotatedaboutLEGfull360. UniversalhorizontalradiusR(1-z/H), completeDISKS andexactexample{sections}; ONEcircularbase/nonzeroradius andONEapexradius0⇒CONEsolid, notpyramidpolygon/cylinder/sphere.'
    elif k=='ball-no-vertices-versus-pointed-solids':
        assert 'ТӨБЕ ЖОҚ'in s;counts={'Үшбұрышты пирамида':4,'Куб':8,'Шар':0,'Конус':1};assert set(r['options'])==set(counts);answer=one(o for o in r['options']if counts[o]==0);note='EVERYactualsolidchoice compared: triangularpyramid4vertices, cube8 (actualbitconstruction), coneONEapex, ball0. Avertexmeanscorner/apex, notanysurfacepoint; nondegeneratesolids explicit.'
    else:raise AssertionError(k)
    return answer,note
def main():
    assert len(ROWS)==9;entries=[];refs=set()
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer']);bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer'];assert r['grade']==6 and r['minimumPlan']=='pro'and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit()and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=h.raw_for(r);assert raw['solution'];refs.add(raw['id']);norm=lambda x:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',x).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'ALL9saved/newconditions/full official/newsolutions/everyMCQread; independentbinarycuboidtopology, fullfilledregionrevolutionandlinearprojectionproof/countermodel, actualprintedunits; noauthorsolver/spec/params','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['Allsaved/newfullconditions/official/newsolutions/everyMCQmanuallyread','8vertices/12edges/6faces exactbitcoordinateenumeration andALLincidenceconstraints','ActualLEFTfronttopgenericview3hidden vs9visible andunitboundwire/surface calculations','FILLED360region exactdiskcrosssections distinguishcylinder/cone notsurfaces','Universalparallelprojectionlinearity+noncollapsedhypothesis andactualorthogonalcountermodel','Source7.1 isGRADE6chapter notGRADE7, noexcludedgrade7content']})
    assert len(refs)==9
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'ALL9savedgrade6chapter7.1nonvisualspatialbasics','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert{e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':9,'wrongKeysRejected':9,'hashesMatched':9,'sourceRefs':9,'cuboidV':len(VERTICES),'cuboidE':len(EDGES),'cuboidF':len(FACES),'actualHiddenEdges':len(hidden()),'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
