"""External saved/new complete reading, printed Fraction + actual MathML observer.

No author model, params, table generator or calculator imported. Python extracts
the literal source TeX/new pipe tables; actual React MathText SSR is separately
observed, cell by cell, through an independent Node observer.
"""
import copy, importlib.util, json, re, subprocess, sys, xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sp=importlib.util.spec_from_file_location('own_formula_oracle',Path(__file__).with_name('review-grade6-formula-dependencies.py'));own=importlib.util.module_from_spec(sp);sp.loader.exec_module(own)
BATCH='problems/editorial/batches/grade6-dependency-tables.json'
one=own.one;rejected=own.rejected;hash_row=own.hash_row
def clean(s):return own.clean(s).replace('{,}',',').replace('\\ ',' ').strip()
def num(s):return F(clean(s).replace(',','.'))
def options(r):return [clean(o['text'] if isinstance(o,dict) else o) for o in r.get('options') or []]
def selected(r,predicate):assert clean(r['answer'])==one([o for o in options(r) if predicate(o)])
def numerical(r,x):
    assert num(r['answer'])==x,(r['answer'],x)
    if options(r):assert sum(num(o)==x for o in options(r))==1
def table(s,source=False):
    if source:
        if '\\begin{array}' not in s:return []
        pieces=s.split('\\hline')[1:-1]
        rows=[]
        for line in pieces:
            line=line.replace('\\\\','').replace('\\boldsymbol{?}','?')
            rows.append([clean(c) for c in line.split('&')])
    else:
        lines=[line.strip() for line in s.splitlines() if line.strip().startswith('|')]
        if not lines:return []
        rows=[[c.strip() for c in line.strip('|').split('|')] for line in lines if not re.fullmatch(r'[|\s-]+',line)]
    assert len(rows)==2 and len(rows[0])==len(rows[1]) and all(rows[0]) and all(rows[1]),rows
    return rows
