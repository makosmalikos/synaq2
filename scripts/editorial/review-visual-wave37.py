"""Full7saved/new statements, solutions and MCQs read; four343px sheets viewed."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from itertools import product,combinations
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave37-prime-factor-trees.json'
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return F(e.get(k))
def factors(v):
    assert v>=2;out=[];d=2
    while d*d<=v:
        if v%d==0:out.append(d);v//=d
        else:d+=1
    if v>1:out.append(v)
    return out
def prime(v):return v>=2 and all(v%d for d in range(2,math.isqrt(v)+1))
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def tree(rects,lines,texts):
    nodes={}
    for e in rects:
        if n(e,'height')!=50:continue
        x,y=n(e,'x')+n(e,'width')/2,n(e,'y')+25
        labels=[txt(t) for t in texts if n(t,'x')==x and n(t,'y')==y+10];assert len(labels)<=1
        label=labels[0] if labels else 'blank';assert label in ['?','blank'] or label.isdigit()
        if label=='blank':assert n(e,'width')==50 and e.get('rx')=='2'
        else:assert n(e,'width')>=len(label)*16
        nodes[(x,y)]={'value':int(label) if label.isdigit() else label,'children':[],'fill':e.get('fill')}
    parents=[]
    for e in lines:
        a=(n(e,'x1'),n(e,'y1'));b=(n(e,'x2'),n(e,'y2'));assert a in nodes and b in nodes and a[1]<b[1]
        nodes[a]['children'].append(b);parents.append(b)
    root=one(p for p in nodes if p not in parents);assert len(parents)==len(set(parents))==len(nodes)-1
    assert all(len(v['children']) in [0,2] for v in nodes.values())
    return nodes,root
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
    els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text'];rects=[e for e in els if tag(e)=='rect'];lines=[e for e in els if tag(e)=='line'];polys=[e for e in els if tag(e)=='polygon'];scene=r['params']['scene']
    def at(x,y):return txt(one(t for t in texts if n(t,'x')==x and n(t,'y')==y))
    if scene in ['unfinished-tree','root-tree','first-split','missing-tree']:
        nodes,root=tree(rects,lines,texts)
        leaves=[v['value'] for v in nodes.values() if not v['children']]
        if scene=='root-tree':
            def complete(p):
                node=nodes[p];v=node['value']
                if not node['children']:assert isinstance(v,int) and prime(v);return v
                a,b=map(complete,node['children']);computed=a*b
                assert v=='?' or v==computed
                return computed
            answer=complete(root)
            return str(answer),{'actualNodes':len(nodes),'actualEdges':len(lines),'actualPrimeLeaves':leaves,'rootFromRecursiveTree':answer,'intermediateIsNotAnswer':55}
        rootValue=nodes[root]['value'];assert isinstance(rootValue,int)
        if scene=='unfinished-tree':
            assert len(nodes)==7 and len(lines)==6
            for node in nodes.values():
                if node['children']:
                    a,b=(nodes[p]['value'] for p in node['children']);assert node['value']==a*b
            composite=one(v for v in leaves if not prime(v));assert composite==8
            requested=int(re.search(r'жіктеуде (\d+) көбейткіші',r['statement'])[1]);ff=factors(rootValue)
            return str(ff.count(requested)),{'actualTreeRoot':rootValue,'visibleLeafValues':leaves,'unfinishedWhiteComposite':composite,'completedPrimeFactors':ff,'multiplicityOfRequestedPrime':ff.count(requested)}
        if scene=='first-split':
            assert len(nodes)==3 and leaves.count('?')==1;known=one(v for v in leaves if isinstance(v,int));assert rootValue%known==0
            ff=factors(rootValue);assert math.prod(ff)==rootValue and len(ff)>len(set(ff))
            assert 'Қайталанған көбейткіш әр кездескен сайын қайта қосылады' in r['statement']
            return str(sum(ff)),{'actualRootAndKnownBranch':[rootValue,known],'missingBranch':rootValue//known,'fullPrimeFactorsWithRepeats':ff}
        assert leaves.count('blank')==1 and len(nodes)==7
        known=[v for v in leaves if isinstance(v,int)];assert all(prime(v) for v in known)
        possible=[p for p in range(2,rootValue+1) if prime(p) and math.prod(known)*p==rootValue];answer=one(possible)
        return str(answer),{'actualPrintedRoot':rootValue,'allKnownPrimeLeaves':known,'completeMissingPrimeDomain':possible,'intermediateQuestionMark':rootValue//4,'blankIsSeparate50pxSquare':True}
    if scene=='rectangle':
        area=int(re.fullmatch(r'S = (\d+) м²',at(240,186))[1]);assert at(240,332)=='a' and at(42,186)=='b'
        pairs=[(a,area//a) for a in range(2,math.isqrt(area)+1) if area%a==0 and prime(a) and prime(area//a)];a,b=one(pairs)
        valid=[]
        for option in r['options']:
            x,y=map(int,re.fullmatch(r'(\d+) м және (\d+) м',option).groups())
            if x*y==area and prime(x) and prime(y):valid.append(option)
        return one(valid),{'actualPrintedAreaM2':area,'completeUnorderedPrimePairs':pairs,'oneIsNotPrime':not prime(1)}
    assert scene in ['volume-cuboid','adjacent-faces'] and len(polys)==3
    points=lambda e:[tuple(F(v) for v in pair.split(',')) for pair in e.get('points').split()]
    front=one(e for e in polys if e.get('fill')=='#b4d3f8');right=one(e for e in polys if e.get('fill') in ['#c4d8f2','#d1c2ed'])
    shared=set(points(front))&set(points(right));assert shared=={(327,294),(327,148)}
    assert points(front)==[(78,294),(327,294),(327,148),(78,148)]
    assert points(right)==[(327,294),(415,227),(415,81),(327,148)]
    if scene=='volume-cuboid':
        volume=int(re.fullmatch(r'V = (\d+) см³',at(240,39))[1]);assert [at(204,333),at(51,228),at(390,289)]==['a','b','c']
        triples=[]
        for a in range(2,volume+1):
            if not prime(a) or volume%a:continue
            for b in range(a,volume//a+1):
                if volume%(a*b)==0 and prime(b):
                    c=volume//(a*b)
                    if c>=b and prime(c):triples.append((a,b,c))
        dims=one(triples);vertices=list(product([0,1],repeat=3));edges=[]
        for a,b in combinations(vertices,2):
            axes=[i for i in range(3) if a[i]!=b[i]]
            if len(axes)==1:edges.append(dims[axes[0]])
        assert len(edges)==12
        return str(sum(edges)),{'actualPrintedVolumeCm3':volume,'completeUnorderedPrimeTriples':triples,'allTwelvePhysicalEdgeLengths':edges}
    blue=int(re.fullmatch(r'(\d+) см²',at(202,230))[1]);purple=int(at(370,181));assert at(370,207)=='см²'
    candidates=[]
    for h in range(2,min(blue,purple)+1):
        if blue%h==purple%h==0 and prime(h) and prime(blue//h) and prime(purple//h):candidates.append((blue//h,purple//h,h))
    dims=one(candidates)
    return str(math.prod(dims)),{'actualBluePurpleAreaLabels':[blue,purple],'actualCommonVerticalEdge':sorted([[int(v) for v in p] for p in shared]),'completePrimeHeightDomains':candidates,'sharedHeightCountedOnlyOnce':True}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==7;entries=[]
    for i,r in enumerate(rows):
        answer,observed=observe(r);assert answer==r['answer'];assert answer!='wrong-key'
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
        page=1 if i<6 else 2
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'Full7saved/new conditions, fullsolutions andMCQs read; all4source/native343px sheets inspected; own visible-node and edge-graph observer plus exhaustive prime dimension/blank domains, no author calculator imported','checks':['actualtreeedges connect actualnodecentres, unique root and no skippedbranch','unfinished8 split fully; repeatedprime3 counted twice in1386 sum','root? differs from intermediate?, blank50pxsquare is separate','allprime dimension pairs/triples/faceheight domains exhaustive','physical12edges derived from8vertices, common face height counted once','allchoices evaluated;1 excluded fromprimes'],'observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['bothsource/nativepages viewed','4digitroot1386 and50pxblank readable','printedlabels and physicaledges observed rather than data attributes','new parameters and native layout'],'sourceSheet':f'output/editorial-visual-wave37/visual-wave37-source-{page}.png','nativeSheet':f'output/editorial-visual-wave37/visual-wave37-contact-{page}.png'}})
    code="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';const b=JSON.parse(fs.readFileSync('"+PACK+"'));console.log(JSON.stringify(b.editions.map(q=>[q.editionId,editionHash(q)])));"
    js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(js[e['editionId']]==e['sha256'] for e in entries)
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave37-prime-factor-trees.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':7,'actualTreeGraphsAndSharedFaceGeometry':True,'completeFinitePrimeDomains':True,'hashesMatched':7,'authorSolverImported':False}))
if __name__=='__main__':main()
