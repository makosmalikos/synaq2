// UI-only capture for the authorized transfer account. Pass a cua_repl tab.
// Reads rendered conditions/solutions; never reads hidden state or calls site APIs.
// Run one UI driver at a time: the browser's native input surface is shared.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const base = new URL('../problems/sources/zerek/courses/', import.meta.url);
const hash = text => crypto.createHash('sha256').update(text).digest('hex').slice(0,16);
const identity = q => JSON.stringify([q.statement,(q.options||[]).map(o=>o.text).sort(),(q.images||[]).map(i=>i.src)]);
export const displayedSourceKey = feedback => feedback?.match(/Дұрыс жауап:\s*([^\n]+)/)?.[1]?.trim();
let visibleUrlReader=null;
const unavailableAccessibility=new WeakSet();
export function setVisibleUrlReader(reader){visibleUrlReader=reader;}
export async function observePage(tab){
  if(visibleUrlReader){
    await tab.playwright.locator('main').innerText({timeoutMs:5000});return;
  }
  if(!unavailableAccessibility.has(tab)){
    try{await tab.getAXState({emit:false});return;}catch(e){
      if(!String(e).includes('unreachable'))throw e;
      unavailableAccessibility.add(tab);
    }
  }
  // Rendered DOM remains readable when WebKit AX fails on nested fractions.
  await tab.playwright.locator('main').innerText({timeoutMs:5000});
}
export async function visiblePageUrl(tab){
  if(visibleUrlReader){
    const url=await visibleUrlReader(tab);
    if(!/^https:\/\/zerek\.app\//.test(url||''))throw Error('Visible browser URL is unavailable');
    return url;
  }
  const state=await tab.getAXState({emit:false});
  const url=state.match(/^Browser tab:.*? URL: "([^"]+)"/m)?.[1];
  if(!url)throw Error('Visible browser URL is unavailable');
  return url;
}

