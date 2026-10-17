/**
 * 实机回归：通过 CDP 驱动真实 Chrome，对 web-mobile 构建执行鼠标/键盘操作并读取运行时状态。
 *
 * 前置：
 *   1) node scripts/serve-build.mjs         （默认 http://127.0.0.1:7456）
 *   2) Chrome 带调试端口启动：
 *      chrome.exe --headless=new --disable-gpu --touch-events=enabled --remote-debugging-port=9334 \
 *        --user-data-dir=%TEMP%/chrome-game-qa --window-size=720,1600 about:blank
 *
 * 运行：node scripts/qa-playthrough.mjs
 * 环境变量：GAME_PORT（默认 7456）、CDP_PORT（默认 9334）、QA_OUT（默认 temp/qa）
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { PRESSURE_FIXTURE, pressureChecks } from './qa-pressure-fixture.mjs';
import { JOYSTICK_FIXTURE, joystickChecks } from './qa-joystick-fixture.mjs';
import { ENERGY_FIXTURE, energyChecks } from './qa-energy-fixture.mjs';
import { SPRING_FIXTURE, springChecks } from './qa-spring-fixture.mjs';
import { PRESENTATION_FIXTURE, presentationChecks } from './qa-presentation-fixture.mjs';
import { PORTRAIT_FIXTURE, portraitChecks } from './qa-portrait-fixture.mjs';
import { AUDIO_STEPS, AUDIO_SNAPSHOT, audioChecks } from './qa-audio-fixture.mjs';
import { SUPPLEMENT_AUDIO_FIXTURE, supplementAudioChecks } from './qa-supplement-audio-fixture.mjs';
import { DESIGN_HEIGHT, DESIGN_WIDTH, HUD_SAFE_HEIGHT, playerMovementTop, HUD_BOTTOM, PLAYER_VISUAL_TOP, PLAYER_HUD_GAP, PLAYER_ENERGY_BAR, PLAYER_EDGE_MARGIN, SPRITE_SIZES, PORTRAIT_AVATAR } from '../assets/scripts/model/GameLayout.ts';
import { SHIELD_DURATION } from '../assets/scripts/model/GameModel.ts';
import { STARTUP_OBSERVER, startupChecks, LIFECYCLE_FIXTURE, lifecycleChecks } from './qa-startup-fixture.mjs';

const GAME_PORT = Number(process.env.GAME_PORT ?? 7456);
const CDP_PORT = Number(process.env.CDP_PORT ?? 9334);
const OUT = process.env.QA_OUT ?? 'temp/qa';
const GAME_URL = `http://127.0.0.1:${GAME_PORT}/`;
const expectedFingerprint = JSON.parse(readFileSync('build/web-mobile/build-info.json', 'utf8')).fingerprint;
mkdirSync(OUT, { recursive: true });

const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
const target = targets.find((item) => item.type === 'page');
if (!target) throw new Error(`No page target on CDP port ${CDP_PORT}`);
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });

let sequence = 0;
const pending = new Map();
const waiters = {};
const browserErrors = [];
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); return; }
  if (message.method === 'Page.loadEventFired' && waiters.load) { waiters.load(); waiters.load = null; }
  if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params.exceptionDetails.text + ': ' + message.params.exceptionDetails.exception?.description);
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error')
    browserErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' ') +
      ' @ ' + (message.params.stackTrace?.callFrames?.[0]?.url ?? 'unknown'));
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, (message) => (message.error ? reject(new Error(`${method}: ${JSON.stringify(message.error)}`)) : resolve(message.result)));
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const mouse = (type, x, y, buttons) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount: 1 });
const click = async (x, y) => { await mouse('mousePressed', x, y, 1); await mouse('mouseReleased', x, y, 0); };
// Keep real double-tap events together so CLI latency cannot split the gesture.
const doubleClick = (x, y) => Promise.all([
  mouse('mousePressed', x, y, 1), mouse('mouseReleased', x, y, 0),
  mouse('mousePressed', x, y, 1), mouse('mouseReleased', x, y, 0),
]);
const key = async (type, text) => send('Input.dispatchKeyEvent', {
  type, key: ' ', code: 'Space', text, unmodifiedText: text,
  windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32,
});
const shot = async (name, clip) => {
  const result = await send('Page.captureScreenshot', { format: 'png', ...(clip ? {clip} : {}) });
  const path = `${OUT}/${name}.png`;
  writeFileSync(path, Buffer.from(result.data, 'base64'));
  return path;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const detailShot = async name => {
  await evaluate('window.__gm.interface.root.active=false;window.__gm.overlay.node.active=false;true');
  await shot(name);
  await evaluate('window.__gm.interface.root.active=true;window.__gm.overlay.node.active=true;true');
};

await send('Page.enable');
await send('Runtime.enable');
await send('Page.addScriptToEvaluateOnNewDocument', {source:STARTUP_OBSERVER});
await send('Page.addScriptToEvaluateOnNewDocument', {source: `
  // Cocos 3.8 checks document.ontouchstart when registering touch input. Recent
  // desktop Chrome exposes emulated touch points without exposing this property.
  // Match the requested mobile device before the engine detects its capabilities.
  if(navigator.maxTouchPoints>0&&document.ontouchstart===undefined)document.ontouchstart=null;
  window.__qaAudioStarts=[];window.__qaAudioContexts=new Set();
  if(typeof AudioBufferSourceNode!=='undefined'){
    const original=AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start=function(...args){
      if(this.buffer){const data=this.buffer.getChannelData(0);let peak=0;for(let i=0;i<data.length;i+=31)peak=Math.max(peak,Math.abs(data[i]));
        window.__qaAudioStarts.push({duration:this.buffer.duration,peak});window.__qaAudioContexts.add(this.context);}
      return original.apply(this,args);
    };
  }`});
await send('Network.setUserAgentOverride', {userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 MicroMessenger/8.0.61'});
await send('Emulation.setDeviceMetricsOverride', {width:390,height:844,deviceScaleFactor:1,mobile:true});
await send('Emulation.setTouchEmulationEnabled', {enabled:false});
await send('Emulation.setTouchEmulationEnabled', {enabled:true,maxTouchPoints:5});
const beforeTimeOrigin = await evaluate('performance.timeOrigin');
const loadWait = new Promise((resolve) => { waiters.load = resolve; });
const navigationStartedAt = Date.now();
await send('Page.navigate', { url: GAME_URL });
await Promise.race([loadWait, sleep(20000)]);
await sleep(600);
let engineReady = false;
for (let i = 0; i < 60 && !engineReady; i++) {
  try {
    engineReady = await evaluate(`typeof System !== 'undefined' && performance.timeOrigin > ${beforeTimeOrigin}`);
  } catch { engineReady = false; }
  if (!engineReady) await sleep(400);
}
if (!engineReady) {
  const documentInfo = await evaluate('({url:location.href, title:document.title, body:document.body?.innerText?.slice(0,500), timeOrigin:performance.timeOrigin, system:typeof System})');
  throw new Error('engine bootstrap (System) never appeared on the fresh document: ' + JSON.stringify(documentInfo) + '\n' + browserErrors.join('\n'));
}

const attach = () => evaluate(`(async () => {
  const cc = await System.import('cc');
  const scene = cc.director.getScene();
  const canvas = scene ? scene.getChildByName('Canvas') : null;
  window.__gm = canvas ? canvas.components.find((c) => cc.js.getClassName(c) === 'GameMain') : null;
  return { scene: !!scene, canvas: !!canvas, gm: !!window.__gm };
})()`);
let attachInfo = await attach();
for (let i = 0; i < 60 && !attachInfo.gm; i++) {
  await sleep(500);
  attachInfo = await attach();
}
if (!attachInfo.gm) throw new Error('GameMain component was not attached to Canvas: ' + JSON.stringify(attachInfo) + '\n' + browserErrors.join('\n'));

let artReady = false;
for (let i = 0; i < 60 && !artReady; i++) {
  artReady = await evaluate('window.__gm.artReady === true');
  if (!artReady) await sleep(500);
}
if (!artReady) throw new Error('Art bundle did not load the background, character, bullets, and fish within 30 seconds');
const runtimeFingerprint = await evaluate('window.__gm.buildFingerprint');
if (runtimeFingerprint !== expectedFingerprint)
  throw new Error(`Chrome is running ${runtimeFingerprint}; expected ${expectedFingerprint}. Reopen the current build.`);
const startupMs = Date.now() - navigationStartedAt;

const rect = await evaluate(`(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
const fieldHeight = await evaluate('window.__gm.model.height');
const screenScale = rect.w / DESIGN_WIDTH;
const toScreen = (gx, gy) => [rect.x + (rect.w - DESIGN_WIDTH * screenScale) / 2 + gx * screenScale,
  rect.y + (rect.h - fieldHeight * screenScale) / 2 + (fieldHeight - gy) * screenScale];

const state = () => evaluate(`(() => { const m = window.__gm.model; return {
  started: m.started, paused: m.paused, elapsed: m.elapsed, score: m.score, energy: m.energy, workload: m.workload,
  shieldTime: m.shieldTime, invulnerableTime: m.invulnerableTime, gameOver: m.gameOver,
  wave: m.wave, waveState: m.waveState, waveTimer: m.waveTimer,
  combo: m.combo, comboMultiplier: m.comboMultiplier, maxCombo: m.maxCombo, bonusScore: m.bonusScore,
  gapClears: m.gapClears, breakLocks: m.breakLocks, leaveSlipCount: m.leaveSlipCount,
  player: { x: m.player.x, y: m.player.y }, bullets: m.bullets.length, orbs: m.skillOrbs.length,
  hint: window.__gm.hintText }; })()`);

if (process.argv.includes('--energy')) {
  await send('Emulation.setDeviceMetricsOverride', {width:390,height:844,deviceScaleFactor:3,mobile:true});
  await sleep(250);
  const capsule = await evaluate(ENERGY_FIXTURE);
  const checks = energyChecks(capsule);
  for (const [name, energy] of [['full',100],['partial',40],['empty',0]]) {
    await evaluate(`window.__gm.model.energy=${energy};window.__gm.draw();window.__gm.syncArt();true`);
    await shot(`energy-${name}-web`);
    const player = (await state()).player;
    const [x,y] = toScreen(player.x,player.y);
    await shot(`energy-${name}-web-detail`, {x:x-60,y:y-75,width:120,height:145,scale:2});
  }
  const report = {passed:Object.values(checks).every(Boolean),checks,capsule,browserErrors};
  writeFileSync(OUT+'/energy-web-result.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.passed,checks,browserErrors}));
  socket.close();
  if (!report.passed || browserErrors.length) process.exitCode=1;
} else {
const states = {};
states.startupFrames = await evaluate('window.__qaStartupFrames');
// Native pointer drag starts on the character and retains its initial offset.
const driveTo = async (target, stopOnPickup = false) => {
  const initial=await state(),origin=initial.player;
  await mouse('mousePressed',...toScreen(origin.x,origin.y),1);
  const dx=target.x-origin.x,dy=target.y-origin.y;
  for(let i=1;i<=12;i++) {
    const point={x:origin.x+dx*i/12,y:origin.y+dy*i/12};
    await mouse('mouseMoved',...toScreen(point.x,point.y),1);
    await sleep(20);
    if(stopOnPickup&&(await state()).energy!==initial.energy)break;
  }
  await mouse('mouseReleased',...toScreen(target.x,target.y),0);
};
states.firstEntry=await evaluate('({step:window.__gm.guide.step,revision:window.__gm.progress.profile.tutorialRevision,started:window.__gm.model.started,elapsed:window.__gm.model.elapsed})');
await evaluate(`(() => { const g=window.__gm;window.__qaProgressBackup=localStorage.getItem('off-work.progress.v1');
  g.progress.profile={version:1,tutorialCompleted:false,tutorialRevision:0,shieldHintSeen:false,soundEnabled:true,bestScore:0,bestSeconds:0,bestWave:0,runs:0};
  g.progress.save();g.audio.enabled=true;g.goHome();g.draw();return true;})()`);
// Test native touch before mixing mouse input into this CDP session.
// Touch dispatch requires the headless tab to own input focus after reloads.
await send('Page.bringToFront');
await send('Emulation.setTouchEmulationEnabled', {enabled:false});
await send('Emulation.setTouchEmulationEnabled', {enabled:true,maxTouchPoints:5});
await evaluate(`(()=>{const g=window.__gm,m=g.model;g.restart();g.guide.start(false);m.practiceProtected=false;m.bullets.length=0;m.skillOrbs.length=0;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;m.energy=100;g.draw();g.syncArt();return true;})()`);
const touchAvatarPoint=await evaluate('window.__gm.artHud.avatarPoint(window.__gm.model.height)');
const firstPlayer=(await state()).player;
const finger=(id,p)=>{const [x,y]=toScreen(p.x,p.y);return {id,x,y};};
const touches=async(type,points)=>{await send('Input.dispatchTouchEvent',{type,touchPoints:points});await sleep(80);};
const drag1={x:firstPlayer.x,y:firstPlayer.y},drag2={x:firstPlayer.x+25,y:firstPlayer.y+20},drag3={x:firstPlayer.x+65,y:firstPlayer.y+40};
await touches('touchStart',[finger(1,drag1)]);
await touches('touchMove',[finger(1,drag2)]);
await sleep(250);
states.stickInteraction=await evaluate('({dragging:window.__gm.dragging,player:{...window.__gm.model.player},joystickRemoved:!("joystick" in window.__gm)})');
await touches('touchStart',[finger(1,drag2),finger(2,touchAvatarPoint)]);
await touches('touchEnd',[finger(2,touchAvatarPoint)]);await sleep(100);
states.multiShield=await evaluate('({dragging:window.__gm.dragging,energy:window.__gm.model.energy,shield:window.__gm.model.shieldTime})');
await touches('touchMove',[finger(1,drag3)]);await sleep(250);
states.multiMove=await state();
await touches('touchEnd',[]);await sleep(80);
states.multiEnd=await evaluate('window.__gm.dragging');

// Reproduce the user's long stroke and reversal through native Cocos touch events.
await evaluate(`(()=>{const g=window.__gm,m=g.model;g.clearInput();m.movePlayer(360,m.height*0.35);
  m.invulnerableTime=999;m.bullets.length=0;m.skillOrbs.length=0;return true;})()`);
const turnOrigin={x:150,y:270},turnForward={x:510,y:270},turnReverse={x:430,y:270},turnCenter={x:454,y:270};
const turnState=()=>evaluate('({x:window.__gm.model.player.x,dragging:window.__gm.dragging})');
await touches('touchStart',[finger(3,turnOrigin)]);
await touches('touchMove',[finger(3,turnForward)]);await sleep(120);
states.nativeTurnForward=await turnState();
await touches('touchMove',[finger(3,turnReverse)]);await sleep(120);
states.nativeTurnReverse=await turnState();
await touches('touchMove',[finger(3,turnCenter)]);
states.nativeTurnCenter=await turnState();await sleep(120);
states.nativeTurnCenterWait=await turnState();
await touches('touchEnd',[]);
states.nativeTurnEnd=await turnState();

await evaluate('window.__gm.goHome();window.__gm.draw();true');

states.art = await evaluate(`(() => { const g = window.__gm; return {
  bundleReady: g.artReady, background: !!g.background.spriteFrame,
  character: !!g.playerSprite.spriteFrame, artCount: g.art.size,
  sourceFrame: g.background.spriteFrame?.name,
}; })()`);
const artShot = await shot('art-start');
const buttonPoint = name => evaluate(`(()=>{const g=window.__gm,b=g.interface.buttons[${JSON.stringify(name)}];return {x:360+b.x,y:g.model.height/2+g.interface.modal.position.y+b.y};})()`);
const clickButton = async name => { const p=await buttonPoint(name);await click(...toScreen(p.x,p.y));await sleep(120); };
const startPoint = await buttonPoint('primary');
const [startX, startY] = toScreen(startPoint.x, startPoint.y);
await click(startX, startY);
await sleep(150);
states.intro = await evaluate('({step:window.__gm.guide.step,title:window.__gm.interface.title.string,subtitle:window.__gm.interface.subtitle.string,body:window.__gm.interface.record.string,bodyVisible:window.__gm.interface.record.node.active,button:window.__gm.interface.primary.string,fish:window.__gm.model.skillOrbs[0],bullets:window.__gm.model.bullets.map(b=>({kind:b.kind,x:b.x,y:b.y})),elapsed:window.__gm.model.elapsed})');
await shot('tutorial-intro');
states.introSound=await evaluate('(()=>{const g=window.__gm,b=g.interface.buttons.sound;return {visible:g.interface.sound.node.active,action:g.interface.actionAt({x:360+b.x,y:g.model.height/2+g.interface.modal.position.y+b.y})};})()');
await sleep(350);
states.introWait = await evaluate('({elapsed:window.__gm.model.elapsed,bullets:window.__gm.model.bullets.map(b=>({kind:b.kind,x:b.x,y:b.y}))})');
await clickButton('primary');
await evaluate('window.__gm.appVisible=false;true');
const waitStep=async step=>{for(let i=0;i<200;i++){if(await evaluate(`window.__gm.guide.step===${JSON.stringify(step)}`))return;await sleep(60);}throw Error('Tutorial did not reach '+step);};
const readGuide=()=>evaluate(`(()=>{const g=window.__gm,m=g.model,u=g.interface;return {step:g.guide.step,energy:m.energy,workload:m.workload,shield:m.shieldTime,elapsed:m.elapsed,score:m.score,protected:m.practiceProtected,title:u.guideTitle.string,text:u.guideText.string,fish:m.skillOrbs[0],ai:m.aiPickups[0],bullets:m.bullets.length,achievement:u.rewardRoot.active,reward:u.rewardLabel.string,path:u.tutorialCueRoot.active,hand:u.tapHandRoot.active,completed:g.progress.profile.tutorialRevision===6};})()`);
states.afterStart=await state();states.guideStart=await readGuide();await shot('tutorial-dodge');
// A real model collision shows three slots and retries this lesson without recording a failed run.
states.practiceContact=await evaluate(`(()=>{const g=window.__gm,m=g.model,b=m.bullets[0];m.movePlayer(b.x,b.y);m.update(0);g.consumeEvents();g.draw();return {step:g.guide.step,workload:m.workload,gameOver:m.gameOver,score:m.score,runs:g.progress.profile.runs};})()`);
await shot('tutorial-retry');
await evaluate('window.__gm.appVisible=true;for(let i=0;i<21;i++)window.__gm.update(0.1);window.__gm.appVisible=false;true');
states.retry=await readGuide();
const beforeDrag=await state();
const [dragX,dragY]=toScreen(beforeDrag.player.x,beforeDrag.player.y);
await evaluate('window.__gm.appVisible=true;true');
await mouse('mousePressed',dragX,dragY,1);states.afterPress=await state();
for(let i=1;i<=12;i++){const p=toScreen(beforeDrag.player.x+240*i/12,beforeDrag.player.y+90*i/12);await mouse('mouseMoved',...p,1);await sleep(18);}
await mouse('mouseReleased',...toScreen(beforeDrag.player.x+240,beforeDrag.player.y+90),0);
states.afterDrag=await state();
await waitStep('dodge-reward');await evaluate('window.__gm.appVisible=false;true');
states.dodgeReward=await readGuide();await shot('tutorial-dodge-good');
await evaluate('window.__gm.appVisible=true;true');await waitStep('fish');
await evaluate('window.__gm.appVisible=false;true');states.fishPrompt=await readGuide();await shot('tutorial-fish-path');
const fish=states.fishPrompt.fish;
const rewardAudioBefore=await evaluate('window.__qaAudioStarts.length');
await evaluate('window.__gm.appVisible=true;true');
await driveTo(states.fishPrompt.fish,true);await waitStep('collect-reward');
await evaluate('window.__gm.appVisible=false;true');
states.fishReward=await readGuide();
states.rewardPlacement=await evaluate('({x:window.__gm.interface.rewardRoot.position.x+360,y:window.__gm.interface.rewardRoot.position.y+window.__gm.model.height/2,cat:{...window.__gm.model.player}})');
await shot('tutorial-fish-good');
await evaluate('window.__gm.appVisible=true;true');await waitStep('shield');
await evaluate('window.__gm.appVisible=false;true');states.shieldPrompt=await readGuide();await shot('tutorial-double-tap-hand');
await evaluate('window.__gm.appVisible=true;true');
const shieldPlayer=(await state()).player;await doubleClick(...toScreen(shieldPlayer.x,shieldPlayer.y));
await waitStep('shield-reward');await evaluate('window.__gm.appVisible=false;true');
states.shieldReward=await readGuide();await shot('tutorial-shield-good');
await evaluate('window.__gm.appVisible=true;true');await waitStep('shield-active');
states.shieldActive=await readGuide();await shot('tutorial-immunity-active');
await waitStep('agent');await evaluate('window.__gm.appVisible=false;true');
states.agentPrompt=await readGuide();await shot('tutorial-agent-entry');
// Let the edge arrival enter before using an actual drag to collect it.
await evaluate('window.__gm.appVisible=true;true');await sleep(2400);
const agent=await evaluate('window.__gm.model.aiPickups[0]');await driveTo(agent);
await waitStep('agent-reward');await evaluate('window.__gm.appVisible=false;true');
states.agentReward=await readGuide();await shot('tutorial-agent-good');
await evaluate('window.__gm.appVisible=true;true');await waitStep('ready');
states.guideReady=await readGuide();
states.readyCard=await evaluate('({title:window.__gm.interface.title.string,subtitle:window.__gm.interface.subtitle.string,bodyVisible:window.__gm.interface.record.node.active,soundVisible:window.__gm.interface.sound.node.active,button:window.__gm.interface.primary.string})');
await shot('tutorial-ready');await sleep(250);states.readyWait=await state();
await clickButton('primary');
states.guideComplete=await evaluate('({step:window.__gm.guide.step,protected:window.__gm.model.practiceProtected,completed:window.__gm.progress.profile.tutorialCompleted,seen:window.__gm.progress.profile.shieldHintSeen,workload:window.__gm.model.workload,shield:window.__gm.model.shieldTime,energy:window.__gm.model.energy,visible:window.__gm.interface.guideRoot.active})');
// Controlled UI/gesture checks must not end accidentally while screenshots are captured.
await evaluate('window.__gm.model.invulnerableTime=999;true');
await shot('tutorial-complete');
states.upperLimit=await evaluate(`(()=>{const g=window.__gm,m=g.model;window.__normalStartPlayer={...m.player};
  m.bullets.length=0;m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  m.movePlayer(360,99999);g.syncArt();return {y:m.player.y,headTop:m.player.y+${PLAYER_VISUAL_TOP}};})()`);
await shot('upper-movement-limit');
await driveTo({x:360,y:states.upperLimit.y-40});
states.upperDrag=await state();
await evaluate('window.__gm.model.movePlayer(window.__normalStartPlayer.x,window.__normalStartPlayer.y);true');
const avatarPoint=await evaluate('window.__gm.artHud.avatarPoint(window.__gm.model.height)');
// A separate unseen-coach fixture tests five normal pickups after the clean tutorial reset.
await evaluate('window.__gm.shieldCoach.reset(false);window.__gm.progress.profile.shieldHintSeen=false;window.__gm.model.bullets.length=0;window.__gm.model.messageTimer=window.__gm.model.requirementTimer=window.__gm.model.wallTimer=window.__gm.model.skillTimer=999;true');
states.playPickups=[];
for(let index=0;index<5;index++){
  const fish=await evaluate(`(()=>{const m=window.__gm.model;const f={kind:'skill',x:m.player.x+65,y:m.player.y+80,radius:17,alive:true,pulse:0};m.skillOrbs.push(f);return f;})()`);
  const p=(await state()).player;
  await driveTo(fish,true);await sleep(120);
  states.playPickups.push(await evaluate('window.__gm.model.energy'));
}
states.fullReminder=await evaluate('({active:window.__gm.shieldCoach.active,visible:window.__gm.interface.guideRoot.active,seen:window.__gm.progress.profile.shieldHintSeen,paused:window.__gm.model.paused,elapsed:window.__gm.model.elapsed,score:window.__gm.model.score})');
await shot('light-guide-shield-reminder');
await sleep(250);
states.immunityReady=await evaluate('({elapsed:window.__gm.model.elapsed,active:window.__gm.shieldCoach.active,avatar:window.__gm.artHud.readyEffects.node.active,badgeVisible:window.__gm.immunityLabel.node.active,dragging:window.__gm.dragging})');
const fullPlayer=(await state()).player;
await doubleClick(...toScreen(fullPlayer.x,fullPlayer.y));await sleep(150);
states.firstDoubleTap=await evaluate('({energy:window.__gm.model.energy,shield:window.__gm.model.shieldTime,hintActive:window.__gm.shieldCoach.active})');
states.immunityActive=await evaluate('(()=>{const g=window.__gm;g.model.invulnerableTime=0;g.draw();g.syncArt();return {seen:g.progress.profile.shieldHintSeen,badgeVisible:g.immunityLabel.node.active,copies:g.immunityCopies.filter(s=>s.node.active).length,readyEffects:g.artHud.readyEffects.node.active};})()');
await shot('work-immunity-active');

// The artwork's pause circle must freeze the live model and resume without a jump.
const [pauseX, pauseY] = toScreen(67 * 2 / 3, fieldHeight - 309 * 2 / 3);
await click(pauseX, pauseY);
await sleep(100);
states.paused = await state();
await sleep(400);
states.pauseFrozen = await state();
await click(pauseX, pauseY);
await sleep(150);
states.resume3=await evaluate('({paused:window.__gm.model.paused,remaining:window.__gm.resume.remaining,label:window.__gm.interface.countdown.string,elapsed:window.__gm.model.elapsed,shield:window.__gm.model.shieldTime})');
// Sample the live digits before taking an expensive screenshot. Screenshot time
// varies with machine load and must not consume the interval being asserted.
const waitForResumeDigit = async digit => {
  for(let attempt=0;attempt<60;attempt++) {
    const sample=await evaluate('({paused:window.__gm.model.paused,label:window.__gm.interface.countdown.string,elapsed:window.__gm.model.elapsed,shield:window.__gm.model.shieldTime})');
    if(sample.label===digit||!sample.paused)return sample;
    await sleep(50);
  }
  throw new Error('Resume digit did not appear: '+digit);
};
states.resume2=await waitForResumeDigit('2');
states.resume1=await waitForResumeDigit('1');
await shot('detail-countdown');
await sleep(1100);
states.resumed = await state();

// Inspect actual UI strings and filled artwork slots after replacing printed samples.
await evaluate(`(() => { const m = window.__gm.model; m.elapsed = 155; m.score = m.realtimeScore = 12580;
  m.workload = 1; m.energy = 60; m.paused = true; window.__gm.draw(); return true; })()`);
states.hud = await evaluate(`(() => { const h = window.__gm.artHud; return {
  time: h.time.string, score: h.score.string, segments: h.chargeSegments, oldRows: h.root.children.some(n => ['FishCount','WaveStatus'].includes(n.name)),
  filled: h.slots.filter(s => s.spriteFrame === h.filledSlot).length,
  avatarSize: h.portrait.node.getComponent('cc.UITransform').width,
  workloadSize: {width:h.panels.workload.sprite.node.getComponent('cc.UITransform').width,height:h.panels.workload.sprite.node.getComponent('cc.UITransform').height},
  fishGlow: !!window.__gm.fishGlow,
  atlasFrames: window.__gm.atlasFrames.length,
  playerSize: { width: window.__gm.playerSprite.node.getComponent('cc.UITransform').width,
    height: window.__gm.playerSprite.node.getComponent('cc.UITransform').height } }; })()`);
await evaluate(`(() => { const m = window.__gm.model; m.paused = false; m.workload = 0; m.elapsed = 1;
  m.score = m.realtimeScore = 10; return true; })()`);

states.ringPickups = await evaluate(`(()=>{const g=window.__gm,m=g.model;
  m.bullets.length=0;m.skillOrbs.length=0;m.energy=0;m.shieldTime=0;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  const steps=[];g.draw();steps.push(g.artHud.chargeSegments);
  for(let i=0;i<5;i++){m.skillOrbs.push({kind:'skill',x:m.player.x,y:m.player.y,radius:15,alive:true,pulse:0});m.update(0.01);g.draw();steps.push(g.artHud.chargeSegments);}
  return steps;})()`);
await shot('ring-full');

await evaluate(`(() => { const m = window.__gm.model;
  m.bullets.length = 0; m.skillOrbs.length = 0;
  m.messageTimer = m.requirementTimer = m.wallTimer = m.skillTimer = 999;
  m.energy = 100; m.shieldTime = 0; m.invulnerableTime = 0; return true; })()`);
const ready = await state();
const [playerX, playerY] = toScreen(ready.player.x, ready.player.y);
await doubleClick(playerX, playerY);
await sleep(120);
states.afterDoubleClick = await state();
const shieldShot = await shot('shield');
states.shieldRing = await evaluate('(()=>{const g=window.__gm;g.draw();return {segments:g.artHud.chargeSegments,fraction:g.artHud.shieldFraction,remaining:g.model.shieldTime};})()');

await evaluate(`(() => { const m = window.__gm.model;
  m.bullets.length = 0; m.skillOrbs.length = 0; m.energy = 0; m.workload = 0;
  m.invulnerableTime = 0; m.shieldTime = 1.5; const p = m.player;
  m.bullets.push({ kind: 'message', x: p.x, y: p.y, vx: 0, vy: 0, radius: 14, alive: true, grazed: false, state: 'cruise', update() {} });
  return true; })()`);
await sleep(120);
states.shieldCollision = await state();

await evaluate(`(() => { const m = window.__gm.model;
  m.bullets.length = 0; m.skillOrbs.length = 0; m.energy = 0; m.shieldTime = 1.5;
  const p = m.player;
  m.skillOrbs.push({ x: p.x, y: p.y, radius: 15, pulse: 0, alive: true }); return true; })()`);
await sleep(120);
states.shieldOrb = await state();

await evaluate(`(() => { const m = window.__gm.model;
  m.bullets.length = 0; m.skillOrbs.length = 0; m.shieldTime = 0; m.workload = 2; m.invulnerableTime = 0;
  const p = m.player;
  m.bullets.push({ kind: 'message', x: p.x, y: p.y, vx: 0, vy: 0, radius: 14, alive: true, grazed: false, state: 'cruise', update() {} });
  return true; })()`);
await sleep(150);
states.afterThirdHit = await state();
await sleep(550);
states.result = await evaluate(`(()=>{const g=window.__gm;return {title:g.interface.title.string,score:g.interface.score.string,
  result:g.settlement,profile:{...g.progress.profile},goal:g.interface.goal.string};})()`);
await sleep(180);
states.settledOnce = await evaluate('window.__gm.progress.profile.runs');
const overShot = await shot('game-over');

await click(...toScreen(30,60));await sleep(80);
states.outsideResult = await state();
await clickButton('primary');
await sleep(150);
states.afterRestart = await state();

await evaluate(`(() => { const m = window.__gm.model; m.energy = 100; m.shieldTime = 0;
  m.messageTimer = m.requirementTimer = m.wallTimer = m.skillTimer = 999; return true; })()`);
await key('rawKeyDown', ' ');
await key('keyUp', undefined);
await sleep(120);
states.afterSpace = await state();

// === 波次系统 ===
await evaluate(`(() => { const m = window.__gm.model; m.reset(); m.invulnerableTime = 999;
  m.bullets.push({ kind: 'message', x: 360, y: 60, vx: 0, vy: -20, radius: 14, alive: true, grazed: false, state: 'cruise', senseRadius: 0,
    update(dt) { this.y -= 20 * dt; } });
  m.waveTimer = m.config.duration - 0.1; return true; })()`);
await sleep(350);
states.waveTransition = await state();
states.waveNotice = await evaluate("({removed:!window.__gm.node.getChildByName('WaveNotice')&&!window.__gm.node.getChildByName('WaveFolderNote')})");
const transitionShot = await shot('wave-transition');
await sleep(900);
states.waveTwo = await state();

await evaluate(`(() => { const m = window.__gm.model; m.wave = 3; m.waveTimer = 0; m.waveState = 'running'; m.invulnerableTime = 999;
  m.messageTimer = 0.1; m.requirementTimer = 0.1; m.wallTimer = 0.1; m.skillTimer = 0.1; return true; })()`);
await sleep(4500);
states.natural = await evaluate(`(() => { const m = window.__gm.model; const kinds = {};
  for (const b of m.bullets) kinds[b.kind] = (kinds[b.kind] ?? 0) + 1;
  return { elapsed: m.elapsed, wave: m.wave, gameOver: m.gameOver, workload: m.workload, kinds, orbs: m.skillOrbs.length,
    bullets: m.bullets.length, visibleBulletSprites: window.__gm.bulletSprites.filter((s) => s.node.active && s.spriteFrame).length,
    visibleFishSprites: window.__gm.fishSprites.filter((s) => s.node.active && s.spriteFrame).length,
    finite: m.bullets.every((b) => Number.isFinite(b.x) && Number.isFinite(b.y)) }; })()`);
const naturalShot = await shot('natural-spawn');

// Render real top spawns in the office header, before they reach the old HUD mask.
states.topEntry = await evaluate(`(() => { const g=window.__gm,m=g.model;m.paused=true;m.bullets.length=0;m.walls.length=0;m.skillOrbs.length=0;
  m.wave=3;m.messageTimer=m.wallTimer=0;m.requirementTimer=m.skillTimer=999;m.spawn(0,m.config);
  m.messageTimer=m.wallTimer=999;g.visualDt=0;g.draw();g.syncArt();
  const f=g.bulletLayer.getComponent('cc.UITransform');return {spawnY:m.bullets.map(b=>b.y),height:m.height,
    clipHeight:f.height,anchorY:f.anchorPoint.y,hudAbove:g.artHud.root.getSiblingIndex()>g.bulletLayer.getSiblingIndex()};})()`);
const topClip={x:rect.x,y:rect.y+1,width:rect.w,height:rect.h*130/fieldHeight,scale:1};
const topBefore=await send('Page.captureScreenshot',{format:'png',clip:topClip});
await evaluate(`(()=>{const g=window.__gm,m=g.model;m.paused=false;
  for(let frame=0;frame<12;frame++)m.update(0.05);m.paused=true;g.visualDt=0;g.draw();g.syncArt();return true;})()`);
const topAfter=await send('Page.captureScreenshot',{format:'png',clip:topClip});
writeFileSync(OUT+'/top-edge-entry.png',Buffer.from(topAfter.data,'base64'));
states.topEntry.renderChanged=topBefore.data!==topAfter.data;
states.topEntry.entered=await evaluate('window.__gm.model.bullets.every(b=>b.y<window.__gm.model.height&&b.y>window.__gm.model.height-280)');
await evaluate('window.__gm.model.paused=false;true');

await evaluate(`(() => { const m = window.__gm.model; m.wave = 5; m.waveTimer = 0; m.waveState = 'running';
  m.walls.length = 0; m.wallTimer = 0.05; return true; })()`);
await sleep(350);
states.wallCheck = await evaluate(`(() => { const m = window.__gm.model; let folder = 0;
  for (const b of m.bullets) if (b.kind === 'folder') folder += 1;
  return { walls: m.walls.length, folder }; })()`);

await evaluate(`(() => { const m = window.__gm.model; m.reset(); m.invulnerableTime = 999; m.bullets.length = 0;
  const p = m.player;
  m.bullets.push({ kind: 'message', x: p.x + 40, y: p.y, vx: 0, vy: 0, radius: 15, alive: true, grazed: false,
    state: 'cruise', senseRadius: 0, update() {} });
  m.messageTimer = m.requirementTimer = m.wallTimer = m.skillTimer = 999; return true; })()`);
await sleep(150);
states.graze = await state();

await evaluate(`(() => { const m = window.__gm.model; m.bullets.length = 0; m.invulnerableTime = 999;
  const p = m.player;
  m.bullets.push({ kind: 'message', x: p.x + 300, y: p.y, vx: 0, vy: 0, radius: 15, alive: true, grazed: false,
    state: 'cruise', senseRadius: 0, update() {} });
  m.leaveSlips.push({ kind: 'leave', x: p.x, y: p.y, radius: 16, alive: true, life: 12, spin: 0 }); return true; })()`);
await sleep(150);
states.leaveSlip = await state();

await evaluate(`(() => { const m = window.__gm.model; const p = m.player;
  m.leaveSlips.push({ kind: 'leave', x: p.x + 150, y: p.y + 60, radius: 16, alive: true, life: 12, spin: 0 }); return true; })()`);
await sleep(220);
const leaveShot = await shot('leave-slip');

await evaluate(`(() => { const m = window.__gm.model; m.reset(); m.invulnerableTime = 999; m.wave = 3; m.waveTimer = 59.9; return true; })()`);
await sleep(1400);
states.hardStep = await state();

// Short charge and dragging away from the button must not consume a shield.
await evaluate('window.__gm.model.energy=80;window.__gm.model.shieldTime=0;true');
await click(...toScreen(avatarPoint.x,avatarPoint.y));await sleep(100);
states.shortCharge=await state();
await evaluate('window.__gm.model.energy=100;true');
await mouse('mousePressed',...toScreen(avatarPoint.x,avatarPoint.y),1);
await mouse('mouseMoved',...toScreen(avatarPoint.x-100,avatarPoint.y-100),1);
await mouse('mouseReleased',...toScreen(avatarPoint.x-100,avatarPoint.y-100),0);await sleep(100);
states.cancelAvatar=await state();

// Exercise distinct visual feedback in the running renderer, then freeze for screenshots.
states.damageFeedback=await evaluate(`(()=>{const g=window.__gm,m=g.model;g.restart();m.bullets.length=0;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  m.bullets.push({kind:'message',x:m.player.x,y:m.player.y,vx:0,vy:0,radius:15,alive:true,grazed:false,state:'cruise',update(){}});
  g.update(0.06);m.paused=true;m.invulnerableTime=0.85;g.visualDt=0;g.draw();g.syncArt();
  return {workload:m.workload,catY:g.playerSprite.node.scale.y,slot:g.artHud.slots[0].node.scale.x,red:g.hitFlash,green:g.shieldBlockTime};})()`);
await detailShot('detail-damage');
states.blinkFrames=await evaluate(`(()=>{const g=window.__gm,m=g.model;const frames=[];
  for(const time of [0,0.95,0.85,0.75,0.65,0.55,0.45,0.35,0.25,0.15,0.05]){m.invulnerableTime=time;g.syncArt();frames.push({time,cat:g.playerSprite.node.active,shadow:g.playerShadow.node.active});}return frames;})()`);
states.blockFeedback=await evaluate(`(()=>{const g=window.__gm,m=g.model;g.restart();m.bullets.length=0;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;m.shieldTime=2;
  m.bullets.push({kind:'message',x:m.player.x+13,y:m.player.y,vx:0,vy:0,radius:15,alive:true,grazed:false,state:'cruise',update(){}});
  g.update(0.06);m.paused=true;g.visualDt=0;g.draw();g.syncArt();return {workload:m.workload,bullets:m.bullets.length,
  catY:g.playerSprite.node.scale.y,slot:g.artHud.slots[0].node.scale.x,red:g.hitFlash,green:g.shieldBlockTime};})()`);
await detailShot('detail-shield-block');
states.fullFish=await evaluate(`(()=>{const g=window.__gm,m=g.model;g.restart();m.bullets.length=0;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;m.energy=100;
  m.skillOrbs.push({kind:'skill',x:m.player.x,y:m.player.y,radius:17,alive:true,pulse:0});g.update(0.02);
  const full={energy:m.energy,fish:m.skillOrbs.length,flights:g.pickupFlights.filter(f=>f.life>0).length};
  m.energy=80;m.skillOrbs.push({kind:'skill',x:m.player.x,y:m.player.y,radius:17,alive:true,pulse:0});g.update(0.02);m.paused=true;const flight=g.pickupFlights.find(f=>f.life>0),life=flight.life;
  g.update(0.4);return {full,picked:m.skillOrbs.length,segment:flight.segment,life,pausedLife:flight.life};})()`);
await evaluate('window.__gm.model.paused=false;true');await sleep(200);
await evaluate('window.__gm.model.paused=true;true');await detailShot('detail-pickup-flight');
// Sample the real arrival frame before its 0.3s pulse expires; host scheduling
// can otherwise miss the entire flash between separate CDP calls.
states.flightArrival=await evaluate(`(()=>{const g=window.__gm,m=g.model;m.paused=false;
  let steps=0;while(g.pickupFlights.some(f=>f.life>0)&&steps++<60)g.update(1/60);
  m.paused=true;return {flights:g.pickupFlights.filter(f=>f.life>0).length,flash:g.artHud.chargeFlashes[4],energy:m.energy};})()`);

states.bulletCues=await evaluate(`(()=>{const g=window.__gm,m=g.model;g.restart();m.wave=3;m.invulnerableTime=999;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  const requirement=m.bullets[0];m.bullets.length=0;requirement.x=180;requirement.y=800;requirement.turnTimer=0.01;requirement.random=()=>0.8;m.bullets.push(requirement);
  m.player.x=360;m.player.y=350;m.messageTimer=0;m.spawn(0,m.config);m.messageTimer=999;const message=m.bullets.find(b=>b.kind==='message');
  message.x=480;message.y=420;message.vx=-40;message.vy=-80;m.spawnWall(m.config);
  for(const orb of m.folderWalls[0].orbs)orb.y=700;g.update(0.04);g.update(0.05);m.paused=true;m.invulnerableTime=0;g.visualDt=0;g.draw();g.syncArt();
  const index=m.bullets.indexOf(requirement),mi=m.bullets.indexOf(message);return {homing:message.state,
    trail:g.bulletCues.node.active,scale:g.bulletSprites[mi].node.scale.x,tilt:g.bulletSprites[index].node.angle,gapBordersRemoved:!g.bulletLayer.getChildByName('FolderGapEdges'),walls:m.folderWalls.length};})()`);
await detailShot('detail-bullet-cues');

const eyeTarget=await evaluate(`(()=>{const g=window.__gm,m=g.model;const b=m.bullets.find(b=>b.kind==='folder'&&b.x>100&&b.x<600);
  g.eyePhase.set(b,0);g.animationClock=0;g.interface.root.active=false;g.overlay.node.active=false;g.syncArt();return {x:b.x,y:b.y};})()`);
const [eyeX,eyeY]=toScreen(eyeTarget.x,eyeTarget.y);
const eyeClip={x:eyeX-32*screenScale,y:eyeY-26*screenScale,width:64*screenScale,height:52*screenScale,scale:4};
await sleep(50);const openEye=await send('Page.captureScreenshot',{format:'png',clip:eyeClip});
writeFileSync(OUT+'/light-guide-eyes-open.png',Buffer.from(openEye.data,'base64'));
await sleep(250);const frozenEye=await send('Page.captureScreenshot',{format:'png',clip:eyeClip});
await evaluate('window.__gm.animationClock=3.51;window.__gm.syncArt();true');await sleep(50);
const squintEye=await send('Page.captureScreenshot',{format:'png',clip:eyeClip});
writeFileSync(OUT+'/light-guide-eyes-squint.png',Buffer.from(squintEye.data,'base64'));
states.eyes=await evaluate('({visible:window.__gm.bulletEyes.filter(g=>g.node.parent.active).length,bullets:window.__gm.model.bullets.length})');
states.eyes.changed=openEye.data!==squintEye.data;states.eyes.frozen=openEye.data===frozenEye.data;
await evaluate('window.__gm.interface.root.active=true;window.__gm.overlay.node.active=true;true');

// Background return keeps the pause menu; re-hiding cancels an unfinished countdown.
await evaluate('window.__gm.model.paused=false;window.__gm.onGameHide();window.__gm.onGameShow();true');
states.backgroundPause=await evaluate('({paused:window.__gm.model.paused,countdown:window.__gm.resume.active,elapsed:window.__gm.model.elapsed})');
await clickButton('primary');await sleep(200);
const blockedPlayer=(await state()).player;
await key('keyDown',' ');await key('keyUp','');
await click(...toScreen(avatarPoint.x,avatarPoint.y));
states.countdownInput=await evaluate('({paused:window.__gm.model.paused,countdown:window.__gm.resume.active,player:{...window.__gm.model.player},energy:window.__gm.model.energy,shield:window.__gm.model.shieldTime})');
await evaluate('window.__gm.onGameHide();window.__gm.onGameShow();true');await sleep(300);
states.cancelledResume=await evaluate('({paused:window.__gm.model.paused,countdown:window.__gm.resume.active,elapsed:window.__gm.model.elapsed})');
await clickButton('primary');await sleep(3250);
states.backgroundResume=await state();
states.resetFeedback=await evaluate(`(()=>{const g=window.__gm;g.restart();return {flights:g.pickupFlights.filter(f=>f.life>0).length,
  hit:g.playerHitTime,block:g.shieldBlockTime,countdown:g.resume.active,charge:g.artHud.chargeFlashes.some(x=>x>0),workload:g.artHud.workloadPulses.some(x=>x>0)};})()`);

// Verify decoded, non-silent audio is sent to a running browser audio context.
states.audio=await evaluate(`(()=>{const g=window.__gm;return {clips:[...g.audio.clips].map(([name,clip])=>({name,duration:clip.getDuration()})),
  starts:window.__qaAudioStarts,contexts:[...window.__qaAudioContexts].map(c=>c.state)};})()`);
await click(pauseX,pauseY);await sleep(100);
await clickButton('sound');
const mutedCount=await evaluate('window.__qaAudioStarts.length');
await evaluate("window.__gm.audio.play('pickup');window.__gm.audio.play('shield');true");await sleep(150);
states.muted=await evaluate(`({enabled:window.__gm.audio.enabled,persisted:new window.__gm.progress.constructor().profile.soundEnabled,starts:window.__qaAudioStarts.length})`);
await clickButton('sound');await sleep(150);
states.unmuted=await evaluate(`({enabled:window.__gm.audio.enabled,persisted:new window.__gm.progress.constructor().profile.soundEnabled,starts:window.__qaAudioStarts.length})`);
states.music={};
for(const step of AUDIO_STEPS) {
  await evaluate(step.body);await sleep(step.wait);
  states.music[step.name]=await evaluate(AUDIO_SNAPSHOT);
}
states.supplementAudio=await evaluate(SUPPLEMENT_AUDIO_FIXTURE);
await sleep(200); // Cocos schedules decoded one-shots through promise callbacks.
states.supplementAudio.buffers=await evaluate('window.__qaAudioStarts.slice(window.__qaSupplementAudioStart)');
await evaluate('window.__gm.restart();window.__gm.guide.start(false);window.__gm.model.paused=true;window.__gm.syncMusic();true');
 await evaluate('window.__gm.model.score=window.__gm.progress.profile.bestScore+1000;true');
 states.exitBefore=await evaluate('({runs:window.__gm.progress.profile.runs,best:window.__gm.progress.profile.bestScore,score:window.__gm.model.score})');
await clickButton('secondary');
 states.exitPrompt=await evaluate("({open:window.__gm.interface.exitOpen,copy:window.__gm.interface.exitRoot.getChildByName('ExitDialog').getChildByName('ExitExplanation').getComponent('cc.Label').string})");
 const cancelPoint=await evaluate('({x:360+window.__gm.interface.exitCancelBox.x,y:window.__gm.model.height/2+window.__gm.interface.exitCancelBox.y+window.__gm.interface.safeCenter})');
 await click(...toScreen(cancelPoint.x,cancelPoint.y));
 states.exitCancelled=await evaluate('({open:window.__gm.interface.exitOpen,runs:window.__gm.progress.profile.runs,started:window.__gm.model.started})');
 await clickButton('secondary');
const confirmPoint=await evaluate('({x:360+window.__gm.interface.exitConfirmBox.x,y:window.__gm.model.height/2+window.__gm.interface.exitConfirmBox.y+window.__gm.interface.safeCenter})');
await click(...toScreen(confirmPoint.x,confirmPoint.y));
await sleep(100);
 states.homeRecord=await evaluate('({started:window.__gm.model.started,record:window.__gm.interface.record.string,runs:window.__gm.progress.profile.runs,best:window.__gm.progress.profile.bestScore})');
await clickButton('secondary');
states.replayGuide=await evaluate('({step:window.__gm.guide.step,protected:window.__gm.model.practiceProtected})');
await clickButton('primary');
await click(...toScreen(626,151));await sleep(150);
states.noSkipGuide=await evaluate('({step:window.__gm.guide.step,protected:window.__gm.model.practiceProtected,action:window.__gm.interface.actionAt({x:626,y:151}),exists:window.__gm.interface.guideRoot.getChildByName("SkipGuide")!==null})');
await evaluate('window.__gm.goHome();window.__gm.draw();true');
states.persisted=await evaluate('new window.__gm.progress.constructor().profile');

states.joystick = await evaluate(JOYSTICK_FIXTURE);
states.presentationRevision = await evaluate(PRESENTATION_FIXTURE);
await shot('presentation-revision-web');
await evaluate('window.__gm.interface.root.active=true;window.__gm.overlay.node.active=true;true');
states.bodySpring = await evaluate(SPRING_FIXTURE);
await shot('body-spring-web');
await evaluate('window.__gm.interface.root.active=true;window.__gm.overlay.node.active=true;true');
states.pressure = await evaluate(PRESSURE_FIXTURE);
states.energyCapsule = await evaluate(ENERGY_FIXTURE);
await shot('energy-capsule-web');
await evaluate('window.__gm.interface.root.active=true;window.__gm.overlay.node.active=true;true');
states.newPickups = await evaluate(`(() => {
  const g=window.__gm,m=g.model;g.restart();g.guide.start(false);m.practiceProtected=false;
  m.bullets.length=0;m.skillOrbs.length=0;m.leaveSlips.length=0;m.aiPickups.length=0;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  m.movePlayer(360,280);m.workload=2;m.invulnerableTime=0;
  m.leaveSlips.push({kind:'leave',x:210,y:550,radius:16,alive:true,life:12,spin:0.5});
  m.aiPickups.push({kind:'helper',x:340,y:650,vx:76,vy:0,radius:27,alive:true,life:11,phase:0.2});
  m.aiPickups.push({kind:'agent',x:520,y:740,vx:190,vy:0,radius:27,alive:true,life:8,phase:0.2});
  m.skillOrbs.push({kind:'skill',x:450,y:420,radius:16,alive:true,pulse:1});
  m.paused=true;
  g.draw();g.syncArt();
  const angle=g.aiSprites[0].left.node.angle;
  m.aiPickups[0].phase+=0.12;g.syncArt();
  return {leaveArt:g.leaveSprites[0].node.active&&!!g.leaveSprites[0].spriteFrame,
    aiArt:g.aiSprites.length>=2&&g.aiSprites[0].node.active&&g.aiSprites[1].node.active,
    wingFlaps:Math.abs(g.aiSprites[0].left.node.angle-angle)>1,
    fishBobs:Math.abs(g.fishSprites[0].node.position.y-(420-m.height/2))>1,
    visibleScales:[g.leaveSprites[0].node,g.fishSprites[0].node,g.aiSprites[0].core.node,g.aiSprites[1].core.node]
      .every(node=>Number.isFinite(node.scale.x)&&Number.isFinite(node.scale.y)&&node.scale.y>0),
    laughLoaded:g.audio.clips.has('laugh')};
})()`);
await detailShot('new-pickups');

// Capture the actual generated field with the character visible, without the QA
// invulnerability blink. This only freezes this test instance while taking a shot.
await evaluate(`(() => { const g=window.__gm,m=g.model; g.restart(); m.wave=3; m.invulnerableTime=999;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=0.1; return true; })()`);
await sleep(6000);
await evaluate(`(() => { const g=window.__gm,m=g.model; window.__savedModelUpdate=m.update;
  m.update=()=>{};m.invulnerableTime=0;g.draw();g.syncArt();return true;})()`);
const gameplayShot = await shot('gameplay');
await evaluate(`(() => { const m=window.__gm.model;m.update=window.__savedModelUpdate;window.__gm.restart();m.started=false;return true;})()`);
// Resize the live Cocos viewport; verify full coverage and all HUD panels in bounds.
states.screens = [];
for (const [width,height] of [[375,667],[390,844],[430,932],[360,900],[768,1024]]) {
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await sleep(400);
  states.screens.push(await evaluate(`(async()=>{const cc=await System.import('cc'),g=window.__gm;
    const rect=document.querySelector('canvas').getBoundingClientRect(),v=cc.view.getViewportRect();
    const b=g.background.getComponent(cc.UITransform),p=g.background.node.position,h=g.model.height,f=g.bulletLayer.getComponent(cc.UITransform);
    return {width:innerWidth,height:innerHeight,canvas:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},
      viewport:{x:v.x,y:v.y}, fieldHeight:h, bulletClip:f.width===720&&f.height===h&&f.anchorPoint.x===0.5&&f.anchorPoint.y===0.5,
      upperHeadGap:(()=>{const old={...g.model.player};g.model.movePlayer(360,99999);const gap=h-g.model.player.y-${PLAYER_VISUAL_TOP}-${HUD_BOTTOM};g.model.player.x=old.x;g.model.player.y=old.y;return gap;})(),
      coverage:b.width>=720-0.1&&p.y+b.height/2>=h/2-0.1&&p.y-b.height/2<=-h/2+0.1,
      hud:Object.values(g.artHud.panels).every(panel=>{const r=panel.sprite.node.getComponent(cc.UITransform).getBoundingBoxToWorld();
        return r.x>=-0.1&&r.y>=-0.1&&r.x+r.width<=720+0.1&&r.y+r.height<=h+0.1;})};})()`));
  await shot('screen-'+width+'x'+height);
}
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
await sleep(300);
await evaluate(`(()=>{const g=window.__gm,raw=window.__qaProgressBackup;
  if(raw===null)localStorage.removeItem('off-work.progress.v1');else localStorage.setItem('off-work.progress.v1',raw);
  g.progress.profile=new g.progress.constructor().profile;g.audio.enabled=g.progress.profile.soundEnabled;g.goHome();g.draw();return true;})()`);
states.portrait = await evaluate(PORTRAIT_FIXTURE);
states.lifecycle = await evaluate(`(function(){const g=window.__gm,m=g.model;return ${LIFECYCLE_FIXTURE}})()`);
socket.close();
const checks = {
  ...startupChecks(states.startupFrames),
  ...lifecycleChecks(states.lifecycle),
  native_drag_has_no_joystick: states.stickInteraction.dragging&&states.stickInteraction.joystickRemoved,
  native_long_drag_tracks_finger: Math.abs(states.nativeTurnForward.x-(DESIGN_WIDTH-PLAYER_EDGE_MARGIN))<3,
  native_long_drag_reverses_immediately: Math.abs(states.nativeTurnReverse.x-640)<3,
  native_drag_stops_on_release: Math.abs(states.nativeTurnCenterWait.x-states.nativeTurnCenter.x)<1&&!states.nativeTurnEnd.dragging,
  intro_sound_button_and_hitbox_removed: !states.introSound.visible&&states.introSound.action===null,
  achievement_near_pickup_without_covering_cat: Math.abs(states.rewardPlacement.y-states.rewardPlacement.cat.y)>100&&Math.abs(states.rewardPlacement.y-fish.y)<180&&Math.abs(states.rewardPlacement.x-fish.x)<201,
  full_charge_keeps_gameplay_running: states.immunityReady.elapsed>states.fullReminder.elapsed&&!states.fullReminder.paused,
  ready_gold_capsule_without_body_banner: states.immunityReady.avatar&&!states.immunityReady.badgeVisible,
  activated_immunity_uses_gold_outline_with_status: states.immunityActive.seen&&states.immunityActive.badgeVisible&&states.immunityActive.copies===24&&!states.immunityActive.readyEffects,
  ...joystickChecks(states.joystick),
  ...springChecks(states.bodySpring),
  ...presentationChecks(states.presentationRevision),
  ...pressureChecks(states.pressure),
  ...energyChecks(states.energyCapsule),
  approved_pickups_render_and_animate: Object.values(states.newPickups).every(Boolean),
  art_bundle_loads: states.art.bundleReady && states.art.artCount === 73,
  background_and_character_visible: states.art.background && states.art.character,
  started: states.afterStart.started === true,
  first_entry_waits_on_home_before_player_starts: states.firstEntry.step==='off'&&!states.firstEntry.started&&states.firstEntry.elapsed===0,
  intro_uses_requested_copy_and_freezes_scene: states.intro.step==='intro'&&states.intro.title==='摸鱼练习'&&states.intro.subtitle.replace(/\s/g,'')==='在正式摸鱼之前先来熟悉一下基础操作吧'&&!states.intro.bodyVisible&&states.intro.button==='开始练习'&&states.introWait.elapsed===0&&JSON.stringify(states.intro.bullets)===JSON.stringify(states.introWait.bullets),
  practice_starts_with_two_workloads_and_only_nearby_bullets: states.guideStart.step==='practice'&&states.guideStart.protected&&states.guideStart.energy===80&&states.guideStart.workload===2&&!states.guideStart.ai&&!states.guideStart.fish&&states.guideStart.bullets===3&&states.guideStart.text.includes('满 3 格失败'),
  practice_hit_teaches_failure_and_retries_without_settlement: states.practiceContact.step==='practice-retry'&&states.practiceContact.workload===3&&!states.practiceContact.gameOver&&states.practiceContact.runs===0&&states.retry.step==='practice'&&states.retry.workload===2,
  actual_dodge_awards_praise_before_spawning_fish: states.dodgeReward.step==='dodge-reward'&&states.dodgeReward.reward==='躲得漂亮！'&&states.dodgeReward.achievement&&!states.dodgeReward.fish&&states.fishPrompt.step==='fish'&&states.fishPrompt.path&&!!states.fishPrompt.fish&&!states.fishPrompt.ai,
  one_native_fish_fills_charge_and_awards_good: states.fishReward.step==='collect-reward'&&states.fishReward.energy===100&&states.fishReward.reward==='GOOD!'&&states.fishReward.achievement,
  full_fish_shows_hand_and_requires_double_tap: states.shieldPrompt.step==='shield'&&states.shieldPrompt.energy===100&&states.shieldPrompt.hand&&states.shieldPrompt.text.includes('双击')&&!states.shieldPrompt.completed,
  tutorial_double_tap_awards_immunity_feedback: states.shieldReward.step==='shield-reward'&&states.shieldReward.reward==='太棒啦！'&&states.shieldReward.shield>0&&states.shieldReward.energy===0&&!states.shieldReward.hand,
  agent_only_arrives_after_immunity_ends: states.shieldActive.step==='shield-active'&&states.shieldActive.shield>0&&!states.shieldActive.ai&&states.agentPrompt.step==='agent'&&states.agentPrompt.shield===0&&states.agentPrompt.ai.kind==='agent',
  tutorial_agent_pickup_removes_both_workloads: states.agentReward.step==='agent-reward'&&states.agentReward.workload===0&&states.agentReward.reward==='你学会啦！'&&states.agentReward.elapsed===0&&states.agentReward.score===0,
  ready_card_confirms_two_slot_reduction: states.guideReady.step==='ready'&&states.readyCard.title==='练习完成'&&states.readyCard.subtitle.includes('降低 2 格')&&!states.readyCard.soundVisible&&states.readyCard.button==='开始摸鱼！'&&states.readyWait.elapsed===0&&states.readyWait.score===0,
  practice_does_not_inflate_score_or_time: states.afterDrag.elapsed===0&&states.afterDrag.score===0,
  explicit_start_resets_tutorial_workload_and_charge: states.guideComplete.step==='off'&&states.guideComplete.completed&&states.guideComplete.seen&&!states.guideComplete.protected&&states.guideComplete.workload===0&&states.guideComplete.shield===0&&states.guideComplete.energy===0&&!states.guideComplete.visible,
  first_full_charge_has_no_forced_banner: JSON.stringify(states.playPickups)==='[20,40,60,80,100]'&&!states.fullReminder.visible&&!states.fullReminder.seen&&!states.fullReminder.paused&&states.fullReminder.elapsed>0&&states.fullReminder.score>0,
  double_tap_releases_shield_and_dismisses_hint: states.firstDoubleTap.energy===0&&states.firstDoubleTap.shield>2.5&&!states.firstDoubleTap.hintActive,
  press_does_not_teleport: Math.abs(states.afterPress.player.x - beforeDrag.player.x) < 1 && Math.abs(states.afterPress.player.y - beforeDrag.player.y) < 1,
  drag_moves_player: states.afterDrag.player.x > beforeDrag.player.x + 70 && states.afterDrag.player.y > beforeDrag.player.y + 70,
  drag_stays_below_visible_head_and_hud_boundary: states.afterDrag.player.y <= playerMovementTop(fieldHeight)+0.001,
  upper_limit_reserves_capsule_space_and_accepts_a_fresh_native_drag: Math.abs(states.upperLimit.y-playerMovementTop(fieldHeight))<0.01&&Math.abs(states.upperDrag.player.y-states.upperLimit.y+40)<8,
  upper_capsule_gap_is_preserved_on_all_aspects: states.screens.every(s=>Math.abs(s.upperHeadGap-PLAYER_HUD_GAP-PLAYER_ENERGY_BAR.headGap-PLAYER_ENERGY_BAR.height)<0.01),
  pause_button_freezes_time_and_score: states.paused.paused && states.pauseFrozen.elapsed === states.paused.elapsed && states.pauseFrozen.score === states.paused.score,
  resume_button_continues_run: !states.resumed.paused && states.resumed.elapsed > states.pauseFrozen.elapsed,
  resume_shows_three_two_one_while_time_and_shield_freeze: [states.resume3,states.resume2,states.resume1].every(s=>s.paused&&s.elapsed===states.pauseFrozen.elapsed&&s.shield===states.pauseFrozen.shieldTime)&&[states.resume3.label,states.resume2.label,states.resume1.label].join()==='3,2,1',
  approved_hud_shows_live_values: states.hud.time === '02:35' && states.hud.score === '012580' && states.hud.filled === 1 && states.hud.segments === 3 && !states.hud.oldRows,
  approved_idle_atlas_has_fifty_frames: states.hud.atlasFrames === 50,
  double_click_activates_shield: states.afterDoubleClick.shieldTime > 2.5 && states.afterDoubleClick.energy === 0,
  shield_prevents_damage: states.shieldCollision.workload === 0,
  shield_does_not_clear_bullet: states.shieldCollision.bullets === 1,
  shield_blocks_orb_pickup: states.shieldOrb.energy === 0 && states.shieldOrb.orbs === 1,
  third_hit_ends_run: states.afterThirdHit.gameOver === true && states.afterThirdHit.workload === 3,
  result_shows_score_record_stats_and_goal: states.result.title==='摸鱼成绩单'&&states.result.score===String(states.result.result.score).padStart(6,'0')&&states.result.result.firstRun&&states.result.goal.startsWith('下一局')&&states.result.profile.bestScore===states.result.result.score,
  result_saves_only_once: states.result.profile.runs===1&&states.settledOnce===1,
  result_requires_explicit_retry_button: states.outsideResult.gameOver,
  restart_resets_run: states.afterRestart.gameOver === false && states.afterRestart.workload === 0 && states.afterRestart.started === true && states.afterRestart.wave === 1,
  space_activates_shield: states.afterSpace.energy === 0 && states.afterSpace.shieldTime > 2.5,
  waves_advance_without_input: states.waveTransition.wave === 2 && states.waveTransition.waveState === 'running',
  wave_change_keeps_time_and_score_moving: states.waveTwo.elapsed > states.waveTransition.elapsed && states.waveTwo.score > states.waveTransition.score,
  wave_banner_removed: states.waveNotice.removed,
  all_three_bullet_types_spawn: ['message', 'folder', 'requirement'].every((kind) => (states.natural.kinds[kind] ?? 0) > 0),
  top_arrivals_render_before_reaching_hud_boundary: states.topEntry.spawnY.every(y=>y>states.topEntry.height+35)&&states.topEntry.clipHeight===states.topEntry.height&&states.topEntry.anchorY===0.5&&states.topEntry.hudAbove&&states.topEntry.renderChanged&&states.topEntry.entered,
  bullet_clip_tracks_screen_edges_on_all_aspects: states.screens.every(s=>s.bulletClip),
  skill_orb_spawns: states.natural.orbs > 0,
  art_matches_live_objects: states.natural.visibleBulletSprites === states.natural.bullets && states.natural.visibleFishSprites === states.natural.orbs,
  wall_spawns_without_telegraph: states.wallCheck.walls >= 1 && states.wallCheck.folder >= 6,
  graze_builds_combo: states.graze.combo >= 1 && states.graze.comboMultiplier > 1,
  leave_slip_clears_field: states.leaveSlip.leaveSlipCount >= 1 && states.leaveSlip.bullets === 0,
  wave_change_keeps_bullets: states.waveTransition.bullets > 0,
  hard_mode_no_intermission: states.hardStep.wave >= 4 && states.hardStep.waveState === 'running' && states.hardStep.bullets > 0,
  natural_run_stays_valid: states.natural.gameOver === false && states.natural.finite === true && states.natural.elapsed > 4,
  fish_pickups_fill_five_capsule_segments: JSON.stringify(states.ringPickups) === '[0,1,2,3,4,5]',
  shield_ring_switches_to_countdown: states.shieldRing.segments === 0 && states.shieldRing.remaining > 0 && states.shieldRing.remaining <= SHIELD_DURATION && Math.abs(states.shieldRing.fraction - states.shieldRing.remaining / SHIELD_DURATION) < 0.001,
  full_circle_avatar_keeps_workload_panel_size: states.hud.avatarSize === PORTRAIT_AVATAR.size && states.hud.workloadSize.width === 218 && Math.abs(states.hud.workloadSize.height-124*2/3)<0.01,
  fish_pickup_effect_layer_present: states.hud.fishGlow,
  cat_size_increased_one_eighth: states.hud.playerSize.width === SPRITE_SIZES.player.width && states.hud.playerSize.height === SPRITE_SIZES.player.height,
  full_screen_and_hud_on_all_aspects: states.screens.every(s=>s.coverage&&s.hud&&Math.abs(s.canvas.x)<1&&Math.abs(s.canvas.y)<1&&Math.abs(s.canvas.width-s.width)<1&&Math.abs(s.canvas.height-s.height)<1&&Math.abs(s.viewport.x)<1&&Math.abs(s.viewport.y)<1),
  avatar_second_finger_keeps_dragging_without_shield: states.multiShield.dragging&&states.multiShield.energy===100&&states.multiShield.shield===0,
  movement_continues_after_avatar_tap: states.multiMove.player.x>firstPlayer.x+55&&states.multiMove.player.y>firstPlayer.y+30&&!states.multiEnd,
  avatar_rejects_incomplete_charge_and_cancelled_tap: states.shortCharge.energy===80&&states.shortCharge.shieldTime===0&&states.cancelAvatar.energy===100&&states.cancelAvatar.shieldTime===0,
  full_charge_consumes_fish_without_fake_charge: states.fullFish.full.energy===100&&states.fullFish.full.fish===0&&states.fullFish.full.flights===0,
  pickup_flight_targets_corresponding_segment_and_freezes_on_pause: states.fullFish.picked===0&&states.fullFish.segment===4&&states.fullFish.life===states.fullFish.pausedLife,
  pickup_arrival_pulses_target_segment: states.flightArrival.flights===0&&states.flightArrival.flash>0&&states.flightArrival.energy===100,
  damage_squashes_cat_and_pops_workload_slot: states.damageFeedback.workload===1&&states.damageFeedback.catY<1&&states.damageFeedback.slot>1&&states.damageFeedback.red>0&&states.damageFeedback.green===0,
  shadow_blinks_in_sync_with_cat: states.blinkFrames.every(f=>f.cat===f.shadow)&&states.blinkFrames.some(f=>f.cat)&&states.blinkFrames.some(f=>!f.cat),
  work_eyes_animate_and_freeze_on_pause: states.eyes.changed&&states.eyes.frozen&&states.eyes.visible===states.eyes.bullets,
  block_ripple_has_no_damage_feedback: states.blockFeedback.workload===0&&states.blockFeedback.bullets===1&&states.blockFeedback.catY===1&&states.blockFeedback.slot===1&&states.blockFeedback.red===0&&states.blockFeedback.green>0,
  homing_and_turn_cues_render_without_folder_gap_borders: states.bulletCues.homing==='homing'&&states.bulletCues.trail&&states.bulletCues.scale>1&&Math.abs(states.bulletCues.tilt)>1&&states.bulletCues.gapBordersRemoved&&states.bulletCues.walls===1,
  background_return_requires_manual_resume: states.backgroundPause.paused&&!states.backgroundPause.countdown,
  countdown_blocks_shield_keyboard_and_movement: states.countdownInput.paused&&states.countdownInput.countdown&&states.countdownInput.energy===0&&states.countdownInput.shield===0&&states.countdownInput.player.x===blockedPlayer.x&&states.countdownInput.player.y===blockedPlayer.y,
  background_interrupt_cancels_countdown_without_time_jump: states.cancelledResume.paused&&!states.cancelledResume.countdown&&states.cancelledResume.elapsed===states.backgroundPause.elapsed&&!states.backgroundResume.paused,
  restart_clears_transient_feedback: states.resetFeedback.flights===0&&states.resetFeedback.hit===0&&states.resetFeedback.block===0&&!states.resetFeedback.countdown&&!states.resetFeedback.charge&&!states.resetFeedback.workload,
  fifteen_non_silent_sounds_play_in_browser: states.audio.clips.length===15&&states.audio.clips.every(c=>c.duration>0.025)&&states.audio.starts.length>=10&&states.audio.starts.every(s=>s.peak>0&&s.duration>0)&&states.audio.contexts.includes('running'),
  bgm_buffer_reaches_browser_audio_context: states.audio.starts.some(s=>s.duration>34&&s.duration<35&&s.peak>0),
  sound_toggle_mutes_and_persists: !states.muted.enabled&&!states.muted.persisted&&states.muted.starts===mutedCount&&states.unmuted.enabled&&states.unmuted.persisted&&states.unmuted.starts>mutedCount,
  confirmed_exit_saves_current_run: states.exitPrompt.open&&states.exitPrompt.copy.includes('保存本局成绩')&&!states.homeRecord.started&&states.homeRecord.runs===states.exitBefore.runs+1&&states.homeRecord.best===states.exitBefore.score,
  cancelling_exit_keeps_run: !states.exitCancelled.open&&states.exitCancelled.started&&states.exitCancelled.runs===states.exitBefore.runs,
  home_keeps_records_and_can_replay_guide: states.homeRecord.record.includes('个人最佳')&&states.replayGuide.step==='intro'&&states.replayGuide.protected,
  tutorial_has_no_skip_button_or_invisible_skip_hitbox: states.noSkipGuide.step==='practice'&&states.noSkipGuide.protected&&!states.noSkipGuide.exists&&states.noSkipGuide.action===null,
  tutorial_sound_and_records_survive_reload: states.persisted.tutorialCompleted&&states.persisted.soundEnabled&&states.persisted.runs===states.homeRecord.runs&&states.persisted.bestScore===states.homeRecord.best,
  no_browser_runtime_errors: browserErrors.length === 0,
};

Object.assign(checks, portraitChecks(states.portrait));
Object.assign(checks, audioChecks(states.music));
Object.assign(checks, supplementAudioChecks(states.supplementAudio));
const report = { passed: Object.values(checks).every(Boolean), checks, buildFingerprint: runtimeFingerprint, startupMs, browserErrors, states, screenshots: [artShot, shieldShot, overShot, transitionShot, naturalShot, gameplayShot] };
writeFileSync(OUT+'/web-result.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if (!Object.values(checks).every(Boolean)) process.exit(1);
}
