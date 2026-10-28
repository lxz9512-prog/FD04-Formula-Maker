import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  formulaEditEntry, formulaEditReturnTarget, ratioSyncScreenState, openFormulaEditor,
} from '../assets/formula-edit-navigation.js';

const location = (pathname, search = '', state = null) => ({ pathname, search, state });

test('sync drawer returns open with the same selected ratio, including after reload', () => {
  const state = { formulaRatioSync: { drawerOpen: true, selectedId: 'aptamil' } };
  const entry = formulaEditEntry(location('/formula-ratio-sync'), state);
  const target = formulaEditReturnTarget(JSON.parse(JSON.stringify(entry.state)), '/scan-formula');
  assert.equal(target.to, '/formula-ratio-sync');
  assert.deepEqual(ratioSyncScreenState(target.options.state), { drawerOpen: true, selectedId: 'aptamil' });
});

test('browser Back also restores drawer history before editor is opened', () => {
  const calls = [], state = { formulaRatioSync: { drawerOpen: true, selectedId: null } };
  openFormulaEditor((...args) => calls.push(args), location('/formula-ratio-sync'), '/formula-edit?mode=manual', state);
  assert.deepEqual(calls[0], ['/formula-ratio-sync', { replace: true, state }]);
  assert.equal(calls[1][0], '/formula-edit?mode=manual');
  assert.equal(calls[1][1].state.formulaEditOrigin.to, '/formula-ratio-sync');
});

test('manual, first-use, list editing, and failed recognition retain their exact entry', () => {
  for (const [path, query] of [
    ['/scan-formula', ''], ['/scan-formula', '?source=first-use'],
    ['/formula-ratio', ''], ['/capture-formula-step2', ''],
    ['/capture-formula-step2/upload-failed', '?source=first-use'],
    ['/capture-formula-step2/recognition-failed', ''], ['/device', ''],
  ]) {
    const entry = formulaEditEntry(location(path, query, { fromTest: true }));
    const target = formulaEditReturnTarget(entry.state, '/wrong-fallback');
    assert.equal(target.to, path + query);
    assert.deepEqual(target.options.state, { fromTest: true });
  }
});

test('each editor entry is independent, with safe fallback for direct links', () => {
  const drawerEntry = formulaEditEntry(location('/formula-ratio-sync'), { formulaRatioSync: { drawerOpen: true } });
  const scanEntry = formulaEditEntry(location('/scan-formula'));
  assert.equal(formulaEditReturnTarget(drawerEntry.state, '/device').to, '/formula-ratio-sync');
  assert.equal(formulaEditReturnTarget(scanEntry.state, '/device').to, '/scan-formula');
  assert.equal(formulaEditReturnTarget(null, '/capture-formula-step2').to, '/capture-formula-step2');
  assert.equal(ratioSyncScreenState(null).drawerOpen, false);
});

test('external paths and editor self-loops cannot override fallback', () => {
  for (const to of ['https://example.com', '//example.com', '/\\example.com', '/formula-edit?mode=manual', '/device\n']) {
    assert.equal(formulaEditReturnTarget({ formulaEditOrigin: { to } }, '/device').to, '/device');
  }
});

test('deployed bundle wires every editor entry and uses origin-aware back handler', () => {
  const bundle = readFileSync(new URL('../assets/index-BsM7afAG.js', import.meta.url), 'utf8');
  assert.ok(bundle.includes('formulaSyncRestore=U.useRef(ratioSyncScreenState(formulaLocation.state)).current'));
  assert.ok(bundle.includes('selectedId:f}})'));
  assert.ok(bundle.includes('const formulaReturn=formulaEditReturnTarget(formulaLocation.state'));
  assert.ok(bundle.includes('c(T,T.startsWith("/formula-edit")?formulaEditEntry(f):{})'));
  assert.equal((bundle.match(/openFormulaEditor\(/g) || []).length, 5);
});
