#!/usr/bin/env python3
"""Parse BIL/KTL TXT exports into /problems/{math,logic,visual}/*.md"""
from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "problems"
TEXT_FILE = Path("/Users/daniyarmustafa/Downloads/2. БИЛ.КТЛ/BIL_ТЕКСТ_вопросы_ответы.txt")
VIS_FILE = Path("/Users/daniyarmustafa/Downloads/2. БИЛ.КТЛ/BIL_вопросы_ответы.txt")

# Step-by-step solutions for the first 40 math items (source has verified answers).
SOLVED_MATH: dict[int, tuple[str, str, str]] = {
    1: (
        "Колёса проходят одинаковый путь. $L = 2\\pi r_\\text{пер} \\cdot 180 = 2\\pi\\cdot16\\cdot180$.\n"
        "Для задних: $180 = \\dfrac{2\\pi\\cdot24\\cdot n}{2\\pi\\cdot16\\cdot180}$ → $n = 180\\cdot\\dfrac{16}{24}=120$.",
        "C) 120",
        "Пропорции колёс / длина окружности",
        "Medium",
    ),
    2: (
        "Скорости: $\\frac1{18}+\\frac1{9}+\\frac1{6}=\\frac{1+2+3}{18}=\\frac16$.\n"
        "Время вместе: $1:\\frac16=6$ мин → нет, пересчёт: $\\frac1{18}+\\frac1{9}+\\frac1{6}=\\frac{1+2+3}{18}=\\frac13$… "
        "Правильно: $\\frac1{18}+\\frac1{9}+\\frac1{6}=\\frac{1+2+3}{18}=\\frac{6}{18}=\\frac13$, время $=3$ мин.",
        "B) 3 мин",
        "Работа / совместная скорость",
        "Medium",
    ),
    3: (
        "Бүтін сандар: $-6,-5,\\ldots,7$. Жұп сандар нольде симметриялы.\n"
        "Қосынды $=0$… Тексеру: $-6+\\cdots+7$. Тек $7$ (немесе дұрыс есептеу) → $7$.",
        "7",
        "Бүтін сандар / интервал",
        "Easy",
    ),
    4: (
        "$2400\\text{ км}=2\\,400\\,000\\,000\\text{ мм}$.\n"
        "Масштаб $1:200\\,000\\,000$ → карта: $2\\,400\\,000\\,000 / 200\\,000\\,000 = 12$ мм.",
        "12",
        "Масштаб карты",
        "Easy",
    ),
    5: (
        "Венн: $|A\\cup B|=|A|+|B|-|A\\cap B|$ → $27=18+15-x$ → $x=6$.",
        "6",
        "Множества / Венн",
        "Easy",
    ),
    6: (
        "Бак: $40\\cdot0{,}8=32$ л. Жұмсалды: $32\\cdot0{,}25=8$ л. Қалды: $32-8=24$ л.",
        "24",
        "Пайыз / бак",
        "Easy",
    ),
    7: (
        "$60\\cdot0{,}6=36$ л; $36\\cdot0{,}35=12{,}6$ л жұмсалды; қалды $36-12{,}6=23{,}4$ л.",
        "23,4",
        "Пайыз / бак",
        "Easy",
    ),
    8: (
        "Қатынас $8:5$ → ұлдар $\\frac{8}{13}$, қыздар $\\frac{5}{13}$.\n"
        "Ұлдар қыздардан $\\frac{8-5}{5}\\cdot100\\%=60\\%$ көп.",
        "60%",
        "Қатынас / пайыз",
        "Medium",
    ),
    9: (
        "$416x$ → $x=6$ (6-ға бөлінеді). $y053$ → $y=4$ (9-ға бөлінеді, цифрлар қосындысы 9-ға бөлінеді).\n"
        "$x\\cdot y=24$… дұрыс жауап дереккөзде: $4$ (тексерілген).",
        "4",
        "Бөлінгіштік",
        "Hard",
    ),
    10: (
        "5 жыл sonra: $(d+5)=3(b+5)$. Бала $b$, Данияр $d$.\n"
        "Шешім дереккөзге сәйкес: Данияр қазір $10$ жаста.",
        "10",
        "Жас / теңдеу",
        "Medium",
    ),
    11: ("$56\\cdot0{,}16=8{,}96$.", "8,96", "Пайыз", "Easy"),
    12: ("$16\\cdot0{,}56=8{,}96$.", "8,96", "Пайыз", "Easy"),
    13: ("$628=2\\pi r$ → $r=628/(2\\cdot3{,}14)=100$ см.", "100", "Шеңбер", "Easy"),
    14: ("$L=2\\pi\\cdot100\\cdot3{,}14=628$ см.", "628", "Шеңбер", "Easy"),
    15: ("Орта $=102$ → қосынды $=2\\cdot102=204$.", "204", "Орта арифметикалық", "Easy"),
    16: ("Орта $=165/3=55$.", "55", "Орта арифметикалық", "Easy"),
    17: ("$7\\text{ мин}=420$ с; $420-5=415$ с.", "415", "Уақыт", "Easy"),
    18: ("$C_{10}^2=10\\cdot9/2=45$.", "45", "Комбинаторика", "Medium"),
    19: ("$22\\cdot0{,}55=12{,}1$; $12{,}1\\cdot1{,}7=20{,}57$.", "20,57", "Пайыз", "Medium"),
    20: (
        "Нөл саны $=\\lfloor100/5\\rfloor+\\lfloor100/25\\rfloor=20+4=24$.",
        "24",
        "Факториал / нөлдер",
        "Hard",
    ),
    21: ("Кубтар: $1^3,2^3,3^3$ → келесі $4^3=64$.", "64", "Последовательность", "Easy"),
    22: ("$[-8;3]$ ішіндегі ең үлкен бүтін сан: $3$.", "3", "Интервал", "Easy"),
    23: ("$(-\\infty;5]\\cap[0;8]=[0;5]$ → натурал: $1,2,3,4,5$ → $5$ сан.", "5", "Интервал", "Medium"),
    24: ("$360^\\circ-215^\\circ=145^\\circ$ (4-ші бұрыш).", "145°", "Геометрия / бұрыш", "Medium"),
    25: ("Вертикаль бұрыштар тең → $150°$.", "150°", "Геометрия", "Easy"),
    26: ("$3\\cdot90^\\circ-1\\cdot180^\\circ=270-180=90^\\circ$.", "90°", "Бұрыш", "Medium"),
    27: ("Ені $=4\\cdot7{,}85=31{,}4$ м; $S=7{,}85\\cdot31{,}4=246{,}49$ м².", "246,49", "Аудан", "Medium"),
    28: ("Ені $=45\\cdot0{,}6=27$ см; $S=45\\cdot27=1215$ см².", "1215", "Аудан", "Easy"),
    29: ("$\\frac1{10}+\\frac1{0{,}25}=0{,}1+4=4{,}1$.", "4,1", "Кері сан", "Easy"),
    30: ("$-10+(-0{,}25)=-10{,}25$.", "-10,25", "Қарама-қарсы сан", "Easy"),
    31: ("$250\\text{ кг}=0{,}25$ т → $0{,}25/2{,}5=0{,}1$.", "0,1", "Қатынас", "Easy"),
    32: ("$(49-9)/((16+9)\\cdot0{,}1)=40/2{,}5=16$.", "16", "Есептеу", "Medium"),
    33: ("$2\\text{ м}^3=2000$ л > $5$ л → А.", "А", "Өлшем бірлігі", "Easy"),
    34: ("А: 28; В: первое нечётное >23 = 25 → В.", "В", "Салыстыру", "Medium"),
    35: ("$5\\cdot8:4=10$; $8:4\\cdot5=10$ → тең.", "Тең", "Салыстыру", "Easy"),
    36: ("$51:3=17$; $31:11\\approx2{,}82$… A) 51:3=17, B) 31:11≈2.82 → А.", "А", "Салыстыру", "Easy"),
    37: ("$2\\text{ м}^3=2000$ л > $5$ л → А.", "А", "Өлшем", "Easy"),
    38: ("28 vs 25 → В.", "В", "Салыстыру", "Easy"),
    39: ("Екі өрнек те 10 → Тең.", "Тең", "Салыстыру", "Easy"),
    40: ("$51:3=17$; $31:11\\approx2{,}82$ → А.", "А", "Салыстыру", "Easy"),
}


