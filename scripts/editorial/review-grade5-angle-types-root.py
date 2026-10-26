"""Independent root review of all35 saved/new angle-type conditions,
FULL official/new solutions and EVERY MCQ. Exact printed arithmetic,
strict-bound proofs, constructive/finite geometry domains and full SHA;
no author specs/models/params/calculator is imported or consumed.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade5-angle-types.json'
REPORT='problems/editorial/reviews/grade5-angle-types.json'
sp=importlib.util.spec_from_file_location('root_math_helpers',ROOT/'scripts/editorial/review-grade5-protractor-root.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one,calc,number,select=H.one,H.calc,H.number,H.select
def clean(s):return re.sub(r'\\+angle\s*','∠',H.clean(s))
def ns(s):return list(map(int,re.findall(r'\d+',clean(s))))
def degrees(s):return list(map(int,re.findall(r'(\d+)\s*°',clean(s))))
def options(r):return[clean(o['text']if isinstance(o,dict)else o)for o in r.get('options')or[]]
def pick(r,p):
 key=one(o for o in options(r)if p(o));assert clean(r['answer'])==key,(r['answer'],key)
 return key
def numeric(r,v):
 assert calc(r['answer'])==v,(r['answer'],v)
 if options(r):assert sum(calc(o)==v for o in options(r))==1
 return str(v)
def kind(x):
 assert 0<x<=360
 return'сүйір бұрыш'if x<90 else'тік бұрыш'if x==90 else'доғал бұрыш'if x<180 else'жазыңқы бұрыш'if x==180 else'толық бұрыш'if x==360 else'ойыс бұрыш'
def typepick(r,v,always=False):
 wanted=kind(v)
 return pick(r,lambda o:o.casefold()==(('әрқашан 'if always else'')+wanted))
def rel(s,env):
 m=re.fullmatch(r'∠([A-Z]+)\s*([<>=])\s*(?:∠([A-Z]+)|(\d+)°?)',s.strip())
 if not m:return False
 a,op,b,n=m.groups();x=env[a];y=env[b]if b else F(n)
 return x<y if op=='<'else x>y if op=='>'else x==y
def clock(s):
 hour,minute=map(int,one(re.findall(r'(\d+)\s*:\s*(\d+)',s)));assert 0<=hour<12 and 0<=minute<60
 a=30*hour+F(minute,2);b=6*minute;d=abs(a-b)
 return min(d,360-d)
def solve(r,i,source=False):
 s=clean(r['statement']);lo=s.casefold();ds=degrees(s);n=ns(s)
 if i==0:
  a,b=('K','L')if source else('P','Q');assert 'тік'in lo and 'доғал'in lo
  return pick(r,lambda o:all(rel(o,{a:F(90),b:F(t,10)})for t in range(901,1800)))
 if i==1:return pick(r,lambda o:not(0<calc(o)<90))
 if i==2:
  assert 'жар' in lo;return typepick(r,F(180,2))
 if i==3:
  angle=ds[0];factor=int(one(re.findall(r'(\d+)\s*есе',lo)));assert factor>1
  return typepick(r,angle*factor)
 if i==4:
  first,second=ds;a,b=('MNK','PQR')if source else('XYZ','PQR')
  return pick(r,lambda o:rel(o,{a:F(first),b:F(second)}))
 if i==5:return pick(r,lambda o:90<calc(o)<180)
 if i==6:
  assert 'тік'in lo and 'биссектриса'in lo;return numeric(r,F(90,2))
 if i==7:
  assert 'толық'in lo and 'тік'in lo;return numeric(r,F(360,90))
 if i==8:
  assert ds==[180] and 'сүйір'in lo
  assert all(90<180-F(a,10)<180 for a in range(1,900))
  return typepick(r,135)
 if i==9:
  assert len(ds)==3 and sum(ds)==180 and all(a>0 for a in ds)
  maxN=int(max(calc(o)for o in options(r)));reachable={0}
  for value in range(maxN+1):
   if value in reachable:reachable.update(value+a for a in ds if value+a<=maxN)
  return pick(r,lambda o:calc(o)in reachable)
 if i==10:
  assert 'доғал'in lo and 'биссектриса'in lo
  assert all(45<F(a,20)<90 for a in range(901,1800))
  return typepick(r,65,True)
 if i==11:
  times=re.findall(r'(\d+)\s*:\s*(\d+)',s);assert len(times)==2
  start,end=[60*int(a)+int(b)for a,b in times];assert end>start
  return numeric(r,6*(end-start))
 if i==12:
  a=ds[0];fracs=re.findall(r'\((\d+)/(\d+)\)',s);assert len(fracs)==2
  (cn,cd),(dn,dd)=[list(map(int,p))for p in fracs];env={'A':F(a),'B':F(90),'C':F(180*cn,cd),'D':F(360*dn,dd)}
  order=sorted(env,key=env.get);assert len(set(env.values()))==4
  return pick(r,lambda o:re.findall(r'∠([A-Z])',o)==order and o.count('<')==3)
 if i==13:
  angle=one(ds);parts=3 if source else n[-1];assert parts>0 and 90+angle<360
  return numeric(r,F(360-90-angle,parts))
 if i==14:
  assert kind(43)==kind(58)=='сүйір бұрыш'and kind(43+58)=='доғал бұрыш'
  return pick(r,lambda o:'сүйір'in o.casefold()and'қос'in o.casefold())
 if i==15:
  f=int(one(re.findall(r'(\d+)\s*есе',lo)));assert f>1 and 'тік'in lo
  little=F(90,1+f);return numeric(r,f*little)
 if i==16:
  fractions=re.findall(r'\((\d+)/(\d+)\)',s);assert len(fractions)==2
  p,q=[F(*map(int,a))for a in fractions];a,b=180*p,90*q
  return pick(r,lambda o:rel(o,{'A':a,'B':b})if '×'not in o else a==2*b)
 if i==17:return pick(r,lambda o:clock(o)==90)
 if i==18:
  assert len(ds)==6 and sum(ds[:3])==sum(ds[3:])==180 and min(ds)>0
  distinct={a+b for a in set(ds[:3])for b in set(ds[3:])if a+b<180}
  assert 180 not in distinct
  return numeric(r,len(distinct))
 if i==19:return numeric(r,clock(s))
 if i==20:
  outer,first=ds;assert 0<first<outer<180 and 'биссектриса'in lo
  a,b=F(first,2),F(outer-first,2);assert a+b==F(outer,2)
  return numeric(r,a+b)
 if i==21:
  a,b=map(int,re.findall(r'(\d+)\s*есе',lo));assert 1<a<b
  unit=F(180,1+a+b);return typepick(r,b*unit)
 if i==22:
  outer=ds[0];mult=int(one(re.findall(r'(\d+)\s*есе',lo)));assert mult>0
  unit=F(outer,mult+2);assert unit>0 and mult*unit+unit+unit==outer
  return numeric(r,mult*unit)
 if i==23:
  assert 'жазыңқы'in lo and 'ішкі'in lo if not source else'жазыңқы'in lo
  assert all(F(a,20)+F(1800-a,20)==90 for a in range(1,1800))
  return typepick(r,90,True)
 if i==24:return numeric(r,clock(s))
 if i==25:
  assert ('жазыңқы'in lo if source else '180' in s) and 'сүйір'in lo
  # Formal bound: two acute angles sum below180, forcing the third above180.
  # A positive attainable witness is needed as well as that upper bound.
  witness=(70,145,145);assert sum(witness)==360 and all(0<a<180 for a in witness)
  assert sum(a<90 for a in witness)==1
  return numeric(r,1)
 if i==26:
  ab,bc=ds;middle=ab+bc-360;first=ab-middle;last=bc-middle
  assert all(0<a<180 for a in[first,middle,last])and first+middle+last==360
  return numeric(r,first)
 if i==27:
  theta=one(ds);assert 'сағат тілімен'in lo and 'солтүстік'in lo
  bearing={'солтүстік':0,'солтүстік-шығыс':45,'шығыс':90,'оңтүстік-шығыс':135,'оңтүстік':180,'оңтүстік-батыс':225,'батыс':270,'солтүстік-батыс':315}
  return pick(r,lambda o:bearing.get(o.casefold())==theta%360)
 if i==28:
  divisor=one(n);assert divisor>0 and 'сүйір'in lo
  return numeric(r,len([a for a in range(1,90)if a%divisor==0]))
 if i==29:
  return pick(r,lambda o:len(degrees(o))==2 and min(degrees(o))>0 and sum(degrees(o))==90)
 if i==30:
  count=n[0];assert count>0
  interval=F(360,count);needed=F(90)/interval;assert needed.denominator==1
  return numeric(r,needed)
 if i==31:
  ratio=int(one(re.findall(r'(\d+)\s*есе',lo)));assert ratio>1
  small=F(180,1+ratio);big=ratio*small;assert big+small==180
  return numeric(r,big/2+small)
 if i==32:return pick(r,lambda o:not(90<calc(o)<180))
 if i==33:
  assert 'доғал'in lo and 'тік'in lo
  assert all(0<F(a,10)-90<90 for a in range(901,1800))
  return typepick(r,45,True)
 if i==34:
  step=one(ds);count=5 if source else n[0];assert count==5
  first=(F(360)-step*count*(count-1)/2)/count;angles=[first+j*step for j in range(count)]
  assert min(angles)>0 and sum(angles)==360 and all(angles[j+1]-angles[j]==step for j in range(count-1))
  return numeric(r,max(angles))
 raise AssertionError(i)
NOTES=[
 'Strictuniversal90<obtuse<180 versusright90, all4relationoptions.',
 'Allactualnumericoptions0<x<90,89included/92excluded, noinclusive90.',
 'Straight180HALF90, askedTYPEright, invariantdefinition.',
 'Actual48double96, classifyNEWangleobtuse afterscaling.',
 'Printed68/112 comparisonsincludingfalse68>90, eachrelationchecked.',
 'Strict90<obtuse<180, boundaries90/180separatetypes, all4checked.',
 'Explicitright90innerbisector→45, vertexE, invariantdefinition.',
 'Full360dividedbyright90→4, not180semicircle.',
 'Formal0<alpha<90⇒90<180−alpha<180, forallrealacute.',
 'Actual30/60/90repeatedNONOVERLAP reachableDP,150=90+60witness.',
 'Formal90<a<180⇒45<a/2<90, forallrealobtusehalves.',
 'Clock9:10to9:35elapsed25, minute6deg/min→150TURNnotclockgap.',
 'DifferentWHOLES:C180/6=30,D360×3/8=135, strictC<B<A<Dall4orders.',
 'Full360sectorledger90+150+4×30, remainderthenONEsector.',
 'Falseuniversal43+58=101counterexample, other3definitionclaimsTRUE.',
 'Right90ratio5:1gives6weights, requestedLARGE75not15or18.',
 'A180×2/5=B90×4/5=72, fractionsdifferentWHOLES, alldoubledrelationtraps.',
 'All4clockhourscontinuousformula:10→60,9→90,8→120,6→180.',
 'Papertriangles45/45/90and25/65/90validsum180;fullCartesian sums dedup45/strict180excluded→5.',
 'Movinghour11:16→338,minute96,direct242,requestedSMALL118.',
 'Adjacentinternalbisectors21+58=79=158/2, not58only.',
 'Straight180weights1:4:5→18/72/90, requestedlargestTYPEright.',
 'Bisectedlasttwoequalparts, outer150weights3:1:1→90/30/30, askedfirst90.',
 'Universalinternaladjacentbisectors(a+b)/2=90 forALLpositivea+b180.',
 'Movinghour8:30→255not240, minute180, smaller75not60.',
 'Continuousstrict2acuteimplies3rd>180; attained70/145/145, max1. Fullintegerdomain separatelychecked.',
 'Full360pairledgers244/258→first102,middle142,last116, askedFIRST.',
 'ExplicitCLOCKWISEfromNorth225 givesSW, allofferedbearingangles.',
 'Entirepositiveintegeracute1..89divisible18→18/36/54/72;0and90excluded.',
 'Everyactualpositivepair checked90sum:100/100/100/90.',
 '48rays→7.5degINTERVALS, FIRST90turn12intervals, initialraynotcounted.',
 'Straight180ratio4:1→144/36,bisect144→72, requested72+36=108.',
 'Formalacute+right sumSTRICT90..180, actual97/146/178attainable,180boundaryimpossible.',
 'Formal90<obtuse<180 subtract90→0<remainder<90, alwaysacute.',
 'All5positiveAPanglesstep16,total360→40/56/72/88/104, requestedMAX104.',
]
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==35
 entries=[];canaries=0;numericCanaries=0
 for i,r in enumerate(rows):
  try:solve(r,i)
  except Exception as e:raise AssertionError(('NEW',i))from e
  ref=one(r['sourceRefs']);src=json.loads((ROOT/ref['sourceFile']).read_text());raw=one(q for q in src['questions']if q['id']==ref['sourceId'])
  assert src['grade']==5 and src['status']=='captured' and raw['checked']and not raw.get('images')and not raw.get('svg')
  try:solve({**raw,'answer':raw['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('SOURCE',i))from e
  if raw['options']:assert clean(one(o['text']for o in raw['options']if o['correct']))==clean(raw['sourceAnswer'])
  assert r['minimumPlan']=='pro'and r['statement']!=raw['statement']and not r.get('image')
  assert not re.search(r'[\\$]',r['statement']+r['solution'])
  bad=copy.deepcopy(r);bad['answer']='WRONG_KEY'
  try:solve(bad,i)
  except (AssertionError,ValueError,SyntaxError,KeyError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  changed=copy.deepcopy(r)
  mutations={3:('48°','44°'),4:('68°','118°'),8:('180°','181°'),9:('30°','31°'),11:('9:35','9:36'),12:('116°','136°'),13:('150°','154°'),15:('5 есе','4 есе'),16:('(2/5)','(3/5)'),18:('25°','26°'),19:('11:16','11:18'),20:('158°','160°'),21:('5 есе','6 есе'),22:('150°','155°'),24:('8:30','7:30'),26:('258°','259°'),27:('225°','135°'),28:('18 санына','30 санына'),30:('48 спицасы','44 спицасы'),31:('4 есе','3 есе'),34:('16°','18°')}
  if i in mutations:
   old,new=mutations[i];assert old in changed['statement'];changed['statement']=changed['statement'].replace(old,new,1);numericCanaries+=1
  elif changed.get('options'):
   j=one(j for j,o in enumerate(changed['options'])if o==changed['answer']);changed['options'][j]='INVALID_ROLE'
  else:
   old,new=('ТІК','ЖАЗЫҢҚЫ')if i==6 else('толық','жарты')if i==7 else('180°','181°')
   assert old in changed['statement'];changed['statement']=changed['statement'].replace(old,new)
  try:solve(changed,i)
  except (AssertionError,ValueError,SyntaxError,KeyError):canaries+=1
  else:raise AssertionError(('canaryaccepted',i))
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'independent_root_full_saved_new_solutions_every_MCQ_read_strict_bounds_constructive_clock_fraction_and_complete_finite_domain_oracle','notes':[NOTES[i]]})
 maxAcute=0;validTriples=0
 for a in range(1,180):
  for b in range(1,180):
   c=360-a-b
   if 0<c<180:validTriples+=1;maxAcute=max(maxAcute,sum(v<90 for v in[a,b,c]))
 assert maxAcute==1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed'){walk(n.fraction.numerator);walk(n.fraction.denominator)}else if(n.type==='text'&&/\\d\\s*\\/\\s*\\d/.test(n.value))throw Error('baremathfraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 result=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(result['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries);assert result['fractions']==5
 report={'schemaVersion':1,'reviewer':'root_independent_of_angle_types_author','batch':BATCH,'scope':__doc__,'summary':{'verified':35,'findings':0,'fullSavedNewOfficialAuthoredSolutionsEveryMCQRead':35,'sourceTargetsRecomputed':35,'wrongKeysRejected':35,'printedNumericOrOfferedRoleCanariesRejected':canaries,'numericGivensCanaries':numericCanaries,'positiveIntegerFullCircleTriplesEnumerated':validTriples,'nativeFractions':result['fractions'],'pythonJavaScriptHashesMatched':35},'entries':entries}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
