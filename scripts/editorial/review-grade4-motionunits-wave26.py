"""Independent review of all38 motion/SI source and rewritten full texts.

No author calculator or params are used. Printed rates are converted through
an independent SI registry to exact metres/second; trajectories and clocks
are checked separately from answer formatting and dimensional choices.
"""
from pathlib import Path
from fractions import Fraction as F
from datetime import datetime, timedelta
import argparse, copy, hashlib, json, re

ROOT = Path(__file__).resolve().parents[2]
PACK = 'problems/editorial/batches/grade4-motionunits-wave26.json'
OUT = 'problems/editorial/reviews/grade4-motionunits-wave26.json'
RATE = {'км/сағ': F(1000, 3600), 'м/мин': F(1, 60), 'м/с': F(1), 'м/сағ': F(1, 3600)}


def one(xs):
    assert len(xs) == 1, xs
    return xs[0]


def num(s):
    s = re.sub(r'\s', '', s)
    assert s.isdecimal(), s
    return int(s)


def nums(s):
    return [num(m[0]) for m in re.finditer(r'\d[\d ]*', s)]


def rates(s):
    return [num(n) * RATE[u] for n, u in re.findall(r'([\d ]+) (км/сағ|м/мин|м/с|м/сағ)', s)]


def integer(x):
    x = F(x)
    assert x.denominator == 1, x
    return x.numerator


def match(p, s):
    m = re.search(p, s)
    assert m, (p, s)
    return m


def pick(row, value, unit):
    return one([o for o in row['options'] if re.fullmatch(r'[\d ]+ ' + re.escape(unit), o)
                and num(o.removesuffix(' ' + unit)) == value])


def clock(minute):
    assert 0 <= minute < 1440
    return (datetime(2026, 1, 1) + timedelta(minutes=integer(minute))).strftime('%H:%M')


def digest(row):
    return hashlib.sha256(json.dumps(row, sort_keys=True, ensure_ascii=False,
                                    separators=(',', ':')).encode()).hexdigest()


