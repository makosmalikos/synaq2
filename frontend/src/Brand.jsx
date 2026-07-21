import React from 'react';

export default function Brand({ className = '', compact = false }) {
  return (
    <span className={`brand-mark${compact ? ' compact' : ''}${className ? ` ${className}` : ''}`} aria-label="SYNAQ">
      SYNAQ
    </span>
  );
}
