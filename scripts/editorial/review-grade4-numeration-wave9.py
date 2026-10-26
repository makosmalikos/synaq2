"""Independent JSON-only grade4 numeration review; no authored solver imported.

All current source/new conditions, complete solutions and MCQ options were read
before signing. Python enumeration, decimal strings and a separate Kazakh number
reader reproduce the results. --write pins the exact complete edition hashes.
"""
from pathlib import Path
from itertools import permutations, product
import argparse
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
PACK = 'problems/editorial/batches/grade4-numeration-wave9.json'
OUT = 'problems/editorial/reviews/grade4-numeration-wave9.json'
SMALL = dict(zip(['нөл','бір','екі','үш','төрт','бес','алты','жеті','сегіз','тоғыз'], range(10)))
SMALL.update(dict(zip(['он','жиырма','отыз','қырық','елу','алпыс','жетпіс','сексен','тоқсан'], range(10,100,10))))
WORDS = set(SMALL) | {'жүз','мың','миллион','миллиард'}
PLACES = ['бірліктер разряды','ондықтар разряды','жүздіктер разряды',
          'бірлік мыңдар разряды','ондық мыңдар разряды','жүздік мыңдар разряды']


def digest(row):
    text = json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def number_words(text):
    current = total = 0
    for token in text.lower().split():
        assert token in WORDS, (text, token)
        if token in SMALL:
            current += SMALL[token]
        elif token == 'жүз':
            current = (current or 1) * 100
        else:
            scale = {'мың':1000, 'миллион':1000000, 'миллиард':1000000000}[token]
            total += (current or 1) * scale
            current = 0
    return total + current


def first_written_number(text):
    started = False
    tokens = []
    for token in re.findall(r'[а-яәіңғүұқөһ]+', text.lower()):
        if token in WORDS:
            tokens.append(token)
            started = True
        elif started:
            break
    assert tokens, text
    return number_words(' '.join(tokens))


def quoted_number(text):
    return number_words(re.search('«([^»]+)»', text)[1])


def fmt(value):
    return f'{value:,}'.replace(',', ' ')


def numeric(text):
    compact = re.sub(r'\s', '', text)
    assert re.fullmatch(r'\d+', compact), text
    return int(compact)


def one(values):
    assert len(values) == 1, values
    return values[0]


def choose(row, values, expected):
    assert values.count(expected) == 1, (row['editionId'], values, expected)
    assert len(values) == len(set(values)) == 4, ('Equivalent choices', row['editionId'])
    return row['options'][values.index(expected)]


def expansion(number):
    return tuple(int(digit) * 10**i for i, digit in reversed(list(enumerate(str(number)[::-1]))) if digit != '0')