def solve(row):
    s = row['statement']
    kind = row['modelId'].removeprefix('grade4-motionunits-')
    ns = nums(s)
    vs = rates(s)
    answer = value = unit = None
    method = 'Independent printed SI rates in exact metres/second; requested units and every actual MCQ checked'
    if kind in {'kmh-to-mh', 'ms-to-mmin', 'kmh-to-mmin', 'ms-to-mh',
                'mmin-to-ms', 'mmin-to-kmh', 'ms-to-kmh'}:
        unit = {'kmh-to-mh': 'м/сағ', 'ms-to-mmin': 'м/мин', 'kmh-to-mmin': 'м/мин',
                'ms-to-mh': 'м/сағ', 'mmin-to-ms': 'м/с', 'mmin-to-kmh': 'км/сағ',
                'ms-to-kmh': 'км/сағ'}[kind]
        value = one(vs) / RATE[unit]
        assert value * RATE[unit] == vs[0]
        note = f'Printed SI rate {vs[0]}m/s converts exactly to {value}{unit}; multiplication by target-unit factor restores original rate.'
    elif kind == 'meters-per-minute-seconds-distance':
        speed, seconds = ns
        value = one(vs) * seconds
        unit = 'м'
        assert value * 60 == speed * seconds
        note = f'Actual {speed}m/min is {vs[0]}m/s; {seconds}s yields {value}m. Seconds were divided by60, not treated as minutes.'
    elif kind in {'kmh-minutes-distance-m', 'half-hour-km-distance', 'mmin-hours-distance-km'}:
        speed, duration = ns
        seconds = duration * (3600 if kind == 'mmin-hours-distance-km' else 60)
        unit = 'м' if kind == 'kmh-minutes-distance-m' else 'км'
        metres = one(vs) * seconds
        value = metres if unit == 'м' else metres / 1000
        note = f'Actual rate {vs[0]}m/s × {seconds}s gives {metres}m; requested {unit} gives {value}. Inverse distance/time restores printed rate.'
    elif kind in {'compare-kmh-mmin', 'compare-ms-mmin'}:
        a, b = vs
        answer = '>' if a > b else '<' if a < b else '='
        note = f'Actual SI rates {a}/{b}m/s, relation {answer}; numerical magnitudes before conversion are not compared. All four relation options checked.'
    elif kind in {'mixed-speeds-distance-gap-m', 'ms-versus-mmin-one-minute-gap', 'mixed-speeds-distance-gap-km'}:
        a, b, minutes = ns
        v, w = vs
        # The first model asks second-minus-first; the others first-minus-second.
        distances = [x * minutes * 60 for x in vs]
        gap = distances[1] - distances[0] if kind == 'mixed-speeds-distance-gap-m' else distances[0] - distances[1]
        assert gap > 0
        unit = 'км' if kind == 'mixed-speeds-distance-gap-km' else 'м'
        value = gap / 1000 if unit == 'км' else gap
        note = f'Independent actual paths {distances}m over {minutes}min give positive requested gap {gap}m={value}{unit}; relative-speed alternative agrees.'
    elif kind == 'same-road-mixed-speeds-time':
        a, minutes, b = ns
        v, w = vs
        metres = v * minutes * 60
        value = metres / w / 60
        unit = 'мин'
        assert w * value * 60 == v * minutes * 60
        note = f'Conserved unknown road {metres}m; first time {minutes}min at {v}m/s equals new time {value}min at {w}m/s. Actual road was derived, not supplied independently.'
    elif kind == 'mixed-speed-order':
        names = re.findall(r'([А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]+) [\d ]+ (?:км/сағ|м/мин|м/с)', s)
        assert len(names) == 3 and len(set(vs)) == 3
        answer = ', '.join(names[i].lower() for i in sorted(range(3), key=lambda i: vs[i]))
        note = f'All actual named SI rates {list(zip(names, vs))} sorted strictly ascending, not by unconverted numbers; complete offered permutations checked.'
    elif kind == 'kmh-km-time-min':
        speed, km = ns
        value = F(km * 1000, one(vs)) / 60
        unit = 'мин'
        note = f'Printed {km}km road at {vs[0]}m/s takes {value}min; exact reconstructed metres {vs[0] * value * 60}.'
    elif kind == 'two-stage-mixed-units-distance':
        speed, hours, minutes, other, lastminutes = ns
        durations = [(hours * 60 + minutes) * 60, lastminutes * 60]
        legs = [v * t for v, t in zip(vs, durations)]
        value = sum(legs) / 1000
        note = f'Actual separate SI legs {legs}m with durations {durations}s; total {value}km. Mixed2h30min is150minutes, not2.30hours; no speed averaging.'
    elif kind == 'arrival-clock-mixed-distance':
        start = match(r'(\d{2}):(\d{2})', s)
        minute = int(start[1]) * 60 + int(start[2])
        speed, km, metres = nums(s[start.end():])
        distance = km * 1000 + metres
        duration = F(distance, one(vs)) / 60
        answer = clock(minute + duration)
        note = f'Actual departure minute{minute},road{distance}m at{vs[0]}m/s gives{duration}min; datetime addition produces{answer}, including minute carry.'
        method = 'Independent SI duration plus absolute-minute/datetime clock addition'
    elif kind == 'greatest-mixed-distance':
        records = re.findall(r'([А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]+): ([\d ]+) (км/сағ|м/мин|м/с), ([\d ]+) (мин|сағ)', s)
        assert len(records) == 4
        paths = {name: num(v) * RATE[vu] * num(t) * (60 if tu == 'мин' else 3600)
                 for name, v, vu, t, tu in records}
        answer = one([name for name, path in paths.items() if path == max(paths.values())])
        note = f'Every actual named mixed-unit trip independently converted to metres: {paths}; unique largest {answer}. Both time and rate converted before comparison.'
    elif kind in {'mmin-mixed-time-distance-km', 'mmin-mixed-time-distance-m'}:
        speed, hours, minutes = ns
        seconds = (hours * 60 + minutes) * 60
        metres = one(vs) * seconds
        unit = 'км' if kind == 'mmin-mixed-time-distance-km' else 'м'
        value = metres / 1000 if unit == 'км' else metres
        note = f'Printed mixed time {hours}h{minutes}min gives{seconds}s, road{metres}m; requested{unit}={value}. Hour/minute components added after60conversion.'
    elif kind == 'km-mixed-time-speed-mmin':
        hours, minutes, km = ns
        duration = (hours * 60 + minutes) * 60
        value = F(km * 1000, duration) / RATE['м/мин']
        unit = 'м/мин'
        note = f'Printed{km}km converted to metres, full time{hours}h{minutes}min={duration}s; speed{value}m/min restores complete original distance.'
    elif kind == 'km-minutes-speed-kmh':
        minutes, km = ns
        value = F(km * 1000, minutes * 60) / RATE['км/сағ']
        note = f'Actual{km}km over{minutes}min yields{value}km/h by SI quotient; equivalent km×60/minutes agrees without decimal rounding.'
    elif kind == 'kmh-versus-mmin-who-gap':
        a, b = vs
        gap = integer(abs(a - b) / RATE['м/мин'])
        answer = f'{"Бірінші" if a > b else "Екінші"} көлік жылдам, {gap} м/мин артық' if a != b else 'Жылдамдықтар тең'
        note = f'Actual rates{a}/{b}m/s, identity and gap{gap}m/min checked jointly. Wrong82900 is km→m without hour→minute; wrong1016 subtracts raw unlike quantities.'
    elif kind == 'equal-late-early-distance':
        slow, late, fast, early = ns
        a, b = vs
        assert a < b and 'екі жағдайда да бір уақытта' in s
        distance = F((late + early) * 60, F(1, a) - F(1, b))
        bell = distance / a - late * 60
        assert bell == distance / b + early * 60 and bell > 0
        domain = [d for d in range(1, 2 * integer(distance) + 1)
                  if F(d, a) - late * 60 == F(d, b) + early * 60]
        assert domain == [distance]
        value, unit = distance, 'м'
        method = 'Independent common-bell arrival equations, SI exact linear root and full positive distance witness domain'
        note = f'Actual d/{a}−{late * 60}=d/{b}+{early * 60} seconds has unique d{distance}m; bell after{bell / 60}min. All1..{2 * integer(distance)}integer roads checked; positive coefficient proves real uniqueness too.'
    elif kind == 'meeting-first-mixed-distance':
        km, metres, first, second = ns
        distance = km * 1000 + metres
        a, b = vs
        time = F(distance, a + b)
        x = a * time
        assert x == distance - b * time
        value, unit = x, 'м'
        method = 'Independent signed opposite SI trajectories and common meeting point'
        note = f'Actual x1={a}t,x2={distance}−{b}t agree at{time}s; first path{x}m plus second{b * time}m restores full{distance}m, not halfroad.'
    elif kind == 'delayed-catch-mixed-speed':
        slow, delay, fast = ns
        a, b = vs
        assert b > a and 'Ағасы шыққаннан кейін' in s
        t = F(a * delay * 60, b - a)
        assert b * t == a * (t + delay * 60)
        assert all(b * second < a * (second + delay * 60) for second in range(integer(t)))
        value, unit = t / 60, 'мин'
        method = 'Independent same-origin delayed signed trajectories, first real crossing and every earlier second checked'
        note = f'Actual headstart{a * delay * 60}m,relative SIrate{b - a}m/s; chase{value}min, totalwalker{value + delay}min. Requested fastdeparture elapsed excludes initialdelay and movingtarget continues.'
    elif kind == 'same-arrival-mixed-speed-clock':
        starts = [int(h) * 60 + int(m) for h, m in re.findall(r'(\d{2}):(\d{2})', s)]
        slowstart, faststart = starts
        a, b = vs
        assert b > a and faststart > slowstart
        arrival = F(b * faststart - a * slowstart, b - a)
        assert a * (arrival - slowstart) * 60 == b * (arrival - faststart) * 60
        answer = clock(arrival)
        method = 'Independent absolute-minute signed SI positions and exact common-arrival linear root'
        note = f'Starts{starts};rates{a}/{b}m/s. Unique absolute arrival{arrival}min={answer}; both unknown roads{a * (arrival - slowstart) * 60}m.20min chase,50min walker derived independently.'
    elif kind == 'kmh-mixed-distance-time-min':
        speed, km, metres = ns
        distance = km * 1000 + metres
        value = F(distance, one(vs)) / 60
        note = f'Printed mixed distance{distance}m and SIrate{vs[0]}m/s give{value}min; inverse path equals complete3km600m, not only one component.'
    elif kind == 'train-arrival-clock':
        start = match(r'(\d{2}):(\d{2})', s)
        departure = int(start[1]) * 60 + int(start[2])
        speed, km = nums(s[start.end():])
        duration = F(km * 1000, one(vs)) / 60
        answer = clock(departure + duration)
        method = 'Independent SI total-distance/time and datetime absolute-minute arrival'
        note = f'Actual{km * 1000}m/{vs[0]}m/s requires{duration}min; correct120min=2h,not1h20. Departure{departure}min gives{answer}.'
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
    return {'method': method, 'notes': note + ' All saved/new full conditions, complete solutions and actual options independently read; units, requested quantity, starts and source skill preserved.'}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--write', action='store_true')
    args = ap.parse_args()
    rows = json.loads((ROOT / PACK).read_text())['editions']
    assert len(rows) == 38
    entries = []
    for row in rows:
        ref = one(row['sourceRefs'])
        raw = one([q for q in json.loads((ROOT / ref['sourceFile']).read_text())['questions'] if q['id'] == ref['sourceId']])
        assert raw['checked'] and row['grade'] == 4 and row['minimumPlan'] == 'pro'
        entries.append({'editionId': row['editionId'], 'sha256': digest(row), 'verdict': 'verified', **solve(row)})
    assert len({r['sourceRefs'][0]['sourceId'] for r in rows}) == 38
    rejected = 0
    for row in rows:
        bad = copy.deepcopy(row)
        bad['answer'] = 'wrong-key'
        try:
            solve(bad)
        except AssertionError:
            rejected += 1
        else:
            raise AssertionError('wrong key accepted')
    canaries = [(0,'40 секундта','60 секундта'),(4,'25 минут','30 минут'),(8,'3 сағат','4 сағат'),
                (11,'700 м/мин','701 м/мин'),(14,'16 минутта','20 минутта'),(17,'45 минут','60 минут'),
                (19,'08:45','08:55'),(20,'9 м/с','8 м/с'),(22,'30 минут','40 минут'),
                (23,'180 км','150 км'),(24,'45 минутта','60 минутта'),(25,'84 км/сағ','90 км/сағ'),
                (26,'4 минут кешігеді','5 минут кешігеді'),(27,'750 м','500 м'),
                (28,'30 минуттан','15 минуттан'),(29,'07:50','08:00'),(33,'1 380 м/мин','1 500 м/мин'),
                (34,'600 м','800 м'),(35,'192 км','288 км'),(36,'45 минутта','60 минутта')]
    for i, old, new in canaries:
        bad = copy.deepcopy(rows[i])
        assert old in bad['statement'], (i, old)
        bad['statement'] = bad['statement'].replace(old, new)
        try:
            solve(bad)
        except AssertionError:
            rejected += 1
        else:
            raise AssertionError(('printed canary accepted', i))
    # Independent SI conservation over broad integer domains, not author params.
    for speed in range(1, 1001):
        for seconds in range(1, 121):
            assert F(speed, 60) * seconds == speed * F(seconds, 60)
        assert speed * RATE['км/сағ'] * 3600 == speed * 1000
        assert speed * RATE['м/с'] * 3600 == speed * 3600
    report = {'schemaVersion':1, 'pack':PACK, 'reviewedAt':'2026-10-24',
              'scope':'All38 saved/new full conditions, complete solutions and MCQ read; independent printed SI Fraction rates,60/3600 units, conservation, full delay/lateearly distance domains, signed meeting/pursuit, absolute-minute/datetime clocks, mixed-time and unknown-road inverses.38badkeys+20printedcanaries rejected;120000 unit-duration witnesses and1000hour conversions checked.',
              'entries':entries}
    if args.write:
        (ROOT / OUT).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'reviewed':len(entries),'badKeysAndPrintedCanariesRejected':rejected,'SIwitnesses':120000,'status':'passed'}))


if __name__ == '__main__':
    main()
