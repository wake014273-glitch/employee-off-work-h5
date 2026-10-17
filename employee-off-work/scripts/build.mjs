/**
 * 构建包装器：Cocos Creator CLI 的退出码不可靠（成功构建也会返回 36），
 * 因此以「日志标记 + 产物存在」作为唯一成功判据。
 *
 * 用法：node scripts/build.mjs <platform> [debug] [key=value ...]
 *   node scripts/build.mjs web-mobile
 *   node scripts/build.mjs wechatgame false
 *   node scripts/build.mjs wechatgame false appid=wx0123456789abcdef
 *
 * 额外 key=value 会原样并入 Cocos 构建参数，可用来固定微信小游戏 AppID 等平台选项。
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixWechatAdapterDocument } from './wechat-runtime.mjs';
import { applyStartupArt } from './startup-art.mjs';
import { packageFriends } from './package-friends.mjs';
import { stampSource, verifyCompiledSource } from './source-fingerprint.mjs';

function verifyWechatPackageSize(output) {
  let main = 0;
  let total = 0;
  const walk = (directory, subpackage = false) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path, subpackage || (directory === output && entry.name === 'subpackages'));
      else if (entry.isFile()) {
        const bytes = statSync(path).size;
        total += bytes;
        if (!subpackage) main += bytes;
      }
    }
  };
  walk(output);
  console.log(`[build] WeChat raw package bytes: main ${main}, total ${total}`);
  // auto_preview currently rejects an upload above 20 MB, even when the
  // platform's larger total-package limit is met. Leave room for its manifest.
  if (main > 4_000_000 || total > 20_000_000)
    throw new Error(`WeChat raw package exceeds preview budget: main ${main}/4000000, total ${total}/20000000`);
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const editor = process.env.COCOS_EDITOR ?? 'F:/下班下班/tools/CocosCreator/CocosCreator.exe';
const platform = process.argv[2];
const debug = process.argv[3] ?? 'true';
const extraOptions = process.argv.slice(4);
const appid = extraOptions.map((option) => /^appid=(.+)$/.exec(option)?.[1]).find(Boolean);

const REQUIRED = {
  'web-mobile': ['index.html', 'index.js', 'application.js', 'assets/main/index.js', 'src/settings.json'],
  wechatgame: ['game.js', 'game.json', 'project.config.json', 'assets/main/index.js'],
};

function applyWechatRuntimeAliases(outputDir) {
  // Current WeChat DevTools exposes these APIs on GameGlobal but no longer exposes
  // their corresponding free variables to each required script. Cocos 3.8.8 uses
  // those variables in its generated adapter and engine files.
  const engineFiles = readdirSync(join(outputDir, 'cocos-js')).filter((name) => /^_virtual_cc-.+\.js$/.test(name));
  if (engineFiles.length !== 1) throw new Error(`Expected one Cocos engine module, found ${engineFiles.length}`);
  const aliases = [
    ['web-adapter.js', 'var window = GameGlobal;\nvar document = GameGlobal.document;\n'],
    ['src/system.bundle.js', 'var global = GameGlobal;\n'],
    ['game.js', 'var window = GameGlobal;\n'],
    ['first-screen.js', 'var window = GameGlobal;\nvar requestAnimationFrame = GameGlobal.requestAnimationFrame.bind(GameGlobal);\nvar cancelAnimationFrame = GameGlobal.cancelAnimationFrame.bind(GameGlobal);\n'],
    [`cocos-js/${engineFiles[0]}`, 'var global = GameGlobal;\nvar DOMParser = GameGlobal.DOMParser;\nvar document = GameGlobal.document;\nvar window = GameGlobal;\nvar requestAnimationFrame = GameGlobal.requestAnimationFrame.bind(GameGlobal);\nvar cancelAnimationFrame = GameGlobal.cancelAnimationFrame.bind(GameGlobal);\n'],
    ['engine-adapter.js', 'var window = GameGlobal;\n'],
  ];
  for (const [relativePath, prefix] of aliases) {
    const path = join(outputDir, relativePath);
    const source = readFileSync(path, 'utf8');
    if (!source.startsWith(prefix)) writeFileSync(path, prefix + source);
    if (!readFileSync(path, 'utf8').startsWith(prefix)) throw new Error(`Runtime aliases were not applied: ${relativePath}`);
  }
  // GameGlobal.document does not exist until web-adapter finishes on a phone.
  // Capturing it in the prefix passes DevTools and crashes native input startup.
  fixWechatAdapterDocument(outputDir);
  console.log(`[build] WeChat runtime aliases applied (${aliases.length} generated scripts)`);
}

if (!platform || !REQUIRED[platform]) {
  console.error(`usage: node scripts/build.mjs <${Object.keys(REQUIRED).join('|')}> [debug]`);
  process.exit(2);
}
if (!existsSync(editor)) {
  console.error(`Cocos Creator not found: ${editor}\nSet COCOS_EDITOR to the editor executable.`);
  process.exit(2);
}

const buildPath = join(projectRoot, 'build');
const fingerprint = stampSource(projectRoot);
const options = [`platform=${platform}`, `debug=${debug}`, `buildPath=${buildPath}`, ...extraOptions].join(';');
console.log(`[build] ${platform} -> ${buildPath}`);
console.log(`[build] source fingerprint: ${fingerprint}`);
if (extraOptions.length > 0) console.log(`[build] extra options: ${extraOptions.join(' ')}`);
const started = Date.now();
const result = spawnSync(editor, ['--project', projectRoot, '--build', options], {
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
  timeout: Number(process.env.COCOS_BUILD_TIMEOUT_MS) || 20 * 60 * 1000,
});
const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
const finished = output.includes(`build Task (${platform}) Finished`);
const missing = REQUIRED[platform].filter((file) => !existsSync(join(buildPath, platform, file)));
const mode = /md5String: debug=(true|false)/.exec(output)?.[1] ?? 'unknown';

console.log(`[build] cli exit code: ${result.status} (informational, Cocos CLI returns 36 even on success)`);
console.log(`[build] log marker "build Task (${platform}) Finished": ${finished}`);
console.log(`[build] effective debug mode: ${mode}`);
console.log(`[build] elapsed: ${((Date.now() - started) / 1000).toFixed(1)}s`);
if (missing.length === 0) {
  const total = REQUIRED[platform]
    .map((file) => statSync(join(buildPath, platform, file)).size)
    .reduce((sum, size) => sum + size, 0);
  console.log(`[build] artifacts ok (${REQUIRED[platform].length} checked, ${(total / 1024).toFixed(1)} KiB core files)`);
  if (platform === 'wechatgame') {
    // 平台选项是否真正落盘，必须从产物里读回来确认，而不是相信参数被接受。
    const configPath = join(buildPath, platform, 'project.config.json');
    const manifest = JSON.parse(readFileSync(join(buildPath, platform, 'game.json'), 'utf8'));
    console.log(`[build] game.json deviceOrientation: ${manifest.deviceOrientation}`);
    if (appid) {
      // Cocos CLI 不认 appid 参数（实测 3.8.8 会保留模板默认值），因此构建后写入并回读校验。
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      console.log(`[build] appid in artifact: ${config.appid || '(empty)'} -> applying ${appid}`);
      config.appid = appid;
      writeFileSync(configPath, JSON.stringify(config));
      const applied = JSON.parse(readFileSync(configPath, 'utf8')).appid;
      console.log(`[build] appid applied: ${applied} (verified by re-read)`);
      if (applied !== appid) {
        console.error('[build] appid verification failed');
        process.exit(1);
      }
    } else {
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      console.log(`[build] project.config.json appid: ${config.appid || '(empty) — pass appid=wx... to set your own'}`);
    }
    if (finished) applyWechatRuntimeAliases(join(buildPath, platform));
  }
} else {
  console.error(`[build] missing artifacts: ${missing.join(', ')}`);
}

if (finished && missing.length === 0) {
  if (platform === 'wechatgame') packageFriends(projectRoot, join(buildPath, platform));
  applyStartupArt(projectRoot, platform);
  verifyCompiledSource(projectRoot, platform, fingerprint);
  if (platform === 'wechatgame') verifyWechatPackageSize(join(buildPath, platform));
  console.log('[build] SUCCESS');
  process.exit(0);
}
output.split('\n').filter((line) => /error|失败|Finished in/.test(line)).slice(-20).forEach((line) => console.error(`  | ${line}`));
console.error('[build] FAILED');
process.exit(1);