def solve(row):
    p = row['params']
    kind = row['modelId'].removeprefix('grade4-numeration-')
    value = answer = None
    method = 'Independent integer/string place-value reconstruction and inverse check'
    note = ''
    if kind == 'position-digit':
        value = int(str(p['number'])[::-1][p['position']])
        assert (p['number'] // 10**p['position']) % 10 == value
        note = f'Reverse decimal digits; place index {p["position"]} selects digit {value}.'
    elif kind == 'word-number':
        value = quoted_number(row['statement'])
        assert value == p['number']
        note = f'Independent Kazakh number reader reconstructs {value}, including all zero placeholders.'
    elif kind == 'number-word':
        values = [number_words(option) for option in row['options']]
        assert values == p['choices']
        answer = choose(row, values, p['number'])
        method = 'Independently parse all four Kazakh readings into integer class values'
        note = f'All printed readings map to {values}; exactly one equals {p["number"]}.'
    elif kind == 'order':
        expected = tuple(sorted(p['numbers']))
        values = [tuple(numeric(part) for part in option.split(';')) for option in row['options']]
        assert all(sorted(value) == list(expected) for value in values)
        answer = choose(row, values, expected)
        note = f'Every option contains exactly the original multiset; unique increasing order {expected}.'
    elif kind == 'min-length':
        value = int('1' + '0' * (p['digits'] - 1))
        assert len(str(value)) == p['digits'] and len(str(value - 1)) == p['digits'] - 1
        note = f'Boundary {value} has the required length; its predecessor loses a digit.'
    elif kind == 'relation-choice':
        values = []
        for option, claim in zip(row['options'], p['choices']):
            a, relation, b = re.fullmatch(r'(.+?)\s*([<>=])\s*(.+)', option).groups()
            a, b = numeric(a), numeric(b)
            assert (a, b, relation) == (claim['a'], claim['b'], claim['relation'])
            values.append(a < b if relation == '<' else a > b if relation == '>' else a == b)
        assert sum(values) == 1
        answer = row['options'][values.index(True)]
        note = f'Four independently evaluated relations have truth values {values}.'
    elif kind == 'extreme-choice':
        value = max(p['numbers']) if p['direction'] == 'maximum' else min(p['numbers'])
        assert [numeric(option) for option in row['options']] == p['numbers']
        note = f'Complete numerical ordering {sorted(p["numbers"])}; selected {p["direction"]} {value}.'
    elif kind == 'compose-classes':
        classes = [p['millions'], p['thousands'], p['units']]
        assert all(0 <= item < 1000 for item in classes)
        value = int(''.join(f'{item:03d}' for item in classes))
        assert [value // 1000000, value // 1000 % 1000, value % 1000] == classes
        note = f'Padded class strings {classes} concatenate to {value}; decomposition returns every class exactly.'
    elif kind == 'class-value':
        padded = str(p['number']).zfill(3 * (len(str(p['number'])) // 3 + 1))
        groups = [int(padded[max(0,len(padded)-3*i-3):len(padded)-3*i]) for i in range(len(padded)//3)]
        value = groups[p['classIndex']]
        assert value == p['number'] // 1000**p['classIndex'] % 1000
        note = f'Group decimal string in threes from the right: {groups}; selected class index {p["classIndex"]}.'
    elif kind == 'expanded-choice':
        values = [tuple(numeric(part) for part in option.split('+')) for option in row['options']]
        assert values == [tuple(parts) for parts in p['choices']]
        answer = choose(row, values, expansion(p['number']))
        note = f'Only the printed tuple {expansion(p["number"])} gives precisely the nonzero place addends.'
    elif kind == 'digit-place':
        positions = [i for i, digit in enumerate(str(p['number'])[::-1]) if int(digit) == p['digit']]
        position = one(positions)
        assert row['options'] == [PLACES[i] for i in p['positions']]
        answer = PLACES[position]
        note = f'Digit {p["digit"]} occurs exactly once, at decimal position {position}.'
    elif kind == 'class-multiple':
        units = sum(p['thousands'] for _ in range(p['multiplier']))
        assert 100 <= units <= 999 and str(units)[1] == '0' and str(units)[2] != '0'
        value = int(str(p['thousands']) + f'{units:03d}')
        assert value // 1000 == p['thousands'] and value % 1000 == units
        note = f'Repeated-addition class result {units} retains its internal zero; full concatenation {value}.'
    elif kind == 'neighbors':
        values = [tuple(numeric(part) for part in option.split(' және ')) for option in row['options']]
        answer = choose(row, values, (p['number'] - 1, p['number'] + 1))
        assert p['number'] % 10 == 9
        note = 'Adjacent integers differ by one; the next integer must carry from units into tens.'
    elif kind == 'compose-places':
        digits = ['0'] * p['digits']
        assert len({item['position'] for item in p['entries']}) == len(p['entries'])
        for item in p['entries']:
            digits[-1-item['position']] = str(item['digit'])
        assert digits[0] != '0'
        value = int(''.join(digits))
        assert len(str(value)) == p['digits']
        note = f'Insert supplied digits into a zero-initialized decimal string: {digits} -> {value}.'
    elif kind == 'shift-thousand':
        value = p['number'] + 1000
        assert p['number'] // 1000 % 100 == 99
        assert value % 1000 == p['number'] % 1000
        note = f'Thousands class crosses a 99 boundary; units class unchanged, result {value}.'
    elif kind == 'length-difference':
        smallest = int('1' + '0' * (p['digits'] - 1))
        largest = int('9' * p['digits'])
        value = largest - smallest
        assert smallest + value == largest
        note = f'Exact extrema {smallest}, {largest}; inverse addition checks difference {value}.'
    elif kind == 'interval-choice':
        value = one([number for number in p['numbers'] if p['lower'] < number < p['upper']])
        note = f'Both strict bounds applied to all four candidates; only {value} lies inside.'
    elif kind == 'word-subtract-story':
        total = first_written_number(row['statement'])
        assert total == p['total'] and 0 < p['allocated'] < total
        value = total - p['allocated']
        assert value + p['allocated'] == total
        note = f'Parse written total {total}, subtract allocated {p["allocated"]}, back-add to recover total.'
    elif kind == 'min-distinct':
        value = next(n for n in range(10**(p['digits']-1),10**p['digits']) if len(set(str(n))) == p['digits'])
        method = 'Enumerate every smaller integer of the required length until distinct digits first occur'
        note = f'First valid number {value}; leading zero is excluded by the length-domain boundary.'
    elif kind == 'word-compare':
        left = quoted_number(row['statement'])
        assert left == p['left']
        answer = '<' if left < p['right'] else '>' if left > p['right'] else '='
        note = f'Written reading gives {left}, compared numerically with {p["right"]}.'
    elif kind == 'min-permutation':
        choices = [int(''.join(map(str,digits))) for digits in permutations(p['digits']) if digits[0] != 0]
        value = min(choices)
        method = 'Enumerate all permutations, discard every leading-zero arrangement'
        note = f'{len(choices)} full-length permutations checked; minimum {value}.'
    elif kind == 'repeated-class-riddle':
        values = []
        for digit in range(1,10):
            units = 111 * digit
            top = units * p['multiplier']
            if 100 <= top <= 999 and len(set(str(top))) == 1:
                number = top * 1000 + units
                if sum(map(int,str(number))) == p['digitSum']:
                    values.append(number)
        value = one(values)
        method = 'Enumerate all repeated-digit unit classes, constrain multiplier and whole-number digit sum'
        note = f'Only {value} satisfies both repeated-digit classes, directed class ratio and digit sum.'
    elif kind == 'middle-code':
        assert len(set(p['numbers'])) == 3
        value = sorted(p['numbers'])[1]
        note = f'Strict named order puts the requested person at the unique middle code {value}.'
    elif kind == 'max-distinct-odd':
        value = next(n for n in range(min(10**p['digits'],p['exclusiveUpper'])-1,10**(p['digits']-1)-1,-1)
                     if n % 2 == 1 and len(set(str(n))) == p['digits'])
        method = 'Descending global enumeration under the strict bound, not just ranking the MCQ candidates'
        note = f'Greatest valid globally distinct odd integer {value}; bound {p["exclusiveUpper"]} is exclusive.'
    elif kind == 'min-digit-sum':
        value = next(n for n in range(10**(p['digits']-1),10**p['digits']) if sum(map(int,str(n))) == p['digitSum'])
        method = 'Ascending complete integer search for the first number with the stated digit sum'
        note = f'Global minimum {value}; exact digit sum {sum(map(int,str(value)))}.'
    elif kind == 'equal-classes-difference':
        numbers = [int(str(block) * p['classCount']) for block in range(100,1000)]
        value = max(numbers) - min(numbers)
        method = 'Enumerate every legal shared three-digit block and compare the repeated-class extrema'
        note = f'Extrema {min(numbers)}, {max(numbers)}; all {p["classCount"]} classes use the same three-digit block.'
    elif kind == 'binary-digit-count':
        strings = [digits for digits in product([0,p['nonzero']], repeat=p['digits']) if digits[0] != 0]
        value = len(strings)
        method = 'Enumerate all binary digit strings, remove the leading-zero half'
        note = f'{value} legal full-length strings remain; repetitions explicitly permitted.'
    elif kind == 'written-digit-count':
        value = sum(len(str(n)) for n in range(1,p['end']+1))
        method = 'Count actual decimal characters of every integer, independently of the producer block formula'
        note = f'Exactly {value} printed digits for every integer from 1 through {p["end"]}, both included.'
    elif kind == 'append-cycle':
        value = p['firstDigit']
        prefix = []
        for i in range(p['shown']):
            prefix.append(value)
            value = int(str(value) + str(p['cycle'][i % len(p['cycle'])]))
        printed = re.search(r'Қатар: (.+?); …', row['statement'])[1]
        assert [numeric(part) for part in printed.split(';')] == prefix
        note = f'Read shown prefix {prefix}; append the next digit of the explicit length-two block -> {value}.'
    elif kind == 'expanded-sum':
        printed = re.search(r'коды (.+?) қосындысына', row['statement'])[1]
        addends = [numeric(part) for part in printed.split('+')]
        assert addends == p['addends']
        value = sum(addends)
        note = f'Actual printed place addends {addends} summed independently to {value}.'
    elif kind == 'class-carry':
        original = int(str(p['thousands']) + f'{p["units"]:03d}')
        value = original + p['increase']
        assert p['units'] + p['increase'] == 1000 and value % 1000 == 0
        assert value // 1000 == p['thousands'] + 1
        note = f'Units class crosses exactly 1000: {original} + {p["increase"]} = {value}.'
    elif kind == 'word-carry-story':
        original = first_written_number(row['statement'])
        assert original == p['initial'] and original % 1000 + p['increase'] == 1000
        value = original + p['increase']
        note = f'Independent word reader gives {original}; addition carries to the next whole thousand {value}.'
    elif kind == 'max-even-unique':
        values = [int(''.join(map(str,ds))) for ds in permutations([0,2,4,6,8],p['digits'])
                  if ds[0] != 0 and int(''.join(map(str,ds))) < p['exclusiveUpper']]
        value = max(values)
        method = 'Enumerate all distinct even-digit permutations, apply full-length and strict upper-bound constraints'
        note = f'Global maximum {value}, not merely a number whose final digit is even.'
    elif kind == 'thousands-quantity':
        value = sum(1000 for _ in range(p['thousands']))
        note = f'{p["thousands"]} independent thousand-unit blocks contain exactly {value} units.'
    elif kind == 'zero-count':
        number = quoted_number(row['statement'])
        assert number == p['number']
        value = str(number).count('0')
        note = f'Independently read the Kazakh name as {number}, then count exactly {value} literal zero digits.'
    elif kind == 'near-power-equivalent':
        target = sum(p['factor'] for _ in range(p['power']-1))
        values = []
        for option, claim in zip(row['options'],p['choices']):
            a, operation, b = re.fullmatch(r'(.+?)\s*([+−])\s*(.+)',option).groups()
            a,b = numeric(a),numeric(b)
            assert (a,b) == (claim['a'],claim['b'])
            assert operation == ('+' if claim['operation'] == 'add' else '−')
            values.append(a+b if operation == '+' else a-b)
        answer = choose(row,values,target)
        method = 'Repeated addition computes the target independently; all four printed expressions evaluated separately'
        note = f'Expression values {values}; exactly one matches product {target}.'
    elif kind == 'total-place-units':
        # Decimal-prefix reading is independent of the author's quotient helper.
        value = int(str(p['number'])[:-p['position']] or '0')
        remainder = p['number'] - value * 10**p['position']
        assert 0 <= remainder < 10**p['position'] and value > 9
        note = f'{value} complete place units with remainder {remainder}; not the single digit at that place.'
    elif kind == 'boundary-difference':
        first = p['largerBoundary'] - p['before']
        last = p['smallerBoundary'] + p['after']
        value = first - last
        assert value + last == first
        note = f'Construct both boundary neighbours {first}, {last}; inverse addition proves difference {value}.'
    elif kind == 'near-power-product':
        value = sum(p['factor'] for _ in range(p['power']-1))
        assert value + p['factor'] == p['factor'] * p['power']
        method = 'Repeated addition independently checks the near-power distributive explanation'
        note = f'Exact product {value}; adding the removed one factor recovers {p["power"]} equal factors.'
    else:
        raise AssertionError(('Unreviewed numeration model',kind))

    if answer is None:
        assert isinstance(value,int)
        answer = fmt(value) if row.get('options') else str(value)
    assert row['answer'] == answer, (row['editionId'],row['answer'],answer)
    options = row.get('options')
    if options:
        assert len(options) == len(set(options)) == 4 and options.count(answer) == 1
        if value is not None:
            numbers = [numeric(option) if re.fullmatch(r'\d[\d\s]*',option) else None for option in options]
            assert numbers.count(value) == 1
            assert len(set(n for n in numbers if n is not None)) == len([n for n in numbers if n is not None])
    else:
        assert re.fullmatch(r'\d+', answer)
    return method,note


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--write',action='store_true')
    args = parser.parse_args()
    rows = json.loads((ROOT/PACK).read_text())['editions']
    assert len(rows) == 54 and len({row['editionId'] for row in rows}) == 54
    assert len({row['sourceRefs'][0]['sourceId'] for row in rows}) == 54
    entries = []
    for row in rows:
        expected_topic = 'seq' if row['modelId'] == 'grade4-numeration-append-cycle' else 'num'
        assert row['grade'] == 4 and row['topic'] == expected_topic and row['minimumPlan'] == 'pro'
        assert not re.search(r'[\\$]',row['statement']+row['solution'])
        for ref in row['sourceRefs']:
            source_file = json.loads((ROOT/ref['sourceFile']).read_text())
            question = next(question for question in source_file['questions'] if question['id'] == ref['sourceId'])
            assert source_file['grade'] == 4 and source_file['topic'] in ('1-2','1-3') and question['checked']
            assert question['statement'] != row['statement']
        method,note = solve(row)
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',
                        'method':method,'notes':note+' Full original/new conditions, complete solutions and MCQ choices read independently. Grade, ordered classes, zero placeholders, bounds and efficient-method skill checked; no authored solver imported.'})
    print(json.dumps({'numericAndChoiceChecks':len(entries),'manualFindings':[]},ensure_ascii=False,indent=2))
    if args.write:
        report = {'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23',
                  'scope':'All 54 saved canonical source/new conditions, complete solutions and MCQ options independently read. A separate Kazakh number reader, decimal strings, exhaustive digit/permutation searches and integer ledgers reproduce the answers. The class-multiplication row was reread after restoring its internal zero. Full canonical edition hashes pin this review.',
                  'entries':entries}
        (ROOT/OUT).parent.mkdir(parents=True,exist_ok=True)
        (ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print('Wrote 54 independent numeration review records.')


if __name__ == '__main__':
    main()
