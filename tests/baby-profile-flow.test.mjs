import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBabyProfileFlow } from '../assets/baby-profile-flow.js';

function setup() {
  const storage = new Map(), navigation = [], events = [];
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  globalThis.window = { dispatchEvent: event => events.push(event.type) };
  let state = [], cursor = 0;
  const React = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat() }),
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = value; }];
    },
    useId: () => `field-${cursor++}`,
    useRef: () => ({ current: null }),
    useEffect() {},
  };
  const flow = createBabyProfileFlow({ React, DeviceFrame() {}, BackIcon() {},
    navigate: () => (...args) => navigation.push(args), language: () => ({ language: 'zh' }) });
  function render() { cursor = 0; return flow.AddBabyPage(); }
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) return node;
    for (const child of node.children || []) { const found = find(child, predicate); if (found) return found; }
  }
  function field(tree, type) { return find(tree, node => node.type === 'input' && (node.props.type || 'text') === type); }
  function change(type, value) { field(render(), type).props.onChange({ target: { value } }); }
  function submit() { find(render(), n => n.type === 'form').props.onSubmit({ preventDefault() {} }); }
  return { flow, storage, navigation, events, render, find, change, submit };
}

test('missing, invalid, and incomplete baby profiles are not treated as configured', () => {
  const t = setup();
  assert.equal(t.flow.hasBaby(), false);
  for (const value of ['{broken', '{}', '{"name":"  ","birthday":"2026-01-01"}', '{"name":"Demo"}']) {
    t.storage.set('fd04_baby_profile', value);
    assert.equal(t.flow.hasBaby(), false);
  }
});

test('empty or whitespace name is rejected without saving', () => {
  const t = setup(); t.change('text', '   '); t.change('date', '2026-01-01'); t.submit();
  assert.equal(t.flow.hasBaby(), false); assert.equal(t.navigation.length, 0);
  assert.equal(t.find(t.render(), n => n.props.role === 'alert').children[0], '请输入宝宝昵称');
});

test('missing or future birthday is rejected', () => {
  const t = setup(); t.change('text', 'Demo Baby');
  for (const birthday of ['', '2999-01-01']) {
    t.change('date', birthday); t.submit();
    assert.equal(t.navigation.length, 0); assert.equal(t.flow.hasBaby(), false);
  }
});

test('valid demo profile saves locally then returns to control page', () => {
  const t = setup(); t.change('text', ' Demo Baby '); t.change('date', '2026-01-01'); t.submit();
  assert.equal(t.flow.hasBaby(), true);
  assert.deepEqual(JSON.parse(t.storage.get('fd04_baby_profile')), {
    name: 'Demo Baby', birthday: '2026-01-01', gender: 'unspecified',
  });
  assert.deepEqual(t.navigation, [['/device', { replace: true }]]);
  assert.deepEqual(t.events, ['fd04BabyProfileChanged']);
});

test('storage failure stays on form with an error instead of claiming success', () => {
  const t = setup(); t.change('text', 'Demo Baby'); t.change('date', '2026-01-01');
  globalThis.localStorage.setItem = () => { throw new Error('Storage disabled'); };
  t.submit(); assert.equal(t.navigation.length, 0);
  assert.match(t.find(t.render(), n => n.props.role === 'alert').children[0], /保存失败/);
});

test('missing baby prompt provides add and ignore destinations', () => {
  const t = setup(); const tree = t.flow.MissingBabyPrompt();
  t.find(tree, n => n.type === 'button' && n.children[0] === '添加宝宝').props.onClick();
  t.find(tree, n => n.type === 'button' && n.children[0] === '忽略').props.onClick();
  assert.deepEqual(t.navigation, [['/add-baby'], ['/device', { replace: true }]]);
});

test('Escape on prompt returns to control without saving anything', () => {
  const t = setup(); const tree = t.flow.MissingBabyPrompt();
  let prevented = false;
  t.find(tree, n => n.props.role === 'dialog').props.onKeyDown({ key: 'Escape', preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(t.storage.size, 0);
  assert.deepEqual(t.navigation, [['/device', { replace: true }]]);
});
