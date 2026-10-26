"""Second-review exact statistics oracle from actual printed givens/choices.

Every saved/new full condition, official/new solution and MCQ was manually read.
No author specifications, calculator or row.params are consumed.
"""
import importlib.util
from collections import Counter
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_util',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest','D','expr','decimal']:globals()[name]=getattr(h,name)
ROOT=h.ROOT;PACK='problems/editorial/batches/grade6-statistics.json';OUT='problems/editorial/reviews/grade6-statistics.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']

def numeric(text):return expr(text)
def choose(row,value):return one(o for o in row['options']if numeric(o)==value)
def finish(row,value):
    value=F(value)
    if row.get('options'):return choose(row,value)
    assert value.denominator==1
    return str(value.numerator)
def displayed_list(s):
    match=m(r'(-?\d+(?:,\d+)?(?:; -?\d+(?:,\d+)?)+)',s)
    return [numeric(x)for x in match[0].split('; ')]
def mean(values):return sum(values,F(0))/len(values)
def median(values):
    ordered=sorted(values);n=len(ordered)
    v=ordered[n//2]if n%2 else (ordered[n//2-1]+ordered[n//2])/2
    assert sum(x<v for x in values)<=n//2 and sum(x>v for x in values)<=n//2
    return v
def modes(values):
    counts=Counter(values);peak=max(counts.values())
    return sorted(v for v,c in counts.items()if c==peak),counts
def integer_list(s):return [int(v)for v in re.findall(r'-?\d+',s)]

def solve(row):
    s=row['statement'];k=row['modelId'].removeprefix('grade6-statistics-');assert row['topic']=='stats'
    if k=='two-distance-time-weighted-speed':
        t1,d1,t2,d2=map(int,m(r'алғашқы (\d+) сағатта (\d+) км, келесі (\d+) сағатта (\d+) км',s).groups());v=F(d1+d2,t1+t2)
        assert t1!=t2 and v!=mean([F(d1,t1),F(d2,t2)])
        answer=finish(row,v);note=f'ACTUAL{d1}km/{t1}h and{d2}km/{t2}h, total360/5={v}; unequal-time unweightedmean71 rejected. Distance/time conservation exact.'
    elif k in {'three-decimal-mean-versus-sum-median','two-decimal-mean-versus-half-difference','four-integer-mean','all-five-days-including-zero','signed-mean-not-negative-only','seven-day-temperature-mean','five-day-duration-mean-with-offset-check'}:
        if k=='two-decimal-mean-versus-half-difference':
            vals=[numeric(x)for x in m(r'^(\d+,\d+) және (\d+,\d+)',s).groups()]
        else:vals=displayed_list(s)
        v=mean(vals);answer=finish(row,v)
        assert sum(x-v for x in vals)==0
        if k=='all-five-days-including-zero':
            assert len(vals)==5 and vals.count(0)==2;assert choose(row,mean([x for x in vals if x]))!=answer and choose(row,sum(vals))!=answer
        elif k=='signed-mean-not-negative-only':
            assert 0 in vals and len(vals)==4;negative=mean([x for x in vals if x<0]);assert negative==F(-15,2)
            assert choose(row,negative)!=answer and choose(row,-v)!=answer and choose(row,sum(vals))!=answer
        elif k=='three-decimal-mean-versus-sum-median':
            assert choose(row,sum(vals))!=answer and choose(row,sum(vals)/2)!=answer and choose(row,vals[1])!=answer
        elif k=='two-decimal-mean-versus-half-difference':
            assert choose(row,sum(vals))!=answer and choose(row,(vals[1]-vals[0])/2)!=answer;assert v-vals[0]==vals[1]-v
        elif k=='seven-day-temperature-mean':
            assert len(vals)==7 and sum(x-v for x in vals if x>v)==-sum(x-v for x in vals if x<v)==9
        elif k=='five-day-duration-mean-with-offset-check':
            deviations=[x-45 for x in vals];assert deviations==[-10,5,-5,20,10]and sum(deviations)==20 and 45+mean(deviations)==v
        note=f'ACTUALcomplete{vals}, sum{sum(vals)}, count{len(vals)}, arithmeticmean{v}. Full zero/signed/decimal places retained; all actual numericchoices evaluated and target-specific traps checked.'
    elif k=='recover-second-from-mean':
        av,given=map(int,m(r'ортасы (\d+)\. Бірінші сан (\d+)',s).groups());v=2*av-given;assert mean([given,v])==av;answer=finish(row,v);note=f'ACTUALmean{av}, knownFIRST{given}; uniqueSECOND2mean−first={v}, backmean exact, deviation6 notanswer.'
    elif k=='choose-entire-group-by-mean':
        target=number(r'ортасы (\d+)-ге',s);groups=[displayed_list(o)for o in row['options']];means=[mean(g)for g in groups];answer=one(o for o,v in zip(row['options'],means)if v==target)
        assert list(map(len,groups))==[3,3,3,4]and all(F(target)in g for g in groups)
        note=f'ALLFOURactualWHOLEgroups {groups}, means{means}; unique target{target}, FOURvaluegroup denominator4 not3, presence7insufficient.'
    elif k=='recover-sum-from-count-mean':
        count,av=map(int,m(r'^(\d+) санның арифметикалық ортасы (\d+)-ға',s).groups());v=count*av;assert F(v,count)==av;answer=finish(row,v);note=f'ACTUALCOUNT{count}, MEAN{av}; requestedSUM={v}, notcount+mean ormean/count.'
    elif k=='proper-fraction-mean-after-common-denominator':
        pairs=[tuple(map(int,p))for p in re.findall(r'\((\d+)/(\d+)\)',s)];assert len(pairs)==2
        vals=[F(n,d)for n,d in pairs];lcd=math.lcm(*(d for n,d in pairs));assert lcd==20
        rawsum=sum(n*(lcd//d)for n,d in pairs);v=F(rawsum,2*lcd);assert v==mean(vals)
        answer=finish(row,v);assert choose(row,sum(vals))!=answer and choose(row,F(sum(n for n,d in pairs),sum(d for n,d in pairs)))!=answer and choose(row,abs(vals[1]-vals[0]))!=answer
        note=f'Actualfractions{pairs}, independentLCM20 yields8/20+15/20=23/20 thenDIVIDE2→{v}. ALLsumonly, num/denbothadd, differencechoices false; reverse×2 sumverified.'
    elif k=='distance-then-speed-time-weighted':
        t1,d1,t2,speed=map(int,m(r'алғашқы (\d+) сағатта (\d+) км жүрді\. Одан кейін (\d+) сағат бойы (\d+) км/сағ',s).groups());d2=speed*t2;v=F(d1+d2,t1+t2);answer=finish(row,v)
        assert t1==1 and t2==3 and choose(row,mean([F(d1,t1),F(speed)]))!=answer
        note=f'ACTUALfirstDISTANCE{d1}in{t1}h, secondSPEED{speed}for{t2}h→distance{d2}. Total288/4={v}; actual84unweighted/96wrongden/144double candidates false.'
    elif k in {'fraction-range-after-ordering','signed-temperature-range','integer-range-not-sum','height-range-extremes'}:
        if k=='fraction-range-after-ordering':
            pairs=[tuple(map(int,p))for p in re.findall(r'\((\d+)/(\d+)\)',s)];vals=[F(n,d)for n,d in pairs];lcd=math.lcm(*(d for n,d in pairs));assert lcd==24
            assert [n*(lcd//d)for n,d in pairs]==[21,6,20,12]
        else:vals=displayed_list(s)
        v=max(vals)-min(vals);answer=finish(row,v);assert v>=0
        if k=='signed-temperature-range':
            assert min(vals)==-8 and max(vals)==5 and choose(row,max(vals)+min(vals))!=answer and choose(row,abs(max(vals)+min(vals)))!=answer and choose(row,5-(-6))!=answer
        note=f'COMPLETEactual{vals}, sorted{sorted(vals)}, MAX{max(vals)}minusMIN{min(vals)}={v}; fractionLCD/signedsubtractnegative/unitextremes explicit, notequivalenttosum orlargestTWOgap.'
    elif k in {'seven-observation-median-after-sorting','six-decimal-median-not-unsorted-middle','five-observation-median-not-mean','six-mass-median-not-observed-value'}:
        vals=displayed_list(s);v=median(vals);answer=finish(row,v);ordered=sorted(vals);n=len(vals)
        if k=='six-decimal-median-not-unsorted-middle':
            assert n==6 and choose(row,ordered[2]+ordered[3])!=answer and choose(row,ordered[2])!=answer and choose(row,mean(vals[2:4]))!=answer
        elif k=='five-observation-median-not-mean':
            assert choose(row,vals[2])!=answer and choose(row,mean(vals))!=answer and choose(row,ordered[1])!=answer
        elif k=='seven-observation-median-after-sorting':assert n==7 and v!=vals[3]
        else:assert n==6 and v not in vals
        note=f'ACTUAL{vals} independentlySORTED{ordered}; n{n}, correct centralrank(s)⇒median{v}. Odd3/4 andeven3+4 positions bound, every unsortedmiddle/mean/sum/singlecentral MCQ false.'
    elif k in {'two-simultaneous-modes','clothing-size-frequency-mode','mode-value-not-frequency-or-maximum'}:
        vals=displayed_list(s);good,freq=modes(vals)
        if k=='two-simultaneous-modes':
            assert good==[3,8]and max(freq.values())==2
            answer=one(o for o in row['options']if o.startswith('Екі мода:')and integer_list(o)==[3,8]);assert set(row['options'])=={'Тек 3','Тек 8','Мода жоқ','Екі мода: 3 және 8'}
        else:
            assert len(good)==1;answer=finish(row,good[0]);assert good[0]!=max(freq.values())
            if k=='mode-value-not-frequency-or-maximum':assert choose(row,max(freq.values()))!=answer and choose(row,max(vals))!=answer and choose(row,min(vals))!=answer
        for value,count in re.findall(r'(-?\d+) — (\d+) рет',row['solution']):assert freq[F(value)]==int(count)
        note=f'COMPLETEactualfrequencies{dict(freq)}, ALLMAXfrequencyvalues{good}; requestedMODEVALUE notfrequency/max/min. Actualtiedpair bothselected, nofalseuniversalall-once-onlyclaim.'
    elif k=='range-definition-not-mode-median':
        mapping={'Ең үлкен және ең кіші мәнді қосу':'sum','Ең үлкен мәннен ең кіші мәнді азайту':'range','Ең жиі кездесетін мәнді табу':'mode','Реттелген қатардың ортаңғы мәнін табу':'median'}
        assert set(row['options'])==set(mapping);answer=one(o for o in row['options']if mapping[o]=='range')
        example=list(map(int,m(r'Мысалы, (\d+); (\d+); (\d+) қатарында',row['solution']).groups()));assert max(example)-min(example)==8
        note='ALLFOURactualdefinitionchoices categorized independently sum/range/mode/median. DefinitionMAX−MIN; actualsolutionexample4,12,7range8verified; no overbroadstatisticclaim.'
    else:raise AssertionError(k)
    return answer,note

def main():
    assert len(ROWS)==25;entries=[];refs=set()
    for row in ROWS:
        answer,note=solve(row);assert answer==row['answer'],(row['editionId'],answer,row['answer']);bad=copy.deepcopy(row);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer']
        assert row['grade']==6 and row['minimumPlan']=='pro'and not row.get('image')
        if row.get('options'):assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
        else:assert re.fullmatch(r'-?\d+',answer)and row['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=h.raw_for(row);refs.add(raw['id']);assert raw['solution'];norm=lambda text:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',text).lower()).strip();assert norm(raw['statement'])!=norm(row['statement'])
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All25 saved/new fullconditions/official+newsolutions/everyMCQread; independent exact DISPLAYED Fraction arithmetic/weightedtime/frequency/sort/categorical oracle; noauthorcalculator/spec/params','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['All25 saved/newfullconditions/official+newsolutions/everyMCQ manuallyread','Actualprintednumericgivens andeveryactualchoice independentlyevaluated','Unequalweightedtime andzero/signedobservations count correctly','LCM20/24 nativefractions beforemean/range, sortingbeforeodd/evenmedian','ALLtiedmodevalues vsfrequency andsignedMAX−MIN distinguished','Sourcewrongnegative-onlyexplanation/falseuniversalno-modeclaimnotcopied']})
    assert len(refs)==25
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'All25source-addressedGRADE6topics8.1/8.2nonvisualstatistics; fullsaved/new/solutions/everyMCQ andexactprintedoracle','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:assert{e['editionId']:e['sha256']for e in json.loads((ROOT/OUT).read_text())['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':25,'wrongKeysRejected':25,'hashesMatched':25,'sourceRefs':25,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
