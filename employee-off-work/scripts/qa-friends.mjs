/** Actual browser canvas and input regression. Row previews use explicit test fixtures, never live friends. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const out = resolve('temp/qa/friends'); mkdirSync(out, { recursive: true });
const port = process.env.CDP_PORT || '18464', gamePort = process.env.GAME_PORT || '18463';
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const socket = new WebSocket(targets.find(item => item.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let sequence = 0; const pending = new Map(), errors = [], checks = {}, states = {};
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id); }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence; pending.set(id, message => message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result));
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async body => {
  const result = await send('Runtime.evaluate', { expression: `(async()=>{
    const cc=await System.import('cc'),g=cc.director.getScene()?.getChildByName('Canvas')?.components.find(c=>cc.js.getClassName(c)==='GameMain');
    if(!g)return null;const u=g.interface,m=g.model;${body}})()`, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value;
};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function shot(name) {
  await sleep(180);
  const result = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(resolve(out, name + '.png'), Buffer.from(result.data, 'base64'));
}
async function tap(action) {
  const point = await evaluate(`const v=cc.view.getViewportRect(),f=cc.view.getFrameSize(),d=devicePixelRatio||1;
    const b=${action === 'friends' ? '{x:u.friendsEntry.node.position.x,y:u.friendsEntry.node.position.y+u.modal.position.y}' : action === 'friends-close' ? 'u.friends.closeButton' : `u.friends.buttons[${JSON.stringify(action)}]`};
    const s=${action === 'friends' ? '1' : 'u.friends.scale'};
    return {x:(v.x+v.width*(360+b.x*s)/720)/d,y:f.height-(v.y+v.height*(m.height/2+b.y*s)/m.height)/d};`);
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, ...point, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
  await sleep(150);
}
try {
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: `http://127.0.0.1:${gamePort}/?friends-qa` }); await sleep(2500);
  for (let attempt = 0; attempt < 60; attempt++) { if (await evaluate('return g.artReady;')) break; await sleep(500); }
  await evaluate('g.goHome();g.draw();return true;'); await shot('web-home-entry');
  await tap('friends');
  states.open = await evaluate('return {open:u.friends.open,fallback:u.friends.fallback.active,modal:u.modal.active,started:m.started};');
  checks.native_entry_opens_browser_explanation = states.open.open && states.open.fallback && !states.open.modal && !states.open.started;
  await shot('web-unavailable');
  await evaluate('u.friends.showPrivacy(true,g.progress.profile.bestScore);return true;');
  checks.privacy_wait_explains_confirmation = await evaluate("return u.friends.fallback.active&&!u.friends.dataRoot.active&&u.friends.body.string.includes('确认');");
  await shot('ui-preview-privacy-wait');
  await evaluate('u.friends.showPrivacy(false,g.progress.profile.bestScore);return true;');
  checks.privacy_decline_explains_retry = await evaluate("return u.friends.body.string.includes('刷新榜单');");
  await shot('ui-preview-privacy-declined');
  await tap('friends-refresh'); checks.refresh_explains_platform = await evaluate("return u.friends.notice.string.includes('微信');");
  await tap('friends-share'); checks.share_explains_platform = await evaluate("return u.friends.notice.string.includes('微信');");
  await send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Space', key: ' ', windowsVirtualKeyCode: 32 });
  checks.space_does_not_start_game_under_board = await evaluate('return !m.started&&u.friends.open;');
  states.aspects = [];
  for (const [width, height, deviceScaleFactor] of [[390, 844, 1], [360, 640, 1], [430, 932, 1], [402, 874, 3]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor, mobile: true }); await sleep(250);
    states.aspects.push(await evaluate('return {height:m.height,scale:u.friends.scale,fits:u.friends.panelHeight*u.friends.scale<=u.friends.usableHeight-95&&636*u.friends.scale<=665};'));
  }
  checks.board_fits_all_aspects = states.aspects.every(state => state.fits);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await sleep(200);
  await tap('friends-close'); checks.return_restores_home = await evaluate('return !u.friends.open&&u.modal.active&&!m.started;');
  await evaluate('g.restart();g.guide.start(false);m.practiceProtected=false;m.gameOver=true;g.update(0);g.draw();return true;');
  await shot('web-result-entry'); await tap('friends');
  checks.result_entry_returns_to_result = await evaluate("return u.friends.open&&u.friends.back.string==='返回成绩单'&&m.gameOver;");
  await tap('friends-close'); checks.result_is_preserved = await evaluate("return !u.friends.open&&g.menuMode==='result'&&!!g.settlement;");
  await evaluate('g.goHome();g.draw();return true;'); await tap('friends');

  // Exercise the exact open-data renderer in the real Cocos canvas, with clearly named fixture records.
  const sources = Object.fromEntries(['ranking', 'controller', 'index'].map(name => [name, readFileSync(`build-templates/wechatgame/openDataContext/${name}.js`, 'utf8')]));
  const fixture = `const sources=${JSON.stringify(sources)},modules={};
    const load=name=>{name=name.replace('./','');if(modules[name])return modules[name].exports;
      const module={exports:{}};modules[name]=module;new Function('module','exports','require',sources[name])(module,module.exports,load);return module.exports;};
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=1280;
    let texts=[],draws=[];const context=canvas.getContext('2d'),fillText=context.fillText.bind(context),clear=context.clearRect.bind(context);
    context.fillText=(value,...args)=>{texts.push(String(value));draws.push({value:String(value),x:args[0],y:args[1]});return fillText(value,...args);};
    context.clearRect=(...args)=>{texts=[];draws=[];return clear(...args);};
    const own={version:1,score:14860,playerTag:'fixture_self_123',achievedAt:100};
    const kv=r=>[{key:'offwork_best_v1',value:JSON.stringify(r)}];
    const rows=Array.from({length:13},(_,i)=>({openid:'fixture_'+i,nickname:['午休多摸一条鱼','下班准时走','这份工作明天再说','奶茶续杯','摸鱼搭子','今天也要开心','阳光正好','一只普通员工','小鱼游啊游','先喝口水'][i%10],avatarUrl:'',KVDataList:kv({...own,score:24500-i*980,playerTag:'fixture_friend_'+i,achievedAt:i+1})}));
    let receive,state='ready';const mock={getSharedCanvas:()=>canvas,onMessage:fn=>receive=fn,createImage:()=>new Image(),
      getUserCloudStorage:o=>{if(state==='loading')return;queueMicrotask(()=>state==='sync-failed'?o.fail({}):o.success({KVDataList:state==='empty'?[]:kv(own)}));},
      setUserCloudStorage:o=>queueMicrotask(()=>o.success({})),
      getFriendCloudStorage:o=>{if(state==='loading')return;queueMicrotask(()=>state==='failed'?o.fail({}):o.success({data:state==='empty'?[]:rows}));}};
    new Function('wx','require',sources.index)(mock,load);
    u.friends.setAvailability(true,own.score);
    u.friends.notice.string='';u.friends.notice.node.active=false;
    const image=new cc.ImageAsset(canvas),texture=new cc.Texture2D();texture.image=image;
    const frame=new cc.SpriteFrame();frame.texture=texture;
    const sprite=u.friends.dataSurface.addComponent(cc.Sprite);sprite.spriteFrame=frame;sprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;
    sprite.node.getComponent(cc.UITransform).setContentSize(520,1040);
    window.__friendsFixture={set:mode=>{state=mode;receive({type:'offwork-friends',action:'hide'});receive({type:'offwork-friends',action:'show',bestScore:mode==='empty'?0:own.score});},
      upload:()=>texture.uploadData(canvas),texts:()=>texts,draws:()=>draws,canvas};
    window.__friendsFixture.set('empty');return true;`;
  await evaluate(fixture); await sleep(180); await evaluate('window.__friendsFixture.upload();return true;'); await shot('ui-preview-empty');
  checks.empty_state_has_no_invented_friends = await evaluate("return window.__friendsFixture.texts().includes('暂无好友积分排名');");
  checks.empty_personal_summary_visible_without_scrolling = await evaluate("const r=window.__friendsFixture.draws().find(d=>d.value==='暂无纪录');return !!r&&(r.y+20)*520/640<u.friends.dataViewport.getComponent(cc.UITransform).height;");
  await evaluate("window.__friendsFixture.set('ready');return true;"); await sleep(150);
  await evaluate('window.__friendsFixture.upload();return true;'); await shot('ui-preview-top10');
  checks.first_row_is_fully_visible_and_canvas_is_not_squashed = await evaluate(`
    const v=u.friends.dataViewport.getComponent(cc.UITransform).getBoundingBoxToWorld(),
      surface=u.friends.dataSurface.getComponent(cc.UITransform).getBoundingBoxToWorld(),
      size=u.friends.shared.designResolutionSize;
    return Math.abs(surface.y+surface.height-v.y-v.height)<1&&
      Math.abs(surface.width/surface.height-640/1280)<0.001&&size.width===640&&size.height===1280&&
      surface.y+surface.height-160*surface.width/640>=v.y;
  `);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:195,y:550,button:'left',buttons:1,clickCount:1});
  for(let i=1;i<=12;i++) {
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:195,y:550-i*25,button:'left',buttons:1}); await sleep(20);
  }
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:195,y:250,button:'left',buttons:0,clickCount:1});
  await sleep(250); await shot('ui-preview-top10-bottom');
  checks.list_scroll_reaches_personal_record = await evaluate('return u.friends.scroll.getScrollOffset().y>100;');
  await evaluate('u.friends.scroll.stopAutoScroll();u.friends.scroll.scrollToTop(0);return true;');
  checks.ten_rows_and_own_rank_outside_ten = await evaluate("const t=window.__friendsFixture.texts();return t.includes('24,500')&&!t.includes('12,740')&&t.some(s=>s.includes('第 11 名'));");
  for (const state of ['failed', 'sync-failed', 'loading']) {
    await evaluate(`window.__friendsFixture.set(${JSON.stringify(state)});return true;`); await sleep(100);
    await evaluate('window.__friendsFixture.upload();return true;'); await shot('ui-preview-' + state);
    checks['renderer_' + state] = await evaluate(`return window.__friendsFixture.texts().some(t=>t.includes(${JSON.stringify(state === 'failed' ? '加载失败' : state === 'loading' ? '加载中' : '同步失败')}));`);
  }
  checks.no_runtime_errors = errors.length === 0;
  const report = { passed: Object.values(checks).every(Boolean), checks, states, errors, note: 'ui-preview images contain explicit test fixtures, not real friend data.' };
  writeFileSync(resolve(out, 'web-result.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally { socket.close(); }
