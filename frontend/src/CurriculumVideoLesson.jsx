import React, { useEffect, useMemo, useRef, useState } from 'react';

const sceneDuration = 6500;

const scripts = {
  kk: [
    { eyebrow: 'КІРІСПЕ', title: 'Разрядтармен танысайық', text: 'Сәлем! Мен Сұңқармын. Бүгін екі таңбалы санның қалай құрылғанын бірге түсінеміз. Сабақтың соңында ондық пен бірлікті оңай ажырата аласың.' },
    { eyebrow: '1-БӨЛІМ', title: 'Ондық деген не?', text: 'Он жеке бірлікті бір топқа жинасақ, бір ондық шығады. Мысалы, он қарындашты бір бумаға байлағандай. Төрт бума — төрт ондық, яғни қырық бірлік.' },
    { eyebrow: '2-БӨЛІМ', title: '46 санын жіктейік', text: 'Қырық алты санында төрт ондық және алты бірлік бар. Сол жақтағы төрт — қырықты, оң жақтағы алты — алты бірлікті көрсетеді. Сондықтан 46 = 40 + 6.' },
    { eyebrow: '3-БӨЛІМ', title: 'Тағы бір мысал', text: 'Жетпіс екі санында жеті ондық және екі бірлік бар. Тексеру үшін оңнан солға қарай оқимыз: алдымен бірлік, содан кейін ондық. Демек, 72 = 70 + 2.' },
    { eyebrow: 'ҚОРЫТЫНДЫ', title: 'Ережені есте сақта', text: 'Екі таңбалы санда оң жақтағы цифр бірлікті, ал сол жақтағы цифр ондықты көрсетеді. Енді осы ережені өзің тапсырмаларда қолданып көр.' },
  ],
  ru: [
    { eyebrow: 'ВВЕДЕНИЕ', title: 'Знакомимся с разрядами', text: 'Привет! Я Сұңқар. Сегодня мы разберёмся, как устроено двузначное число. К концу урока ты легко научишься различать десятки и единицы.' },
    { eyebrow: 'ЧАСТЬ 1', title: 'Что такое десяток?', text: 'Если собрать десять отдельных единиц в одну группу, получится один десяток. Представь десять карандашей, связанных в пачку. Четыре пачки — четыре десятка, или сорок единиц.' },
    { eyebrow: 'ЧАСТЬ 2', title: 'Разложим число 46', text: 'В числе сорок шесть четыре десятка и шесть единиц. Цифра четыре слева обозначает сорок, а цифра шесть справа — шесть единиц. Поэтому 46 = 40 + 6.' },
    { eyebrow: 'ЧАСТЬ 3', title: 'Ещё один пример', text: 'В числе семьдесят два семь десятков и две единицы. Для проверки читаем разряды справа налево: сначала единицы, затем десятки. Значит, 72 = 70 + 2.' },
    { eyebrow: 'ИТОГ', title: 'Запомни правило', text: 'В двузначном числе цифра справа показывает единицы, а цифра слева — десятки. Теперь попробуй применить это правило самостоятельно в заданиях.' },
  ],
};

