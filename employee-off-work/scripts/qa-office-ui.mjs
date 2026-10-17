/** Integrated UI/input regression on the actual Cocos canvas, with optional WeChat simulator. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const wechat = process.argv.includes('--wechat');
const project = resolve(process.env.WECHAT_PROJECT ?? 'build/wechatgame');
const out = resolve(process.env.OFFICE_UI_OUT ?? 'temp/qa/office-ui'); mkdirSync(out, { recursive: true });
const checks = {}, errors = [], inputNotes = []; let socket, send;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function call(name, args = []) {
  const ide = process.env.WECHAT_IDE ?? 'C:/Program Files (x86)/Tencent/微信web开发者工具';
  const boot = `const e=process.argv[1],a=process.argv.slice(2);process.env.cwd=process.cwd();process.argv=[process.execPath,e,'--electron'].concat(a);require(e)`;
  const r = spawnSync(resolve(ide, '微信开发者工具.exe'), ['-e', boot,
    resolve(ide, 'resources/app.asar.unpacked/js/common/cli/skill-index.js'), '-c', 'Codex', name,
    '--project', project, ...args], {
    encoding: 'utf8', windowsHide: true, timeout: 60000, maxBuffer: 12 * 1024 * 1024,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  });
  const data = JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
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
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: `http://127.0.0.1:${process.env.GAME_PORT ?? 7456}/?office-ui` });
}
async function evaluate(body) {
  if (wechat) return call('automation_evaluate', ['--fn-source', `function(){
    var w=typeof GameGlobal==='undefined'?null:GameGlobal.__gameContextWindow,cc=w&&(w.cc||(w.System&&w.System.get(w.System.resolve('cc'))));
    var s=cc&&cc.director.getScene();
    if(!s&&cc&&cc.director.root){cc.game.resume();cc.director.resume();cc.director.tick(0);s=cc.director.getScene();}
    var g=s&&s.getChildByName('Canvas').components.find(c=>cc.js.getClassName(c)==='GameMain');
    if(!g)return null;var m=g.model,u=g.interface;${body}}`]).result;
  const r = await send('Runtime.evaluate', { expression: `(async()=>{
    if(typeof System==='undefined')return null;const cc=await System.import('cc'),scene=cc.director.getScene(),g=scene&&scene.getChildByName('Canvas').components.find(c=>cc.js.getClassName(c)==='GameMain');
    if(!g)return null;const m=g.model,u=g.interface;${body}})()`, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value;
}
async function shot(name) {
  if (wechat) {
    // Surface thumbnails can retain an older frame; they are diagnostics, never visual assertions.
    await evaluate('cc.game.resume();cc.director.resume();cc.director.tick(0);return true;');
    call('simulator_screenshot', ['--path', resolve(out, `wechat-${name}.png`)]);
    return;
  }
  const data = await evaluate(`cc.director.tick(0);return cc.game.canvas.toDataURL('image/png');`);
  writeFileSync(resolve(out, `${wechat ? 'wechat' : 'web'}-${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
}
async function tap(boxExpression, scale = '1') {
  if (process.argv.includes('--scripted-input')) {
    await evaluate(`g.appVisible=true;var b=${boxExpression},s=${scale},offset=u.exitOpen?u.exitRoot.position.y:u.friends.open?u.friends.card.position.y:u.helpOpen?u.helpRoot.position.y:u.modal.position.y,p={x:360+b.x*s,y:m.height/2+b.y*s+offset};var action=u.friends.open?u.friends.actionAt(p):u.actionAt(p);if(!action)throw Error('No action at scripted hit position');g.handleMenuAction(action);g.draw();return true;`);
    return;
  }
  const p = await evaluate(`g.appVisible=true;var b=${boxExpression},v=cc.view.getViewportRect(),f=cc.view.getFrameSize(),d=${wechat ? 'w.' : ''}devicePixelRatio||1,s=${scale},offset=u.exitOpen?u.exitRoot.position.y:u.friends.open?u.friends.card.position.y:u.helpOpen?u.helpRoot.position.y:u.modal.position.y;
    return {x:(v.x+v.width*(360+b.x*s)/720)/d,y:f.height-(v.y+v.height*(m.height/2+b.y*s+offset)/m.height)/d};`);
  if (wechat) call('automation_game_action', ['--action', 'tap', '--x', String(p.x), '--y', String(p.y)]);
  else for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, ...p, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
  await evaluate('g.draw();return true;');
}
async function swipeGuide() {
  const p = await evaluate('var f=cc.view.getFrameSize(),cy=m.height/2+u.helpRoot.position.y+u.helpViewport.position.y*u.helpScale,dy=Math.min(130,u.helpViewportHeight*u.helpScale*f.height/m.height*0.35);return {x:f.width/2,y:f.height*(1-cy/m.height)+dy,distance:dy*2};');
  if (wechat) {
    try {
      call('automation_game_action',['--action','swipe','--start-x',String(p.x),'--start-y',String(p.y),'--end-x',String(p.x),'--end-y',String(p.y-p.distance),'--duration','350']);
    } catch (error) {
      // DevTools may apply the native swipe but lose its acknowledgement.
      // Accept only that known timeout AND a verified scroll in the actual view.
      if (!String(error).includes('timeout waiting for automator response') ||
          !await evaluate('return u.helpScroll.getScrollOffset().y>30;')) throw error;
      inputNotes.push('Native swipe acknowledgement timed out; actual runtime scroll offset verified.');
    }
    await evaluate('cc.director.tick(0);return true;'); return;
  }
  await send('Input.dispatchMouseEvent', {type:'mousePressed',x:p.x,y:p.y,button:'left',buttons:1,clickCount:1});
  for (let i=1;i<=12;i++) {
    await send('Input.dispatchMouseEvent', {type:'mouseMoved',x:p.x,y:p.y-i*p.distance/12,button:'left',buttons:1});
    await sleep(20);
  }
  await send('Input.dispatchMouseEvent', {type:'mouseReleased',x:p.x,y:p.y-p.distance,button:'left',buttons:0,clickCount:1});
  await sleep(250);
}
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      if (await evaluate('if(!g.artReady)cc.director.tick(0);return g.artReady;')) { ready = true; break; }
    } catch (error) {
      if (!wechat || i >= 2 || !String(error).includes('timeout waiting for automator response')) throw error;
      inputNotes.push('Simulator startup query timed out; read-only readiness query retried.');
    }
    await sleep(500);
  }
  if (!ready) throw new Error('Game artwork did not finish loading');
  await evaluate('u.root.active=true;g.overlay.node.active=true;g.appVisible=true;cc.game.resume();cc.director.resume();g.goHome();g.draw();return true;');
  checks.interface_root_visible = await evaluate('return u.root.active&&g.overlay.node.active;');
  if (process.argv.includes('--ui-details')) {
    const states = {};
    const saved = await evaluate('return JSON.stringify(g.progress.profile);');
    await evaluate('g.restart(true);g.draw();return true;');
    checks.intro_has_requested_copy_and_folder = await evaluate("return u.panel.node.active&&u.panel.enabled&&!!u.panel.spriteFrame&&!u.hero.node.active&&!u.tutorialBadge.node.active&&u.subtitle.string.replace(/\\s/g,'')==='在正式摸鱼之前先来熟悉一下基础操作吧';");
    await tap('u.buttons.primary');
    checks.intro_button_starts_practice = await evaluate("return g.guide.step==='practice'&&m.workload===2&&m.energy===80;");
    await evaluate('g.appVisible=false;g.hitFlash=0.5;g.draw();return true;');
    checks.damage_overlay_covers_hud_and_full_viewport = await evaluate("const t=g.overlay.node.getComponent('cc.UITransform');return g.hitFlash===0.5&&t.width===720&&t.height===m.height&&g.overlay.node.position.x===0&&g.overlay.node.position.y===0&&g.overlay.node.getSiblingIndex()>g.artHud.root.getSiblingIndex();");
    await evaluate("g.hitFlash=0;g.guide.start(false);m.practiceProtected=false;m.paused=true;m.elapsed=23;g.draw();return true;");
    await tap('u.helpButton');
    const frame = await evaluate('return [u.helpHeight,u.helpViewportHeight,u.helpTitle.node.position.y,u.helpBackBox.y,u.helpTabs[0].node.position.y];');
    await tap('{x:0,y:u.helpTabs[1].node.position.y}', 'u.helpScale');
    checks.bullets_keep_frame_and_header = await evaluate(`return JSON.stringify([u.helpHeight,u.helpViewportHeight,u.helpTitle.node.position.y,u.helpBackBox.y,u.helpTabs[0].node.position.y])===${JSON.stringify(JSON.stringify(frame))};`);
    await tap('{x:178,y:u.helpTabs[2].node.position.y}', 'u.helpScale');
    states.resources = await evaluate("return {page:u.helpPage,mask:!!u.helpViewport.getComponent('cc.Mask'),height:u.helpContent.getComponent('cc.UITransform').height,viewport:u.helpViewportHeight,agent:u.helpRows[3].title.string,offset:u.helpScroll.getScrollOffset()};");
    checks.resources_keep_frame_and_header = await evaluate(`return JSON.stringify([u.helpHeight,u.helpViewportHeight,u.helpTitle.node.position.y,u.helpBackBox.y,u.helpTabs[0].node.position.y])===${JSON.stringify(JSON.stringify(frame))};`);
    checks.resources_are_clipped_and_scrollable = await evaluate("return !!u.helpViewport.getComponent('cc.Mask')&&u.helpContent.getComponent('cc.UITransform').height>u.helpViewportHeight+100&&u.helpRows[3].title.string==='Agent';");
    await swipeGuide();
    checks.native_swipe_reveals_agent = await evaluate('return u.helpScroll.getScrollOffset().y>=u.helpScroll.getMaxScrollOffset().y-50&&u.helpScroll.getScrollOffset().y>30;');
    checks.guide_scroll_preserves_paused_run = await evaluate('return m.paused&&m.elapsed===23&&!g.dragging;');
    await shot('fixed-guide-resources-bottom');
    await tap('{x:0,y:u.helpTabs[1].node.position.y}', 'u.helpScale');
    await tap('{x:178,y:u.helpTabs[2].node.position.y}', 'u.helpScale');
    states.reset = await evaluate('return {page:u.helpPage,offset:u.helpScroll.getScrollOffset()};');
    checks.tab_change_resets_scroll = await evaluate('return Math.abs(u.helpScroll.getScrollOffset().y)<1;');
    await tap('u.helpBackBox', 'u.helpScale');
    checks.close_returns_to_paused_settings = await evaluate('return !u.helpOpen&&u.modal.active&&m.paused&&m.elapsed===23;');
    await evaluate(`g.appVisible=true;g.progress.profile=${saved};g.progress.save();g.goHome();g.draw();return true;`);
    checks.no_runtime_errors = errors.length===0;
    const report={passed:Object.values(checks).every(Boolean),checks,states,errors,inputNotes};
    writeFileSync(resolve(out, `${wechat?'wechat':'web'}-ui-details-result.json`),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2)); process.exit(report.passed?0:1);
  }
  if (process.argv.includes('--tutorial-flow')) {
    const saved=await evaluate('return JSON.stringify(g.progress.profile);');
    const host=wechat?'w':'window';
    await evaluate(`g.progress.profile.tutorialRevision=0;g.progress.profile.tutorialCompleted=false;
      var host=${host};host.__tutorialFrames={};host.__tutorialOriginalGuide=u.updateGuide.bind(u);
      u.updateGuide=function(...args){host.__tutorialOriginalGuide(...args);var guide=args[0];
        if(!host.__tutorialFrames[guide.step])host.__tutorialFrames[guide.step]={step:guide.step,energy:m.energy,workload:m.workload,shield:m.shieldTime,
          elapsed:m.elapsed,score:m.score,reward:u.rewardLabel.string,rewardVisible:u.rewardRoot.active,path:u.tutorialCueRoot.active,hand:u.tapHandRoot.active,
          fish:m.skillOrbs.length,ai:m.aiPickups.map(p=>({kind:p.kind,x:p.x,y:p.y})),completed:g.progress.profile.tutorialRevision===6};
        if(guide.active)g.appVisible=false;};g.restart(true);g.draw();return true;`);
    async function advanceTo(step) {
      return evaluate(`for(var i=0;i<600&&g.guide.step!==${JSON.stringify(step)};i++){g.appVisible=true;g.update(0.05);}g.appVisible=false;g.draw();return g.guide.step===${JSON.stringify(step)};`);
    }
    async function dragTarget(expression) {
      const p=await evaluate(`var target=${expression},f=cc.view.getFrameSize();return {start:{x:m.player.x*f.width/720,y:(1-m.player.y/m.height)*f.height},end:{x:target.x*f.width/720,y:(1-target.y/m.height)*f.height}};`);
      if(wechat)call('automation_game_action',['--action','swipe','--start-x',String(p.start.x),'--start-y',String(p.start.y),'--end-x',String(p.end.x),'--end-y',String(p.end.y),'--duration','450']);
      else {
        await send('Input.dispatchMouseEvent',{type:'mousePressed',...p.start,button:'left',buttons:1,clickCount:1});
        for(let i=1;i<=15;i++){await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.start.x+(p.end.x-p.start.x)*i/15,y:p.start.y+(p.end.y-p.start.y)*i/15,button:'left',buttons:1});await sleep(15);}
        await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p.end,button:'left',buttons:0,clickCount:1});
      }
    }
    checks.intro_starts_with_two_slots_four_charges_and_no_resources=await evaluate("return g.guide.step==='intro'&&m.workload===2&&m.energy===80&&m.skillOrbs.length===0&&m.aiPickups.length===0;");
    await tap('u.buttons.primary');
    checks.dodge_is_first_and_nearby_bullets_are_visible=await evaluate("return g.guide.step==='practice'&&m.workload===2&&m.bullets.length===3&&m.bullets.every(b=>b.y>m.player.y&&b.y<m.player.y+250)&&u.guideText.string.includes('满 3 格失败');");
    if(!wechat)await shot('01-dodge');
    await dragTarget('{x:600,y:m.player.y+90}');
    checks.native_drag_actually_moves_player=await evaluate('return m.player.x>550;');
    checks.actual_dodge_required_before_praise=await advanceTo('dodge-reward');
    checks.dodge_has_praise_without_early_fish=await evaluate("return u.rewardRoot.active&&u.rewardLabel.string==='躲得漂亮！'&&m.workload===2&&m.skillOrbs.length===0;");
    if(!wechat)await shot('02-dodge-praise');
    await advanceTo('fish');
    checks.fish_has_dashed_path_and_agent_is_absent=await evaluate("return u.tutorialCueRoot.active&&!u.tapHandRoot.active&&m.skillOrbs.length===1&&m.aiPickups.length===0;");
    if(!wechat)await shot('03-fish-path');
    await dragTarget('m.skillOrbs[0]');await advanceTo('collect-reward');
    checks.actual_fish_fills_last_slot_and_awards_good=await evaluate("return m.energy===100&&u.rewardRoot.active&&u.rewardLabel.string==='GOOD!';");
    if(!wechat)await shot('04-fish-good');
    await advanceTo('shield');
    checks.full_shield_shows_animated_double_tap_hand=await evaluate("return u.tapHandRoot.active&&u.tapHandRoot.getChildByName('DoubleTapCaption').getComponent('cc.Label').string==='双击屏幕'&&u.guideText.string.includes('3 秒免疫');");
    checks.hand_clears_character_notice_and_screen_edges=await evaluate("var p=u.tapHandRoot.position,noticeTop=u.guideRoot.position.y+84;return p.x-97>=-320&&p.x+113<=320&&p.y-164>=noticeTop+36&&Math.abs(p.x+360-m.player.x)>=130&&p.y+80<m.height/2-245;");
    checks.hand_anchor_stays_still_during_the_tap_animation=await evaluate("var p={x:u.tapHandRoot.position.x,y:u.tapHandRoot.position.y};g.animationClock+=0.36;g.draw();return u.tapHandRoot.position.x===p.x&&u.tapHandRoot.position.y===p.y;");
    if(!wechat){
      await shot('05-double-tap-hand');
      await evaluate('g.animationClock+=0.36;g.draw();return true;');
      await shot('05b-double-tap-second-contact');
    }
    await evaluate("for(var i=0;i<200;i++){g.appVisible=true;g.update(0.05);}g.appVisible=false;return true;");
    checks.waiting_cannot_skip_double_tap=await evaluate("return g.guide.step==='shield'&&m.energy===100&&m.aiPickups.length===0;");
    if(wechat)await evaluate('var p={...m.player};g.press(p,100);g.release(p,100.05);g.press(p,100.15);g.release(p,100.2);g.consumeEvents();g.draw();return true;');
    else {
      const p=await evaluate('var f=cc.view.getFrameSize();return {x:m.player.x*f.width/720,y:(1-m.player.y/m.height)*f.height};');
      for(let i=0;i<2;i++)for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,...p,button:'left',buttons:type==='mousePressed'?1:0,clickCount:1});
      await sleep(80);
    }
    checks.real_immunity_awards_praise_and_hides_hand=await evaluate("return g.guide.step==='shield-reward'&&m.shieldTime>0&&m.energy===0&&u.rewardLabel.string==='太棒啦！'&&!u.tapHandRoot.active&&m.aiPickups.length===0;");
    checks.immunity_status_appears_below_character_on_activation=await evaluate("return g.immunityLabel.node.active&&g.immunityLabel.string==='免疫已开启'&&g.immunityLabel.node.position.y<m.player.y-m.height/2-60;");
    if(!wechat)await shot('06-shield-praise');
    checks.immunity_has_a_separate_active_stage=await advanceTo('shield-active');
    checks.agent_waits_until_immunity_ends=await evaluate('return m.shieldTime>0&&m.aiPickups.length===0&&m.workload===2;');
    checks.immunity_status_remains_visible_after_launch_effect=await evaluate("return g.shieldReleaseTime===0&&g.immunityLabel.node.active&&g.immunityLabel.string==='免疫已开启';");
    if(!wechat)await shot('07-immunity-active');
    await advanceTo('agent');
    checks.immunity_status_clears_when_protection_ends=await evaluate("return m.shieldTime===0&&!g.immunityLabel.node.active&&g.immunityLabel.string==='';");
    checks.agent_enters_from_outside_after_shield=await evaluate(`var f=${host}.__tutorialFrames.agent;return !!f&&f.shield===0&&f.ai.length===1&&f.ai[0].kind==='agent'&&(f.ai[0].x<0||f.ai[0].x>720)&&u.tutorialCueRoot.active;`);
    if(!wechat)await shot('08-agent-entry');
    await evaluate('for(var i=0;i<100;i++){g.appVisible=true;g.update(0.05);}g.appVisible=false;g.draw();return true;');
    await dragTarget('m.aiPickups[0]');await advanceTo('agent-reward');
    checks.real_agent_removes_two_workloads_and_awards_praise=await evaluate("return m.workload===0&&g.guide.lowered===2&&m.aiPickups.length===0&&u.rewardLabel.string==='你学会啦！';");
    if(!wechat)await shot('09-agent-good');
    await advanceTo('ready');
    checks.ready_confirms_two_slot_reduction_without_saving_early=await evaluate("return u.subtitle.string.includes('降低 2 格')&&g.progress.profile.tutorialRevision!==6&&m.elapsed===0&&m.score===0;");
    if(!wechat)await shot('10-ready');
    await tap('u.buttons.primary');
    checks.confirmation_starts_clean_normal_game=await evaluate(`var f=${host}.__tutorialFrames.off;return f&&f.completed&&f.energy===0&&f.workload===0&&f.shield===0&&!m.practiceProtected&&g.progress.profile.shieldHintSeen;`);
    const frames=await evaluate(`return ${host}.__tutorialFrames;`);
    await evaluate(`u.updateGuide=${host}.__tutorialOriginalGuide;delete ${host}.__tutorialOriginalGuide;g.progress.profile=${saved};g.progress.save();g.appVisible=true;g.goHome();g.draw();return true;`);
    checks.no_runtime_errors=errors.length===0;
    const report={passed:Object.values(checks).every(Boolean),checks,frames,errors,input:wechat?'Native simulator swipe/tap with controlled stage timing; double tap through controller in one call.':'Native browser pointer input with controlled stage timing.'};
    writeFileSync(resolve(out,`${wechat?'wechat':'web'}-tutorial-flow-result.json`),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));socket?.close();process.exit(report.passed?0:1);
  }
  if (process.argv.includes('--layout-refine')) {
    const saved = await evaluate('return JSON.stringify(g.progress.profile);');
    await evaluate('g.restart(true);g.appVisible=false;g.draw();return true;');
    checks.compact_intro_without_icons = await evaluate('return !u.panel.node.active&&!u.tutorialBadge.node.active&&u.buttons.primary.y>-150;');
    await shot('tutorial-intro');
    await tap('u.buttons.primary');
    checks.intro_starts_practice = await evaluate("return g.guide.step==='practice'&&!m.paused;");
    await evaluate("g.appVisible=false;g.guide.step='ready';g.draw();return true;");
    checks.compact_completion_without_icons = await evaluate('return !u.panel.node.active&&!u.tutorialBadge.node.active&&u.buttons.primary.y>-150;');
    await shot('tutorial-ready'); await tap('u.buttons.primary');
    checks.completion_starts_game = await evaluate("return m.started&&!m.paused&&g.guide.step!=='ready';");
    await evaluate('g.appVisible=false;m.paused=true;m.elapsed=23;g.draw();return true;');
    checks.settings_alignment_and_compact_home = await evaluate('return u.sound.node.position.x===u.settingsHelp.node.position.x&&u.sound.node.position.x===u.friendsEntry.node.position.x&&!u.settingsIcons[3].node.active&&u.buttons.secondary.width<240;');
    await shot('settings');
    await tap('u.helpButton'); await tap('{x:178,y:u.helpTabs[2].node.position.y}', 'u.helpScale');
    checks.native_guide_paging = await evaluate("return u.helpOpen&&u.helpPage==='resources'&&m.paused;");
    checks.resources_visible_without_scrolling = await evaluate('return u.helpRows[3].body.node.position.y-36+u.helpContent.position.y>=-u.helpViewportHeight/2-1&&u.helpRows[2].title.string===\'AI\'&&u.helpRows[3].title.string===\'Agent\';');
    checks.resource_icons_and_effects_match = await evaluate("return ['fish','leave','helper','agent'].every((key,i)=>u.helpRows[i].icon.spriteFrame===u.guideFrames.get(key))&&u.helpRows[2].body.string.includes('1 格')&&u.helpRows[3].body.string.includes('2 格');");
    await evaluate('u.resize(m.height,{cssWidth:390,safeTop:400,safeBottom:240});g.draw();return true;');
    await swipeGuide();
    checks.native_guide_scrolling = await evaluate('return u.helpScroll.getScrollOffset().y>30&&m.elapsed===23;');
    await shot('help-resources-bottom');
    await evaluate('g.resizeViewport();g.draw();return true;');
    await tap('u.helpBackBox', 'u.helpScale');
    checks.guide_close_keeps_paused_run = await evaluate('return !u.helpOpen&&m.paused&&m.elapsed===23;');
    await tap('u.friendsButton');
    checks.settings_opens_board = await evaluate('return u.friends.open&&m.paused;');
    // Exercise the explicit unavailable state without requesting real friend records.
    await evaluate('g.appVisible=false;u.friends.show(false,g.progress.profile.bestScore,false,true);g.draw();return true;');
    checks.clean_board_and_empty_copy = await evaluate("return !u.friends.card.getChildByName('FriendsTrophy')&&!u.friends.fallback.getChildByName('FallbackBook')&&!u.friends.back.node.active&&!u.friends.buttons['friends-close']&&!u.friends.card.getChildByName('FriendsSharePaintedButton')&&!u.friends.fallbackTitle.node.active&&u.friends.body.string==='暂无好友积分排名';");
    await shot('friends-from-settings');
    await tap('u.friends.closeButton','u.friends.scale');
    checks.round_close_preserves_paused_game = await evaluate('return !u.friends.open&&m.paused&&m.elapsed===23;');
    await tap('u.buttons.secondary');
    checks.return_home_requires_confirmation = await evaluate('return u.exitOpen&&m.started&&m.paused;');
    await shot('exit-confirmation');
    await tap('u.exitConfirmBox');
    checks.compact_home_button_returns_home = await evaluate("return g.menuMode==='home'&&!m.started;");
    await evaluate(`g.progress.profile=${saved};g.progress.save();g.audio.enabled=g.progress.profile.soundEnabled;g.appVisible=true;g.goHome();g.draw();return true;`);
    const report={passed:Object.values(checks).every(Boolean),checks,errors,note:'Default empty leaderboard shown with explicit unavailable-state fixture.',input:process.argv.includes('--scripted-input')?'Scripted game hit testing and action dispatch; native automation is not verified.':'Native automation',visualVerification:wechat?'Surface screenshots are diagnostic only: DevTools can retain an older frame and direct canvas export returned blank. Web canvas images are reviewed separately.':'Web canvas images reviewed separately.'};
    writeFileSync(resolve(out,`${wechat?'wechat':'web'}-layout-refine${process.argv.includes('--scripted-input')?'-scripted':''}-result.json`),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));process.exit(report.passed?0:1);
  }
  if (process.argv.includes('--guide-copy')) {
    await evaluate("m.started=true;m.paused=true;g.guide.start(false);g.draw();return true;");
    await tap('u.helpButton');
    await tap('{x:0,y:u.helpTabs[1].node.position.y}', 'u.helpScale');
    checks.final_guide_copy_loaded = await evaluate("return u.helpOpen&&u.helpPage==='bullets'&&u.helpRows[1].body.string.includes('穿缝加分')&&u.helpRows[2].body.string.includes('甩开可加分');");
    await shot('guide-final-copy');
    await tap('u.helpBackBox', 'u.helpScale');
    checks.close_retains_paused_run = await evaluate('return !u.helpOpen&&m.paused;');
    await evaluate('g.goHome();g.draw();return true;');
    const report = { passed:Object.values(checks).every(Boolean),checks,errors };
    writeFileSync(resolve(out, `${wechat?'wechat':'web'}-guide-copy-result.json`), JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2)); process.exit(report.passed?0:1);
  }
  checks.two_tutorial_assets_loaded = await evaluate('return g.artReady&&g.art.size===73&&!!u.tutorialIntroFrame&&!!u.tutorialCompleteFrame;');
  const backup = await evaluate('return JSON.stringify(g.progress.profile);');
  await evaluate('g.restart(true);g.draw();return true;'); await shot('tutorial-intro');
  checks.intro_uses_illustrated_folder_with_requested_copy = await evaluate("return u.panel.node.active&&u.panel.enabled&&!!u.panel.spriteFrame&&!u.tutorialArt.node.active&&!u.hero.node.active&&!u.tutorialBadge.node.active&&u.subtitle.string.replace(/\\s/g,'')==='在正式摸鱼之前先来熟悉一下基础操作吧'&&u.title.node.position.y>u.subtitle.node.position.y+80&&u.buttons.primary.y<u.subtitle.node.position.y-80;");
  await tap('u.buttons.primary');
  checks.native_intro_button_begins_practice = await evaluate("return g.guide.step==='practice'&&!m.paused;");
  await shot('practice-guide');
  await evaluate("m.paused=false;g.appVisible=false;g.guide.step='ready';g.draw();return true;"); await shot('tutorial-ready');
  checks.ready_uses_compact_notice_without_icons = await evaluate("return !u.panel.node.active&&!u.tutorialBadge.node.active&&!u.hero.node.active&&u.buttons.primary.y>-150;");
  await tap('u.buttons.primary');
  await evaluate('g.appVisible=false;g.hitFlash=0;g.draw();return true;'); await shot('damage-before');
  await evaluate('g.hitFlash=0.5;g.shakeTime=0.2;g.draw();return true;'); await shot('damage-fullscreen');
  checks.damage_overlay_stays_in_screen_space = await evaluate('const t=g.overlay.node.getComponent("cc.UITransform");return t.width===720&&t.height===m.height&&g.overlay.node.position.x===0&&g.overlay.node.position.y===0&&g.overlay.node.getSiblingIndex()>g.artHud.root.getSiblingIndex();');
  await evaluate('g.hitFlash=0;g.shakeTime=0;g.draw();return true;');
  await evaluate('m.paused=true;m.elapsed=23;g.draw();return true;'); await shot('settings');
  if (!wechat) {
    const center = await evaluate('return {x:360,y:m.height/2+u.buttons.sound.y};');
    await evaluate(`g.press(${JSON.stringify(center)},0);return true;`);
    const down = await evaluate('cc.director.tick(0);return cc.game.canvas.toDataURL();');
    await evaluate('g.drag({x:20,y:20});return true;');
    const moved = await evaluate('cc.director.tick(0);return cc.game.canvas.toDataURL();');
    await evaluate('g.release({x:20,y:20},0.1);return true;');
    const released = await evaluate('cc.director.tick(0);return cc.game.canvas.toDataURL();');
    checks.press_feedback_clears_on_move_out = down!==moved&&moved===released;
    checks.close_has_48px_touch_target = await evaluate("return u.actionAt({x:360+u.closeButton.x,y:m.height/2+u.closeButton.y+u.closeButton.height/2+10})==='primary';");
  }
  checks.settings_rows_have_separate_hit_regions = await evaluate("return u.actionAt({x:360,y:m.height/2+u.buttons.sound.y})==='sound'&&u.actionAt({x:360,y:m.height/2+u.helpButton.y})==='help'&&u.actionAt({x:360,y:m.height/2+u.friendsButton.y})==='friends'&&u.buttons.sound.y-u.helpButton.y>=u.helpButton.height+15;");
  checks.settings_labels_align_and_home_wraps_copy = await evaluate('return u.sound.node.position.x===u.settingsHelp.node.position.x&&u.sound.node.position.x===u.friendsEntry.node.position.x&&!u.settingsIcons[3].node.active&&u.buttons.secondary.width<240;');
  checks.settings_icons_preserve_shape_and_row_centers = await evaluate('return u.settingsIcons.slice(0,3).every((icon,i)=>{const t=icon.node.getComponent("cc.UITransform"),r=icon.spriteFrame.rect,labels=[u.sound,u.settingsHelp,u.friendsEntry];return Math.abs(t.width/t.height-r.width/r.height)<0.001&&Math.abs(icon.node.position.y-labels[i].node.position.y)<0.01&&Math.max(t.width,t.height)<=76;});');
  const sound = await evaluate('return g.progress.profile.soundEnabled;');
  await tap('u.buttons.sound');
  checks.sound_toggle_updates_profile_and_switch = await evaluate(`return g.progress.profile.soundEnabled!==${sound}&&u.settingsState.string===(${sound}?'关':'开');`);
  await tap('u.helpButton'); await shot('help');
  checks.help_preserves_paused_run = await evaluate('return u.helpOpen&&m.paused&&m.elapsed===23&&!u.modal.active;');
  await evaluate('g.press({x:650,y:m.height-40},0);g.release({x:650,y:m.height-40},0.1);g.draw();return true;');
  checks.help_background_cannot_resume = await evaluate('return u.helpOpen&&m.paused&&!g.resume.active;');
  checks.help_has_only_top_close = await evaluate("return !u.helpRoot.getChildByName('HelpBack')&&!!u.helpRoot.getChildByName('HelpClose');");
  checks.controls_have_no_misleading_icons = await evaluate('return u.helpRows.slice(0,3).every(r=>!r.icon.node.active&&r.title.node.position.x===r.body.node.position.x);');
  const guideGeometry = await evaluate('return [u.helpHeight,u.helpViewportHeight,u.helpTitle.node.position.y,u.helpBackBox.y,u.helpTabs[0].node.position.y];');
  await tap('{x:0,y:u.helpTabs[1].node.position.y}', 'u.helpScale'); await shot('help-bullets');
  checks.guide_has_all_three_bullet_types = await evaluate("return u.helpPage==='bullets'&&u.helpRows.slice(0,3).every(r=>!!r.icon.spriteFrame)&&u.helpRows.map(r=>r.title.string).join().includes('需求表')&&u.helpRows[2].body.string.includes('追');");
  checks.bullet_icons_match_content = await evaluate("return ['requirement','folder','message'].every((key,i)=>u.helpRows[i].icon.spriteFrame===u.guideFrames.get(key));");
  await tap('{x:178,y:u.helpTabs[2].node.position.y}', 'u.helpScale'); await shot('help-resources');
  checks.guide_has_all_four_resource_types = await evaluate("return u.helpPage==='resources'&&u.helpRows.every(r=>r.icon.spriteFrame&&r.title.node.active)&&u.helpRows[1].body.string.includes('不减负')&&u.helpRows[2].title.string==='AI'&&u.helpRows[2].body.string.includes('1 格')&&u.helpRows[3].title.string==='Agent'&&u.helpRows[3].body.string.includes('2 格');");
  checks.resource_icons_match_content = await evaluate("return ['fish','leave','helper','agent'].every((key,i)=>{const r=u.helpRows[i],t=r.icon.node.getComponent('cc.UITransform'),f=u.guideFrames.get(key).rect;return r.icon.spriteFrame===u.guideFrames.get(key)&&Math.abs(t.width/t.height-f.width/f.height)<0.001&&r.title.node.position.x===r.body.node.position.x;});");
  checks.guide_frame_and_header_stay_fixed_across_tabs = await evaluate(`return JSON.stringify([u.helpHeight,u.helpViewportHeight,u.helpTitle.node.position.y,u.helpBackBox.y,u.helpTabs[0].node.position.y])===${JSON.stringify(JSON.stringify(guideGeometry))};`);
  checks.resources_scroll_inside_fixed_frame = await evaluate("return u.helpContent.getComponent('cc.UITransform').height>u.helpViewportHeight+100&&u.helpFooter.string.includes('上滑');");
  await swipeGuide();
  checks.resource_swipe_reveals_agent_without_resuming_game = await evaluate('const offset=u.helpScroll.getScrollOffset().y,max=u.helpScroll.getMaxScrollOffset().y;return offset>30&&offset>=max-50&&m.paused&&m.elapsed===23;');
  await shot('help-resources-scrolled');
  await tap('{x:0,y:u.helpTabs[1].node.position.y}', 'u.helpScale');
  await tap('{x:178,y:u.helpTabs[2].node.position.y}', 'u.helpScale');
  checks.switching_guide_tab_resets_scroll = await evaluate('return Math.abs(u.helpScroll.getScrollOffset().y)<1;');
  if (!wechat) {
    await evaluate('u.resize(m.height,{cssWidth:390,safeTop:400,safeBottom:240});g.draw();return true;');
    await swipeGuide();
    checks.native_guide_swipe_reveals_lower_rows = await evaluate('return u.helpScroll.getScrollOffset().y>30&&m.paused&&m.elapsed===23;');
    await shot('help-resources-bottom');
    await evaluate('g.resizeViewport();g.draw();return true;');
  }
  await tap('u.helpBackBox', 'u.helpScale');
  checks.help_returns_to_settings = await evaluate('return !u.helpOpen&&u.modal.active&&m.paused;');
  await tap('u.friendsButton'); await shot('friends-from-settings');
  checks.friends_returns_to_same_paused_run = await evaluate("return u.friends.open&&u.friends.back.string==='返回设置'&&m.paused&&m.elapsed===23;");
  checks.friends_no_decorations_or_footer_control = await evaluate("return !u.friends.card.getChildByName('FriendsTrophy')&&!u.friends.fallback.getChildByName('FallbackBook')&&!u.friends.back.node.active&&!u.friends.buttons['friends-close']&&!u.friends.card.getChildByName('FriendsSharePaintedButton')&&u.friends.body.string==='暂无好友积分排名';");
  await tap('u.friends.closeButton', 'u.friends.scale');
  checks.top_close_returns_to_settings = await evaluate('return !u.friends.open&&m.paused&&m.elapsed===23;');
  await tap('u.buttons.secondary'); await shot('exit-confirmation');
  checks.exit_confirmation_preserves_run = await evaluate('return u.exitOpen&&m.started&&m.paused&&m.elapsed===23;');
  checks.exit_dialog_has_finite_visible_transform = await evaluate("const d=u.exitRoot.getChildByName('ExitDialog');return d.active&&Number.isFinite(d.scale.x)&&d.scale.x>0&&Number.isFinite(d.scale.y)&&d.scale.y>0&&!!d.getChildByName('ExitTitle');");
  await evaluate('g.press({x:15,y:15},0);g.release({x:15,y:15},0.1);g.draw();return true;');
  checks.exit_background_cannot_continue = await evaluate('return u.exitOpen&&m.paused&&!g.resume.active;');
  await tap('u.exitCancelBox');
  checks.cancel_exit_preserves_same_game = await evaluate('return !u.exitOpen&&m.paused&&m.elapsed===23;');
  if (wechat) await evaluate('g.__qaToggle=g.togglePause;g.togglePause=function(){this.__qaToggle();this.appVisible=false;};return true;');
  await tap('u.buttons.primary'); await shot('resume-3');
  checks.native_resume_starts_countdown = await evaluate("return g.resume.active&&m.paused&&u.resumeRoot.active&&u.countdown.string==='3';");
  await evaluate('g.resume.remaining=1.2;g.draw();return true;'); await shot('resume-2');
  await evaluate('g.resume.remaining=0.8;g.draw();return true;'); await shot('resume-1');
  if (wechat) await evaluate('g.togglePause=g.__qaToggle;delete g.__qaToggle;g.appVisible=true;return true;');
  await evaluate('g.appVisible=false;g.resume.cancel();m.paused=false;g.guide.start(false);g.draw();return true;');
  checks.wave_notice_removed = await evaluate("return !g.node.getChildByName('WaveNotice')&&!g.node.getChildByName('WaveFolderNote');");
  checks.countdown_has_only_number = await evaluate("return u.resumeRoot.children.length===1&&u.resumeRoot.children[0].name==='CountdownNumber';");
  await evaluate("g.guide.step='collect-reward';g.guide.rewardRemaining=g.guide.rewardDuration*0.5;g.draw();return true;");
  await shot('good-unframed');
    checks.good_restores_unframed_text = await evaluate("return u.rewardRoot.active&&u.rewardLabel.string==='GOOD!'&&u.rewardLabel.node.position.x===0&&u.rewardRoot.children.every(n=>n.name==='AchievementStars'||n.name==='AchievementText');");
  await evaluate("g.guide.start(false);g.draw();return true;");
  await evaluate('m.leaveSlipFlash=1;g.draw();return true;'); await shot('leave-notice');
  checks.leave_notice_shows_approval = await evaluate("return g.hintPaper.node.active&&g.centerText.string.includes('请假获批');");
  await evaluate("m.leaveSlipFlash=0;g.hintTime=1;g.hintText='集满 5 条小鱼后双击免疫';g.draw();return true;"); await shot('immunity-notice');
  await evaluate("g.goHome();g.artReady=false;g.artLoadFailed=true;g.artLoadStatus='重新加载';g.draw();return true;"); await shot('loading-retry');
  checks.retry_is_explicit_button = await evaluate("return u.retryRoot.active&&u.actionAt({x:360,y:m.height/2+u.buttons.primary.y})==='primary'&&u.actionAt({x:360,y:30})===null;");
  await evaluate(`g.appVisible=true;g.artReady=true;g.artLoadFailed=false;g.progress.profile=${backup};g.progress.save();g.audio.enabled=g.progress.profile.soundEnabled;g.goHome();g.draw();return true;`);
  if (!wechat) {
    for (const [width,height] of [[360,640],[430,932]]) {
      await send('Emulation.setDeviceMetricsOverride', { width,height,deviceScaleFactor:1,mobile:true }); await sleep(250);
      await evaluate('g.restart();m.paused=true;g.draw();return true;'); await shot(`settings-${width}x${height}`);
      checks[`settings_fit_${width}`] = await evaluate('return 790*parseFloat(u.settingsPaintKey)<m.height-140&&Math.abs(u.buttons.secondary.y)+u.buttons.secondary.height/2<m.height/2-50;');
    }
    await evaluate('u.resize(m.height,{cssWidth:430,safeTop:120,safeBottom:58});g.draw();return true;');
    checks.settings_obeys_platform_safe_area = await evaluate('const s=parseFloat(u.settingsPaintKey);return u.modal.position.y+395*s<=m.height/2-120&&u.modal.position.y-395*s>=-m.height/2+58;');
    await shot('settings-safe-area');
    await evaluate('u.resize(m.height,{cssWidth:430,safeTop:0,safeBottom:0});g.draw();return true;');
    await evaluate('g.goHome();g.draw();return true;');
  }
  checks.no_runtime_errors = errors.length===0;
  const report = { passed:Object.values(checks).every(Boolean),checks,errors,inputNotes };
  writeFileSync(resolve(out, `${wechat?'wechat':'web'}-result.json`), JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2)); if(!report.passed)process.exitCode=1;
} finally { socket?.close(); }
