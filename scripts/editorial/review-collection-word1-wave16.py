"""Independent24saved/newfullwordproblemreview, no author model/solver imports."""
from pathlib import Path
from fractions import Fraction as F
import argparse,copy,hashlib,importlib.util,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/collection-word1-wave16.json'
OUT='problems/editorial/reviews/collection-word1-wave16.json'
def load(name,file):
 spec=importlib.util.spec_from_file_location(name,ROOT/file);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod
# Reuse MY independent Fraction AST only, not any authorcalculator.
AST=load('own_multivariate_oracle','scripts/editorial/review-collection-expressions-wave15.py')
SYS=load('own_bivariate_oracle','scripts/editorial/review-collection-systems-wave14.py')
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def num(s):return F(s.replace(',','.').replace('−','-'))
def ns(s):return[num(m[0])for m in re.finditer(r'\d+(?:,\d+)?',s)]
def ints(a,b):return range(int(a),int(b)+1)
def choose(r,value):
 vals=[AST.calc(o)for o in r['options']];assert len(set(vals))==4,(r['editionId'],vals)
 return one([o for o,v in zip(r['options'],vals)if v==value])
def tuple_value(s):return tuple(num(t.strip())for t in s.strip('()').split(';'))
def solve(r):
 s=r['statement'];n=int(one(r['sourceRefs'])['sourceId']);note='';env={}
 if n==1:
  total,gap=ns(s);child=one([x for x in ints(1,total)if x+(x+gap)==total]);parent=child+gap;value=F(child);env={'x':value}
  assert(child,parent)==(23,51);answer=choose(r,value);note=f'Completepositiveageledger child{child}+parent{parent}=total{total}; invariantbirthgap{gap}, requestedCHILDnotparent.'
 elif n==2:
  count,before,after=ns(s);total=count*before;remaining=(count-1)*after;value=total-remaining;assert value==33 and remaining==255;answer=choose(r,value)
  note=f'Actualn{count}→n-1, sumBEFORE{total}andAFTER{remaining}, leavingage{value}; notdifferenceofaverages. Remaining15×17andnew33physicallyrealizable.'
 elif n==3:
  assert s.startswith('Бір ашықхат пен ');secondCount,total,compareSecond,compareFirst,gap=ns(s)
  candidates=[(total-secondCount*b,b)for b in ints(1,total)if total-secondCount*b>0 and compareSecond*b-compareFirst*(total-secondCount*b)==gap]
  a,b=one(candidates);assert(a,b)==(70,110);value=b;env={'a':a,'b':b};answer=choose(r,value)
  note=f'Fullpositiveintegerpriceledger a+{secondCount}b={total}, {compareSecond}b-{compareFirst}a={gap}; UNIQUEa{a}/b{b}, bothconditionsbacksub, targetSECONDprice.'
 elif n==4:
  total,small,large,people,asked=ns(s);assert asked==small and'бос орын қалмай'in s
  largeN=one([b for b in ints(0,total)if(total-b)*small+b*large==people]);smallN=total-largeN;value=smallN;answer=choose(r,value)
  assert(smallN,largeN)==(8,6);note=f'Completeintegercapacities0..{total}, allFULL premiseessential; {smallN}small×{small}+{largeN}large×{large}={people}, requestedSMALLcount.'
 elif n==5:
  fastH,slowH,gap=ns(s);assert'тапсырысты'in s and'өнімділігі тұрақты'in s
  fast,slow,det=SYS.solve_equations([f'{fastH}x - {slowH}y = 0',f'x - y = {gap}']);order=fast*fastH;assert order==slow*slowH and(fast,slow,order)==(45,30,270)
  answer=one([o for o in r['options']if tuple_value(o)==(fast,slow)]);env={'N':order};note=f'Exactdeterminant independentRATEpair solve: sameorderN{order} BOTHfast{fast}×{fastH}/slow{slow}×{slowH}; difference{gap}, orderedPAIRnotjointtime/reversal.'
 elif n==6:
  old,new,_=ns(s);value=(new-old)/old*100;assert value==28;answer=choose(r,value)
  assert F(100)*(new-old)/new==F(175,8);note=f'ActualOLDbase{old}, new{new}, increase{new-old}→{value}percent; fullprice128percent andNEWbase21.875percent distinguished.'
 elif n==7:
  figures,corners=ns(s);tri=one([t for t in ints(0,figures)if 3*t+4*(figures-t)==corners]);value=F(tri);assert tri==9;answer=choose(r,value)
  note=f'Fullcountdomain0..{figures}, fixedtriangle3/quad4facts; unique9tri+10quad→67corners, targetTRIANGLEnotquad.'
 elif n==8:
  weeks=one(ns(s));assert'тамыз'in s and'дәл'in s and'САҒАТ'in s;hours=(31-7*weeks)*24;assert hours==240
  vals=[AST.calc(o)for o in r['options']];answer=one([o for o,v in zip(r['options'],vals)if v==hours]);assert answer=='(31 − 7 × 3) × 24'
  note=f'ActualAugust31DAYS/calendarconstant, {weeks}weeks×7thencomplement×24hours; all4providedexpressionASTs evaluated, requestedEXPRESSIONnotminutevalue.'
 elif n==9:
  total,factor,again=ns(s);assert factor==again;first=total/(1+factor+1/factor);second=factor*first;third=first/factor;assert(first,second,third)==(F(12,5),F(18,5),F(8,5));assert first+second+third==total
  value=first;env={'x':first};answer=choose(r,value);note=f'Actualreciprocaldirections: second{factor}×first, FIRST{factor}×thirdsoTHIRD=first/{factor}; exactthree-massledger{first},{second},{third}, total{total}; targetFIRST.'
 elif n==10:
  done,numerator,denominator=ns(s);whole=done*denominator/numerator;value=whole-done;assert whole==88 and value==40;answer=choose(r,value)
  note=f'KnownPROPERpart{done}={numerator}/{denominator}ofORIGINALwhole88, requestedREMAINING40, notwhole/done/unit8; integerledgerbacksub.'
 elif n in{11,13,21,22}:
  if n==11:P,w,numr,den=ns(s);ratio=w+numr/den;assert ratio==F(5,2)
  else:P,ratio=ns(s)
  W=P/(2*(ratio+1));L=ratio*W;assert W>0 and L>0 and 2*(L+W)==P and L/W==ratio;env={'b':W}
  if n in{21,22}:answer=one([o for o in r['options']if tuple_value(o)==(L,W)]);note=f'Actualperimeter{P}HALVEDthenratio{ratio}, fullpositivesidesLONG{L}/WIDTH{W}; BOTHperimeterandratio constraints, orderedLONGthenWIDTH, everypairchoicechecked.'
  else:value=L*W;answer=choose(r,value);note=f'Actualperimeter{P}andratio{ratio}, notareaasP/2; positiveW{W},L{L}, productAREA{value}squarecm; mixedratio5/2retainedwhenapplicable.'
 elif n==12:
  route,firstP,secondP=ns(s);assert s.count('БҮКІЛ')==2;value=route*(firstP+secondP)/100;assert value==145
  firstD=route*firstP/100;secondD=route*secondP/100;assert firstD+secondD==value;answer=choose(r,value)
  note=f'BOTHpercentagesfromSAMEORIGINALroute{route}: {firstP}percent→{firstD}, {secondP}percent→{secondD}, SUM{value}; leftover-base124.075trap notsamecondition.'
 elif n==14:
  factor,heavy,light=ns(s);assert'Бос массалары бірдей'in s and'Күріштің өз массасы'in s
  tare=one([t for t in ints(0,light-1)if heavy-t==factor*(light-t)]);lightContent=light-tare;heavyContent=heavy-tare
  assert(tare,lightContent,heavyContent)==(270,120,360);value=F(tare);env={'m':lightContent};answer=choose(r,value)
  note=f'ExplicitEQUALemptytare, ratioONLYcontents, fullintegerledger t{tare}+light{lightContent}={light}, t+heavy{heavyContent}={heavy}; contentratio{factor}. Noequalvolume/densityassumption.'
 elif n==15:
  rows,columns,area=ns(s);side=one([x for x in ints(1,area)if x*x==area]);value=2*(rows*side+columns*side);assert value==84 and side==6;assert'СЫРТҚЫ'in s;answer=choose(r,value)
  note=f'Exactpositiveintegerrootarea{area}→side{side}, grid{rows}×{columns}gives18×24, OUTERperimeter{value}; internalsharededgesexcludednotall12smallperimeters.'
 elif n==16:
  length,numerator,denominator=ns(s);width=length*numerator/denominator;value=2*(length+width);assert width==45 and value==252;answer=choose(r,value)
  note=f'Widthis{numerator}/{denominator}ofLENGTH{length}, W{width}; requestedFULLboundary2(L+W)={value}mmnotsemiperimeter126.'
 elif n==17:
  count,numerator,denominator=ns(s);assert numerator==1 and'ақшаның бәріне тек жапсырма'in s;value=count*denominator;assert value==20;answer=choose(r,value)
  note=f'FIXEDbudget{count}expensiveitems, cheapeach1/{denominator}price soMOREitems{value}, notadd/subtractratio; allbudgetspentONLYcheapitems.'
 elif n==18:
  boys,numerator,denominator=ns(s);girls=boys*numerator/denominator;value=boys+girls;assert girls==14 and value==23 and numerator>denominator;answer=choose(r,value)
  note=f'IMPROPERfraction{numerator}/{denominator}baseBOYS{boys}, girls14thenTOTAL23; nofalsepart-of-wholeboundfraction≤1.'
 elif n==19:
  current,down,hours=ns(s);assert'жағалауға қатысты'in s and'Меншікті жылдамдығы өзгермесе'in s;still=down-current;up=still-current;value=up*hours;assert still==F(221,5)and up==F(208,5)and value==F(832,5);answer=choose(r,value)
  note=f'Actualdownstreamspeed{down}INCLUDEScurrent{current}; recoverstill{still}, subtractcurrentAGAINforupstream{up}, ×{hours}→{value}; onesubtraction/stalevwrong.'
 elif n==20:
  H,M,h,m=ns(s);assert'ТҰРАҚТЫ жылдамдықпен'in s and'аялдамай'in s;total=60*H+M;part=60*h+m;value=part/total;assert(total,part,value)==(250,75,F(3,10));answer=choose(r,value)
  note=f'ExplicitCONSTANTspeed/NOSTOP premiseallowsdistancefraction=TIMEfraction; SI60conversions total250min/part75min→3/10; 1.15/4.10=23/82trapinvalidclockreading.'
 elif n==23:
  removed,added,final=ns(s);value=final-added+removed;assert value==F(13,5)and value-removed+added==final and value>=removed;assert'көлемдер қосылады'in s;answer=choose(r,value)
  note=f'Reverseledger LASTadditionundoneTHENremovedamountreturned: initial{value}, afterremoval{value-removed}, afteraddition{final}; explicitadditivevolume/nospill, alldomainnonnegative.'
 elif n==24:
  total=one(ns(s));valid=[]
  for o in r['options']:
   xs=tuple_value(o);assert len(xs)==3
   if sum(xs)==total and xs[1]-xs[0]==xs[2]-xs[1]==1:valid.append(o)
  answer=one(valid);assert tuple_value(answer)==(142,143,144);env={'x':F(143)};note=f'All4WHOLEtriplescheckedbothSUM{total}ANDconsecutiveadjacentdifference1/order; incorrect112/143/174hasrightSUMbutnotconsecutive. TargetFULLthree, notmiddle.'
 else:raise AssertionError(n)
 assert answer==r['answer'],(n,answer,r['answer']);return note,env

