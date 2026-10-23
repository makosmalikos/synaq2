"""Optional offline parser verification; use the pinned source-review requirements."""
import unittest,sys,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent.parent/'scripts'))
from zerek_math import expression,plain_tex,replace_inline_math,decode_source_linebreaks,display_statement,Parser,Unsupported
from sympy import Rational,simplify,Symbol
class ExactMath(unittest.TestCase):
 def test_independent_known_values(self):
  cases={r'3\dfrac{1}{3}+4\dfrac{4}{5}':Rational(122,15),r'-2\dfrac{1}{4}':Rational(-9,4),r'|-1-(-2)|-|-11|\cdot|3-5|':-21,r'2+\cfrac{1}{4+\cfrac{1}{3}}':Rational(29,13),r'\dfrac{12!-11!}{11!}':11,r'2^7-5^2':103}
  for tex,want in cases.items():self.assertEqual(expression(tex),want,tex)
 def test_fraction_grouping_survives_presentation(self):
  for tex in [r'\dfrac{2x+4}{3}',r'\dfrac{3}{x+1}',r'\frac{c}{ab}',r'\frac{1}{xy}',r'-2\dfrac{1}{4}',r'\frac{1}{2+\frac{3}{4}}',r'\dfrac{5^{14}-5^{11}}{5^{13}-5^{10}}']:
   self.assertEqual(simplify(expression(tex)-expression(plain_tex(tex))),0,tex)
 def test_decimal_arithmetic_is_exact(self):
  self.assertEqual(expression(r'0{,}1+0{,}2'),Rational(3,10))
 def test_large_mixed_numbers_keep_the_entire_integer_part(self):
  for tex,want in [(r'111\,111\dfrac{4}{9}',Rational(1000003,9)),(r'1\,234\,567\frac{8}{9}',Rational(11111111,9)),(r'-2\,003\dfrac{1}{4}',Rational(-8013,4)),(r'12 \frac{1}{2}',Rational(25,2))]:
   self.assertEqual(expression(tex),want,tex)
   self.assertEqual(expression(plain_tex(tex)),want,tex)
  self.assertEqual(plain_tex(r'111\,111\dfrac{4}{9}'),'(111111 + (4/9))')
 def test_domains_not_lost_to_simplification(self):
  p=Parser('x/x');self.assertEqual(p.parse(),1);self.assertEqual(p.denominators,[Symbol('x',real=True)])
 def test_code_and_unbounded_inputs_rejected(self):
  for tex in ['__import__("os")','2**100000','[1,2]',r'2^{1000000}']:
   with self.assertRaises(Unsupported):expression(tex)
 def test_degrees_and_sets(self):
  self.assertEqual(plain_tex(r'120^\circ'),'120°');self.assertEqual(plain_tex(r'\{1,2,3\}'),'{1,2,3}')
 def test_underlined_proportion_members_remain_readable(self):
  self.assertEqual(plain_tex(r'5 : \underline{2} = \underline{15} : 6'),'5 : 2 = 15 : 6')
 def test_set_notation_preserves_negation_and_boundaries(self):
  self.assertEqual(plain_tex(r'C = \{x \mid x \in N,\ 20 < x < 30\}'),'C = {x  |  x ∈ N, 20 < x < 30}')
  self.assertEqual(plain_tex(r'A \not\subset B; C \not \subseteq D; x \not\in A'),'A ⊄ B; C ⊈ D; x ∉ A')
  self.assertEqual(plain_tex(r'\smile BC'),'⌣ BC')
 def test_periodic_decimals_remain_exact(self):
  for tex,want in [(r'0{,}0(3)',Rational(1,30)),(r'0{,}(04)',Rational(4,99)),(r'-1{,}2(34)',-Rational(611,495)),('0.0(4)',Rational(2,45))]:
   self.assertEqual(expression(tex),want,tex)
   self.assertEqual(expression(plain_tex(tex).replace(',','.')),want,tex)
 def test_systems_keep_their_conjunction(self):
  shown=plain_tex(r'\begin{cases} x \geqslant -1 \\ x < 3 \end{cases}')
  self.assertEqual(' '.join(shown.split()),'{ x ≥ -1 ; x < 3 }')
 def test_remainder_rewrite_keeps_the_exact_decimal_quotient(self):
  source=r'$7 : 4 = 1$, қалдық $3$. Сонда $7 : 4 = 1{,}75$.'
  result=replace_inline_math(source,'7 : 4 = 1',r'7 = 4 \cdot 1 + 3')
  self.assertIn(r'$7 : 4 = 1{,}75$',result)
  self.assertIn(r'$7 = 4 \cdot 1 + 3$',result)
 def test_logical_equivalence_is_preserved(self):
  self.assertEqual(plain_tex(r'a > b \iff b < a'),'a > b ⇔ b < a')
  self.assertEqual(plain_tex(r'a \Leftrightarrow b'),'a ⇔ b')
 def test_vector_direction_is_not_lost(self):
  self.assertEqual(plain_tex(r'\overrightarrow{KM}'),'K→M')
  self.assertEqual(plain_tex(r'\overrightarrow{MK}'),'M→K')
  self.assertEqual(plain_tex(r'\vec a'),'a⃗')
  self.assertEqual(plain_tex(r'\boldsymbol{t}'),'t')
 def test_source_linebreaks_never_remove_mathematical_negation(self):
  for opening,closing in [('$','$'),(r'\(',r'\)')]:
   formula=r'x \notin A; C \not\subset D; a \neq b'
   source=r'Жиындарды қараңыз.\n'+opening+formula+closing+r'\nКелесі шарт.'
   decoded=decode_source_linebreaks(source)
   self.assertIn(opening+formula+closing,decoded)
   self.assertEqual(decoded.count('\n'),2)
   self.assertEqual(display_statement(decoded),'Жиындарды қараңыз.\nx ∉ A; C ⊄ D; a ≠ b\nКелесі шарт.')
 def test_literal_source_linebreaks_are_distinct_from_ascii_tex_commands(self):
  self.assertEqual(decode_source_linebreaks(r'Бірінші.\nЕкінші.\n\n Үшінші.'),'Бірінші.\nЕкінші.\n\n Үшінші.')
  commands=r'\nabla f; \neq; \notin; \not\subset'
  self.assertEqual(decode_source_linebreaks(commands),commands)
 def test_digit_concatenation_bars_remain_distinct_from_products(self):
  self.assertEqual(plain_tex(r'\overline{ab} > \overline{ba}'),'overline(ab) > overline(ba)')
  self.assertEqual(plain_tex(r'\dfrac{\overline{ab}+2}{3}'),'((overline(ab)+2)/(3))')
  self.assertEqual(plain_tex(r'\overline{\square 4}'),'overline(□ 4)')
  self.assertEqual(display_statement(r'$\overline{2178}$'),'2178')
  self.assertEqual(display_statement(r'$-\overline{1\,234}$'),'-1234')
  self.assertEqual(display_statement(r'$0{,}\overline{3}$'),'0,overline(3)')
  options=[display_statement(value) for value in [r'$\overline{2178}$',r'$\overline{8712}$']]
  self.assertEqual(options,['2178','8712'])
  self.assertEqual(options.count(display_statement(r'$\overline{2178}$')),1)
 def test_source_table_keeps_each_column_and_unknown_cell(self):
  raw=r'\begin{array}{|c|c|c|c|} \hline x & 0 & 3 & \boldsymbol{?} \\ \hline y & 2 & 8 & 20 \\ \hline \end{array}'
  expected='| x | 0 | 3 | ? |\n| --- | --- | --- | --- |\n| y | 2 | 8 | 20 |'
  self.assertEqual(plain_tex(raw),expected)
  self.assertEqual(plain_tex(r'\begin{array}{cc} x & \dfrac{1}{2} \\ y & 3 \end{array}'),'| x | (1/2) |\n| --- | --- |\n| y | 3 |')
if __name__=='__main__':unittest.main()
