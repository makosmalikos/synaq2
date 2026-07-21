#!/usr/bin/env python3
"""Fill all bilQ answers: Kuznetsova from PDF answer key + compute/MCQ for rest."""
import json
import re
from decimal import Decimal, InvalidOperation
from fractions import Fraction
from pathlib import Path

import fitz

PROJ = Path(__file__).resolve().parents[1]
DATA_JS = PROJ / 'frontend/src/data.js'
PDF = Path(
    '/Users/daniyarmustafa/Downloads/'
    'Математика_6кл_Сб_задач_Кузнецова,_Муравьева_и_др_МИНСК;_2010_208с.pdf'
)
DL = Path('/Users/daniyarmustafa/Downloads/2. БИЛ.КТЛ')
CYR = {'А': 'A', 'В': 'B', 'С': 'C', 'Д': 'D', 'Е': 'E'}


def fix_pdf(s: str) -> str:
    return bytes(ord(c) for c in s if ord(c) < 256).decode('cp1251', errors='replace')


def clean_answer(s: str) -> str:
    s = re.sub(r'\n\d{1,3}\s*\n(?:\s*\.\s*\d+\s*\n)?', '\n', s)
    s = re.sub(r'\s*\.\s*\d+\s*$', '', s.strip())
    s = re.sub(r'\n{2,}', '\n', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s.rstrip('.;,')


def parse_answer_key() -> dict:
    doc = fitz.open(PDF)
    text = fix_pdf(''.join(doc[i].get_text() for i in range(173, 205)))
    m0 = re.search(r'\n1\.1\.\s*\n', text)
    if m0:
        text = text[m0.start() + 1 :]
    m1 = re.search(r'\n7\.73\.\s*\n.*', text, re.S)
    if m1:
        text = text[: m1.start()]

    out = {}
    for m in re.finditer(r'^(\d+)\.(\d+)\.\s*\n(.*?)(?=^\d+\.\d+\.\s*\n|\Z)', text, re.S | re.M):
        ch, num, body = int(m.group(1)), int(m.group(2)), m.group(3)
        body = re.sub(r'^(?:На|Например)\s*:\s*', '', body.strip(), flags=re.I)
        # а) б) в) sections — flatten numbered subs inside
        subs = re.findall(r'(?:^|\n)(\d+)\)\s*(.*?)(?=\n\d+\)|\Z)', body, re.S)
        if subs:
            for sub, txt in subs:
                out[(ch, num, sub)] = clean_answer(txt)
            continue
        # letter sections а) ... б) ...
        subs2 = re.findall(r'(?:^|\n)[а-г]\)\s*(.*?)(?=\n[а-г]\)|\Z)', body, re.S)
        if subs2:
            for i, txt in enumerate(subs2, 1):
                inner = re.findall(r'(?:^|\n)(\d+)\)\s*(.*?)(?=\n\d+\)|\Z)', txt, re.S)
                if inner:
                    for sub, t2 in inner:
                        out[(ch, num, sub)] = clean_answer(t2)
                else:
                    out[(ch, num, str(i))] = clean_answer(txt)
            continue
        out[(ch, num, '1')] = clean_answer(body)
    return out


def load_bilq():
    data = DATA_JS.read_text(encoding='utf-8')
    start = data.index('export const bilQ = [')
    end = data.index('export const ktlQ = [')
    chunk = data[start + len('export const bilQ = ') : end].strip().rstrip(';')
    chunk = re.sub(r',(\s*[}\]])', r'\1', chunk)
    return json.loads(chunk), data, start, end


def save_bilq(items, data, start, end):
    new_bil = 'export const bilQ = ' + json.dumps(items, ensure_ascii=False, indent=2) + ';\n\n'
    DATA_JS.write_text(data[:start] + new_bil + data[end:], encoding='utf-8')


def parse_num(s):
    if not s:
        return None
    s = str(s).replace(',', '.').replace('—', '-').replace('−', '-').strip()
    m = re.search(r'-?\d+(?:\.\d+)?(?:/\d+)?', s)
    if not m:
        return None
    t = m.group(0)
    try:
        return float(Fraction(t)) if '/' in t else float(t)
    except Exception:
        return None


def pick_option(opts, letter=None, value=None):
    if not opts:
        return value or letter or ''
    letters = all(str(o).strip().upper() in 'ABCDE' for o in opts)
    if letters:
        if letter:
            idx = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4}.get(letter.upper())
            if idx is not None and idx < len(opts):
                return opts[idx]
        return opts[0]
    if value:
        vn = value.lower().replace(' ', '').replace(',', '.')
        for o in opts:
            if o.lower().replace(' ', '').replace(',', '.') == vn:
                return o
        nv = parse_num(value)
        if nv is not None:
            best, bd = None, 1e18
            for o in opts:
                no = parse_num(o)
                if no is not None:
                    d = abs(no - nv)
                    if d < bd:
                        bd, best = d, o
            if best is not None and bd <= max(0.05, abs(nv) * 0.02):
                return best
    if letter and len(letter) == 1:
        idx = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4}.get(letter.upper())
        if idx is not None and idx < len(opts):
            return opts[idx]
    return value or ''


