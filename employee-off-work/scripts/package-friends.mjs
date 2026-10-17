import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Preserve the generated platform manifest and package the source-controlled open data context. */
export function packageFriends(projectRoot, outputDir) {
  const source = join(projectRoot, 'build-templates/wechatgame/openDataContext');
  const target = join(outputDir, 'openDataContext');
  mkdirSync(target, { recursive: true });
  for (const file of ['index.js', 'controller.js', 'ranking.js', 'package.json']) copyFileSync(join(source, file), join(target, file));
  const manifestPath = join(outputDir, 'game.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.openDataContext = 'openDataContext';
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  const applied = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (applied.openDataContext !== 'openDataContext' ||
    ['index.js', 'controller.js', 'ranking.js'].some(file => !existsSync(join(target, file))))
    throw new Error('Friend leaderboard open data context packaging failed');
  console.log('[build] Friend leaderboard openDataContext manifest and 3 scripts verified');
}
