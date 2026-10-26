"""Inventory canonical saved grade-4 nonvisual tasks; never publish or fetch."""
import collections
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
BASE = ROOT / 'problems/sources/zerek/courses'
DEST = ROOT / 'problems/editorial/batches/grade4-inventory.json'

def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))

def normalized(text, numbers=False):
    text = re.sub(r'\s+', ' ', text).strip()
    return re.sub(r'\d+(?:[.,]\d+)?', '#', text) if numbers else text

def form(question):
    text = question['statement']
    if re.search(r'Теңдеуді|теңдеу.*шеш|белгісіз.*тап', text, re.I):
        return 'equation-or-unknown'
    if re.search(r'қай.*(?:теңдік|тұжырым|жазба).*қате|қатені', text, re.I):
        return 'identify-false-example'
    if re.search(r'қай.*(?:теңдік|тұжырым|жазба).*дұрыс', text, re.I):
        return 'identify-correct-claim'
    if re.search(r'қалдық', text, re.I):
        return 'euclidean-division'
    if re.search(r'ретімен|кему рет|өсу рет|салыстыр', text, re.I):
        return 'order-or-comparison'
    if re.search(r'дөңгелек', text, re.I):
        return 'rounding'
    if re.search(r'бөлінетін|бөлінеді|бөлінгіш', text, re.I):
        return 'divisibility'
    if re.search(r'^\s*(?:Тиімді тәсілмен )?(?:Есептең|Өрнектің мәнін|Амалдарды орында)', text, re.I):
        return 'evaluate-expression'
    if re.search(r'жиын|[∩∪]|\\(?:cap|cup|subset)', text, re.I):
        return 'set-operation-or-membership'
    if re.search(r'^\s*\$.*\$\s*(?:көбейтінді|бөлінді|қосынды|айырма)', text, re.S):
        return 'direct-operation'
    if re.search(r'неше|қанша|қандай|табыңдар|табыңыз', text, re.I):
        return 'word-problem-or-requested-quantity'
    return 'manual-reading-required'

def existing_editions():
    covered = collections.defaultdict(list)
    for file in sorted((ROOT/'problems/editorial').glob('synaq-standard-*.json')):
        data = json.loads(file.read_text())
        rows = data if isinstance(data, list) else data.get('editions', [])
        for row in rows:
            for ref in row.get('sourceRefs', []):
                covered[(ref['sourceFile'], ref['sourceId'])].append(row['editionId'])
    return covered

def main():
    covered = existing_editions()
    records, units, visual = [], [], []
    for file in sorted([*BASE.glob('4-math-*-level[123].json'), *BASE.glob('4-math-*-leveltest.json')]):
        data = json.loads(file.read_text())
        if data.get('status') != 'captured':
            continue
        assert data['grade'] == 4
        assert len(data['questions']) == data['expected']
        topic = re.sub(r'-level(?:[123]|test)\.json$', '', file.name)
        unit = {'sourceFile':str(file.relative_to(ROOT)), 'topic':topic, 'level':data['level'],
                'title':data['title'], 'captured':len(data['questions']), 'nonvisual':0, 'visual':0}
        units.append(unit)
        for index, question in enumerate(data['questions']):
            ref = {'sourceFile':str(file.relative_to(ROOT)), 'sourceId':question['id']}
            if question.get('images') or question.get('svg') or '[Image:' in question['statement']:
                unit['visual'] += 1
                visual.append(ref)
                continue
            unit['nonvisual'] += 1
            payload = {'statement':normalized(question['statement']),
                       'options':[normalized(o['text']) for o in question.get('options', [])]}
            numeric_shape = {'statement':normalized(question['statement'], True),
                             'options':[normalized(o['text'], True) for o in question.get('options', [])]}
            prior = covered.get((ref['sourceFile'], ref['sourceId']), [])
            records.append({**ref, 'sourceIndex':index, 'sourceTopic':topic, 'level':data['level'],
                'responseMode':'choice' if question.get('options') else 'open',
                'provisionalForm':form(question),
                'exactTaskHash':hashlib.sha256(canonical(payload).encode()).hexdigest(),
                'numericShapeHash':hashlib.sha256(canonical(numeric_shape).encode()).hexdigest(),
                'status':'existing_first_51_edition' if prior else 'draft_awaiting_authored_edition',
                'existingEditionIds':prior})
    topics = sorted(set(u['topic'] for u in units))
    by_topic = []
    for topic in topics:
        ur = [u for u in units if u['topic']==topic]
        rr = [r for r in records if r['sourceTopic']==topic]
        by_topic.append({'topic':topic, 'title':ur[0]['title'], 'canonicalUnits':len(ur),
            'captured':sum(u['captured'] for u in ur), 'nonvisual':len(rr), 'visual':sum(u['visual'] for u in ur),
            'forms':dict(collections.Counter(r['provisionalForm'] for r in rr)),
            'existingFirst51References':sum(bool(r['existingEditionIds']) for r in rr)})
    duplicates = collections.defaultdict(list)
    for row in records:
        duplicates[row['exactTaskHash']].append({'sourceId':row['sourceId'], 'sourceFile':row['sourceFile']})
    report = {'schemaVersion':1, 'grade':4, 'sourceFrozenAt':'2026-10-23', 'stoppedByUser':True,
        'scope':'Canonical captured grade-4 course units only. No collections, test mirrors, mastery checkpoints, network or active publication.',
        'summary':{'canonicalUnits':len(units), 'topics':len(topics), 'capturedSourceOccurrences':len(records)+len(visual),
            'nonvisualSourceOccurrences':len(records), 'visualSourceOccurrences':len(visual),
            'nonvisualContentIds':len(set(r['sourceId'] for r in records)),
            'exactConditionAndChoices':len(duplicates), 'numericConditionAndChoiceShapes':len(set(r['numericShapeHash'] for r in records)),
            'existingFirst51References':sum(bool(r['existingEditionIds']) for r in records),
            'draftWithoutNewEdition':sum(not r['existingEditionIds'] for r in records)},
        'countingNote':'Provisional forms and number-normalized hashes are triage aids, not semantic equivalence or editorial coverage. Source variants stay archived. Only distinct reviewed authored editions count as new tasks.',
        'familyPlan':['Read the target and full official solution before selecting a mathematical model.',
            'Split arithmetic into operation/precedence/unknown/remainder/constraint models; do not expand a few templates into thousands of tasks.',
            'Keep unit/currency/time, place-value/rounding/divisibility, sets, motion, work/prices, and nonvisual geometry as separate skill families.',
            'Every edition changes mathematical givens and uses a self-contained Kazakh condition; retain source references and exact answer derivation.',
            'Unsupported or ambiguous records remain draft. New batches await a separate independent editorial review.'],
        'topics':by_topic, 'units':units, 'exactRepeatedTasks':[v for v in duplicates.values() if len(v)>1], 'records':records}
    DEST.parent.mkdir(parents=True, exist_ok=True)
    DEST.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps(report['summary'], ensure_ascii=False))

if __name__ == '__main__':
    main()
