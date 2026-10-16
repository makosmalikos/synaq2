import React, { useEffect, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { lessonsCall } from '../lessonsApi.js';

// «Не понял задачу» — запоминает задачу, чтобы потом приложить её к уроку с наставником.
export default function UnclearButton({ q }) {
  const { lang } = useLang();
  const [state, setState] = useState('idle');
  useEffect(() => { setState('idle'); }, [q?.id]);
  if (!q?.id) return null;
  const mark = async () => {
    setState('saving');
    try { await lessonsCall({ action: 'unclear_add', qid: q.id, topic: q.topic || '' }); setState('done'); }
    catch { setState('error'); }
  };
  const text = lang === 'ru'
    ? { idle: 'Не понял задачу — разобрать с наставником', saving: '…', done: '✓ Запомнили. Приложите её к уроку в разделе «Наставник»', error: 'Не получилось, попробуйте ещё раз' }
    : { idle: 'Түсінбедім — тәлімгермен талдау', saving: '…', done: '✓ Сақталды. «Тәлімгер» бөлімінде сабаққа тіркеңіз', error: 'Болмады, қайталап көріңіз' };
  return <button type="button" className="btn ghost" style={{ marginTop: 10 }} disabled={state === 'saving' || state === 'done'} onClick={mark}>{text[state === 'error' ? 'error' : state]}</button>;
}