def ru_expr_to_sympy(s: str) -> str:
    s = s.strip()
    s = s.replace(',', '.').replace('·', '*').replace('×', '*').replace(':', '/')
    s = s.replace('−', '-').replace('—', '-')
    # mixed fractions: 4 5/6, 2 7/12
    def mix(m):
        a, b, c = m.group(1), m.group(2), m.group(3)
        return str(float(a) + float(b) / float(c))
    s = re.sub(r'(\d+(?:\.\d+)?)\s+(\d+)/(\d+)', mix, s)
    s = re.sub(r'(\d)\(', r'\1*(', s)
    s = re.sub(r'(\d)([xy])', r'\1*\2', s)
    s = re.sub(r'\)\(', ')*(', s)
    s = re.sub(r'\s+', '', s)
    return s


def solve_equation_text(s: str):
    s = (s or '').strip()
    if not s or '=' not in s:
        return None
    var = 'x' if re.search(r'\bx\b', s, re.I) else 'y' if re.search(r'\by\b', s, re.I) else 'x'
    try:
        import sympy as sp
        v = sp.Symbol(var)
        left, right = s.split('=', 1)
        left = ru_expr_to_sympy(left)
        right = ru_expr_to_sympy(right)
        if '/' in left and not re.search(r'/\s*\(', left):
            pass
        eq = sp.Eq(sp.sympify(left), sp.sympify(right))
        sol = sp.solve(eq, v)
        if not sol:
            return None
        val = float(sol[0])
        if abs(val - round(val)) < 1e-9:
            return str(int(round(val))).replace('.', ',')
        t = f'{val:.6f}'.rstrip('0').rstrip('.')
        return t.replace('.', ',')
    except Exception:
        return None


def solve_expression_text(s: str):
    s = (s or '').strip()
    if not s or '=' in s:
        return None
    try:
        import sympy as sp
        expr = ru_expr_to_sympy(s)
        val = float(sp.sympify(expr))
        if abs(val - round(val)) < 1e-9:
            return str(int(round(val))).replace('.', ',')
        t = f'{val:.6f}'.rstrip('0').rstrip('.')
        return t.replace('.', ',')
    except Exception:
        return None


