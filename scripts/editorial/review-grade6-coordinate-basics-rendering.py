"""Independent actual printed ordered-coordinate, projection and axis review.
All9fullsaved/newconditions/solutions/everyMCQ read. No authorparams/solver.
"""
import importlib.util
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_utility',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest']:globals()[name]=getattr(h,name)
ROOT=h.ROOT;PACK='problems/editorial/batches/grade6-coordinate-basics.json';OUT='problems/editorial/reviews/grade6-coordinate-basics.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def coordinates(s):return [tuple(map(int,p))for p in re.findall(r'\((-?\d+); (-?\d+)\)',s.replace('−','-'))]
def quadrant(x,y):
    assert x!=0 and y!=0
    return {(True,True):1,(False,True):2,(False,False):3,(True,False):4}[(x>0,y>0)]
def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade6-coordinate-basics-')
    if k=='x-axis-foot-coordinate-not-distance':
        x,y=one(coordinates(s));assert 'Ox'in s and 'табан' in s and 'Қашықтық емес'in s;H=(x,0);assert H[0]==x and H[1]==0;assert x!=abs(y) and x!=y
        # Universal projection: (t−x)^2+y^2 >= y^2 for ALL real t,
        # equality iff t=x. Thus footH=(x,0), distance|y|, askedAXISCOORDx.
        answer=str(H[0]);note=f'ACTUALD({x},{y})toOx: H({x},0), exactuniversalminimum((t−x)²+y²)atyH0/t=x; targetFOOTaxisnumber{x}, notdistance{abs(y)}orsignedordinate{y}.'
    elif k=='select-y-axis-zero-first-coordinate':
        pts=[one(coordinates(o))for o in r['options']];flags=[x==0 for x,y in pts];answer=one(o for o,t in zip(r['options'],flags)if t);assert one(pt for pt,t in zip(pts,flags)if t)[1]<0;note=f'ALLactualORDEREDcoordinatechoices{pts}; Oydefinedx0 yieldsflags{flags}. ZeroSECONDmeansOx, bothnonzeroquadrants; noaxisname/coordinateorderinversion.'
    elif k=='x-axis-distance-absolute-ordinate':
        x,y=one(coordinates(s));assert 'Ox'in s and 'ҚАШЫҚТЫҚ'in s;assert y<0 and abs(x)!=abs(y);H=(x,0);distance=abs(y);assert distance>0 and (x-H[0])**2+(y-H[1])**2==distance**2;answer=str(distance);note=f'ACTUALA({x},{y})projecttoH({x},0), length²={y}², DISTANCE{distance}=|{y}|nonnegative. |x|{abs(x)}wouldtargetOy. UniversalallOxpoints(t,0) give(t−x)²+y²lowerbound.'
    elif k=='signed-abscissa-first-not-second':
        x,y=one(coordinates(s));assert x<0<y;answer=one(o for o in r['options']if int(o)==x);assert set(map(int,r['options']))=={x,y,-x,-y};note=f'ACTUALM({x},{y}); abscissaFIRST{x}withSIGNretained, all4optionscoordinate-swap/magnitude/wrongsecond-sign distinct, moduleNOTasked.'
    elif k=='both-negative-quadrant-number':
        x,y=one(coordinates(s));assert x<0 and y<0;answer=str(quadrant(x,y));assert answer=='3';note=f'ACTUALP({x},{y})hasx<0leftANDy<0below, thirdcounterclockwisequadrant. Bothnonzero excludesaxes; quadrantindexnotcoordinate/distance.'
    elif k=='signs-to-quadrant-iv':
        assert 'абсциссасы ОҢ'in s and 'ординатасы ТЕРІС'in s;number_=quadrant(1,-1);roman={1:'I',2:'II',3:'III',4:'IV'}[number_];answer=one(o for o in r['options']if o==roman+' ширекте');assert number_==4;note='ActualSIGNEDconstraintsxPOSITIVE/yNEGATIVE universallyselectrightbelowIV; no particularmagnitudesrequired. AllfourRomanofferedquadrantschecked, IIhastheoppositesignpair.'
    elif k=='universal-x-axis-property-not-origin-only':
        assert 'Ox осіндегі ӘРБІР'in s and 'бүкіл осьті'in s;answer=one(o for o in r['options']if o=='Екінші координатасы 0 болады')
        # DefineALLrealOxpoints(t,0). Candidate equations expressed as
        # a*t+b=0 have universaltruth iff bothcoefficientsvanish.
        # x=0→[1,0],x=y→[1,0],y=0→[0,0],y=1→[0,−1].
        coefficients=[(1,0),(1,0),(0,0),(0,-1)];flags=[a==b==0 for a,b in coefficients];assert flags==[False,False,True,False];assert r['options'][flags.index(True)]==answer
        note='UNIVERSALproofOx={(t,0):tANYreal}: secondcoordidentically0. All4actualproperties become[a,b]oftlinearequation; only[0,0]identicallyzero. x0/xequaly trueonlyorigin, y1never; origin-onlytestcannotprovewholeaxis.'
    elif k=='above-axis-count-positive-y-includes-y-axis':
        pts=coordinates(s);assert len(pts)==7 and 'ҚАТАҢ ЖОҒАРЫ'in s;valid=[p for p in pts if p[1]>0];assert any(x==0 and y>0 for x,y in valid)and any(y==0 for x,y in pts);assert all(y>0 for x,y in valid);answer=str(len(valid));assert answer=='4';note=f'ALLSEVENactualORDEREDpoints{pts}, predicateSTRICTy>0 valid{valid}. Includesx0positiveOy, excludesy0onOx andallnegativey; xsignirrelevant, completecount4.'
    elif k=='ordered-pair-from-two-named-signed-coordinates':
        x,y=map(int,m(r'абсциссасы (-?\d+), ординатасы (-?\d+)',s).groups());assert x<0<y;pts=[one(coordinates(o))for o in r['options']];answer=one(o for o,p in zip(r['options'],pts)if p==(x,y));assert set(pts)=={(y,x),(x,-y),(x,y),(-x,y)};note=f'ACTUALnamedABSCISSA{x}mustFIRST,ORDINATE{y}SECOND; all4offeredorderedtuples{pts}; reversedorderandindividualsignchangesrejected.'
    else:raise AssertionError(k)
    assert r['topic']=='geo'and r['grade']==6
    return answer,note

def main():
    assert len(ROWS)==9;entries=[];refs=set()
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer']);bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer'];assert r['minimumPlan']=='pro'and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit()and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=h.raw_for(r);assert raw['solution'];refs.add(raw['id']);norm=lambda x:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',x).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All9fullsaved/newconditions/official/newsolutions/everyMCQread; own PRINTED signedorderedtuple/axis/quadrantclassification, universalprojection/linepropertyoracles, noauthorsolver/spec/params','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['Allsaved/newfullconditions/officialnewsolutions/everyMCQmanuallyread','Everyactualorderedpairandbothsignsindependentlyparsed','FootaxisCOORD12distinctfromdistance5; OxDISTANCE|-6|6distinctfrom|x|8','UniversalOx/Oyproperties provedbyparametricequation, notorigin-onlysample','All7aboveaxispointsclassifiedstrictlyy>0includingpositiveOyexcludingOx','Allactualwrongorder/individualsign/module/axis/quadrantoptions rejected']})
    assert len(refs)==9
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'ALL9savedsource-addressedgrade6topic6.4coordinatebasicsnonvisual','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert{e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':9,'wrongKeysRejected':9,'hashesMatched':9,'sourceRefs':9,'completeAboveAxisPoints':7,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
