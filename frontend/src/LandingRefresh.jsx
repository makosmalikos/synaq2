import React from 'react';
import { useLang } from './i18n.jsx';
import './LandingRefresh.css';

const schools = [['bil', 'БИЛ'], ['nis', 'НИШ'], ['rfmsh', 'РФМШ']];

function StudentRibbon({ ru }) {
  const [paused, setPaused] = React.useState(false);
  const descriptions = ru
    ? ['Ученица с тетрадью', 'Ученик с рюкзаком', 'Ученик SYNAQ', 'Ученик с планшетом', 'Ученица с рюкзаком']
    : ['Дәптер ұстаған оқушы қыз', 'Рюкзак ұстаған оқушы бала', 'SYNAQ оқушысы', 'Планшет ұстаған оқушы бала', 'Рюкзак ұстаған оқушы қыз'];
  return <div className="sx-student-ribbon" data-paused={paused}>
    <div id="sx-student-rail" className="sx-student-rail" role="region" aria-label={ru ? 'Фотографии учеников' : 'Оқушылар суреттері'} tabIndex={0}>
      {[0, 1].map(copy => <div className="sx-student-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
        {[1, 2, 3, 4, 5].map((id, index) => <div className={`sx-student-tile sx-student-tile-${id}`} key={id}>
          <div className="sx-student-backdrop" aria-hidden="true" />
          <img src={`/landing/mobile/student-${id}-600.webp`} srcSet={`/landing/mobile/student-${id}-360.webp 360w, /landing/mobile/student-${id}-600.webp 600w`} sizes="(max-width: 760px) 310px, 250px" width="600" height="900" decoding="async" loading="eager" fetchpriority={copy === 0 && index < 2 ? 'high' : 'auto'} alt={copy === 0 ? descriptions[index] : ''} draggable="false" />
        </div>)}
      </div>)}
    </div>
    <div className="sx-ribbon-footer">
      <span>{ru ? 'Учиться. Идти вперёд.' : 'Үйрен. Алға ұмтыл.'}</span>
      <div className="sx-ribbon-controls">
        <button type="button" aria-controls="sx-student-rail" aria-label={ru ? (paused ? 'Продолжить прокрутку фотографий' : 'Приостановить прокрутку фотографий') : (paused ? 'Суреттерді айналдыруды жалғастыру' : 'Суреттерді айналдыруды тоқтату')} onClick={() => setPaused(value => !value)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">{paused ? <path d="M5 3 15 9 5 15Z" /> : <><rect x="4" y="3" width="3" height="12" rx="1" /><rect x="11" y="3" width="3" height="12" rx="1" /></>}</svg>
        </button>
      </div>
    </div>
  </div>;
}

export function LandingHero({ onFreeDiagnostic }) {
  const { lang } = useLang();
  const ru = lang === 'ru';
  return <>
    <section className="sx-hero sx-hero-ribbon" aria-labelledby="sx-hero-title">
      <StudentRibbon ru={ru} />
      <div className="sx-hero-copy">
        <h1 id="sx-hero-title">{ru ? <>Подготовка к <span className="sx-school-names">БИЛ, НИШ и РФМШ</span><br /> — понятная ребёнку</> : <><span className="sx-school-names">БИЛ, НИШ, РФМШ</span>-ке дайындық<br /> — балаға түсінікті жолмен</>}</h1>
        <p className="sx-hero-intro">{ru ? 'Математика и логика для 3–6 классов. Практика, ИИ-помощник и поддержка наставника.' : '3–6 сыныптарға арналған математика мен логика. Жаттығу, ЖИ-көмекші және тәлімгердің қолдауы.'}</p>
        <div className="sx-hero-actions sx-hero-actions-single"><button type="button" className="sx-primary" onClick={onFreeDiagnostic}>{ru ? 'Узнать уровень ребёнка' : 'Баланың деңгейін анықтау'} <span aria-hidden="true">↗</span></button></div>
        <p className="sx-hero-note">{ru ? '10 заданий · около 7 минут · бесплатно' : '10 тапсырма · шамамен 7 минут · тегін'}</p>
        <div className="sx-schools sx-schools-featured">
          <span>{ru ? 'Готовимся к поступлению в' : 'Оқуға түсуге дайындық'}</span>
          <div role="list" aria-label={ru ? 'Школы подготовки' : 'Дайындық мектептері'}>
            {schools.map(([id, label]) => <div className="sx-school-card" role="listitem" key={id}>
              <img src={`/landing/mobile/school-${id}.webp`} alt="" width="72" height="72" decoding="async" />
              <strong>{label}</strong>
            </div>)}
          </div>
        </div>
      </div>
    </section>
  </>;
}

export function LandingFamilyBenefits() {
  const { lang } = useLang();
  const ru = lang === 'ru';
  const items = ru ? [
    ['Диагностика', 'Понятно, с чего начать', 'Результат по темам помогает увидеть сильные стороны ребёнка и выбрать, что повторить на этой неделе.'],
    ['Объяснения', 'Ошибка — повод разобраться', 'После ответа можно посмотреть решение. ИИ-помощник помогает разобрать непонятный шаг.'],
    ['Прогресс', 'Подготовка на виду', 'В кабинете родителя собраны результаты, время занятий и темы, которым нужно уделить внимание.'],
  ] : [
    ['Диагностика', 'Неден бастау керегі түсінікті', 'Тақырыптар бойынша нәтиже баланың мықты тұстарын көрсетіп, осы аптада нені қайталау керегін таңдауға көмектеседі.'],
    ['Түсіндіру', 'Қате арқылы үйрену', 'Жауап бергеннен кейін шешімін көруге болады. ЖИ-көмекші түсініксіз қадамды талдауға көмектеседі.'],
    ['Прогресс', 'Дайындық барысы көрінеді', 'Ата-ана кабинетінде нәтижелер, сабаққа кеткен уақыт және көңіл бөлу керек тақырыптар жиналған.'],
  ];
  return <section className="sx-review-examples" aria-labelledby="sx-family-title">
    <div className="sx-review-heading"><div><span className="sx-eyebrow">{ru ? 'РОДИТЕЛЯМ' : 'АТА-АНАЛАРҒА'}</span><h2 id="sx-family-title">{ru ? <>Ребёнок учится.<br /><span>Вы видите результат.</span></> : <>Бала үйренеді.<br /><span>Сіз нәтижені көресіз.</span></>}</h2></div><p>{ru ? 'Всё, чтобы поддержать ребёнка на каждом этапе подготовки.' : 'Дайындықтың әр кезеңінде балаға қолдау көрсету үшін.'}</p></div>
    <div className="sx-review-grid">{items.map(([topic, title, text]) => <article key={topic}><div className="sx-review-card-meta"><span>{topic}</span></div><h3>{title}</h3><p className="sx-family-description">{text}</p></article>)}</div>
  </section>;
}

export function LandingBenefits() {
  const { lang } = useLang();
  const ru = lang === 'ru';
  const items = [
    ['compass', ru ? 'Диагностика' : 'Диагностика', ru ? 'Своя точка старта' : 'Өз бастау нүктең', ru ? 'Узнайте сильные стороны ребёнка и темы, которые стоит повторить.' : 'Баланың мықты тұстарын және қайталайтын тақырыптарын біліңіз.'],
    ['puzzle', ru ? 'Практика и ИИ' : 'Жаттығу және ЖИ', ru ? 'Сложное становится понятным' : 'Қиын есеп те түсінікті', ru ? 'Решаем, разбираем ошибки и учимся шаг за шагом с ИИ-помощником.' : 'ЖИ-көмекшімен есеп шығарып, қателерді талдап, қадамдап үйренеміз.'],
    ['rewards', ru ? 'Дуэли и награды' : 'Дуэльдер мен марапаттар', ru ? 'Хочется идти дальше' : 'Алға ұмтылуға себеп бар', ru ? 'Дуэли с друзьями, XP и коины превращают практику в увлекательный вызов.' : 'Достармен дуэль, XP және коиндар жаттығуды қызықты сайысқа айналдырады.'],
  ];
  return <section className="sx-benefits sx-benefits-vivid" aria-labelledby="sx-benefits-title">
    <div className="sx-section-intro">
      <span className="sx-eyebrow">{ru ? 'ПОДГОТОВКА С СИСТЕМОЙ' : 'ЖҮЙЕЛІ ДАЙЫНДЫҚ'}</span>
      <h2 id="sx-benefits-title">{ru ? <>Меньше «не понимаю».<br /><span>Больше «я могу».</span></> : <>«Түсінбедім» азаяды.<br /><span>«Қолымнан келеді» көбейеді.</span></>}</h2>
    </div>
    <div className="sx-benefit-grid">
      {items.map(([art, label, title, body]) => <article className={`sx-benefit-${art}`} key={art}>
        <span className="sx-benefit-label">{label}</span>
        <div className="sx-benefit-visual" aria-hidden="true">
          <img src={`/landing/benefits-3d/${art}-560.webp`} srcSet={`/landing/benefits-3d/${art}-280.webp 280w, /landing/benefits-3d/${art}-560.webp 560w`} sizes="(max-width: 760px) 118px, 260px" width="560" height="560" alt="" loading="lazy" decoding="async" draggable="false" />
        </div>
        <div className="sx-benefit-copy"><h3>{title}</h3><p>{body}</p></div>
      </article>)}
    </div>
  </section>;
}

export function LandingMentor() {
  const { lang } = useLang();
  const ru = lang === 'ru';
  return <section className="sx-mentor" aria-labelledby="sx-mentor-title"><div className="sx-mentor-art"><img src="/landing/mobile/reward-star-400.webp" decoding="async" alt="" width="500" height="500" loading="lazy" /><div className="sx-mentor-sticker"><b>40 {ru ? 'минут' : 'минут'}</b><span>{ru ? 'один на один с наставником' : 'тәлімгермен жеке сабақ'}</span></div></div><div className="sx-mentor-copy"><span className="sx-eyebrow">{ru ? 'PRO С НАСТАВНИКОМ' : 'ТӘЛІМГЕРМЕН PRO'}</span><h2 id="sx-mentor-title">{ru ? <>Когда нужна<br /><span>поддержка человека.</span></> : <>Жаныңда<br /><span>қолдау көрсететін адам.</span></>}</h2><p>{ru ? 'Для тем, в которых хочется разобраться вместе. Индивидуальные онлайн-уроки дополняют самостоятельную практику в SYNAQ.' : 'Бірге талдағың келетін тақырыптарға арналған. Жеке онлайн-сабақтар SYNAQ-тағы өздік дайындықты толықтырады.'}</p><ul><li>{ru ? 'Выбираете наставника и доступное время' : 'Тәлімгер мен бос уақытты таңдайсыз'}</li><li>{ru ? 'Разбираете сложные задачи на живом уроке' : 'Күрделі есептерді тікелей сабақта талдайсыз'}</li><li>{ru ? 'Родитель видит расписание и прогресс' : 'Ата-ана кесте мен прогресті көреді'}</li></ul><a className="sx-text-link" href="#pricing">{ru ? 'Выбрать формат подготовки' : 'Дайындық форматын таңдау'} <span aria-hidden="true">↗</span></a></div></section>;
}

export function LandingFAQ() {
  const { lang } = useLang();
  const ru = lang === 'ru';
  const items = ru ? [
    ['С чего начать подготовку?', 'Пройдите бесплатную диагностику: 10 заданий по математике примерно за 7 минут. Вы увидите результат по темам и план практики на неделю. Регистрация для диагностики не нужна.'],
    ['Чем диагностика отличается от пробника?', 'Диагностика помогает найти темы для повторения. Пробный тест — более длинная тренировка с таймером в формате выбранной школы. Это тренировочные варианты SYNAQ.'],
    ['Что входит в бесплатный доступ?', 'Базовые темы и до 5 задач в день. Бесплатные диагностика и пробные тесты доступны отдельно на этой странице.'],
    ['ИИ-помощник заменяет преподавателя?', 'ИИ помогает разобрать задачу и понять ход решения. В Pro с наставником к самостоятельной подготовке добавляются индивидуальные онлайн-уроки с человеком.'],
    ['Как проходят занятия с наставником?', 'Вы выбираете наставника и доступное время. Урок длится 40 минут. В тарифе можно выбрать 2 или 3 занятия в неделю; ссылка на занятие и расписание доступны в кабинете.'],
    ['Можно ли отменить занятие?', 'Занятие можно отменить до его начала. Если отменить не позднее чем за 24 часа, оно вернётся в пакет. При более поздней отмене занятие списывается.'],
    ['SYNAQ гарантирует поступление?', 'Результат зависит от подготовки ребёнка, экзамена и конкурса. SYNAQ помогает регулярно практиковаться и видеть прогресс; процент в диагностике показывает результат выполненных заданий, а не вероятность поступления.'],
  ] : [
    ['Дайындықты неден бастаймыз?', 'Тегін диагностикадан өтіңіз: математикадан 10 тапсырмаға шамамен 7 минут кетеді. Тақырыптар бойынша нәтиже мен бір апталық жоспар аласыз. Диагностика үшін тіркелу қажет емес.'],
    ['Диагностика мен сынақ тестінің айырмасы қандай?', 'Диагностика қай тақырыптарды қайталау керегін көрсетеді. Сынақ тесті — таңдалған мектеп форматына сай, таймермен өтетін ұзақ жаттығу. Бұл SYNAQ дайындаған жаттығу нұсқалары.'],
    ['Тегін қолжетімділікке не кіреді?', 'Негізгі тақырыптар және күніне 5 есепке дейін. Тегін диагностика мен сынақ тесттері осы бетте бөлек қолжетімді.'],
    ['ЖИ-көмекші мұғалімді алмастыра ма?', 'ЖИ есепті талдап, шешу жолын түсінуге көмектеседі. Тәлімгермен Pro тарифінде өздік дайындыққа жеке онлайн-сабақтар қосылады.'],
    ['Тәлімгермен сабақ қалай өтеді?', 'Тәлімгер мен бос уақытты таңдайсыз. Сабақ 40 минутқа созылады. Аптасына 2 немесе 3 сабақ нұсқасын таңдауға болады; сілтеме мен кесте кабинетте қолжетімді.'],
    ['Сабақтан бас тартуға бола ма?', 'Сабақ басталғанға дейін бас тартуға болады. Кемінде 24 сағат бұрын бас тартсаңыз, сабақ пакетке қайтарылады. Одан кеш бас тартқанда сабақ есептен шығарылады.'],
    ['SYNAQ оқуға түсуге кепілдік бере ме?', 'Нәтиже баланың дайындығына, емтихан мен конкурсқа байланысты. SYNAQ тұрақты дайындалып, прогресті бақылауға көмектеседі; диагностика пайызы — орындалған тапсырмалардың нәтижесі, оқуға түсу ықтималдығы емес.'],
  ];
  return <section id="faq" className="sx-faq" aria-labelledby="sx-faq-title"><div><span className="sx-eyebrow">{ru ? 'ЕСТЬ ВОПРОСЫ?' : 'СҰРАҚТАР БАР МА?'}</span><h2 id="sx-faq-title">{ru ? 'Давайте разберёмся.' : 'Бірге анықтайық.'}</h2><p>{ru ? 'Самое важное о подготовке и занятиях.' : 'Дайындық пен сабақтар туралы ең маңыздысы.'}</p></div><div className="sx-faq-list">{items.map(([q,a]) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>;
}
