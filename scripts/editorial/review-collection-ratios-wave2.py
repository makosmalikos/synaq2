"""Independent39 saved/new fullconditions/officialsolutions/every-MCQ review.
Actual printed exact Fraction/AST, no author calculator/spec/renderer imports.
Canonical source references use question.number scoped by source file.
"""
from pathlib import Path
from fractions import Fraction as F
from math import gcd,isqrt
from collections import Counter
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/collection-ratios-wave2.json';OUT='problems/editorial/reviews/collection-ratios-wave2.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def nums(s):return[F(n.replace(',','.'))for n in re.findall(r'\d+(?:,\d+)?',s)]
def whole(x):
 x=F(x);assert x.denominator==1,x
 return x.numerator
def fmt(x):
 x=F(x);sign='-'if x<0 else'';x=abs(x);w=x.numerator//x.denominator;rem=x.numerator%x.denominator;ds=''
 while rem:
  assert len(ds)<12;rem*=10;ds+=str(rem//x.denominator);rem%=x.denominator
 return sign+str(w)+(','+ds if ds else'')
def ratio(a,b):
 q=F(a,b);assert q>0
 return f'{q.numerator} : {q.denominator}'
def calc(s,env=None):
 env=dict(env or{});count=0
 def decimal(m):
  nonlocal count
  name='DECIMAL'+str(count);count+=1;env[name]=F(m.group().replace(',','.'));return name
 s=re.sub(r'\d+,\d+',decimal,s);s=re.sub(r'(?<=\d)(?=[a-z])','*',s);s=re.sub(r'(?<=\))(?=[a-z])','*',s)
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
  if isinstance(n,ast.Name):return F(env[n.id])
  if isinstance(n,ast.UnaryOp):assert isinstance(n.op,(ast.USub,ast.UAdd));return-walk(n.operand)if isinstance(n.op,ast.USub)else walk(n.operand)
  assert isinstance(n,ast.BinOp)and isinstance(n.op,(ast.Mult,ast.Div,ast.Add,ast.Sub)),ast.dump(n)
  a,b=walk(n.left),walk(n.right)
  return a*b if isinstance(n.op,ast.Mult)else a/b if isinstance(n.op,ast.Div)else a+b if isinstance(n.op,ast.Add)else a-b
 return walk(ast.parse(s.replace('×','*').replace(':','/').replace('−','-').strip(),mode='eval'))
def linear_root(equation,var='x',env=None):
 lhs,rhs=equation.split(' = ');env=env or{}
 f=lambda x:calc(lhs,{**env,var:x})-calc(rhs,{**env,var:x})
 constant=f(0);coefficient=f(1)-constant;assert coefficient!=0
 root=-constant/coefficient;assert f(root)==0 and f(2)==2*coefficient+constant
 return root
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def printed_prime_powers(r,largest=False):
 # Validate the actual printed factorizations, then independently combine their
 # multiplicities. The primary key oracle separately enumerates divisors/multiples.
 separator=','if largest else';'
 m=re.match(r'^(\d+) = ([\d ×]+)'+separator+r' (\d+) = ([\d ×]+)\.',r['solution']);assert m,r['solution']
 left,lf,right,rf=m.groups();assert calc(lf)==int(left)and calc(rf)==int(right)
 a,b=Counter(map(int,re.findall(r'\d+',lf))),Counter(map(int,re.findall(r'\d+',rf)))
 for p in set(a)|set(b):assert p>=2 and not any(p%d==0 for d in range(2,isqrt(p)+1))
 product=1
 for p in set(a)|set(b):product*=p**(max(a[p],b[p])if largest else min(a[p],b[p]))
 assert str(product)==r['answer']
 return product
def solve(r):
 k=r['skillFamily'];s=r['statement'];n=nums(s);os=r.get('options',[]);a=v=None;suffix=''
 if k=='sum-of-three-to-extreme-difference':
  x,y,z,total=n;unit=total/(x+y+z);v=(z-x)*unit;assert x<y<z;note=f'Actualparts{x*unit}/{y*unit}/{z*unit}sum{total}; requestedEXTREMEGAP{v}, notsum.'
 elif k=='align-common-middle':
  x,y,y2,z=n;triple=[x*y2,y*y2,y*z];g=gcd(gcd(whole(triple[0]),whole(triple[1])),whole(triple[2]));triple=[whole(x/g)for x in triple];a=one([o for o in os if nums(o)==triple]);assert F(triple[0],triple[1])==x/y and F(triple[1],triple[2])==y2/z;note=f'Actualcommonmiddle{x}:{y}and{y2}:{z}→{triple}; bothrelationsandprimitivegcdchecked.'
 elif k=='transfer-between-two-not-spending':
  x,y,transfer=n;unit=2*transfer/(x-y);first=x*unit;second=y*unit;v=first+second;assert first-transfer==second+transfer and'сыртқа жұмсалмады'in s;note=f'ActualTRANSFER{transfer}subtractsFIRSTandaddsSECOND; initial{first}/{second}, equalafter{first-transfer}; sum{v}conserved, GAPisTWICEtransfer.'
 elif k=='add-second-alloy-to-equality':
  total,x,y=n;first=total*x/(x+y);second=total*y/(x+y);v=first-second;assert v>0;note=f'ActualONLYSECOND+{v}equalizesconstantFIRST{first}; oldsecond{second}, finaltotal{total+v}, notoldtotalfixed.'
 elif k=='joint-reciprocal-pipe-time':
  t1,t2=n;v=1/(1/t1+1/t2);assert v/t1+v/t2==1 and v<min(t1,t2);note=f'Actualunitworkrates1/{t1}+1/{t2}, jointtime{v}; bothcontributionssum1, nottimesSUM/mean.'
 elif k=='map-centimetres-to-kilometres':
  unit,scale,cm=n;assert unit==1;v=cm*scale/100000;note=f'Actualscale1:{scale}, printed{cm}CM→{cm*scale}CM→{v}KM using100×1000, notmetresonly.'
 elif k=='right-triangle-larger-acute':
  x,y=n;v=90*max(x,y)/(x+y);assert 0<v<90;note=f'ActualRIGHTanglealready90°, remainingACUTESsum90, weights{x}/{y}, LARGERacute{v}not180split.'
 elif k=='given-fraction-to-other-first-ratio':
  first,whole_n=n;a=one([o for o in os if o==ratio(whole_n-first,first)]);note=f'ActualGIRLS/WHOLE{first}/{whole_n}, remainingBOYS{whole_n-first}; requestedBOYS:GIRLS={a}, notgivenpartwhole.'
 elif k=='sum-of-three-squares-to-largest':
  x,y,z,squares=n;unit2=squares/(x*x+y*y+z*z);unit=isqrt(whole(unit2));assert unit>0 and unit*unit==unit2;values=[x*unit,y*unit,z*unit];v=max(values);assert sum(x*x for x in values)==squares;note=f'ActualSUMOFSQUARES{squares}, positiveunitroot{unit}, numbers{values}, largest{v}; notordinarySUM.'
 elif k=='common-middle-plus-total':
  x,y,y2,z,total=n;weights=[x*y2,y*y2,y*z];unit=total/sum(weights);values=[w*unit for w in weights];v=values[1];assert values[0]/values[1]==x/y and values[1]/values[2]==y2/z;note=f'ActualchainANDtotal{total}→{values}; requestedMIDDLEy{v}, notouter/membercoefficient.'
 elif k=='past-age-ratio-older-now':
  x,y,years,px,py=n;unit=years*(py-px)/(py*x-px*y);v=x*unit;child=y*unit;assert child>years and (v-years)/(child-years)==px/py;note=f'ActualNOWages{v}/{child}, BOTH−{years}→{v-years}/{child-years}; requestedOLDERNOW, notfuture/child.'
 elif k=='equal-cost-inverts-count-ratio':
  count1,count2=n;a=one([o for o in os if o==ratio(count2,count1)]);note=f'Actual{count1}p={count2}d givesPRICEp/d={count2}/{count1}; orderedCOUNTinverted, notsameascount.'
 elif k=='opposite-meeting-ratio-slower-distance':
  d,slow,fast=n;v=d*slow/(slow+fast);assert v/(d-v)==slow/fast;note=f'ActualSAMEelapsedmeetingpathsratio{slow}:{fast}, whole{d}, SLOWpath{v}, FAST{d-v}.'
 elif k=='rectangle-two-opposite-scale-factors':
  length,width=n;a=one([o for o in os if o==ratio(length,width)]);note=f'Formalnewdimensionslength×{length}, width÷{width}; AREAnew/old={length}/{width}; noadd/square/reverse.'
 elif k=='three-unit-fraction-shares-largest':
  total,one1,d1,one2,d2,one3,d3=n;assert one1==one2==one3==1;weights=[F(1,d1),F(1,d2),F(1,d3)];values=[total*w/sum(weights)for w in weights];v=max(values);assert sum(values)==total;note=f'ActualRECIPROCALweights{weights}→shares{values}, largest{v}; greatestdenominatorgivesLEASTweight.'
 elif k=='split-given-angle-two-parts':
  angle,x,y=n;small=angle*min(x,y)/(x+y);large=angle-small;a=one([o for o in os if nums(o)==[small,large]]);note=f'ActualgivenANGLE{angle}, not180/360; orderedSMALL/LARGE{small}/{large}sumangleandratio{x}:{y}.'
 elif k=='rectangle-longer-side-from-perimeter':
  x,y,perimeter=n;unit=perimeter/(2*(x+y));v=max(x,y)*unit;note=f'ActualhalfPERIMETER{perimeter/2}, sides{x*unit}/{y*unit}, requestedLONG{v}, notshort/doubled.'
 elif k=='mixed-denominators-proportion-shift':
  equation=s.split(': ',1)[1].rstrip('.');root=linear_root(equation);a=one([o for o in os if calc(o)==root]);assert root>0;note=f'Actualnestedmixeddenominators equation{equation}; independentFractionaffineroot{root}, all4printedchoicesbacksubtested, WHOLEmixedpartretained.'
 elif k=='coefficient-in-first-numerator':
  equation=s.split(': ',1)[1].rstrip('.');v=linear_root(equation);note=f'Actualequation{equation}, affineroot{v}; numeratorcoefficient3included, xnot3x.'
 elif k=='constant-density-known-mass-to-volume':
  volume,mass,target=n;v=target*volume/mass;suffix=' м³';assert v*mass/volume==target;note=f'Actualconstantdensity{mass/volume}t/m³; targetMASS{target}→VOLUME{v}, directnotinverse.'
 elif k=='repack-fixed-total-inverse':
  boxes,each,nextboxes=n;v=boxes*each/nextboxes;assert v*nextboxes==boxes*each;note=f'ActualFIXEDobjects{boxes*each}, newboxes{nextboxes}, EACH{v}; inverseallocation.'
 elif k=='constant-density-decimal-product':
  volume,mass,target=n;v=mass*target/volume;suffix=' т';note=f'Actualdensity{mass/volume}t/m³×NEWvolume{target}→{v}t, exactnorounding.'
 elif k=='mixed-reciprocal-proportion-requested-multiple':
  equation=s.split(' теңдеуінде')[0];lhs,rhs=equation.split(' = ');root=calc(lhs,{'x':1})/calc(rhs);assert root!=0 and calc(lhs,{'x':root})==calc(rhs);multiple=F(one(re.findall(r'(\d+)x мәнін',s)));v=root*multiple;note=f'ActualinverseXdenominatorequation{equation}; nonzeroroot{root}, requested{multiple}x={v}; notrootitself.'
 elif k=='signed-decimal-proportion':
  m=re.search(r'x : \((-[0-9]+,[0-9]+)\) = ([0-9]+,[0-9]+) : ([0-9]+,[0-9]+)',s);assert m;d,u,w=[F(x.replace(',','.'))for x in m.groups()];v=d*u/w;assert v/d==u/w and v<0;note=f'ActualNEGATIVEdivisor{d}, positivequotient{u/w}→negativeX{v}; backsubtwonegativesgivespositive.'
 elif k=='constant-speed-multiple-time':
  minutes,distance,multiple=n;v=distance*multiple;assert F(v,minutes*multiple)==distance/minutes;note=f'Actualfixedspeed{distance/minutes}, timeSCALE{multiple}, distance{v}; baseMINUTESlegitimatelycancel.'
 elif k=='reduce-workers-increases-time':
  workers,hours,reduction=n;new=workers/reduction;assert whole(new)>0;v=hours*reduction;assert new*v==workers*hours;note=f'Actualfixedwork{workers*hours}personhours, workers{workers}→{new}, time{hours}→{v}; workerbaselinecancelsbutcountmustintegral.'
 elif k=='proportion-root-then-division':
  equation=s.split(' теңдеуін')[0];root=linear_root(equation);target=one(re.findall(r'\(x/\d+\)',s));v=calc(target,{'x':root});note=f'Actual{equation}root{root}, requested{target}={v}; keynotroot.'
 elif k=='two-affine-numerators-request-expression':
  equation=s.split(' теңдігі')[0];root=linear_root(equation);target=one(re.findall(r'\d+x − \d+,\d+ өрнегін',s)).removesuffix(' өрнегін');v=calc(target,{'x':root});note=f'ActualBOTHaffinenumerators equation{equation}; root{root}, requested{target}={v}, notx/partial2x.'
 elif k=='room-volume-then-proportional-air-mass':
  knownv,knownm,length,width,height=n;volume=length*width*height;v=volume*knownm/knownv;note=f'ActualROOM3dimensionsvolume{volume}m³×givenmodeldensity{knownm/knownv}kg/m³→{v}kg; volumeBEFOREmass.'
 elif k=='equal-filled-cup-mass-proportion':
  mass,cups,target=n;per=mass/cups;v=target/per;assert v*per==target;note=f'ActualequalFILL{per}g/cup, requestedtarget{target}g→{v}CUPS; declaredfillassumptionremovescontainerambiguity.'
 elif k=='fabric-fixed-consumption-item-count':
  items,metres,target=n;per=metres/items;v=target/per;assert v*per==target;note=f'ActualfixedCONSUMPTION{per}m/item (wasteincluded), target{target}m→{v}items; noceil/floorgapbecauseexact.'
 elif k=='inscribed-angle-rule-given-arc-ratio-gap':
  weights=n;assert'сол төбені қамтымайтын'in s and'ЖАРТЫСЫНА'in s;arcs=[360*w/sum(weights)for w in weights];angles=sorted(a/2 for a in arcs);v=angles[-1]-angles[-2];assert sum(angles)==180 and 0<min(angles)<=max(angles)<180;suffix='°';note=f'ActualnonvertexoppositeARCshalvedperGIVENrule; arcs{arcs}, triangleangles{angles}; requestedlargest−middle{v}°, notARCgap{2*v}.'
 elif k=='split-symbolic-fraction-substitute-given-ratio':
  assert'b ≠ 0'in s;m=re.search(r'және (.+) = (.+)\. (.+) өрнегінің',s);assert m;given,targetvalue,target=m.groups();coefficient=calc(given,{'a':1,'b':1});known=calc(targetvalue);avalue=known/coefficient;v=calc(target,{'a':avalue,'b':1})
  for b in[F(1),F(-2),F(5,3)]:assert calc(given,{'a':avalue*b,'b':b})==known and calc(target,{'a':avalue*b,'b':b})==v
  note=f'ActualGIVEN{given}={known}; requested{target}={v}forALLnonzerob viaa={avalue}b; exactsignedsplitnotabsolutevalues.'
 elif k=='two-numbers-ordered-complete-pair':
  x,y,total=n;unit=total/(x+y);pair=[x*unit,y*unit];a=one([o for o in os if nums(o)==pair]);assert pair[0]+pair[1]==total and pair[0]/pair[1]==x/y;note=f'ActualorderedFIRST/SECOND{pair}; BOTHsum{total}ANDratio{x}:{y}, all4candidatepairschecked.'
 elif k=='equal-fractions-mixed-decimal-denominators':
  assert'a, b — оң сандар'in s;equation=s.split('оң сандар. ')[1].split('. (a/b)')[0];root=linear_root(equation,'a',{'b':1});v=root;assert v>0
  lhs,rhs=equation.split(' = ')
  for b in[F(1),F(3),F(7,2)]:assert calc(lhs,{'a':v*b,'b':b})==calc(rhs,{'a':v*b,'b':b})
  note=f'ActualMIXEDdecimaldenominators{equation}; bothpositive, universalratioa/b={v}; denominatorNOTinverse, no0/0ambiguity.'
 elif k=='liquid-mass-to-decimal-volume':
  litres,mass,target=n;v=litres*target/mass;suffix=' л';assert v*mass/litres==target;note=f'Actualconstantmassperlitre{mass/litres}, targetMASS{target}→VOLUME{v}L, exactdecimalratio.'
 elif k=='greatest-common-divisor-prime-powers':
  x,y=map(whole,n);common=[d for d in range(1,min(x,y)+1)if x%d==y%d==0];v=max(common);assert gcd(x//v,y//v)==1 and printed_prime_powers(r)==v
  note=f'CompleteCOMMONDIVISORenumeration{x}/{y}: {common}; max{v}, quotients{x//v}/{y//v}coprime. Independentofauthorminimalprimepoweralgorithm.'
 elif k=='least-common-multiple-maximal-prime-powers':
  x,y=map(whole,n);v=one([m for m in range(max(x,y),x*y+1,max(x,y))if m%x==m%y==0][:1]);assert not any(m%x==m%y==0 for m in range(1,v))and printed_prime_powers(r,True)==v
  note=f'Completepositiveintegersearch1..{v}firstcommonmultiple{x}/{y}is{v}; divisions{v//x}/{v//y}, independentofauthormaximalprimepoweralgorithm.'
 elif k=='triangle-two-ratios-decimal-perimeter-target-middle':
  x,y,y2,z,perimeter=n;weights=[x*y2,y*y2,y*z];unit=perimeter/sum(weights);sides=[w*unit for w in weights];v=sides[1];assert 2*max(sides)<perimeter and sides[0]/sides[1]==x/y and sides[1]/sides[2]==y2/z;note=f'ActualTWOorderedratiosplusdecimalP{perimeter}→AB/BC/AC{sides}; requestedBC{v}, stricttriangleinequalityall, nocommonmiddlemistake.'
 else:raise AssertionError(k)
 if a is None:
  value=fmt(v);a=value+suffix
  if os:a=one([o for o in os if o==a])
  else:assert re.fullmatch(r'\d+',a)
 assert r['answer']==a,(r['editionId'],r['answer'],a)
 return note
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==39
 entries=[];refs=set();files=set()
 for r in rows:
  ref=one(r['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['sourceReviewCaptured'];raw=one([q for q in source['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution']and not raw.get('images')and not raw.get('svg');refs.add((ref['sourceFile'],ref['sourceId']));files.add(ref['sourceFile'])
  norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(r['statement']);note=solve(r);assert r['grade']==6 and r['minimumPlan']=='pro'
  if'options'in r:assert len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  else:assert re.fullmatch(r'\d+',r['answer'])and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent actualprinted exactFraction/AST, completecandidate/domains; all39canonicalfile-scopedraw/new/fullsolutions/everyMCQread; noauthorcalculatorimported','notes':note})
 assert len(refs)==39 and len(files)==2
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 nativejs="""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let f=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(f);""";native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True));assert native>40
 rejected=printed=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:rejected+=1
  else:raise AssertionError('Wrongkeyaccepted')
  b=copy.deepcopy(r);matches=list(re.finditer(r'\d+(?:,\d+)?',b['statement']));index=1 if r['skillFamily']in{'constant-speed-multiple-time','reduce-workers-increases-time'}else 0;m=matches[index];q=F(m.group().replace(',','.'))+1;b['statement']=b['statement'][:m.start()]+fmt(q)+b['statement'][m.end():]
  try:solve(b)
  except(AssertionError,ValueError,ZeroDivisionError):printed+=1
  else:raise AssertionError(('Changedprintedgivenaccepted',r['editionId']))
 transfers=reciprocals=squares=triangles=0
 for low in range(1,16):
  for high in range(low+1,21):
   for unit in range(2,21,2):
    before=[high*unit,low*unit];transfer=F(before[0]-before[1],2);assert before[0]-transfer==before[1]+transfer and sum(before)==2*(before[0]-transfer);transfers+=1
 for a in range(1,31):
  for b in range(1,31):
   t=1/(F(1,a)+F(1,b));assert t/a+t/b==1 and t<min(a,b);reciprocals+=1
 for x in range(1,10):
  for y in range(x+1,12):
   for z in range(y+1,14):
    for unit in range(1,6):
     ss=(x*x+y*y+z*z)*unit*unit;assert isqrt(ss//(x*x+y*y+z*z))==unit;squares+=1
    arcs=[F(360*w,x+y+z)for w in[x,y,z]];angles=[a/2 for a in arcs];assert sum(angles)==180 and max(angles)<180;triangles+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All39canonicalfile-scopedcollectionquestions fullsaved/new/officialsolutions/everyMCQread. OwnliteralFraction/AST, transferBOTHbalances/reciprocalwork/squares/positiveages/units100000/1000, nestedmixedandaffineproportions/signedvalues/requestedexpressionnotroot, inscribedangleGIVENproperty/trianglevalidity, GCDcompleteDIVISORS/LCMcompleteMULTIPLES. Findings0. Noauthorcalculatorimported.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':rejected,'printedCanariesRejected':printed,'transferLedgers':transfers,'reciprocalLedgers':reciprocals,'squaredRatioCases':squares,'inscribedTriangles':triangles,'nativeFractions':native,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
