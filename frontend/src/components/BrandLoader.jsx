import React from 'react';
import { useLang } from '../i18n.jsx';
import './BrandLoader.css';

export default function BrandLoader({ fullScreen = false, compact = false }) {
  const { t } = useLang();

  return (
    <div className={`brand-loader${fullScreen ? ' brand-loader--fullscreen' : ''}${compact ? ' brand-loader--compact' : ''}`}
      role="status" aria-live="polite" aria-atomic="true">
      <div className="brand-loader__visual" aria-hidden="true">
        <span className="brand-loader__halo" />
        <span className="brand-loader__orbit"><i /><i /></span>
        <span className="brand-loader__tile"><span className="brand-loader__glyph" /></span>
      </div>
      <span className="brand-loader__wordmark" aria-hidden="true">SYNAQ</span>
      <span className="brand-loader__label">{t('common.loading')}</span>
      <span className="brand-loader__track" aria-hidden="true"><i /></span>
    </div>
  );
}
