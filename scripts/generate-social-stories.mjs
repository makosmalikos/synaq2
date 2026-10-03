import fs from 'node:fs';
import path from 'node:path';

const W = 1080;
const H = 1920;
const source = path.resolve('marketing/social-stories/screens');
const out = path.resolve('output/social-stories-final');
fs.mkdirSync(out, { recursive: true });

const C = {
  navy: '#07162F', blue: '#1769E8', cyan: '#20B9E8', white: '#FFFFFF',
  pale: '#EEF5FF', muted: '#60758A', line: '#D9E6F4', light: '#DDF5FF',
};
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const rect = (x,y,w,h,fill,rx=0,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const line = (x1,y1,x2,y2,color=C.line,width=2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
const text = (x,y,value,size=40,weight=500,fill=C.navy,anchor='start') => `<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(value)}</text>`;
const rows = (x,y,items,size,leading=1.08,weight=800,fill=C.navy,anchor='start') => items.map((item,index)=>text(x,y+index*size*leading,item,size,weight,fill,anchor)).join('');
const image = name => {
  const file = path.join(source,name);
  if (!fs.existsSync(file)) throw new Error(`Missing source screenshot: ${file}`);
  return `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
};
const defs = `<defs>
  <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse"><path d="M72 0H0V72" fill="none" stroke="#1769E8" stroke-opacity=".06"/></pattern>
  <filter id="shadow" x="-30%" y="-40%" width="160%" height="190%"><feDropShadow dx="0" dy="24" stdDeviation="26" flood-color="#07162F" flood-opacity=".18"/></filter>
  <clipPath id="screenClip"><rect width="1060" height="700" rx="22"/></clipPath>
</defs>`;
const base = (content,dark=false) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${rect(0,0,W,H,dark?C.blue:C.white)}${rect(0,0,W,H,'url(#grid)')}${text(70,88,'SYNAQ',30,800,dark?C.white:C.navy)}${line(70,120,1010,120,dark?'#FFFFFF66':C.line)}${content}</svg>`;
const screenshot = (name,{x=70,y=690,w=1060,h=700,angle=0,position='xMidYMid slice'}={}) => `<g transform="translate(${x} ${y}) rotate(${angle} ${w/2} ${h/2})" filter="url(#shadow)">${rect(0,0,w,h,C.white,22,'stroke="#D9E6F4" stroke-width="2"')}<image href="${image(name)}" width="${w}" height="${h}" preserveAspectRatio="${position}" clip-path="url(#screenClip)"/></g>`;
const labels = (values,dark=false) => values.map((value,index)=>`${rect(70+index*325,1510,290,76,dark?'#FFFFFF22':C.pale,16)}${text(215+index*325,1559,value,26,700,dark?C.white:C.blue,'middle')}`).join('');

const stories = [
  base(`${rows(70,285,['Подготовка к','поступлению'],84,1.02,800,C.blue)}${text(70,505,'РФМШ, БИЛ и НИШ — в одном месте.',30,400,C.muted)}${screenshot('00-landing.png',{x:-60,y:755,w:1060,h:700,angle:-5})}${labels(['РФМШ','БИЛ','НИШ'])}`),

  base(`${text(540,315,'Выберите школу',76,800,C.white,'middle')}${text(540,415,'Сразу видно число заданий и время.',30,400,C.light,'middle')}${screenshot('01-school-selection.png',{x:95,y:680,w:1060,h:700,angle:5})}${text(85,1590,'Бесплатный вариант без регистрации',29,600,C.white)}`,true),

  base(`${text(70,285,'РФМШ',92,800,C.blue)}${text(70,380,'30 заданий · 120 минут',34,600,C.navy)}${text(70,435,'Формат вступительного теста.',28,400,C.muted)}${screenshot('02-rfmsh-question.png',{x:90,y:660,w:1060,h:700,angle:-4})}${line(70,1540,1010,1540,C.line,2)}${text(70,1610,'Задания с рисунками и открытым ответом',30,600,C.navy)}`),

  base(`${text(540,315,'НИШ',92,800,C.white,'middle')}${text(540,405,'180 заданий · 240 минут',33,600,C.light,'middle')}${screenshot('04-nis-question.png',{x:-110,y:665,w:1060,h:700,angle:5})}${text(75,1575,'Математика, языки, естественные науки',28,600,C.white)}`,true),

  base(`${rows(70,285,['Результат','сразу после теста'],76,1.03,800,C.blue)}${text(70,480,'Общий балл и уровень подготовки.',30,400,C.muted)}${screenshot('05-result-summary.png',{x:70,y:690,w:1060,h:700,angle:-4})}${text(70,1560,'Без ожидания и ручной проверки',29,600,C.navy)}`),

  base(`${rows(70,280,['Прогресс','по каждой теме'],76,1.04,800,C.white)}${text(70,490,'Понятно, что повторять дальше.',30,400,C.light)}${screenshot('06-topic-report.png',{x:-50,y:695,w:1060,h:700,angle:4})}${text(75,1560,'Сильные стороны · темы для повторения',27,600,C.white)}`,true),

  base(`${text(70,285,'Разбор ошибок',74,800,C.blue)}${text(70,390,'Ваш ответ и верный — рядом.',30,400,C.muted)}${screenshot('07-error-review.png',{x:70,y:635,w:1060,h:700,angle:-5})}${line(70,1560,1010,1560,C.line)}${text(70,1630,'Видно, что стоит повторить',30,600,C.navy)}`),

  base(`${rows(70,285,['Попробуйте','свой вариант'],78,1.04,800,C.white)}${text(70,485,'РФМШ · БИЛ · НИШ',32,600,C.light)}${screenshot('08-landing-cta.png',{x:10,y:745,w:1060,h:420,angle:-3})}${text(70,1310,'Три школы. Один первый шаг.',30,600,C.white)}${rect(70,1440,940,160,C.white,28)}${text(120,1504,'Бесплатно · без регистрации',26,600,C.blue)}${text(120,1567,'Открыть тест →',42,800,C.navy)}${text(70,1720,'synaq.app/diagnostic',32,600,C.white)}`,true),
];

stories.forEach((svg,index) => fs.writeFileSync(path.join(out,`synaq-story-${String(index+1).padStart(2,'0')}.svg`),svg));
console.log(`Generated ${stories.length} distinct SVG stories in ${out}`);
