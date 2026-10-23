"""Exact solution checks without running an import or publishing source data."""
import importlib.util
import json
from pathlib import Path
import sys
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
spec=importlib.util.spec_from_file_location('zerek_solution_checks',ROOT/'scripts/prepare-zerek-import.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
solution_checks=module.solution_checks

class NumericRatioChecks(unittest.TestCase):
    def test_named_ratio_uses_one_exact_coefficient_for_every_component(self):
        for heading in ('Қатынас:','Бұрыштардың қатынасы:','Отношение:','Пропорционалдық:','Пропорциональность:'):
            self.assertEqual(solution_checks(heading+' $30 : 24 : 18 = 5 : 4 : 3$'),(1,[]))
        self.assertEqual(solution_checks('Қатынас: $30:24:18 = 10:8:6 = 5:4:3$'),(2,[]))
        # Its sequential quotients happen to agree, but the last scale is wrong.
        tex='30 : 24 : 18 = 5 : 4 : 18'
        self.assertEqual(solution_checks('Қатынас: $'+tex+'$'),(0,[tex]))

    def test_unlabelled_colons_keep_left_to_right_arithmetic(self):
        self.assertEqual(solution_checks('$30 : 24 : 18 = 5 : 4 : 18$'),(1,[]))
        tex='30 : 24 : 18 = 5 : 4 : 3'
        self.assertEqual(solution_checks('$'+tex+'$'),(0,[tex]))
        self.assertEqual(solution_checks('$720 : 4 : 20 = 9$'),(1,[]))
        self.assertEqual(solution_checks('Қатынас: $30:24:18=5:4:3$. Тексеру: $720:4:20=9$'),(2,[]))

    def test_zero_undefined_and_mismatched_tuples_fail_closed(self):
        for tex in ('0:24:18=0:4:3','30:0:18=5:0:3','0:0:0=0:0:0',
                    r'30:\frac{1}{0}:18=5:4:3','30:24:18=5:72'):
            self.assertEqual(solution_checks('Қатынас: $'+tex+'$'),(0,[tex]),tex)

    def test_decimal_coefficients_are_exact_not_floating_point_estimates(self):
        self.assertEqual(solution_checks(r'Қатынас: $0{,}3:0{,}24:0{,}18=5:4:3$'),(1,[]))
        tex=r'0{,}3:0{,}24:0{,}1800000000000000001=5:4:3'
        self.assertEqual(solution_checks('Қатынас: $'+tex+'$'),(0,[tex]))

    def test_nested_division_is_a_component_not_an_extra_ratio_member(self):
        self.assertEqual(solution_checks(r'Қатынас: $\frac{60:2}{1}:24:18=5:4:3$'),(1,[]))

    def test_captured_worker_day_solution_keeps_all_arithmetic_checks(self):
        source=json.loads((ROOT/'problems/sources/zerek/courses/6-math-1-2-level3.json').read_text())
        question=source['questions'][3]
        self.assertEqual(question['id'],'abb211543b431f4f')
        self.assertEqual(solution_checks(question['solution']),(8,[]))
        changed=question['solution'].replace('5 : 4 : 3','5 : 4 : 18')
        self.assertEqual(solution_checks(changed),(7,['30 : 24 : 18 = 5 : 4 : 18']))

if __name__=='__main__':unittest.main()
