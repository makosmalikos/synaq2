"""Exact, restricted mathematical parser for rendered Zerek question formulae.
No eval, exec, sympify or parsing of site JavaScript; only whitelisted math tokens.
For the optional offline import: PYTHONPATH=output/zerek-import/python-deps python3 ...
"""
import re
import sympy as s

class Unsupported(ValueError): pass

class Parser:
    def __init__(self, text):
        text=re.sub(r'\\(?:dfrac|cfrac|frac)([0-9A-Za-z])([0-9A-Za-z])',r'\\frac{\1}{\2}',text)
        text=text.replace('{,}', '.').replace('−','-').replace('×','*').replace('÷','/').replace('·','*').replace('π',' PI ').replace('√',' SQRT ')
        text=re.sub(r'(\d+)\.(\d*)\((\d+)\)',lambda m:'('+m[1]+'+'+str(int(m[2] or '0'))+'/'+str(10**len(m[2]))+'+'+str(int(m[3]))+'/'+str(10**len(m[2])*(10**len(m[3])-1))+')',text)
        for token in ['\\left','\\right','\\,','\\;','\\!','\\quad','\\qquad','\\displaystyle']:
            text=text.replace(token,'')
        for a,b in [('\\dfrac',' FRAC '),('\\cfrac',' FRAC '),('\\frac',' FRAC '),('\\sqrt',' SQRT '),('\\cdot','*'),('\\times','*'),('\\div','/'),('\\pi',' PI '),('\\%','%')]: text=text.replace(a,b)
        if re.search(r'[^\dA-Za-z\s.+*/^(){}!|:%-]',text): raise Unsupported('unsupported character')
        self.tokens=re.findall(r'FRAC|SQRT|PI|\d+(?:\.\d+)?|[a-zA-Z]|[+*/^(){}!|:%-]',text)
        if ''.join(self.tokens) != re.sub(r'\s+','',text): raise Unsupported('unrecognized token')
        self.i=0
        self.denominators=[]
    def peek(self): return self.tokens[self.i] if self.i<len(self.tokens) else None
    def pop(self, expected=None):
        v=self.peek()
        if v is None or expected is not None and expected!=v: raise Unsupported('expected '+str(expected))
        self.i+=1;return v
    def parse(self):
        result=self.sum()
        if self.peek() is not None: raise Unsupported('trailing tokens')
        return result
    def sum(self):
        a=self.product()
        while self.peek() in ('+','-'):
            op=self.pop();b=self.product();a=a+b if op=='+' else a-b
        return a
    def product(self):
        a=self.unary()
        while True:
            t=self.peek()
            if t in ('*','/',':'):
                self.pop();b=self.unary();
                if t!='*': self.denominators.append(b)
                a=a*b if t=='*' else a/b
            elif t and (t in ('FRAC','SQRT','PI','(','{') or t.isalpha() and len(t)==1): a*=self.unary()
            else: break
        return a
    def unary(self):
        if self.peek() in ('+','-'):
            op=self.pop();return self.unary() if op=='+' else -self.unary()
        return self.power()
    def power(self):
        a=self.atom()
        if self.peek()=='^':self.pop();a=a**self.unary()
        while self.peek() in ('!','%'):
            op=self.pop()
            if op=='!':
                if not a.is_Integer or not 0<=a<=2000: raise Unsupported('factorial domain')
                a=s.factorial(a)
            else: a/=100
        return a
    def atom(self):
        t=self.pop()
        if t in ('(','{','|'):
            end={ '(':')','{':'}','|':'|' }[t]
            a=self.sum();self.pop(end);return s.Abs(a) if t=='|' else a
        if t=='FRAC':
            self.pop('{');a=self.sum();self.pop('}');self.pop('{');b=self.sum();self.pop('}');self.denominators.append(b);return a/b
        if t=='SQRT':return s.sqrt(self.atom())
        if t=='PI': return s.pi
        if re.fullmatch(r'\d+(?:\.\d+)?',t):
            n=s.Rational(t)
            if self.peek()=='FRAC': n+=self.atom() # mixed numeral, unary minus applies to whole value
            return n
        if t in 'abcdnpqtmxyz':return s.Symbol(t, real=True)
        raise Unsupported('unsupported atom '+t)