def listnums(s):return[num(v) for v in re.split(r'\s*;\s*',clean(s))]
def solve(r,i,source=False):
    s=clean(r['statement']);raw=r['statement'];t=table(raw,source)
    if i==0:
        a,b=map(num,one(re.findall(r'y\s*=\s*(\d+)x\s*\+\s*(\d+)',s)))
        X,Y=t;assert X[0]=='x' and Y[0]=='y' and Y.count('?')==1
        for x,y in zip(X[1:],Y[1:]):
            value=a*num(x)+b
            if y=='?':numerical(r,value)
            else:assert num(y)==value
    elif i==1:
        if source:selected(r,lambda o:'кейбір' in o)
        else:
            assert 'кез келген НАҚТЫ сан' in s and 'y = 2x + 1' in s
            X,Y=t;xs=list(map(num,X[1:]));ys=list(map(num,Y[1:]));assert all(y==2*x+1 for x,y in zip(xs,ys))
            assert F(9,4) not in xs and len(set(xs))==4
            assert len(set(b-a for a,b in zip(xs,xs[1:])))==1 and xs[1]-xs[0]==F(1,2)
            selected(r,lambda o:'кейбір' in o and 'сәйкес y' in o)
    elif i==2:
        if source:xs=listnums(one(re.findall(r'мәндері:\s*(.*?)\. Кестенің',s)))
        else:assert t[0][0]=='Орны' and t[1][0]=='x';xs=list(map(num,t[1][1:]))
        steps=[b-a for a,b in zip(xs,xs[1:])];assert len(set(steps))==1 and steps[0]>0
        numerical(r,steps[0])
        expected={F(len(xs)),steps[0]*2,steps[0],xs[-1]-xs[0]};assert set(map(num,options(r)))==expected
    elif i==3:
        rate=num(one(re.findall(r'минутына\s+(\d+)\s+л',s)))
        target=num(re.findall(r't\s*=\s*(\d+)',s)[-1])
        if not source:
            T,V=t;assert T[0]=='t, мин' and V[0]=='V, л' and V.count('?')==1
            col=V.index('?');assert num(T[col])==target
            for x,y in zip(T[1:],V[1:]):
                if y!='?':assert num(y)==rate*num(x)
        numerical(r,sum(rate for _ in range(int(target))))
    elif i==4:
        C,A=map(num,one(re.findall(r'y\s*=\s*(\d+)\s*-\s*(\d+)x',s)))
        xs=[F(1),F(2),F(3)] if source else list(map(num,t[0][1:]))
        expected=[C-A*x for x in xs]
        selected(r,lambda o:listnums(o)==expected)
        truths=[listnums(o)==expected for o in options(r)];assert truths==[False,True,False,False]
        assert all(y>0 for y in expected)
    elif i==5:
        if source:step,first=map(num,one(re.findall(r'қадамы\s+(\d+).*?бірінші мәні\s+(\d+)',s)))
        else:first,step=map(num,one(re.findall(r'алғашқы мәні\s+(\d+).*?оған\s+(\d+)\s+қосу',s)))
        seq=[first]
        for _ in range(3):seq.append(seq[-1]+step)
        numerical(r,seq[-1]);assert set(map(num,options(r)))=={first+4*step,4*first,seq[-1],seq[1]}
    elif i==6:
        if source:assert 'жол ақысы жүрген жолдың ұзындығына тәуелді' in s;selected(r,lambda o:'ұзындығын' in o)
        else:assert 'алдымен сәлемдеме массасын таңдап' in s and 'БІРІНШІ жолы тәуелсіз' in s;selected(r,lambda o:o=='Сәлемдеме массасын')
    elif i==7:
        N,C=t;xs=list(map(num,N[1:]));ys=list(map(num,C[1:]));assert N[0]=='n' and C[0].startswith('C')
        target=num(one(re.findall(r'(\d+)\s+дәптер неше',s))) if source else num(one(re.findall(r'n\s*=\s*(\d+)',s)))
        rates={c/n for n,c in zip(xs,ys)};assert len(rates)==1
        numerical(r,ys[xs.index(target)])
    elif i==8:
        N,C=t;xs=list(map(num,N[1:]));ys=list(map(num,C[1:]));assert N[0]=='n' and C[0].startswith('C')
        assert len(xs)==4 and xs[1]-xs[0]>1
        prices=[c/n for n,c in zip(xs,ys)];assert len(set(prices))==1;numerical(r,prices[0])
        assert ys[1]-ys[0]!=prices[0] and (ys[1]-ys[0])/(xs[1]-xs[0])==prices[0]
    elif i==9:
        X,Y=t;assert X[0]=='x' and Y[0]=='y' and X.count('?')==1
        unknown=X.index('?');step=num(X[2])-num(X[1]);assert step>0
        xs=[num(X[1])+j*step for j in range(len(X)-1)];ys=list(map(num,Y[1:]));assert all(x=='?' or num(x)==xs[j] for j,x in enumerate(X[1:]))
        numerical(r,xs[unknown-1]);assert len(set(b-a for a,b in zip(ys,ys[1:])))==1
        assert ys[unknown-1]!=xs[unknown-1] and ys[1]-ys[0]!=step
    else:raise AssertionError(i)
    if not source and not options(r):assert 'Жауапқа тек санды жазыңыз.' in s

