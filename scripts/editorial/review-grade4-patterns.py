"""Independent closed-form sums after reading the source and authored condition."""
import hashlib
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[2]
file = 'problems/editorial/batches/grade4-patterns-wave4.json'
row, = json.loads((root / file).read_text())['editions']
top = row['params']['top']
assert top == 24600 and top % 2 == 0
k = top // 2
even_sum = k * (k + 1)
odd_sum = k * k
expected = str(even_sum - odd_sum)
assert expected == row['answer'] == '12300'
assert 'екі шеткі нөмір де кіреді' in row['statement']
ref, = row['sourceRefs']
source = next(q for q in json.loads((root / ref['sourceFile']).read_text())['questions'] if q['id'] == ref['sourceId'])
assert source['checked'] is True and source['sourceAnswer'] == '50000'
digest = hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
report = {'schemaVersion':1,'date':'2026-10-23','batchFile':file,'reviewed':1,'entries':[
    {'editionId':row['editionId'],'sha256':digest,'verdict':'verified',
     'reviewer':'independent_root_agent','method':'closed_form_even_and_odd_sums',
     'expectedAnswer':expected,'checks':['source alternating sum and new card-number story read separately',
       'both inclusive endpoints and the order even minus odd explicitly checked',
       'separate arithmetic-series formulas instead of author enumeration']}]}
if '--write-review' in sys.argv:
    (root / 'problems/editorial/reviews/grade4-patterns-wave4.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'reviewed':1,'result':'passed'}))
