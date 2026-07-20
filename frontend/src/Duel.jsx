import React, { useEffect, useRef, useState } from 'react';
import { useLang } from './i18n.jsx';
import Explain from './components/Explain.jsx';
import {
  createDuel, joinDuel, startDuel, submitDuelAnswer, skipRoundIfExpired,
  watchDuel, myRole, duelLink, DUEL_SIZE, ROUND_SEC,
} from './duel.js';

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export default function Duel({ initialCode = '', playerName = 'Ойыншы' }) {
  const { t } = useLang();
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [duel, setDuel] = useState(null);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [joinInput, setJoinInput] = useState(initialCode.toUpperCase());
  const [leftSec, setLeftSec] = useState(ROUND_SEC);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const lastRoundKey = useRef('');

  useEffect(() => {
    if (!code) return undefined;
    return watchDuel(code, setDuel);
  }, [code]);

  useEffect(() => {
    if (initialCode && !code) setCode(initialCode.toUpperCase());
  }, [initialCode, code]);

  // Авто-join по ссылке (гость; хост просто откроет ту же комнату)
  useEffect(() => {
    if (!initialCode) return;
    let cancelled = false;
    (async () => {
      try {
        await joinDuel(initialCode, playerName);
      } catch (e) {
        if (!cancelled && e.message !== 'auth') {
          setErr(t(`duel.err.${e.message}`) || t('duel.err.failed'));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [initialCode, playerName, t]);

  // Таймер раунда
  useEffect(() => {
    if (!duel || duel.status !== 'playing') return undefined;
    const started = duel.roundStartedAt?.toMillis?.()
      ?? (duel.roundStartedAt?.seconds ? duel.roundStartedAt.seconds * 1000 : Date.now());
    const tick = () => {
      const left = Math.max(0, ROUND_SEC - Math.floor((Date.now() - started) / 1000));
      setLeftSec(left);
      if (left === 0) skipRoundIfExpired(code).catch(() => {});
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [duel?.status, duel?.qIndex, duel?.roundStartedAt, code]);

  // Показать результат раунда на 2 сек
  useEffect(() => {
    if (!duel || duel.status !== 'playing') return;
    const r = duel.round || {};
    if (!r.host || !r.guest) {
      setShowRoundResult(false);
      return;
    }
    const key = `${duel.qIndex}_${r.host.at}_${r.guest.at}`;
    if (key === lastRoundKey.current) return;
    lastRoundKey.current = key;
    setShowRoundResult(true);
    const id = setTimeout(() => setShowRoundResult(false), 2200);
    return () => clearTimeout(id);
  }, [duel]);

  const role = myRole(duel);
  const link = code ? duelLink(code) : '';

  async function onCreate() {
    setBusy(true); setErr('');
    try {
      const c = await createDuel(playerName);
      setCode(c);
      setJoinInput(c);
    } catch (e) {
      setErr(t('duel.err.auth'));
    }
    setBusy(false);
  }

  async function onJoin() {
    const c = joinInput.trim().toUpperCase();
    if (!c) return;
    setBusy(true); setErr('');
    try {
      await joinDuel(c, playerName);
      setCode(c);
    } catch (e) {
      setErr(t(`duel.err.${e.message}`) || t('duel.err.failed'));
    }
    setBusy(false);
  }

  async function onStart() {
    setBusy(true); setErr('');
    try {
      await startDuel(code);
    } catch (e) {
      setErr(t(`duel.err.${e.message}`) || t('duel.err.failed'));
    }
    setBusy(false);
  }

  async function onSubmit() {
    if (!answer.trim() || duel?.round?.[role]) return;
    setBusy(true);
    try {
      await submitDuelAnswer(code, answer);
      setAnswer('');
    } catch (e) {
      setErr(t('duel.err.failed'));
    }
    setBusy(false);
  }

  async function onCopy() {
    if (await copy(link)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const q = duel?.questions?.[duel.qIndex];
  const answered = !!duel?.round?.[role];
  const opp = role === 'host' ? 'guest' : 'host';
  const oppName = duel?.[opp]?.name || t('duel.opponent');
  const myScore = role ? (duel?.scores?.[role] ?? 0) : 0;
  const oppScore = role ? (duel?.scores?.[opp] ?? 0) : 0;

  // ── Лобби ──
  if (!duel) {
    return (
      <main>
        <p className="kicker">{t('nav.duel')}</p>
        <h1>{t('duel.title')}</h1>
        <p className="muted" style={{ marginBottom: 18 }}>{t('duel.sub')}</p>

        <div className="card">
          <h2 style={{ fontSize: 18 }}>{t('duel.create')}</h2>
          <p className="muted" style={{ fontSize: 14 }}>{t('duel.createHint')}</p>
          <button className="btn accent full" style={{ marginTop: 14 }} disabled={busy} onClick={onCreate}>
            {t('duel.createBtn')}
          </button>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <h2 style={{ fontSize: 18 }}>{t('duel.join')}</h2>
          <input
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
            placeholder={t('duel.codePlaceholder')}
            maxLength={6}
          />
          <button className="btn full" disabled={busy || !joinInput.trim()} onClick={onJoin}>
            {t('duel.joinBtn')}
          </button>
        </div>

        {err && <p style={{ color: 'var(--accent)', marginTop: 12 }}>{err}</p>}
      </main>
    );
  }

  // ── Ожидание соперника ──
  if (duel.status === 'waiting') {
    return (
      <main>
        <p className="kicker">{t('nav.duel')}</p>
        <h1>{t('duel.lobby')}</h1>

        <div className="duel-code">{duel.code}</div>

        <div className="card" style={{ marginTop: 16 }}>
          <p className="muted" style={{ fontSize: 14 }}>{t('duel.shareHint')}</p>
          <input readOnly value={link} onFocus={(e) => e.target.select()} />
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn accent" style={{ flex: 1 }} onClick={onCopy}>
              {copied ? t('duel.copied') : t('duel.copy')}
            </button>
            {role === 'host' && (
              <button className="btn" style={{ flex: 1 }} disabled={busy || !duel.guest} onClick={onStart}>
                {t('duel.start')}
              </button>
            )}
          </div>
        </div>

        <div className="duel-players">
          <div className="duel-player on">
            <div className="ava sm">{(duel.host?.name || '?')[0]}</div>
            <div>
              <b>{duel.host?.name}</b>
              <span className="muted">{t('duel.host')}</span>
            </div>
          </div>
          <div className="duel-vs">⚔</div>
          <div className={'duel-player' + (duel.guest ? ' on' : '')}>
            <div className="ava sm">{(duel.guest?.name || '?')[0]}</div>
            <div>
              <b>{duel.guest?.name || t('duel.waiting')}</b>
              <span className="muted">{t('duel.guest')}</span>
            </div>
          </div>
        </div>

        {role === 'guest' && <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>{t('duel.waitHost')}</p>}
        {err && <p style={{ color: 'var(--accent)', marginTop: 12 }}>{err}</p>}
      </main>
    );
  }

  // ── Финиш ──
  if (duel.status === 'finished') {
    const won = duel.winner === role;
    const draw = duel.winner === 'draw';
    return (
      <main>
        <p className="kicker">{t('nav.duel')}</p>
        <h1>{draw ? t('duel.draw') : won ? t('duel.win') : t('duel.lose')}</h1>

        <div className="duel-scoreboard big">
          <div className={role === 'host' ? 'me' : ''}>
            <span>{duel.host?.name}</span>
            <b>{duel.scores?.host ?? 0}</b>
          </div>
          <div className="duel-vs">:</div>
          <div className={role === 'guest' ? 'me' : ''}>
            <span>{duel.guest?.name}</span>
            <b>{duel.scores?.guest ?? 0}</b>
          </div>
        </div>

        <button className="btn accent full" style={{ marginTop: 20 }} onClick={() => { setCode(''); setDuel(null); setJoinInput(''); }}>
          {t('duel.again')}
        </button>
      </main>
    );
  }

  // ── Игра ──
  const round = duel.round || {};
  const bothDone = round.host && round.guest;

  return (
    <main>
      <div className="row">
        <span className="tag">{t('duel.round')} {duel.qIndex + 1}/{duel.questions?.length || DUEL_SIZE}</span>
        <span className={'timer' + (leftSec <= 10 ? ' warn' : '')}>{leftSec}с</span>
      </div>

      <div className="duel-scoreboard">
        <div className={role === 'host' ? 'me' : ''}>
          <span>{duel.host?.name}{role === 'host' ? ' · ' + t('duel.you') : ''}</span>
          <b>{myScore}</b>
        </div>
        <div className="duel-vs">⚔</div>
        <div className={role === 'guest' ? 'me' : ''}>
          <span>{oppName}{role === 'guest' ? '' : ''}</span>
          <b>{oppScore}</b>
        </div>
      </div>

      {showRoundResult && bothDone && (
        <div className={'fb ' + (round[role]?.correct ? 'ok' : 'no')} style={{ marginTop: 12 }}>
          {round[role]?.correct ? t('duel.correct') : t('duel.wrong')}
          {' · '}
          {round[opp]?.correct ? `${oppName}: ${t('duel.oppCorrect')}` : `${oppName}: ${t('duel.oppWrong')}`}
        </div>
      )}

      {q && !showRoundResult && (
        <>
          <p className="stmt">{q.statement}</p>
          {q.source === 'generated' && <span className="pill">{t('duel.generated')}</span>}

          {!answered ? (
            <>
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={t('ui.24')}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                autoFocus
              />
              <button className="btn accent full" disabled={busy || !answer.trim()} onClick={onSubmit}>
                {t('common.check')}
              </button>
            </>
          ) : (
            <div className={'fb ' + (round[role]?.correct ? 'ok' : 'no')}>
              {round[role]?.correct ? t('duel.correct') : t('duel.wrong')}
              {!round[opp] && <span className="muted"> · {t('duel.waitOpp')}</span>}
            </div>
          )}

          {answered && round[role] && !round[role].correct && (
            <Explain q={q} given={round[role].value} />
          )}
        </>
      )}

      {err && <p style={{ color: 'var(--accent)', marginTop: 12 }}>{err}</p>}
    </main>
  );
}
