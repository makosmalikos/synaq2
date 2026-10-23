// Course test UI capture. No hidden state, private endpoints or browser storage reads.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {visiblePageUrl} from './zerek-course-capture.mjs';
const base=new URL('../problems/sources/zerek/courses/tests/',import.meta.url);
let visibleUrlReader=null;
export function setVisibleUrlReader(reader){visibleUrlReader=reader;}
const observedNavigation=new WeakMap();
async function currentUrl(tab){
 if(visibleUrlReader){
  const url=await visibleUrlReader(tab);
  if(!/^https:\/\/zerek\.app\//.test(url||''))throw Error('Visible browser URL is unavailable');
  return url;
 }
 try{return await visiblePageUrl(tab);}catch(e){
  if(!String(e).includes('unreachable'))throw e;
  return null;
 }
}
async function navigate(tab,url){
 const current=await currentUrl(tab)||observedNavigation.get(tab);
 if(current!==url)await tab.goto(url);
 observedNavigation.set(tab,url);
}
async function observe(tab){
 // WebKit's accessibility tree can fail on deeply nested result fractions.
 // Read the rendered result DOM in that case; never inspect hidden site data.
 if(visibleUrlReader||await tab.playwright.locator('main [id="q1"]').count()){
  await tab.playwright.locator('main').innerText({timeoutMs:5000});
 }else {
  try{await tab.getAXState({emit:false});}catch(e){
   if(!String(e).includes('unreachable'))throw e;
   await tab.playwright.locator('main').innerText({timeoutMs:5000});
  }
 }
}
const titleKey=s=>String(s).replace(/\s+/g,' ').replace(/\s*—\s*тақырыптық тест$/,'').trim();
async function validResultUrl(meta,url){
 if(typeof url!=='string')return false;
 if(url.startsWith(meta.url.replace('/test','/result/')))return true;
 if(!/^https:\/\/zerek\.app\/results\/[0-9a-f-]+$/.test(url))return false;
 let history;try{history=JSON.parse(await fs.readFile(new URL('../test-history-links.json',base),'utf8'));}catch(e){if(e.code==='ENOENT')return false;throw e;}
 return history.links.some(a=>'https://zerek.app'+a.path===url&&titleKey(a.title)===titleKey(meta.title));
}
export async function recoverPendingFromHistory(tab,meta){
 // Ordinary visible account history only; never fetch private APIs or storage.
 await navigate(tab,'https://zerek.app/history');
 await tab.playwright.getByRole('heading',{name:'Менің тарихым',exact:true}).waitFor({state:'visible',timeoutMs:15000});await observe(tab);
 const links=await tab.playwright.locator('main').evaluate(m=>[...m.querySelectorAll('a[href^="/results/"]')].map(a=>({title:a.innerText,path:a.getAttribute('href')})).filter(a=>a.title.includes('тақырыптық тест')));
 await fs.writeFile(new URL('../test-history-links.json',base),JSON.stringify({source:'https://zerek.app/history',links},null,2)+'\n');
 const link=links.find(a=>titleKey(a.title)===titleKey(meta.title)&&/^\/results\/[0-9a-f-]+$/.test(a.path));
 if(!link)return false;
 const url='https://zerek.app'+link.path;await navigate(tab,url);
 await tab.playwright.locator('main [id="q1"]').waitFor({state:'visible',timeoutMs:15000});await observe(tab);
 await captureResults(tab,meta,url);return true;
}
export async function currentTest(tab){
 return tab.playwright.locator('main').evaluate(main=>{
  const text=n=>{
   if(n.nodeType===3)return n.textContent;if(n.nodeType!==1)return'';
   if(n.classList.contains('katex'))return '$'+(n.querySelector('annotation')?.textContent||n.textContent)+'$';
   if(n.tagName==='IMG')return '[Image: '+(n.alt||'diagram')+']';
   if(n.tagName==='SVG')return'[SVG diagram]';
   const s=[...n.childNodes].map(text).join('');return /^(P|DIV|LI|TR|H[1-6])$/.test(n.tagName)?s+'\n':s;
  };
  const p=main.querySelector('.prose-math'),position=main.innerText.match(/(\d+)\s*\/\s*(\d+)/);
  return{number:Number(position?.[1]),expected:Number(position?.[2]),statement:p?text(p).trim():null,statementHtml:p?.innerHTML,
   sourceQuestionId:main.querySelector('input')?.getAttribute('name'),
   options:[...main.querySelectorAll('label')].map(l=>({label:l.querySelector('.font-semibold')?.textContent||'',text:text(l.querySelector('span:last-of-type')).trim(),selected:!!l.querySelector('input')?.checked})),
   images:[...main.querySelectorAll('img')].map(i=>({src:i.getAttribute('src'),alt:i.alt}))};
 });
}
export async function captureConditions(tab,meta){
 await fs.mkdir(base,{recursive:true});
 const data={...meta,level:'test',status:'conditions_only',questions:[]};
 for(let number=1;number<=meta.expected;number++){
  if(number!==1){await tab.playwright.getByRole('button',{name:'Келесі →',exact:true}).click();await observe(tab);}
  let raw=await currentTest(tab);if(raw.number!==number){await observe(tab);raw=await currentTest(tab);}
  if(raw.number!==number||!raw.statement)throw Error('Unexpected course test position');
  const id=crypto.createHash('sha256').update(JSON.stringify([raw.statement,raw.options.map(o=>o.text).sort(),raw.images.map(i=>i.src)])).digest('hex').slice(0,16);
  data.questions.push({...raw,id});
  await fs.writeFile(new URL(meta.course+'-'+meta.topic+'.json',base),JSON.stringify(data,null,2)+'\n');
 }
 return{questions:data.questions.length,status:data.status};
}
export async function captureResults(tab,meta,resultUrl){
 const saved=JSON.parse(await fs.readFile(new URL(meta.course+'-'+meta.topic+'.json',base),'utf8'));
 if(!await validResultUrl(meta,resultUrl))throw Error('Result URL does not match the visible test or its observed history record');
 saved.resultUrl=resultUrl;saved.status='submitted_for_keys';
 await fs.writeFile(new URL(meta.course+'-'+meta.topic+'.json',base),JSON.stringify(saved,null,2)+'\n');
 const results=await tab.playwright.locator('main').evaluate(main=>{
  const text=n=>{if(!n)return'';if(n.nodeType===3)return n.textContent;if(n.nodeType!==1)return'';
   if(n.classList.contains('katex'))return '$'+(n.querySelector('annotation')?.textContent||n.textContent)+'$';
   if(n.tagName==='IMG')return '[Image: '+(n.alt||'diagram')+']';
   const s=[...n.childNodes].map(text).join('');return /^(P|DIV|LI|TR|H[1-6])$/.test(n.tagName)?s+'\n':s;};
  return [...main.querySelectorAll('[id^="q"]')].filter(q=>/^q\d+$/.test(q.id)).map(q=>{
   const p=q.querySelector(':scope > .prose-math'),s=q.querySelector('details .prose-math');
   const options=[...q.querySelectorAll(':scope > .space-y-2 > div')].map(d=>({text:text(d.querySelector('.flex-1')).trim(),correct:d.classList.contains('border-emerald-500')}));
   const correct=options.find(o=>o.correct)?.text||q.querySelector('div.border-emerald-500 b')?.textContent;
   return{number:Number(q.id.slice(1)),statement:text(p).trim(),solution:text(s).trim(),solutionHtml:s?.innerHTML,options,sourceAnswer:correct,feedback:q.firstElementChild?.innerText,checked:true};
  });
 });
 if(results.length!==meta.expected||results.some(r=>!r.sourceAnswer||!r.solution))throw Error('Incomplete visible course test keys');
 const data={...meta,level:'test',status:'captured',resultUrl,questions:results.map(r=>{
  const original=saved.questions.find(q=>q.number===r.number);
  if(original.statement!==r.statement)throw Error('Course test result does not match captured condition '+r.number);
  return{...original,...r};
 })};
 await fs.writeFile(new URL(meta.course+'-'+meta.topic+'-leveltest.json',new URL('../',base)),JSON.stringify(data,null,2)+'\n');
 observedNavigation.set(tab,resultUrl);
 return{status:data.status,questions:data.questions.length};
}
export async function runVisibleTests(tab,budgetMs=45000){
 const root=new URL('../',base),start=Date.now(),completed=[];
 for(const name of (await fs.readdir(root)).filter(n=>/^[456]-math-\d+-\d+-catalog\.json$/.test(n)).sort()){
  const catalog=JSON.parse(await fs.readFile(new URL(name,root),'utf8'));
  const link=catalog.links.find(a=>/^\/courses\/[456]-math\/\d+-\d+\/test$/.test(a.path||''));
  if(!link)continue;
  const parts=link.path.split('/'),course=parts[2],topic=parts[3];
  const file=new URL(course+'-'+topic+'-leveltest.json',root);
  try{if(JSON.parse(await fs.readFile(file,'utf8')).status==='captured'){completed.push(link.path);continue;}}catch(e){if(e.code!=='ENOENT')throw e;}
  if(Date.now()-start>budgetMs-20000)return{status:'pending',completed};
  let saved;try{saved=JSON.parse(await fs.readFile(new URL(course+'-'+topic+'.json',base),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
  let meta={course,topic,grade:Number(course[0]),title:catalog.meta.title,url:'https://zerek.app'+link.path};
  if(saved?.status==='submission_pending'&&!saved.resultUrl){
   meta.expected=saved.expected;
   const url=await currentUrl(tab);
   if(await validResultUrl(meta,url)){
    await captureResults(tab,meta,url);completed.push(link.path);continue;
   }
   if(await recoverPendingFromHistory(tab,meta)){completed.push(link.path);continue;}
   return{status:'source_submission_pending',completed,current:meta.url};
  }
  if(saved?.resultUrl){
   if(!await validResultUrl(meta,saved.resultUrl))throw Error('Unexpected saved result URL');
   await navigate(tab,saved.resultUrl);await tab.playwright.locator('main [id="q1"]').waitFor({state:'visible',timeoutMs:15000});await observe(tab);meta.expected=saved.expected;
  }else{
   await navigate(tab,meta.url);await tab.playwright.getByRole('button',{name:/Жаттығу режимі/}).waitFor({state:'visible',timeoutMs:15000});await observe(tab);
   const intro=await tab.playwright.locator('main').innerText();meta.expected=Number(intro.match(/(\d+)\s*сұрақ/)?.[1]);if(!meta.expected)throw Error('Missing visible test question count');
   await tab.playwright.getByRole('button',{name:/Жаттығу режимі/}).click();await observe(tab);
   await captureConditions(tab,meta);
   await tab.playwright.locator('main button.btn').filter({hasText:'Аяқтау'}).click();await observe(tab);
   await tab.playwright.getByRole('heading',{name:'Сіз барлық сұраққа жауап бермедіңіз',exact:true}).waitFor({state:'visible',timeoutMs:5000});
   const pendingFile=new URL(course+'-'+topic+'.json',base);
   const pending=JSON.parse(await fs.readFile(pendingFile,'utf8'));pending.status='submission_pending';
   await fs.writeFile(pendingFile,JSON.stringify(pending,null,2)+'\n');
   observedNavigation.delete(tab);
   await tab.playwright.getByRole('button',{name:'Аяқтау',exact:true}).last().click();await observe(tab);
   try{await tab.playwright.locator('main [id="q1"]').waitFor({state:'visible',timeoutMs:15000});}catch{return{status:'source_submission_pending',completed,current:meta.url};}
   await observe(tab);
  }
  const resultUrl=await currentUrl(tab);
  if(!resultUrl){
   meta.expected=saved?.expected||meta.expected;
   if(await recoverPendingFromHistory(tab,meta)){completed.push(link.path);continue;}
   return{status:'source_submission_pending',completed,current:meta.url};
  }
  await captureResults(tab,meta,resultUrl);completed.push(link.path);
 }
 return{status:'all_currently_visible_tests_captured',completed};
}
