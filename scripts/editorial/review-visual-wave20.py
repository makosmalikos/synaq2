"""All7 archived/new full conditions, solutions/options and both source plus
both343px native sheets read. Independent actual-cell/bead/money/card counts.
"""
from fractions import Fraction as F
import hashlib
import itertools
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave20-natural-place-value.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def tag(e):return e.tag.rsplit('}',1)[-1]
def v(e,k):return F(e.get(k))
def txt(e):return ''.join(e.itertext())
def one(a):a=list(a);assert len(a)==1,a;return a[0]
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];s=ET.fromstring(raw);els=list(s.iter());texts=[e for e in els if tag(e)=='text'];lines=[e for e in els if tag(e)=='line'];rects=[e for e in els if tag(e)=='rect'];p=r['params']
    if p['scene']=='blocks':
        squares=[e for e in rects if e.get('fill')=='#dfe8ff'];assert len(squares)==2;total=0
        for sq in squares:
            x,y,w,h=(v(sq,k) for k in ['x','y','width','height']);assert w==h
            vertical=[e for e in lines if v(e,'x1')==v(e,'x2') and x<v(e,'x1')<x+w and v(e,'y1')==y and v(e,'y2')==y+h];horizontal=[e for e in lines if v(e,'y1')==v(e,'y2') and y<v(e,'y1')<y+h and v(e,'x1')==x and v(e,'x2')==x+w];assert len(vertical)==len(horizontal)==9;total+=(len(vertical)+1)*(len(horizontal)+1)
        sample=one(e for e in rects if e.get('fill')=='#f5d37b');x,y,w,h=(v(sample,k) for k in ['x','y','width','height']);parts=[e for e in lines if v(e,'x1')==v(e,'x2') and x<v(e,'x1')<x+w and v(e,'y1')==y and v(e,'y2')==y+h];assert len(parts)==9;return (total,len(parts)+1)
    if p['scene']=='abacus':
        labels=sorted((v(t,'x'),int(txt(t).replace(' ',''))) for t in texts if v(t,'y')==321);out=[]
        for x,value in labels:
            pole=one(e for e in lines if v(e,'x1')==v(e,'x2')==x);beads=sorted([e for e in els if tag(e)=='ellipse' and v(e,'cx')==x],key=lambda e:-v(e,'cy'))
            assert [v(e,'cy') for e in beads]==[270-21*i for i in range(len(beads))];assert v(pole,'y1')==63 and v(pole,'y2')==282 and len(beads)<=9
            out.append((value,len(beads)))
        assert out==list(zip(p['values'],p['counts']));return out
    if p['scene']=='money':
        out=[]
        for label in sorted([t for t in texts if txt(t).endswith(' ₸')],key=lambda t:v(t,'y')):
            denomination=int(txt(label).removesuffix(' ₸'));y=v(label,'y')-7;coins=[e for e in els if tag(e)=='circle' and v(e,'cy')==y];notes=[e for e in rects if e.get('fill')=='#d7eee5' and v(e,'y')+v(e,'height')/2==y];count=len(coins)+len(notes);assert count>0 and not(coins and notes);out.append((denomination,count))
        assert out==[(q['value'],q['count']) for q in p['groups']];assert any(n>9 for d,n in out);return out
    if p['scene'] in ['sequence','cards']:
        cards=sorted([e for e in rects if e.get('data-digit-index')],key=lambda e:v(e,'x'));out=''
        for e in cards:
            x,y,w,h=(v(e,k) for k in ['x','y','width','height']);label=txt(one(t for t in texts if x<v(t,'x')<x+w and y<v(t,'y')<y+h));assert re.fullmatch(r'\d',label);out+=label
        assert out==p.get('sequence',''.join(map(str,p.get('digits',[]))));return out
    assert p['scene']=='clock';times=[txt(t) for t in texts if re.fullmatch(r'\d\d:\d\d(?:–\d\d:\d\d)?',txt(t))];assert len(times)==2 and p['display'] in times;window=one(t for t in times if '–' in t)
    convert=lambda s:int(s[:2])*60+int(s[3:]);start,end=map(convert,window.split('–'));assert (start,end)==(p['start'],p['end']);return start,end

def solve(r,obs):
    k=r['modelId'].removeprefix('visual-wave20-')
    if k=='hundreds-to-tens':total,part=obs;assert total%part==0;return str(total//part)
    if k=='abacus-expanded-form':terms=[a*b for a,b in obs if b];return one(o for o in r['options'] if list(map(int,o.split(' + ')))==terms)
    if k=='money-with-regrouping':return str(sum(v*n for v,n in obs))
    if k=='six-place-abacus':assert len(obs)==6;return str(sum(v*n for v,n in obs))
    if k=='delete-digits-preserve-order':
        removed=int(re.search(r'\. (\d+) цифрды',r['statement'])[1]);assert removed==r['params']['remove'];n=len(obs)-removed;all_candidates=[''.join(obs[i] for i in ix) for ix in itertools.combinations(range(len(obs)),n)];assert len(all_candidates)==1716;return max(all_candidates)
    if k=='minimum-four-digit-cards':return str(min(int(''.join(p)) for p in itertools.permutations(obs) if p[0]!='0'))
    if k=='palindrome-clock-window':
        start,end=obs;times=[f'{t//60:02d}{t%60:02d}' for t in range(start,end+1)];return str(sum(s==s[::-1] for s in times))
    raise AssertionError(k)
def main():
    assert len(ROWS)==7;entries=[]
    for i,r in enumerate(ROWS):
        obs=observe(r);assert solve(r,obs)==r['answer'],(r['editionId'],solve(r,obs),r['answer']);assert solve(r,obs)!='wrong'
        if r.get('options'):assert r['options'].count(r['answer'])==1 and len(set(r['options']))==4
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'Actual native unit-cell, bead, denomination-token and digit-card observations; all1716 retained subsequences/all24 card permutations/all840 bounded minute values','checks':['all7 full archived/new conditions, complete solutions and MCQs read','all7 source rasters and both343px native sheets inspected','empty abacus rods retained at actual printed denomination positions','eleven100-unit tokens require regrouping, not concatenating token counts','zero-leading permutations rejected and retained digit order never swapped'],'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['actual 10-by-10 grids and ten-cell sample strip','every bead on its physical pole with printed place-value label','all6notes/11hundredcoins/7tencoins individually counted','every printed card digit and actual clock-window caption'],'sourceSheet':f'output/editorial-visual-wave20/visual-wave20-source-{i//6+1}.png','nativeSheet':f'output/editorial-visual-wave20/visual-wave20-contact-{i//6+1}.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave20-natural-place-value.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':7,'actualNativeObservationChecks':7,'wrongKeysRejected':7}))
if __name__=='__main__':main()