const compareScripts = {
  kk: [
    { eyebrow: 'КІРІСПЕ', title: 'Сандарды салыстырайық', text: 'Сәлем! Келесі сабаққа қош келдің. Бүгін жүзге дейінгі сандарды салыстыруды үйренеміз. Қай сан үлкен, қай сан кіші екенін бірге анықтайық.' },
    { eyebrow: '1-БӨЛІМ', title: 'Алдымен ондықтарға қара', text: '47 санында төрт ондық, ал 32 санында үш ондық бар. Төрт ондық үш ондықтан үлкен. Сондықтан 47 саны 32 санынан үлкен.' },
    { eyebrow: '2-БӨЛІМ', title: 'Ондықтар тең болса', text: '54 пен 59 сандарында бес-бестен ондық бар. Онда бірліктерді салыстырамыз: тоғыз бірлік төрт бірліктен үлкен. Сондықтан 54 саны 59 санынан кіші.' },
    { eyebrow: '3-БӨЛІМ', title: 'Салыстыру белгілері', text: 'Нәтижені үлкен, кіші немесе тең белгілерімен жазамыз. Мысалы: 47 саны 32-ден үлкен, 54 саны 59-дан кіші, ал 68 саны 68-ге тең.' },
    { eyebrow: 'ҚОРЫТЫНДЫ', title: 'Үш қадамды есте сақта', text: 'Алдымен ондықтарды салыстыр. Ондықтар тең болса, бірліктерге қара. Соңында дұрыс салыстыру белгісін таңда.' },
  ],
  ru: [
    { eyebrow: 'ВВЕДЕНИЕ', title: 'Сравниваем числа', text: 'Привет! Добро пожаловать на следующий урок. Сегодня мы научимся сравнивать числа до ста и определять, какое число больше, а какое меньше.' },
    { eyebrow: 'ЧАСТЬ 1', title: 'Сначала смотри на десятки', text: 'В числе 47 четыре десятка, а в числе 32 — три десятка. Четыре десятка больше трёх. Поэтому 47 больше 32.' },
    { eyebrow: 'ЧАСТЬ 2', title: 'Если десятки равны', text: 'В числах 54 и 59 по пять десятков. Тогда сравниваем единицы: девять единиц больше четырёх. Поэтому 54 меньше 59.' },
    { eyebrow: 'ЧАСТЬ 3', title: 'Знаки сравнения', text: 'Результат записываем знаками больше, меньше или равно. Например: 47 больше 32, 54 меньше 59, а 68 равно 68.' },
    { eyebrow: 'ИТОГ', title: 'Запомни три шага', text: 'Сначала сравни десятки. Если они равны, сравни единицы. Затем выбери правильный знак сравнения.' },
  ],
};

