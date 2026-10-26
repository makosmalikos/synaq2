"""Independent full13 pictured decimal/natural division review.
Actual SVG text/coordinates/topology observer, exact Fraction arithmetic and
complete Euclidean hidden-digit domains. No author params/solver imported.
All13 full saved/new conditions/solutions/MCQs and3source+3native343px sheets read.
"""
import copy,hashlib,json,re,math
from fractions import Fraction as F
from pathlib import Path
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/visual-wave62-pictured-decimal-natural-division.json';REPORT='problems/editorial/reviews/visual-wave62-pictured-decimal-natural-division.json'
def read(p):return json.loads((ROOT/p).read_text())
def one(xs):assert len(xs)==1,xs;return xs[0]
def tag(e):return e.tag.rsplit('}',1)[-1]
def number(s):return F(s.replace(',','.'))
def text(e):return ''.join(e.itertext())
def short(n):
 n=F(n)
 if n.denominator==1:return str(n.numerator)
 assert (10**8)%n.denominator==0
 return f'{float(n):.8f}'.rstrip('0').rstrip('.').replace('.',',')
def clean(s):return s.replace('$','').replace('{,}',',').replace('−','-').strip()
def answer_num(s):
 s=clean(s);s=re.sub(r'\s*(?:см²|см|мм|км|кг|м|г)\s*$','',s);return number(s)
def same(a,b,tol=1e-8):assert abs(float(a)-float(b))<tol,(a,b)
def coord(e,n):return F(e.attrib[n])
def rows_text(nodes):return[(coord(e,'x'),coord(e,'y'),text(e))for e in nodes if tag(e)=='text']
def extract_number_text(texts,prefix,unit):
 s=one([t for _,_,t in texts if t.startswith(prefix)and t.endswith(unit)]);return number(s[len(prefix):-len(unit)].strip())
