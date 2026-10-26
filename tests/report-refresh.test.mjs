import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../frontend/src/useReportRefresh.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/gm,'').replace('export default ','');
function fixture(enabled=true){
  let time=0,key='2026-10-25',revision=0,timer,stop;const listeners=new Map();
  const context={Date:{now:()=>time},trainingDayKey:()=>key,useRef:current=>({current}),useEffect:effect=>{stop=effect();},
    document:{visibilityState:'visible',addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)},
    window:{addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)},
    setInterval:fn=>{timer=fn;return 1;},clearInterval:()=>{timer=null;}};
  vm.createContext(context);vm.runInContext(source,context);context.useReportRefresh(fn=>{revision=fn(revision);},enabled);
  return{context,listeners,setTime:value=>{time=value;},setDay:value=>{key=value;},revision:()=>revision,tick:()=>timer?.(),stop:()=>stop?.()};
}
test('reports refresh once on a new Kazakhstan day and after returning, without minute network polling',()=>{
 const f=fixture();for(let i=0;i<10;i++)f.tick();assert.equal(f.revision(),0);
 f.setTime(60000);f.listeners.get('focus')();f.listeners.get('visibilitychange')();assert.equal(f.revision(),1);
 f.setDay('2026-10-26');f.tick();assert.equal(f.revision(),2);f.tick();assert.equal(f.revision(),2);
 f.stop();assert.equal(f.listeners.size,0);
});
test('hidden reports wait for visibility and an open mock review disables refresh',()=>{
 const f=fixture();f.context.document.visibilityState='hidden';f.setDay('2026-10-26');f.tick();assert.equal(f.revision(),0);
 f.context.document.visibilityState='visible';f.listeners.get('visibilitychange')();assert.equal(f.revision(),1);f.stop();
 const paused=fixture(false);assert.equal(paused.listeners.size,0);assert.equal(paused.revision(),0);
});
