"""Review the first 11 base-level topics (grades 4–6); no grade-7 imports.
Independent expressions below are derived from the conditions/inspected diagrams,
then compared with the displayed source key. Conceptual proofs are labelled separately.
"""
import importlib.util, json, pathlib, re, subprocess, unicodedata
from collections import Counter
import sympy as S
from zerek_math import expression, display_statement
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE=ROOT/'problems/sources/zerek/courses'
spec=importlib.util.spec_from_file_location('checks',ROOT/'scripts/prepare-zerek-import.py')
checks=importlib.util.module_from_spec(spec);spec.loader.exec_module(checks)
def concept(answer,reason):return {'kind':'concept','answer':answer,'reason':reason}
def tup(*values):return {'kind':'tuple','expressions':list(values)}
def eq(value):return {'kind':'equation','equation':value}
def num(value):return {'kind':'numerator','expression':value}
def den(value):return {'kind':'denominator','expression':value}
PROOFS={
'4-math-1-1':[
 '5*100+6','40/5',concept('<','3 centners + 5 kg = 305 kg, which is less than 350 kg.'),'9*4',
 tup('708','780','807','870'),'45300','2*60+15','3*1000+4*10+7','6000/4*7',
 '300+420-185','167+245+33+55','(96+84)/12','480/(560-320)','90-6*5+10','315+(204-168)*5',
 concept('2 ғасыр','Two centuries = 200 years, greater than 199, 195 and 190.')],
'4-math-3-1':[
 '20/5',concept('Арман','240/3 = 80 m/min; 280/4 = 70 m/min.'),'25*6',concept('км/сағ','Speed has units distance/time, not time, area or distance.'),
 '80*7','65','10/2','480/6','360/4','128/32','45/15',concept('мотоцикл','For equal 3-hour times, 72 km/h gives the largest distance among 65, 30, 72, 18.'),
 '70*3','4*9',concept('v = S : t','The speed is distance divided by elapsed time.'),'2400/3'],
'4-math-4-1':[
 concept('V = a · a · a','A cube has three perpendicular equal dimensions; volume is their product.'),'4',
 concept('C','In net A-B-C-D with E above B and F below B, the opposite pairs are A/C, B/D and E/F.'),'6*4',
 concept('Әлияның қорабының','Cube volume 4³=64 exceeds cuboid volume 5×4×3=60.'),'2',
 concept('Олардың аудандары тең','Opposite faces of a cuboid have the same two side lengths.'),'3',tup('6','3','2'),
 '4*(8+5+3)','60/12','12*5','6*5*5','6','4*4','9*6*5'],
'5-math-3-2':[
 '2/5','9','6','9/16','36*7/12','40*5/8','20*3/5','12*7/4','56*6/7','14/21',den('48/60'),'25/45','8/24','27/3','16/40',eq('3/4=(3*5)/(4*5)')],
'5-math-3-8':[
 num('11/15-4/15'),{'kind':'fractionalNumerator','expression':'5/6+3/8'},eq('3/7+2/7=5/7'),den('7/10-1/2'),
 '2/9+5/9','1-5/9','8-3-2','17-6','20+15','13/25+4/25+8/25','5/12+1/12','5/6-3/4','2/3+1/5','3/4+1/2','3/10+2/5',num('1/4+1/6')],
'5-math-6-2':[
 '80*35/100','120*15/100','45*200/100','500*23/100','2.5*4/100','470/10','64/4','40*150/100','300*12/100','3600/2','360*3/4',
 concept('M','The ray has 20 equal intervals over 0–60; M is at 7 intervals, hence 21 = 35% of 60.'),'85*20/100','350*4/10','75/100','5800/100'],
'6-math-1-1':[
 '8*5','126/9','0.6/0.2','36/9','14/21','56/8','4/10','54/6','12/15','9/5','1/(2/3)','12','75/100','260/4','3/12','2400/600'],
'6-math-1-2':[
 '72*3/(5+3)','1800*4/(2+3+4)','840*5/7','30*8/15',tup('60/6','60*2/6','60*3/6'),'40*(3-1)/4','48*3/4','180*4/9','1200*7/12','21*2/7',
 tup('45*4/9','45*5/9'),'56*4/7','1000/4','7/4','6/2*9','63/(4+5)'],
'6-math-1-4':[
 '0.8*1.5/2','36*2/9',tup('7','9'),'4*15/5',eq('2/3=8/12'),'4*25/10','4*5','2/7','9*8/12','40*3/5',eq('5/15=2/6'),eq('4/6=10/15'),eq('12*20=16*15'),eq('6/8=9/12'),'56','6*10/15'],
'6-math-4-2':[
 eq('6*x-2*x=9+11'),'48/4','15/3+4',eq('2*x+9=3'),eq('3*x-7=0'),tup('-6','18'),eq('4*x+1=4*x-3'),'3*(5+2)',eq('2*x=16'),'-12/3','28/4','(26-5)/3','35/7',
 concept('екі жағын да 0-ге көбейту','Multiplying by zero erases the original constraint; e.g. x=1 becomes 0=0.'),'(11-3)/0.5','(14-2)/(4-1)'],
'6-math-8-1':[
 '(-5+3)/2','(150+250)/(2+3)','(2.4+3.1+4.4)/3','(40+55+35+50)/4','(4.6+5.8)/2','(8+11+14+7)/4','2*23-19','(1/2+1/3)/2','(3+0+5+0+7)/5','(6+9+4+8+3)/5',tup('2','5','8'),'6*8','(90*1+50*3)/4','(-6+2-5+1)/4','(18+21+17+20+23+19+22)/7','(40+55+35+60+45)/5']}
