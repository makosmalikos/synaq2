"""Small independent rational-arithmetic oracle; never executes expression text."""
import ast
import re
from fractions import Fraction as Q

def expression(text):
    for old, new in [(r'\left', ''), (r'\right', ''), (r'\,', ''),
                     (r'\;', ''), (r'\!', ''), (r'\cdot', '*'),
                     (r'\times', '*'), (r'\div', '/'), ('−', '-'),
                     ('·', '*'), ('×', '*'), (':', '/'), ('÷', '/'),
                     ('²', '**2'), ('³', '**3'), ('^', '**'), ('{', '('), ('}', ')')]:
        text = text.replace(old, new)
    text = re.sub(r'\s+', '', text)
    if len(text) > 2000 or not re.fullmatch(r'[0-9x()+*/.\-]+', text):
        raise ValueError('Expression is outside the restricted mathematical grammar')
    return ast.parse(text, mode='eval').body

def value(node, x=None):
    if isinstance(node, ast.Constant) and type(node.value) is int:
        return Q(node.value)
    if isinstance(node, ast.Name) and node.id == 'x' and x is not None:
        return Q(x)
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.USub, ast.UAdd)):
        n = value(node.operand, x)
        return -n if isinstance(node.op, ast.USub) else n
    if not isinstance(node, ast.BinOp):
        raise ValueError('Only numeric constants, x and arithmetic operators are allowed')
    a, b = value(node.left, x), value(node.right, x)
    if isinstance(node.op, ast.Add): return a + b
    if isinstance(node.op, ast.Sub): return a - b
    if isinstance(node.op, ast.Mult): return a * b
    if isinstance(node.op, ast.Div): return a / b
    if isinstance(node.op, ast.Pow) and b.denominator == 1 and 0 <= b <= 9:
        return a ** int(b)
    raise ValueError('Unsupported arithmetic operator')

def family(node):
    if isinstance(node, ast.Constant) and type(node.value) is int:
        n = node.value
        if n in [0, 1]: return str(n)
        return ('integer', len(str(n)), len(str(n)) - len(str(n).rstrip('0')))
    if isinstance(node, ast.Name) and node.id == 'x': return 'x'
    if isinstance(node, ast.BinOp):
        if isinstance(node.op, (ast.Add, ast.Mult)):
            parts = []
            def flatten(n):
                if isinstance(n, ast.BinOp) and type(n.op) is type(node.op):
                    flatten(n.left)
                    flatten(n.right)
                else: parts.append(family(n))
            flatten(node)
            return type(node.op).__name__, tuple(parts)
        return (type(node.op).__name__, family(node.left),
                value(node.right) if isinstance(node.op, ast.Pow) else family(node.right))
    raise ValueError('Unsupported family node')

def variable_count(node):
    return sum(isinstance(n, ast.Name) and n.id == 'x' for n in ast.walk(node))

def mobius(node):
    """Return (a,b,c,d) representing (a*x+b)/(c*x+d), for one x occurrence."""
    if variable_count(node) == 0:
        return Q(0), value(node), Q(0), Q(1)
    if isinstance(node, ast.Name) and node.id == 'x':
        return Q(1), Q(0), Q(0), Q(1)
    if not isinstance(node, ast.BinOp) or variable_count(node) != 1:
        raise ValueError('The equation must have one occurrence of x')
    variable_on_left = variable_count(node.left) == 1
    a, b, c, d = mobius(node.left if variable_on_left else node.right)
    k = value(node.right if variable_on_left else node.left)
    if isinstance(node.op, ast.Add): return a+k*c, b+k*d, c, d
    if isinstance(node.op, ast.Sub):
        return (a-k*c, b-k*d, c, d) if variable_on_left else (k*c-a, k*d-b, c, d)
    if isinstance(node.op, ast.Mult): return a*k, b*k, c, d
    if isinstance(node.op, ast.Div):
        return (a, b, c*k, d*k) if variable_on_left else (k*c, k*d, a, b)
    raise ValueError('Nonlinear powers are outside the equation oracle')

def equation_root(left, right):
    if variable_count(left) + variable_count(right) != 1:
        raise ValueError('Expected exactly one occurrence of x')
    a,b,c,d = mobius(left)
    e,f,g,h = mobius(right)
    if a*g != e*c: raise ValueError('Nonlinear equation')
    coefficient, constant = a*h+b*g-e*d-f*c, b*h-f*d
    if coefficient == 0: raise ValueError('The equation has no unique root')
    root = -constant / coefficient
    if value(left, root) != value(right, root): raise ValueError('Root violates the denominator domain')
    return root
