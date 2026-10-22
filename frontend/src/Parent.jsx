import React, { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useLang } from './i18n.jsx';
import {
  auth, db, familyPlan, createChild, getChildren, logout,
  genPassword, suggestUsername, cleanUsername, errText,
  hasPasswordLogin, linkParentPassword, changeParentPassword, resetChildPassword,
} from './firebase.js';
import Brand from './Brand.jsx';
import ParentDashboard from './ParentDashboard.jsx';
import RewardApprovals from './RewardApprovals.jsx';
import BrandLoader from './components/BrandLoader.jsx';
import { checkoutErrorMessage, checkoutNeedsVerification, isCheckoutDestination, isDodoPortalDestination } from './checkoutMessages.js';
import PetAvatar, { DEFAULT_PET_AVATAR, PET_AVATARS } from './PetAvatar.jsx';
import { planPrice } from './plans.js';
import ParentLessons from './ParentLessons.jsx';
import Notifications from './Notifications.jsx';
import './ParentWorkspace.css';
import { lessonsCall } from './lessonsApi.js';

const Logo = () => <div className="logo"><Brand compact /></div>;

// synaq_want_pro флагі осы уақыттан ескі болса құрметтелмейді (бөлек
// абзацта түсіндірілген — ортақ компьютердегі ескі белгі мәселесі).
const WANT_PRO_TTL_MS = 30 * 60 * 1000;
const planRank = (value) => ({ free: 0, standard: 1, pro: 2, mentor: 3 }[value] || 0);