def svg_observe(row,svg,i):
 root=ET.fromstring(svg);nodes=list(root.iter());assert root.attrib['viewBox']=='0 0 480 360';assert {tag(e)for e in nodes}<={'svg','title','desc','rect','g','text','line','path','circle','polygon'}
 assert not re.search(r'<(?:image|script|foreignObject)|(?:href|onload|onclick)=|data:image|url\(',svg,re.I)
 texts=rows_text(nodes);lines=[e for e in nodes if tag(e)=='line'];rects=[e for e in nodes if tag(e)=='rect'and 'rx'not in e.attrib];polygons=[e for e in nodes if tag(e)=='polygon']
 for e in nodes:
  if tag(e)=='text':assert 0<coord(e,'x')<480 and 0<coord(e,'y')<360 and coord(e,'font-size')*F(343,480)>=16
 if i in(0,4):
  ticks=sorted([e for e in lines if coord(e,'x1')==coord(e,'x2')and abs(coord(e,'y2')-coord(e,'y1'))==20],key=lambda e:coord(e,'x1'));assert len(ticks)==7
  xs=[coord(e,'x1')for e in ticks];assert all(xs[j+1]-xs[j]==xs[1]-xs[0]for j in range(6));assert all((coord(e,'y1')+coord(e,'y2'))/2==185 for e in ticks)
  labels=sorted([(x,number(s))for x,y,s in texts if y==235],key=lambda x:x[0]);assert len(labels)==2 and labels[0][0]==xs[0]and labels[1][0]==xs[-1]
  point=one([e for e in nodes if tag(e)=='circle']);assert coord(point,'cy')==185;index=one([j for j,x in enumerate(xs)if x==coord(point,'cx')]);label=one([s for x,y,s in texts if x==coord(point,'cx')and y==153]);assert label==('A'if i==0 else'K');start,end=labels[0][1],labels[1][1];assert (start==0)==(i==0)
  return{'start':start,'end':end,'gaps':len(ticks)-1,'index':index}
 if i in(1,10,12):
  # Read actual displayed digit glyphs and their physical columns, not author data attributes.
  left=[(x,y,s)for x,y,s in texts if x<284 and re.fullmatch(r'[\d□,−]',s)];top=74 if i==1 else 68;ys=[74,124,174,224,279]if i==1 else[68,109,150,191,232,273,314];observed=[];starts=[]
  for y0 in ys:
   chars=sorted([(x,s)for x,y,s in left if y==y0 or(s==','and y==y0+6)]);digits=[(x,s)for x,s in chars if s!='−'];assert digits
   starts.append(int((digits[0][0]-F(175,2))/47));assert starts[-1]>=0
   for x,s in digits:
    if s!=',':assert (x-F(175,2))%47==0
   observed.append(''.join(s for _,s in digits));minus=any(s=='−'for _,s in chars)
   if y0!=top:assert minus==((len(observed)-2)%2==0)
  divisor=one([s for x,y,s in texts if x==354 and y==70]);quotient=one([s for x,y,s in texts if x==354 and y==126]);assert re.fullmatch(r'[\d□]',divisor)and re.fullmatch(r'[\d□],[\d□]{1,2}',quotient)
  assert starts==([0,0,1,1,2]if i==1 else[0,0,1,1,2,2,3]if i==10 else[0,0,0,0,1,1,2])
  return{'dividend':observed[0],'divisor':divisor,'quotient':quotient,'steps':observed[1:]}
 if i in(2,7):
  polygon=one(polygons);pts=[tuple(map(float,p.split(',')))for p in polygon.attrib['points'].split()];assert len(pts)==3;lengths=[math.dist(pts[j],pts[(j+1)%3])for j in range(3)];assert max(lengths)-min(lengths)<1e-8
  small=[e for e in lines if math.hypot(float(coord(e,'x2')-coord(e,'x1')),float(coord(e,'y2')-coord(e,'y1')))<20]
  tri_marks=[]
  for j in range(3):
   a,b=pts[j],pts[(j+1)%3];mid=((a[0]+b[0])/2,(a[1]+b[1])/2);matched=[]
   for e in small:
    cx=float(coord(e,'x1')+coord(e,'x2'))/2;cy=float(coord(e,'y1')+coord(e,'y2'))/2
    if math.dist((cx,cy),mid)<1e-7:matched.append(e);same((b[0]-a[0])*float(coord(e,'x2')-coord(e,'x1'))+(b[1]-a[1])*float(coord(e,'y2')-coord(e,'y1')),0,1e-6)
   tri_marks.append(one(matched))
  if i==2:assert len(small)==3;return{'perimeter':extract_number_text(texts,'P = ','см'),'sides':3}
  square=one(rects);assert coord(square,'width')==coord(square,'height');assert len(small)==11
  x,y,w=coord(square,'x'),coord(square,'y'),coord(square,'width');edge_mids=[(x+w/2,y),(x+w/2,y+w),(x,y+w/2),(x+w,y+w/2)];rest=[e for e in small if e not in tri_marks]
  assert len(rest)==8
  for mx,my in edge_mids:
   hits=[e for e in rest if math.dist((float((coord(e,'x1')+coord(e,'x2'))/2),float((coord(e,'y1')+coord(e,'y2'))/2)),(float(mx),float(my)))<=5.01];assert len(hits)==2
  assert any(s=='P₁ = P₂'for _,_,s in texts)
  return{'triangleSide':one([number(s[:-3].strip())for _,_,s in texts if s.endswith(' см')]),'triangleSides':3,'squareSides':4}
 if i==3:
  rs=sorted(rects,key=lambda e:coord(e,'x'));assert len(rs)==6;assert len({(coord(e,'width'),coord(e,'height'),coord(e,'y'))for e in rs})==1
  for a,b in zip(rs,rs[1:]):assert coord(a,'x')+coord(a,'width')==coord(b,'x')
  assert rs[0].attrib['fill']!='#fff'and all(e.attrib['fill']=='#fff'for e in rs[1:]);assert any(s=='?'for _,_,s in texts)
  return{'total':one([number(s)for _,y,s in texts if y==102]),'parts':len(rs)}
 if i==5:
  r=one(rects);perimeter=extract_number_text(texts,'P = ','дм');width=one([number(s)for x,y,s in texts if x==438]);length=perimeter/2-width
  same(coord(r,'height')/coord(r,'width'),width/length);assert any(s=='?'and y>coord(r,'y')+coord(r,'height')for _,y,s in texts);return{'perimeter':perimeter,'width':width}
 if i==6:
  groups={}
  for e in rects:groups.setdefault(coord(e,'y'),[]).append(e)
  assert len(groups)==3;ordered=sorted(groups.items());counts=[];start=None;dims=set()
  for y,rs in ordered:
   rs=sorted(rs,key=lambda e:coord(e,'x'));counts.append(len(rs));dims|={(coord(e,'width'),coord(e,'height'))for e in rs};start=coord(rs[0],'x')if start is None else start;assert coord(rs[0],'x')==start
   for a,b in zip(rs,rs[1:]):assert coord(a,'x')+coord(a,'width')==coord(b,'x')
  assert len(dims)==1;assert [s for _,_,s in texts if s in('A','B','C')]==['A','B','C']
  return{'counts':counts,'total':one([number(s)for x,_,s in texts if x==409])}
 if i==8:
  rs=sorted(rects,key=lambda e:coord(e,'x'));assert len(rs)==3;w=coord(rs[0],'width');assert all(coord(e,'width')==coord(e,'height')==w for e in rs)
  for a,b in zip(rs,rs[1:]):assert coord(a,'x')+w==coord(b,'x')and coord(a,'y')==coord(b,'y')
  # Independently cancel shared unit edges; interior doubled edges disappear.
  edges={}
  for e in rs:
   x,y=coord(e,'x'),coord(e,'y');pts=[(x,y),(x+w,y),(x+w,y+w),(x,y+w)]
   for j in range(4):key=tuple(sorted([pts[j],pts[(j+1)%4]]));edges[key]=edges.get(key,0)+1
  boundary=[edge for edge,count in edges.items()if count==1];assert len(boundary)==8 and sum(v==2 for v in edges.values())==2
  return{'perimeter':extract_number_text(texts,'P = ','см'),'outerUnits':len(boundary),'squares':3}
 if i==9:
  rs=sorted(rects,key=lambda e:coord(e,'x'));assert len(rs)==15;centers=[coord(e,'x')+coord(e,'width')/2 for e in rs];delta=centers[1]-centers[0]
  assert all(abs((b-a)-delta)<F(1,10**8)for a,b in zip(centers,centers[1:]));assert all(coord(e,'width')==6 and coord(e,'height')==46 for e in rs)
  assert one([s for x,y,s in texts if x==centers[0]and y==271])=='1';assert one([s for x,y,s in texts if x==centers[-1]and y==271])=='15'
  return{'poles':len(rs),'total':one([number(s)for _,y,s in texts if y==97])}
 if i==11:
  blue=[e for e in rects if e.attrib['fill']=='#b6d9f8'];yellow=one([e for e in rects if e.attrib['fill']=='#f7d77b']);assert len(blue)==4;assert len({coord(e,'width')for e in blue})==1
  a=[e for e in blue if coord(e,'y')==107];b=[e for e in blue if coord(e,'y')==235];assert len(a)==3 and len(b)==1
  assert coord(yellow,'x')==coord(b[0],'x')+coord(b[0],'width')and coord(yellow,'y')==coord(b[0],'y');extra=one([number(s)for _,y,s in texts if y==339]);total=one([number(s)for x,_,s in texts if x==425]);unit=(total-extra)/len(blue);same(coord(yellow,'width')/coord(b[0],'width'),extra/unit)
  return{'aUnits':len(a),'bUnits':len(b),'extra':extra,'total':total}
 raise AssertionError(i)

