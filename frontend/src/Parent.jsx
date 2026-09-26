import React, { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useLang } from './i18n.jsx';
import {
  auth, db, familyPlan, createChild, getChildren, getMocks, getAttempts, logout,
  genPassword, suggestUsername, cleanUsername, errText,
  hasPasswordLogin, linkParentPassword, changeParentPassword, resetChildPassword, getPlatformDiagnostics,
} from './firebase.js';
import { topicStats, readiness, mockSeries } from './analytics.js';
import { loadTopicCatalog } from './topicCatalog.js';
import Brand from './Brand.jsx';
import BrandLoader from './components/BrandLoader.jsx';
import { buildDiagnosticShareText, daysUntilDiagnostic } from './platformDiagnostic.js';
import { checkoutErrorMessage, checkoutNeedsVerification, isCheckoutDestination, isDodoPortalDestination } from './checkoutMessages.js';
import PetAvatar, { DEFAULT_PET_AVATAR, PET_AVATARS } from './PetAvatar.jsx';
import { planPrice } from './plans.js';

const Logo = () => <div className="logo"><Brand compact /></div>;

// synaq_want_pro флагі осы уақыттан ескі болса құрметтелмейді (бөлек
// абзацта түсіндірілген — ортақ компьютердегі ескі белгі мәселесі).
const WANT_PRO_TTL_MS = 30 * 60 * 1000;
const planRank = (value) => ({ free: 0, standard: 1, pro: 2 }[value] || 0);

