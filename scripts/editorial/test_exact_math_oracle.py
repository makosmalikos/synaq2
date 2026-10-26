import unittest
from fractions import Fraction
from exact_math_oracle import expression, value, equation_root

class ExactOracleTests(unittest.TestCase):
    def test_precedence_and_native_notation(self):
        self.assertEqual(value(expression('80² − 7²')), 6351)
        self.assertEqual(value(expression('(50 000 − 5 267) : 3 + 4 106 · 7')), 43653)
        self.assertEqual(value(expression('1 / 3 + 1 / 6')), Fraction(1, 2))

    def test_denominator_unknown_and_nested_operations(self):
        self.assertEqual(equation_root(expression('4444 / (x + 23)'), expression('44')), 78)
        self.assertEqual(equation_root(expression('(x-1400)/436'), expression('16')), 8376)
        self.assertEqual(equation_root(expression('x/10*100'), expression('8900')), 890)

    def test_domain_and_ambiguity(self):
        with self.assertRaises(ZeroDivisionError): value(expression('1/(3-3)'))
        for left, right in [('0*x', '0'), ('x+x', '2'), ('x*x', '4')]:
            with self.assertRaises(ValueError): equation_root(expression(left), expression(right))

    def test_never_executes_source_text(self):
        for text in ['__import__("os").system("false")', 'x(1)', 'x.real', '1//2', '2**1000']:
            with self.assertRaises((ValueError, SyntaxError)):
                value(expression(text))

if __name__ == '__main__': unittest.main()
