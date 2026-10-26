// Interpret only explicit canonical math and rectangular tables from the bank
// importer. Answer strings stay unchanged; this tree is for display only.
const mathematical = /^[0-9A-Za-z₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹π√□\s+\-−*×·÷^().,:/|]+$/u;
function canonicalMath(value) {
  if (!mathematical.test(value)) return false;
  if (!value.includes('|')) return true;
  // Support one complete modulus per fraction operand. Bars cannot straddle
  // the main fraction bar or contain incomplete groups; unsupported forms stay text.
  const parts = value.split('|');
  if (parts.length !== 3 || !/[0-9A-Za-z₀₁₂₃₄₅₆₇₈₉π√□]/u.test(parts[1])) return false;
  let depth = 0;
  for (const character of parts[1]) {
    if (character === '(') depth++;
    if (character === ')' && --depth < 0) return false;
  }
  return depth === 0;
}
function closeParen(text, start) {
  let depth = 0;
  for (let i = start; i < text.length && i - start <= 240; i++) {
    if (text[i] === '(') depth++;
    if (text[i] === ')' && --depth === 0) return i;
  }
  return -1;
}
function ungroup(text) {
  const value = text.trim();
  return value[0] === '(' && closeParen(value, 0) === value.length - 1 && !value.includes('/')
    ? value.slice(1, -1) : value;
}
function group(text) {
  const inner = text.slice(1, -1);
  let depth = 0;
  const slashes = [];
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === '(') depth++;
    if (inner[i] === ')') depth--;
    if (inner[i] === '/' && depth === 0) slashes.push(i);
  }
  if (slashes.length === 1) {
    const at = slashes[0], n = ungroup(inner.slice(0, at)), d = ungroup(inner.slice(at + 1));
    if (n && d && canonicalMath(n) && canonicalMath(d)) {
      return { type: 'fraction', numerator: mathFragments(n), denominator: mathFragments(d) };
    }
  }
  const mixed = inner.match(/^(\d+)\s*\+\s*(\(\d+\/\d+\))$/);
  if (mixed) {
    const fraction = mixed[2].match(/^\((\d+)\/(\d+)\)$/);
    if (BigInt(fraction[2]) > 0n && BigInt(fraction[1]) < BigInt(fraction[2])) {
      return { type: 'mixed', whole: mixed[1], fraction: group(mixed[2]) };
    }
  }
  return null;
}
function tableAt(text, start) {
  if (start > 0 && text[start - 1] !== '\n') return null;
  const lines = [];
  let offset = start, end = start;
  while (offset < text.length && lines.length <= 25 && offset - start <= 6000) {
    const newline = text.indexOf('\n', offset);
    const stop = newline < 0 ? text.length : newline;
    const line = text.slice(offset, stop).trim();
    if (!line.startsWith('|') || !line.endsWith('|')) break;
    const cells = line.slice(1, -1).split('|').map(cell => cell.trim());
    if (cells.length < 2 || cells.length > 12 || cells.some(cell => !cell || cell.length > 120)) return null;
    lines.push(cells); end = stop;
    if (newline < 0) break;
    offset = newline + 1;
  }
  if (lines.length < 3 || lines.length > 25) return null;
  const width = lines[0].length;
  if (lines.some(row => row.length !== width) || !lines[1].every(cell => /^---+$/.test(cell))) return null;
  const rows = [lines[0], ...lines.slice(2)];
  return { node: { type: 'table', rows: rows.map(row => row.map(mathFragments)) }, end };
}

export function mathFragments(value) {
  const text = String(value ?? ''), nodes = [];
  let plain = '';
  const flush = () => { if (plain) { nodes.push({ type: 'text', value: plain }); plain = ''; } };
  for (let i = 0; i < text.length; i++) {
    // Canonical vector names use a native arrow spanning the full name. Keep
    // the grammar small so ordinary prose and unsupported markup stay literal.
    if (text.startsWith('vector(', i) && (i === 0 || !/[\p{L}_]/u.test(text[i - 1]))) {
      const match = text.slice(i, i + 12).match(/^vector\(([A-Za-z]{1,3})\)/);
      if (match) {
        flush(); nodes.push({ type: 'vector', content: [{ type: 'text', value: match[1] }] }); i += match[0].length - 1; continue;
      }
    }
    if (text[i] === '|') {
      const table = tableAt(text, i);
      if (table) { flush(); nodes.push(table.node); i = table.end - 1; continue; }
    }
    if (text.startsWith('overline(', i) && (i === 0 || !/[\p{L}_]/u.test(text[i - 1]))) {
      const end = closeParen(text, i + 8);
      const content = end >= 0 ? text.slice(i + 9, end) : '';
      if (content.trim() && !/[\r\n]/.test(content)) {
        flush(); nodes.push({ type: 'overline', content: mathFragments(content) }); i = end; continue;
      }
    }
    if (text[i] === '(') {
      const end = closeParen(text, i);
      const parsed = end >= 0 ? group(text.slice(i, end + 1)) : null;
      if (parsed) {
        // A mixed numeral is one value. Keep its original group when it is
        // multiplied by juxtaposition or raised to a power: (2 1/4)y, (2 1/4)^2.
        // Dropping these parentheses would make the scope of x / the power unclear.
        if (parsed.type === 'mixed') {
          const before = text.slice(0, i).trimEnd().slice(-1);
          const after = text.slice(end + 1).trimStart()[0] || '';
          if (/[0-9A-Za-zπ√)\]]/u.test(before) || /[0-9A-Za-zπ√(^¹²³⁴⁵⁶⁷⁸⁹⁰]/u.test(after)) {
            parsed.parenthesized = true;
          }
        }
        flush(); nodes.push(parsed); i = end; continue;
      }
    }
    plain += text[i];
  }
  flush();
  return nodes;
}
