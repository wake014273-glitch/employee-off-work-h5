/** Report raw build directory sizes; these are not WeChat upload package sizes. */
import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve('build', process.argv[2] ?? 'wechatgame');
const files = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile()) files.push({ path: relative(root, path).replaceAll('\\', '/'), bytes: statSync(path).size });
  }
}
walk(root);
const groups = new Map();
for (const file of files) {
  const group = file.path.startsWith('subpackages/') ? file.path.split('/').slice(0, 2).join('/') : 'main';
  groups.set(group, (groups.get(group) ?? 0) + file.bytes);
}
const main = groups.get('main') ?? 0;
const total = files.reduce((sum, file) => sum + file.bytes, 0);
console.log(JSON.stringify({ kind: 'raw build directory bytes, not upload size',
  platform: root.split(/[\\/]/).at(-1), files: files.length, groups: Object.fromEntries(groups),
  budget: { mainBytes: 4_000_000, previewTotalBytes: 20_000_000, withinBudget: main <= 4_000_000 && total <= 20_000_000 },
  largest: files.sort((a, b) => b.bytes - a.bytes).slice(0, 10) }, null, 2));
