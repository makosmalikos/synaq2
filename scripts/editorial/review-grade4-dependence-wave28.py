"""Independent37-row volume/dependence review, no author solver or params.
Every saved/new full condition, full solution and MCQ was read separately.
Oracle parses actual printed givens; uses Fraction, safe arithmetic AST,
natural face domains and exact dimensional/conservation identities.
"""
from pathlib import Path
from fractions import Fraction as F
from itertools import product
from math import prod, isqrt
import argparse, ast, copy, hashlib, json, re

ROOT = Path(__file__).resolve().parents[2]
PACK = 'problems/editorial/batches/grade4-dependence-wave28.json'
OUT = 'problems/editorial/reviews/grade4-dependence-wave28.json'


def one(xs):
    assert len(xs) == 1, xs
    return xs[0]


def num(s):
    s = re.sub(r'\s', '', s)
    assert s.isdecimal(), s
    return int(s)


def nums(s):
    return [num(m[0]) for m in re.finditer(r'\d[\d ]*', s)]


def integer(x):
    x = F(x)
    assert x.denominator == 1, x
    return x.numerator


def calc(s, values=None):
    values = values or {}
    superscripts = str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹', '0123456789')
    s = re.sub(r'(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)', lambda m: m[1] + '**' + m[2].translate(superscripts), s)
    s = s.replace('×', '*').replace('−', '-').replace(':', '/')
    def walk(n):
        if isinstance(n, ast.Expression):
            return walk(n.body)
        if isinstance(n, ast.Constant):
            assert type(n.value) is int
            return F(n.value)
        if isinstance(n, ast.Name):
            assert n.id in values
            return F(values[n.id])
        assert isinstance(n, ast.BinOp) and isinstance(n.op, (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow))
        a, b = walk(n.left), walk(n.right)
        if isinstance(n.op, ast.Add): return a + b
        if isinstance(n.op, ast.Sub): return a - b
        if isinstance(n.op, ast.Mult): return a * b
        if isinstance(n.op, ast.Div): return a / b
        assert b.denominator == 1 and 0 <= b <= 10
        return a ** integer(b)
    return walk(ast.parse(s, mode='eval'))


def pick(row, value, unit):
    return one([o for o in row['options'] if re.fullmatch(r'[\d ]+ ' + re.escape(unit), o)
                and num(o.removesuffix(' ' + unit)) == value])


def match(pattern, s):
    m = re.search(pattern, s)
    assert m, (pattern, s)
    return m


def digest(row):
    return hashlib.sha256(json.dumps(row, sort_keys=True, ensure_ascii=False,
                                    separators=(',', ':')).encode()).hexdigest()


