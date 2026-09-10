import React from 'react';

export default function Brand({ className = '', compact = false }) {
  return (
    <span className={`brand-mark${compact ? ' compact' : ''}${className ? ` ${className}` : ''}`} aria-label="SYNAQ">
      <img src="/brands/synaq-mark.png" alt="" aria-hidden="true" />
      <b>SYNAQ</b>
    </span>
  );
}
