// Admin Panel: ручное добавление задач в банк. Без AI — тему, школу, сложность,
// тип, условие, варианты, ответ и разбор вводит сам администратор. Платформа
// только валидирует и сохраняет в существующую структуру банка (см. data.js).
//
// Поток: выбор темы → форма → предпросмотр → «Сохранить задачу» → api/admin-task.js
// (проверяет Firebase ID token и email администратора, затем пишет в Firestore
// bankTasks). До нажатия «Сохранить задачу» ничего не отправляется на сервер.
import React, { useState } from 'react';
import { useLang } from './i18n.jsx';
import { auth, logout } from './firebase.js';
import Brand from './Brand.jsx';

const Logo = () => <div className="logo"><Brand compact /></div>;

// Та же taxonomy, что и в data.js (topics) + bank.js (EXTRA_TOPICS) — новых тем
// не создаём, только берём существующие id. Список школ на тему — это UI-знание
// о том, в каком экзамене тема встречается (для валидации совпадения тема↔школа).
export const TOPICS = [
  { id: 'eq',       block: 'math',  name: 'Теңдеулер және ықшамдау',         schools: ['РФМШ', 'НИШ'] },
  { id: 'num',      block: 'math',  name: 'Сандар және бөлінгіштік',          schools: ['РФМШ', 'НИШ'] },
  { id: 'work',     block: 'math',  name: 'Жұмыс және өнімділік',             schools: ['РФМШ', 'НИШ'] },
  { id: 'ratio',    block: 'math',  name: 'Бөліктер, қатынастар, қозғалыс',   schools: ['РФМШ', 'НИШ'] },
  { id: 'geo',      block: 'math',  name: 'Геометрия',                        schools: ['РФМШ', 'НИШ'] },
  { id: 'frac',     block: 'math',  name: 'Есептеулер және бөлшектер',        schools: ['РФМШ', 'НИШ'] },
  { id: 'pct',      block: 'math',  name: 'Пайыздар',                         schools: ['РФМШ', 'НИШ'] },
  { id: 'sys',      block: 'math',  name: 'Теңдеулер жүйесі, теңсіздіктер',   schools: ['РФМШ', 'НИШ', 'БИЛ'] },
  { id: 'kolzar',   block: 'math',  name: 'Сандық салыстыру (колхар)',        schools: ['НИШ'] },
  { id: 'seq',      block: 'logic', name: 'Фигуралар/сандар тізбегі',         schools: ['РФМШ', 'НИШ'] },
  { id: 'mtx',      block: 'logic', name: 'Матрицалар және аналогиялар',      schools: ['РФМШ', 'НИШ'] },
  { id: 'spat',     block: 'logic', name: 'Кеңістіктік ойлау',                schools: ['РФМШ', 'НИШ'] },
  { id: 'comb',     block: 'logic', name: 'Сандық/комбинаторлық логика',      schools: ['РФМШ', 'НИШ'] },
  { id: 'lang_kaz', block: 'lang',  name: 'Қазақ тілі',                       schools: ['НИШ'] },
  { id: 'lang_rus', block: 'lang',  name: 'Орыс тілі',                        schools: ['НИШ'] },
  { id: 'lang_eng', block: 'lang',  name: 'Ағылшын тілі',                     schools: ['НИШ'] },
];
const BLOCK_LABEL = { math: 'Математика', logic: 'Логика', lang: 'Тілдер' };
const BLOCKS = ['math', 'logic', 'lang'];

const DIFFICULTIES = [1, 2, 3, 4, 5];
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const emptyForm = (school = '') => ({
  school,
  difficulty: 2,
  type: 'open', // 'open' | 'mcq'
  statement: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  answer: '',
  solution: '',
});

