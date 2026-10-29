import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const flags = new Set(process.argv.slice(2));
const outputFlags = [...flags].filter(flag => flag.startsWith('--output='));
const outputDir = outputFlags[0]?.slice('--output='.length) || 'output/scenario-run';
if (outputFlags.length > 1 || !/^output\/[a-z0-9-]+$/.test(outputDir)) throw Error('Output must be a named directory under output/');
const out = path.join(root, outputDir);
const manifest = JSON.parse(await fs.readFile(path.join(root, 'tests/scenarios/platform-cases.json'), 'utf8'));
if ([...flags].some(flag => !['--emulators', '--render-only', '--list'].includes(flag) && !flag.startsWith('--output='))) throw Error('Unknown scenario runner argument');
if (flags.has('--list')) {
  for (const c of manifest.cases) console.log(`${c.id} [${c.level}] ${c.title}`);
  process.exit(0);
}
await fs.mkdir(out, { recursive: true });
const integration = flags.has('--emulators');
if (integration && !flags.has('--render-only')) {
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:19099' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:18080') {
    throw Error('Scenario integrations require local Auth 127.0.0.1:19099 and Firestore 127.0.0.1:18080. Use test:scenarios:emulators.');
  }
}
const ids = new Set();
for (const c of manifest.cases) {
  if (ids.has(c.id) || !c.steps.length || !c.expected || !['client', 'integration', 'browser'].includes(c.level)) throw Error(`Invalid scenario: ${c.id}`);
  ids.add(c.id);
  if (c.level !== 'browser' && !c.evidence.length) throw Error(`Missing scenario evidence: ${c.id}`);
  for (const e of c.evidence) {
    if (!e.file.startsWith('tests/') || e.file.includes('..')) throw Error(`Unsafe test path: ${e.file}`);
    await fs.access(path.join(root, e.file));
  }
}

