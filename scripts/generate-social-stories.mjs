import fs from 'node:fs';
import path from 'node:path';
const W=1080,H=1920,out=path.resolve('output/social-stories-v2'); fs.mkdirSync(out,{recursive:true});
const imageData=name=>{const file=path.join(out,name);if(!fs.existsSync(file))throw new Error(`Missing platform screenshot: ${file}`);return `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`};
const diagnostic=imageData('platform-diagnostic-setup.png'),test=imageData('platform-full-test.png');
const C={navy:'#07162F',blue:'#1769E8',cyan:'#20B9E8',pale:'#EEF5FF',white:'#FFF',muted:'#61758A',line:'#D9E6F4'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const rect=(x,y,w,h,fill,rx=0,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const line=(x1,y1,x2,y2,stroke=C.line,width=2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"/>`;
const text=(x,y,s,size=40,weight=500,fill=C.navy,anchor='start')=>`<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;
const multi=(x,y,rows,size=40,leading=1.12,weight=700,fill=C.navy,anchor='start')=>rows.map((s,i)=>text(x,y+i*size*leading,s,size,weight,fill,anchor)).join('');
const defs=`<defs><pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse"><path d="M72 0H0V72" fill="none" stroke="#1769E8" stroke-opacity=".065"/></pattern><filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#07162F" flood-opacity=".18"/></filter><clipPath id="screenA"><rect width="920" height="720" rx="28"/></clipPath><clipPath id="screenB"><rect width="880" height="610" rx="26"/></clipPath><clipPath id="screenC"><rect width="760" height="510" rx="24"/></clipPath></defs>`;
const header=(dark=false)=>`${text(70,88,'SYNAQ',30,800,dark?C.white:C.navy)}${line(70,120,1010,120,dark?'#FFFFFF55':C.line)}`;
const shell=(body,{dark=false,bg=dark?C.blue:C.white}={})=>`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${rect(0,0,W,H,bg)}${rect(0,0,W,H,'url(#grid)')}${header(dark)}${body}</svg>`;
const screen=({href,x,y,w=920,h=720,rotate=0,clip='screenA',pos='xMidYMid slice'})=>`<g transform="translate(${x} ${y}) rotate(${rotate} ${w/2} ${h/2})" filter="url(#shadow)">${rect(0,0,w,h,C.white,30,'stroke="#D9E6F4" stroke-width="2"')}<image href="${href}" width="${w}" height="${h}" preserveAspectRatio="${pos}" clip-path="url(#${clip})"/></g>`;
const chip=(x,y,w,label,active=false)=>`${rect(x,y,w,64,active?C.blue:C.white,18,active?'':'stroke="#D9E6F4" stroke-width="2"')}${text(x+w/2,y+42,label,25,700,active?C.white:C.blue,'middle')}`;
const stories=[];

stories.push(shell(`${multi(70,275,['Подготовка,','которая ведёт к цели'],76,1.06,800,C.blue)}${text(70,475,'Для школы и вступительных экзаменов.',30,400,C.muted)}
${rect(0,620,1080,150,C.pale)}${text(70,710,'{1}',48,700,C.cyan)}${text(205,685,'4–6 классы',31,800,C.blue)}${text(205,730,'Укрепить базу и закрыть пробелы',25,400,C.muted)}
${rect(0,790,1080,150,'#F7FAFF')}${text(70,880,'{2}',48,700,C.cyan)}${text(205,855,'БИЛ · НИШ · РФМШ',31,800,C.blue)}${text(205,900,'Готовиться в формате выбранной школы',25,400,C.muted)}
${rect(0,960,1080,150,C.pale)}${text(70,1050,'{3}',48,700,C.cyan)}${text(205,1025,'Понятный прогресс',31,800,C.blue)}${text(205,1070,'Видеть результат по каждой теме',25,400,C.muted)}
${screen({href:test,x:210,y:1260,w:760,h:510,rotate:-5,clip:'screenC'})}`));

stories.push(shell(`${multi(540,285,['Сначала —','диагностика'],76,1.05,800,C.white,'middle')}${multi(540,475,['Выберите класс и цель подготовки.','SYNAQ соберёт стартовый вариант.'],30,1.35,400,'#DDF5FF','middle')}${screen({href:diagnostic,x:105,y:720,rotate:-4})}${screen({href:diagnostic,x:-90,y:1390,w:760,h:510,rotate:5,clip:'screenC'})}`,{dark:true}));

stories.push(shell(`${multi(70,275,['Полный формат','вступительных тестов'],68,1.08,800,C.navy)}${text(70,458,'Столько заданий, сколько будет на экзамене.',29,400,C.muted)}${screen({href:test,x:120,y:625,rotate:4})}${chip(70,1450,290,'РФМШ · 30')}${chip(395,1450,290,'БИЛ · 60')}${chip(720,1450,290,'НИШ · 180',true)}`));

stories.push(shell(`${text(540,290,'Задания как на тесте',70,800,C.white,'middle')}${text(540,385,'Без упрощённой демоверсии.',30,400,'#DDF5FF','middle')}${screen({href:test,x:-120,y:620,rotate:-6})}${screen({href:test,x:390,y:1080,w:760,h:510,rotate:6,clip:'screenC'})}${rect(95,1645,890,2,'#FFFFFF55')}${text(95,1715,'Текст · варианты · открытый ответ',27,600,C.white)}`,{dark:true}));

stories.push(shell(`${multi(540,280,['Свой формат','для каждой школы'],72,1.04,800,C.blue,'middle')}${text(540,450,'Разное число заданий и своё время.',29,400,C.muted,'middle')}${screen({href:test,x:95,y:650,w:880,h:610,rotate:-3,clip:'screenB'})}
${rect(70,1370,290,220,C.white,26,'stroke="#D9E6F4" stroke-width="2"')}${text(105,1440,'РФМШ',25,800,C.blue)}${text(105,1530,'30',62,800,C.navy)}${text(208,1530,'заданий',23,600,C.muted)}
${rect(395,1370,290,220,C.white,26,'stroke="#D9E6F4" stroke-width="2"')}${text(430,1440,'БИЛ',25,800,C.blue)}${text(430,1530,'60',62,800,C.navy)}${text(533,1530,'заданий',23,600,C.muted)}
${rect(720,1370,290,220,C.blue,26)}${text(755,1440,'НИШ',25,800,C.white)}${text(755,1530,'180',62,800,C.white)}${text(885,1530,'заданий',23,600,'#CFEAFF')}`));

stories.push(shell(`${text(540,290,'Всё нужное — на экране',68,800,C.white,'middle')}${text(540,390,'Таймер, прогресс и переход между заданиями.',28,400,'#DDF5FF','middle')}${screen({href:test,x:165,y:615,w:880,h:610,rotate:5,clip:'screenB',pos:'xMidYMin slice'})}${screen({href:test,x:-95,y:1170,w:760,h:510,rotate:-6,clip:'screenC'})}${text(755,1520,'Можно вернуться',27,700,C.white)}${text(755,1565,'или пропустить вопрос',27,400,'#DDF5FF')}`,{dark:true}));

stories.push(shell(`${multi(70,275,['Попробуйте','настоящий формат'],76,1.05,800,C.blue)}${text(70,475,'Бесплатный фиксированный вариант для каждой школы.',28,400,C.muted)}${screen({href:diagnostic,x:-80,y:690,w:880,h:610,rotate:-5,clip:'screenB'})}${screen({href:test,x:365,y:1070,w:760,h:510,rotate:6,clip:'screenC'})}${rect(70,1640,940,140,C.blue,28)}${text(120,1695,'synaq.app',25,600,'#CFEAFF')}${text(120,1750,'Начать бесплатно',38,800,C.white)}${text(945,1745,'→',52,500,C.white,'end')}`));

stories.forEach((svg,i)=>fs.writeFileSync(path.join(out,`synaq-story-${String(i+1).padStart(2,'0')}.svg`),svg));
console.log(`Generated ${stories.length} SVG stories in ${out}`);
