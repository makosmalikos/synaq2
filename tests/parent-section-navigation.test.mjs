import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../frontend/src/ParentSectionNav.jsx', import.meta.url), 'utf8');
function fixture() {
  const handlers = new Map();
  const state = { active: '', cleanup: null };
  const tops = { 'parent-overview': -2200, 'pdr-topics': -900, 'parent-profile': 270, 'parent-rewards': 480, 'parent-settings': 697 };
  const context = {
    requested: { current: null }, sections: Object.keys(tops).map(id => [id, id]),
    setActive: id => { state.active = id; }, hasChildren: true, hasLessons: false, hasCenters: false,
    useEffect: effect => { state.cleanup = effect(); },
    window: { scrollY: 2400, innerHeight: 900, addEventListener: (name, fn) => handlers.set(name, fn), removeEventListener: name => handlers.delete(name) },
    document: { documentElement: { scrollHeight: 3300, clientWidth: 1265 }, getElementById: id => ({ getBoundingClientRect: () => ({ top: tops[id] }) }) },
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  useEffect(() => {'), source.indexOf('  const open = id =>')), context);
  return { state, context, handlers };
}
test('a clicked parent section stays selected when clamped scrolling also exposes the next section', () => {
  const { state, handlers } = fixture();
  assert.equal(state.active, 'parent-rewards');
  handlers.get('synaq:parent-section')({ detail: 'parent-profile' });
  handlers.get('scroll')();
  assert.equal(state.active, 'parent-profile');
  handlers.get('synaq:parent-section')({ detail: 'parent-settings' });
  handlers.get('scroll')();
  assert.equal(state.active, 'parent-settings');
});
test('manual wheel, touch, keyboard and scrollbar scrolling resume section tracking', () => {
  for (const [name, event] of [['wheel', {}], ['touchmove', {}], ['keydown', { key: 'PageDown' }], ['pointerdown', { clientX: 1275 }]]) {
    const { state, handlers } = fixture();
    handlers.get('synaq:parent-section')({ detail: 'parent-profile' });
    handlers.get(name)(event);
    handlers.get('scroll')();
    assert.equal(state.active, 'parent-rewards', name);
  }
});
test('unrelated keys and clicks do not discard the requested section and listeners are cleaned up', () => {
  const { state, handlers } = fixture();
  handlers.get('synaq:parent-section')({ detail: 'parent-profile' });
  handlers.get('keydown')({ key: 'Tab' });
  handlers.get('pointerdown')({ clientX: 300 });
  handlers.get('synaq:parent-section')({ detail: 'missing-section' });
  handlers.get('scroll')();
  assert.equal(state.active, 'parent-profile');
  state.cleanup();
  assert.equal(handlers.size, 0);
});
