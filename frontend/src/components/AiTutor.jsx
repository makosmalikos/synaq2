import React, { useEffect, useRef, useState } from 'react';
import { askTutor } from '../explain.js';
import { useLang } from '../i18n.jsx';

export default function AiTutor({ q, checked, given }) {
  const { lang } = useLang();
  const ru = lang === 'ru';
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);

  useEffect(() => {
    request.current += 1;
    setMessages([]); setInput(''); setBusy(false); setError('');
  }, [q.id, q.statement, lang]);

  useEffect(() => () => { request.current += 1; }, []);

  const labels = {
    hint: ru ? 'Дай мне одну подсказку' : 'Бір кеңес берші',
    simplify: ru ? 'Объясни решение проще' : 'Шешімді қарапайым түсіндір',
    similar: ru ? 'Покажи похожий пример' : 'Ұқсас мысал көрсет',
  };

  async function send(action, value) {
    const message = String(value || labels[action] || '').trim();
    if (!message || busy) return;
    const id = ++request.current;
    const prior = messages.slice(-6);
    setMessages((items) => [...items, { role: 'user', text: message }]);
    setInput(''); setBusy(true); setError('');
    try {
      const text = await askTutor(q, { action, message, history: prior, given, allowAnswer: checked, lang });
      if (id === request.current) setMessages((items) => [...items, { role: 'assistant', text }]);
    } catch (e) {
      if (id === request.current) setError(e.message === 'rate_limit'
        ? (ru ? 'Лимит AI-подсказок на сегодня закончился.' : 'Бүгінгі AI-кеңес лимиті аяқталды.')
        : (ru ? 'AI-репетитор сейчас недоступен. Попробуй ещё раз.' : 'AI-репетитор қазір қолжетімсіз. Қайталап көр.'));
    } finally {
      if (id === request.current) setBusy(false);
    }
  }

  return (
    <section className="ai-tutor" aria-label={ru ? 'AI-репетитор' : 'AI-репетитор'}>
      <header><span aria-hidden="true">✦</span><div><strong>SYNAQ AI</strong><small>{ru ? 'Репетитор по текущей задаче' : 'Осы есеп бойынша көмекші'}</small></div></header>
      <div className="ai-tutor-actions">
        {!checked && <button type="button" disabled={busy} onClick={() => send('hint')}>{ru ? '💡 Дай подсказку' : '💡 Кеңес бер'}</button>}
        {checked && <><button type="button" disabled={busy} onClick={() => send('simplify')}>{ru ? 'Объясни проще' : 'Қарапайым түсіндір'}</button><button type="button" disabled={busy} onClick={() => send('similar')}>{ru ? 'Похожий пример' : 'Ұқсас мысал'}</button></>}
      </div>
      {!!messages.length && <div className="ai-tutor-chat" aria-live="polite">{messages.map((item, index) => <div key={index} className={`ai-tutor-message is-${item.role}`}>{item.text}</div>)}</div>}
      {busy && <p className="ai-tutor-thinking" role="status">{ru ? 'AI думает…' : 'AI ойлануда…'}</p>}
      {error && <p className="ai-tutor-error" role="alert">{error}</p>}
      <form className="ai-tutor-form" onSubmit={(event) => { event.preventDefault(); send('question', input); }}>
        <input value={input} maxLength={1000} disabled={busy} onChange={(event) => setInput(event.target.value)} placeholder={ru ? 'Задай вопрос по задаче…' : 'Есеп бойынша сұрақ қой…'} />
        <button type="submit" disabled={busy || !input.trim()} aria-label={ru ? 'Отправить' : 'Жіберу'}>↑</button>
      </form>
      <small className="ai-tutor-note">{ru ? 'AI может ошибаться. Оценку и XP рассчитывает только система.' : 'AI қателесуі мүмкін. Баға мен XP-ді тек жүйе есептейді.'}</small>
    </section>
  );
}
