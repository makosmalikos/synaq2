import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { trainingElapsed } from '../frontend/src/trainingPersistence.js';
const source=fs.readFileSync(new URL('../frontend/src/components/Training.jsx',import.meta.url),'utf8');
const start=source.indexOf('  useEffect(() => {\n    if (!items.length || checked || sessionState');
const effect=source.slice(start,source.indexOf('  }, [items, i, checked, sessionState]);',start)+'  }, [items, i, checked, sessionState]);'.length);

test('training clock catches up after tab throttling and ignores a previous question callback',()=>{
 let clock=1000,secs=0,tick,stop;const listeners=new Map();
 class Clock extends Date {static now(){return clock;}}
 const scope={key:'q1',uid:'kid',startedAt:1000};
 const context={Date:Clock,i:0,items:[{}],checked:false,sessionState:'ready',questionSession:{current:scope},currentQuestion:{current:'q1'},mounted:{current:true},auth:{currentUser:{uid:'kid'}},timer:{},
 trainingElapsed:s=>trainingElapsed(s,clock),setSecs:value=>{secs=value;},setInterval:callback=>{tick=callback;return 1;},clearInterval(){},useEffect:callback=>{stop=callback();},
 window:{addEventListener:(name,callback)=>listeners.set(name,callback),removeEventListener:name=>listeners.delete(name)},document:{addEventListener:(name,callback)=>listeners.set(name,callback),removeEventListener:name=>listeners.delete(name)}};
 vm.createContext(context);vm.runInContext(effect,context);assert.equal(secs,0);
 clock=121000;tick();assert.equal(secs,120,'one delayed callback reflects two minutes');
 clock=181000;listeners.get('focus')();assert.equal(secs,180);
 context.questionSession.current={...scope,key:'q2'};clock=241000;tick();assert.equal(secs,180);
 stop();assert.equal(listeners.size,0);
});

test('training stopwatch uses server clock offset and never shows negative or malformed time',()=>{
 for(const now of [10000,610000,-590000])assert.equal(trainingElapsed({startedAt:0,clockOffsetMs:10000-now},now),10);
 assert.equal(trainingElapsed({startedAt:10000},0),0);assert.equal(trainingElapsed(null,1000),0);
});
