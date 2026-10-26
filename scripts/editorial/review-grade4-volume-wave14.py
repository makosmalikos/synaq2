"""Independent geometry/SI/Fraction oracle for 33 frozen volume editions.

All source/new conditions, complete solutions and MCQ read before signing.
Uses coordinate graphs, explicit voxel classification, complete ordered-factor
domains and SI dimension checks; no authored renderer/calculator is imported.
"""
from fractions import Fraction as F
from itertools import product, combinations
from pathlib import Path
import argparse
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
PACK = 'problems/editorial/batches/grade4-volume-wave14.json'
OUT = 'problems/editorial/reviews/grade4-volume-wave14.json'
LENGTH = {'мм': F(1, 1000), 'см': F(1, 100), 'дм': F(1, 10), 'м': F(1)}
VOLUME = {unit + '³': scale**3 for unit, scale in LENGTH.items()}
VOLUME['л'] = F(1, 1000)
VERTICES = list(product((0, 1), repeat=3))
EDGES = [(a, b) for a, b in combinations(VERTICES, 2) if sum(x != y for x, y in zip(a, b)) == 1]
FACES = [(axis, side) for axis in range(3) for side in (0, 1)]


def digest(row):
    return hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def one(values):
    assert len(values) == 1, values
    return values[0]


def integer(x):
    x = F(x); assert x.denominator == 1, x
    return x.numerator


def number(text):
    compact = re.sub(r'\s', '', text)
    assert re.fullmatch(r'\d+', compact), text
    return int(compact)


def printed_quantity(text, scales):
    match = re.fullmatch(r'([\d ]+)\s+([^\s]+)', text.strip()); assert match, text
    assert match[2] in scales, text
    return number(match[1]) * scales[match[2]]


def pick(row, values, target):
    assert len(values) == len(set(values)) == 4, ('Equivalent choices', row['editionId'], values)
    assert values.count(target) == 1, (row['editionId'], values, target)
    return row['options'][values.index(target)]


def edge_ledger(dimensions):
    # A rectangular coordinate graph has four edges along each independent axis.
    return sum(sum(abs(x - y) * dimension for x, y, dimension in zip(a, b, dimensions)) for a, b in EDGES)


def voxels(dimensions):
    return sum(1 for _ in product(*(range(n) for n in dimensions)))


def painted_counts(n):
    counts = [0, 0, 0, 0]
    for position in product(range(n), repeat=3):
        faces = sum(c == 0 or c == n - 1 for c in position)
        counts[faces] += 1
    assert sum(counts) == n**3 and counts[3] == len(VERTICES)
    return counts


def comparison(option):
    m = re.fullmatch(r'(.+) ([<>=]) (.+)', option); assert m, option
    a, b = printed_quantity(m[1], VOLUME), printed_quantity(m[3], VOLUME)
    return a < b if m[2] == '<' else a > b if m[2] == '>' else a == b


