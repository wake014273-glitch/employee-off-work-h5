import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { checkWechatTouchBootstrap } from './wechat-runtime.mjs';

const source = readFileSync('build/wechatgame/web-adapter.js', 'utf8');
const binding = '\n// Bind after the adapter creates the phone document, before engine input starts.\ndocument = GameGlobal.document;\n';
assert.ok(source.endsWith(binding), 'Phone document binding is absent from the build');
const legacy = source.replace('var window = GameGlobal;\nvar document;\n',
  'var window = GameGlobal;\nvar document = GameGlobal.document;\n').slice(0, -binding.length);
const reproduced = {};
for (const platform of ['ios', 'android']) {
  assert.throws(() => checkWechatTouchBootstrap(legacy, platform), /addEventListener/);
  reproduced[platform] = true;
}
const platforms = ['ios', 'android', 'devtools'].map(p => checkWechatTouchBootstrap(source, p));
const result = { passed: true, oldCrashReproduced: reproduced, platforms,
  note: 'Real generated adapter with fresh platform API fixtures; not a physical-phone session.' };
mkdirSync('temp/qa', { recursive: true });
writeFileSync('temp/qa/wechat-phone-startup-result.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
