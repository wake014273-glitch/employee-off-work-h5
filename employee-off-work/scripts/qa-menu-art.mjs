/** Focused approved-art regression on the actual Cocos canvas (Web or WeChat DevTools). */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TUTORIAL_REVISION } from '../assets/scripts/model/GameExperience.ts';

const wechat = process.argv.includes('--wechat');
const out = resolve(process.env.MENU_QA_OUT ?? 'temp/qa/menu-art'); mkdirSync(out, { recursive: true });
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
  await send('Page.navigate', { url: `http://127.0.0.1:${process.env.GAME_PORT ?? 7456}/?menu-art-final` });
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
  if (wechat) {
    await sleep(200);
    call('simulator_screenshot', ['--path', resolve(out, `wechat-${name}.png`)]);
    return;
  }
  const data = await evaluate(`cc.director.tick(0);return cc.game.canvas.toDataURL('image/png');`);
  writeFileSync(resolve(out, `${wechat ? 'wechat' : 'web'}-${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
}
async function tapPrimary(action = 'primary') {
  const point = await evaluate(`var b=${action === 'friends' ? 'u.friendsButton' : `u.buttons['${action}']`},v=cc.view.getViewportRect(),f=cc.view.getFrameSize(),d=${wechat ? 'w.devicePixelRatio||1' : 'devicePixelRatio||1'};
    var x=360+b.x,y=m.height/2+(u.loading?0:u.modal.position.y)+b.y;
    return {x:(v.x+v.width*x/720)/d,y:f.height-(v.y+v.height*y/m.height)/d};`);
  if (wechat) call('automation_game_action', ['--action', 'tap', '--x', String(point.x), '--y', String(point.y)]);
  else {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', buttons: 1, clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', buttons: 0, clickCount: 1 });
  }
  await sleep(200);
}
try {
  let ready;
  for (let i = 0; i < 30; i++) {
    ready = await evaluate('if(!g.artReady)cc.director.tick(0);return g.artReady&&g.art.size===73&&u.resultFrame.rect.width===1218;');
    if (ready) break; await sleep(500);
  }
  if (!ready) throw new Error('The simulator/browser has an old or incomplete approved menu build');
  const backup = await evaluate('return JSON.stringify(g.progress.profile);');
  await evaluate(`g.progress.profile={version:1,tutorialCompleted:false,tutorialRevision:0,shieldHintSeen:false,soundEnabled:true,bestScore:0,bestSeconds:0,bestWave:0,runs:0};g.goHome();g.draw();return true;`);
  states.first = await evaluate(`return {mode:g.menuMode,started:m.started,step:g.guide.step,record:u.homeNumber.node.active,compact:u.homeArt.spriteFrame.rect.height===1060,height:u.cardHeight};`);
  checks.first_home_waits_and_omits_entire_record_row = states.first.mode === 'home' && !states.first.started && states.first.step === 'off' && !states.first.record && states.first.compact && states.first.height === 1291;
  await shot('first-home'); await tapPrimary();
  states.firstStart = await evaluate('return {step:g.guide.step,elapsed:m.elapsed,started:m.started,paused:m.paused,artReady:g.artReady,mode:g.menuMode};');
  checks.native_start_enters_first_player_tutorial = states.firstStart.step === 'intro' && states.firstStart.elapsed === 0;
  await evaluate(`Object.assign(g.progress.profile,{tutorialCompleted:true,tutorialRevision:${TUTORIAL_REVISION},runs:2,bestScore:12345});g.goHome();g.draw();return true;`);
  states.returning = await evaluate(`return {record:u.homeNumber.node.active,text:u.homeNumber.string,compact:u.homeArt.spriteFrame.rect.height===1060};`);
  checks.returning_home_shows_live_personal_best = states.returning.record && states.returning.text === '012345' && !states.returning.compact;
  await shot('returning-home');
  await tapPrimary('friends');
  checks.native_home_footer_opens_friends_board = await evaluate('return u.friends.open&&!u.modal.active;');
  await evaluate("g.handleMenuAction('friends-close');g.draw();return true;");
  await tapPrimary('secondary');
  checks.native_home_footer_opens_operation_tutorial = await evaluate("return g.guide.step==='intro';");
  await evaluate('g.goHome();g.draw();return true;');
  await tapPrimary();
  checks.returning_start_enters_formal_game = await evaluate(`return m.started&&g.guide.step==='off';`);
  await evaluate(`m.gameOver=true;g.settlement={score:54321,rank:'B · 合格摸鱼',newRecord:true,firstRun:false,bestScore:54321,previousBest:12345,seconds:83,wave:6,maxCombo:9,gaps:4,breaks:2,goal:'下一局：挑战 60000 分'};g.draw();u.resultClock=1;g.draw();return true;`);
  states.result = await evaluate(`return {score:u.score.string,rank:u.rank.string,stamp:u.stamp.string,stats:u.statValues.map(l=>l.string),detail:u.detail.string,goal:u.goal.string};`);
  checks.settlement_replaces_every_example_value = states.result.score === '054321' && states.result.rank === 'B · 合格摸鱼' && states.result.stamp === 'B' && states.result.stats.join('|') === '01:23|第 6 波|9 次' && states.result.detail.includes('4 次') && states.result.detail.includes('2 次') && states.result.goal.includes('60000');
  await shot('result');
  checks.result_paper_replay_and_footer_are_horizontally_centered = await evaluate(`return Math.abs(u.buttons.primary.x)<0.001&&Math.abs(u.friendsButton.x)<0.001&&Math.abs(u.resultArt.node.position.x-(609-558.5))<0.001;`);
  checks.result_friends_button_aligns_with_paper_and_replay_center = await evaluate(`return Math.abs(u.friendsButton.x-u.buttons.primary.x)<0.001&&u.friendsEntry.node.position.x===u.friendsButton.x&&u.actionAt({x:360+u.friendsButton.x,y:m.height/2+u.friendsButton.y})==='friends';`);
  checks.result_sound_and_back_controls_removed = await evaluate(`return !u.sound.node.active&&!u.secondary.node.active&&u.actionAt({x:360,y:m.height/2-u.cardHeight*u.cardScale/2-30})===null;`);
  await tapPrimary('friends');
  checks.native_result_footer_opens_friends_and_preserves_result = await evaluate("return u.friends.open&&m.gameOver&&u.friends.back.string==='返回成绩单';");
  await evaluate("g.handleMenuAction('friends-close');g.draw();return true;");
  await tapPrimary();
  checks.native_result_button_starts_clean_replay = await evaluate(`return m.started&&!m.gameOver&&m.workload===0&&m.wave===1&&m.elapsed<${wechat ? 15 : 2}&&g.guide.step==='off'&&g.settlement===null;`);
  checks.pause_hitbox_matches_button_after_result = await evaluate(`m.paused=true;g.draw();return u.buttons.primary.x===u.primary.node.position.x&&u.actionAt({x:360+u.buttons.sound.x,y:m.height/2+u.buttons.sound.y})==='sound';`);
  await evaluate(`g.goHome();g.artReady=false;g.artLoadComplete=false;g.loadingProgress.reset(0.35);g.artLoadProgress=0.35;g.artLoadFailed=false;g.draw();return true;`);
  states.loading35 = await evaluate(`return {visible:u.loadingRoot.active,menu:u.modal.active,progress:u.loadingProgress,blocked:u.actionAt({x:360,y:m.height/2+u.buttons.primary.y}),
    duplicatedPanel:!!u.loadingRoot.getChildByName('LoadingPanel')||!!u.loadingRoot.getChildByName('LiveLoadingProgress'),
    fill:u.loadingFill.fillRange,source:u.loadingFill.spriteFrame.texture===u.loadingPoster.spriteFrame.texture&&u.loadingFish.spriteFrame.texture===u.loadingPoster.spriteFrame.texture,
    scale:u.loadingCanvas.scale.x,barX:u.loadingEmpty.node.parent.position.x,barY:u.loadingEmpty.node.parent.position.y};`);
  await shot('loading-35');
  await evaluate(`g.artLoadProgress=0.85;g.loadingProgress.reset(0.85);g.draw();return true;`); await shot('loading-85');
  checks.loading_poster_reports_progress_and_blocks_start = states.loading35.visible && !states.loading35.menu && states.loading35.progress === 0.35 && states.loading35.blocked === null && await evaluate('return u.loadingProgress===0.85;');
  checks.single_original_bar_and_fish_follow_actual_progress = !states.loading35.duplicatedPanel&&states.loading35.source&&Math.abs(states.loading35.fill-0.35)<0.0001&&await evaluate('return Math.abs(u.loadingFill.fillRange-0.85)<0.0001;');
  await evaluate(`g.artLoadFailed=true;g.artLoadStatus='重新加载';g.draw();return true;`);
  await shot('loading-retry'); await tapPrimary();
  for (let i = 0; i < 20 && !await evaluate('if(!g.artReady)cc.director.tick(0);return g.artReady;'); i++) await sleep(250);
  // DevTools can pause rendering between automation calls. Render the first
  // ready frame after async resource callbacks before checking the loading UI.
  await evaluate('g.draw();cc.director.tick(0);return true;');
  states.retry = await evaluate(`return {ready:g.artReady,failed:g.artLoadFailed,mode:g.menuMode,loading:u.loadingRoot.active,status:g.artLoadStatus,artCount:g.art.size};`);
  checks.native_retry_returns_to_home = states.retry.ready&&!states.retry.failed&&states.retry.mode==='home'&&!states.retry.loading;
  const sizes = wechat ? [[720, await evaluate('return m.height;')]] : [[375,667],[390,844],[430,932],[360,900],[768,1024]];
  states.layouts = [];
  states.loadingLayouts = [];
  for (const [width, height] of sizes) {
    if (!wechat) { await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }); await sleep(250); }
    for (const record of [false, true]) {
      const layout = await evaluate(`g.progress.profile.runs=${record ? 2 : 0};g.goHome();g.draw();
        var b=u.buttons.primary;
        var inside=box=>Math.abs(box.x)+box.width/2<490*u.cardScale&&box.y-box.height/2>-u.cardHeight*u.cardScale/2+30*u.cardScale&&box.y+box.height/2<b.y-b.height/2;
        var action=box=>u.actionAt({x:360+box.x,y:m.height/2+box.y});
        return {height:m.height,usableHeight:u.usableHeight,scale:u.cardScale,cardHeight:u.cardHeight,buttonY:m.height/2+b.y,buttonHeight:b.height,
          primary:action(b),friends:action(u.friendsButton),tutorial:action(u.buttons.secondary),
          footerInside:inside(u.friendsButton)&&inside(u.buttons.secondary),soundVisible:u.sound.node.active};`);
      states.layouts.push({ width, height, record, ...layout });
      await shot(`home-${record ? 'record' : 'first'}-${width}x${height}`);
    }
    const loadingLayout = await evaluate(`g.goHome();g.artReady=false;g.artLoadComplete=false;g.artLoadFailed=false;g.artLoadProgress=0.5;g.loadingProgress.reset(0.5);g.draw();
      var s=u.loadingCanvas.scale.x;return {posterWidth:1080*s,posterHeight:2400*s,screenHeight:m.height,
        barTop:m.height/2+(1200-2026)*s,barBottom:m.height/2+(1200-2108)*s};`);
    states.loadingLayouts.push({width,height,...loadingLayout});
    await shot('loading-'+width+'x'+height);
    await evaluate('g.artReady=true;g.draw();return true;');
  }
  checks.all_aspects_fit_card_buttons_and_footer = states.layouts.every(s => s.cardHeight*s.scale <= s.usableHeight-120+0.01 && s.primary==='primary' && s.buttonY-s.buttonHeight/2>0 && s.footerInside&&s.friends==='friends'&&s.tutorial==='secondary'&&!s.soundVisible);
  checks.original_loading_bar_remains_visible_on_all_aspects = states.loadingLayouts.every(s=>s.posterWidth<=720.01&&s.posterHeight<=s.screenHeight+0.01&&s.barBottom>0&&s.barTop<s.screenHeight);
  await evaluate(`g.progress.profile=${backup};g.progress.save();g.artReady=true;g.goHome();g.draw();return true;`);
  checks.no_runtime_errors = errors.length === 0;
  const report = { passed: Object.values(checks).every(Boolean), checks, states, errors };
  writeFileSync(resolve(out, `${wechat ? 'wechat' : 'web'}-result.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally { socket?.close(); }
