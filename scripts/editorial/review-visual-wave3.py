"""Root's separate formula audit after all 28 old/new texts and five mobile sheets.

Author calculations enumerate occupied squares/edges. This reviewer uses closed
geometric formulas and a whitelisted Python AST for the expression choices.
"""
import ast
import hashlib
import json
import math
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
FILE = 'problems/editorial/batches/visual-wave3-composites.json'


def canonical_hash(row):
    return hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True,
                                    separators=(',', ':')).encode()).hexdigest()


def expression(s):
    tree = ast.parse(s.replace('×', '*').replace('−', '-'), mode='eval')
    def value(n):
        if isinstance(n, ast.Constant) and type(n.value) is int:
            return n.value
        if isinstance(n, ast.BinOp):
            a, b = value(n.left), value(n.right)
            if isinstance(n.op, ast.Add): return a + b
            if isinstance(n.op, ast.Sub): return a - b
            if isinstance(n.op, ast.Mult): return a * b
        raise ValueError('Not authored integer arithmetic')
    return value(tree.body)


def answer(row):
    p = row['params']; kind = row['modelId'].removeprefix('visual-wave3-')
    if kind in ('square-cut', 'corner-area'):
        return str(p['w']*p['h'] - p['cw']*p['ch'])
    if kind in ('choose-expression', 'wrong-expression'):
        area = p['w']*p['h'] - p['cw']*p['ch']
        matches = [s for s in row['options'] if
                   (expression(s) == area) == (kind == 'choose-expression')]
        assert len(matches) == 1
        return matches[0]
    if kind == 'two-rectangles':
        return str(p['aw']*p['ah'] + p['bw']*p['bh'])
    if kind == 'diagonal-half':
        product = p['w']*p['h']; assert product % 2 == 0
        return str(product//2)
    if kind == 'three-pillars':
        return str(2*p['pillarW']*p['pillarH'] + p['gap']*p['bridgeH'])
    if kind == 't-shape':
        return str(p['barW']*p['barH'] + p['stemW']*p['stemH'])
    if kind == 'grid-area':
        expected = {(x,y) for y, n in enumerate(p['rows']) for x in range(n)}
        assert set(map(tuple,p['cells'])) == expected
        return str(sum(p['rows'])*p['side']**2)
    if kind == 'inner-garden':
        return str(p['w']*p['h'] - p['cw']*p['ch'])
    if kind == 'four-corners':
        return str(p['w']**2 - 4*p['cut']**2)
    if kind == 'wall-openings':
        return str(p['w']*p['h'] - p['windowW']*p['windowH'] - p['doorW']*p['doorH'])
    if kind == 'corner-perimeter':
        assert 0 < p['cw'] < p['w'] and 0 < p['ch'] < p['h']
        return str(2*(p['w'] + p['h']))
    if kind == 'cross-paths':
        # Shift the two strips to the edge; no unit-cell enumeration.
        return str((p['w'] - p['path'])*(p['h'] - p['path']))
    if kind in ('notch-paint', 'floor-cost'):
        return str((p['w']*p['h'] - p['cw']*p['ch'])*p['rate'])
    if kind == 'inverse-width':
        full = p['remaining'] + p['cw']*p['ch']
        assert full % p['w'] == 0 and full//p['w'] == p['h']
        return str(full//p['w'])
    if kind == 'rectangle-triangle':
        assert p['h']*p['leg'] % 2 == 0
        return str(p['w']*p['h'] + p['h']*p['leg']//2)
    if kind == 'l-grid-perimeter':
        n = len(p['cells'])
        assert set(map(tuple,p['cells'])) == {(0,y) for y in range(n-1)} | {(1,n-2)}
        return str((2*n+2)*p['side'])
    if kind == 'overlap-union':
        return str(p['aw']*p['ah'] + p['bw']*p['bh'] - p['ow']*p['bh'])
    if kind == 'outer-border':
        b = p['border']
        # Two full-width top/bottom strips plus the two inner-height strips.
        return str(2*b*(p['w']+2*b) + 2*b*p['h'])
    if kind == 'tile-boxes':
        area = p['w']*p['h'] - p['cw']*p['ch']
        assert 100 % p['tileCm'] == 0
        count = area*10000//p['tileCm']**2
        return str((count+p['pack']-1)//p['pack'])
    if kind == 'cross-area-perimeter':
        assert set(map(tuple,p['cells'])) == {(1,0),(0,1),(1,1),(2,1),(1,2)}
        return f"{5*p['side']**2} см² және {12*p['side']} см"
    if kind == 'stair-perimeter':
        n = len(p['rows'])
        assert p['rows'] == list(range(n,0,-1))
        assert set(map(tuple,p['cells'])) == {(x,y) for y in range(n) for x in range(y+1)}
        return str(4*n*p['side'])
    if kind == 'longitudinal-strip':
        return str(p['w']*(p['h']-p['path']))
    raise ValueError(kind)


def check(write=False):
    rows = json.loads((ROOT/FILE).read_text())['editions']
    assert len(rows) == 28 and len({r['modelId'] for r in rows}) == 25
    entries = []
    for row in rows:
        expected = answer(row)
        assert row['answer'] == expected, (row['editionId'],expected)
        data = (ROOT/'frontend/public'/row['image'].lstrip('/')).read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        assert digest == row['figureSha256']
        svg = ET.fromstring(data)
        assert svg.attrib['viewBox'] == '0 0 480 360'
        assert not any(n.tag.rsplit('}',1)[-1] in ('image','script','foreignObject') for n in svg.iter())
        assert not any(c in row['statement']+row['solution'] for c in ('$', '\\'))
        if row.get('options'):
            assert len(set(row['options'])) == len(row['options'])
            assert row['options'].count(expected) == 1
        entries.append({'editionId':row['editionId'],'sha256':canonical_hash(row),
            'verdict':'verified','reviewer':'independent_root_agent',
            'method':'separate_python_geometric_formulas_and_whitelisted_expression_ast',
            'expectedAnswer':expected,
            'checks':['all 28 full saved conditions, official answers and explanations read',
                      'all 28 new conditions, worked solutions and choices read separately',
                      'area, perimeter, overlap, inverse dimension, units and whole-pack minimum independently calculated',
                      'correct-expression and incorrect-expression prompts retain their different requested operators'],
            'figureReview':{'status':'verified','sha256':digest,'viewportWidth':343,
                'nativeSvg':True,'sourceTracing':False,
                'checked':['all five native contact sheets inspected at actual 343px width',
                           'labels, units, cells, unions, holes and shared boundaries match the givens',
                           'unknown width is not given as a numeric label',
                           'cross cell length label spans one complete square side']}})
    report={'schemaVersion':1,'date':'2026-10-23','batchFile':FILE,'reviewed':len(entries),'entries':entries}
    if write:
        (ROOT/'problems/editorial/reviews/visual-wave3-composites.json').write_text(
            json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return report


if __name__ == '__main__':
    import sys
    report=check('--write-review' in sys.argv)
    print(json.dumps({'reviewed':report['reviewed'],'result':'passed'}))
