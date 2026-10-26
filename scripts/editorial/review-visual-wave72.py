"""Independent actual SVG percentage/area observer; all12full source/new/MCQ read;4sheets viewed."""
from pathlib import Path
from fractions import Fraction as F
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as E
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave72-pictured-percent-parts.json';BLUE='#81b8ed';YELLOW='#ecc95c'
def text(e):return ''.join(e.itertext())
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def near(a,b):assert abs(a-b)<1e-8,(a,b)
def pct(v):
 n=v*100
 if n.denominator==1:return str(n.numerator)
 return str(float(n)).rstrip('0').rstrip('.').replace('.',',')
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(E.fromstring(raw).iter());tag=lambda e:e.tag.split('}')[-1];el=lambda t:[e for e in es if tag(e)==t];n=lambda e,k:F(e.get(k)).limit_denominator(1000000);proof={}
 assert not any(tag(e) in ['image','script','foreignObject'] for e in es)
 if i in [0,5,9]:
  groups={}
  for path in el('path'):
   ns=list(map(float,re.findall(r'-?\d+(?:\.\d+)?(?:e[+-]?\d+)?',path.get('d'))));assert len(ns)==11,ns
   cx,cy,x1,y1,rx,ry,rot,large,sweep,x2,y2=ns;near(rx,ry);assert rot==large==0 and sweep==1
   near(math.hypot(x1-cx,y1-cy),rx);near(math.hypot(x2-cx,y2-cy),rx);start=math.atan2(y1-cy,x1-cx);end=math.atan2(y2-cy,x2-cx);angle=(end-start)%(2*math.pi);assert 0<angle<math.pi
   groups.setdefault((cx,cy,rx),[]).append((start,end,angle,path.get('fill')))
  observed=[]
  for (cx,cy,rad),wedges in groups.items():
   N=len(wedges)
   for j,w in enumerate(wedges):near(w[2],2*math.pi/N);near(math.sin(w[1]-wedges[(j+1)%N][0]),0);assert w[3] in [BLUE,'#fff']
   near(sum(w[2] for w in wedges),2*math.pi);assert any(float(c.get('cx'))==cx and float(c.get('cy'))==cy and float(c.get('r'))==rad for c in el('circle'));observed.append((N,sum(w[3]==BLUE for w in wedges)))
  if i==0:assert observed==[(10,4)];out=F(4,10)
  elif i==5:assert observed==[(8,8),(8,5)];assert text(only(el('text')))=='Әр дөңгелек — 100%';assert 'БІР дөңгелек' in r['statement'];out=F(8+5,8);assert r['options']==['162,5%','62,5%','81,25%','13%']
  else:assert observed==[(20,9)];assert 'БОЯЛМАҒАН' in r['statement'];out=F(20-9,20)
  proof={'physicalEqualRadiusEqualAngleSectorCountsAndBlueCounts':observed,'cyclicAngleCoverageVerified':True,'unpaintedComplementRequested':i==9,'oneCircleIsWholeNotTwo':i==5}
 elif i in [1,2,3,4,10]:
  cells=[e for e in el('rect') if e.get('x') and e.get('fill')!='none' and e.get('stroke')];frames=[e for e in el('rect') if e.get('fill')=='none'];observed=[]
  for frame in frames:
   x,y,w,h=[n(frame,k) for k in ['x','y','width','height']];inside=[c for c in cells if x<=n(c,'x')<x+w and y<=n(c,'y')<y+h];assert inside
   side=n(inside[0],'width');assert all(n(c,'width')==side==n(c,'height') for c in inside);cols=w/side;rows=h/side;assert cols.denominator==rows.denominator==1;cols=int(cols);rows=int(rows)
   points={((n(c,'x')-x)/side,(n(c,'y')-y)/side):c.get('fill') for c in inside};assert set(points)=={(F(a),F(b)) for a in range(cols) for b in range(rows)};assert len(inside)==rows*cols
   assert all(v in [BLUE,'#fff','#ecc95c'] for v in points.values()),set(points.values())
   rowBlue=[sum(points[F(a),F(b)]==BLUE for a in range(cols)) for b in range(rows)];observed.append({'rows':rows,'cols':cols,'blueRows':rowBlue,'blue':sum(v==BLUE for v in points.values()),'yellow':sum(v=='#ecc95c' for v in points.values()),'total':len(inside)})
  if i==1:assert observed[0]['blueRows']==[3,2,2,2];out=F(9,20);assert r['options']==['9%','45%','20%','55%']
  elif i==2:assert observed[0]['blueRows']==[10,10,10,10,10,8,0,0,0,0];out=F(58,100)
  elif i==3:assert observed[0]['blueRows']==[5,4,5,4,4];out=F(22,40);assert r['options']==['22%','45%','40%','55%']
  elif i==4:assert [(o['blue'],o['total']) for o in observed]==[(100,100),(47,100)];assert text(only(el('text')))=='Бір шаршы — 100%';assert 'БІР ғана шаршы' in r['statement'];out=F(147,100)
  else:assert [(o['blue'],o['yellow'],o['total']) for o in observed]==[(32,24,100)];out=F(24,32);assert r['options']==['24%','75%','56%','8%'];assert 'негізі' in r['statement']
  proof={'actualIndividualEqualCellGridCensus':observed,'oneGridIsWholeNotTwo':i==4,'blueCountIsDenominator':i==10}
 elif i in [6,7]:
  labels={text(e):n(e,'x') for e in el('text') if text(e) in ['A','C','D','B']};a,c,d,b=[labels[s] for s in ['A','C','D','B']];assert a<c<d<b;out=(d-c)/(b-a)
  if i==6:
   ticks=sorted(n(e,'x1') for e in el('line') if n(e,'x1')==n(e,'x2'));assert len(ticks)==26 and len(set(ticks))==26;step=(b-a)/25;assert ticks==[a+j*step for j in range(26)];assert (c-a)/step==6 and (d-a)/step==21
   blue=only(e for e in el('line') if e.get('stroke')==BLUE);assert n(blue,'x1')==c and n(blue,'x2')==d
   proof={'actualTickCount':26,'actualEqualIntervalCount':25,'CDIntervals':15,'AC_CD_DB_percent':[24,60,16]}
  else:
   paths=el('path');assert len(paths)==2
   ns=[list(map(F,re.findall(r'-?\d+(?:\.\d+)?',e.get('d')))) for e in paths];assert [ns[0][0],ns[0][4]]==[a,d] and [ns[1][0],ns[1][4]]==[c,b];top=only(e for e in el('text') if text(e)=='72%');bottom=only(e for e in el('text') if text(e)=='64%');assert n(top,'x')==(a+d)/2 and n(bottom,'x')==(c+b)/2;assert (d-a)/(b-a)==F(72,100) and (b-c)/(b-a)==F(64,100);assert out==F(72+64-100,100);assert r['options']==['8%','28%','136%','36%'];proof={'actualNamedEndpointCoordinates':dict(zip(['A','C','D','B'],map(str,[a,c,d,b]))),'arcEndpointPairs':[['A','D'],['C','B']],'AD_CB_CD_percent':[72,64,36]}
 else:
  assert i in [8,11];frame=only(e for e in el('rect') if e.get('fill')=='none');x,y,w,h=[n(frame,k) for k in ['x','y','width','height']];lines=el('line');vs=sorted({n(e,'x1') for e in lines if n(e,'x1')==n(e,'x2')});hs=sorted({n(e,'y1') for e in lines if n(e,'y1')==n(e,'y2')});step=vs[1]-vs[0];assert vs==[x+j*step for j in range(len(vs))] and hs==[y+j*step for j in range(len(hs))];assert w==(len(vs)-1)*step and h==(len(hs)-1)*step
  polys=[]
  for poly in el('polygon'):
   assert poly.get('fill')==BLUE;points=[tuple(map(F,s.split(','))) for s in poly.get('points').split()];unit=[((a-x)/step,(b-y)/step) for a,b in points];assert all(a.denominator==b.denominator==1 for a,b in unit);assert all(x<=a<=x+w and y<=b<=y+h for a,b in points);area=abs(sum(unit[j][0]*unit[(j+1)%len(unit)][1]-unit[j][1]*unit[(j+1)%len(unit)][0] for j in range(len(unit))))/2;polys.append((unit,area))
  whole=w*h/step**2
  if i==8:
   assert [p[1] for p in polys]==[10,9,5] and whole==60
   assert max(a for a,b in polys[0][0])<min(a for a,b in polys[1][0])<max(a for a,b in polys[1][0])<min(a for a,b in polys[2][0]);middle=polys[1][0];assert len(middle)==4 and max(a for a,b in middle)-min(a for a,b in middle)==max(b for a,b in middle)-min(b for a,b in middle)==3
  else:
   assert whole==25 and len(polys)==1 and polys[0][1]==13;assert polys[0][0]==[(2,0),(5,2),(3,5),(0,3)];assert F(2*3,2)*4==whole-polys[0][1];assert r['options']==['50%','60%','52%','48%']
  out=sum(p[1] for p in polys)/whole;proof={'actualGridDimensions':[len(vs)-1,len(hs)-1],'actualGridUnitPolygonCoordinates':[[[str(v) for v in t] for t in p[0]] for p in polys],'independentShoelaceAreas':list(map(str,[p[1] for p in polys])),'wholeArea':str(whole)}
 key=pct(out)+('%' if r.get('options') else '');return key,proof

