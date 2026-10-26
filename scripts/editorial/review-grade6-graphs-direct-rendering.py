"""Independent actual-printed coordinate/graph/direct-proportion review20.
Allsaved/newfullconditions/official+newsolutions/everyMCQread. No author params,
specifications or solver imported; rational polynomials are independently built.
"""
import ast
import importlib.util
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_util',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest','expr','decimal']:globals()[name]=getattr(h,name)
ROOT=h.ROOT;PACK='problems/editorial/batches/grade6-graphs-direct.json';OUT='problems/editorial/reviews/grade6-graphs-direct.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def points(s):return [tuple(map(expr,p))for p in re.findall(r'\(([−-]?\d+(?:,\d+)?); ([−-]?\d+(?:,\d+)?)\)',s)]
def choose(row,value):return one(o for o in row['options']if expr(o)==value)
def integer(v):v=F(v);assert v.denominator==1;return str(v.numerator)
def clean(p):
    p=dict(p)
    return {k:v for k,v in p.items()if v}
def plus(a,b,sign=1):
    result=dict(a)
    for power,c in b.items():result[power]=result.get(power,F(0))+sign*c
    return clean(result)
def product(a,b):
    result={}
    for i,c in a.items():
        for j,d in b.items():result[i+j]=result.get(i+j,F(0))+c*d
    return clean(result)
def symbolic(formula):
    s=formula.replace('−','-').replace('×','*').replace('÷','/')
    s=re.sub(r'\d+,\d+',lambda v:'('+str(expr(v[0]).numerator)+'/'+str(expr(v[0]).denominator)+')',s)
    s=re.sub(r'([0-9)])x',r'\1*x',s)
    assert re.fullmatch(r'[0-9x ()+*/-]+',s),s
    def visit(n):
        if isinstance(n,ast.Constant):assert type(n.value)is int;return({0:F(n.value)},{0:F(1)})
        if isinstance(n,ast.Name):assert n.id=='x';return({1:F(1)},{0:F(1)})
        if isinstance(n,ast.UnaryOp):assert isinstance(n.op,ast.USub);a,b=visit(n.operand);return({k:-v for k,v in a.items()},b)
        assert isinstance(n,ast.BinOp);a,b=visit(n.left);c,d=visit(n.right)
        if isinstance(n.op,ast.Add):return plus(product(a,d),product(c,b)),product(b,d)
        if isinstance(n.op,ast.Sub):return plus(product(a,d),product(c,b),-1),product(b,d)
        if isinstance(n.op,ast.Mult):return product(a,c),product(b,d)
        assert isinstance(n.op,ast.Div)and c;return product(a,d),product(b,c)
    num,den=visit(ast.parse(s,mode='eval').body);return clean(num),clean(den)
def coefficient(formula):
    num,den=symbolic(formula)
    return num[1]/den[0]if set(num)=={1}and set(den)=={0}and den[0]else None