def calc(s,env):
 # Preserve actualpercentdimension as /100; implicit uppercaseN coefficient.
 s=re.sub(r'(?<=\d)(?=N)','*',s).replace('÷','/')
 s=re.sub(r'(\d+(?:,\d+)?)%',r'(\1/100)',s)
 return AST.calc(s,env)
def proof_claims(row,env):
 count=0;z=re.sub(r'(?<=\S):','; ',row['solution'].replace(', ','; '))
 for m in re.finditer(r'(?<![A-Za-z])(?:[abmNxy0-9(]|[−-]\d)[0-9abmNxy, +−×÷():/%()=\-]*',z):
  text=m[0].strip().rstrip(', ')
  if'='not in text:continue
  assert text.count('(')==text.count(')'),text
  terms=[t.strip()for t in text.split('=')];assert all(terms),text
  values=[calc(t,env)for t in terms];assert len(set(values))==1,(row['editionId'],text,values);count+=len(terms)-1
 return count

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==24;entries=[];refs=set();files=set();proofs=0
 for row in rows:
  ref=one(row['sourceRefs']);rawfile=json.loads((ROOT/ref['sourceFile']).read_text());assert rawfile['sourceReviewCaptured'];raw=one([q for q in rawfile['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution']and not raw.get('svg')and not raw.get('images');refs.add(int(ref['sourceId']));files.add(ref['sourceFile']);norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(row['statement']);note,env=solve(row);proofs+=proof_claims(row,env)
  assert row['grade']==6 and row['minimumPlan']=='pro'and len(set(row['options']))==4 and row['options'].count(row['answer'])==1
  entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','method':'Independent ACTUALprinted exactFraction/count/domain/word-rolematrix/price/rate/percentageBASE/geometry/current/clock/reverseledger oracle; EVERYdisplayedproofequality and ALLMCQ checked. All24canonical saved/new/fullofficial/newsolutions/everyMCQread; noauthorcalculatorimports.','notes':note})
 assert refs==set(range(1,25))and len(files)==1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 badkeys=0
 for row in rows:
  bad=copy.deepcopy(row);bad['answer']='WRONG'
  try:solve(bad)
  except AssertionError:badkeys+=1
  else:raise AssertionError('wrongkeyaccepted')
 nativejs=r"""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let f=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(f);"""
 native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True))
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All24canonical saved/new conditions, FULLofficial/newsolutions/everyMCQread. Independent actualprinted exactFraction arithmetic, completeintegerage/price/fullcapacity/tare/triangleledgers, sameorderRATEpair270and45/30, percentageORIGINALbaseandBOTHwhole-routebases, SAMEemptytareexplicit, constant-speedclockSI60, mixedratio2.5area490, outerperimeter, improperpartbase, upstreamTWICEcurrent, reversevolumeledgerwithpremises, fullorderedconsecutivetriple. Everydisplayedproof equality checked. Repeatedrectangles/wordformsnotsemanticnoveltycounts. Findings0; noauthorcalculatorimports.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':badkeys,'proofEqualityClaims':proofs,'nativeFractions':native,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
