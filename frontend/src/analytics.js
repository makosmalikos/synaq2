// ── Статистика по ребёнку ──
// Считается из реальных данных: attempts (тема, верно/неверно, секунды) и mocks.

const LEVEL = (pct) => (pct >= 70 ? 'strong' : pct >= 50 ? 'mid' : 'weak');

// Освоение по темам: сколько решено, сколько верно, уровень.
export function topicStats(attempts, topicList) {
  const by = {};
  for (const a of attempts) {
    const k = a.topic || '—';
    by[k] = by[k] || { tried: 0, ok: 0, secs: 0, days: new Set() };
    by[k].tried++;
    if (a.correct) by[k].ok++;
    by[k].secs += a.secs || 0;
    const d = a.at?.seconds ? new Date(a.at.seconds * 1000).toDateString() : null;
    if (d) by[k].days.add(d);
  }
  return topicList
    .map((t) => {
      const s = by[t.id];
      if (!s || !s.tried) return null;
      const pct = Math.round((s.ok / s.tried) * 100);
      return {
        id: t.id, name: t.name, block: t.block,
        tried: s.tried, pct, level: LEVEL(pct), days: s.days.size,
      };
    })
    .filter(Boolean);
}

// Общая готовность: средний процент по темам, где были попытки.
export function readiness(stats) {
  if (!stats.length) return 0;
  return Math.round(stats.reduce((s, t) => s + t.pct, 0) / stats.length);
}

// Часы занятий по дням текущей недели (Дс…Жс).
export function weekHours(attempts) {
  const DAYS = ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб'];
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const out = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жс'].map((d) => ({ day: d, hours: 0 }));
  for (const a of attempts) {
    if (!a.at?.seconds) continue;
    const t = new Date(a.at.seconds * 1000);
    if (t < monday) continue;
    const idx = (t.getDay() + 6) % 7;          // Дс = 0
    out[idx].hours += (a.secs || 0) / 3600;
  }
  return out.map((d) => ({ ...d, hours: Math.round(d.hours * 10) / 10 }));
}

// Баллы мок-тестов по неделям (для графика роста).
export function mockSeries(mocks) {
  return [...mocks]
    .filter((m) => m.at?.seconds)
    .sort((a, b) => a.at.seconds - b.at.seconds)
    .slice(-6)
    .map((m, i) => ({
      label: `${i + 1}-ап`,
      score: m.score || 0,
      max: m.gradable || 0,
      school: m.school || '',
    }));
}
