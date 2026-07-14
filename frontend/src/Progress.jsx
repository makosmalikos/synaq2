import React, { useEffect, useState } from 'react';
import { useLang } from './i18n.jsx';
import { auth, getAttempts, getMocks, getSolved } from './firebase.js';

export default function Progress() {
  const { t } = useLang();
  const [stat, setStat] = useState(null);
  const [mocks, setMocks] = useState([]);
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState(null);      // раскрытая задача в разборе

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
      <button className="link" onClick={() => { setOpen(null); setQ(null); }}>{t('ui.40')}</button>
      <h1 style={{ marginBottom: 4 }}>{open.school || 'Мок-тест'}</h1>
      <p className="kicker">
        {fmtDate(open.at)} · {open.score}/{open.gradable} балл
        {open.spentSec ? ` · ${fmtSpent(open.spentSec)}` : ''}
      </p>

      {/* қай тақырыптар ақсайды */}
      {open.review && <Weak review={open.review} />}

      {open.review ? (
        <div className="list" style={{ marginTop: 18 }}>
          {open.review.map((r) => {
            const on = q === r.num;
            return (
              <div key={r.num} style={{ borderBottom: '1px solid var(--line)' }}>
                <div onClick={() => setQ(on ? null : r.num)}
                  style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '13px 0', cursor: 'pointer' }}>
                  <span style={{ font: "600 13px 'IBM Plex Mono',monospace", color: r.correct ? '#4C7A4E' : '#B0342B' }}>
                    {r.correct ? '✓' : '✗'} №{r.num}
                  </span>
                  <span className="muted" style={{ fontSize: 13, flex: 1 }}>
                    сенің «{r.your ?? '—'}» · дұрыс «{r.answer ?? '?'}»
                  </span>
                  <span className="muted" style={{ fontSize: 13 }}>{on ? '▲' : '▼'}</span>
                </div>
                {on && (
                  <div style={{ padding: '0 0 16px' }}>
                    <Stmt text={r.statement} />
                    {r.image && <img className="fig" src={r.image} alt="сурет" />}
                    {r.solution && <p className="muted" style={{ margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.55 }}>{r.solution}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
                <div style={{ flex: 1 }}>
                  <b>{m.school || 'Мок-тест'}</b>
                  <div style={{ font: "500 12px 'IBM Plex Mono',monospace", color: '#9A9384', marginTop: 4 }}>
                    {fmtDate(m.at)}{m.spentSec ? ` · ${fmtSpent(m.spentSec)}` : ''}
                  </div>
                </div>
                <span className="rt">{m.score}/{m.gradable} балл →</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
// Firestore-уақыты → «14 шілде, 19:32»
function fmtDate(at) {
  const ms = at?.seconds ? at.seconds * 1000 : (at ? Date.parse(at) : NaN);
  if (!ms || Number.isNaN(ms)) return '';
  return new Date(ms).toLocaleString('kk-KZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}
const fmtSpent = (s) => `${Math.floor(s / 60)} мин ${String(s % 60).padStart(2, '0')} сек`;

// Әлсіз тақырыптар: қай тақырыпта қате көп
function Weak({ review }) {
  const by = {};
  review.forEach((r) => {
    const k = r.topic || '—';
    by[k] = by[k] || { all: 0, bad: 0 };
    by[k].all++; if (!r.correct) by[k].bad++;
  });
  const weak = Object.entries(by).filter(([, v]) => v.bad).sort((a, b) => b[1].bad - a[1].bad).slice(0, 4);
  if (!weak.length) return null;
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <p className="kicker" style={{ margin: '0 0 10px' }}>Әлсіз тақырыптар</p>
      {weak.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
          <span>{TOPIC_NAME[k] || k}</span>
          <span className="muted">{v.bad} қате / {v.all} есеп</span>
        </div>
      ))}
    </div>
  );
}

const TOPIC_NAME = {
  eq: 'Теңдеулер', num: 'Сандар және бөлінгіштік', work: 'Жұмыс және өнімділік',
  ratio: 'Қатынастар, қозғалыс', geo: 'Геометрия', frac: 'Есептеулер, бөлшектер',
  pct: 'Пайыздар', sys: 'Теңсіздіктер, жүйелер', seq: 'Тізбектер', spat: 'Кеңістіктік ойлау',
  comb: 'Логика', kolzar: 'Колхар', lang_kaz: 'Қазақ тілі', lang_rus: 'Орыс тілі', lang_eng: 'Ағылшын тілі',
};

// Шартты абзацтарға бөліп шығарамыз (тілдік есептерде мәтін мен сұрақ бөлек тұрады).
const Stmt = ({ text }) => (
  <>
    {String(text || '').split(/\n{2,}/).map((p, i) => (
      <p className="stmt" key={i} style={i ? { marginTop: 14 } : undefined}>{p}</p>
    ))}
  </>
);

const Stat = ({ n, label }) => (
  <div>
    <div style={{ font: "700 30px 'Lora',serif", lineHeight: 1 }}>{n}</div>
    <div style={{ font: "500 11px 'IBM Plex Mono',monospace", color: '#6B655B', marginTop: 6 }}>{label}</div>
  </div>
);