TOPICS={'4-math-1-1':['num','geo','num','geo','num','num','num','num','ratio','eq','num','num','eq','num','num','num'],
 '4-math-3-1':'ratio','4-math-4-1':'geo','5-math-3-2':'frac','5-math-3-8':'frac','5-math-6-2':'pct',
 '6-math-1-1':'ratio','6-math-1-2':'ratio','6-math-1-4':'ratio','6-math-4-2':'eq','6-math-8-1':'work'}
# These are false equalities explicitly rejected in the explanatory text, not claims.
FALSE_EXAMPLES={
 ('6-math-1-1',2):{'equalities':['0{,}6 : 0{,}2 = 0{,}3'],'reason':'Explicitly labelled Жиі қате (common mistake); the next sentence disproves it.'},
 ('6-math-1-4',4):{'equalities':['2 : 8 = 12 : 3','3 : 2 = 8 : 12','2 : 12 = 3 : 8'],'reason':'Wrong answer options, each explicitly rejected by unequal cross-products.'},
 ('6-math-1-4',11):{'equalities':['4 : 15 = 6 : 10','4 : 10 = 15 : 6','6 : 4 = 10 : 15'],'reason':'Wrong answer options, each explicitly rejected by unequal cross-products.'},
 ('6-math-4-2',6):{'equalities':['4x - 4x = -3 - 1','0 \\cdot x = -4'],'reason':'Contradictions derived to demonstrate that the equation has no solution.'}}
REMAINDER_EDITS={('5-math-3-8',1):('29 : 24 = 1',r'29 = 24 \cdot 1 + 5'),('5-math-3-8',13):('5 : 4 = 1',r'5 = 4 \cdot 1 + 1')}
def normalize(t):return re.sub(r'\s+','',unicodedata.normalize('NFKC',t)).replace('−','-').replace('·','*').replace('×','*').lower()
def parts(t):return re.findall(r'\$([^$]+)\$',t)
def key_values(q):
    chunks=parts(q['sourceAnswer']) or [q['sourceAnswer']]
    return [expression(re.sub(r'^[ab]\s*=\s*','',x)) for x in chunks]
def prove(q,p):
    if isinstance(p,str):p={'kind':'exact','expression':p}
    kind=p['kind'];raw=q['sourceAnswer']
    if kind=='concept':assert normalize(display_statement(raw))==normalize(p['answer']),raw
    elif kind=='equation':
        source=parts(raw);assert len(source)==1 and source[0].count('=')==1,raw
        a,b=map(expression,source[0].split('='));c,d=map(expression,p['equation'].split('='))
        assert S.simplify(a-c)==0 and S.simplify(b-d)==0,(raw,p)
    else:
        if kind=='tuple':expected=[expression(x) for x in p['expressions']]
        else:
            e=expression(p['expression'])
            if kind=='numerator':e=S.numer(e)
            if kind=='denominator':e=S.denom(e)
            if kind=='fractionalNumerator':e=S.numer(e-S.floor(e))
            expected=[e]
        actual=key_values(q);assert len(actual)==len(expected) and all(S.simplify(a-b)==0 for a,b in zip(actual,expected)),(raw,p,actual)
        p={**p,'computed':[str(e) for e in expected]}
    return p
def signature(q):
    # Preserve choices for generic stems. Images form part of the condition.
    return (normalize(q['statement']),tuple(sorted(normalize(o) for o in q.get('options') or [])),q.get('image') or '')
