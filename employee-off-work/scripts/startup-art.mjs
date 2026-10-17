import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { BROWSER_STARTUP_SOURCE, WECHAT_STARTUP_SOURCE } from './startup-screen.mjs';

/** Keep the generated platform bootstrap changes reproducible on every build. */
export function approvedWechatGameBootstrap(source) {
  source = source.replace(/\r\n/g, '\n');
  const oldHandoff = 'return firstScreen.end().then(() => application.start());';
  const newHandoff = `return firstScreen.setProgress(0.18).then(() => application.start());`;
  const init = `require('./engine-adapter');
        return application.init(cc);`;
  const bridgedInit = `require('./engine-adapter');
        cc.game.__offworkStartup = firstScreen;
        firstScreen.attach(cc);
        // Stop the bootstrap RAF now, before the scene's prepared loading frame draws.
        cc.game.once('offwork-loading-frame-ready', () => { firstScreen.end(); });
        return application.init(cc);`;
  if (source.includes(newHandoff)) return source;
  if (!source.includes(oldHandoff)) throw new Error('Creator WeChat startup handoff changed');
  if (!source.includes(init)) throw new Error('Creator WeChat engine initialization changed');
  return source.replace(oldHandoff, newHandoff).replace(init, bridgedInit)
    .replace('firstScreen.setProgress(0.2)', 'firstScreen.setProgress(0.04)')
    .replace('firstScreen.setProgress(0.4)', 'firstScreen.setProgress(0.08)')
    .replace('firstScreen.setProgress(0.6)', 'firstScreen.setProgress(0.12)');
}

export function approvedWechatApplication(source) {
  source = source.replace(/\r\n/g, '\n');
  const oldStart = `}).then(function () {
              return cc.game.run();
            });`;
  const newStart = `}).then(function () {
              // Report the actual subpackage download while the bootstrap owns the canvas.
              return new Promise(function (resolve) {
                var finished = false;
                var startup = cc.game.__offworkStartup || globalThis.__offworkStartup;
                function report(value) { if (!finished && startup) startup.setProgress(value); }
                report(0.18);
                var timer = setTimeout(function () { complete(new Error('Art prefetch timed out')); }, 45000);
                function complete(error) {
                  if (finished) return;
                  finished = true;
                  clearTimeout(timer);
                  if (error) console.warn('[startup] Loading art prefetch failed', error);
                  resolve();
                }
                cc.assetManager.loadBundle('art', { onFileProgress: function (event) {
                  if (Number.isFinite(event.progress)) report(0.18 + Math.max(0,Math.min(100,event.progress))*0.0052);
                } }, function (error, bundle) {
                  if (finished) return;
                  if (error || !bundle) return complete(error || new Error('Art bundle unavailable'));
                  report(0.7);
                  bundle.load('menus/loading/spriteFrame', cc.SpriteFrame, function (frameError) {
                    if (!frameError) report(0.71);
                    complete(frameError);
                  });
                });
              });
            }).then(function () {
              return cc.game.run();
            });`;
  if (source.includes(newStart)) return source;
  if (!source.includes(oldStart)) throw new Error('Creator WeChat application startup changed');
  return source.replace(oldStart, newStart);
}

export function approvedWechatFirstScreen(source) {
  if (source.includes('Offwork startup renderer v2')) return source;
  if (!source.includes('function start(') || !source.includes('module.exports = { start, end, setProgress }'))
    throw new Error('Creator startup template changed');
  return WECHAT_STARTUP_SOURCE;
}

export function applyStartupArt(projectRoot, platform) {
  const out = join(projectRoot, 'build', platform);
  // Re-encode only the packaged bootstrap copy. The approved PNG in assets stays byte-identical.
  execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
    join(projectRoot, 'scripts/encode-startup-cover.ps1'), '-SourcePath',
    join(projectRoot, 'assets/art/menus/loading.png'), '-OutputPath', join(out, 'loading-cover.jpg')], { windowsHide: true });
  const oldCopy = join(out, 'loading-cover.png');
  if (existsSync(oldCopy)) unlinkSync(oldCopy);
  if (platform === 'wechatgame') {
    const file = join(out, 'first-screen.js');
    writeFileSync(file, approvedWechatFirstScreen(readFileSync(file, 'utf8').replace("let bgName = 'loading-cover.png';", "let bgName = 'loading-cover.jpg';")));
    const entry = join(out, 'game.js');
    writeFileSync(entry, approvedWechatGameBootstrap(readFileSync(entry, 'utf8')));
    const application = join(out, 'application.js');
    writeFileSync(application, approvedWechatApplication(readFileSync(application, 'utf8')));
  } else {
    const file = join(out, 'index.html');
    const cover = `<div id="startup-cover" aria-label="摸鱼加载中" style="position:fixed;inset:0;z-index:10000;background:#202c50;pointer-events:none"><canvas style="width:100%;height:100%;display:block"></canvas></div><script id="offwork-startup">${BROWSER_STARTUP_SOURCE}</script>`;
    const source = readFileSync(file, 'utf8').replace(/<div id="startup-cover"[^>]*>.*?<\/div>/gs, '').replace(/<script id="offwork-startup">.*?<\/script>/gs, '').replace('<body>', `<body>\n${cover}`)
      .replace(/<title>.*?<\/title>/, '<title>摸鱼请走位</title>');
    writeFileSync(file, source);
    const application = join(out, 'application.js');
    writeFileSync(application, approvedWechatApplication(readFileSync(application, 'utf8')));
  }
  console.log('[build] Approved loading poster applied to platform bootstrap');
}
