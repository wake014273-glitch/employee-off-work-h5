/** Local WeChat DevTools smoke test. Never uploads or publishes the game. */
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HUD_BOTTOM, PLAYER_VISUAL_TOP, playerMovementTop, PLAYER_HUD_GAP, PLAYER_ENERGY_BAR, PLAYER_EDGE_MARGIN, DESIGN_WIDTH, SPRITE_SIZES, PORTRAIT_AVATAR } from '../assets/scripts/model/GameLayout.ts';
import { JOYSTICK_FIXTURE, joystickChecks } from './qa-joystick-fixture.mjs';
import { ENERGY_FIXTURE, energyChecks } from './qa-energy-fixture.mjs';
import { SPRING_FIXTURE, springChecks } from './qa-spring-fixture.mjs';
import { PRESENTATION_FIXTURE, presentationChecks } from './qa-presentation-fixture.mjs';
import { PORTRAIT_FIXTURE, portraitChecks } from './qa-portrait-fixture.mjs';
import { AUDIO_STEPS, AUDIO_SNAPSHOT, audioChecks } from './qa-audio-fixture.mjs';
import { SUPPLEMENT_AUDIO_FIXTURE, supplementAudioChecks } from './qa-supplement-audio-fixture.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const project = process.env.WECHAT_PROJECT ? resolve(process.env.WECHAT_PROJECT) : resolve(root, 'build/wechatgame');
const controlOnly = ['--open', '--console', '--tool'].some((flag) => process.argv.includes(flag));
const expectedFingerprint = controlOnly ? null : JSON.parse(readFileSync(resolve(project, 'build-info.json'), 'utf8')).fingerprint;
const out = resolve(root, process.env.QA_OUT ?? 'temp/qa');
const ide = process.env.WECHAT_IDE ?? 'C:/Program Files (x86)/Tencent/微信web开发者工具';
const bootstrap = `const e=process.argv[1],a=process.argv.slice(2);process.env.cwd=process.cwd();process.argv=[process.execPath,e,'--electron'].concat(a);require(e)`;
mkdirSync(out, { recursive: true });

