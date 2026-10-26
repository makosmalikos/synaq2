import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{resolve,reject,promise};};

function fixture(kind){
  const path=kind==='mentor'?'components/Mentor.jsx':kind==='notifications'?'Notifications.jsx':kind==='rewards'?'RewardApprovals.jsx':'ParentLessons.jsx';
  const source=fs.readFileSync(new URL(`../frontend/src/${path}`,import.meta.url),'utf8');
  const state={},calls=[],effects=[];
  const context={auth:{currentUser:{uid:'current'}},uid:'current',lang:'ru',
    mounted:{current:true},generation:{current:0},requests:{current:0},selectionRequest:{current:0},request:{current:0},acting:{current:false},busyRef:{current:false},
    useCallback:callback=>callback,useEffect:callback=>effects.push(callback),setInterval:()=>1,clearInterval:()=>{},
    mentor:{id:'mentor'},slots:[100],topicName:'Дроби',picked:[],text:ru=>ru,
    window:{confirm:()=>true,prompt:()=>''},
  };
  for(const name of ['Data','Error','Step','Topic','Picked','Unclear','Mentor','Slots','SelectedSlot','Busy','Notice','LessonLink','Items','Read','Open','Requests','Loading']){
    context[`set${name}`]=value=>{state[name]=value;context[name[0].toLowerCase()+name.slice(1)]=value;};
  }
  context.lessonsCall=context.rewardRequest=body=>{const call={body,...deferred()};calls.push(call);return call.promise;};
  context.openLesson=async(call,id,options)=>{await call({action:'join',id});return options.current()?'https://meet.google.com/local':null;};
  context.loadRead=()=>new Set();
  let code;
  if(kind==='mentor') code=source.slice(source.indexOf('  const load = useCallback'),source.indexOf('  const days = useMemo'))+'\nmodule.exports={load,book,chooseMentor,act};';
  else if(kind==='notifications') code=source.slice(source.indexOf('  const load = useCallback'),source.indexOf('  useEffect(() => {\n    if (!open)'))+'\nmodule.exports={load};';
  else if(kind==='rewards') code=source.slice(source.indexOf('  const load = async'),source.indexOf('  const pending ='))+'\nmodule.exports={load,act};';
  else code=source.slice(source.indexOf('  const load = useCallback'),source.indexOf('  if (!data)'))+source.slice(source.indexOf('  const act = async'),source.indexOf('  const { plan, lessons, now }'))+'\nmodule.exports={load,act};';
  context.module={exports:{}};vm.createContext(context);vm.runInContext(code,context);
  return {api:context.module.exports,context,state,calls,stop:()=>effects[0]()};
}

test('lesson overviews and notifications ignore older reads, switched owners and unmounts',async()=>{
  for(const kind of ['mentor','parent','notifications','rewards']){
    const f=fixture(kind), first=f.api.load(),second=f.api.load();
    const result=kind==='notifications'?{items:['new']}:kind==='rewards'?{requests:['new']}:{marker:'new'};
    f.calls[1].resolve(result);await second;f.calls[0].resolve({marker:'old',items:['old'],requests:['old']});await first;
    assert.deepEqual(f.state[kind==='notifications'?'Items':kind==='rewards'?'Requests':'Data'],kind==='notifications'||kind==='rewards'?['new']:result,kind);
    const snapshot={...f.state};const third=f.api.load();f.context.auth.currentUser={uid:'other'};f.calls[2].resolve({marker:'private',items:['private'],requests:['private']});await third;
    assert.deepEqual(f.state[kind==='notifications'?'Items':kind==='rewards'?'Requests':'Data'],snapshot[kind==='notifications'?'Items':kind==='rewards'?'Requests':'Data']);
    f.context.auth.currentUser={uid:'current'};const fourth=f.api.load();f.context.mounted.current=false;f.calls[3].reject(Error('late'));await fourth;
    assert.notEqual(f.state.Error,'late');
  }
});

test('same-render mentor booking clicks dispatch once and never navigate after logout',async()=>{
  const f=fixture('mentor');const first=f.api.book(100);await f.api.book(100);
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].body.topic,'Дроби');
  f.context.auth.currentUser={uid:'other'};f.calls[0].resolve({ok:true});await first;
  assert.equal(f.state.Step,undefined);assert.equal(f.state.Notice,undefined);assert.equal(f.calls.length,1);
});

test('occupied mentor slot clears selection and waits for refreshed slots before releasing busy',async()=>{
  const f=fixture('mentor');const booking=f.api.book(100);f.calls[0].reject(Error('slot_taken'));await tick();
  assert.equal(f.state.SelectedSlot,null);assert.equal(f.state.Busy,true);assert.equal(f.calls[1].body.action,'slots');
  f.calls[1].resolve({slots:[200]});await booking;assert.deepEqual(f.state.Slots,[200]);assert.equal(f.state.Busy,false);assert.equal(f.state.Error,'slot_taken');
});

test('parent, mentor and reward mutations reject duplicate clicks before React rerenders',async()=>{
  for(const kind of ['mentor','parent','rewards']){
    const f=fixture(kind),run=()=>kind==='rewards'?f.api.act('request','approve'):f.api.act({action:'cancel',id:'lesson'});
    const first=run();await run();assert.equal(f.calls.length,1,kind);
    f.context.mounted.current=false;f.calls[0].reject(Error('late'));await first;
    assert.notEqual(f.state.Error,'late');assert.equal(f.calls.length,1);
  }
});

test('lesson errors retain their machine code for immediate language changes',async()=>{
  for(const kind of ['mentor','parent']){
    const f=fixture(kind);const load=f.api.load();f.calls[0].reject(Error('mentor_plan_required'));await load;
    assert.equal(f.state.Error,'mentor_plan_required');
  }
});
