"""Independent full14 saved/new signed-product editorial review.

Every condition, complete solution and MCQ read. Actual printed Fraction/AST
oracle; no author solver or params imported. Source-specific distractor roles
and positive depth versus negative coordinate independently checked.
"""
import ast, copy, hashlib, json, math, re, unicodedata
from fractions import Fraction as F
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BATCH = 'problems/editorial/batches/grade6-signed-multiplication.json'
REPORT = 'problems/editorial/reviews/grade6-signed-multiplication.json'

def read(p): return json.loads((ROOT/p).read_text())
def clean(s):
    s=s.replace('$','').replace('{,}',',').replace('−','-').replace('\\left','').replace('\\right','').replace('\\cdot','×').replace('\\,','')
    s=re.sub(r'\\(?:dfrac|frac)\{(-?\d+)\}\{(-?\d+)\}',r'(\1/\2)',s)
    return s.replace('²','**2').replace('³','**3').replace('^','**')
def expr(s):
    t=clean(s).replace(',','.').replace('×','*').replace(':','/').strip()
    def walk(n):
        if isinstance(n,ast.Constant): return F(ast.get_source_segment(t,n))
        if isinstance(n,ast.UnaryOp):
            assert isinstance(n.op,(ast.UAdd,ast.USub)); return -walk(n.operand) if isinstance(n.op,ast.USub) else walk(n.operand)
        assert isinstance(n,ast.BinOp); a,b=walk(n.left),walk(n.right)
        if isinstance(n.op,ast.Add): return a+b
        if isinstance(n.op,ast.Sub): return a-b
        if isinstance(n.op,ast.Mult): return a*b
        if isinstance(n.op,ast.Div): return a/b
        if isinstance(n.op,ast.Pow): assert b.denominator==1 and 0<=b<=3; return a**int(b)
        raise AssertionError(ast.dump(n))
    return walk(ast.parse(t,mode='eval').body)
def os(row): return [x['text'] if isinstance(x,dict) else x for x in row.get('options',[]) or []]
def norm(s): return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',clean(s))).strip()
def one(xs): assert len(xs)==1,xs; return xs[0]
def math_prompt(s):
    t=clean(s).split(':')[-1].split('Жауапқа')[0].strip().rstrip('.')
    assert re.fullmatch(r'[\d\s()*/+.,×-]+',t),t; return t
def factors(s):
    t=clean(s).replace(',','.').replace('×','*'); n=ast.parse(t,mode='eval').body
    assert isinstance(n,ast.BinOp) and isinstance(n.op,ast.Mult)
    return expr(ast.get_source_segment(t,n.left)),expr(ast.get_source_segment(t,n.right))
def solve(row,i,source=False):
    s=clean(row['statement']); choices=os(row); value=None; chosen=None
    if i==1:
        chosen=one([o for o in choices if expr(o)<0]); a,b=factors(chosen); assert a<0<b
        assert sorted((expr(o)>0)-(expr(o)<0) for o in choices)==[-1,0,1,1]
    elif i==3:
        valid=[]
        for o in choices:
            left,right=clean(o).split('='); valid.append(expr(left)==expr(right))
        chosen=one([o for o,ok in zip(choices,valid) if ok]); assert valid==[False,False,False,True]
        assert factors(clean(choices[0]).split('=')[0])[0]==0
        assert factors(clean(choices[2]).split('=')[0])[1]==0
        assert factors(clean(chosen).split('=')[0])[0]==-1
    elif i==8:
        ns=[F(x) for x in re.findall(r'-?\d+',s)]
        if source: delta,seconds=ns
        else: zero,delta,seconds=ns; assert zero==0
        assert delta<0 and seconds>0
        value=abs(delta*seconds); assert value>0
        assert 'тереңдікте' in s
        if not source: assert '|'+str(delta*seconds)+'|' in clean(row['solution'])
    else:
        printed=math_prompt(row['statement']); value=expr(printed)
        if i in (0,4,6,11): assert value<0
        else: assert value>0
        if i in (5,11):
            assert re.search(r'\(-\d+\)\*\*[23]',printed),printed
            assert ('**2' in printed)==(i==5)
        elif i==6:
            a,b=factors(printed); assert -1<a<0<b<1
            ns=list(map(int,re.findall(r'\d+',printed))); an,ad,bn,bd=ns
            assert math.gcd(an*bn,ad*bd)>1
            assert expr(choices[0])==-value
            assert expr(choices[1])==-F(an+bn,ad+bd)
            assert expr(choices[3])==(1/a)*b
            reduced=one([o for o in choices if expr(o)==value]); nn,dd=map(int,re.findall(r'\d+',clean(reduced))); assert math.gcd(nn,dd)==1
        elif i==4:
            a,b=factors(printed); assert -1<a<0<b<1 and value.denominator in (25,50)
            assert expr(choices[0])==-value and expr(choices[1])==10*value and expr(choices[2])==a+b
        elif i==10:
            a,b=factors(printed); assert -1<a<0 and b<-10 and value.denominator==1
        elif i==12:
            a,b=factors(printed); assert a.denominator>1 and b.denominator==1
        elif i==13:
            a,b=factors(printed); assert -1<a<0 and b<-1 and value.denominator==1
    if chosen is None and choices: chosen=one([o for o in choices if expr(o)==value])
    if chosen is not None: assert norm(row['answer'])==norm(chosen),(i,row['answer'],chosen)
    else: assert expr(row['answer'])==value,(i,row['answer'],value)
    return value