def build():
    old=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {POOL} from './frontend/src/bank.js'; process.stdout.write(JSON.stringify(POOL.filter(q=>!q.id.startsWith('zerek_course_'))));"],cwd=ROOT,text=True))
    (ROOT/'output/zerek-courses').mkdir(parents=True,exist_ok=True)
    seen={signature(q):q['id'] for q in old};records=[];tasks=[]
    vectors={r['src']:r for r in json.loads((BASE/'vector-manifest.json').read_text())['files']}
    for f in sorted(BASE.glob('*-level1.json')):
        data=json.loads(f.read_text());name=f.stem.removesuffix('-level1')
        if name not in PROOFS:continue # Reproduce the immutable first reviewed batch.
        proofs=PROOFS[name]
        assert data['grade'] in (4,5,6) and data['level']==1 and data['status']=='captured'
        assert len(data['questions'])==data['expected']==len(proofs)==16
        for i,(raw,proof) in enumerate(zip(data['questions'],proofs)):
            q={**raw,'options':raw.get('options',[]),'images':raw.get('images',[])};rec={'file':f.name,'captureIndex':i,'sourceContentId':q['id'],'grade':data['grade']}
            rec['independentReview']=prove(q,proof)
            if (name,i) in REMAINDER_EDITS:
                before,after=REMAINDER_EDITS[name,i];assert before in q['solution']
                q['solution']=q['solution'].replace(before,after)
                rec['editorialChanges']=[{'before':before,'after':after,'reason':'Write division with remainder as an exact equality.'}]
            assert q['checked'] and len(q['solution'])>30
            if q['options']:
                correct=[o for o in q['options'] if o['correct']];assert len(correct)==1 and correct[0]['text']==q['sourceAnswer']
            rec['presentationChecks']=checks.presentation_checks(q)
            count,conflicts=checks.solution_checks(q['solution'])
            rec['sourceArithmeticChecks']=count
            if conflicts:
                reviewed=FALSE_EXAMPLES.get((name,i));assert reviewed and set(conflicts)==set(reviewed['equalities']),(name,i,conflicts)
                rec['reviewedFalseExamples']=reviewed
            if q.get('captureCorrection'):rec['captureCorrection']=q['captureCorrection']
            image=None
            if q['images']:
                assert len(q['images'])==1
                v=vectors[q['images'][0]['src']];assert v['visualReview']=='verified',v['image']
                image=v['image'];rec['figureMethod']=v['method']
            statement=re.sub(r'\n{3,}','\n\n',re.sub(r'\[Image:[^\]]*\]','',display_statement(q['statement']))).strip()
            solution=re.sub(r'\n{3,}','\n\n',display_statement(q['solution']));answer=display_statement(q['sourceAnswer'])
            options=[display_statement(o['text']) for o in q['options']] or None
            assert not any('\\' in s or '$' in s or '[Image:' in s for s in [statement,solution,answer]+(options or [])),f'{name}:{i} unsupported notation'
            if options:assert options.count(answer)==1 and len(set(options))==len(options)
            topic=TOPICS[name][i] if isinstance(TOPICS[name],list) else TOPICS[name]
            task={'id':f'zerek_course_{q["id"]}','school':'Математика','subject':'math','lang':'kk','grade':data['grade'],
                  'topic':topic,'difficulty':'basic','practiceOnly':True,'statement':statement,'answer':answer,'solution':solution,
                  'source':'Zerek · '+data['title'],'sourceUrl':data['url'],'sourceContentId':q['id']}
            if options:task['options']=options
            if image:task['image']=image
            sig=signature(task)
            if sig in seen:rec.update(status='duplicate',duplicateOf=seen[sig])
            else:rec.update(status='ready',id=task['id']);seen[sig]=task['id'];tasks.append(task)
            records.append(rec)
    summary={'captured':len(records),'ready':len(tasks),'duplicates':len(records)-len(tasks),'grades':dict(Counter(q['grade'] for q in tasks)),
             'figures':sum(bool(q.get('image')) for q in tasks),'topics':len(PROOFS),'excludedGrades':[7],
             'reviewKinds':dict(Counter(r['independentReview']['kind'] for r in records)),
             'presentationChecks':sum(r['presentationChecks'] for r in records),'sourceArithmeticChecks':sum(r['sourceArithmeticChecks'] for r in records),
             'reviewedFalseExamples':sum(bool(r.get('reviewedFalseExamples')) for r in records),'unresolved':0}
    (BASE/'review-dispositions.json').write_text(json.dumps({'summary':summary,'records':records},ensure_ascii=False,indent=2)+'\n')
    (ROOT/'output/zerek-courses/ready.json').write_text(json.dumps(tasks,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(summary,ensure_ascii=False,indent=2))
if __name__=='__main__':build()
