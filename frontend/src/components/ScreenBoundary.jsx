import React from 'react';

// A stale deployment chunk or a failed network request must not leave a blank page.
// Reload is explicit: automatic retries could discard an in-progress answer.
export class ScreenBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidCatch(error) { console.error('screen failed to load', error); }

  render() {
    if (!this.state.failed) return this.props.children;
    const ru = this.props.lang === 'ru';
    return (
      <section role="alert" style={{ maxWidth: 520, margin: '12vh auto', padding: 28 }}>
        <h1 style={{ fontSize: 24 }}>{ru ? 'Не удалось открыть страницу' : 'Бетті ашу мүмкін болмады'}</h1>
        <p>{ru ? 'Проверьте соединение и обновите страницу. Несохранённые ответы могут быть потеряны.' : 'Байланысты тексеріп, бетті жаңартыңыз. Сақталмаған жауаптар жоғалуы мүмкін.'}</p>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          {ru ? 'Обновить страницу' : 'Бетті жаңарту'}
        </button>
        <a href="/" style={{ display: 'inline-block', margin: 16 }}>{ru ? 'На главную' : 'Басты бетке'}</a>
      </section>
    );
  }
}