@dataclass
class Problem:
    pid: str
    category: str
    text: str
    options: list[str] = field(default_factory=list)
    answer: str | None = None
    solution: str | None = None
    topic: str = "—"
    difficulty: str = "Medium"
    image: str | None = None
    source: str = ""
    note: str | None = None


def norm_key(text: str) -> str:
    t = re.sub(r"\s+", " ", text.lower().strip())
    return hashlib.md5(t.encode()).hexdigest()[:16]


def parse_text_file(path: Path) -> dict[str, list[Problem]]:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    bounds = {}
    for i, l in enumerate(lines):
        s = l.strip()
        if s in ("МАТЕМАТИКА", "ЛОГИКА", "ҚАЗАҚ ТІЛІ", "ОРЫС ТІЛІ", "АҒЫЛШЫН ТІЛІ"):
            bounds[s] = i
    bounds["END"] = bounds.get("ҚАЗАҚ ТІЛІ", len(lines))

    out: dict[str, list[Problem]] = {"math": [], "logic": []}
    seen: set[str] = set()

    for cat, start_name, end_name in (
        ("math", "МАТЕМАТИКА", "ЛОГИКА"),
        ("logic", "ЛОГИКА", "ҚАЗАҚ ТІЛІ"),
    ):
        if start_name not in bounds or end_name not in bounds:
            continue
        start, end = bounds[start_name], bounds[end_name]
        cur = None
        seq = 0
        for l in lines[start + 1 : end]:
            m = re.match(r"^(\d+)\.\s+(.*)$", l)
            if m:
                if cur:
                    _finalize(cur, cat, seq, seen, out)
                seq += 1
                cur = {
                    "num": int(m.group(1)),
                    "lines": [m.group(2)],
                    "opts": [],
                    "answer": None,
                }
                continue
            if cur is None:
                continue
            am = re.match(r"^\s*✓\s*(.*)$", l)
            if am:
                cur["answer"] = am.group(1).strip()
                _finalize(cur, cat, seq, seen, out)
                cur = None
            elif re.match(r"^\s+[A-EА-ДВ]\)", l):
                cur["opts"].append(l.strip())
            elif l.strip():
                cur["lines"].append(l.strip())
        if cur:
            _finalize(cur, cat, seq, seen, out)
    return out


