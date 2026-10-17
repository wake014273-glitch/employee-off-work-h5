import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { sourceFingerprint } from '../scripts/source-fingerprint.mjs';

test('text checkout line endings do not change the fingerprint; binary bytes do', () => {
  const tempRoot = resolve('temp');
  mkdirSync(tempRoot, { recursive: true });
  const root = mkdtempSync(join(tempRoot, 'fingerprint-test-'));
  const put = (name, value) => {
    const path = join(root, name);
    mkdirSync(resolve(path, '..'), { recursive: true });
    writeFileSync(path, value);
  };
  try {
    put('package.json', '{\n  "name": "fixture"\n}\n');
    put('tsconfig.json', '{}\n');
    put('assets/scripts/GameMain.ts', "buildFingerprint = 'source:pending'\n");
    put('assets/art/picture.png', Buffer.from([137, 80, 78, 71, 1]));
    put('assets/scenes/Main.scene', '{\n  "name": "Main"\n}\n');
    for (const name of ['build', 'startup-art', 'startup-screen', 'package-friends', 'wechat-runtime', 'source-fingerprint'])
      put(`scripts/${name}.mjs`, 'export const ok = true;\n');
    put('scripts/encode-startup-cover.ps1', 'Write-Output ok\n');
    put('scripts/qa-wechat.mjs', 'export const check = true;\n');
    put('settings/v2/packages/engine.json', '{\n  "enabled": true\n}\n');
    put('build-templates/game.json', '{\n  "portrait": true\n}\n');
    const baseline = sourceFingerprint(root);
    put('assets/scripts/GameMain.ts', "buildFingerprint = 'source:pending'\r\n");
    put('assets/scenes/Main.scene', '{\r\n  "name": "Main"\r\n}\r\n');
    put('settings/v2/packages/engine.json', '{\r\n  "enabled": true\r\n}\r\n');
    put('scripts/build.mjs', 'export const ok = true;\r\n');
    assert.equal(sourceFingerprint(root), baseline);
    put('scripts/qa-wechat.mjs', 'export const check = false;\n');
    assert.equal(sourceFingerprint(root), baseline);
    put('scripts/build.mjs', 'export const ok = false;\n');
    assert.notEqual(sourceFingerprint(root), baseline);
    put('scripts/build.mjs', 'export const ok = true;\n');
    put('assets/art/picture.png', Buffer.from([137, 80, 78, 71, 2]));
    assert.notEqual(sourceFingerprint(root), baseline);
  } finally {
    if (!root.startsWith(tempRoot + sep)) throw new Error('Unsafe fixture path');
    rmSync(root, { recursive: true, force: true });
  }
});