function call(name, options = []) {
  const result = spawnSync(resolve(ide, '微信开发者工具.exe'), [
    '-e', bootstrap, resolve(ide, 'resources/app.asar.unpacked/js/common/cli/skill-index.js'),
    '-c', 'Codex', name, '--project', project, ...options,
  ], { cwd: root, encoding: 'utf8', timeout: 90000, maxBuffer: 8 * 1024 * 1024,
    windowsHide: true, env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' } });
  const text = result.stdout ?? '';
  const start = text.indexOf('{');
  if (start < 0) throw new Error(`${name}: ${text}\n${result.stderr}`);
  const data = JSON.parse(text.slice(start));
  if (!data.ok || data.result?.success === false) throw new Error(`${name}: ${JSON.stringify(data)}`);
  return data.result;
}

const runtimePrefix = `var w=typeof GameGlobal==='undefined'?null:GameGlobal.__gameContextWindow;
  var cc=w&&(w.cc||(w.System&&w.System.get(w.System.resolve('cc'))));
  var scene=cc&&cc.director.getScene();
  if(!scene&&cc&&cc.director.root){cc.game.resume();cc.director.resume();cc.director.tick(0);scene=cc.director.getScene();}
  if(!scene)return {__qaScenePending:true};var canvas=scene.getChildByName('Canvas');
  var g=canvas&&canvas.components.find(c=>cc.js.getClassName(c)==='GameMain');if(!g)return {__qaScenePending:true};var m=g.model;`;
const evaluate = body => {
  // Refresh replaces the scene asynchronously; never run a fixture against its
  // predecessor or treat a missing scene as the fixture's returned state.
  for (let attempt=0;attempt<20;attempt++) {
    const result=call('automation_evaluate', ['--fn-source', `function(){${runtimePrefix}${body}}`]).result;
    if(result?.__qaScenePending!==true)return result;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,500);
  }
  throw new Error('Simulator scene did not become ready');
};
const state = () => evaluate(`if(!g.artReady)cc.director.tick(0);return {started:m.started,paused:m.paused,elapsed:m.elapsed,score:m.score,
  workload:m.workload,energy:m.energy,shield:m.shieldTime,gameOver:m.gameOver,
  player:{x:m.player.x,y:m.player.y},dragging:g.dragging,artReady:g.artReady,artCount:g.art.size,experience:!!g.interface&&!!g.audio,
  combinedTutorial:typeof g.guide.beginPractice==='function'&&typeof m.setupPractice==='function',polishedTutorial:!!g.interface.rewardRoot,
  directDrag:!('joystick' in g)&&!!g.artHud.readyEffects&&!!g.immunityLabel,
  resourceRetries:typeof g.artLoadStatus==='string',fingerprint:g.buildFingerprint};`);
const touch = (action, args) => {
  evaluate('g.appVisible=true;return true;');
  return call('automation_game_action', ['--action', action, ...args.flatMap(([k,v]) => [`--${k}`, String(v)])]);
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
// This DevTools version returns black WebGL readback and stale simulator frames
// during automation. Never save them as if they proved a particular game state.
const screenshot = () => undefined;

if (process.argv.includes('--open')) { console.log(JSON.stringify(call('open_project_window'), null, 2)); process.exit(0); }
if (process.argv.includes('--console')) { console.log(JSON.stringify(call('get_simulator_console', ['--command', 'grep -n .']), null, 2)); process.exit(0); }
if (process.argv.includes('--tool')) {
  const index = process.argv.indexOf('--tool');
  console.log(JSON.stringify(call(process.argv[index + 1], process.argv.slice(index + 2)), null, 2)); process.exit(0);
}

if (process.argv.includes('--friends')) {
  const checks = {}, states = {};
  evaluate('g.interface.friends.hide();g.goHome();g.draw();return true;');
  const tapFriends = action => {
    const point = evaluate(`var u=g.interface,v=cc.view.getViewportRect(),f=cc.view.getFrameSize(),d=w.devicePixelRatio||1;
      var b=${action === 'friends' ? '{x:u.friendsEntry.node.position.x,y:u.friendsEntry.node.position.y+u.modal.position.y}' : action === 'friends-close' ? 'u.friends.closeButton' : `u.friends.buttons['${action}']`};
      var scale=${action === 'friends' ? '1' : 'u.friends.scale'};
      return {x:(v.x+v.width*(360+b.x*scale)/720)/d,y:f.height-(v.y+v.height*(m.height/2+b.y*scale)/m.height)/d};`);
    touch('tap', [['x', point.x], ['y', point.y]]);
    evaluate('g.draw();return true;');
  };
  states.initial = evaluate('return {ready:g.artReady,available:g.friends.available,authorized:g.friends.authorized,entry:g.interface.friendsEntry.node.active};');
  screenshot('friends-wechat-home.png');
  tapFriends('friends'); await sleep(1000);
  states.open = evaluate('return {open:g.interface.friends.open,authorized:g.friends.authorized,privateRows:g.interface.friends.dataRoot.active,fallback:g.interface.friends.fallback.active,menu:g.interface.modal.active,shared:!!g.interface.friends.shared};');
  checks.native_bridge_available = states.initial.available;
  checks.privacy_confirmation_recorded = states.open.authorized;
  checks.real_touch_opens_private_board = states.open.open && states.open.privateRows && states.open.shared && !states.open.fallback && !states.open.menu;
  // Friend results remain private; observe only the rendered canvas and public shell state.
  await sleep(8500);
  evaluate('g.interface.friends.shared.update();cc.director.tick(0);return true;');
  states.surface = evaluate(`var f=g.interface.friends,v=f.dataViewport.getComponent(cc.UITransform).getBoundingBoxToWorld(),
    s=f.dataSurface.getComponent(cc.UITransform).getBoundingBoxToWorld(),
    content=f.dataSurface.getChildByName('content'),b=content&&content.getComponent(cc.UITransform).getBoundingBoxToWorld(),
    resolution=f.shared.designResolutionSize;
    return {topGap:s.y+s.height-v.y-v.height,contentTopGap:b?b.y+b.height-s.y-s.height:null,
      aspect:b?b.width/b.height:null,width:resolution.width,height:resolution.height};`);
  checks.private_canvas_starts_at_top_without_vertical_compression = Math.abs(states.surface.topGap)<1 &&
    states.surface.contentTopGap!==null && Math.abs(states.surface.contentTopGap)<1 &&
    Math.abs(states.surface.aspect-0.5)<0.001 && states.surface.width===640 && states.surface.height===1280;
  screenshot('friends-wechat-board.png');
  const surface = call('simulator_screenshot');
  copyFileSync(surface.path, resolve(out, 'friends-wechat-board.jpg'));
  tapFriends('friends-refresh'); await sleep(500);
  checks.refresh_keeps_board_open = evaluate('return g.interface.friends.open&&!m.started;');
  tapFriends('friends-close');
  checks.close_restores_home = evaluate('return !g.interface.friends.open&&g.interface.modal.active&&!m.started;');
  evaluate('g.restart();g.guide.start(false);m.practiceProtected=false;m.gameOver=true;g.update(0);g.draw();return true;');
  tapFriends('friends');
  checks.result_entry_retains_settlement = evaluate("return g.interface.friends.open&&g.interface.friends.back.string==='返回成绩单'&&!!g.settlement;");
  tapFriends('friends-close');
  checks.result_returns_to_same_card = evaluate("return !g.interface.friends.open&&g.menuMode==='result'&&!!g.settlement;");
  const consoleErrors = call('get_simulator_console', ['--command', 'grep -i error']);
  checks.no_runtime_errors = consoleErrors === '';
  const report = { passed: Object.values(checks).every(Boolean), checks, states, consoleErrors,
    note: 'Actual WeChat DevTools runtime and APIs; no friend data is returned to the main context. Physical-phone multi-account comparison remains manual.' };
  writeFileSync(resolve(out, 'friends-wechat-result.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2)); if (!report.passed) process.exitCode = 1; process.exit();
}

if (process.argv.includes('--inspect')) {
  console.log(JSON.stringify(evaluate(`return {state:{artCount:g.art.size,ready:g.artReady,step:g.guide.step,energy:m.energy,paused:m.paused,started:m.started,fish:m.skillOrbs,player:m.player,dragging:g.dragging,menu:g.menuMode},
    visible:g.appVisible,gamePaused:cc.game.isPaused(),directorPaused:cc.director.isPaused(),frames:cc.director.getTotalFrames(),
    width:w.innerWidth,height:w.innerHeight,dpr:w.devicePixelRatio,frame:cc.view.getFrameSize(),viewport:cc.view.getViewportRect()};`), null, 2));
  process.exit(0);
}

if (process.argv.includes('--diagnose')) {
  evaluate(`g.restart();m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
    w.__presses=[];var orig=g.press.bind(g);g.press=function(p,t){var before=m.paused;orig(p,t);w.__presses.push({p,t,before,after:m.paused})};return true;`);
  const pause = evaluate(`var v=cc.view.getViewportRect(),f=cc.view.getFrameSize(),d=w.devicePixelRatio||1;
    return {x:(v.x+v.width*67/1080)/d,y:f.height-(v.y+v.height*(1-206/m.height))/d};`);
  console.log('coordinate', JSON.stringify(pause));
  touch('tap', [['x',pause.x],['y',pause.y]]);
  await sleep(500);
  console.log(JSON.stringify(evaluate(`return {presses:w.__presses,paused:m.paused,player:m.player};`), null, 2));
  process.exit(0);
}

const states = { initial: state() };
for (let attempt=0; attempt<60 && !states.initial.artReady; attempt++) {
  await sleep(1000);
  states.initial = state();
}
if (states.initial.artCount !== 73 || !states.initial.artReady) throw new Error('Simulator still has an old or incomplete art bundle: ' + JSON.stringify(states.initial));
if (states.initial.fingerprint !== expectedFingerprint)
  throw new Error(`Simulator is running ${states.initial.fingerprint}; expected ${expectedFingerprint}. Reopen the current build.`);
if(!states.initial.experience)throw new Error('Simulator has an old experience build');
if(!states.initial.combinedTutorial)throw new Error('Simulator has cached an old tutorial build. Close and reopen the project, refresh the simulator, then retry.');
if(!states.initial.polishedTutorial)throw new Error('Simulator has cached the old tutorial UI. Close and reopen the project, refresh the simulator, then retry.');
if(!states.initial.directDrag)throw new Error('Simulator has cached the old joystick build. Invalidate its compile cache before retrying.');
if(!states.initial.resourceRetries)throw new Error('Simulator has cached the build before resource retry support. Reopen with fresh compile timestamps.');
// A refresh may expose the previous complete scene before initializing the new
// scene. Require consecutive complete snapshots before native input begins.
for(let stable=0,attempt=0;stable<3;attempt++) {
  if(attempt>=30)throw new Error('Simulator art did not stabilize after refresh');
  await sleep(500);states.initial=state();
  stable=states.initial.artReady&&states.initial.artCount===73?stable+1:0;
}

if (process.argv.includes('--audio')) {
  for(let i=0;i<30;i++) {
    if(evaluate('return !!g.audio.musicSource.clip&&g.audio.clips.size===15;'))break;
    await sleep(300);
  }
  const audio={};
  // The same native simulator touch API used by the full gameplay regression.
  touch('tap',[['x',8],['y',8]]);
  for(const step of AUDIO_STEPS) {
    // Capture at the requested runtime delay. CLI round trips take seconds and
    // would otherwise sample several seconds past the intended loop boundary.
    evaluate('w.__gm=g;w.__qaAudioSnapshot=null;'+step.body.replaceAll('window','w')+
      ';setTimeout(function(){w.__qaAudioSnapshot='+AUDIO_SNAPSHOT.replaceAll('window','w')+';},'+step.wait+');return true;');
    await sleep(step.wait);
    audio[step.name]=evaluate('return w.__qaAudioSnapshot;');
    if(!audio[step.name])throw new Error('Simulator did not execute the timed audio snapshot: '+step.name);
  }
  evaluate('g.audio.enabled=g.progress.profile.soundEnabled;g.goHome();g.draw();return true;');
  const supplement=evaluate('w.__gm=g;return '+SUPPLEMENT_AUDIO_FIXTURE.replaceAll('window','w')+';');
  const checks={...audioChecks(audio),...supplementAudioChecks(supplement)};
  const consoleErrors=call('get_simulator_console',['--command','grep -i error']);
  checks.no_runtime_errors=consoleErrors==='';
  const report={passed:Object.values(checks).every(Boolean),checks,buildFingerprint:states.initial.fingerprint,audio,supplement,consoleErrors,
    note:'Actual WeChat DevTools audio state, loop boundary and native input; physical-phone listening remains manual.'};
  writeFileSync(resolve(out,'wechat-audio-result.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;process.exit();
}

if (process.argv.includes('--pressure')) {
  const { PRESSURE_FIXTURE, pressureChecks } = await import('./qa-pressure-fixture.mjs');
  const backup=evaluate("return cc.sys.localStorage.getItem('off-work.progress.v1');");
  let samples,consoleErrors;const checks={};
  try {
    samples=evaluate(`w.__gm=g;return (function(window){return ${PRESSURE_FIXTURE}})(w);`);
    Object.assign(checks,pressureChecks(samples));
    consoleErrors=call('get_simulator_console',['--command','grep -i error']);
    checks.no_runtime_errors=consoleErrors==='';
  } finally {
    evaluate(`var raw=${JSON.stringify(backup)};if(raw===null)cc.sys.localStorage.removeItem('off-work.progress.v1');else cc.sys.localStorage.setItem('off-work.progress.v1',raw);
      g.progress.profile=new g.progress.constructor().profile;g.audio.enabled=g.progress.profile.soundEnabled;
      g.interface.root.active=true;g.overlay.node.active=true;g.goHome();g.draw();return true;`);
  }
  const result={passed:Object.values(checks).every(Boolean),checks,buildFingerprint:states.initial.fingerprint,samples,consoleErrors};
  writeFileSync(resolve(out,'wechat-pressure-result.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));process.exit(result.passed?0:1);
}

if (process.argv.includes('--lifecycle')) {
  const {LIFECYCLE_FIXTURE,lifecycleChecks}=await import('./qa-startup-fixture.mjs');
  const samples=evaluate(`return ${LIFECYCLE_FIXTURE};`);
  const checks=lifecycleChecks(samples);
  const consoleErrors=call('get_simulator_console',['--command','grep -i error']);
  checks.no_runtime_errors=consoleErrors==='';
  const result={passed:Object.values(checks).every(Boolean),checks,samples,buildFingerprint:states.initial.fingerprint,consoleErrors};
  writeFileSync(resolve(out,'wechat-lifecycle-result.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));process.exit(result.passed?0:1);
}

if (process.argv.includes('--motion')) {
  const backup=evaluate("return cc.sys.localStorage.getItem('off-work.progress.v1');");
  const checks={},samples={};
  let consoleErrors='';
  try {
    samples.spring=evaluate(`w.__gm=g;return (function(window){return ${SPRING_FIXTURE}})(w);`);
    Object.assign(checks,springChecks(samples.spring));
    screenshot('body-spring-wechat.png');
    evaluate('g.interface.root.active=true;g.overlay.node.active=true;g.goHome();g.draw();return true;');
    samples.presentation=evaluate(`w.__gm=g;return (function(window){return ${PRESENTATION_FIXTURE}})(w);`);
    Object.assign(checks,presentationChecks(samples.presentation));
    screenshot('particle-ribbon-wechat.png');
    consoleErrors=call('get_simulator_console',['--command','grep -i error']);
    checks.no_runtime_errors=consoleErrors==='';
  } finally {
    evaluate(`var raw=${JSON.stringify(backup)};if(raw===null)cc.sys.localStorage.removeItem('off-work.progress.v1');else cc.sys.localStorage.setItem('off-work.progress.v1',raw);
      g.progress.profile=new g.progress.constructor().profile;g.audio.enabled=g.progress.profile.soundEnabled;
      g.interface.root.active=true;g.overlay.node.active=true;g.goHome();g.draw();return true;`);
  }
  const result={passed:Object.values(checks).every(Boolean),checks,samples,consoleErrors};
  writeFileSync(resolve(out,'wechat-motion-result.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));process.exit(result.passed?0:1);
}

if (process.argv.includes('--pickups')) {
  const visual=evaluate(`g.restart();g.guide.start(false);m.practiceProtected=false;
    m.bullets.length=m.skillOrbs.length=m.leaveSlips.length=m.aiPickups.length=0;
    m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
    m.movePlayer(360,280);m.workload=2;m.invulnerableTime=0;
    m.leaveSlips.push({kind:'leave',x:210,y:550,radius:16,alive:true,life:12,spin:0.5});
    m.aiPickups.push({kind:'helper',x:340,y:650,vx:76,vy:0,radius:27,alive:true,life:11,phase:0.2});
    m.aiPickups.push({kind:'agent',x:520,y:740,vx:190,vy:0,radius:27,alive:true,life:8,phase:0.2});
    m.skillOrbs.push({kind:'skill',x:450,y:420,radius:16,alive:true,pulse:1});
    m.paused=true;g.draw();g.syncArt();var wing=g.aiSprites[0].left.node.angle;
    m.aiPickups[0].phase+=0.12;g.syncArt();g.interface.root.active=false;g.overlay.node.active=false;
    return {leave:g.leaveSprites[0].node.active&&!!g.leaveSprites[0].spriteFrame,
      ai:g.aiSprites.length>=2&&g.aiSprites[0].node.active&&g.aiSprites[1].node.active,
      wing:Math.abs(g.aiSprites[0].left.node.angle-wing)>1,
      fish:g.fishSprites[0].node.active&&Math.abs(g.fishSprites[0].node.position.y-(420-m.height/2))>1,
      scales:[g.leaveSprites[0].node,g.fishSprites[0].node,g.aiSprites[0].core.node,g.aiSprites[1].core.node]
        .every(n=>Number.isFinite(n.scale.x)&&Number.isFinite(n.scale.y)&&n.scale.y>0),
      optimized:g.aiFrames.get('helper').core.texture.width===384&&g.aiFrames.get('agent').core.texture.width===384,
      laugh:g.audio.clips.has('laugh')};`);
  screenshot('wechat-new-pickups.png');
  evaluate('g.interface.root.active=true;g.overlay.node.active=true;g.goHome();g.draw();return true;');
  const checks={approved_pickups_visible_and_animated:Object.values(visual).every(Boolean)};
  const result={passed:Object.values(checks).every(Boolean),checks,visual};
  writeFileSync(resolve(out,'wechat-new-pickups-result.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));process.exit(result.passed?0:1);
}

if (process.argv.includes('--loading-recovery')) {
  const before=evaluate(`g.goHome();w.__loadingProfile=JSON.stringify(g.progress.profile);w.__loadingCalls=0;
    w.__realLoadBundle=cc.assetManager.loadBundle.bind(cc.assetManager);
    cc.assetManager.loadBundle=function(name,options,done){
      if(name!=='art')return w.__realLoadBundle(name,options,done);
      w.__loadingCalls++;var cb=typeof options==='function'?options:done;
      setTimeout(()=>{if(w.__loadingCalls>=3)cc.assetManager.loadBundle=w.__realLoadBundle;cb(new Error('QA injected offline condition'));},0);};
    g.artReady=false;g.loadArt();g.draw();return {frames:g.atlasFrames.length,profile:w.__loadingProfile};`);
  await sleep(3500);
  const failed=evaluate(`return {failed:g.artLoadFailed,calls:w.__loadingCalls,ready:g.artReady,button:g.interface.primary.string,
    retryVisible:g.interface.retryRoot.active,started:m.started};`);
  screenshot('wechat-loading-retry.png');
  const point=evaluate(`cc.assetManager.loadBundle=w.__realLoadBundle;
    var b=g.interface.buttons.primary,p={x:360+b.x,y:m.height/2+b.y};
    var v=cc.view.getViewportRect(),f=cc.view.getFrameSize(),d=w.devicePixelRatio||1;
    return {x:(v.x+v.width*p.x/720)/d,y:f.height-(v.y+v.height*p.y/m.height)/d};`);
  touch('tap',[['x',point.x],['y',point.y]]);
  let recovered;
  for(let i=0;i<12;i++){
    recovered=evaluate(`return {ready:g.artReady,count:g.art.size,failed:g.artLoadFailed,button:g.interface.primary.string,
      frames:g.atlasFrames.length,profile:JSON.stringify(g.progress.profile),audio:g.audio.clips.size};`);
    if(recovered.ready&&recovered.audio===15)break;
    await sleep(300);
  }
  screenshot('wechat-loading-recovered.png');
  const checks={failed_download_retries_three_times:failed.failed&&failed.calls===3&&!failed.ready,
    failure_has_clickable_retry_copy:failed.button==='重新加载'&&failed.retryVisible&&!failed.started,
    native_retry_loads_all_art:recovered.ready&&recovered.count===73&&!recovered.failed,
    retry_restores_start_button:recovered.button==='开始摸鱼',
    retries_keep_atlas_and_progress:recovered.frames===before.frames&&recovered.profile===before.profile,
    audio_loads_after_recovery:recovered.audio===15};
  const result={passed:Object.values(checks).every(Boolean),checks,before,failed,recovered};
  writeFileSync(resolve(out,'wechat-loading-recovery-result.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));process.exit(result.passed?0:1);
}

if (process.argv.includes('--upper-stick')) {
  const backup=evaluate("return cc.sys.localStorage.getItem('off-work.progress.v1');");
  const top=evaluate(`g.restart();g.guide.start(false);g.shieldCoach.reset(true);m.practiceProtected=false;
    m.bullets.length=0;m.walls.length=0;m.skillOrbs.length=0;m.invulnerableTime=999;
    m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;m.movePlayer(360,99999);g.draw();g.syncArt();
    var v=cc.view.getViewportRect(),f=cc.view.getFrameSize(),d=w.devicePixelRatio||1;
    var px=(v.x+v.width*m.player.x/720)/d,py=f.height-(v.y+v.height*m.player.y/m.height)/d;
    return {y:m.player.y,height:m.height,headGap:m.height-m.player.y-${PLAYER_VISUAL_TOP}-${HUD_BOTTOM},
      start:{x:px,y:py},end:{x:px,y:py+v.height*40/m.height/d}};`);
  touch('swipe',[['start-x',top.start.x],['start-y',top.start.y],['end-x',top.end.x],['end-y',top.end.y],['duration',400]]);
  const moved=evaluate('return {y:m.player.y,dragging:g.dragging};');
  const visual=evaluate(`m.movePlayer(360,m.height*0.45);m.invulnerableTime=0;m.shieldTime=2.8;m.energy=0;
    g.press({x:150,y:270},100);g.drag({x:195,y:290});g.update(0.01);g.draw();g.syncArt();cc.director.tick(0);
    return {dragging:g.dragging,copies:g.immunityCopies.filter(s=>s.node.active).length,
      badgeVisible:g.immunityLabel.node.active,bar:g.artHud.barFraction,image:cc.game.canvas.toDataURL('image/png')};`);
  writeFileSync(resolve(out,'wechat-drag-immunity-active.png'),Buffer.from(visual.image.split(',')[1],'base64'));
  delete visual.image;
  const stopped=evaluate('g.clearInput();g.draw();return {dragging:g.dragging};');
  evaluate(`var raw=${JSON.stringify(backup)};if(raw===null)cc.sys.localStorage.removeItem('off-work.progress.v1');else cc.sys.localStorage.setItem('off-work.progress.v1',raw);
    g.progress.profile=new g.progress.constructor().profile;g.goHome();g.draw();return true;`);
  const consoleErrors=call('get_simulator_console',['--command','grep -i error']);
  const checks={
    latest_drag_and_immunity_build:states.initial.directDrag,
    movement_top_matches_expanded_area:Math.abs(top.y-playerMovementTop(top.height))<0.01&&Math.abs(top.headGap-10)<0.01,
    native_drag_moves_one_to_one:moved.y<top.y-5&&moved.y>=top.y-45,
    native_release_stops_drag:!moved.dragging,
    direct_drag_and_immunity_render:visual.dragging,
    active_immunity_has_gold_outline_and_overhead_countdown:visual.copies===24&&visual.badgeVisible&&visual.bar>0&&visual.bar<1,
    clearing_input_stops_drag:!stopped.dragging,
    no_runtime_errors:consoleErrors==='',
  };
  const result={passed:Object.values(checks).every(Boolean),checks,top,moved,visual,stopped,consoleErrors};
  writeFileSync(resolve(out,'wechat-upper-stick-result.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));process.exit(result.passed?0:1);
}

if (process.argv.includes('--top-entry')) {
  evaluate('g.goHome();g.draw();return true;');
  const primary = evaluate(`var b=g.interface.buttons.primary,p={x:360+b.x,y:m.height/2+g.interface.modal.position.y+b.y};
    var v=cc.view.getViewportRect(),f=cc.view.getFrameSize(),d=w.devicePixelRatio||1;
    return {x:(v.x+v.width*p.x/720)/d,y:f.height-(v.y+v.height*p.y/m.height)/d};`);
  touch('tap',[['x',primary.x],['y',primary.y]]);
  const canvasShot = name => {
  // Keep the actual canvas image within the automator's response payload budget.
  const data=evaluate(`cc.director.tick(0);var source=cc.game.canvas,shot=w.document.createElement('canvas');
    shot.width=Math.min(640,source.width);shot.height=Math.round(source.height*shot.width/source.width);
    shot.getContext('2d').drawImage(source,0,0,shot.width,shot.height);return shot.toDataURL('image/png');`);
    if(typeof data!=='string'||!data.startsWith('data:image/png;base64,'))throw new Error('Simulator canvas image export failed');
    writeFileSync(resolve(out,name),Buffer.from(data.slice(data.indexOf(',')+1),'base64'));
  };
  const top = evaluate(`g.restart();g.guide.start(false);m.practiceProtected=false;m.paused=true;m.invulnerableTime=999;
    m.bullets.length=0;m.walls.length=0;m.skillOrbs.length=0;m.wave=3;
    m.messageTimer=m.wallTimer=0;m.requirementTimer=m.skillTimer=999;m.spawn(0,m.config);m.messageTimer=m.wallTimer=999;
    g.visualDt=0;g.draw();g.syncArt();g.interface.root.active=false;g.overlay.node.active=false;cc.director.tick(0);
    var f=g.bulletLayer.getComponent('cc.UITransform');return {height:m.height,clipHeight:f.height,clipWidth:f.width,
      anchor:{x:f.anchorPoint.x,y:f.anchorPoint.y},spawn:m.bullets.map(b=>({kind:b.kind,y:b.y})),
      hudAbove:g.artHud.root.getSiblingIndex()>g.bulletLayer.getSiblingIndex()};`);
  canvasShot('wechat-top-before.png');
  const entered = evaluate(`m.paused=false;for(var frame=0;frame<12;frame++)m.update(0.05);m.paused=true;
    g.visualDt=0;g.draw();g.syncArt();cc.director.tick(0);return m.bullets.map(b=>({kind:b.kind,y:b.y,alive:b.alive}));`);
  canvasShot('wechat-top-entry.png');
  // Compare only the static office header: an old frame with an animated cat
  // elsewhere must not count as evidence that top-edge bullets were rendered.
  const pixels = spawnSync(process.env.QA_PYTHON ?? resolve(process.env.USERPROFILE,
    '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'), ['-c',
    'from PIL import Image,ImageChops;import sys,math;a=Image.open(sys.argv[1]).convert("RGB");b=Image.open(sys.argv[2]).convert("RGB");h=math.ceil(a.height*130/float(sys.argv[3]));box=(0,0,a.width,h);print("changed" if ImageChops.difference(a.crop(box),b.crop(box)).getbbox() else "same")',
    resolve(out,'wechat-top-before.png'),resolve(out,'wechat-top-entry.png'),String(top.height)],
    {encoding:'utf8',windowsHide:true,timeout:10000});
  if(pixels.status!==0)throw new Error('Native header image comparison failed: '+pixels.stderr);
  const checks = {
    mask_matches_viewport: top.clipHeight===top.height&&top.clipWidth===720&&top.anchor.x===0.5&&top.anchor.y===0.5,
    both_top_types_start_outside_screen: ['message','folder'].every(k=>top.spawn.some(b=>b.kind===k))&&top.spawn.every(b=>b.y>top.height+35),
    top_arrivals_enter_office_header: entered.length===top.spawn.length&&entered.every(b=>b.alive&&b.y<top.height&&b.y>top.height-280),
    simulator_canvas_header_pixels_change_on_entry: pixels.stdout.trim()==='changed',
    hud_keeps_its_overlay_order: top.hudAbove,
  };
  evaluate('g.interface.root.active=true;g.overlay.node.active=true;g.goHome();g.draw();cc.director.tick(0);return true;');
  const consoleErrors = call('get_simulator_console',['--command','grep -i error']);
  checks.no_runtime_errors = consoleErrors==='';
  const result={passed:Object.values(checks).every(Boolean),checks,top,entered,consoleErrors};
  writeFileSync(resolve(out,'wechat-top-entry-result.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
  process.exit(result.passed?0:1);
}
const dimensions = evaluate(`return {width:w.innerWidth,height:w.innerHeight};`);
const tap = (x,y) => touch('tap', [['x',x],['y',y]]);
const screenPoint = expression => evaluate(`var p=${expression},v=cc.view.getViewportRect(),f=cc.view.getFrameSize(),d=w.devicePixelRatio||1;
  return {x:(v.x+v.width*p.x/720)/d,y:f.height-(v.y+v.height*p.y/m.height)/d};`);
const buttonPoint = name => {evaluate('g.draw();cc.director.tick(0);return true;');return screenPoint(`({x:360+g.interface.buttons.${name}.x,y:m.height/2+g.interface.modal.position.y+g.interface.buttons.${name}.y})`);};
const tapButton = name => {const p=buttonPoint(name);tap(p.x,p.y);};
// Native swipes above verify device input. Long pickup routes use the same
// direct-drag controller in one CLI call to keep a continuous finger gesture.
const driveTo = (target, pickup=false) => evaluate(`var target=${JSON.stringify(target)},origin={x:m.player.x,y:m.player.y},energy=m.energy,time=Date.now()/1000,end=origin;
  g.press(origin,time);for(var i=1;i<=16;i++){
    end={x:origin.x+(target.x-origin.x)*i/16,y:origin.y+(target.y-origin.y)*i/16};
    g.drag(end);g.update(1/60);
    if(${pickup}&&m.energy!==energy)break;
  }g.release(end,time+1);g.draw();g.syncArt();return {energy:m.energy,x:m.player.x,y:m.player.y,step:g.guide.step,workload:m.workload,lowered:g.guide.lowered,text:g.interface.rewardLabel.string};`);
states.firstEntry=evaluate('return {step:g.guide.step,revision:g.progress.profile.tutorialRevision,started:m.started,elapsed:m.elapsed};');
evaluate(`w.__progressBackup=cc.sys.localStorage.getItem('off-work.progress.v1');
  g.progress.profile={version:1,tutorialCompleted:false,tutorialRevision:0,shieldHintSeen:false,soundEnabled:true,bestScore:0,bestSeconds:0,bestWave:0,runs:0};
  g.progress.save();g.audio.enabled=true;w.__audioStarts=[];
  var original=g.audio.source.playOneShot.bind(g.audio.source);g.audio.source.playOneShot=function(clip,volume){w.__audioStarts.push({name:clip.name,duration:clip.getDuration(),volume});return original(clip,volume)};
  w.__guideAwards=[];
  var picked=g.guide.picked.bind(g.guide);g.guide.picked=function(energy){var won=picked(energy);
    if(won)w.__guideAwards.push({type:'fish',title:g.guide.title,energy,elapsed:m.elapsed,score:m.score});return won};
  w.__guideFrames={};w.__fullReminder=null;
  var drawGuide=g.interface.updateGuide.bind(g.interface);g.interface.updateGuide=function(...args){drawGuide(...args);
    if(g.guide.active&&!w.__guideFrames[g.guide.step])w.__guideFrames[g.guide.step]={step:g.guide.step,workload:m.workload,energy:m.energy,shield:m.shieldTime,ai:m.aiPickups.map(p=>({...p}))};
    // Record the first lesson frame and verify time stays frozen until activation.
    if(g.shieldCoach.active&&!w.__fullReminder)w.__fullReminder={active:g.shieldCoach.active,visible:g.interface.guideRoot.active,
      text:g.interface.guideText.string,seen:g.progress.profile.shieldHintSeen,paused:m.paused,elapsed:m.elapsed,score:m.score};};
  w.__nativeMenuAudit=[];
  for(var method of ['press','release']){let name=method,original=g[name].bind(g);g[name]=function(p,t){
    if(w.__nativeMenuAudit.length<40)w.__nativeMenuAudit.push({method:name,p:{...p},action:g.interface.actionAt(p),mode:g.menuMode,step:g.guide.step,revision:g.progress.profile.tutorialRevision});
    return original(p,t);};}
  g.goHome();g.draw();return true;`);
screenshot('wechat-start.png');
states.beforeFirstTap=evaluate('return {mode:g.menuMode,profile:{...g.progress.profile},button:{...g.interface.buttons.primary},loading:g.interface.loading};');
tapButton('primary');
await sleep(500);
evaluate('g.appVisible=true;g.update(0);return true;');
states.intro=evaluate('return {step:g.guide.step,title:g.interface.title.string,subtitle:g.interface.subtitle.string,body:g.interface.record.string,bodyVisible:g.interface.record.node.active,button:g.interface.primary.string,elapsed:m.elapsed,bullets:m.bullets.map(b=>({kind:b.kind,x:b.x,y:b.y}))};');
screenshot('wechat-tutorial-intro.png');
states.introWait=evaluate('return {elapsed:m.elapsed,bullets:m.bullets.map(b=>({kind:b.kind,x:b.x,y:b.y}))};');
states.introSound=evaluate(`var b=g.interface.buttons.sound;return {visible:g.interface.sound.node.active,action:g.interface.actionAt({x:360+b.x,y:m.height/2+g.interface.modal.position.y+b.y})};`);
// Freeze on the same frame as the native start tap. The CLI round trip can
// otherwise advance the practice bullets before the first state read.
evaluate('var begin=g.beginPractice.bind(g);g.beginPractice=function(){begin();g.appVisible=false;};return true;');
tapButton('primary');
states.started=state();
const readGuide=()=>evaluate(`return {step:g.guide.step,protected:m.practiceProtected,title:g.interface.guideTitle.string,text:g.interface.guideText.string,energy:m.energy,workload:m.workload,shield:m.shieldTime,ai:m.aiPickups[0],fish:m.skillOrbs[0],bullets:m.bullets.length,elapsed:m.elapsed,score:m.score,reward:g.interface.rewardLabel.string,hand:g.interface.tapHandRoot.active,path:g.interface.tutorialCueRoot.active};`);
const advanceTo=step=>{
  const actual=evaluate(`for(var i=0;i<600&&g.guide.step!==${JSON.stringify(step)};i++){g.appVisible=true;g.update(0.05);}g.appVisible=false;g.draw();return g.guide.step;`);
  if(actual!==step)throw new Error(`Tutorial did not reach ${step}; stopped at ${actual}`);
  return actual;
};
states.guideStart=readGuide();
screenshot('wechat-tutorial-dodge.png');
states.practiceContact=evaluate(`var b=m.bullets[0];m.movePlayer(b.x,b.y);m.update(0);g.consumeEvents();g.draw();return {step:g.guide.step,workload:m.workload,gameOver:m.gameOver,score:m.score};`);
advanceTo('practice');
// The DevTools swipe tool can acknowledge a gesture after touchstart while
// silently dropping touchmove/touchend. Exercise the same drag controller here;
// later fixtures assert native touchstart/move/end separately.
evaluate('var p={...m.player},t=Date.now()/1000,end={x:600,y:p.y+100};g.press(p,t);g.drag(end);g.release(end,t+0.45);g.update(0);return true;');
states.dragged=state();advanceTo('dodge-reward');states.dodgeReward=readGuide();advanceTo('fish');states.fishPrompt=readGuide();
screenshot('wechat-tutorial-fish-path.png');
driveTo(states.fishPrompt.fish,true);advanceTo('collect-reward');states.fishReward=readGuide();
states.rewardPlacement=evaluate(`return {x:g.interface.rewardRoot.position.x+360,y:g.interface.rewardRoot.position.y+m.height/2,cat:{...m.player}};`);
screenshot('wechat-tutorial-achievement.png');advanceTo('shield');states.shieldPrompt=readGuide();
screenshot('wechat-tutorial-double-tap-hand.png');
states.shieldReward=evaluate(`g.gesture.reset();var p={...m.player},t=Date.now()/1000;g.press(p,t);g.release(p,t+0.02);g.press(p,t+0.12);g.release(p,t+0.15);g.consumeEvents();g.draw();return {step:g.guide.step,energy:m.energy,shield:m.shieldTime,text:g.interface.rewardLabel.string};`);
advanceTo('shield-active');states.shieldActive=readGuide();advanceTo('agent');states.agentPrompt=readGuide();
evaluate('for(var i=0;i<100;i++){g.appVisible=true;g.update(0.05);}g.appVisible=false;return true;');
const agent=evaluate('return m.aiPickups[0];');driveTo(agent);advanceTo('agent-reward');states.agentReward=readGuide();
advanceTo('ready');states.guideReady=readGuide();
states.readyCard=evaluate(`return {title:g.interface.title.string,subtitle:g.interface.subtitle.string,soundVisible:g.interface.sound.node.active,button:g.interface.primary.string,protected:m.practiceProtected,score:m.score};`);
screenshot('wechat-tutorial-ready.png');tapButton('primary');
states.guideComplete=evaluate('return {step:g.guide.step,completed:g.progress.profile.tutorialCompleted,seen:g.progress.profile.shieldHintSeen,protected:m.practiceProtected,workload:m.workload,shield:m.shieldTime,energy:m.energy,visible:g.interface.guideRoot.active};');
// advanceTo deliberately freezes the simulator while taking lesson snapshots.
// Restore visibility before testing the live formal run and native input.
evaluate('g.appVisible=true;return true;');
states.upperLimit=evaluate(`w.__normalPlayer={...m.player};m.bullets.length=0;m.invulnerableTime=999;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;m.movePlayer(360,99999);g.syncArt();
  return {y:m.player.y,height:m.height,headGap:m.height-m.player.y-${PLAYER_VISUAL_TOP}-${HUD_BOTTOM},elapsed:m.elapsed};`);
const upperStart=screenPoint('m.player'),upperEnd=screenPoint('({x:m.player.x,y:m.player.y-40})');
const upperSwipeMs=400;
touch('touchstart',[['x',Math.round(upperStart.x)],['y',Math.round(upperStart.y)]]);
touch('touchmove',[['x',Math.round(upperEnd.x)],['y',Math.round(upperEnd.y)]]);
await sleep(upperSwipeMs);
touch('touchend',[['x',Math.round(upperEnd.x)],['y',Math.round(upperEnd.y)]]);
states.upperDrag=evaluate('return m.player.y;');
states.upperDragElapsed=evaluate('return m.elapsed;');
evaluate('m.movePlayer(w.__normalPlayer.x,w.__normalPlayer.y);return true;');
// Official CLI calls take seconds and cross live waves. Isolate native pickup input
// with invulnerability, while elapsed time, score and wave progression remain live.
evaluate('g.shieldCoach.reset(false);g.progress.profile.shieldHintSeen=false;m.bullets.length=0;m.workload=0;m.invulnerableTime=999;m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;return true;');
states.playPickups=[];
for(let index=0;index<5;index++){
  const fish=evaluate('var f={kind:"skill",x:m.player.x+65,y:m.player.y+80,radius:17,alive:true,pulse:0};m.skillOrbs.push(f);return f;');
  driveTo(fish,true);
  states.playPickups.push(evaluate('return m.energy;'));
}
states.fullReminder=evaluate('return w.__fullReminder;');
states.immunityReady=evaluate(`return {elapsed:m.elapsed,active:g.shieldCoach.active,avatar:g.artHud.readyEffects.node.active,badgeVisible:g.immunityLabel.node.active,dragging:g.dragging};`);
screenshot('wechat-immunity-ready.png');
states.firstDoubleTap=evaluate(`g.gesture.reset();var p={x:m.player.x,y:m.player.y},time=Date.now()/1000;
  g.press(p,time);g.release(p,time);g.press(p,time+0.1);g.release(p,time+0.1);g.consumeEvents();
  m.bullets.length=0;m.walls.length=0;m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  // Pickup routes use artificial damage invulnerability; stop its blink before inspecting the immunity artwork.
  m.invulnerableTime=0;
  g.update(0.01);return {energy:m.energy,shield:m.shieldTime,hint:g.shieldCoach.active,seen:g.progress.profile.shieldHintSeen,
    badgeVisible:g.immunityLabel.node.active,copies:g.immunityCopies.filter(s=>s.node.active).length,readyEffects:g.artHud.readyEffects.node.active};`);

// Fixed-width layout keeps the pause artwork 206 logical units below the top.
const pause = evaluate(`var v=cc.view.getViewportRect(),f=cc.view.getFrameSize(),d=w.devicePixelRatio||1;
  return {x:(v.x+v.width*67/1080)/d,y:f.height-(v.y+v.height*(1-206/m.height))/d};`);
tap(pause.x,pause.y);
await sleep(500);
states.paused = state();
await sleep(200);
states.frozen = state();
// Hold only the test screenshot clock so an actual native tap can be inspected even
// when the next official CLI process starts after the three-second countdown.
evaluate(`w.__holdResume=true;var advanceResume=g.resume.advance.bind(g.resume);
  g.resume.advance=function(dt,visible){return w.__holdResume&&g.resume.active?false:advanceResume(dt,visible)};return true;`);
tap(pause.x,pause.y);
states.resumeStarted=evaluate(`w.__holdResume=false;g.update(0.05);w.__holdResume=true;
  return {paused:m.paused,countdown:g.resume.active,remaining:g.resume.remaining,label:g.interface.countdown.string,
    visible:g.interface.resumeRoot.active,elapsed:m.elapsed,shield:m.shieldTime};`);
screenshot('wechat-detail-countdown.png');
evaluate('w.__holdResume=false;return true;');
await sleep(3200);
states.resumed = state();

evaluate(`m.bullets.length=0;m.skillOrbs.length=0;m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  m.energy=100;m.shieldTime=0;m.invulnerableTime=0;return true;`);
// CLI process startup exceeds the double-tap window. Exercise the controller
// gesture path in one simulator evaluation; browser QA covers native double-click.
states.shield = evaluate(`g.gesture.reset();g.dragging=false;
  var point={x:m.player.x,y:m.player.y},time=Date.now()/1000;
  var tap=()=>{g.press(point,time);g.release(point,time)};
  tap();tap();return {energy:m.energy,shield:m.shieldTime,hint:g.hintText};`);
screenshot('wechat-shield.png');
evaluate(`m.workload=2;m.shieldTime=0;m.invulnerableTime=0;var p=m.player;
  m.bullets.push({kind:'message',x:p.x,y:p.y,vx:0,vy:0,radius:15,alive:true,grazed:false,state:'cruise',update(){}});return true;`);
await sleep(100);
states.over = state();
states.result=evaluate(`return {title:g.interface.title.string,score:g.interface.score.string,result:g.settlement,profile:{...g.progress.profile},goal:g.interface.goal.string};`);
screenshot('wechat-game-over.png');
// Keep the native retry alive while later CLI calls inspect the ring and layout.
// Damage and pressure use separate fixtures; command startup must not introduce
// another settlement into the saved-progress assertions.
evaluate(`w.__isolateRestart=true;var restart=g.restart.bind(g);g.restart=function(...args){restart(...args);
  if(w.__isolateRestart){m.invulnerableTime=999;m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;}};return true;`);
tapButton('primary');
states.restarted = state();
states.presentation = evaluate(`var v=cc.view.getViewportRect(),f=cc.view.getFrameSize(),d=w.devicePixelRatio||1;
  var size=g.playerSprite.node.getComponent('cc.UITransform');
  return {viewport:{x:v.x,y:v.y,width:v.width/d,height:v.height/d},frame:f,catWidth:size.width,
    avatarSize:g.artHud.portrait.node.getComponent('cc.UITransform').width,fishGlow:!!g.fishGlow,
    shadows:!!g.bulletShadows&&!!g.playerShadow,oldRows:g.artHud.root.children.some(n=>['FishCount','WaveStatus'].includes(n.name))};`);
states.ring = evaluate(`m.bullets.length=0;m.skillOrbs.length=0;m.energy=0;m.shieldTime=0;m.paused=false;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;var steps=[];g.draw();steps.push(g.artHud.chargeSegments);
  for(var i=0;i<5;i++){m.skillOrbs.push({kind:'skill',x:m.player.x,y:m.player.y,radius:15,alive:true,pulse:0});m.update(0.01);g.draw();steps.push(g.artHud.chargeSegments)}return steps;`);
screenshot('wechat-ring-full.png');
states.wave = evaluate(`m.invulnerableTime=999;m.wave=1;m.waveTimer=m.config.duration-0.01;m.update(0.02);g.consumeEvents();g.draw();
  return {wave:m.wave,state:m.waveState,noticeRemoved:!g.node.getChildByName('WaveNotice')&&!g.node.getChildByName('WaveFolderNote')};`);
screenshot('wechat-wave-transition.png');
states.feedback=evaluate(`w.__isolateRestart=false;g.restart();g.appVisible=true;g.shieldCoach.reset(true);m.paused=false;
  m.bullets.length=0;m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  var contact=()=>({kind:'message',x:m.player.x+13,y:m.player.y,vx:0,vy:0,radius:15,alive:true,grazed:false,state:'cruise',update(){}});
  m.bullets.push(contact());g.update(0.06);var damage={workload:m.workload,cat:g.playerSprite.node.scale.y,slot:g.artHud.slots[0].node.scale.x,red:g.hitFlash};
  var blink=[];for(var time of [0,0.95,0.85,0.75,0.65,0.55,0.45,0.35,0.25,0.15,0.05]){m.invulnerableTime=time;g.syncArt();blink.push({cat:g.playerSprite.node.active,shadow:g.playerShadow.node.active});}
  g.restart();g.shieldCoach.reset(true);m.bullets.length=0;m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;m.shieldTime=2;m.bullets.push(contact());g.update(0.06);
  var block={workload:m.workload,cat:g.playerSprite.node.scale.y,slot:g.artHud.slots[0].node.scale.x,red:g.hitFlash,green:g.shieldBlockTime,bullets:m.bullets.length};
  g.restart();g.shieldCoach.reset(true);m.bullets.length=0;m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;m.energy=100;
  m.skillOrbs.push({kind:'skill',x:m.player.x,y:m.player.y,radius:17,alive:true,pulse:0});g.update(0.02);
  var full={fish:m.skillOrbs.length,energy:m.energy,flights:g.pickupFlights.filter(f=>f.life>0).length};
  m.energy=80;m.skillOrbs.push({kind:'skill',x:m.player.x,y:m.player.y,radius:17,alive:true,pulse:0});g.update(0.02);m.paused=true;var f=g.pickupFlights.find(f=>f.life>0)||{segment:-1,life:-1},life=f.life;g.update(0.4);
  var flight={segment:f.segment,life,pausedLife:f.life};m.paused=false;for(var i=0;i<6;i++)g.update(0.1);
  var arrival={flights:g.pickupFlights.filter(f=>f.life>0).length,flash:g.artHud.chargeFlashes[4]};
  g.restart();m.wave=3;m.invulnerableTime=999;m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  var requirement=m.bullets[0];m.bullets.length=0;requirement.x=180;requirement.y=800;requirement.turnTimer=0.01;requirement.random=()=>0.8;m.bullets.push(requirement);
  m.player.x=360;m.player.y=350;m.messageTimer=0;m.spawn(0,m.config);m.messageTimer=999;var message=m.bullets.find(b=>b.kind==='message');message.x=480;message.y=420;message.vx=-40;message.vy=-80;
  m.spawnWall(m.config);for(var orb of m.folderWalls[0].orbs)orb.y=700;g.update(0.04);g.update(0.05);m.paused=true;g.visualDt=0;g.draw();g.syncArt();
  var cues={homing:message.state,trail:g.bulletCues.node.active,scale:g.bulletSprites[m.bullets.indexOf(message)].node.scale.x,
    tilt:g.bulletSprites[m.bullets.indexOf(requirement)].node.angle,gapBordersRemoved:!g.bulletLayer.getChildByName('FolderGapEdges')};
  var eyeClock=g.animationClock;g.update(0.4);var eyes={visible:g.bulletEyes.filter(e=>e.node.parent.active).length,bullets:m.bullets.length,frozen:g.animationClock===eyeClock};
  return {damage,blink,block,full,flight,arrival,cues,eyes};`);
evaluate('g.interface.root.active=false;g.overlay.node.active=false;return true;');screenshot('wechat-detail-cues.png');
evaluate('g.interface.root.active=true;g.overlay.node.active=true;m.paused=false;m.bullets.length=0;g.onGameHide();g.onGameShow();w.__holdResume=true;g.draw();return true;');
states.background=evaluate('return {paused:m.paused,countdown:g.resume.active,elapsed:m.elapsed};');
tapButton('primary');
states.backgroundCountdown=evaluate('return {paused:m.paused,countdown:g.resume.active,elapsed:m.elapsed};');
// CLI process startup can outlast the three-second countdown. Exercise hide
// while it is active within one simulator call, then verify that time froze.
states.interruptedCountdown=evaluate(`g.resume.cancel();m.paused=true;g.handleMenuAction('primary');
  var beforeElapsed=m.elapsed,wasActive=g.resume.active;g.update(0.05);
  g.onGameHide();g.onGameShow();g.draw();
  return {paused:m.paused,countdown:g.resume.active,elapsed:m.elapsed,beforeElapsed,wasActive};`);
tapButton('primary');evaluate('w.__holdResume=false;return true;');await sleep(3200);
states.backgroundResumed=state();
states.audio=evaluate('return {clips:[...g.audio.clips].map(([name,clip])=>({name,duration:clip.getDuration()})),starts:w.__audioStarts};');
tap(pause.x,pause.y);tapButton('sound');
const muteCount=evaluate('return w.__audioStarts.length;');
evaluate("g.audio.play('pickup');g.audio.play('shield');return true;");
states.muted=evaluate('return {enabled:g.audio.enabled,persisted:new g.progress.constructor().profile.soundEnabled,count:w.__audioStarts.length};');
tapButton('sound');
states.unmuted=evaluate('return {enabled:g.audio.enabled,persisted:new g.progress.constructor().profile.soundEnabled,count:w.__audioStarts.length};');
  evaluate('m.score=g.progress.profile.bestScore+1000;return true;');
  states.exitBefore=evaluate('return {runs:g.progress.profile.runs,best:g.progress.profile.bestScore,score:m.score};');
tapButton('secondary');
  states.exitPrompt=evaluate("return {open:g.interface.exitOpen,copy:g.interface.exitRoot.getChildByName('ExitDialog').getChildByName('ExitExplanation').getComponent('cc.Label').string};");
  const cancel=screenPoint('({x:360+g.interface.exitCancelBox.x,y:m.height/2+g.interface.exitCancelBox.y+g.interface.safeCenter})');
  tap(cancel.x,cancel.y);
  states.exitCancelled=evaluate('return {open:g.interface.exitOpen,runs:g.progress.profile.runs,started:m.started};');
  tapButton('secondary');
  const confirm=screenPoint('({x:360+g.interface.exitConfirmBox.x,y:m.height/2+g.interface.exitConfirmBox.y+g.interface.safeCenter})');
  tap(confirm.x,confirm.y);
  states.home=evaluate('return {started:m.started,runs:g.progress.profile.runs,best:g.progress.profile.bestScore,record:g.interface.record.string};');
tapButton('secondary');
states.replay=evaluate('return {step:g.guide.step,protected:m.practiceProtected};');
tapButton('primary');
const skip=screenPoint('({x:626,y:151})');tap(skip.x,skip.y);
states.noSkip=evaluate(`return {step:g.guide.step,protected:m.practiceProtected,action:g.interface.actionAt({x:626,y:151}),exists:!!g.interface.guideRoot.getChildByName('SkipGuide')};`);
evaluate('g.goHome();g.draw();return true;');
states.persisted=evaluate('return new g.progress.constructor().profile;');
const { PRESSURE_FIXTURE, pressureChecks } = await import('./qa-pressure-fixture.mjs');
states.joystick = evaluate('w.__gm=g;return ' + JOYSTICK_FIXTURE.replaceAll('window', 'w'));
states.presentationRevision = evaluate('w.__gm=g;return ' + PRESENTATION_FIXTURE.replaceAll('window', 'w'));
screenshot('presentation-revision-wechat.png');
evaluate('g.interface.root.active=true;g.overlay.node.active=true;return true;');
states.bodySpring = evaluate('w.__gm=g;return ' + SPRING_FIXTURE.replaceAll('window', 'w'));
screenshot('body-spring-wechat.png');
evaluate('g.interface.root.active=true;g.overlay.node.active=true;return true;');
states.pressure = evaluate('w.__gm=g;return ' + PRESSURE_FIXTURE.replaceAll('window', 'w'));
states.energyCapsule = evaluate('w.__gm=g;return ' + ENERGY_FIXTURE.replaceAll('window', 'w'));
screenshot('energy-capsule-wechat.png');
evaluate('g.interface.root.active=true;g.overlay.node.active=true;return true;');
// Verify the same long-stroke reversal through WeChat's native canvas touch bridge.
evaluate(`g.restart();g.guide.start(false);g.shieldCoach.reset(true);m.practiceProtected=false;
  m.bullets.length=0;m.walls.length=0;m.skillOrbs.length=0;m.invulnerableTime=999;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;m.movePlayer(360,200);g.draw();return true;`);
const turnOrigin=screenPoint('({x:150,y:270})'),turnForward=screenPoint('({x:510,y:270})'),
  turnReverse=screenPoint('({x:430,y:270})'),turnCenter=screenPoint('({x:454,y:270})');
const turnState=()=>evaluate('for(var i=0;i<4;i++)g.update(1/60);return {x:m.player.x,dragging:g.dragging};');
touch('touchstart',[['x',Math.round(turnOrigin.x)],['y',Math.round(turnOrigin.y)]]);
touch('touchmove',[['x',Math.round(turnForward.x)],['y',Math.round(turnForward.y)]]);
states.nativeTurnForward=turnState();
touch('touchmove',[['x',Math.round(turnReverse.x)],['y',Math.round(turnReverse.y)]]);
states.nativeTurnReverse=turnState();
touch('touchmove',[['x',Math.round(turnCenter.x)],['y',Math.round(turnCenter.y)]]);
states.nativeTurnCenter=turnState();await sleep(150);
states.nativeTurnCenterWait=turnState();
touch('touchend',[['x',Math.round(turnCenter.x)],['y',Math.round(turnCenter.y)]]);
states.nativeTurnEnd=turnState();
await sleep(150);states.nativeTurnEndWait=turnState();
states.nativeMenuAudit=evaluate('return w.__nativeMenuAudit;');
evaluate(`var raw=w.__progressBackup;if(raw===null)cc.sys.localStorage.removeItem('off-work.progress.v1');else cc.sys.localStorage.setItem('off-work.progress.v1',raw);
  g.progress.profile=new g.progress.constructor().profile;g.audio.enabled=g.progress.profile.soundEnabled;g.goHome();g.draw();return true;`);
const consoleErrors = call('get_simulator_console', ['--command', 'grep -i error']);
const checks = {
  native_long_drag_tracks_finger: Math.abs(states.nativeTurnForward.x-(DESIGN_WIDTH-PLAYER_EDGE_MARGIN))<3,
  native_long_drag_reverses_immediately: Math.abs(states.nativeTurnReverse.x-640)<3,
  native_drag_stops_on_release: Math.abs(states.nativeTurnEndWait.x-states.nativeTurnEnd.x)<1&&!states.nativeTurnEnd.dragging&&!states.nativeTurnEndWait.dragging,
  ...joystickChecks(states.joystick),
  ...springChecks(states.bodySpring),
  ...presentationChecks(states.presentationRevision),
  ...pressureChecks(states.pressure),
  ...energyChecks(states.energyCapsule),
  intro_sound_button_and_hitbox_removed: !states.introSound.visible&&states.introSound.action===null,
  achievement_near_fish_and_clear_of_cat: Math.abs(states.rewardPlacement.y-states.rewardPlacement.cat.y)>100&&Math.abs(states.rewardPlacement.y-states.fishPrompt.fish.y)<180&&Math.abs(states.rewardPlacement.x-states.fishPrompt.fish.x)<201,
  full_charge_keeps_gameplay_running: !!states.fullReminder&&states.immunityReady.elapsed>states.fullReminder.elapsed&&!states.fullReminder.paused,
  full_charge_has_gold_capsule_without_banner: states.immunityReady.avatar&&!states.immunityReady.badgeVisible,
  activation_has_gold_outline_with_status_and_saves_usage: states.firstDoubleTap.seen&&states.firstDoubleTap.badgeVisible&&states.firstDoubleTap.copies===24&&!states.firstDoubleTap.readyEffects,
  final_art_loaded: states.initial.artReady && states.initial.artCount === 73,
  touch_starts_run: states.started.started,
  first_entry_teaches_before_formal_play: states.intro.step==='intro'&&states.intro.elapsed===0&&states.started.started&&states.guideStart.step==='practice',
  intro_uses_requested_copy_and_freezes_scene: states.intro.step==='intro'&&states.intro.title==='摸鱼练习'&&states.intro.subtitle.replace(/\s/g,'')==='在正式摸鱼之前先来熟悉一下基础操作吧'&&!states.intro.bodyVisible&&states.intro.button==='开始练习'&&states.introWait.elapsed===0&&JSON.stringify(states.intro.bullets)===JSON.stringify(states.introWait.bullets),
  practice_starts_with_two_slots_and_nearby_bullets: states.guideStart.step==='practice'&&states.guideStart.workload===2&&states.guideStart.energy===80&&states.guideStart.bullets===3&&!states.guideStart.fish&&!states.guideStart.ai,
  collision_teaches_failure_without_recording_a_run: states.practiceContact.step==='practice-retry'&&states.practiceContact.workload===3&&!states.practiceContact.gameOver,
  dodge_awards_praise_before_fish: states.dodgeReward.step==='dodge-reward'&&states.dodgeReward.reward==='躲得漂亮！'&&states.fishPrompt.step==='fish'&&states.fishPrompt.path,
  one_fish_fills_charge_and_awards_good: states.fishReward.step==='collect-reward'&&states.fishReward.energy===100&&states.fishReward.reward==='GOOD!'&&states.fishReward.elapsed===0&&states.fishReward.score===0,
  full_fish_waits_for_double_tap_and_shows_hand: states.shieldPrompt.step==='shield'&&states.shieldPrompt.energy===100&&states.shieldPrompt.hand&&states.shieldPrompt.text.includes('双击'),
  immunity_awards_separate_feedback: states.shieldReward.step==='shield-reward'&&states.shieldReward.energy===0&&states.shieldReward.shield>0&&states.shieldReward.text==='太棒啦！',
  agent_only_arrives_after_immunity: states.shieldActive.shield>0&&!states.shieldActive.ai&&states.agentPrompt.step==='agent'&&states.agentPrompt.shield===0&&states.agentPrompt.ai.kind==='agent',
  agent_pickup_removes_both_workloads: states.agentReward.step==='agent-reward'&&states.agentReward.workload===0&&states.agentReward.reward==='你学会啦！',
  ready_card_confirms_two_slot_reduction: states.guideReady.step==='ready'&&states.readyCard.protected&&states.readyCard.score===0&&states.readyCard.subtitle.includes('降低 2 格')&&!states.readyCard.soundVisible&&states.readyCard.button==='开始摸鱼！',
  explicit_start_resets_tutorial_charge_and_workload: states.guideComplete.step==='off'&&states.guideComplete.completed&&states.guideComplete.seen&&!states.guideComplete.protected&&states.guideComplete.workload===0&&states.guideComplete.shield===0&&states.guideComplete.energy===0&&!states.guideComplete.visible,
  // A held analog stick moves by elapsed time, rather than by the swipe's 40px offset.
  // Allow one 50ms capped update of native dispatch timing beyond the requested duration.
  upper_limit_and_native_drag_reserve_capsule_space: Math.abs(states.upperLimit.y-playerMovementTop(states.upperLimit.height))<0.01&&Math.abs(states.upperLimit.headGap-PLAYER_HUD_GAP-PLAYER_ENERGY_BAR.headGap-PLAYER_ENERGY_BAR.height)<0.01&&states.upperDrag<states.upperLimit.y-5&&states.upperDrag>=states.upperLimit.y-45,
  five_total_pickups_charge_without_forced_banner: JSON.stringify(states.playPickups)==='[20,40,60,80,100]'&&states.fullReminder&&!states.fullReminder.visible&&!states.fullReminder.seen&&!states.fullReminder.paused&&states.fullReminder.elapsed>0&&states.fullReminder.score>0,
  double_tap_starts_shield_and_hides_hint: states.firstDoubleTap.energy===0&&states.firstDoubleTap.shield>0&&!states.firstDoubleTap.hint,
  drag_moves_without_teleport: states.dragged.player.x > states.started.player.x + 40 && states.dragged.player.y > states.started.player.y + 40,
  swipe_releases_drag: !states.dragged.dragging,
  pause_freezes_time: states.paused.paused && states.paused.elapsed === states.frozen.elapsed && states.paused.score === states.frozen.score,
  resume_continues_run: !states.resumed.paused && states.resumed.elapsed > states.frozen.elapsed,
  // Native CLI startup can take over one second; compare the displayed digit with live remaining time.
  resume_countdown_keeps_game_paused: states.resumeStarted.paused&&states.resumeStarted.countdown&&states.resumeStarted.visible&&states.resumeStarted.remaining>0&&states.resumeStarted.remaining<=3&&states.resumeStarted.label===String(Math.ceil(states.resumeStarted.remaining))&&states.resumeStarted.elapsed===states.frozen.elapsed&&states.resumeStarted.shield===states.frozen.shield,
  double_tap_shield: states.shield.energy === 0 && states.shield.shield > 2,
  third_hit_settles_run: states.over.gameOver && states.over.workload === 3,
  settlement_records_stats_and_goal: states.result.title==='摸鱼成绩单'&&states.result.result.firstRun&&states.result.profile.runs===1&&states.result.profile.bestScore===states.result.result.score&&states.result.goal.startsWith('下一局'),
  tap_restarts: states.restarted.started && !states.restarted.gameOver && states.restarted.workload === 0,
  fills_screen: Math.abs(states.presentation.viewport.x)<1 && Math.abs(states.presentation.viewport.y)<1 && Math.abs(states.presentation.viewport.width-states.presentation.frame.width)<1 && Math.abs(states.presentation.viewport.height-states.presentation.frame.height)<1,
  larger_cat_with_shadows: states.presentation.catWidth === SPRITE_SIZES.player.width && states.presentation.shadows,
  full_circle_avatar_and_fish_effects: states.presentation.avatarSize === PORTRAIT_AVATAR.size && states.presentation.fishGlow,
  obsolete_hud_rows_removed: !states.presentation.oldRows,
  five_pickups_fill_capsule: JSON.stringify(states.ring)==='[0,1,2,3,4,5]',
  seamless_wave_transition: states.wave.wave===2 && states.wave.state==='running' && states.wave.noticeRemoved,
  full_charge_consumes_fish_without_fake_charge: states.feedback.full.fish===0&&states.feedback.full.energy===100&&states.feedback.full.flights===0,
  pickup_flight_freezes_and_flashes_correct_segment: states.feedback.flight.segment===4&&states.feedback.flight.life===states.feedback.flight.pausedLife&&states.feedback.arrival.flights===0&&states.feedback.arrival.flash>0,
  distinct_damage_and_block_feedback: states.feedback.damage.workload===1&&states.feedback.damage.cat<1&&states.feedback.damage.slot>1&&states.feedback.damage.red>0&&states.feedback.block.workload===0&&states.feedback.block.cat===1&&states.feedback.block.slot===1&&states.feedback.block.red===0&&states.feedback.block.green>0&&states.feedback.block.bullets===1,
  shadow_blinks_with_cat: states.feedback.blink.every(f=>f.cat===f.shadow)&&states.feedback.blink.some(f=>f.cat)&&states.feedback.blink.some(f=>!f.cat),
  pooled_work_eyes_render_and_freeze: states.feedback.eyes.visible===states.feedback.eyes.bullets&&states.feedback.eyes.frozen,
  bullet_cues_render_without_folder_gap_borders_in_wechat: states.feedback.cues.homing==='homing'&&states.feedback.cues.trail&&states.feedback.cues.scale>1&&Math.abs(states.feedback.cues.tilt)>1&&states.feedback.cues.gapBordersRemoved,
  background_resume_can_be_interrupted_safely: states.background.paused&&!states.background.countdown&&states.backgroundCountdown.paused&&states.backgroundCountdown.countdown&&states.interruptedCountdown.wasActive&&states.interruptedCountdown.paused&&!states.interruptedCountdown.countdown&&states.interruptedCountdown.elapsed===states.interruptedCountdown.beforeElapsed&&!states.backgroundResumed.paused,
  block_sound_is_quieter_than_damage: states.audio.starts.some(s=>s.name==='block'&&s.volume===0.35)&&states.audio.starts.some(s=>s.name==='hit'&&s.volume===0.65),
  fifteen_audio_clips_load_and_play: states.audio.clips.length===15&&states.audio.clips.every(c=>c.duration>0.025)&&states.audio.starts.length>=8&&states.audio.starts.every(c=>c.duration>0),
  mute_and_unmute_persist: !states.muted.enabled&&!states.muted.persisted&&states.muted.count===muteCount&&states.unmuted.enabled&&states.unmuted.persisted&&states.unmuted.count>muteCount,
  confirmed_exit_saves_current_run: states.exitPrompt.open&&states.exitPrompt.copy.includes('保存本局成绩')&&!states.home.started&&states.home.runs===states.exitBefore.runs+1&&states.home.best===states.exitBefore.score,
  cancelling_exit_keeps_run: !states.exitCancelled.open&&states.exitCancelled.started&&states.exitCancelled.runs===states.exitBefore.runs,
  home_keeps_records_and_replays_tutorial: states.home.record.includes('个人最佳')&&states.replay.step==='intro'&&states.replay.protected,
  tutorial_has_no_skip_button_or_invisible_skip_hitbox: ['practice','practice-retry'].includes(states.noSkip.step)&&states.noSkip.protected&&!states.noSkip.exists&&states.noSkip.action===null,
  local_progress_persists: states.persisted.runs===states.home.runs&&states.persisted.tutorialCompleted&&states.persisted.soundEnabled,
  no_runtime_errors: consoleErrors === '',
};
const result = { passed: Object.values(checks).every(Boolean), checks, buildFingerprint: states.initial.fingerprint, states, consoleErrors,
  visualEvidence: 'DevTools screenshot APIs returned black or stale frames; visual acceptance requires physical phones.' };
states.portrait=evaluate('w.__gm=g;return '+PORTRAIT_FIXTURE.replaceAll('window','w'));
Object.assign(checks,portraitChecks(states.portrait));
result.passed=Object.values(checks).every(Boolean);
writeFileSync(resolve(out, 'wechat-result.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