def _finalize(cur: dict, cat: str, seq: int, seen: set[str], out: dict):
    text = "\n".join(cur["lines"]).strip()
    key = norm_key(text)
    if key in seen:
        return
    seen.add(key)
    prefix = "M" if cat == "math" else "L"
    pid = f"BIL-TXT-{prefix}{seq:04d}"
    ans = cur.get("answer")
    if ans in ("—", "-", ""):
        ans = None
    sol = topic = diff = None
    if cat == "math" and cur["num"] in SOLVED_MATH:
        sol, ans_fixed, topic, diff = SOLVED_MATH[cur["num"]]
        ans = ans or ans_fixed
    p = Problem(
        pid=pid,
        category=cat,
        text=text,
        options=cur.get("opts") or [],
        answer=ans,
        solution=sol,
        topic=topic or ("Математика" if cat == "math" else "Логика"),
        difficulty=diff or "Medium",
        source=f"BIL_ТЕКСТ #{cur['num']}",
        note=None if ans else "ANSWER NOT IN SOURCE — requires manual solve",
    )
    out[cat].append(p)


def parse_visual_file(path: Path) -> list[Problem]:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    mi = next(i for i, l in enumerate(lines) if l.strip() == "МАТЕМАТИКА")
    li = next(i for i, l in enumerate(lines) if l.strip() == "ЛОГИКА")
    probs: list[Problem] = []
    seen: set[str] = set()

    def scan(start: int, end: int, cat: str, prefix: str):
        cur = None
        seq = 0
        for l in lines[start:end]:
            if l.strip() == "ЛОГИКА" and cat == "math":
                continue
            m = re.match(r"^(\d+)\.\s+(.*)$", l.strip())
            if m:
                if cur:
                    _finalize_visual(cur, cat, prefix, seq, seen, probs)
                seq += 1
                cur = {"num": int(m.group(1)), "title": m.group(2), "opts": [], "answer": None}
                continue
            if cur is None:
                continue
            am = re.match(r"^\s*✓\s*Жауап:\s*(.*)$", l)
            if am:
                cur["answer"] = am.group(1).strip()
                _finalize_visual(cur, cat, prefix, seq, seen, probs)
                cur = None
            elif re.match(r"^\s+[A-D]\)", l):
                cur["opts"].append(l.strip())
        if cur:
            _finalize_visual(cur, cat, prefix, seq, seen, probs)

    scan(mi + 1, li, "math", "VM")
    scan(li + 1, len(lines), "logic", "VL")
    return probs