async function snapshot(file,data){
  const temporary=new URL(file.href+'.tmp');
  await fs.writeFile(temporary,JSON.stringify(data,null,2)+'\n');
  await fs.rename(temporary,file);
}
async function reveal(tab,locator){
  for(let attempt=0;attempt<12;attempt++){
    const b=await locator.evaluate(e=>{const r=e.getBoundingClientRect(),d=e.ownerDocument.documentElement;return{top:r.top,bottom:r.bottom,width:d.clientWidth,height:d.clientHeight};});
    if(b.top>=75&&b.bottom<=b.height-10)return;
    const delta=b.top<75?75-b.top:b.bottom-b.height+10;
    await tab.scroll([Math.round(b.width*.88),Math.round(b.height*.8)],b.top<75?'up':'down',Math.ceil(delta/b.height)+1);
    await observePage(tab);
  }
  throw Error('Control did not settle inside the viewport; no click attempted');
}
async function click(tab,locator){
  await reveal(tab,locator);
  // Keyboard activation avoids a late diagram moving the pointer target.
  await locator.press('Enter');
}
async function navigate(tab,url){
  const currentUrl=await visiblePageUrl(tab);
  if(currentUrl!==url){await tab.goto(url);await observePage(tab);}
}
async function resumableMeta(tab,data){
  if(data?.status!=='capturing')return null;
  const url=await visiblePageUrl(tab);
  const hasForm=await tab.playwright.locator('main').evaluate(m=>!!m.querySelector('form .prose-math'));
  return url===data.url&&hasForm?data:null;
}
async function submitAnswer(tab,expected,answer){
  for(let attempt=0;attempt<3;attempt++){
    const raw=await current(tab);
    if(replayIdentity(raw)!==replayIdentity(expected))throw Error('Condition changed before input transaction');
    if(raw.checked)break;
    let intended;
    if(raw.options.length){
      const index=answer?raw.options.findIndex(o=>o.text===answer):0;
      if(answer&&index<0)throw Error('Archived answer is absent from the displayed choices');
      intended=raw.options[Math.max(index,0)].text;
      const choice=tab.playwright.locator('main form label').nth(Math.max(index,0));await reveal(tab,choice);
      try{await choice.click();}catch(e){
        await observePage(tab);
        const settled=await current(tab);
        if(replayIdentity(settled)!==replayIdentity(expected)||attempt===2||!/Click did not change checked state|No node found at given location/.test(String(e)))throw e;
        continue; // A late-loading diagram moved the radio: observe and reveal again.
      }
    }else{intended=answer||'1';const input=tab.playwright.getByPlaceholder('Жауап',{exact:true});await reveal(tab,input);await input.fill(intended);}
    await observePage(tab);
    const filled=await current(tab);
    if(replayIdentity(filled)!==replayIdentity(expected))throw Error('Condition changed while filling answer');
    const retained=raw.options.length?filled.options.some(o=>o.text===intended&&o.selected):filled.submitted===intended;
    if(retained)break;
    if(attempt===2)throw Error('Visible answer field did not retain the intended value; nothing submitted');
  }
  await checkVisibleAnswer(tab,expected);
}
async function checkVisibleAnswer(tab,expected){
  for(let attempt=0;attempt<3;attempt++){
    const before=await current(tab);
    if(replayIdentity(before)!==replayIdentity(expected))throw Error('Condition changed before answer check');
    if(before.checked&&await tab.playwright.getByRole('button',{name:'Келесі есеп →',exact:true}).isVisible())return;
    const check=tab.playwright.getByRole('button',{name:'Тексеру',exact:true});
    if(await check.isVisible()&&await check.isEnabled()){
      try{await reveal(tab,check);await check.press('Enter');}catch(e){
        await observePage(tab);
        const settled=await current(tab);
        if(replayIdentity(settled)!==replayIdentity(expected)||attempt===2)throw e;
        continue; // The image may have moved the control; re-observe before retry.
      }
    }
    await observePage(tab);
    try{await tab.playwright.getByRole('button',{name:'Келесі есеп →',exact:true}).waitFor({state:'visible',timeoutMs:4000});return;}catch(e){
      await observePage(tab);const after=await current(tab);
      if(replayIdentity(after)!==replayIdentity(expected))throw e;
      if(!await check.isEnabled()){await tab.playwright.getByRole('button',{name:'Келесі есеп →',exact:true}).waitFor({state:'visible',timeoutMs:15000});return;}
      if(attempt===2)throw e;
    }
  }
}
const replayIdentity=q=>JSON.stringify([q.statement,(q.options||[]).map(o=>o.text).sort(),(q.images||[]).map(i=>i.src.replace('https://cbklwwsbmfzendipdpsj.supabase.co/storage/v1/object/public/questions/','/questions/'))]);
export async function verifyCurrentKnown(tab,meta){
  const file=new URL(meta.course+'-'+meta.topic+'-level'+meta.level+'.json',base);
  const saved=JSON.parse(await fs.readFile(file,'utf8'));
  let previous=null;
  for(let i=0;i<5;i++){
    const raw=await current(tab),key=saved.questions.find(q=>replayIdentity(q)===replayIdentity(raw));
    if(key&&previous===replayIdentity(raw))return{raw,key};
    previous=replayIdentity(raw);
    await observePage(tab);
  }
  const raw=await current(tab);await snapshot(new URL('transfer-identity-issue.json',base),{meta,raw});
  throw Error('Current condition, choices and diagram did not stably match an archived source key; no answer submitted');
}

export async function openTopic(tab, topic, level=1) {
  if(!/^\/courses\/[456]-math\/\d+-\d+$/.test(topic.path))throw Error('Unsupported grade/topic');
  await navigate(tab,'https://zerek.app'+topic.path);
  await tab.playwright.getByRole('link',{name:/Негізгі деңгей/}).waitFor({state:'visible',timeoutMs:15000});
  await observePage(tab);
  const visible=await tab.playwright.locator('main').evaluate(el=>({text:el.innerText,links:[...el.querySelectorAll('a')].map(a=>({path:a.getAttribute('href'),text:a.innerText}))}));
  const label={1:'Негізгі деңгей',2:'Орта деңгей',3:'Күрделі деңгей'}[level];
  const link=visible.links.find(a=>a.text.includes(label));
  if(!link) return {status:'locked',level,topic:topic.path,...visible};
  const expected=Number(link.text.match(/(\d+) есеп/)?.[1] || link.text.match(/есеп:\s*\d+\/(\d+)/)?.[1]);
  if(!expected)throw Error('Missing visible question count');
  const [, ,course, unit]=topic.path.split('/');
  const meta={course,topic:unit,grade:Number(course[0]),level,title:topic.title,url:'https://zerek.app'+link.path,expected};
  await fs.mkdir(base,{recursive:true});
  await fs.writeFile(new URL(course+'-'+unit+'-catalog.json',base),JSON.stringify({meta,...visible},null,2)+'\n');
  await navigate(tab,meta.url);
  await tab.playwright.locator('main form .prose-math').first().waitFor({state:'visible',timeoutMs:15000});
  await observePage(tab);
  return meta;
}

