import React from 'react';
import { claimChunkRecovery } from '../chunkRecovery.js';
import './ScreenBoundary.css';

// A stale deployment chunk or a failed network request must not leave a blank page.
// Automatic recovery is opt-in for public routes with durable test drafts.
export class ScreenBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidCatch(error) {
    console.error('screen failed to load', error);
    if (this.props.recoverChunks && navigator.onLine !== false) {
      try {
        if (claimChunkRecovery(error, window.sessionStorage)) window.location.reload();
      } catch { /* Leave an explicit retry when storage is unavailable. */ }
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const ru = this.props.lang === 'ru';
    return (
      <section role="alert" className="screen-recovery">
        <img src="/brands/synaq-favicon.svg?v=2" width="46" height="46" alt="SYNAQ" />
        <h1>{ru ? 'Не удалось открыть страницу' : 'Бетті ашу мүмкін болмады'}</h1>
        <p>{ru ? 'Проверьте соединение и обновите страницу. Несохранённые ответы могут быть потеряны.' : 'Байланысты тексеріп, бетті жаңартыңыз. Сақталмаған жауаптар жоғалуы мүмкін.'}</p>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          {ru ? 'Обновить страницу' : 'Бетті жаңарту'}
        </button>
        <a href="/">{ru ? 'На главную' : 'Басты бетке'}</a>
      </section>
    );
  }
}