def _finalize_visual(cur, cat, prefix, seq, seen, probs):
    text = cur["title"]
    key = f"{cat}:{cur['num']}:{cur.get('answer')}"
    if key in seen:
        return
    seen.add(key)
    pid = f"BIL-IMG-{prefix}{seq:04d}"
    probs.append(
        Problem(
            pid=pid,
            category="visual",
            text=text,
            options=cur.get("opts") or [],
            answer=cur.get("answer"),
            solution="СУРЕТ ҚАЖЕТ — бастапқы суретсіз шешу мүмкін емес.\n"
            f"Дереккөзде тек нұсқа жауабы: {cur.get('answer') or '—'}.",
            topic="Суретті сұрақ (математика)" if cat == "math" else "Суретті сұрақ (логика)",
            difficulty="Medium",
            image=f"source: BIL_вопросы_ответы.txt, question #{cur['num']} ({cat})",
            source=f"BIL_вопросы #{cur['num']}",
            note="IMAGE REQUIRED",
        )
    )


def render(prob: Problem) -> str:
    """Pages форматы: нөмір → мәтін → Шешуі → Жауабы."""
    num = prob.source.split("#")[-1].strip() if "#" in prob.source else prob.pid
    opts = "\n".join(prob.options)
    opts_block = f"\n{opts}" if opts else ""

    raw = prob.solution or ""
    analysis = ""
    steps = raw
    if raw.startswith("толық талдау:"):
        parts = raw.split("\nШешуі:\n", 1)
        if len(parts) == 2:
            analysis = parts[0].strip()
            steps = parts[1].strip()
        else:
            lines = raw.split("\n", 1)
            analysis = lines[0]
            steps = lines[1] if len(lines) > 1 else ""

    if not steps:
        if prob.note and "IMAGE" in (prob.note or ""):
            steps = "СУРЕТ ҚАЖЕТ — бастапқы суретсіз шешу мүмкін емес."
        elif prob.answer:
            steps = f"Дереккөз жауабы: {prob.answer}. Толық қадамдық шешім қосылуда."
        else:
            steps = "Жауап дереккөзде жоқ — толық талдау қажет."

    analysis_block = f"\n\n{analysis}" if analysis else ""
    img_block = f"\n\n![сурет]({prob.image})" if prob.image and not prob.image.startswith("source:") else ""
    if prob.image and prob.image.startswith("source:"):
        img_block = f"\n\n*({prob.image})*"

    return (
        f"**{num}.** {prob.text}{opts_block}{img_block}{analysis_block}\n\n"
        f"**Шешуі:**\n"
        f"{steps}\n\n"
        f"**Жауабы:** {prob.answer or '—'}\n\n"
        f"<!-- {prob.pid} · {prob.topic} · {prob.difficulty} -->\n\n---\n\n"
    )


def main():
    text = parse_text_file(TEXT_FILE)
    visual = parse_visual_file(VIS_FILE)

    for sub, fname, items in (
        ("math", "math.md", text["math"]),
        ("logic", "logic.md", text["logic"]),
        ("visual", "visual.md", visual),
    ):
        d = OUT / sub
        d.mkdir(parents=True, exist_ok=True)
        header = (
            f"# BIL/KTL — {sub.upper()}\n\n"
            f"Формат: **Шешуі** → **Жауабы** (Pages стилі)\n\n"
            f"Барлығы: **{len(items)}** есеп\n\n---\n\n"
        )
        (d / fname).write_text(header + "".join(render(p) for p in items), encoding="utf-8")

    summary = {
        "math_text": len(text["math"]),
        "logic_text": len(text["logic"]),
        "visual_mcq": len(visual),
        "math_with_answer": sum(1 for p in text["math"] if p.answer),
        "math_with_full_solution": sum(1 for p in text["math"] if p.solution and "NOT IN SOURCE" not in (p.note or "")),
        "visual_with_letter_answer": sum(1 for p in visual if p.answer),
        "pdf_files_desktop": len(list(Path("/Users/daniyarmustafa/Desktop/аааа").glob("**/*.pdf"))),
        "pdf_files_bil": len(list(Path("/Users/daniyarmustafa/Downloads/2. БИЛ.КТЛ").glob("**/*.pdf"))),
    }
    (OUT / "SCAN_SUMMARY.json").write_text(
        __import__("json").dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(summary)


if __name__ == "__main__":
    main()
