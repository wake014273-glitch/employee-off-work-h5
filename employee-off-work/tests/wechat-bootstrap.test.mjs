import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { bindWechatAdapterDocument, selectWechatEngineModule } from '../scripts/wechat-runtime.mjs';
import { approvedWechatApplication, approvedWechatGameBootstrap, approvedWechatFirstScreen } from '../scripts/startup-art.mjs';

// A phone starts without document. The adapter installs it before Cocos adds input listeners.
test('runtime aliases support both split and trimmed release engine filenames', () => {
  assert.equal(selectWechatEngineModule(['_virtual_cc-abc.js','spine.js']), '_virtual_cc-abc.js');
  assert.equal(selectWechatEngineModule(['cc.js']), 'cc.js');
  assert.throws(()=>selectWechatEngineModule(['other.js']), /found 0/);
  assert.throws(()=>selectWechatEngineModule(['cc.js','_virtual_cc-abc.js']), /found 2/);
});

const adapter = `GameGlobal.document = {
  listeners: [], addEventListener(type, callback) { this.listeners.push(callback); },
  dispatchEvent() { this.listeners.forEach(callback => callback()); }
};
GameGlobal.canvas = { addEventListener(type, callback) { document.addEventListener(type, callback); } };
GameGlobal.touch = function() { document.dispatchEvent(); };`;

test('phone adapter binds document after creation and receives touch input', () => {
  for (const preexisting of [undefined, { stale: true }]) {
    const global = { document: preexisting };
    vm.runInNewContext(bindWechatAdapterDocument(adapter), { GameGlobal: global });
    let received = 0;
    global.canvas.addEventListener('touchstart', () => received++);
    global.touch();
    assert.equal(received, 1);
    assert.notEqual(global.document, preexisting);
  }
});

test('old early binding reproduces the phone startup crash and is upgraded safely', () => {
  const old = 'var window = GameGlobal;\nvar document = GameGlobal.document;\n' + adapter;
  const broken = {};
  vm.runInNewContext(old, { GameGlobal: broken });
  assert.throws(() => broken.canvas.addEventListener('touchstart', () => {}), /addEventListener/);
  const fixed = {};
  vm.runInNewContext(bindWechatAdapterDocument(old), { GameGlobal: fixed });
  assert.doesNotThrow(() => fixed.canvas.addEventListener('touchstart', () => {}));
});

test('applying the document fix twice preserves the generated adapter and stays idempotent', () => {
  const once = bindWechatAdapterDocument(adapter);
  assert.equal(bindWechatAdapterDocument(once), once);
  assert.ok(once.includes(adapter));
  assert.equal(bindWechatAdapterDocument('var window = GameGlobal;\nvar document = GameGlobal.document;\n' + once), once);
});

test('WeChat hands off synchronously with the imported engine, without a global cc dependency', async () => {
  const source = `function handoff(application) {
    return System.import('cc').then((cc) => {
        require('./engine-adapter');
        return application.init(cc);
    }).then(() => {
        return firstScreen.end().then(() => application.start());
    });
  }`;
  const patched = approvedWechatGameBootstrap(source);
  assert.equal(approvedWechatGameBootstrap(patched), patched);
  const events = [];
  let signalReady;
  const engine = { game: { once: (name, callback) => {
    assert.equal(name, 'offwork-loading-frame-ready'); signalReady = callback;
  } } };
  const context = {
    firstScreen: {
      attach:()=>{},
      setProgress: async (value) => { events.push(`progress:${value}`); },
      end: () => { events.push('end'); },
    },
    require:()=>{},System:{import:async()=>engine},
    application: { init: cc=>assert.equal(cc,engine),start: () => { events.push('start'); } },
  };
  await vm.runInNewContext(`${patched}\nhandoff(application)`, context);
  assert.equal(engine.game.__offworkStartup,context.firstScreen);
  assert.deepEqual(events, ['progress:0.18', 'start']);
  signalReady();
  assert.deepEqual(events, ['progress:0.18', 'start', 'end']);
  assert.throws(() => approvedWechatGameBootstrap('function handoff() {}'), /handoff changed/);
});