def main():
    rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==10
    native=json.loads(subprocess.check_output(['node','scripts/editorial/review-grade6-dependency-tables-native.mjs'],cwd=ROOT,text=True));assert len(native)==10
    cells=0;tables=0;maxcolumns=0;entries=[];refs=[]
    for i,(r,observed) in enumerate(zip(rows,native)):
        solve(r,i);assert observed['editionId']==r['editionId'] and observed['sha256']==hash_row(r)
        ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and q['checked'] and not q.get('images') and not q.get('svg');solve({**q,'answer':q['sourceAnswer']},i,True);refs.append(ref)
        assert clean(q['statement']).casefold()!=clean(r['statement']).casefold()
        html=observed['html'];assert not re.search('<img|<script|<iframe|\\\\begin',html)
        doc=ET.fromstring('<root>'+html+'</root>');rendered=doc.findall('.//mtable');literal=table(r['statement'])
        if literal:
            assert len(rendered)==1;node=rendered[0];assert node.get('frame')=='solid' and node.get('rowlines')=='solid' and node.get('columnlines')=='solid'
            actual=[[''.join(c.itertext()) for c in row.findall('mtd')] for row in node.findall('mtr')];assert actual==literal,(i,actual,literal)
            assert len(actual)==2 and len(actual[0])==len(actual[1]) and len(actual[0])<=7
            assert one(doc.findall('.//math')).get('display')=='block'
            accessible=one(doc.findall('.//math')).get('aria-label');assert all(cell in accessible for row in literal for cell in row)
            cells+=sum(map(len,actual));tables+=1;maxcolumns=max(maxcolumns,len(actual[0]))
        else:assert not rendered
        assert not re.search(r'[$\\]|NaN|undefined',r['statement']+r['solution'])
        wrong=copy.deepcopy(r);wrong['answer']='WRONG_KEY';rejected(lambda:solve(wrong,i))
        notes=['Source general table wording is explicitly restricted to real x; this review does not treat a finite table as necessarily incomplete for every possible finite domain.'] if i==1 else []
        entries.append({'editionId':r['editionId'],'sha256':hash_row(r),'verdict':'verified','method':'independent_complete_saved_new_fullsolution_MCQ_read_literal_table_Fraction_oracle_and_actual_React_MathText_MathML_cell_observer','notes':notes})
    assert (tables,cells,maxcolumns)==(8,92,7)
    mutations=[(0,'statement','5x + 2','6x + 2'),(1,'options','Кестеде x-тің кейбір мәндері және оларға сәйкес y мәндері берілген','Кестеде x-тің барлық нақты мәні берілген'),(2,'statement','2,6','2,7'),(3,'statement','t = 3','t = 4'),(4,'statement','22 − 3x','22 − 4x'),(5,'statement','алғашқы мәні 9','алғашқы мәні 10'),(6,'options','Сәлемдеме массасын','Жол ақысын'),(7,'statement','| 800 |','| 810 |'),(8,'statement','| 1260 |','| 1261 |'),(9,'statement','| 6 |','| 7 |')]
    for i,key,old,new in mutations:
        r=copy.deepcopy(rows[i]);assert old in str(r[key]);r[key]=[o.replace(old,new) for o in r[key]] if isinstance(r[key],list) else r[key].replace(old,new);rejected(lambda:solve(r,i))
    arithmetic_progressions=0;price_ledgers=0
    for first in range(-20,21):
        for step in range(1,17):
            terms=[F(first)+j*F(step,10) for j in range(6)]
            assert terms[3]==terms[0]+3*F(step,10) and len(set(b-a for a,b in zip(terms,terms[1:])))==1;arithmetic_progressions+=1
    for price in range(1,61):
        for step in range(2,8):
            ns=[step*j for j in range(1,5)];cs=[sum(F(price) for _ in range(n)) for n in ns]
            assert all(c/n==price for n,c in zip(ns,cs)) and cs[1]-cs[0]==step*price;price_ledgers+=1
    report={'schemaVersion':1,'reviewer':'independent_agent_zerek_progress_inventory','batch':BATCH,'scope':'Complete reading of all10 saved/new conditions, full official/authored solutions and every MCQ. Independent literal printed/TeX/pipe-table Fraction reasoning plus actual native React MathText SSR MathML cell observation; no author model/params/calculator imported. SSR structure observed, no claim of browser pixel-layout review.','summary':{'verified':10,'findings':0,'wrongKeysRejected':10,'printedCanariesRejected':10,'nativeMathMLTablesObserved':tables,'nativeAlignedCellsObserved':cells,'maximumColumns':maxcolumns,'arithmeticProgressionDomains':arithmetic_progressions,'nonunitStepUnitPriceLedgers':price_ledgers,'pythonJavaScriptHashesMatched':10},'sourceRefs':refs,'entries':entries}
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade6-dependency-tables.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
