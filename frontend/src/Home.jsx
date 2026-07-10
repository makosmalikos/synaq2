import React, { useEffect, useState } from 'react';
import { auth, getAttempts, getMocks } from './firebase.js';

// Главный экран + прогресс: сколько решено, % верных, история мок-тестов с разбором.
export default function Home({ go }) {
  const [stat, setStat] = useState(null);
  const [mocks, setMocks] = useState([]);
  const [open, setOpen] = useState(null); // выбранный мок для разбора

  useEffect(() => {
    (async () => {
      try {
        const [att, mk] = await Promise.all([getAttempts(auth.currentUser.uid), getMocks(auth.currentUser.uid)]);
        const solved = new Set(att.filter(a => a.correct).map(a => a.qid)).size;
        const attempted = att.length;
        const correct = att.filter(a => a.correct).length;
        const acc = attempted ? Math.round(correct / attempted * 100) : 0;
        setStat({ solved, acc });
        setMocks(mk.sort((a, b) => (b.at?.seconds || 0) - (a.at?.seconds || 0)));
      } catch { setStat({ solved: 0, acc: 0 }); }
    })();
  }, []);

  if (open) return (
    <main>
      <button className="link" onClick={() => setOpen(null)}>← Прогресс</button>
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
      ) : <p className="muted">Бұл сынақтың толық талдауы сақталмаған.</p>}
    </main>
  );

  return (
    <main>
      <p className="kicker">Бүгінгі дайындық</p>
      <div className="hero-card">
        <h2>Бүгінгі дайындықты бастайық</h2>
        <p>Тақырып таңдап, есептерді шығар. Әр қатеден кейін толық талдау болады.</p>
        <button className="btn accent" onClick={() => go('training')}>Бастау →</button>
      </div>

      <div className="card" style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="kicker" style={{ margin: 0 }}>Апталық сынақ</p>
          <div style={{ font: "600 15px 'Golos Text'", marginTop: 4 }}>Осы аптаның нұсқасы дайын</div>
        </div>
        <button className="btn ghost" onClick={() => go('mock')}>Өту</button>
      </div>

      <p className="kicker" style={{ marginTop: 28 }}>Прогресс</p>
      <div className="card">
        {!stat ? <span className="muted">Жүктелуде…</span> : (
          <div style={{ display: 'flex', gap: 30 }}>
            <Stat n={stat.solved} label="шешілген есеп" />
            <Stat n={stat.acc + '%'} label="дұрыс жауап" />
            <Stat n={mocks.length} label="мок-тест" />
          </div>
        )}
      </div>

      {mocks.length > 0 && (
        <>
          <p className="kicker" style={{ marginTop: 24 }}>Мок-тест тарихы</p>
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
    <div style={{ font: "700 28px 'Lora',serif", lineHeight: 1 }}>{n}</div>
    <div style={{ font: "500 11px 'IBM Plex Mono',monospace", color: '#6B655B', marginTop: 6 }}>{label}</div>
  </div>
);
