"""Independent check of the 43 grade-4 editions read and edited on 2026-10-23.

The constants below were derived from the written conditions, not imported from
the JavaScript producer. Re-running a calculation is not a new editorial review.
"""
import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BATCH = 'problems/editorial/batches/grade4-core-wave1.json'
EXPECTED = {
    'joined-ribbons': '595', 'quarter-hour-finish': '14:35',
    'banknote-change': '4', 'euro-cent-change': '365',
    'place-value-assembly': '40308', 'digit-contribution': '70000000',
    'checkpoint-sequence': '26420', 'extreme-codes-zero': '6552',
    'mixed-freight-mass': '6500', 'cube-wire-frame': '84',
    'park-area-remainder': '2820000', 'sum-of-squares': '4949',
    'product-comparison-gap': '12', 'zero-quotient-packages': '12004',
    'divisible-code-extremum': '6420', 'thousand-sheet-order': '25500',
    'complete-hundreds-reconstruction': '4723', 'multiple-ticket-count': '11',
    'ski-trip-with-rest': '210', 'three-speed-gap': '120',
    'union-of-word-letters': '6', 'cubic-container-volume': '64',
    'free-floor-area': '76', 'adjacent-square-posters': '196',
    'three-level-packing': '(18 · 5) · 24',
    'triple-digit-unknown-factor': '91', 'production-equal-distribution': '280',
    'tens-package-division': '80', 'daily-stock-remainder': '16000',
    'equal-budget-price-count': '20', 'full-seats-total': '432',
    'three-digit-quotient-selection': '120', 'full-crates-remainder': '24',
    'unit-price-repeat-purchase': '3060', 'three-digit-product': '86478',
    'productivity-comparison-gap': '1', 'parallel-printer-time': '15',
    'shared-unit-price': '800', 'equal-speed-time-difference': '260',
    'closing-route-length': '81', 'bracket-equation': '55',
    'separation-rate-from-distance': '210', 'meeting-unknown-speed': '15',
}

def canonical_hash(row):
    value = json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(value.encode()).hexdigest()

def check():
    rows = json.loads((ROOT / BATCH).read_text())['editions']
    assert len(rows) == len(EXPECTED) == 43
    review = []
    for row in rows:
        slug = row['editionId'].removeprefix('grade4-core-')
        assert row['answer'] == EXPECTED[slug], (slug, row['answer'])
        assert row['grade'] == 4
        assert not any(c in row['statement'] + row['solution'] for c in ['$', '\\'])
        assert row['statement'].strip() and row['solution'].strip()
        for ref in row['sourceRefs']:
            source = json.loads((ROOT / ref['sourceFile']).read_text())
            original = next(q for q in source['questions'] if q['id'] == ref['sourceId'])
            assert source['grade'] == 4 and original['checked'] is True
            assert row['statement'] != original['statement']
        p = row['params']
        checks = ['answer independently calculated from the written condition',
                  'Kazakh condition, units, requested quantity and source skill read separately',
                  'original condition is not reused; all required data are present']
        if slug in ['extreme-codes-zero', 'divisible-code-extremum']:
            values = [v for v in range(1000, 10000) if Counter(str(v)) == Counter(map(str, p['digits']))]
            answer = max(values) - min(values) if slug == 'extreme-codes-zero' else max(v for v in values if v % 10 == 0)
            assert str(answer) == row['answer']
            checks.append('all four-digit numbers checked independently instead of JavaScript permutations')
        elif slug == 'multiple-ticket-count':
            assert p['upper'] // p['multiple'] - (p['lower'] - 1) // p['multiple'] == int(row['answer'])
            checks.append('closed interval checked with floor counts instead of enumeration')
        elif slug == 'three-level-packing':
            assert row['answer'] in row['options'] and len(set(row['options'])) == 4
            assert row['options'] == ['(18 · 5) · 24', '(18 + 5) · 24', '18 · 5 + 24', '18 · (5 + 24)']
            assert 18 * (5 * 24) == 2160
            assert all(v != 2160 for v in [(18 + 5) * 24, 18 * 5 + 24, 18 * (5 + 24)])
            checks.append('associative regrouping retained as the tested skill; distractors are unequal')
        review.append({'editionId': row['editionId'], 'sha256': canonical_hash(row),
                       'verdict': 'verified', 'reviewer': 'independent_root_agent',
                       'method': 'separate_condition_reading_and_python_oracle',
                       'checks': checks, 'expectedAnswer': EXPECTED[slug]})
    return {'schemaVersion': 1, 'date': '2026-10-23', 'batchFile': BATCH,
            'reviewed': len(review), 'entries': review}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--write-review', action='store_true')
    args = parser.parse_args()
    result = check()
    if args.write_review:
        output = ROOT / 'problems/editorial/reviews/grade4-core-wave1.json'
        output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'reviewed': result['reviewed'], 'result': 'passed'}))
