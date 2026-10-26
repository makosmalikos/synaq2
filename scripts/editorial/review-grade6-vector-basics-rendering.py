"""Independent all6 new / all9 saved grade6 chapter7.2 content review.
Actual printed scale roles/physical quantity types; three already signed native
editions checked by immutable content/figure hashes, not re-signed here.
No author model, specs, calculator or params are read.
"""
import importlib.util
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_util',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest','D','expr','decimal','integer','decimals']:globals()[name]=getattr(h,name)
ROOT=h.ROOT;PACK='problems/editorial/batches/grade6-vector-basics.json';OUT='problems/editorial/reviews/grade6-vector-basics.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def physicalkind(s):
    if'массасы'in s:return'mass'
    if'уақыт'in s or'Жолда'in s:return'time'
    if'температурасы'in s:return'temperature'
    if'ауданы'in s:return'area'
    if'жылдамдығы'in s:return'velocity'
    if'орын ауыстыру'in s:return'displacement'
    raise AssertionError(s)
def direction(s):return bool(re.search(r'солтүстікке|оңтүстікке|шығысқа|батысқа',s.lower()))
def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade6-vector-basics-');assert r['topic']=='geo'
    if k=='known-speed-per-centimetre-inverse-length':
        scale,speed=map(int,m(r'әр 1 сантиметрі (\d+) м/с-қа.+сан мәні (\d+) м/с',s).groups());length=F(speed,scale);answer=integer(length);assert length*scale==speed;assert scale==6 and speed==48;note=f'ACTUAL1cm↔{scale}m/s, physicalspeed{speed}m/s. TypedINVERSElength={speed}/{scale}={length}cm; back{length}cm×{scale}m/spercm={speed}m/s. Multiplicationwouldwrong288, notunit-roleequivalent.'
    elif k=='vector-quantity-among-scalars':
        kinds=[physicalkind(o)for o in r['options']];assert kinds==['mass','time','velocity','temperature'];flags=[kind in{'velocity','displacement'}and direction(o)for o,kind in zip(r['options'],kinds)];answer=one(o for o,ok in zip(r['options'],flags)if ok);assert '24 км/сағ'in answer and 'Солтүстікке'in answer;assert'-8 °C'in r['options'][3]and not direction(r['options'][3]);note=f'ALL4actualMCQphysicaltypes{kinds}, directedvectorflags{flags}. North24km/h specifiesBOTHmagnitudeanddirection; mass4kg,time3h,negative−8°Cscalars. SignoftemperatureisNOTspatialdirection.'
    elif k=='scalar-area-among-vectors':
        kinds=[physicalkind(o)for o in r['options']];assert kinds==['velocity','area','velocity','displacement'];flags=[kind in{'area','mass','time','temperature'}for kind in kinds];answer=one(o for o,ok in zip(r['options'],flags)if ok);assert D(m(r'(\d+,\d+) м²',answer)[1])==F(12,5);note=f'ALL4actualtypechoices{kinds}, scalarflags{flags}. PhysicalAREA12/5m²hasnonnegativeamountwithoutspaceorientation; windowfacingdirectionnotanarea-vector. Otherdrone/windvelocitiesanddisplacementarevectortypes.'
    elif k=='velocity-full-magnitude-and-direction':
        flags=[bool(re.search(r'\d+ км/сағ',o))and direction(o)for o in r['options']];assert flags==[False,False,False,True];answer=one(o for o,ok in zip(r['options'],flags)if ok);speed=number(r'(\d+) км/сағ',answer);assert speed==72 and 'Шығысқа'in answer;note=f'ALL4actualMCQs needBOTHspeedunitmagnitudeandcompassdirection,flags{flags}. East72km/hcomplete; bare72onlymodulus/eastonlydirection/3hourselapsedtimeeachinsufficient, notnegative-numbertest.'
    elif k=='infer-common-speed-scale-then-new-length':
        known,cells,target=map(int,m(r'(\d+) км/сағ жылдамдық (\d+) торкөз.+, (\d+) км/сағ',s).groups());percell=F(known,cells);length=F(target)/percell;answer=integer(length);assert percell*length==target and percell*cells==known;assert cells==4 and known==28 and target==49;note=f'ACTUALknown28km/h↔4cells FIRSTinfers7km/hpercell, THEN49/7=7cells; bothinversebackchecks exact. Direct49/4confusesknownTOTALcellcountwithunitvalue. Same7numericvaluescoincidental, typespreserved.'
    elif k=='scalar-definition-not-vector-or-segment':
        assert 'Бағыты болмайтын'in s and 'ФИЗИКАЛЫҚ ШАМАНЫҢ'in s;answer=one(o for o in r['options']if o=='Скаляр шама');assert set(r['options'])=={'Бағытталған кесінді','Скаляр шама','Векторлық шама','Бірлік кесінді'};note='ALLactualdefinitionchoices read. PHYSICALquantitywhoseamount/unitiscompletewithoutspaceorientation isSCALAR. DirectedsegmentisgeometricMODELofvector andunitsegmentismeasurementobject, neitherisquantityTYPE. Vectorneedsdirection.'
    else:raise AssertionError(k)
    return answer,note
