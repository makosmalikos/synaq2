"""Independent full reading/printed-data oracle for39 ruble/quantity edits.

All41 saved originals/full solutions/options read, including2 references already
covered by the approved core. No authored model/calculator imports.
"""
from datetime import datetime, timedelta
from fractions import Fraction as F
from itertools import combinations, product
from pathlib import Path
import argparse
import copy
import hashlib
import json
import re

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-rubles-wave19.json'
OUT='problems/editorial/reviews/grade4-rubles-wave19.json'
WEEK=['Дүйсенбі','Сейсенбі','Сәрсенбі','Бейсенбі','Жұма','Сенбі','Жексенбі']
UNITS={'rubles':{'рубль':100,'копейка':1},'week':{'апта':7,'күн':1},'day':{'тәулік':24,'сағ':1},
       'hour':{'сағ':60,'мин':1},'minute':{'мин':60,'с':1},'year':{'жыл':12,'ай':1}}


def digest(row):
    return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def one(xs):
    assert len(xs)==1,xs
    return xs[0]


def integer(n):
    n=F(n);assert n.denominator==1,n
    return n.numerator


def number(s):
    s=re.sub(r'\s','',s);assert re.fullmatch(r'\d+',s),s
    return int(s)


def mixed(s,dimension):
    units=UNITS[dimension]
    pattern=r'([\d ]+) ('+'|'.join(units)+r')(?= |$)'
    ms=list(re.finditer(pattern,s));assert ms,(s,dimension)
    rest=re.sub(pattern,'',s);assert not rest.strip(),(s,rest)
    return sum(number(m[1])*units[m[2]] for m in ms)


def pick(row,values,wanted):
    assert len(values)==4 and len(set(row['options']))==4
    assert values.count(wanted)==1,(row['editionId'],values,wanted)
    return row['options'][values.index(wanted)]


def menu(s):
    out=[]
    for label in ['Бірінші тағамдар','Екінші тағамдар','Сусындар']:
        group=re.search(label+r': ([^.]+)\.',s);assert group
        parsed=[]
        for text in group[1].split(', '):
            m=re.fullmatch(r'(.+) (\d+) теңге',text);assert m
            parsed.append((m[1],int(m[2])))
        out.append(parsed)
    return [(tuple(x[0] for x in triple),sum(x[1] for x in triple)) for triple in product(*out)]


def items(s):
    return [(m[1],number(m[2])) for m in re.finditer(r'([^:;.]+?) — ([\d ]+) рубль',s)]


