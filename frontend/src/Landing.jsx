import { validateLeadForm, sendLead } from './leadForm.js';
import React from 'react';
import { LangSwitch, useLang } from './i18n.jsx';
import Brand from './Brand.jsx';
import LandingDemo from './LandingDemo.jsx';
import LandingFounders from './LandingFounders.jsx';
import './Landing.css';
import { LandingHero, LandingBenefits, LandingMentor, LandingFAQ, LandingFamilyBenefits } from './LandingRefresh.jsx';
import LandingPricing from './LandingPricing.jsx';
import useLandingMotion from './useLandingMotion.js';

const WHATSAPP_LEAD_URL = 'https://wa.me/77773424043';

export default function Landing({ onStart, onDiagnostic, onFreeDiagnostic }) {
  const { t, lang } = useLang();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [leadState, setLeadState] = React.useState('idle');
  const leadErrorId = 'lead-submit-error';
  const leadPendingRef = React.useRef(false);
  const landingRef = React.useRef(null);
  useLandingMotion(landingRef);
  const headerRef = React.useRef(null);
  const menuToggleRef = React.useRef(null);
  React.useEffect(() => {
    if (!menuOpen) return;
    // This is a navigation dropdown, not a modal. Keep native page scrolling
    // available, including when a finger starts outside the open menu.
    const header = headerRef.current;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setMenuOpen(false);
      menuToggleRef.current?.focus({ preventScroll: true });
    };
    const onPointerDown = (event) => { if (!header?.contains(event.target)) setMenuOpen(false); };
    const onFocusIn = (event) => { if (!header?.contains(event.target)) setMenuOpen(false); };
    const onPageHide = () => setMenuOpen(false);
    const desktop = window.matchMedia('(min-width: 1281px)');
    const onResize = () => { if (desktop.matches) setMenuOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    window.addEventListener('pagehide', onPageHide);
    desktop.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('pagehide', onPageHide);
      desktop.removeEventListener('change', onResize);
    };
  }, [menuOpen]);
  const handleStart = (e) => { e.preventDefault(); setMenuOpen(false); onStart(); };
  const closeMenu = () => setMenuOpen(false);
  // Let real href anchors handle navigation/history; closing the dropdown
  // must not refocus the sticky header and pull the page back to the top.
  const handleMobileNav = () => setMenuOpen(false);

  // Платный тариф привязывается к аккаунту родителя. Сохраняем выбранный
  // вариант и время, чтобы после входа открыть правильную оплату.
  const handleBuyPlan = (targetPlan, lessons = null) => (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('synaq_want_plan', JSON.stringify({ plan: targetPlan, lessons, at: Date.now() }));
    } catch {}
    onStart();
  };
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (leadPendingRef.current) return;
    const element = e.currentTarget;
    const raw = Object.fromEntries(new FormData(element).entries());
    if (raw.website) return;
    const payload = validateLeadForm(raw);
    if (!payload) { setLeadState('invalid'); return; }
    leadPendingRef.current = true;
    setLeadState('saving');
    try {
      await sendLead(payload, lang);
      const role = payload.role === 'student'
        ? (lang === 'ru' ? 'Ученик' : 'Оқушы') : (lang === 'ru' ? 'Родитель' : 'Ата-ана');
      const message = (lang === 'ru'
        ? ['Здравствуйте! Хочу получить консультацию по SYNAQ.', `Имя: ${payload.name}`, `Телефон: ${payload.phone}`, `Кто я: ${role}`, payload.comment ? `Комментарий: ${payload.comment}` : '']
        : ['Сәлеметсіз бе! SYNAQ бойынша кеңес алғым келеді.', `Аты: ${payload.name}`, `Телефон: ${payload.phone}`, `Кім: ${role}`, payload.comment ? `Түсініктеме: ${payload.comment}` : '']).filter(Boolean).join('\n');
      setLeadState('saved');
      window.location.assign(`${WHATSAPP_LEAD_URL}?text=${encodeURIComponent(message)}`);
    } catch { setLeadState('error'); }
    finally { leadPendingRef.current = false; }
  };
  return (
    <div ref={landingRef} className="lp-root">

<header ref={headerRef} className="lp-site-header">
  <nav className="lp-nav" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
    <a href="#" className="lp-header-home" aria-label={lang === 'ru' ? 'SYNAQ — главная' : 'SYNAQ — басты бет'} onClick={closeMenu}><Brand className="lp-header-brand" /></a>
    <div className="lp-navlinks" style={{display:'flex',alignItems:'center'}}>
      <a href="#how">{t('lp.2')}</a>
      <a href="#schools">{t('lp.3')}</a>
      <a href="#parents">{t('lp.4')}</a>
      <a href="#free-diagnostic">{lang === 'ru' ? 'Бесплатная диагностика' : 'Тегін диагностика'}</a>
      <a href="#diagnostic">{lang === 'ru' ? 'Бесплатный пробник' : 'Тегін сынақ'}</a>
      <a href="#pricing">{t('lp.5')}</a>
    </div>
    <div className="lp-header-actions">
      <div className="lp-header-lang"><LangSwitch /></div>
      <a href="#" onClick={handleStart} className="lp-cta lp-header-start" style={{color:'#FFFFFF'}}>{t('lp.6')}</a>
      <button ref={menuToggleRef} aria-controls="landing-mobile-menu" type="button" className={`lp-menu-toggle${menuOpen ? ' is-open' : ''}`} aria-label={lang === 'ru' ? (menuOpen ? 'Закрыть меню' : 'Открыть меню') : (menuOpen ? 'Мәзірді жабу' : 'Мәзірді ашу')} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><i /><i /><i /></button>
    </div>
  </nav>
  <div id="landing-mobile-menu" hidden={!menuOpen} className={`lp-mobile-menu${menuOpen ? ' is-open' : ''}`}>
    <div className="lp-mobile-menu-inner">
      <a href="#how" onClick={(e) => handleMobileNav(e, '#how')}>{t('lp.2')}</a>
      <a href="#schools" onClick={(e) => handleMobileNav(e, '#schools')}>{t('lp.3')}</a>
      <a href="#parents" onClick={(e) => handleMobileNav(e, '#parents')}>{t('lp.4')}</a>
      <a href="#free-diagnostic" onClick={(e) => handleMobileNav(e, '#free-diagnostic')}>{lang === 'ru' ? 'Бесплатная диагностика' : 'Тегін диагностика'}</a>
      <a href="#diagnostic" onClick={(e) => handleMobileNav(e, '#diagnostic')}>{lang === 'ru' ? 'Бесплатный пробник' : 'Тегін сынақ'}</a>
      <a href="#pricing" onClick={(e) => handleMobileNav(e, '#pricing')}>{t('lp.5')}</a>
      <div className="lp-mobile-language"><span>Тіл / Язык</span><LangSwitch /></div>
    </div>
  </div>
</header>

  
  <LandingHero onFreeDiagnostic={onFreeDiagnostic} />
  <LandingBenefits />

  <section id="how" style={{background:'#F2F8FE',padding:'78px 0',borderTop:'1px solid rgba(19,40,60,.06)'}}>
    <div className="lp-pad" style={{maxWidth:'1280px',margin:'0 auto',padding:'0 56px'}}>
      <div className="sx-gallery-heading">
        <span className="sx-eyebrow">{lang === 'ru' ? 'ЗНАКОМЬТЕСЬ: SYNAQ' : 'ТАНЫСЫҢЫЗ: SYNAQ'}</span>
        <h2>{lang === 'ru' ? <>Платформа, на которой<br /><span>хочется заниматься</span></> : <>Бала қызыға дайындалатын<br /><span>платформа</span></>}</h2>
      </div>

      <LandingDemo />

    </div>
  </section>

  <div className="sx-assessment-pair">
  <section id="free-diagnostic" className="lp-diagnostic-section">
    <div className="lp-diagnostic-card">
      <div className="lp-diagnostic-copy">
        <span>{lang === 'ru' ? 'БЕСПЛАТНАЯ ДИАГНОСТИКА · БЕЗ РЕГИСТРАЦИИ' : 'ТЕГІН ДИАГНОСТИКА · ТІРКЕЛУСІЗ'}</span>
        <h2>{lang === 'ru' ? 'Узнайте, какие темы стоит подтянуть' : 'Қай тақырыптарды қайталау керегін анықтаңыз'}</h2>
        <p>{lang === 'ru' ? '10 коротких заданий по математике для 3–6 классов. Примерно за 7 минут вы получите оценку по темам, разбор ошибок и план подготовки на неделю.' : '3–6 сыныптарға арналған математикадан 10 қысқа тапсырма. Шамамен 7 минутта тақырыптар бойынша баға, қателерді талдау және бір апталық дайындық жоспарын аласыз.'}</p>
        <button type="button" onClick={onFreeDiagnostic}>{lang === 'ru' ? 'Пройти бесплатную диагностику' : 'Тегін диагностикадан өту'} →</button>
      </div>
      <div className="lp-diagnostic-preview" aria-hidden="true">
        <div className="lp-diagnostic-score"><strong>10</strong><span>{lang === 'ru' ? 'коротких заданий' : 'қысқа тапсырма'}</span></div>
        <div className="lp-diagnostic-bars">
          <div><span>{lang === 'ru' ? 'Сильные темы' : 'Мықты тақырыптар'}</span><i><b style={{width:'86%'}} /></i><em>✓</em></div>
          <div className="weak"><span>{lang === 'ru' ? 'Точки роста' : 'Даму нүктелері'}</span><i><b style={{width:'45%'}} /></i><em>↗</em></div>
          <div><span>{lang === 'ru' ? 'Личный план' : 'Жеке жоспар'}</span><i><b style={{width:'70%'}} /></i><em>7 {lang === 'ru' ? 'дн.' : 'күн'}</em></div>
        </div>
        <div className="lp-diagnostic-note">◷ <span>{lang === 'ru' ? '≈ 7 минут · результат сразу' : '≈ 7 минут · нәтиже бірден'}</span></div>
      </div>
    </div>
  </section>

  <section id="diagnostic" className="lp-diagnostic-section">
    <div className="lp-diagnostic-card">
      <div className="lp-diagnostic-copy">
        <span>{lang === 'ru' ? 'БЕСПЛАТНО · БЕЗ РЕГИСТРАЦИИ' : 'ТЕГІН · ТІРКЕЛУСІЗ'}</span>
        <h2>{lang === 'ru' ? 'Попробуйте тест БИЛ, НИШ или РФМШ' : 'БИЛ, НИШ немесе РФМШ тестін байқап көріңіз'}</h2>
        <p>{lang === 'ru' ? 'Тренировочные варианты SYNAQ по объёму вступительных испытаний: РФМШ — 30 заданий, БИЛ — 60, НИШ — 180. Результат сразу после теста.' : 'Қабылдау емтихандарының көлеміне сай SYNAQ жаттығу нұсқалары: РФМШ — 30 тапсырма, БИЛ — 60, НИШ — 180. Нәтиже тесттен кейін бірден көрсетіледі.'}</p>
        <button type="button" onClick={onDiagnostic}>{lang === 'ru' ? 'Выбрать бесплатный тест' : 'Тегін тестті таңдау'} →</button>
      </div>
      <div className="lp-diagnostic-preview" aria-hidden="true">
        <div className="lp-diagnostic-score"><strong>68%</strong><span>{lang === 'ru' ? 'результат' : 'нәтиже'}</span></div>
        <div className="lp-diagnostic-bars">
          <div><span>{lang === 'ru' ? 'Вычисления' : 'Есептеулер'}</span><i><b style={{width:'86%'}} /></i><em>86%</em></div>
          <div><span>{lang === 'ru' ? 'Дроби' : 'Бөлшектер'}</span><i><b style={{width:'62%'}} /></i><em>62%</em></div>
          <div className="weak"><span>Геометрия</span><i><b style={{width:'38%'}} /></i><em>38%</em></div>
        </div>
        <div className="lp-diagnostic-note">↗ <span>{lang === 'ru' ? 'Найдено 2 слабые темы' : '2 әлсіз тақырып табылды'}</span></div>
      </div>
    </div>
  </section>

  
  </div>

  <LandingMentor />

  <section id="schools" className="lp-pad" style={{maxWidth:'1280px',margin:'0 auto',padding:'80px 56px'}}>
    <div style={{marginBottom:'46px',maxWidth:'640px'}}>
      <div style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.16em',textTransform:'uppercase',color:'#2B91EA',marginBottom:'14px'}}>{t('lp.28')}</div>
      <h2 style={{font:'800 44px/1.08 \'Manrope\',sans-serif',letterSpacing:'-.025em',margin:'0 0 12px'}}>{t('lp.29')}</h2>
      <p style={{fontSize:'17px',color:'#60758A',margin:'0'}}>{t('lp.30')}</p>
    </div>
    <div className="lp-schools" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'22px'}}>
      <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(19,40,60,.09)',borderRadius:'20px',padding:'30px 28px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'22px'}}>
          <div style={{width:'76px',height:'76px',background:'#FFFFFF',border:'1px solid rgba(19,40,60,.08)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',padding:'11px'}}><img src="/landing/mobile/school-rfmsh.webp" loading="lazy" decoding="async" width="54" height="54" alt="РФМШ" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} /></div>
          <span style={{font:'600 11px \'IBM Plex Mono\',monospace',letterSpacing:'.06em',textTransform:'uppercase',color:'#3A9DF5',background:'rgba(58,157,245,.1)',padding:'6px 11px',borderRadius:'8px'}}>{t('lp.31')}</span>
        </div>
        <div style={{font:'600 24px \'Golos Text\',sans-serif',marginBottom:'4px'}}>РФМШ</div>
        <div style={{font:'500 12.5px \'IBM Plex Mono\',monospace',color:'#8094A7',marginBottom:'14px'}}>{t('lp.32')}</div>
        <p style={{fontSize:'14.5px',lineHeight:'1.55',color:'#60758A',margin:'0'}}>{t('lp.33')}</p>
      </div>
      <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(19,40,60,.09)',borderRadius:'20px',padding:'30px 28px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'22px'}}>
          <div style={{width:'76px',height:'76px',background:'#FFFFFF',border:'1px solid rgba(19,40,60,.08)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',padding:'11px'}}><img src="/landing/mobile/school-nis.webp" loading="lazy" decoding="async" width="54" height="54" alt="НИШ" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} /></div>
          <span style={{font:'600 11px \'IBM Plex Mono\',monospace',letterSpacing:'.06em',textTransform:'uppercase',color:'#3A9DF5',background:'rgba(58,157,245,.1)',padding:'6px 11px',borderRadius:'8px'}}>{t('lp.31')}</span>
        </div>
        <div style={{font:'600 24px \'Golos Text\',sans-serif',marginBottom:'4px'}}>НИШ</div>
        <div style={{font:'500 12.5px \'IBM Plex Mono\',monospace',color:'#8094A7',marginBottom:'14px'}}>Nazarbayev Intellectual Schools</div>
        <p style={{fontSize:'14.5px',lineHeight:'1.55',color:'#60758A',margin:'0'}}>{t('lp.35')}</p>
      </div>
      <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(19,40,60,.09)',borderRadius:'20px',padding:'30px 28px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'22px'}}>
          <div style={{width:'76px',height:'76px',background:'#FFFFFF',border:'1px solid rgba(19,40,60,.08)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',padding:'11px'}}><img src="/landing/mobile/school-bil.webp" loading="lazy" decoding="async" width="54" height="54" alt="КТЛ" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} /></div>
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
      
      <div className="lp-parent-preview" style={{background:'#FFFFFF',borderRadius:'22px',padding:'28px 30px',boxShadow:'0 40px 90px -50px rgba(0,0,0,.6)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'22px'}}>
          <div style={{width:'40px',height:'40px',borderRadius:'11px',background:'#2B91EA',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',font:'700 17px \'Manrope\',sans-serif'}}>Д</div>
          <div><div style={{font:'600 16px \'Manrope\',sans-serif',color:'#13283C'}}>{t('lp.39')}</div><div style={{font:'500 12px \'Manrope\',sans-serif',color:'#8094A7'}}>{t('lp.40')}</div></div>
        </div>
        <div className="lp-parent-metrics" style={{display:'flex',gap:'22px',alignItems:'center',marginBottom:'22px'}}>
          <svg width="120" height="120" viewBox="0 0 120 120" style={{flex:'none'}}>
            <circle cx="60" cy="60" r="48" fill="none" stroke="#DFEFFC" strokeWidth="12"></circle>
            <circle cx="60" cy="60" r="48" fill="none" stroke="#3A9DF5" strokeWidth="12" strokeLinecap="round" strokeDasharray="187 302" transform="rotate(-90 60 60)"></circle>
            <text x="60" y="58" textAnchor="middle" style={{font:'700 30px \'Manrope\',sans-serif',fill:'#13283C'}}>62%</text>
            <text x="60" y="76" textAnchor="middle" style={{font:'500 11px \'Manrope\',sans-serif',fill:'#8094A7'}}>{t('lp.41')}</text>
          </svg>
          <div style={{flex:'1'}}>
            <div style={{font:'600 11px \'Manrope\',sans-serif',letterSpacing:'.02em',textTransform:'uppercase',color:'#8094A7',marginBottom:'10px'}}>{t('lp.42')}</div>
            <div className="lp-parent-topic-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div style={{background:'#EAF5FF',borderRadius:'9px',padding:'8px 11px'}}><div style={{font:'600 12px \'Manrope\',sans-serif',color:'#13283C'}}>{t('lp.43')}</div><div style={{font:'700 15px \'Manrope\',sans-serif',color:'#167AD1'}}>86%</div></div>
              <div style={{background:'#EAF5FF',borderRadius:'9px',padding:'8px 11px'}}><div style={{font:'600 12px \'Manrope\',sans-serif',color:'#13283C'}}>{t('lp.44')}</div><div style={{font:'700 15px \'Manrope\',sans-serif',color:'#167AD1'}}>74%</div></div>
              <div style={{background:'#EEF7FF',borderRadius:'9px',padding:'8px 11px'}}><div style={{font:'600 12px \'Manrope\',sans-serif',color:'#13283C'}}>{t('lp.45')}</div><div style={{font:'700 15px \'Manrope\',sans-serif',color:'#8A5A12'}}>50%</div></div>
              <div style={{background:'#EAF5FF',borderRadius:'9px',padding:'8px 11px'}}><div style={{font:'600 12px \'Manrope\',sans-serif',color:'#13283C'}}>{t('lp.46')}</div><div style={{font:'700 15px \'Manrope\',sans-serif',color:'#2B91EA'}}>38%</div></div>
            </div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'12px',background:'#EAF5FF',border:'1px solid #C6E4FC',borderRadius:'12px',padding:'12px 16px'}}>
          <span style={{width:'30px',height:'30px',borderRadius:'8px',background:'#2B91EA',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',font:'700 15px \'Manrope\',sans-serif'}}>!</span>
          <div style={{font:'500 13.5px \'Manrope\',sans-serif',color:'#176FB8'}}>{t('lp.47')} <b>{t('lp.46')}</b> {t('lp.48')}</div>
        </div>
      </div>
      
      <div>
        <div style={{font:'600 12px \'Manrope\',sans-serif',letterSpacing:'.16em',textTransform:'uppercase',color:'#FFFFFF',marginBottom:'16px'}}>{t('lp.49')}</div>
        <h2 style={{font:'800 42px/1.08 \'Manrope\',sans-serif',letterSpacing:'-.025em',margin:'0 0 26px',color:'#FFFFFF'}}>{t('lp.50')} <span style={{color:'#FFFFFF'}}>{t('lp.51')}</span></h2>
        <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>
          <div style={{display:'flex',gap:'14px'}}><div style={{flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:'#FFFFFF',marginTop:'8px'}}></div><div><div style={{font:'600 17px \'Manrope\',sans-serif',marginBottom:'3px',color:'#FFFFFF'}}>{t('lp.52')}</div><div style={{fontSize:'15px',color:'#DCEEFF',lineHeight:'1.5'}}>{t('lp.53')}</div></div></div>
          <div style={{display:'flex',gap:'14px'}}><div style={{flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:'#FFFFFF',marginTop:'8px'}}></div><div><div style={{font:'600 17px \'Manrope\',sans-serif',marginBottom:'3px',color:'#FFFFFF'}}>{t('lp.54')}</div><div style={{fontSize:'15px',color:'#DCEEFF',lineHeight:'1.5'}}>{t('lp.55')}</div></div></div>
          <div style={{display:'flex',gap:'14px'}}><div style={{flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:'#FFFFFF',marginTop:'8px'}}></div><div><div style={{font:'600 17px \'Manrope\',sans-serif',marginBottom:'3px',color:'#FFFFFF'}}>{t('lp.56')}</div><div style={{fontSize:'15px',color:'#DCEEFF',lineHeight:'1.5'}}>{t('lp.57')}</div></div></div>
        </div>
        <a href="#" onClick={handleStart} className="lp-cta" style={{display:'inline-block',marginTop:'32px',background:'#FFFFFF',color:'#146EBA',padding:'14px 30px',borderRadius:'12px',font:'600 16px \'Manrope\',sans-serif'}}>{t('lp.58')}</a>
      </div>
    </div>
  </section>

  
  <LandingFounders />

  <LandingFamilyBenefits />

  <LandingPricing onStart={handleStart} onBuyPlan={handleBuyPlan} />

  <LandingFAQ />

  <section id="cta" className="lp-pad" style={{maxWidth:'1280px',margin:'0 auto',padding:'20px 56px 84px'}}>
    <div className="lp-lead-wrap">
      <div className="lp-lead-copy">
        <h2>{t('lp.leadTitle')}</h2>
        <p>{t('lp.leadText')}</p>
        <form className="lp-lead-form" onSubmit={handleLeadSubmit} aria-busy={leadState === 'saving'}>
          <div className="lp-lead-honeypot" aria-hidden="true">
            <label htmlFor="lead-website">Website</label>
            <input id="lead-website" name="website" type="text" tabIndex="-1" autoComplete="off" />
          </div>
          <div className="lp-lead-field">
            <label htmlFor="lead-name">{t('lp.leadName')}</label>
            <input id="lead-name" name="name" type="text" autoComplete="name" minLength={2} maxLength={80} placeholder={t('lp.leadNamePlaceholder')} required />
          </div>
          <div className="lp-lead-field">
            <label htmlFor="lead-phone">{t('lp.leadPhone')}</label>
            <input id="lead-phone" name="phone" type="tel" autoComplete="tel" maxLength={25} inputMode="tel" aria-describedby={leadState === 'invalid' ? leadErrorId : undefined} placeholder="+7 ___ ___ __ __" required />
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
          <button className="lp-lead-submit" type="submit" disabled={leadState === 'saving'}>{leadState === 'saving' ? (lang === 'ru' ? 'Отправляем…' : 'Жіберілуде…') : t('lp.leadSubmit')}</button>
          {['error', 'invalid'].includes(leadState) && <p id={leadErrorId} role="alert" className="lp-lead-error">{leadState === 'invalid'
            ? (lang === 'ru' ? 'Проверьте имя и номер телефона: например, +7 777 123 45 67.' : 'Атыңыз бен телефон нөмірін тексеріңіз: мысалы, +7 777 123 45 67.')
            : (lang === 'ru' ? 'Не удалось подтвердить отправку. Данные остались в форме — попробуйте ещё раз.' : 'Өтінімнің жіберілгенін растау мүмкін болмады. Деректер формада сақталды — қайталап көріңіз.')}</p>}
          {leadState === 'saved' && <p role="status">{lang === 'ru' ? 'Заявка сохранена. Открываем WhatsApp…' : 'Өтінім сақталды. WhatsApp ашылуда…'}</p>}
        </form>
      </div>
      <div className="lp-lead-visual" aria-label={t('lp.leadVisualLabel')}>
        <div className="lp-lead-halo" aria-hidden="true" />
        <img className="lp-lead-student" src="/landing/mobile/student-4-600.webp" srcSet="/landing/mobile/student-4-360.webp 360w, /landing/mobile/student-4-600.webp 600w" sizes="(max-width: 620px) 300px, 440px" width="600" height="900" loading="lazy" decoding="async" alt={t('lp.leadVisualLabel')} />
        <div className="lp-lead-note lp-lead-note-one"><span>{t('lp.leadNoteOneTop')}</span>{t('lp.leadNoteOne')}</div>
        <div className="lp-lead-note lp-lead-note-two"><span>{t('lp.leadNoteTwoTop')}</span>{t('lp.leadNoteTwo')}</div>
      </div>
    </div>
  </section>

  
  <footer className="lp-footer">
    <div className="lp-footer-inner">
      <div className="lp-footer-grid">
        <div className="lp-footer-about">
          <a href="#" aria-label={lang === 'ru' ? 'SYNAQ — главная' : 'SYNAQ — басты бет'}><Brand className="lp-footer-brand" /></a>
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