def matches(n,mask):
 return len(str(n))==len(mask)and all(b=='□'or a==b for a,b in zip(str(n),mask))
def division(raw,places,d):
 whole,frac=divmod(raw,10**places);digits=f'{frac:0{places}d}';q0,rem=divmod(whole,d);qs=[str(q0)];steps=[q0*d]
 for ch in digits:
  current=rem*10+int(ch);digit,rem=divmod(current,d);assert 0<=digit<=9 and 0<=rem<d;steps.extend([current,digit*d]);qs.append(str(digit))
 steps.append(rem);return f'{whole},{digits}',qs[0]+','+''.join(qs[1:]),steps,rem

def hidden(obs):
 candidates=[];domain=0
 ds=range(1,10)if obs['divisor']=='□'else[int(obs['divisor'])]
 raw_domain=range(1000,10000)if obs['dividend'].startswith('□□')else[int(obs['dividend'].replace('□',str(j)).replace(',',''))for j in range(10)]
 for d in ds:
  for raw in raw_domain:
   domain+=1;dividend,quotient,steps,remainder=division(raw,2,d)
   if len(quotient)!=4 or remainder or not matches(dividend,obs['dividend'])or not matches(quotient,obs['quotient'])or not all(matches(a,b)for a,b in zip(steps,obs['steps'])):continue
   assert len(steps)==len(obs['steps']);candidates.append((dividend,d,quotient,steps))
 return one(candidates),domain

