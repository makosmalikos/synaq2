// Exhaustive checker, independent of the answer key and solution prose.
// Juxtaposed letters denote decimal digits; fixed numerals may equal a letter's digit.
export function solveCryptarithm(model) {
  const exprs = model.equations.flat();
  const letters = [...new Set(exprs.join('').match(/[A-Z]/g) || [])];
  const leading = new Set(exprs.flatMap(e => e.split(/[+*\-]/)).filter(w => w.length > 1).map(w => w[0]));
  const word = (w, a) => Number([...w].map(c => a[c] ?? c).join(''));
  const evaluate = (expression, a) => {
    if (!/^[A-Z0-9]+(?:[+*\-][A-Z0-9]+)*$/.test(expression)) throw new Error('Invalid model expression');
    // These source models use sums/differences OR a single multiplication.
    if (expression.includes('*')) {
      if (/[+\-]/.test(expression)) throw new Error('Mixed precedence needs an explicit model');
      return expression.split('*').reduce((v,w) => v * word(w,a), 1);
    }
    const tokens = expression.split(/([+\-])/);
    let result = word(tokens[0],a);
    for(let i=1;i<tokens.length;i+=2) result += (tokens[i]==='+'?1:-1)*word(tokens[i+1],a);
    return result;
  };
  const gcd = (a,b) => b ? gcd(b,a%b) : Math.abs(a);
  const answers = new Set();
  let assignments = 0;
  function visit(a, used, index) {
    if(index === letters.length) {
      if(!model.equations.every(([l,r])=>evaluate(l,a)===evaluate(r,a))) return;
      assignments++;
      if(Array.isArray(model.target)) {
        let n=evaluate(model.target[0],a), d=evaluate(model.target[1],a);
        if(!d) throw new Error('Undefined target');
        const g=gcd(n,d); answers.add(`${n/g}/${d/g}`);
      } else answers.add(String(evaluate(model.target,a)));
      return;
    }
    const c=letters[index];
    for(let d=0;d<10;d++) {
      if(used.has(d)||(d===0&&leading.has(c))) continue;
      a[c]=d; used.add(d); visit(a,used,index+1); used.delete(d); delete a[c];
    }
  }
  visit({},new Set(),0);
  return {assignments, answers:[...answers]};
}
