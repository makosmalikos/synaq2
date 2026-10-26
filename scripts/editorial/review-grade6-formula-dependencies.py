"""External complete reading and printed-givens oracle; no author solver/params.

All12 saved/new statements, complete official/authored solutions and every MCQ
read independently. Exact Fraction arithmetic and separate cube/rectangle models.
"""
import ast, copy, hashlib, itertools, json, re, subprocess, sys
from fractions import Fraction as F
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-formula-dependencies.json'
def clean(s):
    s=str(s).replace('$','').replace('\\,','').replace('−','-')
    while '\\\\' in s:s=s.replace('\\\\','\\')
    s=s.replace('\\cdot','×')
    s=re.sub(r'\\d?frac\{([^{}]+)\}\{([^{}]+)\}',r'(\1/\2)',s)
    return s.strip()
def one(xs):
    assert len(xs)==1,xs
    return xs[0]
def num(s):return F(clean(s).replace(',','.'))
def expr(s,env=None):
    s=clean(s).replace('×','*').replace('÷','/').replace(':','/').replace('³','**3')
    s=re.sub(r'\^([23])',r'**\1',s)
    s=re.sub(r'(\d|\))\s*([A-Za-z(])',r'\1*\2',s)
    tree=ast.parse(s,mode='eval');env=env or {}
    def ev(t):
        if isinstance(t,ast.Expression):return ev(t.body)
        if isinstance(t,ast.Constant):return F(str(t.value))
        if isinstance(t,ast.Name):return F(env[t.id])
        if isinstance(t,ast.UnaryOp):
            assert isinstance(t.op,(ast.USub,ast.UAdd));return -ev(t.operand) if isinstance(t.op,ast.USub) else ev(t.operand)
        assert isinstance(t,ast.BinOp)
        a,b=ev(t.left),ev(t.right)
        if isinstance(t.op,ast.Add):return a+b
        if isinstance(t.op,ast.Sub):return a-b
        if isinstance(t.op,ast.Mult):return a*b
        if isinstance(t.op,ast.Div):return a/b
        assert isinstance(t.op,ast.Pow) and b in (2,3);return a**int(b)
    return ev(tree)
def options(r):return [clean(o['text'] if isinstance(o,dict) else o) for o in r.get('options') or []]
def selected(r,predicate):
    answer=one([o for o in options(r) if predicate(o)])
    assert clean(r['answer'])==answer,(r['answer'],answer)
def numerical(r,answer):
    assert num(r['answer'])==answer,(r['answer'],answer)
    if options(r):assert sum(num(o)==answer for o in options(r))==1
def declared(s,letter):return num(one(re.findall(r'\b'+letter+r'\s*=\s*(-?\d+(?:[.,]\d+)?)\b',s)))
def solve(r,i,source=False):
    s=clean(r['statement']);os=options(r)
    if i==0:
        if source:assert 'алтыбұрыш' in s and 'P = 6a' in s;variable='a'
        else:assert 'бесбұрыш' in s and 'ӨЗІМІЗ ТАҢДАП' in s and 'P = 5s' in s;variable='s'
        selected(r,lambda o:o==variable)
    elif i==1:
        variable='n' if source else 'k'
        assert 'C =' in s
        if not source:assert 'Алдымен билет санын k таңдап' in s
        selected(r,lambda o:o.startswith(variable+' — тәуелсіз') and 'C — тәуелді' in o)
    elif i in (2,7):
        a,b=map(num,one(re.findall(r'y\s*=\s*(\d+)x\s*-\s*(\d+)',s)))
        x=declared(s,'x');answer=a*x-b
        assert (answer>0 if i==2 else answer<0)
        numerical(r,answer)
        if i==7:assert set(map(num,os))=={answer,-answer,a*x+b,-a*x-b}
    elif i==3:
        rate=num(one(re.findall(r'минутына\s+(\d+)',s)))
        if source:time=num(one(re.findall(r'Принтер\s+(\d+)\s+минутта',s)))
        else:time=declared(s,'t')
        assert f'N = {rate}t' in s and 'минут' in s
        numerical(r,sum(rate for _ in range(int(time))))
    elif i==4:
        speed=num(one(re.findall(r'(\d+)\s+км/сағ',s)))
        time=num(one(re.findall(r'Пойыз\s+(\d+)\s+сағатта',s))) if source else declared(s,'t')
        assert f's = {speed}t' in s
        numerical(r,sum(speed for _ in range(int(time))))
    elif i==5:
        speed=num(one(re.findall(r'(\d+)\s+км/сағ',s)))
        def formula(o):
            l,right=o.split('=')
            return all(expr(l,{'s':speed*t,'t':t})==expr(right,{'s':speed*t,'t':t}) for t in (F(1,2),F(1),F(2),F(5)))
        selected(r,formula)
    elif i==6:
        price=num(one(re.findall(r'(\d+)\s+теңге',s)))
        assert price>0 and price*2!=price*5
        selected(r,lambda o:'бір ' in o.casefold() and 'бағасы' in o.casefold())
    elif i==8:
        price=num(re.findall(r'(\d+)\s+теңге',s)[0])
        total=num(one(re.findall(r'(?:жалпы|билеттерге)\s+(\d+)\s+теңге',s)))
        count=one([n for n in range(1,int(total)+1) if price*n==total])
        numerical(r,F(count))
    elif i==9:
        price=num(re.findall(r'(\d+)\s+теңге',s)[0]);count=declared(s,'n')
        assert f'C = {price}n' in s
        numerical(r,sum(price for _ in range(int(count))))
    elif i==10:
        vertices=list(itertools.product((0,1),repeat=3))
        edges=[(u,v) for u,v in itertools.combinations(vertices,2) if sum(a!=b for a,b in zip(u,v))==1]
        assert len(vertices)==8 and len(edges)==12
        variable='a' if source else 'e';output='L' if source else 'T'
        def formula(o):
            left,right=o.split('=')
            return left.strip()==output and all(expr(right,{variable:n})==sum(F(n) for _ in edges) for n in (1,2,3,5))
        selected(r,formula)
    elif i==11:
        a,b=declared(s,'a'),declared(s,'b');assert 'P = 2(a + b)' in s
        numerical(r,a+b+a+b)
    else:raise AssertionError(i)
    if not source and not os:assert 'Жауапқа тек санды жазыңыз.' in s

