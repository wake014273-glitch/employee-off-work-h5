import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const STAMP = /buildFingerprint = 'source:(?:pending|[0-9a-f]{16})'/;
const SOURCE_DIRS = ['assets', 'settings', 'build-templates'];
const SOURCE_FILES = ['package.json', 'tsconfig.json',
  'scripts/build.mjs', 'scripts/startup-art.mjs', 'scripts/startup-screen.mjs', 'scripts/package-friends.mjs',
  'scripts/wechat-runtime.mjs', 'scripts/source-fingerprint.mjs',
  'scripts/encode-startup-cover.ps1'];
const BINARY_SOURCE = /\.(?:png|jpe?g|webp|gif|bmp|tga|wav|mp3|ogg|mp4|mov|fbx|bin|ttf|otf|woff2?|zip|rar|psd)$/i;

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : entry.isFile() ? [path] : [];
  });
}

export function sourceFingerprint(root) {
  const main = join(root, 'assets', 'scripts', 'GameMain.ts');
  const paths = [...SOURCE_FILES.map((name) => join(root, name)),
    ...SOURCE_DIRS.flatMap((name) => filesIn(join(root, name)))];
  paths.sort((a, b) => relative(root, a).localeCompare(relative(root, b), 'en'));
  const hash = createHash('sha256');
  for (const path of paths) {
    let bytes = readFileSync(path);
    // Git checkout and Creator's first import may choose different Windows
    // line endings for the same text. Binary assets remain byte exact.
    if (!BINARY_SOURCE.test(path)) bytes = Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'));
    if (path === main) {
      const source = bytes.toString('utf8');
      if (!STAMP.test(source)) throw new Error('GameMain build fingerprint placeholder is missing');
      bytes = Buffer.from(source.replace(STAMP, "buildFingerprint = 'source:pending'"));
    }
    hash.update(relative(root, path).replaceAll('\\', '/')).update('\0').update(bytes).update('\0');
  }
  return `source:${hash.digest('hex').slice(0, 16)}`;
}

export function stampSource(root) {
  const fingerprint = sourceFingerprint(root);
  const path = join(root, 'assets', 'scripts', 'GameMain.ts');
  const source = readFileSync(path, 'utf8');
  const stamped = source.replace(STAMP, `buildFingerprint = '${fingerprint}'`);
  if (stamped === source && !source.includes(`buildFingerprint = '${fingerprint}'`))
    throw new Error('Could not update the GameMain build fingerprint');
  if (stamped !== source) writeFileSync(path, stamped);
  if (sourceFingerprint(root) !== fingerprint) throw new Error('Source changed while stamping');
  return fingerprint;
}

export function verifyCompiledSource(root, platform, fingerprint) {
  const path = join(root, 'build', platform, 'assets', 'main', 'index.js');
  if (!readFileSync(path, 'utf8').includes(fingerprint))
    throw new Error(`${platform} bundle does not contain current source fingerprint ${fingerprint}`);
  if (sourceFingerprint(root) !== fingerprint)
    throw new Error('Source changed during build; run the build again');
  const info = { fingerprint, platform, builtAt: new Date().toISOString() };
  writeFileSync(join(root, 'build', platform, 'build-info.json'), JSON.stringify(info, null, 2));
  return info;
}
