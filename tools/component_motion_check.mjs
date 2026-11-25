import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const contract = JSON.parse(await readFile(new URL('./ui_motion_contract.json', import.meta.url), 'utf8'));
const base = new URL('../src/ui/', import.meta.url);
const actual = [
  ...(await readdir(base)).filter(name => name.endsWith('.js')).map(name => name.slice(0, -3)),
  ...(await readdir(new URL('../nodeview/ui/', base))).filter(name => name.endsWith('.js')).map(name => '../nodeview/ui/' + name.slice(0, -3)),
].sort();
const declared = Object.values(contract.groups).flatMap(group => group.modules);
assert.equal(new Set(declared).size, declared.length, 'Each UI module has exactly one motion owner');
assert.deepEqual([...declared].sort(), actual, 'New/removed UI modules must update their motion contract');
const evidence = [];
for (const [role, group] of Object.entries(contract.groups)) {
  assert.ok(group.behavior.length > 20, `${role}: a concrete interaction contract is required`);
  for (const name of group.modules) {
    const source = await readFile(new URL(name + '.js', base), 'utf8');
    if (role === 'anchored-surface') for (const token of ['enterSurface', 'exitSurface']) assert.ok(source.includes(token), `${name}: missing ${token}`);
    if (role === 'paired-modal') for (const token of ['attachModalLifecycle', 'closeModalSurface']) assert.ok(source.includes(token), `${name}: missing ${token}`);
    evidence.push({ module: name, role, sha256: createHash('sha256').update(source).digest('hex') });
  }
}
const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
for (const token of ['initExpressiveMotion()', 'finishExpressiveMotion()', 'closeModalSurface', 'enterSurface', 'exitSurface']) assert.ok(main.includes(token), `Application assembly: ${token}`);
const nodeAssembly = await readFile(new URL('../src/nodeview/index.js', import.meta.url), 'utf8');
assert.ok(nodeAssembly.includes('enterSurface'), 'Node assembly must use shared region motion');
const motion = await readFile(new URL('expressiveMotion.js', base), 'utf8');
assert.ok(!/\.observe\([^;]*subtree\s*:\s*true/s.test(motion), 'Motion must not animate arbitrary inserted DOM via a whole-document observer');
assert.ok(!/\bfetch\s*\(/.test(motion), 'Motion runtime does not fetch application resources');
console.log(JSON.stringify({ verdict: 'PASS', modules: actual.length, groups: Object.fromEntries(Object.entries(contract.groups).map(([key, group]) => [key, group.modules.length])),
  contractSha256: createHash('sha256').update(JSON.stringify(contract)).digest('hex'),
  scope: 'Source ownership gate; browser interaction/visual checks are separate',
  deferred: contract.deferred,
  sourcesSha256: createHash('sha256').update(JSON.stringify(evidence)).digest('hex'),
  ...(process.argv.includes('--details') ? { evidence } : {}) }, null, 2));
