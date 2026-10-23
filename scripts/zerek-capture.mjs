// Run only through cua_repl, passing the authorized Zerek tab. No network/API access.
import fs from 'node:fs/promises';
const base=new URL('../problems/sources/zerek/',import.meta.url);
let active=null;
export async function readCatalog(){return JSON.parse(await fs.readFile(new URL('catalog.json',base),'utf8'));}
async function extract(tab){return tab.playwright.locator('div.card').evaluate(card=>{
  const text=n=>{if(n.nodeType===3)return n.textContent;if(n.nodeType!==1)return '';if(n.classList.contains('katex'))return '$'+(n.querySelector('annotation')?.textContent||n.textContent)+'$';if(n.tagName==='SVG')return '[SVG diagram]';if(n.tagName==='IMG')return '[Image: '+(n.alt||'diagram')+']';const t=[...n.childNodes].map(text).join('');return /^(P|DIV|TR|H[1-6])$/.test(n.tagName)?t+'\n':t;};
  const st=card.querySelector('.prose-math');return {statement:text(st||card).trim(),statementHtml:st?.innerHTML||null,options:[...card.querySelectorAll('label')].map(l=>({label:l.querySelector('.font-semibold')?.textContent||'',text:text(l.querySelector('span:last-child')||l).trim(),html:(l.querySelector('span:last-child')||l).innerHTML})),taskId:card.querySelector('input')?.name||null,images:[...card.querySelectorAll('img')].map(e=>({src:e.getAttribute('src'),alt:e.alt})),svg:[...card.querySelectorAll('svg')].map(e=>e.outerHTML)};
});}
export async function captureNext(tab,budgetMs=38000){
  const started=Date.now();const catalog=await readCatalog();const c=catalog.collections.find(x=>x.status!=='captured'&&x.status!=='unavailable');
  if(!c)return {complete:true,collections:catalog.collections.length};
  const id=c.path.split('/').pop();const file=new URL('collections/'+id+'.json',base);const partial=new URL('collections/'+id+'.partial.json',base);
  let data=null;try{data=JSON.parse(await fs.readFile(partial,'utf8'));}catch{}
  try{
    if(active!==id){
      await tab.goto('https://zerek.app'+c.path);
      await tab.playwright.getByRole('heading',{level:1}).or(tab.playwright.getByRole('button',{name:'Келесі →',exact:true})).first().waitFor({state:'visible',timeoutMs:15000});
      let ax=await tab.getAXState({emit:false,disableDiffing:true});let running=/text \d+\s*\/\s*\d+/.test(ax);
      const title=running?(c.title||c.card.split('\n').filter(Boolean)[2]):await tab.playwright.getByRole('heading',{level:1}).innerText();
      const count=Number(ax.match(/text (\d+) сұрақ/)?.[1]||ax.match(/text \d+\s*\/\s*(\d+)/)?.[1]);
      if(!count){c.status='unavailable';c.notice=ax.split('\n').filter(l=>/text |heading /.test(l)&&!/(Nurislam|Aldabergenuly)/.test(l)).join('\n');await fs.writeFile(new URL('catalog.json',base),JSON.stringify(catalog,null,2)+'\n');return {id,title,status:c.status};}
      if(!running){const btns=await tab.playwright.getByRole('button').allTextContents();const start=btns.find(t=>/Бастау|Жалғастыру/.test(t));if(!start)throw Error('No start/resume button');await tab.playwright.getByRole('button',{name:start,exact:true}).click();ax=await tab.getAXState({emit:false,disableDiffing:true});}
      data ||= {url:'https://zerek.app'+c.path,school:c.school,title,count,questions:[]};
      const next=data.questions.length+1;let current=Number(ax.match(/text (\d+)\s*\/\s*\d+/)?.[1]);if(current!==next){await tab.playwright.getByRole('button',{name:String(next),exact:true}).click();await tab.getAXState({emit:false});}active=id;
    }
    while(data.questions.length<data.count){
      const n=data.questions.length+1;const state=await tab.getAXState({emit:false,disableDiffing:true});const actual=Number(state.match(/text (\d+)\s*\/\s*\d+/)?.[1]);
      if(actual!==n)throw Error('Question navigation mismatch '+n+'/'+actual);
      data.questions.push({number:n,...await extract(tab)});
      await fs.writeFile(partial,JSON.stringify(data,null,2)+'\n');
      if(n<data.count){await tab.playwright.getByRole('button',{name:'Келесі →',exact:true}).click();await tab.getAXState({emit:false});}
      if(Date.now()-started>budgetMs)break;
    }
    c.questionCount=data.count;c.capturedQuestions=data.questions.length;c.title=data.title;
    if(data.questions.length===data.count){await fs.rename(partial,file);c.status='captured';delete c.notice;active=null;}else c.status='capturing';
  }catch(e){c.status='capture_error';c.notice=String(e).slice(0,250);active=null;}
  await fs.writeFile(new URL('catalog.json',base),JSON.stringify(catalog,null,2)+'\n');
  return {id,title:c.title,status:c.status,captured:c.capturedQuestions,total:c.questionCount,notice:c.notice};
}
