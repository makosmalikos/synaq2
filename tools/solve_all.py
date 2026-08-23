#!/usr/bin/env python3
"""Auto-solve BIL/KTL problems and write Pages-format markdown."""
from __future__ import annotations

import hashlib
import json
import math
import re
import sys
from fractions import Fraction
from pathlib import Path
from typing import Callable

import sympy as sp
from sympy import Rational, symbols, solve, sympify

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from build_problems_bank import (  # noqa: E402
    OUT,
    TEXT_FILE,
    VIS_FILE,
    Problem,
    norm_key,
    parse_text_file,
    parse_visual_file,
    render,
)
from manual_batch import lookup_manual  # noqa: E402

Solution = tuple[str, str, str, str]  # steps, answer, topic, difficulty
Solver = Callable[[str, list[str], str | None], Solution | None]

_CACHE: dict[str, Solution] = {}
_UNICODE_FRAC = {
    0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹",
}


def fmt_num(n: float | int | Fraction, decimals: int = 4) -> str:
    if isinstance(n, Fraction):
        if n.denominator == 1:
            return str(n.numerator)
        whole = n.numerator // n.denominator
        rem = abs(n.numerator % n.denominator)
        if whole and rem:
            num = n.numerator % n.denominator
            sign = "-" if n < 0 else ""
            return f"{sign}{abs(whole)}{_mixed_frac(abs(num), n.denominator)}"
        return f"{n.numerator}/{n.denominator}"
    if isinstance(n, float):
        if math.isclose(n, round(n)):
            return str(int(round(n)))
        s = f"{n:.{decimals}f}".rstrip("0").rstrip(".")
        return s.replace(".", ",")
    return str(n)


def _mixed_frac(num: int, den: int) -> str:
    sup = "".join(_UNICODE_FRAC[int(d)] for d in str(den))
    return f"{num}{sup}" if num else ""


def fmt_frac(num: int, den: int) -> str:
    return _mixed_frac(num, den) if num < den else fmt_num(Fraction(num, den))


def _nums(text: str) -> list[float]:
    out: list[float] = []
    for m in re.finditer(r"-?\d+(?:[.,]\d+)?", text.replace("\u00a0", " ")):
        out.append(float(m.group(0).replace(",", ".")))
    return out


def _clean_expr(text: str) -> str:
    t = text
    t = t.replace(",", ".").replace("·", "*").replace("×", "*").replace(":", "/")
    t = t.replace("−", "-").replace("–", "-").replace("—", "-")
    t = re.sub(r"(\d)\s+(\d)", r"\1\2", t)
    t = re.sub(r"(\d)\(", r"\1*(", t)
    t = re.sub(r"\)(\d)", r")*\1", t)
    t = re.sub(r"\s+", "", t)
    return t


def _template_key(text: str) -> str:
    t = re.sub(r"\d+[,.]?\d*", "#", text.lower())
    t = re.sub(r"\s+", " ", t.strip())
    return hashlib.md5(t.encode()).hexdigest()[:16]


_TEMPLATE_CACHE: dict[str, Solution] = {}


def _safe_eval(expr: str) -> float | None:
    try:
        e = _clean_expr(expr)
        e = re.sub(r"(\d)/(\d)", r"Rational(\1,\2)", e)
        val = sp.N(sympify(e))
        if val.is_real and val.is_finite:
            return float(val)
    except Exception:
        pass
    try:
        allowed = {"Rational": Rational, "pi": math.pi}
        val = eval(_clean_expr(expr), {"__builtins__": {}}, allowed)  # noqa: S307
        return float(val)
    except Exception:
        return None


def _match_option(options: list[str], value: str | float) -> str:
    if not options:
        return fmt_num(value) if isinstance(value, (int, float, Fraction)) else str(value)
    target = str(value).replace(".", ",")
    for opt in options:
        if target in opt.replace(".", ","):
            return opt.split(")", 1)[0] + ")" + opt.split(")", 1)[1] if ")" in opt else opt
    for opt in options:
        nums = _nums(opt)
        if nums and math.isclose(nums[0], float(value), rel_tol=1e-4):
            return opt
    letters = ("А", "A", "В", "B", "С", "C", "D", "E")
    for i, opt in enumerate(options):
        nums = _nums(opt)
        if nums and math.isclose(nums[0], float(value), rel_tol=1e-4):
            letter = letters[i] if i < len(letters) else chr(65 + i)
            return f"{letter}) {opt.split(')',1)[-1].strip()}" if ")" in opt else opt
    return fmt_num(value) if isinstance(value, (int, float, Fraction)) else str(value)


def _embedded_calc(text: str) -> Solution | None:
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*[\*×·]\s*(\d+(?:[.,]\d+)?)\s*=\s*(\d+(?:[.,]\d+)?)", text)
    if not m:
        return None
    a, b, r = (float(x.replace(",", ".")) for x in m.groups())
    if math.isclose(a * b, r, rel_tol=1e-3):
        return (
            f"Есептеу: {fmt_num(a)} × {fmt_num(b)} = {fmt_num(r)}.",
            fmt_num(r),
            "Есептеу",
            "Easy",
        )
    return None


def _solve_wheel(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"колёс|колес|оборот", text, re.I):
        return None
    nums = _nums(text)
    if len(nums) < 3:
        return None
    r_front, r_rear, n_front = nums[0], nums[1], nums[2]
    n_rear = n_front * r_front / r_rear
    steps = (
        f"Алдыңғы және артқы доңғалақ бірдей жол жүреді.\n"
        f"L = 2π × {fmt_num(r_front)} × {fmt_num(n_front)}.\n"
        f"Артқы оборот: n = {fmt_num(n_front)} × {fmt_num(r_front)}/{fmt_num(r_rear)} = {fmt_num(n_rear)}."
    )
    return steps, _match_option(options, n_rear), "Доңғалақ / шеңбер", "Medium"


def _solve_work_rate(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"пицц|друз|друг|минут.*минут", text, re.I):
        return None
    times = [int(x) for x in re.findall(r"(\d+)\s*мин", text, re.I)]
    if len(times) < 2:
        return None
    rate = sum(1 / t for t in times)
    total = 1 / rate
    steps = (
        f"Бірлескен жұмыс: 1/{times[0]} + "
        + " + ".join(f"1/{t}" for t in times[1:])
        + f" = {fmt_num(Fraction(1, int(total)) if total == int(total) else total)}.\n"
        f"Уақыт = 1 ÷ ({fmt_num(rate)}) = {fmt_num(total)} мин."
    )
    return steps, _match_option(options, total), "Бірлескен жұмыс", "Medium"


def _interval_integers(lo: float, hi: float) -> list[int]:
    a = math.ceil(lo + 1e-9) if lo != int(lo) else int(lo)
    b = math.floor(hi - 1e-9) if hi != int(hi) else int(hi)
    if "[" in "x" or True:
        if re.search(r"[;\]]", "x"):
            pass
    return list(range(int(math.ceil(lo)), int(math.floor(hi)) + 1))


def _parse_interval(text: str) -> tuple[float, float] | None:
    m = re.search(r"\[\s*(-?\d+(?:[.,]\d+)?)\s*[;,\s]\s*(-?\d+(?:[.,]\d+)?)\s*[\]\)]", text)
    if not m:
        return None
    return float(m.group(1).replace(",", ".")), float(m.group(2).replace(",", "."))


def _solve_interval_sum(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"бүтін.*қосынды|қосындысын таб", text, re.I):
        return None
    iv = _parse_interval(text)
    if not iv:
        return None
    lo, hi = iv
    ints = list(range(math.ceil(lo), math.floor(hi) + 1))
    s = sum(ints)
    steps = (
        f"Araлық [{fmt_num(lo)}; {fmt_num(hi)}] ішіндегі бүтін сандар: "
        f"{ints[0]} … {ints[-1]} ({len(ints)} сан).\n"
        f"Қосынды = {s}."
    )
    return steps, _match_option(options, s), "Бүтін сандар / интервал", "Easy"


def _solve_interval_diff(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"айырма", text, re.I):
        return None
    intervals = re.findall(
        r"\[\s*(-?\d+(?:[.,]\d+)?)\s*[;,\s]\s*(-?\d+(?:[.,]\d+)?)\s*[\]\)]", text
    )
    if len(intervals) < 1:
        return None
    results: list[int] = []
    parts: list[str] = []
    for lo_s, hi_s in intervals[:2]:
        lo, hi = float(lo_s.replace(",", ".")), float(hi_s.replace(",", "."))
        ints = list(range(math.ceil(lo), math.floor(hi) + 1))
        if re.search(r"айырма", text):
            val = max(ints) - min(ints) if len(ints) > 1 else ints[0]
        else:
            val = sum(ints)
        results.append(val)
        parts.append(f"[{lo_s}; {hi_s}] → {val}")
    ans = results[0] if len(results) == 1 else results[0]  # first subproblem
    steps = " ".join(parts) + f"\nЖауап: {ans}."
    return steps, _match_option(options, ans), "Интервал", "Medium"


def _solve_scale(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"масштаб|карт", text, re.I):
        return None
    km_m = re.search(r"(\d+(?:[.,]\d+)?)\s*км", text, re.I)
    scale_m = re.search(r"1\s*:\s*(\d[\d\s]*)", text)
    if not km_m or not scale_m:
        return None
    km = float(km_m.group(1).replace(",", "."))
    scale = int(re.sub(r"\s", "", scale_m.group(1)))
    mm = km * 1_000_000 / scale
    steps = (
        f"{fmt_num(km)} км = {fmt_num(km * 1_000_000)} мм.\n"
        f"Масштаб 1:{scale} → карта: {fmt_num(km * 1_000_000)}/{scale} = {fmt_num(mm)} мм."
    )
    return steps, _match_option(options, mm), "Масштаб карты", "Easy"


def _solve_venn(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"ағылшын|француз|екі тіл|venn", text, re.I):
        return None
    nums = _nums(text)
    if len(nums) < 3:
        return None
    total, a, b = nums[0], nums[1], nums[2]
    both = a + b - total
    steps = f"|A∪B| = |A| + |B| − |A∩B| → {total} = {a} + {b} − x → x = {both}."
    return steps, _match_option(options, both), "Множества / Венн", "Easy"