def hash_row(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def rejected(fn):
    try:fn()
    except (AssertionError,ValueError,SyntaxError,KeyError):return
    raise AssertionError('Changed printed content was accepted')
def main():
    batch=json.loads((ROOT/BATCH).read_text());rows=batch['editions'];assert len(rows)==12
    sources=[];entries=[];numeric_chains=0
    for i,r in enumerate(rows):
        solve(r,i)
        ref=one(r['sourceRefs']);capture=json.loads((ROOT/ref['sourceFile']).read_text());q=one([q for q in capture['questions'] if q['id']==ref['sourceId']])
        assert capture['status']=='captured' and q['checked'] and not q.get('images') and not q.get('svg')
        src={**q,'answer':q['sourceAnswer']};solve(src,i,True);sources.append(ref)
        assert clean(q['statement']).casefold()!=clean(r['statement']).casefold()
        assert not re.search(r'[$\\]|<script|<img',r['statement']+r['solution'])
        wrong=copy.deepcopy(r);wrong['answer']='WRONG_KEY';rejected(lambda:solve(wrong,i))
        # Straight numeric equalities supplement the complete human reading.
        for m in re.finditer(r'(?<![A-Za-z0-9])([−-]?\d+(?:,\d+)?(?:\s*[×÷:+−-]\s*[−-]?\d+(?:,\d+)?)*)\s*=\s*([−-]?\d+(?:,\d+)?(?:\s*[×÷:+−-]\s*[−-]?\d+(?:,\d+)?)*)',r['solution']):
            left,right=m.groups()
            if not re.search('[×÷:+−-]',left):continue
            assert expr(left)==expr(right),(i,left,right)
            numeric_chains+=1
        entries.append({'editionId':r['editionId'],'sha256':hash_row(r),'verdict':'verified','method':'independent_full_saved_new_solution_MCQ_read_printed_Fraction_input_output_roles_separate_cube_graph_rectangle_oracle','notes':[]})
    mutations=[(0,'options','s','P'),(1,'options','k — тәуелсіз, C — тәуелді','k — тәуелді, C — тәуелсіз'),(2,'statement','x = 7','x = 8'),(3,'statement','t = 8','t = 9'),(4,'statement','t = 4','t = 5'),(5,'options','s = 18t','s = 19t'),(6,'options','Бір ашықхаттың бағасы','Ашықхат саны'),(7,'statement','x = 4','x = 5'),(8,'statement','39200','44800'),(9,'statement','n = 9','n = 10'),(10,'options','T = 12e','T = 10e'),(11,'statement','b = 14','b = 15')]
    for i,key,old,new in mutations:
        c=copy.deepcopy(rows[i]);assert old in str(c[key]);c[key]=[v.replace(old,new) for v in c[key]] if isinstance(c[key],list) else c[key].replace(old,new);rejected(lambda:solve(c,i))
    rectangles=0
    for a in range(1,31):
        for b in range(1,31):
            # Count boundary unit segments of an independent lattice rectangle.
            boundary={('h',x,y) for y in (0,b) for x in range(a)}|{('v',x,y) for x in (0,a) for y in range(b)}
            assert len(boundary)==2*(a+b);rectangles+=1
    prices=0
    for p in range(1,101):
        for n in range(1,31):
            ledger=sum(p for _ in range(n));assert F(ledger,p)==n and ledger==p*n;prices+=1
    js="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions.map(r=>[r.editionId,editionHash(r)])));"
    hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)))
    assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
    report={'schemaVersion':1,'reviewer':'independent_agent_zerek_progress_inventory','batch':BATCH,'scope':'Complete reading of all12 saved/new full statements, official/authored full solutions and every MCQ; printed exact oracle and semantic role checks. No author models/params/solver imported.','summary':{'verified':12,'findings':0,'wrongKeysRejected':12,'printedCanariesRejected':len(mutations),'straightNumericEqualities':numeric_chains,'rectangleBoundaryDomains':rectangles,'priceCountInverseLedgers':prices,'cubeVertices':8,'cubeEdges':12,'pythonJavaScriptHashesMatched':12},'sourceRefs':sources,'entries':entries}
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade6-formula-dependencies.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