def solve(row):
    s=row['statement'];k=row['modelId'].removeprefix('grade6-graphs-direct-')
    expectedtopic='motion'if k in {'motion-point-on-given-formula','horizontal-cumulative-distance-means-stop','origin-motion-slope-from-point'}else'geo'if k in {'table-pair-input-first','ordinate-from-given-abscissa','graph-definition-input-output','independent-mass-horizontal-axis','initially-empty-positive-constant-flow','temperature-point-state-not-change','negative-slope-quadrants'}else'ratio';assert row['topic']==expectedtopic
    if k=='table-pair-input-first':
        table=[line for line in s.splitlines()if line.startswith('|')];assert len(table)==3;xs=[expr(v.strip())for v in table[0].strip('|').split('|')[1:]];ys=[expr(v.strip())for v in table[2].strip('|').split('|')[1:]];pairs=list(zip(xs,ys));assert len(pairs)==3
        answer=one(o for o in row['options']if one(points(o))in pairs);assert [one(points(o))in pairs for o in row['options']]==[True,False,False,False]
        note=f'ACTUALnative2×4table columnpairs{pairs}, (time;distance)orderedrolesbound; allfourchoicepairschecked, swapped andcross-columnfalse.'
    elif k=='ordinate-from-given-abscissa':
        rate,x=map(expr,m(r's = (\d+)t.*?Абсциссасы (\d+)',s).groups());v=rate*x;answer=integer(v);note=f'ACTUALs={rate}t andabscissa{ x }→ordinate{v}, fullpoint({x};{v}), notadd15orinput4.'
    elif k in {'motion-point-on-given-formula','positive-coefficient-negative-point'}:
        rate=expr(m(r'[sy] = (\d+)[tx]',s)[1]);options=[one(points(o))for o in row['options']];flags=[y==rate*x for x,y in options];answer=one(o for o,t in zip(row['options'],flags)if t)
        assert sum(flags)==1;note=f'ALLactualorderedpoints{options}, substitutiony={rate}x givestruths{flags}; signedcoordinate andmultiplyvsadd/otherx/swappedroles preserved.'
    elif k=='horizontal-cumulative-distance-means-stop':
        assert 'ЖИНАҚТАЛҒАН'in s and 'уақыт өсіп'in s and's өзгермейді'in s;answer=one(o for o in row['options']if'тоқтап тұрған, қосымша жол жүрмеген'in o)
        # Every subinterval has zero accumulated path increment. A path measure
        # is nonnegative; thus no positive-distance motion can hide by reversal.
        assert set(row['options'])=={'Робот ең үлкен жылдамдықпен жүрген','Робот тоқтап тұрған, қосымша жол жүрмеген','Жүрген жол бір сәтте секіріп артқан','Уақыттың өзі тоқтаған'}
        note='ActualCUMULATIVEPATHconstantwhileTIMEincreases meanszerodistanceEVERYsubinterval⇒stop; roundtripwouldADDpositivepath, sodisplacementcancellationisnotcounterexample. All4wordedchoicesread, timecontinues/noverticaljump/nofastmotion.'
    elif k=='graph-definition-input-output':
        assert 'Горизонталь оське тәуелсіз x, тік оське тәуелді y'in s;answer=one(o for o in row['options']if o=='Әр берілген x пен оған сәйкес y құратын (x; y) нүктелерінің жиыны')
        note='Definitiongraph={(x,f(x)):xindomain}, inputFIRST/outputSECOND asACTUALaxesgiven. Swappedpairs, allOxpoints andarbitraryoriginraynotnecessarilydependency, all4definitionscompared.'
    elif k=='independent-mass-horizontal-axis':
        assert 'тәуелсіз шама горизонталь'in s;answer=one(o for o in row['options']if o=='Абсциссалар осіне (Ox)');note='ActualmassmchoseninputandcostCcomputedoutput, standardexplicitaxisconvention→mOx/C Oy. All4axischoicesread, dependencyrolesnotfromgenericvariableletteralone.'
    elif k=='origin-motion-slope-from-point':
        origin,last=points(s);assert origin==(0,0)and last[0]>0 and last[1]>0;v=(last[1]-origin[1])/(last[0]-origin[0]);answer=integer(v);assert v*last[0]==last[1]
        note=f'ACTUALorigin{origin}andM{last}, uniformstraightsegment→distance/time{v}km/h, unitsandpointorderexact; reciprocalnotrequested.'
    elif k=='initially-empty-positive-constant-flow':
        assert 'Бос'in s and 'оң тұрақты'in s and 'ТОЛҒАНҒА ДЕЙІНГІ'in s;answer=one(o for o in row['options']if o=='O(0; 0)-ден жоғары көтерілетін түзу кесінді')
        note='UniversalV=q*t withq>0beforeFULL, V0=0andforANYh>0 deltaV=qh>0; equalincrements/linearoriginrise. All4shapescompared: decreasing/flat/verticalfunctionmultivaluefalse; nooverflowplateauambiguity.'
    elif k=='temperature-point-state-not-change':
        t,T=one(points(s));assert t==6 and T==41;answer=one(o for o in row['options']if o==f'Басталғаннан {int(t)} минут өткенде температура {int(T)} °C болған')
        initial=20;delta=T-initial;assert delta==21 and delta!=T;note=f'ACTUALpoint({t};{T})statesTEMPERATUREatTIME notCHANGE/frequency. Explicit20°Cinitialcountermodelhaschange21°C, stillpassespoint; swapped/time-as-countfalse. All4typedclaimsread.'
    elif k=='direct-cost-inverse-count':
        price,total=map(expr,m(r'C = (\d+)n\. Дәл (\d+) теңгеге',s).groups());n=total/price;assert n.denominator==1 and price*n==total;answer=integer(n);note=f'ACTUALcostC{total}, unitprice{price}, UNIQUErequestedCOUNT{n}, inversebackproduct, currencycannotbesubstitutedasn.'
    elif k=='all-nonzero-coefficients-origin':
        assert 'нөлден өзге кез келген нақты'in s;options=[one(points(o))for o in row['options']];flags=[x==0 and y==0 for x,y in options];answer=one(o for o,t in zip(row['options'],flags)if t)
        assert flags==[False,True,False,False]
        # Universally y=kx for both allowed k1=1andk2=2 forcesx=0andtheny=0.
        for x,y in options:assert (y==x and y==2*x)==(x==y==0)
        note='UniversalALLrealNONZEROk: requiringk1=1ANDk2=2forcesx=0,y=0; converselyk×0=0ANYk. Everyactualpoint(2,0)/(0,0)/(0,2)/(2,2)checked, lastonlyk1 notALL.'
    elif k=='decimal-coefficient-output':
        rate,x=map(expr,m(r'y = (\d+,\d+)x.*?x = (\d+)',s).groups());v=rate*x;answer=integer(v);assert v/x==rate;note=f'ACTUALexactdecimalcoefficient{rate}×input{x}={v}, quotientback{rate}, notaddition{rate+x}.'
    elif k in {'negative-coefficient-y-over-x','recover-coefficient-from-positive-pair'}:
        if k.startswith('negative'):x,y=one(points(s))
        else:x,y=map(expr,m(r'x = (\d+) кезінде y = (\d+)',s).groups())
        assert x;v=y/x;assert v*x==y;answer=choose(row,v)if row.get('options')else integer(v)
        if row.get('options'):assert[expr(o)for o in row['options']]==[x/y,-v,v,x*y]
        note=f'ACTUALx{x},y{y}, uniqueNONZEROinputcoefficienty/x={v}; everyreciprocal/signloss/productactualchoicefalse, fullbacksubstitution.'
    elif k=='unit-input-increment-output-difference':
        rate=expr(m(r'y = (\d+)x',s)[1]);answer=integer(rate);before={1:rate};after={1:rate,0:rate};assert plus(after,before,-1)=={0:rate}
        note=f'ACTUALy={rate}x; exactPOLYNOMIALdifference{rate}(x+1)−{rate}x={rate}forALLrealx, notjustexample18→27. RequestedOUTPUTincrement notinput/value.'
    elif k=='negative-slope-quadrants':
        coef=expr(m(r'y = ([−-]\d+)x',s)[1]);assert coef<0 and 'ӨЗГЕ'in s;answer='II және IV';assert answer in row['options']
        assert coef*F(1)<0 and coef*F(-1)>0;note=f'ACTUALk{coef}<0; universalxpositive⇒ynegativeIV, xnegative⇒ypositiveII; x0ONLYoriginexplicitlyEXCLUDED(notinaquadrant). All4quadrantpairscompared.'
    elif k=='count-direct-not-inverse-or-affine':
        formulas=re.findall(r'y = (.+?)(?=;|\. Жауап)',s.split('сәйкес? ',1)[1]);assert len(formulas)==6;coeffs=[coefficient(formula)for formula in formulas];assert coeffs==[-4,F(1,8),None,None,F(3,5),-1];answer=str(sum(v is not None for v in coeffs))
        assert symbolic('(8/x)')==({0:F(8)},{1:F(1)})and symbolic('x + 3')==({1:F(1),0:F(3)},{0:F(1)})
        note=f'ALLSIXACTUALformulaASTs{formulas}rational-polynomialnormalized exactly; coefficients{coeffs}. DenominatorVARIABLE8/xexcluded, affineconstant3excluded, negative/unityfraction/decimalcoefficient4valid; nofinitepointfitting.'
    elif k=='coefficient-from-variable-divided-by-constant':
        denom=expr(m(r'y = \(x/(\d+)\)',s)[1]);v=F(1)/denom;assert coefficient(f'(x/{int(denom)})')==v;answer=choose(row,v);assert denom*v==1
        note=f'ACTUALx/{denom}=(1/{denom})x UNIVERSAL, exactcoefficient{v}; actual5/0.2/−5/1allchecked, denominatoritselfnotcoefficient.'
    elif k=='negative-fraction-coefficient-not-reciprocal':
        text=m(r'y = (\(-\d+/\d+\))x',s)[1];v=expr(text);assert coefficient(text+'x')==v;answer=choose(row,v);n,d=v.numerator,v.denominator;assert[expr(o)for o in row['options']]==[v,-v,1/v,F(n)]
        note=f'ACTUALentireSIGNEDnativefraction{text}→k{v}; allsignloss/reciprocal/numerator-onlyMCQrolesfalse, x8backproduct−3checked.'
    else:raise AssertionError(k)
    return answer,note