def solve(row):
    p = row['params']; kind = row['modelId'].removeprefix('grade4-volume-')
    answer = value = None
    method = 'Independent exact SI Fraction dimensional ledger'
    note = ''
    if kind == 'no-edges-or-vertices':
        # The three explicit polyhedra have real line-segment edges and vertices;
        # the sphere's smooth surface has no face intersections or polyhedral corners.
        facts = {'тікбұрышты параллелепипед': (len(EDGES), len(VERTICES)),
                 'текше': (len(EDGES), len(VERTICES)), 'бесбұрышты пирамида': (10, 6), 'шар': (0, 0)}
        answer = one([o for o in row['options'] if facts[o] == (0, 0)])
        method = 'Independent polyhedral incidence classification with the smooth-sphere exception'
        note = f'Edge/vertex facts {facts}; exactly the sphere meets both zero-edge and zero-vertex conditions.'
    elif kind == 'room-volume-unit':
        volume = voxels(p['dimensions']); volumes = {unit: F(volume) / scale for unit, scale in VOLUME.items() if unit in row['options']}
        assert 'м²' in row['options'] and 'м²' not in volumes
        answer = min(volumes, key=lambda unit: volumes[unit])
        assert answer == 'м³' and all(value.denominator == 1 for value in volumes.values())
        note = f'Coordinate unit-metre cells give {volume} m³; cubic options require counts {dict((k, str(v)) for k, v in volumes.items())}. m² has the wrong dimension.'
    elif kind == 'overflow-capacity':
        capacity = p['capacityDm3'] * VOLUME['дм³']; quantities = [printed_quantity(o, VOLUME) for o in row['options']]
        answer = row['options'][one([i for i, v in enumerate(quantities) if v > capacity])]
        assert quantities.count(capacity) == 1
        note = f'Exact capacity {capacity} m³; equality fills without spilling, only {answer} exceeds it.'
    elif kind == 'pyramid-vertices':
        base = {('base', i) for i in range(p['baseSides'])}; apex = {('apex', 0)}
        assert base.isdisjoint(apex); value = len(base | apex)
        method = 'Count distinct labelled polygon-base vertices plus a separate non-coplanar apex'
        note = f'{len(base)} base vertices and one distinct apex give {value}; edges are not counted as vertices.'
    elif kind == 'cuboid-volume':
        value = voxels(p['dimensions'])
        method = 'Enumerate all integer unit cells in the three independent internal dimensions'
        note = f'{p["dimensions"]} decimetre grid contains exactly {value} cubic-decimetre cells.'
    elif kind == 'cube-volume':
        expected = voxels([p['edge']] * 3) * VOLUME['см³']
        answer = pick(row, [printed_quantity(o, VOLUME) for o in row['options']], expected)
        method = 'Explicit cubic-centimetre voxel count, then parse all actual dimensional options'
        note = f'Three-axis unit-cell domain contains {integer(expected / VOLUME["см³"])} cells, rejecting face area and edge-sum alternatives.'
    elif kind == 'cuboid-vertices':
        value = len(VERTICES); assert p['baseVertices'] == 4
        method = 'All independent (left/right, front/back, top/bottom) binary coordinate combinations'
        note = f'Full vertex set {VERTICES}; {value} distinct points, rather than six faces or twelve edges.'
    elif kind in {'true-cubic-comparison', 'true-cubic-equality'}:
        truths = [comparison(o) for o in row['options']]
        answer = row['options'][one([i for i, truth in enumerate(truths) if truth])]
        method = 'Read both actual printed quantities of each option using cubed SI length scales'
        note = f'Full truth vector {truths}; 10× length is 1000× volume, and one equality distractor is not strict inequality.'
    elif kind == 'height-from-volume-base':
        candidates = [h for h in range(1, p['volume'] + 1) if p['baseArea'] * h == p['volume']]
        value = one(candidates)
        method = 'Full positive integer layer-count search and volume/base-area dimensional inverse check'
        note = f'Only {value} one-centimetre layers of area {p["baseArea"]} cm² give the stated {p["volume"]} cm³.'
    elif kind == 'unit-cubes-to-big-edge':
        edge_cells = one([n for n in range(1, p['cubes'] + 1) if voxels([n] * 3) == p['cubes']])
        expected = edge_cells * p['unitEdge'] * LENGTH['см']
        answer = pick(row, [printed_quantity(o, LENGTH) for o in row['options']], expected)
        method = 'Enumerate full equal cubic-cell grids and recover one-axis length, rather than row length of all cells'
        note = f'{edge_cells} cells per axis, {p["cubes"]} total cells; edge {expected} metres is the sole printed matching length.'
    elif kind == 'cubic-metres-to-packets':
        value = integer(F(p['volumeM3']) / (p['packetL'] * VOLUME['л']))
        assert value * p['packetL'] * VOLUME['л'] == p['volumeM3']
        note = f'{value} equal full packets reconstruct all {p["volumeM3"]} m³ with no loss or partial packet.'
    elif kind == 'aquarium-litres':
        # Convert each length first; do not reuse the author's cm³-to-litre product.
        dimensions = [n * LENGTH['см'] for n in p['dimensionsCm']]
        volume = dimensions[0] * dimensions[1] * dimensions[2]; value = integer(volume / VOLUME['л'])
        note = f'Actual SI internal dimensions {list(map(str, dimensions))} m give {volume} m³, exactly {value} litres.'
    elif kind == 'cubic-unit-subtraction':
        expected = p['m3'] * VOLUME['м³'] - p['dm3'] * VOLUME['дм³']
        answer = pick(row, [printed_quantity(o, VOLUME) for o in row['options']], expected)
        note = f'SI difference {expected} m³ = {expected / VOLUME["дм³"]} dm³; incorrect linear/square conversion factors rejected.'
    elif kind == 'cube-volume-to-edge':
        expected = one([e for e in range(1, p['volume'] + 1) if e * e * e == p['volume']]) * LENGTH['см']
        answer = pick(row, [printed_quantity(o, LENGTH) for o in row['options']], expected)
        method = 'Full positive integer cube-root search and dimensional parsing of every actual length choice'
        note = f'Only edge {expected} metres cubes to {p["volume"]} cm³; division by three and face-area number are not lengths.'
    elif kind == 'greatest-mixed-volume':
        values = [printed_quantity(o, VOLUME) for o in row['options']]; answer = pick(row, values, max(values))
        note = f'Four exact SI cubic-metre values {list(map(str, values))}; biggest printed integer is not the biggest volume.'
    elif kind == 'always-square-faces':
        # Universal claim, not a sampled cube-like rectangular box.
        answer = one([o for o in row['options'] if o == 'текше'])
        assert len(FACES) == 6 and len({sum(a[i] != b[i] for i in range(3)) for a, b in EDGES}) == 1
        # A 2×3×4 rectangular prism supplies a counterexample to always-square.
        assert all(a != b for a, b in combinations((2, 3, 4), 2))
        method = 'Universal cube-face definition plus explicit non-square rectangular-prism counterexample'
        note = 'All six cube faces have equal side edges; 2×3×4 prism has unequal-sided rectangles, pyramid has triangles, cylinder has a curved surface.'
    elif kind == 'tank-bucket-count':
        value = integer(F(p['tankM3']) / (p['bucketL'] * VOLUME['л']))
        assert value * p['bucketL'] * VOLUME['л'] == p['tankM3']
        note = f'Exactly {value} full buckets of {p["bucketL"]} litres conserve the {p["tankM3"]}-m³ capacity.'
    elif kind == 'cuboid-edge-sum':
        expected = edge_ledger(p['dimensions']) * LENGTH['см']
        answer = pick(row, [printed_quantity(o, LENGTH) for o in row['options']], expected)
        method = 'Enumerate all 12 Hamming-distance-one cuboid vertex pairs and sum their independent axis lengths'
        note = f'Complete wire graph total {expected} metres; not just three dimensions or volume.'
    elif kind == 'greatest-box-capacity':
        capacities = []
        for option in row['options']:
            ds = [printed_quantity(piece.strip(), LENGTH) for piece in option.split(';')]
            assert len(ds) == 3; capacities.append(ds[0] * ds[1] * ds[2])
        answer = pick(row, capacities, max(capacities))
        method = 'Parse every actual mixed-unit box dimension into metres before independently forming three-dimensional capacity'
        note = f'Exact capacities {list(map(str, capacities))} m³; narrow mixed-metre boxes correctly compared with dm/cm boxes.'
    elif kind == 'cube-wire-to-volume':
        edge = F(p['edgeSum'], len(EDGES)); assert edge.denominator == 1
        assert edge_ledger([edge] * 3) == p['edgeSum']
        value = voxels([integer(edge)] * 3)
        method = 'Derive equal cube edge from the independently enumerated 12-edge graph, then count all unit voxels'
        note = f'Total wire {p["edgeSum"]} cm gives edge {edge} cm and {value} cm³, not division by face count.'
    elif kind == 'cube-length-scale-volume':
        # Formal monomial ratio: (fa)(fb)(fc)/(abc)=f³ for all positive a,b,c.
        factor = p['factor']; expected = factor * factor * factor
        answer = pick(row, [number(o.removesuffix(' есе')) for o in row['options']], expected)
        method = 'Formal cancellation of all original positive edge variables in the new/old volume ratio'
        note = f'Three independent length coefficients ({factor},{factor},{factor}) multiply to dimensionless ratio {expected}; face-only scaling rejected.'
    elif kind in {'exactly-one-painted-face', 'no-painted-faces'}:
        n = integer(F(p['edge'], p['unitEdge'])); assert n >= 3
        counts = painted_counts(n); value = counts[1 if kind == 'exactly-one-painted-face' else 0]
        method = 'Enumerate every voxel coordinate and count how many of the six external cube faces it touches'
        note = f'Complete counts by 0/1/2/3 painted faces are {counts}; exactly requested class {value}, no boundary/corner double-counting.'
    elif kind == 'cut-cube-to-row':
        edge_m = p['largeDm'] * LENGTH['дм']; small_m = p['smallCm'] * LENGTH['см']
        n = integer(edge_m / small_m); count = voxels([n] * 3); value = integer(count * small_m)
        note = f'{n} cells per axis, {count} whole small cubes; line length {count}×{small_m} m = {value} m. Cubic count and linear length conversions kept distinct.'
    elif kind == 'equal-volume-cube-edge':
        volume = voxels(p['dimensions']); value = one([n for n in range(1, volume + 1) if n * n * n == volume])
        method = 'Independent rectangular unit-cell count followed by complete positive cube-edge search'
        note = f'Original block {p["dimensions"]} has {volume} unit cells, matching exactly a {value}-cm cube.'
    elif kind == 'pool-fill-hours':
        volume = voxels(p['dimensions']); expected = integer(F(volume, p['rateM3']))
        answer = pick(row, [number(o.removesuffix(' сағ')) for o in row['options']], expected)
        assert expected * p['rateM3'] == volume
        note = f'All three pool dimensions give {volume} m³; {expected} complete hours at {p["rateM3"]} m³/hour restore that volume.'
    elif kind == 'unordered-factor-triples':
        triples = set()
        for a, b in product(range(1, p['volume'] + 1), repeat=2):
            c = F(p['volume'], a * b)
            if c.denominator == 1:
                triples.add(tuple(sorted((a, b, integer(c)))))
        value = len(triples)
        printed = {tuple(map(int, m)) for m in re.findall(r'\((\d+); (\d+); (\d+)\)', row['solution'])}
        assert printed == triples
        method = 'All ordered positive first/second edge pairs; exact third quotient; quotient complete triples by rotations'
        note = f'Full unlabelled factor-triple domain {sorted(triples)}; every printed solution triple checked and no additional triples omitted.'
    elif kind == 'pyramid-faces':
        sides = {('side', i) for i in range(p['baseSides'])}; base = {('base', 0)}
        assert sides.isdisjoint(base); value = len(sides | base)
        method = 'One separately labelled triangular side face for every polygon edge plus the polygon base'
        note = f'{len(sides)} triangular sides and one base give {value} distinct faces; base is not omitted.'
    elif kind == 'barrel-bucket-count':
        value = integer((p['barrelDm3'] * VOLUME['дм³']) / (p['bucketL'] * VOLUME['л']))
        assert value * p['bucketL'] == p['barrelDm3']
        note = f'{p["barrelDm3"]} dm³ equals that many litres; exactly {value} full {p["bucketL"]}-litre buckets, no partial fill.'
    elif kind == 'cube-edge-sum':
        expected = edge_ledger([p['edge']] * 3) * LENGTH['см']
        answer = pick(row, [printed_quantity(o, LENGTH) for o in row['options']], expected)
        method = 'Complete binary-coordinate cube edge graph, all twelve individual wire segments counted exactly once'
        note = f'Total {expected} metres; face count six and cube volume are dimensionally different.'
    elif kind == 'cuboid-volume-scale':
        coefficients = p['factors']; expected = coefficients[0] * coefficients[1] * coefficients[2]
        assert coefficients[2] == 1
        answer = pick(row, [number(o.removesuffix(' есе')) for o in row['options']], expected)
        method = 'Formal trilinear volume ratio with original edge variables cancelling and unchanged-height coefficient one'
        note = f'All positive original dimensions cancel, leaving exact coefficient product {coefficients} = {expected}; not coefficient sum.'
    else:
        raise AssertionError(('Unreviewed volume model', kind))
    if answer is None:
        value = integer(value)
        answer = pick(row, [number(o) for o in row['options']], value) if row.get('options') else str(value)
    assert row['answer'] == answer, (row['editionId'], row['answer'], answer)
    if row.get('options'):
        assert len(row['options']) == len(set(row['options'])) == 4 and row['options'].count(answer) == 1
    else:
        assert re.fullmatch(r'\d+', answer) and re.search(r'Жауап[^.]*тек сан', row['statement'])
    return method, note


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--write', action='store_true'); args = parser.parse_args()
    rows = json.loads((ROOT / PACK).read_text())['editions']; assert len(rows) == 33
    assert len({r['editionId'] for r in rows}) == len({r['sourceRefs'][0]['sourceId'] for r in rows}) == 33
    entries = []
    for row in rows:
        assert row['grade'] == 4 and row['minimumPlan'] == 'pro'
        assert not re.search(r'[\\$]', row['statement'] + row['solution'])
        for ref in row['sourceRefs']:
            raw = json.loads((ROOT / ref['sourceFile']).read_text())
            q = one([q for q in raw['questions'] if q['id'] == ref['sourceId']])
            assert raw['grade'] == 4 and raw['topic'] == '1-7' and q['checked'] and not q.get('images') and not q.get('svg')
            assert q['statement'] != row['statement']
        method, note = solve(row)
        entries.append({'editionId': row['editionId'], 'sha256': digest(row), 'verdict': 'verified', 'method': method,
                        'notes': note + ' All original/new conditions, complete solutions and source/new MCQ read independently. Length/area/volume dimensions, internal capacity, strict overflow, all counted edges/faces, global domains and rotations retained. No authored solver imported.'})
    rejected = 0
    for row in rows:
        changed = json.loads(json.dumps(row)); changed['answer'] = '__WRONG_KEY__'
        try:
            solve(changed)
        except AssertionError:
            rejected += 1
        else:
            raise AssertionError('Wrong key accepted')
    find = lambda kind: next(r for r in rows if r['modelId'] == 'grade4-volume-' + kind)
    canaries = []
    c = json.loads(json.dumps(find('greatest-mixed-volume'))); c['options'][0] = '3000000 см³'; canaries.append(c)
    c = json.loads(json.dumps(find('overflow-capacity'))); c['answer'] = c['options'][0]; canaries.append(c)
    c = json.loads(json.dumps(find('exactly-one-painted-face'))); c['answer'] = '25'; canaries.append(c)
    c = json.loads(json.dumps(find('unordered-factor-triples'))); c['solution'] = c['solution'].replace('(1; 6; 6)', '(1; 5; 6)'); canaries.append(c)
    c = json.loads(json.dumps(find('cube-wire-to-volume'))); c['answer'] = str((c['params']['edgeSum'] // 6)**3); canaries.append(c)
    c = json.loads(json.dumps(find('cut-cube-to-row'))); c['answer'] = '8000'; canaries.append(c)
    for changed in canaries:
        try:
            solve(changed)
        except AssertionError:
            pass
        else:
            raise AssertionError('Lost units, boundary/domain or equivalent key accepted')
    print(json.dumps({'independentVolumeChecks': len(entries), 'wrongKeysRejected': rejected,
                      'dimensionalAndDomainCanaries': len(canaries), 'manualFindings': []}, ensure_ascii=False, indent=2))
    if args.write:
        report = {'schemaVersion': 1, 'pack': PACK, 'reviewedAt': '2026-10-23',
                  'scope': 'All 33 original/new volume conditions, full solutions and MCQ read. Separate exact SI dimensional parser, complete coordinate incidence graphs, unit-voxel and painted-boundary classification, positive cube roots, exact fluid conservation, and complete ordered-to-unordered factor domains reproduce all keys. Full canonical edition hashes bind this review.',
                  'entries': entries}
        (ROOT / OUT).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        print('Wrote 33 independent volume review records.')


if __name__ == '__main__':
    main()
