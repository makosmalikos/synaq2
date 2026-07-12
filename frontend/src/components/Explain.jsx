import React, { useState } from 'react';
import { explain, explainError } from '../explain.js';

// Блок разбора под задачей.
// Короткое «шешім» из банка — если оно вообще есть (у 378 задач НИШ его нет).
// Ниже — полный разбор по шагам. Если ребёнок ошибся, он ещё и покажет,
// откуда взялся именно его ответ.
export default function Explain({ q, given = null }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const wrong = given != null && String(given).trim() !== '';

  async function run() {
    setBusy(true); setErr(''); setText('');
    try {
      setText(await explain(q, { given: wrong ? given : null, lang: 'kk' }));
    } catch (e) {
      setErr(explainError(e.message));
    }
    setBusy(false);
  }

  return (
    <div style={{ marginTop: 14 }}>
      {q.solution ? (
        <div className="sol">
          <div className="lead">Қысқа шешім</div>
          {q.solution}
        </div>
      ) : null}

      {!text && !busy && (
        <button className="btn ghost full" onClick={run} style={{ marginTop: q.solution ? 10 : 0 }}>
          {wrong ? 'Неге қате болды? Толық түсіндір' : 'Қадам-қадам түсіндір'}
        </button>
      )}

      {busy && (
        <div className="sol" style={{ marginTop: 10 }}>
          <div className="lead">Түсіндірме</div>
          <span className="muted">Дайындалуда…</span>
        </div>
      )}

      {text && (
        <div className="sol" style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>
          <div className="lead">Толық түсіндірме</div>
          {text}
        </div>
      )}

      {err && <p style={{ color: 'var(--accent)', fontSize: 13, marginTop: 10 }}>{err}</p>}
    </div>
  );
}
