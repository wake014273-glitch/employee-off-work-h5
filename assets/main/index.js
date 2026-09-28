System.register("chunks:///_virtual/GameMain.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameModel.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, cclegacy, _decorator, profiler, view, Canvas, UITransform, Node, Graphics, Vec3, Label, Color, input, Input, EventMouse, KeyCode, Component, HUD_SAFE_HEIGHT, PHASE_LABELS, formatGameOverSummary, waveConfigFor, GameModel, GestureRecognizer;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      profiler = module.profiler;
      view = module.view;
      Canvas = module.Canvas;
      UITransform = module.UITransform;
      Node = module.Node;
      Graphics = module.Graphics;
      Vec3 = module.Vec3;
      Label = module.Label;
      Color = module.Color;
      input = module.input;
      Input = module.Input;
      EventMouse = module.EventMouse;
      KeyCode = module.KeyCode;
      Component = module.Component;
    }, function (module) {
      HUD_SAFE_HEIGHT = module.HUD_SAFE_HEIGHT;
      PHASE_LABELS = module.PHASE_LABELS;
      formatGameOverSummary = module.formatGameOverSummary;
      waveConfigFor = module.waveConfigFor;
      GameModel = module.GameModel;
      GestureRecognizer = module.GestureRecognizer;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "9dad5MWX8ZA3KB5PeLm0Fgj", "GameMain", undefined);
      var ccclass = _decorator.ccclass;
      var W = 720;
      var H = 1280;
      var FLOATER_SLOTS = 6;
      var GameMain = exports('GameMain', (_dec = ccclass('GameMain'), _dec(_class = /*#__PURE__*/function (_Component) {
        _inheritsLoose(GameMain, _Component);
        function GameMain() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.model = new GameModel();
          _this.gesture = new GestureRecognizer();
          _this.paintNode = void 0;
          _this.graphics = void 0;
          _this.hud = void 0;
          _this.centerText = void 0;
          _this.floaters = [];
          _this.floaterCursor = 0;
          _this.sparks = [];
          _this.bursts = [];
          _this.dragging = false;
          _this.dragOffset = {
            x: 0,
            y: 0
          };
          _this.hintText = '';
          _this.hintTime = 0;
          _this.hitFlash = 0;
          _this.shakeTime = 0;
          return _this;
        }
        var _proto = GameMain.prototype;
        _proto.onLoad = function onLoad() {
          var _this$getComponent, _this$getComponent2;
          profiler.hideStats();
          view.setDesignResolutionSize(W, H, 2);
          var canvas = (_this$getComponent = this.getComponent(Canvas)) != null ? _this$getComponent : this.addComponent(Canvas);
          canvas.alignCanvasWithScreen = true;
          var transform = (_this$getComponent2 = this.getComponent(UITransform)) != null ? _this$getComponent2 : this.addComponent(UITransform);
          transform.setContentSize(W, H);
          this.paintNode = new Node('ProgrammaticGraphics');
          this.paintNode.addComponent(UITransform).setContentSize(W, H);
          this.node.addChild(this.paintNode);
          this.graphics = this.paintNode.addComponent(Graphics);
          this.hud = this.makeLabel('HUD', 28, new Vec3(0, H / 2 - 92), W - 56, 150);
          this.hud.horizontalAlign = Label.HorizontalAlign.LEFT;
          this.hud.verticalAlign = Label.VerticalAlign.TOP;
          this.centerText = this.makeLabel('CenterText', 34, new Vec3(0, 50), W - 90, 320);
          this.centerText.horizontalAlign = Label.HorizontalAlign.CENTER;
          this.centerText.verticalAlign = Label.VerticalAlign.CENTER;
          for (var index = 0; index < FLOATER_SLOTS; index += 1) {
            var node = new Node("Floater" + index);
            node.addComponent(UITransform).setContentSize(360, 48);
            this.node.addChild(node);
            var label = node.addComponent(Label);
            label.fontSize = 26;
            label.lineHeight = 32;
            label.color = new Color(220, 242, 255, 255);
            label.horizontalAlign = Label.HorizontalAlign.CENTER;
            label.verticalAlign = Label.VerticalAlign.CENTER;
            node.active = false;
            this.floaters.push({
              node: node,
              label: label,
              base: new Color(220, 242, 255, 255),
              life: 0,
              maxLife: 0.9,
              x: 0,
              y: 0
            });
          }
          this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
          this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
          this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
          this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
          this.node.on(Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
          this.node.on(Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
          this.node.on(Node.EventType.MOUSE_UP, this.onMouseUp, this);
          input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
          this.draw();
        };
        _proto.onDestroy = function onDestroy() {
          input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        };
        _proto.update = function update(dt) {
          this.model.update(dt);
          this.consumeEvents();
          this.hintTime = Math.max(0, this.hintTime - dt);
          this.hitFlash = Math.max(0, this.hitFlash - dt);
          this.shakeTime = Math.max(0, this.shakeTime - dt);
          for (var _iterator = _createForOfIteratorHelperLoose(this.sparks), _step; !(_step = _iterator()).done;) {
            var spark = _step.value;
            spark.life -= dt;
          }
          this.sparks = this.sparks.filter(function (spark) {
            return spark.life > 0;
          });
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.bursts), _step2; !(_step2 = _iterator2()).done;) {
            var burst = _step2.value;
            burst.life -= dt;
          }
          this.bursts = this.bursts.filter(function (burst) {
            return burst.life > 0;
          });
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.floaters), _step3; !(_step3 = _iterator3()).done;) {
            var floater = _step3.value;
            if (floater.life <= 0) {
              floater.node.active = false;
              continue;
            }
            floater.life -= dt;
            var progress = 1 - Math.max(0, floater.life) / floater.maxLife;
            floater.node.setPosition(new Vec3(floater.x - W / 2, floater.y - H / 2 + 20 + progress * 46, 0));
            floater.label.color = new Color(floater.base.r, floater.base.g, floater.base.b, Math.max(0, Math.floor(255 * (1 - progress))));
            if (floater.life <= 0) floater.node.active = false;
          }
          this.draw();
        };
        _proto.consumeEvents = function consumeEvents() {
          for (var _iterator4 = _createForOfIteratorHelperLoose(this.model.takeEvents()), _step4; !(_step4 = _iterator4()).done;) {
            var event = _step4.value;
            if (event.type === 'graze') {
              this.sparks.push({
                x: event.x,
                y: event.y,
                life: 0.25
              });
            } else if (event.type === 'gap') {
              this.spawnFloater("\u7A7F\u7F1D +" + event.value, event.x, event.y, new Color(150, 255, 240));
              this.bursts.push({
                x: event.x,
                y: event.y,
                life: 0.35,
                maxLife: 0.35,
                radius: 70,
                color: new Color(190, 255, 250)
              });
            } else if (event.type === 'break') {
              this.spawnFloater("\u5DF2\u8BFB\u4E0D\u56DE +" + event.value, event.x, event.y, new Color(255, 218, 150));
            } else if (event.type === 'grade') {
              var gradeColor = event.grade === 'S' ? new Color(255, 210, 90) : event.grade === 'A' ? new Color(205, 150, 255) : new Color(120, 230, 255);
              this.spawnFloater(event.grade + " \u8BC4\u4EF7 \xB7 " + event.label + " +" + event.value, event.x, event.y - 40, gradeColor, 30, 1.3);
              this.bursts.push({
                x: event.x,
                y: event.y,
                life: 0.4,
                maxLife: 0.4,
                radius: 120,
                color: gradeColor
              });
            } else if (event.type === 'hit') {
              this.hitFlash = 0.5;
              this.shakeTime = 0.4;
            } else if (event.type === 'shield') {
              this.bursts.push({
                x: this.model.player.x,
                y: this.model.player.y,
                life: 0.45,
                maxLife: 0.45,
                radius: 130,
                color: new Color(110, 255, 210)
              });
            } else if (event.type === 'wave-clear') {
              this.spawnFloater("\u7B2C " + event.wave + " \u6CE2\u5B8C\u6210 +" + event.bonus, W / 2, H / 2 - 120, new Color(180, 230, 255));
            } else if (event.type === 'hard-step') {
              this.spawnFloater("\u52A0\u73ED\u5F3A\u5EA6\u4E0A\u5347 \xB7 \u7B2C " + event.wave + " \u6CE2 +" + event.value, W / 2, H / 2 - 60, new Color(255, 150, 150));
              this.bursts.push({
                x: W / 2,
                y: H / 2,
                life: 0.4,
                maxLife: 0.4,
                radius: 160,
                color: new Color(255, 120, 120)
              });
            } else if (event.type === 'leave-spawn') {
              this.spawnFloater('请假条出现', event.x, event.y, new Color(255, 255, 255));
            } else if (event.type === 'leave') {
              this.spawnFloater(event.value > 0 ? "\u8BF7\u5047\u83B7\u6279 \xB7 \u6E05\u5C4F \xD7" + event.count + " +" + event.value : '请假获批！', event.x, event.y, new Color(255, 255, 255));
              this.bursts.push({
                x: this.model.player.x,
                y: this.model.player.y,
                life: 0.5,
                maxLife: 0.5,
                radius: 240,
                color: new Color(255, 255, 255)
              });
              this.shakeTime = 0.3;
              this.hitFlash = 0;
            }
          }
        };
        _proto.spawnFloater = function spawnFloater(text, x, y, color, size, life) {
          if (size === void 0) {
            size = 26;
          }
          if (life === void 0) {
            life = 0.9;
          }
          var floater = this.floaters[this.floaterCursor];
          this.floaterCursor = (this.floaterCursor + 1) % this.floaters.length;
          floater.maxLife = life;
          floater.life = life;
          floater.x = x;
          floater.y = y;
          floater.base = color;
          floater.label.fontSize = size;
          floater.label.lineHeight = size * 1.25;
          floater.label.string = text;
          floater.label.color = color;
          floater.node.active = true;
          floater.node.setPosition(new Vec3(x - W / 2, y - H / 2 + 20, 0));
        };
        _proto.makeLabel = function makeLabel(name, fontSize, position, width, height) {
          var node = new Node(name);
          node.setPosition(position);
          node.addComponent(UITransform).setContentSize(width, height);
          this.node.addChild(node);
          var label = node.addComponent(Label);
          label.fontSize = fontSize;
          label.lineHeight = fontSize + 8;
          label.color = new Color(220, 242, 255, 255);
          label.enableWrapText = true;
          return label;
        };
        _proto.pointFromUI = function pointFromUI(ui) {
          var local = this.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(ui.x, ui.y));
          return {
            x: local.x + W / 2,
            y: local.y + H / 2
          };
        };
        _proto.press = function press(point, time) {
          if (this.model.gameOver) {
            this.model.reset();
            this.gesture.reset();
            return;
          }
          if (!this.model.started) {
            this.model.reset();
            this.gesture.reset();
          }
          if (this.model.waveState === 'intermission') {
            this.model.startNextWave();
            return;
          }
          this.dragging = true;
          this.dragOffset.x = this.model.player.x - point.x;
          this.dragOffset.y = this.model.player.y - point.y;
          this.gesture.begin(point.x, point.y, time);
        };
        _proto.drag = function drag(point) {
          if (!this.dragging || this.model.gameOver) return;
          this.gesture.move(point.x, point.y);
          this.model.movePlayer(point.x + this.dragOffset.x, point.y + this.dragOffset.y);
        };
        _proto.release = function release(point, time) {
          if (!this.dragging) return;
          this.dragging = false;
          if (this.gesture.end(point.x, point.y, time)) this.tryActivateShield();
        };
        _proto.tryActivateShield = function tryActivateShield() {
          if (this.model.activateShield()) {
            this.hintText = '摸鱼护盾启动';
            this.hintTime = 0.8;
            return;
          }
          this.hintText = this.model.shieldTime > 0 ? '护盾正在生效' : '能量不足，继续拾取绿色光球';
          this.hintTime = 0.9;
        };
        _proto.onTouchStart = function onTouchStart(event) {
          this.press(this.pointFromUI(event.getUILocation()), performance.now() / 1000);
        };
        _proto.onTouchMove = function onTouchMove(event) {
          this.drag(this.pointFromUI(event.getUILocation()));
        };
        _proto.onTouchEnd = function onTouchEnd(event) {
          this.release(this.pointFromUI(event.getUILocation()), performance.now() / 1000);
        };
        _proto.onMouseDown = function onMouseDown(event) {
          if (event.getButton() === EventMouse.BUTTON_LEFT) this.press(this.pointFromUI(event.getUILocation()), performance.now() / 1000);
        };
        _proto.onMouseMove = function onMouseMove(event) {
          if (this.dragging) this.drag(this.pointFromUI(event.getUILocation()));
        };
        _proto.onMouseUp = function onMouseUp(event) {
          if (event.getButton() === EventMouse.BUTTON_LEFT) this.release(this.pointFromUI(event.getUILocation()), performance.now() / 1000);
        };
        _proto.onKeyDown = function onKeyDown(event) {
          if (event.keyCode !== KeyCode.SPACE) return;
          if (this.model.gameOver) {
            this.model.reset();
            return;
          }
          if (!this.model.started) {
            this.model.reset();
            return;
          }
          if (this.model.waveState === 'intermission') {
            this.model.startNextWave();
            return;
          }
          this.tryActivateShield();
        };
        _proto.glow = function glow(x, y, radius, color, core) {
          if (core === void 0) {
            core = true;
          }
          var g = this.graphics;
          var lx = x - W / 2;
          var ly = y - H / 2;
          g.fillColor = new Color(color.r, color.g, color.b, 25);
          g.circle(lx, ly, radius * 1.85);
          g.fill();
          g.fillColor = new Color(color.r, color.g, color.b, 70);
          g.circle(lx, ly, radius * 1.35);
          g.fill();
          g.fillColor = new Color(color.r, color.g, color.b, 210);
          g.circle(lx, ly, radius);
          g.fill();
          if (core) {
            g.fillColor = new Color(240, 255, 255, 235);
            g.circle(lx - radius * 0.22, ly + radius * 0.25, radius * 0.35);
            g.fill();
          }
        };
        _proto.draw = function draw() {
          if (!this.graphics) return;
          var g = this.graphics;
          g.clear();
          if (this.shakeTime > 0) {
            var amplitude = this.shakeTime * 22;
            this.paintNode.setPosition(new Vec3((Math.random() - 0.5) * amplitude, (Math.random() - 0.5) * amplitude, 0));
          } else this.paintNode.setPosition(Vec3.ZERO);
          g.fillColor = new Color(6, 12, 25, 255);
          g.rect(-W / 2, -H / 2, W, H);
          g.fill();
          g.strokeColor = new Color(28, 55, 75, 75);
          g.lineWidth = 2;
          for (var y = -H / 2 + 90; y < H / 2; y += 120) {
            g.moveTo(-W / 2, y);
            g.lineTo(W / 2, y);
          }
          for (var x = -W / 2 + 60; x < W / 2; x += 120) {
            g.moveTo(x, -H / 2);
            g.lineTo(x, H / 2);
          }
          g.stroke();

          // 文件夹墙无预警：不再绘制边缘预告条（墙本身从屏幕外直接推进）

          for (var _iterator5 = _createForOfIteratorHelperLoose(this.model.bullets), _step5; !(_step5 = _iterator5()).done;) {
            var bullet = _step5.value;
            if (bullet.kind === 'message') this.glow(bullet.x, bullet.y, bullet.radius, new Color(255, 77, 77));else if (bullet.kind === 'folder') this.glow(bullet.x, bullet.y, bullet.radius, new Color(255, 206, 66));else this.glow(bullet.x, bullet.y, bullet.radius, new Color(176, 92, 255));
          }
          for (var _iterator6 = _createForOfIteratorHelperLoose(this.model.skillOrbs), _step6; !(_step6 = _iterator6()).done;) {
            var orb = _step6.value;
            this.glow(orb.x, orb.y, orb.radius + Math.sin(orb.pulse * 5) * 2, new Color(56, 255, 142));
          }

          // 请假条：白色纸条 + 红色批准印章（方形，明显区别于圆形能量球）
          for (var _iterator7 = _createForOfIteratorHelperLoose(this.model.leaveSlips), _step7; !(_step7 = _iterator7()).done;) {
            var slip = _step7.value;
            var blink = slip.life > 3 || Math.floor(slip.life * 8) % 2 === 0;
            if (!blink) continue;
            var lx = slip.x - W / 2;
            var ly = slip.y - H / 2;
            g.fillColor = new Color(240, 248, 255, 235);
            g.rect(lx - 15, ly - 19, 30, 38);
            g.fill();
            g.strokeColor = new Color(120, 140, 160, 220);
            g.lineWidth = 2;
            g.rect(lx - 15, ly - 19, 30, 38);
            g.stroke();
            g.fillColor = new Color(220, 45, 60, 235);
            g.circle(lx, ly + 3, 8);
            g.fill();
            g.fillColor = new Color(220, 45, 60, 160);
            g.rect(lx - 11, ly - 12, 22, 4);
            g.fill();
          }
          var p = this.model.player;
          if (this.model.energy >= 100 && this.model.shieldTime <= 0) {
            var readyPulse = 58 + Math.sin(this.model.elapsed * 7) * 5;
            g.strokeColor = new Color(108, 255, 202, 220);
            g.lineWidth = 5;
            g.circle(p.x - W / 2, p.y - H / 2, readyPulse);
            g.stroke();
          }
          if (this.model.shieldTime > 0) {
            var ending = this.model.shieldTime < 0.65;
            var visible = !ending || Math.floor(this.model.shieldTime * 14) % 2 === 0;
            g.fillColor = new Color(80, 255, 200, visible ? 35 : 12);
            g.circle(p.x - W / 2, p.y - H / 2, 64);
            g.fill();
            g.strokeColor = new Color(92, 255, 215, visible ? 240 : 80);
            g.lineWidth = 7;
            g.circle(p.x - W / 2, p.y - H / 2, 55);
            g.stroke();
          }
          if (this.model.invulnerableTime <= 0 || Math.floor(this.model.invulnerableTime * 12) % 2 === 0) this.glow(p.x, p.y, p.radius, new Color(112, 242, 255));

          // 擦弹火花与事件光环
          for (var _iterator8 = _createForOfIteratorHelperLoose(this.sparks), _step8; !(_step8 = _iterator8()).done;) {
            var spark = _step8.value;
            g.fillColor = new Color(255, 255, 210, Math.floor(200 * (spark.life / 0.25)));
            g.circle(spark.x - W / 2, spark.y - H / 2, 6 + (0.25 - spark.life) * 40);
            g.fill();
          }
          for (var _iterator9 = _createForOfIteratorHelperLoose(this.bursts), _step9; !(_step9 = _iterator9()).done;) {
            var burst = _step9.value;
            var progress = 1 - burst.life / burst.maxLife;
            g.strokeColor = new Color(burst.color.r, burst.color.g, burst.color.b, Math.floor(210 * (1 - progress)));
            g.lineWidth = 6;
            g.circle(burst.x - W / 2, burst.y - H / 2, burst.radius * progress);
            g.stroke();
          }

          // 受击红闪（覆盖战场，不盖 HUD）
          if (this.hitFlash > 0) {
            g.fillColor = new Color(255, 60, 60, Math.floor(90 * (this.hitFlash / 0.5)));
            g.rect(-W / 2, -H / 2, W, H);
            g.fill();
          }
          g.fillColor = new Color(6, 12, 25, 255);
          g.rect(-W / 2, H / 2 - HUD_SAFE_HEIGHT, W, HUD_SAFE_HEIGHT);
          g.fill();
          g.strokeColor = new Color(54, 91, 112, 120);
          g.lineWidth = 2;
          g.moveTo(-W / 2, H / 2 - HUD_SAFE_HEIGHT);
          g.lineTo(W / 2, H / 2 - HUD_SAFE_HEIGHT);
          g.stroke();
          var phaseLabel = PHASE_LABELS[this.model.config.phase];
          var comboLine = this.model.combo > 0 ? "   \xD7" + this.model.comboMultiplier.toFixed(2) + " \u8FDE\u51FB " + this.model.combo : '';
          var slipLine = this.model.leaveSlips.length > 0 ? '   请假条在场' : '';
          this.hud.string = "\u5458\u5DE5\uFF0C\u4E0B\u73ED\uFF01   \u7B2C " + this.model.wave + " \u6CE2 \xB7 " + phaseLabel + "\n" + ("\u65F6\u95F4 " + this.model.elapsed.toFixed(1) + "s   \u79EF\u5206 " + this.model.score + "   \u80FD\u91CF " + Math.floor(this.model.energy) + "%" + comboLine + "\n") + ("\u5DE5\u4F5C\u8D1F\u8377 " + this.model.workload + "/3   \u6478\u9C7C\u8BC4\u7EA7 C\u2192S" + slipLine);
          if (!this.model.started) {
            this.centerText.string = '按住拖动，躲开工作\n每波活到时间结束 · 点击进入下一波\n擦弹 / 贴边穿缝 / 甩脱追踪 都能加分\n能量满后双击屏幕任意位置释放「摸鱼护盾」\n\n点击开始摸鱼';
          } else if (this.model.gameOver) {
            this.centerText.string = formatGameOverSummary(this.model.stats());
          } else if (this.model.leaveSlipFlash > 0) {
            this.centerText.string = '请假获批 · 今天不上班';
          } else if (this.model.waveState === 'intermission') {
            var nextPhase = PHASE_LABELS[waveConfigFor(this.model.wave + 1).phase];
            this.centerText.string = "\u7B2C " + this.model.wave + " \u6CE2\u5B8C\u6210 \xB7 \u672C\u6CE2 +" + this.model.lastWaveBonus + " \u5206\n\u6682\u5B9A\u4E2D \xB7 \u5F39\u5E55\u4FDD\u7559\uFF0C\u70B9\u51FB\u76F4\u63A5\u8FDB\u5165\u7B2C " + (this.model.wave + 1) + " \u6CE2\uFF08" + nextPhase + "\uFF09";
          } else if (this.hintTime > 0) {
            this.centerText.string = this.hintText;
          } else if (this.model.energy >= 100) {
            this.centerText.string = '护盾就绪 · 双击屏幕任意位置释放\n（桌面也可按空格）';
          } else {
            this.centerText.string = '';
          }
        };
        return GameMain;
      }(Component)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameModel.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, _createClass, cclegacy;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        createFolderWall: createFolderWall,
        waveConfigFor: waveConfigFor
      });
      cclegacy._RF.push({}, "9f302iwGRZC8IFWCOQHh79u", "GameModel", undefined);
      var FIELD_WIDTH = exports('FIELD_WIDTH', 720);
      var FIELD_HEIGHT = exports('FIELD_HEIGHT', 1280);
      var PLAYER_RADIUS = exports('PLAYER_RADIUS', 24);
      var HUD_SAFE_HEIGHT = exports('HUD_SAFE_HEIGHT', 150);

      /** 擦弹判定带：玩家半径外侧至该距离（像素，自玩家圆心计） */
      var GRAZE_RADIUS = exports('GRAZE_RADIUS', 50);
      /** 擦弹全局冷却：两次计数的最小间隔（秒） */
      var GRAZE_COOLDOWN = exports('GRAZE_COOLDOWN', 0.4);
      /** 擦弹连击计入倍率的堆叠上限 */
      var GRAZE_MAX_STACK = exports('GRAZE_MAX_STACK', 20);
      /** 甩脱判定：追踪结束时与玩家的最小距离（2026-09-28 由 260 上调到 320，过滤近身廉价甩脱） */
      var BREAK_LOCK_DISTANCE = exports('BREAK_LOCK_DISTANCE', 320);
      /** 穿缝判定：玩家边缘与最近文件夹边缘的最大余量（像素，与碰撞判定同一把尺） */
      var GAP_CLEAR_DISTANCE = exports('GAP_CLEAR_DISTANCE', 6);
      /** 需求表保底：共享上限占满时，需求表在场少于该数仍优先放行（防止消息把紫弹幕挤没） */
      var REQUIREMENT_FLOOR = exports('REQUIREMENT_FLOOR', 2);

      /** 操作评级：达成困难操作时的即时评价与加分（S > A > B），数值为一次性奖励。 */

      var GRADE_RANK = exports('GRADE_RANK', {
        B: 1,
        A: 2,
        S: 3
      });
      var BREAK_BURST = exports('BREAK_BURST', {
        window: 3,
        b: 2,
        a: 3,
        s: 4,
        bonus: {
          B: 80,
          A: 160,
          S: 300
        }
      });
      var GAP_CHAIN = exports('GAP_CHAIN', {
        window: 20,
        b: 2,
        a: 3,
        s: 4,
        bonus: {
          B: 100,
          A: 200,
          S: 350
        }
      });
      var GRAZE_GRADE = exports('GRAZE_GRADE', {
        b: 6,
        a: 10,
        s: 15,
        bonus: {
          B: 60,
          A: 140,
          S: 260
        }
      });
      /** 请假条：掷骰间隔与命中率 */
      var LEAVE_SLIP_ROLL_INTERVAL = exports('LEAVE_SLIP_ROLL_INTERVAL', 45);
      var LEAVE_SLIP_CHANCE = exports('LEAVE_SLIP_CHANCE', 0.2);
      /** 请假条清屏：每条被清掉的弹幕折算的积分 */
      var LEAVE_SLIP_CLEAR_VALUE = exports('LEAVE_SLIP_CLEAR_VALUE', 10);
      var LEAVE_SLIP_LIFETIME = exports('LEAVE_SLIP_LIFETIME', 12);
      var LEAVE_SLIP_INVULNERABLE = exports('LEAVE_SLIP_INVULNERABLE', 1.0);
      var MAX_EVENTS = exports('MAX_EVENTS', 48);
      var PHASE_LABELS = exports('PHASE_LABELS', {
        simple: '简单',
        normal: '一般',
        hard: '困难'
      });
      /** 固定参数波次：波 1 简单（15 秒 · 只有需求表=紫·随机运动）、波 2 一般（35 秒 · 加入文件夹=黄）、波 3 起困难（加入消息=红·追踪，一口气不间断，每 60 秒升一档） */
      var FIXED_WAVES = [{
        wave: 1,
        phase: 'simple',
        duration: 15,
        messages: false,
        requirements: true,
        walls: false,
        messageInterval: 0,
        requirementInterval: 1.5,
        wallInterval: 0,
        speedScale: 1.0,
        maxThreats: 12,
        gapWidth: 160
      }, {
        wave: 2,
        phase: 'normal',
        duration: 35,
        messages: false,
        requirements: true,
        walls: true,
        messageInterval: 0,
        requirementInterval: 2.6,
        wallInterval: 7.0,
        speedScale: 1.1,
        maxThreats: 12,
        gapWidth: 145
      }, {
        wave: 3,
        phase: 'hard',
        duration: 60,
        messages: true,
        requirements: true,
        walls: true,
        messageInterval: 0.85,
        requirementInterval: 2.4,
        wallInterval: 5.8,
        speedScale: 1.25,
        maxThreats: 14,
        gapWidth: 124
      }];

      /** 困难阶段无尽曲线（docs/WAVE_SYSTEM.md §3）：第 3 波起每重复一次收紧一档；第 17 波起进入「深水区」，按更慢的速率继续收紧。 */
      function waveConfigFor(wave) {
        var safeWave = Math.max(1, Math.floor(wave));
        if (safeWave <= FIXED_WAVES.length) return _extends({}, FIXED_WAVES[safeWave - 1]);
        var base = FIXED_WAVES[FIXED_WAVES.length - 1];
        var n = safeWave - 3;
        // 深水区（第 17 波起）：硬下限之后继续缓慢收紧，速度不再上浮（保护可读性）
        var deep = Math.max(0, safeWave - 17);
        var deepScale = Math.pow(0.995, deep);
        return {
          wave: safeWave,
          phase: 'hard',
          duration: 60,
          messages: true,
          requirements: true,
          walls: true,
          messageInterval: Math.max(0.50, Math.max(0.6, base.messageInterval * Math.pow(0.975, n)) * deepScale),
          requirementInterval: Math.max(1.60, Math.max(1.9, base.requirementInterval * Math.pow(0.98, n)) * deepScale),
          wallInterval: Math.max(4.80, Math.max(5.2, base.wallInterval * Math.pow(0.98, n)) * deepScale),
          speedScale: Math.min(1.35, base.speedScale + 0.02 * n),
          maxThreats: Math.min(22, Math.min(18, base.maxThreats + Math.floor(n / 2)) + Math.floor(deep / 2)),
          gapWidth: Math.max(88, Math.max(100, base.gapWidth - 5 * n) - Math.floor(deep / 2))
        };
      }
      var waveMultiplierFor = exports('waveMultiplierFor', function waveMultiplierFor(wave) {
        return Math.min(3, 1 + 0.1 * (Math.max(1, wave) - 1));
      });
      var comboMultiplierFor = exports('comboMultiplierFor', function comboMultiplierFor(combo) {
        return 1 + 0.05 * Math.min(Math.max(0, combo), GRAZE_MAX_STACK);
      });
      /** S 级额外门槛：局内至少达成一次操作评价 S（甩脱爆发 / 穿缝连击 / 擦弹大师任一）。 */
      var rankFor = exports('rankFor', function rankFor(wave, score, bestGrade) {
        if (bestGrade === void 0) {
          bestGrade = null;
        }
        if (wave >= 12 && score >= 12000 && bestGrade === 'S') return 'S · 摸鱼大师';
        if (wave >= 9 && score >= 7000) return 'A · 摸鱼高手';
        if (wave >= 6 && score >= 3500) return 'B · 合格摸鱼';
        return 'C · 打工仔';
      });
      var formatGameOverSummary = exports('formatGameOverSummary', function formatGameOverSummary(stats) {
        var _stats$bestGrade;
        var gradePart = stats.gradeCount && stats.gradeCount > 0 ? " \xB7 \u64CD\u4F5C\u8BC4\u4EF7 " + stats.gradeCount + " \u6B21" + (stats.bestGrade ? "\uFF08\u6700\u9AD8 " + stats.bestGrade + "\uFF09" : '') : '';
        var missingRiskGrade = stats.wave >= 12 && stats.score >= 12000 && stats.bestGrade !== 'S';
        return "\u4EFB\u52A1\u5806\u6EE1\uFF0C\u88AB\u8FEB\u5F00\u5DE5\n\u62B5\u8FBE\u7B2C " + stats.wave + " \u6CE2 \xB7 \u5B58\u6D3B " + stats.elapsed.toFixed(1) + " \u79D2 \xB7 " + stats.score + " \u5206\n" + ("\u8BC4\u7EA7\uFF1A" + rankFor(stats.wave, stats.score, (_stats$bestGrade = stats.bestGrade) != null ? _stats$bestGrade : null) + (missingRiskGrade ? '（S 级需至少一次操作评价 S）' : '') + "\n\u6700\u9AD8\u8FDE\u51FB " + stats.maxCombo + " \xB7 \u7A7F\u7F1D " + stats.gapClears + " \xB7 \u7529\u8131 " + stats.breakLocks + " \xB7 \u8BF7\u5047\u6761 " + stats.leaveSlips + gradePart + "\n\n\u70B9\u51FB\u91CD\u65B0\u6478\u9C7C");
      });
      var clamp = function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      };
      var distanceSquared = function distanceSquared(a, b) {
        return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
      };
      var normalize = function normalize(x, y) {
        var length = Math.hypot(x, y) || 1;
        return {
          x: x / length,
          y: y / length
        };
      };
      var rotateToward = function rotateToward(vx, vy, targetAngle, maxTurn) {
        var speed = Math.hypot(vx, vy);
        var current = Math.atan2(vy, vx);
        var delta = (targetAngle - current + Math.PI * 3) % (Math.PI * 2) - Math.PI;
        delta = clamp(delta, -maxTurn, maxTurn);
        return {
          x: Math.cos(current + delta) * speed,
          y: Math.sin(current + delta) * speed
        };
      };
      var GestureRecognizer = exports('GestureRecognizer', /*#__PURE__*/function () {
        function GestureRecognizer(maxInterval, dragThreshold) {
          if (maxInterval === void 0) {
            maxInterval = 0.3;
          }
          if (dragThreshold === void 0) {
            dragThreshold = 18;
          }
          this.maxInterval = void 0;
          this.dragThreshold = void 0;
          this.startX = 0;
          this.startY = 0;
          this.dragged = false;
          this.lastTapTime = -Infinity;
          this.maxInterval = maxInterval;
          this.dragThreshold = dragThreshold;
        }
        var _proto = GestureRecognizer.prototype;
        _proto.begin = function begin(x, y, _time) {
          this.startX = x;
          this.startY = y;
          this.dragged = false;
        };
        _proto.move = function move(x, y) {
          if (Math.hypot(x - this.startX, y - this.startY) > this.dragThreshold) this.dragged = true;
        }

        /** 双击判定：屏幕任意位置的两次轻点（不需要点到角色身上），拖动不触发。 */;
        _proto.end = function end(x, y, time) {
          var moved = Math.hypot(x - this.startX, y - this.startY);
          var valid = !this.dragged && moved <= this.dragThreshold;
          if (!valid) {
            this.lastTapTime = -Infinity;
            return false;
          }
          var doubled = time - this.lastTapTime <= this.maxInterval;
          this.lastTapTime = doubled ? -Infinity : time;
          return doubled;
        };
        _proto.reset = function reset() {
          this.lastTapTime = -Infinity;
          this.dragged = false;
        };
        return GestureRecognizer;
      }());
      var MessageBullet = exports('MessageBullet', /*#__PURE__*/function () {
        function MessageBullet(x, y, vx, vy) {
          this.kind = 'message';
          this.radius = 15;
          this.state = 'cruise';
          this.homingTime = 0;
          this.senseRadius = 230;
          /** 出圈再锁：追踪「放弃」后必须离开感应圈，才会重新武装并再次锁定 */
          this.armed = true;
          this.grazed = false;
          this.alive = true;
          this.x = void 0;
          this.y = void 0;
          this.vx = void 0;
          this.vy = void 0;
          this.x = x;
          this.y = y;
          this.vx = vx;
          this.vy = vy;
        }

        /** 追踪结束时若已甩开距离，返回 'lock-lost'（供模型结算「已读不回」）。 */
        var _proto2 = MessageBullet.prototype;
        _proto2.update = function update(dt, player) {
          var result = null;
          var distSq = distanceSquared(this, player);
          if (!this.armed && distSq > Math.pow(this.senseRadius, 2)) this.armed = true;
          if (this.state === 'cruise' && this.armed && distSq <= Math.pow(this.senseRadius, 2)) {
            // 无预警：进入感应半径立即开始追踪
            this.state = 'homing';
            this.homingTime = 1.8;
          } else if (this.state === 'homing') {
            var turned = rotateToward(this.vx, this.vy, Math.atan2(player.y - this.y, player.x - this.x), 2.2 * dt);
            this.vx = turned.x;
            this.vy = turned.y;
            this.homingTime -= dt;
            if (this.homingTime <= 0) {
              this.state = 'cruise';
              this.armed = false;
              if (distSq >= Math.pow(BREAK_LOCK_DISTANCE, 2)) result = 'lock-lost';
            }
          }
          this.x += this.vx * dt;
          this.y += this.vy * dt;
          return result;
        };
        return MessageBullet;
      }());
      var createMessage = exports('createMessage', function createMessage(x, y, vx, vy) {
        return new MessageBullet(x, y, vx, vy);
      });
      var RequirementBullet = exports('RequirementBullet', /*#__PURE__*/function () {
        function RequirementBullet(x, y, vx, vy, random) {
          this.kind = 'requirement';
          this.radius = 17;
          this.turnTimer = void 0;
          this.grazed = false;
          this.alive = true;
          this.x = void 0;
          this.y = void 0;
          this.vx = void 0;
          this.vy = void 0;
          this.random = void 0;
          this.x = x;
          this.y = y;
          this.vx = vx;
          this.vy = vy;
          this.random = random;
          this.turnTimer = 1.5 + random() * 1.5;
        }

        /** 无预警：计时到点立即转向（单次转角上限 ±0.72π，不会 180° 掉头）。 */
        var _proto3 = RequirementBullet.prototype;
        _proto3.update = function update(dt) {
          this.turnTimer -= dt;
          if (this.turnTimer <= 0) {
            var current = Math.atan2(this.vy, this.vx);
            var offset = (this.random() * 2 - 1) * Math.PI * 0.72;
            var speed = Math.hypot(this.vx, this.vy);
            this.vx = Math.cos(current + offset) * speed;
            this.vy = Math.sin(current + offset) * speed;
            this.turnTimer = 1.5 + this.random() * 1.5;
          }
          this.x += this.vx * dt;
          this.y += this.vy * dt;
        };
        return RequirementBullet;
      }());
      var createRequirement = exports('createRequirement', function createRequirement(x, y, vx, vy, random) {
        return new RequirementBullet(x, y, vx, vy, random);
      });
      /** 文件夹墙：整排向上推进，某一位置留出可穿越的缺口。 */
      function createFolderWall(width, gapPosition, gapWidth, y, speed) {
        if (gapWidth === void 0) {
          gapWidth = 136;
        }
        if (y === void 0) {
          y = FIELD_HEIGHT + 30;
        }
        if (speed === void 0) {
          speed = 115;
        }
        var gapCenter = 100 + clamp(gapPosition, 0, 1) * (width - 200);
        var gapStart = gapCenter - gapWidth / 2;
        var gapEnd = gapCenter + gapWidth / 2;
        var orbs = [];
        for (var x = 22; x < width; x += 44) {
          if (x > gapStart - 19 && x < gapEnd + 19) continue;
          orbs.push({
            kind: 'folder',
            x: x,
            y: y,
            vx: 0,
            vy: -speed,
            radius: 19,
            alive: true,
            grazed: false
          });
        }
        return {
          orbs: orbs,
          gapStart: gapStart,
          gapEnd: gapEnd
        };
      }
      var GameModel = exports('GameModel', /*#__PURE__*/function () {
        function GameModel(random) {
          if (random === void 0) {
            random = Math.random;
          }
          this.random = void 0;
          this.width = FIELD_WIDTH;
          this.height = FIELD_HEIGHT;
          this.player = {
            x: FIELD_WIDTH / 2,
            y: 240,
            radius: PLAYER_RADIUS
          };
          this.bullets = [];
          this.skillOrbs = [];
          this.leaveSlips = [];
          this.walls = [];
          this.bulletPool = [];
          this.events = [];
          this.elapsed = 0;
          this.wave = 1;
          this.waveState = 'running';
          this.waveTimer = 0;
          this.waveNoHit = true;
          this.cleanWaveStreak = 0;
          this.lastWaveBonus = 0;
          this.realtimeScore = 0;
          this.bonusScore = 0;
          this.score = 0;
          this.combo = 0;
          this.maxCombo = 0;
          this.comboTimer = 0;
          this.comboTail = 0;
          this.grazeCooldown = 0;
          this.gapClears = 0;
          this.breakLocks = 0;
          this.leaveSlipCount = 0;
          this.leaveSlipFlash = 0;
          this.gradeCount = 0;
          this.bestGrade = null;
          this.breakBurst = [];
          this.breakBurstTier = 0;
          this.gapChain = [];
          this.gapChainTier = 0;
          this.grazeGradeTier = 0;
          this.energy = 0;
          this.workload = 0;
          this.shieldTime = 0;
          this.invulnerableTime = 0;
          this.gameOver = false;
          this.started = false;
          this.messageTimer = 0.6;
          this.requirementTimer = 2.3;
          this.wallTimer = 4;
          this.skillTimer = 2.5;
          this.leaveSlipRollTimer = LEAVE_SLIP_ROLL_INTERVAL;
          this.random = random;
        }
        var _proto4 = GameModel.prototype;
        _proto4.stats = function stats() {
          return {
            elapsed: this.elapsed,
            score: this.score,
            wave: this.wave,
            maxCombo: this.maxCombo,
            gapClears: this.gapClears,
            breakLocks: this.breakLocks,
            leaveSlips: this.leaveSlipCount,
            gradeCount: this.gradeCount,
            bestGrade: this.bestGrade
          };
        };
        _proto4.takeEvents = function takeEvents() {
          var drained = this.events.slice();
          this.events.length = 0;
          return drained;
        };
        _proto4.pushEvent = function pushEvent(event) {
          if (this.events.length < MAX_EVENTS) this.events.push(event);
        };
        _proto4.syncScore = function syncScore() {
          this.score = Math.floor(this.realtimeScore) + this.bonusScore;
        };
        _proto4.addEnergy = function addEnergy(value) {
          this.energy = clamp(this.energy + value, 0, 100);
        };
        _proto4.activateShield = function activateShield() {
          if (this.gameOver || this.energy < 100 || this.shieldTime > 0) return false;
          this.energy = 0;
          this.shieldTime = 3;
          this.pushEvent({
            type: 'shield'
          });
          return true;
        };
        _proto4.hitPlayer = function hitPlayer() {
          if (this.gameOver || this.shieldTime > 0 || this.invulnerableTime > 0) return false;
          this.workload += 1;
          this.invulnerableTime = 1;
          this.waveNoHit = false;
          this.combo = 0;
          this.comboTimer = 0;
          this.comboTail = 0;
          this.grazeGradeTier = 0;
          this.pushEvent({
            type: 'hit',
            x: this.player.x,
            y: this.player.y,
            workload: this.workload
          });
          if (this.workload >= 3) this.gameOver = true;
          return true;
        };
        _proto4.movePlayer = function movePlayer(x, y) {
          this.player.x = clamp(x, 34, this.width - 34);
          this.player.y = clamp(y, 90, this.height - HUD_SAFE_HEIGHT - 34);
        };
        _proto4.startNextWave = function startNextWave() {
          if (this.gameOver || this.waveState !== 'intermission') return false;
          this.wave += 1;
          this.waveTimer = 0;
          this.waveNoHit = true;
          this.waveState = 'running';
          var config = this.config;
          this.messageTimer = Math.min(0.6, config.messageInterval || 0.85);
          this.requirementTimer = Math.min(1.6, config.requirementInterval || 2.3);
          this.wallTimer = Math.min(2, config.wallInterval || 4);
          return true;
        };
        _proto4.reset = function reset() {
          this.bullets.length = 0;
          this.skillOrbs.length = 0;
          this.leaveSlips.length = 0;
          this.walls.length = 0;
          this.events.length = 0;
          this.elapsed = 0;
          this.score = 0;
          this.realtimeScore = 0;
          this.bonusScore = 0;
          this.energy = 0;
          this.workload = 0;
          this.shieldTime = 0;
          this.invulnerableTime = 0;
          this.gameOver = false;
          this.started = true;
          this.player.x = this.width / 2;
          this.player.y = 240;
          this.wave = 1;
          this.waveState = 'running';
          this.waveTimer = 0;
          this.waveNoHit = true;
          this.cleanWaveStreak = 0;
          this.lastWaveBonus = 0;
          this.combo = 0;
          this.maxCombo = 0;
          this.comboTimer = 0;
          this.comboTail = 0;
          this.grazeCooldown = 0;
          this.gapClears = 0;
          this.breakLocks = 0;
          this.leaveSlipCount = 0;
          this.leaveSlipFlash = 0;
          this.gradeCount = 0;
          this.bestGrade = null;
          this.breakBurst.length = 0;
          this.breakBurstTier = 0;
          this.gapChain.length = 0;
          this.gapChainTier = 0;
          this.grazeGradeTier = 0;
          this.leaveSlipRollTimer = LEAVE_SLIP_ROLL_INTERVAL;
          var config = this.config;
          this.messageTimer = Math.min(0.6, config.messageInterval || 0.85);
          this.requirementTimer = Math.min(1.6, config.requirementInterval || 2.3);
          this.wallTimer = Math.min(2, config.wallInterval || 4);
          this.skillTimer = 2.5;
          this.spawnOpeningVolley();
        }

        /** 简单波开局齐射：开局直接放 3 颗紫弹进场，避免开局几秒场上太空。 */;
        _proto4.spawnOpeningVolley = function spawnOpeningVolley() {
          var speed = 125 * this.config.speedScale;
          for (var index = 0; index < 3; index += 1) {
            var fromLeft = index % 2 === 0;
            this.bullets.push(createRequirement(fromLeft ? -25 : this.width + 25, 240 + index * 260 + this.random() * 120, fromLeft ? speed : -speed, (this.random() - 0.5) * 80, this.random));
          }
        };
        _proto4.update = function update(dt) {
          if (!this.started || this.gameOver) return;
          dt = clamp(dt, 0, 0.05);
          this.leaveSlipFlash = Math.max(0, this.leaveSlipFlash - dt);
          if (this.waveState === 'intermission') return;
          var config = this.config;
          this.elapsed += dt;
          this.waveTimer += dt;
          this.shieldTime = Math.max(0, this.shieldTime - dt);
          this.invulnerableTime = Math.max(0, this.invulnerableTime - dt);
          this.grazeCooldown = Math.max(0, this.grazeCooldown - dt);
          this.realtimeScore += dt * 10 * waveMultiplierFor(this.wave) * this.comboMultiplier;
          this.updateCombo(dt);
          this.syncScore();
          this.spawn(dt, config);
          for (var _iterator = _createForOfIteratorHelperLoose(this.bullets), _step; !(_step = _iterator()).done;) {
            var bullet = _step.value;
            var event = null;
            if (bullet.kind === 'message') event = bullet.update(dt, this.player);else if (bullet.kind === 'requirement') bullet.update(dt);else {
              bullet.x += bullet.vx * dt;
              bullet.y += bullet.vy * dt;
            }
            var hitDistance = bullet.radius + this.player.radius;
            var distance = distanceSquared(bullet, this.player);
            if (distance <= Math.pow(hitDistance, 2)) {
              if (this.shieldTime <= 0 && this.hitPlayer()) bullet.alive = false;
            } else if (distance <= Math.pow(GRAZE_RADIUS, 2)) {
              this.tryGraze(bullet);
            }
            if (event === 'lock-lost' && this.shieldTime <= 0) {
              var value = Math.round(30 * this.comboMultiplier);
              this.bonusScore += value;
              this.breakLocks += 1;
              this.syncScore();
              this.pushEvent({
                type: 'break',
                x: bullet.x,
                y: bullet.y,
                value: value
              });
              this.evaluateBurst('break', bullet.x, bullet.y);
            }
            if (bullet.x < -90 || bullet.x > this.width + 90 || bullet.y < -90 || bullet.y > this.height + 90) bullet.alive = false;
          }
          this.updateWalls();
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.skillOrbs), _step2; !(_step2 = _iterator2()).done;) {
            var orb = _step2.value;
            orb.pulse += dt;
            if (this.shieldTime <= 0 && distanceSquared(orb, this.player) <= Math.pow(orb.radius + this.player.radius, 2)) {
              this.addEnergy(20);
              orb.alive = false;
            }
          }
          this.updateLeaveSlips(dt);
          this.recycleDead();

          // 波末收官：简单/一般到达时长后直接暂定并弹出下一关提示（弹幕不消失、不等出画）；困难一口气不间断，每 60 秒升一档
          if (this.waveState === 'running' && this.waveTimer >= config.duration) {
            if (config.phase === 'hard') {
              this.stepHardWave();
            } else {
              this.completeWave();
            }
          }
        };
        _proto4.updateCombo = function updateCombo(dt) {
          if (this.combo <= 0) return;
          if (this.comboTimer > 0) this.comboTimer -= dt;else {
            this.comboTail += dt;
            while (this.comboTail >= 0.5 && this.combo > 0) {
              this.combo -= 1;
              this.comboTail -= 0.5;
            }
            if (this.combo <= 0) this.grazeGradeTier = 0;
          }
        };
        _proto4.tryGraze = function tryGraze(bullet) {
          if (bullet.grazed || this.grazeCooldown > 0 || this.shieldTime > 0) return;
          bullet.grazed = true;
          this.combo += 1;
          this.maxCombo = Math.max(this.maxCombo, this.combo);
          this.grazeCooldown = GRAZE_COOLDOWN;
          this.comboTimer = 3;
          this.comboTail = 0;
          this.pushEvent({
            type: 'graze',
            x: this.player.x,
            y: this.player.y
          });
          this.evaluateGraze();
        }

        /** 连续达成困难操作时即时评级：窗口内达到 2/3/4 次 → B/A/S，每个等级只奖励一次。 */;
        _proto4.evaluateBurst = function evaluateBurst(kind, x, y) {
          var spec = kind === 'break' ? BREAK_BURST : GAP_CHAIN;
          var list = kind === 'break' ? this.breakBurst : this.gapChain;
          list.push(this.elapsed);
          while (list.length > 0 && this.elapsed - list[0] > spec.window) list.shift();
          var count = list.length;
          var tier = count >= spec.s ? 3 : count >= spec.a ? 2 : count >= spec.b ? 1 : 0;
          var given = kind === 'break' ? this.breakBurstTier : this.gapChainTier;
          if (tier > given) {
            var grade = tier === 3 ? 'S' : tier === 2 ? 'A' : 'B';
            if (kind === 'break') this.breakBurstTier = tier;else this.gapChainTier = tier;
            this.awardGrade(grade, kind === 'break' ? '甩脱爆发' : '穿缝连击', count, spec.bonus, x, y);
          } else if (count < spec.b) {
            if (kind === 'break') this.breakBurstTier = 0;else this.gapChainTier = 0;
          }
        }

        /** 擦弹链评级：单条连击链达到 6/10/15 层 → B/A/S。 */;
        _proto4.evaluateGraze = function evaluateGraze() {
          var tier = this.combo >= GRAZE_GRADE.s ? 3 : this.combo >= GRAZE_GRADE.a ? 2 : this.combo >= GRAZE_GRADE.b ? 1 : 0;
          if (tier <= this.grazeGradeTier) return;
          this.grazeGradeTier = tier;
          var grade = tier === 3 ? 'S' : tier === 2 ? 'A' : 'B';
          this.awardGrade(grade, '擦弹大师', this.combo, GRAZE_GRADE.bonus, this.player.x, this.player.y);
        };
        _proto4.awardGrade = function awardGrade(grade, label, count, bonus, x, y) {
          var value = bonus[grade];
          this.bonusScore += value;
          this.syncScore();
          this.gradeCount += 1;
          if (!this.bestGrade || GRADE_RANK[grade] > GRADE_RANK[this.bestGrade]) this.bestGrade = grade;
          this.pushEvent({
            type: 'grade',
            grade: grade,
            label: label,
            count: count,
            value: value,
            x: x,
            y: y
          });
        };
        _proto4.countThreats = function countThreats() {
          var count = 0;
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.bullets), _step3; !(_step3 = _iterator3()).done;) {
            var bullet = _step3.value;
            if (bullet.kind !== 'folder') count += 1;
          }
          return count;
        };
        _proto4.countRequirements = function countRequirements() {
          var count = 0;
          for (var _iterator4 = _createForOfIteratorHelperLoose(this.bullets), _step4; !(_step4 = _iterator4()).done;) {
            var bullet = _step4.value;
            if (bullet.kind === 'requirement') count += 1;
          }
          return count;
        };
        _proto4.spawn = function spawn(dt, config) {
          // 暂定期间停掉生成：弹幕原地保留，点击确认后恢复并加入新波弹幕
          if (this.waveState !== 'running') return;
          if (config.messages) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) {
              if (this.countThreats() < config.maxThreats) {
                var x = 40 + this.random() * (this.width - 80);
                var speed = 145 * config.speedScale;
                var dir = normalize(this.player.x - x + (this.random() - 0.5) * 280, this.player.y - this.height);
                this.bullets.push(createMessage(x, this.height + 30, dir.x * speed, dir.y * speed));
              }
              this.messageTimer = config.messageInterval;
            }
          }
          if (config.requirements) {
            this.requirementTimer -= dt;
            if (this.requirementTimer <= 0) {
              if (this.countThreats() < config.maxThreats || this.countRequirements() < REQUIREMENT_FLOOR) {
                var fromLeft = this.random() < 0.5;
                var _speed = 125 * config.speedScale;
                this.bullets.push(createRequirement(fromLeft ? -25 : this.width + 25, 180 + this.random() * 850, fromLeft ? _speed : -_speed, (this.random() - 0.5) * 100, this.random));
              }
              this.requirementTimer = config.requirementInterval;
            }
          }
          if (config.walls) {
            // 无预警：计时到点直接生成文件夹墙（不做边缘预告）
            if (this.wallTimer > 0) this.wallTimer -= dt;else if (this.walls.length < 2) {
              this.spawnWall(config);
              this.wallTimer = config.wallInterval;
            }
          }
          this.skillTimer -= dt;
          if (this.skillTimer <= 0 && this.skillOrbs.length < 3) {
            this.skillOrbs.push({
              kind: 'skill',
              x: 70 + this.random() * (this.width - 140),
              y: 170 + this.random() * 900,
              radius: 17,
              alive: true,
              pulse: 0
            });
            this.skillTimer = 5.2;
          }
        };
        _proto4.spawnWall = function spawnWall(config) {
          var wall = createFolderWall(this.width, 0.1 + this.random() * 0.8, config.gapWidth, this.height + 28, 115 * config.speedScale);
          var state = {
            gapStart: wall.gapStart,
            gapEnd: wall.gapEnd,
            evaluated: false,
            orbs: []
          };
          for (var _iterator5 = _createForOfIteratorHelperLoose(wall.orbs), _step5; !(_step5 = _iterator5()).done;) {
            var created = _step5.value;
            var orb = this.bulletPool.pop();
            if (orb) {
              Object.assign(orb, created);
              orb.grazed = false;
              this.bullets.push(orb);
              state.orbs.push(orb);
            } else {
              this.bullets.push(created);
              state.orbs.push(created);
            }
          }
          this.walls.push(state);
        }

        /** 文件夹墙越过玩家所在行时结算「极限穿缝」：贴着文件夹边缘蹭过才有奖励（与碰撞判定同一把尺）。 */;
        _proto4.updateWalls = function updateWalls() {
          for (var i = this.walls.length - 1; i >= 0; i--) {
            var wall = this.walls[i];
            var aliveOrbs = wall.orbs.filter(function (orb) {
              return orb.alive;
            });
            if (aliveOrbs.length === 0) {
              this.walls.splice(i, 1);
              continue;
            }
            var rowY = aliveOrbs[0].y;
            if (!wall.evaluated && rowY <= this.player.y) {
              wall.evaluated = true;
              if (this.shieldTime <= 0) {
                // 贴文件夹穿缝：按玩家边缘与最近文件夹边缘的余量计距，任何对齐下都可无伤达成
                var clearance = Infinity;
                for (var _iterator6 = _createForOfIteratorHelperLoose(aliveOrbs), _step6; !(_step6 = _iterator6()).done;) {
                  var orb = _step6.value;
                  var edgeDistance = Math.hypot(orb.x - this.player.x, orb.y - this.player.y) - (orb.radius + this.player.radius);
                  if (edgeDistance < clearance) clearance = edgeDistance;
                }
                if (clearance > 0 && clearance <= GAP_CLEAR_DISTANCE) {
                  var value = Math.round(50 * this.comboMultiplier);
                  this.bonusScore += value;
                  this.gapClears += 1;
                  this.syncScore();
                  this.pushEvent({
                    type: 'gap',
                    x: this.player.x,
                    y: this.player.y,
                    value: value
                  });
                  this.evaluateBurst('gap', this.player.x, this.player.y);
                }
              }
            }
          }
        };
        _proto4.updateLeaveSlips = function updateLeaveSlips(dt) {
          for (var _iterator7 = _createForOfIteratorHelperLoose(this.leaveSlips), _step7; !(_step7 = _iterator7()).done;) {
            var slip = _step7.value;
            if (!slip.alive) continue;
            slip.life -= dt;
            slip.spin += dt;
            if (slip.life <= 0) {
              slip.alive = false;
              continue;
            }
            if (distanceSquared(slip, this.player) <= Math.pow(slip.radius + this.player.radius, 2)) {
              slip.alive = false;
              this.claimLeaveSlip(slip);
            }
          }
          if (this.leaveSlips.length === 0) {
            this.leaveSlipRollTimer -= dt;
            if (this.leaveSlipRollTimer <= 0) {
              this.leaveSlipRollTimer = LEAVE_SLIP_ROLL_INTERVAL;
              if (this.random() < LEAVE_SLIP_CHANCE) this.spawnLeaveSlip();
            }
          }
        };
        _proto4.spawnLeaveSlip = function spawnLeaveSlip() {
          var x = 70 + this.random() * (this.width - 140);
          var y = 170 + this.random() * 900;
          for (var attempt = 0; attempt < 8; attempt += 1) {
            var farFromPlayer = distanceSquared({
              x: x,
              y: y
            }, this.player) >= Math.pow(150, 2);
            var farFromOrbs = this.skillOrbs.every(function (orb) {
              return distanceSquared({
                x: x,
                y: y
              }, orb) >= Math.pow(120, 2);
            });
            if (farFromPlayer && farFromOrbs) break;
            x = 70 + this.random() * (this.width - 140);
            y = 170 + this.random() * 900;
          }
          this.leaveSlips.push({
            kind: 'leave',
            x: x,
            y: y,
            radius: 16,
            alive: true,
            life: LEAVE_SLIP_LIFETIME,
            spin: 0
          });
          this.pushEvent({
            type: 'leave-spawn',
            x: x,
            y: y
          });
        }

        /** 拾取请假条：立即清空场上弹幕（每条被清掉的弹幕 +10 分，含文件夹方块），并附加 1 秒无敌。 */;
        _proto4.claimLeaveSlip = function claimLeaveSlip(slip) {
          this.leaveSlipCount += 1;
          this.leaveSlipFlash = 1.4;
          var cleared = 0;
          for (var _iterator8 = _createForOfIteratorHelperLoose(this.bullets), _step8; !(_step8 = _iterator8()).done;) {
            var bullet = _step8.value;
            if (!bullet.alive) continue;
            cleared += 1;
            bullet.alive = false;
          }
          var value = cleared * LEAVE_SLIP_CLEAR_VALUE;
          this.bonusScore += value;
          this.syncScore();
          this.walls.length = 0;
          this.invulnerableTime = Math.max(this.invulnerableTime, LEAVE_SLIP_INVULNERABLE);
          this.pushEvent({
            type: 'leave',
            x: slip.x,
            y: slip.y,
            count: cleared,
            value: value
          });
        };
        _proto4.completeWave = function completeWave() {
          var config = this.config;
          var bonus = config.phase === 'simple' ? 60 : config.phase === 'normal' ? 120 : 200;
          this.bonusScore += bonus;
          if (this.waveNoHit) {
            this.bonusScore += 150 + Math.min(200, 50 * this.cleanWaveStreak);
            this.cleanWaveStreak += 1;
          } else this.cleanWaveStreak = 0;
          this.lastWaveBonus = bonus;
          this.syncScore();
          this.waveState = 'intermission';
          this.pushEvent({
            type: 'wave-clear',
            wave: this.wave,
            bonus: bonus,
            noHit: this.waveNoHit
          });
        }

        /** 困难阶段：一口气不间断。每 60 秒升一档——不清屏、不暂停、不进入暂定。 */;
        _proto4.stepHardWave = function stepHardWave() {
          var noHit = this.waveNoHit;
          var noHitBonus = noHit ? 150 + Math.min(200, 50 * this.cleanWaveStreak) : 0;
          this.cleanWaveStreak = noHit ? this.cleanWaveStreak + 1 : 0;
          var value = 200 + noHitBonus;
          this.bonusScore += value;
          this.lastWaveBonus = value;
          this.waveNoHit = true;
          this.wave += 1;
          this.waveTimer = 0;
          this.syncScore();
          this.pushEvent({
            type: 'hard-step',
            wave: this.wave,
            value: value
          });
        };
        _proto4.recycleDead = function recycleDead() {
          var write = 0;
          for (var _iterator9 = _createForOfIteratorHelperLoose(this.bullets), _step9; !(_step9 = _iterator9()).done;) {
            var bullet = _step9.value;
            if (bullet.alive) this.bullets[write++] = bullet;else if (bullet.kind === 'folder' && this.bulletPool.length < 64) this.bulletPool.push(bullet);
          }
          this.bullets.length = write;
          write = 0;
          for (var _iterator10 = _createForOfIteratorHelperLoose(this.skillOrbs), _step10; !(_step10 = _iterator10()).done;) {
            var orb = _step10.value;
            if (orb.alive) this.skillOrbs[write++] = orb;
          }
          this.skillOrbs.length = write;
          write = 0;
          for (var _iterator11 = _createForOfIteratorHelperLoose(this.leaveSlips), _step11; !(_step11 = _iterator11()).done;) {
            var slip = _step11.value;
            if (slip.alive) this.leaveSlips[write++] = slip;
          }
          this.leaveSlips.length = write;
        };
        _createClass(GameModel, [{
          key: "config",
          get: function get() {
            return waveConfigFor(this.wave);
          }
        }, {
          key: "comboMultiplier",
          get: function get() {
            return comboMultiplierFor(this.combo);
          }
        }]);
        return GameModel;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/main", ['./GameMain.ts', './GameModel.ts'], function () {
  return {
    setters: [null, null],
    execute: function () {}
  };
});

(function(r) {
  r('virtual:///prerequisite-imports/main', 'chunks:///_virtual/main'); 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});