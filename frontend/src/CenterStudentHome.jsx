import React from 'react';
import { useLang } from './i18n.jsx';
import { centerError } from './centerApi.js';
import useCenterSnapshot from './useCenterSnapshot.js';
import CenterPortal from './CenterPortal.jsx';
import BrandLoader from './components/BrandLoader.jsx';

export default function CenterStudentHome({ view = 'home', membershipKey, name, onTrainTopic, onNavigate }) {
  const { lang } = useLang();
  const { data, error, loading, refresh } = useCenterSnapshot(undefined, membershipKey);
  return <section className="cp-student-shell"><div className="cp-refresh"><button onClick={refresh} disabled={loading}>{loading ? (lang === 'ru' ? 'Обновляем…' : 'Жаңартылуда…') : (lang === 'ru' ? 'Обновить' : 'Жаңарту')} ↻</button></div>{loading && !data && <BrandLoader />}{error && <p role="alert" className="cw-alert">{centerError(error, lang)}</p>}{data && <CenterPortal data={data} lang={lang} view={view} name={name} onTrainTopic={onTrainTopic} onNavigate={onNavigate} />}</section>;
}
