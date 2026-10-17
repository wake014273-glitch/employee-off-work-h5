import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

export function selectWechatEngineModule(files) {
  const candidates = files.filter(name => name === 'cc.js' || /^_virtual_cc-.+\.js$/.test(name));
  if (candidates.length !== 1) throw new Error(`Expected one Cocos engine module, found ${candidates.length}`);
  return candidates[0];
}

const OLD_PREFIX = 'var window = GameGlobal;\nvar document = GameGlobal.document;\n';
const PREFIX = 'var window = GameGlobal;\nvar document;\n';
const BINDING = '\n// Bind after the adapter creates the phone document, before engine input starts.\ndocument = GameGlobal.document;\n';

export function bindWechatAdapterDocument(source) {
  while (source.startsWith(OLD_PREFIX) || source.startsWith(PREFIX))
    source = source.slice(source.startsWith(OLD_PREFIX) ? OLD_PREFIX.length : PREFIX.length);
  if (source.endsWith(BINDING)) source = source.slice(0, -BINDING.length);
  return PREFIX + source + BINDING;
}

/** Execute the real generated adapter with a fresh phone global, not a browser document. */
export function checkWechatTouchBootstrap(source, platform) {
  const handlers = {};
  class Canvas { width = 390; height = 844; getContext() { return {}; } }
  class Image { width = 1; height = 1; }
  const noop = () => {};
  const wx = new Proxy({
    env: { USER_DATA_PATH: 'wxfile://usr' },
    getSystemInfoSync: () => ({ platform, system: platform, screenWidth: 390, screenHeight: 844,
      windowWidth: 390, windowHeight: 844, devicePixelRatio: 3 }),
    createCanvas: () => new Canvas(), createImage: () => new Image(),
    getFileSystemManager: () => new Proxy({}, { get: () => noop }),
    getStorageInfoSync: () => ({ keys: [] }),
    onTouchStart: fn => handlers.start = fn, onTouchMove: fn => handlers.move = fn,
    onTouchEnd: fn => handlers.end = fn, onTouchCancel: fn => handlers.cancel = fn,
  }, { get: (target, key) => target[key] ?? noop });
  const global = { setTimeout, setInterval, clearTimeout, clearInterval,
    requestAnimationFrame: noop, cancelAnimationFrame: noop };
  if (platform === 'devtools') global.document = {};
  const context = vm.createContext({ GameGlobal: global, wx,
    console: { log: noop, warn: noop, error: noop }, require: noop });
  vm.runInContext(source, context, { timeout: 3000 });
  if (!global.document || !global.screencanvas) throw new Error(`${platform}: adapter globals missing`);
  const received = [];
  for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel'])
    global.screencanvas.addEventListener(type, event => received.push(event.type));
  const event = { touches: [{ identifier: 1, clientX: 12, clientY: 18 }],
    changedTouches: [{ identifier: 1, clientX: 12, clientY: 18 }], timeStamp: 1 };
  for (const name of ['start', 'move', 'end', 'cancel']) handlers[name](event);
  if (received.join(',') !== 'touchstart,touchmove,touchend,touchcancel')
    throw new Error(`${platform}: touch bridge did not dispatch all input events`);
  return { platform, documentReady: true, events: received };
}

export function fixWechatAdapterDocument(outputDir) {
  const file = join(outputDir, 'web-adapter.js');
  writeFileSync(file, bindWechatAdapterDocument(readFileSync(file, 'utf8')));
  const source = readFileSync(file, 'utf8');
  const results = ['ios', 'android', 'devtools'].map(platform => checkWechatTouchBootstrap(source, platform));
  console.log(`[build] WeChat fresh-document touch bootstrap: ${results.map(r => r.platform).join(', ')} passed`);
  return results;
}