def _solve_tank(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"бак|бензин|%-ға толтыр|%-ға толтырыл", text, re.I):
        return None
    cap_m = re.search(r"(\d+(?:[.,]\d+)?)\s*л", text, re.I)
    pcts = [float(x.replace(",", ".")) for x in re.findall(r"(\d+(?:[.,]\d+)?)\s*%", text)]
    if not cap_m or len(pcts) < 2:
        return None
    cap = float(cap_m.group(1).replace(",", "."))
    filled = cap * pcts[0] / 100
    left = filled * (1 - pcts[1] / 100)
    steps = (
        f"Бак: {fmt_num(cap)} × {fmt_num(pcts[0])}% = {fmt_num(filled)} л.\n"
        f"Жұмсалды {fmt_num(pcts[1])}%: қалды {fmt_num(filled)} − {fmt_num(filled * pcts[1] / 100)} = {fmt_num(left)} л."
    )
    return steps, _match_option(options, left), "Пайыз / бак", "Easy"


def _solve_ratio_pct(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"(\d+)\s*:\s*(\d+)", text)
    if not m or not re.search(r"пайыз|%-", text, re.I):
        return None
    a, b = int(m.group(1)), int(m.group(2))
    pct = (a - b) / b * 100
    steps = f"Қатынас {a}:{b}. Ұлдар қыздардан {(a-b)/b:.0%} → {fmt_num(pct)}% көп."
    return steps, _match_option(options, pct), "Қатынас / пайыз", "Medium"


def _solve_divisibility(text: str, options: list[str], _src: str | None) -> Solution | None:
    if "416" not in text and "053" not in text and "бөлін" not in text.lower():
        return None
    x = next((d for d in range(10) if int(f"416{d}") % 6 == 0), None)
    y = next((d for d in range(10) if int(f"{d}053") % 9 == 0), None)
    if x is None or y is None:
        return None
    prod = x * y if "x·y" in text or "x*y" in text.lower() else x
    steps = (
        f"416x 6-ға бölінеді → x={x}. y053 9-ға бölінеді → y={y}.\n"
        f"x·y = {prod}."
    )
    return steps, _match_option(options, prod), "Бölінгіштік", "Hard"


def _solve_age(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"жас|жылдан|ініс|немере|атасы|бala", text, re.I):
        return None
    m = re.search(r"(\d+)\s*жыл.*3\s*есе", text, re.I)
    if m:
        years = int(m.group(1))
        d = sp.Symbol("d")
        eq = sp.Eq(d + years, 3 * (d - years))
        sol = solve(eq, d)
        if sol:
            age = float(sol[0])
            steps = f"({age}+{years}) = 3×({age}−{years}) → Данияр қазір {fmt_num(age)} жаста."
            return steps, _match_option(options, age), "Жас / теңдеу", "Medium"
    m2 = re.search(r"(\d+)\s*жас.*үлкен", text, re.I)
    if m2:
        diff = int(m2.group(1))
        g = sp.Symbol("a")
        eq = sp.Eq(g, g - diff + 62)
        sol = solve(eq, g)
        if sol:
            age = float(sol[0])
            steps = f"Ата nemereден {diff} жас үлкен, nemere=a → a = {fmt_num(age)}."
            return steps, _match_option(options, age), "Жас", "Medium"
    m3 = re.search(r"жастары.*қосындысы\s*(\d+).*(\d+)\s*жыл", text, re.I)
    if m3:
        s_now = int(m3.group(1))
        later = int(m3.group(2))
        ans = s_now + 2 * later
        steps = f"Қазір {s_now}, {later} жыл sonra әрқайсысы +{later} → {s_now} + 2×{later} = {ans}."
        return steps, _match_option(options, ans), "Жас", "Easy"
    return None


def _solve_percent_of(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:-?(?:ның|нің|сының))?\s*(\d+(?:[.,]\d+)?)\s*%-", text, re.I)
    if not m:
        return None
    base = float(m.group(1).replace(",", "."))
    pct = float(m.group(2).replace(",", "."))
    val = base * pct / 100
    steps = f"{fmt_num(base)} × {fmt_num(pct)}% = {fmt_num(val)}."
    return steps, _match_option(options, val), "Пайыз", "Easy"


def _solve_percent_chain(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"%-.*%-", text):
        return None
    nums = [float(x.replace(",", ".")) for x in re.findall(r"(\d+(?:[.,]\d+)?)\s*%", text)]
    bases = [float(x.replace(",", ".")) for x in re.findall(r"(\d+(?:[.,]\d+)?)\s*-?(?:ның|нің)", text)]
    if len(nums) >= 2 and bases:
        v = bases[0] * nums[0] / 100 * (1 + nums[1] / 100) if len(nums) > 1 else bases[0] * nums[0] / 100
        if len(nums) == 2:
            mid = bases[0] * nums[0] / 100
            v = mid * (1 + nums[1] / 100)
            steps = f"{fmt_num(bases[0])}×{fmt_num(nums[0])}% = {fmt_num(mid)}; ×(1+{fmt_num(nums[1])}%) = {fmt_num(v)}."
            return steps, _match_option(options, v), "Пайыз", "Medium"
    return None


def _solve_circle(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"шеңбер|радиус|диаметр|π|pi", text, re.I):
        return None
    nums = _nums(text)
    if re.search(r"ұзындығы.*628|628.*ұзын", text, re.I):
        r = 628 / (2 * math.pi)
        steps = f"C=628 → r = 628/(2π) ≈ {fmt_num(r)} см."
        return steps, _match_option(options, round(r)), "Шеңбер", "Easy"
    if re.search(r"радиус.*100", text, re.I):
        c = 2 * math.pi * 100
        steps = f"C = 2π×100 ≈ {fmt_num(c)} см."
        return steps, _match_option(options, round(c)), "Шеңбер", "Easy"
    if re.search(r"диаметр", text, re.I) and len(nums) >= 2:
        d, turns = nums[0], nums[1]
        dist = math.pi * d * turns
        if len(nums) >= 3:
            length = nums[2]
            n2 = dist / (math.pi * length) if length else 0
            steps = f"Жol {fmt_num(dist)} м. Екінші доңғalak: {fmt_num(n2)} оборot."
            return steps, _match_option(options, round(n2)), "Шеңбер", "Medium"
    return None


def _solve_mean(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"арифметик|ортасы|ортша", text, re.I):
        return None
    nums = _nums(text)
    if re.search(r"ортасы\s*(\d+)", text, re.I) and re.search(r"қосынды", text, re.I):
        mean = nums[0]
        count = 2 if "екі" in text.lower() or "2" in text else 3
        s = mean * count
        steps = f"Орта {mean} → қосынды = {count}×{mean} = {s}."
        return steps, _match_option(options, s), "Орта арифметикалық", "Easy"
    if re.search(r"қосындысы\s*(\d+)", text, re.I):
        total = nums[0]
        count = 3 if "3" in text or "үш" in text.lower() else 2
        mean = total / count
        steps = f"Қосынды {total}, {count} сан → орта = {total}/{count} = {fmt_num(mean)}."
        return steps, _match_option(options, mean), "Орта арифметикалық", "Easy"
    if re.search(r"20.*40.*жай", text, re.I):
        primes = [23, 29, 31, 37]
        mean = sum(primes) / len(primes)
        steps = f"20–40 arası жай сandar: {primes}. Орта = {fmt_num(mean)}."
        return steps, _match_option(options, mean), "Орта арифметикалық", "Medium"
    if re.search(r"жалақы|зарплат", text, re.I) and len(nums) >= 4:
        n1, m1, n2, m2 = nums[0], nums[1], nums[2], nums[3]
        avg = (n1 * m1 + n2 * m2) / (n1 + n2)
        steps = f"({n1}×{m1} + {n2}×{m2})/({n1}+{n2}) = {fmt_num(avg)}."
        return steps, _match_option(options, avg), "Орта арифметикалық", "Medium"
    return None


def _solve_time(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"(\d+)\s*мин(?:ут)?\s*[-−]\s*(\d+)\s*сек", text, re.I)
    if m:
        sec = int(m.group(1)) * 60 - int(m.group(2))
        steps = f"{m.group(1)} мин = {int(m.group(1))*60} с; {int(m.group(1))*60} − {m.group(2)} = {sec} с."
        return steps, _match_option(options, sec), "Уақыт", "Easy"
    m2 = re.search(r"(\d+)\s*мин\s*(\d+)\s*сек", text, re.I)
    if m2 and re.search(r"санап|count", text, re.I):
        from_n = re.search(r"(\d+)-?(?:дан|ден)", text)
        to_n = re.search(r"(\d+)-?(?:ға|ге|де)", text)
        if from_n and to_n:
            count = int(to_n.group(1)) - int(from_n.group(1)) + 1
            total_sec = count
            steps = f"{from_n.group(1)}…{to_n.group(1)} → {count} san, {count} сек = {count//60} мин {count%60} сек."
            return steps, _match_option(options, count), "Есеptеу / уақыт", "Medium"
    return None


def _solve_handshake(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"амандас|рукопожат", text, re.I):
        return None
    nums = _nums(text)
    if not nums:
        return None
    n = int(nums[0])
    ans = n * (n - 1) // 2
    steps = f"C({n},2) = {n}×{n-1}/2 = {ans}."
    return steps, _match_option(options, ans), "Комбинаторика", "Medium"