def solve(row,i,o):
 s=row['statement'];os=row.get('options')or[];ans=None
 if i in(0,4):ans=o['start']+(o['end']-o['start'])/o['gaps']*o['index'];assert 'КООРДИНАТАСЫН'in s
 elif i==1:
  ds=o['dividend'];d=int(o['divisor']);places=len(ds.split(',')[1]);_,q,steps,rem=division(int(ds.replace(',','')),places,d);assert not rem and steps==list(map(int,o['steps']))and matches(q,o['quotient']);pos=o['quotient'].index('□');ans=int(q[pos]);assert 'ЦИФРДЫ'in s
 elif i==2:ans=o['perimeter']/o['sides']*10;assert 'МИЛЛИМЕТР'in s
 elif i==3:ans=o['total']/o['parts']*100;assert 'САНТИМЕТР'in s
 elif i==5:ans=(o['perimeter']/2-o['width'])*10;assert 'САНТИМЕТР'in s
 elif i==6:ans=o['total']/sum(o['counts'])*o['counts'][2]*1000;assert 'ГРАММ'in s
 elif i==7:ans=o['triangleSide']*o['triangleSides']/o['squareSides']*10;assert 'P₁ = P₂'in s and 'МИЛЛИМЕТР'in s
 elif i==8:ans=o['squares']*(o['perimeter']/o['outerUnits'])**2;assert 'АУДАНЫН'in s
 elif i==9:
  count,last,begin,end=list(map(int,re.findall(r'\d+',s)));assert count==1 and last==o['poles'];ans=o['total']/(o['poles']-1)*(end-begin);assert 'МЕТР'in s
 elif i in(10,12):
  result,domain=hidden(o);dividend,d,quotient,steps=result
  if i==10:assert dividend=='31,85'and quotient=='4,55'and d==7 and domain==9000;ans=sum(map(int,dividend.replace(',','')));assert 'ҚОСЫНДЫСЫН'in s
  else:assert dividend=='5,44'and quotient=='1,36'and d==4 and domain==90;ans=d;assert 'БӨЛГІШТІ'in s
 elif i==11:ans=(o['total']-o['extra'])/(o['aUnits']+o['bUnits'])*o['bUnits']+o['extra'];assert 'ТОЛЫҚ'in s
 else:raise AssertionError(i)
 assert answer_num(row['answer'])==ans,(i,row['answer'],ans)
 if os:assert sum(answer_num(x)==ans for x in os)==1
 return ans

def source_solve(raw,i):
 # Values/topology transcribed from the actually inspected archived source sheets,
 # independently corroborated by complete original official solutions.
 if i==0:ans=F('2.4')/6*2
 elif i==1:
  _,q,steps,rem=division(435,1,5);assert(q,steps,rem)==('8,7',[40,35,35,0],0);ans=int(q[-1])
 elif i==2:ans=F('13.5')/3*10
 elif i==3:ans=F('2.4')/6*100
 elif i==4:ans=F('2.7')+(F('4.5')-F('2.7'))/6*4
 elif i==5:ans=(F('14.2')/2-F('2.6'))*10
 elif i==6:ans=F('5.6')/sum([1,2,4])*4*1000
 elif i==7:ans=F('5.2')*3/4*10
 elif i==8:ans=3*(F('19.2')/8)**2
 elif i==9:ans=F('31.2')/(13-1)*(9-4)
 elif i==10:
  obs={'dividend':'□□,□□','divisor':'9','quotient':'□,8□','steps':['□8','□8','□2','□□','□□','0']};v,domain=hidden(obs);assert(v[0],v[2],domain)==('25,83','2,87',9000);ans=sum(map(int,v[0].replace(',','')))
 elif i==11:ans=(F('7.8')-F('0.6'))/4+F('0.6')
 elif i==12:
  obs={'dividend':'7,□8','divisor':'□','quotient':'□,□□','steps':['□','16','□□','48','48','0']};v,domain=hidden(obs);assert(v[0],v[1],v[2],domain)==('7,68',6,'1,28',90);ans=v[1]
 else:raise AssertionError(i)
 assert answer_num(raw['sourceAnswer'])==ans
 if raw.get('options'):assert sum(answer_num(o['text'])==ans for o in raw['options'])==1 and one([o['text']for o in raw['options']if o['correct']])==raw['sourceAnswer']
 return ans

def rejected(fn):
 try:fn()
 except(AssertionError,ValueError,IndexError,ZeroDivisionError,ET.ParseError):return
 raise AssertionError('Invalid canary accepted')
