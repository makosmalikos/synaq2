import React, { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from './i18n.jsx';
import { installController } from './pwa.js';
import './PwaInstall.css';

export default function PwaInstall({ card = false, className = '', role }) {
  const { lang } = useLang(), ru = lang === 'ru';
  const state = useSyncExternalStore(installController.subscribe, installController.getSnapshot, installController.getSnapshot);
  const [help, setHelp] = useState(false), [busy, setBusy] = useState(false);
  const dialog = useRef(null), trigger = useRef(null), titleId = useId();
  useEffect(() => {
    if (!help || state.installed || (card && state.dismissed) || !dialog.current) return;
    const node = dialog.current;
    node.showModal();
    return () => { node.close(); trigger.current?.focus(); };
  }, [help, state.installed, state.dismissed, card]);
  if (state.installed || (card && state.dismissed)) return null;
  const close = () => { setHelp(false); };
  const install = async () => {
    setBusy(true);
    try { if (await installController.install() === 'help') setHelp(true); }
    finally { setBusy(false); }
  };
  const button = <button ref={trigger} type="button" role={role} className={`pwa-install-button ${className}`} disabled={busy} onClick={install} aria-haspopup={state.available ? undefined : 'dialog'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4" /></svg><span>{ru ? 'На главный экран' : 'Басты экранға қосу'}</span></button>;
  return <>{card ? <aside className="pwa-install-card" aria-label={ru ? 'Установка Synaq' : 'Synaq орнату'}><img src="/pwa/icon-192.png" alt="" width="44" height="44" /><div><strong>{ru ? 'Synaq всегда под рукой' : 'Synaq әрдайым жаныңызда'}</strong><p>{ru ? 'Открывайте кабинет с главного экрана телефона.' : 'Кабинетті телефонның басты экранынан ашыңыз.'}</p></div>{button}<button className="pwa-dismiss" type="button" onClick={installController.dismiss} aria-label={ru ? 'Скрыть предложение на 7 дней' : 'Ұсынысты 7 күнге жасыру'}>×</button></aside> : button}
    {help && createPortal(<dialog ref={dialog} className="pwa-dialog" aria-labelledby={titleId} onKeyDown={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()} onCancel={close} onClick={event => { if (event.target === dialog.current) close(); }}><div className="pwa-dialog-head"><img src="/pwa/icon-192.png" alt="" width="56" height="56" /><button type="button" className="pwa-dismiss" onClick={close} aria-label={ru ? 'Закрыть' : 'Жабу'} autoFocus>×</button></div><h2 id={titleId}>{ru ? 'Synaq на главном экране' : 'Synaq басты экранда'}</h2>
      {state.embedded && <p>{ru ? 'Сначала откройте сайт в Safari или Chrome через меню этого приложения.' : 'Алдымен осы қолданбаның мәзірінен сайтты Safari не Chrome браузерінде ашыңыз.'}</p>}
      {state.ios ? <ol><li>{ru ? 'Откройте synaq.app в Safari.' : 'synaq.app сайтын Safari браузерінде ашыңыз.'}</li><li>{ru ? 'Нажмите «Поделиться» в меню страницы или на панели браузера.' : 'Бет мәзіріндегі не браузер панеліндегі «Бөлісу» түймесін басыңыз.'}</li><li>{ru ? 'Выберите «На экран Домой», затем «Добавить». Если есть переключатель «Открывать как веб-приложение», оставьте его включённым.' : '«Басты экранға қосу», содан кейін «Қосу» тармағын таңдаңыз. «Веб-қолданба ретінде ашу» қосқышы болса, оны қосулы қалдырыңыз.'}</li></ol> : <><p>{ru ? 'Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран». На компьютере также может быть значок установки в адресной строке.' : 'Браузер мәзірінен «Қолданбаны орнату» немесе «Басты экранға қосу» тармағын таңдаңыз. Компьютерде орнату белгішесі мекенжай жолағында да болуы мүмкін.'}</p><p>{ru ? 'Если такого пункта нет, откройте сайт в Chrome или Edge; на Mac в Safari — «Файл → Добавить в Dock». Уже установленное приложение можно открыть по его значку.' : 'Мұндай тармақ болмаса, сайтты Chrome немесе Edge арқылы ашыңыз; Mac-та Safari мәзірінен «File → Add to Dock» таңдаңыз. Орнатылған қолданбаны белгішесі арқылы ашуға болады.'}</p></>}
      <p className="pwa-dialog-note">{ru ? 'Для заданий, расписания и сохранения результатов нужен интернет.' : 'Тапсырмалар, кесте және нәтижелерді сақтау үшін интернет қажет.'}</p><button className="pwa-dialog-done" type="button" onClick={close}>{ru ? 'Понятно' : 'Түсінікті'}</button></dialog>, document.body)}
  </>;
}
