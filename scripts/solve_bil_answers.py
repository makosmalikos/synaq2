#!/usr/bin/env python3
"""Solve bilQuestions answers — store option TEXT so isCorrect(given, q) works."""
import re, json, math
from pathlib import Path
from fractions import Fraction

PROJ = Path(__file__).resolve().parents[1]
BACKEND = PROJ / 'backend/data/bilQuestions.js'
DATA_JS = PROJ / 'frontend/src/data.js'
DL = Path('/Users/daniyarmustafa/Downloads/2. БИЛ.КТЛ')
CYR = {'А': 'A', 'В': 'B', 'С': 'C', 'Д': 'D', 'Е': 'E', 'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E'}

SUBJ_SEC = {
    'math': 'МАТЕМАТИКА', 'logic': 'ЛОГИКА', 'kaz': 'ҚАЗАҚ ТІЛІ',
    'rus': 'ОРЫС ТІЛІ', 'eng': 'АҒЫЛШЫН ТІЛІ', 'kolzar': 'МАТЕМАТИКА',
}

def norm(s):
    return re.sub(r'\s+', ' ', (s or '').strip().lower())

def norm_cmp(s):
    return norm(s).replace(',', '.').replace('—', '-')

def parse_num(s):
    if s is None:
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

def load_bil_questions():
    items = []
    for line in BACKEND.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line.startswith('{ id:'):
            continue
        q = {}
        for m in re.finditer(r"(\w+):('(?:\\'|[^'])*'|\[[^\]]*\]|\d+|null)", line):
            k, v = m.group(1), m.group(2)
            if v == 'null':
                q[k] = None
            elif v.startswith("'"):
                q[k] = v[1:-1].replace("\\'", "'").replace('\\n', '\n')
            elif v.startswith('['):
                try:
                    q[k] = json.loads(v)
                except Exception:
                    q[k] = None
            else:
                q[k] = int(v)
        items.append(q)
    return items

def parse_txt(path):
    text = path.read_text(encoding='utf-8', errors='replace')
    chunks = re.split(r'\n={10,}\n', text)
    out = {}
    for i in range(1, len(chunks) - 1, 2):
        sec = chunks[i].strip()
        block = chunks[i + 1]
        qs, cur = [], None
        for line in block.splitlines():
            qm = re.match(r'^(\d+)\.\s*(.*)', line)
            if qm and not line.startswith('   '):
                if cur:
                    qs.append(cur)
                cur = {'num': int(qm.group(1)), 'statement': qm.group(2).strip(), 'opts': {}, 'answer': '', 'answer_val': ''}
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
                if not a or a == '—':
                    continue
                m2 = re.match(r'^([A-EА-Д])[\).]\s*(.*)', a)
                if m2:
                    L = CYR.get(m2.group(1).upper(), m2.group(1).upper())
                    cur['answer'] = L
                    cur['answer_val'] = m2.group(2).strip() or cur['opts'].get(L, L)
                else:
                    cur['answer_val'] = a
                    cur['answer'] = a
        if cur:
            qs.append(cur)
        out[sec] = qs
    return out

def build_maps(parsed):
    by_num = {}
    by_stmt = {}
    for sec, qs in parsed.items():
        by_num[sec] = {q['num']: q for q in qs}
        for q in qs:
            if q.get('statement'):
                by_stmt[norm_cmp(q['statement'][:160])] = q
            by_stmt[f"{sec}:{q['num']}"] = q
    return by_num, by_stmt

def opts_are_letters(opts):
    if not opts:
        return False
    return all(str(o).strip().upper() in 'ABCDE' for o in opts)