export async function current(tab) {
  return tab.playwright.locator('main form').evaluate(form => {
    const text = n => {
      if(n.nodeType === 3) return n.textContent;
      if(n.nodeType !== 1) return '';
      if(n.classList.contains('katex')) return '$'+(n.querySelector('annotation')?.textContent || n.textContent)+'$';
      if(n.tagName === 'IMG') return '[Image: '+(n.alt||'diagram')+']';
      if(n.tagName === 'SVG') return '[SVG diagram]';
      const s = [...n.childNodes].map(text).join('');
      return /^(P|DIV|LI|TR|H[1-6])$/.test(n.tagName) ? s+'\n' : s;
    };
    const prose=[...form.querySelectorAll('.prose-math')];
    return {
      statement:text(prose[0]).trim(), solution:prose[1] ? text(prose[1]).trim() : null,
      statementHtml:prose[0].innerHTML, solutionHtml:prose[1]?.innerHTML || null,
      feedback:form.querySelector('.tr-slide')?.innerText || null,
      submitted:form.querySelector('input')?.value || null,
      checked:!!form.querySelector('input')?.disabled,
      options:[...form.querySelectorAll('label')].map(l=>({
        label:l.querySelector('.font-semibold')?.textContent || '',
        text:text(l.querySelector('span:last-of-type')).trim(),
        correct:l.classList.contains('border-emerald-500'),
        selected:!!l.querySelector('input')?.checked,
      })),
      images:[...form.querySelectorAll('img')].map(e=>({src:e.getAttribute('src'),alt:e.alt})),
      svg:[...prose[0].querySelectorAll('svg')].filter(e=>!e.closest('.katex')).map(e=>e.outerHTML),
    };
  });
}

