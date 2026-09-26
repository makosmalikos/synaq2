import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { explain, explainError } from '../explain.js';

// Блок разбора под задачей.
// Короткое «шешім» из банка — если оно вообще есть (у 378 задач НИШ его нет).
// Ниже — полный разбор по шагам. Если ребёнок ошибся, он ещё и покажет,
// откуда взялся именно его ответ.
export default function Explain({ q, given = null }) {
  const { lang } = useLang();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const requestRef = useRef(0);
  const ru = lang === 'ru';
  useEffect(() => {
    requestRef.current += 1;
    setText(''); setErr(''); setBusy(false);
    return () => { requestRef.current += 1; };
  }, [q.id, q.qid, q.statement, given, lang]);

  const wrong = given != null && String(given).trim() !== '';

  async function run() {
    if (busy) return;
    const request = ++requestRef.current;
    setBusy(true); setErr(''); setText('');
    try {
      const value = await explain(q, { given: wrong ? given : null, lang });
      if (request === requestRef.current) setText(value);
    } catch (e) {
      if (request === requestRef.current) setErr(explainError(e.message, lang));
    }
    if (request === requestRef.current) setBusy(false);
  }

  return (
    <div style={{ marginTop: 14 }}>
      {q.solution ? (
        <div className="sol">
          <div className="lead">{ru ? 'Краткое решение' : 'Қысқа шешім'}</div>
          {q.solution}
        </div>
      ) : null}

      {!text && !busy && (
        <button className="btn ghost full" onClick={run} style={{ marginTop: q.solution ? 10 : 0 }}>
          {wrong ? (ru ? 'Почему ошибка? Объяснить подробно' : 'Неге қате болды? Толық түсіндір') : (ru ? 'Объяснить по шагам' : 'Қадам-қадам түсіндір')}
        </button>
      )}

      {busy && (
        <div className="sol" style={{ marginTop: 10 }}>
          <div className="lead">{ru ? 'Объяснение' : 'Түсіндірме'}</div>
          <span className="muted">{ru ? 'Подготавливаем…' : 'Дайындалуда…'}</span>
        </div>
      )}

      {text && (
        <div className="sol" style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>
          <div className="lead">{ru ? 'Подробное объяснение' : 'Толық түсіндірме'}</div>
          {text}
        </div>
      )}

      {err && <p style={{ color: 'var(--accent)', fontSize: 13, marginTop: 10 }}>{err}</p>}
    </div>
  );
}