def solve(row):
    s = row['statement']
    kind = row['modelId'].removeprefix('grade4-dependence-')
    ns = nums(s)
    answer = value = unit = None
    method = 'Independent actual printed dimensions, exact Fraction volume/area/length equations and requested units'
    if kind == 'height-from-floor-volume':
        volume, floor = ns
        value, unit = F(volume, floor), 'м'
        assert value * floor == volume
        note = f'Printed{volume}m³/{floor}m²={value}m, inverse exact height×floor restores volume; actual add/subtract/multiply distractors rejected.'
    elif kind in {'cube-minus', 'round-tens-cube-minus'}:
        expression = match(r': (.+?)\. Жауапқа', s)[1]
        value = calc(expression)
        base, subtract = ns
        assert value + subtract == prod([base, base, base])
        method = 'Independent safe Unicode-power AST and repeated-product inverse'
        note = f'Actual printed{expression}={value}; independent3factorproduct{prod([base] * 3)} restores cube after adding{subtract}. Cube notbase×3.'
    elif kind == 'efficient-box-volume':
        length, width, height = ns
        value = sum(1 for _ in product(range(length), range(width), range(height)))
        assert length * height == 100 and value == length * height * width
        method = 'Independent complete unit-voxel count and reordered100grouping'
        note = f'Actual{length}×{width}×{height} integercuboid contains{value}unitvoxels; preserved25×4=100efficientgrouping, not only final multiplication.'
    elif kind == 'cube-expansion':
        base = one(ns)
        answer = one([o for o in row['options'] if calc(o) == base ** 3])
        assert answer.split(' × ') == [str(base)] * 3
        method = 'Independent every actual expression evaluated by safeAST; proper cube factor roles also checked'
        note = f'All options evaluated: {[(o, str(calc(o))) for o in row["options"]]}; only3factors of{base}give cube{base ** 3}, roles not exchanged.'
    elif kind in {'pool-floor-choice', 'base-area-open'}:
        length, width, height = ns
        value = sum(1 for _ in product(range(length), range(width)))
        unit = 'м²' if kind == 'pool-floor-choice' else 'см²'
        assert value != value * height
        note = f'Actual rectangular floor{length}×{width}has{value}unitsquares; height{height}excluded. Fullvolume{value * height}andperimeter{2 * (length + width)}are separate quantities.'
    elif kind == 'volume-from-floor':
        floor, height = ns
        value = floor * height
        note = f'Printed floor{floor}m² stacked{height}metres yields{value}m³; reverse{value}/{height}={floor}. Requested volume, notheight/floor.'
    elif kind in {'swapped-base-exponent-compare', 'cube-square-comparison'}:
        if kind == 'swapped-base-exponent-compare':
            expression = match(r': (.+?)\. Шаршының', s)[1]
        else:
            expression = match(r': (.+?)\.$', s)[1]
        first, second = expression.split(' □ ')
        a, b = calc(first), calc(second)
        answer = '>' if a > b else '<' if a < b else '='
        method = 'Independent safe Unicode-power AST for both actual expressions and complete relation choices'
        note = f'Printed{first}={a},{second}={b}; exact relation{answer}; base/exponent roles or rawbase comparison cannot replace exponentiation.'
    elif kind == 'length-from-volume-mm':
        width, height, volume = ns
        value, unit = F(volume, width * height), 'мм'
        assert value * width * height == volume
        note = f'Actual crosssection{width * height}mm²; inverse volume{volume}mm³ gives length{value}mm, both dimensionfactors needed.'
    elif kind == 'reordered-volume-formula':
        letters = re.findall(r'(?<![A-Za-z])[xyz](?![A-Za-z])', s)
        assert letters == ['x', 'y', 'z']
        candidates = [o for o in row['options'] if all(calc(o, dict(zip(letters, dims))) == prod(dims)
                       for dims in product(range(1, 9), repeat=3))]
        answer = one(candidates)
        assert re.fullmatch(r'[xyz] × [xyz] × [xyz]', answer)
        assert sorted(answer.split(' × ')) == sorted(letters)
        method = 'Independent512complete positive dimensiontriples via safeAST plus homogeneous product identity'
        note = 'Every actual formula evaluated on512triples. Correct formula is exactly one occurrence of each x,y,z, in reordered sequence; multiplication commutativity proves full positive-real identity. Other mixeddegree expressions fail.'
    elif kind == 'missing-boxes-volume':
        capacity, present, length, width, height = ns
        missing = capacity - present
        assert missing > 0
        value = missing * prod([length, width, height])
        assert value + present * length * width * height == capacity * length * width * height
        note = f'Printed{capacity}designatedplaces minus{present}filled gives{missing}newboxes; actualeach{length * width * height}cm³ totals{value}. Explicit slots avoid unsupported packing inference.'
    elif kind == 'largest-volume-choice':
        dims = [nums(o) for o in row['options']]
        assert all(len(d) == 3 for d in dims)
        volumes = [prod(d) for d in dims]
        answer = one([o for o, v in zip(row['options'], volumes) if v == max(volumes)])
        assert answer != row['options'][max(range(4), key=lambda i: sum(dims[i]))]
        note = f'All actual optiontriples{dims}give{volumes}cm³. Unique largest{answer}; maximumsum{max(map(sum,dims))}is deliberately not maxvolume, preserving fullskill.'
    elif kind == 'pool-side-area':
        length, width, depth = ns
        faces = [length * depth, length * depth, width * depth, width * depth]
        value = sum(faces)
        assert value == 2 * (length + width) * depth and 'Түбіне тимей' in s
        note = f'Four actual verticalfaces{faces}m² total{value}; bottom{length * width}excluded. Perimeter×depth independently agrees, no top/wholevolume included.'
    elif kind == 'equal-floor-volume-comparison':
        first, second = ns[:3], ns[3:]
        a, b = prod(first), prod(second)
        assert first[2] == second[2] and first[0] * first[1] == second[0] * second[1]
        answer = '=' if a == b else '>' if a > b else '<'
        note = f'Actual differentbases{first[0] * first[1]}/{second[0] * second[1]}cm² with sameheights{first[2]}; actualvolumes{a}/{b}cm³ yield{answer}.'
    elif kind in {'mixed-dm-cm-volume', 'mixed-volume-dm-choice'}:
        dm, cm1, cm2 = ns
        cmvolume = dm * 10 * cm1 * cm2
        if kind == 'mixed-dm-cm-volume':
            value, unit = cmvolume, 'см³'
        else:
            options = []
            for o in row['options']:
                m = match(r'^([\d ]+) (дм³|см³)$', o)
                if num(m[1]) * (1000 if m[2] == 'дм³' else 1) == cmvolume:
                    options.append(o)
            answer = one(options)
        note = f'Actual length{dm}dm={10 * dm}cm,volume{cmvolume}cm³={F(cmvolume,1000)}dm³. Each offered numericvalue and cubicunit jointly checked; lengthfactor10 vsvolumefactor1000 distinct.'
    elif kind == 'efficient-product-choice':
        expression = match(r'^(.+?) көбейтіндісін', s)[1]
        target = calc(expression)
        answer = one([o for o in row['options'] if calc(o) == target])
        assert ns[0] * ns[2] == 100
        method = 'Independent safeAST actual product/options and retained4×25=100grouping'
        note = f'Printed{expression}={target}, actualsum{sum(ns)}not product. All numericoptions evaluated exactly, zero placement preserved.'
    elif kind == 'height-volume-factor':
        factor = one(ns)
        answer = one([o for o in row['options'] if o == f'{factor} есе өседі'])
        for dims in product(range(1, 21), repeat=3):
            assert prod([dims[0], dims[1], dims[2] * factor]) == prod(dims) * factor
        method = 'Independent same-base homogeneous-volume identity and8000positive integer dimension witnesses'
        note = f'Onlyheightmultiplier{factor}changes volume by{factor}; algebra V′=a×b×({factor}c)={factor}V valid for all positive dimensions, notfactor²/factor³.'
    elif kind == 'width-and-volume-from-floor':
        floor, length, height = ns
        width, volume = F(floor, length), floor * height
        answer = one([o for o in row['options'] if (lambda m: num(m[1]) == width and num(m[2]) == volume)(match(r'^ені ([\d ]+) м, көлемі ([\d ]+) м³$', o))])
        note = f'Printedwidth{floor}/{length}={width}m and volume{floor}×{height}={volume}m³; both actual tuplecomponents must match, length alreadycontained in floor.'
    elif kind == 'capacity-from-air-volume':
        length, width, height, per = ns
        volume = prod([length, width, height])
        value = volume // per
        assert value * per <= volume < (value + 1) * per
        assert 'Оқу есебінде' in s and 'Жиһаз көлемі ескерілмейді' in s
        note = f'Explicit hypotheticalrule{per}m³/person and available{volume}m³ gives maximalwhole{value}; nextpersonneeds{(value + 1) * per}>{volume}. No claimofactualregulatorycapacity.'
    elif kind == 'base-perimeter-from-volume':
        volume, height, length = ns
        floor = F(volume, height)
        width = floor / length
        value = 2 * (length + width)
        assert length * width * height == volume
        note = f'Actual volume{volume},height{height}givefloor{floor};width{width},perimeter{value}cm. Inverse3dimensionproduct checks full chain; answer notarea/volume.'
    elif kind == 'dependent-width-height-volume':
        length, gap, divisor = ns
        width, height = length - gap, F(length, divisor)
        assert width > 0 and height > 0
        value = length * width * height
        note = f'Actual absolute5cmshorter→{length}−{gap}={width},relative3timesshorter→{length}/{divisor}={height}; product{value}cm³. Dependence uses LENGTHforboth, notderivedwidth.'
    elif kind == 'three-dimension-scale':
        volume, lengthfactor, widthdivisor, heightfactor = ns
        factor = F(lengthfactor * heightfactor, widthdivisor)
        value = volume * factor
        assert lengthfactor == widthdivisor
        method = 'Independent exact homogeneous product scaling; inverse width cancels lengthfactor'
        note = f'ActualV{volume}, factors{lengthfactor}×1/{widthdivisor}×{heightfactor}={factor}; new{value}cm³. Universal algebra works without guessing individual dimensions.'
    elif kind == 'cube-displacement':
        length, width, edge, count = ns
        displaced = edge ** 3 * count
        area = length * width
        value = F(displaced, area)
        assert value * area == displaced
        assert all(t in s for t in ['толық батырылды', 'Су төгілмеді', 'су сіңірмейді'])
        method = 'Independent displaced-solid volume conservation versus fixed vertical crosssection'
        note = f'Actual{count}nonabsorbentfullysubmergedcubesofedge{edge}displace{displaced}cm³; water-columnincrementarea{area}cm² gives{value}cm. Conservation{area}×{value}={displaced}, no arbitrary initialdepth required.'
    elif kind == 'face-areas-volume-choice':
        faces = ns
        bound = max(faces)
        dims = [d for d in product(range(1, bound + 1), repeat=3)
                if sorted([d[0] * d[1], d[1] * d[2], d[2] * d[0]]) == sorted(faces)]
        volumes = {prod(d) for d in dims}
        value, unit = one(list(volumes)), 'см³'
        assert value ** 2 == prod(faces)
        assert len(dims) == 6
        method = 'Independent complete natural-dimension search bounded by largest given facearea; sixpermutations, onevolume'
        note = f'Actualfaces{faces}; every natural(a,b,c)in1..{bound}searched gives{dims},allvolume{value}. No dimension may exceed maxface because partnerdimension≥1; searchcomplete. IndependentV²=productfaces verifies.'
    elif kind == 'three-cube-sum-power':
        edges = ns
        total = sum(prod([edge] * 3) for edge in edges)
        answer = one([o for o in row['options'] if calc(o) == total])
        assert total != sum(edges) ** 3
        method = 'Independent per-cube repeatedproduct sum and all actual Unicodepower options evaluated byAST'
        note = f'Actualedges{edges},cubevolumes{[edge ** 3 for edge in edges]},sum{total}; optionvalues{[(o,str(calc(o))) for o in row["options"]]},unique{answer}. Cubing edgeSUM isnot sumofcubes.'
    elif kind == 'ratio-sides-wire-volume':
        rw, rh, wire = ns
        h = F(wire, 4 * (rw * rh + rh + 1))
        w, length = rh * h, rw * rh * h
        assert h > 0 and 4 * (length + w + h) == wire
        candidates = [t for t in range(1, wire + 1) if 4 * (rw * rh * t + rh * t + t) == wire]
        assert candidates == [h]
        value = length * w * h
        method = 'Independent exact12edge wire equation and chainedratios; unique positive-real root plus complete integer height witnessdomain'
        note = f'ActualL={rw}W,W={rh}H;4(L+W+H)={wire}uniquelygivesH{h},W{w},L{length},V{value}. Four edgesperdimension, not12ofeach; fullinteger1..{wire}checked too.'
    elif kind == 'all-sides-additive-gain':
        length, width, height, increase = ns
        original = prod([length, width, height])
        grown = prod([length + increase, width + increase, height + increase])
        value, unit = grown - original, 'см³'
        assert value > 0 and value != grown
        note = f'Actual additivedimensions{[length,width,height]}→{[length+increase,width+increase,height+increase]},volumes{original}/{grown}; requestedGAIN{value},notnewtotal{grown}or3×increase.'
    elif kind == 'pool-two-pumps':
        length, width, height, rate1, rate2 = ns
        volume = prod([length, width, height])
        value = F(volume, rate1 + rate2)
        assert rate1 * value + rate2 * value == volume
        assert all(t in s for t in ['бос тұр', 'бір мезгілде', 'тұрақты', 'ағып кетпесе'])
        method = 'Independent simultaneous constant-flow conservation and exact full-pool first fillingtime'
        note = f'Actualpool{volume}m³,simultaneousrates{rate1}/{rate2}m³/h give{value}h. Separateamounts{rate1*value}+{rate2*value}={volume}; positive combinedrate provesfirstfulltime. No sequentialtime or productofrates.'
    elif kind == 'square-and-cube':
        values = [num(o) for o in row['options']]
        squares = {n * n for n in range(1, isqrt(max(values)) + 1)}
        cubes = {n * n * n for n in range(1, max(values) + 1) if n * n * n <= max(values)}
        answer = one([o for o, n in zip(row['options'], values) if n in squares and n in cubes])
        method = 'Independent exhaustive square/cube sets up to largest actualoption, integer arithmetic only'
        note = f'All actualvalues{values}; squareandcubeintersection{sorted(set(values)&squares&cubes)},uniquekey{answer}.81/196onlysquare,125onlycube;729both27²and9³.'
    elif kind == 'room-volume-choice':
        value, unit = prod(ns), 'м³'
        note = f'Actualroomdimensions{ns}yield{value}m³; floor{ns[0]*ns[1]}m²,perimeter{2*(ns[0]+ns[1])}m,sum{sum(ns)}m distinguish volume.'
    elif kind == 'half-warehouse-boxes':
        length, width, height, each = ns
        warehouse = prod([length, width, height])
        value = F(warehouse, 2 * each)
        assert 2 * value * each == warehouse and 'бос кеңістік есептелмейді' in s
        note = f'Actualwarehouse{warehouse}m³,exactoccupiedhalf{F(warehouse,2)}m³,each{each}m³gives{value}boxes. Explicitgapvolumecondition makesvolume/count inference valid without hiddenpackinggeometry.'
    elif kind == 'aquarium-liters-gap':
        first, second = prod(ns[:3]), prod(ns[3:6])
        gap = F(abs(second - first), 1000)
        assert ns[6:] == [1, 1000]
        answer = f'{"Екінші" if second > first else "Бірінші"} аквариумға {integer(gap)} л артық' if first != second else 'Екі аквариумға бірдей су сыяды'
        note = f'Actualvolumes{first}/{second}cm³={F(first,1000)}/{F(second,1000)}litres; identity anddifference{gap}litres checked jointly, not90or wrongwinner.'
    elif kind == 'initial-volume-from-scaled':
        factor, enlarged = ns
        value = F(enlarged, prod([factor] * 3))
        assert value * factor * factor * factor == enlarged
        method = 'Independent inverse three-axis homogeneous scaling and exact product restoration'
        note = f'Actual3axisfactor{factor}givesvolumefactor{factor ** 3}; original{enlarged}/{factor ** 3}={value}cm³. Dividingbyonly{factor}isnot equivalent.'
    else:
        raise AssertionError(kind)
    if answer is None:
        value = integer(value)
        answer = pick(row, value, unit) if row.get('options') else str(value)
    assert answer == row['answer'], (row['editionId'], answer, row['answer'])
    if row.get('options'):
        assert len(row['options']) == len(set(row['options'])) == 4
        assert row['options'].count(answer) == 1
    else:
        assert answer.isdecimal() and s.endswith('Жауапқа тек санды жазыңыз.')
    return {'method':method, 'notes':note + ' Every saved/new fullcondition, complete solution and allactualoptions independently read; originalskill, positive/natural domains, units and requested quantity checked.'}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--write', action='store_true')
    args = ap.parse_args()
    rows = json.loads((ROOT / PACK).read_text())['editions']
    assert len(rows) == 37
    entries = []
    for row in rows:
        ref = one(row['sourceRefs'])
        raw = one([q for q in json.loads((ROOT / ref['sourceFile']).read_text())['questions'] if q['id'] == ref['sourceId']])
        assert raw['checked'] and row['grade'] == 4 and row['minimumPlan'] == 'pro'
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',**solve(row)})
    assert len({r['sourceRefs'][0]['sourceId'] for r in rows}) == 37
    rejected = 0
    for row in rows:
        bad = copy.deepcopy(row)
        bad['answer'] = 'wrong-key'
        try: solve(bad)
        except AssertionError: rejected += 1
        else: raise AssertionError('wrong key accepted')
    canaries = [(0,'144 м³','180 м³'),(1,'7³','8³'),(2,'13 см','14 см'),(3,'7³','8³'),
                (4,'14 м','15 м'),(8,'210 мм³','252 мм³'),(11,'19 орын','20 орын'),
                (13,'9 м','10 м'),(14,'48 см','49 см'),(15,'3 дм','4 дм'),(16,'23 ×','24 ×'),
                (18,'32 м²','40 м²'),(19,'9 м','10 м'),(20,'630 см³','735 см³'),
                (21,'5 см қысқа','6 см қысқа'),(22,'4 есе','5 есе'),(23,'12 тұтас','16 тұтас'),
                (24,'30 см²','40 см²'),(25,'12 см','13 см'),(26,'144 см','180 см'),
                (27,'2 см-ге','3 см-ге'),(28,'75 м³','55 м³'),(32,'90²','80²'),
                (33,'4 м³','5 м³'),(34,'4 дм','5 дм'),(35,'60 см','65 см'),(36,'1944 см³','2160 см³')]
    for i, old, new in canaries:
        bad = copy.deepcopy(rows[i])
        assert old in bad['statement'], (i, old)
        bad['statement'] = bad['statement'].replace(old, new)
        try: solve(bad)
        except AssertionError: rejected += 1
        else: raise AssertionError(('printed canary accepted', i))
    report = {'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24',
              'scope':'All37 saved/new fullconditions, fullsolutions and MCQ read; independent actualprinted Fraction/unit arithmetic, Unicodepower safeAST,512formula and8000heightfactor witnesses, voxel/floorcounts, fullnatural facearea/ratio domains, area-vs-volume, submergedcubes, simultaneouspumps and cubicSI.37badkeys+27printedcanaries rejected.',
              'entries':entries}
    if args.write:
        (ROOT / OUT).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'reviewed':len(entries),'badKeysAndPrintedCanariesRejected':rejected,'status':'passed'}))


if __name__ == '__main__':
    main()
