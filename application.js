System.register([], function (_export, _context) {
  "use strict";

  var cc, Application;
  function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
  function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
  function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
  return {
    setters: [],
    execute: function () {
      _export("Application", Application = /*#__PURE__*/function () {
        function Application() {
          _classCallCheck(this, Application);
          this.settingsPath = 'src/settings.json';
          this.showFPS = true;
        }
        _createClass(Application, [{
          key: "init",
          value: function init(engine) {
            cc = engine;
            cc.game.onPostBaseInitDelegate.add(this.onPostInitBase.bind(this));
            cc.game.onPostSubsystemInitDelegate.add(this.onPostSystemInit.bind(this));
          }
        }, {
          key: "onPostInitBase",
          value: function onPostInitBase() {
            // cc.settings.overrideSettings('assets', 'server', '');
            // do custom logic
          }
        }, {
          key: "onPostSystemInit",
          value: function onPostSystemInit() {
            // do custom logic
          }
        }, {
          key: "start",
          value: function start() {
            return cc.game.init({
              debugMode: true ? cc.DebugMode.INFO : cc.DebugMode.ERROR,
              settingsPath: this.settingsPath,
              overrideSettings: {
                // assets: {
                //      preloadBundles: [{ bundle: 'main', version: 'xxx' }],
                // }
                profiling: {
                  showFPS: this.showFPS
                }
              }
            }).then(function () {
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
            });
          }
        }]);
        return Application;
      }());
    }
  };
});