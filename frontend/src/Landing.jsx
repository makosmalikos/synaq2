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
  return (
    <div className="lp-hero-stage" aria-label={t('lp.heroVisualLabel')}>
      <div className="lp-orbit lp-orbit-a" />
      <div className="lp-orbit lp-orbit-b" />

      <div className="lp-students-visual">
        <img src="/hero/kazakh-students-v1.png" alt="SYNAQ платформасында дайындалып жүрген оқушылар" />
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

      <div className="lp-signal lp-signal-ai"><em>⚡</em><span>{t('lp.heroAI')}</span></div>
      <div className="lp-signal lp-signal-format"><em>🎯</em><span>{t('lp.heroFormat')}</span></div>
      <div className="lp-signal lp-signal-progress"><em>📊</em><span>{t('lp.heroProgress')}</span></div>
    </div>
  );
}

export default function Landing({ onStart }) {
  const { t } = useLang();
  const handleStart = (e) => { e.preventDefault(); onStart(); };

  // «Про таңдау»: логин қажет (төлем ата-ана аккаунтына байланады),
  // сондықтан белгі қоямыз — кірген соң кабинет бірден төлемді ашады.
  const handleBuyPro = (e) => {
    e.preventDefault();
    try { localStorage.setItem('synaq_want_pro', '1'); } catch {}
    onStart();
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
  .lp-root{min-height:100vh;background:#fff;color:#13283C;overflow-x:hidden}
  .lp-nav a:hover{color:#2B91EA}
  .lp-cta{transition:filter .18s,transform .18s}
  .lp-cta:hover{filter:brightness(1.06);transform:translateY(-2px)}
  .lp-ghost{transition:background .18s}
  .lp-ghost:hover{background:rgba(19,40,60,.05)}
  .lp-card{transition:transform .2s,box-shadow .2s,border-color .2s}
  .lp-card:hover{transform:translateY(-4px);box-shadow:0 18px 40px -24px rgba(19,40,60,.3)}
  .lp-price:hover{transform:translateY(-5px)}
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
  .lp-students-visual{position:absolute;left:50%;top:0;width:min(100%,920px);height:410px;transform:translateX(-50%);overflow:hidden;border-radius:32px;background:#F8FBFF;border:1px solid rgba(29,78,216,.1);box-shadow:0 32px 70px -42px rgba(15,47,126,.48)}
  .lp-students-visual:after{content:'';position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 -34px 50px -42px rgba(29,78,216,.28);pointer-events:none}
  .lp-students-visual img{width:100%;height:100%;display:block;object-fit:cover;object-position:center 39%}
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
  .lp-signal{position:absolute;width:258px;display:flex;align-items:center;gap:12px;padding:13px 15px;background:rgba(255,255,255,.82);border:1px solid rgba(29,78,216,.16);border-radius:14px;box-shadow:0 20px 50px -28px rgba(30,64,175,.38),inset 0 1px 0 rgba(255,255,255,.9);backdrop-filter:blur(16px);transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;z-index:3}
  .lp-signal:before{content:'';position:absolute;right:100%;top:50%;width:34px;height:1px;background:linear-gradient(90deg,transparent,rgba(29,78,216,.3))}
  .lp-signal:hover{transform:translateY(-4px);border-color:rgba(29,78,216,.3);box-shadow:0 24px 58px -26px rgba(29,78,216,.48),inset 0 1px 0 #fff}
  .lp-signal em{width:36px;height:36px;flex:none;display:grid;place-items:center;border-radius:10px;background:linear-gradient(145deg,#EFF6FF,#DBEAFE);box-shadow:inset 0 0 0 1px rgba(29,78,216,.08);font-style:normal;font-size:17px}
  .lp-signal span{font:650 13.5px/1.3 'Golos Text',sans-serif;color:#173252}
  .lp-signal-ai{left:0;top:64px}
  .lp-signal-format{right:0;top:118px}
  .lp-signal-progress{left:4%;bottom:20px}
  .lp-signal-ai:before,.lp-signal-progress:before{right:auto;left:100%;background:linear-gradient(90deg,rgba(29,78,216,.3),transparent)}
  @keyframes lpOrbit{to{transform:rotate(360deg)}}
  @keyframes lpSchoolCycle{0%{opacity:0;transform:rotateY(-70deg) scale(.82)}7%,27%{opacity:1;transform:rotateY(0) scale(1)}33%,100%{opacity:0;transform:rotateY(70deg) scale(.82)}}
  @keyframes lpSchoolGlow{to{opacity:.55;transform:scale(1.07)}}
  @media(max-width:1000px){
    .lp-hero{gap:0!important}
    .lp-h1{font-size:52px!important}
    .lp-hero-stage{max-width:760px}
    .lp-students-visual{width:100%;height:390px}
    .lp-signal-ai{left:0}
    .lp-signal-format{right:0}
    .lp-signal-progress{left:2%}
    .lp-steps{grid-template-columns:1fr 1fr!important}
    .lp-schools{grid-template-columns:1fr!important}
    .lp-inside{grid-template-columns:1fr!important}
    .lp-prices{grid-template-columns:1fr 1fr!important;max-width:560px!important;gap:14px!important}
    .lp-navlinks{display:none!important}
    .lp-pad{padding-left:22px!important;padding-right:22px!important}
  }
  @media(max-width:620px){
    .lp-hero{padding-top:40px!important;padding-bottom:58px!important;gap:0!important}
    .lp-h1{font-size:43px!important}
    .lp-hero-copy{text-align:left}
    .lp-hero-stage{min-height:0;display:flex;flex-direction:column;align-items:center;margin-top:28px}
    .lp-hero-stage:before{inset:0 2% 38%;}
    .lp-orbit-a,.lp-orbit-b{display:none}
    .lp-students-visual{position:relative;left:auto;top:auto;width:100%;height:auto;aspect-ratio:1.38;transform:none;border-radius:22px;margin-bottom:8px}
    .lp-students-visual img{object-position:center 40%}
    .lp-school-carousel{right:8px;top:min(48vw,178px);bottom:auto;width:82px;height:82px}
    .lp-school-frame{width:72px;height:72px}
    .lp-school-slide{padding:10px}
    .lp-school-dots{display:none}
    .lp-signal{position:relative;right:auto;top:auto;bottom:auto;width:min(100%,330px);margin-top:10px;background:rgba(255,255,255,.9)}
    .lp-signal:before{display:none}
    .lp-signal:hover{transform:translateY(-2px)}
    .lp-steps{grid-template-columns:1fr!important}
  }
  @media(prefers-reduced-motion:reduce){.lp-orbit-b,.lp-school-glow{animation:none}.lp-school-slide{animation-name:lpSchoolFade}.lp-signal{transition:none}}
  @keyframes lpSchoolFade{0%,33%{opacity:1;transform:none}34%,100%{opacity:0;transform:none}}
`}</style>
<nav className="lp-nav lp-pad" style={{position:'sticky',top:'0',zIndex:'50',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 56px',background:'rgba(255,255,255,.90)',backdropFilter:'blur(14px)',borderBottom:'1px solid rgba(39,132,211,.14)'}}>
    <Brand />
    <div className="lp-navlinks" style={{display:'flex',alignItems:'center',gap:'32px',font:'500 15px \'Golos Text\',sans-serif',color:'#405D76'}}>
      <a href="#how">{t('lp.2')}</a>
      <a href="#schools">{t('lp.3')}</a>
      <a href="#parents">{t('lp.4')}</a>
      <a href="#pricing">{t('lp.5')}</a>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
      <LangSwitch />
      <a href="#" onClick={handleStart} className="lp-cta" style={{background:'#3A9DF5',color:'#FFFFFF',padding:'11px 24px',borderRadius:'10px',font:'600 15px \'Golos Text\',sans-serif'}}>{t('lp.6')}</a>
    </div>
  </nav>

  
  <section className="lp-hero lp-pad" style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',maxWidth:'1280px',margin:'0 auto',padding:'46px 56px 32px',minHeight:'calc(100vh - 71px)'}}>
    <div className="lp-hero-copy">
      <div style={{display:'inline-flex',alignItems:'center',gap:'9px',background:'rgba(58,157,245,.1)',border:'1px solid rgba(58,157,245,.22)',padding:'7px 15px',borderRadius:'100px',marginBottom:'26px'}}>
        <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'#3A9DF5',boxShadow:'0 0 0 4px rgba(58,157,245,.16)'}}></span>
        <span style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.1em',textTransform:'uppercase',color:'#3A9DF5'}}>{t('lp.7')}</span>
      </div>
      <h1 className="lp-h1" style={{font:'800 64px/1.02 \'Golos Text\',sans-serif',letterSpacing:'-.045em',margin:'0 auto 18px',maxWidth:'880px'}}>{t('lp.hero1')}<span className="lp-hero-accent">{t('lp.hero2')}</span>{t('lp.hero3')}</h1>
      <p style={{fontSize:'18px',lineHeight:'1.55',color:'#60758A',margin:'0 auto 26px',maxWidth:'720px'}}>{t('lp.11')}</p>
      <div style={{display:'flex',justifyContent:'center',gap:'13px',flexWrap:'wrap'}}>
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
        <h2 style={{font:'600 46px/1.05 \'Lora\',serif',letterSpacing:'-.02em',margin:'0 0 12px'}}>{t('lp.18')}</h2>
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
      <h2 style={{font:'600 44px/1.05 \'Lora\',serif',letterSpacing:'-.02em',margin:'0 0 12px'}}>{t('lp.29')}</h2>
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
        <h2 style={{font:'600 42px/1.06 \'Lora\',serif',letterSpacing:'-.02em',margin:'0 0 26px',color:'#FFFFFF'}}>{t('lp.50')} <span style={{fontStyle:'italic',color:'#FFFFFF'}}>{t('lp.51')}</span></h2>
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
    <div style={{textAlign:'center',marginBottom:'48px',maxWidth:'600px',marginLeft:'auto',marginRight:'auto'}}>
      <div style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.16em',textTransform:'uppercase',color:'#2B91EA',marginBottom:'14px'}}>Тарифы</div>
      <h2 style={{font:'600 46px/1.04 \'Lora\',serif',letterSpacing:'-.02em',margin:'0 0 12px'}}>{t('lp.59')}</h2>
      <p style={{fontSize:'17px',color:'#60758A',margin:'0'}}>{t('lp.60')}</p>
    </div>
    <div className="lp-prices" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'22px',maxWidth:'760px',margin:'0 auto',alignItems:'stretch'}}>

      
      <div className="lp-price lp-card" style={{background:'#fff',border:'1px solid rgba(19,40,60,.1)',borderRadius:'22px',padding:'34px 30px',display:'flex',flexDirection:'column'}}>
        <div style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.1em',textTransform:'uppercase',color:'#8094A7'}}>{t('lp.61')}</div>
        <div style={{display:'flex',alignItems:'baseline',gap:'6px',margin:'16px 0 6px'}}><span style={{font:'600 46px \'Lora\',serif',color:'#13283C'}}>0 ₸</span></div>
        <div style={{fontSize:'14px',color:'#8094A7',marginBottom:'24px'}}>{t('lp.62')}</div>
        <div style={{display:'flex',flexDirection:'column',gap:'12px',flex:'1'}}>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#36536B'}}><span style={{color:'#3A9DF5'}}>✓</span>{t('lp.63')}</div>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#36536B'}}><span style={{color:'#3A9DF5'}}>✓</span>{t('lp.64')}</div>
        </div>
        <a href="#" onClick={handleStart} className="lp-ghost" style={{display:'block',textAlign:'center',marginTop:'26px',padding:'14px',borderRadius:'12px',border:'1px solid rgba(19,40,60,.18)',font:'600 15px \'Golos Text\'',color:'#13283C'}}>Начать</a>
      </div>

      
      <div className="lp-price" style={{background:'#167ACB',border:'1px solid #167ACB',borderRadius:'22px',padding:'34px 30px',display:'flex',flexDirection:'column',position:'relative',boxShadow:'0 30px 70px -40px rgba(30,126,204,.8)',transition:'transform .2s'}}>
        <div style={{position:'absolute',top:'-13px',left:'50%',transform:'translateX(-50%)',background:'#FFFFFF',color:'#146EBA',font:'600 11px \'IBM Plex Mono\',monospace',letterSpacing:'.08em',textTransform:'uppercase',padding:'6px 14px',borderRadius:'100px'}}>{t('lp.65')}</div>
        <div style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.1em',textTransform:'uppercase',color:'#FFFFFF'}}>{t('lp.66')}</div>
        <div style={{display:'flex',alignItems:'baseline',gap:'6px',margin:'16px 0 6px'}}><span style={{font:'600 46px \'Lora\',serif',color:'#FFFFFF'}}>5 999 ₸</span><span style={{fontSize:'15px',color:'#DCEEFF'}}>{t('lp.67')}</span></div>
        <div style={{fontSize:'14px',color:'#C9E5FB',marginBottom:'24px'}}>{t('lp.68')}</div>
        <div style={{display:'flex',flexDirection:'column',gap:'12px',flex:'1'}}>
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
    <div style={{borderRadius:'28px',padding:'64px 56px',textAlign:'center',background:'radial-gradient(120% 140% at 50% 0%, #48ACFF 0%, #1268AD 78%)',color:'#FFFFFF',position:'relative',overflow:'hidden'}}>
      <h2 style={{font:'600 58px/1.02 \'Lora\',serif',letterSpacing:'-.025em',margin:'0 0 18px'}}>Synaq <span style={{fontStyle:'italic',color:'#FFFFFF'}}>{t('lp.75')}</span></h2>
      <p style={{fontSize:'18px',color:'#DCEEFF',margin:'0 auto 34px',maxWidth:'480px'}}>{t('lp.76')}</p>
      <div style={{display:'flex',gap:'13px',justifyContent:'center',flexWrap:'wrap'}}>
        <a href="#" onClick={handleStart} className="lp-cta" style={{display:'inline-block',background:'#FFFFFF',color:'#146EBA',padding:'17px 40px',borderRadius:'14px',font:'600 17px \'Golos Text\',sans-serif'}}>{t('lp.12')}</a>
        <a href="#pricing" className="lp-ghost" style={{display:'inline-block',padding:'17px 34px',borderRadius:'14px',border:'1px solid rgba(255,255,255,.24)',font:'600 17px \'Golos Text\',sans-serif',color:'#FFFFFF'}}>{t('lp.77')}</a>
      </div>
      
    </div>
  </section>

  
  <footer className="lp-pad" style={{borderTop:'1px solid rgba(19,40,60,.1)',padding:'30px 56px',maxWidth:'1280px',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px'}}>
    <Brand compact />
    <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:'16px',font:"500 13.5px 'Golos Text',sans-serif",color:'#8094A7'}}>
      <span style={{fontWeight:600,color:'#60758A'}}>Қолдау / Поддержка:</span>
      <a href="mailto:support@synaq.app" style={{color:'#2B91EA',textDecoration:'none'}}>✉ support@synaq.app</a>
      <a href="https://t.me/makosmalikos" target="_blank" rel="noopener noreferrer" style={{color:'#2B91EA',textDecoration:'none'}}>✈ @makosmalikos</a>
    </div>
    <div style={{font:'500 13px \'IBM Plex Mono\',monospace',color:'#8094A7'}}>{t('lp.78')}</div>
  </footer>
    </div>
  );
}