function FalconMascot({ celebrating = false }) {
  return <div className={`curriculum-falcon${celebrating ? ' is-celebrating' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 180 180" role="img">
      <defs>
        <linearGradient id="falconBody" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#5B62F2"/><stop offset="1" stopColor="#1E8DE0"/>
        </linearGradient>
        <linearGradient id="falconWing" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#39C4C0"/><stop offset="1" stopColor="#2E6DDA"/>
        </linearGradient>
      </defs>
      <path className="falcon-tail" d="M74 139 57 169l31-17 15 20 5-35z" fill="#F5B84C"/>
      <path className="falcon-wing left" d="M72 91C45 83 27 91 17 111c22-5 34 4 47 22z" fill="url(#falconWing)"/>
      <path className="falcon-wing right" d="M108 91c27-8 45 0 55 20-22-5-34 4-47 22z" fill="url(#falconWing)"/>
      <path d="M90 24c32 0 49 28 41 63l-10 47c-4 18-17 27-31 27s-27-9-31-27L49 87c-8-35 9-63 41-63z" fill="url(#falconBody)"/>
      <path d="M60 75c7-23 20-36 39-39-1 11 8 19 25 24-9 3-17 8-23 15z" fill="#fff" opacity=".94"/>
      <path d="M77 72c-7-8-16-11-26-8 9 5 14 13 17 24z" fill="#fff" opacity=".9"/>
      <circle cx="73" cy="82" r="9" fill="#fff"/><circle cx="108" cy="82" r="9" fill="#fff"/>
      <circle cx="76" cy="84" r="4" fill="#172B4D"/><circle cx="105" cy="84" r="4" fill="#172B4D"/>
      <path d="M82 96h17l-9 10z" fill="#FFD36D"/>
      <path d="M72 119c12 9 25 9 37 0" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round"/>
      <path d="M78 138h24" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".55"/>
    </svg>
    <span>SYNAQ</span>
  </div>;
}

function Bundles({ tens = 4, ones = 6 }) {
  return <div className="curriculum-place-model" aria-label={`${tens} tens and ${ones} ones`}>
    <div><span>ОНДЫҚ</span><section>{Array.from({ length: tens }, (_, index) => <i className="ten-bundle" key={index}>{Array.from({ length: 5 }, (_, line) => <b key={line}/>)}</i>)}</section></div>
    <div><span>БІРЛІК</span><section>{Array.from({ length: ones }, (_, index) => <i className="one-dot" key={index}/>)}</section></div>
  </div>;
}

function ComparisonVisual({ scene, labels, onComplete }) {
  if (scene === 0) return <div className="curriculum-compare-intro"><b>47</b><span>?</span><b>32</b></div>;
  if (scene === 1) return <div className="curriculum-compare-example"><article><small>{labels.tens}</small><strong>4</strong><b>47</b></article><em>›</em><article><small>{labels.tens}</small><strong>3</strong><b>32</b></article></div>;
  if (scene === 2) return <div className="curriculum-compare-example is-units"><article><small>{labels.ones}</small><strong>4</strong><b>54</b></article><em>‹</em><article><small>{labels.ones}</small><strong>9</strong><b>59</b></article></div>;
  if (scene === 3) return <div className="curriculum-compare-signs"><span><b>47</b><em>›</em><b>32</b></span><span><b>54</b><em>‹</em><b>59</b></span><span><b>68</b><em>=</em><b>68</b></span></div>;
  return <div className="curriculum-compare-summary"><ol><li><b>1</b>{labels.compareTens}</li><li><b>2</b>{labels.compareOnes}</li><li><b>3</b>{labels.chooseSign}</li></ol><button onClick={onComplete}>{labels.exercises} →</button></div>;
}

export default function CurriculumVideoLesson({ lang = 'kk', lesson = 'place-value', onComplete = () => {} }) {
  const locale = lang === 'ru' ? 'ru' : 'kk';
  const comparisonLesson = lesson === 'compare-100';
  const scenes = (comparisonLesson ? compareScripts : scripts)[locale];
  const [scene, setScene] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [voice, setVoice] = useState(true);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef(null);
  const current = scenes[scene];
  const finished = scene === scenes.length - 1;
  const totalProgress = ((scene + Math.min(elapsed / sceneDuration, 1)) / scenes.length) * 100;
  const labels = useMemo(() => locale === 'ru' ? {
    pilot: 'ВИДЕОУРОК · ПИЛОТ', play: 'Смотреть урок', pause: 'Пауза', resume: 'Продолжить', replay: 'Посмотреть ещё раз', voiceOn: 'Выключить звук', voiceOff: 'Включить звук', voiceError: 'Не удалось включить звук', exercises: 'Перейти к заданиям', duration: comparisonLesson ? '≈ 1 мин 30 сек' : '1 мин 15 сек', number: 'ЧИСЛО', tens: 'ДЕСЯТКИ', ones: 'ЕДИНИЦЫ', compareTens: 'Сравни десятки', compareOnes: 'Сравни единицы', chooseSign: 'Выбери знак',
  } : {
    pilot: 'ВИДЕОСАБАҚ · ПИЛОТ', play: 'Сабақты көру', pause: 'Үзіліс', resume: 'Жалғастыру', replay: 'Қайта көру', voiceOn: 'Дыбысты өшіру', voiceOff: 'Дыбысты қосу', voiceError: 'Дыбысты қосу мүмкін болмады', exercises: 'Тапсырмаларға өту', duration: comparisonLesson ? '≈ 1 мин 30 сек' : '1 мин 15 сек', number: 'САН', tens: 'ОНДЫҚ', ones: 'БІРЛІК', compareTens: 'Ондықтарды салыстыр', compareOnes: 'Бірліктерді салыстыр', chooseSign: 'Белгіні таңда',
  }, [locale, comparisonLesson]);

  useEffect(() => {
    if (!playing || voice || finished) return undefined;
    const timer = window.setInterval(() => setElapsed(value => {
      if (value + 100 >= sceneDuration) {
        setScene(index => {
          const next = Math.min(index + 1, scenes.length - 1);
          if (next === scenes.length - 1) setPlaying(false);
          return next;
        });
        return 0;
      }
      return value + 100;
    }), 100);
    return () => window.clearInterval(timer);
  }, [playing, voice, finished, scenes.length]);

  const narrationPath = index => `/audio/curriculum/${comparisonLesson ? 'compare-100-natural' : 'place-value-natural'}/${locale}-${index + 1}.mp3`;
  const playNarration = index => {
    const audio = audioRef.current;
    if (!audio) return;
    const path = narrationPath(index);
    if (!audio.src.endsWith(path)) audio.src = path;
    audio.currentTime = 0;
    setAudioError(false);
    void audio.play().catch(() => setAudioError(true));
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const path = narrationPath(scene);
    if (voice && playing && (!audio.src.endsWith(path) || audio.paused)) playNarration(scene);
    else audio.pause();
  }, [scene]);

  useEffect(() => () => audioRef.current?.pause(), []);

  const togglePlay = () => {
    if (finished) { setScene(0); setElapsed(0); setPlaying(true); if (voice) playNarration(0); return; }
    if (playing) audioRef.current?.pause();
    else if (voice) playNarration(scene);
    setPlaying(value => !value);
  };

  const toggleVoice = () => {
    if (voice) audioRef.current?.pause();
    else if (playing) { setElapsed(0); playNarration(scene); }
    setVoice(value => !value);
  };

  const narrationEnded = () => {
    if (!voice || !playing) return;
    if (finished) { setElapsed(sceneDuration); setPlaying(false); return; }
    setElapsed(0);
    setScene(index => Math.min(index + 1, scenes.length - 1));
  };

  return <section className="curriculum-video-lesson" aria-label={labels.pilot}>
    <audio ref={audioRef} preload="auto" onError={() => setAudioError(true)} onEnded={narrationEnded} onTimeUpdate={event => { const audio = event.currentTarget; if (voice && Number.isFinite(audio.duration) && audio.duration > 0) setElapsed(audio.currentTime / audio.duration * sceneDuration); }}/>
    <header><div><span>{labels.pilot}</span><strong>{comparisonLesson ? (locale === 'ru' ? 'Сравнение чисел до 100' : '100-ге дейінгі сандарды салыстыру') : (locale === 'ru' ? 'Разряды: десятки и единицы' : 'Разрядтар: ондықтар мен бірліктер')}</strong></div><small>{labels.duration}</small></header>
    <div className={`curriculum-video-stage lesson-${lesson} scene-${scene}`}>
      <div className="curriculum-video-copy"><span>{current.eyebrow}</span><h2>{current.title}</h2><p>{current.text}</p></div>
      <div className="curriculum-video-visual">
        {comparisonLesson && <ComparisonVisual scene={scene} labels={labels} onComplete={onComplete}/>}
        {!comparisonLesson && <>
        {scene === 0 && <div className="curriculum-video-orbit"><b>10</b><b>1</b><b>46</b></div>}
        {scene === 1 && <Bundles tens={1} ones={0}/>}
        {scene === 2 && <><div className="curriculum-big-number">46</div><Bundles tens={4} ones={6}/><div className="curriculum-equation">46 = 40 + 6</div></>}
        {scene === 3 && <div className="curriculum-place-table"><span>{labels.number}</span><span>{labels.tens}</span><span>{labels.ones}</span><strong>72</strong><b>7</b><b>2</b></div>}
        {scene === 4 && <div className="curriculum-video-summary"><b>10</b><span>+</span><i>1</i><strong>✓</strong><button onClick={onComplete}>{labels.exercises} →</button></div>}
        </>}
      </div>
      <FalconMascot celebrating={finished}/>
      <div className="curriculum-video-caption"><b>СҰҢҚАР</b><span>{current.text}</span></div>
    </div>
    <footer>
      <button className="curriculum-video-play" onClick={togglePlay}><i>{playing ? 'Ⅱ' : finished ? '↻' : '▶'}</i>{playing ? labels.pause : finished ? labels.replay : scene > 0 ? labels.resume : labels.play}</button>
      <button className={`curriculum-video-voice${voice ? ' on' : ''}${audioError ? ' error' : ''}`} onClick={toggleVoice} aria-pressed={voice}>◖)) {audioError ? labels.voiceError : voice ? labels.voiceOn : labels.voiceOff}</button>
      <div className="curriculum-video-progress"><i style={{ width: `${totalProgress}%` }}/></div>
      <span>{scene + 1}/{scenes.length}</span>
    </footer>
  </section>;
}