def expression(tex):
    if len(tex)>600 or re.search(r'\^{?\d{4,}',tex):raise Unsupported('huge exponent needs modular model')
    value=Parser(tex.strip()).parse()
    if value.has(s.zoo,s.nan,s.oo,-s.oo): raise Unsupported('undefined expression')
    return value


def _split_tex_cells(text, separator):
    """Split table rows/cells only outside TeX groups and escaped symbols."""
    pieces=[];start=0;depth=0;index=0
    while index<len(text):
        if depth==0 and text.startswith(separator,index):
            pieces.append(text[start:index]);index+=len(separator);start=index;continue
        if text[index]=='\\':index+=2;continue
        if text[index]=='{':depth+=1
        elif text[index]=='}':
            depth-=1
            if depth<0:return None
        index+=1
    return None if depth else [*pieces,text[start:]]

def _array_markdown(columns, body):
    """Keep a small rectangular source table readable without an HTML runtime."""
    if len(body)>6000 or not re.fullmatch(r'[|clr\s]+',columns):return None
    width=sum(char in 'clr' for char in columns)
    if not 2<=width<=12:return None
    raw_rows=_split_tex_cells(body,r'\\')
    if raw_rows is None:return None
    rows=[]
    for raw_row in raw_rows:
        raw_row=re.sub(r'\\hline\b','',raw_row).strip()
        if not raw_row:continue
        cells=_split_tex_cells(raw_row,'&')
        if cells is None or len(cells)!=width or any(not cell.strip() for cell in cells):return None
        cells=[plain_tex(cell).strip() for cell in cells]
        # Pipes/newlines would make Markdown cell boundaries ambiguous.
        if any(not cell or len(cell)>120 or re.search(r'[|\\\n\r]',cell) for cell in cells):return None
        rows.append(cells)
    if not 2<=len(rows)<=24:return None
    line=lambda row:'| '+' | '.join(row)+' |'
    return '\n'.join([line(rows[0]),line(['---']*width),*[line(row) for row in rows[1:]]])

