import React from 'react';

export default function Brand({ className = '', compact = false }) {
  return (
    <span className={`brand-mark${compact ? ' compact' : ''}${className ? ` ${className}` : ''}`} aria-label="SYNAQ">
      <span className="brand-glyph" aria-hidden="true">
        <img src="/brands/synaq-mark.png" alt="" />
      </span>
      <b>SYNAQ</b>
    </span>
  );
}