def try_compute(q):
    s = q.get('statement') or ''
    opts = q.get('options') or []
    lines = [ln.strip() for ln in s.split('\n') if ln.strip()]
    candidates = []
    for ln in lines:
        if re.search(r'[0-9]', ln) and (('=' in ln) or re.search(r'[+\-*/·×]', ln)):
            candidates.append(re.sub(r'^\d+\)\s*', '', ln))
    if lines:
        candidates.append(lines[-1])
    candidates.append(s)

    for part in candidates:
        part = re.sub(r'^\d+\)\s*', '', part.strip())
        if '=' in part:
            ans = solve_equation_text(part)
            if ans:
                return pick_option(opts, value=ans) or ans
        elif re.search(r'[+\-*/·×]', part):
            ans = solve_expression_text(part)
            if ans:
                return pick_option(opts, value=ans) or ans

    # 1 - decimal fraction (Kuznetsova 1.28)
    m = re.search(r'(\d+)\)\s*([\d,]+)\s*;?\s*$', s)
    if m and 'меньше числа 1' in s:
        val = 1 - float(m.group(2).replace(',', '.'))
        t = f'{val:.10f}'.rstrip('0').rstrip('.').replace('.', ',')
        return t

    if 'Фаренгейт' in s:
        m = re.search(r'(\d+)\s*°?\s*([CcС])', s)
        if m:
            f = float(m.group(1)) * 9 / 5 + 32
            return f'{f:.1f}'.replace('.', ',')
    if 'Цельс' in s and re.search(r'(\d+)\s*°?\s*F', s, re.I):
        m = re.search(r'(\d+)\s*°?\s*F', s, re.I)
        c = (float(m.group(1)) - 32) * 5 / 9
        t = f'{c:.6f}'.rstrip('0').rstrip('.').replace('.', ',')
        return t
    return None


def parse_bil_txt():
    out = {}
    for fname in ['BIL_вопросы_ответы.txt', 'BIL_ТЕКСТ_вопросы_ответы.txt']:
        p = DL / fname
        if not p.exists():
            continue
        text = p.read_text(encoding='utf-8', errors='replace')
        for chunk in re.split(r'\n={10,}\n', text):
            if 'МАТЕМАТИКА' in chunk or 'ЛОГИКА' in chunk:
                pass
        # simplified: store by statement prefix
        cur = None
        for line in p.read_text(encoding='utf-8', errors='replace').splitlines():
            qm = re.match(r'^(\d+)\.\s*(.*)', line)
            if qm and not line.startswith('   '):
                cur = {'num': int(qm.group(1)), 'statement': qm.group(2).strip(), 'opts': {}, 'answer': '', 'val': ''}
                continue
            if not cur:
                continue
            om = re.match(r'^\s*([A-EА-Д])\)\s*(.+)', line)
            if om:
                L = CYR.get(om.group(1).upper(), om.group(1).upper())
                cur['opts'][L] = om.group(2).strip()
                continue
            am = re.match(r'^\s*✓\s*(?:Жауап:\s*)?(.*)', line)
            if am:
                a = am.group(1).strip()
                m2 = re.match(r'^([A-EА-Д])[\).]\s*(.*)', a)
                if m2:
                    L = CYR.get(m2.group(1).upper(), m2.group(1).upper())
                    cur['answer'] = L
                    cur['val'] = m2.group(2).strip() or cur['opts'].get(L, L)
                else:
                    cur['val'] = a
                    cur['answer'] = a
                key = re.sub(r'\s+', ' ', cur['statement'][:120].lower())
                out[key] = cur
                cur = None
    return out


def fmt_num(x: float) -> str:
    if abs(x - round(x)) < 1e-9:
        return str(int(round(x))).replace('.', ',')
    t = f'{x:.6f}'.rstrip('0').rstrip('.')
    return t.replace('.', ',')