export default function Parent({ onExit }) {
  const { t, lang, setLang } = useLang();
  const text = (ru, kk) => lang === 'ru' ? ru : kk;
  const exit = async () => {
    await (onExit || logout)();
  };
  const [plan, setPlan] = useState(null);    // null — әлі жүктелуде
  const pro = plan === 'mentor';        // карточка «Pro с наставником»
  const full = plan === 'pro';          // карточка Standard (полный доступ, самостоятельно)
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
    return ['1', 'standard', 'pro', 'mentor'].includes(paid);
  });
  const [upgradeSent, setUpgradeSent] = useState(false);
  const requestUpgrade = async (lessons) => {
    try { await lessonsCall({ action: 'upgrade_request', lessons }); setUpgradeSent(true); }
    catch { setPaymentIssue({ code: 'checkout_unavailable', status: 503 }); }
  };
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
      const expectedPlan = paidTarget === 'mentor' ? 'mentor' : 'pro';
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
      let wantedPlan = null, wantedLessons = null;
      try {
        const rawPlan = localStorage.getItem('synaq_want_plan');
        localStorage.removeItem('synaq_want_plan');
        if (rawPlan) {
          const intent = JSON.parse(rawPlan);
          const ts = Number(intent?.at);
          if (['pro', 'mentor'].includes(intent?.plan) && Number.isFinite(ts) && Date.now() >= ts && Date.now() - ts < WANT_PRO_TTL_MS) {
            wantedPlan = intent.plan; wantedLessons = [2, 3].includes(intent.lessons) ? intent.lessons : 2;
          }
        }
        const raw = localStorage.getItem('synaq_want_pro');
        localStorage.removeItem('synaq_want_pro');
        const ts = Number(raw);
        if (!wantedPlan && raw != null && Number.isFinite(ts) && Date.now() >= ts && Date.now() - ts < WANT_PRO_TTL_MS) wantedPlan = 'pro';
      } catch {}
      if (wantedPlan && planRank(currentPlan) < planRank(wantedPlan) && !paymentPending) buyPlan(wantedPlan, wantedLessons);
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
  async function buyPlan(targetPlan, lessons = null) {
    if (!['pro', 'mentor'].includes(targetPlan)) return;
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
        body: JSON.stringify(targetPlan === 'mentor' ? { plan: targetPlan, lessons } : { plan: targetPlan }),
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
    return () => { mounted.current = false; childrenRequest.current++; };
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
    if (!pass && value.trim()) setPass(genPassword());
  }

  // Кірген соң бала жоқ болса — «Бала қосу» формасын бірден ашамыз
  useEffect(() => {
    if (childrenLoaded && firstLoad && !children.length && !created) { setAdding(true); setFirstLoad(false); }
  }, [children, childrenLoaded, firstLoad, created]);

  return (
    <div className="app parent-app">
      <header className="parent-header">
        <div className="parent-brand"><Logo /><span>{text('Кабинет родителя', 'Ата-ана кабинеті')}</span></div>
        <div className="parent-header-actions"><Notifications role="parent" /><button className="parent-language" type="button" onClick={() => setLang(lang === 'ru' ? 'kk' : 'ru')} aria-label={text('Қазақ тіліне ауысу', 'Переключить на русский')}>{lang === 'ru' ? 'ҚАЗ' : 'РУС'}</button><button className="logout" onClick={exit}>{t('ui.26')}</button></div>
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
        <div className="card parent-created" style={{ marginTop: 16, borderColor: 'var(--green)', background: '#EEF5EC' }}>
          <div className="row" style={{ marginBottom: 10 }}>
            <p className="kicker" style={{ color: 'var(--green)', margin: 0 }}>{text(`Аккаунт ${created.name} создан`, `${created.name} аккаунты жасалды`)}</p>
            {/* Пароль ашық мәтінмен көрінеді — ортақ/қоғамдық компьютерде
                экранда мәңгі қалып қоймауы үшін жабу батырмасы керек. */}
            <button className="link" onClick={() => setCreated(null)} aria-label={text('Закрыть', 'Жабу')}>✕</button>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 14 }}>{text('Передайте ребёнку эти данные для входа:', 'Балаға осыны беріңіз — ол осымен кіреді:')}</p>

          <CopyRow label={text('Логин', 'Логин')} value={created.code} />
          <CopyRow label={text('Пароль', 'Құпиясөз')} value={created.pass} />

          <button className="btn ghost" style={{ marginTop: 12 }}
            onClick={() => copy(`Synaq\nЮзернейм: ${created.code}\nПароль: ${created.pass}`)}>
            {text('Скопировать логин и пароль', 'Екеуін де көшіру')}
          </button>
          <a className="btn ghost" style={{ marginTop: 12, marginLeft: 8, display: 'inline-block' }} target="_blank" rel="noreferrer"
            href={`https://wa.me/?text=${encodeURIComponent(`Synaq (synaq.app)\n${text('Логин', 'Логин')}: ${created.code}\n${text('Пароль', 'Құпиясөз')}: ${created.pass}`)}`}>
            {text('Отправить в WhatsApp', 'WhatsApp-қа жіберу')}
          </a>
        </div>
      )}

      {(
        <main>
          <div className="parent-intro">
            <span className="parent-eyebrow">{text('Вместе к большим целям', 'Үлкен мақсатқа бірге')}</span>
            <h1>{me ? text(`Привет, ${me}!`, `Сәлем, ${me}!`) : text('Ваш семейный кабинет', 'Сіздің отбасы кабинетіңіз')}</h1>
            <p>{children.length ? text('Подготовка, успехи и следующие шаги ребёнка — рядом.', 'Баланың дайындығы, жетістігі мен келесі қадамдары — осында.') : text('Создайте профиль ребёнка — и начните подготовку вместе.', 'Балаңызға профиль ашып, дайындықты бірге бастаңыз.')}</p>
          </div>
          <ParentDashboard children={children} lang={lang} />

          <div className="parent-children-head">
            <div><span className="parent-eyebrow">{text('Личный профиль', 'Жеке профиль')}</span><h2>{text('Аккаунт ребёнка', 'Бала аккаунты')}</h2></div>
            {childrenLoaded && children.length === 0 && (
              <button className="btn" disabled={busy} onClick={() => { setAdding(!adding); setErr(''); }}>{adding ? text('Свернуть', 'Жинау') : t('ui.28')}</button>
            )}
          </div>

          <div className={`parent-setup${children.length ? ' has-child' : ''}`}>
            {!children.length && <aside className="parent-start" aria-labelledby="parent-start-title">
              <span className="parent-eyebrow">SYNAQ · {text('БИЛ, НИШ, РФМШ', 'БИЛ, НИШ, РФМШ')}</span>
              <h2 id="parent-start-title">{text('Большие цели. Первый шаг — здесь.', 'Үлкен мақсат. Алғашқы қадам — осында.')}</h2>
              <img className="parent-start-owl" src="/mascot/synaq-owl-study.webp" width="640" height="640" alt="" decoding="async" />
              <p>{text('Ребёнок учится в своём аккаунте. Вы видите, что получается и где нужна поддержка.', 'Балаңыз өз аккаунтында оқиды. Сіз жетістігін және қай жерде көмек керегін көресіз.')}</p>
              <ol className="parent-start-steps">
                <li><span>1</span><div><strong>{text('Создайте профиль', 'Профиль ашыңыз')}</strong><small>{text('Имя, питомец и данные для входа', 'Аты, кейіпкері және кіру деректері')}</small></div></li>
                <li><span>2</span><div><strong>{text('Передайте ребёнку логин', 'Балаға логинін беріңіз')}</strong><small>{text('Он войдёт в свой учебный кабинет', 'Ол өзінің оқу кабинетіне кіреді')}</small></div></li>
                <li><span>3</span><div><strong>{text('Поддерживайте его успехи', 'Жетістігін қолдаңыз')}</strong><small>{text('Результаты появятся в этом кабинете', 'Нәтижелер осы кабинетте көрінеді')}</small></div></li>
              </ol>
              <span className="parent-start-note">{text('Маленькие шаги. Настоящий прогресс.', 'Кішкентай қадамдар. Нақты жетістік.')}</span>
            </aside>}
          {adding && (
            <form className="parent-child-form" onSubmit={(event) => { event.preventDefault(); if (!busy && name.trim() && childrenLoaded) add(); }}>
              <div className="parent-form-heading"><span className="parent-eyebrow">{text('Знакомство с SYNAQ', 'SYNAQ-пен танысу')}</span><h3>{text('Давайте знакомиться', 'Таныс болайық')}</h3><p>{text('Эти данные нужны для отдельного входа ребёнка.', 'Бұл деректер балаңыздың жеке кіруіне қажет.')}</p></div>
              <div className="parent-field">
                <label htmlFor="parent-child-name">{t('ui.29')}</label>
                <input id="parent-child-name" autoComplete="off" placeholder={t('ui.37')} value={name} style={inp} disabled={busy}
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
                      <span className="parent-pet-art"><PetAvatar id={pet.id} size="picker" appearance="mascot" /></span><small>{lang === 'ru' ? pet.ru : pet.kk}</small>{avatar === pet.id && <span className="parent-pet-check" aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div>
                <label htmlFor="parent-child-login">{text('Логин ребёнка', 'Баланың логині')}</label>
                <input id="parent-child-login" autoComplete="off" autoCapitalize="none" spellCheck={false} aria-describedby="parent-login-hint" placeholder={t('ui.38')} value={username} style={inp} disabled={busy}
                  onChange={(e) => { pendingCreation.current = null; usernameEdited.current = !!e.target.value; setUsername(cleanUsername(e.target.value)); }} />
                <p id="parent-login-hint" className="parent-field-hint">
                  {text('3–32 латинские буквы или цифры', '3–32 латын әрпі немесе цифр')}
                </p>
              </div>
              <div>
                <label htmlFor="parent-child-pin">{text('Пароль для входа', 'Кіру құпиясөзі')}</label>
                <div className="parent-pin-row">
                  <input id="parent-child-pin" autoComplete="new-password" placeholder={t('ui.39')} value={pass} disabled={busy} onChange={(e) => { pendingCreation.current = null; setPass(e.target.value); }} style={{ ...inp, flex: 1 }} />
                  <button className="btn ghost" type="button" disabled={busy} onClick={() => { pendingCreation.current = null; setPass(genPassword()); }} style={{ whiteSpace: 'nowrap' }}>
                    {text('Сгенерировать', 'Генерациялау')}
                  </button>
                </div>
              </div>
              {err && <p role="alert" className="parent-form-error">{err}</p>}
              <button className="btn accent parent-create-button" type="submit" disabled={busy || !name.trim() || !childrenLoaded}>
                {busy ? text('Создаём…', 'Жасалуда…') : text('Создать аккаунт ребёнка', 'Бала аккаунтын ашу')} <span aria-hidden="true">→</span>
              </button>
              <p className="parent-form-footnote">{text('После создания покажем логин и PIN — сохраните их для ребёнка.', 'Аккаунт ашылғанда логин мен PIN көрсетіледі — балаңызға сақтап қойыңыз.')}</p>
            </form>
          )}

          <div className="parent-child-list">
            {children.map((c) => (
              <article className="parent-child-card" key={c.uid}>
                <PetAvatar id={c.avatar} size="small" />
                <div className="parent-child-identity"><span className="parent-eyebrow">{text('Учебный аккаунт', 'Оқу аккаунты')}</span><h3>{c.name}</h3><p>{text('Ребёнок входит со своим логином и PIN.', 'Бала өз логині мен PIN арқылы кіреді.')}</p></div>
                <CopyRow label={text('Логин', 'Логин')} value={c.code} />
                <button className="link" onClick={(event) => { event.stopPropagation(); setResetChild(c); }}>{text('Изменить PIN', 'PIN өзгерту')}</button>
              </article>
            ))}
          </div>
          {resetChild && <ChildPasswordCard key={resetChild.uid} child={resetChild} onClose={() => setResetChild(null)} />}
          {childrenError && <div role="alert"><p>{text('Не удалось загрузить список детей. Проверьте соединение и повторите.', 'Балалар тізімі жүктелмеді. Байланысты тексеріп, қайталаңыз.')}</p>
            <button className="btn" onClick={load}>{text('Повторить', 'Қайталау')}</button></div>}
          {!childrenLoaded && !childrenError && <BrandLoader compact />}
          {childrenLoaded && !children.length && !adding && <p className="muted" style={{ marginTop: 14 }}>{t('ui.32')}</p>}
          </div>
          {children.length > 0 && <RewardApprovals children={children} lang={lang} />}

          <details className="pd-settings parent-account-settings" open={paymentPending || !!paymentIssue || !!portalError || undefined}>
            <summary><span className="parent-settings-icon" aria-hidden="true">☷</span><strong>{text('Тариф и настройки аккаунта', 'Тариф және аккаунт баптаулары')}</strong> <span className="parent-plan-chip">{plan === 'standard' ? text('Standard · архивный', 'Standard · архивтік') : plan === 'pro' ? 'Standard' : plan === 'mentor' ? 'Pro' : plan === 'free' ? text('Бесплатный', 'Тегін') : '…'}</span></summary>
          {/* Үш тариф: тегін, Standard және Pro. */}
          {plan !== null && (
            <div className="parent-plan-grid">
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
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', font: "500 13.5px 'Golos Text',system-ui,sans-serif", lineHeight: 2 }}>
                  <li>✓ {t('plan.f1')}</li>
                  <li>✓ {t('plan.f2')}</li>
                  <li style={{ color: '#B0B0A6' }}>✗ {t('plan.f3')}</li>
                  <li style={{ color: '#B0B0A6' }}>✗ {t('plan.f4')}</li>
                </ul>
              </div>

              {/* ── Standard ── */}
              <div className="card" style={{
                borderColor: full ? '#2F80ED' : 'var(--line)', borderWidth: full ? 2 : 1,
                background: full ? '#EEF6FF' : '#fff',
              }}>
                <div className="row" style={{ marginBottom: 10 }}>
                  <p className="kicker" style={{ margin: 0, color: '#2F80ED' }}>{t('plan.standard')}</p>
                  {full && <span className="tag" style={{ borderColor: '#2F80ED', color: '#2F80ED' }}>{t('plan.active')}</span>}
                </div>
                <div style={{ font: "700 26px 'Lora',serif", marginBottom: 12 }}>
                  {planPrice('pro', lang)}<span style={{ font: "500 13px 'Golos Text',system-ui,sans-serif", color: '#9A9384' }}>{t('plan.month')}</span>
                </div>
                <ul style={{ margin: '0 0 14px', padding: 0, listStyle: 'none', font: "500 13.5px 'Golos Text',system-ui,sans-serif", lineHeight: 2 }}>
                  <li>✓ {t('plan.s1')}</li><li>✓ {t('plan.s2')}</li><li>✓ {t('plan.s3')}</li><li>✓ {t('plan.s4')}</li>
                </ul>
                {full ? <div style={{ font: "600 13px 'Golos Text',system-ui,sans-serif", color: '#2F80ED' }}>{t('plan.activeNote')}</div>
                  : plan === 'free' && <button className="btn" disabled={paying || paymentPending || checkoutHold}
                    onClick={() => buyPlan('pro')} style={{ width: '100%' }}>{paying ? '…' : t('plan.chooseStandard')}</button>}
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
                  <small style={{ font: "500 13px 'Golos Text',system-ui,sans-serif", color: '#9A9384', marginRight: 6 }}>{t('plan.from')}</small>{planPrice('mentor', lang)}<span style={{ font: "500 13px 'Golos Text',system-ui,sans-serif", color: '#9A9384' }}>{t('plan.month')}</span>
                </div>
                <ul style={{ margin: '0 0 14px', padding: 0, listStyle: 'none', font: "500 13.5px 'Golos Text',system-ui,sans-serif", lineHeight: 2 }}>
                  <li>✓ {t('plan.p1')}</li>
                  <li>✓ {t('plan.p2')}</li>
                  <li>✓ {t('plan.p3')}</li>
                  <li>✓ {t('plan.p4')}</li>
                </ul>
                {pro ? (
                  <div style={{ font: "600 13px 'Golos Text',system-ui,sans-serif", color: 'var(--green)' }}>{t('plan.activeNote')}</div>
                ) : plan === 'pro' ? (
                  upgradeSent ? <div style={{ font: "600 13px 'Golos Text',system-ui,sans-serif", color: 'var(--green)' }}>{text('Заявка отправлена — мы свяжемся с вами', 'Өтінім жіберілді — сізбен байланысамыз')}</div>
                    : <>{[2, 3].map((n) => <button key={n} className="btn accent" type="button" style={{ width: '100%', marginTop: n === 2 ? 0 : 8 }} onClick={() => requestUpgrade(n)}>
                      {text('Хочу перейти: ', 'Көшкім келеді: ')}{t('plan.lessons' + n)}</button>)}
                      <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>{text('Переход делаем вручную, без двойной оплаты. Мы свяжемся с вами.', 'Көшуді қолмен жасаймыз, қос төлемсіз. Сізбен байланысамыз.')}</p></>
                ) : [2, 3].map((n) => (
                  <button key={n} className="btn accent" disabled={paying || paymentPending || checkoutHold} onClick={() => buyPlan('mentor', n)} style={{ width: '100%', marginTop: n === 2 ? 0 : 8 }}>
                    {checkoutHold ? text('Нужна проверка оплаты', 'Төлемді тексеру қажет') : paymentPending ? text('Проверяем оплату…', 'Төлем тексерілуде…') : paying ? '…' : `${t('plan.lessons' + n)} · ${planPrice('mentor', lang, n)}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {plan === 'mentor' && <ParentLessons />}

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
          </details>


        </main>
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
    <div className="parent-copy-row">
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

const lab = { display: 'block', font: "600 12px 'Golos Text',sans-serif", color: '#526782', marginBottom: 7 };
const inp = { width: '100%', padding: '12px 14px', border: '1px solid var(--line)', background: '#fff', font: "500 16px 'Golos Text',system-ui,sans-serif", color: 'var(--ink)' };

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
          <label style={lab} htmlFor="parent-current-password">{t('parent.currentPass')}</label>
          <input id="parent-current-password" type="password" autoComplete="current-password" style={inp} value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
      )}
      <div style={{ marginBottom: 10 }}>
        <label style={lab} htmlFor="parent-new-password">{t('parent.newPass')}</label>
        <input id="parent-new-password" type="password" autoComplete="new-password" style={inp} value={pass1} onChange={(e) => setPass1(e.target.value)} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={lab} htmlFor="parent-confirm-password">{t('parent.newPass2')}</label>
        <input id="parent-confirm-password" type="password" autoComplete="new-password" style={inp} value={pass2} onChange={(e) => setPass2(e.target.value)} />
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