export async function capture(tab, meta, budgetMs=25000) {
  if(![4,5,6].includes(meta.grade)) throw Error('Only user-authorized grades 4–6');
  await fs.mkdir(base,{recursive:true});
  const file=new URL(meta.course+'-'+meta.topic+'-level'+meta.level+'.json',base);
  let data={...meta,status:'capturing',questions:[],attempts:0};
  try { data=JSON.parse(await fs.readFile(file,'utf8')); } catch(e) { if(e.code!=='ENOENT') throw e; }
  const start=Date.now();
  while(Date.now()-start < budgetMs && data.questions.length < meta.expected) {
    await tab.playwright.locator('main form .prose-math').first().waitFor({state:'visible',timeoutMs:15000});
    let raw=await current(tab);
    if(!raw.checked) {
      // Reuse only a previously displayed source key; 1 is a placeholder attempt
      // in the explicitly authorized transfer account, never an imported answer.
      const previous=data.questions.find(q=>identity(q)===identity(raw));
      await submitAnswer(tab,raw,raw.options.length?previous?.options?.find(o=>o.correct)?.text:previous?.sourceAnswer);
      await observePage(tab);
      data.attempts++;
    }
    if(await tab.playwright.getByRole('button',{name:'Шешуін көру',exact:true}).isVisible()) {
      await click(tab,tab.playwright.getByRole('button',{name:'Шешуін көру',exact:true}));
      await observePage(tab);
    }
    raw=await current(tab);
    if(!raw.solution && !raw.checked) continue; // Navigation settled between observations.
    if(!raw.solution) throw Error('No displayed source solution');
    let answer=raw.options.find(o=>o.correct)?.text || displayedSourceKey(raw.feedback);
    if(!answer && raw.feedback?.includes('✓ Дұрыс')) answer=raw.submitted;
    if(!answer) throw Error('No displayed source key: '+raw.feedback);
    const id=hash(identity(raw));
    const existing=data.questions.find(q=>replayIdentity(q)===replayIdentity(raw));
    if(existing && existing.sourceAnswer!==answer) throw Error('Inconsistent source key for '+id);
    if(!existing) data.questions.push({...raw,id,sourceAnswer:answer});
    data.status=data.questions.length===meta.expected?'captured':'capturing';
    await snapshot(file,data);
    if(data.status==='captured')break;
    if(data.attempts>meta.expected*4)throw Error('Repeated questions: needs navigation review');
    try { await click(tab,tab.playwright.getByRole('button',{name:'Келесі есеп →',exact:true})); }
    catch(e) {
      await observePage(tab);
      // An action can complete even if the locator reports a late deadline.
      const settled=await current(tab);
      if(settled.checked && identity(settled)===identity(raw)) {
        // Confirmed unchanged checked form: resolve a fresh control once.
        const next=tab.playwright.getByRole('button',{name:'Келесі есеп →',exact:true});
        if(!await next.isEnabled())throw e;
        await click(tab,next);
      }
    }
    await tab.playwright.getByRole('button',{name:'Тексеру',exact:true}).waitFor({state:'visible',timeoutMs:15000});
    await observePage(tab);
  }
  return {file:file.pathname,title:meta.title,grade:meta.grade,level:meta.level,status:data.status,captured:data.questions.length,total:meta.expected,attempts:data.attempts};
}