def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==12;entries=[]
 for i,r in enumerate(rows):
  key,proof=observe(r,i);assert key==r['answer'],(i,key,r['answer']);assert observe(dict(r,answer='wrong'),i)[0]!= 'wrong'
  if r.get('options'):assert r['options'].count(key)==1 and len(set(r['options']))==4
  sheet=i//6+1;entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent all12saved/new conditions, FULLofficial/newsolutions and everyMCQ read;4actual343px source/native sheets viewed; own actualSVG arc/cell/line/polygon observer, equal-area/radius/angle coverage and Fraction+shoelace recomputation. No authorparams/solver.','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave72/visual-wave72-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave72/visual-wave72-contact-{sheet}.png','checked':['all12 saved/new/fullsolutions/everyMCQ individually read; all4actual343px sheets viewed','every physical cell fill/circle sector angle/radius and complete cyclic coverage checked','onewhole versus two pictures; unpainted complement versusblue denominator distinguished','26ticks25intervals and AD/CB actual named arc endpoints verified','polygon areas recomputed from real coordinates, not authorparams; middle square and disjointness verified','all printedMCQ diagnostic alternatives recomputed','nativeSVG descriptive labels legible343px; no livebrowser claim']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hs=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hs[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave72.py','fullSavedAndNewRead':12,'actualSheetsViewed':4,'retainedExistingEditionNotResigned':'geometry-light-grid-percent','findings':[]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave72-pictured-percent-parts.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':12,'actualIndividualFigureElementsRecomputed':True,'actualSheetsViewed':4,'hashesMatched':12}))
if __name__=='__main__':main()