def plain_tex(tex):
    tex=re.sub(r'\\not\s*\\(subseteq|subset|in)\b',lambda m:{'subseteq':'⊈','subset':'⊄','in':'∉'}[m[1]],tex)
    tex=re.sub(r'\\begin\{cases\}(.*?)\\end\{cases\}',lambda m:r'\{ '+m[1].replace('\\\\','; ')+r' \}',tex,flags=re.S)
    tex=re.sub(r'\\(?:dfrac|cfrac|frac)([0-9A-Za-z])([0-9A-Za-z])',r'\\frac{\1}{\2}',tex)
    # A thousands separator belongs to the whole integer part of a mixed
    # number; converting only the last group would turn 111,111 4/9 into
    # the unrelated product 111 × (111 + 4/9).
    tex=re.sub(r'(\d+(?:\\[,;]\d{3})*)\s*\\(?:dfrac|cfrac|frac)\{([^{}]+)\}\{([^{}]+)\}',lambda m:'('+re.sub(r'\\[,;]','',m[1])+' + \\frac{'+m[2]+'}{'+m[3]+'})',tex)
    symbols={'cdot':' · ','times':' × ','div':' ÷ ','pi':'π','%':'%','ldots':'…','dots':'…','circ':'°','perp':'⊥','bigcirc':'○','circledcirc':'⊚','cdots':'⋯','leqslant':'≤','{':'{','}':'}','angle':'∠','diamond':'◇','triangle':'△','square':'□','Delta':'Δ','blacksquare':'■','cup':'∪','cap':'∩','oplus':'⊕','nabla':'∇','leq':'≤','geq':'≥','neq':'≠','le':'≤','ge':'≥','ne':'≠','approx':'≈','infty':'∞','in':'∈','rightarrow':'→','to':'→','Rightarrow':'⇒','pm':'±','lfloor':'⌊','rfloor':'⌋','hline':' ─ ','_':'_'}
    symbols.update({'iff':'⇔','Leftrightarrow':'⇔','ast':'∗','subset':'⊂','subseteq':'⊆','supset':'⊃','supseteq':'⊇','notin':'∉','emptyset':'∅','varnothing':'∅','setminus':'∖','mid':' | ','smile':'⌣','frown':'⌢','geqslant':'≥','parallel':'∥'})
    ignored={'left','right','big','Big','bigl','bigr','Bigl','Bigr','displaystyle'}
    pos=0
    def group():
        nonlocal pos
        while pos<len(tex) and tex[pos].isspace():pos+=1
        if pos<len(tex) and tex[pos]=='{':pos+=1;return parse('}')
        if pos<len(tex):v=tex[pos];pos+=1;return v
        raise Unsupported('missing TeX group')
    def parse(end=None):
        nonlocal pos
        out=[]
        while pos<len(tex):
            c=tex[pos];pos+=1
            if end and c==end:return ''.join(out)
            if c=='{':out.append(parse('}'));continue
            if c=='^':
                if tex[pos:].startswith('\\circ'):pos+=5;out.append('°');continue
                exponent=group();out.append('^('+exponent+')');continue
            if c=='_':out.append('_'+group());continue
            if c!='\\':out.append(c);continue
            if pos>=len(tex):out.append('\\');break
            if tex[pos]=='\\':pos+=1;out.append('\n');continue
            m=re.match(r'[A-Za-z]+',tex[pos:])
            if m:cmd=m[0];pos+=len(cmd)
            else:cmd=tex[pos];pos+=1
            if cmd in ('frac','dfrac','cfrac','tfrac'):
                n,d=group(),group();out.append('('+n+'/'+d+')' if re.fullmatch(r'(?:[+-]?\d+(?:[.,]\d+)?|[A-Za-zА-Яа-я])',n) and re.fullmatch(r'(?:[+-]?\d+(?:[.,]\d+)?|[A-Za-zА-Яа-я])',d) else '(('+n+')/('+d+'))')
            elif cmd=='overline':out.append('overline('+group()+')')
            elif cmd in ('underline','text','mathrm','mathbf','mathit','boldsymbol','boxed','operatorname'):out.append(group())
            elif cmd=='vec':out.append(group()+'⃗')
            elif cmd=='overrightarrow':
                points=group();out.append(points[0]+'→'+points[1] if re.fullmatch(r'[A-Za-zА-Яа-я]{2}',points) else '→('+points+')')
            elif cmd=='phantom':group()
            elif cmd=='underbrace':out.append('('+group()+')')
            elif cmd=='xrightarrow':out.append(' →('+group()+') ')
            elif cmd=='sqrt':out.append('√('+group()+')')
            elif cmd in ('begin','end'):
                env=group()
                if cmd=='begin' and env=='array':
                    columns=group();end_array=re.search(r'\\end\s*\{array\}',tex[pos:])
                    if end_array:
                        table=_array_markdown(columns,tex[pos:pos+end_array.start()])
                        if table is not None:
                            pos+=end_array.end();out.append('\n'+table+'\n');continue
                out.append('\n')
            elif cmd in ignored:pass
            elif cmd in ('quad','qquad',',',';',' '):out.append(' ')
            elif cmd=='!':pass
            elif cmd in ('(',')','[',']'):out.append(cmd)
            elif cmd in symbols:out.append(symbols[cmd])
            else:out.append('\\'+cmd)
        if end:raise Unsupported('unclosed TeX group')
        return ''.join(out)
    return parse().strip()

def replace_inline_math(text,before,after):
    """Replace a complete formula, never a prefix of a longer formula."""
    return text.replace('$'+before+'$', '$'+after+'$')

def decode_source_linebreaks(text):
    r"""Decode literal source \n markers without damaging TeX commands.

    Formulae keep their original TeX. Outside formulae, an ASCII command
    such as \nabla or \notin is also preserved rather than interpreted as
    a newline followed by letters. Unknown commands can then be reviewed.
    """
    parts=re.split(r'((?<!\\)\$(?:\\.|[^$\\])*\$|\\\([\s\S]*?\\\))',text,flags=re.S)
    return ''.join(part if index%2 else re.sub(r'(?<!\\)\\n(?![A-Za-z])','\n',part) for index,part in enumerate(parts))

def display_statement(text):
    text=re.sub(r'\\\((.*?)\\\)',lambda m:plain_tex(m[1]),text,flags=re.S)
    rendered=re.sub(r'\$([^$]+)\$',lambda m:plain_tex(m[1]),text)
    # A standalone overline over explicit integer digits is still an ordinary
    # numeric answer. Preserve bars inside expressions and repeating decimals.
    scalar=re.fullmatch(r'\s*([+-]?)overline\(([0-9][0-9\s]*)\)\s*',rendered)
    return scalar[1]+re.sub(r'\s+','',scalar[2]) if scalar else rendered
