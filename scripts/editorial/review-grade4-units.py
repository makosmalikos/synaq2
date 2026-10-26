"""Independent dimensional verification after reading all 52 source/new pairs."""
import hashlib
import json
import sys
from fractions import Fraction as Q
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FILE = 'problems/editorial/batches/grade4-units-wave7.json'
# Different base units from the author module: kg, m², m³, seconds, months.
UNITS = {
    'mg':('mass',Q(1,10**6)), 'g':('mass',Q(1,1000)), 'kg':('mass',Q(1)),
    'c':('mass',Q(100)), 't':('mass',Q(1000)),
    'mm2':('area',Q(1,10**6)), 'cm2':('area',Q(1,10**4)),
    'dm2':('area',Q(1,100)), 'm2':('area',Q(1)), 'ar':('area',Q(100)),
    'ha':('area',Q(10000)), 'km2':('area',Q(10**6)),
    'mm3':('volume',Q(1,10**9)), 'cm3':('volume',Q(1,10**6)),
    'dm3':('volume',Q(1,1000)), 'm3':('volume',Q(1)), 'litre':('volume',Q(1,1000)),
    'second':('duration',Q(1)), 'minute':('duration',Q(60)), 'hour':('duration',Q(3600)),
    'day':('duration',Q(86400)), 'week':('duration',Q(604800)),
    'month':('calendar',Q(1)), 'year':('calendar',Q(12)), 'century':('calendar',Q(1200)),
}

def convert(amount, source, target):
    dimension, factor = UNITS[source]
    target_dimension, target_factor = UNITS[target]
    assert dimension == target_dimension
    return Q(amount)*factor/target_factor

def check(write=False):
    rows=json.loads((ROOT/FILE).read_text())['editions']
    assert len(rows)==52
    entries=[]
    for row in rows:
        p=row['params']
        if row['modelId']=='grade4-measurement-conversion':
            expected=sum((convert(part['value'],part['unit'],p['target']) for part in p['from']),Q())
        elif row['modelId']=='grade4-fraction-of-time-unit':
            expected=convert(1,p['from'],p['target'])*Q(p['numerator'],p['denominator'])
        else:
            assert row['modelId']=='grade4-given-year-fraction'
            assert p['days'] in [365,366]
            expected=Q(p['days']*p['numerator'],p['denominator'])
            assert str(p['days']) in row['statement']
        assert expected.denominator==1 and str(expected)==row['answer']
        assert row['statement'].endswith('Жауапты тек санмен жазыңдар.')
        ref,=row['sourceRefs']
        source=next(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId'])
        assert source['checked'] is True and row['statement'] != source['statement']
        digest=hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        entries.append({'editionId':row['editionId'],'sha256':digest,'verdict':'verified',
            'reviewer':'independent_root_agent','method':'independent_SI_and_calendar_Fraction_converter',
            'expectedAnswer':str(expected),'checks':['all 52 source and rewritten conditions/explanations read separately',
            'dimensions and square/cubic prefixes checked against different base units',
            'calendar years converted to months only; duration year days explicitly supplied',
            'numeric-only answer format explicitly stated to match the available input checker']})
    result={'schemaVersion':1,'date':'2026-10-23','batchFile':FILE,'reviewed':len(entries),'entries':entries}
    if write:(ROOT/'problems/editorial/reviews/grade4-units-wave7.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    return result

if __name__=='__main__':
    result=check('--write-review' in sys.argv)
    print(json.dumps({'reviewed':result['reviewed'],'result':'passed'}))
