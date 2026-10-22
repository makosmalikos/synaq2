import React from 'react';
import { useCurriculumProgress } from './useCurriculumProgress.js';
import { HOME_ATTEMPT_LIMIT } from './homeModel.js';

export default function HomeCourseProgress({ uid, grade, plan, lang, attempts, historyStatus, onOpen }) {
  const ru = lang === 'ru';
  const selectedGrade = [3, 4, 5, 6].includes(Number(grade)) ? Number(grade) : 3;
  const progress = useCurriculumProgress(uid, selectedGrade, plan, { attempts: attempts || [], historyStatus, historyLimit: HOME_ATTEMPT_LIMIT });
  const title = progress.nextTopic?.title[lang] || progress.nextTopic?.title.ru;
  const current = progress.topics.find(item => item.topic.key === progress.nextTopic?.key);
  const localOnly = progress.syncStatus === 'local';
  const loading = progress.syncStatus === 'loading';
  return <section className="sh-course" aria-labelledby="student-course">
    <div className="sh-course-art" aria-hidden="true"><span>÷</span><b>+</b><i>×</i></div>
    <div className="sh-course-copy"><span className="sh-eyebrow">{ru ? `МАТЕМАТИКА · ${selectedGrade} КЛАСС` : `МАТЕМАТИКА · ${selectedGrade} СЫНЫП`}</span>
      <h2 id="student-course">{loading ? (ru ? 'Твои уроки' : 'Сенің сабақтарың') : title || (ru ? 'Доступные темы пройдены!' : 'Қолжетімді тақырыптар аяқталды!')}</h2>
      <p>{loading ? (ru ? 'Загружаем место, где ты остановился…' : 'Тоқтаған жерің жүктелуде…') : progress.nextKind === 'practice' ? (ru ? 'Теория изучена. Теперь закрепим её задачами.' : 'Теория оқылды. Енді есептермен бекітейік.') : current?.theoryStarted ? (ru ? 'Продолжи чтение с сохранённого шага.' : 'Сақталған қадамнан оқуды жалғастыр.') : (ru ? 'Короткое объяснение, примеры и практика в своём темпе.' : 'Қысқаша түсіндірме, мысалдар және өз қарқыныңмен жаттығу.')}</p>
      <div className="sh-course-meta"><span>{ru ? 'Изучено тем:' : 'Оқылған тақырып:'} <b>{loading ? '—' : progress.studiedCount}</b></span><span>{ru ? 'Закреплено практикой:' : 'Жаттығумен бекітілген:'} <b>{progress.historyStatus === 'ready' ? progress.masteredCount : '—'}</b></span></div>
      {(localOnly || progress.theoryError) && <p className="sh-course-sync" role="status">{progress.theoryError ? (ru ? 'Не удалось сохранить чтение на устройстве.' : 'Оқу барысы құрылғыда сақталмады.') : (ru ? 'Чтение сохранено на этом устройстве. Синхронизация пока недоступна.' : 'Оқу барысы осы құрылғыда сақталды. Синхрондау әзірге қолжетімсіз.')} <button type="button" onClick={progress.retry}>{ru ? 'Повторить' : 'Қайталау'}</button></p>}
    </div>
    <button type="button" className="sh-course-button" onClick={() => onOpen(loading ? null : progress.nextTopic?.key)}>{ru ? 'Открыть урок' : 'Сабақты ашу'} <span aria-hidden="true">↗</span></button>
  </section>;
}
