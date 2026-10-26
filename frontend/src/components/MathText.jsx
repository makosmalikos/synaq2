import React from 'react';
import { mathFragments } from '../mathPresentation.js';
import './MathText.css';

function mathLabel(node) {
  if (node.type === 'text') return node.value;
  if (node.type === 'overline') return `overline(${node.content.map(mathLabel).join('')})`;
  if (node.type === 'vector') return `vector(${node.content.map(mathLabel).join('')})`;
  if (node.type === 'table') return node.rows.map(row => row.map(cell => cell.map(mathLabel).join('')).join(', ')).join('; ');
  if (node.type === 'mixed') {
    const value = `${node.whole} ${mathLabel(node.fraction)}`;
    return node.parenthesized ? `(${value})` : value;
  }
  return `(${node.numerator.map(mathLabel).join('')})/(${node.denominator.map(mathLabel).join('')})`;
}

function MathNode({ node }) {
  if (node.type === 'text') return <mtext>{node.value}</mtext>;
  if (node.type === 'overline') return <mover accent="true"><mrow>{node.content.map((n, i) => <MathNode key={i} node={n} />)}</mrow><mo stretchy="true">¯</mo></mover>;
  if (node.type === 'vector') return <mover accent="true"><mrow>{node.content.map((n, i) => <MathNode key={i} node={n} />)}</mrow><mo stretchy="true">→</mo></mover>;
  if (node.type === 'table') return <mtable frame="solid" rowlines="solid" columnlines="solid" columnspacing="0.9em" rowspacing="0.45em">{node.rows.map((row, r) => <mtr key={r}>{row.map((cell, c) => <mtd key={c}><mrow>{cell.map((n, i) => <MathNode key={i} node={n} />)}</mrow></mtd>)}</mtr>)}</mtable>;

  if (node.type === 'mixed') return <mrow>{node.parenthesized && <mo>(</mo>}<mn>{node.whole}</mn><mspace width="0.12em" /><MathNode node={node.fraction} />{node.parenthesized && <mo>)</mo>}</mrow>;
  return <mfrac><mrow>{node.numerator.map((n, i) => <MathNode key={i} node={n} />)}</mrow><mrow>{node.denominator.map((n, i) => <MathNode key={i} node={n} />)}</mrow></mfrac>;
}

export default function MathText({ text }) {
  return <>{mathFragments(text).map((node, i) => node.type === 'text'
    ? <React.Fragment key={i}>{node.value}</React.Fragment>
    : <span className={node.type === 'table' ? 'math-inline math-table' : 'math-inline'} key={i}><math className="math-native" display={node.type === 'table' ? 'block' : 'inline'} aria-label={mathLabel(node)}><mstyle displaystyle="true"><MathNode node={node} /></mstyle></math></span>)}</>;
}