def run():
 rows=read(BATCH)['editions'];inventory=read('problems/editorial/batches/visual-inventory.json')['records'];assert len(rows)==13;entries=[]
 notes=['Six equal physical ray gaps; A at second tick,0→3.6 gives1.2.','Actual47.6÷7 displayed Euclidean products42,56,56,0; hidden quotient digit8.','Three single marks/equilateral side geometry; P16.8cm→one5.6cm→56mm.','Six equal contiguous strip pieces under whole3.6m bracket; one0.6m→60cm.','Nonzero3.6 start,6 equal gaps to6; K fourth gives5.2, not offset1.6.','Physical rectangle aspect and P16.8dm/width3.1dm; one unknown5.3dm→53cm.','Actual1/3/4 equal blue-cell groups under total7.2kg; C3.6kg→3600g.','Three triangle single marks and four distinct square double-mark pairs; equal perimeters6.4cm×3/4→4.8cm→48mm.','Three contiguous actual squares; shared edges canceled,8 exterior units rather than12; full area52.92cm².','Fifteen physical pole centers,14 equal gaps under37.8m bracket;5→10 has5 gaps13.5m.','Actual displayed all digit masks/columns; full9000 domain uniquely31.85÷7=4.55; dividend digit sum17.','Three A cells/one B cell+yellow0.8m, total9.6m; actual yellow/blue width ratio4/11; full B3m.','Actual displayed masked5.□4 and14/24/24/0; full90 divisor/digit domain unique5.44÷4=1.36.']
 for i,row in enumerate(rows):
  ref=one(row['sourceRefs']);cap=read(ref['sourceFile']);raw=one([q for q in cap['questions']if q['id']==ref['sourceId']]);assert cap['status']=='captured'and raw['checked']and raw['solution']and raw['images'];source_solve(raw,i)
  inv=one([r for r in inventory if r['occurrenceId']==row['sourceOccurrenceId']]);assert inv['sourceId']==ref['sourceId']and inv['sourceSha256']==row['sourceCanonicalSha256']and inv['sourceAssets']==['/questions/'+raw['images'][0]['src'].split('/questions/')[-1]]
  svg=(ROOT/'frontend/public'/row['image'].lstrip('/')).read_text();sha=hashlib.sha256(svg.encode()).hexdigest();assert sha==row['figureSha256'];observed=svg_observe(row,svg,i);solve(row,i,observed);bad=copy.deepcopy(row);bad['answer']='99999';rejected(lambda:solve(bad,i,observed))
  # Printed geometry/data canary, not just digest tampering.
  o=copy.deepcopy(observed)
  if i in(0,4):o['index']+=1
  elif i in(1,10,12):o['divisor']='6'if i!=12 else'5'
  elif i in(2,5,8):o['perimeter']+=F(1)
  elif i in(3,6,9,11):o['total']+=F(1)
  elif i==7:o['triangleSide']+=F(1)
  rejected(lambda:solve(row,i,o))
  h=hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();sheet=i//6+1
  entries.append({'editionId':row['editionId'],'sha256':h,'verdict':'verified','method':'independent_actual_SVG_physical_text_topology_observer_exact_Fraction_full_Euclidean_digit_domains_and_native343px_review','notes':[notes[i],'Full saved/new conditions, official/authored complete solutions and every MCQ read; source and native343px contact sheets inspected. Author solver and params not imported.'],'figureReview':{'status':'verified','sha256':sha,'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['All3archived-source sheets and all3native343px contact sheets visually inspected; every figure covered.','Actual XML text, positions, contiguous/equal cells, tick calibration, dimension labels, single/double equality marks and no raster/scripts checked independently of author data attributes.',notes[i],'Displayed numeric givens and requested quantity do not disclose the answer; mobile text legible and unclipped.']},'evidence':{'oracle':'scripts/editorial/review-visual-wave62.py','sourceSheet':f'output/editorial-visual-wave62/visual-wave62-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave62/visual-wave62-contact-{sheet}.png','mobilePng':'output/editorial-visual-wave62/'+row['editionId']+'-343.png','mobileWidthPx':343,'figureSha256':sha}})
 # Independent complete family domains, rather than a few hand-picked arithmetic examples.
 division_domains=0
 for d in range(1,10):
  for raw in range(100,10000):
   text,q,steps,rem=division(raw,2,d);assert int(q.replace(',',''))*d+rem==raw;assert 0<=rem<d;division_domains+=1
 out={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave62.py','fullSavedAndNewRead':13,'fullSolutionsAndEveryChoiceRead':True,'sourceSheetsInspected':3,'native343pxSheetsInspected':3,'actualSVGPhysicalObservers':13,'wrongKeysRejected':13,'observedPrintedGivenCanariesRejected':13,'completeEuclideanDivisionWitnesses':division_domains,'hiddenSourceAndNew9000Domains':2,'hiddenSourceAndNew90Domains':2,'authorSolverImported':False,'independentReviewNotWholeBankAudit':True,'findings':[]},'entries':entries};(ROOT/REPORT).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({**out['evidence'],'hashes':len(entries),'report':REPORT}))
if __name__=='__main__':run()
