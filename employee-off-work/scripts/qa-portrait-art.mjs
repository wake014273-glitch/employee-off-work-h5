import { PORTRAIT_FIXTURE, portraitChecks } from './qa-portrait-fixture.mjs';
/** Workload portrait regression and screenshots on the actual Cocos canvas. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const wechat = process.argv.includes('--wechat');
const out = resolve(process.env.PORTRAIT_QA_OUT ?? 'temp/qa/portrait'); mkdirSync(out, { recursive: true });
const errors = []; const checks = {}; const states = {}; let socket, send;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ide = process.env.WECHAT_IDE ?? 'C:/Program Files (x86)/Tencent/微信web开发者工具';
function call(name, options = []) {
  const boot = `const e=process.argv[1],a=process.argv.slice(2);process.env.cwd=process.cwd();process.argv=[process.execPath,e,'--electron'].concat(a);require(e)`;
  const result = spawnSync(resolve(ide, '微信开发者工具.exe'), ['-e', boot,
    resolve(ide, 'resources/app.asar.unpacked/js/common/cli/skill-index.js'), '-c', 'Codex', name,
    '--project', resolve('build/wechatgame'), ...options], {
    encoding: 'utf8', timeout: 60000, windowsHide: true,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, maxBuffer: 12 * 1024 * 1024,
  });
  const text = result.stdout ?? ''; const offset = text.indexOf('{');
  if (offset < 0) throw new Error(`${name}: ${text} ${result.stderr}`);
  const data = JSON.parse(text.slice(offset));
  if (!data.ok || data.result?.success === false) throw new Error(JSON.stringify(data));
  return data.result;
}
if (!wechat) {
  const targets = await (await fetch(`http://127.0.0.1:${process.env.CDP_PORT ?? 9334}/json/list`)).json();
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { socket.onopen = r; socket.onerror = j; });
  let id = 0; const pending = new Map();
  socket.onmessage = ({ data }) => {
    const m = JSON.parse(data);
    if (m.id) { pending.get(m.id)?.(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails);
  };
  send = (method, params = {}) => new Promise((r, j) => {
    pending.set(++id, m => m.error ? j(new Error(JSON.stringify(m.error))) : r(m.result));
    socket.send(JSON.stringify({ id, method, params }));
  });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:7456/?workload-portrait' });
  await sleep(1500);
}
async function evaluate(body) {
  if (wechat) return call('automation_evaluate', ['--fn-source', `function(){
    var w=typeof GameGlobal==='undefined'?null:GameGlobal.__gameContextWindow,cc=w&&(w.cc||(w.System&&w.System.get(w.System.resolve('cc')))),scene=cc&&cc.director.getScene();
    var canvas=scene&&scene.getChildByName('Canvas'),g=canvas&&canvas.components.find(c=>cc.js.getClassName(c)==='GameMain');
    if(!g)return null;var m=g.model,u=g.interface;${body}}`]).result;
  const result = await send('Runtime.evaluate', { expression: `(async()=>{
    if(typeof System==='undefined')return null;const cc=await System.import('cc'),scene=cc.director.getScene();
    const canvas=scene&&scene.getChildByName('Canvas'),g=canvas&&canvas.components.find(c=>cc.js.getClassName(c)==='GameMain');
    if(!g)return null;const m=g.model,u=g.interface;${body}})()`, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function shot(name) {
  if(wechat){
    await sleep(200);
    call('simulator_screenshot',['--path',resolve(out,`wechat-${name}.png`)]);
    return;
  }
  const data = await evaluate(`cc.director.tick(0);var src=cc.game.canvas,c=${wechat?'w.document':'document'}.createElement('canvas');
    c.width=src.width;c.height=src.height;c.getContext('2d').drawImage(src,0,0);return c.toDataURL('image/png');`);
  if(typeof data!=='string'||!data.startsWith('data:image/png;base64,'))throw new Error('Canvas screenshot is not ready: '+String(data).slice(0,100));
  writeFileSync(resolve(out, `${wechat ? 'wechat' : 'web'}-${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
}

try {
  let ready=false;
  for(let i=0;i<45;i++) {
    ready=await evaluate('if(!g.artReady)cc.director.tick(0);return g.artReady&&!!g.artHud.portraitMotion;');
    if(ready)break;await sleep(500);
  }
  if(!ready)throw new Error('Portrait build is not loaded');
  states.fixture=await evaluate((wechat?'w.__gm=g;':'window.__gm=g;')+'return '+PORTRAIT_FIXTURE.replaceAll('window',wechat?'w':'window')+';');
  Object.assign(checks,portraitChecks(states.fixture));
  await evaluate('g.restart();g.guide.start(false);g.shieldCoach.reset(true);m.practiceProtected=false;m.bullets.length=m.walls.length=m.skillOrbs.length=m.aiPickups.length=m.leaveSlips.length=0;m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;m.paused=true;return true;');
  for(const load of [0,1,2]) {
    await evaluate('m.workload='+load+';g.artHud.portraitMotion.advance('+load+',0.65);g.visualDt=0;g.draw();g.syncArt();g.interface.root.active=false;g.overlay.node.active=false;cc.director.tick(0);return true;');
    await shot('load-'+load);
    if(wechat){
      const python=process.env.QA_PYTHON??resolve(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
      const result=spawnSync(python,['-c',`from PIL import Image,ImageStat;import sys;im=Image.open(sys.argv[1]).convert('RGB');assert max(ImageStat.Stat(im).stddev)>5,'Empty simulator screenshot';s=im.width/720;im.crop((545*s,140*s,720*s,240*s)).resize((320,180)).save(sys.argv[2])`,resolve(out,`wechat-load-${load}.png`),resolve(out,`wechat-face-${load}.png`)],{encoding:'utf8',windowsHide:true});
      if(result.status!==0)throw new Error(result.stderr||'Simulator screenshot validation failed');
    }else{
      const detail=await evaluate('cc.director.tick(0);var src=cc.game.canvas,c=document.createElement("canvas");c.width=320;c.height=180;var scale=src.width/720;c.getContext("2d").drawImage(src,545*scale,140*scale,175*scale,100*scale,0,0,320,180);return c.toDataURL("image/png");');
      writeFileSync(resolve(out,'web-face-'+load+'.png'),Buffer.from(detail.split(',')[1],'base64'));
    }
  }
  await evaluate('g.goHome();g.visualDt=0;g.draw();g.syncArt();return true;');
  if(wechat){states.console=call('get_simulator_console',['--command','grep -i error']);checks.no_wechat_runtime_errors=states.console==='';}
  checks.no_runtime_exceptions=errors.length===0;
  const report={passed:Object.values(checks).every(Boolean),checks,states,errors};
  writeFileSync(resolve(out,(wechat?'wechat':'web')+'-result.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  if(!report.passed)process.exitCode=1;
} finally {socket?.close();}