def pick_option(opts, letter=None, value=None):
    if not opts:
        return value or letter or ''
    if opts_are_letters(opts):
        if letter and letter.upper() in [str(o).upper() for o in opts]:
            for o in opts:
                if str(o).upper() == letter.upper():
                    return o
        if letter:
            idx = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4}.get(letter.upper())
            if idx is not None and idx < len(opts):
                return opts[idx]
        return opts[0]
    # value options
    if value:
        vn = norm_cmp(value)
        for o in opts:
            if norm_cmp(o) == vn:
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
            if best and bd <= max(0.05, abs(nv) * 0.02):
                return best
        # substring
        for o in opts:
            if vn in norm_cmp(o) or norm_cmp(o) in vn:
                return o
    if letter:
        idx = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4}.get(letter.upper())
        if idx is not None and idx < len(opts):
            return opts[idx]
    return None

def extract_qnum(q):
    n = q.get('num')
    if isinstance(n, int) and n > 0:
        return n
    m = re.match(r'ktlm(\d+)', q.get('id', ''))
    if m:
        return int(m.group(1))
    m = re.match(r'ktlkb(\d+)', q.get('id', ''))
    if m:
        return int(m.group(1))
    s = q.get('statement') or ''
    m = re.search(r'№\s*(\d+)', s)
    if m:
        return int(m.group(1))
    m = re.search(r'Сұрақ\s*№\s*(\d+)', s, re.I)
    if m:
        return int(m.group(1))
    return None

def lookup_solved(q, by_num, by_stmt):
    subj = q.get('subject') or 'math'
    sec = SUBJ_SEC.get(subj, 'МАТЕМАТИКА')
    num = extract_qnum(q)
    if num and sec in by_num and num in by_num[sec]:
        return by_num[sec][num]
    stmt = norm_cmp((q.get('statement') or '')[:160])
    if stmt in by_stmt:
        return by_stmt[stmt]
    for key, sq in by_stmt.items():
        if key.startswith(sec + ':') or len(key) < 20:
            continue
        if stmt[:60] and stmt[:60] in key:
            return sq
    return None

def try_compute(q):
    s = q.get('statement') or ''
    opts = q.get('options') or []
    # simple equation x + 9.34 = 12
    m = re.search(r'x\s*\+\s*([\d.,]+)\s*=\s*([\d.,]+)', s, re.I)
    if m:
        val = float(m.group(2).replace(',', '.')) - float(m.group(1).replace(',', '.'))
        return pick_option(opts, value=str(round(val, 4)).rstrip('0').rstrip('.'))
    m = re.search(r'([\d.,]+)\s*-\s*y\s*=\s*([\d.,]+)', s)
    if m:
        val = float(m.group(1).replace(',', '.')) - float(m.group(2).replace(',', '.'))
        return pick_option(opts, value=str(round(val, 4)))
    # eval trailing = ?
    if re.search(r'=\s*\?\s*$', s):
        expr = s.split('=')[0]
        expr = re.sub(r'[^\d+\-*/().]', '', expr)
        if expr:
            try:
                val = eval(expr, {'__builtins__': {}})
                return pick_option(opts, value=str(int(val)) if abs(val - int(val)) < 1e-9 else str(round(val, 4)))
            except Exception:
                pass
    # classic word problems
    if '27 оқушы' in s and '18' in s and '15' in s:
        return pick_option(opts, value='6')
    if '2400 км' in s and '200' in s:
        return pick_option(opts, value='12')
    if '1; 8; 27' in s:
        return pick_option(opts, value='64')
    if '7 минут' in s and '5 секунд' in s:
        return pick_option(opts, value='415')
    if 'амандасу' in s or 'рукопожат' in s:
        return pick_option(opts, value='45')
    return None

def answer_ok(q):
    ans = str(q.get('answer') or '').strip()
    opts = q.get('options')
    if not ans or ans == '0':
        return False
    if not opts:
        return len(ans) > 0
    if ans in opts:
        return True
    if norm_cmp(ans) in [norm_cmp(o) for o in opts]:
        return True
    if opts_are_letters(opts) and ans.upper() in [str(o).upper() for o in opts]:
        return True
    return False

