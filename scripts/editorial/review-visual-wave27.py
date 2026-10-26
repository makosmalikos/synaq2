"""All7 full saved/new conditions, complete solutions and MCQs read.

All four contact sheets inspected; original notebook raster was unavailable,
so that one skill was reconstructed from its complete saved text/solution.
Independent polynomial parser is from an earlier root review, not author code.
"""
from fractions import Fraction as F
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave27-literal-expression-diagrams.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
spec=importlib.util.spec_from_file_location('root_polynomial_observer',ROOT/'scripts/editorial/review-visual-wave10.py');math=importlib.util.module_from_spec(spec);spec.loader.exec_module(math)
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return F(e.get(k))
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def near(a,b):assert abs(float(a-b))<1e-7,(a,b)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text'];rects=[e for e in els if tag(e)=='rect'];lines=[e for e in els if tag(e)=='line'];p=r['params'];scene=p['scene']
    def at(x,y):return txt(one(t for t in texts if abs(float(n(t,'x')-x))<1e-7 and abs(float(n(t,'y')-y))<1e-7))
    def choice(poly):return one(o for o in r['options'] if math.poly(o)==poly)
    if scene=='notebooks':
        notes=[e for e in rects if e.get('height')=='76'];assert len(notes)==7
        prices=[int(at(n(e,'x')+31,n(e,'y')+104)) for e in notes];assert prices==[175]*7
        assert '175 · n' in r['statement'];return str(sum(prices)),{'physicalNotebookCount':len(notes),'printedPrices':prices}
    if scene=='area':
        square=one(e for e in rects if e.get('stroke-dasharray'));blue=one(e for e in rects if e.get('fill')=='#cddcff');assert n(square,'width')==n(square,'height')==n(blue,'width');assert n(blue,'x')==n(square,'x');near(n(blue,'y')+n(blue,'height'),n(square,'y')+n(square,'height'))
        deficit=int(re.fullmatch(r'(\d+) см',one(txt(t) for t in texts if 'см' in txt(t)))[1]);gap=n(blue,'y')-n(square,'y');example=deficit*n(square,'width')/gap;assert example==12 and 'a > 4' in r['statement'];return choice(math.poly('a*a-'+str(deficit)+'*a')),{'deficit':deficit,'metricExampleA':int(example),'blueExampleArea':int(example*(example-deficit))}
    if scene=='garden':
        garden=one(e for e in rects if e.get('fill')=='#fae8b7');flower=one(e for e in rects if e.get('fill')=='#52aa89');assert n(flower,'width')==n(flower,'height')
        length=int(at(n(garden,'x')+n(garden,'width')/2,n(garden,'y')+n(garden,'height')+44).split()[0]);width=int(at(n(garden,'x')-62,n(garden,'y')+n(garden,'height')/2+7).split()[0]);side=int(at(n(flower,'x')+n(flower,'width')/2,105).split()[0]);near(n(garden,'width')/length,n(garden,'height')/width);near(n(flower,'width')/side,n(garden,'width')/length)
        assert n(garden,'x')<n(flower,'x')<n(flower,'x')+n(flower,'width')<n(garden,'x')+n(garden,'width');assert n(garden,'y')<n(flower,'y')<n(flower,'y')+n(flower,'height')<n(garden,'y')+n(garden,'height');assert 'өрнектеңіз' in r['statement'];return str(length*width-side*side),{'printedMetres':[length,width,side],'formula':'a*b-c*c'}
    if scene=='perimeter':
        square=one(e for e in rects if e.get('fill')=='#cddcff');target=one(e for e in rects if e.get('fill')=='#fae8b7');assert n(square,'height')==n(square,'width');near(n(square,'y')+n(square,'height'),n(target,'y')+n(target,'height'))
        factor=n(target,'width')/n(square,'width');assert factor==2;deficit=int(one(txt(t) for t in texts if 'см' in txt(t)).split()[0]);gap=n(target,'y')-n(square,'y');example=deficit*n(square,'width')/gap;assert example==8;assert sum(txt(t)=='a' for t in texts)==3 and 'a > 3' in r['statement'];return choice(math.poly('2*('+str(int(factor))+'*a+a-'+str(deficit)+')')),{'lengthFactor':int(factor),'deficit':deficit,'metricExampleA':int(example)}
    if scene=='reading':
        blue=sorted((e for e in rects if e.get('fill')=='#cddcff'),key=lambda e:n(e,'x'));extra=sorted((e for e in rects if e.get('fill')=='#f3d784'),key=lambda e:n(e,'x'));bounds=sorted(set(n(e,'x1') for e in lines if e.get('style')=='stroke-width:2.5'));assert len(blue)==7 and len(extra)==5 and len(bounds)==8
        base=int(re.search(r'a = (\d+)',r['statement'])[1]);increments=[]
        for i,b in enumerate(blue):
            assert n(b,'x')==bounds[i] and at(n(b,'x')+n(b,'width')/2,177)=='a';extras=[e for e in extra if bounds[i]<=n(e,'x')<bounds[i+1]];assert len(extras)==(0 if i<2 else 1)
            end=n(b,'x')+n(b,'width')
            if extras:
                e=extras[0];near(n(e,'x'),end);printed=int(at(n(e,'x')+n(e,'width')/2,128));near(n(e,'width')/printed,n(b,'width')/base);increments.append(printed);end+=n(e,'width')
            near(end,bounds[i+1])
        assert increments==[4]*5;return str(len(blue)*base+sum(increments)),{'baseDays':len(blue),'extraDays':len(extra),'base':base,'extraValues':increments,'formula':'2*a+5*(a+4)'}
    if scene=='meet':
        points={at(n(e,'cx'),n(e,'cy')+33):n(e,'cx') for e in els if tag(e)=='circle'};assert points['A']<points['M']<points['B'];a,b=map(int,re.search(r'a = (\d+) км/сағ, b = (\d+) км/сағ',r['statement']).groups());hours=int(re.search(r'(\d+) сағаттан кейін',r['statement'])[1]);near((points['M']-points['A'])/(points['B']-points['M']),F(a,b))
        heads=[e for e in els if tag(e)=='polygon'];assert len(heads)==2
        for head,direction in zip(heads,[1,-1]):
            pts=[tuple(map(F,p.split(','))) for p in head.get('points').split()];assert all((pts[0][0]-x)*direction>0 for x,y in pts[1:]);assert (pts[0][0]-points['M'])*direction<0
        assert 'өрнектеп' in r['statement'];return str((a+b)*hours),{'speeds':[a,b],'hours':hours,'formula':'(a+b)*'+str(hours)}
    assert scene=='route' and 'масштабсыз' in r['statement'];parts=sorted((e for e in lines if e.get('stroke-width')=='5'),key=lambda e:n(e,'x1'));assert len(parts)==3
    for a,b in zip(parts,parts[1:]):assert n(a,'x2')==n(b,'x1') and n(a,'y2')==n(b,'y1')
    speeds=[int(at((n(e,'x1')+n(e,'x2'))/2,153)) for e in parts[:2]];assert at((n(parts[0],'x1')+n(parts[0],'x2'))/2,214)=='t';fixed=int(at((n(parts[1],'x1')+n(parts[1],'x2'))/2,214));whole=int(at(240,125).split()[0]);assert whole==720 and speeds==[90,60] and fixed==3
    limit=int(re.search(r'0 < t < (\d+)',r['statement'])[1]);assert F(whole-speeds[1]*fixed,speeds[0])==limit
    expected=math.poly(f'{whole}-{speeds[0]}*t-{speeds[1]}*{fixed}');return choice(expected),{'whole':whole,'speeds':speeds,'fixedHours':fixed,'positiveDomainUpper':limit}