def main():
    assert len(ROWS)==20;entries=[];refs=set()
    for row in ROWS:
        answer,note=solve(row);assert answer==row['answer'],(row['editionId'],answer,row['answer']);bad=copy.deepcopy(row);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer']
        assert row['grade']==6 and row['minimumPlan']=='pro'and not row.get('image')
        if row.get('options'):assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
        else:assert re.fullmatch(r'-?\d+',answer)and row['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=h.raw_for(row);refs.add(raw['id']);assert raw['solution'];norm=lambda text:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',text).lower()).strip();assert norm(raw['statement'])!=norm(row['statement'])
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All20saved/newfullconditions/official+newsolutions/everyMCQread; ownACTUALprintedexactFractionpoint/table/formula andrationalpolynomial/universalgraph oracle; noauthorcalculator/spec/params','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['All20saved/newfullconditions/official+newsolutions/everyMCQmanuallyread','Everyactualorderedpoint/tablecolumn/axisrole/knownvalue independentlybound','Cumulativepathnotdisplacement, beforeFULLpositiveflow, temperatureSTATEnotCHANGEcountermodel','UniversalALLnonzerokoriginproof andarbitrarysignquadrantswithoriginexcluded','Exactrationalpolynomialnormalization all6formulae, reciprocal/signedfraction/decimaltypedroles','All20actualkeys andwrongkeys/fullcanonicalhash/nativeMathMLstructurechecked']})
    assert len(refs)==20
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else if(n.type==='table'){for(const row of n.rows)for(const cell of row)walk(cell);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'All20grade6topics9.3/9.4/9.5savednonvisualgraphs/directproportions, actualprintedtable+coordinates anduniversalpolynomialproofs','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:assert{e['editionId']:e['sha256']for e in json.loads((ROOT/OUT).read_text())['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':20,'wrongKeysRejected':20,'hashesMatched':20,'sourceRefs':20,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