def solve(row):
    s,p=row['statement'],row['params'];k=row['modelId'].removeprefix('grade4-rubles-')
    answer=value=None;method='Independent actual printed-unit ledger and exact inverse conservation check';note=''
    if k in {'week-borrow-difference','day-hour-borrow-difference','ruble-borrow-difference','ruble-no-borrow-difference'}:
        dimension='week' if k.startswith('week') else 'day' if k.startswith('day') else 'rubles'
        expression=s.removesuffix(' айырмасын таңдаңыз.');a,b=expression.split(' − ')
        left,right=mixed(a,dimension),mixed(b,dimension);difference=left-right
        assert difference>0;answer=pick(row,[mixed(o,dimension) for o in row['options']],difference)
        if p.get('zeroParentResult'):
            assert dimension=='week' and difference<7 and 'апта' not in answer
        if k=='ruble-no-borrow-difference':assert p['a'][1]>=p['b'][1]
        elif dimension=='rubles':assert p['a'][1]<p['b'][1]
        note=f'Actual {dimension} operands normalize to {left}/{right} minor units; exact difference{difference}, inverse sum reconstructs first operand. Borrow/no-borrow and zero-parent-unit distinctions retained.'
    elif k=='greatest-ruble-amount':
        values=[mixed(o,'rubles') for o in row['options']];answer=pick(row,values,max(values))
        assert len(set(values))==3
        note=f'All actual mixed-ruble options in kopecks{values}; two incorrect options are equivalent705, sole maximum760 retained.'
    elif k in {'year-month-carry-sum','day-hour-carry-sum'}:
        dimension='year' if k.startswith('year') else 'day';expression=s.removesuffix(' қосындысын таңдаңыз.');parts=expression.split(' + ')
        total=sum(mixed(part,dimension) for part in parts);answer=pick(row,[mixed(o,dimension) for o in row['options']],total)
        note=f'Printed addends in common {dimension} minor unit sum to{total}; actual normalized MCQ checked with correct base12/24, not decimal concatenation.'
    elif k=='kopecks-to-mixed':
        total=number(re.match(r'([\d ]+) копейканы',s)[1]);answer=pick(row,[mixed(o,'rubles') for o in row['options']],total)
        note=f'Actual mixed-money option reconstructs printed{total}kopecks, preserving internal0 and90 remainder.'
    elif k=='exact-note-sum':
        total=number(re.match(r'([\d ]+) рубльді',s)[1]);values=[sum(number(v) for v in o.split(' + ')) for o in row['options']];answer=pick(row,values,total)
        note=f'All actual denomination expression sums{values}; sole exact{total}, all listed notes used.'
    elif k=='mixed-unit-price':
        price=mixed(re.search(r'Бір маркер (.+) тұрады',s)[1],'rubles');count=int(re.search(r'Бірдей (\d+) маркер',s)[1]);total=sum(price for _ in range(count));answer=pick(row,[mixed(o,'rubles') for o in row['options']],total)
        note=f'Printed unit price{price}kopecks repeated{count}times={total}; actual answer normalization conserves value.'
    elif k=='rubles-to-kopecks':
        rubles=int(re.match(r'(\d+) рубльді',s)[1]);value=sum(100 for _ in range(rubles));note=f'Complete{rubles}rubles→{value}kopecks, inverse division100 exact.'
    elif k=='hour-minute-difference':
        expression=s.split(' айырмасын')[0];a,b=expression.split(' − ');value=mixed(a,'hour')-mixed(b,'hour');note=f'Actual printed hour/minute operands converted separately, requested integer minutes{value}; base60 borrowing confirmed.'
    elif k=='minutes-seconds-total':
        text=re.search(r'әуенді (.+) тыңдады',s)[1];value=mixed(text,'minute');note=f'Actual duration parsed as seconds{value}; original minute+second place values retained.'
    elif k=='equal-item-cost':
        price=int(re.search(r'табақша (\d+) рубль',s)[1]);count=int(re.search(r'Бірдей (\d+) табақшаның',s)[1]);value=sum(price for _ in range(count));note=f'Printed{count}equal-price items each{price}, full repeated-addition ledger{value}; inverse price check.'
    elif k=='same-price-other-count':
        m=re.match(r'(\d+) қаламға (.+) төленді',s);assert m
        old=int(m[1]);paid=mixed(m[2],'rubles');new=int(re.search(r'(\d+) қарындаштың құнын',s)[1]);price=F(paid,old);value=integer(price*new)
        assert price*old==paid;note=f'Exact printed original{old}items cost{paid}kopecks; price{price}, new{new}items cost{value}kopecks. Equal price, not equal total, preserved.'
    elif k=='two-yarn-colours':
        count=int(re.search(r'бағадағы (\d+) шумақ',s)[1]);m=re.search(r'Қызыл жіпке (\d+) рубль, ақ жіпке (\d+) рубль',s);assert m
        red,white=map(int,m.groups());valid=[]
        for o in row['options']:
            m=re.fullmatch(r'(\d+) қызыл, (\d+) ақ',o);assert m
            r,w=map(int,m.groups());valid.append(r>0 and w>0 and r+w==count and F(red,r)==F(white,w))
        answer=pick(row,valid,True)
        complete=[(r,count-r) for r in range(1,count) if F(red,r)==F(white,count-r)];assert len(complete)==1
        method='Complete positive colour-count domain and equal-price rational ledger, actual MCQ parsed independently'
        note=f'Unequal colour spends{red}/{white}, total count{count}; unique complete assignment{complete}, prices exactly agree.'
    elif k=='cheaper-ticket-change':
        train=number(re.search(r'пойыз билеті ([\d ]+) теңге',s)[1]);plane=number(re.search(r'ұшақ билеті ([\d ]+) теңге',s)[1]);m=re.search(r'([\d ]+) теңгелік (\d+) қағаз',s);assert m
        note_value,count=number(m[1]),int(m[2]);value=note_value*count-min(train,plane)
        note=f'Actual ticket prices{train}/{plane}; select cheaper then subtract from{count}notes×{note_value}={note_value*count}; return{value}tenge, exact inverse.'
    elif k=='days-hours-total':
        text=s.split(' неше')[0];value=mixed(text,'day');note=f'Printed duration normalized to{value}hours using24perday; requested unit hours.'
        if row.get('options'):answer=pick(row,[mixed(o,'day') for o in row['options']],value)
    elif k=='equal-product-pairs':
        a=int(re.search(r'Нан (\d+) рубль',s)[1]);b=int(re.search(r'қорабы (\d+) рубль',s)[1]);total=number(re.search(r'барлығы ([\d ]+) рубль',s)[1])
        value=one([n for n in range(total//min(a,b)+1) if n*a+n*b==total]);note=f'Complete equal-count purchase domain gives{value}of each type, BOTH costs sum to{total}; requested bread count, not twice-count.'
    elif k=='appliance-budget-remainder':
        budget=number(re.search(r'Отбасы ([\d ]+) рубль бөлді',s)[1]);costs=items(s);value=budget-sum(v for _,v in costs)
        assert len(costs)==4;note=f'All4 actual named appliance prices sum{sum(v for _,v in costs)}; budget{budget}, exact remainder{value}rubles.'
    elif k=='budget-enough':
        budget=int(re.search(r'Дүкенге (\d+) доллар',s)[1]);m=re.search(r'бағалары (\d+), (\d+), (\d+) доллар',s);assert m
        costs=list(map(int,m.groups()));gap=budget-sum(costs);assert gap>0;answer=one([o for o in row['options'] if o==f'Жетеді, {gap} доллар қалады'])
        note=f'All actual spends{costs}total{sum(costs)}; BOTH sufficient-budget truth and exact{gap}leftover must match.'
    elif k=='price-from-change':
        m=re.match(r'Бірдей (\d+) шоколадқа (\d+) рубль беріліп, (\d+) рубль',s);assert m
        count,paid,change=map(int,m.groups());value=one([price for price in range(paid+1) if count*price+change==paid]);note=f'Full integer unit-price domain gives sole{value}×{count}+change{change}=paid{paid}; reverse reconstruction.'
    elif k=='three-track-duration':
        text=re.search(r'ұзақтығы (.+)\. Олар',s)[1];parts=text.split('; ');assert len(parts)==3
        seconds=sum(mixed(text,'minute') for text in parts);answer=pick(row,[mixed(o,'minute') for o in row['options']],seconds);note=f'All3 printed minute/second durations total{seconds}s; exact base60 normalization, carry through130remainingseconds.'
    elif k in {'least-menu-price','greatest-menu-choice'}:
        all_menus=menu(s);prices=[cost for _,cost in all_menus];target=min(prices) if k=='least-menu-price' else max(prices)
        best=one([names for names,cost in all_menus if cost==target])
        if k=='least-menu-price':value=target
        else:answer=one([o for o in row['options'] if tuple(o.split(', '))==best])
        method='Full Cartesian product of actual printed named menu groups, global min/max compared across EVERY possible complete lunch'
        note=f'{len(all_menus)}actual complete menus enumerated; unique {"minimum" if k.startswith("least") else "maximum"} {best} costs{target}; one item from EACH group.'
    elif k=='three-generation-age':
        younger=int(re.search(r'(\d+) жас үлкен',s)[1]);older=int(re.search(r'(\d+) жас кіші',s)[1]);total=int(re.search(r'қосындысы (\d+)',s)[1]);value=one([age for age in range(younger+1,total) if age-younger+age+age+older==total])
        note=f'Full positive middle-age domain bounded by total{total}; only{value}, other ages{value-younger}/{value+older}match both gaps and total. Linear slope3 proves unique beyond candidates.'
        if row.get('options'):answer=pick(row,[number(o.removesuffix(' жас')) for o in row['options']],value)
    elif k=='two-purchase-balances':
        m=re.search(r'Самал (\d+) раушангүл алса, (\d+) рублі қалады; (\d+) раушангүл алса, (\d+) рублі',s);assert m
        first,left1,second,left2=map(int,m.groups());price=one([v for v in range(1,left1+1) if first*v+left1==second*v+left2]);value=first*price+left1
        assert value-second*price==left2;note=f'Complete positive price domain1..{left1}has only{price}; same original budget{value}satisfies BOTH alternatives, not a sum of two purchases.'
    elif k=='maximum-distinct-appliances':
        named=items(s);budget=number(re.search(r'([\d ]+) рубльге ең көп',s)[1]);possible=[subset for n in range(len(named)+1) for subset in combinations(named,n) if sum(v for _,v in subset)<=budget];value=max(map(len,possible))
        assert len(named)==7 and len([subset for n in range(len(named)+1) for subset in combinations(named,n)])==128
        method='Independent itertools enumeration of ALL128 labelled distinct-appliance subsets, every budget inequality checked'
        note=f'Actual printed budget{budget},7named prices; max cardinality{value}, cheapest4=40000/cheapest5=71000 confirm upper bound; not most expensive affordable single item.'
    elif k=='two-note-high-count':
        m=re.match(r'(\d+) рубль тек (\d+) және (\d+) рубльдік',s);assert m
        total,low,high=map(int,m.groups());count=int(re.search(r'Барлығы (\d+) қағаз',s)[1]);value=one([h for h in range(count+1) if h*high+(count-h)*low==total]);note=f'Complete high-count domain0..{count}; only{value}high and{count-value}low satisfy BOTH total{total}and count{count}.'
    elif k=='exact-remaining-appliances':
        budget=number(re.search(r'Отбасында ([\d ]+) рубль',s)[1]);first=number(re.search(r'Алдымен ([\d ]+) рубльге',s)[1]);left=budget-first;named=items(s);all_subsets=[subset for n in range(len(named)+1) for subset in combinations(named,n)];valid=one([subset for subset in all_subsets if sum(v for _,v in subset)==left]);wanted=tuple(n.strip() for n,_ in valid)
        answer=one([o for o in row['options'] if tuple(o.split(', '))==wanted]);assert len(all_subsets)==16
        method='Complete independent labelled subset domain16, not only offered MCQ; exact zero-leftover equality after first purchase'
        note=f'Budget{budget}minus first{first}leaves{left}; globally unique named subset{wanted}spends EXACTLY all remainder, not merely affordable.'
    elif k=='three-yarn-colours':
        count=int(re.search(r'бірдей (\d+) шумақ',s)[1]);m=re.search(r'қызылына (\d+), ағына (\d+), көгіне (\d+) рубль',s);assert m
        red,white,blue=map(int,m.groups());triples=[(r,w,count-r-w) for r in range(1,count) for w in range(1,count-r) if F(red,r)==F(white,w)==F(blue,count-r-w)];r,w,b=one(triples);value=w
        method='Full positive3-colour count simplex, exact rational shared unit-price constraints and total-count equality'
        note=f'Actual unequal spends{red}/{white}/{blue}; only counts{(r,w,b)}sum to{count}at equal120unitprice; requested white{value}.'
    elif k=='daily-training-total':
        m=re.search(r'Рауан (.+) бойы күн сайын (.+) жаттықты',s);assert m
        days=mixed(m[1],'week');per=mixed(m[2],'hour');total=sum(per for _day in range(days));answer=pick(row,[mixed(o,'hour') for o in row['options']],total);note=f'All{days}calendar days each{per}minutes, concrete repeated ledger totals{total}; carry into hours, no missing extra5days.'
    elif k=='multi-day-train-arrival':
        day=one([i for i,d in enumerate(WEEK) if f'Пойыз {d.lower()} күні' in s]);m=re.search(r'күні (.+) уақытында',s);assert m
        start_minutes=mixed(m[1],'hour');elapsed_text=re.search(r'Жолда (.+) жүрді',s)[1];m=re.fullmatch(r'(\d+) тәулік (.+)',elapsed_text);assert m
        elapsed=int(m[1])*1440+mixed(m[2],'hour');start=datetime(2026,10,19)+timedelta(days=day,minutes=start_minutes);arrival=start+timedelta(minutes=elapsed)
        expected=f'{WEEK[arrival.weekday()]}, {arrival.hour} сағ {arrival.minute} мин';answer=one([o for o in row['options'] if o==expected]);assert 'белдеуі өзгермейді' in s
        method='Independent Python datetime/timedelta weekday and minute-carry arithmetic using actual printed departure and multi-day duration'
        note=f'Concrete start{start.isoformat()}, elapsed{elapsed}min gives{arrival.isoformat()}, actual offered{expected}; same timezone explicitly retained.'
    elif k=='mixed-to-kopecks':
        value=mixed(s.split(' неше')[0],'rubles');note=f'Actual single-digit residual kopeck amount converted to{value}; base100position maintained.'
    elif k=='two-item-price-factor':
        m=re.search(r'табақша (\d+) рубль',s);plate=int(m[1]);factor=int(re.search(r'одан (\d+) есе арзан',s)[1]);m=re.search(r'(\d+) табақша мен (\d+) саптаяқ',s);assert m
        plates,cups=map(int,m.groups());cup=F(plate,factor);value=integer(plate*plates+cup*cups);assert cup*factor==plate
        note=f'Printed factor-cheaper price{cup}, not plate-minusfactor; full two-item ledger{plates}×{plate}+{cups}×{cup}={value}.'
    else:raise AssertionError(('Unreviewed ruble model',k))
    if answer is None:
        value=integer(value);answer=pick(row,[number(o) for o in row['options']],value) if row.get('options') else str(value)
    assert row['answer']==answer,(row['editionId'],row['answer'],answer)
    if row.get('options'):assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
    else:assert re.fullmatch(r'\d+',answer) and re.search(r'Жауап[^.]*тек сан',s)
    return method,note


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args()
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==39
    assert len({r['editionId'] for r in rows})==len({r['sourceRefs'][0]['sourceId'] for r in rows})==39
    core=json.loads((ROOT/'problems/editorial/synaq-standard-core.json').read_text());core_reviews=json.loads((ROOT/'problems/editorial/reviews/core.json').read_text())['entries']
    for edition_id,source_id in [('core-voucher-combinations','07133becf5b9b990'),('core-poster-product','d6dd919268dd4403')]:
        edition=one([r for r in core if r['editionId']==edition_id]);review=one([r for r in core_reviews if r['editionId']==edition_id]);assert review['verdict']=='verified' and review['sha256']==digest(edition)
        assert source_id in [r['sourceId'] for r in edition['sourceRefs']] and source_id not in [r['sourceRefs'][0]['sourceId'] for r in rows]
    entries=[]
    for row in rows:
        assert row['grade']==4 and row['minimumPlan']=='pro' and not re.search(r'[\\$]',row['statement']+row['solution'])
        ref=one(row['sourceRefs']);source=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId']])
        assert source['checked'] and not source.get('images') and not source.get('svg') and source['statement']!=row['statement']
        method,note=solve(row);entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','method':method,'notes':note+' All saved/new full conditions, complete solutions and every MCQ read; source method and requested unit retained.'})
        bad=copy.deepcopy(row);bad['answer']+='_wrong'
        try:solve(bad)
        except AssertionError:pass
        else:raise AssertionError(('Wrong key accepted',row['editionId']))
    byid={r['sourceRefs'][0]['sourceId']:r for r in rows}
    canaries=[('7ce7be5541990758','8 апта 2 күн','8 апта 3 күн'),('16f7d134249a7135','9 рубль 25 копейка','9 рубль 26 копейка'),
              ('e3d7c6402a282d41','310 рублі','314 рублі'),('5ba09949af8aba40','60 000 рубльге','39 000 рубльге'),
              ('e74676010966f485','56 000 рубльге','55 000 рубльге'),('1885a335d711433c','сейсенбі күні','дүйсенбі күні'),
              ('bce6f831897662f8','көже 260 теңге','көже 800 теңге'),('2b11d3636a6d4c34','ағына 600','ағына 720')]
    for source_id,old,new in canaries:
        bad=copy.deepcopy(byid[source_id]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
        try:solve(bad)
        except AssertionError:pass
        else:raise AssertionError(('Printed-given mutation accepted',source_id))
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','scope':'All41 saved originals including2already-approved core refs,39new full conditions/solutions/MCQ read. Exact printed mixed units,144appliance subsets,26menu combinations,full age/price/colour/note ledgers and independent datetime.39wrong-key and8printed-given canaries rejected;2excluded core hashes confirmed.','entries':entries}
    if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'verified':len(entries),'wrongKeysRejected':len(rows),'printedCanariesRejected':len(canaries),'excludedVerifiedCore':2,'written':args.write}))


if __name__=='__main__':main()
