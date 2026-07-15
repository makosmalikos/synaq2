import React from 'react';
import { LangSwitch, useLang } from './i18n.jsx';

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
  const box = { position: 'relative', width: '100%', height: 0, paddingTop: '56.25%', borderRadius: '18px', overflow: 'hidden', background: '#15332B' };
  const fill = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0, display: 'block' };

  if (!DEMO_VIDEO || failed) return (
    <div style={box}>
      <div style={{ ...fill, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px', textAlign: 'center', padding: '0 20px' }}>
        <span style={{ font: "600 12px 'IBM Plex Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#E9B84C' }}>{t('lp.1')}</span>
        <span style={{ font: "500 15px 'Golos Text',sans-serif", color: '#BFCBC4' }}>
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
            onError={() => setFailed(true)} style={{ ...fill, objectFit: 'contain', background: '#0E1B17' }} />}
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
  body{margin:0;background:#FBFAF6}
  ::selection{background:#15584A;color:#FBFAF6}
  a{color:inherit;text-decoration:none}
  .lp-nav a:hover{color:#B0342B}
  .lp-cta{transition:filter .18s,transform .18s}
  .lp-cta:hover{filter:brightness(1.06);transform:translateY(-2px)}
  .lp-ghost{transition:background .18s}
  .lp-ghost:hover{background:rgba(23,20,15,.05)}
  .lp-card{transition:transform .2s,box-shadow .2s,border-color .2s}
  .lp-card:hover{transform:translateY(-4px);box-shadow:0 18px 40px -24px rgba(23,20,15,.3)}
  .lp-price:hover{transform:translateY(-5px)}
  .lp-rot{opacity:0;animation:lpCycle 6s infinite}
  .lp-rot2{animation-delay:2s}
  .lp-rot3{animation-delay:4s}
  @keyframes lpCycle{0%{opacity:0}3%{opacity:1}30%{opacity:1}34%{opacity:0}100%{opacity:0}}
  @media(max-width:1000px){
    .lp-hero{grid-template-columns:1fr!important;gap:44px!important}
    .lp-h1{font-size:52px!important}
    .lp-steps{grid-template-columns:1fr 1fr!important}
    .lp-schools{grid-template-columns:1fr!important}
    .lp-inside{grid-template-columns:1fr!important}
    .lp-prices{grid-template-columns:1fr 1fr!important;max-width:560px!important;gap:14px!important}
    .lp-navlinks{display:none!important}
    .lp-pad{padding-left:22px!important;padding-right:22px!important}
  }
  @media(max-width:620px){ .lp-steps{grid-template-columns:1fr!important} }
`}</style>
<nav className="lp-nav lp-pad" style={{position:'sticky',top:'0',zIndex:'50',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 56px',background:'rgba(251,250,246,.88)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(23,20,15,.09)'}}>
    <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
      <div style={{width:'42px',height:'42px',borderRadius:'12px',overflow:'hidden',boxShadow:'0 4px 14px -6px rgba(21,51,43,.6)'}}><img src="/figures/6ee8b3d2.jpg" alt="Synaq" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} /></div>
      <span style={{font:'700 24px \'Lora\',serif',letterSpacing:'-.01em'}}>Synaq</span>
    </div>
    <div className="lp-navlinks" style={{display:'flex',alignItems:'center',gap:'32px',font:'500 15px \'Golos Text\',sans-serif',color:'#4A463E'}}>
      <a href="#how">{t('lp.2')}</a>
      <a href="#schools">{t('lp.3')}</a>
      <a href="#parents">{t('lp.4')}</a>
      <a href="#pricing">{t('lp.5')}</a>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
      <LangSwitch />
      <a href="#" onClick={handleStart} className="lp-cta" style={{background:'#15584A',color:'#FBFAF6',padding:'11px 24px',borderRadius:'10px',font:'600 15px \'Golos Text\',sans-serif'}}>{t('lp.6')}</a>
    </div>
  </nav>

  
  <section className="lp-hero lp-pad" style={{display:'grid',gridTemplateColumns:'1.05fr .95fr',gap:'64px',alignItems:'center',maxWidth:'1280px',margin:'0 auto',padding:'56px 56px',minHeight:'calc(100vh - 71px)'}}>
    <div>
      <div style={{display:'inline-flex',alignItems:'center',gap:'9px',background:'rgba(31,122,77,.1)',border:'1px solid rgba(31,122,77,.22)',padding:'7px 15px',borderRadius:'100px',marginBottom:'26px'}}>
        <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'#1F7A4D',boxShadow:'0 0 0 4px rgba(31,122,77,.16)'}}></span>
        <span style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.1em',textTransform:'uppercase',color:'#1F7A4D'}}>{t('lp.7')}</span>
      </div>
      <h1 className="lp-h1" style={{font:'600 74px/1.02 \'Lora\',serif',letterSpacing:'-.025em',margin:'0 0 24px'}}>{t('lp.hero1')}<span style={{fontStyle:'italic',color:'#B0342B'}}>{t('lp.hero2')}</span>{t('lp.hero3')}</h1>
      <p style={{fontSize:'19px',lineHeight:'1.6',color:'#5A554B',margin:'0 0 34px',maxWidth:'480px'}}>{t('lp.11')}</p>
      <div style={{display:'flex',gap:'13px',flexWrap:'wrap'}}>
        <a href="#" onClick={handleStart} className="lp-cta" style={{background:'#15584A',color:'#FBFAF6',padding:'15px 32px',borderRadius:'12px',font:'600 16px \'Golos Text\',sans-serif'}}>{t('lp.12')}</a>
        <a href="#how" className="lp-ghost" style={{padding:'15px 28px',borderRadius:'12px',border:'1px solid rgba(23,20,15,.16)',font:'600 16px \'Golos Text\',sans-serif',color:'#17140F'}}>{t('lp.13')}</a>
      </div>
    </div>

    
    <div style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{position:'relative',width:'320px',height:'270px',display:'flex',alignItems:'center',justifyContent:'center',borderBottom:'1px solid rgba(23,20,15,.14)'}}>
        <div className="lp-rot lp-rot1" style={{position:'absolute',width:'220px',height:'220px',display:'flex',alignItems:'center',justifyContent:'center',padding:'14px'}}><img src="/figures/20fb0c30.png" alt="РФМШ" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} /></div>
        <div className="lp-rot lp-rot2" style={{position:'absolute',width:'220px',height:'220px',display:'flex',alignItems:'center',justifyContent:'center',padding:'14px'}}><img src="/figures/5ac51878.png" alt="НИШ" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} /></div>
        <div className="lp-rot lp-rot3" style={{position:'absolute',width:'220px',height:'220px',display:'flex',alignItems:'center',justifyContent:'center',padding:'14px'}}><img src="/figures/191a2c27.png" alt="БИЛ" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} /></div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginTop:'26px'}}>
        <span style={{font:'600 11px \'IBM Plex Mono\',monospace',letterSpacing:'.16em',textTransform:'uppercase',color:'#8A8474'}}>{t('lp.14')}</span>
        <div style={{position:'relative',width:'120px',height:'32px'}}>
          <span className="lp-rot lp-rot1" style={{position:'absolute',left:'0',top:'0',font:'700 26px \'Golos Text\',sans-serif',color:'#B0342B'}}>{t('lp.15')}</span>
          <span className="lp-rot lp-rot2" style={{position:'absolute',left:'0',top:'0',font:'700 26px \'Golos Text\',sans-serif',color:'#1F5FB0'}}>{t('lp.16')}</span>
          <span className="lp-rot lp-rot3" style={{position:'absolute',left:'0',top:'0',font:'700 26px \'Golos Text\',sans-serif',color:'#1F7A4D'}}>{t('lp.17')}</span>
        </div>
      </div>
    </div>
  </section>

  
  <section id="how" style={{background:'#F4F1EA',padding:'78px 0',borderTop:'1px solid rgba(23,20,15,.06)'}}>
    <div className="lp-pad" style={{maxWidth:'1280px',margin:'0 auto',padding:'0 56px'}}>
      <div style={{textAlign:'center',marginBottom:'40px',maxWidth:'640px',marginLeft:'auto',marginRight:'auto'}}>
        <div style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.16em',textTransform:'uppercase',color:'#B0342B',marginBottom:'14px'}}>Как это работает</div>
        <h2 style={{font:'600 46px/1.05 \'Lora\',serif',letterSpacing:'-.02em',margin:'0 0 12px'}}>{t('lp.18')}</h2>
        <p style={{fontSize:'17px',color:'#5A554B',margin:'0'}}>{t('lp.19')}</p>
      </div>

      
      <div className="lp-demo" style={{maxWidth:'1000px',margin:'0 auto 54px'}}>
        <Demo />
      </div>

      <div className="lp-steps" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'20px'}}>
        <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(23,20,15,.09)',borderRadius:'18px',padding:'26px 24px'}}>
          <div style={{font:'600 32px \'Lora\',serif',color:'#D8CFBE',marginBottom:'12px'}}>01</div>
          <div style={{font:'600 18px \'Golos Text\',sans-serif',marginBottom:'8px'}}>{t('lp.20')}</div>
          <div style={{fontSize:'14px',lineHeight:'1.55',color:'#5A554B'}}>{t('lp.21')}</div>
        </div>
        <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(23,20,15,.09)',borderRadius:'18px',padding:'26px 24px'}}>
          <div style={{font:'600 32px \'Lora\',serif',color:'#D8CFBE',marginBottom:'12px'}}>02</div>
          <div style={{font:'600 18px \'Golos Text\',sans-serif',marginBottom:'8px'}}>{t('lp.22')}</div>
          <div style={{fontSize:'14px',lineHeight:'1.55',color:'#5A554B'}}>{t('lp.23')}</div>
        </div>
        <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(23,20,15,.09)',borderRadius:'18px',padding:'26px 24px'}}>
          <div style={{font:'600 32px \'Lora\',serif',color:'#D8CFBE',marginBottom:'12px'}}>03</div>
          <div style={{font:'600 18px \'Golos Text\',sans-serif',marginBottom:'8px'}}>{t('lp.24')}</div>
          <div style={{fontSize:'14px',lineHeight:'1.55',color:'#5A554B'}}>{t('lp.25')}</div>
        </div>
        <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(23,20,15,.09)',borderRadius:'18px',padding:'26px 24px'}}>
          <div style={{font:'600 32px \'Lora\',serif',color:'#D8CFBE',marginBottom:'12px'}}>04</div>
          <div style={{font:'600 18px \'Golos Text\',sans-serif',marginBottom:'8px'}}>{t('lp.26')}</div>
          <div style={{fontSize:'14px',lineHeight:'1.55',color:'#5A554B'}}>{t('lp.27')}</div>
        </div>
      </div>
    </div>
  </section>

  
  <section id="schools" className="lp-pad" style={{maxWidth:'1280px',margin:'0 auto',padding:'80px 56px'}}>
    <div style={{marginBottom:'46px',maxWidth:'640px'}}>
      <div style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.16em',textTransform:'uppercase',color:'#B0342B',marginBottom:'14px'}}>{t('lp.28')}</div>
      <h2 style={{font:'600 44px/1.05 \'Lora\',serif',letterSpacing:'-.02em',margin:'0 0 12px'}}>{t('lp.29')}</h2>
      <p style={{fontSize:'17px',color:'#5A554B',margin:'0'}}>{t('lp.30')}</p>
    </div>
    <div className="lp-schools" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'22px'}}>
      <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(23,20,15,.09)',borderRadius:'20px',padding:'30px 28px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'22px'}}>
          <div style={{width:'76px',height:'76px',background:'#FBFAF6',border:'1px solid rgba(23,20,15,.08)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',padding:'11px'}}><img src="/figures/20fb0c30.png" alt="РФМШ" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} /></div>
          <span style={{font:'600 11px \'IBM Plex Mono\',monospace',letterSpacing:'.06em',textTransform:'uppercase',color:'#1F7A4D',background:'rgba(31,122,77,.1)',padding:'6px 11px',borderRadius:'8px'}}>{t('lp.31')}</span>
        </div>
        <div style={{font:'600 24px \'Golos Text\',sans-serif',marginBottom:'4px'}}>РФМШ</div>
        <div style={{font:'500 12.5px \'IBM Plex Mono\',monospace',color:'#8A8474',marginBottom:'14px'}}>{t('lp.32')}</div>
        <p style={{fontSize:'14.5px',lineHeight:'1.55',color:'#5A554B',margin:'0'}}>{t('lp.33')}</p>
      </div>
      <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(23,20,15,.09)',borderRadius:'20px',padding:'30px 28px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'22px'}}>
          <div style={{width:'76px',height:'76px',background:'#FBFAF6',border:'1px solid rgba(23,20,15,.08)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',padding:'11px'}}><img src="/figures/5ac51878.png" alt="НИШ" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} /></div>
          <span style={{font:'600 11px \'IBM Plex Mono\',monospace',letterSpacing:'.06em',textTransform:'uppercase',color:'#8A8474',background:'rgba(23,20,15,.05)',padding:'6px 11px',borderRadius:'8px'}}>{t('lp.34')}</span>
        </div>
        <div style={{font:'600 24px \'Golos Text\',sans-serif',marginBottom:'4px'}}>НИШ</div>
        <div style={{font:'500 12.5px \'IBM Plex Mono\',monospace',color:'#8A8474',marginBottom:'14px'}}>Nazarbayev Intellectual Schools</div>
        <p style={{fontSize:'14.5px',lineHeight:'1.55',color:'#5A554B',margin:'0'}}>{t('lp.35')}</p>
      </div>
      <div className="lp-card" style={{background:'#fff',border:'1px solid rgba(23,20,15,.09)',borderRadius:'20px',padding:'30px 28px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'22px'}}>
          <div style={{width:'76px',height:'76px',background:'#FBFAF6',border:'1px solid rgba(23,20,15,.08)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',padding:'11px'}}><img src="/figures/191a2c27.png" alt="КТЛ" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} /></div>
          <span style={{font:'600 11px \'IBM Plex Mono\',monospace',letterSpacing:'.06em',textTransform:'uppercase',color:'#8A8474',background:'rgba(23,20,15,.05)',padding:'6px 11px',borderRadius:'8px'}}>Скоро</span>
        </div>
        <div style={{font:'600 24px \'Golos Text\',sans-serif',marginBottom:'4px'}}>БИЛ</div>
        <div style={{font:'500 12.5px \'IBM Plex Mono\',monospace',color:'#8A8474',marginBottom:'14px'}}>{t('lp.36')}</div>
        <p style={{fontSize:'14.5px',lineHeight:'1.55',color:'#5A554B',margin:'0'}}>{t('lp.37')}</p>
      </div>
    </div>
  </section>

  
  <section id="parents" style={{background:'#15332B',padding:'82px 0'}}>
    <div className="lp-inside lp-pad" style={{maxWidth:'1280px',margin:'0 auto',padding:'0 56px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'56px',alignItems:'center'}}>
      
      <div style={{background:'#FBFAF6',borderRadius:'22px',padding:'28px 30px',boxShadow:'0 40px 90px -50px rgba(0,0,0,.6)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'22px'}}>
          <div style={{width:'40px',height:'40px',borderRadius:'11px',background:'#B0342B',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',font:'700 17px \'Golos Text\''}}>Д</div>
          <div><div style={{font:'600 16px \'Golos Text\'',color:'#17140F'}}>{t('lp.39')}</div><div style={{font:'500 12px \'IBM Plex Mono\',monospace',color:'#8A8474'}}>{t('lp.40')}</div></div>
        </div>
        <div style={{display:'flex',gap:'22px',alignItems:'center',marginBottom:'22px'}}>
          <svg width="120" height="120" sc-camel-view-box="0 0 120 120" style={{flex:'none'}}>
            <circle cx="60" cy="60" r="48" fill="none" stroke="#EEEAE0" stroke-width="12"></circle>
            <circle cx="60" cy="60" r="48" fill="none" stroke="#15584A" stroke-width="12" stroke-linecap="round" stroke-dasharray="187 302" transform="rotate(-90 60 60)"></circle>
            <text x="60" y="58" text-anchor="middle" style={{font:'700 30px \'IBM Plex Mono\',monospace',fill:'#17140F'}}>62%</text>
            <text x="60" y="76" text-anchor="middle" style={{font:'500 11px \'Golos Text\'',fill:'#8A8474'}}>{t('lp.41')}</text>
          </svg>
          <div style={{flex:'1'}}>
            <div style={{font:'600 11px \'IBM Plex Mono\',monospace',letterSpacing:'.1em',textTransform:'uppercase',color:'#8A8474',marginBottom:'10px'}}>{t('lp.42')}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div style={{background:'#E7F1EC',borderRadius:'9px',padding:'8px 11px'}}><div style={{font:'600 12px \'Golos Text\'',color:'#17140F'}}>{t('lp.43')}</div><div style={{font:'700 15px \'IBM Plex Mono\',monospace',color:'#2E7D5B'}}>86%</div></div>
              <div style={{background:'#E7F1EC',borderRadius:'9px',padding:'8px 11px'}}><div style={{font:'600 12px \'Golos Text\'',color:'#17140F'}}>{t('lp.44')}</div><div style={{font:'700 15px \'IBM Plex Mono\',monospace',color:'#2E7D5B'}}>74%</div></div>
              <div style={{background:'#FBF1DE',borderRadius:'9px',padding:'8px 11px'}}><div style={{font:'600 12px \'Golos Text\'',color:'#17140F'}}>{t('lp.45')}</div><div style={{font:'700 15px \'IBM Plex Mono\',monospace',color:'#8A5A12'}}>50%</div></div>
              <div style={{background:'#FBEBE8',borderRadius:'9px',padding:'8px 11px'}}><div style={{font:'600 12px \'Golos Text\'',color:'#17140F'}}>{t('lp.46')}</div><div style={{font:'700 15px \'IBM Plex Mono\',monospace',color:'#B0342B'}}>38%</div></div>
            </div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'12px',background:'#FBEBE8',border:'1px solid #EDC6BE',borderRadius:'12px',padding:'12px 16px'}}>
          <span style={{width:'30px',height:'30px',borderRadius:'8px',background:'#B0342B',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',font:'700 15px \'Golos Text\''}}>!</span>
          <div style={{font:'500 13.5px \'Golos Text\'',color:'#7A241C'}}>{t('lp.47')} <b>{t('lp.46')}</b> {t('lp.48')}</div>
        </div>
      </div>
      
      <div>
        <div style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.16em',textTransform:'uppercase',color:'#E9B84C',marginBottom:'16px'}}>{t('lp.49')}</div>
        <h2 style={{font:'600 42px/1.06 \'Lora\',serif',letterSpacing:'-.02em',margin:'0 0 26px',color:'#FBFAF6'}}>{t('lp.50')} <span style={{fontStyle:'italic',color:'#E9B84C'}}>{t('lp.51')}</span></h2>
        <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>
          <div style={{display:'flex',gap:'14px'}}><div style={{flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:'#E9B84C',marginTop:'8px'}}></div><div><div style={{font:'600 17px \'Golos Text\'',marginBottom:'3px',color:'#FBFAF6'}}>{t('lp.52')}</div><div style={{fontSize:'15px',color:'#BFCBC4',lineHeight:'1.5'}}>{t('lp.53')}</div></div></div>
          <div style={{display:'flex',gap:'14px'}}><div style={{flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:'#E9B84C',marginTop:'8px'}}></div><div><div style={{font:'600 17px \'Golos Text\'',marginBottom:'3px',color:'#FBFAF6'}}>{t('lp.54')}</div><div style={{fontSize:'15px',color:'#BFCBC4',lineHeight:'1.5'}}>{t('lp.55')}</div></div></div>
          <div style={{display:'flex',gap:'14px'}}><div style={{flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:'#E9B84C',marginTop:'8px'}}></div><div><div style={{font:'600 17px \'Golos Text\'',marginBottom:'3px',color:'#FBFAF6'}}>{t('lp.56')}</div><div style={{fontSize:'15px',color:'#BFCBC4',lineHeight:'1.5'}}>{t('lp.57')}</div></div></div>
        </div>
        <a href="#" onClick={handleStart} className="lp-cta" style={{display:'inline-block',marginTop:'32px',background:'#E9B84C',color:'#231a06',padding:'14px 30px',borderRadius:'12px',font:'600 16px \'Golos Text\',sans-serif'}}>{t('lp.58')}</a>
      </div>
    </div>
  </section>

  
  <section id="pricing" className="lp-pad" style={{maxWidth:'1280px',margin:'0 auto',padding:'84px 56px'}}>
    <div style={{textAlign:'center',marginBottom:'48px',maxWidth:'600px',marginLeft:'auto',marginRight:'auto'}}>
      <div style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.16em',textTransform:'uppercase',color:'#B0342B',marginBottom:'14px'}}>Тарифы</div>
      <h2 style={{font:'600 46px/1.04 \'Lora\',serif',letterSpacing:'-.02em',margin:'0 0 12px'}}>{t('lp.59')}</h2>
      <p style={{fontSize:'17px',color:'#5A554B',margin:'0'}}>{t('lp.60')}</p>
    </div>
    <div className="lp-prices" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'22px',maxWidth:'760px',margin:'0 auto',alignItems:'stretch'}}>

      
      <div className="lp-price lp-card" style={{background:'#fff',border:'1px solid rgba(23,20,15,.1)',borderRadius:'22px',padding:'34px 30px',display:'flex',flexDirection:'column'}}>
        <div style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.1em',textTransform:'uppercase',color:'#8A8474'}}>{t('lp.61')}</div>
        <div style={{display:'flex',alignItems:'baseline',gap:'6px',margin:'16px 0 6px'}}><span style={{font:'600 46px \'Lora\',serif',color:'#17140F'}}>0 ₸</span></div>
        <div style={{fontSize:'14px',color:'#8A8474',marginBottom:'24px'}}>{t('lp.62')}</div>
        <div style={{display:'flex',flexDirection:'column',gap:'12px',flex:'1'}}>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#3A362E'}}><span style={{color:'#1F7A4D'}}>✓</span>{t('lp.63')}</div>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#3A362E'}}><span style={{color:'#1F7A4D'}}>✓</span>{t('lp.64')}</div>
        </div>
        <a href="#" onClick={handleStart} className="lp-ghost" style={{display:'block',textAlign:'center',marginTop:'26px',padding:'14px',borderRadius:'12px',border:'1px solid rgba(23,20,15,.18)',font:'600 15px \'Golos Text\'',color:'#17140F'}}>Начать</a>
      </div>

      
      <div className="lp-price" style={{background:'#15332B',border:'1px solid #15332B',borderRadius:'22px',padding:'34px 30px',display:'flex',flexDirection:'column',position:'relative',boxShadow:'0 30px 70px -40px rgba(21,51,43,.8)',transition:'transform .2s'}}>
        <div style={{position:'absolute',top:'-13px',left:'50%',transform:'translateX(-50%)',background:'#E9B84C',color:'#231a06',font:'600 11px \'IBM Plex Mono\',monospace',letterSpacing:'.08em',textTransform:'uppercase',padding:'6px 14px',borderRadius:'100px'}}>{t('lp.65')}</div>
        <div style={{font:'600 12px \'IBM Plex Mono\',monospace',letterSpacing:'.1em',textTransform:'uppercase',color:'#E9B84C'}}>{t('lp.66')}</div>
        <div style={{display:'flex',alignItems:'baseline',gap:'6px',margin:'16px 0 6px'}}><span style={{font:'600 46px \'Lora\',serif',color:'#FBFAF6'}}>5 999 ₸</span><span style={{fontSize:'15px',color:'#BFCBC4'}}>{t('lp.67')}</span></div>
        <div style={{fontSize:'14px',color:'#9FB3AA',marginBottom:'24px'}}>{t('lp.68')}</div>
        <div style={{display:'flex',flexDirection:'column',gap:'12px',flex:'1'}}>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#EAF0ED'}}><span style={{color:'#E9B84C'}}>✓</span>{t('lp.69')}</div>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#EAF0ED'}}><span style={{color:'#E9B84C'}}>✓</span>{t('lp.70')}</div>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#EAF0ED'}}><span style={{color:'#E9B84C'}}>✓</span>{t('lp.71')}</div>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#EAF0ED'}}><span style={{color:'#E9B84C'}}>✓</span>{t('lp.72')}</div>
          <div style={{display:'flex',gap:'10px',fontSize:'14.5px',color:'#EAF0ED'}}><span style={{color:'#E9B84C'}}>✓</span>{t('lp.73')}</div>
        </div>
        <a href="#" onClick={handleBuyPro} className="lp-cta" style={{display:'block',textAlign:'center',marginTop:'26px',padding:'14px',borderRadius:'12px',background:'#E9B84C',color:'#231a06',font:'600 15px \'Golos Text\''}}>{t('lp.74')}</a>
      </div>

      
    </div>
  </section>

  
  <section id="cta" className="lp-pad" style={{maxWidth:'1280px',margin:'0 auto',padding:'20px 56px 84px'}}>
    <div style={{borderRadius:'28px',padding:'64px 56px',textAlign:'center',background:'radial-gradient(120% 140% at 50% 0%, #1E463C 0%, #14110D 78%)',color:'#FBFAF6',position:'relative',overflow:'hidden'}}>
      <h2 style={{font:'600 58px/1.02 \'Lora\',serif',letterSpacing:'-.025em',margin:'0 0 18px'}}>Synaq <span style={{fontStyle:'italic',color:'#E9B84C'}}>{t('lp.75')}</span></h2>
      <p style={{fontSize:'18px',color:'#BFCBC4',margin:'0 auto 34px',maxWidth:'480px'}}>{t('lp.76')}</p>
      <div style={{display:'flex',gap:'13px',justifyContent:'center',flexWrap:'wrap'}}>
        <a href="#" onClick={handleStart} className="lp-cta" style={{display:'inline-block',background:'#E9B84C',color:'#231a06',padding:'17px 40px',borderRadius:'14px',font:'600 17px \'Golos Text\',sans-serif'}}>{t('lp.12')}</a>
        <a href="#pricing" className="lp-ghost" style={{display:'inline-block',padding:'17px 34px',borderRadius:'14px',border:'1px solid rgba(255,255,255,.24)',font:'600 17px \'Golos Text\',sans-serif',color:'#FBFAF6'}}>{t('lp.77')}</a>
      </div>
      
    </div>
  </section>

  
  <footer className="lp-pad" style={{borderTop:'1px solid rgba(23,20,15,.1)',padding:'30px 56px',maxWidth:'1280px',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px'}}>
    <div style={{display:'flex',alignItems:'center',gap:'11px'}}>
      <div style={{width:'34px',height:'34px',borderRadius:'9px',overflow:'hidden'}}><img src="/figures/6ee8b3d2.jpg" alt="Synaq" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} /></div>
      <span style={{font:'700 18px \'Golos Text\',sans-serif'}}>Synaq</span>
    </div>
    <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:'16px',font:"500 13.5px 'Golos Text',sans-serif",color:'#9A9384'}}>
      <span style={{fontWeight:600,color:'#6B655B'}}>Қолдау / Поддержка:</span>
      <a href="mailto:support@synaq.app" style={{color:'#B0342B',textDecoration:'none'}}>✉ support@synaq.app</a>
      <a href="https://t.me/makosmalikos" target="_blank" rel="noopener noreferrer" style={{color:'#B0342B',textDecoration:'none'}}>✈ @makosmalikos</a>
    </div>
    <div style={{font:'500 13px \'IBM Plex Mono\',monospace',color:'#8A8474'}}>{t('lp.78')}</div>
  </footer>
    </div>
  );
}