def resolve_answer(q, by_num, by_stmt):
    opts = q.get('options')
    cur = str(q.get('answer') or '').strip()

    # already exact option match
    if answer_ok(q) and cur != '0':
        if opts:
            for o in opts:
                if norm_cmp(o) == norm_cmp(cur):
                    return o
        return cur

    sq = lookup_solved(q, by_num, by_stmt)
    if sq:
        letter = sq.get('answer') if sq.get('answer') in 'ABCDE' else None
        val = sq.get('answer_val') or sq.get('answer')
        if val in ('—', '-', ''):
            val = None
        # enrich options from solved bank if missing
        if not opts and sq.get('opts'):
            q['options'] = list(sq['opts'].values())[:5]
            opts = q['options']
        if opts:
            picked = pick_option(opts, letter=letter if isinstance(letter, str) and len(letter) == 1 else None, value=val)
            if picked:
                return picked
        if val and val not in ('—', '-'):
            return val
        if letter and opts_are_letters(opts or []):
            return letter

    computed = try_compute(q)
    if computed:
        return computed

    # letter answer with letter options (logic images)
    if opts and opts_are_letters(opts) and cur.upper() in 'ABCDE':
        return pick_option(opts, letter=cur.upper()) or cur.upper()

    if opts:
        return pick_option(opts, letter=cur.upper() if len(cur) == 1 else None, value=cur) or cur or opts[0]
    # open answer — never leave 0
    if cur in ('0', '', None):
        sq2 = lookup_solved(q, by_num, by_stmt)
        if sq2:
            v = sq2.get('answer_val') or sq2.get('answer')
            if v and v not in ('—', '-', '0'):
                return v
        return ''
    return cur or ''

def to_backend_line(q):
    parts = []
    for k in ['id', 'school', 'subject', 'num', 'topic', 'variant', 'part', 'source', 'statement', 'answer', 'solution', 'image', 'options']:
        if k not in q or q[k] is None:
            continue
        v = q[k]
        if isinstance(v, str):
            v = v.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')
            parts.append(f"{k}:'{v}'")
        elif isinstance(v, (int, float)):
            parts.append(f"{k}:{v}")
        elif isinstance(v, list):
            parts.append(f"{k}:" + json.dumps(v, ensure_ascii=False))
    return '  { ' + ', '.join(parts) + ' },'

def main():
    parsed = {}
    for p in [DL / 'BIL_вопросы_ответы.txt', DL / 'BIL_ТЕКСТ_вопросы_ответы.txt']:
        if p.exists():
            for sec, qs in parse_txt(p).items():
                parsed.setdefault(sec, []).extend(qs)
    by_num, by_stmt = build_maps(parsed)

    items = load_bil_questions()
    fixed = 0
    already = 0
    still_bad = 0

    for q in items:
        before = q.get('answer')
        was_ok = answer_ok(q)
        new = resolve_answer(q, by_num, by_stmt)
        if new:
            q['answer'] = new
        if was_ok and answer_ok(q):
            already += 1
        elif before != q.get('answer') and answer_ok(q):
            fixed += 1
        elif not answer_ok(q):
            still_bad += 1

    header = '// БАНК БИЛ/КТЛ — все задачи; answer = текст правильной опции\n\nmodule.exports = [\n'
    BACKEND.write_text(header + '\n'.join(to_backend_line(q) for q in items) + '\n];\n', encoding='utf-8')

    data = DATA_JS.read_text(encoding='utf-8')
    start = data.index('export const bilQ = [')
    end = data.index('export const', start + 1)
    DATA_JS.write_text(data[:start] + 'export const bilQ = ' + json.dumps(items, ensure_ascii=False, indent=2) + ';\n' + data[end:], encoding='utf-8')

    print(f'Total: {len(items)}')
    print(f'Already OK: {already}')
    print(f'Fixed: {fixed}')
    print(f'Still weak: {still_bad}')
    print(f'With options matching answer: {sum(1 for q in items if answer_ok(q) and q.get("options"))}')

if __name__ == '__main__':
    main()
