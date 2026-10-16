import React, { useCallback, useEffect, useState } from 'react';
import { useLang } from './i18n.jsx';
import { lessonsCall, lessonError, fmtDay, fmtTime } from './lessonsApi.js';

// Родитель видит записи ребёнка, может открыть ссылку, отменить урок или пожаловаться.
export default function ParentLessons() {
  const { lang } = useLang();
  const text = (ru, kk) => (lang === 'ru' ? ru : kk);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setData(await lessonsCall({ action: 'overview' })); setError(''); }
    catch (e) { setError(lessonError(e.message, text)); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id); }, [load]);
  if (!data) return error ? <div className="card" style={{ marginTop: 16 }}>{error}</div> : null;
  const act = async (body, after) => {
    try { const r = await lessonsCall(body); if (after) after(r); await load(); } catch (e) { setError(lessonError(e.message, text)); }
  };
  const { plan, lessons, now } = data;
  const upcoming = lessons.filter((l) => l.status === 'booked' && l.endAt > now).sort((a, b) => a.startAt - b.startAt);
  const done = lessons.filter((l) => l.status === 'completed').length;
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <p className="kicker" style={{ margin: 0 }}>{text('Уроки с наставником', 'Тәлімгермен сабақтар')}</p>
      <p style={{ margin: '6px 0 12px' }}>{text(`Осталось уроков в этом месяце: ${plan.left} из ${plan.quota}. Записывается ребёнок в своём кабинете.`, `Осы айда қалған сабақ: ${plan.left} / ${plan.quota}. Баланың өз кабинетінде жазылады.`)}</p>
      {error && <p role="alert" style={{ color: 'var(--accent)' }}>{error}</p>}
      {!upcoming.length && <p className="muted">{text('Ближайших уроков нет.', 'Жақын сабақ жоқ.')}</p>}
      {upcoming.map((l) => (
        <div key={l.id} style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
          <b>{fmtDay(l.startAt, lang)}, {fmtTime(l.startAt)}</b> · {l.mentorName}
          <div className="muted">{l.topic}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button className="btn" type="button" disabled={!l.canJoin} onClick={() => act({ action: 'join', id: l.id }, (r) => window.open(r.url, '_blank', 'noopener,noreferrer'))}>
              {l.canJoin ? text('Открыть урок', 'Сабақты ашу') : text('Ссылка за 10 минут до урока', 'Сілтеме 10 минут бұрын')}</button>
            {l.canCancel && <button className="btn ghost" type="button" onClick={() => {
              if (window.confirm(l.freeCancel ? text('Отменить урок? Он вернётся в пакет.', 'Сабақты болдырмау керек пе? Ол пакетке қайтады.') : text('До урока меньше 24 часов — урок сгорит. Отменить?', 'Сабаққа 24 сағаттан аз — сабақ жанады. Болдырамыз ба?'))) act({ action: 'cancel', id: l.id });
            }}>{text('Отменить', 'Болдырмау')}</button>}
          </div>
        </div>))}
      <p className="muted" style={{ margin: '12px 0 0' }}>{text(`Проведено уроков: ${done}`, `Өткен сабақ: ${done}`)}</p>
    </div>
  );
}
