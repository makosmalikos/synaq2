#!/usr/bin/env python3
"""Dedupe bilQ, fix split sub-answers, refresh Kuznetsova from PDF key."""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

PROJ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJ / 'scripts'))
from fill_all_bil_answers import (  # noqa: E402
    kuz_key,
    load_bilq,
    parse_answer_key,
    save_bilq,
    try_compute,
)

DATA = PROJ / 'frontend/src/data.js'


def parse_multi_answer(ans):
    if not ans or str(ans).strip() in ('—', '-'):
        return {}
    s = str(ans).strip().rstrip('.')

    def _split(pattern):
        markers = list(re.finditer(pattern, s))
        if not markers:
            return None
        parts = {}
        first_num = int(markers[0].group(1))
        before = s[: markers[0].start()].strip().rstrip(';')
        if before:
            parts[str(first_num - 1)] = before
        for i, m in enumerate(markers):
            num = m.group(1)
            start = m.end()
            end = markers[i + 1].start() if i + 1 < len(markers) else len(s)
            parts[num] = s[start:end].strip().rstrip(';')
        return parts

    return (
        _split(r';\s*(\d+)\)\s+')
        or _split(r';\s*(\d+)\)\s*')
        or {'1': s}
    )


def extract_sub_num(statement):
    if not statement:
        return None
    nums = re.findall(r'(?:^|\n)\s*(\d+)\)', statement)
    return nums[-1] if nums else None


def compute_one_percent(statement):
    if not statement or ('1 %' not in statement and '1%' not in statement):
        return None
    m = re.search(r'(\d+)\)\s*([\d,]+)\s*[.;]?\s*$', statement.strip(), re.M)
    if not m:
        return None
    val = float(m.group(2).replace(',', '.'))
    pct = val / 100
    t = f'{pct:.10f}'.rstrip('0').rstrip('.')
    return t.replace('.', ',')


def score_entry(q):
    s = q.get('statement', '') or ''
    sc = len(s)
    if re.search(
        r'(найд|вычисл|определ|реши|укаж|сколько|сравн|постро|запиш|график|'
        r'координат|прочит|перевед|состав|обрат|представ)',
        s,
        re.I,
    ):
        sc += 500
    if re.match(r'^\s*\d+\)\s*[\d,\.]+\s*[;.]?\s*$', s.strip()):
        sc -= 1000
    if re.match(r'^\s*\d+\)\s*[\d\s;,]+', s.strip()) and not re.search(
        r'(найд|вычис|запиш|обрат|представ|сравн|определ)', s, re.I
    ):
        sc -= 300
    return sc


def fix_statement(stmt, sub):
    if not stmt or not sub:
        return stmt
    lines = [ln.strip() for ln in stmt.split('\n') if ln.strip()]
    header, sub_lines = [], []
    for ln in lines:
        if re.match(r'^\d+\)', ln):
            sub_lines.append(ln)
        elif not sub_lines:
            header.append(ln)
    target = next((ln for ln in sub_lines if ln.startswith(f'{sub})')), None)
    if target and header:
        return '\n'.join(header + ['', target])
    return stmt


def normalize_spaces(s):
    if not s:
        return s
    s = s.replace('\r\n', '\n')
    s = re.sub(r'[ \t]+\n', '\n', s)
    s = re.sub(r'\n{3,}', '\n\n', s)
    s = re.sub(r' +', ' ', s)
    return s.strip()


def pick_sub_answer(full, sub):
    parts = parse_multi_answer(full)
    if sub and sub in parts:
        return parts[sub].strip()
    if len(parts) == 1 and '1' in parts:
        return parts['1'].strip()
    return full


def resolve_kuz_answer(ch, num, sub, key):
    direct = key.get((ch, num, sub))
    if direct:
        return pick_sub_answer(direct, sub)
    for (c, n, _s), val in key.items():
        if c == ch and n == num:
            parts = parse_multi_answer(val)
            if sub in parts:
                return parts[sub].strip()
    return None


def main():
    key = parse_answer_key()
    items, data, start, end = load_bilq()

    by_id = defaultdict(list)
    first_idx = {}
    for i, q in enumerate(items):
        by_id[q['id']].append(q)
        if q['id'] not in first_idx:
            first_idx[q['id']] = i

    deduped = []
    for entries in by_id.values():
        deduped.append(max(entries, key=score_entry))
    deduped.sort(key=lambda q: first_idx[q['id']])

    from_key = split = stmt_fix = computed = 0
    for q in deduped:
        q['statement'] = normalize_spaces(q.get('statement', ''))
        sub = extract_sub_num(q['statement'])
        ns = fix_statement(q['statement'], sub)
        if ns != q['statement']:
            q['statement'] = normalize_spaces(ns)
            stmt_fix += 1
            sub = extract_sub_num(q['statement'])

        kk = kuz_key(q.get('id', ''))
        pct = compute_one_percent(q.get('statement', ''))
        if pct:
            if q.get('answer') != pct:
                q['answer'] = pct
                computed += 1
            continue

        if kk:
            ch, num, sub_key = kk
            ans = resolve_kuz_answer(ch, num, sub_key, key)
            if ans:
                if q.get('answer') != ans:
                    q['answer'] = ans
                    from_key += 1
                continue

        ans = q.get('answer', '')
        if ans and re.search(r';\s*\d+\)', str(ans)):
            picked = pick_sub_answer(ans, sub)
            if picked != ans:
                q['answer'] = picked
                split += 1
                continue

        if str(q.get('answer', '')).strip() in ('', '0', '—'):
            comp = try_compute(q)
            if comp:
                q['answer'] = comp
                computed += 1

    save_bilq(deduped, data, start, end)

    rem = sum(
        1
        for q in deduped
        if q.get('answer') and re.search(r';\s*\d+\)', str(q['answer']))
    )
    print(f'bilQ: {len(deduped)} (removed {len(items) - len(deduped)} dupes)')
    print(f'from PDF key: {from_key}, split: {split}, stmt: {stmt_fix}, computed: {computed}')
    print(f'remaining multi-part answers: {rem}')


if __name__ == '__main__':
    main()
