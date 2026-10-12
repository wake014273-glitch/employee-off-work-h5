System.register("chunks:///_virtual/FinalArtHud.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameLayout.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, SpriteFrame, Rect, Size, Node, UITransform, Sprite, Label, Color, Graphics, Mask, referencePoint, DESIGN_WIDTH, DESIGN_HEIGHT, ART_SCALE, formatClock, HUD_LAYOUT, PORTRAIT_RING;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      SpriteFrame = module.SpriteFrame;
      Rect = module.Rect;
      Size = module.Size;
      Node = module.Node;
      UITransform = module.UITransform;
      Sprite = module.Sprite;
      Label = module.Label;
      Color = module.Color;
      Graphics = module.Graphics;
      Mask = module.Mask;
    }, function (module) {
      referencePoint = module.referencePoint;
      DESIGN_WIDTH = module.DESIGN_WIDTH;
      DESIGN_HEIGHT = module.DESIGN_HEIGHT;
      ART_SCALE = module.ART_SCALE;
      formatClock = module.formatClock;
      HUD_LAYOUT = module.HUD_LAYOUT;
      PORTRAIT_RING = module.PORTRAIT_RING;
    }],
    execute: function () {
      exports('sliceFrame', sliceFrame);
      cclegacy._RF.push({}, "0bf83Zf4HVMl7CgjW+150Av", "FinalArtHud", undefined);

      /** Slice the approved textures at runtime; source PNGs and editor metadata stay intact. */
      function sliceFrame(source, x, y, width, height) {
        var frame = new SpriteFrame();
        frame.texture = source.texture;
        frame.rect = new Rect(x, y, width, height);
        frame.originalSize = new Size(width, height);
        return frame;
      }
      var FinalArtHud = exports('FinalArtHud', /*#__PURE__*/function () {
        function FinalArtHud(parent) {
          this.root = void 0;
          this.panels = void 0;
          this.time = void 0;
          this.score = void 0;
          this.chargeRing = void 0;
          this.portrait = void 0;
          this.chargeSegments = 0;
          this.shieldFraction = 0;
          this.chargeFlashes = [0, 0, 0, 0, 0];
          this.workloadPulses = [0, 0, 0];
          this.clock = 0;
          this.ringCenter = void 0;
          this.slots = [];
          this.ownedFrames = [];
          this.emptySlot = void 0;
          this.filledSlot = void 0;
          this.root = new Node('ApprovedArtHUD');
          parent.addChild(this.root);
          this.panels = {
            time: this.panel('TimePanel', HUD_LAYOUT.time, new Rect(35, 12, 1005, 437)),
            score: this.panel('ScorePanel', HUD_LAYOUT.score, new Rect(185, 0, 800, 396)),
            workload: this.panel('WorkloadPanel', HUD_LAYOUT.workload, new Rect(16, 12, 1128, 428))
          };
          // Cream patches sit within the printed numeric fields, leaving panel borders intact.
          this.time = this.label('LiveTime', 29, this.rawBox('time', 453, 217, 437, 150));
          this.score = this.label('LiveScore', 29, this.rawBox('score', 311, 201, 564, 146));
          this.time.isBold = this.score.isBold = true;
          for (var index = 0; index < 3; index += 1) {
            this.slots.push(this.sprite("WorkloadSlot" + index, this.rawBox('workload', 62 + index * 225, 185, 219, 195)));
          }
          var center = this.rawBox('workload', 937, 234, 0, 0);
          var point = referencePoint(center.x, center.y);
          this.ringCenter = {
            x: point.x - DESIGN_WIDTH / 2,
            y: point.y - DESIGN_HEIGHT / 2
          };
          var ring = new Node('PortraitChargeRing');
          ring.addComponent(UITransform).setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
          this.root.addChild(ring);
          this.chargeRing = ring.addComponent(Graphics);
          // Enlarge only the inset portrait and energy ring; the workload panel is untouched.
          var portraitMask = new Node('PortraitAvatarMask');
          portraitMask.setPosition(this.ringCenter.x, this.ringCenter.y);
          portraitMask.addComponent(UITransform).setContentSize(PORTRAIT_RING.avatarDiameter, PORTRAIT_RING.avatarDiameter);
          portraitMask.addComponent(Mask).type = Mask.Type.GRAPHICS_ELLIPSE;
          this.root.addChild(portraitMask);
          var portrait = new Node('PortraitAvatar');
          portrait.addComponent(UITransform).setContentSize(PORTRAIT_RING.avatarDiameter, PORTRAIT_RING.avatarDiameter);
          portraitMask.addChild(portrait);
          this.portrait = portrait.addComponent(Sprite);
          this.portrait.sizeMode = Sprite.SizeMode.CUSTOM;
        }
        var _proto = FinalArtHud.prototype;
        _proto.sprite = function sprite(name, box) {
          var node = new Node(name);
          var point = referencePoint(box.x + box.width / 2, box.y + box.height / 2);
          node.setPosition(point.x - DESIGN_WIDTH / 2, point.y - DESIGN_HEIGHT / 2);
          node.addComponent(UITransform).setContentSize(box.width * ART_SCALE, box.height * ART_SCALE);
          this.root.addChild(node);
          var sprite = node.addComponent(Sprite);
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          return sprite;
        };
        _proto.panel = function panel(name, box, crop) {
          return {
            sprite: this.sprite(name, box),
            box: box,
            crop: crop
          };
        };
        _proto.label = function label(name, size, box) {
          var node = new Node(name);
          var point = referencePoint(box.x + box.width / 2, box.y + box.height / 2);
          node.setPosition(point.x - DESIGN_WIDTH / 2, point.y - DESIGN_HEIGHT / 2);
          node.addComponent(UITransform).setContentSize(box.width * ART_SCALE, box.height * ART_SCALE);
          this.root.addChild(node);
          var label = node.addComponent(Label);
          label.fontFamily = 'Arial';
          label.fontSize = size;
          label.lineHeight = size + 4;
          label.color = new Color(61, 36, 60);
          label.horizontalAlign = Label.HorizontalAlign.CENTER;
          label.verticalAlign = Label.VerticalAlign.CENTER;
          label.overflow = Label.Overflow.SHRINK;
          label.enableWrapText = false;
          return label;
        };
        _proto.rawBox = function rawBox(key, x, y, width, height) {
          var _this$panels$key = this.panels[key],
            box = _this$panels$key.box,
            crop = _this$panels$key.crop;
          return {
            x: box.x + (x - crop.x) / crop.width * box.width,
            y: box.y + (y - crop.y) / crop.height * box.height,
            width: width / crop.width * box.width,
            height: height / crop.height * box.height
          };
        };
        _proto.slice = function slice(source, rect) {
          var frame = sliceFrame(source, rect.x, rect.y, rect.width, rect.height);
          this.ownedFrames.push(frame);
          return frame;
        };
        _proto.setArt = function setArt(key, frame) {
          var panelKey = {
            timeUI: 'time',
            scoreUI: 'score',
            workloadUI: 'workload'
          }[key];
          if (!panelKey) return;
          var panel = this.panels[panelKey];
          panel.sprite.spriteFrame = this.slice(frame, panel.crop);
          if (panelKey === 'time' || panelKey === 'score') {
            var time = panelKey === 'time';
            var patch = this.sprite(panelKey + "NumberPatch", time ? this.rawBox('time', 470, 225, 400, 132) : this.rawBox('score', 324, 208, 544, 132));
            patch.spriteFrame = this.slice(frame, time ? new Rect(904, 226, 20, 132) : new Rect(887, 208, 16, 132));
            // Put the patch above the printed digits and below the live text.
            (time ? this.time : this.score).node.setSiblingIndex(this.root.children.length - 1);
          } else {
            this.emptySlot = this.slice(frame, new Rect(512, 185, 219, 195));
            this.filledSlot = this.slice(frame, new Rect(62, 185, 219, 195));
            this.portrait.spriteFrame = this.slice(frame, new Rect(837, 134, 200, 200));
          }
        };
        _proto.update = function update(model, ready, dt) {
          if (dt === void 0) {
            dt = 0;
          }
          this.time.string = formatClock(model.elapsed);
          this.score.string = String(model.score).padStart(6, '0');
          this.clock += dt;
          for (var index = 0; index < this.chargeFlashes.length; index++) {
            this.chargeFlashes[index] = Math.max(0, this.chargeFlashes[index] - dt);
          }
          this.chargeSegments = Math.min(5, Math.max(0, Math.floor(model.energy / 20)));
          this.shieldFraction = Math.min(1, Math.max(0, model.shieldTime / 3));
          var pulse = this.chargeSegments === 5 && model.shieldTime <= 0 ? 1 + Math.sin(this.clock * 5) * 0.025 : 1;
          this.portrait.node.setScale(pulse, pulse);
          for (var _index = 0; _index < this.slots.length; _index += 1) {
            var _ref;
            this.slots[_index].spriteFrame = (_ref = _index < model.workload ? this.filledSlot : this.emptySlot) != null ? _ref : null;
            this.workloadPulses[_index] = _index < model.workload ? Math.max(0, this.workloadPulses[_index] - dt) : 0;
            var pop = 1 + 0.16 * Math.sin(Math.PI * this.workloadPulses[_index] / 0.3);
            this.slots[_index].node.setScale(pop, pop);
          }
          this.drawChargeRing(model);
          this.root.active = ready;
        };
        _proto.avatarPoint = function avatarPoint(height) {
          if (height === void 0) {
            height = DESIGN_HEIGHT;
          }
          return {
            x: this.ringCenter.x + DESIGN_WIDTH / 2,
            y: this.ringCenter.y + height - DESIGN_HEIGHT / 2
          };
        };
        _proto.chargePoint = function chargePoint(index, height) {
          if (height === void 0) {
            height = DESIGN_HEIGHT;
          }
          var center = this.avatarPoint(height);
          var angle = Math.PI / 2 - (Math.min(4, Math.max(0, index)) + 0.5) * Math.PI * 2 / 5;
          var radius = (PORTRAIT_RING.innerRadius + PORTRAIT_RING.outerRadius) / 2;
          return {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius
          };
        };
        _proto.pulseCharge = function pulseCharge(index) {
          if (index >= 0 && index < 5) this.chargeFlashes[index] = 0.3;
        };
        _proto.pulseWorkload = function pulseWorkload(index) {
          if (index >= 0 && index < 3) this.workloadPulses[index] = 0.3;
        };
        _proto.clearFeedback = function clearFeedback() {
          this.chargeFlashes.fill(0);
          this.workloadPulses.fill(0);
        };
        _proto.containsAvatar = function containsAvatar(point, height) {
          if (height === void 0) {
            height = DESIGN_HEIGHT;
          }
          var center = this.avatarPoint(height);
          return Math.hypot(point.x - center.x, point.y - center.y) <= 46;
        };
        _proto.drawChargeRing = function drawChargeRing(model) {
          var g = this.chargeRing;
          var _this$ringCenter = this.ringCenter,
            x = _this$ringCenter.x,
            y = _this$ringCenter.y;
          var outer = PORTRAIT_RING.outerRadius,
            inner = PORTRAIT_RING.innerRadius,
            segments = PORTRAIT_RING.segments;
          var sectorAngle = Math.PI * 2 / segments;
          g.clear();
          // Dark plum dividers and a cream rim match the approved illustrated frame.
          g.fillColor = new Color(86, 54, 78);
          g.circle(x, y, outer + 1.7);
          g.fill();
          g.fillColor = new Color(255, 226, 174);
          g.circle(x, y, outer + 0.2);
          g.fill();
          var sector = function sector(start, end, color, rOuter, rInner) {
            if (rOuter === void 0) {
              rOuter = outer - 1;
            }
            if (rInner === void 0) {
              rInner = inner + 0.8;
            }
            g.fillColor = color;
            var steps = Math.max(2, Math.ceil((end - start) / 0.06));
            g.moveTo(x + Math.cos(start) * rOuter, y + Math.sin(start) * rOuter);
            for (var i = 1; i <= steps; i++) {
              var angle = start + (end - start) * i / steps;
              g.lineTo(x + Math.cos(angle) * rOuter, y + Math.sin(angle) * rOuter);
            }
            for (var _i = steps; _i >= 0; _i--) {
              var _angle = start + (end - start) * _i / steps;
              g.lineTo(x + Math.cos(_angle) * rInner, y + Math.sin(_angle) * rInner);
            }
            g.close();
            g.fill();
          };
          for (var index = 0; index < segments; index++) {
            var end = Math.PI / 2 - index * sectorAngle;
            var start = end - sectorAngle;
            // All five sectors use exactly 72 degrees; progress never changes divider positions.
            sector(start, end, new Color(248, 232, 201));
            var fraction = model.shieldTime > 0 ? Math.max(0, Math.min(1, this.shieldFraction * segments - index)) : index < this.chargeSegments ? 1 : 0;
            if (fraction <= 0) continue;
            var flash = this.chargeFlashes[index] > 0;
            var ending = model.shieldTime > 0 && model.shieldTime < 0.65 && Math.sin(this.clock * 20) < 0;
            var from = end - sectorAngle * fraction;
            sector(from, end, flash ? new Color(167, 239, 128) : ending ? new Color(151, 191, 133) : new Color(78, 193, 92));
            sector(from, end, flash ? new Color(220, 255, 181) : new Color(157, 230, 121), outer - 1, outer - 3.2);
          }
          // Draw separators LAST so charged sectors cannot paint over them.
          g.strokeColor = new Color(86, 54, 78);
          g.lineWidth = 2;
          for (var _index2 = 0; _index2 < segments; _index2++) {
            var angle = Math.PI / 2 - _index2 * sectorAngle;
            g.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
            g.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
            g.stroke();
          }
          g.lineWidth = 1.6;
          g.circle(x, y, outer);
          g.stroke();
          g.fillColor = new Color(86, 54, 78);
          g.circle(x, y, inner);
          g.fill();
          g.fillColor = new Color(255, 235, 201);
          g.circle(x, y, inner - 1);
          g.fill();
          if (this.chargeSegments === segments && model.shieldTime <= 0) {
            g.strokeColor = new Color(163, 255, 132, Math.round(100 + 60 * Math.sin(this.clock * 5)));
            g.lineWidth = 1.8;
            g.circle(x, y, outer + 2.5);
            g.stroke();
          }
        };
        _proto.drawPauseCover = function drawPauseCover(graphics, paused, height) {
          if (height === void 0) {
            height = DESIGN_HEIGHT;
          }
          if (!paused) return;
          var point = referencePoint(67, 309);
          point.y += (height - DESIGN_HEIGHT) / 2;
          graphics.fillColor = new Color(250, 231, 195);
          graphics.circle(point.x - DESIGN_WIDTH / 2, point.y - DESIGN_HEIGHT / 2, 24);
          graphics.fill();
          var x = point.x - DESIGN_WIDTH / 2;
          var y = point.y - DESIGN_HEIGHT / 2;
          graphics.fillColor = new Color(91, 53, 89);
          graphics.moveTo(x - 7, y - 12);
          graphics.lineTo(x + 12, y);
          graphics.lineTo(x - 7, y + 12);
          graphics.close();
          graphics.fill();
        };
        _proto.destroy = function destroy() {
          for (var _iterator = _createForOfIteratorHelperLoose(this.ownedFrames), _step; !(_step = _iterator()).done;) {
            var frame = _step.value;
            frame.destroy();
          }
        };
        return FinalArtHud;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameExperience.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameModel.ts'], function (exports) {
  var _createClass, _createForOfIteratorHelperLoose, _extends, cclegacy, rankFor;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      rankFor = module.rankFor;
    }],
    execute: function () {
      exports({
        readProgress: readProgress,
        settleRun: settleRun
      });
      cclegacy._RF.push({}, "6273bHXMo5F2qlvh7mL8jNh", "GameExperience", undefined);
      var PROGRESS_KEY = exports('PROGRESS_KEY', 'off-work.progress.v1');
      var TUTORIAL_REVISION = exports('TUTORIAL_REVISION', 2);
      var TUTORIAL_COPY = exports('TUTORIAL_COPY', {
        completeTitle: '好耶，摸鱼入门啦！',
        completeSubtitle: '工作任务来了？快溜快溜！',
        completeBody: '小鱼记得捡，攒个护盾，\n关键时刻顶一下～',
        start: '开始摸鱼！'
      });
      /** Resume only on visible frames; ignore long background gaps. Gameplay stays paused until completion. */
      var ResumeCountdown = exports('ResumeCountdown', /*#__PURE__*/function () {
        function ResumeCountdown() {
          this.remaining = 0;
        }
        var _proto = ResumeCountdown.prototype;
        _proto.start = function start() {
          this.remaining = 3;
        };
        _proto.cancel = function cancel() {
          this.remaining = 0;
        };
        _proto.advance = function advance(dt, visible) {
          if (visible === void 0) {
            visible = true;
          }
          if (!this.active || !visible || !Number.isFinite(dt) || dt <= 0) return false;
          this.remaining = Math.max(0, this.remaining - Math.min(dt, 0.1));
          return !this.active;
        };
        _createClass(ResumeCountdown, [{
          key: "active",
          get: function get() {
            return this.remaining > 0;
          }
        }]);
        return ResumeCountdown;
      }());
      var freshProgress = exports('freshProgress', function freshProgress() {
        return {
          version: 1,
          tutorialCompleted: false,
          tutorialRevision: 0,
          shieldHintSeen: false,
          soundEnabled: true,
          bestScore: 0,
          bestSeconds: 0,
          bestWave: 0,
          runs: 0
        };
      });
      function readProgress(raw) {
        var clean = freshProgress();
        try {
          var value = JSON.parse(raw != null ? raw : 'null');
          if (!value || value.version !== 1) return clean;
          for (var _iterator = _createForOfIteratorHelperLoose(['bestScore', 'bestSeconds', 'bestWave', 'runs']), _step; !(_step = _iterator()).done;) {
            var key = _step.value;
            if (typeof value[key] === 'number' && Number.isFinite(value[key]) && value[key] >= 0) clean[key] = value[key];
          }
          clean.tutorialCompleted = value.tutorialCompleted === true;
          clean.tutorialRevision = clean.tutorialCompleted && Number.isInteger(value.tutorialRevision) ? Math.max(0, Math.min(TUTORIAL_REVISION, value.tutorialRevision)) : 0;
          clean.shieldHintSeen = value.shieldHintSeen === true;
          clean.soundEnabled = value.soundEnabled !== false;
        } catch (_unused) {/* Broken or unavailable storage must never block play. */}
        return clean;
      }
      var TutorialGuide = exports('TutorialGuide', /*#__PURE__*/function () {
        function TutorialGuide() {
          this.step = 'off';
          this.fish = 0;
          this.moveSeconds = 0;
          this.horizontal = 0;
          this.vertical = 0;
          this.rewardRemaining = 0;
        }
        var _proto2 = TutorialGuide.prototype;
        _proto2.start = function start(enabled) {
          this.step = enabled ? 'move' : 'off';
          this.fish = 0;
          this.moveSeconds = this.horizontal = this.vertical = this.rewardRemaining = 0;
        };
        _proto2.moved = function moved(dx, dy, seconds) {
          if (this.step !== 'move' || ![dx, dy, seconds].every(Number.isFinite) || seconds <= 0 || Math.hypot(dx, dy) < 0.1) return false;
          this.moveSeconds = Math.min(2, this.moveSeconds + Math.min(seconds, 0.1));
          this.horizontal += Math.abs(dx);
          this.vertical += Math.abs(dy);
          if (this.moveSeconds < 2 - 1e-6 || this.horizontal < 20 || this.vertical < 20) return false;
          this.step = 'move-reward';
          this.rewardRemaining = 0.7;
          return true;
        };
        _proto2.advance = function advance(seconds) {
          if (!this.rewarding || !Number.isFinite(seconds) || seconds <= 0) return null;
          this.rewardRemaining = Math.max(0, this.rewardRemaining - Math.min(seconds, 0.1));
          if (this.rewardRemaining > 1e-6) return null;
          this.rewardRemaining = 0;
          this.step = this.step === 'move-reward' ? 'collect' : 'ready';
          return this.step;
        };
        _proto2.picked = function picked(energy) {
          if (this.step !== 'collect' || energy <= 0) return false;
          this.fish = 1;
          this.step = 'collect-reward';
          this.rewardRemaining = 0.85;
          return true;
        };
        _proto2.skip = function skip() {
          this.step = 'off';
        };
        _createClass(TutorialGuide, [{
          key: "active",
          get: function get() {
            return this.step !== 'off';
          }
        }, {
          key: "ready",
          get: function get() {
            return this.step === 'ready';
          }
        }, {
          key: "rewarding",
          get: function get() {
            return this.step === 'move-reward' || this.step === 'collect-reward';
          }
        }, {
          key: "rewardDuration",
          get: function get() {
            return this.step === 'move-reward' ? 0.7 : 0.85;
          }
        }, {
          key: "rewardProgress",
          get: function get() {
            return this.rewarding ? 1 - this.rewardRemaining / this.rewardDuration : 0;
          }
        }, {
          key: "moveProgress",
          get: function get() {
            return Math.min(1, this.moveSeconds / 2);
          }
        }, {
          key: "title",
          get: function get() {
            if (this.step === 'move') return '先活动一下猫爪！';
            if (this.step === 'move-reward') return 'Good！移动学会啦！';
            if (this.step === 'collect') return '来，捡条小鱼！';
            if (this.step === 'collect-reward') return '太棒啦！小鱼到手！';
            return '';
          }
        }, {
          key: "text",
          get: function get() {
            if (this.step === 'move') return '拖动屏幕，让猫猫上下左右动起来';
            if (this.step === 'move-reward') return '接下来，捡条小鱼试试～';
            if (this.step === 'collect') return '靠近绿色小鱼，获得一格护盾蓄力';
            if (this.step === 'collect-reward') return '摸鱼技能 +1！马上就能开摸啦';
            return '';
          }
        }]);
        return TutorialGuide;
      }());

      /** A brief, non-blocking reminder on the first full charge, separate from the one-fish tutorial. */
      var ShieldCoach = exports('ShieldCoach', /*#__PURE__*/function () {
        function ShieldCoach() {
          this.seen = false;
          this.remaining = 0;
        }
        var _proto3 = ShieldCoach.prototype;
        _proto3.reset = function reset(seen) {
          this.seen = seen;
          this.remaining = 0;
        };
        _proto3.charged = function charged(energy) {
          if (this.seen || energy < 100) return false;
          this.seen = true;
          this.remaining = 6;
          return true;
        };
        _proto3.released = function released() {
          this.remaining = 0;
        };
        _proto3.advance = function advance(dt) {
          if (Number.isFinite(dt) && dt > 0) this.remaining = Math.max(0, this.remaining - dt);
        };
        _createClass(ShieldCoach, [{
          key: "active",
          get: function get() {
            return this.remaining > 0;
          }
        }]);
        return ShieldCoach;
      }());
      function settleRun(previous, stats, shieldsUsed, energy) {
        var _stats$bestGrade;
        var profile = _extends({}, previous, {
          bestScore: Math.max(previous.bestScore, stats.score),
          bestSeconds: Math.max(previous.bestSeconds, stats.elapsed),
          bestWave: Math.max(previous.bestWave, stats.wave),
          runs: previous.runs + 1
        });
        var goal;
        if (!shieldsUsed) goal = energy >= 100 ? '下一局：蓄满后双击屏幕，及时放出护盾' : '下一局：收集五条鱼，试着释放一次护盾';else if (stats.elapsed < 15) goal = "\u4E0B\u4E00\u5C40\uFF1A\u518D\u575A\u6301 " + Math.max(1, Math.ceil(15 - stats.elapsed)) + " \u79D2\uFF0C\u8FDB\u5165\u7B2C 2 \u6CE2";else if (stats.elapsed < 50) goal = "\u4E0B\u4E00\u5C40\uFF1A\u518D\u575A\u6301 " + Math.max(1, Math.ceil(50 - stats.elapsed)) + " \u79D2\uFF0C\u8FDB\u5165\u7B2C 3 \u6CE2";else goal = "\u4E0B\u4E00\u5C40\uFF1A\u6311\u6218 " + Math.ceil((profile.bestScore + Math.max(100, profile.bestScore * 0.1)) / 100) * 100 + " \u5206";
        var result = {
          score: stats.score,
          rank: rankFor(stats.wave, stats.score, (_stats$bestGrade = stats.bestGrade) != null ? _stats$bestGrade : null),
          newRecord: stats.score > previous.bestScore,
          firstRun: previous.runs === 0,
          bestScore: profile.bestScore,
          previousBest: previous.bestScore,
          seconds: stats.elapsed,
          wave: stats.wave,
          maxCombo: stats.maxCombo,
          gaps: stats.gapClears,
          breaks: stats.breakLocks,
          goal: goal
        };
        return {
          profile: profile,
          result: result
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameInterface.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameLayout.ts', './GameExperience.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, Color, Node, UITransform, Graphics, Label, Sprite, DESIGN_WIDTH, HUD_SAFE_HEIGHT, formatClock, TUTORIAL_COPY;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      Node = module.Node;
      UITransform = module.UITransform;
      Graphics = module.Graphics;
      Label = module.Label;
      Sprite = module.Sprite;
    }, function (module) {
      DESIGN_WIDTH = module.DESIGN_WIDTH;
      HUD_SAFE_HEIGHT = module.HUD_SAFE_HEIGHT;
      formatClock = module.formatClock;
    }, function (module) {
      TUTORIAL_COPY = module.TUTORIAL_COPY;
    }],
    execute: function () {
      cclegacy._RF.push({}, "24197RQHMZCyKLFOojDAew3", "GameInterface", undefined);
      var INK = new Color(77, 48, 77);
      var CREAM = new Color(255, 243, 219);

      /** Runtime UI uses the same cream, plum and green palette as the approved artwork. */
      var GameInterface = exports('GameInterface', /*#__PURE__*/function () {
        function GameInterface(parent) {
          this.root = void 0;
          this.modal = void 0;
          this.guideRoot = void 0;
          this.resumeRoot = void 0;
          this.countdown = void 0;
          this.primary = void 0;
          this.secondary = void 0;
          this.sound = void 0;
          this.guideText = void 0;
          this.guideTitle = void 0;
          this.score = void 0;
          this.title = void 0;
          this.subtitle = void 0;
          this.record = void 0;
          this.rank = void 0;
          this.detail = void 0;
          this.goal = void 0;
          this.statTitles = [];
          this.statValues = [];
          this.hero = void 0;
          this.board = void 0;
          this.guideBoard = void 0;
          this.focus = void 0;
          this.skip = void 0;
          this.fieldHeight = 1600;
          this.mode = 'hidden';
          this.resultClock = 0;
          this.previousMode = 'hidden';
          this.buttons = {
            primary: {
              x: 0,
              y: -212,
              width: 480,
              height: 60
            },
            secondary: {
              x: 0,
              y: -269,
              width: 270,
              height: 40
            },
            sound: {
              x: 247,
              y: 255,
              width: 72,
              height: 38
            }
          };
          this.root = new Node('ExperienceInterface');
          parent.addChild(this.root);
          this.modal = new Node('MenuCard');
          this.root.addChild(this.modal);
          this.board = this.graphics('MenuPaper', this.modal);
          this.title = this.label('MenuTitle', this.modal, 30, 0, 249, 430, 44);
          this.subtitle = this.label('MenuSubtitle', this.modal, 19, 0, 210, 510, 32);
          this.rank = this.label('RunRank', this.modal, 24, 0, 166, 480, 40);
          this.score = this.label('RunScore', this.modal, 62, 0, 99, 510, 80);
          this.score.isBold = true;
          this.record = this.label('PersonalRecord', this.modal, 18, 0, 44, 510, 36);
          for (var index = 0; index < 3; index++) {
            this.statTitles.push(this.label("StatTitle" + index, this.modal, 15, (index - 1) * 176, -3, 165, 26));
            this.statValues.push(this.label("StatValue" + index, this.modal, 25, (index - 1) * 176, -34, 165, 34));
          }
          this.detail = this.label('RunSkills', this.modal, 18, 0, -82, 510, 30);
          this.goal = this.label('NextRunGoal', this.modal, 19, 0, -137, 510, 58);
          this.goal.enableWrapText = true;
          var hero = new Node('MenuCat');
          hero.addComponent(UITransform).setContentSize(170, 170);
          hero.setPosition(0, 35);
          this.modal.addChild(hero);
          this.hero = hero.addComponent(Sprite);
          this.hero.sizeMode = Sprite.SizeMode.CUSTOM;
          this.primary = this.label('PrimaryAction', this.modal, 26, 0, -212, 450, 58);
          this.primary.isBold = true;
          this.secondary = this.label('SecondaryAction', this.modal, 19, 0, -269, 260, 38);
          this.sound = this.label('SoundToggle', this.modal, 14, 247, 255, 72, 38);
          this.focus = this.graphics('TutorialFocus', this.root);
          this.guideRoot = new Node('StepGuide');
          this.root.addChild(this.guideRoot);
          this.guideBoard = this.graphics('GuidePaper', this.guideRoot);
          this.guideTitle = this.label('GuideTitle', this.guideRoot, 16, -27, 29, 510, 28);
          this.guideText = this.label('GuideText', this.guideRoot, 21, 0, -12, 575, 44);
          this.skip = this.label('SkipGuide', this.guideRoot, 15, 266, 29, 65, 28);
          this.skip.string = '跳过';
          this.skip.color = new Color(66, 119, 77);
          this.resumeRoot = new Node('ResumeCountdown');
          this.root.addChild(this.resumeRoot);
          var paper = this.graphics('CountdownPaper', this.resumeRoot);
          paper.fillColor = new Color(255, 243, 219, 250);
          paper.strokeColor = INK;
          paper.lineWidth = 3;
          paper.roundRect(-120, -110, 240, 220, 28);
          paper.fill();
          paper.stroke();
          this.countdown = this.label('CountdownNumber', this.resumeRoot, 92, 0, 20, 200, 120);
          this.countdown.isBold = true;
          this.countdown.color = new Color(64, 136, 80);
          var caption = this.label('CountdownCaption', this.resumeRoot, 21, 0, -67, 220, 35);
          caption.string = '准备继续摸鱼';
          this.resumeRoot.active = false;
        }
        var _proto = GameInterface.prototype;
        _proto.graphics = function graphics(name, parent) {
          var node = new Node(name);
          node.addComponent(UITransform).setContentSize(DESIGN_WIDTH, 1600);
          parent.addChild(node);
          return node.addComponent(Graphics);
        };
        _proto.label = function label(name, parent, size, x, y, width, height) {
          var node = new Node(name);
          node.setPosition(x, y);
          node.addComponent(UITransform).setContentSize(width, height);
          parent.addChild(node);
          var label = node.addComponent(Label);
          label.fontSize = size;
          label.lineHeight = size + 5;
          label.color = INK.clone();
          label.horizontalAlign = Label.HorizontalAlign.CENTER;
          label.verticalAlign = Label.VerticalAlign.CENTER;
          label.enableWrapText = false;
          label.overflow = Label.Overflow.SHRINK;
          return label;
        };
        _proto.setHero = function setHero(frame) {
          this.hero.spriteFrame = frame;
        };
        _proto.resize = function resize(height) {
          this.fieldHeight = height;
          this.modal.setPosition(0, -HUD_SAFE_HEIGHT / 2);
          this.resumeRoot.setPosition(0, -HUD_SAFE_HEIGHT / 2);
          this.guideRoot.setPosition(0, -height / 2 + 122);
        };
        _proto.update = function update(mode, profile, result, elapsed, dt) {
          this.mode = mode;
          if (mode !== this.previousMode) this.resultClock = 0;
          this.previousMode = mode;
          this.resultClock += dt;
          this.resumeRoot.active = mode === 'resuming';
          this.modal.active = mode === 'home' || mode === 'paused' || mode === 'result' || mode === 'tutorial-ready';
          if (!this.modal.active) return;
          var isResult = mode === 'result';
          var isReady = mode === 'tutorial-ready';
          for (var _i = 0, _arr = [this.rank, this.score, this.detail, this.goal].concat(this.statTitles, this.statValues); _i < _arr.length; _i++) {
            var label = _arr[_i];
            label.node.active = isResult;
          }
          this.hero.node.active = !isResult;
          this.title.fontSize = isResult ? 30 : isReady ? 34 : 44;
          this.title.string = isResult ? '摸鱼成绩单' : isReady ? TUTORIAL_COPY.completeTitle : mode === 'paused' ? '歇一会儿' : '摸了个鱼';
          this.title.node.setPosition(0, isResult ? 249 : 171);
          this.subtitle.string = isResult ? '工作堆满，回去开工' : isReady ? TUTORIAL_COPY.completeSubtitle : mode === 'paused' ? '摸鱼已暂停，准备好了就继续' : '躲开工作，享受片刻摸鱼';
          this.subtitle.node.setPosition(0, isResult ? 210 : 115);
          this.sound.string = profile.soundEnabled ? '音效 开' : '音效 关';
          var buttonY = isResult ? -212 : isReady ? -155 : -118;
          this.buttons.primary.y = buttonY;
          this.buttons.secondary.y = isResult ? -269 : -179;
          this.buttons.sound.y = isResult ? 255 : 217;
          this.primary.node.setPosition(0, buttonY);
          this.secondary.node.setPosition(0, this.buttons.secondary.y);
          this.sound.node.setPosition(247, this.buttons.sound.y);
          this.primary.string = isResult ? '再来一局' : isReady ? TUTORIAL_COPY.start : mode === 'paused' ? '继续摸鱼' : '开始摸鱼';
          this.secondary.node.active = !isReady;
          this.secondary.string = mode === 'home' ? '操作教学' : '返回首页';
          this.record.node.setPosition(0, isResult ? 44 : isReady ? -58 : -45);
          this.record.node.getComponent(UITransform).setContentSize(510, isReady ? 62 : 36);
          this.record.enableWrapText = isReady;
          this.record.color = new Color(63, 116, 71);
          if (isResult && result) {
            this.rank.string = result.rank;
            var progress = Math.min(1, this.resultClock / 0.5);
            this.score.string = String(Math.round(result.score * (1 - Math.pow(1 - progress, 3)))).padStart(6, '0');
            this.record.string = result.firstRun ? "\u9996\u5C40\u7EAA\u5F55 \xB7 " + result.bestScore + " \u5206" : result.newRecord ? "\u65B0\u7EAA\u5F55\uFF01\u6BD4\u4E0A\u6B21\u591A " + (result.score - result.previousBest) + " \u5206" : "\u4E2A\u4EBA\u6700\u4F73 " + result.bestScore + " \u5206 \xB7 \u8FD8\u5DEE " + (result.bestScore - result.score + 1) + " \u5206\u8D85\u8D8A";
            var titles = ['摸鱼时长', '抵达波次', '最高连击'];
            var values = [formatClock(result.seconds), "\u7B2C " + result.wave + " \u6CE2", result.maxCombo + " \u6B21"];
            this.statTitles.forEach(function (label, index) {
              return label.string = titles[index];
            });
            this.statValues.forEach(function (label, index) {
              return label.string = values[index];
            });
            this.detail.string = "\u7A7F\u7F1D " + result.gaps + " \u6B21  \xB7  \u7529\u8131 " + result.breaks + " \u6B21";
            this.goal.string = result.goal;
          } else this.record.string = isReady ? TUTORIAL_COPY.completeBody : mode === 'paused' ? "\u5DF2\u6478\u9C7C " + formatClock(elapsed) : profile.runs > 0 ? "\u4E2A\u4EBA\u6700\u4F73 " + profile.bestScore + " \u5206 \xB7 \u6700\u4E45 " + formatClock(profile.bestSeconds) : '拖动躲避 · 集鱼开盾';
          this.drawBoard(isResult);
        };
        _proto.updateCountdown = function updateCountdown(remaining) {
          this.countdown.string = String(Math.max(1, Math.ceil(remaining)));
        };
        _proto.drawBoard = function drawBoard(result) {
          var g = this.board;
          g.clear();
          var bottom = result ? -305 : -245,
            height = result ? 610 : 490;
          g.fillColor = new Color(55, 39, 65, 60);
          g.roundRect(-298, bottom - 7, 608, height, 24);
          g.fill();
          g.fillColor = CREAM;
          g.strokeColor = INK;
          g.lineWidth = 3;
          g.roundRect(-304, bottom, 608, height, 24);
          g.fill();
          g.stroke();
          if (result) {
            g.fillColor = new Color(245, 226, 193);
            g.roundRect(-260, 147, 520, 39, 12);
            g.fill();
            for (var i = 0; i < 3; i++) {
              g.fillColor = new Color(248, 233, 207);
              g.roundRect((i - 1) * 176 - 82, -56, 164, 72, 12);
              g.fill();
            }
            g.fillColor = new Color(233, 242, 212);
            g.roundRect(-270, -166, 540, 59, 12);
            g.fill();
          }
          var button = this.buttons.primary;
          g.fillColor = new Color(117, 196, 109);
          g.strokeColor = new Color(59, 111, 64);
          g.lineWidth = 2;
          g.roundRect(-button.width / 2, button.y - button.height / 2, button.width, button.height, 15);
          g.fill();
          g.stroke();
          g.fillColor = new Color(243, 228, 202);
          var sound = this.buttons.sound;
          g.roundRect(sound.x - 36, sound.y - 19, 72, 38, 10);
          g.fill();
        };
        _proto.updateGuide = function updateGuide(guide, showShieldHint, focus, clock) {
          this.guideRoot.active = this.mode === 'hidden' && (guide.active || showShieldHint);
          this.focus.clear();
          if (!this.guideRoot.active) return;
          this.guideTitle.string = showShieldHint ? '护盾已蓄满' : guide.title;
          this.guideText.string = showShieldHint ? '双击屏幕开启护盾，保护自己 3 秒' : guide.text;
          this.skip.node.active = guide.step === 'move' || guide.step === 'collect';
          var g = this.guideBoard;
          g.clear();
          g.fillColor = new Color(255, 246, 222, 244);
          g.strokeColor = INK;
          g.lineWidth = 2;
          g.roundRect(-310, -51, 620, 102, 15);
          g.fill();
          g.stroke();
          if (guide.step === 'move') {
            g.fillColor = new Color(219, 225, 199);
            g.roundRect(-230, -39, 460, 5, 2);
            g.fill();
            if (guide.moveProgress > 0) {
              g.fillColor = new Color(105, 190, 101);
              g.roundRect(-230, -39, 460 * guide.moveProgress, 5, 2);
              g.fill();
            }
          }
          if (focus) {
            var f = this.focus,
              x = focus.x - DESIGN_WIDTH / 2,
              y = focus.y - this.fieldHeight / 2;
            var moving = guide.step === 'move';
            var radius = (moving ? 83 : 48) + Math.sin(clock * 4) * 4;
            f.strokeColor = new Color(213, 255, 150, 225);
            f.lineWidth = 3;
            f.circle(x, y, radius);
            f.stroke();
            if (moving) {
              for (var i = 0; i < 4; i++) {
                var a = i * Math.PI / 2,
                  dx = Math.cos(a),
                  dy = Math.sin(a),
                  r = 92 + Math.sin(clock * 4) * 4;
                f.moveTo(x + dx * (r - 17), y + dy * (r - 17));
                f.lineTo(x + dx * r, y + dy * r);
                f.moveTo(x + dx * (r - 9) - dy * 7, y + dy * (r - 9) + dx * 7);
                f.lineTo(x + dx * r, y + dy * r);
                f.lineTo(x + dx * (r - 9) + dy * 7, y + dy * (r - 9) - dx * 7);
                f.stroke();
              }
              var hx = x + Math.sin(clock * 2) * 38,
                hy = y - 65 + Math.cos(clock * 2) * 28;
              f.fillColor = new Color(255, 246, 220, 240);
              f.strokeColor = INK;
              f.lineWidth = 2;
              f.moveTo(hx - 7, hy);
              f.lineTo(hx - 7, hy + 23);
              f.bezierCurveTo(hx - 7, hy + 33, hx + 7, hy + 33, hx + 7, hy + 23);
              f.lineTo(hx + 7, hy + 4);
              f.lineTo(hx + 18, hy);
              f.lineTo(hx + 23, hy - 20);
              f.lineTo(hx + 17, hy - 32);
              f.lineTo(hx - 6, hy - 32);
              f.lineTo(hx - 22, hy - 9);
              f.bezierCurveTo(hx - 27, hy + 1, hx - 17, hy + 7, hx - 7, hy);
              f.close();
              f.fill();
              f.stroke();
            } else if (guide.rewarding) {
              for (var _i2 = 0; _i2 < 6; _i2++) {
                var _a = _i2 * Math.PI / 3 + guide.rewardProgress * 0.4,
                  _r = 60 + guide.rewardProgress * 46;
                var sx = x + Math.cos(_a) * _r,
                  sy = y + Math.sin(_a) * _r;
                f.fillColor = new Color(204, 255, 140, Math.round(255 * (1 - guide.rewardProgress * 0.7)));
                for (var point = 0; point < 10; point++) {
                  var p = _a + point * Math.PI / 5,
                    rr = point % 2 === 0 ? 10 : 4;
                  if (point === 0) f.moveTo(sx + Math.cos(p) * rr, sy + Math.sin(p) * rr);else f.lineTo(sx + Math.cos(p) * rr, sy + Math.sin(p) * rr);
                }
                f.close();
                f.fill();
              }
            }
          }
        };
        _proto.actionAt = function actionAt(point) {
          var x = point.x - DESIGN_WIDTH / 2,
            y = point.y - this.fieldHeight / 2;
          if (this.guideRoot.active && this.skip.node.active && Math.abs(x - 266) <= 39 && Math.abs(y - this.guideRoot.position.y - 29) <= 22) return 'skip';
          if (!this.modal.active) return null;
          var localY = y - this.modal.position.y;
          for (var _iterator = _createForOfIteratorHelperLoose(['sound', 'primary', 'secondary']), _step; !(_step = _iterator()).done;) {
            var name = _step.value;
            if (name === 'secondary' && !this.secondary.node.active) continue;
            var box = this.buttons[name];
            if (Math.abs(x - box.x) <= box.width / 2 && Math.abs(localY - box.y) <= box.height / 2) return name;
          }
          return null;
        };
        return GameInterface;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameLayout.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        containsReferencePoint: containsReferencePoint,
        referencePoint: referencePoint,
        viewportLayout: viewportLayout
      });
      cclegacy._RF.push({}, "b70bdNP1jVIyLBCCfo+QQXR", "GameLayout", undefined);
      /** Reference coordinates use the approved 1080 × 2400 composition, with Y measured from the top. */
      var REFERENCE_WIDTH = exports('REFERENCE_WIDTH', 1080);
      var REFERENCE_HEIGHT = exports('REFERENCE_HEIGHT', 2400);
      var DESIGN_WIDTH = exports('DESIGN_WIDTH', 720);
      var DESIGN_HEIGHT = exports('DESIGN_HEIGHT', 1600);
      var ART_SCALE = exports('ART_SCALE', DESIGN_WIDTH / REFERENCE_WIDTH);
      var HUD_SAFE_HEIGHT = exports('HUD_SAFE_HEIGHT', 280);
      /** Keep incoming top-edge artwork and its soft shadow entirely outside the viewport. */
      var TOP_SPAWN_MARGIN = exports('TOP_SPAWN_MARGIN', 48);
      var PLAYER_START_Y = exports('PLAYER_START_Y', DESIGN_HEIGHT - 1860 * ART_SCALE);
      var FOLDER_SPACING = exports('FOLDER_SPACING', 64);
      var FOLDER_RADIUS = exports('FOLDER_RADIUS', 28);
      var HUD_LAYOUT = exports('HUD_LAYOUT', {
        time: {
          x: 6,
          y: 240,
          width: 290,
          height: 127
        },
        score: {
          x: 424,
          y: 248,
          width: 232,
          height: 115
        },
        workload: {
          x: 748,
          y: 242,
          width: 327,
          height: 124
        }
      });
      var SPRITE_SIZES = exports('SPRITE_SIZES', {
        message: {
          width: 42,
          height: 40
        },
        requirement: {
          width: 43,
          height: 44
        },
        folder: {
          width: FOLDER_SPACING,
          height: 52
        },
        fish: {
          width: 48,
          height: 25
        },
        // The uniform atlas cell includes transparent padding around the cat.
        player: {
          width: 144,
          height: 144
        }
      });

      /** Stable head/torso capsule in the 144px atlas cell; excludes tail, ears and padding. */
      var PLAYER_BODY = exports('PLAYER_BODY', {
        offsetX: -8,
        bottom: -24,
        top: 18,
        radius: 24
      });
      // Approved 50-frame atlas: highest visible ear is 50.06px above the sprite centre.
      var PLAYER_VISUAL_TOP = exports('PLAYER_VISUAL_TOP', 51);
      var HUD_BOTTOM = exports('HUD_BOTTOM', Math.max.apply(Math, Object.values(HUD_LAYOUT).map(function (box) {
        return (box.y + box.height) * ART_SCALE;
      })));
      var PLAYER_HUD_GAP = exports('PLAYER_HUD_GAP', 10);
      var playerMovementTop = exports('playerMovementTop', function playerMovementTop(height, radius) {
        if (radius === void 0) {
          radius = PLAYER_BODY.radius;
        }
        return height - HUD_BOTTOM - PLAYER_HUD_GAP - Math.max(PLAYER_VISUAL_TOP, PLAYER_BODY.top + radius);
      });
      var playerDragTop = exports('playerDragTop', function playerDragTop(height) {
        return height - HUD_BOTTOM - PLAYER_HUD_GAP;
      });
      var PORTRAIT_RING = exports('PORTRAIT_RING', {
        segments: 5,
        outerRadius: 37,
        innerRadius: 25,
        avatarDiameter: 48
      });
      function referencePoint(x, top) {
        return {
          x: x * ART_SCALE,
          y: DESIGN_HEIGHT - top * ART_SCALE
        };
      }
      function containsReferencePoint(point, box, height) {
        if (height === void 0) {
          height = DESIGN_HEIGHT;
        }
        var top = (height - point.y) / ART_SCALE;
        var x = point.x / ART_SCALE;
        return x >= box.x && x <= box.x + box.width && top >= box.y && top <= box.y + box.height;
      }

      /** Fixed-width playfield; cover the viewport without changing the artwork's aspect. */
      function viewportLayout(width, height) {
        var fieldHeight = DESIGN_WIDTH * height / Math.max(1, width);
        var cover = Math.max(1, fieldHeight / DESIGN_HEIGHT);
        return {
          fieldHeight: fieldHeight,
          backgroundWidth: DESIGN_WIDTH * cover,
          backgroundHeight: DESIGN_HEIGHT * cover
        };
      }
      var PAUSE_HIT_BOX = exports('PAUSE_HIT_BOX', {
        x: 6,
        y: 258,
        width: 112,
        height: 109
      });
      var formatClock = exports('formatClock', function formatClock(seconds) {
        var total = Math.max(0, Math.floor(seconds));
        return String(Math.floor(total / 60)).padStart(2, '0') + ":" + String(total % 60).padStart(2, '0');
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameMain.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameModel.ts', './FinalArtHud.ts', './GameLayout.ts', './GameExperience.ts', './PlatformServices.ts', './GameInterface.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, _extends, _createClass, cclegacy, _decorator, Color, profiler, view, ResolutionPolicy, Canvas, UITransform, Node, Graphics, Mask, Vec3, Label, input, Input, game, Game, Sprite, assetManager, KeyCode, SpriteFrame, Component, PHASE_LABELS, GameModel, GestureRecognizer, FinalArtHud, sliceFrame, DESIGN_HEIGHT, SPRITE_SIZES, viewportLayout, playerMovementTop, containsReferencePoint, PAUSE_HIT_BOX, playerDragTop, HUD_SAFE_HEIGHT, DESIGN_WIDTH, TUTORIAL_REVISION, ResumeCountdown, TutorialGuide, ShieldCoach, GameAudio, ProgressStore, GameInterface;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Color = module.Color;
      profiler = module.profiler;
      view = module.view;
      ResolutionPolicy = module.ResolutionPolicy;
      Canvas = module.Canvas;
      UITransform = module.UITransform;
      Node = module.Node;
      Graphics = module.Graphics;
      Mask = module.Mask;
      Vec3 = module.Vec3;
      Label = module.Label;
      input = module.input;
      Input = module.Input;
      game = module.game;
      Game = module.Game;
      Sprite = module.Sprite;
      assetManager = module.assetManager;
      KeyCode = module.KeyCode;
      SpriteFrame = module.SpriteFrame;
      Component = module.Component;
    }, function (module) {
      PHASE_LABELS = module.PHASE_LABELS;
      GameModel = module.GameModel;
      GestureRecognizer = module.GestureRecognizer;
    }, function (module) {
      FinalArtHud = module.FinalArtHud;
      sliceFrame = module.sliceFrame;
    }, function (module) {
      DESIGN_HEIGHT = module.DESIGN_HEIGHT;
      SPRITE_SIZES = module.SPRITE_SIZES;
      viewportLayout = module.viewportLayout;
      playerMovementTop = module.playerMovementTop;
      containsReferencePoint = module.containsReferencePoint;
      PAUSE_HIT_BOX = module.PAUSE_HIT_BOX;
      playerDragTop = module.playerDragTop;
      HUD_SAFE_HEIGHT = module.HUD_SAFE_HEIGHT;
      DESIGN_WIDTH = module.DESIGN_WIDTH;
    }, function (module) {
      TUTORIAL_REVISION = module.TUTORIAL_REVISION;
      ResumeCountdown = module.ResumeCountdown;
      TutorialGuide = module.TutorialGuide;
      ShieldCoach = module.ShieldCoach;
    }, function (module) {
      GameAudio = module.GameAudio;
      ProgressStore = module.ProgressStore;
    }, function (module) {
      GameInterface = module.GameInterface;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "9dad5MWX8ZA3KB5PeLm0Fgj", "GameMain", undefined);
      var ccclass = _decorator.ccclass;
      var W = DESIGN_WIDTH;
      var WAVE_NOTICE_TOP = 120;
      var FLOATER_SLOTS = 6;
      var ART_PATHS = {
        background: 'background/office-night/spriteFrame',
        message: 'bullets/message/spriteFrame',
        folder: 'bullets/folder/spriteFrame',
        requirement: 'bullets/request-sheet/spriteFrame',
        fish: 'pickups/fish/spriteFrame',
        timeUI: 'hud/time/spriteFrame',
        scoreUI: 'hud/score/spriteFrame',
        workloadUI: 'hud/workload/spriteFrame',
        idleSheet: 'character/approved-idle-sheet/spriteFrame'
      };
      var IDLE_FRAMES = 50;
      var ART_FRAME_COUNT = Object.keys(ART_PATHS).length + IDLE_FRAMES;
      // Ignore the supplied PNGs' faint stray pixels outside their visible artwork.
      var ART_CROPS = {
        message: [212, 230, 875, 819],
        folder: [86, 202, 1080, 890],
        requirement: [192, 123, 964, 976],
        fish: [50, 62, 1556, 820]
      };
      // Pupil regions in the approved PNGs, before ART_CROPS. Repaint only the small
      // highlight inside each dark eye; the illustrated eye contours and body stay intact.
      var EYE_ART = {
        message: {
          points: [[494, 659, 23, 34], [760, 659, 23, 34]],
          ink: new Color(62, 14, 52),
          light: new Color(255, 205, 161)
        },
        folder: {
          points: [[483, 731, 25, 36], [796, 731, 25, 36]],
          ink: new Color(82, 11, 78),
          light: new Color(255, 236, 151)
        },
        requirement: {
          points: [[539, 818, 15, 15], [721, 849, 15, 15]],
          ink: new Color(75, 14, 78),
          light: new Color(252, 158, 255)
        }
      };
      var GameMain = exports('GameMain', (_dec = ccclass('GameMain'), _dec(_class = /*#__PURE__*/function (_Component) {
        _inheritsLoose(GameMain, _Component);
        function GameMain() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.fieldHeight = DESIGN_HEIGHT;
          _this.visualDt = 0;
          _this.waveNotice = void 0;
          _this.waveNoticeTime = 0;
          _this.bulletShadows = void 0;
          _this.playerShadow = void 0;
          _this.fishGlow = void 0;
          _this.bulletCues = void 0;
          _this.gapHighlights = void 0;
          _this.pickupLight = void 0;
          _this.pickupFlights = Array.from({
            length: 8
          }, function () {
            return {
              x: 0,
              y: 0,
              segment: 0,
              life: 0
            };
          });
          _this.resume = new ResumeCountdown();
          _this.appVisible = true;
          _this.playerHitTime = 0;
          _this.shieldBlockTime = 0;
          _this.shieldBlockAngle = 0;
          _this.model = new GameModel();
          _this.progress = new ProgressStore();
          _this.guide = new TutorialGuide();
          _this.shieldCoach = new ShieldCoach();
          _this.audio = void 0;
          _this["interface"] = void 0;
          _this.settlement = null;
          _this.shieldsUsed = 0;
          _this.guideFishTimer = 0;
          _this.initialEntryHandled = false;
          _this.dragSampleTime = 0;
          _this.pendingAction = null;
          _this.pendingPoint = null;
          _this.activeTouchId = null;
          _this.avatarTouches = new Map();
          _this.gesture = new GestureRecognizer();
          _this.paintNode = void 0;
          _this.graphics = void 0;
          _this.background = void 0;
          _this.bulletLayer = void 0;
          _this.playerSprite = void 0;
          _this.bulletSprites = [];
          _this.bulletEyes = [];
          _this.eyePhase = new WeakMap();
          _this.eyePhaseCursor = 0;
          _this.fishSprites = [];
          _this.art = new Map();
          _this.atlasFrames = [];
          _this.croppedFrames = [];
          _this.animationClock = 0;
          _this.artReady = false;
          _this.artHud = void 0;
          _this.overlay = void 0;
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
          view.setDesignResolutionSize(W, DESIGN_HEIGHT, ResolutionPolicy.FIXED_WIDTH);
          this.fieldHeight = view.getVisibleSize().height;
          this.model.height = this.fieldHeight;
          this.model.player.y *= this.fieldHeight / DESIGN_HEIGHT;
          var canvas = (_this$getComponent = this.getComponent(Canvas)) != null ? _this$getComponent : this.addComponent(Canvas);
          canvas.alignCanvasWithScreen = true;
          var transform = (_this$getComponent2 = this.getComponent(UITransform)) != null ? _this$getComponent2 : this.addComponent(UITransform);
          transform.setContentSize(W, this.fieldHeight);
          this.background = this.makeArtSprite('ApprovedOfficeBackground', W, this.fieldHeight);
          this.paintNode = new Node('ProgrammaticGraphics');
          this.paintNode.addComponent(UITransform).setContentSize(W, this.fieldHeight);
          this.node.addChild(this.paintNode);
          this.graphics = this.paintNode.addComponent(Graphics);
          this.bulletLayer = new Node('PooledWorkBullets');
          var fieldTransform = this.bulletLayer.addComponent(UITransform);
          // Clip at screen edges, so top arrivals stay visible throughout the office header.
          // HUD_SAFE_HEIGHT only constrains player movement and resource placement.
          fieldTransform.setContentSize(W, this.fieldHeight);
          fieldTransform.setAnchorPoint(0.5, 0.5);
          this.bulletLayer.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
          this.node.addChild(this.bulletLayer);
          this.bulletShadows = this.makeGraphics('BulletShadows', this.bulletLayer);
          this.bulletCues = this.makeGraphics('HomingMessageTrails', this.bulletLayer);
          this.fishGlow = this.makeGraphics('FishPickupGlow', this.bulletLayer);
          this.gapHighlights = this.makeGraphics('FolderGapEdges', this.bulletLayer);
          this.playerShadow = this.makeGraphics('EmployeeShadow', this.node);
          this.playerSprite = this.makeArtSprite('Employee', SPRITE_SIZES.player.width, SPRITE_SIZES.player.height);
          this.playerSprite.node.active = false;
          this.artHud = new FinalArtHud(this.node);
          this.pickupLight = this.makeGraphics('PickupChargeFlights', this.node);
          this.waveNotice = this.makeLabel('WaveNotice', 24, new Vec3(0, this.fieldHeight / 2 - WAVE_NOTICE_TOP), W - 100, 40);
          this.waveNotice.horizontalAlign = Label.HorizontalAlign.CENTER;
          this.waveNotice.enableWrapText = false;
          var overlayNode = new Node('InterfaceOverlay');
          overlayNode.addComponent(UITransform).setContentSize(W, this.fieldHeight);
          this.node.addChild(overlayNode);
          this.overlay = overlayNode.addComponent(Graphics);
          this.centerText = this.makeLabel('CenterText', 25, new Vec3(0, 35), W - 150, 360);
          this.centerText.color = new Color(61, 36, 60);
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
          this["interface"] = new GameInterface(this.node);
          this.audio = new GameAudio(this.node);
          this.audio.enabled = this.progress.profile.soundEnabled;
          this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
          this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
          this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
          this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
          // Creator also converts mouse gestures to touch. Listening to both would
          // handle every press twice and immediately undo the pause toggle.
          input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
          game.on(Game.EVENT_HIDE, this.onGameHide, this);
          game.on(Game.EVENT_SHOW, this.onGameShow, this);
          view.on('canvas-resize', this.resizeViewport, this);
          this.resizeViewport();
          this.loadArt();
          this.draw();
        };
        _proto.onDestroy = function onDestroy() {
          input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
          game.off(Game.EVENT_HIDE, this.onGameHide, this);
          game.off(Game.EVENT_SHOW, this.onGameShow, this);
          view.off('canvas-resize', this.resizeViewport, this);
          this.artHud.destroy();
          this.audio.destroy();
          for (var _iterator = _createForOfIteratorHelperLoose(this.atlasFrames), _step; !(_step = _iterator()).done;) {
            var frame = _step.value;
            frame.destroy();
          }
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.croppedFrames), _step2; !(_step2 = _iterator2()).done;) {
            var _frame = _step2.value;
            _frame.destroy();
          }
        };
        _proto.update = function update(dt) {
          var countingDown = this.resume.active;
          if (this.resume.advance(dt, this.appVisible)) this.model.paused = false;
          if (countingDown || !this.appVisible) dt = 0;
          this.updateGuide(dt);
          if (!countingDown && this.appVisible) this.model.update(dt);
          this.consumeEvents();
          if (this.model.gameOver && !this.settlement) {
            this.settlement = this.progress.settle(this.model.stats(), this.shieldsUsed, this.model.energy);
            this.audio.play('result');
            this.clearInput();
          }
          if (this.model.paused) dt = 0;
          this.visualDt = dt;
          this.waveNoticeTime = Math.max(0, this.waveNoticeTime - dt);
          this.animationClock += dt;
          this.shieldCoach.advance(dt);
          this.hintTime = Math.max(0, this.hintTime - dt);
          this.hitFlash = Math.max(0, this.hitFlash - dt);
          this.shakeTime = Math.max(0, this.shakeTime - dt);
          this.playerHitTime = Math.max(0, this.playerHitTime - dt);
          this.shieldBlockTime = Math.max(0, this.shieldBlockTime - dt);
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.pickupFlights), _step3; !(_step3 = _iterator3()).done;) {
            var flight = _step3.value;
            if (flight.life <= 0) continue;
            flight.life = Math.max(0, flight.life - dt);
            if (flight.life === 0 && this.model.energy >= (flight.segment + 1) * 20) this.artHud.pulseCharge(flight.segment);
          }
          for (var _iterator4 = _createForOfIteratorHelperLoose(this.sparks), _step4; !(_step4 = _iterator4()).done;) {
            var spark = _step4.value;
            spark.life -= dt;
          }
          this.sparks = this.sparks.filter(function (spark) {
            return spark.life > 0;
          });
          for (var _iterator5 = _createForOfIteratorHelperLoose(this.bursts), _step5; !(_step5 = _iterator5()).done;) {
            var burst = _step5.value;
            burst.life -= dt;
          }
          this.bursts = this.bursts.filter(function (burst) {
            return burst.life > 0;
          });
          for (var _iterator6 = _createForOfIteratorHelperLoose(this.floaters), _step6; !(_step6 = _iterator6()).done;) {
            var floater = _step6.value;
            if (floater.life <= 0) {
              floater.node.active = false;
              continue;
            }
            floater.life -= dt;
            var progress = 1 - Math.max(0, floater.life) / floater.maxLife;
            floater.node.setPosition(new Vec3(floater.x - W / 2, floater.y - this.fieldHeight / 2 + 20 + progress * 46, 0));
            floater.label.color = new Color(floater.base.r, floater.base.g, floater.base.b, Math.max(0, Math.floor(255 * (1 - progress))));
            if (floater.life <= 0) floater.node.active = false;
          }
          this.draw();
          this.syncArt();
        };
        _proto.resizeViewport = function resizeViewport() {
          var visible = view.getVisibleSize();
          var layout = viewportLayout(visible.width, visible.height);
          var oldHeight = this.fieldHeight;
          this.fieldHeight = layout.fieldHeight;
          this.model.height = this.fieldHeight;
          this.model.player.y *= this.fieldHeight / oldHeight;
          this.model.player.y = Math.max(90, Math.min(playerMovementTop(this.fieldHeight, this.model.player.radius), this.model.player.y));
          this.node.getComponent(UITransform).setContentSize(W, this.fieldHeight);
          this.background.getComponent(UITransform).setContentSize(layout.backgroundWidth, layout.backgroundHeight);
          // Top alignment preserves the elevator and office header when the bottom is cropped.
          this.background.node.setPosition(0, (this.fieldHeight - layout.backgroundHeight) / 2);
          this.artHud.root.setPosition(0, (this.fieldHeight - DESIGN_HEIGHT) / 2);
          var field = this.bulletLayer.getComponent(UITransform);
          field.setContentSize(W, this.fieldHeight);
          field.setAnchorPoint(0.5, 0.5);
          this.waveNotice.node.setPosition(0, this.fieldHeight / 2 - WAVE_NOTICE_TOP);
          this["interface"].resize(this.fieldHeight);
          this.clearInput();
        };
        _proto.showWaveNotice = function showWaveNotice() {
          this.waveNotice.string = "\u7B2C " + this.model.wave + " \u6CE2 \xB7 " + PHASE_LABELS[this.model.config.phase];
          this.waveNoticeTime = 2.2;
        };
        _proto.makeGraphics = function makeGraphics(name, parent) {
          var node = new Node(name);
          node.addComponent(UITransform).setContentSize(W, this.fieldHeight);
          parent.addChild(node);
          return node.addComponent(Graphics);
        };
        _proto.drawShadows = function drawShadows() {
          var _this2 = this;
          var ellipse = function ellipse(g, x, y, rx, ry) {
            for (var layer = 3; layer >= 1; layer--) {
              g.fillColor = new Color(59, 48, 74, layer === 3 ? 20 : layer === 2 ? 32 : 48);
              var spread = 1 + (layer - 1) * 0.18;
              g.ellipse(x - W / 2 + 3, y - _this2.fieldHeight / 2, rx * spread, ry * spread);
              g.fill();
            }
          };
          this.bulletShadows.clear();
          for (var _iterator7 = _createForOfIteratorHelperLoose(this.model.bullets), _step7; !(_step7 = _iterator7()).done;) {
            var bullet = _step7.value;
            var size = SPRITE_SIZES[bullet.kind];
            ellipse(this.bulletShadows, bullet.x, bullet.y - size.height * 0.4, size.width * 0.43, size.height * 0.15);
          }
          this.playerShadow.clear();
          this.playerShadow.node.active = this.isPlayerVisible();
          if (this.playerShadow.node.active) {
            var shake = this.paintNode.position;
            ellipse(this.playerShadow, this.model.player.x - 5 + shake.x, this.model.player.y - 45 + shake.y, 35, 10);
          }
        };
        _proto.isPlayerVisible = function isPlayerVisible() {
          return this.artReady && this.model.started && (this.model.invulnerableTime <= 0 || Math.floor(this.model.invulnerableTime * 12) % 2 === 0);
        };
        _proto.drawFishGlow = function drawFishGlow() {
          var g = this.fishGlow;
          g.clear();
          if (!this.artReady) return;
          for (var _iterator8 = _createForOfIteratorHelperLoose(this.model.skillOrbs), _step8; !(_step8 = _iterator8()).done;) {
            var orb = _step8.value;
            var x = orb.x - W / 2,
              y = orb.y - this.fieldHeight / 2;
            var pulse = (Math.sin(orb.pulse * 3.5) + 1) / 2;
            for (var layer = 3; layer >= 1; layer--) {
              g.fillColor = new Color(97, 232, 104, Math.round(12 + (4 - layer) * 6 + pulse * 8));
              g.ellipse(x, y, 22 + layer * 5 + pulse * 2, 10 + layer * 4);
              g.fill();
            }
            g.strokeColor = new Color(170, 255, 146, Math.round(110 + pulse * 70));
            g.lineWidth = 1.4;
            g.ellipse(x, y, 31 + pulse * 2, 19 + pulse);
            g.stroke();
            for (var index = 0; index < 4; index++) {
              var angle = orb.pulse * 0.9 + index * Math.PI / 2;
              var px = x + Math.cos(angle) * 33,
                py = y + Math.sin(angle) * 21;
              var size = 2.1 + (Math.sin(orb.pulse * 4 + index) + 1) * 0.7;
              g.fillColor = new Color(194, 255, 165, 225);
              g.moveTo(px, py + size);
              g.lineTo(px + size * 0.65, py);
              g.lineTo(px, py - size);
              g.lineTo(px - size * 0.65, py);
              g.close();
              g.fill();
            }
          }
        };
        _proto.drawBulletCues = function drawBulletCues() {
          var g = this.bulletCues;
          g.clear();
          var visible = false;
          for (var _iterator9 = _createForOfIteratorHelperLoose(this.model.bullets), _step9; !(_step9 = _iterator9()).done;) {
            var bullet = _step9.value;
            if (bullet.kind !== 'message' || bullet.state !== 'homing') continue;
            var speed = Math.hypot(bullet.vx, bullet.vy);
            if (speed < 1) continue;
            visible = true;
            var x = bullet.x - W / 2,
              y = bullet.y - this.fieldHeight / 2;
            var dx = bullet.vx / speed,
              dy = bullet.vy / speed;
            for (var part = 0; part < 3; part++) {
              g.strokeColor = new Color(255, 128, 137, 160 - part * 45);
              g.lineWidth = 5 - part;
              g.moveTo(x - dx * (12 + part * 10), y - dy * (12 + part * 10));
              g.lineTo(x - dx * (24 + part * 10), y - dy * (24 + part * 10));
              g.stroke();
            }
          }
          g.node.active = visible;
        };
        _proto.drawFolderGaps = function drawFolderGaps() {
          var g = this.gapHighlights;
          g.clear();
          var visible = false;
          var width = SPRITE_SIZES.folder.width,
            height = SPRITE_SIZES.folder.height;
          for (var _iterator10 = _createForOfIteratorHelperLoose(this.model.folderWalls), _step10; !(_step10 = _iterator10()).done;) {
            var wall = _step10.value;
            var left = void 0,
              right = void 0;
            for (var _iterator11 = _createForOfIteratorHelperLoose(wall.orbs), _step11; !(_step11 = _iterator11()).done;) {
              var orb = _step11.value;
              if (!orb.alive) continue;
              if (orb.x < wall.gapStart && (!left || orb.x > left.x)) left = orb;
              if (orb.x > wall.gapEnd && (!right || orb.x < right.x)) right = orb;
            }
            for (var _iterator12 = _createForOfIteratorHelperLoose([[left, 1], [right, -1]]), _step12; !(_step12 = _iterator12()).done;) {
              var _step12$value = _step12.value,
                _orb = _step12$value[0],
                side = _step12$value[1];
              if (!_orb) continue;
              visible = true;
              var x = _orb.x - W / 2 + side * (width / 2 - 4),
                y = _orb.y - this.fieldHeight / 2;
              g.strokeColor = new Color(83, 53, 79, 225);
              g.lineWidth = 5;
              g.moveTo(x - side * 9, y + height * 0.29);
              g.lineTo(x, y + height * 0.29);
              g.lineTo(x, y - height * 0.29);
              g.lineTo(x - side * 9, y - height * 0.29);
              g.stroke();
              g.strokeColor = new Color(255, 248, 204, 250);
              g.lineWidth = 2.5;
              g.moveTo(x - side * 9, y + height * 0.29);
              g.lineTo(x, y + height * 0.29);
              g.lineTo(x, y - height * 0.29);
              g.lineTo(x - side * 9, y - height * 0.29);
              g.stroke();
            }
          }
          g.node.active = visible;
        };
        _proto.drawPickupFlights = function drawPickupFlights() {
          var g = this.pickupLight;
          g.clear();
          for (var _iterator13 = _createForOfIteratorHelperLoose(this.pickupFlights), _step13; !(_step13 = _iterator13()).done;) {
            var flight = _step13.value;
            if (flight.life <= 0) continue;
            var target = this.artHud.chargePoint(flight.segment, this.fieldHeight);
            var progress = 1 - flight.life / 0.55;
            var control = {
              x: (flight.x + target.x) / 2 - 70,
              y: (flight.y + target.y) / 2 + 110
            };
            for (var part = 5; part >= 0; part--) {
              var t = Math.max(0, progress - part * 0.025),
                a = 1 - t;
              var x = a * a * flight.x + 2 * a * t * control.x + t * t * target.x - W / 2;
              var y = a * a * flight.y + 2 * a * t * control.y + t * t * target.y - this.fieldHeight / 2;
              g.fillColor = new Color(111, 235, 111, part === 0 ? 80 : 65 - part * 8);
              g.circle(x, y, part === 0 ? 12 : 7 - part * 0.65);
              g.fill();
              if (part === 0) {
                g.fillColor = new Color(166, 255, 141, 250);
                g.circle(x, y, 5);
                g.fill();
                g.fillColor = new Color(244, 255, 226, 255);
                g.circle(x - 1, y + 1, 2.3);
                g.fill();
              }
            }
          }
        };
        _proto.makeArtSprite = function makeArtSprite(name, width, height, parent) {
          if (parent === void 0) {
            parent = this.node;
          }
          var node = new Node(name);
          node.addComponent(UITransform).setContentSize(width, height);
          parent.addChild(node);
          var sprite = node.addComponent(Sprite);
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          return sprite;
        };
        _proto.loadArt = function loadArt() {
          var _this3 = this;
          assetManager.loadBundle('art', function (bundleError, bundle) {
            if (bundleError || !bundle || !_this3.node.isValid) {
              console.error('[art] Unable to load art bundle', bundleError);
              return;
            }
            var load = function load(key, path) {
              bundle.load(path, SpriteFrame, function (error, frame) {
                if (error || !frame || !_this3.node.isValid) {
                  console.error("[art] Unable to load " + path, error);
                  return;
                }
                var crop = ART_CROPS[key];
                if (crop) {
                  frame = sliceFrame.apply(void 0, [frame].concat(crop));
                  _this3.croppedFrames.push(frame);
                }
                _this3.art.set(key, frame);
                if (key === 'background') _this3.background.spriteFrame = frame;
                _this3.artHud.setArt(key, frame);
                if (key === 'idleSheet') {
                  for (var index = 0; index < IDLE_FRAMES; index += 1) {
                    var cell = sliceFrame(frame, index % 8 * 256, Math.floor(index / 8) * 256, 256, 256);
                    _this3.atlasFrames.push(cell);
                    _this3.art.set("idle_" + String(index + 1).padStart(2, '0'), cell);
                  }
                }
                _this3.artReady = _this3.art.size === ART_FRAME_COUNT;
                if (_this3.artReady && !_this3.initialEntryHandled) {
                  _this3.initialEntryHandled = true;
                  if (_this3.progress.profile.tutorialRevision !== TUTORIAL_REVISION) _this3.restart(true);
                }
                _this3.syncArt();
              });
            };
            for (var _i = 0, _Object$entries = Object.entries(ART_PATHS); _i < _Object$entries.length; _i++) {
              var _Object$entries$_i = _Object$entries[_i],
                key = _Object$entries$_i[0],
                path = _Object$entries$_i[1];
              load(key, path);
            }
          });
        };
        _proto.pooledSprite = function pooledSprite(pool, index, name, size, parent) {
          while (pool.length <= index) {
            var sprite = this.makeArtSprite("" + name + pool.length, size, size, parent);
            sprite.node.active = false;
            pool.push(sprite);
          }
          return pool[index];
        };
        _proto.syncArt = function syncArt() {
          var _this$art$get;
          if (!this.playerSprite || !this.bulletLayer) return;
          this.drawShadows();
          this.drawFishGlow();
          this.drawBulletCues();
          this.drawPickupFlights();
          var player = this.model.player;
          var frameNumber = Math.floor(this.animationClock * 12) % IDLE_FRAMES + 1;
          var frame = (_this$art$get = this.art.get("idle_" + String(frameNumber).padStart(2, '0'))) != null ? _this$art$get : this.art.get('idle_01');
          this.playerSprite.spriteFrame = frame != null ? frame : null;
          this["interface"].setHero(frame != null ? frame : null);
          this.playerSprite.node.active = !!frame && this.isPlayerVisible();
          var shake = this.paintNode.position;
          var hop = this.guide.rewarding ? Math.min(Math.sin(Math.PI * this.guide.rewardProgress) * 10, Math.max(0, playerMovementTop(this.fieldHeight) - player.y)) : 0;
          this.playerSprite.node.setPosition(player.x - W / 2 + shake.x, player.y - this.fieldHeight / 2 + shake.y + hop);
          var squash = Math.sin(Math.PI * this.playerHitTime / 0.28);
          this.playerSprite.node.setScale(1 + squash * 0.06, 1 - squash * 0.09);
          var bulletIndex = 0;
          for (var _iterator14 = _createForOfIteratorHelperLoose(this.model.bullets), _step14; !(_step14 = _iterator14()).done;) {
            var _this$bulletEyes$eyeI;
            var bullet = _step14.value;
            var _frame2 = this.art.get(bullet.kind);
            if (!_frame2) continue;
            var _sprite = this.pooledSprite(this.bulletSprites, bulletIndex++, 'WorkBullet', 44, this.bulletLayer);
            var size = SPRITE_SIZES[bullet.kind];
            _sprite.getComponent(UITransform).setContentSize(size.width, size.height);
            _sprite.spriteFrame = _frame2;
            _sprite.node.active = true;
            _sprite.node.setPosition(bullet.x - W / 2, bullet.y - this.fieldHeight / 2);
            var chasing = bullet.kind === 'message' && bullet.state === 'homing';
            _sprite.node.setScale(chasing ? 1.08 : 1, chasing ? 1.08 : 1);
            _sprite.node.angle = bullet.kind === 'requirement' ? bullet.turnDirection * 14 * Math.sin(Math.PI * bullet.turnFlash / 0.26) : 0;
            var eyeIndex = bulletIndex - 1;
            var eyes = (_this$bulletEyes$eyeI = this.bulletEyes[eyeIndex]) != null ? _this$bulletEyes$eyeI : this.bulletEyes[eyeIndex] = this.makeGraphics('WorkBulletEyes', _sprite.node);
            eyes.node.getComponent(UITransform).setContentSize(size.width, size.height);
            this.drawWorkEyes(eyes, bullet, _sprite.node.angle);
          }
          for (var index = bulletIndex; index < this.bulletSprites.length; index += 1) this.bulletSprites[index].node.active = false;
          var fishFrame = this.art.get('fish');
          var fishIndex = 0;
          if (fishFrame) {
            for (var _iterator15 = _createForOfIteratorHelperLoose(this.model.skillOrbs), _step15; !(_step15 = _iterator15()).done;) {
              var orb = _step15.value;
              var sprite = this.pooledSprite(this.fishSprites, fishIndex++, 'FishPickup', 50, this.bulletLayer);
              sprite.getComponent(UITransform).setContentSize(SPRITE_SIZES.fish.width, SPRITE_SIZES.fish.height);
              sprite.spriteFrame = fishFrame;
              sprite.node.active = true;
              sprite.node.setPosition(orb.x - W / 2, orb.y - this.fieldHeight / 2);
              sprite.node.angle = Math.sin(orb.pulse * 4) * 5;
            }
          }
          for (var _index = fishIndex; _index < this.fishSprites.length; _index += 1) this.fishSprites[_index].node.active = false;
          this.drawFolderGaps();
          this.gapHighlights.node.setSiblingIndex(this.bulletLayer.children.length - 1);
        };
        _proto.drawWorkEyes = function drawWorkEyes(g, bullet, angle) {
          g.clear();
          var art = EYE_ART[bullet.kind],
            size = SPRITE_SIZES[bullet.kind];
          var _ART_CROPS$bullet$kin = ART_CROPS[bullet.kind],
            cropX = _ART_CROPS$bullet$kin[0],
            cropY = _ART_CROPS$bullet$kin[1],
            cropWidth = _ART_CROPS$bullet$kin[2],
            cropHeight = _ART_CROPS$bullet$kin[3];
          var phase = this.eyePhase.get(bullet);
          if (phase === undefined) {
            phase = this.eyePhaseCursor++ % 11 * 0.47;
            this.eyePhase.set(bullet, phase);
          }
          var clock = this.animationClock + phase;
          var cycle = clock % 3.6;
          var blink = cycle > 3.42 ? 0.15 + 0.85 * Math.abs((cycle - 3.51) / 0.09) : 1;
          var chasing = bullet.kind === 'message' && bullet.state === 'homing';
          var grin = (chasing ? 0.48 : 0.72 + Math.sin(clock * 2.1) * 0.12) * blink;
          var dx = this.model.player.x - bullet.x,
            dy = this.model.player.y - bullet.y;
          var distance = Math.max(1, Math.hypot(dx, dy)),
            rotation = -angle * Math.PI / 180;
          var gazeX = (dx * Math.cos(rotation) - dy * Math.sin(rotation)) / distance;
          var gazeY = (dx * Math.sin(rotation) + dy * Math.cos(rotation)) / distance;
          for (var _iterator16 = _createForOfIteratorHelperLoose(art.points), _step16; !(_step16 = _iterator16()).done;) {
            var _step16$value = _step16.value,
              px = _step16$value[0],
              py = _step16$value[1],
              rx = _step16$value[2],
              ry = _step16$value[3];
            var x = ((px - cropX) / cropWidth - 0.5) * size.width;
            var y = (0.5 - (py - cropY) / cropHeight) * size.height;
            var coverX = rx / cropWidth * size.width,
              coverY = ry / cropHeight * size.height;
            g.fillColor = art.ink;
            g.ellipse(x, y, coverX, coverY);
            g.fill();
            var cx = x + gazeX * coverX * 0.24,
              cy = y + gazeY * coverY * 0.15;
            var width = coverX * 0.78,
              height = coverY * grin;
            // The bright crescent narrows into a sly squint; staggered blinks avoid a whole row blinking together.
            g.fillColor = art.light;
            g.moveTo(cx - width, cy + height * 0.15);
            g.bezierCurveTo(cx - width * 0.4, cy - height * 0.9, cx + width * 0.4, cy - height * 0.9, cx + width, cy + height * 0.15);
            g.bezierCurveTo(cx + width * 0.4, cy + height * 0.65, cx - width * 0.4, cy + height * 0.65, cx - width, cy + height * 0.15);
            g.close();
            g.fill();
          }
        };
        _proto.consumeEvents = function consumeEvents() {
          for (var _iterator17 = _createForOfIteratorHelperLoose(this.model.takeEvents()), _step17; !(_step17 = _iterator17()).done;) {
            var event = _step17.value;
            if (event.type === 'pickup') {
              if (this.guide.picked(event.energy)) {
                this.clearInput();
                this.audio.play('wave');
                this.spawnFloater('太棒啦！', this.model.player.x, this.model.player.y + 68, new Color(196, 255, 139), 32, 0.85);
              }
              if (!this.guide.active && this.shieldCoach.charged(event.energy)) this.progress.markShieldHintSeen();
              this.audio.play(event.energy >= 100 && event.gained > 0 ? 'ready' : 'pickup');
              var flight = event.gained > 0 ? this.pickupFlights.find(function (item) {
                return item.life <= 0;
              }) : undefined;
              if (flight) {
                flight.x = event.x;
                flight.y = event.y;
                flight.segment = Math.min(4, Math.floor(event.energy / 20) - 1);
                flight.life = 0.55;
              }
              this.bursts.push({
                x: event.x,
                y: event.y,
                life: 0.28,
                maxLife: 0.28,
                radius: 44,
                color: new Color(156, 255, 126)
              });
            } else if (event.type === 'graze') {
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
              this.audio.play('hit');
              this.hitFlash = 0.5;
              this.shakeTime = 0.4;
              this.playerHitTime = 0.28;
              this.artHud.pulseWorkload(event.workload - 1);
            } else if (event.type === 'shield-block') {
              this.audio.play('block');
              this.shieldBlockTime = 0.3;
              this.shieldBlockAngle = Math.atan2(event.y - this.model.player.y, event.x - this.model.player.x);
            } else if (event.type === 'shield') {
              this.shieldsUsed += 1;
              this.audio.play('shield');
              this.shieldCoach.released();
              this.bursts.push({
                x: this.model.player.x,
                y: this.model.player.y,
                life: 0.45,
                maxLife: 0.45,
                radius: 130,
                color: new Color(110, 255, 210)
              });
            } else if (event.type === 'wave-clear') {
              this.audio.play('wave');
              this.showWaveNotice();
            } else if (event.type === 'hard-step') {
              this.audio.play('wave');
              this.showWaveNotice();
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
          floater.node.setPosition(new Vec3(x - W / 2, y - this.fieldHeight / 2 + 20, 0));
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
            y: local.y + this.fieldHeight / 2
          };
        };
        _proto.press = function press(point, time) {
          if (!this.artReady) return;
          this.pendingAction = null;
          this.pendingPoint = null;
          var action = this["interface"].actionAt(point);
          if (action) {
            this.pendingAction = action;
            this.pendingPoint = point;
            return;
          }
          if (this.model.started && !this.model.gameOver && containsReferencePoint(point, PAUSE_HIT_BOX, this.fieldHeight)) {
            this.togglePause();
            return;
          }
          if (this.model.paused || this.model.gameOver || !this.model.started) return;
          if (this.guide.rewarding || this.guide.ready) return;
          if (this.artHud.containsAvatar(point, this.fieldHeight)) {
            this.pendingAction = 'avatar';
            this.pendingPoint = point;
            return;
          }
          if (point.y > playerDragTop(this.fieldHeight)) return;
          this.dragging = true;
          this.dragOffset.x = this.model.player.x - point.x;
          this.dragOffset.y = this.model.player.y - point.y;
          this.dragSampleTime = performance.now() / 1000;
          this.gesture.begin(point.x, point.y, time);
        };
        _proto.drag = function drag(point) {
          if (!this.dragging || this.model.gameOver || this.model.paused || this.guide.rewarding || this.guide.ready) return;
          this.gesture.move(point.x, point.y);
          var before = _extends({}, this.model.player),
            now = performance.now() / 1000;
          this.model.movePlayer(point.x + this.dragOffset.x, point.y + this.dragOffset.y);
          var completed = this.guide.moved(this.model.player.x - before.x, this.model.player.y - before.y, now - this.dragSampleTime);
          this.dragSampleTime = now;
          if (completed) {
            this.audio.play('ready');
            this.clearInput();
            this.spawnFloater('Good！', this.model.player.x, this.model.player.y + 68, new Color(196, 255, 139), 34, 0.7);
          }
        };
        _proto.release = function release(point, time) {
          if (this.pendingAction && this.pendingPoint) {
            var action = this.pendingAction,
              origin = this.pendingPoint;
            this.pendingAction = null;
            this.pendingPoint = null;
            if (Math.hypot(point.x - origin.x, point.y - origin.y) > 18) return;
            if (action === 'avatar') {
              if (this.model.started && !this.model.gameOver && !this.model.paused && this.artHud.containsAvatar(point, this.fieldHeight)) this.tryActivateShield();
            } else if (this["interface"].actionAt(point) === action) this.handleMenuAction(action);
            return;
          }
          if (!this.dragging) return;
          this.dragging = false;
          if (this.gesture.end(point.x, point.y, time)) this.tryActivateShield();
        };
        _proto.tryActivateShield = function tryActivateShield() {
          if (this.guide.active) return;
          if (this.model.activateShield()) {
            this.hintText = '摸鱼护盾启动';
            this.hintTime = 0.8;
            return;
          }
          this.hintText = this.model.shieldTime > 0 ? '护盾正在生效' : '拾满 5 条小鱼，双击屏幕开启护盾';
          this.hintTime = 0.9;
        };
        _proto.onTouchStart = function onTouchStart(event) {
          var id = event.getID(),
            point = this.pointFromUI(event.getUILocation());
          if (this.model.started && !this.model.gameOver && !this.model.paused && this.artHud.containsAvatar(point, this.fieldHeight)) {
            this.avatarTouches.set(id, point);
            return;
          }
          if (this.activeTouchId !== null) return;
          this.activeTouchId = id;
          this.press(point, performance.now() / 1000);
        };
        _proto.onTouchMove = function onTouchMove(event) {
          if (event.getID() === this.activeTouchId) this.drag(this.pointFromUI(event.getUILocation()));
        };
        _proto.onTouchEnd = function onTouchEnd(event) {
          var id = event.getID(),
            point = this.pointFromUI(event.getUILocation()),
            avatarStart = this.avatarTouches.get(id);
          if (avatarStart) {
            this.avatarTouches["delete"](id);
            if (!this.model.paused && !this.model.gameOver && this.model.started && Math.hypot(point.x - avatarStart.x, point.y - avatarStart.y) <= 18 && this.artHud.containsAvatar(point, this.fieldHeight)) this.tryActivateShield();
            return;
          }
          if (id !== this.activeTouchId) return;
          this.activeTouchId = null;
          this.release(point, performance.now() / 1000);
        };
        _proto.onTouchCancel = function onTouchCancel(event) {
          if (event && this.avatarTouches["delete"](event.getID())) return;
          if (event && event.getID() !== this.activeTouchId) return;
          this.clearInput();
        };
        _proto.onKeyDown = function onKeyDown(event) {
          if (event.keyCode === KeyCode.ESCAPE && this.model.started && !this.model.gameOver) {
            this.togglePause();
            return;
          }
          if (event.keyCode !== KeyCode.SPACE) return;
          if (!this.artReady) return;
          if (this.resume.active) return;
          if (this.guide.ready && !this.model.paused) {
            this.finishPractice();
            return;
          }
          if (this.guide.active && !this.model.paused) return;
          if (this.model.paused) {
            this.togglePause();
            return;
          }
          if (this.model.gameOver || !this.model.started) {
            this.restart();
            return;
          }
          this.tryActivateShield();
        };
        _proto.restart = function restart(forceTutorial) {
          if (forceTutorial === void 0) {
            forceTutorial = false;
          }
          this.model.reset();
          this.clearFeedback();
          this.gesture.reset();
          this.dragging = false;
          this.hintTime = this.hitFlash = this.shakeTime = 0;
          this.animationClock = 0;
          this.waveNoticeTime = 0;
          this.settlement = null;
          this.shieldsUsed = 0;
          this.guide.start(forceTutorial || this.progress.profile.tutorialRevision !== TUTORIAL_REVISION);
          this.shieldCoach.reset(forceTutorial ? false : this.progress.profile.shieldHintSeen);
          this.model.practiceProtected = this.guide.active;
          if (this.guide.active) this.model.bullets.length = 0;
          this.guideFishTimer = 0;
          this.updateGuide(0);
          this.clearInput();
          this.sparks.length = this.bursts.length = 0;
          for (var _iterator18 = _createForOfIteratorHelperLoose(this.floaters), _step18; !(_step18 = _iterator18()).done;) {
            var floater = _step18.value;
            floater.life = 0;
            floater.node.active = false;
          }
        };
        _proto.togglePause = function togglePause() {
          if (!this.model.started || this.model.gameOver || !this.appVisible) return;
          if (this.resume.active) this.resume.cancel();else if (this.model.paused) this.resume.start();
          this.model.paused = true;
          this.clearInput();
          this.audio.play('ui');
        };
        _proto.clearInput = function clearInput() {
          this.dragging = false;
          this.gesture.reset();
          this.activeTouchId = null;
          this.dragSampleTime = 0;
          this.avatarTouches.clear();
          this.pendingAction = null;
          this.pendingPoint = null;
        };
        _proto.handleMenuAction = function handleMenuAction(action) {
          if (action === 'sound') {
            this.progress.setSound(!this.progress.profile.soundEnabled);
            this.audio.enabled = this.progress.profile.soundEnabled;
            this.audio.play('ui');
            return;
          }
          this.audio.play('ui');
          if (action === 'skip') {
            this.progress.completeTutorial();
            this.finishPractice();
          } else if (action === 'primary') {
            if (this.model.paused) this.togglePause();else if (this.guide.ready) this.finishPractice();else this.restart();
          } else if (this.menuMode === 'home') this.restart(true);else this.goHome();
        };
        _proto.goHome = function goHome() {
          this.clearInput();
          this.guide.start(false);
          this.shieldCoach.reset(this.progress.profile.shieldHintSeen);
          this.clearFeedback();
          this.model.reset();
          this.model.started = false;
          this.model.gameOver = false;
          this.model.paused = false;
          this.model.practiceProtected = false;
          this.model.bullets.length = this.model.skillOrbs.length = this.model.leaveSlips.length = 0;
          this.settlement = null;
          this.hintTime = this.waveNoticeTime = this.hitFlash = this.shakeTime = 0;
          this.sparks.length = this.bursts.length = 0;
          for (var _iterator19 = _createForOfIteratorHelperLoose(this.floaters), _step19; !(_step19 = _iterator19()).done;) {
            var floater = _step19.value;
            floater.life = 0;
            floater.node.active = false;
          }
        };
        _proto.finishPractice = function finishPractice() {
          var energy = this.guide.fish > 0 ? 20 : 0;
          this.restart();
          this.model.energy = energy;
          this.showWaveNotice();
        };
        _proto.updateGuide = function updateGuide(dt) {
          if (!this.model.started || this.model.gameOver) return;
          this.model.practiceProtected = this.guide.active;
          if (!this.guide.active || this.model.paused || !this.appVisible) return;
          if (this.guide.advance(dt) === 'ready') {
            this.progress.completeTutorial();
            this.clearInput();
          }
          this.guideFishTimer -= dt;
          if (this.guide.step === 'collect' && !this.model.skillOrbs.length && this.guideFishTimer <= 0) {
            var p = this.model.player;
            var x = p.x > W / 2 ? p.x - 110 : p.x + 110;
            var y = Math.max(240, Math.min(this.fieldHeight - HUD_SAFE_HEIGHT - 80, p.y + (p.y < this.fieldHeight / 2 ? 100 : -100)));
            this.model.skillOrbs.push({
              kind: 'skill',
              x: x,
              y: y,
              radius: 17,
              alive: true,
              pulse: 0
            });
            this.guideFishTimer = 0.7;
          }
        };
        _proto.onGameHide = function onGameHide() {
          this.appVisible = false;
          this.resume.cancel();
          if (this.model.started && !this.model.gameOver) {
            this.model.paused = true;
            this.clearInput();
            this.audio.stop();
          }
        };
        _proto.onGameShow = function onGameShow() {
          this.appVisible = true;
        };
        _proto.clearFeedback = function clearFeedback() {
          this.resume.cancel();
          this.playerHitTime = this.shieldBlockTime = 0;
          for (var _iterator20 = _createForOfIteratorHelperLoose(this.pickupFlights), _step20; !(_step20 = _iterator20()).done;) {
            var flight = _step20.value;
            flight.life = 0;
          }
          this.artHud.clearFeedback();
        };
        _proto.glow = function glow(x, y, radius, color, core) {
          if (core === void 0) {
            core = true;
          }
          var g = this.graphics;
          var lx = x - W / 2;
          var ly = y - this.fieldHeight / 2;
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
          var _this$model$skillOrbs;
          if (!this.graphics) return;
          var g = this.graphics;
          g.clear();
          if (this.shakeTime > 0 && this.visualDt > 0) {
            var amplitude = this.shakeTime * 22;
            var offset = new Vec3((Math.random() - 0.5) * amplitude, (Math.random() - 0.5) * amplitude, 0);
            this.paintNode.setPosition(offset);
            this.bulletLayer.setPosition(offset);
          } else if (this.shakeTime <= 0) {
            this.paintNode.setPosition(Vec3.ZERO);
            this.bulletLayer.setPosition(Vec3.ZERO);
          }
          if (!this.background.spriteFrame) {
            g.fillColor = new Color(145, 177, 180, 255);
            g.rect(-W / 2, -this.fieldHeight / 2, W, this.fieldHeight);
            g.fill();
          }

          // 文件夹墙无预警：不再绘制边缘预告条（墙本身从屏幕外直接推进）

          for (var _iterator21 = _createForOfIteratorHelperLoose(this.model.bullets), _step21; !(_step21 = _iterator21()).done;) {
            var bullet = _step21.value;
            if (this.art.has(bullet.kind)) continue;
            if (bullet.kind === 'message') this.glow(bullet.x, bullet.y, bullet.radius, new Color(255, 77, 77));else if (bullet.kind === 'folder') this.glow(bullet.x, bullet.y, bullet.radius, new Color(255, 206, 66));else this.glow(bullet.x, bullet.y, bullet.radius, new Color(176, 92, 255));
          }
          if (!this.art.has('fish')) {
            for (var _iterator22 = _createForOfIteratorHelperLoose(this.model.skillOrbs), _step22; !(_step22 = _iterator22()).done;) {
              var orb = _step22.value;
              this.glow(orb.x, orb.y, orb.radius + Math.sin(orb.pulse * 5) * 2, new Color(56, 255, 142));
            }
          }

          // 请假条：白色纸条 + 红色批准印章（方形，明显区别于圆形能量球）
          for (var _iterator23 = _createForOfIteratorHelperLoose(this.model.leaveSlips), _step23; !(_step23 = _iterator23()).done;) {
            var slip = _step23.value;
            var blink = slip.life > 3 || Math.floor(slip.life * 8) % 2 === 0;
            if (!blink) continue;
            var lx = slip.x - W / 2;
            var ly = slip.y - this.fieldHeight / 2;
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
            var readyPulse = 62 + Math.sin(this.model.elapsed * 7) * 3;
            g.strokeColor = new Color(108, 255, 202, 220);
            g.lineWidth = 5;
            g.circle(p.x - W / 2, p.y - this.fieldHeight / 2, readyPulse);
            g.stroke();
          }
          if (this.model.shieldTime > 0) {
            var ending = this.model.shieldTime < 0.65;
            var visible = !ending || Math.floor(this.model.shieldTime * 14) % 2 === 0;
            g.fillColor = new Color(100, 255, 140, visible ? 35 : 12);
            g.circle(p.x - W / 2, p.y - this.fieldHeight / 2, 65);
            g.fill();
            g.strokeColor = new Color(135, 255, 160, visible ? 240 : 80);
            g.lineWidth = 5;
            g.circle(p.x - W / 2, p.y - this.fieldHeight / 2, 62);
            g.stroke();
          }
          if (this.shieldBlockTime > 0) {
            var progress = 1 - this.shieldBlockTime / 0.3;
            g.strokeColor = new Color(176, 255, 147, Math.round(245 * (1 - progress)));
            g.lineWidth = 4 * (1 - progress) + 1;
            g.arc(p.x - W / 2, p.y - this.fieldHeight / 2, 62 + progress * 22, this.shieldBlockAngle - 0.9, this.shieldBlockAngle + 0.9, false);
            g.stroke();
          }
          if (!this.art.has('idle_01') && (this.model.invulnerableTime <= 0 || Math.floor(this.model.invulnerableTime * 12) % 2 === 0)) this.glow(p.x, p.y, p.radius, new Color(112, 242, 255));

          // 擦弹火花与事件光环
          for (var _iterator24 = _createForOfIteratorHelperLoose(this.sparks), _step24; !(_step24 = _iterator24()).done;) {
            var spark = _step24.value;
            g.fillColor = new Color(255, 255, 210, Math.floor(200 * (spark.life / 0.25)));
            g.circle(spark.x - W / 2, spark.y - this.fieldHeight / 2, 6 + (0.25 - spark.life) * 40);
            g.fill();
          }
          for (var _iterator25 = _createForOfIteratorHelperLoose(this.bursts), _step25; !(_step25 = _iterator25()).done;) {
            var burst = _step25.value;
            var _progress = 1 - burst.life / burst.maxLife;
            g.strokeColor = new Color(burst.color.r, burst.color.g, burst.color.b, Math.floor(210 * (1 - _progress)));
            g.lineWidth = 6;
            g.circle(burst.x - W / 2, burst.y - this.fieldHeight / 2, burst.radius * _progress);
            g.stroke();
          }

          // 受击红闪（覆盖战场，不盖 HUD）
          if (this.hitFlash > 0) {
            g.fillColor = new Color(255, 60, 60, Math.floor(90 * (this.hitFlash / 0.5)));
            g.rect(-W / 2, -this.fieldHeight / 2, W, this.fieldHeight - HUD_SAFE_HEIGHT);
            g.fill();
          }
          this.artHud.update(this.model, this.artReady, this.visualDt);
          this.waveNotice.node.active = this.waveNoticeTime > 0 && !this.model.gameOver;
          var noticeAlpha = Math.min(1, this.waveNoticeTime / 0.35, (2.2 - this.waveNoticeTime) / 0.2);
          this.waveNotice.color = new Color(61, 36, 60, Math.round(255 * Math.max(0, noticeAlpha)));
          var overlay = this.overlay;
          overlay.clear();
          this.artHud.drawPauseCover(overlay, this.model.paused, this.fieldHeight);
          var modal = this.menuMode !== 'hidden';
          this.centerText.node.setPosition(0, -this.fieldHeight / 2 + 255);
          if (modal) {
            overlay.fillColor = new Color(52, 42, 65, 90);
            overlay.rect(-W / 2, -this.fieldHeight / 2, W, this.fieldHeight - HUD_SAFE_HEIGHT);
            overlay.fill();
          }
          this.centerText.string = modal || !this.artReady ? '' : this.model.leaveSlipFlash > 0 ? '请假获批 · 今天不上班' : this.hintTime > 0 ? this.hintText : '';
          this["interface"].update(this.menuMode, this.progress.profile, this.settlement, this.model.elapsed, this.visualDt);
          this["interface"].updateCountdown(this.resume.remaining);
          if (!this.artReady) this["interface"].primary.string = '资源加载中…';
          var focus = this.guide.active ? this.guide.step === 'collect' ? (_this$model$skillOrbs = this.model.skillOrbs[0]) != null ? _this$model$skillOrbs : null : this.model.player : null;
          this["interface"].updateGuide(this.guide, this.shieldCoach.active, focus, this.animationClock);
        };
        _createClass(GameMain, [{
          key: "menuMode",
          get: function get() {
            return !this.model.started ? 'home' : this.model.gameOver ? 'result' : this.resume.active ? 'resuming' : this.model.paused ? 'paused' : this.guide.ready ? 'tutorial-ready' : 'hidden';
          }
        }]);
        return GameMain;
      }(Component)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameModel.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameLayout.ts'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, _createClass, cclegacy, DESIGN_WIDTH, DESIGN_HEIGHT, PLAYER_BODY, playerMovementTop, PLAYER_START_Y, TOP_SPAWN_MARGIN, HUD_SAFE_HEIGHT, FOLDER_SPACING, FOLDER_RADIUS;
  return {
    setters: [function (module) {
      _extends = module.extends;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      DESIGN_WIDTH = module.DESIGN_WIDTH;
      DESIGN_HEIGHT = module.DESIGN_HEIGHT;
      PLAYER_BODY = module.PLAYER_BODY;
      playerMovementTop = module.playerMovementTop;
      PLAYER_START_Y = module.PLAYER_START_Y;
      TOP_SPAWN_MARGIN = module.TOP_SPAWN_MARGIN;
      HUD_SAFE_HEIGHT = module.HUD_SAFE_HEIGHT;
      FOLDER_SPACING = module.FOLDER_SPACING;
      FOLDER_RADIUS = module.FOLDER_RADIUS;
      exports('HUD_SAFE_HEIGHT', module.HUD_SAFE_HEIGHT);
    }],
    execute: function () {
      exports({
        createFolderWall: createFolderWall,
        waveConfigFor: waveConfigFor
      });
      cclegacy._RF.push({}, "9f302iwGRZC8IFWCOQHh79u", "GameModel", undefined);
      var FIELD_WIDTH = exports('FIELD_WIDTH', DESIGN_WIDTH);
      var FIELD_HEIGHT = exports('FIELD_HEIGHT', DESIGN_HEIGHT);
      var PLAYER_RADIUS = exports('PLAYER_RADIUS', PLAYER_BODY.radius);

      /** 擦弹判定带：弹体边缘距离头部/躯干胶囊的距离。 */
      var GRAZE_CLEARANCE = exports('GRAZE_CLEARANCE', 11);
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
          this.turnFlash = 0;
          this.turnDirection = 0;
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
          this.turnFlash = Math.max(0, this.turnFlash - dt);
          this.turnTimer -= dt;
          if (this.turnTimer <= 0) {
            var current = Math.atan2(this.vy, this.vx);
            var offset = (this.random() * 2 - 1) * Math.PI * 0.72;
            this.turnDirection = Math.sign(offset);
            this.turnFlash = Math.abs(offset) > 0.01 ? 0.26 : 0;
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
        var edgeMargin = FOLDER_SPACING * 1.5 + gapWidth / 2;
        var gapCenter = edgeMargin + clamp(gapPosition, 0, 1) * (width - edgeMargin * 2);
        var gapStart = gapCenter - gapWidth / 2;
        var gapEnd = gapCenter + gapWidth / 2;
        var orbs = [];
        for (var x = FOLDER_SPACING / 2; x < width; x += FOLDER_SPACING) {
          if (x > gapStart - FOLDER_SPACING / 2 && x < gapEnd + FOLDER_SPACING / 2) continue;
          orbs.push({
            kind: 'folder',
            x: x,
            y: y,
            vx: 0,
            vy: -speed,
            radius: FOLDER_RADIUS,
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
            y: PLAYER_START_Y,
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
          this.shieldBlockCooldown = 0;
          this.invulnerableTime = 0;
          this.gameOver = false;
          this.started = false;
          this.paused = false;
          this.practiceProtected = false;
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
          if (this.gameOver || this.paused || this.energy < 100 || this.shieldTime > 0) return false;
          this.energy = 0;
          this.shieldTime = 3;
          this.pushEvent({
            type: 'shield'
          });
          return true;
        };
        _proto4.hitPlayer = function hitPlayer() {
          if (this.gameOver || this.paused || this.practiceProtected || this.shieldTime > 0 || this.invulnerableTime > 0) return false;
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
          if (this.paused) return;
          this.player.x = clamp(x, 34, this.width - 34);
          this.player.y = clamp(y, 90, playerMovementTop(this.height, this.player.radius));
        }

        /** Signed circle-to-capsule separation; one geometry for damage, pickups and near misses. */;
        _proto4.playerClearance = function playerClearance(target) {
          var x = this.player.x + PLAYER_BODY.offsetX;
          var y = clamp(target.y, this.player.y + PLAYER_BODY.bottom, this.player.y + PLAYER_BODY.top);
          return Math.hypot(target.x - x, target.y - y) - this.player.radius - target.radius;
        };
        _proto4.startNextWave = function startNextWave() {
          this.wave += 1;
          this.waveTimer = 0;
          this.waveNoHit = true;
          this.waveState = 'running';
          var config = this.config;
          // Keep existing threats moving, stagger the first new arrivals instead of dumping a volley.
          this.messageTimer = 1.2;
          this.requirementTimer = 1.8;
          this.wallTimer = Math.min(3, config.wallInterval || 4);
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
          this.shieldBlockCooldown = 0;
          this.gameOver = false;
          this.started = true;
          this.paused = false;
          this.practiceProtected = false;
          this.player.x = this.width / 2;
          this.player.y = PLAYER_START_Y * this.height / FIELD_HEIGHT;
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
          if (!this.started || this.gameOver || this.paused) return;
          dt = clamp(dt, 0, 0.05);
          this.leaveSlipFlash = Math.max(0, this.leaveSlipFlash - dt);
          var config = this.config;
          if (!this.practiceProtected) {
            this.elapsed += dt;
            this.waveTimer += dt;
          }
          this.shieldTime = Math.max(0, this.shieldTime - dt);
          this.shieldBlockCooldown = Math.max(0, this.shieldBlockCooldown - dt);
          this.invulnerableTime = Math.max(0, this.invulnerableTime - dt);
          this.grazeCooldown = Math.max(0, this.grazeCooldown - dt);
          if (!this.practiceProtected) this.realtimeScore += dt * 10 * waveMultiplierFor(this.wave) * this.comboMultiplier;
          this.updateCombo(dt);
          this.syncScore();
          if (!this.practiceProtected) this.spawn(dt, config);
          for (var _iterator = _createForOfIteratorHelperLoose(this.bullets), _step; !(_step = _iterator()).done;) {
            var bullet = _step.value;
            var event = null;
            if (bullet.kind === 'message') event = bullet.update(dt, this.player);else if (bullet.kind === 'requirement') bullet.update(dt);else {
              bullet.x += bullet.vx * dt;
              bullet.y += bullet.vy * dt;
            }
            var clearance = this.playerClearance(bullet);
            if (clearance <= 0) {
              if (this.shieldTime > 0) {
                if (this.shieldBlockCooldown <= 0) {
                  this.shieldBlockCooldown = 0.22;
                  this.pushEvent({
                    type: 'shield-block',
                    x: bullet.x,
                    y: bullet.y
                  });
                }
              } else if (this.hitPlayer()) bullet.alive = false;
            } else if (clearance <= GRAZE_CLEARANCE) {
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
            if (this.shieldTime <= 0 && this.playerClearance(orb) <= 0) {
              var previousEnergy = this.energy;
              this.addEnergy(20);
              orb.alive = false;
              this.pushEvent({
                type: 'pickup',
                x: orb.x,
                y: orb.y,
                energy: this.energy,
                gained: this.energy - previousEnergy
              });
            }
          }
          if (!this.practiceProtected) this.updateLeaveSlips(dt);
          this.recycleDead();

          // All waves continue immediately, preserving live objects and skill timers.
          if (!this.gameOver && this.waveTimer >= config.duration) {
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
                this.bullets.push(createMessage(x, this.height + TOP_SPAWN_MARGIN, dir.x * speed, dir.y * speed));
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
              y: 170 + this.random() * (this.height - HUD_SAFE_HEIGHT - 240),
              radius: 17,
              alive: true,
              pulse: 0
            });
            this.skillTimer = 5.2;
          }
        };
        _proto4.spawnWall = function spawnWall(config) {
          var wall = createFolderWall(this.width, 0.1 + this.random() * 0.8, config.gapWidth, this.height + TOP_SPAWN_MARGIN, 115 * config.speedScale);
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
            if (!wall.evaluated && rowY <= this.player.y + PLAYER_BODY.bottom) {
              wall.evaluated = true;
              if (this.shieldTime <= 0) {
                // 贴文件夹穿缝：按玩家边缘与最近文件夹边缘的余量计距，任何对齐下都可无伤达成
                var clearance = Infinity;
                for (var _iterator6 = _createForOfIteratorHelperLoose(aliveOrbs), _step6; !(_step6 = _iterator6()).done;) {
                  var orb = _step6.value;
                  var edgeDistance = this.playerClearance(orb);
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
            if (this.playerClearance(slip) <= 0) {
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
          this.pushEvent({
            type: 'wave-clear',
            wave: this.wave,
            bonus: bonus,
            noHit: this.waveNoHit
          });
          this.startNextWave();
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
          key: "folderWalls",
          get: function get() {
            return this.walls;
          }
        }, {
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

System.register("chunks:///_virtual/main", ['./FinalArtHud.ts', './GameInterface.ts', './GameMain.ts', './PlatformServices.ts', './GameExperience.ts', './GameLayout.ts', './GameModel.ts'], function () {
  return {
    setters: [null, null, null, null, null, null, null],
    execute: function () {}
  };
});

System.register("chunks:///_virtual/PlatformServices.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameExperience.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, sys, Node, AudioSource, assetManager, AudioClip, PROGRESS_KEY, TUTORIAL_REVISION, settleRun, freshProgress, readProgress;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      sys = module.sys;
      Node = module.Node;
      AudioSource = module.AudioSource;
      assetManager = module.assetManager;
      AudioClip = module.AudioClip;
    }, function (module) {
      PROGRESS_KEY = module.PROGRESS_KEY;
      TUTORIAL_REVISION = module.TUTORIAL_REVISION;
      settleRun = module.settleRun;
      freshProgress = module.freshProgress;
      readProgress = module.readProgress;
    }],
    execute: function () {
      cclegacy._RF.push({}, "b661bTRXb1JaZpbtmof9bdX", "PlatformServices", undefined);
      /** Cocos-backed local services keep platform APIs outside game rules. */
      var ProgressStore = exports('ProgressStore', /*#__PURE__*/function () {
        function ProgressStore() {
          this.profile = freshProgress();
          try {
            this.profile = readProgress(sys.localStorage.getItem(PROGRESS_KEY));
          } catch (_unused) {/* Memory fallback. */}
        }
        var _proto = ProgressStore.prototype;
        _proto.save = function save() {
          try {
            sys.localStorage.setItem(PROGRESS_KEY, JSON.stringify(this.profile));
          } catch (_unused2) {/* Keep the current session playable. */}
        };
        _proto.completeTutorial = function completeTutorial() {
          this.profile.tutorialCompleted = true;
          this.profile.tutorialRevision = TUTORIAL_REVISION;
          this.save();
        };
        _proto.markShieldHintSeen = function markShieldHintSeen() {
          this.profile.shieldHintSeen = true;
          this.save();
        };
        _proto.setSound = function setSound(enabled) {
          this.profile.soundEnabled = enabled;
          this.save();
        };
        _proto.settle = function settle(stats, shieldsUsed, energy) {
          var settlement = settleRun(this.profile, stats, shieldsUsed, energy);
          this.profile = settlement.profile;
          this.save();
          return settlement.result;
        };
        return ProgressStore;
      }());
      var SOUND_NAMES = exports('SOUND_NAMES', ['ui', 'pickup', 'ready', 'shield', 'block', 'hit', 'wave', 'result']);
      var GameAudio = exports('GameAudio', /*#__PURE__*/function () {
        function GameAudio(parent) {
          var _this = this;
          this.source = void 0;
          this.clips = new Map();
          this.enabled = true;
          this.alive = true;
          this.lastPlayed = new Map();
          var node = new Node('GameAudio');
          parent.addChild(node);
          this.source = node.addComponent(AudioSource);
          this.source.playOnAwake = false;
          this.source.volume = 0.55;
          assetManager.loadBundle('art', function (error, bundle) {
            if (error || !bundle || !_this.alive) return;
            var _loop = function _loop() {
              var name = _step.value;
              bundle.load("audio/" + name, AudioClip, function (clipError, clip) {
                if (!clipError && clip && _this.alive) _this.clips.set(name, clip);
              });
            };
            for (var _iterator = _createForOfIteratorHelperLoose(SOUND_NAMES), _step; !(_step = _iterator()).done;) {
              _loop();
            }
          });
        }
        var _proto2 = GameAudio.prototype;
        _proto2.play = function play(name) {
          var _this$lastPlayed$get;
          var clip = this.clips.get(name);
          if (!this.enabled || !clip || !this.alive) return;
          var now = performance.now();
          var cooldown = name === 'pickup' ? 70 : name === 'block' ? 220 : 120;
          if (now - ((_this$lastPlayed$get = this.lastPlayed.get(name)) != null ? _this$lastPlayed$get : -Infinity) < cooldown) return;
          this.lastPlayed.set(name, now);
          this.source.playOneShot(clip, name === 'block' ? 0.35 : name === 'hit' ? 0.65 : 0.85);
        };
        _proto2.stop = function stop() {
          this.source.stop();
        };
        _proto2.destroy = function destroy() {
          this.alive = false;
          this.stop();
        };
        return GameAudio;
      }());
      cclegacy._RF.pop();
    }
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