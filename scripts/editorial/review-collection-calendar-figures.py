"""Last3 frozen calendar figures. Full source/new text, official/new solutions,
all4 source/new MCQs when present, and all3 archived source PNGs viewed. New
343px native SVG previews inspected after adjusting hands to avoid numeral overlap.
Same root author wrote separate numerical/geometric review; no separate human
or agent review. Actual endpoints, all ticks/numerals and unknown placeholder read.
"""
import copy,hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-calendar-figures';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json';NS={'s':'http://www.w3.org/2000/svg'}
def one(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def angle(v):return math.degrees(math.atan2(v[0],-v[1]))%360
def angular_difference(a,b):return abs((a-b+180)%360-180)
def geometry(r,raw=None):
 raw=(ROOT/('frontend/public'+r['image'])).read_bytes()if raw is None else raw;root=ET.fromstring(raw);assert not re.search(rb'<image|<script|<foreignObject|href=|onload=|data:',raw)
 seq='солдан оңға'in r['statement'];assert root.attrib['viewBox']==('0 0 660 450'if seq else'0 0 360 300');groups=root.findall('.//s:g[@id]',NS);assert len(groups)==(6 if seq else 1);known=[];ticks=0;numerals=0
 def close(a,b):assert abs(float(a)-float(b))<0.00015,(a,b)
 def projected(c,length,degrees):return(c[0]+length*math.sin(math.radians(degrees)),c[1]-length*math.cos(math.radians(degrees)))
 def edge(e):return tuple(float(e.attrib[k])for k in['x1','y1','x2','y2'])
 for index,g in enumerate(groups):
  c=(110+220*(index%3),110+220*(index//3))if seq else(180,145);rad=86 if seq else 112;disc=one(g.findall('s:circle',NS)[:1]);assert tuple(float(disc.attrib[k])for k in['cx','cy','r'])==(*c,rad)
  lines={e.attrib['id']:e for e in g.findall('s:line',NS)};texts={e.attrib['id']:e for e in g.findall('s:text',NS)};gid=g.attrib['id']
  if seq:
   order=texts.pop(gid+'-order');assert order.text==str(index+1)and float(order.attrib['x'])==c[0]and float(order.attrib['y'])==c[1]+rad+21
  if seq and index==5:
   assert not lines and set(texts)=={'unknown'}and texts['unknown'].text=='?';assert float(texts['unknown'].attrib['x'])==c[0]and float(texts['unknown'].attrib['y'])==c[1];continue
  assert len(lines)==62 and len(texts)==12
  for j in range(60):
   line=lines[gid+'-tick-'+str(j)];a=projected(c,rad-4,j*6);b=projected(c,rad-(12 if j%5==0 else 7),j*6)
   for actual,expected in zip(edge(line),(*a,*b)):close(actual,expected)
   ticks+=1
  for h in range(1,13):
   label=texts[gid+'-label-'+str(h)];assert label.text==str(h);x,y=projected(c,rad-24,h*30);close(label.attrib['x'],x);close(label.attrib['y'],y);numerals+=1
  decoded={}
  for kind in['hour','minute']:
   e=lines[gid+'-'+kind];x1,y1,x2,y2=edge(e);assert(x1,y1)==c;v=(x2-x1,y2-y1);length=math.hypot(*v);wanted=rad*.4 if kind=='hour'else rad-38;assert abs(length-wanted)<0.00015
   decoded[kind]=angle(v)
  m=round(decoded['minute']/6)%60;assert angular_difference(decoded['minute'],m*6)<0.00015
  h=round((decoded['hour']-m/2)/30)%12;assert angular_difference(decoded['hour'],h*30+m/2)<0.00015
  known.append({'hour':h,'minute':m,'mod720':h*60+m,'actualHourAngle':decoded['hour'],'actualMinuteAngle':decoded['minute']})
 return{'sha256':hashlib.sha256(raw).hexdigest(),'decodedActualHands':known,'everyTickChecked':ticks,'everyNumeralPositionChecked':numerals,'unknownSlots':1 if seq else 0}
def clock_minutes(s):
 h,m=map(int,s.split(':'));assert 1<=h<=12 and 0<=m<60;return(h%12)*60+m

def solve(r):
 proof=geometry(r);times=[t['mod720']for t in proof['decodedActualHands']]
 if proof['unknownSlots']:
  assert len(times)==5;deltas=[(b-a)%720 for a,b in zip(times,times[1:])];assert len(set(deltas))==1 and deltas[0]>0;answer=(times[-1]+deltas[0])%720;matches=[o for o in r['options']if clock_minutes(o)==answer];assert len(matches)==1 and matches[0]==r['answer'];proof['allModularForwardIntervals']=deltas;proof['answer']=matches[0]
 else:
  time=one(times);h,m=divmod(time,60);hour=F(h*30)+F(m,2);minute=F(m*6);difference=abs(hour-minute);wanted=min(difference,360-difference);assert wanted.denominator==1 and r['answer']==str(int(wanted));assert'options'not in r;proof['exactAngle']=str(wanted);proof['answer']=r['answer']
 return proof

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==3;entries=[];evidence=[];keys=0;geometry_canaries=0
 source_info={18:('a25b8b86e185f34a04031524.png','9c37ae3426839340aed1a5dcfcf963c6153eff2af806e649c99cfc341a0c12c3',[(2,20)]),19:('939f8fe2116e7f52404de8b7.png','1c2a2300638fa74663b4639f2834e07cd9c6da75823a8bd99af234e1431780e3',[(10,40)]),23:('1f874596494e2f11b3db0354.png','b08097c94961b70d307ffa7d209e056dc9e0a2b2e7a03516863413033ca1dd50',[(7,15),(8,45),(10,15),(11,45),(1,15)])}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert len(q['images'])==1 and q['solution'];filename,sha,source_hands=source_info[i];raw=(ROOT/'problems/sources/zerek/images'/filename).read_bytes();assert hashlib.sha256(raw).hexdigest()==sha
  if i in{18,19}:
   h,m=one(source_hands);diff=abs(F(h*30)+F(m,2)-m*6);wanted=min(diff,360-diff);assert q['sourceAnswer']is None and q['options']==[]and q['openAnswerText'];assert re.search(r'Дұрыс жауап:\s*'+str(wanted)+r'\b',q['openAnswerText']);assert re.search(r'Жауабы:\s*'+str(wanted)+r'\b',q['solution']);sourceProof={'visuallyReadTime':f'{h}:{m:02d}','computedAngle':str(wanted),'officialAndOpenReviewAgree':True}
  else:
   ts=[h*60+m for h,m in source_hands];deltas=[(b-a)%720 for a,b in zip(ts,ts[1:])];assert len(set(deltas))==1;wanted=(ts[-1]+deltas[0])%720;matches=[o for o in q['options']if clock_minutes(o['text'])==wanted];assert len(matches)==1 and matches[0]['correct']and matches[0]['text']==q['sourceAnswer'];sourceProof={'visuallyReadTimes':[f'{h}:{m:02d}'for h,m in source_hands],'allMod720Intervals':deltas,'computedNext':q['sourceAnswer']}
  proof=solve(r);assert r['minimumPlan']=='pro'and r['grade']==5 and r['statement']!=q['statement']and not re.search(r'[\\$]',r['statement']+r['solution'])
  bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:solve(bad)
  except AssertionError:keys+=1
  else:raise AssertionError(('wrongkeyaccepted',i))
  svg=(ROOT/('frontend/public'+r['image'])).read_bytes();root=ET.fromstring(svg);hand=one(root.findall('.//s:line[@id="'+('dial-0-minute'if i==23 else'dial-minute')+'"]',NS));hand.set('x2',str(float(hand.attrib['x2'])+1));mutated=ET.tostring(root)
  try:geometry(r,mutated)
  except AssertionError:geometry_canaries+=1
  else:raise AssertionError(('actual coordinate mutation accepted',i))
  evidence.append({'editionId':r['editionId'],'savedSource':sourceProof,'rewritten':proof});entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All3saved rasters/full source/new text/full solutions/allMCQs read. Actual SVG endpoints independently decoded, all tick/numeral positions and lengths verified; exact Fraction angles or all mod720 intervals. Wrong keys and actual coordinate mutations rejected. Same root author, no separate human reviewer.','notes':[json.dumps(proof)],'figureReview':{'status':'verified','sha256':proof['sha256'],'method':'Original native geometry, no tracing; independently checked actual endpoints, all ticks/numerals and placeholders, full source rasters viewed, final343px previews inspected after removing numeral/hand overlap.'}})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rows.map(r=>[r.editionId,editionHash(r)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':3,'sourceAnswerFieldNull':2,'sourceOpenReviewAnswersAvailable':2,'allSourceNewFullTextAndAvailableMCQsRead':3,'wrongKeysRejected':keys,'actualFigureCoordinateMutationsRejected':geometry_canaries,'tickPositionsChecked':sum(e['rewritten']['everyTickChecked']for e in evidence),'numeralPositionsChecked':sum(e['rewritten']['everyNumeralPositionChecked']for e in evidence),'originalFigures':3,'pythonJavaScriptHashesMatched':3,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','scope':__doc__,'summary':summary,'evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