export default function Admin({ onExit }) {
  const { t } = useLang();
  const [topic, setTopic] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [step, setStep] = useState('topic'); // topic | form | preview
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  const exit = async () => {
    if (!window.confirm('Шығуды растайсыз ба?')) return;
    await (onExit || logout)();
  };

  const pickTopic = (tp) => {
    setTopic(tp);
    setForm(emptyForm(tp.schools[0]));
    setStep('form');
    setErr('');
  };

  const setOption = (i, v) => setForm((f) => {
    const options = [...f.options];
    options[i] = v;
    return { ...f, options };
  });
  const addOption = () => setForm((f) => (f.options.length >= MAX_OPTIONS ? f : { ...f, options: [...f.options, ''] }));
  const removeOption = (i) => setForm((f) => {
    if (f.options.length <= MIN_OPTIONS) return f;
    const options = f.options.filter((_, idx) => idx !== i);
    const correctIndex = f.correctIndex === i ? 0 : f.correctIndex > i ? f.correctIndex - 1 : f.correctIndex;
    return { ...f, options, correctIndex };
  });

  const validateForm = () => {
    if (!topic) return t('admin.err.topic');
    if (!topic.schools.includes(form.school)) return t('admin.err.school');
    if (!DIFFICULTIES.includes(Number(form.difficulty))) return t('admin.err.difficulty');
    if (!form.statement.trim()) return t('admin.err.statement');
    if (form.type === 'mcq') {
      const cleaned = form.options.map((o) => o.trim()).filter(Boolean);
      if (cleaned.length < MIN_OPTIONS) return t('admin.err.options');
      if (new Set(cleaned).size !== cleaned.length) return t('admin.err.dupOptions');
      const correct = (form.options[form.correctIndex] || '').trim();
      if (!correct) return t('admin.err.answer');
    } else if (!form.answer.trim()) {
      return t('admin.err.answer');
    }
    if (!form.solution.trim()) return t('admin.err.solution');
    return '';
  };

  const goPreview = () => {
    const e = validateForm();
    if (e) { setErr(e); return; }
    setErr('');
    setStep('preview');
  };

  const buildPayload = () => {
    const isMcq = form.type === 'mcq';
    const options = isMcq ? form.options.map((o) => o.trim()).filter(Boolean) : null;
    const answer = isMcq ? (form.options[form.correctIndex] || '').trim() : form.answer.trim();
    return {
      topic: topic.id,
      school: form.school,
      difficulty: Number(form.difficulty),
      type: form.type,
      statement: form.statement.trim(),
      options,
      answer,
      solution: form.solution.trim(),
    };
  };

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const idToken = await auth.currentUser.getIdToken();
      const r = await fetch('/api/admin-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(buildPayload()),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'save_failed');
      setJustSaved(true);
      setForm(emptyForm());
      setTopic(null);
      setStep('topic');
    } catch (e) {
      setErr(`${t('admin.err.save')}${e.message ? ` (${e.message})` : ''}`);
    }
    setBusy(false);
  };

  return (
    <div className="app">
      <header>
        <Logo />
        <button className="logout" onClick={exit}>{t('common.exit')}</button>
      </header>
      <main>
        <p className="kicker">{t('admin.kicker')}</p>

        {justSaved && step === 'topic' && (
          <div className="card" style={{ borderColor: 'var(--green)', background: '#EEF5EC', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 14 }}>{t('admin.savedMsg')}</p>
          </div>
        )}

        {step === 'topic' && <TopicPicker t={t} onPick={pickTopic} />}

        {step === 'form' && topic && (
          <TaskForm
            t={t} topic={topic} form={form} setForm={setForm}
            setOption={setOption} addOption={addOption} removeOption={removeOption}
            err={err}
            onBack={() => { setStep('topic'); setTopic(null); setErr(''); }}
            onPreview={goPreview}
          />
        )}

        {step === 'preview' && topic && (
          <Preview
            t={t} topic={topic} form={form} err={err} busy={busy}
            onEdit={() => { setErr(''); setStep('form'); }}
            onSave={save}
          />
        )}
      </main>
    </div>
  );
}

