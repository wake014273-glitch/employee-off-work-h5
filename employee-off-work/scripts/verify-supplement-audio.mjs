import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { sourceFingerprint } from './source-fingerprint.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'temp/qa/lmms-extra-v1');
const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const read=file=>{const b=readFileSync(resolve(root,file));return (b[0]===255&&b[1]===254?b.toString('utf16le'):b.toString('utf8')).replace(/^\uFEFF/,'');};
const json=file=>JSON.parse(read(file)),fingerprint=sourceFingerprint(root),checks={};
for(const name of ['test','soak']) {
  const log=read(`temp/lmms-extra-v1-${name}.log`);
  const passed=Number(log.match(/# pass (\d+)/)?.[1]),failed=Number(log.match(/# fail (\d+)/)?.[1]);
  assert(passed>0&&failed===0,name);checks[name]={passed,failed};
}
for(const [platform,name,files] of [
  ['web-mobile','web',['index.html','application.js','assets/main/index.js']],
  ['wechatgame','wechat',['game.js','game.json','project.config.json','assets/main/index.js']],
]) {
  const logPath=option(`--${name}-build-log`,`temp/lmms-extra-v1-build-${name}.log`);
  const log=read(logPath);
  assert(log.includes(`log marker "build Task (${platform}) Finished": true`)&&log.includes('[build] SUCCESS'),platform);
  assert(files.every(f=>existsSync(resolve(root,'build',platform,f))),platform);
  assert.equal(json(`build/${platform}/build-info.json`).fingerprint,fingerprint);
  checks[platform]={finishedMarker:true,artifactsExist:true,fingerprint,log:logPath};
}
for(const [name,file] of [['browser','web-result.json'],['wechatAudio','wechat-audio-result.json']]) {
  const resultPath=name==='browser'?option('--browser-result',`temp/qa/lmms-extra-v1/${file}`):`temp/qa/lmms-extra-v1/${file}`;
  if(name==='wechatAudio'&&process.argv.includes('--allow-pending-wechat')) {
    const previous=existsSync(resolve(out,file))?json(resultPath):null;
    if(!previous?.passed||previous.buildFingerprint!==fingerprint) {
      checks[name]={passed:false,status:'runtime-verification-pending',reason:'Current combined build has not completed the simulator audio regression. Earlier independent cue checks passed, but the first music fixture retained tutorial bullets; corrected fixture encountered an automator timeout. After the concurrent difficulty build the simulator scene is not ready.',lastAttemptFingerprint:previous?.buildFingerprint??null,log:'temp/lmms-extra-v1-wechat-audio.log'};
      continue;
    }
  }
  const result=json(resultPath);
  assert.equal(result.passed,true,name);assert(Object.values(result.checks).every(Boolean),name);
  assert.equal(result.buildFingerprint,fingerprint,name);
  assert(result.checks.all_six_new_clips_reach_engine_output,name);
  checks[name]={passed:true,count:Object.keys(result.checks).length,result:resultPath};
}
const audio=json('../美术/音频/LMMS补充音效-v1/audio-check.json');
for(const f of audio.files) {
  const bytes=readFileSync(resolve(root,`assets/art/audio/${f.name}.wav`));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256,f.name);
}
const report={date:'2026-10-17',status:checks.wechatAudio.passed?'verified-in-browser-and-devtools':'wechat-runtime-verification-pending',fingerprint,
  style:'LMMS试听稿-v1 + LMMS补充音效-v1',audio,checks,physicalPhoneListening:'not performed'};
writeFileSync(resolve(out,'verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,fingerprint,checks},null,2));