def chains(row):
    count=0
    # Only numeric equality chains, not deliberately false option descriptions.
    for m in re.finditer(r'[0-9(\-][0-9\s,×+/:−()=²³\-]*',row['solution']):
        t=m[0].strip().strip(','); t=re.split(r',(?=\s)',t)[0]
        if '=' not in t or t.count('(')!=t.count(')'): continue
        bits=t.split('=')
        if any(not b.strip() or re.search(r'[+×:/−-]\s*$',b) for b in bits): continue
        values=[expr(b) for b in bits]; assert all(v==values[0] for v in values),t; count+=1
    return count

def run():
    rows=read(BATCH)['editions']; assert len(rows)==14; entries=[]; bad=eq=0
    for i,row in enumerate(rows):
        ref=row['sourceRefs'][0]; capture=read(ref['sourceFile']); raw=one([q for q in capture['questions'] if q['id']==ref['sourceId']])
        assert capture['status']=='captured' and raw['checked'] and raw['solution'] and not raw.get('images')
        assert norm(raw['statement']).lower()!=norm(row['statement']).lower()
        solve({**raw,'answer':raw['sourceAnswer']},i,True); solve(row,i); eq+=chains(row)
        wrong=copy.deepcopy(row); wrong['answer']='INVALID'
        try: solve(wrong,i)
        except (AssertionError,ValueError,SyntaxError): bad+=1
        else: raise AssertionError(('Wrong key accepted',i))
        entries.append({'editionId':row['editionId'],'sha256':hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_actual_printed_Fraction_AST_sign_zero_minusone_decimal_power_reduction_distractor_and_depth_checks','notes':['Read all14 saved/new conditions, full official/authored solutions and every MCQ. No author solver or params imported.','Exact product signs versus addition/subtraction; zero not negative; minus-one opposite; entire parenthesized negative base squared/cubed; two decimal places and integer results checked.','Fraction numerator/denominator addition and reciprocal-FIRST distractors independently reproduced; genuine reduction and lowest terms confirmed. Depth is positive modulus of negative final coordinate.']})
    canaries=[(0,'(-8)','(-9)'),(1,'(-7) × 4,6','(-7) × (-4,6)'),(2,'(-12)','(-13)'),(3,'(-1) × 6,4 = -6,4','(-1) × 6,4 = 6,4'),(4,'0,3','0,2'),(5,'(-7)','(-8)'),(6,'14/15','13/15'),(7,'(-64)','(-65)'),(8,'7 секундтан','8 секундтан'),(9,'(-18)','(-19)'),(10,'37,5','38,5'),(11,'(-3)','(-4)'),(12,'(-6)','(-8)'),(13,'(-18)','(-24)')]
    rejected=0
    for i,old,new in canaries:
        row=copy.deepcopy(rows[i]); field='options' if i in (1,3) else 'statement'
        if field=='options':
            assert any(old in o for o in row[field]); row[field]=[o.replace(old,new) for o in row[field]]
        else: assert old in row[field]; row[field]=row[field].replace(old,new)
        try: solve(row,i)
        except (AssertionError,ValueError,SyntaxError): rejected+=1
        else: raise AssertionError(('Printed canary accepted',i))
    witnesses=0
    for a in range(-100,101):
        x=F(a,10); assert x*0==0 and x*(-1)==-x
        for b in range(-100,101):
            y=F(b,10); z=x*y; assert z==F(a*b,100)
            assert (z>0)-(z<0)==((x>0)-(x<0))*((y>0)-(y<0))
            assert (-x)*(-y)==z and (-x)*y==-z; witnesses+=1
    evidence={'oracle':'scripts/editorial/review-grade6-signed-multiplication.py','savedConditionsChecked':14,'newConditionsChecked':14,'fullSolutionsAndAllChoicesRead':True,'wrongKeysRejected':bad,'printedGivensAndRoleCanariesRejected':rejected,'exactTenthsSignZeroMinusOneWitnesses':witnesses,'numericSolutionEqualityChains':eq,'independentReviewNotWholeBankAudit':True}
    (ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({**evidence,'hashes':len(entries),'report':REPORT,'status':'verified'},ensure_ascii=False))

if __name__=='__main__': run()