let automatic;
if (flags.has('--render-only')) automatic = JSON.parse(await fs.readFile(path.join(out, 'automatic-results.json'), 'utf8'));
else {
  const selected = manifest.cases.filter(c => c.level === 'client' || (integration && c.level === 'integration'));
  const files = [...new Set([...selected.flatMap(c => c.evidence.map(e => e.file)), 'tests/mock-result-date.test.cjs'])];
  console.log(`Running ${selected.length} scenarios via ${files.length} test files; emulator mode: ${integration}.`);
  const startedAt = new Date().toISOString(), tests = [], failures = [], events = [];
  let summary;
  for await (const { type, data } of run({ files: files.map(file => path.join(root, file)), concurrency: 1 })) {
    if (type === 'test:pass' || type === 'test:fail') {
      const item = { name: data.name, file: data.file ? path.relative(root, data.file) : null,
        status: type === 'test:fail' ? 'failed' : data.skip ? 'skipped' : data.todo ? 'todo' : 'passed',
        durationMs: data.details?.duration_ms,
        error: data.details?.error ? String(data.details.error.cause?.stack || data.details.error.stack || data.details.error.message) : undefined };
      tests.push(item);
      if (item.status === 'failed') { failures.push(item); console.log(`FAIL ${item.file}: ${item.name}`); }
      events.push({ type, ...item });
    } else if (type === 'test:summary') { summary = data; events.push({ type, ...data }); }
    else if (type === 'test:stderr' || type === 'test:stdout') events.push({ type, file: data.file, message: data.message });
  }
  const cases = manifest.cases.filter(c => c.level !== 'browser').map(c => {
    if (c.level === 'integration' && !integration) return { id: c.id, status: 'not_run', reason: 'Emulator mode was not requested.' };
    const checks = c.evidence.map(e => tests.find(t => t.file === e.file && t.name === e.name));
    return { id: c.id, status: checks.some(t => !t) ? 'missing_evidence' : checks.some(t => t.status !== 'passed') ? 'failed' : 'passed',
      checks: checks.map((t, index) => t || { ...c.evidence[index], status: 'missing_evidence' }) };
  });
  automatic = { startedAt, completedAt: new Date().toISOString(), integration, cases, tests, failures, summary };
  await fs.writeFile(path.join(out, 'automatic-results.json'), JSON.stringify(automatic, null, 2) + '\n');
  await fs.writeFile(path.join(out, 'events.ndjson'), events.map(e => JSON.stringify(e)).join('\n') + '\n');
}
let manual = { cases: [] };
try { manual = JSON.parse(await fs.readFile(path.join(out, 'browser-results.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
// A new automated run must not inherit green browser results from an older run.
const currentManual = Date.parse(manual.completedAt) >= Date.parse(automatic.startedAt) ? manual : { cases: [] };
const resultFor = c => (c.level === 'browser' ? currentManual.cases : automatic.cases).find(r => r.id === c.id) || { status: 'not_run' };
const totals = {};
for (const c of manifest.cases) { const status = resultFor(c).status; totals[status] = (totals[status] || 0) + 1; }
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const levelLabels = { client: 'Логика клиента · управляемые сбои', integration: 'Локальный API + Firebase', browser: 'Браузер · ручной прогон' };
const rows = manifest.cases.map(c => {
  const result = resultFor(c);
  const proof = (result.screenshots || []).map(file => `<a href="${escape(file)}">${escape(file)}</a>`).join(' · ');
  return `<article data-area="${escape(c.area)}" data-status="${escape(result.status)}"><details><summary><code>${escape(c.id)}</code><strong>${escape(c.title)}</strong><span class="badge ${escape(result.status)}">${escape(result.status)}</span></summary><div class="body"><p class="level">${escape(c.area)} · ${levelLabels[c.level]} · ${c.priority}</p><p><b>Условия:</b> ${escape(c.preconditions)}</p><ol>${c.steps.map(s => `<li>${escape(s)}</li>`).join('')}</ol><p><b>Ожидается:</b> ${escape(c.expected)}</p>${result.actual ? `<p><b>Фактически:</b> ${escape(result.actual)}</p>` : ''}${proof ? `<p>${proof}</p>` : ''}${c.evidence.map(e => `<small>${escape(e.file)}<br>${escape(e.name)}</small>`).join('')}${(result.checks || []).filter(t => t.status !== 'passed').map(t => `<pre>${escape(t.error || t.status)}</pre>`).join('')}</div></details></article>`;
}).join('');
let findings = [];
try { findings = JSON.parse(await fs.readFile(path.join(out, 'findings.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const findingsHtml = `<h2>Найдено и исправлено</h2>${findings.map(f => `<article><div class="body"><h3>${escape(f.id)} · ${escape(f.type)}</h3><p>${escape(f.problem)}</p><p><b>Исправление:</b> ${escape(f.fix)}</p><p><b>Проверка:</b> ${escape(f.verification)}</p><p>${f.evidence.map(file => `<a href="${escape(file)}">${escape(file)}</a>`).join(' · ')}</p></div></article>`).join('')}<p>Повторный запуск без уже работающих эмуляторов: <code>npm run test:scenarios:emulators</code>. Клиентские проверки: <code>npm run test:scenarios</code>. Старый ручной протокол не переносится в новый прогон автоматически.</p>`;
const counts = automatic.summary?.counts || {};
let validation = null, performance = null;
for (const filename of ['validation.json', 'concurrency-metrics.json']) {
  try {
    const value = JSON.parse(await fs.readFile(path.join(out, filename), 'utf8'));
    if (filename === 'validation.json') validation = value; else performance = value;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const validationHtml = validation ? `<h2>Полная проверка проекта</h2><p><code>${escape(validation.fullCheck.command)}</code>: ${validation.fullCheck.passed} passed, ${validation.fullCheck.failed} failed, ${validation.fullCheck.skipped} skipped; production-сборка — ${escape(validation.fullCheck.build)}. <a href="${escape(validation.fullCheck.log)}">Полный журнал</a></p><ul>${validation.limits.map(item => `<li>${escape(item)}</li>`).join('')}</ul>` : '';
const performanceHtml = performance ? `<h2>Задержки локального API</h2><p>${escape(performance.environment)}. p95 — время, за которое завершились 95% запросов. Одинаковые записи намеренно сталкиваются в транзакциях.</p><div style="overflow-x:auto"><table><thead><tr><th>Сценарий</th><th>Запросов</th><th>p50, мс</th><th>p95, мс</th><th>HTTP</th></tr></thead><tbody>${performance.metrics.map(m => `<tr><td>${escape(m.name)}</td><td>${m.requests}</td><td>${m.p50Ms}</td><td>${m.p95Ms}</td><td>${escape(JSON.stringify(m.statuses))}</td></tr>`).join('')}</tbody></table></div><p><a href="concurrency-metrics.json">Исходные измерения</a></p>` : '';
const page = `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SYNAQ · Test cases</title><style>*{box-sizing:border-box}body{margin:0;background:#f3f7ff;color:#193047;font:15px/1.6 system-ui,sans-serif}main{max-width:1120px;margin:auto;padding:30px 20px}header{background:#2447dc;border-radius:24px;color:#fff;padding:30px}h1{line-height:1.2;font-size:32px}a{color:#2447dc}.stats{display:flex;flex-wrap:wrap;gap:12px;margin:20px 0}.stats div{background:#fff;border:1px solid #dce5f1;border-radius:16px;padding:16px;flex:1;min-width:150px}.stats b{font-size:28px;display:block}.filters{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}input,select,button{font:inherit;padding:10px 12px;border:1px solid #cfdbed;border-radius:10px;background:#fff;color:inherit}input{flex:1;min-width:180px}article{background:#fff;border:1px solid #dce5f1;border-radius:14px;margin:9px 0}summary{display:flex;align-items:center;gap:14px;padding:16px;cursor:pointer}summary strong{flex:1}.body{padding:0 20px 20px}small{display:block;background:#f4f6fb;border-radius:8px;padding:10px;margin-top:8px;overflow-wrap:anywhere}.level{color:#61758d}.badge{font-size:12px;padding:4px 9px;border-radius:7px;background:#edf0f5}.passed{background:#e5f5eb;color:#187650}.failed,.missing_evidence{background:#fbe9ed;color:#a62d41}pre{white-space:pre-wrap;overflow-wrap:anywhere}[hidden]{display:none!important}@media(max-width:600px){summary{flex-wrap:wrap;gap:8px}summary strong{flex-basis:75%}h1{font-size:26px}}</style><main><header><p>SYNAQ · сценарный прогон</p><h1>${manifest.cases.length} test cases</h1><p>${escape(manifest.scope)}</p></header><div class="stats"><div><b>${totals.passed || 0}</b>сценариев passed</div><div><b>${(totals.failed || 0) + (totals.missing_evidence || 0)}</b>ошибок сценариев</div><div><b>${totals.not_run || 0}</b>не выполнены</div><div><b>${counts.passed ?? '—'} / ${counts.tests ?? '—'}</b>отдельных автоматизированных тестов</div></div><p>Запуск: ${escape(automatic.startedAt)}. Пропущено тестов: ${counts.skipped ?? '—'}. Ошибок в тестовых файлах: ${automatic.failures.length}. Число сценариев и число тестов считаются отдельно. Браузерные результаты не выводятся из автоматизированных проверок.</p><p><a href="automatic-results.json">Результаты автоматики</a> · <a href="browser-results.json">Браузерный протокол</a> · <a href="../../tests/scenarios/platform-cases.json">Полные test cases</a> · <a href="events.ndjson">Журнал</a></p>${findingsHtml}${validationHtml}${performanceHtml}<div class="filters"><input id="search" aria-label="Поиск сценария" placeholder="ID, раздел или сценарий"><select id="status" aria-label="Статус"><option value="">Все статусы</option>passed</option>failed</option>missing_evidence</option>not_run</option></select><button id="expand">Раскрыть все</button></div>${rows}<h2>Границы прогона</h2><p>Реальные списания, production-аккаунты, видеозвонок и внешняя AI-модель не используются. Платёжные сценарии проверяют обработчики на подставленных ответах. Интеграции создают тестовые данные только в локальных эмуляторах.</p></main><script>const search=document.querySelector('#search'),status=document.querySelector('#status');function filter(){for(const row of document.querySelectorAll('article[data-area]'))row.hidden=!(row.textContent.toLowerCase().includes(search.value.toLowerCase())&&(!status.value||row.dataset.status===status.value));}search.addEventListener('input',filter);status.addEventListener('change',filter);document.querySelector('#expand').onclick=()=>{const visible=[...document.querySelectorAll('article:not([hidden]) details')],open=visible.some(d=>!d.open);for(const d of visible)d.open=open;};</script></html>`;
await fs.writeFile(path.join(out, 'report.html'), page);
await fs.writeFile(path.join(out, 'summary.json'), JSON.stringify({ totals, automaticTests: counts, automaticCompletedAt: automatic.completedAt, browserCompletedAt: currentManual.completedAt || null }, null, 2) + '\n');
console.log(`Cases: ${totals.passed || 0} passed; ${(totals.failed || 0) + (totals.missing_evidence || 0)} failed; ${totals.not_run || 0} not run. Report: ${outputDir}/report.html`);
if (automatic.failures.length || (totals.failed || 0) + (totals.missing_evidence || 0)) process.exitCode = 1;
