/** Import the approved v1 exports; keep Creator-owned metadata intact. */
import { copyFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const game=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=resolve(game,'../美术/音频/LMMS试听稿-v1/exports');
const destination=resolve(game,'assets/art/audio');
mkdirSync(destination,{recursive:true});
const files={ui:'02-ui.wav',pickup:'03-pickup.wav',ready:'04-ready.wav',shield:'05-shield.wav',hit:'06-hit.wav'};
const report={source:'LMMS试听稿-v1',sounds:[],music:null};
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
for(const [name,file] of Object.entries(files)) {
  const input=resolve(source,file),output=resolve(destination,`${name}.wav`);
  assert(existsSync(input),`Missing approved export ${input}`);
  copyFileSync(input,output);
  assert.equal(hash(input),hash(output));
  report.sounds.push({name,source:file,sha256:hash(output)});
}
const music=resolve(destination,'bgm.mp3');
const encoded=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',resolve(source,'01-fish-break-loop.wav'),'-map_metadata','-1','-c:a','libmp3lame','-b:a','112k','-ar','44100',music],{encoding:'utf8',windowsHide:true,timeout:60000});
assert(!encoded.error&&encoded.status===0,encoded.error?.message||encoded.stderr);
report.music={name:'bgm',source:'01-fish-break-loop.wav',codec:'mp3',bitrate:112000,loopSeconds:240/112*16,sha256:hash(music)};
mkdirSync(resolve(game,'temp'),{recursive:true});
writeFileSync(resolve(game,'temp/lmms-v1-import.json'),JSON.stringify(report,null,2)+'\n');
console.log('Imported 5 byte-exact v1 WAV cues and the 16-bar BGM as a compact MP3. Creator imports metadata.');
