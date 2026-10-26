"""Independent actual-printed exhaustive digit/role/product/segment review13.
No author calculator/specifications or row.params are consumed.
"""
import importlib.util
import itertools
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_util',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest']:globals()[name]=getattr(h,name)
ROOT=h.ROOT;PACK='problems/editorial/batches/grade6-enumeration.json';OUT='problems/editorial/reviews/grade6-enumeration.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']

def nums(text):return list(map(int,re.findall(r'\d+',text)))
def decimal_roster(text):return list(map(int,text.split('; ')))
def count_answer(row,n):return one(o for o in row['options']if int(o)==n)if row.get('options')else str(n)
def solve(row):
    s=row['statement'];k=row['modelId'].removeprefix('grade6-enumeration-');assert row['topic']=='comb';digitwitnesses=0
    if k in {'nonzero-digit-no-repeat-count','two-digit-repeat-complete-roster','even-ending-no-repeat-count','three-digit-alphabet-repetition-count','zero-excluded-from-tens-no-repeat'}:
        alphabet=nums(s.split('цифр')[0]);assert len(alphabet)==len(set(alphabet))and all(0<=v<10 for v in alphabet)
        repeat=k in {'two-digit-repeat-complete-roster','three-digit-alphabet-repetition-count'};even=k=='even-ending-no-repeat-count'
        # ALL90actualtwo-digitnumbers, independent of productformula; noleading0
        # ever enters the domain, but trailing0does and must stay when allowed.
        good=[n for n in range(10,100)if n//10 in alphabet and n%10 in alphabet and(repeat or n//10!=n%10)and(not even or n%2==0)]
        if k=='two-digit-repeat-complete-roster':
            lists=[decimal_roster(o)for o in row['options']];answer=one(o for o,ls in zip(row['options'],lists)if len(ls)==len(set(ls))and set(ls)==set(good));assert list(map(len,lists))==[4,2,3,3]
        else:answer=count_answer(row,len(good))
        if k=='nonzero-digit-no-repeat-count':
            written=decimal_roster(m(r'Толық тізім: (.+?)\.',row['solution'])[1]);assert written==good
        elif k=='three-digit-alphabet-repetition-count':
            written=decimal_roster(m(r'бірліктер ретінде келеді: (.+?)\.',row['solution'])[1]);assert written==good and sum(n//10==n%10 for n in good)==3
        elif k=='zero-excluded-from-tens-no-repeat':
            written=decimal_roster(m(r'Толық тізім (.+?), саны',row['solution'])[1]);assert written==good and sum(n%10==0 for n in good)==2
        elif even:
            blocks=re.findall(r'(\d+) цифрымен аяқталатындар ([\d; ]+?)(?=; \d+ цифрымен|\.)',row['solution']);written=[]
            assert len(blocks)==len([d for d in alphabet if d%2==0])==3
            for final,roster in blocks:
                vals=decimal_roster(roster.strip().rstrip(';'));assert all(v%10==int(final)for v in vals);written+=vals
            assert len(written)==len(set(written))==len(good)and set(written)==set(good)
            assert[sum(n%10==d for n in good)for d in alphabet if d%2==0]==[4,4,4]
            assert count_answer(row,len(alphabet)*3)!=answer and count_answer(row,len(alphabet)*(len(alphabet)-1))!=answer
        digitwitnesses=len(good);note=f'ALL90actual10…99checked withalphabet{alphabet}, repeat{repeat}, even{even}, exactgood{good}. ALLactualnumeric/listMCQs andeveryfullsolutionroster checked; leading0excluded/trailing0retained and noordered-digitmerging.'
    elif k=='two-distinct-ordered-roles':
        n=number(r'тобындағы (\d+) оқушының',s);assert 'БАСҚА'in s;ordered=[(a,b)for a in range(n)for b in range(n)if a!=b];unordered={frozenset(p)for p in ordered};assert len(ordered)==2*len(unordered)==n*(n-1)
        answer=str(len(ordered));note=f'COMPLETEorderedroleassignments6×5={len(ordered)}, nosameperson; unordered{len(unordered)}wouldmergeTWOdistinctroleallocationsperpair. Actualleader/assistantdirectionskept.'
    elif k=='three-distinct-books-permutations':
        assert 'үш ӘРТҮРЛІ'in s and 'бәрін'in s and 'бір қатарға'in s;labels=['Г','Б','Ә'];allwords={''.join(p)for p in itertools.permutations(labels)};written=m(r'Барлық орналасу: (.+?)\.',row['solution'])[1].split('; ')
        assert len(written)==len(set(written))==6 and set(written)==allwords;answer=str(len(allwords));note=f'ACTUALthreeDISTINCTbooksALLusedinline, every3!permutationenumerated{sorted(allwords)}andallwrittenwordschecked, reversearrangementsdistinct, no repeatedbook/circularquotient.'
    elif k in {'single-round-robin-unordered-pairs','two-distinct-flavors-unordered'}:
        n=number(r'сайысындағы (\d+) команда',s)if k.startswith('single')else number(r'сөресінде (\d+) түрлі',s);pairs=list(itertools.combinations(range(1,n+1),2));oriented=list(itertools.permutations(range(1,n+1),2));assert len(oriented)==2*len(pairs)
        answer=count_answer(row,len(pairs))
        if k.startswith('single'):
            block=m(r'Ретсіз жұптар: (.+?)\.',row['solution'])[1];written=[tuple(map(int,p.split('–')))for p in block.split('; ')];assert written==pairs and all(a<b for a,b in written)
            assert count_answer(row,len(oriented))!=answer
        note=f'COMPLETEactualn{n}unorderedDISTINCTpairs{pairs}, {len(pairs)}; oriented{len(oriented)}exactlyTWOfiberperpair, sameitemdisallowed. EveryactualMCQandfullprintedgamepairlistchecked.'
    elif k=='two-chronological-binary-events':
        assert 'екі рет'in s and 'Бірінші және екінші'in s and 'РЕТІ'in s;actual=list(itertools.product(['К','А'],repeat=2));words={''.join(p)for p in actual};written=m(r'Барлық реттелген нәтиже: (.+?)\.',row['solution'])[1].split('; ');assert len(written)==len(set(written))==4 and set(written)==words
        unordered={tuple(sorted(p))for p in actual};assert len(unordered)==3 and ('К','А')in actual and ('А','К')in actual;answer=count_answer(row,len(actual));assert count_answer(row,len(unordered))!=answer
        note='ACTUALtwoCHRONOLOGICALtwo-colorevents, COMPLETEКК/КА/АК/АА. Reversedmixedoutcomesdistinct, unordered3trapfalse; probabilityorindependenceassumptionnotneededforcountofallowedpairs.'
    elif k=='four-collinear-points-complete-segment-roster':
        points=m(r'солдан оңға ([A-Z, ]+) төрт',s)[1].split(', ');assert len(points)==len(set(points))==4 and 'ӘРТҮРЛІ'in s
        segments={frozenset(p)for p in itertools.combinations(points,2)};flags=[]
        for o in row['options']:
            names=o.split('; ');unordered=[frozenset(p)for p in names];assert all(len(v)==2 for v in unordered)
            flags.append(len(names)==len(set(unordered))==len(segments)and set(unordered)==segments)
        answer=one(o for o,t in zip(row['options'],flags)if t);assert flags==[False,True,False,False]
        assert frozenset({'Q','S'})not in {frozenset(p)for p in row['options'][2].split('; ')}
        last=[frozenset(p)for p in row['options'][3].split('; ')];assert len(last)==6 and len(set(last))==3 and not any('S'in p for p in last)
        note=f'ALL6unorderedactualendpointpairs{segments}, ALL4completeMCQrosterscheckednotjustlength. Adjacent-only3, missingQS5, reverseddup6names/3segmentswithNOSallfalse; physicalcollinearitydoesnotdeletecontainingsegments.'
    elif k in {'one-from-each-product-choice','two-stage-routes-product'}:
        if k=='one-from-each-product-choice':a,b=map(int,m(r'(\d+) түрлі жұқа нан және (\d+) түрлі салынды',s).groups());assert 'ДӘЛ БІР'in s and'Әр таңдау жұбы рұқсат'in s
        else:a,b=map(int,m(r'саябаққа (\d+) бөлек жол, саябақтан кітапханаға (\d+) бөлек жол',s).groups());assert'Әр бірінші жолды әр екінші жолмен'in s and 'АРҚЫЛЫ'in s
        fullpairs=list(itertools.product(range(a),range(b)));assert len(set(fullpairs))==a*b;answer=str(len(fullpairs));assert a+b!=len(fullpairs)
        note=f'ACTUALtypedcategory/stagecounts{a},{b}, COMPLETECartesianproduct{fullpairs}→{answer}. Everyfirstpairedwitheverysecondexplicit; twoorderedTYPEDstages/notpermutationofsamepool, notadd{a+b}.'
    else:raise AssertionError(k)
    return answer,note,digitwitnesses

def main():
    assert len(ROWS)==13;entries=[];refs=set();totaldigits=0
    for row in ROWS:
        answer,note,nd=solve(row);totaldigits+=nd;assert answer==row['answer'],(row['editionId'],answer,row['answer']);bad=copy.deepcopy(row);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer']
        assert row['grade']==6 and row['minimumPlan']=='pro'and not row.get('image')
        if row.get('options'):assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
        else:assert answer.isdigit()and row['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=h.raw_for(row);refs.add(raw['id']);assert raw['solution'];norm=lambda text:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',text).lower()).strip();assert norm(raw['statement'])!=norm(row['statement'])
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All13saved/newfullconditions/official+newsolutions/everyMCQread; ownACTUALprintedexhaustive10…99digitdomain,orderedrole/product/permutation/chronology andunorderedpair/segmentoracle; noauthorcalculator/spec/params','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['All13saved/newfullconditions/official+newsolutions/everyMCQmanuallyread','ALL90two-digitnumbersineachdigitalphabetcase andallwrittenfullrosterschecked','Repeateddigitsyes/no,leading0forbidden/trailing0allowed,ALLthreeevenendings×fourchoices','Orderedrolesandchronologicaleventsversusunorderedgames/flavorpairs/segmentendpoints','All6bookpermutations/all4binaryeventwords/everysegmentMCQmissingandreversedduplicates','COMPLETEtypedCartesianproducts, noad-hoccutofforinvariantcountasnewmeaning']})
    assert len(refs)==13 and totaldigits==41
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'All13source-addressedgrade6topic8.3nonvisualenumeration; ordered/unorderedtypedroles, complete90digit andfiniteproductdomains','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:assert{e['editionId']:e['sha256']for e in json.loads((ROOT/OUT).read_text())['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':13,'wrongKeysRejected':13,'hashesMatched':13,'sourceRefs':13,'digitalphabets':5,'allTwoDigitNumbersExamined':450,'validDigitalWitnesses':totaldigits,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