def retained():
    wanted={'57bc2f66f4a5fe40','18ad8e9e68d4dba3','89be0e1d8596b212'};batch=json.loads((ROOT/'problems/editorial/batches/visual-wave12-vectors.json').read_text());report=json.loads((ROOT/'problems/editorial/reviews/visual-wave12-vectors.json').read_text());out=[]
    for r in batch['editions']:
        if any(ref['sourceId']in wanted for ref in r['sourceRefs']):
            entry=one(e for e in report['entries']if e['editionId']==r['editionId']);assert entry['verdict']=='verified'and entry['sha256']==digest(r);assert entry['figureReview']['status']=='verified'and entry['figureReview']['sha256']==r['figureSha256'];raw=h.raw_for(r);assert raw['solution'];out.append({'editionId':r['editionId'],'sourceId':raw['id'],'sha256':digest(r),'priorReview':'problems/editorial/reviews/visual-wave12-vectors.json','status':'retained_previously_verified_not_resigned'})
    assert {r['sourceId']for r in out}==wanted;return out
def main():
    assert len(ROWS)==6;entries=[];refs=set()
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer']);bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer'];assert r['grade']==6 and r['minimumPlan']=='pro'and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit()and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=h.raw_for(r);assert raw['solution'];refs.add(raw['id']);norm=lambda x:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',x).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'ALL9saved/all6new fullconditions/official/newsolutions/everyMCQread; ownACTUALPRINTED typedscaleinverse/backsub andphysicalquantitydefinitions/fullvectororientation oracle; noauthorsolver/spec/params','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['All9fullsavedsourceconditions/officialsolutions/MCQs read incl3retained','All6newfullconditions/solutions/everychoice read','Knownunit-scaleinverse vsinferredunit-scaleTHENnewlength rolesexact','VectorBOTHmagnitude/direction; physicalscalarnegative-temperature/areaversussegment-model distinguished','3previouslyverifiednativeeditions retained bypriorcontent/figureSHA andNOTre-signed','GRADE6chapter7.2 notGRADE7']})
    retainedRows=retained();assert len(refs)==6 and len(refs|{r['sourceId']for r in retainedRows})==9
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])for(const n of mathFragments(s))if(n.type!=='text'||/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(s);console.log(JSON.stringify(rs.map(editionHash)));"
    hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'All9savedgrade6chapter7.2nonvisual=6newverified+3previouslyverifiedretained','retained':retainedRows,'entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert{e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries};assert signed['retained']==retainedRows
    print(json.dumps({'independentlyVerifiedNew':6,'wrongKeysRejected':6,'hashesMatched':6,'newSourceRefs':6,'previouslyVerifiedRetained':len(retainedRows),'allSavedScope':9,'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
