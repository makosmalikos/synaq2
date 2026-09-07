import React from 'react';
import { LangSwitch, useLang } from './i18n.jsx';
import Brand from './Brand.jsx';

// ── ВИДЕО ДЕМО ──
// Сюда вставь ссылку. Понимает три варианта:
//   1) файл:     '/figures/demo.mp4'  — сам файл положи в frontend/public/figures/demo.mp4
//                 (имя файла должно совпадать со строкой ниже)
//   2) YouTube:  'https://youtu.be/XXXX'
//   3) пусто:    '' — на месте видео будет заглушка
const DEMO_VIDEO = '/figures/demo.mp4';

// YouTube-ссылку любого вида превращаем в embed.
// Параметры максимально убирают обвязку: без заголовка и аватара сверху,
// без похожих роликов в конце, без подсказок. Логотип YouTube в углу убрать нельзя —
// если он мешает, хостите видео файлом (/figures/demo.mp4).
function ytEmbed(url) {
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{6,})/);
  if (!m) return null;
  const id = m[1];
  const p = new URLSearchParams({
    autoplay: '1',        // сам запускается
    mute: '1',            // без звука — иначе браузер запретит автозапуск
    loop: '1',
    playlist: id,         // нужен, чтобы loop работал для одного ролика
    controls: '0',        // без панели управления → без верхней плашки с названием
    modestbranding: '1',
    rel: '0',             // в конце не показывать чужие ролики
    iv_load_policy: '3',  // без аннотаций
    playsinline: '1',
    disablekb: '1',
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${p}`;
}

function Demo() {
  const { t } = useLang();
  const [failed, setFailed] = React.useState(false);
  // 56.25% = 16:9. Через padding, а не aspect-ratio: работает везде и не схлопывается в 0.
  const box = { position: 'relative', width: '100%', height: 0, paddingTop: '56.25%', borderRadius: '18px', overflow: 'hidden', background: '#167ACB' };
  const fill = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0, display: 'block' };

  if (!DEMO_VIDEO || failed) return (
    <div style={box}>
      <div style={{ ...fill, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px', textAlign: 'center', padding: '0 20px' }}>
        <span style={{ font: "600 12px 'IBM Plex Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#FFFFFF' }}>{t('lp.1')}</span>
        <span style={{ font: "500 15px 'Golos Text',sans-serif", color: '#DCEEFF' }}>
          {failed ? `Видео жүктелмеді: ${DEMO_VIDEO} табылмады` : 'Видео жақында қосылады'}
        </span>
      </div>
    </div>
  );

  const yt = ytEmbed(DEMO_VIDEO);
  return (
    <div style={box}>
      {yt
        ? <>
            <iframe src={yt} title="Synaq demo" loading="lazy" style={{ ...fill, pointerEvents: 'none' }}
              allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            <div style={fill} />
          </>
        : <video src={DEMO_VIDEO} controls playsInline muted autoPlay loop preload="metadata"
            onError={() => setFailed(true)} style={{ ...fill, objectFit: 'contain', background: '#0D5FA4' }} />}
    </div>
  );
}

function HeroVisual() {
  const { t } = useLang();
  const schoolLogos = [
    { src: '/schools/bil.png', alt: 'БИЛ' },
    { src: '/schools/rfmsh.png', alt: 'РФМШ' },
    { src: '/schools/nis.png', alt: 'НИШ' },
  ];
  const students = [
    { src: '/hero/students/cutout-1.png', alt: 'Оқушы қыз дәптермен' },
    { src: '/hero/students/cutout-2.png', alt: 'Оқушы бала рюкзакпен' },
    { src: '/hero/students/cutout-3.png', alt: 'Оқушы қыз' },
    { src: '/hero/students/cutout-4.png', alt: 'Оқушы бала планшетпен' },
    { src: '/hero/students/cutout-5.png', alt: 'Оқушы қыз рюкзакпен' },
  ];
  return (
    <div className="lp-hero-stage" aria-label={t('lp.heroVisualLabel')}>
      <div className="lp-orbit lp-orbit-a" />
      <div className="lp-orbit lp-orbit-b" />

      <div className="lp-students-visual" role="img" aria-label="SYNAQ платформасында дайындалып жүрген оқушылар">
        <div className="lp-students-track">
          {[0, 1].map((set) => (
            <div className="lp-students-set" aria-hidden={set === 1} key={set}>
              {students.map((student, index) => (
                <div className={`lp-student-cutout lp-student-cutout-${index + 1}`} key={student.src}>
                  <div className="lp-student-pattern" aria-hidden="true"><i /><i /><i /></div>
                  <img src={student.src} alt={set === 0 ? student.alt : ''} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="lp-school-carousel" aria-label="БИЛ, РФМШ, НИШ">
        <div className="lp-school-glow" />
        <div className="lp-school-frame">
          {schoolLogos.map((logo, index) => (
            <div className={`lp-school-slide lp-school-slide-${index + 1}`} key={logo.alt}>
              <img src={logo.src} alt={`${logo.alt} логотипі`} />
            </div>
          ))}
        </div>
        <div className="lp-school-dots" aria-hidden="true"><i /><i /><i /></div>
      </div>

      <div className="lp-signal lp-signal-ai"><div className="lp-signal-card"><em>⚡</em><span>{t('lp.heroAI')}</span></div></div>
      <div className="lp-signal lp-signal-format"><div className="lp-signal-card"><em>🎯</em><span>{t('lp.heroFormat')}</span></div></div>
      <div className="lp-signal lp-signal-progress"><div className="lp-signal-card"><em>📊</em><span>{t('lp.heroProgress')}</span></div></div>
    </div>
  );
}

export default function Landing({ onStart }) {
  const { t } = useLang();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const handleStart = (e) => { e.preventDefault(); setMenuOpen(false); onStart(); };
  const closeMenu = () => setMenuOpen(false);
  const handleMobileNav = (e, target) => {
    e.preventDefault();
    setMenuOpen(false);
    window.setTimeout(() => {
      document.querySelector(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  React.useEffect(() => {
    const selectors = [
      '#how > .lp-pad > div:first-child',
      '#how .lp-demo',
      '#how .lp-steps .lp-card',
      '#schools > div:first-child',
      '#schools .lp-schools .lp-card',
      '#parents .lp-inside > div',
      '#pricing > div:first-child',
      '#pricing .lp-price',
      '#cta > div',
      '.lp-root > footer',
    ];
    const nodes = [...document.querySelectorAll(selectors.join(','))];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    nodes.forEach((node, index) => {
      node.classList.add('lp-reveal');
      node.style.setProperty('--lp-reveal-delay', `${(index % 4) * 75}ms`);
      if (node.matches('#parents .lp-inside > div:first-child')) node.classList.add('lp-reveal-left');
      if (node.matches('#parents .lp-inside > div:last-child')) node.classList.add('lp-reveal-right');
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  // «Про таңдау»: логин қажет (төлем ата-ана аккаунтына байланады),
  // сондықтан белгі қоямыз — кірген соң кабинет бірден төлемді ашады.
  const handleBuyPro = (e) => {
    e.preventDefault();
    try { localStorage.setItem('synaq_want_pro', '1'); } catch {}
    onStart();
  };
  const handleLeadSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const subject = encodeURIComponent('SYNAQ — жаңа өтінім');
    const body = encodeURIComponent([
      `Аты: ${form.get('name') || '—'}`,
      `Телефон: ${form.get('phone') || '—'}`,
      `Кім: ${form.get('role') || '—'}`,
      `Түсініктеме: ${form.get('comment') || '—'}`,
    ].join('\n'));
    window.location.href = `mailto:support@synaq.app?subject=${subject}&body=${body}`;
  };
  return (
    <div className="lp-root">
      <style>{`
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  section{scroll-margin-top:92px}
  body{margin:0;background:#FFFFFF}
  ::selection{background:#3A9DF5;color:#FFFFFF}
  a{color:inherit;text-decoration:none}
  .lp-root{--lp-blue:#2F80ED;--lp-green:#22C55E;--lp-ink:#111827;--lp-muted:#5B6472;--lp-soft:#EAF5FF;min-height:100vh;background:#fff;color:var(--lp-ink);overflow-x:hidden;font-family:'Geologica','Golos Text',system-ui,sans-serif}
  .lp-site-header{position:sticky!important;top:0;z-index:50;display:block!important;padding:0!important;border:0!important;border-top:4px solid #102E35!important;background:rgba(255,255,255,.94);box-shadow:0 3px 18px rgba(17,24,39,.055);backdrop-filter:blur(18px)}
  .lp-nav{width:100%;max-width:1440px;min-height:92px;margin:0 auto;padding:16px 50px!important}
  .lp-header-home{display:inline-flex;flex:none}
  .lp-header-brand{min-width:182px!important;padding:17px 29px!important;border-radius:14px!important;background:linear-gradient(135deg,#139FEB,#2F80ED)!important;font-size:26px!important;box-shadow:0 12px 26px -13px rgba(47,128,237,.72)!important}
  .lp-navlinks{gap:40px!important;font:650 15px 'Geologica',sans-serif!important;color:#29465F!important}
  .lp-navlinks a{position:relative;padding:11px 0;transition:color .18s ease}
  .lp-navlinks a:after{content:'';position:absolute;left:50%;right:50%;bottom:3px;height:2px;border-radius:99px;background:#2F80ED;transition:left .18s ease,right .18s ease}
  .lp-navlinks a:hover{color:#2F80ED}
  .lp-navlinks a:hover:after{left:0;right:0}
  .lp-header-actions{display:flex;align-items:center;gap:13px}
  .lp-header-lang{padding:4px;border-radius:999px;background:#F2F7FC;border:1px solid rgba(47,128,237,.08)}
  .lp-header-start{min-width:126px;text-align:center;padding:13px 25px!important;background:#1599E8!important;font:700 15px 'Geologica',sans-serif!important}
  .lp-menu-toggle{display:none;width:46px;height:46px;padding:0;border:1px solid rgba(17,24,39,.09);border-radius:13px;background:#F2F7FC;color:#13283C;cursor:pointer;align-items:center;justify-content:center;flex-direction:column;gap:5px}
  .lp-menu-toggle i{display:block;width:21px;height:2px;border-radius:99px;background:currentColor;transition:transform .22s ease,opacity .22s ease}
  .lp-menu-toggle.is-open i:nth-child(1){transform:translateY(7px) rotate(45deg)}
  .lp-menu-toggle.is-open i:nth-child(2){opacity:0}
  .lp-menu-toggle.is-open i:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
  .lp-mobile-menu{display:none;overflow:hidden;max-height:0;opacity:0;background:rgba(255,255,255,.98);border-top:1px solid rgba(47,128,237,.1);transition:max-height .28s ease,opacity .2s ease}
  .lp-mobile-menu-inner{display:flex;flex-direction:column;gap:5px;padding:12px 22px 20px}
  .lp-mobile-menu a{padding:13px 12px;border-radius:12px;color:#29465F;font:650 15px 'Geologica',sans-serif}
  .lp-mobile-menu a:hover{background:#EAF5FF;color:#2F80ED}
  .lp-mobile-language{display:flex;align-items:center;justify-content:space-between;margin-top:5px;padding:12px;border-top:1px solid rgba(47,128,237,.1);color:#8094A7;font:600 12px 'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase}
  .lp-reveal{opacity:0;filter:blur(7px);transform:translate3d(0,34px,0) scale(.985);transition:opacity .72s cubic-bezier(.2,.7,.2,1),transform .78s cubic-bezier(.16,1,.3,1),filter .62s ease;transition-delay:var(--lp-reveal-delay,0ms);will-change:opacity,transform,filter}
  .lp-reveal-left{transform:translate3d(-48px,20px,0) scale(.985)}
  .lp-reveal-right{transform:translate3d(48px,20px,0) scale(.985)}
  .lp-reveal.is-visible{opacity:1;filter:blur(0);transform:translate3d(0,0,0) scale(1)}
  .lp-steps .lp-card.lp-reveal:nth-child(2),.lp-schools .lp-card.lp-reveal:nth-child(2){--lp-reveal-delay:90ms!important}
  .lp-steps .lp-card.lp-reveal:nth-child(3),.lp-schools .lp-card.lp-reveal:nth-child(3){--lp-reveal-delay:180ms!important}
  .lp-steps .lp-card.lp-reveal:nth-child(4){--lp-reveal-delay:270ms!important}
  .lp-cta{border-radius:999px!important;box-shadow:0 8px 22px -9px rgba(47,128,237,.58);transition:filter .18s,transform .18s,box-shadow .18s}
  .lp-cta:hover{filter:brightness(1.05);transform:translateY(-2px);box-shadow:0 12px 28px -9px rgba(47,128,237,.68)}
  .lp-ghost{border-radius:999px!important;transition:background .18s,transform .18s,border-color .18s}
  .lp-ghost:hover{background:rgba(47,128,237,.06);border-color:rgba(47,128,237,.3)!important;transform:translateY(-2px)}
  .lp-card{border-color:rgba(47,128,237,.12)!important;border-radius:20px!important;box-shadow:0 8px 24px rgba(17,24,39,.055);transition:transform .22s,box-shadow .22s,border-color .22s}
  .lp-card:hover{transform:translateY(-5px);border-color:rgba(47,128,237,.25)!important;box-shadow:0 18px 42px -18px rgba(47,128,237,.28)}
  .lp-price:hover{transform:translateY(-5px)}
  .lp-root h1,.lp-root h2,.lp-root h3{font-family:'Geologica','Golos Text',sans-serif!important;font-style:normal!important}
  .lp-root h2{font-weight:800!important;color:var(--lp-ink);letter-spacing:-.035em!important}
  .lp-hero-actions a{min-width:194px;text-align:center}
  .lp-steps .lp-card>div:first-child{width:42px;height:42px;display:grid;place-items:center;border-radius:50%;background:#EAF5FF;color:#2F80ED!important;font:800 14px 'Geologica',sans-serif!important;margin-bottom:17px!important;box-shadow:inset 0 0 0 1px rgba(47,128,237,.1)}
  .lp-steps .lp-card:nth-child(2)>div:first-child{background:#ECFDF5;color:#22A85A!important}
  .lp-steps .lp-card:nth-child(3)>div:first-child{background:#FFF7ED;color:#F97316!important}
  .lp-steps .lp-card:nth-child(4)>div:first-child{background:#F3E8FF;color:#8B5CF6!important}
  .lp-schools .lp-card{position:relative;overflow:hidden}
  .lp-schools .lp-card:before{content:'';position:absolute;left:0;right:0;top:0;height:4px;background:#2F80ED;opacity:.82}
  .lp-schools .lp-card:nth-child(2):before{background:#22C55E}
  .lp-schools .lp-card:nth-child(3):before{background:#8B5CF6}
  #how{position:relative;overflow:hidden;background:#F5F9FF!important}
  #how:before{content:'';position:absolute;width:430px;height:430px;right:-180px;top:-170px;border-radius:50%;background:rgba(47,128,237,.07);pointer-events:none}
  #parents{background:linear-gradient(135deg,#2563EB 0%,#2F80ED 54%,#167ACB 100%)!important}
  #pricing{background:linear-gradient(180deg,#fff 0%,#F7FBFF 100%);border-radius:36px;padding-top:54px!important;padding-bottom:62px!important;font-family:'Manrope','Golos Text',sans-serif}
  .lp-pricing-head{max-width:900px!important;margin-bottom:30px!important}
  .lp-pricing-kicker{display:inline-flex;align-items:center;justify-content:center;padding:8px 16px;border-radius:999px;background:#EAF5FF;color:#2F80ED!important;font:700 12px 'Manrope',sans-serif!important;letter-spacing:.08em!important;margin-bottom:16px!important}
  #pricing .lp-pricing-title{max-width:880px;margin-left:auto!important;margin-right:auto!important;font-family:'Manrope','Golos Text',sans-serif!important;font-size:44px!important;font-weight:600!important;line-height:1.08!important;letter-spacing:-.035em!important}
  .lp-pricing-sub{font-family:'Manrope','Golos Text',sans-serif;font-size:16px!important}
  .lp-prices{max-width:880px!important;gap:18px!important;align-items:start!important}
  .lp-price{font-family:'Manrope','Golos Text',sans-serif;border-radius:24px!important;padding:29px 30px!important}
  .lp-price-standard{border:1.5px solid rgba(47,128,237,.2)!important;background:#fff!important}
  .lp-price-pro{background:#2582D0!important;border-color:#2582D0!important;box-shadow:0 28px 55px -30px rgba(37,130,208,.72)!important}
  .lp-plan-name{font-family:'Manrope',sans-serif!important;font-weight:700!important;letter-spacing:.12em!important}
  .lp-plan-price{font-family:'Manrope','Golos Text',sans-serif!important;font-weight:700!important;letter-spacing:-.045em!important}
  .lp-price-features{flex:none!important;min-height:0!important}
  .lp-price .lp-ghost,.lp-price .lp-cta{font-family:'Manrope','Golos Text',sans-serif!important;font-weight:700!important;margin-top:22px!important}
  .lp-price-pro:before{content:'';position:absolute;inset:1px;border-radius:23px;box-shadow:inset 0 1px 0 rgba(255,255,255,.16);pointer-events:none}
  .lp-lead-wrap{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(360px,.95fr);gap:44px;min-height:650px;padding:54px 58px;border-radius:34px;background:linear-gradient(135deg,#2F80ED 0%,#229DE7 58%,#20B6D8 100%);box-shadow:0 28px 60px -28px rgba(47,128,237,.52);color:#fff}
  .lp-lead-wrap:before{content:'';position:absolute;width:620px;height:620px;right:-105px;top:-160px;border-radius:50%;border:90px solid rgba(255,255,255,.075);pointer-events:none}
  .lp-lead-wrap:after{content:'';position:absolute;width:380px;height:380px;right:115px;bottom:-245px;border-radius:50%;background:rgba(255,255,255,.08);pointer-events:none}
  .lp-lead-copy{position:relative;z-index:2;max-width:610px}
  .lp-lead-copy h2{max-width:590px;margin:0 0 16px!important;color:#fff!important;font-size:45px!important;line-height:1.08!important;letter-spacing:-.035em!important}
  .lp-lead-copy>p{max-width:570px;margin:0 0 30px;color:rgba(255,255,255,.82);font:500 16px/1.55 'Manrope',sans-serif}
  .lp-lead-form{display:grid;grid-template-columns:1fr 1fr;gap:17px 15px}
  .lp-lead-field{display:flex;flex-direction:column;gap:8px}
  .lp-lead-field-wide{grid-column:1/-1}
  .lp-lead-field label{font:700 13px 'Manrope',sans-serif;color:#fff}
  .lp-lead-field input,.lp-lead-field select,.lp-lead-field textarea{width:100%;border:1px solid rgba(255,255,255,.28);outline:0;border-radius:16px;background:rgba(255,255,255,.94);color:#15243A;padding:15px 17px;font:600 15px 'Manrope',sans-serif;box-shadow:0 10px 24px -18px rgba(11,64,125,.7);transition:border-color .18s,box-shadow .18s,background .18s}
  .lp-lead-field input,.lp-lead-field select{height:54px}
  .lp-lead-field textarea{min-height:98px;resize:vertical}
  .lp-lead-field input::placeholder,.lp-lead-field textarea::placeholder{color:#94A3B8;font-weight:500}
  .lp-lead-field input:focus,.lp-lead-field select:focus,.lp-lead-field textarea:focus{background:#fff;border-color:#fff;box-shadow:0 0 0 4px rgba(255,255,255,.2)}
  .lp-lead-submit{grid-column:1/-1;height:57px;border:0;border-radius:999px;background:#fff;color:#207BD1;font:800 15px 'Manrope',sans-serif;cursor:pointer;box-shadow:0 16px 30px -16px rgba(8,65,123,.48);transition:transform .2s,box-shadow .2s}
  .lp-lead-submit:hover{transform:translateY(-2px);box-shadow:0 20px 34px -15px rgba(8,65,123,.58)}
  .lp-lead-visual{position:relative;z-index:2;align-self:stretch;min-height:540px}
  .lp-lead-halo{position:absolute;left:50%;top:49%;width:410px;height:410px;transform:translate(-50%,-50%);border-radius:50%;background:rgba(255,255,255,.12);box-shadow:0 0 0 55px rgba(255,255,255,.045),0 0 90px rgba(0,89,178,.18)}
  .lp-lead-student{position:absolute;z-index:2;left:50%;bottom:-55px;width:min(440px,92%);height:590px;transform:translateX(-50%);object-fit:contain;object-position:center bottom;filter:drop-shadow(0 24px 20px rgba(10,68,126,.24));transition:transform .35s cubic-bezier(.2,.8,.2,1)}
  .lp-lead-visual:hover .lp-lead-student{transform:translateX(-50%) scale(1.035)}
  .lp-lead-note{position:absolute;z-index:4;max-width:210px;padding:14px 17px;border:1px solid rgba(255,255,255,.54);border-radius:18px;background:rgba(255,255,255,.94);box-shadow:0 18px 40px -22px rgba(10,68,126,.52);color:#17233A;font:700 13px/1.35 'Manrope',sans-serif;backdrop-filter:blur(14px);animation:lpLeadFloat 5s ease-in-out infinite}
  .lp-lead-note span{display:block;margin-bottom:3px;color:#718096;font-size:11px;font-weight:600}
  .lp-lead-note-one{right:-2px;top:72px}
  .lp-lead-note-two{left:2px;bottom:74px;animation-delay:1.1s}
  .lp-footer{background:#0D172B;color:#fff}
  .lp-footer-inner{max-width:1280px;margin:0 auto;padding:62px 56px 28px}
  .lp-footer-grid{display:grid;grid-template-columns:minmax(280px,1.35fr) repeat(3,minmax(150px,.72fr));gap:56px;padding-bottom:42px}
  .lp-footer-brand{display:inline-flex;margin-bottom:18px;min-width:150px!important;padding:13px 24px!important;font-size:22px!important;background:linear-gradient(135deg,#139FEB,#2F80ED)!important}
  .lp-footer-about p{max-width:350px;margin:0;color:rgba(226,232,240,.68);font:500 14px/1.7 'Manrope',sans-serif}
  .lp-footer-title{margin:5px 0 20px;color:#fff;font:750 12px 'Manrope',sans-serif;letter-spacing:.11em;text-transform:uppercase}
  .lp-footer-links{display:flex;flex-direction:column;align-items:flex-start;gap:13px}
  .lp-footer-links a{position:relative;color:rgba(226,232,240,.7);font:500 14px/1.45 'Manrope',sans-serif;transition:color .18s ease,transform .18s ease}
  .lp-footer-links a:hover{color:#67C8FF;transform:translateX(3px)}
  .lp-footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-top:24px;border-top:1px solid rgba(255,255,255,.12);color:rgba(203,213,225,.6);font:500 12.5px 'Manrope',sans-serif}
  .lp-footer-schools{letter-spacing:.06em}
  .lp-hero{position:relative}
  .lp-hero:before{content:'';position:absolute;z-index:-1;right:-120px;top:-90px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(58,157,245,.14),rgba(58,157,245,0) 68%)}
  .lp-hero-copy{width:100%;max-width:940px;margin:0 auto;text-align:center;position:relative;z-index:2}
  .lp-h1{color:#091126;text-shadow:0 1px 0 rgba(255,255,255,.85)}
  .lp-hero-accent{position:relative;display:inline-block;color:#3478F6!important;text-shadow:0 5px 18px rgba(52,120,246,.16)}
  .lp-hero-accent:after{content:'';position:absolute;left:3%;right:1%;bottom:-5px;height:3px;border-radius:99px;background:#3478F6;opacity:.9}
  .lp-hero-stage{position:relative;width:100%;max-width:1040px;min-height:430px;margin:24px auto 0;isolation:isolate;perspective:1100px}
  .lp-hero-stage:before{content:'';position:absolute;inset:2% 5% -5%;border-radius:42%;background:radial-gradient(circle at 50% 48%,rgba(29,78,216,.17),rgba(96,165,250,.06) 52%,transparent 74%);filter:blur(5px);z-index:-2}
  .lp-orbit{position:absolute;border:1px solid rgba(29,78,216,.11);border-radius:50%;z-index:-1;pointer-events:none}
  .lp-orbit-a{width:430px;height:430px;left:calc(50% - 215px);top:0}
  .lp-orbit-b{width:330px;height:330px;left:calc(50% - 165px);top:50px;border-style:dashed;animation:lpOrbit 24s linear infinite}
  .lp-students-visual{--student-cell:210px;--student-strip:1050px;position:absolute;left:50%;top:0;width:min(100%,1040px);height:410px;transform:translateX(-50%);overflow:hidden;background:transparent}
  .lp-students-visual:before{content:'';position:absolute;z-index:4;left:-6%;right:-6%;bottom:-36px;height:78px;background:#fff;border-radius:50% 50% 0 0/72% 72% 0 0;box-shadow:0 -12px 34px rgba(255,255,255,.9);pointer-events:none}
  .lp-students-visual:after{content:'';position:absolute;z-index:5;inset:0;border-radius:32px;box-shadow:inset 0 0 0 1px rgba(29,78,216,.08);pointer-events:none}
  .lp-students-track{position:absolute;inset:0 auto 0 0;display:flex;width:max-content;animation:lpStudentsMarquee 34s linear infinite;will-change:transform}
  .lp-students-set{width:var(--student-strip);height:100%;display:flex;align-items:flex-end;flex:none}
  .lp-student-cutout{--panel:#32B7EC;--figure:#70D2F4;--figure-2:#168FCE;--tilt:-3deg;position:relative;width:var(--student-cell);height:100%;overflow:visible;flex:none;transform-origin:center bottom;z-index:1}
  .lp-student-pattern{position:absolute;left:8px;right:8px;top:39px;bottom:12px;overflow:hidden;border-radius:58px 58px 28px 28px;background:var(--panel);transform:rotate(var(--tilt));box-shadow:0 24px 38px -27px color-mix(in srgb,var(--panel) 68%,#173252);transition:transform .34s cubic-bezier(.2,.8,.2,1),filter .34s ease}
  .lp-student-pattern:before,.lp-student-pattern:after,.lp-student-pattern i{content:'';position:absolute;display:block;pointer-events:none}
  .lp-student-pattern:before{width:190px;height:190px;left:-76px;top:-56px;border:38px solid var(--figure);border-radius:50%;opacity:.78}
  .lp-student-pattern:after{width:210px;height:210px;right:-124px;bottom:10px;border:46px solid var(--figure-2);border-radius:50%;opacity:.46}
  .lp-student-pattern i:nth-child(1){width:150px;height:92px;right:-45px;top:27px;background:var(--figure);border-radius:70% 0 70% 0;transform:rotate(-26deg);opacity:.72}
  .lp-student-pattern i:nth-child(2){width:126px;height:126px;left:-55px;bottom:-30px;background:var(--figure-2);border-radius:58% 42% 64% 36%;transform:rotate(25deg);opacity:.5}
  .lp-student-pattern i:nth-child(3){width:92px;height:150px;right:8px;top:120px;border:28px solid rgba(255,255,255,.16);border-radius:50%;transform:rotate(30deg)}
  .lp-student-cutout img{position:absolute;z-index:2;left:-4%;bottom:-4px;width:108%;height:96%;display:block;object-fit:contain;object-position:center bottom;filter:drop-shadow(0 12px 11px rgba(20,54,116,.15));transform-origin:center bottom;transition:transform .3s cubic-bezier(.2,.8,.2,1),filter .3s ease;will-change:transform}
  .lp-student-cutout:hover{z-index:3}
  .lp-student-cutout:hover img{transform:scale(1.065) translateY(-2px);filter:saturate(1.05) drop-shadow(0 18px 14px rgba(20,54,116,.22))}
  .lp-student-cutout:hover .lp-student-pattern{transform:rotate(var(--tilt)) scale(1.025);filter:saturate(1.07)}
  .lp-student-cutout-1{--panel:#4BC5A8;--figure:#8BE4CC;--figure-2:#149C82;--tilt:-3.5deg}
  .lp-student-cutout-2{--panel:#32B8E8;--figure:#86DDF7;--figure-2:#168ECE;--tilt:2.2deg}
  .lp-student-cutout-3{--panel:#25313B;--figure:#52616B;--figure-2:#101820;--tilt:-2deg}
  .lp-student-cutout-4{--panel:#F06C7F;--figure:#FF9A98;--figure-2:#D83E69;--tilt:3deg}
  .lp-student-cutout-5{--panel:#9E8CE7;--figure:#C7B8F5;--figure-2:#7662CE;--tilt:-2.6deg}
  .lp-students-visual:hover .lp-students-track{animation-play-state:paused}
  .lp-school-carousel{position:absolute;right:7%;bottom:2px;width:122px;height:122px;display:grid;place-items:center;perspective:1000px;z-index:4}
  .lp-school-glow{position:absolute;inset:12px;border-radius:50%;background:rgba(29,78,216,.24);filter:blur(24px);animation:lpSchoolGlow 3s ease-in-out infinite alternate}
  .lp-school-frame{position:relative;width:108px;height:108px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.96);border:1px solid rgba(29,78,216,.18);box-shadow:0 22px 46px -22px rgba(30,64,175,.58),inset 0 1px 0 #fff;backdrop-filter:blur(18px);transform-style:preserve-3d}
  .lp-school-frame:after{content:'';position:absolute;inset:7px;border:1px solid rgba(29,78,216,.1);border-radius:50%;pointer-events:none;z-index:4}
  .lp-school-slide{position:absolute;inset:0;display:grid;place-items:center;padding:15px;opacity:0;transform:rotateY(-70deg) scale(.82);animation:lpSchoolCycle 9s cubic-bezier(.4,0,.2,1) infinite;backface-visibility:hidden}
  .lp-school-slide img{display:block;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply}
  .lp-school-slide-2{animation-delay:3s}
  .lp-school-slide-3{animation-delay:6s}
  .lp-school-dots{position:absolute;bottom:-1px;display:flex;gap:5px;z-index:5}
  .lp-school-dots i{width:5px;height:5px;border-radius:50%;background:#93C5FD;box-shadow:0 0 0 3px rgba(255,255,255,.9)}
  .lp-signal{position:absolute;width:258px;z-index:3}
  .lp-signal:before{content:'';position:absolute;right:100%;top:50%;width:34px;height:1px;background:linear-gradient(90deg,transparent,rgba(29,78,216,.3))}
  .lp-signal-card{width:100%;display:flex;align-items:center;gap:12px;padding:13px 15px;background:rgba(255,255,255,.84);border:1px solid rgba(29,78,216,.16);border-radius:14px;box-shadow:0 20px 50px -28px rgba(30,64,175,.38),inset 0 1px 0 rgba(255,255,255,.9);backdrop-filter:blur(16px);transition:box-shadow .2s ease,border-color .2s ease;will-change:transform}
  .lp-signal:hover .lp-signal-card{animation-play-state:paused;border-color:rgba(29,78,216,.34);box-shadow:0 25px 58px -24px rgba(29,78,216,.52),inset 0 1px 0 #fff}
  .lp-signal em{width:36px;height:36px;flex:none;display:grid;place-items:center;border-radius:10px;background:linear-gradient(145deg,#EFF6FF,#DBEAFE);box-shadow:inset 0 0 0 1px rgba(29,78,216,.08);font-style:normal;font-size:17px;animation:lpIconPulse 2.6s ease-in-out infinite}
  .lp-signal span{font:650 13.5px/1.3 'Golos Text',sans-serif;color:#173252}
  .lp-signal-ai{left:-1%;top:250px}
  .lp-signal-format{right:-1%;top:244px}
  .lp-signal-progress{left:50%;bottom:-4px;transform:translateX(-50%)}
  .lp-signal-ai .lp-signal-card{animation:lpSignalFloatA 5.4s ease-in-out infinite}
  .lp-signal-format .lp-signal-card{animation:lpSignalFloatB 6s ease-in-out .7s infinite}
  .lp-signal-progress .lp-signal-card{animation:lpSignalFloatC 5.7s ease-in-out 1.4s infinite}
  .lp-signal-format em{animation-delay:.7s}
  .lp-signal-progress em{animation-delay:1.4s}
  .lp-signal-ai:before,.lp-signal-progress:before{right:auto;left:100%;background:linear-gradient(90deg,rgba(29,78,216,.3),transparent)}
  @keyframes lpOrbit{to{transform:rotate(360deg)}}
  @keyframes lpSchoolCycle{0%{opacity:0;transform:rotateY(-70deg) scale(.82)}7%,27%{opacity:1;transform:rotateY(0) scale(1)}33%,100%{opacity:0;transform:rotateY(70deg) scale(.82)}}
  @keyframes lpSchoolGlow{to{opacity:.55;transform:scale(1.07)}}
  @keyframes lpStudentsMarquee{to{transform:translate3d(-50%,0,0)}}
  @keyframes lpSignalFloatA{0%,100%{transform:translate3d(0,0,0) rotate(-.35deg)}50%{transform:translate3d(9px,-11px,0) rotate(.45deg)}}
  @keyframes lpSignalFloatB{0%,100%{transform:translate3d(0,0,0) rotate(.3deg)}50%{transform:translate3d(-10px,-8px,0) rotate(-.5deg)}}
  @keyframes lpSignalFloatC{0%,100%{transform:translate3d(0,0,0) rotate(-.2deg)}50%{transform:translate3d(8px,-9px,0) rotate(.4deg)}}
  @keyframes lpIconPulse{0%,100%{transform:scale(1);box-shadow:inset 0 0 0 1px rgba(29,78,216,.08),0 0 0 0 rgba(59,130,246,0)}50%{transform:scale(1.08);box-shadow:inset 0 0 0 1px rgba(29,78,216,.12),0 0 0 7px rgba(59,130,246,.1)}}
  @media(max-width:1000px){
    .lp-nav{min-height:78px;padding:11px 22px!important}
    .lp-header-brand{min-width:148px!important;padding:14px 22px!important;font-size:22px!important}
    .lp-hero{gap:0!important}
    .lp-h1{font-size:52px!important}
    .lp-hero-stage{max-width:760px}
    .lp-students-visual{width:100%;height:390px}
    .lp-signal-ai{left:0}
    .lp-signal-format{right:0}
    .lp-signal-progress{left:50%}
    .lp-steps{grid-template-columns:1fr 1fr!important}
    .lp-schools{grid-template-columns:1fr!important}
    .lp-inside{grid-template-columns:1fr!important}
    .lp-prices{grid-template-columns:1fr 1fr!important;max-width:560px!important;gap:14px!important}
    .lp-navlinks{display:none!important}
    .lp-menu-toggle{display:flex}
    .lp-mobile-menu{display:block}
    .lp-mobile-menu.is-open{max-height:390px;opacity:1}
    .lp-pad{padding-left:22px!important;padding-right:22px!important}
    .lp-lead-wrap{grid-template-columns:1fr;gap:20px;padding:46px 42px 0;min-height:0}
    .lp-lead-copy{max-width:none}
    .lp-lead-visual{min-height:480px}
    .lp-lead-student{height:520px;bottom:-48px}
    .lp-footer-inner{padding:52px 32px 26px}
    .lp-footer-grid{grid-template-columns:1fr 1fr;gap:38px 32px}
    .lp-footer-about{grid-column:1/-1}
  }
  @media(max-width:620px){
    .lp-site-header{border-top-width:3px!important}
    .lp-nav{min-height:65px;padding:9px 20px!important}
    .lp-header-brand{min-width:118px!important;padding:12px 16px!important;border-radius:12px!important;font-size:18px!important}
    .lp-header-lang{display:none}
    .lp-header-actions{gap:8px}
    .lp-header-start{min-width:auto;padding:11px 17px!important;font-size:14px!important}
    .lp-menu-toggle{width:42px;height:42px;border-radius:12px}
    .lp-hero{padding-top:40px!important;padding-bottom:58px!important;gap:0!important}
    .lp-h1{font-size:43px!important}
    .lp-hero-copy{text-align:left}
    .lp-hero-stage{min-height:0;display:flex;flex-direction:column;align-items:center;margin-top:28px}
    .lp-hero-stage:before{inset:0 2% 38%;}
    .lp-orbit-a,.lp-orbit-b{display:none}
    .lp-students-visual{--student-cell:150px;--student-strip:750px;position:relative;left:auto;top:auto;width:100%;height:auto;aspect-ratio:1.38;transform:none;border-radius:22px;margin-bottom:8px}
    .lp-student-pattern{left:5px;right:5px;top:29px;bottom:8px;border-radius:42px 42px 20px 20px}
    .lp-student-cutout img{left:-5%;width:110%;height:97%}
    .lp-students-track{animation-duration:28s}
    .lp-school-carousel{right:8px;top:min(48vw,178px);bottom:auto;width:82px;height:82px}
    .lp-school-frame{width:72px;height:72px}
    .lp-school-slide{padding:10px}
    .lp-school-dots{display:none}
    .lp-signal{position:relative;right:auto;top:auto;bottom:auto;width:min(100%,330px);margin:10px auto 0}
    .lp-signal-progress{left:auto;transform:none}
    .lp-signal-card{background:rgba(255,255,255,.92)}
    .lp-signal:before{display:none}
    .lp-signal-ai .lp-signal-card{animation-name:lpSignalFloatMobile}
    .lp-signal-format .lp-signal-card{animation-name:lpSignalFloatMobile}
    .lp-signal-progress .lp-signal-card{animation-name:lpSignalFloatMobile}
    #pricing{padding-top:46px!important;padding-bottom:50px!important;border-radius:26px}
    .lp-pricing-head{margin-bottom:24px!important}
    .lp-pricing-title{font-size:34px!important;line-height:1.1!important}
    .lp-prices{grid-template-columns:1fr!important;max-width:430px!important}
    .lp-price{padding:27px 24px!important}
    .lp-steps{grid-template-columns:1fr!important}
    #cta{padding-top:8px!important;padding-bottom:54px!important}
    .lp-lead-wrap{padding:34px 20px 0;border-radius:26px}
    .lp-lead-copy h2{font-size:34px!important}
    .lp-lead-copy>p{font-size:14.5px;margin-bottom:24px}
    .lp-lead-form{grid-template-columns:1fr;gap:14px}
    .lp-lead-field-wide,.lp-lead-submit{grid-column:auto}
    .lp-lead-field input,.lp-lead-field select{height:52px}
    .lp-lead-visual{min-height:390px;margin-top:6px}
    .lp-lead-halo{width:290px;height:290px}
    .lp-lead-student{height:420px;width:96%;bottom:-42px}
    .lp-lead-note{max-width:168px;padding:11px 13px;border-radius:14px;font-size:11.5px}
    .lp-lead-note-one{right:-9px;top:150px}
    .lp-lead-note-two{left:-8px;bottom:42px}
    .lp-footer-inner{padding:44px 22px 24px}
    .lp-footer-grid{grid-template-columns:1fr 1fr;gap:34px 24px;padding-bottom:34px}
    .lp-footer-about{grid-column:1/-1}
    .lp-footer-bottom{align-items:flex-start;flex-direction:column;gap:8px}
  }
  @keyframes lpSignalFloatMobile{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes lpLeadFloat{0%,100%{transform:translateY(0) rotate(-.4deg)}50%{transform:translateY(-8px) rotate(.4deg)}}
  @media(prefers-reduced-motion:reduce){.lp-orbit-b,.lp-school-glow,.lp-students-track,.lp-signal-card,.lp-signal em{animation:none}.lp-school-slide{animation-name:lpSchoolFade}.lp-signal-card{transition:none}.lp-reveal{opacity:1;filter:none;transform:none;transition:none}}
  @keyframes lpSchoolFade{0%,33%{opacity:1;transform:none}34%,100%{opacity:0;transform:none}}
`}</style>
<header className="lp-site-header">
  <nav className="lp-nav" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
    <a href="#" className="lp-header-home" aria-label="SYNAQ — басты бет" onClick={closeMenu}><Brand className="lp-header-brand" /></a>
    <div className="lp-navlinks" style={{display:'flex',alignItems:'center'}}>
      <a href="#how">{t('lp.2')}</a>
      <a href="#schools">{t('lp.3')}</a>
      <a href="#parents">{t('lp.4')}</a>
      <a href="#pricing">{t('lp.5')}</a>
    </div>
    <div className="lp-header-actions">
      <div className="lp-header-lang"><LangSwitch /></div>
      <a href="#" onClick={handleStart} className="lp-cta lp-header-start" style={{color:'#FFFFFF'}}>{t('lp.6')}</a>
      <button type="button" className={`lp-menu-toggle${menuOpen ? ' is-open' : ''}`} aria-label={menuOpen ? 'Мәзірді жабу' : 'Мәзірді ашу'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><i /><i /><i /></button>
    </div>
  </nav>
  <div className={`lp-mobile-menu${menuOpen ? ' is-open' : ''}`}>
    <div className="lp-mobile-menu-inner">
      <a href="#how" onClick={(e) => handleMobileNav(e, '#how')}>{t('lp.2')}</a>
      <a href="#schools" onClick={(e) => handleMobileNav(e, '#schools')}>{t('lp.3')}</a>
      <a href="#parents" onClick={(e) => handleMobileNav(e, '#parents')}>{t('lp.4')}</a>
      <a href="#pricing" onClick={(e) => handleMobileNav(e, '#pricing')}>{t('lp.5')}</a>
      <div className="lp-mobile-language"><span>Тіл / Язык</span><LangSwitch /></div>
    </div>
  </div>
</header>

  
  <section className="lp-hero lp-pad" style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',maxWidth:'1280px',margin:'0 auto',padding:'28px 56px 32px',minHeight:'calc(100vh - 96px)'}}>
    <div className="lp-hero-copy">
      <h1 className="lp-h1" style={{font:'900 64px/1.02 \'Geologica\',sans-serif',letterSpacing:'-.052em',margin:'0 auto 18px',maxWidth:'900px'}}>{t('lp.hero1')}<span className="lp-hero-accent">{t('lp.hero2')}</span>{t('lp.hero3')}</h1>
      <p style={{fontSize:'18px',lineHeight:'1.55',color:'#60758A',margin:'0 auto 26px',maxWidth:'720px'}}>{t('lp.11')}</p>
      <div className="lp-hero-actions" style={{display:'flex',justifyContent:'center',gap:'13px',flexWrap:'wrap'}}>
        <a href="#" onClick={handleStart} className="lp-cta" style={{background:'#3A9DF5',color:'#FFFFFF',padding:'15px 32px',borderRadius:'12px',font:'600 16px \'Golos Text\',sans-serif'}}>{t('lp.12')}</a>
        <a href="#how" className="lp-ghost" style={{padding:'15px 28px',borderRadius:'12px',border:'1px solid rgba(19,40,60,.16)',font:'600 16px \'Golos Text\',sans-serif',color:'#13283C'}}>{t('lp.13')}</a>
      </div>
    </div>

    
    <HeroVisual />
  </section>

  
  <section id="how" style={{background:'#F2F8FE',padding:'78px 0',borderTop:'1px solid rgba(19,40,60,.06)'}}>
    <div className="lp-pad" style={{maxWidth:'1280px',margin:'0 auto',padding:'0 56px'}}>
      <div style={{textAlign:'center',marginBottom:'40px',maxWidth:'640px',marginLeft:'auto',marginRight:'auto'}}>
        <div style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.16em',textTransform:'uppercase',color:'#2B91EA',marginBottom:'14px'}}>Как это работает</div>
        <h2 style={{font:'800 46px/1.05 \'Geologica\',sans-serif',letterSpacing:'-.035em',margin:'0 0 12px'}}>{t('lp.18')}</h2>
        <p style={{fontSize:'17px',color:'#60758A',margin:'0'}}>{t('lp.19')}</p>
      </div>

      
      <div className="lp-demo" style={{maxWidth:'1000px',margin:'0 auto 54px'}}>
        <Demo />
      </div>

      <div className="lp-steps" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'20px'}}>
        <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(19,40,60,.09)',borderRadius:'18px',padding:'26px 24px'}}>
          <div style={{font:'600 32px \'Lora\',serif',color:'#B8DDFB',marginBottom:'12px'}}>01</div>
          <div style={{font:'600 18px \'Golos Text\',sans-serif',marginBottom:'8px'}}>{t('lp.20')}</div>
          <div style={{fontSize:'14px',lineHeight:'1.55',color:'#60758A'}}>{t('lp.21')}</div>
        </div>
        <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(19,40,60,.09)',borderRadius:'18px',padding:'26px 24px'}}>
          <div style={{font:'600 32px \'Lora\',serif',color:'#B8DDFB',marginBottom:'12px'}}>02</div>
          <div style={{font:'600 18px \'Golos Text\',sans-serif',marginBottom:'8px'}}>{t('lp.22')}</div>
          <div style={{fontSize:'14px',lineHeight:'1.55',color:'#60758A'}}>{t('lp.23')}</div>
        </div>
        <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(19,40,60,.09)',borderRadius:'18px',padding:'26px 24px'}}>
          <div style={{font:'600 32px \'Lora\',serif',color:'#B8DDFB',marginBottom:'12px'}}>03</div>
          <div style={{font:'600 18px \'Golos Text\',sans-serif',marginBottom:'8px'}}>{t('lp.24')}</div>
          <div style={{fontSize:'14px',lineHeight:'1.55',color:'#60758A'}}>{t('lp.25')}</div>
        </div>
        <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(19,40,60,.09)',borderRadius:'18px',padding:'26px 24px'}}>
          <div style={{font:'600 32px \'Lora\',serif',color:'#B8DDFB',marginBottom:'12px'}}>04</div>
          <div style={{font:'600 18px \'Golos Text\',sans-serif',marginBottom:'8px'}}>{t('lp.26')}</div>
          <div style={{fontSize:'14px',lineHeight:'1.55',color:'#60758A'}}>{t('lp.27')}</div>
        </div>
      </div>
    </div>
  </section>

  
  <section id="schools" className="lp-pad" style={{maxWidth:'1280px',margin:'0 auto',padding:'80px 56px'}}>
    <div style={{marginBottom:'46px',maxWidth:'640px'}}>
      <div style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.16em',textTransform:'uppercase',color:'#2B91EA',marginBottom:'14px'}}>{t('lp.28')}</div>
      <h2 style={{font:'800 44px/1.05 \'Geologica\',sans-serif',letterSpacing:'-.035em',margin:'0 0 12px'}}>{t('lp.29')}</h2>
      <p style={{fontSize:'17px',color:'#60758A',margin:'0'}}>{t('lp.30')}</p>
    </div>
    <div className="lp-schools" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'22px'}}>
      <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(19,40,60,.09)',borderRadius:'20px',padding:'30px 28px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'22px'}}>
          <div style={{width:'76px',height:'76px',background:'#FFFFFF',border:'1px solid rgba(19,40,60,.08)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',padding:'11px'}}><img src="/figures/20fb0c30.png" alt="РФМШ" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} /></div>
          <span style={{font:'600 11px \'IBM Plex Mono\',monospace',letterSpacing:'.06em',textTransform:'uppercase',color:'#3A9DF5',background:'rgba(58,157,245,.1)',padding:'6px 11px',borderRadius:'8px'}}>{t('lp.31')}</span>
        </div>
        <div style={{font:'600 24px \'Golos Text\',sans-serif',marginBottom:'4px'}}>РФМШ</div>
        <div style={{font:'500 12.5px \'IBM Plex Mono\',monospace',color:'#8094A7',marginBottom:'14px'}}>{t('lp.32')}</div>
        <p style={{fontSize:'14.5px',lineHeight:'1.55',color:'#60758A',margin:'0'}}>{t('lp.33')}</p>
      </div>
      <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(19,40,60,.09)',borderRadius:'20px',padding:'30px 28px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'22px'}}>
          <div style={{width:'76px',height:'76px',background:'#FFFFFF',border:'1px solid rgba(19,40,60,.08)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',padding:'11px'}}><img src="/figures/5ac51878.png" alt="НИШ" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} /></div>
          <span style={{font:'600 11px \'IBM Plex Mono\',monospace',letterSpacing:'.06em',textTransform:'uppercase',color:'#3A9DF5',background:'rgba(58,157,245,.1)',padding:'6px 11px',borderRadius:'8px'}}>{t('lp.31')}</span>
        </div>
        <div style={{font:'600 24px \'Golos Text\',sans-serif',marginBottom:'4px'}}>НИШ</div>
        <div style={{font:'500 12.5px \'IBM Plex Mono\',monospace',color:'#8094A7',marginBottom:'14px'}}>Nazarbayev Intellectual Schools</div>
        <p style={{fontSize:'14.5px',lineHeight:'1.55',color:'#60758A',margin:'0'}}>{t('lp.35')}</p>
      </div>
      <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(19,40,60,.09)',borderRadius:'20px',padding:'30px 28px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'22px'}}>
          <div style={{width:'76px',height:'76px',background:'#FFFFFF',border:'1px solid rgba(19,40,60,.08)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',padding:'11px'}}><img src="/figures/191a2c27.png" alt="КТЛ" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} /></div>
          <span style={{font:'600 11px \'IBM Plex Mono\',monospace',letterSpacing:'.06em',textTransform:'uppercase',color:'#3A9DF5',background:'rgba(58,157,245,.1)',padding:'6px 11px',borderRadius:'8px'}}>{t('lp.31')}</span>
        </div>
        <div style={{font:'600 24px \'Golos Text\',sans-serif',marginBottom:'4px'}}>БИЛ</div>
        <div style={{font:'500 12.5px \'IBM Plex Mono\',monospace',color:'#8094A7',marginBottom:'14px'}}>{t('lp.36')}</div>
        <p style={{fontSize:'14.5px',lineHeight:'1.55',color:'#60758A',margin:'0'}}>{t('lp.37')}</p>
      </div>
    </div>
  </section>

  
  <section id="parents" style={{background:'#167ACB',padding:'82px 0'}}>
    <div className="lp-inside lp-pad" style={{maxWidth:'1280px',margin:'0 auto',padding:'0 56px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'56px',alignItems:'center'}}>
      
      <div style={{background:'#FFFFFF',borderRadius:'22px',padding:'28px 30px',boxShadow:'0 40px 90px -50px rgba(0,0,0,.6)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'22px'}}>
          <div style={{width:'40px',height:'40px',borderRadius:'11px',background:'#2B91EA',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',font:'700 17px \'Golos Text\''}}>Д</div>
          <div><div style={{font:'600 16px \'Golos Text\'',color:'#13283C'}}>{t('lp.39')}</div><div style={{font:'500 12px \'IBM Plex Mono\',monospace',color:'#8094A7'}}>{t('lp.40')}</div></div>
        </div>
        <div style={{display:'flex',gap:'22px',alignItems:'center',marginBottom:'22px'}}>
          <svg width="120" height="120" viewBox="0 0 120 120" style={{flex:'none'}}>
            <circle cx="60" cy="60" r="48" fill="none" stroke="#DFEFFC" strokeWidth="12"></circle>
            <circle cx="60" cy="60" r="48" fill="none" stroke="#3A9DF5" strokeWidth="12" strokeLinecap="round" strokeDasharray="187 302" transform="rotate(-90 60 60)"></circle>
            <text x="60" y="58" textAnchor="middle" style={{font:'700 30px \'IBM Plex Mono\',monospace',fill:'#13283C'}}>62%</text>
            <text x="60" y="76" textAnchor="middle" style={{font:'500 11px \'Golos Text\'',fill:'#8094A7'}}>{t('lp.41')}</text>
          </svg>
          <div style={{flex:'1'}}>
            <div style={{font:'600 11px \'IBM Plex Mono\',monospace',letterSpacing:'.1em',textTransform:'uppercase',color:'#8094A7',marginBottom:'10px'}}>{t('lp.42')}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div style={{background:'#EAF5FF',borderRadius:'9px',padding:'8px 11px'}}><div style={{font:'600 12px \'Golos Text\'',color:'#13283C'}}>{t('lp.43')}</div><div style={{font:'700 15px \'IBM Plex Mono\',monospace',color:'#167AD1'}}>86%</div></div>
              <div style={{background:'#EAF5FF',borderRadius:'9px',padding:'8px 11px'}}><div style={{font:'600 12px \'Golos Text\'',color:'#13283C'}}>{t('lp.44')}</div><div style={{font:'700 15px \'IBM Plex Mono\',monospace',color:'#167AD1'}}>74%</div></div>
              <div style={{background:'#EEF7FF',borderRadius:'9px',padding:'8px 11px'}}><div style={{font:'600 12px \'Golos Text\'',color:'#13283C'}}>{t('lp.45')}</div><div style={{font:'700 15px \'IBM Plex Mono\',monospace',color:'#8A5A12'}}>50%</div></div>
              <div style={{background:'#EAF5FF',borderRadius:'9px',padding:'8px 11px'}}><div style={{font:'600 12px \'Golos Text\'',color:'#13283C'}}>{t('lp.46')}</div><div style={{font:'700 15px \'IBM Plex Mono\',monospace',color:'#2B91EA'}}>38%</div></div>
            </div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'12px',background:'#EAF5FF',border:'1px solid #C6E4FC',borderRadius:'12px',padding:'12px 16px'}}>
          <span style={{width:'30px',height:'30px',borderRadius:'8px',background:'#2B91EA',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',font:'700 15px \'Golos Text\''}}>!</span>
          <div style={{font:'500 13.5px \'Golos Text\'',color:'#176FB8'}}>{t('lp.47')} <b>{t('lp.46')}</b> {t('lp.48')}</div>
        </div>
      </div>
      
      <div>
        <div style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.16em',textTransform:'uppercase',color:'#FFFFFF',marginBottom:'16px'}}>{t('lp.49')}</div>
        <h2 style={{font:'800 42px/1.06 \'Geologica\',sans-serif',letterSpacing:'-.035em',margin:'0 0 26px',color:'#FFFFFF'}}>{t('lp.50')} <span style={{color:'#FFFFFF'}}>{t('lp.51')}</span></h2>
        <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>
          <div style={{display:'flex',gap:'14px'}}><div style={{flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:'#FFFFFF',marginTop:'8px'}}></div><div><div style={{font:'600 17px \'Golos Text\'',marginBottom:'3px',color:'#FFFFFF'}}>{t('lp.52')}</div><div style={{fontSize:'15px',color:'#DCEEFF',lineHeight:'1.5'}}>{t('lp.53')}</div></div></div>
          <div style={{display:'flex',gap:'14px'}}><div style={{flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:'#FFFFFF',marginTop:'8px'}}></div><div><div style={{font:'600 17px \'Golos Text\'',marginBottom:'3px',color:'#FFFFFF'}}>{t('lp.54')}</div><div style={{fontSize:'15px',color:'#DCEEFF',lineHeight:'1.5'}}>{t('lp.55')}</div></div></div>
          <div style={{display:'flex',gap:'14px'}}><div style={{flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:'#FFFFFF',marginTop:'8px'}}></div><div><div style={{font:'600 17px \'Golos Text\'',marginBottom:'3px',color:'#FFFFFF'}}>{t('lp.56')}</div><div style={{fontSize:'15px',color:'#DCEEFF',lineHeight:'1.5'}}>{t('lp.57')}</div></div></div>
        </div>
        <a href="#" onClick={handleStart} className="lp-cta" style={{display:'inline-block',marginTop:'32px',background:'#FFFFFF',color:'#146EBA',padding:'14px 30px',borderRadius:'12px',font:'600 16px \'Golos Text\',sans-serif'}}>{t('lp.58')}</a>
      </div>
    </div>
  </section>

  
  <section id="pricing" className="lp-pad" style={{maxWidth:'1280px',margin:'0 auto',padding:'84px 56px'}}>
    <div className="lp-pricing-head" style={{textAlign:'center',marginBottom:'48px',maxWidth:'600px',marginLeft:'auto',marginRight:'auto'}}>
      <div className="lp-pricing-kicker" style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.16em',textTransform:'uppercase',color:'#2B91EA',marginBottom:'14px'}}>Тарифы</div>
      <h2 className="lp-pricing-title" style={{font:'800 46px/1.04 \'Geologica\',sans-serif',letterSpacing:'-.035em',margin:'0 0 12px'}}>{t('lp.59')}</h2>
      <p className="lp-pricing-sub" style={{fontSize:'17px',color:'#60758A',margin:'0'}}>{t('lp.60')}</p>
    </div>
    <div className="lp-prices" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'22px',maxWidth:'760px',margin:'0 auto',alignItems:'stretch'}}>

      
      <div className="lp-price lp-price-standard lp-card" style={{background:'#fff',border:'1px solid rgba(19,40,60,.1)',borderRadius:'22px',padding:'34px 30px',display:'flex',flexDirection:'column'}}>
        <div className="lp-plan-name" style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.1em',textTransform:'uppercase',color:'#8094A7'}}>{t('lp.61')}</div>
        <div style={{display:'flex',alignItems:'baseline',gap:'6px',margin:'16px 0 6px'}}><span className="lp-plan-price" style={{font:'600 46px \'Lora\',serif',color:'#13283C'}}>0 ₸</span></div>
        <div style={{fontSize:'14px',color:'#8094A7',marginBottom:'24px'}}>{t('lp.62')}</div>
        <div className="lp-price-features" style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#36536B'}}><span style={{color:'#3A9DF5'}}>✓</span>{t('lp.63')}</div>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#36536B'}}><span style={{color:'#3A9DF5'}}>✓</span>{t('lp.64')}</div>
        </div>
        <a href="#" onClick={handleStart} className="lp-ghost" style={{display:'block',textAlign:'center',marginTop:'26px',padding:'14px',borderRadius:'12px',border:'1px solid rgba(19,40,60,.18)',font:'600 15px \'Golos Text\'',color:'#13283C'}}>{t('lp.12')}</a>
      </div>

      
      <div className="lp-price lp-price-pro" style={{background:'#167ACB',border:'1px solid #167ACB',borderRadius:'22px',padding:'34px 30px',display:'flex',flexDirection:'column',position:'relative',boxShadow:'0 30px 70px -40px rgba(30,126,204,.8)',transition:'transform .2s'}}>
        <div style={{position:'absolute',top:'-13px',left:'50%',transform:'translateX(-50%)',background:'#FFFFFF',color:'#146EBA',font:'600 11px \'IBM Plex Mono\',monospace',letterSpacing:'.08em',textTransform:'uppercase',padding:'6px 14px',borderRadius:'100px'}}>{t('lp.65')}</div>
        <div className="lp-plan-name" style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.1em',textTransform:'uppercase',color:'#FFFFFF'}}>{t('lp.66')}</div>
        <div style={{display:'flex',alignItems:'baseline',gap:'6px',margin:'16px 0 6px'}}><span className="lp-plan-price" style={{font:'600 46px \'Lora\',serif',color:'#FFFFFF'}}>5 999 ₸</span><span style={{fontSize:'15px',color:'#DCEEFF'}}>{t('lp.67')}</span></div>
        <div style={{fontSize:'14px',color:'#C9E5FB',marginBottom:'24px'}}>{t('lp.68')}</div>
        <div className="lp-price-features" style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#F4FAFF'}}><span style={{color:'#FFFFFF'}}>✓</span>{t('lp.69')}</div>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#F4FAFF'}}><span style={{color:'#FFFFFF'}}>✓</span>{t('lp.70')}</div>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#F4FAFF'}}><span style={{color:'#FFFFFF'}}>✓</span>{t('lp.71')}</div>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#F4FAFF'}}><span style={{color:'#FFFFFF'}}>✓</span>{t('lp.72')}</div>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#F4FAFF'}}><span style={{color:'#FFFFFF'}}>✓</span>{t('lp.73')}</div>
        </div>
        <a href="#" onClick={handleBuyPro} className="lp-cta" style={{display:'block',textAlign:'center',marginTop:'26px',padding:'14px',borderRadius:'12px',background:'#FFFFFF',color:'#146EBA',font:'600 15px \'Golos Text\''}}>{t('lp.74')}</a>
      </div>

      
    </div>
  </section>

  
  <section id="cta" className="lp-pad" style={{maxWidth:'1280px',margin:'0 auto',padding:'20px 56px 84px'}}>
    <div className="lp-lead-wrap">
      <div className="lp-lead-copy">
        <h2>{t('lp.leadTitle')}</h2>
        <p>{t('lp.leadText')}</p>
        <form className="lp-lead-form" onSubmit={handleLeadSubmit}>
          <div className="lp-lead-field">
            <label htmlFor="lead-name">{t('lp.leadName')}</label>
            <input id="lead-name" name="name" type="text" placeholder={t('lp.leadNamePlaceholder')} required />
          </div>
          <div className="lp-lead-field">
            <label htmlFor="lead-phone">{t('lp.leadPhone')}</label>
            <input id="lead-phone" name="phone" type="tel" inputMode="tel" placeholder="+7 ___ ___ __ __" required />
          </div>
          <div className="lp-lead-field lp-lead-field-wide">
            <label htmlFor="lead-role">{t('lp.leadRole')}</label>
            <select id="lead-role" name="role" defaultValue="parent">
              <option value="parent">{t('lp.leadParent')}</option>
              <option value="student">{t('lp.leadStudent')}</option>
            </select>
          </div>
          <div className="lp-lead-field lp-lead-field-wide">
            <label htmlFor="lead-comment">{t('lp.leadComment')}</label>
            <textarea id="lead-comment" name="comment" placeholder={t('lp.leadCommentPlaceholder')} />
          </div>
          <button className="lp-lead-submit" type="submit">{t('lp.leadSubmit')}</button>
        </form>
      </div>
      <div className="lp-lead-visual" aria-label={t('lp.leadVisualLabel')}>
        <div className="lp-lead-halo" aria-hidden="true" />
        <img className="lp-lead-student" src="/hero/students/cutout-4.png" alt={t('lp.leadVisualLabel')} />
        <div className="lp-lead-note lp-lead-note-one"><span>{t('lp.leadNoteOneTop')}</span>{t('lp.leadNoteOne')}</div>
        <div className="lp-lead-note lp-lead-note-two"><span>{t('lp.leadNoteTwoTop')}</span>{t('lp.leadNoteTwo')}</div>
      </div>
    </div>
  </section>

  
  <footer className="lp-footer">
    <div className="lp-footer-inner">
      <div className="lp-footer-grid">
        <div className="lp-footer-about">
          <a href="#" aria-label="SYNAQ — басты бет"><Brand className="lp-footer-brand" /></a>
          <p>{t('lp.footerAbout')}</p>
        </div>
        <div>
          <h3 className="lp-footer-title">{t('lp.footerPlatform')}</h3>
          <div className="lp-footer-links">
            <a href="#how">{t('lp.2')}</a>
            <a href="#schools">{t('lp.3')}</a>
            <a href="#pricing">{t('lp.5')}</a>
          </div>
        </div>
        <div>
          <h3 className="lp-footer-title">{t('lp.footerAccount')}</h3>
          <div className="lp-footer-links">
            <a href="#" onClick={handleStart}>{t('lp.footerRegister')}</a>
            <a href="#" onClick={handleStart}>{t('lp.footerLogin')}</a>
            <a href="#cta">{t('lp.footerContactUs')}</a>
          </div>
        </div>
        <div>
          <h3 className="lp-footer-title">{t('lp.footerContacts')}</h3>
          <div className="lp-footer-links">
            <a href="https://wa.me/message/HAJDNIM2MPOCM1" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href="mailto:support@synaq.app">support@synaq.app</a>
            <a href="https://t.me/synaqsupport" target="_blank" rel="noopener noreferrer">Telegram · @synaqsupport</a>
          </div>
        </div>
      </div>
      <div className="lp-footer-bottom">
        <span>{t('lp.footerCopyright')}</span>
        <span className="lp-footer-schools">{t('lp.78')}</span>
      </div>
    </div>
  </footer>
    </div>
  );
}
