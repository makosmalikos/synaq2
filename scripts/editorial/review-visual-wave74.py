"""Independent all11 inverse-percent visual review, saved sources only.

Ten available archived rasters in two source sheets and all11 native343px
renderings in two contact sheets actually inspected. Missing17441249be34ba61
has NO claimed raster comparison: only the complete saved official A/B/gap
structure supports its newly authored, differently numbered native figure.
No author specs, params, renderer or solver imported.
"""
import copy,hashlib,json,re,subprocess,sys
from collections import Counter
from fractions import Fraction as F
from pathlib import Path
from xml.etree import ElementTree as E
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/visual-wave74-pictured-inverse-percent.json';REPORT='problems/editorial/reviews/visual-wave74-pictured-inverse-percent.json'
BLUE='#81b8ed';YELLOW='#ecc95c';WHITE='#fff';TOL=F(1,10**9)
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def close(a,b):assert abs(F(a)-F(b))<TOL,(a,b)
def tag(e):return e.tag.rsplit('}',1)[-1]
def text(e):return ''.join(e.itertext()).strip()
def n(e,key):return F(e.attrib[key])
def clean(s):return str(s).replace('$','').replace('\\,','').replace('{,}',',').replace('−','-')
def number(s):return F(one(re.findall(r'-?\d+(?:[,.]\d+)?',clean(s))).replace(',','.'))
def grab(s,pattern):return F(one(re.findall(pattern,clean(s))).replace(',','.'))
def hashrow(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def svg_observe(svg,i):
 root=E.fromstring(svg);nodes=list(root.iter());assert root.attrib['viewBox']=='0 0 480 360'
 assert {tag(e) for e in nodes}<={'svg','title','desc','g','rect','line','path','text','circle'}
 assert not re.search(r'<(?:image|script|foreignObject)|\b(?:href|on[a-z]+)=|data:|url\(',svg,re.I)
 ts=[e for e in nodes if tag(e)=='text'];rs=[e for e in nodes if tag(e)=='rect' and 'rx' not in e.attrib and e.attrib.get('fill')!='none'];lines=[e for e in nodes if tag(e)=='line']
 for e in ts:
  assert 0<n(e,'x')<480 and 0<n(e,'y')<360
  assert n(e,'font-size')*F(343,480)>=17
 if i in (1,2,4,9):
  assert len(rs)==100
  assert all(n(e,'width')==n(e,'height')==26 for e in rs)
  assert {(n(e,'x'),n(e,'y')) for e in rs}=={(110+26*x,50+26*y) for x in range(10) for y in range(10)}
  colors=Counter(e.attrib['fill'] for e in rs);assert set(colors)<={BLUE,YELLOW,WHITE};assert sum(colors.values())==100
  expected={1:{BLUE:27,WHITE:73},2:{BLUE:42,WHITE:58},4:{BLUE:36,YELLOW:28,WHITE:36},9:{BLUE:32,WHITE:68}}[i]
  assert dict(colors)==expected
  return {'blue':F(colors[BLUE],100),'yellow':F(colors[YELLOW],100),'white':F(colors[WHITE],100),'cells':100}
 if i in (0,3,7):
  count={0:5,3:10,7:10}[i];assert len(rs)==count
  rs.sort(key=lambda e:n(e,'x'));width=F(414,count)
  for j,e in enumerate(rs):close(n(e,'x'),30+width*j);close(n(e,'width'),width);assert n(e,'y')==165 and n(e,'height')==64
  blue=[e for e in rs if e.attrib['fill']==BLUE];assert len(blue)=={0:3,3:4,7:3}[i]
  assert blue==rs[:len(blue)] and all(e.attrib['fill']==WHITE for e in rs[len(blue):])
  start=n(blue[0],'x');end=n(blue[-1],'x')+n(blue[-1],'width');brace=one([e for e in lines if n(e,'y1')==n(e,'y2')==125]);close(n(brace,'x1'),start);close(n(brace,'x2'),end)
  label=one([e for e in ts if n(e,'y')==111]);close(n(label,'x'),(start+end)/2)
  known=number(text(label));assert known=={0:18,3:52,7:42}[i]
  scale=[e for e in ts if text(e).endswith('%')];assert {text(e) for e in scale}==({'0%','20%','40%','60%','80%','100%'} if i==0 else {'0%','50%','100%'})
  for e in scale:close((n(e,'x')-30)/414,number(text(e))/100)
  return {'blue':F(len(blue),count),'known':known,'equalParts':count}
 if i==5:
  assert len(rs)==3;rs.sort(key=lambda e:n(e,'x'));assert [e.attrib['fill'] for e in rs]==[BLUE,YELLOW,WHITE]
  boundary=[F(30)];shares=[]
  for e in rs:close(n(e,'x'),boundary[-1]);shares.append(n(e,'width')/414);boundary.append(n(e,'x')+n(e,'width'))
  close(boundary[-1],444);assert shares==[F(1,5),F(9,20),F(7,20)]
  scales=[e for e in ts if text(e).endswith('%')];assert [text(e) for e in scales]==['0%','20%','65%','100%']
  for e,x in zip(scales,boundary):close(n(e,'x'),x)
  brace=one([e for e in lines if n(e,'y1')==n(e,'y2')==125]);close(n(brace,'x1'),boundary[-2]);close(n(brace,'x2'),boundary[-1]);label=one([e for e in ts if n(e,'y')==111]);assert text(label)=='84 бет';close(n(label,'x'),(boundary[-2]+boundary[-1])/2)
  return {'blue':shares[0],'yellow':shares[1],'white':shares[2],'known':F(84)}
 if i==6:
  assert len(rs)==2;rs.sort(key=lambda e:n(e,'x'));assert [e.attrib['fill'] for e in rs]==[YELLOW,BLUE]
  close(n(rs[0],'x'),30);close(n(rs[0],'x')+n(rs[0],'width'),n(rs[1],'x'));close(n(rs[1],'x')+n(rs[1],'width'),444)
  yellow=n(rs[0],'width')/414;blue=n(rs[1],'width')/414;assert (yellow,blue)==(F(2,5),F(3,5))
  pct=one([e for e in ts if n(e,'y')==207]);assert text(pct)=='40%';close(n(pct,'x'),n(rs[0],'x')+n(rs[0],'width')/2)
  brace=one([e for e in lines if n(e,'y1')==n(e,'y2')==125]);close(n(brace,'x1'),n(rs[1],'x'));close(n(brace,'x2'),444)
  label=one([e for e in ts if n(e,'y')==111]);assert text(label)=='42 доп';close(n(label,'x'),n(rs[1],'x')+n(rs[1],'width')/2)
  return {'yellow':yellow,'blue':blue,'known':F(42)}
 if i==8:
  assert len(rs)==2;rs.sort(key=lambda e:n(e,'y'));b,a=rs
  assert n(a,'x')==n(b,'x')==65 and n(a,'height')==n(b,'height')==45
  assert b.attrib['fill']==YELLOW and a.attrib['fill']==BLUE;ratio=n(a,'width')/n(b,'width');assert ratio==F(7,10)
  assert [text(e) for e in ts if n(e,'x')==37]==['B','A']
  endA=n(a,'x')+n(a,'width');endB=n(b,'x')+n(b,'width');gap=one([e for e in lines if e.attrib['stroke']=='#b94f69']);close(n(gap,'x1'),endA);close(n(gap,'x2'),endB)
  label=one([e for e in ts if '₸' in text(e)]);assert text(label)=='2400 ₸';close(n(label,'x'),(endA+endB)/2)
  scales=[e for e in ts if text(e).endswith('%')];assert [text(e) for e in scales]==['0%','70%','100%']
  for e in scales:close((n(e,'x')-65)/n(b,'width'),number(text(e))/100)
  return {'ratio':ratio,'gap':number(text(label))}
 assert i==10
 ticks=sorted([e for e in lines if n(e,'x1')==n(e,'x2') and n(e,'y1')==183 and n(e,'y2')==197],key=lambda e:n(e,'x1'));assert len(ticks)==21
 origin=n(ticks[0],'x1');step=(n(ticks[-1],'x1')-origin)/20
 for j,t in enumerate(ticks):close(n(t,'x1'),origin+j*step)
 zero=one([e for e in ts if text(e)=='0%']);known=one([e for e in ts if text(e)=='30%']);close(n(zero,'x'),origin)
 calibrated=(n(known,'x')-origin)/step;close(calibrated,6)
 point=one([e for e in nodes if tag(e)=='circle']);close(n(point,'cy'),190);idx=(n(point,'cx')-origin)/step;close(idx,14)
 a=one([e for e in ts if text(e)=='A']);close(n(a,'x'),n(point,'cx'));valueLabel=one([e for e in ts if n(e,'y')==233 and n(e,'x')==n(point,'cx')]);assert text(valueLabel)=='35'
 return {'knownPercent':number(text(known)),'calibrationIntervals':F(6),'pointIntervals':F(14),'known':F(35)}

def check_answer(row,i,obs,source=False):
 s=clean(row['statement'])
 if source:
  # These source quantities/counts were actually read from the ten archived
  # rasters. Missing A/B uses ONLY the complete saved official description.
  answers=[F(12)*100/80,F(36)*100/20,F(9)*100/45,F(27)*10/3,F(40)*30/25,F(70)*40/35,F(22)*45/55,F(36)*100/40-36,F(1500)*F(180,20),F(54+21)/(F(54)*100/36)*100,F(21)*100/75]
  answer=answers[i]
 else:
  if i==0:answer=obs['known']/obs['blue']
  elif i==1:answer=grab(s,r'торкөздерге (\d+) саны')/obs['blue']
  elif i==2:answer=grab(s,r'жұмсалған (\d+) кг')/obs['blue']
  elif i==3:answer=obs['known']/obs['blue']
  elif i==4:answer=grab(s,r'САРЫ бөлікке (\d+) түп')/obs['yellow']*obs['blue']
  elif i==5:answer=obs['known']/obs['white']*obs['yellow'];assert obs['yellow']!=F(65,100)
  elif i==6:answer=obs['known']/obs['blue']*obs['yellow']
  elif i==7:answer=obs['known']/obs['blue']-obs['known'];assert 'ҚАЛҒАН' in s
  elif i==8:
   b=obs['gap']/(1-obs['ratio']);a=b*obs['ratio'];answer=a+b;assert b-a==obs['gap']
  elif i==9:
   initial=grab(s,r'торкөздер — (\d+) адам');arrivals=grab(s,r'Кейін (\d+) адам');total=initial/obs['blue'];assert initial+arrivals<=total;answer=(initial+arrivals)/total*100
  else:answer=obs['known']/(obs['knownPercent']/obs['calibrationIntervals']*obs['pointIntervals']/100)
 assert number(row['answer'])==answer,(i,row['answer'],answer)
 if row.get('options'):assert sum(number(o['text'] if isinstance(o,dict) else o)==answer for o in row['options'])==1
 return answer

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];inventory=json.loads((ROOT/'problems/editorial/batches/visual-inventory.json').read_text())['records'];assert len(rows)==11
 entries=[];observations=[];sourceRefs=[];geomCanaries=0
 human=['0–100whole split5 equal cells,3blue;18km brace covers entireblue60%.','Actual10×10 grid:27blue73white;2fullrows+7 blue, known81 from condition.','Actual10×10 grid:42blue58white;4fullrows+2 blue, known21kg.','Actual10 equal strip cells,4blue;52 brace covers all4 cells, not one cell.','Actual10×10 grid:36blue28yellow36white; yellow84 maps to28%, blue target36%.','Cumulative printed boundaries0/20/65/100 match actual segment edges;84brace covers white35%; yellow is45%, not65%.','Printed40% is yellow;42-ball brace covers entire blue60%, so unknownyellow28.','Actual3 of10 cells blue, known42MB; requested remaining7cells98, not total140.','Missing source raster explicitly not visually compared. New A/B left edges match; actual widths252/360=70%; redarrow spans108px gap30%, labelled2400; combined13600.','Actual32blue cells of100; initial64→200seats, then26arrivals→90/200=45%, not90%.','21ticks form20equal intervals;30% label is6intervals from0, A14intervals with35underit→70%, whole50.']
 for i,row in enumerate(rows):
  ref=one(row['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and raw['images'] and raw['solution'];assert clean(raw['statement'])!=clean(row['statement'])
  inv=one([r for r in inventory if r['occurrenceId']==row['sourceOccurrenceId']]);assert inv['sourceId']==ref['sourceId'] and inv['sourceSha256']==row['sourceCanonicalSha256']
  svg=(ROOT/'frontend/public'/row['image'].lstrip('/')).read_text();sha=hashlib.sha256(svg.encode()).hexdigest();assert sha==row['figureSha256'];obs=svg_observe(svg,i);check_answer(row,i,obs);check_answer({**raw,'answer':raw['sourceAnswer']},i,None,True)
  wrong=copy.deepcopy(row);wrong['answer']='WRONG_KEY'
  try:check_answer(wrong,i,obs)
  except (AssertionError,ValueError):pass
  else:raise AssertionError(('bad key accepted',i))
  old,new=({'width="26"':'width="27"'} if i in (1,2,4,9) else {'width="82.8"':'width="83.8"'} if i in (0,5) else {'width="41.4"':'width="42.4"'} if i in (3,7) else {'width="165.6"':'width="166.6"'} if i==6 else {'width="252"':'width="253"'} if i==8 else {'cx="319.8"':'cx="340.5"'}).popitem();assert old in svg;changed=svg.replace(old,new,1)
  try:svg_observe(changed,i)
  except AssertionError:geomCanaries+=1
  else:raise AssertionError(('SVG geometry canary accepted',i))
  checked=['Complete saved/new conditions, FULL official/authored solutions and everyMCQ read.','Both source sheets and both native343px sheets actually visually inspected; all11native figures legible without overlap/clipping.','Actual physical rect/line/text/circle coordinates, fills, brace extents and printed calibration checked independently of author data attributes.','No raster, script, foreignObject, external URL or copied source path.',human[i]]
  checked.append('Ten archived source rasters actually compared; this source is available.' if i!=8 else 'Source17441249be34ba61 raster unavailable: no source-image comparison claimed; only fullsavedofficial A/B/gap structure and ownnewnumeric figure verified.')
  entries.append({'editionId':row['editionId'],'sha256':hashrow(row),'verdict':'verified','method':'independent_full_saved_new_read_printed_Fraction_actual_physical_SVG_observer_native343_visual_review','notes':[human[i]],'figureReview':{'status':'verified','sha256':sha,'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterCompared':i!=8,'checked':checked},'evidence':{'oracle':'scripts/editorial/review-visual-wave74.py','sourceSheet':f'output/editorial-visual-wave74/visual-wave74-source-{1 if i<6 else 2}.png','nativeSheet':f'output/editorial-visual-wave74/visual-wave74-contact-{1 if i<6 else 2}.png','mobileWidthPx':343,'sourceRasterAvailable':i!=8,'sourceRasterCompared':i!=8,'figureSha256':sha}})
  sourceRefs.append(ref);observations.append({k:str(v) for k,v in obs.items()})
 js="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';import {mathFragments} from './frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions;let native=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){native++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/[0-9a-z)|]\\s*\\/\\s*[(−\\-0-9a-z|]/i.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),native}));"
 native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_agent_zerek_progress_inventory','batch':BATCH,'summary':{'verified':11,'findings':0,'fullSavedNewConditionsAndSolutionsAndEveryMCQRead':11,'availableSourceRastersActuallyViewed':10,'unavailableSourceRastersNotClaimedCompared':1,'native343FiguresActuallyViewed':11,'wrongKeysRejected':11,'actualSVGGeometryCanariesRejected':geomCanaries,'nativeFractionNodes':native['native'],'pythonJavaScriptHashesMatched':11},'sourceRefs':sourceRefs,'actualPhysicalSvgObservations':observations,'entries':entries}
 if '--write' in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
