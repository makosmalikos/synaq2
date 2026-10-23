// UI-only source review. User explicitly authorized empty attempts in all collections.
import fs from 'node:fs/promises';
const base=new URL('../problems/sources/zerek/',import.meta.url);
export async function saveCurrentResult(tab,collectionId){
 const catalog=JSON.parse(await fs.readFile(new URL('catalog.json',base),'utf8'));
 const c=catalog.collections.find(x=>x.path.endsWith(collectionId));if(!c)throw Error('Unknown collection');
 await tab.playwright.locator('div.card[id]').first().waitFor({state:'visible',timeoutMs:15000});
 const ax=await tab.getAXState({emit:false,disableDiffing:true});
 const resultUrl=ax.match(/URL: "(https:\/\/zerek.app\/results\/[^"#]+)"/)?.[1];
 if(!resultUrl)throw Error('Not a results page');
 const title=await tab.playwright.getByRole('heading',{level:1}).innerText();
 const questions=await tab.playwright.locator('div.card[id]').evaluateAll(cards=>cards.map(card=>{
  const text=n=>{if(!n)return '';if(n.nodeType===3)return n.textContent;if(n.nodeType!==1)return '';if(n.classList.contains('katex'))return '$'+(n.querySelector('annotation')?.textContent||n.textContent)+'$';if(n.tagName==='SVG')return '[SVG diagram]';if(n.tagName==='IMG')return '[Image: '+(n.alt||'diagram')+']';const t=[...n.childNodes].map(text).join('');return /^(P|DIV|TR|H[1-6]|LI)$/.test(n.tagName)?t+'\n':t;};
  const statement=[...card.children].find(e=>e.classList.contains('prose-math'));
  const solution=card.querySelector('details .prose-math');
  const choices=[...card.children].find(e=>e.classList.contains('space-y-2'));
  const options=choices?[...choices.children].map(e=>({label:e.querySelector('.font-semibold')?.textContent||'',text:text(e.querySelector('.flex-1')||e).trim(),correct:e.textContent.includes('✓ Дұрыс жауап')})):[];
  const answerNode=[...card.children].find(e=>e!==statement&&!e.matches('details')&&/Дұрыс жауап/.test(e.textContent)&&!e.classList.contains('space-y-2'));
  return {number:Number(card.id.slice(1)),statement:text(statement).trim(),options,sourceAnswer:options.find(o=>o.correct)?.text||null,openAnswerText:answerNode?text(answerNode).trim():null,solution:text(solution).trim(),images:[...card.querySelectorAll('img')].map(e=>({src:e.getAttribute('src'),alt:e.alt})),svg:[...card.querySelectorAll('svg')].map(e=>e.outerHTML)};
 }));
 if(!questions.length||questions.some((q,i)=>q.number!==i+1))throw Error('Incomplete result capture');
 const file=new URL('collections/'+collectionId+'.json',base);
 let previous={};try{previous=JSON.parse(await fs.readFile(file,'utf8'));}catch{}
 if(previous.count&&previous.count!==questions.length)throw Error('Result count differs from question capture');
 for(const q of questions){const old=previous.questions?.find(x=>x.number===q.number);if(old?.taskId)q.taskId=old.taskId;}
 const data={url:'https://zerek.app'+c.path,school:c.school,title,count:questions.length,sourceReviewCaptured:true,questions};
 await fs.writeFile(file,JSON.stringify(data,null,2)+'\n');
 c.status='captured';c.sourceReviewCaptured=true;c.questionCount=questions.length;c.title=title;delete c.notice;
 await fs.writeFile(new URL('catalog.json',base),JSON.stringify(catalog,null,2)+'\n');
 return {title,count:questions.length,solutions:questions.filter(q=>q.solution).length,keys:questions.filter(q=>q.sourceAnswer||q.openAnswerText).length};
}
export async function captureNextResult(tab){
 const catalog=JSON.parse(await fs.readFile(new URL('catalog.json',base),'utf8'));
 const c=catalog.collections.find(x=>!x.sourceReviewCaptured&&x.reviewStatus!=='unavailable');if(!c)return {complete:true};
 const id=c.path.split('/').pop();
 try{
  await tab.goto('https://zerek.app'+c.path);
  await tab.playwright.getByRole('heading',{level:1}).or(tab.playwright.getByRole('button',{name:'Аяқтау',exact:true})).first().waitFor({state:'visible',timeoutMs:15000});
  let ax=await tab.getAXState({emit:false,disableDiffing:true});
  // Prefer an existing results link, if the UI offers one, to avoid repeat attempts.
  const existing=await tab.playwright.getByRole('link').evaluateAll(es=>es.map(e=>e.getAttribute('href')).filter(h=>h?.startsWith('/results/')));
  if(existing.length){await tab.goto('https://zerek.app'+existing[0]);return await saveCurrentResult(tab,id);}
  if(!/text \d+\s*\/\s*\d+/.test(ax)){
   const btns=await tab.playwright.getByRole('button').allTextContents();const start=btns.find(t=>/Бастау|Жалғастыру/.test(t));
   if(!start){c.reviewStatus='unavailable';c.reviewNotice=ax.split('\n').filter(l=>/text |heading /.test(l)&&!/(Nurislam|Aldabergenuly)/.test(l)).join('\n');await fs.writeFile(new URL('catalog.json',base),JSON.stringify(catalog,null,2)+'\n');return {id,status:'unavailable',notice:c.reviewNotice};}
   await tab.playwright.getByRole('button',{name:start,exact:true}).click();await tab.getAXState({emit:false});
  }
  await tab.playwright.getByRole('button',{name:'Аяқтау',exact:true}).first().click();
  const confirmation=await tab.getAXState({emit:false,disableDiffing:true});
  if(confirmation.includes('Сіз барлық сұраққа жауап бермедіңіз')){await tab.playwright.getByRole('button',{name:'Аяқтау',exact:true}).last().click();await tab.getAXState({emit:false});}
  return await saveCurrentResult(tab,id);
 }catch(e){c.reviewStatus='error';c.reviewNotice=String(e).slice(0,250);await fs.writeFile(new URL('catalog.json',base),JSON.stringify(catalog,null,2)+'\n');return {id,status:'error',notice:c.reviewNotice};}
}