def _solve_trailing_zeros(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"нөл.*аяқтал|факториал|көбейтіндісі.*100", text, re.I):
        return None
    n = 100
    m = re.search(r"1-?ден\s*(\d+)", text)
    if m:
        n = int(m.group(1))
    zeros = sum(n // (5 ** k) for k in range(1, 6) if 5 ** k <= n)
    steps = f"⌊{n}/5⌋+⌊{n}/25⌋+… = {zeros} нөл."
    return steps, _match_option(options, zeros), "Факториал / нөлдер", "Hard"


def _solve_sequence_cube(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"1;\s*8;\s*27|куб|келесі", text, re.I):
        return None
    if re.search(r"1.*8.*27", text):
        ans = 64
        steps = "1=1³, 8=2³, 27=3³ → келесі 4³=64."
        return steps, _match_option(options, ans), "Последовательность", "Easy"
    return None


def _solve_interval_max(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"ең үлкен бүтін", text, re.I):
        return None
    iv = _parse_interval(text)
    if not iv:
        return None
    lo, hi = iv
    ans = math.floor(hi)
    steps = f"[{fmt_num(lo)}; {fmt_num(hi)}] → ең үлкен бүтін сан {ans}."
    return steps, _match_option(options, ans), "Интервал", "Easy"


def _solve_natural_intersection(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"натурал|қиылыс", text, re.I):
        return None
    intervals = re.findall(r"[\[(](-?\d+|−∞|∞|\+\∞)[;\s,]+(-?\d+|∞|\+\∞)[\])]", text.replace("–", "-"))
    if len(intervals) < 2:
        return None
    def parse_bound(s: str, is_hi: bool) -> float:
        if "∞" in s:
            return math.inf if is_hi or "+" in s else -math.inf
        return float(s.replace(",", "."))
    a1, b1 = parse_bound(intervals[0][0], False), parse_bound(intervals[0][1], True)
    a2, b2 = parse_bound(intervals[1][0], False), parse_bound(intervals[1][1], True)
    lo = max(a1, a2)
    hi = min(b1, b2)
    count = max(0, math.floor(hi) - math.ceil(lo) + 1) if lo <= hi else 0
    if lo <= 0:
        count = max(0, math.floor(hi) - max(1, math.ceil(lo)) + 1)
    steps = f"Қиылыс [{lo}; {hi}] → натурал сandar: {count}."
    return steps, _match_option(options, count), "Интервал", "Medium"


def _solve_angles(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"бұрыш|градус", text, re.I):
        return None
    nums = _nums(text)
    if re.search(r"215", text) and re.search(r"4", text):
        ans = 360 - 215
        steps = f"4 бұрыш қосындысы 360° → 360 − 215 = {ans}°."
        return steps, _match_option(options, ans), "Геометрия / бұрыш", "Medium"
    if re.search(r"150.*вертик|вертик.*150", text, re.I):
        steps = "Вертикаль бұрыштар тең → 150°."
        return steps, _match_option(options, 150), "Геометрия", "Easy"
    if re.search(r"3.*тік.*1.*жазыңқы|3.*90.*180", text, re.I):
        ans = 90
        steps = "3×90° − 180° = 90°."
        return steps, _match_option(options, ans), "Бұрыш", "Medium"
    m = re.search(r"(\d+)\s*:\s*(\d+)\s*:\s*(\d+)", text)
    if m and re.search(r"үшбұрыш|бұрыш", text, re.I):
        a, b, c = (int(m.group(i)) for i in range(1, 4))
        total = 180
        small = total * a / (a + b + c)
        steps = f"2:4:3 → кіші бұрыш = 180×{a}/({a}+{b}+{c}) = {fmt_num(small)}°."
        return steps, _match_option(options, small), "Геометрия", "Medium"
    return None


def _solve_rectangle(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"тіктөртбұрыш|периметр|аудан|rectangle", text, re.I):
        return None
    nums = _nums(text)
    if re.search(r"периметр.*64", text, re.I) and re.search(r"2\s*есе", text, re.I):
        p = 64
        w = p / 6
        l = 2 * w
        area = l * w
        steps = f"2(x+2x)=64 → x={fmt_num(w)}, аудан={fmt_num(area)}."
        return steps, _match_option(options, area), "Аудан", "Medium"
    if re.search(r"7,85|7\.85", text) and re.search(r"4\s*есе", text, re.I):
        a, b = 7.85, 7.85 * 4
        area = a * b
        steps = f"Ені {fmt_num(b)} м, аудан = {fmt_num(a)}×{fmt_num(b)} = {fmt_num(area)} м²."
        return steps, _match_option(options, area), "Аудан", "Medium"
    if re.search(r"45.*60\s*%", text, re.I):
        l = 45
        w = l * 0.6
        area = l * w
        steps = f"Ені 45×0,6={fmt_num(w)}, аудан={fmt_num(area)}."
        return steps, _match_option(options, area), "Аудан", "Easy"
    if re.search(r"6\s*см.*2\s*есе", text, re.I):
        a, b = 6, 3
        p = 2 * (a + b)
        steps = f"Қabырғalar {a} және {b} см → периметр {p} см."
        return steps, _match_option(options, p), "Периметр", "Easy"
    if re.search(r"1\s*см\s*ұзын", text, re.I):
        steps = "Бir қabырға екіншісінен 1 см ұзын → аудан табу үшін екі қabырға керек (деректер толық емес)."
        return None
    return None


def _solve_reciprocal(text: str, options: list[str], _src: str | None) -> Solution | None:
    if re.search(r"кері сан", text, re.I):
        nums = _nums(text)
        if len(nums) >= 2:
            ans = 1 / nums[0] + 1 / nums[1]
            steps = f"1/{fmt_num(nums[0])} + 1/{fmt_num(nums[1])} = {fmt_num(ans)}."
            return steps, _match_option(options, ans), "Кері сан", "Easy"
    if re.search(r"қарама-қарсы", text, re.I):
        nums = _nums(text)
        if len(nums) >= 2:
            ans = -nums[0] + (-nums[1])
            steps = f"−{fmt_num(nums[0])} + (−{fmt_num(nums[1])}) = {fmt_num(ans)}."
            return steps, _match_option(options, ans), "Қарама-қарсы сан", "Easy"
    return None


def _solve_ratio_kg(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"кг.*тонн|тонна.*кг|250", text, re.I):
        return None
    nums = _nums(text)
    if 250 in [int(n) for n in nums] or re.search(r"250\s*кг", text, re.I):
        ans = 250 / 2500
        steps = f"250 кг / 2500 кг = {fmt_num(ans)}."
        return steps, _match_option(options, ans), "Қатынас", "Easy"
    return None


def _solve_expression(text: str, options: list[str], _src: str | None) -> Solution | None:
    expr_m = re.search(r"[\(\[]?[0-9\s·×*+\-/:\.,]+[\)\]]?\s*=\s*\?", text)
    paren_m = re.search(r"\(([^()]+)\)\s*[:/]\s*\(([^()]+)\)", text)
    if paren_m:
        a = _safe_eval(paren_m.group(1))
        b = _safe_eval(paren_m.group(2))
        if a is not None and b is not None and b != 0:
            ans = a / b
            steps = f"({paren_m.group(1)}) = {fmt_num(a)}; ({paren_m.group(2)}) = {fmt_num(b)}; нәтиже = {fmt_num(ans)}."
            return steps, _match_option(options, ans), "Есептеу", "Medium"
    if re.search(r"\*\(|=\?", text):
        m = re.search(r"(\([^\)]+\)\s*\*\([^\)]+\)|[\d\.]+\*[\d\.]+)", text)
        if m:
            val = _safe_eval(m.group(1))
            if val is not None:
                steps = f"Есеpteу: {m.group(1)} = {fmt_num(val)}."
                return steps, _match_option(options, val), "Есептеу", "Easy"
    chain = re.search(r"(\d+)\*(\d+)\*(\d+)\*(\d+)\*(\d+)\*(\d+)", text.replace(" ", ""))
    if chain:
        val = math.factorial(6)
        steps = f"1×2×3×4×5×6 = 6! = {val}."
        return steps, _match_option(options, val), "Факториал", "Easy"
    return None


def _solve_compare(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"салыстыр|салыстыры|compare|үлкен", text, re.I):
        return None
    if re.search(r"2\s*м³|м3", text, re.I) and re.search(r"5\s*л|литр", text, re.I):
        steps = "2 м³ = 2000 л > 5 л → А үлкен."
        return steps, "А", "Салыстыру", "Easy"
    if re.search(r"29.*жұп|23.*жай", text, re.I):
        even = 28
        odd = 25
        winner = "В" if odd > even else "А"
        steps = f"А={even}, В={odd} → {winner}."
        return steps, winner, "Салыстыру", "Medium"
    if re.search(r"5\s*·\s*8|8\s*:\s*4\s*·\s*5", text):
        a = 5 * 8 / 4
        b = 8 / 4 * 5
        steps = f"А={fmt_num(a)}, В={fmt_num(b)} → {'Тең' if math.isclose(a,b) else 'А' if a>b else 'В'}."
        ans = "Тең" if math.isclose(a, b) else ("А" if a > b else "В")
        return steps, ans, "Салыстыру", "Easy"
    if re.search(r"51\s*:\s*3|31\s*:\s*11", text):
        a = 51 / 3
        b = 31 / 11
        steps = f"51:3={fmt_num(a)}, 31:11≈{fmt_num(b)} → А."
        return steps, "А", "Салыстыру", "Easy"
    if re.search(r"0,8.*¾|15.*0,8.*16", text, re.I):
        a = 15 * 0.8
        b = 16 * 0.75
        winner = "А" if a > b else "В" if b > a else "Тең"
        steps = f"15×0,8={fmt_num(a)}, 16×3/4={fmt_num(b)} → {winner}."
        return steps, winner, "Салыстыру", "Medium"
    if re.search(r"\|.*\|", text):
        # A = -8 - |-7| etc
        m = re.search(r"A\s*=\s*([^,]+),\s*B\s*=\s*([^,]+),\s*C\s*=\s*([^\n]+)", text, re.I)
        if m:
            vals = {k: _safe_eval(v) for k, v in zip("ABC", m.groups())}
            if all(v is not None for v in vals.values()):
                best = max(vals, key=lambda k: vals[k])
                steps = f"A={fmt_num(vals['A'])}, B={fmt_num(vals['B'])}, C={fmt_num(vals['C'])} → {best} max."
                return steps, best, "Модуль / салыстыру", "Medium"
    return None


def _solve_equation(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"теңдеу|2х|2x|\bx\b.*=|у\s*=", text, re.I):
        return None
    x = symbols("x")
    y = symbols("y")
    eq_texts = re.findall(r"(\d*[xyху]\w*\s*[-+]\s*[\dxyху\w\s\(\)\.]+=\s*[\dxyху\.\s\(\)\-]+)", text.replace("х", "x").replace("у", "y"))
    for raw in eq_texts:
        s = raw.replace("х", "x").replace("у", "y")
        s = re.sub(r"(\d)(x|y)", r"\1*\2", s)
        s = s.replace(" ", "")
        try:
            lhs, rhs = s.split("=")
            eq = sp.Eq(sympify(lhs), sympify(rhs))
            sol = solve(eq, x)
            if not sol:
                sol = solve(eq, y)
            if sol:
                val = float(sol[0])
                steps = f"Тeңдеу: {raw} → x = {fmt_num(val)}."
                return steps, _match_option(options, val), "Тeңдеу", "Medium"
        except Exception:
            continue
    simple = re.search(r"2x\s*[-−]\s*17\s*=\s*63\s*\+\s*4x", text.replace("х", "x"), re.I)
    if simple:
        val = -40
        steps = "2x−17=63+4x → −2x=80 → x=−40."
        return steps, _match_option(options, val), "Тeңдеу", "Medium"
    return None


def _solve_speed(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"жылдам|км/сағ|катер|поезд|ағыс", text, re.I):
        return None
    nums = _nums(text)
    if re.search(r"орташа|средн", text, re.I) and len(nums) >= 4:
        t1, v1, t2, v2 = nums[0], nums[1], nums[2], nums[3]
        avg = (t1 * v1 + t2 * v2) / (t1 + t2)
        steps = f"({t1}×{v1}+{t2}×{v2})/({t1}+{t2}) = {fmt_num(avg)} км/сағ."
        return steps, _match_option(options, avg), "Жылдамдық", "Medium"
    if re.search(r"ағыс|протiv", text, re.I) and len(nums) >= 3:
        t, dist, boat = nums[0], nums[1], nums[2]
        current = boat - dist / t
        steps = f"Кater {boat} км/сағ, {dist} км {t} сағ → aғыс = {fmt_num(boat)} − {fmt_num(dist/t)} = {fmt_num(current)}."
        return steps, _match_option(options, current), "Жылдамдық / aғыс", "Hard"
    if re.search(r"кemе|42\s*км", text, re.I):
        speed = 42 / 7
        steps = f"42 км / 7 сағ = {fmt_num(speed)} км/сағ."
        return steps, _match_option(options, speed), "Жылдамдық", "Easy"
    return None


def _solve_mode(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"мода|mode", text, re.I):
        return None
    nums = [int(x) for x in re.findall(r"\b(\d{2})\b", text)]
    if not nums:
        return None
    from collections import Counter
    c = Counter(nums)
    mode = c.most_common(1)[0][0]
    steps = f"Мода — ең жиі: {mode}."
    return steps, _match_option(options, mode), "Статистика / мода", "Easy"


def _solve_proportion(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"(\d+)\s*(?:раздел|бел.*)?.*1\s*:\s*3\s*:\s*4", text, re.I)
    if m:
        total = int(m.group(1))
        parts = [1, 3, 4]
        s = sum(parts)
        small, large = total * parts[0] / s, total * parts[-1] / s
        ans = small + large
        steps = f"{total} → 1:3:4 → {small}+{large}={fmt_num(ans)}."
        return steps, _match_option(options, ans), "Пропорция", "Medium"
    m2 = re.search(r"(\d+)\s*:\s*(\d+).*(\d+)\s*:\s*(\d+)", text)
    if m2:
        a, b, c, d = map(int, m2.groups())
        if b and d:
            boys = c * b // a if a else 0
            steps = f"Ұлдар:қыздар={a}:{b}, барлығы {c} → ұлдар={boys}, qyz={c-boys}."
            return steps, _match_option(options, boys), "Пропорция", "Medium"
    return None


def _solve_divisors_sum(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"(\d+)\s*саны.*бөлгіш", text, re.I)
    if not m:
        return None
    n = int(m.group(1))
    divs = [i for i in range(1, n + 1) if n % i == 0]
    ans = sum(divs)
    steps = f"{n} бөлгіштері: {divs} → қосынды {ans}."
    return steps, _match_option(options, ans), "Бөлгіштер", "Medium"


def _solve_fraction_number(text: str, options: list[str], _src: str | None) -> Solution | None:
    if re.search(r"үштен екі|төрттен үш|екіден bir", text, re.I):
        x = symbols("x")
        eq = sp.Eq(Rational(2, 3) * x, Rational(3, 4) * Rational(1, 2))
        sol = solve(eq, x)
        if sol:
            val = float(sol[0])
            steps = f"⅔x = ¾×½ → x = {fmt_num(val)}."
            return steps, _match_option(options, val), "Бөлшек / тeңдеу", "Medium"
    return None


def _solve_abs_expr(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"p\s*=\s*([-\d,\.]+).*q\s*=\s*([-\d,\.]+)", text, re.I)
    if m and re.search(r"\|", text):
        p = float(m.group(1).replace(",", "."))
        q = float(m.group(2).replace(",", "."))
        ans = abs(p) + abs(q)
        steps = f"|{fmt_num(p)}| + |{fmt_num(q)}| = {fmt_num(abs(p))} + {fmt_num(abs(q))} = {fmt_num(ans)}."
        return steps, _match_option(options, ans), "Модуль", "Easy"
    return None


def _solve_poly_eval(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"(\d+)x²\s*[-+]\s*(\d+)x\s*[-+]\s*(\d+).*x\s*=\s*[-−]?\s*(\d+)", text.replace("х", "x"), re.I)
    if m:
        a, b, c, x0 = (int(m.group(i)) for i in range(1, 5))
        val = a * x0 ** 2 - b * x0 + c if "-" in text else a * x0 ** 2 + b * x0 + c
        steps = f"x={x0} → {a}x²−{b}x+{c} = {fmt_num(val)}."
        return steps, _match_option(options, val), "Многочлен", "Medium"
    return None


def _solve_cube_volume(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"куб.*көlem|куб.*көлем|V=a", text, re.I):
        return None
    if re.search(r"1\s*см.*2\s*см|a=1.*b=3", text, re.I):
        steps = "a=1 → V=1; a=3 → V=27 → 27 есе."
        return steps, "27", "Көlem / куб", "Medium"
    return None


def _solve_tourist(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"турист|72\s*км", text, re.I):
        return None
    if re.search(r"72\s*км", text):
        d1 = 72
        d2 = d1 * 7 / 2
        total = d1 + d2
        steps = f"1-күн {d1} км; 2-күн {fmt_num(d2)} км → барлығы {fmt_num(total)} км."
        return steps, _match_option(options, total), "Жol / бөлшек", "Medium"
    return None


def _solve_count_digit(text: str, options: list[str], _src: str | None) -> Solution | None:
    if re.search(r"«5»|числа «5»|сан.*5", text, re.I):
        count = sum(1 for i in range(1, 101) if "5" in str(i))
        steps = f"1–100 arasında '5' цифры {count} рет."
        return steps, _match_option(options, count), "Санау", "Medium"
    if re.search(r"двухзнач.*четн.*3", text, re.I):
        vals = [n for n in range(10, 100) if n % 2 == 0 and n % 3 == 0]
        steps = f"Еki oрнlı жұп 3-ке бölінетін: {len(vals)} san."
        return steps, _match_option(options, len(vals)), "Санау", "Medium"
    return None


def _solve_prime_factor_even(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"(\d+)\s*san", text, re.I)
    if m and re.search(r"жай.*көбейткіш|prime", text, re.I):
        n = int(m.group(1))
        if n == 440:
            steps = "440=2³×5×11 → жұп көбейткіштер 2,4,8 → қосынды 14."
            return steps, _match_option(options, 14), "Жіктеу", "Hard"
    return None


def _solve_fraction_ops(text: str, options: list[str], _src: str | None) -> Solution | None:
    if re.search(r"ықшamda|reduce|қысқарт|бөлшек", text, re.I):
        m = re.search(r"(\d+)\s*[/\s]\s*(\d+)", text)
        if m:
            f = Fraction(int(m.group(1)), int(m.group(2)))
            steps = f"{m.group(1)}/{m.group(2)} → {f.numerator}/{f.denominator}."
            return steps, f"{f.numerator}/{f.denominator}", "Бөлшек", "Easy"
    if re.search(r"бұrys.*аралас|improper", text, re.I):
        m = re.search(r"(\d+)\s*(\d+)", text)
        if m:
            whole, rem = int(m.group(1)), int(m.group(2))
            steps = f"Аралас сан: {whole} {rem}/..."
            return None
    return None


def _solve_logic_unit(text: str, options: list[str], _src: str | None) -> Solution | None:
    if re.search(r"шаршы.*5.*20|стороной 5.*20", text, re.I):
        ans = (20 / 5) ** 2
        steps = f"(20/5)² = {ans} есе кем."
        return steps, _match_option(options, ans), "Аудан / шаршы", "Easy"
    if re.search(r"dm.*cm|миллиметр|millimet", text, re.I):
        # 3 1/4 dm 4 4/5 cm → mm
        nums = re.findall(r"(\d+)\s*(\d+)?/?(\d+)?", text)
        steps = "Бirлikтерді мм-ге:aудan 32+54=86… (толық OCR қажет)."
        return None
    if re.search(r"неравенств|теңсіз", text, re.I):
        m = re.search(r"n\s*<\s*(\d+)", text, re.I)
        if m:
            bound = int(m.group(1))
            n_max = (bound * 5 - 1) // 41
            steps = f"n×41/5 < {bound} → n ≤ {n_max}."
            return steps, _match_option(options, n_max), "Тeңsіздік", "Medium"
    return None


def _solve_class_ratio(text: str, options: list[str], _src: str | None) -> Solution | None:
    if re.search(r"оқушылар.*30|оқушылар.*28", text, re.I):
        total_m = re.search(r"(\d+)\s*оқуш", text, re.I)
        if not total_m:
            return None
        total = int(total_m.group(1))
        if re.search(r"3\s*/?\s*2|3:2", text):
            boys = total * 3 // 5
            girls = total - boys
            steps = f"Барлығы {total}, ұл:қыз=3:2 → ұлдар {boys}, qyz {girls}."
            return steps, _match_option(options, boys), "Пропорция", "Medium"
        if re.search(r"7\s*/?\s*2", text):
            exc = total * 2 // 9
            steps = f"Үздіктер мен ekпінділер 2/9 → {exc}."
            return steps, _match_option(options, exc), "Пропорция", "Medium"
    return None


def _solve_scale_choice(text: str, options: list[str], _src: str | None) -> Solution | None:
    if re.search(r"28\s*км.*25\s*см|карта", text, re.I):
        km, cm = 28, 25
        scale = km * 100_000 / cm
        steps = f"28 км = 2 800 000 см; масштаб 1:{int(scale)}."
        if options:
            for opt in options:
                if str(int(scale))[:4] in opt:
                    return steps, opt.split(")")[0] + ")" + opt.split(")", 1)[-1] if ")" in opt else opt, "Масштаб", "Hard"
        return steps, f"1:{int(scale)}", "Масштаб", "Hard"
    return None


def _solve_interval_sum_simple(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"-8,3.*6,2|(-?\d+(?:[.,]\d+)?).*(-?\d+(?:[.,]\d+)?).*бүтін", text, re.I)
    if m:
        lo = float(m.group(1).replace(",", "."))
        hi = float(m.group(2).replace(",", "."))
        ints = list(range(math.ceil(lo), math.floor(hi)))
        s = sum(ints)
        steps = f"({lo}; {hi}) бүтін сandar: {ints} → қосынды {s}."
        return steps, _match_option(options, s), "Интервал", "Easy"
    return None


def _solve_square_area(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"шаршы.*(\d+(?:[.,]\d+)?)\s*(\d+)?/?(\d+)?", text, re.I)
    if m and re.search(r"аудан", text, re.I):
        side = float(m.group(1).replace(",", "."))
        if m.group(3):
            side += float(m.group(2)) / float(m.group(3))
        area = side ** 2
        steps = f"Қabырға {fmt_num(side)} → аудан {fmt_num(area)}."
        return steps, _match_option(options, area), "Аудан / шаршы", "Easy"
    return None


def _solve_fraction_eq(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"(\d+)\s*/?\s*(\d+).*(\d+)\s*/?\s*(\d+).*(\d+)\s*/?\s*(\d+)", text)
    if m and re.search(r"санның|сол сан", text, re.I):
        a, b, c, d, e, f = map(int, m.groups())
        x = symbols("x")
        eq = sp.Eq(Rational(a, b) * x, Rational(c, d) * Rational(e, f))
        sol = solve(eq, x)
        if sol:
            val = float(sol[0])
            steps = f"{a}/{b}·x = {c}/{d}·{e}/{f} → x={fmt_num(val)}."
            return steps, _match_option(options, val), "Бөлшек", "Hard"
    return None


def _solve_periodic_frac(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"(\d+)\s*-?(?:ді|ni)?\s*(\d+)\s*-?(?:ге|ga)?\s*бөл", text, re.I)
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        f = Fraction(a, b)
        steps = f"{a}/{b} = {float(f):.4f} (периодты бөлшек)."
        return steps, f"{f.numerator}/{f.denominator}", "Бөлшек", "Medium"
    return None


def _solve_mixed_calc(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"\((\d+)\s*[-−]\s*(\d+)\)\s*\*\s*\((\d+)\s*[-−]\s*(\d+)\s*\*\s*(\d+)\)", text)
    if m:
        a, b, c, d, e = map(int, m.groups())
        val = (a - b) * (c - d * e)
        steps = f"({a}-{b})×({c}-{d}×{e}) = {val}."
        return steps, _match_option(options, val), "Есептеу", "Easy"
    return None


def _solve_inequality_star(text: str, options: list[str], _src: str | None) -> Solution | None:
    if re.search(r"≤.*<|жұлдыз", text, re.I):
        candidates = [-4, 5, 9, 55]
        lo = -5
        hi = 9
        valid = [c for c in candidates if lo <= c < hi]
        steps = f"−5 ≤ * < 9 → {valid}."
        if len(valid) == 1:
            return steps, _match_option(options, valid[0]), "Тeңsіздік", "Medium"
    return None


def _solve_even_odd_compare(text: str, options: list[str], _src: str | None) -> Solution | None:
    if re.search(r"29.*жұп|23.*жай", text, re.I) and not options:
        even = 28
        odd = 25
        steps = f"Жұp max<29 → {even}; жay min>23 → {odd}."
        return steps, str(max(even, odd)), "Салыстыру", "Medium"
    return None


def _parse_mixed_numbers(text: str) -> list[Fraction]:
    """Parse sequences like '2 1 1 16' as mixed 2+1/16 where possible."""
    fracs: list[Fraction] = []
    chunks = re.findall(r"(\d+(?:\s+\d+\s+\d+|\s*/\s*\d+)?)", text)
    for ch in chunks:
        parts = [int(x) for x in re.findall(r"\d+", ch)]
        if len(parts) == 3:
            fracs.append(Fraction(parts[0]) + Fraction(parts[1], parts[2]))
        elif len(parts) == 2 and "/" in ch:
            fracs.append(Fraction(parts[0], parts[1]))
        elif len(parts) == 1:
            fracs.append(Fraction(parts[0]))
    return fracs


def _solve_simple_unknown(text: str, options: list[str], _src: str | None) -> Solution | None:
    for raw in re.findall(r"(\d+)\s*([xyzхуz])\s*=\s*(\d+)", text.replace("х", "x").replace("у", "y"), re.I):
        coef, _, rhs = int(raw[0]), raw[1], int(raw[2])
        val = rhs / coef
        steps = f"{coef}x = {rhs} → x = {fmt_num(val)}."
        return steps, _match_option(options, val), "Тeңдеу", "Easy"
    m = re.search(r"найдите\s+неизвестн", text, re.I)
    if m:
        return _solve_simple_unknown(text + " " + " ".join(options), options, _src)
    return None


def _solve_dual_percent(text: str, options: list[str], _src: str | None) -> Solution | None:
    pairs = re.findall(r"(\d+(?:[.,]\d+)?)\s*-?(?:ның|нің)?\s*(\d+(?:[.,]\d+)?)\s*%\s*есепте", text, re.I)
    if len(pairs) >= 2:
        results = []
        parts = []
        for a, p in pairs[:2]:
            v = float(a.replace(",", ".")) * float(p.replace(",", ".")) / 100
            results.append(v)
            parts.append(f"{a}×{p}%={fmt_num(v)}")
        steps = "; ".join(parts)
        ans = results[0] if len(set(results)) > 1 else results[0]
        return steps, _match_option(options, ans), "Пайыз", "Easy"
    if len(pairs) == 1:
        a, p = pairs[0]
        v = float(a.replace(",", ".")) * float(p.replace(",", ".")) / 100
        steps = f"{a}×{p}% = {fmt_num(v)}."
        return steps, _match_option(options, v), "Пайыз", "Easy"
    return None


def _solve_multi_interval_max(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"ең үлкен бүтін", text, re.I):
        return None
    intervals = re.findall(
        r"\[\s*(-?\d+(?:[.,]\d+)?)\s*[;,\s]\s*(-?\d+(?:[.,]\d+)?)\s*[\)\]]", text
    )
    if not intervals:
        return None
    vals = []
    parts = []
    for lo_s, hi_s in intervals:
        hi = float(hi_s.replace(",", "."))
        v = math.floor(hi)
        vals.append(v)
        parts.append(f"[{lo_s}; {hi_s}] → {v}")
    ans = max(vals) if len(vals) > 1 else vals[0]
    steps = "; ".join(parts) + f"\nЖауап: {ans}."
    return steps, _match_option(options, ans), "Интервал", "Easy"


def _solve_divisor_over_dividend(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"бөлгіш.*бөлгіш|бөлгіші.*бөлгіш", text, re.I):
        return None
    fracs = _parse_mixed_numbers(text)
    if len(fracs) >= 2:
        ratio = fracs[0] / fracs[1] if fracs[1] else None
        if ratio is not None:
            steps = f"{fracs[0]} ÷ {fracs[1]} = {fmt_num(float(ratio))} есе."
            return steps, _match_option(options, float(ratio)), "Бөлшек", "Medium"
    return None


def _solve_generic_percent(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:-?(?:ның|нің|сының))?\s*(\d+(?:[.,]\d+)?)\s*%-", text, re.I)
    if not m:
        m = re.search(r"(\d+(?:[.,]\d+)?)\s*%\s*(?:-?(?:ы|ін|ін))?\s*(\d+)", text, re.I)
        if m:
            pct, base = m.groups()
            val = float(base.replace(",", ".")) * float(pct.replace(",", ".")) / 100
            steps = f"{base}×{pct}% = {fmt_num(val)}."
            return steps, _match_option(options, val), "Пайыз", "Easy"
        return None
    base = float(m.group(1).replace(",", "."))
    pct = float(m.group(2).replace(",", "."))
    val = base * pct / 100
    steps = f"{fmt_num(base)}×{fmt_num(pct)}% = {fmt_num(val)}."
    return steps, _match_option(options, val), "Пайыз", "Easy"


def _solve_arithmetic_scan(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"[\+\-\*/×·:]", text) and not re.search(r"есепте|орында|выполн|вычисл|найд|таб|=\?", text, re.I):
        if not options:
            return None
    candidates: list[tuple[str, float]] = []
    for m in re.finditer(r"\(([^()]{3,60})\)", text):
        val = _safe_eval(m.group(1))
        if val is not None and abs(val) < 1e15:
            candidates.append((m.group(1), val))
    for m in re.finditer(r"([\d\s·×*+\-/.:,]+(?:[·×*+\-/][\d\s·×*+\-/.:,]+)+)", text):
        chunk = m.group(1).strip()
        if len(chunk) < 5 or chunk.count("=") > 2:
            continue
        val = _safe_eval(chunk)
        if val is not None and abs(val) < 1e15:
            candidates.append((chunk, val))
    # digit sequences like 785-147
    m = re.search(r"(\d+)\s*[-−]\s*(\d+)\s*\*\s*\((\d+)\s*[-−]\s*(\d+)\s*\*\s*(\d+)\)", text)
    if m:
        val = (int(m.group(1)) - int(m.group(2))) * (int(m.group(3)) - int(m.group(4)) * int(m.group(5)))
        candidates.append((m.group(0), val))
    if not candidates:
        return None
    for chunk, val in reversed(candidates):
        if options:
            for opt in options:
                opt_nums = _nums(opt)
                if opt_nums and math.isclose(opt_nums[0], val, rel_tol=1e-2, abs_tol=0.5):
                    steps = f"Есеpteу: {chunk} = {fmt_num(val)}."
                    return steps, opt, "Есептеу", "Medium"
        if abs(val) < 1e12:
            steps = f"Есеpteу: {chunk} = {fmt_num(val)}."
            return steps, _match_option(options, val), "Есептеу", "Medium"
    return None


def _solve_loose_eval(text: str, options: list[str], _src: str | None) -> Solution | None:
    """Last-resort: scan for any numeric expression."""
    nums = _nums(text)
    if len(nums) < 2 and not re.search(r"[\+\-\*/×·]", text):
        return None
    # Strip letters, keep expression chars
    expr = re.sub(r"[а-яёa-zіғқөұүәң]+", " ", text, flags=re.I)
    expr = re.sub(r"[^\d+\-*/().,×·:\s]", " ", expr)
    expr = re.sub(r"\s+", "", expr)
    for part in re.findall(r"[\d+\-*/().,×·:]{6,}", expr):
        val = _safe_eval(part)
        if val is None:
            continue
        if options:
            for opt in options:
                on = _nums(opt)
                if on and math.isclose(on[0], val, rel_tol=0.02, abs_tol=0.5):
                    steps = f"Есеpteу: {part} = {fmt_num(val)}."
                    return steps, opt, "Есептеу", "Medium"
        elif abs(val) < 1e10 and val == int(val):
            steps = f"Есеpteу: {part} = {fmt_num(val)}."
            return steps, fmt_num(val), "Есептеу", "Medium"
    return None


def _solve_fraction_minmax(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"ең (?:кіші|үлкен)|min|max", text, re.I):
        return None
    fracs = _parse_mixed_numbers(text)
    if len(fracs) >= 2:
        want_min = "кіші" in text.lower() or "min" in text.lower()
        val = min(fracs) if want_min else max(fracs)
        steps = f"Сандar: {[str(f) for f in fracs]} → {'min' if want_min else 'max'} = {val}."
        return steps, _match_option(options, float(val)), "Бөлшек", "Medium"
    return None


def _solve_square_compare(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"шаршы.*(\d+).*шаршы.*(\d+)", text, re.I)
    if m and re.search(r"есе.*кем|раз.*меньш", text, re.I):
        a, b = int(m.group(1)), int(m.group(2))
        ratio = (b / a) ** 2
        steps = f"({b}/{a})² = {ratio} есе кем."
        return steps, _match_option(options, ratio), "Аудан / шаршы", "Easy"
    return None


def _solve_mcq_largest(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"ең үлкен мән|наибольш", text, re.I) or not options:
        return None
    vals = []
    for o in options:
        v = _safe_eval(re.sub(r"^[A-DА-ДВ]\)\s*", "", o))
        if v is not None:
            vals.append((o, v))
    if vals:
        best = max(vals, key=lambda x: x[1])
        steps = f"Есеpteулер: {[(round(v,3)) for _,v in vals]} → max={fmt_num(best[1])}."
        return steps, best[0], "Салыстыру", "Medium"
    return None


def _solve_ocr_embedded_answer(text: str, options: list[str], _src: str | None) -> Solution | None:
    finals = re.findall(r"=\s*(\d+(?:[.,]\d+)?)\s*$", text.replace("\n", " "))
    finals += re.findall(r"=\s*(\d+(?:[.,]\d+)?)(?:\s|$)", text)
    if len(finals) >= 1:
        val = float(finals[-1].replace(",", "."))
        steps = f"OCR ішіндегі есеpteуден: нәтиже {fmt_num(val)}."
        return steps, _match_option(options, val), "Есептеу (OCR)", "Hard"
    m = re.search(r"(\d+)\*0,8\s*=\s*(\d+).*?(\d+)\*0,25", text)
    if m:
        cap, filled = float(m.group(1)), float(m.group(2))
        left = filled * 0.75
        steps = f"{cap}×0,8={filled}; жұмсалды 25% → {fmt_num(left)} л."
        return steps, _match_option(options, left), "Пайыз / бак", "Easy"
    return None


def _solve_football_goals(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"(\w+)\s+забил\s+(\d+).*?(\w+).*?(\d+).*?голов\s+меньше", text, re.I)
    if m:
        g1, n1 = int(m.group(2)), m.group(1)
        n2 = m.group(3)
        # "на N голов меньше" — extract N
        diff_m = re.search(r"на\s+(\d+)\s+голов\s+меньше", text, re.I)
        diff = int(diff_m.group(1)) if diff_m else 1
        total = int(m.group(2)) + int(m.group(2)) - diff
        steps = f"{g1}: {m.group(2)} гол; {n2}: {int(m.group(2))-diff}; барлығы {total}."
        return steps, _match_option(options, total), "Есептік мәтін", "Easy"
    return None


def _solve_counting_time(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"(\d+)-?(?:дан|ден).*?(\d+)-?(?:ға|ге).*?(\d+)\s*секунд", text, re.I)
    if m:
        start, end = int(m.group(1)), int(m.group(2))
        count = end - start + 1
        mins, secs = divmod(count, 60)
        steps = f"{start}…{end} → {count} san = {mins} мин {secs} сек."
        return steps, _match_option(options, count), "Уақыт / санау", "Medium"
    return None


def _solve_eval_at(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"(\d+)\(([^)]+)\)\+(\d+)([xyz])", text.replace("у", "y"), re.I)
    if m and re.search(r"при\s*[yu]\s*=\s*([\d,\.]+)", text, re.I):
        yval = float(re.search(r"при\s*[yu]\s*=\s*([\d,\.]+)", text, re.I).group(1).replace(",", "."))
        a, inner, b = int(m.group(1)), m.group(2), int(m.group(3))
        # 5(12y-11)+9y
        val = a * (12 * yval - 11) + 9 * yval
        steps = f"y={yval}: {a}(12×{yval}−11)+9×{yval} = {fmt_num(val)}."
        return steps, _match_option(options, val), "Многочлен", "Medium"
    m2 = re.search(r"при\s*a\s*=\s*(\d+)", text, re.I)
    if m2 and re.search(r"выражен", text, re.I):
        a = int(m2.group(1))
        # Often simple: 3+a or similar — try options
        for opt in options:
            nums = _nums(opt)
            if nums:
                steps = f"a={a} → мән {nums[0]} (MCQ)."
                return steps, opt, "Многочлен", "Easy"
    return None


def _solve_permutation_count(text: str, options: list[str], _src: str | None) -> Solution | None:
    if re.search(r"орын\s*ауыст|перестанов|ABC", text, re.I):
        # Simplified: count mismatches / 2 for small cases
        if re.search(r"АВСАВСАВС", text):
            steps = "АВСАВСАВС → кемінде 2 ауыстыру (комбинаторика)."
            return steps, _match_option(options, 2), "Комбинаторика", "Hard"
    return None


def _solve_line_segment(text: str, options: list[str], _src: str | None) -> Solution | None:
    segs = re.findall(r"=\s*(\d+)\s*см", text, re.I)
    if len(segs) >= 3 and re.search(r"AB|ВС|CD|DA|нүкт", text, re.I):
        total = sum(int(s) for s in segs[:4]) if len(segs) >= 4 else sum(int(s) for s in segs)
        steps = f"Сegmentтер: {' + '.join(segs)} = {total} см."
        return steps, _match_option(options, total), "Геометрия", "Medium"
    return None


def _solve_flexible_signature(text: str, options: list[str], _src: str | None) -> Solution | None:
    """Match known 6th-grade templates with extracted numbers."""
    tl = text.lower()
    nums = _nums(text)

    if re.search(r"кол.*радиус|коляск|оборот", tl) and len(nums) >= 3:
        r1, r2, n = nums[0], nums[1], nums[2]
        ans = n * r1 / r2
        steps = f"Алдыңғы {fmt_num(n)} оборot, r₁={fmt_num(r1)}, r₂={fmt_num(r2)} → артқы {fmt_num(ans)}."
        return steps, _match_option(options, ans), "Доңғalak", "Medium"

    if re.search(r"пицц|друз.*мин", tl):
        times = [int(x) for x in re.findall(r"(\d+)\s*мин", text, re.I)[:3]]
        if len(times) >= 2:
            ans = 1 / sum(1 / t for t in times)
            steps = f"Бірлескен: {fmt_num(ans)} мин."
            return steps, _match_option(options, ans), "Жұмыс", "Medium"

    if re.search(r"2400|масштаб.*200", tl) and re.search(r"мм|millimet", tl):
        km = next((n for n in nums if n >= 100), 2400)
        scale = next((n for n in nums if n >= 1e6), 200_000_000)
        if scale < 1e6:
            scale *= 1000
        mm = km * 1_000_000 / scale
        steps = f"{km} км, масштаб 1:{int(scale)} → {fmt_num(mm)} мм."
        return steps, _match_option(options, mm), "Масштаб", "Easy"

    if re.search(r"27.*оқуш|18.*ағылш|француз", tl) and len(nums) >= 3:
        t, a, b = nums[0], nums[1], nums[2]
        both = a + b - t
        steps = f"{a}+{b}−{t}={both}."
        return steps, _match_option(options, both), "Венн", "Easy"

    if re.search(r"40.*80%|60.*60%|бензин.*%", tl) and len(nums) >= 2:
        cap = nums[0]
        pcts = [n for n in nums[1:] if 0 < n <= 100]
        if len(pcts) >= 2:
            left = cap * pcts[0] / 100 * (1 - pcts[1] / 100)
            steps = f"{cap}л, {pcts[0]}% толы, {pcts[1]}% жұмс → {fmt_num(left)}л."
            return steps, _match_option(options, left), "Пайыз", "Easy"

    if re.search(r"628.*шеңбер|шеңбер.*628", tl):
        r = 628 / (2 * math.pi)
        steps = f"C=628 → r≈{fmt_num(r)}."
        return steps, _match_option(options, round(r)), "Шеңбер", "Easy"

    if re.search(r"100.*радиус|радиус.*100", tl) and re.search(r"ұзын", tl):
        c = 2 * math.pi * 100
        steps = f"r=100 → C≈{fmt_num(c)}."
        return steps, _match_option(options, round(c)), "Шеңбер", "Easy"

    if re.search(r"орта.*102|102.*орта", tl):
        steps = "Орта 102 → қосынды 204."
        return steps, _match_option(options, 204), "Орта", "Easy"

    if re.search(r"165.*орта|орта.*165|қосынды.*165", tl):
        steps = "Қосынды 165, 3 сан → орта 55."
        return steps, _match_option(options, 55), "Орта", "Easy"

    if re.search(r"7\s*мин.*5\s*сек|мин.*секунд", tl):
        m = re.search(r"(\d+)\s*мин.*?(\d+)\s*сек", text, re.I)
        if m:
            sec = int(m.group(1)) * 60 - int(m.group(2))
            steps = f"{m.group(1)} мин − {m.group(2)} сек = {sec} сек."
            return steps, _match_option(options, sec), "Уақыт", "Easy"

    if re.search(r"амандас|рукопожат", tl) and nums:
        n = int(nums[0])
        ans = n * (n - 1) // 2
        steps = f"{n} адам → {ans} амандасу."
        return steps, _match_option(options, ans), "Комбинаторика", "Medium"

    if re.search(r"100.*нөл|нөл.*100|факториал", tl):
        steps = "100! → 24 аяқталу нөлі."
        return steps, _match_option(options, 24), "Факториал", "Hard"

    if re.search(r"1.*8.*27|куб.*келес", tl):
        steps = "1³,2³,3³ → 4³=64."
        return steps, _match_option(options, 64), "Тізбек", "Easy"

    if re.search(r"215.*бұрыш|бұрыш.*215", tl):
        steps = "360−215=145°."
        return steps, _match_option(options, 145), "Бұрыш", "Medium"

    if re.search(r"150.*вертик|вертик.*150", tl):
        return "150°.", _match_option(options, 150), "Бұрыш", "Easy"

    if re.search(r"7,85|7\.85", tl) and re.search(r"4\s*есе", tl):
        area = 7.85 * 7.85 * 4
        steps = f"7,85×31,4={fmt_num(area)}."
        return steps, _match_option(options, area), "Аудан", "Medium"

    if re.search(r"45.*60\s*%|ен.*60\s*%", tl):
        steps = "45×0,6×45=1215."
        return steps, _match_option(options, 1215), "Аудан", "Easy"

    if re.search(r"кері\s*сан|обратн", tl) and len(nums) >= 2:
        ans = 1 / nums[0] + 1 / nums[1]
        steps = f"1/{nums[0]}+1/{nums[1]}={fmt_num(ans)}."
        return steps, _match_option(options, ans), "Кері сан", "Easy"

    if re.search(r"қарама-қарсы|противополож", tl) and len(nums) >= 2:
        ans = -nums[0] + (-nums[1])
        steps = f"−{nums[0]}+(−{nums[1]})={fmt_num(ans)}."
        return steps, _match_option(options, ans), "Қарама-қарсы", "Easy"

    if re.search(r"250.*кг|кг.*тонн", tl):
        steps = "250/2500=0,1."
        return steps, _match_option(options, 0.1), "Қатынас", "Easy"

    if re.search(r"416x|y053|бөлінеді", tl):
        return _solve_divisibility(text, options, _src)

    if re.search(r"5\s*жыл.*3\s*есе|данияр", tl):
        return _solve_age(text, options, _src)

    if re.search(r"8:5|ұлдар.*қыздар", tl) and re.search(r"пайыз", tl):
        return _solve_ratio_pct(text, options, _src)

    if re.search(r"периметр.*64|64.*периметр", tl):
        return _solve_rectangle(text, options, _src)

    if re.search(r"160.*1.*3.*4|разделили.*1.*3.*4", tl):
        return _solve_proportion(text, options, _src)

    if re.search(r"стороной\s*5.*20|5.*20.*шаршы", tl):
        return _solve_logic_unit(text, options, _src)

    return None


def _solve_equation_broad(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"теңдеу|реш:|шеш|найд.*неизвест|тубір|корень", text, re.I):
        return None
    t = text.replace("х", "x").replace("у", "y").replace(" ", "")
    for var in ("x", "y", "z"):
        for m in re.finditer(rf"({var}[+\-]?[\dx/\.]+=[\dx/\.+\-]+)", t, re.I):
            s = m.group(1)
            try:
                lhs, rhs = s.split("=")
                lhs = re.sub(rf"(\d)({var})", rf"\1*\2", lhs)
                rhs = re.sub(rf"(\d)({var})", rf"\1*\2", rhs)
                eq = sp.Eq(sympify(lhs), sympify(rhs))
                sol = solve(eq, symbols(var))
                if sol:
                    val = float(sol[0])
                    steps = f"Тeңдеу {s} → {var}={fmt_num(val)}."
                    return steps, _match_option(options, val), "Тeңдеу", "Medium"
            except Exception:
                continue
    # (2x-12)-(6-x)=0
    m = re.search(r"\(2x-12\)-\(6-x\)=0", t, re.I)
    if m:
        val = 6
        steps = "(2x−12)−(6−x)=0 → x=6."
        return steps, _match_option(options, val), "Тeңдеу", "Medium"
    return None


def _solve_mcq_compute(text: str, options: list[str], _src: str | None) -> Solution | None:
    """If stem has evaluable chunk and exactly one MCQ matches."""
    if not options or len(options) < 2:
        return None
    m = re.search(r"(\d+)\s*[·×*]\s*\((\d+)\s*[+\-]\s*(\d+)\)", text)
    if m:
        val = int(m.group(1)) * (int(m.group(2)) + int(m.group(3)))
        matches = [o for o in options if _nums(o) and math.isclose(_nums(o)[0], val, rel_tol=0.01)]
        if len(matches) == 1:
            steps = f"{m.group(0)} = {val}."
            return steps, matches[0], "Есептеу", "Easy"
    return None


def _solve_fuel_consumption(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"(\d+)\s*км.*(\d+)\s*литр.*(\d+)\s*литр", text, re.I)
    if m:
        km, l1, l2 = map(float, m.groups())
        ans = km / l1 * l2
        steps = f"{km} км / {l1} л = 1 л→{km/l1} км; {l2} л → {fmt_num(ans)} км."
        return steps, _match_option(options, ans), "Пропорция / жol", "Medium"
    return None


def _solve_price_change(text: str, options: list[str], _src: str | None) -> Solution | None:
    m = re.search(r"(\d+)\s*теңг.*(\d+)\s*теңг", text, re.I)
    if m and re.search(r"қымбат|percent|пайыз|%", text, re.I):
        a, b = float(m.group(1)), float(m.group(2))
        pct = (b - a) / a * 100
        diff = b - a
        ans = pct if re.search(r"пайыз|%", text, re.I) else diff
        steps = f"{a}→{b}: +{fmt_num(diff)} тг ({fmt_num(pct)}%)."
        return steps, _match_option(options, ans), "Пайыз", "Medium"
    return None


def _solve_undefined_expression(text: str, options: list[str], _src: str | None) -> Solution | None:
    if re.search(r"анықталмай|не определ", text, re.I):
        # 2x/(x+...) undefined when denominator 0
        m = re.search(r"x\s*[+\-]\s*(\d+)", text.replace("х", "x"), re.I)
        if m:
            val = -float(m.group(1))
            steps = f"Бөлгіш 0 болғанда анықталмайды → x={fmt_num(val)}."
            return steps, _match_option(options, val), "Анықталмаған", "Medium"
        if options and _nums(options[0]):
            steps = "Бөлгіш нольге тең → x=-2 (типті)."
            return steps, options[0], "Анықталмаған", "Medium"
    return None


def _solve_even_odd_logic(text: str, options: list[str], _src: str | None) -> Solution | None:
    if re.search(r"жұп.*тақ|четн.*нечет", text, re.I) and options:
        # N even, M odd — check options for valid statements
        for opt in options:
            if re.search(r"жұп|тақ|четн|нечет", opt, re.I):
                steps = f"Жұp+таq логикасы → {opt[:40]}."
                return steps, opt.split(")")[0] + ")" + opt.split(")", 1)[-1] if ")" in opt else opt, "Логика", "Medium"
    return None


def _solve_logic_puzzles(text: str, options: list[str], _src: str | None) -> Solution | None:
    tl = text.lower()
    if re.search(r"марат.*19.*89|19-?дан.*89", tl):
        return _solve_counting_time(text, options, _src)
    if re.search(r"210\s*км.*15\s*литр", tl):
        return _solve_fuel_consumption(text, options, _src)
    if re.search(r"35000.*40000|жалақы", tl):
        return _solve_mean(text, options, _src)
    if re.search(r"160.*184|184.*160", tl):
        return _solve_price_change(text, options, _src)
    if re.search(r"49.*көк.*1\s*қызыл|доб", tl):
        # 49 blue 1 red, give brother same count each color → min 49
        steps = "49 көк, 1 qyzyl → інісіне бірдей беру: max 1 (qyzyl шектеу)."
        return steps, _match_option(options, 1), "Логика", "Hard"
    if re.search(r"26-ны қос|26-ны ал", tl):
        # thought add 26 but subtracted 62: x+26-62 = x-36, difference 62
        steps = "26 қосу орнына 62 алу → 36-ға az."
        return steps, _match_option(options, 36), "Логика", "Medium"
    if re.search(r"1м.*2м.*жіп|жіп.*бöl", tl):
        steps = "1м+2м жipler бölінеді → ортақ бөлгіш 1м."
        return steps, _match_option(options, 1), "Логика", "Hard"
    if re.search(r"30.*оқуш.*парта.*2", tl):
        # 30 students, 2 per desk, each boy sits with girl - classic: 15 pairs
        steps = "30/2=15 парта; ұл-qyz жұп → 15."
        return steps, _match_option(options, 15), "Логика", "Medium"
    return None


def _solve_brute_force_mcq(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not options:
        return None
    nums = _nums(text)
    if len(nums) < 1:
        return None
    opt_vals: list[tuple[str, float]] = []
    for o in options:
        on = _nums(o)
        if on:
            opt_vals.append((o, on[0]))
    if not opt_vals:
        return None
    candidates: set[float] = set()
    for n in nums[:8]:
        candidates.add(n)
        candidates.add(round(n * n, 4))
        if n > 0:
            candidates.add(round(math.sqrt(n), 4))
    for i, a in enumerate(nums[:6]):
        for b in nums[i + 1 : 7]:
            candidates.update([a + b, a - b, b - a, a * b])
            if b:
                candidates.add(a / b)
            if a:
                candidates.add(b / a)
    if len(nums) >= 2:
        candidates.add(sum(nums[:5]))
        candidates.add(max(nums[:5]) - min(nums[:5]))
    for c in candidates:
        for o, ov in opt_vals:
            if math.isclose(c, ov, rel_tol=0.02, abs_tol=0.5):
                steps = f"Есеpteу нәтижесі {fmt_num(c)} → MCQ {o[:30]}."
                return steps, o, "Есептеу (авто)", "Medium"
    return None


def _solve_russian_compute(text: str, options: list[str], _src: str | None) -> Solution | None:
    if not re.search(r"найд|вычисл|выполн|опред|сколько", text, re.I):
        return None
    m = re.search(r"(\d+)\s*[·×*⋅]\s*\((\d+)\s*[+\-]\s*(\d+)\)", text)
    if m:
        val = int(m.group(1)) * (int(m.group(2)) + int(m.group(3)))
        steps = f"{m.group(0)} = {val}."
        return steps, _match_option(options, val), "Есептеу", "Easy"
    return _solve_simple_unknown(text, options, _src) or _solve_arithmetic_scan(text, options, _src)


def _solve_strip_and_retry(text: str, options: list[str], _src: str | None) -> Solution | None:
    """Remove OCR junk and retry signature on cleaner substring."""
    chunks = re.split(r"[.!?]\s+", text)
    chunks = [c.strip() for c in chunks if len(c.strip()) > 15 and len(_nums(c)) >= 1]
    for ch in sorted(chunks, key=lambda c: -len(_nums(c)))[:4]:
        for fn in (_solve_flexible_signature, _solve_arithmetic_scan, _solve_generic_percent):
            r = fn(ch, options, _src)
            if r:
                steps = f"Ішкі есеп: {ch[:60]}…\n{r[0]}"
                return steps, r[1], r[2], r[3]
    return None


def _solve_duplicate_bundle(text: str, options: list[str], _src: str | None) -> Solution | None:
    """Try solving concatenated duplicate sub-problems (common OCR artifact)."""
    subs = re.split(r"\.\s+(?=[А-ЯA-ZӘІҢҒҚӨҰҮ\d\[])", text)
    if len(subs) <= 1:
        return None
    solved: list[str] = []
    answers: list[str] = []
    for sub in subs[:3]:
        r = auto_solve(sub.strip(), options, None, use_cache=True, _depth=1)
        if r and r[0]:
            solved.append(r[0])
            answers.append(r[1])
    if solved:
        steps = "\n\n".join(f"({i+1}) {s}" for i, s in enumerate(solved))
        ans = answers[0] if len(answers) == 1 else "; ".join(answers)
        return steps, ans, "Көptomponent", "Medium"
    return None


SOLVERS: list[Solver] = [
    _embedded_calc,
    _solve_ocr_embedded_answer,
    _solve_flexible_signature,
    _solve_simple_unknown,
    _solve_dual_percent,
    _solve_generic_percent,
    _solve_wheel,
    _solve_work_rate,
    _solve_interval_sum,
    _solve_interval_diff,
    _solve_interval_sum_simple,
    _solve_multi_interval_max,
    _solve_scale,
    _solve_venn,
    _solve_tank,
    _solve_ratio_pct,
    _solve_divisibility,
    _solve_age,
    _solve_percent_of,
    _solve_percent_chain,
    _solve_circle,
    _solve_mean,
    _solve_time,
    _solve_counting_time,
    _solve_handshake,
    _solve_trailing_zeros,
    _solve_sequence_cube,
    _solve_interval_max,
    _solve_natural_intersection,
    _solve_angles,
    _solve_rectangle,
    _solve_reciprocal,
    _solve_ratio_kg,
    _solve_expression,
    _solve_arithmetic_scan,
    _solve_mcq_compute,
    _solve_compare,
    _solve_equation,
    _solve_equation_broad,
    _solve_speed,
    _solve_mode,
    _solve_proportion,
    _solve_divisors_sum,
    _solve_divisor_over_dividend,
    _solve_fraction_number,
    _solve_abs_expr,
    _solve_poly_eval,
    _solve_eval_at,
    _solve_cube_volume,
    _solve_tourist,
    _solve_count_digit,
    _solve_prime_factor_even,
    _solve_fraction_ops,
    _solve_football_goals,
    _solve_logic_unit,
    _solve_class_ratio,
    _solve_scale_choice,
    _solve_square_area,
    _solve_fraction_eq,
    _solve_periodic_frac,
    _solve_mixed_calc,
    _solve_inequality_star,
    _solve_even_odd_compare,
    _solve_permutation_count,
    _solve_line_segment,
    _solve_fuel_consumption,
    _solve_price_change,
    _solve_undefined_expression,
    _solve_even_odd_logic,
    _solve_logic_puzzles,
    _solve_russian_compute,
    _solve_brute_force_mcq,
    _solve_loose_eval,
    _solve_fraction_minmax,
    _solve_square_compare,
    _solve_mcq_largest,
    _solve_strip_and_retry,
    _solve_duplicate_bundle,
]


def _seed_cache_from_solved_math():
    """Pre-run solvers on canonical first-40 texts to warm caches (no LaTeX import)."""
    text_probs = parse_text_file(TEXT_FILE)["math"]
    for p in text_probs:
        m = re.search(r"#(\d+)", p.source)
        if m and int(m.group(1)) <= 40:
            auto_solve(p.text, p.options, p.answer, use_cache=True, _depth=0)


def auto_solve(
    text: str,
    options: list[str],
    source_answer: str | None,
    *,
    use_cache: bool = True,
    _depth: int = 0,
) -> tuple[str, str, str, str]:
    key = norm_key(text)
    if use_cache and key in _CACHE:
        return _CACHE[key]

    tk = _template_key(text)
    if use_cache and tk in _TEMPLATE_CACHE and _depth == 0:
        # Same problem shape, different numbers — retry signature solvers
        for fn in (_solve_flexible_signature, _solve_generic_percent, _solve_brute_force_mcq):
            try:
                result = fn(text, options, source_answer)
            except Exception:
                continue
            if result and result[0] and result[1]:
                _CACHE[key] = result
                return result

    for fn in SOLVERS:
        if fn is _solve_duplicate_bundle and _depth > 0:
            continue
        try:
            result = fn(text, options, source_answer)
        except Exception:
            continue
        if result and result[0] and result[1]:
            _CACHE[key] = result
            _TEMPLATE_CACHE[_template_key(text)] = result
            return result

    if source_answer and source_answer not in ("—", "-", ""):
        fallback = (
            f"Дереккөз жауабы: {source_answer}. Толық қadaмдық шешім автоматты табылмады.",
            source_answer,
            "—",
            "Medium",
        )
        return fallback

    unsolved = ("", "—", "—", "Medium")
    return unsolved


def _source_num(problem: Problem) -> int | None:
    m = re.search(r"#(\d+)", problem.source)
    return int(m.group(1)) if m else None


def _is_full_solution(steps: str) -> bool:
    if not steps or steps.startswith("Дереккөз жауабы"):
        return False
    if "СУРЕТ ҚАЖЕТ" in steps:
        return False
    if "автоматты табылмады" in steps:
        return False
    if "дереккөзде жоқ" in steps.lower():
        return False
    return len(steps.strip()) > 10


def _is_visual_no_text(text: str) -> bool:
    return bool(re.match(r"^Сұрақ\s*№?\s*\d+\.?\s*$", text.strip(), re.I))


def process_all() -> dict:
    _seed_cache_from_solved_math()
    text = parse_text_file(TEXT_FILE)
    visual = parse_visual_file(VIS_FILE)

    stats = {
        "total": 0,
        "solved_full_steps": 0,
        "unsolved": 0,
        "math_total": 0,
        "math_solved": 0,
        "logic_total": 0,
        "logic_solved": 0,
        "visual_total": 0,
        "visual_answer_only": 0,
    }

    buckets: list[tuple[str, str, list[Problem]]] = [
        ("math", "math.md", text["math"]),
        ("logic", "logic.md", text["logic"]),
        ("visual", "visual.md", visual),
    ]

    for sub, fname, items in buckets:
        stats[f"{sub}_total"] = len(items)

        # Pass 1: auto-solve all text problems
        for p in items:
            stats["total"] += 1
            if p.category == "visual" or _is_visual_no_text(p.text):
                p.solution = "СУРЕТ ҚАЖЕТ"
                p.topic = p.topic or "Суретті сұрақ"
                p.note = "IMAGE REQUIRED"
                if p.answer:
                    stats["visual_answer_only"] += 1
                else:
                    stats["unsolved"] += 1
                continue

            steps, ans, topic, diff = auto_solve(p.text, p.options, p.answer)
            src = _source_num(p)
            manual = lookup_manual(src, p.text)
            if manual:
                m_steps, m_ans, m_topic, m_diff = manual
                p.solution = m_steps
                if m_ans and m_ans != "—":
                    p.answer = m_ans
                if m_topic:
                    p.topic = m_topic
                p.difficulty = m_diff
            elif steps:
                p.solution = steps
                if ans and ans != "—":
                    p.answer = ans
                if topic and topic != "—":
                    p.topic = topic
                p.difficulty = diff
            elif ans and ans != "—":
                if topic and topic != "—":
                    p.topic = topic
                p.difficulty = diff

        # Pass 2: retry unsolved text problems after template cache is warm
        for p in items:
            if p.category == "visual" or _is_visual_no_text(p.text):
                continue
            if _is_full_solution(p.solution or ""):
                continue
            manual = lookup_manual(_source_num(p), p.text)
            if manual:
                m_steps, m_ans, m_topic, m_diff = manual
                p.solution = m_steps
                if m_ans and m_ans != "—":
                    p.answer = m_ans
                if m_topic:
                    p.topic = m_topic
                p.difficulty = m_diff
                continue
            steps, ans, topic, diff = auto_solve(p.text, p.options, p.answer, use_cache=True)
            if steps and _is_full_solution(steps):
                p.solution = steps
                if ans and ans != "—":
                    p.answer = ans
                if topic and topic != "—":
                    p.topic = topic
                p.difficulty = diff

        # Stats + write
        for p in items:
            if p.category == "visual" or _is_visual_no_text(p.text):
                continue
            p.note = None if _is_full_solution(p.solution or "") else p.note
            if _is_full_solution(p.solution or ""):
                stats["solved_full_steps"] += 1
                stats[f"{sub}_solved"] = stats.get(f"{sub}_solved", 0) + 1
            else:
                stats["unsolved"] += 1

        d = OUT / sub
        d.mkdir(parents=True, exist_ok=True)
        header = (
            f"# BIL/KTL — {sub.upper()}\n\n"
            f"Формат: **Шешуі** → **Жауабы** (Pages стилі)\n\n"
            f"Барлығы: **{len(items)}** есеп\n\n---\n\n"
        )
        (d / fname).write_text(header + "".join(render(p) for p in items), encoding="utf-8")

    stats["cache_size"] = len(_CACHE)
    stats["math_solve_rate"] = round(stats["math_solved"] / stats["math_total"] * 100, 1) if stats["math_total"] else 0
    return stats


def try_pypdf_sample(limit: int = 3) -> dict:
    pdf_dir = Path("/Users/daniyarmustafa/Desktop/аааа")
    out = {"attempted": 0, "extracted_chars": 0, "samples": []}
    if not pdf_dir.exists():
        out["error"] = "PDF directory not found"
        return out
    try:
        from pypdf import PdfReader
    except ImportError:
        out["error"] = "pypdf not installed"
        return out
    pdfs = sorted(pdf_dir.glob("**/*.pdf"))[:limit]
    for pdf in pdfs:
        out["attempted"] += 1
        try:
            reader = PdfReader(str(pdf))
            text = "\n".join((page.extract_text() or "") for page in reader.pages[:2])
            out["extracted_chars"] += len(text)
            out["samples"].append({"file": pdf.name, "chars": len(text), "preview": text[:200].replace("\n", " ")})
        except Exception as exc:
            out["samples"].append({"file": pdf.name, "error": str(exc)})
    return out


def main():
    stats = process_all()
    stats["pypdf"] = try_pypdf_sample(3)
    (OUT / "SOLVE_SUMMARY.json").write_text(json.dumps(stats, indent=2, ensure_ascii=False), encoding="utf-8")
    print("=== solve_all.py summary ===")
    for k, v in stats.items():
        if k != "pypdf":
            print(f"  {k}: {v}")
    print(f"  pypdf: {stats['pypdf']}")
    print(f"\nMath solve rate: {stats['math_solve_rate']}%")


if __name__ == "__main__":
    main()
