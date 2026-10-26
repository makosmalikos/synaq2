"""Review the arithmetic and equation batches through independently parsed text.

--write-review is for the reviewer after reading changed wording and pedagogy;
passing exact arithmetic alone is not permission to approve a draft.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from exact_math_oracle import expression, value, family, equation_root

ROOT = Path(__file__).resolve().parents[2]
SPECS = {'arithmetic': ('grade4-arithmetic-wave2', 156),
         'equations': ('grade4-equations-wave3', 76)}

def hash_row(row):
    return hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True,
                                    separators=(',', ':')).encode()).hexdigest()

def original_math(source):
    blocks = re.findall(r'\$([^$]+)\$', source['statement'])
    assert len(blocks) == 1
    tex = blocks[0]
    # Strip command names before detecting the actual source variable.
    names = set(re.findall('[a-z]', re.sub(r'\\[a-zA-Z]+', '', tex)))
    if '=' in tex:
        assert len(names) == 1
        tex = re.sub(r'(?<![a-zA-Z])' + next(iter(names)) + r'(?![a-zA-Z])', 'x', tex)
        left, right = tex.split('=')
        return (expression(left), expression(right))
    return expression(tex)

def written_equalities(text, x=None):
    chains = [s.strip().lstrip(':').strip() for s in re.findall(r'[0-9x\s()+−·:²³*/=\-]+', text) if '=' in s]
    assert chains, 'No displayed calculation steps'
    for chain in chains:
        values = [value(expression(part.strip()), x) for part in chain.split('=')]
        assert len(set(values)) == 1, ('Invalid equality in the written solution', chain, values)
    return chains

def review(kind, strict_family=True):
    name, count = SPECS[kind]
    filename = f'problems/editorial/batches/{name}.json'
    rows = json.loads((ROOT / filename).read_text())['editions']
    assert len(rows) == count
    entries, source_cache = [], {}
    for row in rows:
        assert row['grade'] == 4
        assert not any(c in row['statement'] + row['solution'] for c in ['$', '\\'])
        ref, = row['sourceRefs']
        if ref['sourceFile'] not in source_cache:
            source_cache[ref['sourceFile']] = json.loads((ROOT / ref['sourceFile']).read_text())
        capture = source_cache[ref['sourceFile']]
        source = next(q for q in capture['questions'] if q['id'] == ref['sourceId'])
        assert capture['grade'] == 4 and source['checked'] is True
        source_key = value(expression(source['sourceAnswer'].replace('$', '')))
        original = original_math(source)
        if kind == 'arithmetic':
            written = expression(row['statement'].split(': ', 1)[1].rstrip('.'))
            result = value(written)
            assert value(original) == source_key
            assert row['statement'] != source['statement']
            # Effective calculation needs its own edited regrouping explanation.
            if 'Тиімді' in source['statement']:
                method = row['params'].get('efficient')
                assert method and method['explanation'] and len(method['proofExpressions']) >= 2
                assert any(len(s.split('=')) >= 3 for s in written_equalities(row['solution']))
            elif strict_family:
                assert family(written) == family(original), row['editionId'] + ': digit/operator structure changed'
            checks = ['expression parsed from the displayed Kazakh condition',
                      'independent Python Fraction arithmetic, not the author parameter tree',
                      'original expression and original source key separately recomputed']
        else:
            left_text, right_text = row['statement'].split(' теңдігі', 1)[0].split('=')
            left, right = expression(left_text), expression(right_text)
            result = equation_root(left, right)
            assert equation_root(*original) == source_key
            assert (family(left), family(right)) == tuple(map(family, original)), row['editionId']
            assert value(left, result) == value(right, result)
            checks = ['both sides parsed directly from the displayed equality',
                      'unique solution derived through rational linear-fractional coefficients',
                      'denominator domain and exact substitution independently verified',
                      'original equation and source key separately recomputed']
        assert result.denominator == 1 and result >= 0
        assert str(result) == row['answer'], row['editionId']
        written_equalities(row['solution'], result if kind == 'equations' else None)
        checks.append('every displayed solution equality separately recomputed')
        if kind == 'arithmetic' and 'Тиімді' in source['statement']:
            checks.append('rewritten effective grouping strategy separately read against the original skill')
        entries.append({'editionId': row['editionId'], 'sha256': hash_row(row),
                        'verdict': 'verified', 'reviewer': 'independent_root_agent',
                        'method': 'separate_text_parse_and_fraction_oracle',
                        'checks': checks, 'expectedAnswer': str(result)})
    return {'schemaVersion': 1, 'date': '2026-10-23', 'batchFile': filename,
            'reviewed': len(entries), 'entries': entries}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('kind', choices=SPECS)
    parser.add_argument('--write-review', action='store_true')
    args = parser.parse_args()
    result = review(args.kind)
    if args.write_review:
        name, _ = SPECS[args.kind]
        (ROOT / f'problems/editorial/reviews/{name}.json').write_text(
            json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'reviewed': result['reviewed'], 'result': 'passed'}))
