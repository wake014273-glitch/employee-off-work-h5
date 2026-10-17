import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { sourceFingerprint } from './source-fingerprint.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'temp/qa/lmms-v1-integration');
const read=file=>{const b=readFileSync(resolve(root,file));return(b[0]===255&&b[1]===254?b.toString('utf16le'):b.toString('utf8')).replace(/^\uFEFF/,'');};
const json=file=>JSON.parse(read(file));
const fingerprint=sourceFingerprint(root);
const checks={};
for(const name of ['test','soak']) {
  const log=read(`temp/lmms-v1-${name}.log`);
  const passed=Number(log.match(/# pass (\d+)/)?.[1]),failed=Number(log.match(/# fail (\d+)/)?.[1]);
  assert(passed>0&&failed===0,name);checks[name]={passed,failed};
}
for(const [platform,name,files] of [
  ['web-mobile','web',['index.html','application.js','src/settings.json']],
  ['wechatgame','wechat',['game.js','game.json','project.config.json']],
]) {
  const log=read(`temp/lmms-v1-build-${name}.log`);
  assert(log.includes(`log marker "build Task (${platform}) Finished": true`)&&log.includes('[build] SUCCESS'),platform);
  assert(files.every(file=>existsSync(resolve(root,'build',platform,file))),platform);
  assert.equal(json(`build/${platform}/build-info.json`).fingerprint,fingerprint);
  checks[platform]={finishedMarker:true,artifactsExist:true,fingerprint};
}
for(const [name,file] of [['browser','web-result.json'],['wechatAudio','wechat-audio-result.json']]) {
  if(name==='wechatAudio'&&!existsSync(resolve(out,file))&&process.argv.includes('--allow-pending-wechat')) {
    checks[name]={passed:false,status:'awaiting-manual-devtools-recovery',reason:'DevTools scene has not loaded the art bundle; Windows window control timed out after recovery attempts.'};
    continue;
  }
  const result=JSON.parse(readFileSync(resolve(out,file),'utf8'));
  assert.equal(result.passed,true,name);assert(Object.values(result.checks).every(Boolean),name);
  assert.equal(result.buildFingerprint,fingerprint,name);
  checks[name]={passed:true,count:Object.keys(result.checks).length};
}
const report={date:'2026-10-16',status:checks.wechatAudio.passed?'verified-in-browser-and-devtools':'wechat-runtime-verification-pending',fingerprint,selectedAudio:'LMMS试听稿-v1',audio:{...json('temp/lmms-v1-import.json'),musicBytes:statSync(resolve(root,'assets/art/audio/bgm.mp3')).size},checks,physicalPhoneListening:'not performed'};
writeFileSync(resolve(out,'verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({fingerprint,checks},null,2));
