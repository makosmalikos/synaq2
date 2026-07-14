import React, { useEffect, useState } from 'react';
import { useLang } from './i18n.jsx';
import { auth, getAttempts, getMocks, getSolved } from './firebase.js';

export default function Progress() {
  const { t } = useLang();
  const [stat, setStat] = useState(null);
  const [mocks, setMocks] = useState([]);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [att, mk, sv] = await Promise.all([
          getAttempts(auth.currentUser.uid),
          getMocks(auth.currentUser.uid),
          getSolved(auth.currentUser.uid),
        ]);
        // «Шешілген есеп» — сколько РАЗНЫХ задач ребёнок прошёл, верно или нет.
        // Ошибся — задача всё равно решалась, счётчик не должен стоять на нуле.
        // Точность считается отдельно, по всем попыткам.
        const solved = sv.length || new Set(att.map(a => a.qid)).size;
        const right = sv.filter(x => x.correct).length;
        const attempted = att.length, correct = att.filter(a => a.correct).length;
        setStat({
          solved,
          right,
          acc: attempted ? Math.round(correct / attempted * 100) : 0,
        });
        setMocks(mk.sort((a, b) => (b.at?.seconds || 0) - (a.at?.seconds || 0)));
      } catch { setStat({ solved: 0, right: 0, acc: 0 }); }
    })();
  }, []);

  if (open) return (
    <main>
      <button className="link" onClick={() => setOpen(null)}>{t('ui.40')}</button>
      <h1 style={{ marginBottom: 4 }}>{open.title || 'Мок-тест'}</h1>
      <p className="kicker">Талдау · {open.score}/{open.gradable} балл</p>
      {open.review ? (
        <ol className="review">
          {open.review.map((r) => (
            <li key={r.num} className={r.correct ? 'ok' : 'no'}>
              №{r.num}: сенің «{r.your ?? '—'}» · дұрыс «{r.answer ?? '?'}»
            </li>
          ))}
        </ol>
      ) : <p className="muted">{t('ui.41')}</p>}
    </main>
  );

  return (
    <main>
      <p className="kicker">{t('ui.42')}</p>
      <h1>{t('ui.43')}</h1>
      <div className="card" style={{ marginTop: 16 }}>
        {!stat ? <span className="muted">{t('ui.44')}</span> : (
          <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>
            <Stat n={stat.solved} label="шешілген есеп" />
            <Stat n={stat.right} label="дұрыс шығарған" />
            <Stat n={stat.acc + '%'} label="дұрыс жауап" />
            <Stat n={mocks.length} label="мок-тест" />
          </div>
        )}
      </div>
      {mocks.length > 0 && (
        <>
          <p className="kicker" style={{ marginTop: 26 }}>{t('ui.45')}</p>
          <div className="list">
            {mocks.map((m, k) => (
              <div className="row-item" key={k} onClick={() => setOpen(m)}>
                <b>{m.title || 'Мок-тест'}</b>
                <span className="rt">{m.score}/{m.gradable} балл · талдау →</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
const Stat = ({ n, label }) => (
  <div>
    <div style={{ font: "700 30px 'Lora',serif", lineHeight: 1 }}>{n}</div>
    <div style={{ font: "500 11px 'IBM Plex Mono',monospace", color: '#6B655B', marginTop: 6 }}>{label}</div>
  </div>
);