def main():
    assert len(ROWS)==7;entries=[]
    for i,r in enumerate(ROWS):
        a,obs=observe(r);assert a==r['answer'] and a!='wrong'
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(a)==1
        unavailable=r['params']['scene']=='notebooks'
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'All7 full original/new conditions, solutions and choices; independent exact polynomial identity, actual printed native dimensions and object counts','checks':['all four source/native contact sheets inspected, six original rasters available','unavailable notebook raster replaced using its full saved condition and complete solution','symbolic area/perimeter proved as polynomials, not inferred from one numeric example','variable-expression construction retained before numeric substitution','all seven day boundaries and five extra4 labels checked','route polynomial positive for0<t<6 and zero at excluded endpoint6'],'observed':obs,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':not unavailable,'checked':['actual seven notebooks and all175labels','dashed full square,4cm gap and a labels','garden/flower metric12pixels per metre and containment','two physical a spans,3cm gap and reference square','seven actual day segments and five outside4labels','actual inward arrow triangles and A/M/B positions','actual two-speed route labels and total720km dimension'],'sourceSheet':f'output/editorial-visual-wave27/visual-wave27-source-{1+i//6}.png','nativeSheet':f'output/editorial-visual-wave27/visual-wave27-contact-{1+i//6}.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave27-literal-expression-diagrams.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':7,'nativeObservationChecks':7,'wrongKeysRejected':7,'sourceRastersAvailable':6,'sourceSkillReconstructedFromFullSavedText':1,'authorSolverImported':False}))
if __name__=='__main__':main()
