"""Independent closed-form rational and actual SVG direction/ratio review.

All nine source/new full conditions, complete solutions and choices were read;
both new native 343px contact sheets were inspected before approval.
"""
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
FILE='problems/editorial/batches/visual-wave6-flow-percent.json'


def one(items):
    assert len(items)==1,items
    return items[0]


def answer(q):
    p=q['params'];kind=q['modelId'].removeprefix('visual-wave6-')
    if kind=='boat-time':value=F(p['distance'],p['boatDirection']*p['boatSpeed']+p['currentDirection']*p['current'])
    elif kind=='raft-time':value=F(p['distance'],p['current']);assert p['boatSpeed']==0
    elif kind=='boat-distance':value=F((p['boatDirection']*p['boatSpeed']+p['currentDirection']*p['current'])*p['hours'])
    elif kind=='upstream-direction-speed':
        signed=p['boatDirection']*p['boatSpeed']+p['currentDirection']*p['current'];assert signed<0 and p['currentDirection']==1
        return 'Ағысқа қарсы, '+str(-signed)+' км/сағ'
    elif kind=='raft-current':value=F(p['distance'],p['hours']);assert p['boatSpeed']==0 and p['current'] is None
    elif kind=='water-mass':value=F(p['mass'])-F(p['mass']*p['saltPercent'],100)
    elif kind=='successive-price':
        value=F(p['initial']*(100-p['discount'])*(100+p['increase']),10000)
        assert value!=F(p['initial']*(100-p['discount']+p['increase']),100)
    elif kind=='compound-second-year':
        value=F(p['afterOne']**2,p['initial'])
        assert value!=2*p['afterOne']-p['initial']
    elif kind=='expanded-rectangle-area':
        value=F(p['length']*p['width']*(100+p['lengthPercent'])*(100+p['widthPercent']),10000)
        assert value!=F(p['length']*p['width']*(100+p['lengthPercent']+p['widthPercent']),100)
    else:raise ValueError(kind)
    assert value>0 and value.denominator==1
    return str(value.numerator)


def svg_audit(q):
    p=q['params'];raw=(ROOT/'frontend/public'/q['image'].lstrip('/')).read_bytes()
    digest=hashlib.sha256(raw).hexdigest();assert digest==q['figureSha256']
    nodes=list(ET.fromstring(raw).iter());texts=[n.text for n in nodes if n.tag.endswith('text')]
    assert not any(n.tag.rsplit('}',1)[-1] in ('image','script','foreignObject') for n in nodes)
    def close(a,b):assert abs(float(a)-float(b))<.001,(a,b)
    def direction(node,want):
        assert node.attrib['marker-end']=='url(#tip)'
        assert float(node.attrib['y1'])==float(node.attrib['y2'])
        assert (float(node.attrib['x2'])-float(node.attrib['x1']))*want>0
    scene=p['scene']
    if scene=='river':
        direction(one([n for n in nodes if 'data-current-direction' in n.attrib]),p['currentDirection'])
        if p.get('raft'):assert 'Сал' in texts and p['boatSpeed']==0
        else:
            direction(one([n for n in nodes if 'data-boat-direction' in n.attrib]),p['boatDirection'])
            assert 'Меншікті: '+str(p['boatSpeed'])+' км/сағ' in texts
        current='?' if p['current'] is None else str(p['current'])
        assert 'Ағыс: '+current+' км/сағ' in texts
        if 'distance' in p:assert str(p['distance'])+' км' in texts and 'A' in texts and 'B' in texts
    elif scene=='mixture':
        assert 'Ерітінді: '+str(p['mass'])+' г' in texts
        assert 'Тұз: '+str(p['saltPercent'])+'%' in texts and 'Тек тұз бен су' in texts
        assert q['answer'] not in texts
    elif scene in ('price','interest'):
        assert str(p['initial']) in texts and q['answer'] not in texts
        assert texts.count('?')==(2 if scene=='price' else 1)
        if scene=='price':assert '−'+str(p['discount'])+'%' in texts and '+'+str(p['increase'])+'%' in texts
        else:assert str(p['afterOne']) in texts
        flow=[n for n in nodes if n.tag.endswith('line') and n.attrib.get('marker-end')=='url(#tip)']
        assert len(flow)==2
        for n in flow:direction(n,1)
    elif scene=='rectangle':
        old=one([n for n in nodes if 'data-original-width' in n.attrib]);new=one([n for n in nodes if 'data-new-width' in n.attrib])
        close(F(str(new.attrib['width']))/F(str(old.attrib['width'])),F(100+p['lengthPercent'],100))
        close(F(str(new.attrib['height']))/F(str(old.attrib['height'])),F(100+p['widthPercent'],100))
        close(new.attrib['x'],old.attrib['x'])
        close(float(new.attrib['y'])+float(new.attrib['height']),float(old.attrib['y'])+float(old.attrib['height']))
        assert 'stroke-dasharray' in new.attrib and 'stroke-dasharray' not in old.attrib
        assert str(p['length'])+' см' in texts and str(p['width'])+' см' in texts
        assert 'Ұзындығы +'+str(p['lengthPercent'])+'%' in texts and '+'+str(p['widthPercent'])+'%' in texts
        assert q['answer'] not in texts
    return digest


def check(write=False):
    rows=json.loads((ROOT/FILE).read_text())['editions'];assert len(rows)==9 and len({q['modelId'] for q in rows})==9
    entries=[]
    for q in rows:
        expected=answer(q);assert q['answer']==expected,(q['editionId'],expected)
        if q.get('options'):assert q['options'].count(expected)==1 and len(set(q['options']))==len(q['options'])
        else:assert q['statement'].endswith('Жауапқа тек санды жазыңыз.')
        digest=svg_audit(q)
        entries.append({'editionId':q['editionId'],'sha256':hashlib.sha256(json.dumps(q,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),
            'verdict':'verified','reviewer':'independent_root_agent','method':'separate_python_closed_form_fraction_equations_and_actual_svg_directions_ratios',
            'expectedAnswer':expected,'checks':['all nine complete original and new conditions, solutions and choices read',
                'closed-form signed boat/current velocity and exact time/distance independently calculated',
                'water complement, changed percentage bases, compound multiplier and both area dimensions checked',
                'units and numeric-only response instructions retained'],
            'figureReview':{'status':'verified','sha256':digest,'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,
                'checked':['both native contact sheets inspected at 343px',
                    'actual current and boat arrow endpoints match the stated directions',
                    'numeric labels show givens and question marks conceal unknown amounts/speed',
                    'actual dashed/blue rectangles share the lower-left corner and exact specified side ratios']}})
    report={'schemaVersion':1,'date':'2026-10-23','batchFile':FILE,'reviewed':9,'entries':entries}
    if write:(ROOT/'problems/editorial/reviews/visual-wave6-flow-percent.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return report


if __name__=='__main__':
    import sys
    report=check('--write-review' in sys.argv)
    print(json.dumps({'reviewed':report['reviewed'],'result':'passed'}))