function TopicPicker({ t, onPick }) {
  return (
    <div>
      <h1 style={{ margin: '0 0 4px' }}>{t('admin.addTask')}</h1>
      <p className="muted" style={{ margin: '0 0 20px' }}>{t('admin.pickTopic')}</p>
      {BLOCKS.map((b) => (
        <div key={b} style={{ marginBottom: 18 }}>
          <p className="kicker">{BLOCK_LABEL[b]}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {TOPICS.filter((tp) => tp.block === b).map((tp) => (
              <div key={tp.id} className="card click" onClick={() => onPick(tp)}>
                <div style={{ font: "600 15px 'Golos Text'" }}>{tp.name}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{tp.schools.join(' · ')}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskForm({ t, topic, form, setForm, setOption, addOption, removeOption, err, onBack, onPreview }) {
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div>
      <button className="btn ghost" style={{ marginBottom: 14 }} onClick={onBack}>{t('common.back')}</button>
      <p className="kicker">{topic.name}</p>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lab}>{t('admin.school')}</label>
            <select style={inp} value={form.school} onChange={(e) => set('school', e.target.value)}>
              {topic.schools.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lab}>{t('admin.difficulty')}</label>
            <select style={inp} value={form.difficulty} onChange={(e) => set('difficulty', Number(e.target.value))}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={lab}>{t('admin.type')}</label>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={radioLab}>
              <input type="radio" checked={form.type === 'open'} onChange={() => set('type', 'open')} /> {t('admin.typeOpen')}
            </label>
            <label style={radioLab}>
              <input type="radio" checked={form.type === 'mcq'} onChange={() => set('type', 'mcq')} /> {t('admin.typeMcq')}
            </label>
          </div>
        </div>

        <div>
          <label style={lab}>{t('admin.statement')}</label>
          <textarea style={{ ...inp, minHeight: 130, resize: 'vertical' }} value={form.statement}
            onChange={(e) => set('statement', e.target.value)} placeholder={t('admin.statementPh')} />
        </div>

        {form.type === 'mcq' && (
          <div>
            <label style={lab}>{t('admin.options')}</label>
            {form.options.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input type="radio" name="correctOption" checked={form.correctIndex === i}
                  onChange={() => set('correctIndex', i)} title={t('admin.markCorrect')} />
                <span style={{ font: "600 13px 'IBM Plex Mono',monospace", width: 16 }}>{OPTION_LETTERS[i]}</span>
                <input style={{ ...inp, flex: 1 }} value={o} onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`${t('admin.option')} ${OPTION_LETTERS[i]}`} />
                {form.options.length > MIN_OPTIONS && (
                  <button type="button" className="btn ghost" style={{ padding: '6px 10px' }} onClick={() => removeOption(i)}>×</button>
                )}
              </div>
            ))}
            {form.options.length < MAX_OPTIONS && (
              <button type="button" className="btn ghost" onClick={addOption}>{t('admin.addOption')}</button>
            )}
            <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>{t('admin.markCorrectHint')}</p>
          </div>
        )}

        {form.type === 'open' && (
          <div>
            <label style={lab}>{t('admin.answer')}</label>
            <input style={inp} value={form.answer} onChange={(e) => set('answer', e.target.value)} placeholder={t('admin.answerPh')} />
          </div>
        )}

        <div>
          <label style={lab}>{t('admin.solution')}</label>
          <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={form.solution}
            onChange={(e) => set('solution', e.target.value)} placeholder={t('admin.solutionPh')} />
        </div>

        {err && <p style={{ color: 'var(--accent)', fontSize: 13, margin: 0 }}>{err}</p>}
        <button className="btn accent" onClick={onPreview}>{t('admin.preview')}</button>
      </div>
    </div>
  );
}

function Preview({ t, topic, form, err, busy, onEdit, onSave }) {
  const isMcq = form.type === 'mcq';
  const options = isMcq ? form.options.map((o) => o.trim()).filter(Boolean) : null;
  const answer = isMcq ? (form.options[form.correctIndex] || '').trim() : form.answer.trim();
  return (
    <div>
      <p className="kicker">{t('admin.previewKicker')}</p>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="tag">{form.school}</span>
          <span className="tag">{topic.name}</span>
          <span className="tag">{t('admin.difficulty')}: {form.difficulty}</span>
          <span className="tag">{isMcq ? t('admin.typeMcq') : t('admin.typeOpen')}</span>
        </div>

        <div style={{ font: "600 16px 'Golos Text'", marginTop: 4, whiteSpace: 'pre-wrap' }}>{form.statement}</div>

        {isMcq && (
          <ul style={{ margin: '4px 0', paddingLeft: 18 }}>
            {options.map((o, i) => (
              <li key={i} style={{ fontWeight: o === answer ? 700 : 400 }}>
                {OPTION_LETTERS[i]}. {o}{o === answer ? ` — ${t('admin.correctMark')}` : ''}
              </li>
            ))}
          </ul>
        )}

        <div>
          <p className="kicker" style={{ margin: '10px 0 4px' }}>{t('admin.answer')}</p>
          <div>{answer}</div>
        </div>
        <div>
          <p className="kicker" style={{ margin: '10px 0 4px' }}>{t('admin.solution')}</p>
          <div className="muted" style={{ whiteSpace: 'pre-wrap' }}>{form.solution}</div>
        </div>

        {err && <p style={{ color: 'var(--accent)', fontSize: 13, margin: 0 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn ghost" disabled={busy} onClick={onEdit}>{t('admin.edit')}</button>
          <button className="btn accent" disabled={busy} onClick={onSave}>{busy ? '…' : t('admin.save')}</button>
        </div>
      </div>
    </div>
  );
}

const lab = { display: 'block', font: "500 11px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: '#9A9384', marginBottom: 6 };
const inp = { width: '100%', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 8, background: '#fff', font: "500 15px 'Golos Text'", color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' };
const radioLab = { display: 'flex', alignItems: 'center', gap: 6, font: "500 14px 'Golos Text'", cursor: 'pointer' };
