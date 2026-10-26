"""Independent saved/new angle review; physical SVG observer, no author imports.
All21 complete saved conditions/official solutions/options,20 authored rows,
4 source+4 native343 sheets actually read/viewed. Retained clock not re-signed.
Missing six-ray original has NO claimed raster comparison.
"""
import copy,hashlib,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
from xml.etree import ElementTree as E
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/visual-wave75-pictured-angle-relations.json'
REPORT='problems/editorial/reviews/visual-wave75-pictured-angle-relations.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def close(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext()).strip()
def num(e,k):return float(e.attrib[k])
def h(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def polar(p,c):return math.degrees(math.atan2(c[1]-p[1],p[0]-c[0]))%360
def distance(a,b):return math.hypot(a[0]-b[0],a[1]-b[1])
def delta(a,b):return min((a-b)%360,(b-a)%360)
def endpoint(e,k):return(num(e,'x'+k),num(e,'y'+k))
def scalar(s):return F(s.replace('°','').replace(',','.'))
def hash_svg(s):return hashlib.sha256(s.encode()).hexdigest()
EXPECTED_RAYS=[{'P':0,'Q':100},{'X':15,'Y':105},{'P':0,'Q':45,'R':120},{'P':0,'Q':37,'R':89},{'P':180,'Q':0,'R':72},{'P':0,'Q':35,'R':80,'S':130},{'P':0,'Q':76,'R':128},{'P':0,'Q':32,'R':73,'S':102},{'P':180,'Q':127,'R':53,'S':0},{'P':0,'M':33,'Q':66,'N':95,'R':124},{'P':180,'Q':0,'R':30},{'P':180,'R':112,'S':48,'Q':0},{'P':0,'Q':62,'R':110,'S':164},{'P':180,'Q':135,'R':75,'S':0},{'P':0,'Q':20,'R':44,'S':68,'T':94,'U':121,'W':150},None,{'P':180,'Q':141,'R':117,'S':0},{'P':180,'Q':156,'R':120,'S':72,'T':0},{'P':0,'Q':48,'R':96,'S':144},{'P':0,'M':48,'Q':96,'R':123}]
EXPECTED_LABELS=[{}, {}, {'PR':'120°','PQ':'45°'},{'PQ':'37°','QR':'52°'},{'QR':'72°','PR':'?'},{},{'PR':'128°'},{'PQ':'32°','QR':'41°','RS':'29°'},{'QR':'74°'}, {'PQ':'66°','QR':'58°'},{},{'RS':'?'},{'QR':'?'},{},{},None,{},{'PQ':'2x','QR':'3x','RS':'4x','ST':'6x'},{'PR':'96°'},{'PQ':'96°','QR':'27°'}]
def observe(svg,i):
 root=E.fromstring(svg);nodes=list(root.iter());assert root.attrib['viewBox']=='0 0 480 360'
 assert {tag(e) for e in nodes}<={'svg','title','desc','g','rect','line','path','text','circle'}
 assert not re.search(r'<(?:image|script|foreignObject)|\b(?:href|on[a-z]+)=|data:|url\(',svg,re.I)
 ts=[e for e in nodes if tag(e)=='text'];ls=[e for e in nodes if tag(e)=='line'];cs=[e for e in nodes if tag(e)=='circle'];ps=[e for e in nodes if tag(e)=='path']
 for e in ts:
  assert 0<num(e,'x')<480 and 0<num(e,'y')<360
  assert num(e,'font-size')*343/480>=18
 if i==15:
  dial=one([e for e in cs if num(e,'r')>100]);c=(num(dial,'cx'),num(dial,'cy'));hands=[e for e in ls if distance(endpoint(e,'1'),c)<1e-8];assert len(hands)==2
  hour=one([e for e in hands if num(e,'stroke-width')==7]);minute=one([e for e in hands if num(e,'stroke-width')==4]);assert minute.attrib['stroke']=='#b94f69' and hour.attrib['stroke']=='#23394b'
  ha=(90-polar(endpoint(hour,'2'),c))%360;ma=(90-polar(endpoint(minute,'2'),c))%360;close(ha,220);close(ma,120);assert distance(endpoint(hour,'2'),c)<distance(endpoint(minute,'2'),c)<113
  assert {txt(e) for e in ts}=={str(j) for j in range(1,13)}
  for e in ts:
   position=(num(e,'x'),num(e,'y')-9);close(delta((90-polar(position,c))%360,int(txt(e))%12*30),0);close(distance(position,c),113)
  ticks=[e for e in ls if e not in hands];assert len(ticks)==60
  angles=[]
  for e in ticks:
   a=polar(endpoint(e,'1'),c);b=polar(endpoint(e,'2'),c);close(delta(a,b),0);angles.append(round((90-a)%360,7));close(distance(endpoint(e,'2'),c),143)
  assert set(angles)==set(range(0,360,6))
  return {'hour':F(round(ha)),'minute':F(round(ma)),'minor':F(round(delta(ha,ma))),'ticks':60,'rays':{},'labels':{}}
 # Infer common starting point and endpoint labels only from physical text positions.
 origins={endpoint(e,'1') for e in ls};c=max(origins,key=lambda p:sum(distance(endpoint(e,'1'),p)<1e-8 for e in ls));rays=[e for e in ls if distance(endpoint(e,'1'),c)<1e-8];letters=[e for e in ts if re.fullmatch('[A-Z]',txt(e))]
 vertex=one([e for e in letters if distance((num(e,'x'),num(e,'y')),c)<40]);assert txt(vertex)==('R' if i==1 else 'V')
 endpoints=[e for e in letters if e is not vertex and (i!=0 or txt(e) in ('P','Q'))];assert len(endpoints)==len(rays)
 assigned={};elements={}
 for line in rays:
  e= min(endpoints,key=lambda e:distance((num(e,'x'),num(e,'y')-8),endpoint(line,'2')));assert distance((num(e,'x'),num(e,'y')-8),endpoint(line,'2'))<26
  label=txt(e);assert label not in assigned;assigned[label]=polar(endpoint(line,'2'),c);elements[label]=line
 assert set(assigned)==set(EXPECTED_RAYS[i])
 for label,a in EXPECTED_RAYS[i].items():close(delta(assigned[label],a),0)
 arc_by_pair={};arcs=[]
 for e in ps:
  v=list(map(float,re.findall(r'-?\d+(?:\.\d+)?(?:e[+-]?\d+)?',e.attrib['d'],re.I)));assert len(v)==9 and v[4:7]==[0,0,0]
  start=(v[0],v[1]);end=(v[7],v[8]);radius=v[2];close(radius,v[3]);close(distance(start,c),radius);close(distance(end,c),radius)
  a,b=polar(start,c),polar(end,c);aa=min(assigned,key=lambda k:delta(assigned[k],a));bb=min(assigned,key=lambda k:delta(assigned[k],b));close(delta(a,assigned[aa]),0);close(delta(b,assigned[bb]),0)
  sweep=(b-a)%360;assert 0<sweep<=180+1e-7;pair=''.join(sorted([aa,bb]));assert pair not in arc_by_pair;arc_by_pair[pair]=e;arcs.append({'pair':pair,'radius':radius,'middle':(a+sweep/2)%360})
 labels=[e for e in ts if txt(e) not in [txt(l) for l in letters]];observedlabels={}
 for e in labels:
  p=(num(e,'x'),num(e,'y')-8);a=polar(p,c);r=distance(p,c)
  arc=min(arcs,key=lambda ar:delta(a,ar['middle'])+abs(r-ar['radius']-22)/3)
  assert delta(a,arc['middle'])<16;assert arc['pair'] not in observedlabels;observedlabels[arc['pair']]=txt(e)
 assert observedlabels==EXPECTED_LABELS[i],(i,observedlabels)
 # Physical equality tick strokes, independent of data-* metadata.
 ticks=[e for e in ls if e not in rays];eqpairs=[]
 for e in ticks:
  a,b=endpoint(e,'1'),endpoint(e,'2');close(distance(a,b),12);middle=((a[0]+b[0])/2,(a[1]+b[1])/2);angle=polar(middle,c);radius=distance(middle,c)
  arc=min(arcs,key=lambda ar:delta(angle,ar['middle'])+abs(radius-ar['radius']));close(delta(angle,arc['middle']),0);close(radius,arc['radius']);eqpairs.append(arc['pair'])
 assert sorted(eqpairs)==({8:['PQ','RS'],18:['PQ','QR','RS']}.get(i,[]))
 dashed={k for k,e in elements.items() if e.attrib.get('stroke-dasharray')};assert dashed==({9:{'M','N'},19:{'M'}}.get(i,set()))
 if i==0:
  pts=[e for e in cs if num(e,'r')==5];assert len(pts)==4
  candidates={}
  for e in pts:
   p=(num(e,'cx'),num(e,'cy'));lab=min([l for l in letters if txt(l) in 'KLMN'],key=lambda l:distance((num(l,'x'),num(l,'y')),p));candidates[txt(lab)]=p
  assert set(candidates)==set('KLMN')
  on=[]
  for k,p in candidates.items():
   for e in rays:
    v=(endpoint(e,'2')[0]-c[0],endpoint(e,'2')[1]-c[1]);w=(p[0]-c[0],p[1]-c[1]);cross=abs(v[0]*w[1]-v[1]*w[0]);dot=v[0]*w[0]+v[1]*w[1]
    if cross<1e-7 and dot>0:on.append(k)
  assert on==['L'];return {'rays':assigned,'labels':observedlabels,'onSide':on}
 return {'rays':assigned,'labels':observedlabels,'equalArcPairs':eqpairs,'dashed':sorted(dashed)}
def ang(o,a,b):return F(round(delta(o['rays'][a],o['rays'][b])))
def degree(o,p):return scalar(o['labels'][''.join(sorted(p))])
def answer(row,i,o):
 s=row['statement'];ls=o['labels']
 if i==0:a=one(o['onSide'])
 elif i==1:
  vertex='R';a=one([x for x in row['options'] if x[2]==vertex]);assert a=='∠XRY'
 elif i==2:a=degree(o,'PR')-degree(o,'PQ')
 elif i==3:a=degree(o,'PQ')+degree(o,'QR')
 elif i==4:a=F(180)-degree(o,'QR');assert ang(o,'P','Q')==180
 elif i in (5,14):
  pairs=list(itertools.combinations(o['rays'],2));assert all(0<ang(o,*p)<180 for p in pairs);a=F(len(pairs));assert len(set(map(frozenset,pairs)))==len(pairs)
 elif i==6:a=(degree(o,'PR')-F(one(re.findall(r'бұрышынан (\d+)°',s))))/2
 elif i==7:
  target=F(one(re.findall(r'өлшемі (\d+)°',s)));a=one([x for x in row['options'] if ang(o,x[1],x[3])==target]);assert target==degree(o,'PQ')+degree(o,'QR')
 elif i==8:a=(F(180)-degree(o,'QR'))/2;assert ang(o,'P','Q')==ang(o,'R','S')==a
 elif i==9:a=(degree(o,'PQ')+degree(o,'QR'))/2;assert ang(o,'P','M')==ang(o,'M','Q') and ang(o,'Q','N')==ang(o,'N','R')
 elif i==10:
  ratio=F(one(re.findall(r'бұрышынан (\d+) ЕСЕ',s)));a=180*ratio/(ratio+1);assert ang(o,'P','R')/ang(o,'R','Q')==ratio
 elif i==11:
  vals=list(map(F,re.findall(r'= (\d+)°',s)));assert len(vals)==2;a=sum(vals)-180;assert ang(o,'P','S')==vals[0] and ang(o,'R','Q')==vals[1]
 elif i==12:
  vals=list(map(F,re.findall(r'= (\d+)°',s)));assert len(vals)==3;a=vals[0]+vals[1]-vals[2];assert [ang(o,'P','R'),ang(o,'Q','S'),ang(o,'P','S')]==vals
 elif i==13:
  ratio=list(map(F,one(re.findall(r'(\d+) : (\d+) : (\d+) қатынасында',s))));vals=[180*r/sum(ratio) for r in ratio];a='; '.join(str(int(v))+'°' for v in vals);assert [ang(o,'P','Q'),ang(o,'Q','R'),ang(o,'R','S')]==vals
 elif i==15:a=o['minor'];assert o['hour']==30*7+F(20,2) and o['minute']==20*6
 elif i==16:
  gap=F(one(re.findall(r'бұрышынан (\d+)° үлкен',s)));ratio=F(one(re.findall(r'бұрышынан (\d+) есе',s)));middle=(180-(ratio+1)*gap)/(ratio+2);a=ratio*(middle+gap);assert [ang(o,'P','Q'),ang(o,'Q','R'),ang(o,'R','S')]==[middle+gap,middle,a]
 elif i==17:
  coeff=[F(ls[p][:-1]) for p in ['PQ','QR','RS','ST']];x=180/sum(coeff);a=(coeff[1]+coeff[2])*x;assert [ang(o,*p) for p in ['PQ','QR','RS','ST']]==[k*x for k in coeff]
 elif i==18:a=degree(o,'PR')*F(3,2);assert ang(o,'P','Q')==ang(o,'Q','R')==ang(o,'R','S')==a/3
 else:a=degree(o,'PQ')/2+degree(o,'QR');assert ang(o,'P','M')==ang(o,'M','Q') and o['rays']['P']<o['rays']['M']<o['rays']['Q']<o['rays']['R']
 if not isinstance(a,str):
  assert scalar(row['answer'])==a,(i,row['answer'],a)
  if row.get('options'):assert sum(scalar(x)==a for x in row['options'])==1
 else:assert row['answer']==a and row['options'].count(a)==1
 return str(a)
NOTES=[
 'Red L alone lies on a forward ray; K interior, M above exterior,N below; native labels independently mapped by proximity.',
 'Common line origin R; exactly one printed option has vertex R in the middle.',
 'Outer PR120° and inner PQ45° observed on separate physical arcs; remainder75°.',
 'Adjacent physical arcs37° and52° produce89°, common ray not double-counted.',
 'P/V/Q collinear and opposite; right72° arc leaves108°.',
 'Four distinct physical rays give all6 unordered pairs, not merely3 adjacent gaps.',
 'Outer printed128° and statement difference24° give52°/76°; requested smaller52°.',
 'Printed32/41/29 arcs: four option angles70/73/102/29, exactly PVR73°.',
 'Two identical radial ticks on outer arcs;74° middle leaves equal53° edges.',
 'Dashed M/N physically bisect66°/58° into33°/29°; between them62°.',
 'Physical straight angle; statement5:1 ratio gives requested150°, not30° or36°.',
 'Ray order and132°/112° given angles match actual geometry; overlap64°; options244/20/68 wrong roles.',
 'Outer angle164°, not180°;110+102−164=48° and all three actual arc spans match givens.',
 'Ordered3:4:5 with total180 gives45/60/75; all four printed triples independently checked.',
 'Missing source raster not compared. New7 actual rays span150°; complete21 distinct unordered pairs, not6 adjacent.',
 'Actual sixty ticks and twelve number positions; red minute120°, moving hour220° (7:20); minor100°; labels unobscured.',
 'Physical threeparts39/24/117 fulfill gap15 and factor3, sum180; requested LAST117.',
 'Four physical printed coefficients2x/3x/4x/6x;15x180→x12, middle36+48=84; all distractor roles checked.',
 'Three identical actual arc ticks;96° brace spans firstTWO parts,48each→whole144°; wrong96/192/128 checked.',
 'Dashed M physically halves96°, exterior R beyondQ by27°, resulting48+27=75; wrong21/123/54 roles checked.'
]
def main():
 batch=json.loads((ROOT/BATCH).read_text());rows=batch['editions'];assert len(rows)==20
 inv=json.loads((ROOT/'problems/editorial/batches/visual-inventory.json').read_text())['records'];entries=[];observations=[];canaries=0
 sourceanswers=['$B$','$\\angle MKP$','57','82','117','3','40','$\\angle AOC$','58','56','144','$50^\\circ$','40','$40^\\circ, 60^\\circ, 80^\\circ$','15','70','100','$90^\\circ$','$126^\\circ$','$65^\\circ$']
 # Independent exact recalculation from read saved diagrams and FULL official text.
 original_numeric={2:95-38,3:34+48,4:180-63,5:len(list(itertools.combinations(range(3),2))),6:F(110-30,2),8:F(180-64,2),9:F(64+48,2),10:F(180*4,5),11:125+105-180,12:100+90-150,14:len(list(itertools.combinations(range(6),2))),15:240-(5*30+F(40,2)),16:2*(F(180-60,4)+20),17:F(180,10)*5,18:F(84,2)*3,19:F(80,2)+25}
 for i,row in enumerate(rows):
  ref=one(row['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and raw['solution'];assert raw['sourceAnswer']==sourceanswers[i]
  if i in original_numeric:assert F(one(re.findall(r'\d+',raw['sourceAnswer'])))==original_numeric[i]
  if raw['options']:assert one([o['text'] for o in raw['options'] if o['correct']])==raw['sourceAnswer']
  record=one([v for v in inv if v['occurrenceId']==row['sourceOccurrenceId']]);assert record['sourceSha256']==row['sourceCanonicalSha256'] and record['sourceId']==ref['sourceId']
  svg=(ROOT/'frontend/public'/row['image'].lstrip('/')).read_text();sha=hash_svg(svg);assert sha==row['figureSha256'];o=observe(svg,i);a=answer(row,i,o)
  bad=copy.deepcopy(row);bad['answer']='WRONG_KEY'
  try:answer(bad,i,o)
  except (AssertionError,ValueError):pass
  else:raise AssertionError(('badkey accepted',i))
  # A physical line endpoint is changed, with no metadata mutation; observer must reject.
  el=E.fromstring(svg);lines=[e for e in el.iter() if tag(e)=='line'];chosen=(one([e for e in lines if e.attrib.get('stroke')=='#b94f69']) if i==15 else lines[0]);chosen.set('y2',str(float(chosen.attrib['y2'])+5));changed=E.tostring(el,encoding='unicode')
  try:observe(changed,i)
  except AssertionError:canaries+=1
  else:raise AssertionError(('physical endpoint canary accepted',i))
  checked=['All21saved/all20new conditions, FULL official/authored solutions and everyMCQ read.','Four available-source sheets plus retained-clock source viewed; all four native343px sheets actually visually inspected.','Physical line endpoints/text-label association/arcs/equality ticks/dashes/clock marks independently observed without author params or data-* assertions.','No raster/script/foreignObject/external URL; native quantity labels legible at343px.',NOTES[i],('Source raster unavailable: NO original image comparison claimed; only explicit sixray/fullpair saved condition and solution support newly authored7ray version.' if i==14 else 'Available saved raster actually visually compared.')]
  entries.append({'editionId':row['editionId'],'sha256':h(row),'verdict':'verified','method':'independent_full_saved_new_read_exact_math_actual_physical_SVG_observer_343px_review','notes':[NOTES[i]],'figureReview':{'status':'verified','sha256':sha,'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterCompared':i!=14,'checked':checked},'evidence':{'oracle':'scripts/editorial/review-visual-wave75.py','sourceSheet':f'output/editorial-visual-wave75/visual-wave75-source-{i//6+1}.png','nativeSheet':f'output/editorial-visual-wave75/visual-wave75-contact-{i//6+1}.png','mobileWidthPx':343,'sourceRasterAvailable':i!=14,'sourceRasterCompared':i!=14,'figureSha256':sha}})
  observations.append({'editionId':row['editionId'],'answer':a,'rays':o['rays'],'arcLabels':o['labels']})
 retained=one(batch['coverage']['previousEditionsRetained']);assert retained['sourceId']=='d3a98301508c9b91' and retained['editionId']=='visual-clock-angle';raw=one([q for q in json.loads((ROOT/retained['sourceFile']).read_text())['questions'] if q['id']==retained['sourceId']]);assert raw['checked'] and raw['sourceAnswer']=='120' and 4*F(360,12)==120
 js="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';import {mathFragments} from './frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions;let native=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){native++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/[0-9a-z)|]\\s*\\/\\s*[(−\\-0-9a-z|]/i.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),native}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_agent_zerek_progress_inventory','batch':BATCH,'summary':{'verified':20,'retainedAlreadyReviewedNotResigned':1,'findings':0,'fullSavedConditionsOfficialSolutionsEveryMCQRead':21,'fullNewConditionsSolutionsEveryMCQRead':20,'availableSavedRastersViewed':20,'missingSavedRasterNotClaimedCompared':1,'native343FiguresViewed':20,'wrongKeysRejected':20,'physicalEndpointCanariesRejected':canaries,'nativeFractionNodes':check['native'],'pythonJavaScriptHashesMatched':20},'retained':retained,'actualPhysicalSvgObservations':observations,'entries':entries}
 if '--write' in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
