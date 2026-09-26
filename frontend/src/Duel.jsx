import React, { useEffect, useRef, useState } from 'react';
import { useLang } from './i18n.jsx';
import { auth, claimDuelXp } from './firebase.js';
import { duelXpGain, XP } from './xp.js';
import {
  createDuel, joinDuel, submitDuelAnswer, skipRoundIfExpired,
  watchDuel, myRole, duelLink, DUEL_SIZE, ROUND_SEC,
} from './duel.js';

// Keep a dismissed invitation consumed even when the user switches tabs and
// this component mounts again; App may still hold the original URL code.
const consumedInvites = new Set();
function shouldJoinInvite(initialCode, consumedInvite) {
  return !!initialCode && initialCode !== consumedInvite && !consumedInvites.has(initialCode);
}
function duelRoundKey(code, duel) {
  return code && duel?.status === 'playing' ? `${code}:${duel.qIndex}` : null;
}
function duelFeedbackKey(code, duel) {
  const round = duel?.lastRound;
  return code && duel?.status === 'playing' && round?.host && round?.guest
    ? `${code}:${round.qIndex}:${round.host.at}:${round.guest.at}` : null;
}
function duelAwardKey(code, duel, uid) {
  // A new room code can render before its first Firestore snapshot arrives.
  // Never claim against a finished snapshot that belongs to the old room.
  if (!code || !uid || duel?.status !== 'finished' || (duel.id || duel.code) !== code) return null;
  return duel.host?.uid === uid || duel.guest?.uid === uid ? `${code}:${uid}` : null;
}

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export default function Duel({ initialCode = '', playerName = 'Ойыншы', fromLink = false, onXp }) {
  const { t, lang } = useLang();
  const [code, setCode] = useState('');
  const [duel, setDuel] = useState(null);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [joinInput, setJoinInput] = useState(initialCode.toUpperCase());
  const [leftSec, setLeftSec] = useState(ROUND_SEC);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [joining, setJoining] = useState(!!initialCode);
  const [countdown, setCountdown] = useState(null);
  const [gameReady, setGameReady] = useState(!fromLink);
  const [awardRetry, setAwardRetry] = useState(0);
  const [consumedInvite, setConsumedInvite] = useState('');
  const countdownDone = useRef(false);
  const award = useRef(null);
  const currentAward = useRef(null);
  const onXpRef = useRef(onXp);
  const expiring = useRef(false);
  const submitting = useRef(null);
  const currentRound = useRef(null);
  const mounted = useRef(true);
  const [verdict, setVerdict] = useState(null);
  const [awardError, setAwardError] = useState(false);
  const invitePending = shouldJoinInvite(initialCode, consumedInvite);
  const roundKey = duelRoundKey(code, duel);
  const feedbackKey = duelFeedbackKey(code, duel);
  const awardUid = auth.currentUser?.uid;
  const awardKey = duelAwardKey(code, duel, awardUid);
  currentRound.current = roundKey;
  currentAward.current = awardKey;
  onXpRef.current = onXp;
  const errorText = (e) => {
    const value = t(`duel.err.${e.message}`);
    return value === `duel.err.${e.message}` ? t('duel.err.failed') : value;
  };

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!code) return undefined;
    return watchDuel(code, setDuel, () => setErr(t('duel.err.failed')));
  }, [code]);

  useEffect(() => {
    submitting.current = null;
    setBusy(false);
    setAnswer(''); setVerdict(null); setErr('');
  }, [roundKey, code]);

  // Гость по ссылке: войти в комнату и сразу начать игру
  useEffect(() => {
    if (!invitePending) return undefined;
    let cancelled = false;
    (async () => {
      setJoining(true);
      setErr('');
      try {
        const id = await joinDuel(initialCode, playerName);
        if (!cancelled) setCode(id);
      } catch (e) {
        if (!cancelled && e.message !== 'auth') {
          setErr(errorText(e));
        }
      } finally {
        if (!cancelled) setJoining(false);
      }
    })();
    return () => { cancelled = true; };
  }, [initialCode, invitePending, playerName, t]);

  // Обратный отсчёт 3-2-1 при старте (оба игрока видят)
  useEffect(() => {
    if (!duel || duel.status !== 'playing' || duel.qIndex !== 0) {
      if (duel?.status === 'playing') setGameReady(true);
      return;
    }
    if (countdownDone.current) {
      setGameReady(true);
      return;
    }
    setGameReady(false);
    let n = 3;
    setCountdown(n);
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        setCountdown(null);
        countdownDone.current = true;
        setGameReady(true);
      } else {
        setCountdown(n);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [duel?.status, duel?.qIndex]);

  // Таймер раунда
  useEffect(() => {
    if (!duel || duel.status !== 'playing' || !gameReady) return undefined;
    const started = duel.roundStartedAt?.toMillis?.()
      ?? (duel.roundStartedAt?.seconds ? duel.roundStartedAt.seconds * 1000 : Date.now());
    const tick = () => {
      const left = Math.min(ROUND_SEC, Math.max(0, ROUND_SEC - Math.floor((Date.now() - started) / 1000)));
      setLeftSec(left);
      if (left === 0 && !expiring.current) {
        expiring.current = true;
        skipRoundIfExpired(code, duel.qIndex).catch((e) => {
          if (mounted.current && currentRound.current === roundKey) setErr(errorText(e));
        })
          .finally(() => { expiring.current = false; });
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [duel?.status, duel?.qIndex, duel?.roundStartedAt, code, gameReady, roundKey]);

  // The server already advances the round atomically. Show the previous result
  // without hiding the next question or spending its running timer on a pause.
  useEffect(() => {
    if (!feedbackKey) {
      setShowRoundResult(false);
      return undefined;
    }
    setShowRoundResult(true);
    const id = setTimeout(() => setShowRoundResult(false), 2200);
    return () => clearTimeout(id);
  }, [feedbackKey]);

  // XP — бір рет ғана есептеледі
  useEffect(() => {
    if (!awardKey) return undefined;
    if (award.current?.key !== awardKey) {
      award.current = { key: awardKey, done: false, attempts: 0, request: null };
      setAwardError(false);
    }
    const scope = award.current;
    if (scope.done) return undefined;
    // Reuse the in-flight promise when React cleans up and replays an effect.
    // Otherwise a second request could observe "already credited" while the
    // first (now ignored) response was the only one carrying the new XP gain.
    if (!scope.request) {
      scope.attempts += 1;
      scope.request = claimDuelXp(code);
    }
    let active = true;
    let retryTimer;
    const isCurrent = () => active && mounted.current && currentAward.current === scope.key
      && award.current === scope && auth.currentUser?.uid === awardUid;
    scope.request.then(({ gain, credited }) => {
      if (!isCurrent()) return;
      scope.done = true;
      setAwardError(false);
      if (credited && gain > 0) onXpRef.current?.(gain);
    }).catch(() => {
      if (!isCurrent()) return;
      scope.request = null;
      setAwardError(true);
      if (scope.attempts < 3) retryTimer = setTimeout(() => {
        if (isCurrent()) setAwardRetry((n) => n + 1);
      }, 1500);
    });
    return () => { active = false; clearTimeout(retryTimer); };
  }, [awardKey, awardUid, code, awardRetry]);

  async function onCreate() {
    setBusy(true); setErr('');
    try {
      const c = await createDuel(playerName);
      setCode(c);
      setJoinInput(c);
      countdownDone.current = false;
      setGameReady(false);
    } catch (e) {
      setErr(errorText(e));
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
      setErr(errorText(e));
    }
    setBusy(false);
  }

  async function onSubmit() {
    if (!answer.trim() || duel?.round?.[role] || busy || submitting.current || !roundKey) return;
    const request = { key: roundKey };
    submitting.current = request;
    const isCurrent = () => mounted.current && currentRound.current === request.key && submitting.current === request;
    setBusy(true);
    try {
      const result = await submitDuelAnswer(code, answer, duel.qIndex);
      if (!isCurrent()) return;
      if (!result.advanced) setVerdict(result.correct);
      setAnswer('');
    } catch (e) {
      if (isCurrent()) setErr(errorText(e));
    } finally {
      if (isCurrent()) setBusy(false);
      if (submitting.current === request) submitting.current = null;
    }
  }

  function onPlayAgain() {
    if (initialCode) consumedInvites.add(initialCode);
    setConsumedInvite(initialCode);
    currentRound.current = null;
    currentAward.current = null;
    submitting.current = null;
    setCode(''); setDuel(null); setJoinInput('');
    setJoining(false); setBusy(false); setErr('');
    setShowRoundResult(false); setCountdown(null); setGameReady(true);
    countdownDone.current = false;
    setAwardError(false);
    try { sessionStorage.removeItem('synaq_duel'); } catch {}
    window.history.replaceState({}, '', '/app');
  }

  async function onCopy() {
    if (await copy(link)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const role = myRole(duel);
  const link = code ? duelLink(code) : '';
  const q = duel?.questions?.[duel.qIndex];
  const answered = !!duel?.round?.[role];
  const opp = role === 'host' ? 'guest' : 'host';
  const oppName = duel?.[opp]?.name || t('duel.opponent');

  // ── Гость по ссылке: подключение ──
  if (fromLink && invitePending && (joining || (!duel && !err))) {
    return (
      <main style={{ textAlign: 'center', paddingTop: 48 }}>
        <p className="kicker">{t('nav.duel')}</p>
        <h1>{t('duel.linkJoin')}</h1>
        <p className="muted">{t('duel.linkJoinSub')}</p>
        <div className="duel-code" style={{ marginTop: 20 }}>{initialCode}</div>
      </main>
    );
  }

  // ── Лобби (без ссылки) ──
  if (!duel) {
    if (fromLink && invitePending && err) {
      return (
        <main>
          <p className="kicker">{t('nav.duel')}</p>
          <h1>{t('duel.linkFail')}</h1>
          <p style={{ color: 'var(--accent)' }}>{err}</p>
        </main>
      );
    }
    return (
      <main className="duel-page duel-start-page">
        <header className="duel-title">
          <span className="section-eyebrow">SYNAQ DUEL</span>
          <h1>{t('duel.title')}</h1>
          <p>{t('duel.sub')}</p>
        </header>

        <section className="duel-arena">
          <div className="duel-arena-copy">
            <span className="duel-arena-tag">15 {lang === 'ru' ? 'раундов' : 'раунд'}</span>
            <h2>{lang === 'ru' ? 'Кто решает точнее и быстрее?' : 'Кім дәл әрі жылдам шешеді?'}</h2>
            <p>{lang === 'ru' ? 'Создай комнату и отправь другу одну ссылку.' : 'Бөлме құрып, досыңа бір сілтеме жібер.'}</p>
            <button className="duel-create-btn" disabled={busy} onClick={onCreate}><span>⚔</span>{t('duel.createBtn')}</button>
          </div>
          <div className="duel-versus" aria-hidden="true"><span className="duel-avatar duel-avatar-a">{(playerName || '?')[0]}</span><b>VS</b><span className="duel-avatar duel-avatar-b">?</span></div>
        </section>

        <section className="duel-join-card">
          <div><span className="section-eyebrow">{lang === 'ru' ? 'ЕСТЬ КОД?' : 'КОДЫҢ БАР МА?'}</span><h2>{t('duel.join')}</h2><p>{lang === 'ru' ? 'Введи 6 символов из приглашения.' : 'Шақырудағы 6 таңбаны енгіз.'}</p></div>
          <div className="duel-join-form">
            <input value={joinInput} onChange={(e) => setJoinInput(e.target.value.toUpperCase())} placeholder={t('duel.codePlaceholder')} maxLength={6} />
            <button disabled={busy || !joinInput.trim()} onClick={onJoin}>{t('duel.joinBtn')} →</button>
          </div>
        </section>

        {err && <p style={{ color: 'var(--accent)', marginTop: 12 }}>{err}</p>}
      </main>
    );
  }

  // ── Хост ждёт друга ──
  if (duel.status === 'waiting') {
    return (
      <main>
        <p className="kicker">{t('nav.duel')}</p>
        <h1>{t('duel.lobby')}</h1>
        <p className="muted">{t('duel.waitFriend')}</p>

        <div className="duel-code">{duel.code}</div>

        <div className="card" style={{ marginTop: 16 }}>
          <p className="muted" style={{ fontSize: 14 }}>{t('duel.shareHint')}</p>
          <input readOnly value={link} onFocus={(e) => e.target.select()} />
          <button className="btn accent full" style={{ marginTop: 10 }} onClick={onCopy}>
            {copied ? t('duel.copied') : t('duel.copy')}
          </button>
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
          <div className="duel-player">
            <div className="ava sm">?</div>
            <div>
              <b>{t('duel.waiting')}</b>
              <span className="muted">{t('duel.guest')}</span>
            </div>
          </div>
        </div>
        {err && <p style={{ color: 'var(--accent)', marginTop: 12 }}>{err}</p>}
      </main>
    );
  }

  // ── Финиш ──
  if (duel.status === 'finished') {
    const won = duel.winner === role;
    const draw = duel.winner === 'draw';
    const myCorrect = role ? (duel.scores?.[role] ?? 0) : 0;
    const mySpeed = role ? (duel.speedWins?.[role] ?? 0) : 0;
    const xpGain = role ? duelXpGain({
      scores: duel.scores, speedWins: duel.speedWins, role, winner: duel.winner,
    }) : 0;
    return (
      <main>
        <p className="kicker">{t('nav.duel')}</p>
        <h1>{draw ? t('duel.draw') : won ? t('duel.win') : t('duel.lose')}</h1>

        <div className="duel-scoreboard big">
          <div className={role === 'host' ? 'me' : ''}>
            <span>{duel.host?.name}</span>
            <b>{duel.scores?.host ?? 0}</b>
            <small className="muted">⚡ {duel.speedWins?.host ?? 0}</small>
          </div>
          <div className="duel-vs">:</div>
          <div className={role === 'guest' ? 'me' : ''}>
            <span>{duel.guest?.name}</span>
            <b>{duel.scores?.guest ?? 0}</b>
            <small className="muted">⚡ {duel.speedWins?.guest ?? 0}</small>
          </div>
        </div>

        {role && xpGain > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <p className="kicker" style={{ margin: 0 }}>{t('duel.xpEarned')}</p>
            <div style={{ font: "700 32px 'Lora',serif", color: 'var(--accent)' }}>+{xpGain} XP</div>
            <ul className="muted" style={{ fontSize: 13, margin: '10px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
              <li>{myCorrect} × {XP.DUEL_CORRECT} = {myCorrect * XP.DUEL_CORRECT} XP ({t('duel.xpCorrect')})</li>
              {mySpeed > 0 && <li>{mySpeed} × {XP.DUEL_SPEED} = {mySpeed * XP.DUEL_SPEED} XP ({t('duel.xpSpeed')})</li>}
              {won && <li>+{XP.DUEL_WIN} XP ({t('duel.xpWin')})</li>}
            </ul>
          </div>
        )}

        {awardError && <p role="alert">{lang === 'ru' ? 'XP пока не сохранены.' : 'XP әзірге сақталмады.'} <button className="link" onClick={() => setAwardRetry((n) => n + 1)}>{lang === 'ru' ? 'Повторить' : 'Қайталау'}</button></p>}

        <button className="btn accent full" style={{ marginTop: 20 }} onClick={onPlayAgain}>
          {t('duel.again')}
        </button>
      </main>
    );
  }

  // ── Старт: 3-2-1 ──
  if (!gameReady && countdown != null) {
    return (
      <main style={{ textAlign: 'center', paddingTop: 60 }}>
        <p className="kicker">{t('nav.duel')}</p>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>{t('duel.vs')} {duel.host?.name} ⚔ {duel.guest?.name}</h1>
        <div style={{ font: "700 72px 'Lora',serif", color: 'var(--accent)', lineHeight: 1 }}>{countdown}</div>
        <p className="muted">{t('duel.getReady')}</p>
      </main>
    );
  }

  // ── Игра ──
  const round = duel.round || {};
  const lastRound = duel.lastRound;

  return (
    <main>
      <div className="row">
        <span className="tag">{t('duel.round')} {duel.qIndex + 1}/{duel.questions?.length || DUEL_SIZE}</span>
        <span className={'timer' + (leftSec <= 10 ? ' warn' : '')}>{leftSec}с</span>
      </div>

      <div className="duel-scoreboard">
        <div className={role === 'host' ? 'me' : ''}>
          <span>{duel.host?.name}{role === 'host' ? ' · ' + t('duel.you') : ''}</span>
          <b>{duel.scores?.host ?? 0}</b>
          <small className="muted">⚡ {duel.speedWins?.host ?? 0}</small>
        </div>
        <div className="duel-vs">⚔</div>
        <div className={role === 'guest' ? 'me' : ''}>
          <span>{duel.guest?.name}{role === 'guest' ? ' · ' + t('duel.you') : ''}</span>
          <b>{duel.scores?.guest ?? 0}</b>
          <small className="muted">⚡ {duel.speedWins?.guest ?? 0}</small>
        </div>
      </div>

      {showRoundResult && lastRound && (
        <div role="status" className={'fb ' + (lastRound[role]?.correct ? 'ok' : 'no')} style={{ marginTop: 12 }}>
          {t('duel.round')} {lastRound.qIndex + 1}: {' '}
          {lastRound[role]?.correct ? t('duel.correct') : t('duel.wrong')}
          {' · '}
          {lastRound[opp]?.correct ? `${oppName}: ${t('duel.oppCorrect')}` : `${oppName}: ${t('duel.oppWrong')}`}
        </div>
      )}

      {q && (
        <>
          <p className="stmt">{q.statement}</p>
          {q.source === 'generated' && <span className="pill">{t('duel.generated')}</span>}

          {!answered ? (
            <>
              {q.options ? <div className="opts">{q.options.map((option, index) => <button key={index} className={'opt' + (answer === String(option) ? ' sel' : '')} disabled={busy} onClick={() => setAnswer(String(option))}>{option}</button>)}</div> : <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={t('ui.24')}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                autoFocus
              />}
              <button className="btn accent full" disabled={busy || !answer.trim()} onClick={onSubmit}>
                {t('common.check')}
              </button>
            </>
          ) : (
            <div className={'fb ' + (verdict === true ? 'ok' : verdict === false ? 'no' : '')}>
              {verdict === null ? t('duel.waitOpp') : verdict ? t('duel.correct') : t('duel.wrong')}
              {!round[opp] && <span className="muted"> · {t('duel.waitOpp')}</span>}
            </div>
          )}

        </>
      )}

      {err && <p style={{ color: 'var(--accent)', marginTop: 12 }}>{err}</p>}
    </main>
  );
}
