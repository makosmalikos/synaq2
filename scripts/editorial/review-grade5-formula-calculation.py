"""All44 saved/new full conditions, solutions and MCQs; exact SI/geometry checks.
Same root authored both: separate computational review, not separate human/agent.
Printed givens only: no author JS/model/params oracle. Includes actual fitting
tilings, closed boundary posts, painted lattice interiors and symbolic scales.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];BATCH='problems/editorial/batches/grade5-formula-calculation.json';REPORT='problems/editorial/reviews/grade5-formula-calculation.json'
sp=importlib.util.spec_from_file_location('equation_helpers',ROOT/'scripts/editorial/review-grade5-equations.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one,expr,calc=H.one,H.expr,H.calc
def nums(s):return H.nums(H.H.H.clean(s))
def options(r):return H.options(r)
def symbolic_formula(r,wanted):
 expected=expr(wanted);values=[]
 for o in options(r):
  left,right=H.H.math(o).split('=');values.append(expr(right).equals(expected))
 answer=options(r)[one(i for i,v in enumerate(values)if v)];assert H.H.math(r['answer'])==H.H.math(answer)
 return {'answer':answer,'allFormulaIdentities':values,'targetRHS':wanted}
def named(r,wanted):return H.choice(r,lambda o:H.H.H.clean(o)==H.H.H.clean(wanted))
def numeric(r,value,expected=None):
 assert nums(r['answer'])==[value],(r['answer'],value)
 if options(r):
  values=[one(nums(o))for o in options(r)];assert values.count(value)==1
  if expected is not None:assert sorted(values)==sorted(expected),(values,expected)
 return str(value)
def boundary(a,b):
 assert a.denominator==b.denominator==1 and min(a,b)>0
 a,b=int(a),int(b);cells=set(itertools.product(range(a),range(b)))
 return sum((x+dx,y+dy)not in cells for x,y in cells for dx,dy in[(1,0),(-1,0),(0,1),(0,-1)])
def solve(r,i,source=False):
 s=r['statement'];n=nums(H.H.H.clean(s));proof={'printedNumbers':list(map(str,n))};expected=None
 if i in{0,37}:a=one(n);out=F(boundary(a,a));expected=[out,a*a,2*a,a+4]if i==37 else None
 elif i==1:
  a=one(n);out=a*a*a;expected=[out,3*a,a*a,12*a]
 elif i in{2,9,38}:a,b=n;out=a*b
 elif i in{3,20}:
  parts=H.H.H.math_parts(s,source);formula=next(p for p in parts if'='in p);rhs=formula.split('=',1)[1];env=H.H.H.assignments(s);out=calc(rhs,env);proof.update(formula=formula,assignments={v:str(x)for v,x in env.items()})
 elif i==4:
  proof.update(symbolic_formula(r,'2*(a+b)'if source else'2*(l+w)'));return proof
 elif i==5:
  proof['answer']=named(r,'Қозғалыс уақытын'if source else'Қозғалысқа кеткен уақытты');return proof
 elif i==6:
  # The inclusive square definition is true; converse counterexamples and cube topology are fixed facts.
  assert boundary(F(7),F(3))==20 and 7!=3 and len(list(itertools.product((0,1),repeat=3)))==8
  cubeEdges=[(a,b)for a,b in itertools.combinations(itertools.product((0,1),repeat=3),2)if sum(x!=y for x,y in zip(a,b))==1];assert len(cubeEdges)==12
  proof.update(answer=named(r,'Кез келген квадрат — тік төртбұрыш'if source else'Әр шаршы тіктөртбұрыш болады'),cubeEdges=12,cubeVertices=8,counterexampleRectangle=[7,3]);return proof
 elif i==7:
  proof.update(symbolic_formula(r,'s/v'if source else'd/u'));return proof
 elif i==8:
  a=one(n);out=a*a;expected=[out,4*a,2*a,F(str(int(a))+str(int(a)))]
 elif i==10:a,t=n;assert t>0;out=a/t
 elif i==11:proof.update(symbolic_formula(r,'a*b*c'if source else'l*w*h'));return proof
 elif i==12:a,b=n;out=F(boundary(a,b))
 elif i==13:
  factor=n[-1]if source else n[1];assert factor>1
  p=expr(f'({factor}*a)*n');q=expr(f'{factor}*(a*n)');assert p.equals(q)
  proof.update(answer=named(r,f'{factor} есе артады'),universalCostIdentity=True);return proof
 elif i==14:
  count,total,discount,newCount=n;price=total/count;assert price>discount>0;out=(price-discount)*newCount;expected=[out,price*newCount,price*newCount-discount,price*(newCount-1)];proof['unitPrices']=list(map(str,[price,price-discount]))
 elif i==15:
  cash,a,na,b,nb=n;spent=a*na+b*nb;out=cash-spent;assert out>=0 and out+spent==cash;proof['spentByProduct']=list(map(str,[a*na,b*nb]))
 elif i==16:
  P=one(n);side=P/4;assert F(boundary(side,side))==P;out=side*side;expected=[out,(P/2)**2,P**2,4*P];proof['recoveredSide']=str(side)
 elif i==17:
  t1,v1,t2,v2=n;out=t1*v1+t2*v2;assert (t1+t2)*min(v1,v2)<=out<=(t1+t2)*max(v1,v2);proof['independentSegmentDistances']=list(map(str,[t1*v1,t2*v2]))
 elif i==18:
  metresL,metresW,side=n;L,W=10*metresL,10*metresW;assert L%side==0 and W%side==0
  tiles=[set(itertools.product(range(x,x+int(side)),range(y,y+int(side))))for x in range(0,int(L),int(side))for y in range(0,int(W),int(side))]
  filled=set()
  for tile in tiles:assert not filled&tile;filled|=tile
  assert filled==set(itertools.product(range(int(L)),range(int(W))));out=F(len(tiles));proof['actualDisjointTilesCoverFloor']=len(tiles)
 elif i==19:
  a,b,loops=n;P=F(boundary(a,b));out=P*loops;expected=[out,P,(a+b)*loops,a*b*loops]
 elif i==21:
  area,length=n;width=area/length;assert width>0 and length*width==area;out=F(boundary(length,width));proof['missingWidth']=str(width)
 elif i==22:
  distance,time,newDistance=n;speed=distance/time;out=newDistance/speed;expected=[out,(newDistance-distance)/speed,time+out,speed/10];proof['speed']=str(speed)
 elif i==23:
  volume,height,length=n;out=volume/height/length;assert min(out,height,length)>0 and out*height*length==volume
 elif i==24:
  dm=one(n);cm=10*dm;out=cm**3;expected=[out,dm**3,out/10,cm*cm];proof['sideCentimetres']=str(cm)
 elif i==25:
  P,length=n;out=P/2-length;assert out>0 and F(boundary(length,out))==P;expected=[out,P-length,P-2*length,P/2]
 elif i==26:
  area,litres=n[:2];out=litres*1000/(area*10000);assert out>0;proof['normalizedCubicCmAndSquareCm']=list(map(str,[litres*1000,area*10000]));assert area*10000*out==litres*1000
 elif i==27:
  metres,smallDm=n;dm=10*metres;perAxis=dm/smallDm;assert perAxis.denominator==1
  count=len(list(itertools.product(range(int(perAxis)),repeat=3)));out=F(count)*smallDm/10
  expected=[out,perAxis**2*smallDm/10,F(count)*smallDm,6*perAxis**2*smallDm/10];proof.update(actualCubeGrid=count,heightDm=str(count*smallDm),heightM=str(out))
 elif i==28:
  a,b,t,remaining=n;out=a*t+b*t+remaining;proof['tripAndRemainingLedger']=list(map(str,[a*t,b*t,remaining]));assert remaining>0
 elif i==29:
  a,b,step=n;assert a%step==b%step==0
  posts={(F(x),y)for x in range(0,int(a)+1,int(step))for y in[F(0),b]}|{(x,F(y))for x in[F(0),a]for y in range(0,int(b)+1,int(step))}
  out=F(len(posts));proof['actualUniqueBoundaryPostCoordinates']=[[str(x),str(y)]for x,y in sorted(posts)]
 elif i==30:
  area=n[0];pairs=[(a,int(area)//a)for a in range(1,math.isqrt(int(area))+1)if area%a==0];out=F(len(pairs));divisors=sum(1 for a in range(1,int(area)+1)if area%a==0)
  expected=[out,out-1,F(divisors),out+1];assert any(a==b for a,b in pairs);proof['everyUnorderedNaturalPair']=pairs
 elif i==31:
  fast,slow,t=n;assert fast>slow>0;out=fast*t-slow*t;proof['separateTravelDistances']=list(map(str,[fast*t,slow*t]))
 elif i==32:
  edge,small=n[:2];perAxis=edge/small;assert perAxis.denominator==1 and perAxis>=3
  interior=[p for p in itertools.product(range(int(perAxis)),repeat=3)if all(0<t<int(perAxis)-1 for t in p)]
  out=F(len(interior));expected=[out,perAxis**3,(perAxis-1)**3,perAxis**2];proof['actualInteriorCubeCoordinates']=interior
 elif i==33:
  lengthFactor,heightFactor,total=n;width=total/(1+lengthFactor+heightFactor);length=lengthFactor*width;height=heightFactor*width
  assert length+width+height==total and min(length,width,height)>0;out=length*width*height;expected=[out,length*width*width,length*length,width*total];proof['reconstructedDimensions']=list(map(str,[length,width,height]))
 elif i==34:
  countA,countB1,total1,countA2,countB2,total2=n;assert countA==countA2 and countB2>countB1
  priceB=(total2-total1)/(countB2-countB1);priceA=(total1-countB1*priceB)/countA;assert min(priceA,priceB)>0
  assert countA*priceA+countB1*priceB==total1 and countA2*priceA+countB2*priceB==total2;out=priceA;proof['bothPrices']=list(map(str,[priceA,priceB]))
 elif i==35:
  a,b=n;scale=a*b;assert expr(f'({a}*l)*({b}*w)').equals(expr(f'{scale}*(l*w)'))
  proof['answer']=named(r,f'{scale} есе артады');proof['universalAreaScale']=str(scale);return proof
 elif i==36:a,b=n;out=a*b
 elif i==39:
  dm,width,height=n;out=10*dm*width*height;expected=[out,dm*width*height,out*10,dm+width+height];proof['normalizedDimensionsCm']=list(map(str,[10*dm,width,height]))
 elif i==40:
  P,width=n;length=P/2-width;assert length>0 and F(boundary(length,width))==P;out=length*width;proof['recoveredLength']=str(length)
 elif i==41:
  amount,cost,budget=n;price=cost/amount;out=budget/price;assert out.denominator==1;expected=[out,out-1,out+2,out-2];proof['pricePerKilogram']=str(price)
 elif i==42:
  length,width=n;P=F(boundary(length,width));side=P/4;squareArea=side*side;rectangleArea=length*width;gap=squareArea-rectangleArea;assert gap>0 and gap==(length-width)**2/4
  wanted=f'Квадраттың ауданы ${gap}$ см²-ге үлкен'if source else f'Шаршының ауданы {gap} см²-ге үлкен'
  proof.update(answer=named(r,wanted),commonPerimeter=str(P),squareSide=str(side),squareArea=str(squareArea),rectangleArea=str(rectangleArea));return proof
 elif i==43:
  factor=one(n);scale=factor**3;assert expr(f'({factor}*a)*({factor}*a)*({factor}*a)').equals(expr(f'{scale}*(a*a*a)'))
  expected=[scale,factor,factor**2,2*factor];assert sorted(one(nums(o))for o in options(r))==sorted(expected)
  proof.update(answer=named(r,f'${scale}$ есе артады'if source else f'{scale} есе артады'),universalVolumeScale=str(scale));return proof
 else:raise AssertionError(i)
 proof['answer']=numeric(r,out,expected);return proof
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==44;entries=[];evidence=[];canaries=0;equalities=0
 for i,r in enumerate(rows):
  try:proof=solve(r,i)
  except Exception as e:raise AssertionError(('NEW',i))from e
  ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one(q for q in cap['questions']if q['id']==ref['sourceId']);assert cap['grade']==5 and cap['status']=='captured'and q['checked']and not q.get('images')and not q.get('svg')
  try:sourceProof=solve({**q,'answer':q['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('SOURCE',i))from e
  if q.get('options'):assert H.H.math(one(o['text']for o in q['options']if o['correct']))==H.H.math(q['sourceAnswer'])
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and not r.get('image')and not re.search(r'[\\$]',r['statement']+r['solution'])
  if not options(r):assert'options'not in r and re.fullmatch(r'\d+',r['answer'])
  else:assert len(options(r))==len(set(options(r)))==4 and options(r).count(r['answer'])==1
  pattern=r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+−×÷]\s*\d+)+)\s*=\s*(-?\d+)(?!\d|\s*[+−×÷*/A-Za-z])'
  for m in re.finditer(pattern,r['solution']):
   before=r['solution'][:m.start()].rstrip()
   if before and(before[-1]in'0123456789()+−×÷*/-'or before[-1].isascii()and before[-1].isalpha()):continue
   assert calc(m[1])==F(m[2]),('solution equality',i,m.group());equalities+=1
  bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError,KeyError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  bad=copy.deepcopy(r)
  if i in{4,5,6,7,11}:bad['options'][bad['options'].index(bad['answer'])]='0'
  elif i==13:bad['statement']=bad['statement'].replace('баға 4 есе','баға 5 есе')
  elif i==30:bad['statement']=bad['statement'].replace('64','81')
  elif i==29:bad['statement']=bad['statement'].replace('60','66')
  else:
   m=re.search(r'\d+',bad['statement']);assert m;bad['statement']=bad['statement'][:m.start()]+str(int(m.group())+1)+bad['statement'][m.end():]
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,KeyError):canaries+=1
  else:raise AssertionError(('printedcanaryaccepted',i))
  evidence.append({'editionId':r['editionId'],'rewritten':proof,'savedSource':sourceProof});entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'all source/new full text and MCQs; exact SI normalization, physical grids/tilings/interiors/posts, symbolic universal scaling, printed travel/cost ledgers; not separate human review','notes':[json.dumps(proof,ensure_ascii=False)]})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':44,'findings':0,'allSavedNewConditionsSolutionsMCQsRead':44,'wrongKeysRejected':44,'printedGivensOrTargetsCanariesRejected':canaries,'newSolutionNumericEqualitiesVerified':equalities,'actualTilingPostsAndInteriorEnumerated':True,'exactUniversalScalingProofs':True,'pythonJavaScriptHashesMatched':44,'nativeFractions':check['fractions'],'separateHumanReviewer':False}
 report={'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','batch':BATCH,'scope':__doc__,'summary':summary,'evidence':evidence,'entries':entries}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary,ensure_ascii=False))
if __name__=='__main__':main()