export async function captureNextBase(tab,budgetMs=45000) {
  const catalog=JSON.parse(await fs.readFile(new URL('../problems/sources/zerek/course-topics-4-6.json',import.meta.url),'utf8'));
  const start=Date.now(),results=[];
  for(const course of catalog.courses)for(const topic of course.topics){
    if(Date.now()-start>budgetMs) return results;
    const unit=topic.path.split('/').at(-1);
    let data;try{data=JSON.parse(await fs.readFile(new URL(course.course+'-'+unit+'-level1.json',base),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
    if(data?.status==='captured')continue;
    const meta=await openTopic(tab,topic);
    results.push(await capture(tab,meta,Math.max(1000,budgetMs-(Date.now()-start))));
  }
  return results;
}

export async function runRemainingBase(tab,budgetMs=45000,gradeFilter=null) {
  const progress=new URL('transfer-progress'+(gradeFilter?'-grade'+gradeFilter:'')+'.json',base);
  const catalog=JSON.parse(await fs.readFile(new URL('../problems/sources/zerek/course-topics-4-6.json',import.meta.url),'utf8'));
  const start=Date.now();
  const state={stage:'base-levels',status:'running',completed:[],current:null};
  try {
    for(const course of catalog.courses.filter(c=>!gradeFilter||Number(c.course[0])===gradeFilter))for(const topic of course.topics){
      const unit=topic.path.split('/').at(-1);
      let data;try{data=JSON.parse(await fs.readFile(new URL(course.course+'-'+unit+'-level1.json',base),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
      if(data?.status==='captured'){state.completed.push(topic.path);continue;}
      state.current=topic;await snapshot(progress,state);
      if(Date.now()-start>=budgetMs){state.status='pending';await snapshot(progress,state);return state;}
      const meta=await resumableMeta(tab,data)||await openTopic(tab,topic);
      const result=await capture(tab,meta,Math.max(1,budgetMs-(Date.now()-start)));
      if(result.status!=='captured'){state.status='pending';await snapshot(progress,state);return state;}
      state.completed.push(topic.path);await snapshot(progress,state);
    }
    state.status='complete';state.current=null;await snapshot(progress,state);
  } catch(e) {
    state.status='paused_on_error';state.error=String(e);await snapshot(progress,state);
  }
  return state;
}

export async function masterLevel(tab,meta,deadline=Infinity) {
  if(![4,5,6].includes(meta.grade))throw Error('Outside authorized grades');
  const file=new URL(meta.course+'-'+meta.topic+'-level'+meta.level+'.json',base);
  const saved=JSON.parse(await fs.readFile(file,'utf8'));
  if(saved.status!=='captured')throw Error('Capture source keys before replay');
  const log=new URL('mastery-'+meta.course+'-'+meta.topic+'-'+meta.level+'.json',base);
  let observed=[];
  try{const prior=JSON.parse(await fs.readFile(log,'utf8'));if(prior.status==='replaying'&&prior.course===meta.course&&prior.topic===meta.topic&&prior.level===meta.level)observed=prior.observed;}catch(e){if(e.code!=='ENOENT')throw e;}
  for(let i=observed.length;i<8;i++){
    if(Date.now()>deadline-5000){await snapshot(log,{course:meta.course,topic:meta.topic,level:meta.level,status:'replaying',observed});return{correctReplay:observed.length,complete:false};}
    let raw=await current(tab);
    if(raw.checked){
      await click(tab,tab.playwright.getByRole('button',{name:'Келесі есеп →',exact:true}));
      await tab.playwright.getByRole('button',{name:'Тексеру',exact:true}).waitFor({state:'visible',timeoutMs:15000});
      await observePage(tab);raw=await current(tab);
    }
    const verified=await verifyCurrentKnown(tab,meta);raw=verified.raw;const key=verified.key;
    await submitAnswer(tab,raw,key.sourceAnswer);
    await observePage(tab);raw=await current(tab);
    if(!raw.feedback?.includes('✓ Дұрыс'))throw Error('Displayed source key failed on replay');
    observed.push({sourceContentId:key.id,correct:true});
    await snapshot(log,{course:meta.course,topic:meta.topic,level:meta.level,status:observed.length===8?'complete':'replaying',observed});
  }
  return{correctReplay:observed.length,complete:true};
}

export async function openHigherLevel(tab,topic,level,deadline=Infinity){
  if(![2,3].includes(level))throw Error('Higher level must be 2 or 3');
  let meta=await openTopic(tab,topic,level);
  if(meta.status==='locked'){
    const previous=await openTopic(tab,topic,level-1);
    if(previous.status==='locked')throw Error('Previous level unavailable');
    const mastery=await masterLevel(tab,previous,deadline);
    if(!mastery.complete)return{...previous,status:'mastery_pending'};
    meta=await openTopic(tab,topic,level);
    if(meta.status==='locked')throw Error('Level still locked after eight observed correct answers');
  }
  return meta;
}

export async function runRemainingHigher(tab,budgetMs=48000,gradeFilter=null){
  const progress=new URL('higher-transfer-progress'+(gradeFilter?'-grade'+gradeFilter:'')+'.json',base),start=Date.now();
  const catalog=JSON.parse(await fs.readFile(new URL('../problems/sources/zerek/course-topics-4-6.json',import.meta.url),'utf8'));
  const state={stage:'higher-levels',status:'running',completed:[],current:null};
  try{
    for(const course of catalog.courses.filter(c=>!gradeFilter||Number(c.course[0])===gradeFilter))for(const topic of course.topics)for(const level of [2,3]){
      const unit=topic.path.split('/').at(-1);let data;
      try{data=JSON.parse(await fs.readFile(new URL(course.course+'-'+unit+'-level'+level+'.json',base),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
      if(data?.status==='captured'){state.completed.push({path:topic.path,level});continue;}
      state.current={...topic,level};
      if(Date.now()-start>budgetMs-8000){state.status='pending';await snapshot(progress,state);return state;}
      await snapshot(progress,state);const meta=await resumableMeta(tab,data)||await openHigherLevel(tab,topic,level,start+budgetMs);
      if(meta.status==='mastery_pending'){state.status='pending';await snapshot(progress,state);return state;}
      const result=await capture(tab,meta,Math.max(1,budgetMs-(Date.now()-start)));
      if(result.status!=='captured'){state.status='pending';await snapshot(progress,state);return state;}
      state.completed.push({path:topic.path,level});
    }
    state.status='complete';state.current=null;
  }catch(e){state.status='paused_on_error';state.error=String(e);}
  await snapshot(progress,state);return state;
}