export default function Parent({ onExit }) {
  const { t, lang } = useLang();
  const text = (ru, kk) => lang === 'ru' ? ru : kk;
  const exit = async () => {
    await (onExit || logout)();
  };
  const [plan, setPlan] = useState(null);    // null — әлі жүктелуде
  const pro = plan === 'pro';
  const [me, setMe] = useState('');          // ата-ананың аты
  const [paying, setPaying] = useState(false);
  const payingRef = useRef(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const portalRef = useRef(false);
  const [portalError, setPortalError] = useState('');
  const wantedHandled = useRef(false);
  const [familyError, setFamilyError] = useState('');
  const [billingStatus, setBillingStatus] = useState({ cancelAtPeriodEnd: false, expiresAt: 0 });
  const [familyRetry, setFamilyRetry] = useState(0);
  const [paymentIssue, setPaymentIssue] = useState(null);
  const paymentError = paymentIssue ? checkoutErrorMessage(paymentIssue.code, lang, paymentIssue.status) : '';
  const checkoutHold = checkoutNeedsVerification(paymentIssue?.code);
  const [paymentPending, setPaymentPending] = useState(() => {
    const paid = new URLSearchParams(window.location.search).get('paid');
    return ['1', 'standard', 'pro'].includes(paid);
  });
  const [children, setChildren] = useState([]);
  const [childrenLoaded, setChildrenLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  // Observe webhook updates after checkout, including delayed confirmation.
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    setMe(u.displayName || '');
    let expiryTimer;
    setFamilyError('');
    const unsubscribe = onSnapshot(doc(db, 'families', u.uid), (snapshot) => {
      const f = snapshot.data();
      if (!snapshot.exists()) {
        setPlan(null);
        setFamilyError(text('Не удалось найти профиль семьи. Обратитесь в поддержку.', 'Отбасы профилі табылмады. Қолдау қызметіне жазыңыз.'));
        return;
      }
      clearTimeout(expiryTimer);
      const currentPlan = familyPlan(f);
      setPlan(currentPlan);
      setFamilyError('');
      const expiresMs = (f.planExpiresAt || f.proExpiresAt)?.toMillis?.() || 0;
      setBillingStatus({ cancelAtPeriodEnd: f.cancelAtPeriodEnd === true, expiresAt: expiresMs });
      if (currentPlan !== 'free' && expiresMs) {
        const updateExpiry = () => {
          setPlan(familyPlan(f));
          if (expiresMs > Date.now()) expiryTimer = setTimeout(updateExpiry, Math.min(expiresMs - Date.now() + 25, 2147483647));
        };
        expiryTimer = setTimeout(updateExpiry, Math.min(expiresMs - Date.now() + 25, 2147483647));
      }
      if (!u.displayName) setMe(f?.parentName || (u.email || '').split('@')[0]);
      const paidTarget = new URLSearchParams(window.location.search).get('paid');
      const expectedPlan = paidTarget === 'standard' ? 'standard' : 'pro';
      if (paidTarget && planRank(currentPlan) >= planRank(expectedPlan)) {
        setPaymentPending(false);
        setPaymentIssue(null);
        const url = new URL(window.location.href);
        if (url.searchParams.has('paid')) {
          url.searchParams.delete('paid');
          window.history.replaceState({}, '', url.pathname + url.search + url.hash);
        }
      }
      // Если тариф выбрали на лендинге до входа, открываем правильную оплату
      // после авторизации. Старый synaq_want_pro поддерживаем для совместимости.
      if (wantedHandled.current) return;
      wantedHandled.current = true;
      let wantedPlan = null;
      try {
        const rawPlan = localStorage.getItem('synaq_want_plan');
        localStorage.removeItem('synaq_want_plan');
        if (rawPlan) {
          const intent = JSON.parse(rawPlan);
          const ts = Number(intent?.at);
          if (['standard', 'pro'].includes(intent?.plan) && Number.isFinite(ts) && Date.now() >= ts && Date.now() - ts < WANT_PRO_TTL_MS) wantedPlan = intent.plan;
        }
        const raw = localStorage.getItem('synaq_want_pro');
        localStorage.removeItem('synaq_want_pro');
        const ts = Number(raw);
        if (!wantedPlan && raw != null && Number.isFinite(ts) && Date.now() >= ts && Date.now() - ts < WANT_PRO_TTL_MS) wantedPlan = 'pro';
      } catch {}
      if (wantedPlan && planRank(currentPlan) < planRank(wantedPlan) && !paymentPending) buyPlan(wantedPlan);
    }, (error) => {
      console.error('family subscription failed', error);
      setPlan(null);
      setFamilyError(text('Не удалось обновить подписку. Проверьте соединение и повторите.', 'Жазылымды жаңарту мүмкін болмады. Байланысты тексеріп, қайталаңыз.'));
    });
    return () => { unsubscribe(); clearTimeout(expiryTimer); };
  }, [lang, familyRetry]);

  // Dodo төлем бетіне window.location.href арқылы кеткенде компонент
  // әдетте қайта жүктеледі, бірақ кейбір браузерлер (әсіресе мобильді
  // Safari) артқа қайту үшін бетті жадта сақтап қояды (bfcache) — сол
  // кезде mount-эффектер қайта жегілмейді және paying=true күйінде
  // «қалып» кетеді, батырма мәңгі «…» күйінде тұрады. pageshow.persisted
  // осындай қайтаруды көрсетеді.
  useEffect(() => {
    const onShow = (e) => { if (e.persisted) {
      setPaying(false); payingRef.current = false;
      setOpeningPortal(false); portalRef.current = false;
    } };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  // «Про таңдау» → Dodo төлем бетіне жібереміз
  async function buyPlan(targetPlan) {
    if (!['standard', 'pro'].includes(targetPlan)) return;
    const u = auth.currentUser;
    if (!u || payingRef.current || checkoutHold || paymentPending) return;
    const current = () => mounted.current && auth.currentUser?.uid === u.uid;
    payingRef.current = true;
    setPaying(true);
    setPaymentIssue(null);
    let requestSent = false, redirected = false;
    try {
      const idToken = await u.getIdToken();
      if (!current()) return;
      requestSent = true;
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ plan: targetPlan }),
      });
      const raw = await r.text();
      let data = null;
      try { data = JSON.parse(raw); } catch {}
      if (!current()) return;
      if (r.ok && isCheckoutDestination(data?.url)) {
        redirected = true;
        window.location.href = data.url;
        return;
      }
      const code = r.ok ? 'checkout_verification_required' : data?.error || 'checkout_unavailable';
      setPaymentIssue({ code, status: r.status });
      if (r.status === 409 && ['already_pro', 'already_plan'].includes(data?.error)) {
        setFamilyRetry((n) => n + 1);
      }
      console.error('checkout failed', r.status, code);
    } catch (e) {
      console.error('checkout failed', e?.code || 'network');
      if (current()) setPaymentIssue({ code: requestSent ? 'checkout_network_error'
        : e?.code?.startsWith('auth/') ? 'login_required' : 'checkout_unavailable' });
    } finally {
      if (!redirected) {
        payingRef.current = false;
        if (current()) setPaying(false);
      }
    }
  }

  async function openSubscriptionPortal() {
    const u = auth.currentUser;
    if (!u || plan === 'free' || portalRef.current) return;
    const current = () => mounted.current && auth.currentUser?.uid === u.uid;
    portalRef.current = true; setOpeningPortal(true); setPortalError('');
    let redirected = false;
    try {
      const idToken = await u.getIdToken();
      if (!current()) return;
      const response = await fetch('/api/subscription-portal', {
        method: 'POST', headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json().catch(() => null);
      if (!current()) return;
      if (response.ok && isDodoPortalDestination(data?.url)) {
        redirected = true; window.location.href = data.url; return;
      }
      setPortalError(text('Не удалось открыть управление подпиской. Попробуйте позже или обратитесь в поддержку.', 'Жазылымды басқару бетін ашу мүмкін болмады. Кейінірек көріңіз немесе қолдау қызметіне жазыңыз.'));
    } catch {
      if (current()) setPortalError(text('Не удалось открыть управление подпиской. Проверьте соединение.', 'Жазылымды басқару бетін ашу мүмкін болмады. Байланысты тексеріңіз.'));
    } finally {
      if (!redirected) {
        portalRef.current = false;
        if (current()) setOpeningPortal(false);
      }
    }
  }

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pass, setPass] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_PET_AVATAR);
  const [created, setCreated] = useState(null);
  const [openChild, setOpenChild] = useState(null);
  const [mocks, setMocks] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(false);
  const reportRequest = useRef(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [childrenError, setChildrenError] = useState(false);
  const [resetChild, setResetChild] = useState(null);
  const mounted = useRef(true);
  const childrenRequest = useRef(0);
  const creating = useRef(false);
  const pendingCreation = useRef(null);
  const usernameEdited = useRef(false);

  const load = async () => {
    const uid = auth.currentUser?.uid;
    const request = ++childrenRequest.current;
    const current = () => mounted.current && request === childrenRequest.current && auth.currentUser?.uid === uid;
    setChildrenError(false);
    try {
      if (!uid) throw new Error('login_required');
      const items = await getChildren(uid);
      if (!current()) return;
      setChildren(items);
      setChildrenLoaded(true);
      return items;
    } catch (error) {
      console.error('children load failed', error);
      if (current()) setChildrenError(true);
    }
  };
  useEffect(() => {
    mounted.current = true;
    load();
    return () => { mounted.current = false; childrenRequest.current++; reportRequest.current++; };
  }, []);

  async function add() {
    if (creating.current || !childrenLoaded || !auth.currentUser) return;
    creating.current = true;
    const uid = auth.currentUser.uid;
    const current = () => mounted.current && auth.currentUser?.uid === uid;
    setErr(''); setBusy(true);
    try {
      // один родитель — только один ребёнок
      if (children.length >= 1 && !pendingCreation.current) {
        setErr(text('Можно добавить только одного ребёнка.', 'Бір бала ғана қосуға болады.'));
        setAdding(false);
        return;
      }
      if (!pendingCreation.current || pendingCreation.current.parentUid !== uid) {
        pendingCreation.current = { parentUid: uid, requestId: crypto.randomUUID(), name: name.trim(), avatar,
          code: cleanUsername(username) || suggestUsername(name) || ('bala' + Math.floor(1000 + Math.random() * 9000)),
          pin: pass || genPassword() };
      }
      const request = pendingCreation.current;
      // Keep the exact credentials visible even if the HTTP response is lost.
      setUsername(request.code); setPass(request.pin);
      await createChild(uid, request);
      if (!current()) return;
      setCreated({ code: request.code, pass: request.pin, name: request.name });
      pendingCreation.current = null; usernameEdited.current = false;
      setName(''); setUsername(''); setPass(''); setAvatar(DEFAULT_PET_AVATAR); setAdding(false);
      await load();
    } catch (e) {
      if (current()) {
        setErr(errText(e, lang));
        // The server may already have committed. Refresh, but only a verified
        // idempotent response may turn this request into a success message.
        await load();
      }
    } finally {
      creating.current = false;
      if (current()) setBusy(false);
    }
  }
  function changeName(value) {
    pendingCreation.current = null;
    setName(value);
    if (!usernameEdited.current) setUsername(cleanUsername(value));
  }
  const [stats, setStats] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);

  // Кірген соң бала жоқ болса — «Бала қосу» формасын бірден ашамыз
  useEffect(() => {
    if (childrenLoaded && firstLoad && !children.length && !created) { setAdding(true); setFirstLoad(false); }
  }, [children, childrenLoaded, firstLoad, created]);

  // Баланы ашқанда: мок-тестер + тақырып бойынша статистика
  const openResults = async (c) => {
    setOpenChild(c);
    setReportLoading(true); setReportError(false);
    const request = ++reportRequest.current;
    try {
      const [ms, att, topics, diagnosticItems] = await Promise.all([
        getMocks(c.uid), getAttempts(c.uid), loadTopicCatalog(), getPlatformDiagnostics(c.uid),
      ]);
      if (request !== reportRequest.current) return;
      setMocks(ms); setStats(topicStats(att, topics)); setDiagnostics(diagnosticItems);
    } catch (error) {
      console.error('child report failed', error);
      if (request === reportRequest.current) setReportError(true);
    } finally {
      if (request === reportRequest.current) setReportLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <Logo />
        <button className="logout" onClick={exit}>{t('ui.26')}</button>
      </header>

      {familyError && <div className="card" role="alert" style={{ marginTop: 16 }}>
        <p>{familyError}</p><button className="btn" onClick={() => setFamilyRetry((n) => n + 1)}>{text('Повторить', 'Қайталау')}</button>
      </div>}
      {paymentPending && <div className="card" role="status" style={{ marginTop: 16 }}>
        {text('Ожидаем подтверждение оплаты. Доступ обновится автоматически — повторно оплачивать не нужно.', 'Төлем расталуын күтіп жатырмыз. Қолжетімділік автоматты жаңарады — қайта төлеудің қажеті жоқ.')}
        <p><button className="link" onClick={() => {
          setPaymentPending(false);
          const url = new URL(window.location.href); url.searchParams.delete('paid');
          window.history.replaceState({}, '', url.pathname + url.search + url.hash);
        }}>{text('Оплата не завершена? Вернуться к выбору', 'Төлем аяқталмады ма? Таңдауға оралу')}</button></p>
      </div>}
      {paymentError && <div role="alert" style={{ color: 'var(--accent)', marginTop: 16 }}>
        <p>{paymentError}</p>
        {checkoutHold && <button className="link" onClick={() => setFamilyRetry((n) => n + 1)}>
          {text('Обновить статус подписки', 'Жазылым күйін жаңарту')}
        </button>}
      </div>}
      {err && !adding && <p role="alert" style={{ color: 'var(--accent)', marginTop: 16 }}>{err}</p>}

      {created && (
        <div className="card" style={{ marginTop: 16, borderColor: 'var(--green)', background: '#EEF5EC' }}>
          <div className="row" style={{ marginBottom: 10 }}>
            <p className="kicker" style={{ color: 'var(--green)', margin: 0 }}>{text(`Аккаунт ${created.name} создан`, `${created.name} аккаунты жасалды`)}</p>
            {/* Пароль ашық мәтінмен көрінеді — ортақ/қоғамдық компьютерде
                экранда мәңгі қалып қоймауы үшін жабу батырмасы керек. */}
            <button className="link" onClick={() => setCreated(null)} aria-label={text('Закрыть', 'Жабу')}>✕</button>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 14 }}>{text('Передайте ребёнку эти данные для входа:', 'Балаға осыны беріңіз — ол осымен кіреді:')}</p>

          <CopyRow label="Юзернейм" value={created.code} />
          <CopyRow label="Пароль" value={created.pass} />

          <button className="btn ghost" style={{ marginTop: 12 }}
            onClick={() => copy(`Synaq\nЮзернейм: ${created.code}\nПароль: ${created.pass}`)}>
            {text('Скопировать логин и пароль', 'Екеуін де көшіру')}
          </button>
        </div>
      )}

      {!openChild ? (
        <main>
          {/* Сәлемдесу */}
          {me && (
            <>
              <h1 style={{ margin: '0 0 4px' }}>{text('Привет', 'Сәлем')}, {me}!</h1>
              <p className="muted" style={{ margin: '0 0 20px' }}>
                {children.length
                  ? text(`Детей в аккаунте: ${children.length}. Выберите ребёнка, чтобы увидеть прогресс.`, `${children.length} бала тіркелген. Прогресті көру үшін балаңызды таңдаңыз.`)
                  : text('Добавьте ребёнка, чтобы он мог начать подготовку.', 'Балаңызды қосыңыз — сол арқылы ол дайындықты бастайды.')}
              </p>
            </>
          )}

          {/* Үш тариф: тегін, Standard және Pro. */}
          {plan !== null && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 20,
            }}>
              {/* ── Тегін ── */}
              <div className="card" style={{
                borderColor: plan === 'free' ? 'var(--ink)' : 'var(--line)',
                borderWidth: plan === 'free' ? 2 : 1, opacity: plan === 'free' ? 1 : 0.72,
              }}>
                <div className="row" style={{ marginBottom: 10 }}>
                  <p className="kicker" style={{ margin: 0 }}>{t('plan.free')}</p>
                  {plan === 'free' && <span className="tag" style={{ borderColor: 'var(--ink)' }}>{t('plan.current')}</span>}
                </div>
                <div style={{ font: "700 26px 'Lora',serif", marginBottom: 12 }}>{t('plan.freePrice')}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', font: "500 13.5px 'Golos Text'", lineHeight: 2 }}>
                  <li>✓ {t('plan.f1')}</li>
                  <li>✓ {t('plan.f2')}</li>
                  <li style={{ color: '#B0B0A6' }}>✗ {t('plan.f3')}</li>
                  <li style={{ color: '#B0B0A6' }}>✗ {t('plan.f4')}</li>
                </ul>
              </div>

              {/* ── Standard ── */}
              <div className="card" style={{
                borderColor: plan === 'standard' ? '#2F80ED' : 'var(--line)', borderWidth: plan === 'standard' ? 2 : 1,
                background: plan === 'standard' ? '#EEF6FF' : '#fff',
              }}>
                <div className="row" style={{ marginBottom: 10 }}>
                  <p className="kicker" style={{ margin: 0, color: '#2F80ED' }}>{t('plan.standard')}</p>
                  {plan === 'standard' && <span className="tag" style={{ borderColor: '#2F80ED', color: '#2F80ED' }}>{t('plan.active')}</span>}
                </div>
                <div style={{ font: "700 26px 'Lora',serif", marginBottom: 12 }}>
                  {planPrice('standard', lang)}<span style={{ font: "500 13px 'Golos Text'", color: '#9A9384' }}>{t('plan.month')}</span>
                </div>
                <ul style={{ margin: '0 0 14px', padding: 0, listStyle: 'none', font: "500 13.5px 'Golos Text'", lineHeight: 2 }}>
                  <li>✓ {t('plan.s1')}</li><li>✓ {t('plan.s2')}</li><li>✓ {t('plan.s3')}</li><li>✓ {t('plan.s4')}</li>
                </ul>
                {plan === 'standard' ? <div style={{ font: "600 13px 'Golos Text'", color: '#2F80ED' }}>{t('plan.activeNote')}</div>
                  : plan === 'free' && <button className="btn" disabled={paying || paymentPending || checkoutHold}
                    onClick={() => buyPlan('standard')} style={{ width: '100%' }}>{paying ? '…' : t('plan.chooseStandard')}</button>}
              </div>

              {/* ── Про ── */}
              <div className="card" style={{
                borderColor: pro ? 'var(--green)' : 'var(--accent)',
                borderWidth: 2, background: pro ? '#EEF5EC' : '#FBF3E3',
              }}>
                <div className="row" style={{ marginBottom: 10 }}>
                  <p className="kicker" style={{ margin: 0, color: pro ? 'var(--green)' : 'var(--accent)' }}>{t('plan.pro')}</p>
                  {pro && <span className="tag" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>{t('plan.active')}</span>}
                </div>
                <div style={{ font: "700 26px 'Lora',serif", marginBottom: 12 }}>
                  {planPrice('pro', lang)}<span style={{ font: "500 13px 'Golos Text'", color: '#9A9384' }}>{t('plan.month')}</span>
                </div>
                <ul style={{ margin: '0 0 14px', padding: 0, listStyle: 'none', font: "500 13.5px 'Golos Text'", lineHeight: 2 }}>
                  <li>✓ {t('plan.p1')}</li>
                  <li>✓ {t('plan.p2')}</li>
                  <li>✓ {t('plan.p3')}</li>
                  <li>✓ {t('plan.p4')}</li>
                </ul>
                {pro ? (
                  <div style={{ font: "600 13px 'Golos Text'", color: 'var(--green)' }}>{t('plan.activeNote')}</div>
                ) : (
                  <button className="btn accent" disabled={paying || paymentPending || checkoutHold} onClick={() => buyPlan('pro')} style={{ width: '100%' }}>
                    {checkoutHold ? text('Нужна проверка оплаты', 'Төлемді тексеру қажет') : paymentPending ? text('Проверяем оплату…', 'Төлем тексерілуде…') : paying ? '…' : t('pro.buy')}
                  </button>
                )}
              </div>
            </div>
          )}

          {plan && plan !== 'free' && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="row">
                <div>
                  <p className="kicker" style={{ margin: 0 }}>{text('Управление подпиской', 'Жазылымды басқару')}</p>
                  <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                    {billingStatus.cancelAtPeriodEnd
                      ? text(`Автопродление отключено. Доступ сохранится до ${billingStatus.expiresAt ? new Date(billingStatus.expiresAt).toLocaleDateString('ru-RU') : 'конца периода'}.`, `Автожаңарту өшірілді. Қолжетімділік ${billingStatus.expiresAt ? new Date(billingStatus.expiresAt).toLocaleDateString('kk-KZ') : 'кезең соңына'} дейін сақталады.`)
                      : text('Смена тарифа, автопродление, отмена и история платежей открываются в защищённом кабинете Dodo.', 'Тарифті ауыстыру, автожаңарту, бас тарту және төлем тарихы қорғалған Dodo кабинетінде ашылады.')}
                  </p>
                </div>
                <button className="btn" disabled={openingPortal} onClick={openSubscriptionPortal}>
                  {openingPortal ? '…' : text('Открыть', 'Ашу')}
                </button>
              </div>
              {portalError && <p role="alert" style={{ color: 'var(--accent)', marginBottom: 0 }}>{portalError}</p>}
            </div>
          )}

          <LoginPasswordCard t={t} />

          <div className="row">
            <h1 style={{ margin: 0 }}>{t('ui.27')}</h1>
            {childrenLoaded && children.length === 0 && (
              <button className="btn" disabled={busy} onClick={() => { setAdding(!adding); setErr(''); }}>{t('ui.28')}</button>
            )}
          </div>

          {adding && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lab}>{t('ui.29')}</label>
                <input placeholder={t('ui.37')} value={name} style={inp} disabled={busy}
                  onChange={(e) => changeName(e.target.value)} />
              </div>
              <fieldset className="pet-picker" disabled={busy}>
                <legend>{text('Выберите питомца', 'Кейіпкерді таңдаңыз')}</legend>
                <p>{text('Он будет аватаром ребёнка в платформе.', 'Ол платформадағы баланың аватары болады.')}</p>
                <div className="pet-picker-grid">
                  {PET_AVATARS.map((pet) => (
                    <button key={pet.id} type="button" className={avatar === pet.id ? 'is-selected' : ''}
                      aria-pressed={avatar === pet.id} aria-label={lang === 'ru' ? pet.ru : pet.kk}
                      onClick={() => { pendingCreation.current = null; setAvatar(pet.id); }}>
                      <PetAvatar id={pet.id} /><small>{lang === 'ru' ? pet.ru : pet.kk}</small>
                    </button>
                  ))}
                </div>
              </fieldset>
              <div>
                <label style={lab}>{t('ui.30')}</label>
                <input placeholder={t('ui.38')} value={username} style={inp} disabled={busy}
                  onChange={(e) => { pendingCreation.current = null; usernameEdited.current = !!e.target.value; setUsername(cleanUsername(e.target.value)); }} />
                <p style={{ font: "500 11px 'IBM Plex Mono',monospace", color: '#9A9384', margin: '6px 0 0' }}>
                  {text('3–32 латинские буквы или цифры', '3–32 латын әрпі немесе цифр')}
                </p>
              </div>
              <div>
                <label style={lab}>{t('ui.31')}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder={t('ui.39')} value={pass} disabled={busy} onChange={(e) => { pendingCreation.current = null; setPass(e.target.value); }} style={{ ...inp, flex: 1 }} />
                  <button className="btn ghost" type="button" disabled={busy} onClick={() => { pendingCreation.current = null; setPass(genPassword()); }} style={{ whiteSpace: 'nowrap' }}>
                    {text('Сгенерировать', 'Генерациялау')}
                  </button>
                </div>
              </div>
              {err && <p style={{ color: 'var(--accent)', fontSize: 13, margin: 0 }}>{err}</p>}
              <button className="btn accent" disabled={busy || !name.trim() || !childrenLoaded} onClick={add}>
                {busy ? text('Создаём…', 'Жасалуда…') : text('Создать', 'Жасау')}
              </button>
            </div>
          )}

          <div className="list">
            {children.map((c) => (
              <div className="row-item" key={c.uid} onClick={() => openResults(c)}>
                <PetAvatar id={c.avatar} size="small" />
                <b>{c.name}</b>
                <span className="rt">логин: {c.code} · {text('результаты', 'нәтижелер')} →</span>
                <button className="link" onClick={(event) => { event.stopPropagation(); setResetChild(c); }}>{text('Изменить PIN', 'PIN өзгерту')}</button>
              </div>
            ))}
          </div>
          {resetChild && <ChildPasswordCard key={resetChild.uid} child={resetChild} onClose={() => setResetChild(null)} />}
          {childrenError && <div role="alert"><p>{text('Не удалось загрузить список детей. Проверьте соединение и повторите.', 'Балалар тізімі жүктелмеді. Байланысты тексеріп, қайталаңыз.')}</p>
            <button className="btn" onClick={load}>{text('Повторить', 'Қайталау')}</button></div>}
          {!childrenLoaded && !childrenError && <BrandLoader compact />}
          {childrenLoaded && !children.length && !adding && <p className="muted" style={{ marginTop: 14 }}>{t('ui.32')}</p>}
        </main>
      ) : (
        reportLoading || reportError ? <main>
          <button className="link" onClick={() => { reportRequest.current++; setOpenChild(null); }}>{t('ui.33')}</button>
          {reportLoading ? <BrandLoader /> : <div role="alert">
            <p>{text('Не удалось загрузить отчёт. Прогресс сохранён; попробуйте ещё раз.', 'Есепті жүктеу мүмкін болмады. Прогресс сақталған; қайта көріңіз.')}</p>
            <button className="btn" onClick={() => openResults(openChild)}>{text('Повторить', 'Қайталау')}</button>
          </div>}
        </main> : <ChildReport child={openChild} mocks={mocks} stats={stats} diagnostics={diagnostics} lang={lang} onBack={() => { reportRequest.current++; setOpenChild(null); }} t={t} />
      )}
    </div>
  );
}