def fill_special(q):
    qid = q.get('id', '')
    s = q.get('statement') or ''

    if not s.strip():
        return '—'

    if qid == 'kuz6_7_73_1':
        return 'видит — бу; гулять — му; кошка — ля; ловить — гу; мышка — ту; ночью — ам; пошла — ям'
    if qid in ('kuz6_4_81_1', 'kuz6_4_83_1', 'bkz_29', 'bilp85', 'bilp84'):
        return '—'

    draw = re.search(
        r'Постройте|Начертите|Изобразите|Перенесите рисунок|Проведите в своем классе|Соберите информацию|Докажите',
        s, re.I,
    )
    if draw:
        return '—'

    if qid == 'bilp76':
        return '12; 30'
    if qid == 'bilp82':
        return '300; 250'
    if qid == 'bilp87':
        return '65%; 98%; 85%; 76%'
    if qid == 'bilp86_1':
        return '1/20; 7/100; 1/10; 1/4; 1/2; 3/4; 6/5'
    if qid == 'bilp86_2':
        return '0,09; 0,12; 0,28; 0,35; 0,85; 1; 1,4'
    if qid == 'bilp91_1':
        return '3,5; 8; 10'
    if qid == 'bilp91_2':
        return '4; 21; 30'
    if qid == 'bilp92_1':
        return '210; 154; 30'
    if qid == 'bilp92_2':
        return '45; 90; 24'
    if qid == 'bilp93_1':
        return '7490000'
    if qid == 'bilp93_2':
        return '6500000'

    if qid == 'kuz6_1_158_1':
        return '0,714285714285'
    if qid == 'kuz6_1_166_1':
        return '1/7'
    if qid == 'kuz6_1_166_2':
        return 'а) 3/70; б) 1/350; в) 1/7000'
    if qid == 'kuz6_1_166_3':
        return 'а) 3/10; б) 1/50; в) 1/1001'

    return None


def kuz_key(qid: str):
    m = re.match(r'kuz6_(\d+)_(\d+)_(\d+)', qid)
    if not m:
        return None
    return int(m.group(1)), int(m.group(2)), m.group(3)


def has_answer(q):
    a = str(q.get('answer') or '').strip()
    return bool(a) and a != '0'


def resolve_non_kuz(q, txt_map):
    if has_answer(q):
        opts = q.get('options')
        if opts:
            a = str(q['answer']).strip()
            for o in opts:
                if str(o).strip() == a:
                    return o
            picked = pick_option(opts, letter=a if len(a) == 1 else None, value=a)
            if picked:
                return picked
        return q['answer']

    stmt = re.sub(r'\s+', ' ', (q.get('statement') or '')[:120].lower())
    if stmt in txt_map:
        sq = txt_map[stmt]
        opts = q.get('options') or list(sq.get('opts', {}).values())[:5]
        if not q.get('options') and opts:
            q['options'] = opts
        val = sq.get('val') or sq.get('answer')
        letter = sq.get('answer') if sq.get('answer') in 'ABCDE' else None
        picked = pick_option(opts, letter=letter, value=val)
        if picked:
            return picked
        if val:
            return val

    comp = try_compute(q)
    if comp:
        return comp

    opts = q.get('options') or []
    a = str(q.get('answer') or '').strip()
    if opts and a.upper() in 'ABCDE':
        return pick_option(opts, letter=a.upper())
    return q.get('answer') or ''


def main():
    key = parse_answer_key()
    print(f'Answer key entries: {len(key)}')

    items, data, start, end = load_bilq()
    txt_map = parse_bil_txt()

    filled_kuz = 0
    filled_other = 0
    still_empty = 0

    for q in items:
        if has_answer(q):
            continue
        qid = q.get('id', '')
        kk = kuz_key(qid)
        if kk:
            ch, num, sub = kk
            ans = key.get((ch, num, sub)) or key.get((ch, num, '1'))
            if ans:
                q['answer'] = ans
                filled_kuz += 1
                continue
            comp = try_compute(q)
            if comp:
                q['answer'] = comp
                filled_kuz += 1
                continue
            spec = fill_special(q)
            if spec:
                q['answer'] = spec
                filled_kuz += 1
            else:
                still_empty += 1
            continue

        new = resolve_non_kuz(q, txt_map)
        if not new:
            new = try_compute(q)
        if not new:
            new = fill_special(q)
        if new:
            q['answer'] = new
            filled_other += 1
        else:
            still_empty += 1

    save_bilq(items, data, start, end)

    total = len(items)
    with_ans = sum(1 for q in items if has_answer(q))
    print(f'bilQ total: {total}')
    print(f'Kuz6 filled from key: {filled_kuz}')
    print(f'Other updated: {filled_other}')
    print(f'With answer: {with_ans} ({100*with_ans/total:.1f}%)')
    print(f'Still empty: {still_empty}')


if __name__ == '__main__':
    main()
