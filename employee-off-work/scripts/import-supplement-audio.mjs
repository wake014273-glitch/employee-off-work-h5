import { copyFileSync } from 'node:fs';
// No Cocos metadata is edited. Creator imports these six resources normally.
for(const name of ['leave','reduce','countdown','resume','grade','skill'])copyFileSync(
  new URL(`../../美术/音频/LMMS补充音效-v1/exports/${name}.wav`,import.meta.url),
  new URL(`../assets/art/audio/${name}.wav`,import.meta.url));