test('WeChat prefetches loading art before starting scene frames', async () => {
  const source = `function start() { return cc.game.init({}).then(function () {\n              return cc.game.run();\n            }); }`;
  const patched = approvedWechatApplication(source);
  assert.equal(approvedWechatApplication(patched), patched);
  const events = [];
  const progress = [];
  let completeBundle;
  let completeFrame;
  const context = {
    setTimeout: () => 1, clearTimeout: () => {}, console,
    cc: { SpriteFrame: class {}, assetManager: { loadBundle: (_name, options, callback) => {
      events.push('bundle'); options.onFileProgress({progress:50});completeBundle = () => callback(null, { load: (_path, _type, done) => {
        events.push('frame'); completeFrame = () => done(null, {});
      } });
    } }, game: { __offworkStartup:{setProgress:value=>progress.push(value)},init: async () => { events.push('init'); }, run: () => { events.push('run'); } } },
  };
  const started = vm.runInNewContext(`${patched}\nstart()`, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(events, ['init', 'bundle']);
  completeBundle();
  assert.deepEqual(events, ['init', 'bundle', 'frame']);
  completeFrame();
  await started;
  assert.deepEqual(events, ['init', 'bundle', 'frame', 'run']);
  assert.deepEqual(progress,[0.18,0.44,0.7,0.71]);
});

test('prefetch timeout continues to a retryable scene and ignores its stale bundle completion', async () => {
  const source=`function start(){return cc.game.init({}).then(function () {\n              return cc.game.run();\n            });}`;
  let timeout,completeBundle,run=0,frames=0;
  const started=vm.runInNewContext(approvedWechatApplication(source)+'\nstart()',{
    setTimeout:fn=>{timeout=fn;},clearTimeout:()=>{},console:{warn:()=>{}},
    cc:{game:{init:async()=>{},run:()=>run++},assetManager:{loadBundle:(_name,_options,done)=>{completeBundle=done;}}}
  });
  await new Promise(resolve=>setImmediate(resolve));timeout();await started;
  completeBundle(null,{load:()=>frames++});assert.equal(run,1);assert.equal(frames,0);
});

test('native poster restores GL bindings and cannot draw over the scene after handoff', async () => {
  const source='function start() {}\nmodule.exports = { start, end, setProgress };';
  const patched = approvedWechatFirstScreen(source);
  assert.equal(approvedWechatFirstScreen(patched), patched);
  const enabled=new Set(['SCISSOR_TEST','DEPTH_TEST','BLEND']);
  const bindings=new Map([['CURRENT_PROGRAM','cocos-program'],['ARRAY_BUFFER_BINDING','cocos-buffer'],['ACTIVE_TEXTURE','TEXTURE0'],
    ['TEXTURE_BINDING_2D','cocos-texture'],['VIEWPORT',[3,4,390,844]],['COLOR_WRITEMASK',[true,false,true,false]],['VAO','cocos-vao']]);
  let draws=0,id=0;const frames=new Map();
  const methods={getParameter:key=>bindings.get(key),isEnabled:key=>enabled.has(key),enable:key=>enabled.add(key),disable:key=>enabled.delete(key),
    getExtension:()=>({VERTEX_ARRAY_BINDING_OES:'VAO',createVertexArrayOES:()=>({}),bindVertexArrayOES:value=>bindings.set('VAO',value),deleteVertexArrayOES:()=>{}}),
    getShaderParameter:()=>true,getProgramParameter:()=>true,getAttribLocation:()=>0,
    useProgram:value=>bindings.set('CURRENT_PROGRAM',value),bindBuffer:(_type,value)=>bindings.set('ARRAY_BUFFER_BINDING',value),
    activeTexture:value=>bindings.set('ACTIVE_TEXTURE',value),bindTexture:(_type,value)=>bindings.set('TEXTURE_BINDING_2D',value),
    viewport:(...value)=>bindings.set('VIEWPORT',value),colorMask:(...value)=>bindings.set('COLOR_WRITEMASK',value),
    drawArrays:()=>{draws++;assert.equal(enabled.size,0);}};
  const gl=new Proxy(methods,{get:(target,key)=>key in target?target[key]:/^[A-Z0-9_]+$/.test(key)?key:()=>({})});
  class Image{set src(_value){this.onload();}}
  const module={exports:{}};
  const window={Image,canvas:{width:390,height:844,getContext:()=>gl},
    requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:key=>frames.delete(key)};
  vm.runInNewContext(patched,{module,GameGlobal:window,setTimeout,clearTimeout});
  const screen=module.exports,started=screen.start('default','default','false');
  await new Promise(resolve=>setImmediate(resolve));
  // Simulate Creator initializing its renderer between startup frames.
  bindings.set('CURRENT_PROGRAM','cocos-program');bindings.set('ARRAY_BUFFER_BINDING','cocos-buffer');bindings.set('TEXTURE_BINDING_2D','cocos-texture');
  const queued=[...frames.values()];frames.clear();queued.forEach(fn=>fn(100));await started;
  assert.equal(bindings.get('CURRENT_PROGRAM'),'cocos-program');assert.equal(bindings.get('ARRAY_BUFFER_BINDING'),'cocos-buffer');
  assert.equal(bindings.get('TEXTURE_BINDING_2D'),'cocos-texture');assert.equal(bindings.get('VAO'),'cocos-vao');
  assert.deepEqual([...bindings.get('VIEWPORT')],[3,4,390,844]);assert.deepEqual([...bindings.get('COLOR_WRITEMASK')],[true,false,true,false]);
  assert.ok(enabled.has('SCISSOR_TEST')&&enabled.has('DEPTH_TEST')&&enabled.has('BLEND'));
  await screen.setProgress(0.7);const tick=[...frames.values()][0];tick(116);
  assert.ok(screen.getProgress()>0&&screen.getProgress()<0.7);
  const listeners=new Map();screen.attach({Director:{EVENT_BEFORE_DRAW:'before',EVENT_AFTER_DRAW:'after'},director:{
    on:(name,fn)=>listeners.set(name,fn),off:(name,fn)=>{assert.equal(listeners.get(name),fn);listeners.delete(name);}}});
  listeners.get('before')();const driven=draws;tick(130);assert.equal(draws,driven);
  listeners.get('after')();assert.equal(draws,driven+1);
  const before=draws;screen.end();tick(133);assert.equal(draws,before);assert.equal(screen.isEnded(),true);
  assert.equal(listeners.size,0);
});