// Мәтінді буферге көшіру
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
}

function CopyRow({ label, value }) {
  const { lang } = useLang();
  const [ok, setOk] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, background: '#fff',
      border: '1px solid var(--line)', padding: '11px 14px', marginBottom: 8,
    }}>
      <span style={{ font: "500 11px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: '#9A9384', width: 78 }}>
        {label}
      </span>
      <b style={{ flex: 1, font: "600 16px 'IBM Plex Mono',monospace", letterSpacing: '.02em' }}>{value}</b>
      <button className="link" style={{ padding: '4px 8px', color: ok ? 'var(--green)' : 'var(--muted)' }}
        onClick={async () => { if (await copy(value)) { setOk(true); setTimeout(() => setOk(false), 1500); } }}>
        {ok ? (lang === 'ru' ? '✓ скопировано' : '✓ көшірілді') : (lang === 'ru' ? 'копировать' : 'көшіру')}
      </button>
    </div>
  );
}

function ChildPasswordCard({ child, onClose }) {
  const { lang } = useLang();
  const text = (ru, kk) => lang === 'ru' ? ru : kk;
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const submitting = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function save() {
    if (submitting.current || password.length < 6) return;
    submitting.current = true; setBusy(true); setError(''); setSaved(false);
    try {
      await resetChildPassword(child.uid, password);
      if (mounted.current) setSaved(true);
    } catch (e) {
      if (mounted.current) setError(e.passwordChanged === true
        ? text('PIN изменён, но старые сессии пока не закрыты. Повторите с этим же PIN.', 'PIN өзгерді, бірақ ескі сеанстар жабылмады. Осы PIN-мен қайталаңыз.')
        : errText(e, lang));
    } finally {
      submitting.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return <div className="card" style={{ marginTop: 16 }}>
    <h2>{text('Новый PIN для', 'Жаңа PIN:')} {child.name}</h2>
    <p className="muted">{text('Логин и прогресс ребёнка останутся прежними.', 'Баланың логині мен прогресі сақталады.')}</p>
    <label style={lab} htmlFor="child-new-pin">{text('PIN — минимум 6 символов', 'PIN — кемінде 6 таңба')}</label>
    <input id="child-new-pin" style={inp} value={password} disabled={busy} autoComplete="new-password" maxLength={128}
      onChange={(e) => { setPassword(e.target.value); setSaved(false); }} />
    {error && <p role="alert">{error}</p>}
    {saved && <div role="status"><p>{text('PIN сохранён. Передайте его ребёнку.', 'PIN сақталды. Балаға беріңіз.')}</p><CopyRow label="PIN" value={password} /></div>}
    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
      <button className="btn accent" disabled={busy || password.length < 6 || saved} onClick={save}>{busy ? '…' : text('Сохранить PIN', 'PIN сақтау')}</button>
      <button className="btn ghost" disabled={busy} onClick={onClose}>{text('Закрыть', 'Жабу')}</button>
    </div>
  </div>;
}

// ── Ата-анаға арналған есеп: дайындық, апталық баллдар, тақырыптық жылу картасы ──
const LVL_COL = { strong: '#4C7A4E', mid: '#B8892B', weak: '#B0342B' };
const LVL_BG = { strong: '#EEF5EC', mid: '#FBF3E3', weak: '#FBEDEC' };
const LVL_TXT = { strong: 'МЫҚТЫ', mid: 'ОРТАША', weak: 'ӘЛСІЗ' };

function ChildReport({ child, mocks, stats, diagnostics, lang, onBack, t }) {
  const text = (ru, kk) => lang === 'ru' ? ru : kk;
  const levels = lang === 'ru' ? { strong: 'СИЛЬНО', mid: 'СРЕДНЕ', weak: 'СЛАБО' } : LVL_TXT;
  // Толық дашборд әрқашан көрінеді. Есеп шығарылмаған тақырыптар да тұрады — тек 0%.
  const all = stats.length ? stats : [];
  const used = all.filter((s) => s.tried);
  const started = used.length > 0;
  const ready = readiness(stats);
  const series = mockSeries(mocks);
  const maxScore = Math.max(1, ...series.map((s) => s.max || 60));
  const counts = { strong: 0, mid: 0, weak: 0 };
  used.forEach((s) => counts[s.level]++);
  const weak = [...used].sort((a, b) => a.pct - b.pct).slice(0, 2);
  const diagnostic = diagnostics?.[0];
  const diagnosticWeak = diagnostic?.topics?.filter((item) => item.level !== 'strong').slice(0, 3) || [];
  const shareText = buildDiagnosticShareText(diagnostic, child.name, lang);

  return (
    <main>
      <button className="link" onClick={onBack}>{t('ui.33')}</button>
      <p className="kicker">{text('Отчёт · последние недели', 'Есеп · соңғы апталар')}</p>
      <h1 style={{ marginBottom: 6 }}>{child.name}</h1>
      <div style={{ borderTop: '2px solid var(--ink)', margin: '10px 0 20px' }} />

      {!started && (
        <div className="card" style={{ marginBottom: 16, background: '#FBF3E3', borderColor: 'var(--mid,#B8892B)' }}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6 }}>
            {text(`${child.name} ещё не решал задачи. После начала тренировок здесь появятся результаты.`, `${child.name} әлі есеп шығара бастаған жоқ. Ол кіріп жаттыға бастаған соң, мұндағы сандар нақты деректермен толады.`)}
          </p>
        </div>
      )}

      <div className="grid2" style={{ marginBottom: 16 }}>
        {/* Жалпы дайындық */}
        <div className="card">
          <p className="kicker" style={{ margin: '0 0 14px' }}>{text('Общая подготовка', 'Жалпы дайындық')}</p>
          <div className="bar" style={{ marginBottom: 16 }}><i style={{ width: ready + '%' }} /></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
            <div style={{ font: "700 44px 'Lora',serif", lineHeight: 1 }}>
              {ready}<span style={{ fontSize: 22, color: 'var(--accent)' }}>%</span>
            </div>
            <div style={{ flex: 1, fontSize: 13.5 }}>
              {['strong', 'mid', 'weak'].map((k) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', color: LVL_COL[k] }}>
                  <span>■ {levels[k].toLowerCase()}</span><b>{counts[k]}</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Сынақ баллдары */}
        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <span className="kicker" style={{ margin: 0 }}>{text('Баллы за тест / неделя', 'Сынақ балы / апта')}</span>
            <span className="tag">{text(`из ${maxScore}`, `${maxScore}-тан`)}</span>
          </div>
          {series.length ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110 }}>
              {series.map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ font: "700 12px 'IBM Plex Mono',monospace", color: i === series.length - 1 ? 'var(--accent)' : '#6B655B' }}>{s.score}</div>
                  <div style={{
                    height: `${(s.score / maxScore) * 74}px`, minHeight: 3, marginTop: 4,
                    background: i === series.length - 1 ? 'var(--accent)' : '#D8D3C8',
                  }} />
                  <div style={{ font: "500 10px 'IBM Plex Mono',monospace", color: '#9A9384', marginTop: 5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          ) : <p className="muted" style={{ margin: 0 }}>{text('Тесты ещё не пройдены.', 'Сынақ әлі тапсырылмаған.')}</p>}
        </div>
      </div>

      {diagnostic && (
        <section className="parent-diagnostic-card">
          <div className="parent-diagnostic-head">
            <div><p className="kicker">SYNAQ DIAGNOSTIC</p><h2>{lang === 'ru' ? 'Диагностика знаний' : 'Білім диагностикасы'}</h2></div>
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">WhatsApp ↗</a>
          </div>
          <div className="parent-diagnostic-summary">
            <strong>{diagnostic.readiness}%</strong>
            <span>{diagnostic.correct}/{diagnostic.total} {lang === 'ru' ? 'правильно' : 'дұрыс'}</span>
            <small>{new Date(diagnostic.completedAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'kk-KZ')}</small>
          </div>
          <div className="parent-diagnostic-weak">
            {diagnosticWeak.map((item) => <div key={item.moduleId}><span>{item.title?.[lang === 'ru' ? 'ru' : 'kk']}</span><b>{item.pct}%</b></div>)}
          </div>
          <div className="parent-diagnostic-history">
            {diagnostics.slice(0, 6).reverse().map((item, i) => <i key={item.id || i} title={`${item.readiness}%`} style={{ height: `${Math.max(8, item.readiness)}%` }} />)}
          </div>
          <p className="parent-diagnostic-next">{daysUntilDiagnostic(diagnostic.completedAt) ? (lang === 'ru' ? `Повторная проверка через ${daysUntilDiagnostic(diagnostic.completedAt)} дн.` : `Қайта тексеруге ${daysUntilDiagnostic(diagnostic.completedAt)} күн қалды`) : (lang === 'ru' ? 'Пора пройти повторную диагностику' : 'Қайта диагностикадан өтетін уақыт келді')}</p>
        </section>
      )}

      {/* Ұсыныс */}
      {!!weak.length && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent)', marginBottom: 16 }}>
          <p className="kicker" style={{ color: 'var(--accent)', margin: '0 0 8px' }}>{text('Рекомендация', 'Ұсыныс')}</p>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6 }}>
            {text(`Уделите больше внимания темам: ${weak.map((w) => `${w.name} (${w.pct}%)`).join(', ')}.`, `${weak.map((w) => `${w.name} (${w.pct}%)`).join(' мен ')} тақырыптарына көбірек көңіл бөліңіз — қазір ең әлсіз тұсы.`)}
          </p>
        </div>
      )}

      {/* Тақырыптық жылу картасы — барлық тақырып (шығарылмағаны 0%) */}
      <p className="kicker">{text('Подготовка по темам', 'Тақырыптық жылу картасы')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginBottom: 22 }}>
        {all.map((s) => (
          <div key={s.id} style={{
            border: `1px solid ${s.tried ? LVL_COL[s.level] : 'var(--line)'}`,
            background: s.tried ? LVL_BG[s.level] : '#fff', padding: '12px 13px',
            opacity: s.tried ? 1 : 0.6,
          }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.35, marginBottom: 8, minHeight: 34 }}>{s.name}</div>
            <b style={{ font: "700 17px 'Golos Text'", color: s.tried ? LVL_COL[s.level] : '#9A9384' }}>{s.pct}%</b>
          </div>
        ))}
      </div>

      {/* Тақырыптар тізімі — деңгеймен (барлығы) */}
      <p className="kicker">{text('Карта прогресса', 'Прогресс картасы')}</p>
      <div className="list">
        {all.map((s) => (
          <div key={s.id} className="row-item" style={{ cursor: 'default', opacity: s.tried ? 1 : 0.6 }}>
            <div style={{ flex: 1 }}>
              <b>{s.name}</b>
              <div style={{ font: "500 11.5px 'IBM Plex Mono',monospace", color: '#9A9384', marginTop: 3 }}>
                {s.tried} {text('вопросов', 'сұрақ')}{s.days ? ` · ${s.days} ${text('дн.', 'күн')}` : ''}
              </div>
            </div>
            <div style={{ width: 130 }}>
              <div className="bar"><i style={{ width: s.pct + '%', background: s.tried ? LVL_COL[s.level] : '#D8D3C8' }} /></div>
            </div>
            <span style={{ font: "600 13px 'IBM Plex Mono',monospace", width: 40, textAlign: 'right', color: s.tried ? LVL_COL[s.level] : '#9A9384' }}>{s.pct}</span>
            <span style={{
              font: "600 10px 'IBM Plex Mono',monospace", letterSpacing: '.08em',
              color: s.tried ? LVL_COL[s.level] : '#C4BEB2',
              border: `1px solid ${s.tried ? LVL_COL[s.level] : 'var(--line)'}`, padding: '3px 8px', width: 76, textAlign: 'center',
            }}>{s.tried ? levels[s.level] : '—'}</span>
          </div>
        ))}
      </div>

      {/* Сынақ тарихы */}
      {!!mocks.length && (
        <>
          <p className="kicker" style={{ marginTop: 24 }}>{t('ui.34')}</p>
          <div className="list">
            {mocks.map((m, i) => (
              <div className="row-item" key={i} style={{ cursor: 'default' }}>
                <b style={{ flex: 1 }}>{m.school || 'Мок-тест'}</b>
                <span className="rt">{m.score}/{m.gradable} балл</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

const lab = { display: 'block', font: "500 11px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: '#9A9384', marginBottom: 6 };
const inp = { width: '100%', padding: '12px 14px', border: '1px solid var(--line)', background: '#fff', font: "500 15px 'Golos Text'", color: 'var(--ink)', outline: 'none' };

function LoginPasswordCard({ t }) {
  const { lang } = useLang();
  const email = auth.currentUser?.email || '';
  const [linked, setLinked] = useState(() => hasPasswordLogin(auth.currentUser));
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState('');
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    auth.currentUser?.reload().then(() => {
      setLinked(hasPasswordLogin(auth.currentUser));
    }).catch(() => {});
  }, []);

  async function save() {
    setErr(''); setMsg(''); setBusy(true);
    try {
      if (pass1.length < 6) throw Object.assign(new Error('weak'), { code: 'auth/weak-password' });
      if (pass1 !== pass2) throw new Error('mismatch');
      if (linked && editing) {
        await changeParentPassword(current, pass1);
      } else {
        await linkParentPassword(pass1);
        setLinked(true);
      }
      setMsg(t('parent.passSaved'));
      setCurrent(''); setPass1(''); setPass2(''); setEditing(false);
    } catch (e) {
      setErr(e.message === 'mismatch' ? t('parent.passMismatch') : errText(e, lang));
    }
    setBusy(false);
  }

  if (linked && !editing) {
    return (
      <div className="card" style={{ marginBottom: 20, background: '#EEF5EC', borderColor: 'var(--green)' }}>
        <p className="kicker" style={{ margin: '0 0 8px', color: 'var(--green)' }}>{t('parent.loginTitle')}</p>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
          {t('parent.loginDone').replace('{email}', email)}
        </p>
        <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => { setEditing(true); setMsg(''); setErr(''); }}>
          {t('parent.changePass')}
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <p className="kicker" style={{ margin: '0 0 8px' }}>{t('parent.loginTitle')}</p>
      <p className="muted" style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.55 }}>{t('parent.loginHint')}</p>
      {email && (
        <p style={{ margin: '0 0 12px', font: "600 14px 'IBM Plex Mono',monospace", color: '#6B655B' }}>{email}</p>
      )}
      {linked && editing && (
        <div style={{ marginBottom: 10 }}>
          <label style={lab}>{t('parent.currentPass')}</label>
          <input type="password" style={inp} value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
      )}
      <div style={{ marginBottom: 10 }}>
        <label style={lab}>{t('parent.newPass')}</label>
        <input type="password" style={inp} value={pass1} onChange={(e) => setPass1(e.target.value)} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={lab}>{t('parent.newPass2')}</label>
        <input type="password" style={inp} value={pass2} onChange={(e) => setPass2(e.target.value)} />
      </div>
      {err && <p style={{ color: 'var(--accent)', fontSize: 13, margin: '0 0 10px' }}>{err}</p>}
      {msg && <p style={{ color: 'var(--green)', fontSize: 13, margin: '0 0 10px' }}>{msg}</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn accent" disabled={busy || !pass1 || !pass2 || (linked && editing && !current)} onClick={save}>
          {busy ? '…' : linked ? t('parent.changePass') : t('parent.setPass')}
        </button>
        {linked && editing && (
          <button className="btn ghost" disabled={busy} onClick={() => { setEditing(false); setCurrent(''); setPass1(''); setPass2(''); setErr(''); }}>
            {t('common.back')}
          </button>
        )}
      </div>
    </div>
  );
}
