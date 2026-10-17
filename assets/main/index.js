System.register("chunks:///_virtual/AsyncLoading.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _asyncToGenerator, _regeneratorRuntime, cclegacy;
  return {
    setters: [function (module) {
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('retryLoad', retryLoad);
      cclegacy._RF.push({}, "e023djC7KFGV4YTKMqEGzbB", "AsyncLoading", undefined);
      /** Smooth completed work and carry the displayed value across the platform/scene handoff. */
      var LoadingProgress = exports('LoadingProgress', /*#__PURE__*/function () {
        function LoadingProgress() {
          this.value = 0;
          this.target = 0;
        }
        var _proto = LoadingProgress.prototype;
        _proto.reset = function reset(value) {
          if (value === void 0) {
            value = 0;
          }
          this.value = this.target = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
        };
        _proto.report = function report(value) {
          if (Number.isFinite(value)) this.target = Math.max(this.target, Math.min(1, value));
        };
        _proto.advance = function advance(dt) {
          if (Number.isFinite(dt) && dt > 0) this.value = Math.min(this.target, this.value + Math.min(dt, 0.1) * 0.8);
          return this.value;
        };
        return LoadingProgress;
      }());

      /** Bound callback loaders; ignore late callbacks after a timeout and retry transient failures. */
      function retryLoad(_x, _x2) {
        return _retryLoad.apply(this, arguments);
      }
      function _retryLoad() {
        _retryLoad = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(request, options) {
          var _options$attempts;
          var attempts, _loop, _ret, _attempt;
          return _regeneratorRuntime().wrap(function _callee$(_context2) {
            while (1) switch (_context2.prev = _context2.next) {
              case 0:
                attempts = (_options$attempts = options.attempts) != null ? _options$attempts : 3;
                _loop = /*#__PURE__*/_regeneratorRuntime().mark(function _loop(_attempt) {
                  return _regeneratorRuntime().wrap(function _loop$(_context) {
                    while (1) switch (_context.prev = _context.next) {
                      case 0:
                        if (!(options.isCurrent && !options.isCurrent())) {
                          _context.next = 2;
                          break;
                        }
                        throw new Error(options.label + "\u52A0\u8F7D\u5DF2\u53D6\u6D88");
                      case 2:
                        _context.prev = 2;
                        _context.next = 5;
                        return new Promise(function (resolve, reject) {
                          var _options$timeoutMs;
                          var settled = false;
                          var timer = setTimeout(function () {
                            return finish(new Error(options.label + "\u52A0\u8F7D\u8D85\u65F6"));
                          }, (_options$timeoutMs = options.timeoutMs) != null ? _options$timeoutMs : 45000);
                          var finish = function finish(error, value) {
                            if (settled) return;
                            settled = true;
                            clearTimeout(timer);
                            if (error || !value) reject(error != null ? error : new Error(options.label + "\u672A\u8FD4\u56DE\u8D44\u6E90"));else resolve(value);
                          };
                          try {
                            request(finish);
                          } catch (error) {
                            finish(error instanceof Error ? error : new Error(String(error)));
                          }
                        });
                      case 5:
                        _context.t0 = _context.sent;
                        return _context.abrupt("return", {
                          v: _context.t0
                        });
                      case 9:
                        _context.prev = 9;
                        _context.t1 = _context["catch"](2);
                        if (!(_attempt === attempts || options.isCurrent && !options.isCurrent())) {
                          _context.next = 13;
                          break;
                        }
                        throw _context.t1;
                      case 13:
                        options.onRetry == null || options.onRetry(_attempt + 1);
                        _context.next = 16;
                        return new Promise(function (resolve) {
                          var _options$delayMs;
                          return setTimeout(resolve, ((_options$delayMs = options.delayMs) != null ? _options$delayMs : 1000) * _attempt);
                        });
                      case 16:
                      case "end":
                        return _context.stop();
                    }
                  }, _loop, null, [[2, 9]]);
                });
                _attempt = 1;
              case 3:
                if (!(_attempt <= attempts)) {
                  _context2.next = 11;
                  break;
                }
                return _context2.delegateYield(_loop(_attempt), "t0", 5);
              case 5:
                _ret = _context2.t0;
                if (!_ret) {
                  _context2.next = 8;
                  break;
                }
                return _context2.abrupt("return", _ret.v);
              case 8:
                _attempt++;
                _context2.next = 3;
                break;
              case 11:
                throw new Error(options.label + "\u52A0\u8F7D\u5931\u8D25");
              case 12:
              case "end":
                return _context2.stop();
            }
          }, _callee);
        }));
        return _retryLoad.apply(this, arguments);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/BodySpring.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('bodySpringWeight', bodySpringWeight);
      cclegacy._RF.push({}, "fc699G8Zv9Dib/qC7rQQJHa", "BodySpring", undefined);
      /** Visual inertia only: feet follow the player; the torso and head follow a spring. */
      var BODY_SPRING = exports('BODY_SPRING', {
        stiffness: 135,
        damping: 11,
        drive: 18,
        maxX: 36,
        maxY: 22,
        rows: 24
      });

      /** Keep feet/shadow still and ease the bend into a rigid head, preserving the face. */
      function bodySpringWeight(y) {
        var t = Math.max(0, Math.min(1, (y + 42) / 70));
        return t * t * (3 - 2 * t);
      }
      var BodySpring = exports('BodySpring', /*#__PURE__*/function () {
        function BodySpring() {
          this.x = 0;
          this.y = 0;
          this.vx = 0;
          this.vy = 0;
          this.rootX = 0;
          this.rootY = 0;
          this.initialized = false;
        }
        var _proto = BodySpring.prototype;
        _proto.reset = function reset(root) {
          this.rootX = root.x;
          this.rootY = root.y;
          this.x = this.y = this.vx = this.vy = 0;
          this.initialized = true;
        };
        _proto.advance = function advance(dt, root) {
          if (!this.initialized) {
            this.reset(root);
            return;
          }
          if (!Number.isFinite(dt) || dt <= 0) return;
          var elapsed = Math.min(dt, 0.1);
          var driveX = (root.x - this.rootX) / elapsed;
          var driveY = (root.y - this.rootY) / elapsed;
          this.rootX = root.x;
          this.rootY = root.y;
          var steps = Math.ceil(elapsed / (1 / 120));
          var step = elapsed / steps;
          var stiffness = BODY_SPRING.stiffness,
            damping = BODY_SPRING.damping,
            drive = BODY_SPRING.drive,
            maxX = BODY_SPRING.maxX,
            maxY = BODY_SPRING.maxY;
          for (var i = 0; i < steps; i++) {
            this.vx += (-stiffness * this.x - damping * this.vx - drive * driveX) * step;
            this.vy += (-stiffness * this.y - damping * this.vy - drive * driveY) * step;
            this.x += this.vx * step;
            this.y += this.vy * step;
            if (Math.abs(this.x) > maxX) {
              this.x = Math.sign(this.x) * maxX;
              this.vx = 0;
            }
            if (Math.abs(this.y) > maxY) {
              this.y = Math.sign(this.y) * maxY;
              this.vy = 0;
            }
          }
          if (Math.abs(this.x) < 0.01 && Math.abs(this.vx) < 0.1) this.x = this.vx = 0;
          if (Math.abs(this.y) < 0.01 && Math.abs(this.vy) < 0.1) this.y = this.vy = 0;
        };
        return BodySpring;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/FinalArtHud.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameModel.ts', './GameLayout.ts', './PortraitMotion.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, SpriteFrame, Rect, Size, Node, UITransform, Sprite, Label, Color, Material, Mask, Graphics, SHIELD_DURATION, referencePoint, DESIGN_WIDTH, DESIGN_HEIGHT, ART_SCALE, formatClock, PLAYER_ENERGY_BAR, playerEnergyBarPoint, PORTRAIT_AVATAR, HUD_LAYOUT, PortraitMotion;
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
      Material = module.Material;
      Mask = module.Mask;
      Graphics = module.Graphics;
    }, function (module) {
      SHIELD_DURATION = module.SHIELD_DURATION;
    }, function (module) {
      referencePoint = module.referencePoint;
      DESIGN_WIDTH = module.DESIGN_WIDTH;
      DESIGN_HEIGHT = module.DESIGN_HEIGHT;
      ART_SCALE = module.ART_SCALE;
      formatClock = module.formatClock;
      PLAYER_ENERGY_BAR = module.PLAYER_ENERGY_BAR;
      playerEnergyBarPoint = module.playerEnergyBarPoint;
      PORTRAIT_AVATAR = module.PORTRAIT_AVATAR;
      HUD_LAYOUT = module.HUD_LAYOUT;
    }, function (module) {
      PortraitMotion = module.PortraitMotion;
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
          this.portrait = void 0;
          this.portraitDetails = void 0;
          this.portraitMask = void 0;
          this.portraitRing = void 0;
          this.portraitRingMaterial = void 0;
          this.portraitMotion = new PortraitMotion();
          this.readyEffects = void 0;
          this.energyRoot = void 0;
          this.energyBar = void 0;
          this.settingsIcon = void 0;
          this.chargeSegments = 0;
          this.shieldFraction = 0;
          this.barFraction = 0;
          this.chargeFlashes = [0, 0, 0, 0, 0];
          this.workloadPulses = [0, 0, 0];
          this.clock = 0;
          this.energyPoint = {
            x: 0,
            y: 0
          };
          this.portraitCenter = void 0;
          this.slots = [];
          this.ownedFrames = [];
          this.emptySlot = void 0;
          this.filledSlot = void 0;
          this.portraitFrames = [];
          this.expressionFrames = [[], [], []];
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
          this.portraitCenter = {
            x: point.x - DESIGN_WIDTH / 2,
            y: point.y - DESIGN_HEIGHT / 2
          };
          var ring = new Node('PortraitIllustratedRing');
          ring.setPosition(this.portraitCenter.x, this.portraitCenter.y);
          // Use the actual settings artwork at its original HUD scale, including the painted ink and bevel.
          var timePanel = this.panels.time;
          ring.addComponent(UITransform).setContentSize(410 * timePanel.box.width * ART_SCALE / timePanel.crop.width, 410 * timePanel.box.height * ART_SCALE / timePanel.crop.height);
          this.root.addChild(ring);
          this.portraitRing = ring.addComponent(Sprite);
          this.portraitRing.sizeMode = Sprite.SizeMode.CUSTOM;
          this.portraitMask = new Node('PortraitAvatarMask');
          this.portraitMask.setPosition(this.portraitCenter.x, this.portraitCenter.y);
          this.portraitMask.addComponent(UITransform).setContentSize(PORTRAIT_AVATAR.diameter, PORTRAIT_AVATAR.diameter);
          this.root.addChild(this.portraitMask);
          this.portraitMask.addComponent(Mask).type = Mask.Type.GRAPHICS_ELLIPSE;
          // The full-circle backdrop covers both the old static cat and the baked five-sector ring.
          var backdrop = new Node('OriginalPortraitBackdrop');
          this.portraitMask.addChild(backdrop);
          backdrop.addComponent(UITransform).setContentSize(PORTRAIT_AVATAR.diameter, PORTRAIT_AVATAR.diameter);
          var background = backdrop.addComponent(Graphics);
          var radius = PORTRAIT_AVATAR.diameter / 2;
          background.fillColor = new Color(211, 229, 230);
          background.circle(0, 0, radius);
          background.fill();
          // Soft mist/mint separates the grey fur and blue sweater from the lavender rim.
          for (var layer = 0; layer < 24; layer++) {
            var t = layer / 23;
            background.fillColor = new Color(Math.round(211 + 29 * t), Math.round(229 + 17 * t), Math.round(230 + 14 * t));
            background.circle(-3 * t, 4 * t, radius * (1 - t * 0.94));
            background.fill();
          }
          background.fillColor = new Color(248, 255, 253, 90);
          background.ellipse(-13, 27, 8, 2.5);
          background.fill();
          background.fillColor = new Color(246, 255, 252, 125);
          background.circle(26, 17, 1.4);
          background.circle(-28, -8, 1);
          background.fill();
          background.strokeColor = new Color(246, 255, 252, 190);
          background.lineWidth = 0.8;
          background.circle(0, 0, radius - 0.6);
          background.stroke();
          var portrait = new Node('ApprovedCharacterPortrait');
          this.portraitMask.addChild(portrait);
          portrait.addComponent(UITransform).setContentSize(PORTRAIT_AVATAR.size, PORTRAIT_AVATAR.size * 150 / 130);
          this.portrait = portrait.addComponent(Sprite);
          this.portrait.sizeMode = Sprite.SizeMode.CUSTOM;
          var details = new Node('PortraitExpressionDetails');
          portrait.addChild(details);
          details.addComponent(UITransform).setContentSize(PORTRAIT_AVATAR.size, PORTRAIT_AVATAR.size * 150 / 130);
          this.portraitDetails = details.addComponent(Graphics);
          this.drawPortrait();
          // The original inner ink sits over the animated face, so its painted edge stays intact.
          ring.setSiblingIndex(this.portraitMask.getSiblingIndex() + 1);
          this.energyRoot = new Node('PlayerFishEnergy');
          this.energyRoot.addComponent(UITransform).setContentSize(PLAYER_ENERGY_BAR.width + 20, PLAYER_ENERGY_BAR.height + 20);
          this.root.addChild(this.energyRoot);
          var effects = new Node('FullEnergyGoldGlow');
          effects.addComponent(UITransform).setContentSize(PLAYER_ENERGY_BAR.width + 20, PLAYER_ENERGY_BAR.height + 20);
          this.energyRoot.addChild(effects);
          this.readyEffects = effects.addComponent(Graphics);
          var bar = new Node('FiveFishCapsule');
          bar.addComponent(UITransform).setContentSize(PLAYER_ENERGY_BAR.width, PLAYER_ENERGY_BAR.height);
          this.energyRoot.addChild(bar);
          this.energyBar = bar.addComponent(Graphics);
          var settings = new Node('SettingsGear');
          settings.addComponent(UITransform).setContentSize(72, 72);
          var settingsPoint = referencePoint(67, 309);
          settings.setPosition(settingsPoint.x - DESIGN_WIDTH / 2, settingsPoint.y - DESIGN_HEIGHT / 2);
          this.root.addChild(settings);
          this.settingsIcon = settings.addComponent(Graphics);
          this.drawSettingsButton(this.settingsIcon, 0, 0);
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
          var _this = this;
          if (/^portrait[012]$/.test(key)) {
            var state = Number(key.slice(-1));
            this.expressionFrames[state] = Array.from({
              length: 61
            }, function (_, index) {
              return _this.slice(frame, new Rect(index % 8 * 132 + 2, Math.floor(index / 8) * 132 + 2, 128, 128));
            });
            this.drawPortrait();
            return;
          }
          if (key === 'idleSheet') {
            this.portraitFrames = [40, 38, 12].map(function (index) {
              return _this.slice(frame, new Rect(index % 8 * 256 + 55, Math.floor(index / 8) * 256 + 35, 130, 150));
            });
            this.drawPortrait();
            return;
          }
          var panelKey = {
            timeUI: 'time',
            scoreUI: 'score',
            workloadUI: 'workload'
          }[key];
          if (!panelKey) return;
          var panel = this.panels[panelKey];
          panel.sprite.spriteFrame = this.slice(frame, panel.crop);
          if (panelKey === 'time') {
            var ring = this.slice(frame, new Rect(32, 35, 410, 410));
            // The recolor shader samples source pixels, which must not move into a dynamic atlas.
            ring.packable = false;
            this.portraitRing.spriteFrame = ring;
          }
          if (panelKey === 'time' || panelKey === 'score') {
            var time = panelKey === 'time';
            var patch = this.sprite(panelKey + "NumberPatch", time ? this.rawBox('time', 470, 225, 400, 132) : this.rawBox('score', 324, 208, 544, 132));
            patch.spriteFrame = this.slice(frame, time ? new Rect(904, 226, 20, 132) : new Rect(887, 208, 16, 132));
            // Put the patch above the printed digits and below the live text.
            (time ? this.time : this.score).node.setSiblingIndex(this.root.children.length - 1);
          } else {
            this.emptySlot = this.slice(frame, new Rect(512, 185, 219, 195));
            this.filledSlot = this.slice(frame, new Rect(62, 185, 219, 195));
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
          this.shieldFraction = Math.min(1, Math.max(0, model.shieldTime / SHIELD_DURATION));
          this.barFraction = model.shieldTime > 0 ? this.shieldFraction : this.chargeSegments / PLAYER_ENERGY_BAR.segments;
          this.portraitMotion.advance(model.workload, ready && !model.paused && !model.gameOver ? dt : 0);
          this.drawPortrait();
          for (var _index = 0; _index < this.slots.length; _index += 1) {
            var _ref;
            this.slots[_index].spriteFrame = (_ref = _index < model.workload ? this.filledSlot : this.emptySlot) != null ? _ref : null;
            this.workloadPulses[_index] = _index < model.workload ? Math.max(0, this.workloadPulses[_index] - dt) : 0;
            var pop = 1 + 0.16 * Math.sin(Math.PI * this.workloadPulses[_index] / 0.3);
            this.slots[_index].node.setScale(pop, pop);
          }
          this.energyRoot.active = model.started && !model.gameOver;
          this.syncEnergyPosition(model.player, model.height, model.playerFacing);
          this.drawReadyEffects(model);
          this.drawEnergyBar(model);
          this.root.active = ready;
        }

        /** HUD root is top-aligned, while the moving bar uses playfield coordinates. */;
        _proto.syncEnergyPosition = function syncEnergyPosition(player, height, facing) {
          if (facing === void 0) {
            facing = -1;
          }
          this.energyPoint = playerEnergyBarPoint(player, facing);
          this.energyRoot.setPosition(this.energyPoint.x - DESIGN_WIDTH / 2, this.energyPoint.y - height + DESIGN_HEIGHT / 2);
        };
        _proto.drawReadyEffects = function drawReadyEffects(model) {
          var g = this.readyEffects;
          g.clear();
          g.node.active = model.started && !model.gameOver && model.energy >= 100 && model.shieldTime <= 0;
          if (!g.node.active) return;
          var width = PLAYER_ENERGY_BAR.width,
            height = PLAYER_ENERGY_BAR.height,
            pulse = this.goldPulse();
          // Concentric translucent capsules create a small soft halo without a texture or blur pass.
          for (var layer = 6; layer >= 1; layer--) {
            var spread = layer * 0.9;
            g.fillColor = new Color(255, 196, 48, Math.round((4 + pulse * 8) * (1 - layer / 9)));
            g.roundRect(-width / 2 - spread, -height / 2 - spread, width + spread * 2, height + spread * 2, height / 2 + spread);
            g.fill();
          }
          g.strokeColor = new Color(255, 221, 121, Math.round(80 + pulse * 160));
          g.lineWidth = 1.3;
          g.roundRect(-width / 2 - 1, -height / 2 - 1, width + 2, height + 2, height / 2 + 1);
          g.stroke();
          for (var i = 0; i < 2; i++) {
            var sx = (i === 0 ? -1 : 1) * (width / 2 + 4),
              sy = i === 0 ? 2 : -3;
            var size = 1.3 + pulse * 0.8;
            g.fillColor = new Color(255, 240, 182, Math.round(65 + pulse * 180));
            g.moveTo(sx, sy + size);
            g.lineTo(sx + size * 0.55, sy);
            g.lineTo(sx, sy - size);
            g.lineTo(sx - size * 0.55, sy);
            g.close();
            g.fill();
          }
        };
        _proto.goldPulse = function goldPulse() {
          return (1 - Math.cos(this.clock * Math.PI * 2 / 1.1)) / 2;
        };
        _proto.drawEnergyBar = function drawEnergyBar(model) {
          var g = this.energyBar;
          g.clear();
          var width = PLAYER_ENERGY_BAR.width,
            height = PLAYER_ENERGY_BAR.height,
            segments = PLAYER_ENERGY_BAR.segments,
            inset = PLAYER_ENERGY_BAR.inset;
          var half = width / 2,
            innerLeft = -half + inset,
            innerHeight = height - inset * 2,
            innerWidth = width - inset * 2;
          var cell = innerWidth / segments,
            radius = innerHeight / 2;
          var capsule = function capsule(inset, color, y) {
            if (y === void 0) {
              y = 0;
            }
            g.fillColor = color;
            g.roundRect(-half + inset, -height / 2 + inset + y, width - inset * 2, height - inset * 2, height / 2 - inset);
            g.fill();
          };
          capsule(0, new Color(80, 48, 70, 48), -1.2);
          // Filled outlines stay legible on phones: sub-pixel Graphics strokes fade in its AA shader.
          capsule(0, new Color(86, 54, 78));
          capsule(1, new Color(116, 210, 214));
          capsule(1.3, new Color(197, 244, 242));
          capsule(1.9, new Color(86, 54, 78));
          capsule(inset, new Color(220, 244, 241));
          var fillCell = function fillCell(index, color, fraction) {
            if (fraction === void 0) {
              fraction = 1;
            }
            var left = innerLeft + index * cell,
              right = left + cell * fraction;
            var cap = Math.min(radius, (right - left) / 2);
            var roundRight = index === segments - 1;
            g.fillColor = color;
            g.moveTo(left + (index === 0 ? cap : 0), -radius);
            g.lineTo(right - (roundRight ? cap : 0), -radius);
            if (roundRight) for (var step = 1; step <= 10; step++) {
              var angle = -Math.PI / 2 + Math.PI * step / 10;
              g.lineTo(right - cap + Math.cos(angle) * cap, Math.sin(angle) * radius);
            } else g.lineTo(right, radius);
            g.lineTo(left + (index === 0 ? cap : 0), radius);
            if (index === 0) for (var _step = 1; _step <= 10; _step++) {
              var _angle = Math.PI / 2 + Math.PI * _step / 10;
              g.lineTo(left + cap + Math.cos(_angle) * cap, Math.sin(_angle) * radius);
            } else g.lineTo(left, -radius);
            g.close();
            g.fill();
          };
          var shieldActive = model.shieldTime > 0;
          for (var index = 0; index < segments; index++) {
            var fraction = Math.min(1, Math.max(0, this.barFraction * segments - index));
            if (fraction <= 0) continue;
            fillCell(index, new Color(73, 209, 211), fraction);
            var left = innerLeft + index * cell;
            g.fillColor = new Color(193, 251, 229);
            var pad = index === 0 || index === segments - 1 ? 2.8 : 0.7;
            var highlight = cell * fraction - pad * 2;
            if (highlight > 0) {
              g.roundRect(left + pad, radius - 2, highlight, 1.2, 0.6);
              g.fill();
            }
            if (!shieldActive && this.chargeFlashes[index] > 0) fillCell(index, new Color(235, 255, 238, Math.round(100 * this.chargeFlashes[index] / 0.3)));
          }
          if (this.chargeSegments === segments && model.shieldTime <= 0) {
            // The full capsule flashes gold, while its fish-coloured cells remain readable.
            var pulse = this.goldPulse();
            capsule(inset, new Color(255, 211, 82, Math.round(15 + pulse * 64)));
            g.strokeColor = new Color(255, 246, 191, Math.round(50 + pulse * 150));
            g.lineWidth = 1;
            g.moveTo(-half + 6, height / 2 - 1.6);
            g.lineTo(half - 6, height / 2 - 1.6);
            g.stroke();
          }
          // Stable, bold dividers are drawn above every fill and flash.
          g.fillColor = new Color(86, 54, 78);
          for (var _index2 = 1; _index2 < segments; _index2++) {
            var x = innerLeft + _index2 * cell;
            g.rect(x - 0.8, -radius, 1.6, innerHeight);
            g.fill();
          }
          g.strokeColor = new Color(255, 244, 214);
          g.lineWidth = 0.8;
          g.moveTo(-half + 6, height / 2 - 1);
          g.lineTo(half - 6, height / 2 - 1);
          g.stroke();
        };
        _proto.avatarPoint = function avatarPoint(height) {
          if (height === void 0) {
            height = DESIGN_HEIGHT;
          }
          return {
            x: this.portraitCenter.x + DESIGN_WIDTH / 2,
            y: this.portraitCenter.y + height - DESIGN_HEIGHT / 2
          };
        };
        _proto.chargePoint = function chargePoint(index, height) {
          var width = PLAYER_ENERGY_BAR.width,
            segments = PLAYER_ENERGY_BAR.segments,
            inset = PLAYER_ENERGY_BAR.inset;
          var innerWidth = width - inset * 2;
          return {
            x: this.energyPoint.x - innerWidth / 2 + (Math.min(segments - 1, Math.max(0, index)) + 0.5) * innerWidth / segments,
            y: this.energyPoint.y
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
          this.portraitMotion.reset();
        };
        _proto.containsAvatar = function containsAvatar(point, height) {
          if (height === void 0) {
            height = DESIGN_HEIGHT;
          }
          var center = this.avatarPoint(height);
          return Math.hypot(point.x - center.x, point.y - center.y) <= PORTRAIT_AVATAR.hitRadius;
        }

        /** Animate the reference cat inside the fixed circle; fallback while artwork loads. */;
        _proto.drawPortrait = function drawPortrait() {
          var _this$portraitFrames;
          var motion = this.portraitMotion,
            pressure = motion.pressure;
          var node = this.portrait.node;
          node.setPosition(motion.sway, -0.5 + motion.bob + motion.breath * (0.25 + pressure * 0.12));
          node.angle = motion.roll;
          var frames = this.expressionFrames[motion.workload];
          var g = this.portraitDetails;
          g.clear();
          if (frames.length) {
            node.getComponent(UITransform).setContentSize(PORTRAIT_AVATAR.size, PORTRAIT_AVATAR.size);
            node.setScale(PORTRAIT_AVATAR.zoom, PORTRAIT_AVATAR.zoom * (1 + motion.breath * 0.006));
            this.portrait.spriteFrame = frames[motion.clipFrame];
            return;
          }
          node.getComponent(UITransform).setContentSize(PORTRAIT_AVATAR.size, PORTRAIT_AVATAR.size * 150 / 130);
          node.setScale(1, 1 + motion.breath * 0.006);
          // All three frames are from the same sheet used by the playable character.
          this.portrait.spriteFrame = (_this$portraitFrames = this.portraitFrames[motion.blink > 0.65 ? 2 : motion.blink > 0.2 ? 1 : 0]) != null ? _this$portraitFrames : null;
          if (!this.portrait.spriteFrame) return;
          var ink = new Color(48, 33, 59);
          var factor = PORTRAIT_AVATAR.size / 130;
          var x = function x(source) {
            return (source - 120) * factor;
          };
          var y = function y(source) {
            return (110 - source) * factor;
          };
          // Details are drawn in source-pixel coordinates, on the original cheeks.
          g.lineWidth = 0.85;
          g.strokeColor = ink;
          if (pressure > 0.05 && motion.blink < 0.2) {
            g.moveTo(x(89), y(89));
            g.quadraticCurveTo(x(96), y(87 - pressure * 2), x(105), y(89 - pressure * 3));
            g.stroke();
            g.moveTo(x(127), y(89 - pressure * 3));
            g.quadraticCurveTo(x(135), y(87 - pressure * 2), x(144), y(89));
            g.stroke();
          }
          if (pressure > 1.3) {
            // Cover only the tiny printed mouth; the nose and muzzle retain their pixels.
            g.fillColor = new Color(255, 235, 211);
            g.ellipse(x(116), y(132), 2.7, 2.6);
            g.fill();
            g.fillColor = ink;
            g.ellipse(x(116), y(132), 1.45, 1.65 + motion.breath * 0.2);
            g.fill();
            g.fillColor = new Color(242, 156, 163);
            g.ellipse(x(116), y(135), 0.8, 0.45);
            g.fill();
          }
          for (var _i = 0, _arr = [-1, 1]; _i < _arr.length; _i++) {
            var side = _arr[_i];
            var strength = side === 1 ? Math.min(1, pressure) : Math.max(0, pressure - 1);
            if (strength < 0.01) continue;
            var phase = (motion.clock / (pressure > 1.5 ? 0.9 : 1.7) + (side < 0 ? 0.5 : 0)) % 1;
            var alpha = Math.round(235 * strength * Math.sin(phase * Math.PI));
            var px = side * 15.3,
              py = 6 - phase * 12;
            g.fillColor = new Color(119, 223, 240, alpha);
            g.strokeColor = new Color(40, 105, 145, alpha);
            g.lineWidth = 0.55;
            g.moveTo(px, py + 2.5);
            g.bezierCurveTo(px + 3, py - 2.5, px - 3, py - 2.5, px, py + 2.5);
            g.close();
            g.fill();
            g.stroke();
            g.fillColor = new Color(239, 255, 255, alpha);
            g.ellipse(px - 0.4, py, 0.35, 0.8);
            g.fill();
          }
          if (pressure > 1.5) {
            var _alpha = Math.round(210 * Math.max(0, Math.sin(motion.clock * 4)) * (pressure - 1));
            g.strokeColor = new Color(112, 93, 140, _alpha);
            g.lineWidth = 0.75;
            g.moveTo(-3, 15);
            g.lineTo(-3.5, 18);
            g.stroke();
            g.moveTo(1, 15.5);
            g.lineTo(1.5, 18.5);
            g.stroke();
          }
        };
        _proto.setPortraitRingEffect = function setPortraitRingEffect(effect) {
          if (this.portraitRingMaterial) return;
          this.portraitRingMaterial = new Material();
          this.portraitRingMaterial.initialize({
            effectAsset: effect
          });
          this.portraitRing.customMaterial = this.portraitRingMaterial;
        };
        _proto.drawSettingsButton = function drawSettingsButton(g, x, y) {
          // Cover only the baked pause glyph; keep its illustrated plum/gold circular frame.
          g.fillColor = new Color(250, 231, 195);
          g.circle(x, y, 23.5);
          g.fill();
          var points = Array.from({
            length: 32
          }, function (_, i) {
            var angle = i * Math.PI / 16 - Math.PI / 2;
            var radius = i % 4 === 0 || i % 4 === 3 ? 12.8 : 18;
            return {
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius
            };
          });
          var gear = function gear(offsetY) {
            var last = points[points.length - 1],
              first = points[0];
            g.moveTo(x + (last.x + first.x) / 2, y + (last.y + first.y) / 2 + offsetY);
            for (var i = 0; i < points.length; i++) {
              var p = points[i],
                next = points[(i + 1) % points.length];
              g.quadraticCurveTo(x + p.x, y + p.y + offsetY, x + (p.x + next.x) / 2, y + (p.y + next.y) / 2 + offsetY);
            }
            g.close();
            g.fill();
            g.stroke();
          };
          g.lineWidth = 2;
          g.strokeColor = new Color(86, 54, 78);
          g.fillColor = new Color(111, 73, 122);
          gear(-1.4);
          g.fillColor = new Color(186, 147, 198);
          gear(0);
          g.lineWidth = 1.6;
          g.strokeColor = new Color(239, 216, 244);
          for (var i = 0; i < 3; i++) {
            var angle = Math.PI / 2 + i * Math.PI / 4;
            var cx = x + Math.cos(angle) * 13,
              cy = y + Math.sin(angle) * 13;
            g.moveTo(cx - 1.6, cy + 0.6);
            g.lineTo(cx + 1.6, cy + 0.6);
            g.stroke();
          }
          g.fillColor = new Color(111, 73, 122);
          g.circle(x, y - 0.7, 7);
          g.fill();
          g.fillColor = new Color(255, 239, 211);
          g.strokeColor = new Color(86, 54, 78);
          g.lineWidth = 1.5;
          g.circle(x, y + 0.6, 5.8);
          g.fill();
          g.stroke();
        };
        _proto.drawSettingsCover = function drawSettingsCover(graphics, paused, height) {
          if (height === void 0) {
            height = DESIGN_HEIGHT;
          }
          if (!paused) return;
          var point = referencePoint(67, 309);
          point.y += (height - DESIGN_HEIGHT) / 2;
          var x = point.x - DESIGN_WIDTH / 2;
          var y = point.y - DESIGN_HEIGHT / 2;
          this.drawSettingsButton(graphics, x, y);
        };
        _proto.destroy = function destroy() {
          var _this$portraitRingMat;
          (_this$portraitRingMat = this.portraitRingMaterial) == null || _this$portraitRingMat.destroy();
          for (var _iterator = _createForOfIteratorHelperLoose(this.ownedFrames), _step2; !(_step2 = _iterator()).done;) {
            var frame = _step2.value;
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
  var _createClass, _createForOfIteratorHelperLoose, _extends, cclegacy, SIMPLE_WAVE_SECONDS, HARD_START_SECONDS, rankFor;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SIMPLE_WAVE_SECONDS = module.SIMPLE_WAVE_SECONDS;
      HARD_START_SECONDS = module.HARD_START_SECONDS;
      rankFor = module.rankFor;
    }],
    execute: function () {
      exports({
        readProgress: readProgress,
        settleRun: settleRun
      });
      cclegacy._RF.push({}, "6273bHXMo5F2qlvh7mL8jNh", "GameExperience", undefined);
      var PROGRESS_KEY = exports('PROGRESS_KEY', 'off-work.progress.v1');
      var TUTORIAL_REVISION = exports('TUTORIAL_REVISION', 6);
      var TUTORIAL_COPY = exports('TUTORIAL_COPY', {
        introTitle: '摸鱼练习',
        introSubtitle: '在正式摸鱼之前先来熟悉一下基础操作吧',
        practice: '开始练习',
        completeTitle: '练习完成',
        completeSubtitle: '成功降低 2 格工作负荷！\n躲弹幕、拾小鱼，满盾双击免疫。',
        success: 'GOOD!',
        dodgeSuccess: '躲得漂亮！',
        shieldSuccess: '太棒啦！',
        agentSuccess: '你学会啦！',
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
            var valid = key === 'bestSeconds' ? Number.isFinite(value[key]) : Number.isSafeInteger(value[key]);
            if (typeof value[key] === 'number' && valid && value[key] >= 0) clean[key] = value[key];
          }
          clean.tutorialCompleted = value.tutorialCompleted === true;
          clean.tutorialRevision = clean.tutorialCompleted && Number.isInteger(value.tutorialRevision) ? Math.max(0, Math.min(TUTORIAL_REVISION, value.tutorialRevision)) : 0;
          clean.shieldHintSeen = value.shieldHintSeen === true && clean.tutorialRevision === TUTORIAL_REVISION;
          clean.soundEnabled = value.soundEnabled !== false;
        } catch (_unused) {/* Broken or unavailable storage must never block play. */}
        return clean;
      }
      var TutorialGuide = exports('TutorialGuide', /*#__PURE__*/function () {
        function TutorialGuide() {
          this.step = 'off';
          this.fish = 0;
          this.lowered = 0;
          this.dodged = false;
          this.retryRemaining = 0;
          this.rewardRemaining = 0;
        }
        var _proto2 = TutorialGuide.prototype;
        _proto2.start = function start(enabled) {
          this.step = enabled ? 'intro' : 'off';
          this.fish = this.lowered = 0;
          this.dodged = false;
          this.retryRemaining = this.rewardRemaining = 0;
        };
        _proto2.beginPractice = function beginPractice() {
          if (!this.introducing) return false;
          this.step = 'practice';
          return true;
        };
        _proto2.avoided = function avoided() {
          if (this.step !== 'practice') return false;
          this.dodged = true;
          this.step = 'dodge-reward';
          this.rewardRemaining = this.rewardDuration;
          return true;
        };
        _proto2.hit = function hit() {
          if (this.step !== 'practice') return false;
          this.step = 'practice-retry';
          this.retryRemaining = 2;
          return true;
        };
        _proto2.advance = function advance(seconds) {
          if (!Number.isFinite(seconds) || seconds <= 0) return null;
          if (this.step === 'practice-retry') {
            this.retryRemaining = Math.max(0, this.retryRemaining - Math.min(seconds, 0.1));
            if (this.retryRemaining > 1e-6) return null;
            this.retryRemaining = 0;
            this.step = 'practice';
            return this.step;
          }
          if (!this.rewarding) return null;
          this.rewardRemaining = Math.max(0, this.rewardRemaining - Math.min(seconds, 0.1));
          if (this.rewardRemaining > 1e-6) return null;
          this.rewardRemaining = 0;
          this.step = this.step === 'dodge-reward' ? 'fish' : this.step === 'collect-reward' ? 'shield' : this.step === 'shield-reward' ? 'shield-active' : 'ready';
          return this.step;
        };
        _proto2.picked = function picked(energy) {
          if (this.step !== 'fish' || !this.dodged || !Number.isFinite(energy) || energy < 100) return false;
          this.fish = 1;
          this.step = 'collect-reward';
          this.rewardRemaining = this.rewardDuration;
          return true;
        };
        _proto2.activatedShield = function activatedShield() {
          if (this.step !== 'shield') return false;
          this.step = 'shield-reward';
          this.rewardRemaining = this.rewardDuration;
          return true;
        };
        _proto2.pickedAi = function pickedAi(kind, removed) {
          if (this.step !== 'agent' || kind !== 'agent' || removed !== 2) return false;
          this.lowered = removed;
          this.step = 'agent-reward';
          this.rewardRemaining = this.rewardDuration;
          return true;
        };
        _proto2.shieldEnded = function shieldEnded(remaining) {
          if (this.step !== 'shield-active' || remaining !== 0) return false;
          this.step = 'agent';
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
          key: "introducing",
          get: function get() {
            return this.step === 'intro';
          }
        }, {
          key: "ready",
          get: function get() {
            return this.step === 'ready';
          }
        }, {
          key: "rewarding",
          get: function get() {
            return this.step === 'dodge-reward' || this.step === 'collect-reward' || this.step === 'shield-reward' || this.step === 'agent-reward';
          }
        }, {
          key: "playing",
          get: function get() {
            return ['practice', 'fish', 'shield', 'shield-reward', 'shield-active', 'agent'].includes(this.step);
          }
        }, {
          key: "feedback",
          get: function get() {
            return this.step === 'dodge-reward' ? TUTORIAL_COPY.dodgeSuccess : this.step === 'collect-reward' ? TUTORIAL_COPY.success : this.step === 'shield-reward' ? TUTORIAL_COPY.shieldSuccess : TUTORIAL_COPY.agentSuccess;
          }
        }, {
          key: "rewardDuration",
          get: function get() {
            return 1.15;
          }
        }, {
          key: "rewardProgress",
          get: function get() {
            return this.rewarding ? 1 - this.rewardRemaining / this.rewardDuration : 0;
          }
        }, {
          key: "title",
          get: function get() {
            if (this.step === 'practice') return '1/4  拖动躲避';
            if (this.step === 'practice-retry') return '负荷满啦，再试一次';
            if (this.step === 'fish') return '2/4  拾取小鱼';
            if (this.step === 'shield') return '3/4  双击免疫';
            if (this.step === 'shield-active') return '免疫生效中';
            if (this.step === 'agent') return '4/4  拾取 Agent';
            if (this.rewarding) return this.feedback;
            return '';
          }
        }, {
          key: "text",
          get: function get() {
            if (this.step === 'practice') return '碰到弹幕负荷 +1，满 3 格失败。\n先拖动躲开眼前的弹幕。';
            if (this.step === 'practice-retry') return '碰到弹幕负荷 +1，满 3 格失败。\n练习自动重来，拖动躲开吧。';
            if (this.step === 'fish') return '沿虚线拾鱼，充满最后 1 格护盾。';
            if (this.step === 'shield') return '护盾已满！松手后双击屏幕，\n获得 3 秒免疫。';
            if (this.step === 'shield-active') return '现在碰到弹幕也不会增加负荷。\n等护盾结束，学习减负。';
            if (this.step === 'agent') return '沿虚线拾取 Agent，\n降低 2 格工作负荷。';
            return '';
          }
        }]);
        return TutorialGuide;
      }());

      /** Records the first full charge until immunity is used; this tracker does not freeze gameplay or show a banner. */
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
        _proto3.advance = function advance(_dt) {/* Deliberately stays visible until released or reset. */};
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
        if (!shieldsUsed) goal = energy >= 100 ? '下一局：双击屏幕开启免疫' : '下一局：集满 5 条小鱼';else if (stats.elapsed < SIMPLE_WAVE_SECONDS) goal = "\u4E0B\u4E00\u5C40\uFF1A" + Math.max(1, Math.ceil(SIMPLE_WAVE_SECONDS - stats.elapsed)) + " \u79D2\u540E\u8FDB\u7B2C 2 \u6CE2";else if (stats.elapsed < HARD_START_SECONDS) goal = "\u4E0B\u4E00\u5C40\uFF1A" + Math.max(1, Math.ceil(HARD_START_SECONDS - stats.elapsed)) + " \u79D2\u540E\u8FDB\u7B2C 3 \u6CE2";else goal = "\u4E0B\u4E00\u5C40\uFF1A\u6311\u6218 " + Math.ceil((profile.bestScore + Math.max(100, profile.bestScore * 0.1)) / 100) * 100 + " \u5206";
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

System.register("chunks:///_virtual/GameInterface.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameLayout.ts', './GameExperience.ts', './FinalArtHud.ts', './OfficeSkin.ts', './GuideCatalog.ts', './OfficeUi.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, _createClass, cclegacy, Node, UITransform, Sprite, Graphics, Label, Color, SubContextView, LabelOutline, UIOpacity, Mask, ScrollView, DESIGN_WIDTH, HUD_SAFE_HEIGHT, formatClock, tutorialRewardPosition, tutorialPickupRoute, tutorialTapPosition, TUTORIAL_COPY, sliceFrame, OfficeSkin, GUIDE_PAGES, UI_METRICS, officeClose, officeRow, OFFICE, officeContains, officeUnderline, officeNotice, officeSwitch, officeChevron, officeButton;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
      Node = module.Node;
      UITransform = module.UITransform;
      Sprite = module.Sprite;
      Graphics = module.Graphics;
      Label = module.Label;
      Color = module.Color;
      SubContextView = module.SubContextView;
      LabelOutline = module.LabelOutline;
      UIOpacity = module.UIOpacity;
      Mask = module.Mask;
      ScrollView = module.ScrollView;
    }, function (module) {
      DESIGN_WIDTH = module.DESIGN_WIDTH;
      HUD_SAFE_HEIGHT = module.HUD_SAFE_HEIGHT;
      formatClock = module.formatClock;
      tutorialRewardPosition = module.tutorialRewardPosition;
      tutorialPickupRoute = module.tutorialPickupRoute;
      tutorialTapPosition = module.tutorialTapPosition;
    }, function (module) {
      TUTORIAL_COPY = module.TUTORIAL_COPY;
    }, function (module) {
      sliceFrame = module.sliceFrame;
    }, function (module) {
      OfficeSkin = module.OfficeSkin;
    }, function (module) {
      GUIDE_PAGES = module.GUIDE_PAGES;
    }, function (module) {
      UI_METRICS = module.UI_METRICS;
      officeClose = module.officeClose;
      officeRow = module.officeRow;
      OFFICE = module.OFFICE;
      officeContains = module.officeContains;
      officeUnderline = module.officeUnderline;
      officeNotice = module.officeNotice;
      officeSwitch = module.officeSwitch;
      officeChevron = module.officeChevron;
      officeButton = module.officeButton;
    }],
    execute: function () {
      cclegacy._RF.push({}, "24197RQHMZCyKLFOojDAew3", "GameInterface", undefined);
      var INK = OFFICE.ink;
      var CREAM = OFFICE.paper;

      /** Runtime UI uses the same cream, plum and green palette as the approved artwork. */
      var GameInterface = exports('GameInterface', /*#__PURE__*/function () {
        function GameInterface(parent) {
          this.friends = void 0;
          this.friendsEntry = void 0;
          this.friendsEntryInk = void 0;
          this.secondaryInk = void 0;
          this.friendsButton = {
            x: 0,
            y: 0,
            width: 194,
            height: 56
          };
          this.helpButton = {
            x: 0,
            y: 0,
            width: 532,
            height: 90
          };
          this.closeButton = {
            x: 0,
            y: 0,
            width: 54,
            height: 54
          };
          this.settingsHelp = void 0;
          this.settingsClose = void 0;
          this.settingsState = void 0;
          this.settingsPaintKey = '';
          this.helpRoot = void 0;
          this.helpScale = 1;
          this.helpBackBox = {
            x: 251,
            y: 407,
            width: 58,
            height: 58
          };
          this.skin = new OfficeSkin();
          this.panel = void 0;
          this.mainButton = void 0;
          this.settingsIcons = [];
          this.tutorialBadge = void 0;
          this.helpPaper = void 0;
          this.helpRows = [];
          this.helpTabs = [];
          this.helpFooter = void 0;
          this.helpPage = 'controls';
          this.helpPanel = void 0;
          this.helpTitle = void 0;
          this.helpCloseLabel = void 0;
          this.helpScroll = void 0;
          this.helpContent = void 0;
          this.helpViewport = void 0;
          this.helpHeight = 1080;
          this.helpViewportHeight = 690;
          this.safeCenter = 0;
          this.usableHeight = 1600;
          this.touchMinimum = 96;
          this.exitRoot = void 0;
          this.exitCancelBox = {
            x: -140,
            y: -96,
            width: 250,
            height: 88
          };
          this.exitConfirmBox = {
            x: 140,
            y: -96,
            width: 250,
            height: 88
          };
          this.pressedInk = void 0;
          this.guideFrames = new Map();
          this.root = void 0;
          this.modal = void 0;
          this.guideRoot = void 0;
          this.tutorialCueRoot = void 0;
          this.tapHandRoot = void 0;
          this.tapAnchor = void 0;
          this.tapStartedAt = 0;
          this.tutorialCue = void 0;
          this.tapHand = void 0;
          this.resumeRoot = void 0;
          this.countdown = void 0;
          this.primary = void 0;
          this.secondary = void 0;
          this.sound = void 0;
          this.guideText = void 0;
          this.guideTitle = void 0;
          this.score = void 0;
          this.rewardRoot = void 0;
          this.rewardLabel = void 0;
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
          this.rewardStars = void 0;
          this.rewardOpacity = void 0;
          this.fieldHeight = 1600;
          this.mode = 'hidden';
          this.resultClock = 0;
          this.previousMode = 'hidden';
          this.menuArt = void 0;
          this.loadingRoot = void 0;
          this.homeArt = void 0;
          this.homeBottom = void 0;
          this.homeNumberPatch = void 0;
          this.homeNumber = void 0;
          this.resultArt = void 0;
          this.resultBottom = void 0;
          this.footerPaper = void 0;
          this.homeFooterFrame = void 0;
          this.compactHomeFooterFrame = void 0;
          this.resultFooterFrame = void 0;
          this.stamp = void 0;
          this.stampInk = void 0;
          this.loadingPoster = void 0;
          this.loadingCanvas = void 0;
          this.loadingBackdrop = void 0;
          this.loadingFishPatch = void 0;
          this.loadingEmpty = void 0;
          this.loadingFill = void 0;
          this.loadingFishMask = void 0;
          this.loadingStatus = void 0;
          this.loadingFish = void 0;
          this.retryRoot = void 0;
          this.loadingReconnect = void 0;
          this.loadingProgress = 0;
          this.loading = false;
          this.loadingFailed = false;
          this.artFrames = [];
          this.homeFrame = void 0;
          this.compactHomeFrame = void 0;
          this.resultFrame = void 0;
          this.resultPatches = [];
          this.resultPatchBoxes = new Map();
          this.cardHeight = 1291;
          this.cardScale = 0.5;
          this.tutorialArt = void 0;
          this.tutorialIntroFrame = void 0;
          this.tutorialCompleteFrame = void 0;
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
          this.cardCenterX = 609;
          this.root = new Node('ExperienceInterface');
          parent.addChild(this.root);
          this.modal = new Node('MenuCard');
          this.root.addChild(this.modal);
          this.panel = this.skin.sprite(this.modal, 'PaintedOfficePanel', 'uiPanel', 620, 890, true);
          this.panel.node.active = false;
          this.board = this.graphics('MenuPaper', this.modal);
          this.mainButton = this.skin.sprite(this.modal, 'PaintedPrimaryButton', 'greenButton', 532, 94, true);
          this.mainButton.node.active = false;
          for (var _i = 0, _arr = ['speaker', 'book', 'trophy', 'home']; _i < _arr.length; _i++) {
            var key = _arr[_i];
            var icon = this.skin.sprite(this.modal, 'SettingsIcon-' + key, key, 76, 76);
            icon.node.active = false;
            this.settingsIcons.push(icon);
          }
          this.tutorialBadge = this.skin.sprite(this.modal, 'TutorialBadge', 'book', 220, 220);
          this.tutorialBadge.node.active = false;
          this.menuArt = new Node('ApprovedMenuArtwork');
          this.modal.addChild(this.menuArt);
          this.tutorialArt = this.artSprite('TutorialCardArtwork', this.modal);
          this.tutorialArt.node.active = false;
          this.homeArt = this.artSprite('HomeCard', this.menuArt);
          this.homeBottom = this.artSprite('HomeCardCompactBottom', this.menuArt);
          this.footerPaper = this.artSprite('MenuFooterPaper', this.menuArt);
          this.homeNumberPatch = this.artSprite('HomeRecordPatch', this.menuArt);
          this.homeNumber = this.label('LivePersonalBest', this.menuArt, 64, 0, 0, 260, 82);
          this.homeNumber.isBold = true;
          this.resultArt = this.artSprite('ResultCard', this.menuArt);
          this.resultBottom = this.artSprite('ResultCardBottom', this.menuArt);
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
          this.secondaryInk = this.graphics('TutorialEntryPaper', this.modal);
          this.secondary = this.label('SecondaryAction', this.modal, 19, 0, -269, 260, 38);
          this.sound = this.label('SoundToggle', this.modal, 14, 247, 255, 72, 38);
          this.tutorialCueRoot = new Node('TutorialPath');
          this.root.addChild(this.tutorialCueRoot);
          this.tutorialCue = this.graphics('DashedTargetPath', this.tutorialCueRoot);
          this.tapHandRoot = new Node('DoubleTapHand');
          this.root.addChild(this.tapHandRoot);
          this.tapHand = this.graphics('AnimatedFinger', this.tapHandRoot);
          var tapCaption = this.label('DoubleTapCaption', this.tapHandRoot, 25, 8, -144, 210, 38);
          tapCaption.string = '双击屏幕';
          tapCaption.isBold = true;
          tapCaption.color = OFFICE.paper;
          var tapOutline = tapCaption.node.addComponent(LabelOutline);
          tapOutline.color = INK.clone();
          tapOutline.width = 3;
          this.guideRoot = new Node('StepGuide');
          this.root.addChild(this.guideRoot);
          this.guideBoard = this.graphics('GuidePaper', this.guideRoot);
          this.guideTitle = this.label('GuideTitle', this.guideRoot, 28, 0, 43, 575, 40);
          this.guideTitle.isBold = true;
          this.guideText = this.label('GuideText', this.guideRoot, 26, 0, -15, 575, 80);
          this.guideText.lineHeight = 34;
          this.rewardRoot = new Node('TutorialAchievement');
          this.root.addChild(this.rewardRoot);
          this.rewardOpacity = this.rewardRoot.addComponent(UIOpacity);
          this.rewardStars = this.graphics('AchievementStars', this.rewardRoot);
          this.rewardLabel = this.label('AchievementText', this.rewardRoot, 32, 0, 0, 390, 54);
          this.rewardLabel.fontFamily = 'Arial';
          this.rewardLabel.isBold = true;
          this.rewardLabel.color = new Color(255, 213, 96);
          var outline = this.rewardLabel.node.addComponent(LabelOutline);
          outline.color = INK.clone();
          outline.width = 3;
          this.rewardLabel.string = TUTORIAL_COPY.success;
          this.rewardRoot.active = false;
          this.resumeRoot = new Node('ResumeCountdown');
          this.root.addChild(this.resumeRoot);
          this.countdown = this.label('CountdownNumber', this.resumeRoot, 144, 0, 0, 260, 180);
          this.countdown.isBold = true;
          this.countdown.color = new Color(255, 237, 153);
          var countdownOutline = this.countdown.node.addComponent(LabelOutline);
          countdownOutline.color = INK.clone();
          countdownOutline.width = 5;
          this.resumeRoot.active = false;
          this.stampInk = this.graphics('LiveRankStamp', this.menuArt);
          this.stamp = this.label('LiveRankLetter', this.menuArt, 94, 0, 0, 160, 144);
          this.stamp.color = new Color(176, 26, 219);
          this.stamp.isBold = true;
          this.loadingRoot = new Node('ApprovedLoadingScreen');
          this.root.addChild(this.loadingRoot);
          this.loadingBackdrop = this.graphics('LoadingBackdrop', this.loadingRoot);
          this.loadingCanvas = new Node('OriginalLoadingArtwork');
          this.loadingRoot.addChild(this.loadingCanvas);
          this.loadingPoster = this.artSprite('LoadingPoster', this.loadingCanvas);
          this.loadingPoster.node.getComponent(UITransform).setContentSize(1080, 2400);
          this.loadingFishPatch = this.artSprite('OriginalFishPositionPatch', this.loadingCanvas);
          this.loadingFishPatch.node.getComponent(UITransform).setContentSize(174, 132);
          this.loadingFishPatch.node.setPosition(416 + 87 - 540, 1200 - 2000 - 66);
          var track = new Node('OriginalProgressTrack');
          track.addComponent(UITransform).setContentSize(827, 82);
          this.loadingCanvas.addChild(track);
          track.setPosition(129 + 827 / 2 - 540, 1200 - 2026 - 41);
          track.addComponent(Mask).type = Mask.Type.GRAPHICS_STENCIL;
          var clip = track.getComponent(Graphics);
          clip.clear();
          clip.fillColor = Color.WHITE;
          clip.roundRect(-827 / 2, -41, 827, 82, 41);
          clip.fill();
          this.loadingEmpty = this.artSprite('OriginalEmptyTrack', track);
          this.loadingFill = this.artSprite('OriginalGreenFill', track);
          for (var _i2 = 0, _arr2 = [this.loadingEmpty, this.loadingFill]; _i2 < _arr2.length; _i2++) {
            var sprite = _arr2[_i2];
            sprite.node.getComponent(UITransform).setContentSize(827, 82);
          }
          this.loadingFishMask = new Node('OriginalLoadingFish');
          this.loadingCanvas.addChild(this.loadingFishMask);
          this.loadingFishMask.addComponent(UITransform).setContentSize(168, 130);
          this.loadingFishMask.addComponent(Mask).type = Mask.Type.GRAPHICS_STENCIL;
          var fishClip = this.loadingFishMask.getComponent(Graphics);
          fishClip.clear();
          // Clip the fish out of the approved opaque poster so moving it never drags
          // a rectangular piece of the printed bar or paper along with it.
          var fishContour = [[503, 2008], [487, 2012], [478, 2028], [459, 2040], [450, 2048], [439, 2038], [430, 2038], [423, 2046], [423, 2058], [430, 2070], [425, 2080], [423, 2092], [428, 2102], [437, 2107], [450, 2100], [461, 2093], [478, 2107], [490, 2113], [489, 2118], [497, 2125], [513, 2127], [527, 2121], [532, 2114], [550, 2107], [570, 2090], [583, 2073], [585, 2066], [580, 2055], [565, 2039], [543, 2025], [532, 2014], [519, 2007]];
          fishContour.forEach(function (_ref, i) {
            var x = _ref[0],
              y = _ref[1];
            return i ? fishClip.lineTo(x - 504, 2069 - y) : fishClip.moveTo(x - 504, 2069 - y);
          });
          fishClip.close();
          fishClip.fillColor = Color.WHITE;
          fishClip.fill();
          this.loadingFish = this.artSprite('OriginalFishTexture', this.loadingFishMask);
          this.loadingFish.node.getComponent(UITransform).setContentSize(168, 130);
          this.loadingReconnect = this.graphics('ReconnectNote', this.loadingRoot);
          this.loadingStatus = this.label('LoadingStatus', this.loadingRoot, 20, 16, 0, 550, 40);
          this.retryRoot = new Node('LoadingRetryCard');
          this.loadingRoot.addChild(this.retryRoot);
          this.skin.sprite(this.retryRoot, 'RetryPaintedPanel', 'uiPanel', 540, 330, true);
          var retryPaper = this.graphics('RetryActions', this.retryRoot);
          this.label('RetryTitle', this.retryRoot, 34, 0, 42, 420, 50).string = '加载失败';
          var retryButton = this.skin.sprite(this.retryRoot, 'RetryPaintedButton', 'greenButton', 432, 72, true);
          retryButton.node.setPosition(0, -74);
          var retryLabel = this.label('RetryButton', this.retryRoot, 28, 0, -74, 420, 62);
          retryLabel.string = '重新加载';
          retryLabel.isBold = true;
          this.retryRoot.active = false;
          this.loadingRoot.active = false;
          this.menuArt.active = false;
          this.friendsEntryInk = this.graphics('FriendsEntryPaper', this.modal);
          this.friendsEntry = this.label('FriendsLeaderboardEntry', this.modal, 21, -180, 390, 194, 56);
          this.friendsEntry.string = '好友积分榜';
          this.friendsEntry.isBold = true;
          this.settingsHelp = this.label('SettingsTutorial', this.modal, 28, 0, 0, 360, 70);
          this.settingsHelp.string = '摸鱼指南';
          this.settingsHelp.isBold = true;
          this.settingsClose = this.label('SettingsClose', this.modal, 34, 0, 0, 54, 54);
          this.settingsClose.string = '×';
          this.settingsClose.isBold = true;
          this.settingsState = this.label('SoundSwitchState', this.modal, 23, 0, 0, 40, 40);
          this.helpRoot = new Node('OfficeHelpCard');
          this.root.addChild(this.helpRoot);
          this.helpPanel = this.skin.sprite(this.helpRoot, 'HelpPaintedPanel', 'uiPanel', 620, 1080, true);
          this.helpPaper = this.graphics('HelpContents', this.helpRoot);
          var helpTitle = this.label('HelpTitle', this.helpRoot, 38, 0, 383, 420, 56);
          this.helpTitle = helpTitle;
          helpTitle.string = '摸鱼指南';
          helpTitle.isBold = true;
          var close = this.label('HelpClose', this.helpRoot, 40, 251, 407, 58, 58);
          this.helpCloseLabel = close;
          close.node.active = false;
          close.string = '×';
          close.isBold = true;
          for (var _iterator = _createForOfIteratorHelperLoose(['操作', '工作弹幕', '资源道具'].entries()), _step; !(_step = _iterator()).done;) {
            var _step$value = _step.value,
              _i3 = _step$value[0],
              name = _step$value[1];
            var tab = this.label('HelpTab' + _i3, this.helpRoot, 25, (_i3 - 1) * 178, 310, 166, 64);
            tab.string = name;
            tab.isBold = true;
            this.helpTabs.push(tab);
          }
          this.helpViewport = new Node('GuideScrollViewport');
          this.helpRoot.addChild(this.helpViewport);
          this.helpViewport.addComponent(UITransform).setContentSize(548, 690);
          this.helpViewport.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
          this.helpContent = new Node('GuideScrollContent');
          this.helpViewport.addChild(this.helpContent);
          this.helpContent.addComponent(UITransform).setAnchorPoint(0.5, 1);
          this.helpScroll = this.helpViewport.addComponent(ScrollView);
          this.helpScroll.content = this.helpContent;
          this.helpScroll.horizontal = false;
          this.helpScroll.vertical = true;
          this.helpScroll.inertia = true;
          for (var i = 0; i < 4; i++) {
            var _paper = this.graphics('GuideRowPaper' + i, this.helpContent);
            var _icon = this.artSprite('HelpIcon' + i, this.helpContent);
            var title = this.label('HelpTip' + i, this.helpContent, 30, 45, 0, 352, 44);
            title.isBold = true;
            title.horizontalAlign = Label.HorizontalAlign.LEFT;
            var body = this.label('HelpBody' + i, this.helpContent, UI_METRICS.body, 45, 0, 352, 140);
            body.enableWrapText = true;
            body.lineHeight = 39;
            body.horizontalAlign = Label.HorizontalAlign.LEFT;
            body.color = OFFICE.muted.clone();
            this.helpRows.push({
              title: title,
              body: body,
              icon: _icon,
              paper: _paper
            });
          }
          this.helpFooter = this.label('HelpFooter', this.helpRoot, 24, 0, -480, 540, 44);
          this.helpFooter.color = OFFICE.muted.clone();
          this.selectHelp('controls');
          this.helpRoot.active = false;
          this.friends = new FriendLeaderboardView(this.root);
          this.exitRoot = new Node('ExitRunConfirmation');
          this.root.addChild(this.exitRoot);
          var shade = this.graphics('ExitShade', this.exitRoot);
          shade.fillColor = new Color(31, 21, 40, 170);
          shade.rect(-360, -2500, 720, 5000);
          shade.fill();
          var dialog = new Node('ExitDialog');
          this.exitRoot.addChild(dialog);
          var paper = this.graphics('ExitPaper', dialog);
          officeNotice(paper, 620, 370);
          this.label('ExitTitle', dialog, 38, 0, 108, 540, 56).string = '返回首页？';
          var explanation = this.label('ExitExplanation', dialog, 28, 0, 27, 540, 70);
          explanation.string = '将结束本局，并保存本局成绩。';
          explanation.enableWrapText = true;
          explanation.lineHeight = 38;
          officeButton(paper, this.exitCancelBox);
          officeButton(paper, this.exitConfirmBox, 'cream');
          this.label('ExitKeepPlaying', dialog, 30, -140, -96, 230, 64).string = '继续摸鱼';
          this.label('ExitReturnHome', dialog, 30, 140, -96, 230, 64).string = '返回首页';
          this.exitRoot.active = false;
          this.pressedInk = this.graphics('ButtonPressFeedback', this.root);
        }
        var _proto = GameInterface.prototype;
        _proto.artSprite = function artSprite(name, parent) {
          var node = new Node(name);
          node.addComponent(UITransform);
          parent.addChild(node);
          var sprite = node.addComponent(Sprite);
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          return sprite;
        };
        _proto.slice = function slice(frame, x, y, width, height) {
          var cropped = sliceFrame(frame, x, y, width, height);
          this.artFrames.push(cropped);
          return cropped;
        };
        _proto.place = function place(sprite, x, y, width, height) {
          sprite.node.setPosition(x + width / 2 - this.cardCenterX, this.cardHeight / 2 - y - height / 2);
          sprite.node.getComponent(UITransform).setContentSize(width, height);
        };
        _proto.patch = function patch(frame, name, box, source) {
          var sprite = this.artSprite(name, this.menuArt);
          sprite.spriteFrame = this.slice(frame, source[0], source[1], source[2], source[3]);
          this.place(sprite, box[0], box[1], box[2], box[3]);
          this.resultPatches.push(sprite);
          this.resultPatchBoxes.set(sprite, box);
        };
        _proto.setArt = function setArt(key, frame) {
          this.skin.setArt(key, frame);
          this.friends.setArt(key, frame);
          this.guideFrames.set(key, frame);
          if (this.helpRoot.active) this.selectHelp(this.helpPage);
          if (key === 'tutorialIntroUI') {
            this.tutorialIntroFrame = frame;
          } else if (key === 'tutorialCompleteUI') {
            this.tutorialCompleteFrame = frame;
          } else if (key === 'homeUI') {
            this.homeFrame = this.slice(frame, 0, 0, 1218, 1200);
            this.compactHomeFrame = this.slice(frame, 0, 0, 1218, 1060);
            this.homeBottom.spriteFrame = this.slice(frame, 0, 1200, 1218, 91);
            // Extend the exact final scanlines so the side borders meet without a notch.
            this.homeFooterFrame = this.slice(frame, 0, 1198, 1218, 2);
            this.compactHomeFooterFrame = this.slice(frame, 0, 1058, 1218, 2);
            this.homeNumberPatch.spriteFrame = this.slice(frame, 939, 1107, 12, 77);
          } else if (key === 'resultUI') {
            this.resultFrame = this.slice(frame, 0, 0, 1218, 1200);
            this.resultArt.spriteFrame = this.resultFrame;
            this.resultBottom.spriteFrame = this.slice(frame, 0, 1200, 1218, 91);
            this.resultFooterFrame = this.slice(frame, 0, 1198, 1218, 2);
            this.patch(frame, 'RankPatch', [380, 474, 328, 62], [710, 474, 12, 62]);
            this.patch(frame, 'StampPatch', [777, 418, 240, 162], [748, 418, 12, 162]);
            this.patch(frame, 'ScorePatch', [330, 550, 455, 143], [790, 550, 16, 143]);
            for (var i = 0; i < 3; i++) this.patch(frame, "StatPatch" + i, [177 + i * 282, 795, 207, 62], [348 + i * 282, 795, 12, 62]);
            this.patch(frame, 'SkillsPatch', [351, 887, 390, 47], [210, 887, 12, 47]);
            this.patch(frame, 'GoalPatch', [301, 962, 590, 60], [903, 962, 12, 60]);
            // All live labels must remain above the artwork and its printed-value patches.
            this.stampInk.node.setSiblingIndex(this.menuArt.children.length - 1);
            this.stamp.node.setSiblingIndex(this.menuArt.children.length - 1);
          } else if (key === 'loadingUI') {
            this.loadingPoster.spriteFrame = frame;
            this.loadingFishPatch.spriteFrame = this.slice(frame, 745, 2000, 8, 132);
            this.loadingEmpty.spriteFrame = this.slice(frame, 800, 2026, 8, 82);
            this.loadingFill.spriteFrame = this.slice(frame, 250, 2026, 8, 82);
            // Creator's filled-sprite assembler needs a texture before updating UVs.
            this.loadingFill.type = Sprite.Type.FILLED;
            this.loadingFill.fillType = Sprite.FillType.HORIZONTAL;
            this.loadingFill.fillStart = 0;
            this.loadingFish.spriteFrame = this.slice(frame, 420, 2004, 168, 130);
          }
        };
        _proto.destroy = function destroy() {
          this.skin.destroy();
          this.friends.destroy();
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.artFrames), _step2; !(_step2 = _iterator2()).done;) {
            var frame = _step2.value;
            frame.destroy();
          }
        };
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
        _proto.resize = function resize(height, viewport) {
          if (viewport === void 0) {
            viewport = {
              cssWidth: 360,
              safeTop: 0,
              safeBottom: 0
            };
          }
          this.tapAnchor = undefined;
          this.fieldHeight = height;
          this.usableHeight = Math.max(640, height - viewport.safeTop - viewport.safeBottom);
          this.safeCenter = (viewport.safeBottom - viewport.safeTop) / 2;
          this.touchMinimum = UI_METRICS.touchPixels * DESIGN_WIDTH / Math.max(1, viewport.cssWidth);
          this.modal.setPosition(0, this.safeCenter);
          this.friends.resize(height, this.usableHeight, this.safeCenter, this.touchMinimum);
          this.resumeRoot.setPosition(0, this.safeCenter);
          this.helpScale = Math.min(1, (DESIGN_WIDTH - 64) / 620);
          this.helpRoot.setScale(this.helpScale, this.helpScale);
          this.helpRoot.setPosition(0, this.safeCenter);
          this.exitRoot.setPosition(0, this.safeCenter);
          var exitScale = Math.min(1, (DESIGN_WIDTH - 64) / 620);
          this.exitRoot.getChildByName('ExitDialog').setScale(exitScale, exitScale);
          this.selectHelp(this.helpPage);
          this.rewardRoot.setPosition(0, 60);
          this.guideRoot.setPosition(0, -height / 2 + viewport.safeBottom + 122);
          this.tutorialCue.getComponent(UITransform).setContentSize(DESIGN_WIDTH, height);
        };
        _proto.showHelp = function showHelp() {
          this.helpRoot.active = true;
          this.selectHelp('controls');
        };
        _proto.selectHelp = function selectHelp(page) {
          var _this = this;
          this.helpPage = page;
          var data = GUIDE_PAGES[page],
            g = this.helpPaper;
          g.clear();
          var rowHeight = 152,
            pitch = 168,
            contentHeight = data.rows.length * pitch - 16;
          // Keep the frame, tabs and close target stationary when switching pages.
          // Four resource rows scroll inside the same three-row reading window.
          this.helpHeight = Math.min(832, (this.usableHeight - 96) / this.helpScale);
          this.skin.size(this.helpPanel, 620, this.helpHeight);
          this.helpTitle.node.setPosition(0, this.helpHeight / 2 - 108);
          this.helpTabs.forEach(function (tab, i) {
            return tab.node.setPosition((i - 1) * 178, _this.helpHeight / 2 - 184);
          });
          this.helpBackBox.y = this.helpHeight / 2 - 108;
          this.helpBackBox.x = 248;
          this.helpViewportHeight = this.helpHeight - 344;
          this.helpViewport.getComponent(UITransform).setContentSize(548, this.helpViewportHeight);
          this.helpViewport.setPosition(0, -72);
          this.helpFooter.node.setPosition(0, -this.helpHeight / 2 + 48);
          officeClose(g, this.helpBackBox);
          for (var _iterator3 = _createForOfIteratorHelperLoose(['controls', 'bullets', 'resources'].entries()), _step3; !(_step3 = _iterator3()).done;) {
            var _step3$value = _step3.value,
              i = _step3$value[0],
              key = _step3$value[1];
            officeRow(g, {
              x: (i - 1) * 178,
              y: this.helpTabs[i].node.position.y,
              width: 166,
              height: 72
            }, key === page);
            this.helpTabs[i].color = key === page ? new Color(28, 114, 62) : OFFICE.muted.clone();
          }
          this.helpContent.getComponent(UITransform).setContentSize(548, Math.max(this.helpViewportHeight, contentHeight));
          this.helpContent.setPosition(0, this.helpViewportHeight / 2);
          this.helpRows.forEach(function (row, i) {
            var item = data.rows[i],
              visible = !!item;
            row.title.node.active = row.body.node.active = row.icon.node.active = visible;
            row.paper.node.active = visible;
            if (!item) return;
            var y = -i * pitch - rowHeight / 2;
            row.paper.clear();
            officeRow(row.paper, {
              x: 0,
              y: y,
              width: 500,
              height: rowHeight
            });
            var textX = item.icon ? -112 : -222,
              textWidth = item.icon ? 334 : 444;
            row.title.node.setPosition(textX, y + 38);
            row.title.node.getComponent(UITransform).setAnchorPoint(0, 0.5);
            row.title.node.getComponent(UITransform).setContentSize(textWidth, 44);
            row.body.node.setPosition(textX, y - 26);
            row.body.node.getComponent(UITransform).setAnchorPoint(0, 0.5);
            row.body.node.getComponent(UITransform).setContentSize(textWidth, 72);
            row.body.lineHeight = 36;
            row.title.string = item.title;
            row.body.string = item.body;
            row.icon.node.active = !!item.icon;
            row.icon.spriteFrame = _this.guideFrames.get(item.icon) || null;
            var frame = row.icon.spriteFrame,
              ratio = frame ? frame.rect.width / frame.rect.height : 1;
            var w = ratio >= 1 ? 100 : 100 * ratio,
              h = ratio >= 1 ? 100 / ratio : 100;
            row.icon.node.getComponent(UITransform).setContentSize(w, h);
            row.icon.node.setPosition(-186, y);
          });
          this.helpScroll.stopAutoScroll();
          this.helpScroll.scrollToTop(0);
          this.helpFooter.string = [contentHeight > this.helpViewportHeight + 1 ? '上滑查看更多' : '', data.footer].filter(Boolean).join(' · ');
          this.helpFooter.node.active = !!this.helpFooter.string;
        };
        _proto.hideHelp = function hideHelp() {
          this.helpRoot.active = false;
        };
        _proto.showExitConfirmation = function showExitConfirmation() {
          this.setPressed(null);
          this.exitRoot.active = true;
        };
        _proto.hideExitConfirmation = function hideExitConfirmation() {
          this.exitRoot.active = false;
          this.setPressed(null);
        }

        /** The overlay changes only on pointer transitions, never rebuilds an entire menu. */;
        _proto.setPressed = function setPressed(action, point) {
          var g = this.pressedInk;
          if (!g) return;
          g.clear();
          if (!action || !point) return;
          var b,
            scale = 1,
            offsetY = this.modal.position.y;
          var x = point.x - DESIGN_WIDTH / 2,
            y = point.y - this.fieldHeight / 2;
          if (this.exitOpen) {
            b = action === 'exit-confirm' ? this.exitConfirmBox : this.exitCancelBox;
            offsetY = this.safeCenter;
          } else if (this.friends.open) {
            var region = this.friends.feedbackBox(action);
            if (region) b = region;
            scale = this.friends.scaleValue;
            offsetY = this.safeCenter;
          } else if (this.helpOpen) {
            scale = this.helpScale;
            offsetY = this.safeCenter;
            if (action === 'help-close') b = this.helpBackBox;else {
              var i = ['help-controls', 'help-bullets', 'help-resources'].indexOf(action);
              if (i >= 0) b = {
                x: (i - 1) * 178,
                y: this.helpTabs[i].node.position.y,
                width: 166,
                height: 72
              };
            }
          } else if (action === 'help') b = this.helpButton;else if (action === 'friends') b = this.friendsButton;else if (action === 'primary' && this.mode === 'paused' && officeContains(this.closeButton, x, y - offsetY, this.touchMinimum)) b = this.closeButton;else if (action === 'primary' || action === 'secondary' || action === 'sound') b = this.buttons[action];
          if (!b) return;
          g.fillColor = new Color(48, 15, 59, 44);
          g.roundRect((b.x - b.width / 2) * scale, (b.y - b.height / 2) * scale + offsetY, b.width * scale, b.height * scale, Math.min(20, b.height / 2) * scale);
          g.fill();
        };
        _proto.update = function update(mode, profile, result, elapsed, dt) {
          this.mode = mode;
          if (mode !== this.previousMode) this.resultClock = 0;
          this.previousMode = mode;
          this.resultClock += dt;
          this.resumeRoot.active = mode === 'resuming';
          this.menuArt.active = false;
          this.modal.setScale(1, 1);
          this.tutorialArt.node.active = false;
          this.panel.node.active = this.mainButton.node.active = this.tutorialBadge.node.active = false;
          this.settingsIcons.forEach(function (icon) {
            return icon.node.active = mode === 'paused';
          });
          this.settingsHelp.node.active = this.settingsClose.node.active = this.settingsState.node.active = mode === 'paused';
          if (mode !== 'paused') this.settingsPaintKey = '';
          this.modal.setPosition(0, -HUD_SAFE_HEIGHT / 2);
          this.title.node.active = this.subtitle.node.active = this.primary.node.active = true;
          this.primary.color = INK.clone();
          this.secondary.color = this.sound.color = INK.clone();
          this.buttons.primary.x = 0;
          this.buttons.sound.x = 247;
          Object.assign(this.buttons.secondary, {
            x: 0,
            width: 270,
            height: 40
          });
          this.secondary.fontSize = 19;
          this.secondary.lineHeight = 24;
          this.secondary.isBold = false;
          this.secondary.node.getComponent(UITransform).setContentSize(260, 38);
          this.secondaryInk.clear();
          this.secondaryInk.node.active = false;
          this.footerPaper.node.active = this.resultBottom.node.active = false;
          this.buttons.primary.width = 480;
          this.buttons.primary.height = 60;
          this.modal.active = mode === 'home' || mode === 'paused' || mode === 'result' || mode === 'tutorial-intro' || mode === 'tutorial-ready';
          this.friendsEntry.node.active = this.friendsEntryInk.node.active = mode === 'home' || mode === 'result' || mode === 'paused';
          this.friendsEntry.string = mode === 'paused' ? '好友排行' : '好友积分榜';
          if (this.friends.open || this.helpOpen) {
            this.modal.active = false;
            return;
          }
          if (!this.modal.active) return;
          var isResult = mode === 'result';
          var isReady = mode === 'tutorial-ready';
          var isIntro = mode === 'tutorial-intro';
          for (var _i4 = 0, _arr3 = [this.rank, this.score, this.detail, this.goal].concat(this.statTitles, this.statValues); _i4 < _arr3.length; _i4++) {
            var label = _arr3[_i4];
            label.node.active = isResult;
          }
          this.hero.node.active = mode === 'home';
          this.record.node.active = !isIntro && !isReady && (mode !== 'home' || profile.runs > 0);
          this.sound.node.active = mode === 'paused';
          this.title.fontSize = isResult ? 30 : isIntro ? 29 : isReady ? 34 : 44;
          this.title.lineHeight = this.title.fontSize + 6;
          this.title.enableWrapText = isIntro;
          this.title.node.getComponent(UITransform).setContentSize(isIntro ? 510 : 430, isIntro ? 86 : 54);
          this.title.string = isResult ? '摸鱼成绩单' : isIntro ? TUTORIAL_COPY.introTitle : isReady ? TUTORIAL_COPY.completeTitle : mode === 'paused' ? '摸鱼设置' : '摸鱼请走位';
          this.title.node.setPosition(0, isResult ? 249 : isIntro ? 180 : 171);
          this.subtitle.string = isResult ? '工作堆满，回去开工' : isIntro ? TUTORIAL_COPY.introSubtitle : isReady ? TUTORIAL_COPY.completeSubtitle : mode === 'paused' ? '调整声音，准备好了继续摸鱼' : '躲开工作，享受片刻摸鱼';
          this.subtitle.enableWrapText = isIntro;
          this.subtitle.node.getComponent(UITransform).setContentSize(510, isIntro ? 64 : 32);
          this.subtitle.node.setPosition(0, isResult ? 210 : isIntro ? 83 : 115);
          this.hero.node.getComponent(UITransform).setContentSize(isIntro ? 132 : isReady ? 168 : 170, isIntro ? 132 : isReady ? 168 : 170);
          this.hero.node.setPosition(0, isIntro ? -45 : isReady ? 0 : 35);
          this.sound.string = profile.soundEnabled ? '声音 开' : '声音 关';
          var buttonY = isResult ? -212 : isIntro ? -172 : isReady ? -174 : -118;
          this.buttons.primary.y = buttonY;
          this.buttons.secondary.y = isResult ? -269 : -179;
          this.buttons.sound.y = isResult ? 255 : 217;
          this.primary.node.setPosition(0, buttonY);
          this.secondary.node.setPosition(0, this.buttons.secondary.y);
          this.sound.node.setPosition(247, this.buttons.sound.y);
          this.primary.string = isResult ? '再来一局' : isIntro ? TUTORIAL_COPY.practice : isReady ? TUTORIAL_COPY.start : mode === 'paused' ? '继续摸鱼' : '开始摸鱼';
          this.secondary.node.active = mode === 'home' || mode === 'paused';
          this.secondary.string = mode === 'home' ? '操作教学' : '返回首页';
          this.record.node.setPosition(0, isResult ? 44 : -45);
          this.record.node.getComponent(UITransform).setContentSize(510, 36);
          this.record.enableWrapText = false;
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
          } else this.record.string = isIntro || isReady ? '' : mode === 'paused' ? "\u5DF2\u6478\u9C7C " + formatClock(elapsed) : profile.runs > 0 ? "\u4E2A\u4EBA\u6700\u4F73 " + profile.bestScore + " \u5206 \xB7 \u6700\u4E45 " + formatClock(profile.bestSeconds) : '拖动躲避 · 集鱼开盾';
          if (mode === 'paused') {
            this.layoutSettings(profile);
            return;
          }
          this.drawBoard(isResult);
          if (isIntro && this.tutorialIntroFrame || isReady && this.tutorialCompleteFrame) {
            this.layoutTutorial(isIntro);
            return;
          }
          if (mode === 'home' && this.homeFrame || isResult && this.resultFrame && result) {
            this.layoutApproved(mode === 'home', profile, result);
          }
          if (this.friendsEntry.node.active) {
            if (!this.menuArt.active) {
              Object.assign(this.friendsButton, {
                x: 0,
                y: -280,
                width: 240,
                height: 48
              });
            }
            var b = this.friendsButton;
            this.friendsEntry.node.setPosition(b.x, b.y);
            this.friendsEntry.node.getComponent(UITransform).setContentSize(b.width - 12, b.height);
            this.friendsEntry.fontSize = this.menuArt.active ? 36 * this.cardScale : 21;
            this.friendsEntry.lineHeight = this.friendsEntry.fontSize + 5;
            var g = this.friendsEntryInk;
            g.clear();
            this.drawFooterButton(g, b, true);
          }
        };
        _proto.layoutTutorial = function layoutTutorial(intro) {
          this.board.clear();
          this.modal.setPosition(0, this.safeCenter);
          var s = Math.min(1, (DESIGN_WIDTH - 96) / 656, (this.usableHeight - 144) / (intro ? 536 : 360));
          this.panel.node.active = intro;
          if (intro) {
            this.skin.size(this.panel, 620 * s, 450 * s);
            officeUnderline(this.board, 330 * s, 83 * s);
          } else officeNotice(this.board, 620 * s, 300 * s);
          this.tutorialArt.node.active = false;
          this.hero.node.active = this.record.node.active = false;
          this.title.node.active = this.subtitle.node.active = true;
          this.title.string = intro ? TUTORIAL_COPY.introTitle : TUTORIAL_COPY.completeTitle;
          this.title.isBold = true;
          this.title.fontSize = (intro ? 44 : 38) * s;
          this.title.lineHeight = this.title.fontSize + 6 * s;
          this.title.node.setPosition(0, (intro ? 126 : 90) * s);
          this.title.node.getComponent(UITransform).setContentSize(510 * s, 60 * s);
          this.subtitle.string = intro ? TUTORIAL_COPY.introSubtitle.replace('之前', '之前\n') : TUTORIAL_COPY.completeSubtitle;
          this.subtitle.fontSize = 28 * s;
          this.subtitle.lineHeight = 38 * s;
          this.subtitle.enableWrapText = true;
          this.subtitle.color = OFFICE.muted.clone();
          this.subtitle.node.setPosition(0, (intro ? 4 : 15) * s);
          this.subtitle.node.getComponent(UITransform).setContentSize((intro ? 450 : 490) * s, 88 * s);
          this.tutorialBadge.node.active = false;
          var buttonY = (intro ? -132 : -90) * s,
            buttonHeight = (intro ? 88 : 76) * s;
          Object.assign(this.buttons.primary, {
            x: 0,
            y: buttonY,
            width: 532 * s,
            height: buttonHeight
          });
          this.mainButton.node.active = true;
          this.mainButton.node.setPosition(0, buttonY);
          this.skin.size(this.mainButton, 532 * s, buttonHeight);
          this.primary.node.setPosition(0, buttonY);
          this.primary.fontSize = 34 * s;
          this.primary.node.getComponent(UITransform).setContentSize(500 * s, 70 * s);
          this.primary.color = INK.clone();
        };
        _proto.layoutSettings = function layoutSettings(profile) {
          var _this2 = this;
          this.modal.setPosition(0, this.safeCenter);
          var s = Math.min(1, (DESIGN_WIDTH - 72) / 644, (this.usableHeight - 96) / 850);
          var box = function box(x, y, width, height) {
            return {
              x: x * s,
              y: y * s,
              width: width * s,
              height: height * s
            };
          };
          var label = function label(l, x, y, width, height, size) {
            l.node.setPosition(x * s, y * s);
            l.node.getComponent(UITransform).setContentSize(width * s, height * s);
            l.fontSize = size * s;
            l.lineHeight = l.fontSize + 5;
            l.isBold = true;
            l.color = INK.clone();
          };
          var rows = [170, 50, -70];
          Object.assign(this.buttons.sound, box(0, rows[0], 532, 90));
          Object.assign(this.helpButton, box(0, rows[1], 532, 90));
          Object.assign(this.friendsButton, box(0, rows[2], 532, 90));
          Object.assign(this.buttons.primary, box(0, -190, 532, 94));
          Object.assign(this.buttons.secondary, box(0, -312, 204, 64));
          Object.assign(this.closeButton, box(248, 280, 56, 56));
          label(this.title, 0, 280, 440, 60, 43);
          this.subtitle.node.active = this.record.node.active = false;
          this.sound.string = '声音';
          label(this.sound, 0, rows[0], 300, 70, 30);
          label(this.settingsHelp, 0, rows[1], 300, 70, 30);
          label(this.friendsEntry, 0, rows[2], 300, 70, 30);
          label(this.primary, 0, -190, 510, 80, 39);
          label(this.secondary, 0, -312, 174, 54, 29);
          this.settingsClose.node.active = false;
          this.settingsState.string = profile.soundEnabled ? '开' : '关';
          label(this.settingsState, profile.soundEnabled ? 166 : 207, rows[0], 35, 44, 22);
          this.friendsEntryInk.node.active = this.secondaryInk.node.active = false;
          var key = s + ":" + profile.soundEnabled;
          this.panel.node.active = this.mainButton.node.active = true;
          this.skin.size(this.panel, 620 * s, 790 * s);
          this.skin.size(this.mainButton, 532 * s, 94 * s);
          this.mainButton.node.setPosition(0, -190 * s);
          this.settingsIcons.forEach(function (icon, i) {
            icon.node.active = i < 3;
            _this2.skin.size(icon, 76 * s, 76 * s);
            icon.node.setPosition(-178 * s, (rows[i] || 0) * s);
          });
          if (key === this.settingsPaintKey) return;
          this.settingsPaintKey = key;
          var g = this.board;
          g.clear();
          rows.forEach(function (y) {
            return officeRow(g, box(0, y, 500, 90));
          });
          officeSwitch(g, box(185, rows[0], 110, 54), profile.soundEnabled);
          officeChevron(g, 232 * s, rows[1] * s, 22 * s);
          officeChevron(g, 232 * s, rows[2] * s, 22 * s);
          officeButton(g, this.buttons.secondary, 'cream');
          officeClose(g, this.closeButton);
        };
        _proto.layoutApproved = function layoutApproved(home, profile, result) {
          var _this3 = this;
          // The result artwork has wider transparent padding on the right. Center its
          // paper/replay button, and use the same origin for artwork, labels and input.
          this.cardCenterX = home ? 609 : 558.5;
          var hasRecord = profile.runs > 0;
          var contentHeight = home && !hasRecord ? 1060 : 1200;
          var footerHeight = 140;
          this.cardHeight = contentHeight + footerHeight + 91;
          this.cardScale = Math.min((DESIGN_WIDTH - 24) / 1218, (this.usableHeight - 120) / this.cardHeight);
          this.modal.setPosition(0, this.safeCenter);
          this.menuArt.active = true;
          this.menuArt.setScale(this.cardScale, this.cardScale);
          this.board.clear();
          this.homeArt.node.active = this.homeBottom.node.active = home;
          this.homeNumberPatch.node.active = this.homeNumber.node.active = home && hasRecord;
          this.homeArt.spriteFrame = hasRecord ? this.homeFrame : this.compactHomeFrame;
          this.place(this.homeArt, 0, 0, 1218, contentHeight);
          this.place(this.homeBottom, 0, contentHeight + footerHeight, 1218, 91);
          this.footerPaper.node.active = true;
          this.footerPaper.spriteFrame = home ? hasRecord ? this.homeFooterFrame : this.compactHomeFooterFrame : this.resultFooterFrame;
          this.place(this.footerPaper, 0, contentHeight, 1218, footerHeight);
          this.place(this.homeNumberPatch, 621, 1107, 249, 77);
          this.homeNumber.string = String(Math.floor(profile.bestScore)).padStart(6, '0');
          this.homeNumber.node.setPosition(747 - this.cardCenterX, this.cardHeight / 2 - 1146);
          this.resultArt.node.active = this.resultBottom.node.active = !home;
          this.place(this.resultArt, 0, 0, 1218, 1200);
          this.place(this.resultBottom, 0, contentHeight + footerHeight, 1218, 91);
          for (var _iterator4 = _createForOfIteratorHelperLoose(this.resultPatches), _step4; !(_step4 = _iterator4()).done;) {
            var patch = _step4.value;
            patch.node.active = !home;
            var box = this.resultPatchBoxes.get(patch);
            this.place(patch, box[0], box[1], box[2], box[3]);
          }
          this.stamp.node.active = this.stampInk.node.active = !home;
          for (var _i5 = 0, _arr4 = [this.title, this.subtitle, this.hero, this.record]; _i5 < _arr4.length; _i5++) {
            var label = _arr4[_i5];
            label.node.active = false;
          }
          // Button copy is already drawn in the supplied artwork; preserve the logical label for QA/input.
          this.primary.color = new Color(0, 0, 0, 0);
          var button = home ? [193, 851, 823, 180] : [169, 1057, 779, 128];
          Object.assign(this.buttons.primary, {
            x: (button[0] + button[2] / 2 - this.cardCenterX) * this.cardScale,
            y: (this.cardHeight / 2 - button[1] - button[3] / 2) * this.cardScale,
            width: button[2] * this.cardScale,
            height: button[3] * this.cardScale
          });
          this.primary.node.setPosition(this.buttons.primary.x, this.buttons.primary.y);
          var footerY = (this.cardHeight / 2 - contentHeight - footerHeight / 2) * this.cardScale;
          Object.assign(this.friendsButton, {
            x: home ? -214 * this.cardScale : this.buttons.primary.x,
            y: footerY,
            width: (home ? 382 : 700) * this.cardScale,
            height: 92 * this.cardScale
          });
          Object.assign(this.buttons.secondary, {
            x: 214 * this.cardScale,
            y: footerY,
            width: 382 * this.cardScale,
            height: 92 * this.cardScale
          });
          this.secondary.node.setPosition(this.buttons.secondary.x, footerY);
          this.secondary.node.getComponent(UITransform).setContentSize(this.buttons.secondary.width - 12, this.buttons.secondary.height);
          this.secondary.fontSize = 36 * this.cardScale;
          this.secondary.lineHeight = this.secondary.fontSize + 5;
          this.secondary.color = INK.clone();
          this.secondary.isBold = true;
          this.secondaryInk.node.active = home;
          if (home) this.drawFooterButton(this.secondaryInk, this.buttons.secondary, false);
          if (home || !result) return;
          var live = function live(label, x, y, width, height, size) {
            label.node.setPosition((x + width / 2 - _this3.cardCenterX) * _this3.cardScale, (_this3.cardHeight / 2 - y - height / 2) * _this3.cardScale);
            label.node.getComponent(UITransform).setContentSize(width * _this3.cardScale, height * _this3.cardScale);
            label.fontSize = size * _this3.cardScale;
            label.lineHeight = label.fontSize + 4;
            label.color = new Color(38, 7, 48);
          };
          live(this.rank, 370, 469, 358, 70, 48);
          live(this.score, 327, 554, 464, 136, 112);
          this.statValues.forEach(function (label, i) {
            return live(label, 165 + i * 282, 793, 221, 65, 54);
          });
          for (var _iterator5 = _createForOfIteratorHelperLoose(this.statTitles), _step5; !(_step5 = _iterator5()).done;) {
            var _label = _step5.value;
            _label.node.active = false;
          }
          live(this.detail, 327, 882, 455, 55, 35);
          live(this.goal, 299, 960, 589, 63, 33);
          this.goal.color = new Color(8, 78, 40);
          var sx = 866 - this.cardCenterX,
            sy = this.cardHeight / 2 - 497;
          this.stamp.string = result.rank.charAt(0);
          this.stamp.node.setPosition(sx, sy);
          var ink = this.stampInk;
          ink.clear();
          var purple = new Color(176, 26, 219),
            paper = new Color(255, 244, 217);
          // Filled rings stay crisp when the complete card scales down on a phone.
          for (var _i6 = 0, _arr5 = [[73, purple], [67, paper], [63, purple], [59, paper]]; _i6 < _arr5.length; _i6++) {
            var _arr5$_i = _arr5[_i6],
              radius = _arr5$_i[0],
              color = _arr5$_i[1];
            ink.fillColor = color;
            ink.circle(sx, sy, radius);
            ink.fill();
          }
          ink.strokeColor = purple;
          ink.lineWidth = 6;
          for (var i = 0; i < 3; i++) {
            ink.moveTo(sx + 82, sy + 38 - i * 38);
            ink.bezierCurveTo(sx + 105, sy + 63 - i * 38, sx + 118, sy + 13 - i * 38, sx + 145, sy + 38 - i * 38);
            ink.stroke();
          }
        };
        _proto.drawFooterButton = function drawFooterButton(g, b, emphasized) {
          g.clear();
          officeButton(g, b, emphasized ? 'gold' : 'cream');
        };
        _proto.updateCountdown = function updateCountdown(remaining) {
          this.countdown.string = String(Math.max(1, Math.ceil(remaining)));
        };
        _proto.showResourceLoading = function showResourceLoading(status, failed, progress) {
          if (progress === void 0) {
            progress = 0;
          }
          if (this.loadingFailed && !failed) this.loadingProgress = 0;
          this.loading = true;
          this.loadingFailed = failed;
          this.loadingRoot.active = true;
          this.modal.active = false;
          this.loadingProgress = Math.max(this.loadingProgress, Math.min(1, Math.max(0, progress)));
          // One full poster and one animated interior, in the same original coordinates.
          // Contain keeps the printed loading bar visible on short and tall screens.
          var posterScale = Math.min(DESIGN_WIDTH / 1080, this.fieldHeight / 2400);
          this.loadingCanvas.setScale(posterScale, posterScale);
          var backdrop = this.loadingBackdrop;
          backdrop.clear();
          backdrop.fillColor = new Color(32, 44, 80);
          backdrop.rect(-DESIGN_WIDTH / 2, -this.fieldHeight / 2, DESIGN_WIDTH, this.fieldHeight);
          backdrop.fill();
          if (this.loadingFill.spriteFrame) this.loadingFill.fillRange = this.loadingProgress;
          this.loadingFishMask.setPosition(129 + 84 + (827 - 168) * this.loadingProgress - 540, 1200 - 2069);
          this.loadingStatus.string = !failed && status.startsWith('正在') ? status : '';
          this.loadingStatus.node.active = this.loadingStatus.string.length > 0;
          this.loadingStatus.color = INK.clone();
          this.loadingStatus.node.setPosition(16, -this.fieldHeight / 2 + 56);
          this.loadingReconnect.clear();
          if (this.loadingStatus.node.active) {
            this.loadingReconnect.node.setPosition(0, -this.fieldHeight / 2 + 56);
            officeNotice(this.loadingReconnect, 620, 64, 'task');
          }
          var retryScale = Math.min(1, (DESIGN_WIDTH - 64) / 564, (this.fieldHeight - 120) / 460);
          this.retryRoot.active = failed;
          this.retryRoot.setScale(retryScale, retryScale);
          this.retryRoot.setPosition(0, -this.fieldHeight * 0.12);
          this.buttons.primary.x = 0;
          this.buttons.primary.y = this.retryRoot.position.y - 74 * retryScale;
          this.buttons.primary.width = 432 * retryScale;
          this.buttons.primary.height = 72 * retryScale;
          this.primary.string = status;
        };
        _proto.finishLoading = function finishLoading() {
          this.loading = false;
          this.loadingFailed = false;
          this.loadingRoot.active = false;
          this.retryRoot.active = false;
          this.loadingProgress = 0;
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
          if (this.sound.node.active) {
            g.fillColor = new Color(243, 228, 202);
            var sound = this.buttons.sound;
            g.roundRect(sound.x - 36, sound.y - 19, 72, 38, 10);
            g.fill();
          }
        };
        _proto.placeReward = function placeReward(fish, cat) {
          var point = tutorialRewardPosition(fish, cat, this.fieldHeight);
          this.rewardRoot.setPosition(point.x - DESIGN_WIDTH / 2, point.y - this.fieldHeight / 2);
        };
        _proto.updateGuide = function updateGuide(guide, showShieldHint, cue) {
          this.rewardRoot.active = this.mode === 'hidden' && guide.rewarding;
          this.guideRoot.active = this.mode === 'hidden' && (guide.playing && !guide.rewarding || guide.step === 'practice-retry' || showShieldHint);
          this.drawTutorialCue(guide, cue);
          var stars = this.rewardStars;
          stars.clear();
          if (this.rewardRoot.active) {
            this.rewardLabel.string = guide.feedback;
            var progress = guide.rewardProgress;
            var pop = Math.min(1, progress / 0.24) - 1;
            var scale = 0.6 + 0.4 * (1 + 2.70158 * Math.pow(pop, 3) + 1.70158 * Math.pow(pop, 2));
            this.rewardRoot.setScale(scale, scale);
            this.rewardOpacity.opacity = Math.round(255 * Math.min(1, (1 - progress) / 0.17));
            this.rewardLabel.node.setPosition(0, 0);
            stars.lineWidth = 1.6;
            stars.strokeColor = INK;
            for (var i = 0; i < 6; i++) {
              var angle = i * Math.PI / 3 + Math.PI / 6;
              var x = Math.cos(angle) * (182 + progress * 18);
              var y = Math.sin(angle) * (30 + progress * 10);
              var size = 5 + Math.sin(progress * Math.PI) * 3;
              stars.fillColor = i % 2 === 0 ? new Color(255, 220, 113) : new Color(255, 246, 209);
              for (var point = 0; point < 10; point++) {
                var direction = point * Math.PI / 5 - Math.PI / 2 + progress * 0.6;
                var radius = point % 2 === 0 ? size : size * 0.42;
                var px = x + Math.cos(direction) * radius,
                  py = y + Math.sin(direction) * radius;
                if (point === 0) stars.moveTo(px, py);else stars.lineTo(px, py);
              }
              stars.close();
              stars.fill();
              stars.stroke();
            }
          }
          if (!this.guideRoot.active) return;
          this.guideTitle.string = showShieldHint ? '能量已满' : guide.title;
          this.guideText.string = showShieldHint ? '松手后双击，免疫 3 秒。' : guide.text;
          this.guideTitle.node.setPosition(0, 43);
          this.guideText.node.setPosition(0, -17);
          this.guideText.node.getComponent(UITransform).setContentSize(560, 80);
          this.guideText.enableWrapText = true;
          var g = this.guideBoard;
          g.clear();
          // A lightweight paper slip, leaving the field and collectible artwork visible.
          g.fillColor = new Color(48, 15, 59, 45);
          g.roundRect(-310, -87, 620, 164, 20);
          g.fill();
          g.fillColor = new Color(244, 202, 130);
          g.roundRect(-310, -80, 620, 164, 20);
          g.fill();
          g.fillColor = OFFICE.paper;
          g.roundRect(-306, -76, 612, 156, 17);
          g.fill();
          g.fillColor = new Color(255, 253, 238);
          g.roundRect(-292, 70, 584, 5, 2.5);
          g.fill();
          g.fillColor = OFFICE.gold;
          g.roundRect(-296, -54, 6, 108, 3);
          g.fill();
          g.strokeColor = new Color(226, 193, 142);
          g.lineWidth = 1.5;
          g.moveTo(-220, 19);
          g.lineTo(220, 19);
          g.stroke();
        }

        /** Native vector guidance animates with game time and never captures touch input. */;
        _proto.drawTutorialCue = function drawTutorialCue(guide, cue) {
          var _this4 = this;
          this.tutorialCueRoot.active = this.mode === 'hidden' && !!(cue != null && cue.target) && (guide.step === 'fish' || guide.step === 'agent');
          var wasHandActive = this.tapHandRoot.active;
          this.tapHandRoot.active = this.mode === 'hidden' && guide.step === 'shield' && !!cue;
          var g = this.tutorialCue;
          g.clear();
          if (!cue) return;
          if (this.tutorialCueRoot.active && cue.target) {
            var route = tutorialPickupRoute(cue.player, cue.target);
            var at = function at(distance) {
              var i = Math.max(1, route.points.findIndex(function (point) {
                return point.distance >= distance;
              }));
              var a = route.points[i - 1],
                b = route.points[i];
              var t = Math.max(0, Math.min(1, (distance - a.distance) / Math.max(0.01, b.distance - a.distance)));
              return {
                x: a.x + (b.x - a.x) * t - DESIGN_WIDTH / 2,
                y: a.y + (b.y - a.y) * t - _this4.fieldHeight / 2
              };
            };
            // Rounded, two-tone dashes flow towards the pickup, along a softly bowed route.
            var segment = function segment(a, b, width, color) {
              g.strokeColor = color;
              g.lineWidth = width;
              g.moveTo(a.x, a.y);
              g.lineTo(b.x, b.y);
              g.stroke();
              g.fillColor = color;
              g.circle(a.x, a.y, width / 2);
              g.fill();
              g.circle(b.x, b.y, width / 2);
              g.fill();
            };
            for (var distance = 85 + cue.time * 34 % 38; distance < route.length - 94; distance += 38) {
              var a = at(distance),
                b = at(Math.min(distance + 16, route.length - 94));
              segment({
                x: a.x,
                y: a.y - 2
              }, {
                x: b.x,
                y: b.y - 2
              }, 11, new Color(48, 15, 59, 100));
              segment(a, b, 9, OFFICE.paper);
              segment(a, b, 4, new Color(255, 194, 66));
            }
            if (route.length > 190) {
              var tip = at(route.length - 70),
                before = at(route.length - 90);
              var angle = Math.atan2(tip.y - before.y, tip.x - before.x);
              var nx = Math.cos(angle),
                ny = Math.sin(angle);
              var _a = {
                x: tip.x - nx * 15 - ny * 11,
                y: tip.y - ny * 15 + nx * 11
              };
              var _b = {
                x: tip.x - nx * 15 + ny * 11,
                y: tip.y - ny * 15 - nx * 11
              };
              segment(_a, tip, 10, OFFICE.paper);
              segment(tip, _b, 10, OFFICE.paper);
              segment(_a, tip, 4, OFFICE.gold);
              segment(tip, _b, 4, OFFICE.gold);
            }
            var tx = route.target.x - DESIGN_WIDTH / 2,
              ty = route.target.y - this.fieldHeight / 2;
            var breathe = (Math.sin(cue.time * 3) + 1) / 2;
            g.fillColor = new Color(255, 237, 159, 24 + breathe * 16);
            g.circle(tx, ty, 57 + breathe * 4);
            g.fill();
            g.strokeColor = new Color(255, 246, 209, 215);
            g.lineWidth = 2.5;
            g.circle(tx, ty, 48);
            g.stroke();
            g.strokeColor = new Color(255, 202, 76, 115 - breathe * 50);
            g.lineWidth = 3;
            g.circle(tx, ty, 57 + breathe * 7);
            g.stroke();
            // Four tiny glints highlight the resource without obscuring its icon or wings.
            g.fillColor = OFFICE.paper;
            for (var i = 0; i < 4; i++) {
              var _angle = i * Math.PI / 2 + Math.PI / 4;
              var sx = tx + Math.cos(_angle) * 57,
                sy = ty + Math.sin(_angle) * 57;
              var size = 3 + breathe;
              g.moveTo(sx, sy + size * 1.7);
              g.lineTo(sx + size, sy);
              g.lineTo(sx, sy - size * 1.7);
              g.lineTo(sx - size, sy);
              g.close();
              g.fill();
            }
          }
          if (!this.tapHandRoot.active) return;
          var finger = this.tapHand;
          finger.clear();
          if (!wasHandActive) this.tapStartedAt = cue.time;
          var phase = (cue.time - this.tapStartedAt) % 2.2;
          var pulse = Math.max(0, 1 - Math.abs(phase - 0.36) / 0.16, 1 - Math.abs(phase - 0.72) / 0.16);
          // Anchor the demonstration in free space instead of chasing every small player movement.
          if (!wasHandActive || !this.tapAnchor || Math.abs(cue.player.x - this.tapAnchor.x) < 115 && cue.player.y > this.tapAnchor.y - 215 && cue.player.y < this.tapAnchor.y + 110) {
            this.tapAnchor = tutorialTapPosition(cue.player, this.fieldHeight, this.guideRoot.position.y + this.fieldHeight / 2 + 84);
          }
          var anchor = this.tapAnchor;
          this.tapHandRoot.setPosition(anchor.x - DESIGN_WIDTH / 2, anchor.y - this.fieldHeight / 2);
          finger.fillColor = new Color(255, 244, 200, 38);
          finger.circle(0, 10, 40);
          finger.fill();
          finger.strokeColor = new Color(255, 245, 206, 190);
          finger.lineWidth = 3;
          finger.circle(0, 10, 29);
          finger.stroke();
          // Two distinct contacts, then a pause. Ripples stay attached to the touch point.
          for (var _i7 = 0, _arr6 = [0.36, 0.72]; _i7 < _arr6.length; _i7++) {
            var start = _arr6[_i7];
            var age = phase - start;
            if (age < 0 || age > 0.52) continue;
            finger.strokeColor = new Color(255, 221, 109, Math.round(230 * (1 - age / 0.52)));
            finger.lineWidth = 4;
            finger.circle(0, 10, 29 + age * 72);
            finger.stroke();
          }
          var dip = -pulse * 7;
          var silhouette = function silhouette(ox, oy) {
            finger.moveTo(-18 + ox, -91 + oy);
            finger.bezierCurveTo(-27 + ox, -78 + oy, -40 + ox, -61 + oy, -46 + ox, -49 + oy);
            finger.bezierCurveTo(-54 + ox, -32 + oy, -36 + ox, -24 + oy, -27 + ox, -37 + oy);
            finger.lineTo(-14 + ox, -51 + oy);
            finger.lineTo(-14 + ox, 2 + oy);
            finger.bezierCurveTo(-14 + ox, 24 + oy, 14 + ox, 24 + oy, 14 + ox, 2 + oy);
            finger.lineTo(14 + ox, -34 + oy);
            finger.bezierCurveTo(19 + ox, -21 + oy, 35 + ox, -24 + oy, 35 + ox, -38 + oy);
            finger.bezierCurveTo(40 + ox, -28 + oy, 54 + ox, -33 + oy, 54 + ox, -47 + oy);
            finger.bezierCurveTo(67 + ox, -44 + oy, 67 + ox, -60 + oy, 63 + ox, -72 + oy);
            finger.lineTo(52 + ox, -96 + oy);
            finger.bezierCurveTo(31 + ox, -106 + oy, 0 + ox, -105 + oy, -18 + ox, -91 + oy);
            finger.close();
          };
          finger.fillColor = new Color(48, 15, 59, 70);
          silhouette(4, dip - 5);
          finger.fill();
          finger.fillColor = new Color(255, 233, 192);
          finger.strokeColor = INK;
          finger.lineWidth = 4;
          silhouette(0, dip);
          finger.fill();
          finger.stroke();
          finger.fillColor = new Color(255, 252, 235);
          finger.roundRect(-9, -48 + dip, 17, 62, 8);
          finger.fill();
          finger.ellipse(17, -66 + dip, 26, 21);
          finger.fill();
          finger.strokeColor = new Color(199, 148, 121);
          finger.lineWidth = 2.5;
          for (var _i8 = 0, _arr7 = [[20, -47], [40, -49], [55, -58]]; _i8 < _arr7.length; _i8++) {
            var _arr7$_i = _arr7[_i8],
              x = _arr7$_i[0],
              y = _arr7$_i[1];
            finger.moveTo(x, y + dip);
            finger.lineTo(x - 1, y - 12 + dip);
            finger.stroke();
          }
          finger.fillColor = new Color(70, 158, 221);
          finger.strokeColor = INK;
          finger.lineWidth = 4;
          finger.roundRect(-21, -119 + dip, 77, 27, 8);
          finger.fill();
          finger.stroke();
          finger.fillColor = new Color(136, 220, 250);
          finger.roundRect(-15, -114 + dip, 64, 6, 3);
          finger.fill();
          finger.fillColor = new Color(255, 250, 226);
          finger.circle(44, -104 + dip, 3);
          finger.fill();
        };
        _proto.actionAt = function actionAt(point) {
          var x = point.x - DESIGN_WIDTH / 2,
            y = point.y - this.fieldHeight / 2;
          if (this.exitOpen) {
            if (officeContains(this.exitCancelBox, x, y - this.safeCenter, this.touchMinimum)) return 'exit-cancel';
            if (officeContains(this.exitConfirmBox, x, y - this.safeCenter, this.touchMinimum)) return 'exit-confirm';
            return null;
          }
          if (this.loading) {
            var b = this.buttons.primary;
            return this.loadingFailed && Math.abs(x - b.x) <= b.width / 2 && Math.abs(y - b.y) <= b.height / 2 ? 'primary' : null;
          }
          if (this.friends.open) return this.friends.actionAt(point);
          if (this.helpOpen) {
            var _b2 = this.helpBackBox;
            var hx = x / this.helpScale,
              hy = (y - this.safeCenter) / this.helpScale;
            if (officeContains(_b2, hx, hy, this.touchMinimum / this.helpScale)) return 'help-close';
            for (var _iterator6 = _createForOfIteratorHelperLoose(['help-controls', 'help-bullets', 'help-resources'].entries()), _step6; !(_step6 = _iterator6()).done;) {
              var _step6$value = _step6.value,
                i = _step6$value[0],
                action = _step6$value[1];
              if (officeContains({
                x: (i - 1) * 178,
                y: this.helpTabs[i].node.position.y,
                width: 166,
                height: 72
              }, hx, hy, this.touchMinimum / this.helpScale)) return action;
            }
            return null;
          }
          if (!this.modal.active) return null;
          var localY = y - this.modal.position.y;
          if (this.mode === 'paused') {
            for (var _i9 = 0, _arr8 = [[this.helpButton, 'help'], [this.closeButton, 'primary']]; _i9 < _arr8.length; _i9++) {
              var _arr8$_i = _arr8[_i9],
                _b3 = _arr8$_i[0],
                _action = _arr8$_i[1];
              if (officeContains(_b3, x, localY, this.touchMinimum)) return _action;
            }
          }
          var friends = this.friendsButton;
          if (this.friendsEntry.node.active && officeContains(friends, x, localY, this.touchMinimum)) return 'friends';
          for (var _iterator7 = _createForOfIteratorHelperLoose(['sound', 'primary', 'secondary']), _step7; !(_step7 = _iterator7()).done;) {
            var name = _step7.value;
            if (!this[name].node.active) continue;
            var box = this.buttons[name];
            if (officeContains(box, x, localY, this.touchMinimum)) return name;
          }
          return null;
        };
        _createClass(GameInterface, [{
          key: "helpOpen",
          get: function get() {
            return this.helpRoot.active;
          }
        }, {
          key: "exitOpen",
          get: function get() {
            return this.exitRoot.active;
          }
        }]);
        return GameInterface;
      }());

      /** A complete paper-card shell; private friend rows and own rank are drawn only by WeChat. */
      var FriendLeaderboardView = exports('FriendLeaderboardView', /*#__PURE__*/function () {
        function FriendLeaderboardView(parent) {
          this.skin = new OfficeSkin();
          this.root = void 0;
          this.card = void 0;
          this.dataRoot = void 0;
          this.dataSurface = void 0;
          this.fallback = void 0;
          this.notice = void 0;
          this.back = void 0;
          this.backdrop = void 0;
          this.body = void 0;
          this.fallbackTitle = void 0;
          this.own = void 0;
          this.height = 1600;
          this.scale = 1;
          this.shared = void 0;
          this.noticeTimer = 0;
          this.panel = void 0;
          this.paper = void 0;
          this.ownPaper = void 0;
          this.dataViewport = void 0;
          this.scroll = void 0;
          this.usableHeight = 1600;
          this.center = 0;
          this.minimumTouch = 96;
          this.privacy = false;
          this.available = false;
          this.panelHeight = 820;
          this.buttons = {
            'friends-refresh': {
              x: -132,
              y: -486,
              width: 248,
              height: 68
            },
            'friends-share': {
              x: 132,
              y: -486,
              width: 248,
              height: 68
            }
          };
          this.closeButton = {
            x: 246,
            y: 530,
            width: 58,
            height: 58
          };
          this.root = new Node('FriendsLeaderboard');
          parent.addChild(this.root);
          this.backdrop = this.graphics('FriendsBackdrop', this.root);
          this.card = new Node('FriendsPaperCard');
          this.root.addChild(this.card);
          this.panel = this.skin.sprite(this.card, 'FriendsPaintedPanel', 'uiPanel', 636, 820, true);
          var paper = this.paper = this.graphics('FriendsPaper', this.card);
          officeClose(paper, this.closeButton);
          this.label('FriendsTitle', '好友摸鱼榜', 40, 0, 490, 420, 58, true);
          this.label('FriendsSubtitle', '最高分 TOP 10', 27, 0, 448, 540, 40);
          this.dataViewport = new Node('PrivateFriendScrollViewport');
          this.card.addChild(this.dataViewport);
          this.dataViewport.addComponent(UITransform).setContentSize(540, 792);
          this.dataViewport.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
          this.dataRoot = new Node('PrivateFriendRows');
          this.dataViewport.addChild(this.dataRoot);
          this.dataRoot.addComponent(UITransform).setContentSize(520, 1040);
          this.dataRoot.getComponent(UITransform).setAnchorPoint(0.5, 1);
          // Scroll content is top-anchored; SubContextView creates a centered sprite.
          // Give it a separate centered surface so its first row starts at the top.
          this.dataSurface = new Node('PrivateFriendCanvas');
          this.dataRoot.addChild(this.dataSurface);
          this.dataSurface.addComponent(UITransform).setContentSize(520, 1040);
          this.dataSurface.setPosition(0, -520);
          this.dataSurface.active = false;
          this.scroll = this.dataViewport.addComponent(ScrollView);
          this.scroll.content = this.dataRoot;
          this.scroll.horizontal = false;
          this.scroll.vertical = true;
          this.fallback = new Node('FriendsUnavailable');
          this.card.addChild(this.fallback);
          this.fallbackTitle = this.label('FriendsUnavailableTitle', '', 27, 0, 110, 540, 42, true, this.fallback);
          this.fallbackTitle.node.active = false;
          this.body = this.label('FriendsUnavailableBody', '暂无好友积分排名', 30, 0, 40, 520, 120, false, this.fallback);
          this.body.enableWrapText = true;
          var ownPaper = this.ownPaper = this.graphics('FriendsLocalRecordPaper', this.fallback);
          officeRow(ownPaper, {
            x: 0,
            y: -329,
            width: 508,
            height: 105
          });
          this.own = this.label('FriendsLocalRecord', '', 28, 0, -329, 490, 80, true, this.fallback);
          this.own.enableWrapText = true;
          this.notice = this.label('FriendsNotice', '', 24, 0, -428, 540, 40);
          this.notice.node.active = false;
          this.notice.enableWrapText = true;
          for (var _i10 = 0, _Object$values = Object.values(this.buttons); _i10 < _Object$values.length; _i10++) {
            var box = _Object$values[_i10];
            officeButton(paper, box, 'cream');
          }
          this.label('FriendsRefresh', '刷新榜单', 28, -132, -486, 236, 72, true);
          this.label('FriendsShare', '邀请好友', 28, 132, -486, 236, 72, true);
          this.back = this.label('FriendsBack', '返回首页', 23, 0, -585, 500, 58, true);
          // Retain origin information for navigation diagnostics; there is no footer control.
          this.back.node.active = false;
          this.label('FriendsRules', '', 23, 0, -537, 540, 36).node.active = false;
          this.layout();
          this.root.active = false;
        }
        var _proto2 = FriendLeaderboardView.prototype;
        _proto2.setArt = function setArt(key, frame) {
          this.skin.setArt(key, frame);
        };
        _proto2.destroy = function destroy() {
          this.skin.destroy();
        };
        _proto2.feedbackBox = function feedbackBox(action) {
          return action === 'friends-close' ? this.closeButton : this.buttons[action];
        };
        _proto2.show = function show(available, score, fromResult, fromPaused) {
          if (fromPaused === void 0) {
            fromPaused = false;
          }
          this.root.active = true;
          this.noticeTimer = 0;
          this.privacy = false;
          this.notice.string = '';
          this.notice.node.active = false;
          this.back.string = fromPaused ? '返回设置' : fromResult ? '返回成绩单' : '返回首页';
          this.fallbackTitle.string = '';
          this.fallbackTitle.node.active = false;
          this.body.string = '暂无好友积分排名';
          this.setAvailability(available, score);
        };
        _proto2.showPrivacy = function showPrivacy(pending, score) {
          this.privacy = true;
          this.noticeTimer = 0;
          this.notice.string = '';
          this.notice.node.active = false;
          this.setAvailability(false, score);
          this.fallbackTitle.node.active = false;
          this.body.string = pending ? '请确认微信隐私授权。' : '未授权，点“刷新榜单”重试。';
        };
        _proto2.setAvailability = function setAvailability(available, score) {
          var changed = this.available !== available;
          this.available = available;
          this.dataViewport.active = this.dataRoot.active = available;
          this.fallback.active = !available;
          this.own.string = score > 0 ? "\u4E2A\u4EBA\u6700\u9AD8\u5206\n" + score.toLocaleString('en-US') + " \u5206" : '个人最高分\n暂无纪录';
          if (available && !this.shared) {
            this.shared = this.dataSurface.addComponent(SubContextView);
            // Configure before onLoad initializes the shared canvas and its texture.
            this.shared.designResolutionSize.set(640, 1280);
            this.shared.fps = 12;
            this.dataSurface.active = true;
          }
          this.layout();
          if (changed) this.scroll.scrollToTop(0);
        };
        _proto2.hide = function hide() {
          this.root.active = false;
        };
        _proto2.inform = function inform(text) {
          this.notice.string = text;
          this.notice.node.active = !!text;
          this.noticeTimer = 3;
        };
        _proto2.advance = function advance(dt) {
          if (!this.open || this.noticeTimer <= 0) return;
          this.noticeTimer = Math.max(0, this.noticeTimer - dt);
          if (this.noticeTimer === 0) {
            this.notice.string = '';
            this.notice.node.active = false;
          }
        };
        _proto2.resize = function resize(height, usable, center, minimumTouch) {
          if (usable === void 0) {
            usable = height;
          }
          if (center === void 0) {
            center = 0;
          }
          if (minimumTouch === void 0) {
            minimumTouch = 96;
          }
          this.height = height;
          this.usableHeight = usable;
          this.center = center;
          this.minimumTouch = minimumTouch;
          this.layout();
          var g = this.backdrop;
          g.clear();
          g.fillColor = new Color(31, 21, 40, 224);
          g.rect(-DESIGN_WIDTH / 2, -height / 2, DESIGN_WIDTH, height);
          g.fill();
        };
        _proto2.actionAt = function actionAt(point) {
          var x = (point.x - DESIGN_WIDTH / 2) / this.scale,
            y = (point.y - this.height / 2 - this.center) / this.scale;
          var close = this.closeButton;
          if (officeContains(close, x, y, this.minimumTouch / this.scale)) return 'friends-close';
          for (var _i11 = 0, _Object$entries = Object.entries(this.buttons); _i11 < _Object$entries.length; _i11++) {
            var _Object$entries$_i = _Object$entries[_i11],
              action = _Object$entries$_i[0],
              box = _Object$entries$_i[1];
            if (officeContains(box, x, y, this.minimumTouch / this.scale)) return action;
          }
          return null;
        };
        _proto2.layout = function layout() {
          var _this5 = this;
          this.scroll.stopAutoScroll();
          this.scale = Math.min(1, (DESIGN_WIDTH - 56) / 660);
          var h = this.panelHeight = Math.min(this.available ? 1280 : 760, (this.usableHeight - 96) / this.scale);
          this.card.setScale(this.scale, this.scale);
          this.card.setPosition(0, this.center);
          this.skin.size(this.panel, 636, h);
          var move = function move(name, y) {
            var n = _this5.card.getChildByName(name);
            n.setPosition(n.position.x, y);
          };
          this.closeButton.y = h / 2 - 112;
          move('FriendsTitle', h / 2 - 112);
          move('FriendsSubtitle', h / 2 - 168);
          this.buttons['friends-refresh'].y = this.buttons['friends-share'].y = -h / 2 + 100;
          this.buttons['friends-refresh'].height = this.buttons['friends-share'].height = 88;
          move('FriendsRefresh', -h / 2 + 100);
          move('FriendsShare', -h / 2 + 100);
          move('FriendsNotice', -h / 2 + 184);
          this.body.node.setPosition(0, 54);
          this.fallbackTitle.node.setPosition(0, 138);
          this.own.node.setPosition(0, -h / 2 + 282);
          this.ownPaper.clear();
          officeRow(this.ownPaper, {
            x: 0,
            y: -h / 2 + 282,
            width: 508,
            height: 112
          });
          this.paper.clear();
          officeClose(this.paper, this.closeButton);
          Object.values(this.buttons).forEach(function (b) {
            return officeButton(_this5.paper, b, 'cream');
          });
          var viewHeight = h - 440;
          this.dataViewport.getComponent(UITransform).setContentSize(540, viewHeight);
          this.dataViewport.setPosition(0, 0);
          this.dataRoot.getComponent(UITransform).setContentSize(520, 1040);
          this.dataRoot.setPosition(0, viewHeight / 2);
          this.scroll.scrollToTop(0);
        };
        _proto2.graphics = function graphics(name, parent) {
          var node = new Node(name);
          parent.addChild(node);
          node.addComponent(UITransform).setContentSize(720, 1600);
          return node.addComponent(Graphics);
        };
        _proto2.label = function label(name, text, size, x, y, width, height, bold, parent) {
          if (bold === void 0) {
            bold = false;
          }
          if (parent === void 0) {
            parent = this.card;
          }
          var node = new Node(name);
          parent.addChild(node);
          node.addComponent(UITransform).setContentSize(width, height);
          node.setPosition(x, y);
          var label = node.addComponent(Label);
          label.string = text;
          label.fontSize = size;
          label.lineHeight = size + 7;
          label.color = INK.clone();
          label.isBold = bold;
          label.horizontalAlign = Label.HorizontalAlign.CENTER;
          label.verticalAlign = Label.VerticalAlign.CENTER;
          label.overflow = Label.Overflow.SHRINK;
          return label;
        };
        _createClass(FriendLeaderboardView, [{
          key: "open",
          get: function get() {
            return this.root.active;
          }
        }, {
          key: "scaleValue",
          get: function get() {
            return this.scale;
          }
        }]);
        return FriendLeaderboardView;
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
        playerEnergyBarPoint: playerEnergyBarPoint,
        referencePoint: referencePoint,
        tutorialPickupRoute: tutorialPickupRoute,
        tutorialRewardPosition: tutorialRewardPosition,
        tutorialTapPosition: tutorialTapPosition,
        viewportLayout: viewportLayout
      });
      cclegacy._RF.push({}, "b70bdNP1jVIyLBCCfo+QQXR", "GameLayout", undefined);
      /** Reference coordinates use the approved 1080 × 2400 composition, with Y measured from the top. */
      var REFERENCE_WIDTH = exports('REFERENCE_WIDTH', 1080);
      var REFERENCE_HEIGHT = exports('REFERENCE_HEIGHT', 2400);
      var DESIGN_WIDTH = exports('DESIGN_WIDTH', 720);
      var DESIGN_HEIGHT = exports('DESIGN_HEIGHT', 1600);
      var ART_SCALE = exports('ART_SCALE', DESIGN_WIDTH / REFERENCE_WIDTH);
      var PLAYER_SCALE = exports('PLAYER_SCALE', 9 / 8);
      var PLAYER_EDGE_MARGIN = exports('PLAYER_EDGE_MARGIN', 34 * PLAYER_SCALE);
      /** Source atlas has its tail on the right. Horizontal movement selects the mirror. */

      var playerMirrorSign = exports('playerMirrorSign', function playerMirrorSign(facing) {
        if (facing === void 0) {
          facing = -1;
        }
        return -facing;
      });
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
          width: 144 * PLAYER_SCALE,
          height: 144 * PLAYER_SCALE
        }
      });

      /** Head/torso capsule grows with the cat; excludes tail, ears and padding. */
      var PLAYER_BODY = exports('PLAYER_BODY', {
        offsetX: -8 * PLAYER_SCALE,
        bottom: -24 * PLAYER_SCALE,
        top: 18 * PLAYER_SCALE,
        radius: 24 * PLAYER_SCALE
      });
      // Approved 50-frame atlas: highest visible ear is 50.06px above the sprite centre.
      var PLAYER_VISUAL_TOP = exports('PLAYER_VISUAL_TOP', 51 * PLAYER_SCALE);
      /** Match the visible torso, excluding the atlas padding and swinging tail. */
      var PLAYER_ENERGY_BAR = exports('PLAYER_ENERGY_BAR', {
        width: 72,
        height: 14,
        headGap: 6,
        segments: 5,
        inset: 2.6
      });
      function playerEnergyBarPoint(player, facing) {
        if (facing === void 0) {
          facing = -1;
        }
        return {
          x: player.x + PLAYER_BODY.offsetX * playerMirrorSign(facing),
          y: player.y + PLAYER_VISUAL_TOP + PLAYER_ENERGY_BAR.headGap + PLAYER_ENERGY_BAR.height / 2
        };
      }
      var HUD_BOTTOM = exports('HUD_BOTTOM', Math.max.apply(Math, Object.values(HUD_LAYOUT).map(function (box) {
        return (box.y + box.height) * ART_SCALE;
      })));
      var PLAYER_HUD_GAP = exports('PLAYER_HUD_GAP', 10);
      var playerMovementTop = exports('playerMovementTop', function playerMovementTop(height, radius) {
        if (radius === void 0) {
          radius = PLAYER_BODY.radius;
        }
        return height - HUD_BOTTOM - PLAYER_HUD_GAP - Math.max(PLAYER_VISUAL_TOP + PLAYER_ENERGY_BAR.headGap + PLAYER_ENERGY_BAR.height, PLAYER_BODY.top + radius);
      });
      var playerDragTop = exports('playerDragTop', function playerDragTop(height) {
        return height - HUD_BOTTOM - PLAYER_HUD_GAP;
      });
      /** Fill the settings artwork's inner opening; its original painted band covers the old charge ring. */
      var PORTRAIT_AVATAR = exports('PORTRAIT_AVATAR', {
        size: 56,
        diameter: 56,
        zoom: 1.35,
        hitRadius: 46
      });

      /** Keep the compact achievement near its pickup, outside both the cat and HUD. */
      function tutorialRewardPosition(fish, cat, height) {
        var top = height - HUD_BOTTOM - 65;
        var above = Math.max(fish.y + 106, cat.y + 114);
        return {
          x: Math.max(200, Math.min(DESIGN_WIDTH - 200, fish.x)),
          y: above <= top ? above : Math.max(75, Math.min(fish.y - 106, cat.y - 114))
        };
      }

      /** The fingertip stays in the play area; its caption clears the teaching notice. */
      function tutorialTapPosition(player, height, noticeTop) {
        return {
          x: Math.max(100, Math.min(DESIGN_WIDTH - 100, player.x + (player.x < 360 ? 170 : -170))),
          y: Math.max(noticeTop + 200, Math.min(height - HUD_BOTTOM - 85, player.y + 195))
        };
      }

      /** A gentle curve, with room around the character and the collectible at both ends. */
      function tutorialPickupRoute(player, pickup) {
        var target = {
          x: Math.max(62, Math.min(DESIGN_WIDTH - 62, pickup.x)),
          y: pickup.y
        };
        var length = Math.hypot(target.x - player.x, target.y - player.y);
        var control = {
          x: Math.max(75, Math.min(DESIGN_WIDTH - 75, (player.x + target.x) / 2)),
          y: (player.y + target.y) / 2 + Math.min(72, length * 0.18)
        };
        var points = [];
        var distance = 0;
        for (var i = 0; i <= 64; i++) {
          var t = i / 64,
            inverse = 1 - t;
          var x = Math.pow(inverse, 2) * player.x + 2 * inverse * t * control.x + Math.pow(t, 2) * target.x;
          var y = Math.pow(inverse, 2) * player.y + 2 * inverse * t * control.y + Math.pow(t, 2) * target.y;
          if (points.length) distance += Math.hypot(x - points[points.length - 1].x, y - points[points.length - 1].y);
          points.push({
            x: x,
            y: y,
            distance: distance
          });
        }
        return {
          target: target,
          points: points,
          length: distance
        };
      }
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
      var SETTINGS_HIT_BOX = exports('SETTINGS_HIT_BOX', {
        x: 6,
        y: 258,
        width: 112,
        height: 109
      });
      var PAUSE_HIT_BOX = exports('PAUSE_HIT_BOX', SETTINGS_HIT_BOX);
      var formatClock = exports('formatClock', function formatClock(seconds) {
        var total = Math.max(0, Math.floor(seconds));
        return String(Math.floor(total / 60)).padStart(2, '0') + ":" + String(total % 60).padStart(2, '0');
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameMain.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameModel.ts', './FinalArtHud.ts', './GameLayout.ts', './GameExperience.ts', './PlatformServices.ts', './GameInterface.ts', './AsyncLoading.ts', './BodySpring.ts', './SpringSprite.ts', './PlayerTrail.ts', './OfficeUi.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, _createClass, _asyncToGenerator, _regeneratorRuntime, _construct, cclegacy, _decorator, Color, profiler, view, ResolutionPolicy, Canvas, UITransform, Node, Graphics, Mask, Vec3, Label, LabelOutline, input, Input, game, Game, director, Director, Sprite, KeyCode, Component, EffectAsset, Material, assetManager, SpriteFrame, GameModel, GestureRecognizer, FinalArtHud, sliceFrame, DESIGN_HEIGHT, SPRITE_SIZES, viewportLayout, playerMovementTop, PLAYER_SCALE, playerMirrorSign, containsReferencePoint, SETTINGS_HIT_BOX, DESIGN_WIDTH, TUTORIAL_REVISION, ResumeCountdown, TutorialGuide, ShieldCoach, GameAudio, readUiViewport, readStartupLoadingProgress, dismissStartupCover, notifyStartupLoadingReady, ProgressStore, FriendLeaderboardService, GameInterface, LoadingProgress, retryLoad, BodySpring, SpringSprite, PlayerTrail, OFFICE, officeNotice;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _createClass = module.createClass;
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
      _construct = module.construct;
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
      LabelOutline = module.LabelOutline;
      input = module.input;
      Input = module.Input;
      game = module.game;
      Game = module.Game;
      director = module.director;
      Director = module.Director;
      Sprite = module.Sprite;
      KeyCode = module.KeyCode;
      Component = module.Component;
      EffectAsset = module.EffectAsset;
      Material = module.Material;
      assetManager = module.assetManager;
      SpriteFrame = module.SpriteFrame;
    }, function (module) {
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
      PLAYER_SCALE = module.PLAYER_SCALE;
      playerMirrorSign = module.playerMirrorSign;
      containsReferencePoint = module.containsReferencePoint;
      SETTINGS_HIT_BOX = module.SETTINGS_HIT_BOX;
      DESIGN_WIDTH = module.DESIGN_WIDTH;
    }, function (module) {
      TUTORIAL_REVISION = module.TUTORIAL_REVISION;
      ResumeCountdown = module.ResumeCountdown;
      TutorialGuide = module.TutorialGuide;
      ShieldCoach = module.ShieldCoach;
    }, function (module) {
      GameAudio = module.GameAudio;
      readUiViewport = module.readUiViewport;
      readStartupLoadingProgress = module.readStartupLoadingProgress;
      dismissStartupCover = module.dismissStartupCover;
      notifyStartupLoadingReady = module.notifyStartupLoadingReady;
      ProgressStore = module.ProgressStore;
      FriendLeaderboardService = module.FriendLeaderboardService;
    }, function (module) {
      GameInterface = module.GameInterface;
    }, function (module) {
      LoadingProgress = module.LoadingProgress;
      retryLoad = module.retryLoad;
    }, function (module) {
      BodySpring = module.BodySpring;
    }, function (module) {
      SpringSprite = module.SpringSprite;
    }, function (module) {
      PlayerTrail = module.PlayerTrail;
    }, function (module) {
      OFFICE = module.OFFICE;
      officeNotice = module.officeNotice;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "9dad5MWX8ZA3KB5PeLm0Fgj", "GameMain", undefined);
      var ccclass = _decorator.ccclass;
      var W = DESIGN_WIDTH;
      var FLOATER_SLOTS = 6;
      var ART_PATHS = {
        loadingUI: 'menus/loading/spriteFrame',
        uiPanel: 'menus/office-panel-paper-v3/spriteFrame',
        uiIcons: 'menus/settings-icons-v2/spriteFrame',
        uiButton: 'menus/green-button-v2/spriteFrame',
        homeUI: 'menus/home/spriteFrame',
        resultUI: 'menus/result/spriteFrame',
        tutorialIntroUI: 'menus/tutorial-intro/spriteFrame',
        tutorialCompleteUI: 'menus/tutorial-complete/spriteFrame',
        background: 'background/office-night/spriteFrame',
        message: 'bullets/message/spriteFrame',
        folder: 'bullets/folder/spriteFrame',
        requirement: 'bullets/request-sheet/spriteFrame',
        fish: 'pickups/fish/spriteFrame',
        leave: 'pickups/leave-slip/spriteFrame',
        helper: 'pickups/ai-helper/spriteFrame',
        agent: 'pickups/ai-agent/spriteFrame',
        timeUI: 'hud/time/spriteFrame',
        scoreUI: 'hud/score/spriteFrame',
        workloadUI: 'hud/workload/spriteFrame',
        idleSheet: 'character/approved-idle-sheet/spriteFrame',
        portrait0: 'character/workload-expression-0/spriteFrame',
        portrait1: 'character/workload-expression-1/spriteFrame',
        portrait2: 'character/workload-expression-2/spriteFrame'
      };
      var IDLE_FRAMES = 50;
      var ART_FRAME_COUNT = Object.keys(ART_PATHS).length + IDLE_FRAMES;
      // Ignore the supplied PNGs' faint stray pixels outside their visible artwork.
      var ART_CROPS = {
        message: [212, 230, 875, 819],
        folder: [86, 202, 1080, 890],
        requirement: [140, 65, 1065, 1080],
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
          points: [[493, 829, 20, 20], [761, 879, 20, 20]],
          ink: new Color(56, 11, 69),
          light: new Color(252, 125, 255)
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
          // Updated by scripts/build.mjs and checked against the compiled game bundle.
          _this.buildFingerprint = 'source:5f07a47b3b94efe4';
          _this.fieldHeight = DESIGN_HEIGHT;
          _this.visualDt = 0;
          _this.hintPaper = void 0;
          _this.bulletShadows = void 0;
          _this.playerShadow = void 0;
          _this.fishGlow = void 0;
          _this.bulletCues = void 0;
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
          _this.shieldReleaseTime = 0;
          _this.shieldBlockAngle = 0;
          _this.model = new GameModel();
          _this.progress = new ProgressStore();
          _this.guide = new TutorialGuide();
          _this.shieldCoach = new ShieldCoach();
          _this.audio = void 0;
          _this["interface"] = void 0;
          _this.settlement = null;
          _this.shieldsUsed = 0;
          _this.pendingAction = null;
          _this.friends = new FriendLeaderboardService();
          _this.pendingPoint = null;
          _this.activeTouchId = null;
          _this.gesture = new GestureRecognizer();
          _this.paintNode = void 0;
          _this.graphics = void 0;
          _this.background = void 0;
          _this.bulletLayer = void 0;
          _this.folderLayer = void 0;
          _this.workLayer = void 0;
          _this.pickupLayer = void 0;
          _this.playerSprite = void 0;
          _this.bodySpring = new BodySpring();
          _this.bulletSprites = [];
          _this.bulletEyes = [];
          _this.eyePhase = new WeakMap();
          _this.eyePhaseCursor = 0;
          _this.fishSprites = [];
          _this.leaveSprites = [];
          _this.aiSprites = [];
          _this.aiFrames = new Map();
          _this.art = new Map();
          _this.atlasFrames = [];
          _this.croppedFrames = [];
          _this.animationClock = 0;
          _this.artReady = false;
          _this.artLoadGeneration = 0;
          _this.artLoadFailed = false;
          _this.artLoadStatus = '资源加载中…';
          _this.artLoadProgress = 0;
          _this.loadingProgress = new LoadingProgress();
          _this.artLoadComplete = false;
          _this.loadingFinishScheduled = false;
          _this.startupHandedOff = false;
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
          _this.immunityArt = void 0;
          _this.immunityLabel = void 0;
          _this.immunityCopies = [];
          _this.playerTrail = new PlayerTrail();
          _this.trailArt = void 0;
          _this.immunityMaterial = void 0;
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
          this.folderLayer = this.makeBulletLayer('FolderWorkLayer');
          this.bulletCues = this.makeGraphics('HomingMessageTrails', this.bulletLayer);
          this.workLayer = this.makeBulletLayer('OtherWorkLayer');
          this.pickupLayer = this.makeBulletLayer('ResourcePickupLayer');
          this.fishGlow = this.makeGraphics('FishPickupGlow', this.pickupLayer);
          this.playerShadow = this.makeGraphics('EmployeeShadow', this.node);
          this.trailArt = this.makeGraphics('CatParticleRibbon', this.node);
          for (var i = 0; i < 24; i++) this.immunityCopies.push(this.makeArtSprite("ImmunitySilhouette" + i, SPRITE_SIZES.player.width, SPRITE_SIZES.player.height, this.node, true));
          this.playerSprite = this.makeArtSprite('Employee', SPRITE_SIZES.player.width, SPRITE_SIZES.player.height, this.node, true);
          this.bodySpring.reset(this.model.player);
          this.playerSprite.node.active = false;
          this.immunityArt = this.makeGraphics('WorkImmunityDetails', this.node);
          this.immunityLabel = this.makeLabel('WorkImmunityStatus', 24, Vec3.ZERO, 220, 38);
          this.immunityLabel.isBold = true;
          this.immunityLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
          this.immunityLabel.verticalAlign = Label.VerticalAlign.CENTER;
          this.immunityLabel.enableWrapText = false;
          this.immunityLabel.color = new Color(255, 235, 160);
          var immunityOutline = this.immunityLabel.node.addComponent(LabelOutline);
          immunityOutline.color = OFFICE.ink.clone();
          immunityOutline.width = 3;
          this.artHud = new FinalArtHud(this.node);
          this.pickupLight = this.makeGraphics('PickupChargeFlights', this.node);
          var overlayNode = new Node('InterfaceOverlay');
          overlayNode.addComponent(UITransform).setContentSize(W, this.fieldHeight);
          this.node.addChild(overlayNode);
          this.overlay = overlayNode.addComponent(Graphics);
          this.hintPaper = this.makeGraphics('WorkFolderNote', this.node);
          officeNotice(this.hintPaper, 620, 64, 'shield');
          this.centerText = this.makeLabel('CenterText', 22, new Vec3(16, 35), 530, 54);
          this.centerText.color = OFFICE.ink.clone();
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
          this.friends.sync(this.progress.profile.bestScore);
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
          var _this$immunityMateria;
          this.artLoadGeneration++;
          this.friends.hide();
          input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
          game.off(Game.EVENT_HIDE, this.onGameHide, this);
          game.off(Game.EVENT_SHOW, this.onGameShow, this);
          view.off('canvas-resize', this.resizeViewport, this);
          this.artHud.destroy();
          this["interface"].destroy();
          this.audio.destroy();
          (_this$immunityMateria = this.immunityMaterial) == null || _this$immunityMateria.destroy();
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
          var _this2 = this;
          dt = Number.isFinite(dt) ? Math.max(0, dt) : 0;
          if (!this.artReady) {
            this.loadingProgress.report(this.artLoadProgress);
            this.loadingProgress.advance(this.appVisible ? dt : 0);
            if (this.artLoadComplete && this.loadingProgress.value === 1 && !this.loadingFinishScheduled) {
              this.loadingFinishScheduled = true;
              var generation = this.artLoadGeneration;
              // Render 100% once before exposing the home screen and its touch targets.
              director.once(Director.EVENT_AFTER_DRAW, function () {
                if (generation === _this2.artLoadGeneration && _this2.node.isValid) _this2.artReady = true;
              });
            }
          }
          this["interface"].friends.advance(dt);
          var countingDown = this.resume.active;
          var countdownDigit = Math.ceil(this.resume.remaining);
          if (this.resume.advance(dt, this.appVisible)) {
            this.model.paused = false;
            this.audio.play('resume');
          } else if (this.appVisible && this.resume.active && Math.ceil(this.resume.remaining) !== countdownDigit) {
            this.audio.play('countdown');
          }
          if (countingDown || !this.appVisible) dt = 0;
          this.updateGuide(dt);
          var tutorialFrozen = this.guide.active && !this.guide.playing;
          if (!countingDown && this.appVisible && !tutorialFrozen) {
            // Touch movement is applied in drag(), preserving the initial finger offset.
            this.model.update(dt);
          }
          this.consumeEvents();
          if (this.model.gameOver && !this.settlement) {
            this.settleCurrentRun();
            this.audio.play('result');
            this.clearInput();
          }
          this.syncMusic();
          if (this.model.paused) dt = 0;
          this.visualDt = dt;
          this.bodySpring.advance(dt, this.model.player);
          if (this.model.started && !this.model.gameOver) {
            this.playerTrail.advance(dt, this.model.player);
          } else this.playerTrail.clear();
          this.animationClock += dt;
          this.shieldCoach.advance(dt);
          this.hintTime = Math.max(0, this.hintTime - dt);
          this.hitFlash = Math.max(0, this.hitFlash - dt);
          this.shakeTime = Math.max(0, this.shakeTime - dt);
          this.playerHitTime = Math.max(0, this.playerHitTime - dt);
          this.shieldBlockTime = Math.max(0, this.shieldBlockTime - dt);
          this.shieldReleaseTime = Math.max(0, this.shieldReleaseTime - dt);
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
          this.bodySpring.reset(this.model.player);
          this.playerTrail.clear();
          this.node.getComponent(UITransform).setContentSize(W, this.fieldHeight);
          this.overlay.node.getComponent(UITransform).setContentSize(W, this.fieldHeight);
          this.background.getComponent(UITransform).setContentSize(layout.backgroundWidth, layout.backgroundHeight);
          // Top alignment preserves the elevator and office header when the bottom is cropped.
          this.background.node.setPosition(0, (this.fieldHeight - layout.backgroundHeight) / 2);
          this.artHud.root.setPosition(0, (this.fieldHeight - DESIGN_HEIGHT) / 2);
          var field = this.bulletLayer.getComponent(UITransform);
          field.setContentSize(W, this.fieldHeight);
          field.setAnchorPoint(0.5, 0.5);
          var frame = view.getFrameSize();
          this["interface"].resize(this.fieldHeight, readUiViewport(frame.width, frame.height));
          this.clearInput();
        };
        _proto.makeGraphics = function makeGraphics(name, parent) {
          var node = new Node(name);
          node.addComponent(UITransform).setContentSize(W, this.fieldHeight);
          parent.addChild(node);
          return node.addComponent(Graphics);
        };
        _proto.drawShadows = function drawShadows() {
          var _this3 = this;
          var ellipse = function ellipse(g, x, y, rx, ry) {
            for (var layer = 3; layer >= 1; layer--) {
              g.fillColor = new Color(59, 48, 74, layer === 3 ? 20 : layer === 2 ? 32 : 48);
              var spread = 1 + (layer - 1) * 0.18;
              g.ellipse(x - W / 2 + 3, y - _this3.fieldHeight / 2, rx * spread, ry * spread);
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
            ellipse(this.playerShadow, this.model.player.x - 5 * PLAYER_SCALE * playerMirrorSign(this.model.playerFacing) + shake.x, this.model.player.y - 45 * PLAYER_SCALE + shake.y, 35 * PLAYER_SCALE, 10 * PLAYER_SCALE);
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
              y = orb.y - this.fieldHeight / 2 + Math.sin(orb.pulse * 5) * 5;
            var pulse = (Math.sin(orb.pulse * 3.5) + 1) / 2;
            for (var layer = 3; layer >= 1; layer--) {
              g.fillColor = new Color(97, 255, 104, Math.round(20 + (4 - layer) * 10 + pulse * 17));
              g.ellipse(x, y, 22 + layer * 7 + pulse * 4, 10 + layer * 5);
              g.fill();
            }
            g.strokeColor = new Color(170, 255, 146, Math.round(110 + pulse * 70));
            g.lineWidth = 1.4;
            g.ellipse(x, y, 31 + pulse * 2, 19 + pulse);
            g.stroke();
            for (var index = 0; index < 6; index++) {
              var angle = orb.pulse * 1.25 + index * Math.PI / 3;
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
          for (var _iterator9 = _createForOfIteratorHelperLoose(this.model.leaveSlips), _step9; !(_step9 = _iterator9()).done;) {
            var slip = _step9.value;
            var _x = slip.x - W / 2,
              _y = slip.y - this.fieldHeight / 2;
            var _pulse = (Math.sin(slip.spin * 6) + 1) / 2;
            g.fillColor = new Color(126, 255, 170, 34 + Math.round(_pulse * 45));
            g.ellipse(_x, _y, 49 + _pulse * 8, 34 + _pulse * 5);
            g.fill();
            g.strokeColor = new Color(206, 255, 211, 95 + Math.round(_pulse * 100));
            g.lineWidth = 2;
            g.ellipse(_x, _y, 46 + _pulse * 6, 31 + _pulse * 5);
            g.stroke();
          }
          for (var _iterator10 = _createForOfIteratorHelperLoose(this.model.aiPickups), _step10; !(_step10 = _iterator10()).done;) {
            var pickup = _step10.value;
            var _x2 = pickup.x - W / 2,
              _y2 = pickup.y - this.fieldHeight / 2;
            var _pulse2 = (Math.sin(pickup.phase * 9) + 1) / 2;
            g.fillColor = pickup.kind === 'agent' ? new Color(198, 145, 255, 55 + _pulse2 * 42) : new Color(96, 226, 255, 50 + _pulse2 * 40);
            g.ellipse(_x2, _y2, 46 + _pulse2 * 6, 42 + _pulse2 * 5);
            g.fill();
            for (var i = 0; i < 3; i++) {
              var a = pickup.phase * 2.8 + i * Math.PI * 2 / 3;
              g.fillColor = new Color(255, 255, 255, 130 + _pulse2 * 100);
              g.circle(_x2 + Math.cos(a) * 49, _y2 + Math.sin(a) * 39, 2.5 + _pulse2);
              g.fill();
            }
          }
        };
        _proto.drawBulletCues = function drawBulletCues() {
          var g = this.bulletCues;
          g.clear();
          var visible = false;
          for (var _iterator11 = _createForOfIteratorHelperLoose(this.model.bullets), _step11; !(_step11 = _iterator11()).done;) {
            var bullet = _step11.value;
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
        _proto.drawPickupFlights = function drawPickupFlights() {
          var g = this.pickupLight;
          g.clear();
          for (var _iterator12 = _createForOfIteratorHelperLoose(this.pickupFlights), _step12; !(_step12 = _iterator12()).done;) {
            var flight = _step12.value;
            if (flight.life <= 0) continue;
            var target = this.artHud.chargePoint(flight.segment, this.fieldHeight);
            var progress = 1 - flight.life / 0.55;
            var control = {
              x: (flight.x + target.x) / 2 - 20,
              y: Math.max(flight.y, target.y) + 20
            };
            for (var part = 5; part >= 0; part--) {
              var t = Math.max(0, progress - part * 0.025),
                a = 1 - t;
              var x = a * a * flight.x + 2 * a * t * control.x + t * t * target.x - W / 2;
              var y = a * a * flight.y + 2 * a * t * control.y + t * t * target.y - this.fieldHeight / 2;
              g.fillColor = new Color(67, 221, 213, part === 0 ? 80 : 65 - part * 8);
              g.circle(x, y, part === 0 ? 12 : 7 - part * 0.65);
              g.fill();
              if (part === 0) {
                g.fillColor = new Color(161, 249, 226, 250);
                g.circle(x, y, 5);
                g.fill();
                g.fillColor = new Color(238, 255, 247, 255);
                g.circle(x - 1, y + 1, 2.3);
                g.fill();
              }
            }
          }
        };
        _proto.makeArtSprite = function makeArtSprite(name, width, height, parent, spring) {
          if (parent === void 0) {
            parent = this.node;
          }
          if (spring === void 0) {
            spring = false;
          }
          var node = new Node(name);
          node.addComponent(UITransform).setContentSize(width, height);
          parent.addChild(node);
          var sprite = spring ? node.addComponent(SpringSprite) : node.addComponent(Sprite);
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          return sprite;
        };
        _proto.loadArt = /*#__PURE__*/function () {
          var _loadArt = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
            var _this4 = this;
            var generation, startup, current, retrying, bundle, paths, next, load, effect, _iterator13, _step13, copy, ringEffect;
            return _regeneratorRuntime().wrap(function _callee2$(_context3) {
              while (1) switch (_context3.prev = _context3.next) {
                case 0:
                  generation = ++this.artLoadGeneration;
                  this.artLoadFailed = false;
                  this.artLoadStatus = '资源加载中…';
                  this.artLoadComplete = false;
                  this.loadingFinishScheduled = false;
                  startup = readStartupLoadingProgress();
                  this.loadingProgress.reset(this.startupHandedOff ? this.loadingProgress.value : startup.value);
                  this.artLoadProgress = Math.max(this.loadingProgress.value, startup.target);
                  current = function current() {
                    return generation === _this4.artLoadGeneration && _this4.node.isValid;
                  };
                  retrying = function retrying() {
                    if (current()) _this4.artLoadStatus = '正在重新连接…';
                  };
                  _context3.prev = 10;
                  _context3.next = 13;
                  return retryLoad(function (done) {
                    return assetManager.loadBundle('art', {
                      onFileProgress: function onFileProgress(event) {
                        if (current() && Number.isFinite(event.progress)) {
                          _this4.artLoadProgress = Math.max(_this4.artLoadProgress, Math.min(0.7, event.progress / 100 * 0.7));
                          _this4.artLoadStatus = "\u8D44\u6E90\u52A0\u8F7D\u4E2D " + Math.round(_this4.artLoadProgress * 100) + "%";
                        }
                      }
                    }, done);
                  }, {
                    label: '美术分包',
                    timeoutMs: 45000,
                    onRetry: retrying,
                    isCurrent: current
                  });
                case 13:
                  bundle = _context3.sent;
                  if (current()) {
                    _context3.next = 16;
                    break;
                  }
                  return _context3.abrupt("return");
                case 16:
                  paths = Object.entries(ART_PATHS);
                  next = 0;
                  load = /*#__PURE__*/function () {
                    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
                      var _loop, _ret;
                      return _regeneratorRuntime().wrap(function _callee$(_context2) {
                        while (1) switch (_context2.prev = _context2.next) {
                          case 0:
                            _loop = /*#__PURE__*/_regeneratorRuntime().mark(function _loop() {
                              var _paths$next, key, path, frame, crop, parts, index, cell, completed;
                              return _regeneratorRuntime().wrap(function _loop$(_context) {
                                while (1) switch (_context.prev = _context.next) {
                                  case 0:
                                    _paths$next = paths[next++], key = _paths$next[0], path = _paths$next[1];
                                    if (!_this4.art.has(key)) {
                                      _context.next = 3;
                                      break;
                                    }
                                    return _context.abrupt("return", 0);
                                  case 3:
                                    _context.next = 5;
                                    return retryLoad(function (done) {
                                      return bundle.load(path, SpriteFrame, done);
                                    }, {
                                      label: '美术资源',
                                      timeoutMs: 20000,
                                      onRetry: retrying,
                                      isCurrent: current
                                    });
                                  case 5:
                                    frame = _context.sent;
                                    if (current()) {
                                      _context.next = 8;
                                      break;
                                    }
                                    return _context.abrupt("return", {
                                      v: void 0
                                    });
                                  case 8:
                                    crop = ART_CROPS[key];
                                    if (crop) {
                                      frame = sliceFrame.apply(void 0, [frame].concat(crop));
                                      _this4.croppedFrames.push(frame);
                                    }
                                    _this4.art.set(key, frame);
                                    if (key === 'helper' || key === 'agent') {
                                      parts = {
                                        left: sliceFrame(frame, 13, 68, 83, 101),
                                        right: sliceFrame(frame, 288, 68, 83, 101),
                                        core: sliceFrame(frame, 88, 18, 209, 219)
                                      };
                                      _this4.croppedFrames.push(parts.left, parts.right, parts.core);
                                      _this4.aiFrames.set(key, parts);
                                    }
                                    if (key === 'background') _this4.background.spriteFrame = frame;
                                    _this4.artHud.setArt(key, frame);
                                    _this4["interface"].setArt(key, frame);
                                    if (key === 'idleSheet') {
                                      for (index = 0; index < IDLE_FRAMES; index += 1) {
                                        cell = sliceFrame(frame, index % 8 * 256, Math.floor(index / 8) * 256, 256, 256);
                                        _this4.atlasFrames.push(cell);
                                        _this4.art.set("idle_" + String(index + 1).padStart(2, '0'), cell);
                                      }
                                    }
                                    completed = paths.filter(function (_ref2) {
                                      var name = _ref2[0];
                                      return _this4.art.has(name);
                                    }).length;
                                    _this4.artLoadProgress = Math.max(_this4.artLoadProgress, 0.7 + completed / paths.length * 0.27);
                                    _this4.artLoadStatus = "\u8D44\u6E90\u52A0\u8F7D\u4E2D " + Math.round(_this4.artLoadProgress * 100) + "%";
                                    _this4.syncArt();
                                  case 20:
                                  case "end":
                                    return _context.stop();
                                }
                              }, _loop);
                            });
                          case 1:
                            if (!(next < paths.length && current())) {
                              _context2.next = 10;
                              break;
                            }
                            return _context2.delegateYield(_loop(), "t0", 3);
                          case 3:
                            _ret = _context2.t0;
                            if (!(_ret === 0)) {
                              _context2.next = 6;
                              break;
                            }
                            return _context2.abrupt("continue", 1);
                          case 6:
                            if (!_ret) {
                              _context2.next = 8;
                              break;
                            }
                            return _context2.abrupt("return", _ret.v);
                          case 8:
                            _context2.next = 1;
                            break;
                          case 10:
                          case "end":
                            return _context2.stop();
                        }
                      }, _callee);
                    }));
                    return function load() {
                      return _ref.apply(this, arguments);
                    };
                  }(); // Limit concurrent image decoding on phones; audio follows critical visuals.
                  _context3.next = 21;
                  return Promise.all([load(), load()]);
                case 21:
                  if (current()) {
                    _context3.next = 23;
                    break;
                  }
                  return _context3.abrupt("return");
                case 23:
                  if (this.immunityMaterial) {
                    _context3.next = 32;
                    break;
                  }
                  _context3.next = 26;
                  return retryLoad(function (done) {
                    return bundle.load('effects/immunity-silhouette', EffectAsset, done);
                  }, {
                    label: '护盾轮廓',
                    timeoutMs: 20000,
                    onRetry: retrying,
                    isCurrent: current
                  });
                case 26:
                  effect = _context3.sent;
                  if (current()) {
                    _context3.next = 29;
                    break;
                  }
                  return _context3.abrupt("return");
                case 29:
                  this.immunityMaterial = new Material();
                  this.immunityMaterial.initialize({
                    effectAsset: effect
                  });
                  for (_iterator13 = _createForOfIteratorHelperLoose(this.immunityCopies); !(_step13 = _iterator13()).done;) {
                    copy = _step13.value;
                    copy.customMaterial = this.immunityMaterial;
                  }
                case 32:
                  _context3.next = 34;
                  return retryLoad(function (done) {
                    return bundle.load('effects/settings-ring-recolor', EffectAsset, done);
                  }, {
                    label: '头像原画圆环',
                    timeoutMs: 20000,
                    onRetry: retrying,
                    isCurrent: current
                  });
                case 34:
                  ringEffect = _context3.sent;
                  if (current()) {
                    _context3.next = 37;
                    break;
                  }
                  return _context3.abrupt("return");
                case 37:
                  this.artHud.setPortraitRingEffect(ringEffect);
                  if (!(this.art.size !== ART_FRAME_COUNT)) {
                    _context3.next = 40;
                    break;
                  }
                  throw new Error('美术资源未完整加载');
                case 40:
                  this.artLoadComplete = true;
                  this.audio.load(bundle);
                  this.artLoadProgress = 1;
                  this.syncArt();
                  _context3.next = 55;
                  break;
                case 46:
                  _context3.prev = 46;
                  _context3.t0 = _context3["catch"](10);
                  if (current()) {
                    _context3.next = 50;
                    break;
                  }
                  return _context3.abrupt("return");
                case 50:
                  this.artLoadGeneration++;
                  this.artLoadFailed = true;
                  this.artLoadComplete = false;
                  this.artLoadStatus = '重新加载';
                  console.warn('[art] Loading stopped after retries', _context3.t0);
                case 55:
                case "end":
                  return _context3.stop();
              }
            }, _callee2, this, [[10, 46]]);
          }));
          function loadArt() {
            return _loadArt.apply(this, arguments);
          }
          return loadArt;
        }();
        _proto.pooledSprite = function pooledSprite(pool, index, name, size, parent) {
          while (pool.length <= index) {
            var sprite = this.makeArtSprite("" + name + pool.length, size, size, parent);
            sprite.node.active = false;
            pool.push(sprite);
          }
          return pool[index];
        };
        _proto.makeBulletLayer = function makeBulletLayer(name) {
          var layer = new Node(name);
          layer.addComponent(UITransform).setContentSize(W, this.fieldHeight);
          this.bulletLayer.addChild(layer);
          return layer;
        };
        _proto.pooledAiSprite = function pooledAiSprite(index) {
          while (this.aiSprites.length <= index) {
            var node = new Node("AiPickup" + this.aiSprites.length);
            this.pickupLayer.addChild(node);
            var left = this.makeArtSprite('LeftWing', 27, 33, node);
            var right = this.makeArtSprite('RightWing', 27, 33, node);
            var core = this.makeArtSprite('Core', 68, 72, node);
            node.active = false;
            this.aiSprites.push({
              node: node,
              left: left,
              right: right,
              core: core
            });
          }
          return this.aiSprites[index];
        };
        _proto.drawPlayerTrail = function drawPlayerTrail() {
          var _this5 = this;
          var g = this.trailArt;
          if (!g) return;
          g.clear();
          var points = this.playerTrail.ribbon();
          g.node.active = this.playerSprite.node.active && points.length > 1;
          if (!g.node.active) return;
          var shake = this.paintNode.position;
          // Start near the feet so the torso does not hide most of a short curved trail.
          g.node.setPosition(shake.x, shake.y - 42 * PLAYER_SCALE);
          var shield = this.model.shieldTime > 0;
          // Soft fringe, mint body and a narrow cream highlight, all behind the cat.
          var _loop2 = function _loop2() {
            var layer = _arr[_i];
            var start = layer.width < 0.5 ? [207, 223, 231] : shield ? [195, 160, 210] : [186, 157, 211];
            var end = layer.width < 0.5 ? [255, 246, 221] : shield ? [255, 226, 155] : [111, 221, 215];
            var _loop3 = function _loop3() {
              var a = points[i - 1],
                b = points[i],
                t = (a.progress + b.progress) / 2;
              g.fillColor = _construct(Color, start.map(function (c, channel) {
                return Math.round(c + (end[channel] - c) * t);
              }).concat([Math.round((a.alpha + b.alpha) / 2 * layer.opacity)]));
              var ar = a.radius * layer.width,
                br = b.radius * layer.width;
              g.moveTo(a.x - W / 2 + a.nx * ar, a.y - _this5.fieldHeight / 2 + a.ny * ar);
              g.lineTo(b.x - W / 2 + b.nx * br, b.y - _this5.fieldHeight / 2 + b.ny * br);
              g.lineTo(b.x - W / 2 - b.nx * br, b.y - _this5.fieldHeight / 2 - b.ny * br);
              g.lineTo(a.x - W / 2 - a.nx * ar, a.y - _this5.fieldHeight / 2 - a.ny * ar);
              g.close();
              g.fill();
            };
            for (var i = 1; i < points.length; i++) {
              _loop3();
            }
            var head = points[points.length - 1];
            var cream = layer.width < 0.5;
            g.fillColor = cream ? new Color(255, 246, 221, Math.round(head.alpha * layer.opacity)) : shield ? new Color(255, 226, 155, Math.round(head.alpha * layer.opacity)) : new Color(111, 221, 215, Math.round(head.alpha * layer.opacity));
            g.circle(head.x - W / 2, head.y - _this5.fieldHeight / 2, head.radius * layer.width);
            g.fill();
          };
          for (var _i = 0, _arr = [{
              width: 1.35,
              opacity: 0.14
            }, {
              width: 1,
              opacity: 0.95
            }, {
              width: 0.48,
              opacity: 0.55
            }]; _i < _arr.length; _i++) {
            _loop2();
          }
        };
        _proto.syncArt = function syncArt() {
          var _this$art$get;
          if (!this.playerSprite || !this.bulletLayer) return;
          this.drawShadows();
          this.drawFishGlow();
          this.drawBulletCues();
          this.drawPickupFlights();
          var player = this.model.player;
          var mirror = playerMirrorSign(this.model.playerFacing);
          var frameNumber = Math.floor(this.animationClock * 12) % IDLE_FRAMES + 1;
          var frame = (_this$art$get = this.art.get("idle_" + String(frameNumber).padStart(2, '0'))) != null ? _this$art$get : this.art.get('idle_01');
          this.playerSprite.spriteFrame = frame != null ? frame : null;
          this["interface"].setHero(frame != null ? frame : null);
          this.playerSprite.node.active = !!frame && this.isPlayerVisible();
          var shake = this.paintNode.position;
          var hop = this.guide.rewarding ? Math.min(Math.sin(Math.PI * this.guide.rewardProgress) * 10, Math.max(0, playerMovementTop(this.fieldHeight) - player.y)) : 0;
          this.playerSprite.node.setPosition(player.x - W / 2 + shake.x, player.y - this.fieldHeight / 2 + shake.y + hop);
          var bendY = Math.min(this.bodySpring.y, Math.max(0, playerMovementTop(this.fieldHeight) - player.y - hop));
          this.playerSprite.setBend(this.bodySpring.x * mirror, bendY);
          this.artHud.syncEnergyPosition({
            x: player.x + shake.x + this.bodySpring.x,
            y: player.y + shake.y + hop + bendY
          }, this.fieldHeight, this.model.playerFacing);
          var squash = Math.sin(Math.PI * this.playerHitTime / 0.28);
          this.playerSprite.node.setScale(mirror * (1 + squash * 0.06), 1 - squash * 0.09);
          this.drawPlayerTrail();
          var immunityPulse = (1 - Math.cos(this.animationClock * Math.PI * 2 / 1.5)) / 2;
          var launch = this.shieldReleaseTime / 0.45;
          for (var i = 0; i < this.immunityCopies.length; i++) {
            var copy = this.immunityCopies[i],
              layer = Math.floor(i / 8);
            copy.node.active = this.playerSprite.node.active && this.model.shieldTime > 0;
            if (!copy.node.active) continue;
            copy.spriteFrame = frame != null ? frame : null;
            copy.setBend(this.bodySpring.x * mirror, bendY);
            var pulse = immunityPulse;
            var angle = i % 8 * Math.PI / 4;
            var radius = layer === 0 ? 15 + pulse * 3 + launch * 6 : layer === 1 ? 8 + pulse * 2 + launch * 4 : 3 + pulse * 1.3 + launch * 2;
            var ox = Math.cos(angle) * radius,
              oy = Math.sin(angle) * radius;
            copy.node.setPosition(this.playerSprite.node.position.x + ox, this.playerSprite.node.position.y + oy);
            copy.node.setScale(mirror, 1);
            copy.color = layer === 0 ? new Color(255, 214, 116, Math.round(14 + pulse * 14 + launch * 18)) : layer === 1 ? new Color(255, 228, 154, Math.round(42 + pulse * 23 + launch * 32)) : new Color(255, 246, 207, Math.round(140 + pulse * 65 + launch * 35));
          }
          var bulletIndex = 0;
          for (var _iterator14 = _createForOfIteratorHelperLoose(this.model.bullets), _step14; !(_step14 = _iterator14()).done;) {
            var _this$bulletEyes$eyeI;
            var bullet = _step14.value;
            var _frame2 = this.art.get(bullet.kind);
            if (!_frame2) continue;
            var parent = bullet.kind === 'folder' ? this.folderLayer : this.workLayer;
            var _sprite2 = this.pooledSprite(this.bulletSprites, bulletIndex++, 'WorkBullet', 44, parent);
            // A pooled slot may change kind after removal or spawning; its layer must follow.
            if (_sprite2.node.parent !== parent) _sprite2.node.setParent(parent);
            var size = SPRITE_SIZES[bullet.kind];
            _sprite2.getComponent(UITransform).setContentSize(size.width, size.height);
            _sprite2.spriteFrame = _frame2;
            _sprite2.node.active = true;
            _sprite2.node.setPosition(bullet.x - W / 2, bullet.y - this.fieldHeight / 2);
            var chasing = bullet.kind === 'message' && bullet.state === 'homing';
            var _pulse3 = Math.sin(this.animationClock * (bullet.kind === 'message' ? 11 : 7) + this.eyePhaseCursor * 0.08);
            _sprite2.node.setScale(chasing ? 1.08 + _pulse3 * 0.06 : 1 + _pulse3 * 0.055, chasing ? 1.08 - _pulse3 * 0.045 : 1 - _pulse3 * 0.045);
            _sprite2.node.angle = bullet.kind === 'requirement' ? bullet.turnDirection * 14 * Math.sin(Math.PI * bullet.turnFlash / 0.26) : 0;
            var eyeIndex = bulletIndex - 1;
            var eyes = (_this$bulletEyes$eyeI = this.bulletEyes[eyeIndex]) != null ? _this$bulletEyes$eyeI : this.bulletEyes[eyeIndex] = this.makeGraphics('WorkBulletEyes', _sprite2.node);
            eyes.node.getComponent(UITransform).setContentSize(size.width, size.height);
            this.drawWorkEyes(eyes, bullet, _sprite2.node.angle);
          }
          for (var index = bulletIndex; index < this.bulletSprites.length; index += 1) this.bulletSprites[index].node.active = false;
          var fishFrame = this.art.get('fish');
          var fishIndex = 0;
          if (fishFrame) {
            for (var _iterator15 = _createForOfIteratorHelperLoose(this.model.skillOrbs), _step15; !(_step15 = _iterator15()).done;) {
              var orb = _step15.value;
              var sprite = this.pooledSprite(this.fishSprites, fishIndex++, 'FishPickup', 50, this.pickupLayer);
              sprite.getComponent(UITransform).setContentSize(SPRITE_SIZES.fish.width, SPRITE_SIZES.fish.height);
              sprite.spriteFrame = fishFrame;
              sprite.node.active = true;
              sprite.node.setPosition(orb.x - W / 2, orb.y - this.fieldHeight / 2 + Math.sin(orb.pulse * 5) * 5);
              sprite.node.angle = Math.sin(orb.pulse * 4) * 9;
              var fishScale = 1 + Math.sin(orb.pulse * 5) * 0.11;
              sprite.node.setScale(fishScale, fishScale);
            }
          }
          for (var _index = fishIndex; _index < this.fishSprites.length; _index += 1) this.fishSprites[_index].node.active = false;
          var leaveFrame = this.art.get('leave');
          var leaveIndex = 0;
          if (leaveFrame) {
            for (var _iterator16 = _createForOfIteratorHelperLoose(this.model.leaveSlips), _step16; !(_step16 = _iterator16()).done;) {
              var slip = _step16.value;
              var _sprite = this.pooledSprite(this.leaveSprites, leaveIndex++, 'LeaveSlip', 76, this.pickupLayer);
              _sprite.getComponent(UITransform).setContentSize(78, 52);
              _sprite.spriteFrame = leaveFrame;
              _sprite.node.active = slip.life > 3 || Math.floor(slip.life * 8) % 2 === 0;
              _sprite.node.setPosition(slip.x - W / 2, slip.y - this.fieldHeight / 2 + Math.sin(slip.spin * 4) * 3);
              var slipScale = 1 + Math.sin(slip.spin * 6) * 0.06;
              _sprite.node.setScale(slipScale, slipScale);
              _sprite.node.angle = Math.sin(slip.spin * 3) * 5;
            }
          }
          for (var _index2 = leaveIndex; _index2 < this.leaveSprites.length; _index2++) this.leaveSprites[_index2].node.active = false;
          var aiIndex = 0;
          for (var _iterator17 = _createForOfIteratorHelperLoose(this.model.aiPickups), _step17; !(_step17 = _iterator17()).done;) {
            var pickup = _step17.value;
            var parts = this.aiFrames.get(pickup.kind);
            if (!parts) continue;
            var _sprite3 = this.pooledAiSprite(aiIndex++);
            _sprite3.node.active = true;
            _sprite3.node.setPosition(pickup.x - W / 2, pickup.y - this.fieldHeight / 2 + Math.sin(pickup.phase * 8) * 4);
            _sprite3.core.spriteFrame = parts.core;
            _sprite3.left.spriteFrame = parts.left;
            _sprite3.right.spriteFrame = parts.right;
            var coreScale = 1 + Math.sin(pickup.phase * 8) * 0.045;
            _sprite3.core.node.setScale(coreScale, coreScale);
            var flap = Math.sin(pickup.phase * (pickup.kind === 'agent' ? 28 : 19));
            _sprite3.left.node.setPosition(-40, 5 + flap * 5);
            _sprite3.right.node.setPosition(40, 5 + flap * 5);
            _sprite3.left.node.angle = -flap * 27;
            _sprite3.right.node.angle = flap * 27;
          }
          for (var _index3 = aiIndex; _index3 < this.aiSprites.length; _index3++) this.aiSprites[_index3].node.active = false;
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
          for (var _iterator18 = _createForOfIteratorHelperLoose(art.points), _step18; !(_step18 = _iterator18()).done;) {
            var _step18$value = _step18.value,
              px = _step18$value[0],
              py = _step18$value[1],
              rx = _step18$value[2],
              ry = _step18$value[3];
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
            if (bullet.kind === 'message' || bullet.kind === 'requirement') {
              var eyebrow = bullet.kind === 'message' ? Math.sin(clock * 5) * 3 : Math.sin(clock * 4) * 5;
              g.strokeColor = art.ink;
              g.lineWidth = 2.8;
              g.moveTo(x - coverX * 0.8, y + coverY * 1.18 + eyebrow);
              g.lineTo(x + coverX * 0.8, y + coverY * (bullet.kind === 'message' ? 1.5 : 1.1) - eyebrow);
              g.stroke();
            }
          }
          if (bullet.kind === 'message' && bullet.tauntTime > 0) {
            var t = bullet.tauntTime / 0.9;
            g.strokeColor = new Color(255, 108, 143, Math.round(210 * t));
            g.lineWidth = 2.5;
            g.ellipse(0, 0, size.width * (0.56 + (1 - t) * 0.17), size.height * (0.55 + (1 - t) * 0.17));
            g.stroke();
            for (var i = 0; i < 4; i++) {
              var a = clock * 5 + i * Math.PI / 2;
              g.fillColor = new Color(255, 230, 156, Math.round(240 * t));
              g.circle(Math.cos(a) * size.width * 0.57, Math.sin(a) * size.height * 0.58, 2.5);
              g.fill();
            }
          }
          if (bullet.kind === 'requirement' && bullet.turnFlash > 0) {
            g.strokeColor = new Color(238, 132, 255, Math.round(230 * bullet.turnFlash / 0.26));
            g.lineWidth = 3;
            g.ellipse(0, 0, size.width * 0.55, size.height * 0.54);
            g.stroke();
          }
        };
        _proto.consumeEvents = function consumeEvents() {
          var events = this.model.takeEvents();
          var rated = events.some(function (event) {
            return event.type === 'grade';
          });
          for (var _iterator19 = _createForOfIteratorHelperLoose(events), _step19; !(_step19 = _iterator19()).done;) {
            var event = _step19.value;
            if (event.type === 'pickup') {
              if (this.guide.picked(event.energy)) {
                this["interface"].placeReward(event, this.model.player);
                this.clearInput();
                this.audio.play('wave');
                this.model.invulnerableTime = 0;
                this.playerHitTime = 0;
              }
              if (!this.guide.active) this.shieldCoach.charged(event.energy);
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
              if (!rated) this.audio.play('skill');
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
              if (!rated) this.audio.play('skill');
              this.spawnFloater("\u5DF2\u8BFB\u4E0D\u56DE +" + event.value, event.x, event.y, new Color(255, 218, 150));
            } else if (event.type === 'grade') {
              this.audio.play('grade');
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
            } else if (event.type === 'practice-hit') {
              this.audio.play('hit');
              this.guide.hit();
              this.clearInput();
              this.spawnFloater('工作负荷 +1', event.x, event.y + 72, new Color(255, 190, 145), 28, 1.2);
            } else if (event.type === 'practice-dodged') {
              if (this.guide.avoided()) {
                this["interface"].placeReward(event, this.model.player);
                this.clearInput();
                this.audio.play('wave');
              }
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
              if (this.guide.activatedShield()) {
                this["interface"].placeReward(this.model.player, this.model.player);
                this.clearInput();
                this.model.startPracticeImmunity();
              }
              this.shieldReleaseTime = 0.45;
              this.shieldsUsed += 1;
              this.audio.play('shield');
              if (this.shieldCoach.active) this.progress.markShieldHintSeen();
              this.shieldCoach.released();
            } else if (event.type === 'wave-clear') {
              this.audio.play('wave');
            } else if (event.type === 'difficulty-step') {
              this.audio.play('wave');
            } else if (event.type === 'leave-spawn') {
              this.spawnFloater('请假条出现', event.x, event.y, new Color(255, 255, 255));
            } else if (event.type === 'leave') {
              this.audio.play('leave');
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
            } else if (event.type === 'ai-spawn') {
              if (!this.guide.active) this.spawnFloater(event.kind === 'agent' ? 'Agent 出现' : 'AI 出现', event.x, event.y + 55, event.kind === 'agent' ? new Color(227, 177, 255) : new Color(146, 242, 255));
            } else if (event.type === 'ai-pickup') {
              var taughtAi = this.guide.pickedAi(event.kind, event.removed);
              if (taughtAi) {
                this["interface"].placeReward(event, this.model.player);
                this.clearInput();
                this.audio.play('wave');
              }
              this.audio.play('reduce');
              if (!taughtAi) this.spawnFloater("\u5DE5\u4F5C\u8D1F\u8377 \u2212" + event.removed, event.x, event.y + 45, event.kind === 'agent' ? new Color(225, 167, 255) : new Color(138, 246, 255), 30, 1.2);
              this.bursts.push({
                x: event.x,
                y: event.y,
                life: 0.48,
                maxLife: 0.48,
                radius: 100,
                color: event.kind === 'agent' ? new Color(213, 157, 255) : new Color(121, 226, 255)
              });
            } else if (event.type === 'evil-laugh') {
              this.audio.play('laugh');
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
          this.audio.unlock();
          if (!this.artReady) {
            if (this.artLoadFailed && this["interface"].actionAt(point) === 'primary') {
              this.pendingAction = 'primary';
              this.pendingPoint = point;
            }
            return;
          }
          this.pendingAction = null;
          this.pendingPoint = null;
          var action = this["interface"].actionAt(point);
          if (action) {
            this.pendingAction = action;
            this.pendingPoint = point;
            this["interface"].setPressed(action, point);
            return;
          }
          if (this["interface"].friends.open || this["interface"].helpOpen || this["interface"].exitOpen) return;
          if (this.model.started && !this.model.gameOver && containsReferencePoint(point, SETTINGS_HIT_BOX, this.fieldHeight)) {
            this.togglePause();
            return;
          }
          if (this.model.paused || this.model.gameOver || !this.model.started) return;
          if (this.guide.introducing || this.guide.rewarding || this.guide.ready) return;
          // The portrait is display-only: tapping it never enters the shield gesture.
          if (this.artHud.containsAvatar(point, this.fieldHeight)) return;
          this.dragging = true;
          this.dragOffset.x = this.model.player.x - point.x;
          this.dragOffset.y = this.model.player.y - point.y;
          this.gesture.begin(point.x, point.y, time);
        };
        _proto.drag = function drag(point) {
          if (this.pendingAction) {
            var valid = !!this.pendingPoint && Math.hypot(point.x - this.pendingPoint.x, point.y - this.pendingPoint.y) <= 18 && this["interface"].actionAt(point) === this.pendingAction;
            this["interface"].setPressed(valid ? this.pendingAction : null, point);
            return;
          }
          if (!this.dragging || this.model.gameOver || this.model.paused || this.guide.introducing || this.guide.rewarding || this.guide.ready) return;
          this.gesture.move(point.x, point.y);
          this.model.movePlayer(point.x + this.dragOffset.x, point.y + this.dragOffset.y);
        };
        _proto.release = function release(point, time) {
          this["interface"].setPressed(null);
          if (this.pendingAction && this.pendingPoint) {
            var action = this.pendingAction,
              origin = this.pendingPoint;
            this.pendingAction = null;
            this.pendingPoint = null;
            if (Math.hypot(point.x - origin.x, point.y - origin.y) > 18) return;
            if (!this.artReady && this.artLoadFailed && action === 'primary' && this["interface"].actionAt(point) === action) {
              this.loadArt();
              return;
            }
            if (this["interface"].actionAt(point) === action) this.handleMenuAction(action);
            return;
          }
          if (!this.dragging) return;
          this.dragging = false;
          if (this.gesture.end(point.x, point.y, time)) this.tryActivateShield();
        };
        _proto.tryActivateShield = function tryActivateShield() {
          if (this.guide.active && this.guide.step !== 'shield') return;
          if (this.model.activateShield()) {
            this.hintText = '';
            this.hintTime = 0;
            return;
          }
          this.hintText = this.model.shieldTime > 0 ? '免疫中' : '集满 5 条小鱼后双击免疫';
          this.hintTime = 0.9;
        };
        _proto.onTouchStart = function onTouchStart(event) {
          var id = event.getID(),
            point = this.pointFromUI(event.getUILocation());
          if (this.activeTouchId !== null) return;
          this.activeTouchId = id;
          this.press(point, performance.now() / 1000);
        };
        _proto.onTouchMove = function onTouchMove(event) {
          if (event.getID() === this.activeTouchId) this.drag(this.pointFromUI(event.getUILocation()));
        };
        _proto.onTouchEnd = function onTouchEnd(event) {
          var id = event.getID(),
            point = this.pointFromUI(event.getUILocation());
          if (id !== this.activeTouchId) return;
          this.activeTouchId = null;
          this.release(point, performance.now() / 1000);
        };
        _proto.onTouchCancel = function onTouchCancel(event) {
          if (event && event.getID() !== this.activeTouchId) return;
          this.clearInput();
        };
        _proto.onKeyDown = function onKeyDown(event) {
          this.audio.unlock();
          if (this["interface"].exitOpen) {
            if (event.keyCode === KeyCode.ESCAPE) this.handleMenuAction('exit-cancel');
            return;
          }
          if (this["interface"].helpOpen) {
            if (event.keyCode === KeyCode.ESCAPE) this.handleMenuAction('help-close');
            return;
          }
          if (this["interface"].friends.open) {
            if (event.keyCode === KeyCode.ESCAPE) this.handleMenuAction('friends-close');
            return;
          }
          if (event.keyCode === KeyCode.ESCAPE && this.model.started && !this.model.gameOver) {
            this.togglePause();
            return;
          }
          if (event.keyCode !== KeyCode.SPACE) return;
          if (!this.artReady) return;
          if (this.resume.active) return;
          if (this.guide.introducing && !this.model.paused) {
            this.beginPractice();
            return;
          }
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
          this["interface"].hideExitConfirmation();
          this["interface"].hideHelp();
          this.model.reset();
          this.clearFeedback();
          this.gesture.reset();
          this.dragging = false;
          this.hintTime = this.hitFlash = this.shakeTime = 0;
          this.animationClock = 0;
          this.settlement = null;
          this.shieldsUsed = 0;
          this.guide.start(forceTutorial || this.progress.profile.tutorialRevision !== TUTORIAL_REVISION);
          this.shieldCoach.reset(forceTutorial ? false : this.progress.profile.shieldHintSeen);
          this.model.practiceProtected = this.guide.active;
          if (this.guide.active) this.model.setupPractice();
          this.bodySpring.reset(this.model.player);
          this.updateGuide(0);
          this.clearInput();
          this.sparks.length = this.bursts.length = 0;
          for (var _iterator20 = _createForOfIteratorHelperLoose(this.floaters), _step20; !(_step20 = _iterator20()).done;) {
            var floater = _step20.value;
            floater.life = 0;
            floater.node.active = false;
          }
        };
        _proto.togglePause = function togglePause() {
          if (!this.model.started || this.model.gameOver || !this.appVisible) return;
          if (this.resume.active) this.resume.cancel();else if (this.model.paused) {
            this.resume.start();
            this.audio.play('countdown');
          }
          this.model.paused = true;
          this.syncMusic();
          this.clearInput();
          if (!this.resume.active) this.audio.play('ui');
        };
        _proto.clearInput = function clearInput() {
          this["interface"].setPressed(null);
          this.dragging = false;
          this.gesture.reset();
          this.activeTouchId = null;
          this.pendingAction = null;
          this.pendingPoint = null;
        };
        _proto.handleMenuAction = function handleMenuAction(action) {
          if (action === 'exit-cancel') {
            this["interface"].hideExitConfirmation();
            this.clearInput();
            this.audio.play('ui');
            return;
          }
          if (action === 'exit-confirm') {
            if (this["interface"].exitOpen) this.goHome(true);
            return;
          }
          if (action === 'help-controls' || action === 'help-bullets' || action === 'help-resources') {
            this.clearInput();
            this.audio.play('ui');
            this["interface"].selectHelp(action === 'help-controls' ? 'controls' : action === 'help-bullets' ? 'bullets' : 'resources');
            return;
          }
          if (action === 'help' || action === 'help-close') {
            this.clearInput();
            this.audio.play('ui');
            if (action === 'help') this["interface"].showHelp();else this["interface"].hideHelp();
            return;
          }
          if (action === 'friends') {
            this.clearInput();
            this.audio.play('ui');
            // Create/size the shared canvas first, then ask the open data context to render.
            this["interface"].friends.show(this.friends.available, this.progress.profile.bestScore, this.menuMode === 'result', this.menuMode === 'paused');
            this.requestFriendBoard();
            return;
          }
          if (action === 'friends-close') {
            this["interface"].friends.hide();
            this.friends.hide();
            this.clearInput();
            this.audio.play('ui');
            return;
          }
          if (action === 'friends-refresh') {
            this.audio.play('ui');
            this.friends.sync(this.progress.profile.bestScore);
            this.requestFriendBoard(true);
            return;
          }
          if (action === 'friends-share') {
            this.audio.play('ui');
            if (this.friends.share() === 'unavailable') this["interface"].friends.inform('请在微信中邀请好友');
            return;
          }
          if (action === 'sound') {
            this.progress.setSound(!this.progress.profile.soundEnabled);
            this.audio.enabled = this.progress.profile.soundEnabled;
            this.audio.play('ui');
            return;
          }
          this.audio.play('ui');
          if (action === 'primary') {
            if (this.model.paused) this.togglePause();else if (this.guide.introducing) this.beginPractice();else if (this.guide.ready) this.finishPractice();else this.restart();
          } else if (this.menuMode === 'home') this.restart(true);else if (this.model.paused && !this.model.gameOver) this["interface"].showExitConfirmation();else this.goHome();
        };
        _proto.requestFriendBoard = function requestFriendBoard(feedback) {
          var _this6 = this;
          if (feedback === void 0) {
            feedback = false;
          }
          var state = this.friends.show(function (ok) {
            if (!_this6["interface"].friends.open) return;
            if (ok) _this6["interface"].friends.setAvailability(true, _this6.progress.profile.bestScore);else _this6["interface"].friends.showPrivacy(false, _this6.progress.profile.bestScore);
          });
          if (state === 'pending') this["interface"].friends.showPrivacy(true, this.progress.profile.bestScore);
          if (state === 'unavailable') {
            this["interface"].friends.setAvailability(false, this.progress.profile.bestScore);
            if (feedback) this["interface"].friends.inform('请在微信小游戏中查看');
          }
        };
        _proto.goHome = function goHome(saveRun) {
          if (saveRun === void 0) {
            saveRun = false;
          }
          // Only the player's confirmed exit settles a formal run; fixture/reset calls do not.
          if (saveRun && this.model.started && !this.model.practiceProtected) this.settleCurrentRun();
          this["interface"].hideExitConfirmation();
          this["interface"].hideHelp();
          this.clearInput();
          this.guide.start(false);
          this.shieldCoach.reset(this.progress.profile.shieldHintSeen);
          this.clearFeedback();
          this.model.reset();
          this.model.started = false;
          this.model.gameOver = false;
          this.model.paused = false;
          this.model.practiceProtected = false;
          this.audio.stop();
          this.bodySpring.reset(this.model.player);
          this.model.bullets.length = this.model.skillOrbs.length = this.model.leaveSlips.length = this.model.aiPickups.length = 0;
          this.settlement = null;
          this.hintTime = this.hitFlash = this.shakeTime = 0;
          this.sparks.length = this.bursts.length = 0;
          for (var _iterator21 = _createForOfIteratorHelperLoose(this.floaters), _step21; !(_step21 = _iterator21()).done;) {
            var floater = _step21.value;
            floater.life = 0;
            floater.node.active = false;
          }
        };
        _proto.settleCurrentRun = function settleCurrentRun() {
          if (this.settlement) return;
          this.settlement = this.progress.settle(this.model.stats(), this.shieldsUsed, this.model.energy);
          this.friends.sync(this.progress.profile.bestScore);
        };
        _proto.finishPractice = function finishPractice() {
          if (!this.guide.ready) return;
          this.progress.completeTutorial();
          this.progress.markShieldHintSeen();
          this.restart();
        };
        _proto.beginPractice = function beginPractice() {
          if (!this.guide.beginPractice()) return;
          this.clearInput();
          this.model.update(0);
          this.consumeEvents();
          this.draw();
        };
        _proto.updateGuide = function updateGuide(dt) {
          if (!this.model.started || this.model.gameOver) return;
          this.model.practiceProtected = this.guide.active;
          if (!this.guide.active || this.model.paused || !this.appVisible) return;
          var next = this.guide.advance(dt);
          if (next) {
            this.clearInput();
            if (next === 'practice') {
              this.model.setupPractice();
              this.bodySpring.reset(this.model.player);
              this.playerTrail.clear();
            }
            if (next === 'fish') this.model.startPracticeFish();
            if (next === 'shield') {
              this.model.practicePhase = 'shield';
              this.audio.play('ui');
            }
          }
          if (this.guide.shieldEnded(this.model.shieldTime)) {
            this.clearInput();
            this.model.startPracticeAgent();
            this.audio.play('ui');
          }
        };
        _proto.syncMusic = function syncMusic() {
          this.audio.setMusicActive(this.artReady && this.appVisible && this.model.started && !this.model.paused && !this.model.gameOver);
        };
        _proto.onGameHide = function onGameHide() {
          this.appVisible = false;
          this.resume.cancel();
          this.audio.stop();
          this.clearInput();
          if (this.model.started && !this.model.gameOver) {
            this.model.paused = true;
          }
        };
        _proto.onGameShow = function onGameShow() {
          this.appVisible = true;
        };
        _proto.clearFeedback = function clearFeedback() {
          this.resume.cancel();
          this.playerHitTime = this.shieldBlockTime = this.shieldReleaseTime = 0;
          this.playerTrail.clear();
          for (var _iterator22 = _createForOfIteratorHelperLoose(this.pickupFlights), _step22; !(_step22 = _iterator22()).done;) {
            var flight = _step22.value;
            flight.life = 0;
          }
          this.artHud.clearFeedback();
        };
        _proto.drawImmunity = function drawImmunity() {
          var g = this.immunityArt;
          g.clear();
          var active = this.model.shieldTime > 0;
          var visible = this.artReady && this.model.started && !this.model.gameOver && active && (this.shieldBlockTime > 0 || this.shieldReleaseTime > 0);
          g.node.active = visible;
          var showStatus = this.artReady && active && this.menuMode === 'hidden';
          this.immunityLabel.node.active = showStatus;
          this.immunityLabel.string = showStatus ? '免疫已开启' : '';
          this.immunityLabel.node.setPosition(Math.max(120, Math.min(W - 120, this.model.player.x)) - W / 2, Math.max(26, this.model.player.y - 86) - this.fieldHeight / 2);
          if (!visible) return;
          var x = this.model.player.x - W / 2,
            y = this.model.player.y - this.fieldHeight / 2;
          var sparkle = function sparkle(sx, sy, size, alpha) {
            g.fillColor = new Color(255, 241, 200, alpha);
            g.moveTo(sx, sy + size);
            g.lineTo(sx + size * 0.35, sy + size * 0.25);
            g.lineTo(sx + size, sy);
            g.lineTo(sx + size * 0.35, sy - size * 0.25);
            g.lineTo(sx, sy - size);
            g.lineTo(sx - size * 0.35, sy - size * 0.25);
            g.lineTo(sx - size, sy);
            g.lineTo(sx - size * 0.35, sy + size * 0.25);
            g.close();
            g.fill();
          };
          if (this.shieldReleaseTime > 0) {
            var progress = 1 - this.shieldReleaseTime / 0.45;
            var alpha = Math.round(225 * (1 - progress));
            var radius = 48 + progress * 43;
            g.strokeColor = new Color(255, 228, 149, alpha);
            g.lineWidth = 4 * (1 - progress) + 1;
            g.ellipse(x, y, radius, radius * 0.88);
            g.stroke();
            g.strokeColor = new Color(255, 249, 220, Math.round(alpha * 0.8));
            g.lineWidth = 1.5;
            g.ellipse(x, y, radius + 5, radius * 0.88 + 5);
            g.stroke();
            for (var i = 0; i < 6; i++) {
              var angle = i * Math.PI / 3 + 0.2;
              sparkle(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * 0.88, 3 + (1 - progress) * 5, alpha);
            }
          }
          if (this.shieldBlockTime > 0) {
            var t = 1 - this.shieldBlockTime / 0.3;
            for (var _i2 = -1; _i2 <= 1; _i2++) {
              var _angle = this.shieldBlockAngle + _i2 * 0.4;
              sparkle(x + Math.cos(_angle) * (50 + t * 22), y + Math.sin(_angle) * (50 + t * 22), 8 * (1 - t) + 2, Math.round(250 * (1 - t)));
            }
          }
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

          for (var _iterator23 = _createForOfIteratorHelperLoose(this.model.bullets), _step23; !(_step23 = _iterator23()).done;) {
            var bullet = _step23.value;
            if (this.art.has(bullet.kind)) continue;
            if (bullet.kind === 'message') this.glow(bullet.x, bullet.y, bullet.radius, new Color(255, 77, 77));else if (bullet.kind === 'folder') this.glow(bullet.x, bullet.y, bullet.radius, new Color(255, 206, 66));else this.glow(bullet.x, bullet.y, bullet.radius, new Color(176, 92, 255));
          }
          if (!this.art.has('fish')) {
            for (var _iterator24 = _createForOfIteratorHelperLoose(this.model.skillOrbs), _step24; !(_step24 = _iterator24()).done;) {
              var orb = _step24.value;
              this.glow(orb.x, orb.y, orb.radius + Math.sin(orb.pulse * 5) * 2, new Color(56, 255, 142));
            }
          }

          // Art remains optional during loading; this fallback keeps pickup feedback visible.
          if (!this.art.has('leave')) {
            for (var _iterator25 = _createForOfIteratorHelperLoose(this.model.leaveSlips), _step25; !(_step25 = _iterator25()).done;) {
              var slip = _step25.value;
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
          }
          var p = this.model.player;
          this.drawImmunity();
          if (!this.art.has('idle_01') && (this.model.invulnerableTime <= 0 || Math.floor(this.model.invulnerableTime * 12) % 2 === 0)) this.glow(p.x, p.y, p.radius, new Color(112, 242, 255));

          // 擦弹火花与事件光环
          for (var _iterator26 = _createForOfIteratorHelperLoose(this.sparks), _step26; !(_step26 = _iterator26()).done;) {
            var spark = _step26.value;
            g.fillColor = new Color(255, 255, 210, Math.floor(200 * (spark.life / 0.25)));
            g.circle(spark.x - W / 2, spark.y - this.fieldHeight / 2, 6 + (0.25 - spark.life) * 40);
            g.fill();
          }
          for (var _iterator27 = _createForOfIteratorHelperLoose(this.bursts), _step27; !(_step27 = _iterator27()).done;) {
            var burst = _step27.value;
            var progress = 1 - burst.life / burst.maxLife;
            g.strokeColor = new Color(burst.color.r, burst.color.g, burst.color.b, Math.floor(210 * (1 - progress)));
            g.lineWidth = 6;
            g.circle(burst.x - W / 2, burst.y - this.fieldHeight / 2, burst.radius * progress);
            g.stroke();
          }
          this.artHud.update(this.model, this.artReady && this.menuMode !== 'home' && this.menuMode !== 'result', this.visualDt);
          var overlay = this.overlay;
          overlay.clear();
          // Screen-space damage feedback covers the HUD and actors, without camera shake gaps.
          if (this.hitFlash > 0) {
            overlay.fillColor = new Color(255, 60, 60, Math.floor(90 * (this.hitFlash / 0.5)));
            overlay.rect(-W / 2, -this.fieldHeight / 2, W, this.fieldHeight);
            overlay.fill();
          }
          this.artHud.drawSettingsCover(overlay, this.model.paused, this.fieldHeight);
          var modal = this.menuMode !== 'hidden';
          this.centerText.node.setPosition(16, -this.fieldHeight / 2 + 255);
          this.hintPaper.node.setPosition(0, -this.fieldHeight / 2 + 255);
          if (modal) {
            overlay.fillColor = new Color(52, 42, 65, 90);
            overlay.rect(-W / 2, -this.fieldHeight / 2, W, this.fieldHeight);
            overlay.fill();
          }
          this.centerText.string = modal || !this.artReady ? '' : this.model.leaveSlipFlash > 0 ? '请假获批 · 清屏' : this.hintTime > 0 ? this.hintText : '';
          this.hintPaper.node.active = this.centerText.string.length > 0;
          this["interface"].update(this.menuMode, this.progress.profile, this.settlement, this.model.elapsed, this.visualDt);
          this["interface"].updateCountdown(this.resume.remaining);
          if (!this.artReady) {
            this["interface"].showResourceLoading(this.artLoadStatus, this.artLoadFailed, this.loadingProgress.value);
          } else this["interface"].finishLoading();
          if (!this.startupHandedOff && (this.art.has('loadingUI') || this.artReady || this.artLoadFailed)) {
            // Re-read the platform animation at the actual handoff, not at loader entry.
            var startup = readStartupLoadingProgress();
            this.loadingProgress.value = Math.max(this.loadingProgress.value, startup.value);
            this.loadingProgress.report(Math.max(this.artLoadProgress, startup.target));
            if (!this.artReady) this["interface"].showResourceLoading(this.artLoadStatus, this.artLoadFailed, this.loadingProgress.value);
            this.startupHandedOff = true;
            dismissStartupCover();
            notifyStartupLoadingReady();
          }
          this["interface"].updateGuide(this.guide, false, {
            player: this.model.player,
            target: this.guide.step === 'fish' ? this.model.skillOrbs[0] : this.guide.step === 'agent' ? this.model.aiPickups[0] : undefined,
            time: this.animationClock
          });
        };
        _createClass(GameMain, [{
          key: "menuMode",
          get: function get() {
            return !this.model.started ? 'home' : this.model.gameOver ? 'result' : this.resume.active ? 'resuming' : this.model.paused ? 'paused' : this.guide.introducing ? 'tutorial-intro' : this.guide.ready ? 'tutorial-ready' : 'hidden';
          }
        }]);
        return GameMain;
      }(Component)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameModel.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameLayout.ts'], function (exports) {
  var _extends, _createForOfIteratorHelperLoose, _createClass, cclegacy, DESIGN_WIDTH, DESIGN_HEIGHT, PLAYER_BODY, PLAYER_EDGE_MARGIN, playerMovementTop, playerMirrorSign, PLAYER_START_Y, HUD_SAFE_HEIGHT, TOP_SPAWN_MARGIN, FOLDER_SPACING, FOLDER_RADIUS;
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
      PLAYER_EDGE_MARGIN = module.PLAYER_EDGE_MARGIN;
      playerMovementTop = module.playerMovementTop;
      playerMirrorSign = module.playerMirrorSign;
      PLAYER_START_Y = module.PLAYER_START_Y;
      HUD_SAFE_HEIGHT = module.HUD_SAFE_HEIGHT;
      TOP_SPAWN_MARGIN = module.TOP_SPAWN_MARGIN;
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
      var SHIELD_DURATION = exports('SHIELD_DURATION', 3);

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
      /** 消息生成预留需求表位置，保持混合弹幕且不突破共享上限。 */
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
      var LEAVE_SLIP_ROLL_INTERVAL = exports('LEAVE_SLIP_ROLL_INTERVAL', 28);
      var LEAVE_SLIP_CHANCE = exports('LEAVE_SLIP_CHANCE', 0.35);
      /** 请假条清屏：每条被清掉的弹幕折算的积分 */
      var LEAVE_SLIP_CLEAR_VALUE = exports('LEAVE_SLIP_CLEAR_VALUE', 10);
      var LEAVE_SLIP_LIFETIME = exports('LEAVE_SLIP_LIFETIME', 12);
      var LEAVE_SLIP_INVULNERABLE = exports('LEAVE_SLIP_INVULNERABLE', 1.0);
      var AI_PICKUP_ROLL_INTERVAL = exports('AI_PICKUP_ROLL_INTERVAL', 15);
      var AI_PICKUP_CHANCE = exports('AI_PICKUP_CHANCE', 0.6);
      var AI_AGENT_CHANCE_AT_TWO = exports('AI_AGENT_CHANCE_AT_TWO', 0.4);
      var AI_PICKUP_SPEED = exports('AI_PICKUP_SPEED', {
        helper: 76,
        agent: 190
      });
      var MAX_EVENTS = exports('MAX_EVENTS', 48);
      var PHASE_LABELS = exports('PHASE_LABELS', {
        simple: '简单',
        normal: '一般',
        hard: '困难'
      });
      var HARD_TIER_SECONDS = exports('HARD_TIER_SECONDS', 45);
      var HARD_LATE_TIER_SECONDS = exports('HARD_LATE_TIER_SECONDS', 30);
      var HARD_LATE_START_SECONDS = exports('HARD_LATE_START_SECONDS', HARD_TIER_SECONDS * 6);
      var HARD_RAMP_SECONDS = exports('HARD_RAMP_SECONDS', 12);
      var HARD_BREATH_SECONDS = exports('HARD_BREATH_SECONDS', 5);
      var SIMPLE_WAVE_SECONDS = exports('SIMPLE_WAVE_SECONDS', 8);
      var NORMAL_WAVE_SECONDS = exports('NORMAL_WAVE_SECONDS', 16);
      var HARD_START_SECONDS = exports('HARD_START_SECONDS', SIMPLE_WAVE_SECONDS + NORMAL_WAVE_SECONDS);

      /** 波次保留原来的计分口径；困难压力前六档每 45 秒、此后每 30 秒升档。 */
      var FIXED_WAVES = [{
        wave: 1,
        phase: 'simple',
        duration: SIMPLE_WAVE_SECONDS,
        messages: false,
        requirements: true,
        walls: false,
        messageInterval: 0,
        requirementInterval: 1.1,
        wallInterval: 0,
        speedScale: 1.0,
        maxThreats: 8,
        gapWidth: 180,
        maxHoming: 0
      }, {
        wave: 2,
        phase: 'normal',
        duration: NORMAL_WAVE_SECONDS,
        messages: false,
        requirements: true,
        walls: true,
        messageInterval: 0,
        requirementInterval: 1.5,
        wallInterval: 7.0,
        speedScale: 1.1,
        maxThreats: 8,
        gapWidth: 180,
        maxHoming: 0
      }];
      var HARD_PRESSURE = [{
        messageInterval: 3.4,
        requirementInterval: 2.2,
        wallInterval: 9.0,
        speedScale: 1.04,
        maxThreats: 7,
        gapWidth: 180,
        maxHoming: 1
      }, {
        messageInterval: 3.1,
        requirementInterval: 2.15,
        wallInterval: 8.8,
        speedScale: 1.06,
        maxThreats: 8,
        gapWidth: 176,
        maxHoming: 1
      }, {
        messageInterval: 2.8,
        requirementInterval: 2.1,
        wallInterval: 8.6,
        speedScale: 1.08,
        maxThreats: 10,
        gapWidth: 172,
        maxHoming: 1
      }, {
        messageInterval: 2.4,
        requirementInterval: 2.0,
        wallInterval: 8.4,
        speedScale: 1.11,
        maxThreats: 11,
        gapWidth: 168,
        maxHoming: 1
      }, {
        messageInterval: 2.15,
        requirementInterval: 1.95,
        wallInterval: 8.2,
        speedScale: 1.13,
        maxThreats: 12,
        gapWidth: 164,
        maxHoming: 2
      }, {
        messageInterval: 1.9,
        requirementInterval: 1.9,
        wallInterval: 8.0,
        speedScale: 1.15,
        maxThreats: 13,
        gapWidth: 160,
        maxHoming: 2
      }];

      /** 困难阶段 270 秒后继续加压；540 秒起过渡到三颗追踪，最终参数有界。 */
      function hardTargetFor(tier) {
        if (tier <= HARD_PRESSURE.length) return HARD_PRESSURE[Math.max(0, tier - 1)];
        var extra = tier - HARD_PRESSURE.length;
        var base = HARD_PRESSURE[HARD_PRESSURE.length - 1];
        return {
          messageInterval: Math.max(1.0, base.messageInterval * Math.pow(0.97, extra)),
          requirementInterval: Math.max(1.4, base.requirementInterval * Math.pow(0.99, extra)),
          wallInterval: Math.max(6.0, base.wallInterval * Math.pow(0.99, extra)),
          speedScale: Math.min(1.36, base.speedScale + 0.008 * extra),
          maxThreats: Math.min(20, base.maxThreats + Math.floor(extra / 2)),
          gapWidth: Math.max(128, base.gapWidth - 2 * extra),
          maxHoming: extra >= 10 ? 3 : 2
        };
      }
      var hardTierFor = exports('hardTierFor', function hardTierFor(hardSeconds) {
        var seconds = Math.max(0, hardSeconds);
        return seconds < HARD_LATE_START_SECONDS ? Math.floor(seconds / HARD_TIER_SECONDS) + 1 : HARD_PRESSURE.length + Math.floor((seconds - HARD_LATE_START_SECONDS) / HARD_LATE_TIER_SECONDS) + 1;
      });
      var hardTierPositionFor = function hardTierPositionFor(hardSeconds) {
        var seconds = Math.max(0, hardSeconds);
        return seconds < HARD_LATE_START_SECONDS ? {
          elapsed: seconds % HARD_TIER_SECONDS,
          duration: HARD_TIER_SECONDS
        } : {
          elapsed: (seconds - HARD_LATE_START_SECONDS) % HARD_LATE_TIER_SECONDS,
          duration: HARD_LATE_TIER_SECONDS
        };
      };
      function waveConfigFor(wave, waveTimer) {
        if (waveTimer === void 0) {
          waveTimer = 0;
        }
        var safeWave = Math.max(1, Math.floor(wave));
        if (safeWave <= FIXED_WAVES.length) return _extends({}, FIXED_WAVES[safeWave - 1]);
        var hardSeconds = (safeWave - 3) * 60 + Math.max(0, waveTimer);
        var tier = hardTierFor(hardSeconds);
        var target = hardTargetFor(tier);
        var previous = hardTargetFor(Math.max(1, tier - 1));
        var progress = Math.min(1, hardTierPositionFor(hardSeconds).elapsed / HARD_RAMP_SECONDS);
        var blend = progress * progress * (3 - 2 * progress);
        var interpolate = function interpolate(key) {
          return previous[key] + (target[key] - previous[key]) * blend;
        };
        return {
          wave: safeWave,
          phase: 'hard',
          duration: 60,
          messages: true,
          requirements: true,
          walls: true,
          messageInterval: interpolate('messageInterval'),
          requirementInterval: interpolate('requirementInterval'),
          wallInterval: interpolate('wallInterval'),
          speedScale: interpolate('speedScale'),
          maxThreats: Math.floor(interpolate('maxThreats') + 1e-9),
          gapWidth: interpolate('gapWidth'),
          maxHoming: blend < 1 ? previous.maxHoming : target.maxHoming
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
          this.tauntTime = 0;
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
        _proto2.update = function update(dt, player, allowLock) {
          if (allowLock === void 0) {
            allowLock = true;
          }
          this.tauntTime = Math.max(0, this.tauntTime - dt);
          var result = null;
          var distSq = distanceSquared(this, player);
          if (!this.armed && distSq > Math.pow(this.senseRadius, 2)) this.armed = true;
          if (this.state === 'cruise' && this.armed && allowLock && distSq <= Math.pow(this.senseRadius, 2)) {
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
          this.playerFacing = -1;
          this.bullets = [];
          this.skillOrbs = [];
          this.leaveSlips = [];
          this.aiPickups = [];
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
          this.practicePhase = 'dodge';
          this.practiceResolved = false;
          this.practiceOrigin = {
            x: 360,
            y: 360
          };
          this.messageTimer = 0.6;
          this.requirementTimer = 2.3;
          this.wallTimer = 4;
          this.skillTimer = 2.5;
          this.leaveSlipRollTimer = LEAVE_SLIP_ROLL_INTERVAL;
          this.aiPickupRollTimer = AI_PICKUP_ROLL_INTERVAL;
          this.evilLaughCooldown = 0;
          this.lastGapPosition = null;
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
          if (Number.isFinite(value)) this.energy = clamp(this.energy + value, 0, 100);
        };
        _proto4.activateShield = function activateShield() {
          if (this.gameOver || this.paused || this.energy < 100 || this.shieldTime > 0) return false;
          this.energy = 0;
          this.shieldTime = SHIELD_DURATION;
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
          if (this.paused || !Number.isFinite(x) || !Number.isFinite(y)) return;
          var nextX = clamp(x, PLAYER_EDGE_MARGIN, this.width - PLAYER_EDGE_MARGIN);
          var dx = nextX - this.player.x;
          if (dx !== 0) this.playerFacing = dx > 0 ? 1 : -1;
          this.player.x = nextX;
          this.player.y = clamp(y, 90, playerMovementTop(this.height, this.player.radius));
        }

        /** Signed circle-to-capsule separation; one geometry for damage, pickups and near misses. */;
        _proto4.playerClearance = function playerClearance(target) {
          var x = this.player.x + PLAYER_BODY.offsetX * playerMirrorSign(this.playerFacing);
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
          this.messageTimer = config.messages ? 3.4 : 1.2;
          this.requirementTimer = 1.0;
          this.wallTimer = config.messages ? 5.0 : 2.5;
        };
        _proto4.reset = function reset() {
          this.bullets.length = 0;
          this.skillOrbs.length = 0;
          this.leaveSlips.length = this.aiPickups.length = 0;
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
          this.practicePhase = 'dodge';
          this.practiceResolved = false;
          this.player.x = this.width / 2;
          this.player.y = PLAYER_START_Y * this.height / FIELD_HEIGHT;
          this.playerFacing = -1;
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
          this.aiPickupRollTimer = AI_PICKUP_ROLL_INTERVAL;
          this.evilLaughCooldown = 0;
          this.lastGapPosition = null;
          var config = this.config;
          this.messageTimer = Math.min(0.6, config.messageInterval || 0.85);
          this.requirementTimer = Math.min(1.6, config.requirementInterval || 2.3);
          this.wallTimer = Math.min(2, config.wallInterval || 4);
          this.skillTimer = 1.8;
          this.spawnOpeningVolley();
        }

        /** A nearby, predictable volley. Resources appear only after their preceding lesson. */;
        _proto4.setupPractice = function setupPractice() {
          this.practiceProtected = true;
          this.practicePhase = 'dodge';
          this.practiceResolved = false;
          this.energy = 80;
          this.workload = 2;
          this.shieldTime = this.invulnerableTime = 0;
          this.player.x = this.width / 2;
          this.player.y = PLAYER_START_Y * this.height / FIELD_HEIGHT;
          this.practiceOrigin = _extends({}, this.player);
          this.bullets.length = this.skillOrbs.length = this.leaveSlips.length = this.aiPickups.length = this.walls.length = this.events.length = 0;
          for (var i = 0; i < 3; i++) {
            this.bullets.push(createRequirement(this.player.x + (i - 1) * 90, this.player.y + 195 + i % 2 * 30, 0, -90, this.random));
          }
        };
        _proto4.startPracticeFish = function startPracticeFish() {
          this.practicePhase = 'fish';
          this.bullets.length = 0;
          this.skillOrbs.push({
            kind: 'skill',
            x: this.player.x < this.width / 2 ? this.width * 0.65 : this.width * 0.35,
            y: clamp(this.player.y + 230, 330, playerMovementTop(this.height, this.player.radius) - 120),
            radius: 17,
            alive: true,
            pulse: 0
          });
        };
        _proto4.startPracticeImmunity = function startPracticeImmunity() {
          this.practicePhase = 'shield';
          this.bullets.length = 0;
          // A harmless contact during immunity makes its effect visible.
          this.bullets.push(createRequirement(this.player.x, this.player.y + 100, 0, -70, this.random));
        };
        _proto4.startPracticeAgent = function startPracticeAgent() {
          this.practicePhase = 'agent';
          this.bullets.length = this.aiPickups.length = 0;
          var fromLeft = this.player.x >= this.width / 2;
          var pickup = {
            kind: 'agent',
            x: fromLeft ? -48 : this.width + 48,
            y: clamp(this.player.y + 150, 310, playerMovementTop(this.height, this.player.radius) - 110),
            vx: fromLeft ? 110 : -110,
            vy: 0,
            radius: 27,
            alive: true,
            life: Infinity,
            phase: 0
          };
          this.aiPickups.push(pickup);
          this.pushEvent({
            type: 'ai-spawn',
            kind: 'agent',
            x: pickup.x,
            y: pickup.y
          });
        }

        /** 简单波开局齐射：开局直接放 3 颗紫弹进场，避免开局几秒场上太空。 */;
        _proto4.spawnOpeningVolley = function spawnOpeningVolley() {
          var speed = 125 * this.config.speedScale;
          for (var index = 0; index < 3; index += 1) {
            var fromLeft = index % 2 === 0;
            this.bullets.push(createRequirement(fromLeft ? -25 : this.width + 25, clamp(this.player.y - 160 + index * 160 + this.random() * 80, 160, this.height - HUD_SAFE_HEIGHT - 90), fromLeft ? speed : -speed, (this.random() - 0.5) * 80, this.random));
          }
        };
        _proto4.update = function update(dt) {
          var _this = this;
          if (!this.started || this.gameOver || this.paused || !Number.isFinite(dt)) return;
          dt = clamp(dt, 0, 0.05);
          this.leaveSlipFlash = Math.max(0, this.leaveSlipFlash - dt);
          var previousTier = this.difficultyTier;
          if (!this.practiceProtected) {
            this.elapsed += dt;
            this.waveTimer += dt;
          }
          var config = this.config;
          this.shieldTime = Math.max(0, this.shieldTime - dt);
          if (this.shieldTime < 1e-6) this.shieldTime = 0;
          this.shieldBlockCooldown = Math.max(0, this.shieldBlockCooldown - dt);
          this.invulnerableTime = Math.max(0, this.invulnerableTime - dt);
          this.evilLaughCooldown = Math.max(0, this.evilLaughCooldown - dt);
          this.grazeCooldown = Math.max(0, this.grazeCooldown - dt);
          if (!this.practiceProtected) this.realtimeScore += dt * 10 * waveMultiplierFor(this.wave) * this.comboMultiplier;
          this.updateCombo(dt);
          this.syncScore();
          if (!this.practiceProtected) this.spawn(dt, config);
          var homingCount = 0;
          for (var _iterator = _createForOfIteratorHelperLoose(this.bullets), _step; !(_step = _iterator()).done;) {
            var bullet = _step.value;
            if (bullet.alive && bullet.kind === 'message' && bullet.state === 'homing') homingCount += 1;
          }
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.bullets), _step2; !(_step2 = _iterator2()).done;) {
            var _bullet = _step2.value;
            var event = null;
            if (_bullet.kind === 'message') {
              var wasHoming = _bullet.state === 'homing';
              event = _bullet.update(dt, this.player, homingCount < config.maxHoming);
              if (!wasHoming && _bullet.state === 'homing') homingCount += 1;
              if (wasHoming && _bullet.state === 'cruise') homingCount -= 1;
            } else if (_bullet.kind === 'requirement' && !this.practiceProtected) _bullet.update(dt);else {
              _bullet.x += _bullet.vx * dt;
              _bullet.y += _bullet.vy * dt;
            }
            var clearance = this.playerClearance(_bullet);
            if (clearance <= 0) {
              if (this.shieldTime > 0) {
                if (this.shieldBlockCooldown <= 0) {
                  this.shieldBlockCooldown = 0.22;
                  this.pushEvent({
                    type: 'shield-block',
                    x: _bullet.x,
                    y: _bullet.y
                  });
                }
              } else if (this.practiceProtected) {
                if (this.practicePhase === 'dodge' && !this.practiceResolved) {
                  this.practiceResolved = true;
                  this.workload = 3;
                  this.invulnerableTime = 0.75;
                  this.pushEvent({
                    type: 'hit',
                    x: this.player.x,
                    y: this.player.y,
                    workload: 3
                  });
                  this.pushEvent({
                    type: 'practice-hit',
                    x: this.player.x,
                    y: this.player.y
                  });
                }
              } else if (this.hitPlayer()) _bullet.alive = false;
            } else if (!this.practiceProtected && clearance <= GRAZE_CLEARANCE) {
              this.tryGraze(_bullet);
            }
            if (this.gameOver) {
              this.recycleDead();
              return;
            }
            if (!this.practiceProtected && event === 'lock-lost' && this.shieldTime <= 0) {
              var value = Math.round(30 * this.comboMultiplier);
              this.bonusScore += value;
              this.breakLocks += 1;
              this.syncScore();
              this.pushEvent({
                type: 'break',
                x: _bullet.x,
                y: _bullet.y,
                value: value
              });
              this.evaluateBurst('break', _bullet.x, _bullet.y);
            }
            if (_bullet.x < -90 || _bullet.x > this.width + 90 || _bullet.y < -90 || _bullet.y > this.height + 90) _bullet.alive = false;
          }
          if (this.practiceProtected && this.practicePhase === 'dodge' && !this.practiceResolved && this.bullets.length === 3 && this.bullets.every(function (b) {
            return b.y < _this.practiceOrigin.y - 70;
          }) && Math.hypot(this.player.x - this.practiceOrigin.x, this.player.y - this.practiceOrigin.y) >= 80) {
            this.practiceResolved = true;
            this.bullets.length = 0;
            this.pushEvent({
              type: 'practice-dodged',
              x: this.player.x,
              y: this.player.y
            });
          }
          this.updateWalls();
          for (var _iterator3 = _createForOfIteratorHelperLoose(this.skillOrbs), _step3; !(_step3 = _iterator3()).done;) {
            var orb = _step3.value;
            orb.pulse += dt;
            if ((!this.practiceProtected || this.practicePhase === 'fish') && this.shieldTime <= 0 && this.playerClearance(orb) <= 0) {
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
          this.updateAiPickups(dt);
          this.recycleDead();

          // All waves continue immediately, preserving live objects and skill timers.
          if (!this.gameOver && this.waveTimer >= config.duration) {
            if (config.phase === 'hard') {
              this.stepHardWave();
            } else {
              this.completeWave();
            }
          }
          if (!this.gameOver && !this.practiceProtected && previousTier > 0 && this.difficultyTier > previousTier) {
            this.pushEvent({
              type: 'difficulty-step',
              tier: this.difficultyTier
            });
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
          for (var _iterator4 = _createForOfIteratorHelperLoose(this.bullets), _step4; !(_step4 = _iterator4()).done;) {
            var bullet = _step4.value;
            if (bullet.kind !== 'folder') count += 1;
          }
          return count;
        };
        _proto4.countRequirements = function countRequirements() {
          var count = 0;
          for (var _iterator5 = _createForOfIteratorHelperLoose(this.bullets), _step5; !(_step5 = _iterator5()).done;) {
            var bullet = _step5.value;
            if (bullet.kind === 'requirement') count += 1;
          }
          return count;
        };
        _proto4.spawn = function spawn(dt, config) {
          if (this.waveState !== 'running') return;
          // 每轮末尾放慢新弹幕；现有弹幕、角色和拾取物继续正常更新。
          var spawnDt = this.pressureBreathing ? dt / 2.5 : dt;
          if (config.messages) {
            this.messageTimer -= spawnDt;
            if (this.messageTimer <= 0) {
              var reserved = Math.max(0, REQUIREMENT_FLOOR - this.countRequirements());
              if (this.countThreats() < config.maxThreats - reserved) {
                var x = 40 + this.random() * (this.width - 80);
                var speed = 145 * config.speedScale;
                var dir = normalize(this.player.x - x + (this.random() - 0.5) * 280, this.player.y - this.height);
                var message = createMessage(x, this.height + TOP_SPAWN_MARGIN, dir.x * speed, dir.y * speed);
                this.bullets.push(message);
                if (this.evilLaughCooldown <= 0 && this.random() < 0.35) {
                  message.tauntTime = 0.9;
                  this.evilLaughCooldown = 12 + this.random() * 12;
                  this.pushEvent({
                    type: 'evil-laugh',
                    x: message.x,
                    y: message.y
                  });
                }
              }
              this.messageTimer = config.messageInterval;
            }
          }
          if (config.requirements) {
            this.requirementTimer -= spawnDt;
            if (this.requirementTimer <= 0) {
              if (this.countThreats() < config.maxThreats) {
                var fromLeft = this.random() < 0.5;
                var _speed = 125 * config.speedScale;
                var _x = fromLeft ? -25 : this.width + 25;
                var directed = this.random() < 0.5;
                var y = directed ? this.player.y + (this.random() - 0.5) * 280 : 130 + this.random() * (this.height - HUD_SAFE_HEIGHT - 220);
                y = clamp(y, 130, this.height - HUD_SAFE_HEIGHT - 90);
                if (Math.hypot(_x - this.player.x, y - this.player.y) < 240) {
                  y = clamp(this.player.y + (this.player.y < this.height / 2 ? 260 : -260), 130, this.height - HUD_SAFE_HEIGHT - 90);
                }
                var direction = directed ? normalize(this.player.x - _x, this.player.y - y + (this.random() - 0.5) * 120) : normalize(fromLeft ? 1 : -1, (this.random() - 0.5) * 0.8);
                var requirement = createRequirement(_x, y, direction.x * _speed, direction.y * _speed, this.random);
                if (directed) requirement.turnTimer = Math.max(requirement.turnTimer, Math.min(3, Math.hypot(_x - this.player.x, y - this.player.y) / _speed));
                this.bullets.push(requirement);
              }
              this.requirementTimer = config.requirementInterval;
            }
          }
          if (config.walls) {
            // 无预警：计时到点直接生成文件夹墙（不做边缘预告）
            if (this.wallTimer > 0) this.wallTimer -= this.pressureBreathing ? 0 : dt;else if (!this.pressureBreathing && this.walls.length < 2) {
              this.spawnWall(config);
              this.wallTimer = config.wallInterval;
            }
          }
          this.skillTimer -= dt;
          if (this.skillTimer <= 0 && this.skillOrbs.length < 3) {
            var _x2 = 0,
              _y = 0;
            for (var attempt = 0; attempt < 6; attempt += 1) {
              var angle = this.random() * Math.PI * 2;
              var reach = 150 + this.random() * 90;
              _x2 = clamp(this.player.x + Math.cos(angle) * reach, 70, this.width - 70);
              _y = clamp(this.player.y + Math.sin(angle) * reach, 170, this.height - HUD_SAFE_HEIGHT - 70);
              if (distanceSquared({
                x: _x2,
                y: _y
              }, this.player) >= Math.pow(100, 2)) break;
              _x2 = clamp(this.player.x + (this.player.x < this.width / 2 ? 180 : -180), 70, this.width - 70);
            }
            this.skillOrbs.push({
              kind: 'skill',
              x: _x2,
              y: _y,
              radius: 17,
              alive: true,
              pulse: 0
            });
            this.skillTimer = 4.0;
          }
        };
        _proto4.spawnWall = function spawnWall(config) {
          var gapPosition = 0.1 + this.random() * 0.8;
          if (this.lastGapPosition !== null) {
            var maxShift = 0.3;
            gapPosition = clamp(gapPosition, this.lastGapPosition - maxShift, this.lastGapPosition + maxShift);
          }
          this.lastGapPosition = gapPosition;
          var wall = createFolderWall(this.width, gapPosition, config.gapWidth, this.height + TOP_SPAWN_MARGIN, 115 * config.speedScale);
          var state = {
            gapStart: wall.gapStart,
            gapEnd: wall.gapEnd,
            evaluated: false,
            orbs: []
          };
          for (var _iterator6 = _createForOfIteratorHelperLoose(wall.orbs), _step6; !(_step6 = _iterator6()).done;) {
            var created = _step6.value;
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
                for (var _iterator7 = _createForOfIteratorHelperLoose(aliveOrbs), _step7; !(_step7 = _iterator7()).done;) {
                  var orb = _step7.value;
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
          for (var _iterator8 = _createForOfIteratorHelperLoose(this.leaveSlips), _step8; !(_step8 = _iterator8()).done;) {
            var slip = _step8.value;
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
        _proto4.updateAiPickups = function updateAiPickups(dt) {
          if (this.practiceProtected && (this.practicePhase !== 'agent' || this.shieldTime > 0)) {
            for (var _iterator9 = _createForOfIteratorHelperLoose(this.aiPickups), _step9; !(_step9 = _iterator9()).done;) {
              var pickup = _step9.value;
              pickup.phase += dt;
            }
            return;
          }
          // Healing has no purpose at zero workload. A two-slot agent must also leave
          // immediately if the player now has only one slot to clear.
          if (this.workload <= 0) {
            this.aiPickups.length = 0;
            this.aiPickupRollTimer = Math.min(this.aiPickupRollTimer, 8);
            return;
          }
          var upper = playerMovementTop(this.height, this.player.radius) - 60;
          for (var _iterator10 = _createForOfIteratorHelperLoose(this.aiPickups), _step10; !(_step10 = _iterator10()).done;) {
            var _pickup = _step10.value;
            if (!_pickup.alive) continue;
            if (_pickup.kind === 'agent' && this.workload < 2) {
              _pickup.alive = false;
              continue;
            }
            _pickup.life -= dt;
            _pickup.phase += dt;
            if (_pickup.life <= 0) {
              _pickup.alive = false;
              continue;
            }
            _pickup.x += _pickup.vx * dt;
            _pickup.y += _pickup.vy * dt;
            if (this.practiceProtected) {
              var parkX = _pickup.vx > 0 ? this.width * 0.28 : this.width * 0.72;
              if (_pickup.vx > 0 && _pickup.x >= parkX || _pickup.vx < 0 && _pickup.x <= parkX) {
                _pickup.x = parkX;
                _pickup.vx = 0;
              }
            } else if (_pickup.x < 65 || _pickup.x > this.width - 65) {
              _pickup.x = clamp(_pickup.x, 65, this.width - 65);
              _pickup.vx = _pickup.x === 65 ? Math.abs(_pickup.vx) : -Math.abs(_pickup.vx);
            }
            if (_pickup.y < 165 || _pickup.y > upper) {
              _pickup.y = clamp(_pickup.y, 165, upper);
              _pickup.vy = _pickup.y === 165 ? Math.abs(_pickup.vy) : -Math.abs(_pickup.vy);
            }
            if (this.playerClearance(_pickup) <= 0) {
              _pickup.alive = false;
              var removed = Math.min(this.workload, _pickup.kind === 'agent' ? 2 : 1);
              this.workload -= removed;
              this.pushEvent({
                type: 'ai-pickup',
                kind: _pickup.kind,
                x: _pickup.x,
                y: _pickup.y,
                removed: removed,
                workload: this.workload
              });
            }
          }
          if (this.practiceProtected || this.aiPickups.some(function (pickup) {
            return pickup.alive;
          })) return;
          this.aiPickupRollTimer -= dt;
          if (this.aiPickupRollTimer > 0) return;
          this.aiPickupRollTimer = AI_PICKUP_ROLL_INTERVAL;
          if (this.random() >= AI_PICKUP_CHANCE) return;
          this.spawnAiPickup();
        };
        _proto4.spawnAiPickup = function spawnAiPickup() {
          var kind = this.workload >= 2 && this.random() < AI_AGENT_CHANCE_AT_TWO ? 'agent' : 'helper';
          var speed = AI_PICKUP_SPEED[kind];
          var x = 75 + this.random() * (this.width - 150);
          var y = 180 + this.random() * Math.max(1, playerMovementTop(this.height, this.player.radius) - 270);
          for (var attempt = 0; attempt < 8 && distanceSquared({
            x: x,
            y: y
          }, this.player) < Math.pow(170, 2); attempt += 1) {
            x = 75 + this.random() * (this.width - 150);
            y = 180 + this.random() * Math.max(1, playerMovementTop(this.height, this.player.radius) - 270);
          }
          var direction = this.random() * Math.PI * 2;
          this.aiPickups.push({
            kind: kind,
            x: x,
            y: y,
            vx: Math.cos(direction) * speed,
            vy: Math.sin(direction) * speed,
            radius: 27,
            alive: true,
            life: kind === 'agent' ? 8 : 11,
            phase: this.random() * Math.PI * 2
          });
          this.pushEvent({
            type: 'ai-spawn',
            kind: kind,
            x: x,
            y: y
          });
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
          for (var _iterator11 = _createForOfIteratorHelperLoose(this.bullets), _step11; !(_step11 = _iterator11()).done;) {
            var bullet = _step11.value;
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

        /** 每 60 秒结算一次困难波次奖励，压力升档独立计时。 */;
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
          for (var _iterator12 = _createForOfIteratorHelperLoose(this.bullets), _step12; !(_step12 = _iterator12()).done;) {
            var bullet = _step12.value;
            if (bullet.alive) this.bullets[write++] = bullet;else if (bullet.kind === 'folder' && this.bulletPool.length < 64) this.bulletPool.push(bullet);
          }
          this.bullets.length = write;
          write = 0;
          for (var _iterator13 = _createForOfIteratorHelperLoose(this.skillOrbs), _step13; !(_step13 = _iterator13()).done;) {
            var orb = _step13.value;
            if (orb.alive) this.skillOrbs[write++] = orb;
          }
          this.skillOrbs.length = write;
          write = 0;
          for (var _iterator14 = _createForOfIteratorHelperLoose(this.leaveSlips), _step14; !(_step14 = _iterator14()).done;) {
            var slip = _step14.value;
            if (slip.alive) this.leaveSlips[write++] = slip;
          }
          this.leaveSlips.length = write;
          write = 0;
          for (var _iterator15 = _createForOfIteratorHelperLoose(this.aiPickups), _step15; !(_step15 = _iterator15()).done;) {
            var pickup = _step15.value;
            if (pickup.alive) this.aiPickups[write++] = pickup;
          }
          this.aiPickups.length = write;
        };
        _createClass(GameModel, [{
          key: "folderWalls",
          get: function get() {
            return this.walls;
          }
        }, {
          key: "config",
          get: function get() {
            return waveConfigFor(this.wave, this.waveTimer);
          }
        }, {
          key: "hardElapsed",
          get: function get() {
            return this.wave < 3 ? 0 : (this.wave - 3) * 60 + this.waveTimer;
          }
        }, {
          key: "difficultyTier",
          get: function get() {
            return this.wave < 3 ? 0 : hardTierFor(this.hardElapsed);
          }
        }, {
          key: "pressureBreathing",
          get: function get() {
            if (this.wave < 3) return false;
            var position = hardTierPositionFor(this.hardElapsed);
            return position.elapsed >= position.duration - HARD_BREATH_SECONDS;
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

System.register("chunks:///_virtual/GuideCatalog.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "09afapTU9pPcYW3hclHh9cT", "GuideCatalog", undefined);
      var GUIDE_PAGES = exports('GUIDE_PAGES', {
        controls: {
          footer: '',
          rows: [{
            icon: '',
            title: '拖动走位',
            body: '按住并拖动屏幕，躲开工作弹幕。'
          }, {
            icon: '',
            title: '双击免疫',
            body: '满 5 条小鱼，松手双击免疫 3 秒。'
          }, {
            icon: '',
            title: '工作负荷',
            body: '碰撞 +1 格，满 3 格结束。'
          }]
        },
        bullets: {
          footer: '注意躲避',
          rows: [{
            icon: 'requirement',
            title: '需求表',
            body: '会突然转向，注意避让。'
          }, {
            icon: 'folder',
            title: '文件夹',
            body: '成排推进，穿缝加分。'
          }, {
            icon: 'message',
            title: '消息',
            body: '短暂追踪，甩开可加分。'
          }]
        },
        resources: {
          footer: '均可拾取',
          rows: [{
            icon: 'fish',
            title: '小鱼',
            body: '能量 +1；免疫时不拾取。'
          }, {
            icon: 'leave',
            title: '请假条',
            body: '清屏保护 1 秒，不减负。'
          }, {
            icon: 'helper',
            title: 'AI',
            body: '拾取减少 1 格工作负荷。'
          }, {
            icon: 'agent',
            title: 'Agent',
            body: '拾取减少 2 格工作负荷。'
          }]
        }
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/main", ['./FinalArtHud.ts', './GameInterface.ts', './GameMain.ts', './OfficeSkin.ts', './OfficeUi.ts', './PlatformServices.ts', './SpringSprite.ts', './AsyncLoading.ts', './BodySpring.ts', './GameExperience.ts', './GameLayout.ts', './GameModel.ts', './GuideCatalog.ts', './PlayerTrail.ts', './PortraitMotion.ts'], function () {
  return {
    setters: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    execute: function () {}
  };
});

System.register("chunks:///_virtual/OfficeSkin.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './FinalArtHud.ts', './OfficeUi.ts'], function (exports) {
  var _createForOfIteratorHelperLoose, cclegacy, Node, UITransform, Sprite, Graphics, sliceFrame, officePanel, officeButton, officeFolder;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      Node = module.Node;
      UITransform = module.UITransform;
      Sprite = module.Sprite;
      Graphics = module.Graphics;
    }, function (module) {
      sliceFrame = module.sliceFrame;
    }, function (module) {
      officePanel = module.officePanel;
      officeButton = module.officeButton;
      officeFolder = module.officeFolder;
    }],
    execute: function () {
      cclegacy._RF.push({}, "94d3exA5JVF2bkEaMp+VcLm", "OfficeSkin", undefined);

      /** Shared illustrated panels/icons and native buttons, with live text laid out above them. */
      var OfficeSkin = exports('OfficeSkin', /*#__PURE__*/function () {
        function OfficeSkin() {
          this.frames = new Map();
          this.owned = [];
          this.slots = [];
        }
        var _proto = OfficeSkin.prototype;
        _proto.sprite = function sprite(parent, name, key, width, height, panel) {
          if (panel === void 0) {
            panel = false;
          }
          var node = new Node(name);
          parent.addChild(node);
          node.addComponent(UITransform);
          var sprite = node.addComponent(Sprite);
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          var slot = {
            sprite: sprite,
            key: key,
            width: width,
            height: height,
            panel: panel
          };
          if (panel) {
            var fallback = new Node(name + '-LoadingFallback');
            node.addChild(fallback);
            fallback.addComponent(UITransform);
            slot.fallback = fallback.addComponent(Graphics);
          }
          this.slots.push(slot);
          this.refresh(slot);
          return sprite;
        };
        _proto.size = function size(sprite, width, height) {
          var slot = this.slots.find(function (s) {
            return s.sprite === sprite;
          });
          if (slot.width === width && slot.height === height) return;
          slot.width = width;
          slot.height = height;
          this.refresh(slot);
        };
        _proto.setArt = function setArt(key, source) {
          if (key === 'uiPanel') {
            var frame = sliceFrame(source, 0, 0, 1024, 1536);
            frame.insetTop = 240;
            frame.insetBottom = 260;
            frame.insetLeft = 120;
            frame.insetRight = 120;
            this.owned.push(frame);
            this.frames.set(key, frame);
          } else if (key === 'uiIcons') {
            // Crop each illustration to its visible silhouette, then preserve its aspect ratio.
            var crops = {
              speaker: [109, 114, 468, 431],
              book: [667, 144, 536, 417],
              trophy: [76, 691, 538, 468],
              home: [676, 692, 516, 471]
            };
            for (var _i = 0, _Object$entries = Object.entries(crops); _i < _Object$entries.length; _i++) {
              var _Object$entries$_i = _Object$entries[_i],
                name = _Object$entries$_i[0],
                crop = _Object$entries$_i[1];
              var _frame = sliceFrame.apply(void 0, [source].concat(crop));
              this.owned.push(_frame);
              this.frames.set(name, _frame);
            }
          } else if (key === 'uiButton') {
            var _frame2 = sliceFrame(source, 45, 115, 2030, 480);
            _frame2.insetLeft = _frame2.insetRight = 310;
            _frame2.insetTop = _frame2.insetBottom = 100;
            this.owned.push(_frame2);
            this.frames.set('greenButton', _frame2);
          } else this.frames.set(key, source);
          for (var _iterator = _createForOfIteratorHelperLoose(this.slots), _step; !(_step = _iterator()).done;) {
            var slot = _step.value;
            this.refresh(slot);
          }
        };
        _proto.refresh = function refresh(slot) {
          // A native paper fallback is visible until the illustrated folder is ready.
          if (slot.fallback && (slot.key === 'greenButton' || slot.key === 'uiPanel' && !this.frames.has('uiPanel'))) {
            slot.sprite.enabled = false;
            slot.sprite.node.setScale(1, 1);
            slot.sprite.node.getComponent(UITransform).setContentSize(slot.width, slot.height);
            slot.fallback.node.active = true;
            if (slot.paintedWidth !== slot.width || slot.paintedHeight !== slot.height) {
              slot.fallback.clear();
              if (slot.key === 'uiPanel') officePanel(slot.fallback, slot.width, slot.height);else officeButton(slot.fallback, {
                x: 0,
                y: 0,
                width: slot.width,
                height: slot.height
              });
              slot.paintedWidth = slot.width;
              slot.paintedHeight = slot.height;
            }
            return;
          }
          var frame = this.frames.get(slot.key);
          if (!frame) {
            slot.sprite.node.getComponent(UITransform).setContentSize(slot.width, slot.height);
            if (slot.fallback) {
              slot.fallback.clear();
              if (slot.key === 'greenButton') officeButton(slot.fallback, {
                x: 0,
                y: 0,
                width: slot.width,
                height: slot.height
              });else officeFolder(slot.fallback, slot.width, slot.height);
            }
            return;
          }
          if (slot.fallback) slot.fallback.node.active = false;
          var sprite = slot.sprite,
            width = slot.width,
            height = slot.height;
          sprite.enabled = true;
          sprite.spriteFrame = frame;
          if (slot.panel) {
            // Retain source width so the clip and round corners never distort horizontally.
            var button = slot.key === 'greenButton',
              folder = slot.key === 'uiPanel';
            // The source includes the clip above the main body. Keep it outside the content
            // padding, while preserving every top/bottom corner and the circular hanging hole.
            var visualWidth = folder ? width + 36 : width;
            var visualHeight = folder ? height + 52 : height;
            var scale = button ? height / frame.rect.height : visualWidth / frame.rect.width;
            sprite.type = Sprite.Type.SLICED;
            sprite.node.setScale(scale, scale);
            if (folder) sprite.node.setPosition(0, 14);
            sprite.node.getComponent(UITransform).setContentSize(visualWidth / scale, visualHeight / scale);
          } else {
            var _scale = Math.min(width / frame.rect.width, height / frame.rect.height);
            sprite.node.getComponent(UITransform).setContentSize(frame.rect.width * _scale, frame.rect.height * _scale);
          }
        };
        _proto.destroy = function destroy() {
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.owned), _step2; !(_step2 = _iterator2()).done;) {
            var frame = _step2.value;
            frame.destroy();
          }
        };
        return OfficeSkin;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/OfficeUi.ts", ['cc'], function (exports) {
  var cclegacy, Color;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
    }],
    execute: function () {
      exports({
        officeButton: officeButton,
        officeChevron: officeChevron,
        officeClose: officeClose,
        officeContains: officeContains,
        officeFolder: officeFolder,
        officeIcon: officeIcon,
        officeNotice: officeNotice,
        officePanel: officePanel,
        officeRow: officeRow,
        officeSwitch: officeSwitch,
        officeUnderline: officeUnderline
      });
      cclegacy._RF.push({}, "b0b80fVFglIYrwKx0W4Ar+k", "OfficeUi", undefined);

      /** Shared live UI skin: matches the approved orange folders without baking dynamic text into images. */
      var OFFICE = exports('OFFICE', {
        ink: new Color(48, 15, 59),
        muted: new Color(109, 74, 105),
        paper: new Color(255, 245, 220),
        gold: new Color(255, 176, 33),
        orange: new Color(225, 104, 16),
        cream: new Color(255, 227, 156),
        purple: new Color(161, 76, 200),
        green: new Color(68, 218, 83),
        cyan: new Color(36, 216, 246)
      });
      var UI_METRICS = exports('UI_METRICS', {
        body: 28,
        title: 42,
        touchPixels: 48,
        rowGap: 20,
        closeSize: 56
      });
      function officeContains(b, x, y, minimum) {
        if (minimum === void 0) {
          minimum = 0;
        }
        return Math.abs(x - b.x) <= Math.max(minimum, b.width) / 2 && Math.abs(y - b.y) <= Math.max(minimum, b.height) / 2;
      }
      var rgba = function rgba(r, g, b, a) {
        if (a === void 0) {
          a = 255;
        }
        return new Color(r, g, b, a);
      };
      function rect(g, x, y, w, h, r, color, stroke, line) {
        if (line === void 0) {
          line = 2;
        }
        g.fillColor = color;
        g.roundRect(x, y, w, h, r);
        g.fill();
        if (stroke) {
          g.strokeColor = stroke;
          g.lineWidth = line;
          g.stroke();
        }
      }
      function circle(g, x, y, radius, fill, stroke, line) {
        if (line === void 0) {
          line = 2;
        }
        g.fillColor = fill;
        g.circle(x, y, radius);
        g.fill();
        if (stroke) {
          g.strokeColor = stroke;
          g.lineWidth = line;
          g.stroke();
        }
      }
      function officeFolder(g, width, height, compact) {
        if (compact === void 0) {
          compact = false;
        }
        var x = -width / 2,
          y = -height / 2;
        rect(g, x + 7, y - 11, width + 8, height + 6, 25, rgba(48, 15, 59, 52));
        if (!compact) {
          rect(g, x - 10, y + 13, width, height - 20, 24, OFFICE.orange, OFFICE.ink, 3);
          rect(g, x + 12, y + 23, width, height - 24, 24, OFFICE.gold, OFFICE.ink, 3);
          rect(g, x + 24, height / 2 - 27, width * 0.34, 39, 12, OFFICE.gold, OFFICE.ink, 3);
        }
        rect(g, x, y, width, height, compact ? 17 : 25, OFFICE.orange, OFFICE.ink, compact ? 2 : 4);
        rect(g, x + 4, y + 7, width - 8, height - 10, compact ? 15 : 23, OFFICE.gold);
        rect(g, x + 11, y + 13, width - 22, height - 21, compact ? 13 : 20, OFFICE.cream);
        rect(g, x + 16, y + 18, width - 32, height - 31, compact ? 10 : 18, OFFICE.paper, rgba(255, 253, 238), 2);
        if (!compact) {
          // The purple clip sits above the paper, leaving the header below it readable.
          circle(g, 0, height / 2 + 3, 23, OFFICE.ink);
          circle(g, 0, height / 2 + 5, 19, OFFICE.purple);
          rect(g, -61, height / 2 - 28, 122, 44, 10, OFFICE.ink);
          rect(g, -57, height / 2 - 24, 114, 39, 8, rgba(105, 42, 140));
          rect(g, -54, height / 2 - 19, 108, 33, 8, OFFICE.purple);
          rect(g, -49, height / 2 - 13, 98, 4, 2, rgba(216, 154, 237));
          circle(g, 0, height / 2 + 6, 8, OFFICE.ink);
          circle(g, 0, height / 2 + 6, 4, rgba(217, 161, 237));
        }
      }

      /** Soft paper folder: broad warm edges and a single cartoon outline, shared by all large dialogs. */
      function officePanel(g, width, height) {
        var x = -width / 2,
          y = -height / 2,
          top = height / 2;
        var outline = rgba(89, 43, 49);
        // One offset cover supplies the depth; the front keeps a broad, quiet paper surface.
        rect(g, x + 5, y - 13, width + 12, height + 7, 37, rgba(45, 22, 40, 48));
        g.fillColor = rgba(239, 153, 47);
        g.strokeColor = outline;
        g.lineWidth = 4;
        g.moveTo(x + 24, y + 8);
        g.lineTo(x - 8, y + 18);
        g.quadraticCurveTo(x - 20, y + 22, x - 17, y + 39);
        g.lineTo(x + 4, top - 25);
        g.quadraticCurveTo(x + 6, top - 6, x + 26, top - 4);
        g.lineTo(width / 2 - 5, top + 8);
        g.lineTo(width / 2 + 12, y + 32);
        g.quadraticCurveTo(width / 2 + 12, y + 15, width / 2 - 8, y + 14);
        g.close();
        g.fill();
        g.stroke();
        rect(g, x + 50, top - 15, width * 0.29, 43, 14, rgba(255, 185, 59), outline, 4);
        rect(g, x + 57, top + 13, width * 0.29 - 14, 6, 3, rgba(255, 223, 137));
        rect(g, x + 13, y + 18, width, height - 16, 31, rgba(246, 165, 45), outline, 4);

        // A wide orange band and cream sheet replace the former narrow metallic rails.
        rect(g, x, y, width, height, 34, rgba(241, 147, 38), outline, 4.5);
        rect(g, x + 4, y + 10, width - 8, height - 14, 30, rgba(255, 193, 76));
        rect(g, x + 18, y + 22, width - 36, height - 41, 21, rgba(255, 245, 220), rgba(235, 169, 75), 2.5);
        g.strokeColor = rgba(255, 229, 162);
        g.lineWidth = 5;
        g.moveTo(x + 8, top - 46);
        g.quadraticCurveTo(x + 8, top - 9, x + 43, top - 9);
        g.lineTo(-83, top - 9);
        g.stroke();
        // A restrained paper curl repeats the scorecard motif without introducing another icon.
        g.fillColor = rgba(233, 181, 104, 72);
        g.moveTo(x + 27, top - 59);
        g.lineTo(x + 59, top - 27);
        g.lineTo(x + 60, top - 58);
        g.close();
        g.fill();
        g.fillColor = rgba(255, 224, 164);
        g.strokeColor = rgba(193, 126, 62);
        g.lineWidth = 2;
        g.moveTo(x + 28, top - 56);
        g.lineTo(x + 55, top - 29);
        g.lineTo(x + 55, top - 53);
        g.quadraticCurveTo(x + 43, top - 56, x + 28, top - 56);
        g.close();
        g.fill();
        g.stroke();

        // One chunky purple clip, with a circular hanging hole and a softly shaded lower jaw.
        var s = Math.min(1, width / 620);
        rect(g, -73 * s, top - 37 * s, 146 * s, 49 * s, 11 * s, rgba(106, 58, 53, 42));
        g.fillColor = rgba(153, 75, 178);
        g.strokeColor = OFFICE.ink;
        g.lineWidth = 4 * s;
        g.moveTo(-62 * s, top - 30 * s);
        g.lineTo(62 * s, top - 30 * s);
        g.quadraticCurveTo(72 * s, top - 30 * s, 72 * s, top - 20 * s);
        g.lineTo(72 * s, top + 3 * s);
        g.quadraticCurveTo(72 * s, top + 13 * s, 62 * s, top + 13 * s);
        g.lineTo(26 * s, top + 13 * s);
        g.bezierCurveTo(26 * s, top + 27.36 * s, 14.36 * s, top + 39 * s, 0, top + 39 * s);
        g.bezierCurveTo(-14.36 * s, top + 39 * s, -26 * s, top + 27.36 * s, -26 * s, top + 13 * s);
        g.lineTo(-62 * s, top + 13 * s);
        g.quadraticCurveTo(-72 * s, top + 13 * s, -72 * s, top + 3 * s);
        g.lineTo(-72 * s, top - 20 * s);
        g.quadraticCurveTo(-72 * s, top - 30 * s, -62 * s, top - 30 * s);
        g.close();
        g.fill();
        g.stroke();
        rect(g, -66 * s, top - 25 * s, 132 * s, 8 * s, 4 * s, rgba(111, 46, 139));
        rect(g, -62 * s, top + 3 * s, 124 * s, 4 * s, 2 * s, rgba(223, 172, 237));
        circle(g, 0, top + 17 * s, 8.5 * s, OFFICE.ink, rgba(225, 179, 236), 2.5 * s);
      }
      function officeRow(g, b, green) {
        if (green === void 0) {
          green = false;
        }
        var x = b.x - b.width / 2,
          y = b.y - b.height / 2;
        rect(g, x, y - 2, b.width, b.height, 19, rgba(191, 135, 61, 24));
        rect(g, x, y, b.width, b.height, 19, green ? rgba(218, 244, 198) : rgba(247, 221, 178), green ? rgba(177, 217, 155) : rgba(235, 194, 140), 1.5);
        rect(g, x + 3, y + b.height - 12, b.width - 6, 8, 4, green ? rgba(241, 255, 230, 130) : rgba(255, 247, 222, 140));
      }
      function officeButton(g, b, kind) {
        if (kind === void 0) {
          kind = 'green';
        }
        if (kind !== 'green') {
          officeRow(g, b);
          return;
        }
        var x = b.x - b.width / 2,
          y = b.y - b.height / 2,
          r = Math.min(b.height / 2, 28);
        rect(g, x + 2, y - 5, b.width, b.height, r, rgba(108, 57, 12, 55));
        rect(g, x, y, b.width, b.height, r, OFFICE.ink);
        rect(g, x + 3, y + 4, b.width - 6, b.height - 7, r - 2, kind === 'green' ? rgba(17, 128, 76) : OFFICE.orange);
        rect(g, x + 6, y + 8, b.width - 12, b.height - 14, r - 4, kind === 'green' ? OFFICE.green : kind === 'gold' ? OFFICE.gold : OFFICE.paper);
        rect(g, x + 10, y + b.height * 0.53, b.width - 20, b.height * 0.34, r - 7, kind === 'green' ? rgba(107, 237, 105) : kind === 'gold' ? rgba(255, 213, 66) : rgba(255, 253, 240));
        g.fillColor = kind === 'green' ? rgba(193, 255, 174, 230) : rgba(255, 255, 245, 240);
        g.ellipse(x + 24, y + b.height - 20, 9, 4);
        g.fill();
        g.ellipse(x + b.width - 22, y + 18, 6, 3);
        g.fill();
      }
      function officeUnderline(g, width, y) {
        g.strokeColor = OFFICE.gold;
        g.lineWidth = 5;
        g.moveTo(-width / 2, y);
        g.quadraticCurveTo(0, y + 9, width / 2, y);
        g.stroke();
      }
      function officeChevron(g, x, y, size) {
        if (size === void 0) {
          size = 12;
        }
        g.strokeColor = OFFICE.ink;
        g.lineWidth = 5;
        g.moveTo(x - size / 3, y + size / 2);
        g.lineTo(x + size / 3, y);
        g.lineTo(x - size / 3, y - size / 2);
        g.stroke();
      }
      function officeSwitch(g, b, enabled) {
        var x = b.x - b.width / 2,
          y = b.y - b.height / 2,
          r = b.height / 2;
        rect(g, x, y - 2, b.width, b.height, r, OFFICE.ink);
        rect(g, x + 3, y + 3, b.width - 6, b.height - 6, r - 3, enabled ? OFFICE.green : rgba(207, 190, 208));
        circle(g, b.x + (enabled ? 1 : -1) * (b.width / 2 - r), b.y + 1, r - 6, OFFICE.paper, rgba(117, 90, 117), 2);
      }
      function officeIcon(g, kind, x, y, size) {
        if (size === void 0) {
          size = 44;
        }
        var s = size / 44;
        if (kind === 'fish') {
          g.fillColor = OFFICE.cyan;
          g.strokeColor = OFFICE.ink;
          g.lineWidth = 2.5 * s;
          g.moveTo(x + 12 * s, y);
          g.lineTo(x + 27 * s, y + 12 * s);
          g.quadraticCurveTo(x + 30 * s, y, x + 27 * s, y - 12 * s);
          g.close();
          g.fill();
          g.stroke();
          g.ellipse(x - 2 * s, y, 23 * s, 15 * s);
          g.fill();
          g.stroke();
          circle(g, x - 12 * s, y + 4 * s, 3.2 * s, OFFICE.ink);
          g.strokeColor = rgba(232, 255, 252);
          g.lineWidth = 2 * s;
          g.moveTo(x - 8 * s, y + 10 * s);
          g.lineTo(x + 3 * s, y + 10 * s);
          g.stroke();
        } else if (kind === 'speaker') {
          rect(g, x - 20 * s, y - 9 * s, 14 * s, 18 * s, 3 * s, OFFICE.purple, OFFICE.ink, 2 * s);
          g.fillColor = OFFICE.purple;
          g.moveTo(x - 8 * s, y + 10 * s);
          g.lineTo(x + 5 * s, y + 18 * s);
          g.lineTo(x + 5 * s, y - 18 * s);
          g.lineTo(x - 8 * s, y - 10 * s);
          g.close();
          g.fill();
          g.stroke();
          g.strokeColor = OFFICE.purple;
          g.lineWidth = 3 * s;
          for (var _i = 0, _arr = [13, 21]; _i < _arr.length; _i++) {
            var d = _arr[_i];
            g.moveTo(x + d * s, y - 13 * s);
            g.quadraticCurveTo(x + (d + 10) * s, y, x + d * s, y + 13 * s);
            g.stroke();
          }
        } else if (kind === 'trophy') {
          g.strokeColor = OFFICE.orange;
          g.lineWidth = 4 * s;
          for (var _i2 = 0, _arr2 = [-1, 1]; _i2 < _arr2.length; _i2++) {
            var sign = _arr2[_i2];
            g.moveTo(x + sign * 14 * s, y + 14 * s);
            g.bezierCurveTo(x + sign * 33 * s, y + 22 * s, x + sign * 30 * s, y - 12 * s, x + sign * 10 * s, y - 8 * s);
            g.stroke();
          }
          g.fillColor = OFFICE.gold;
          g.strokeColor = OFFICE.ink;
          g.lineWidth = 2 * s;
          g.moveTo(x - 17 * s, y + 19 * s);
          g.lineTo(x + 17 * s, y + 19 * s);
          g.quadraticCurveTo(x + 15 * s, y - 10 * s, x, y - 13 * s);
          g.quadraticCurveTo(x - 15 * s, y - 10 * s, x - 17 * s, y + 19 * s);
          g.close();
          g.fill();
          g.stroke();
          rect(g, x - 4 * s, y - 20 * s, 8 * s, 11 * s, 2 * s, OFFICE.gold, OFFICE.ink, s);
          rect(g, x - 14 * s, y - 25 * s, 28 * s, 7 * s, 3 * s, OFFICE.gold, OFFICE.ink, 2 * s);
        } else if (kind === 'gear') {
          g.fillColor = OFFICE.purple;
          g.strokeColor = OFFICE.ink;
          g.lineWidth = 2 * s;
          for (var i = 0; i < 32; i++) {
            var a = i * Math.PI / 16,
              r = (i % 4 < 2 ? 21 : 16) * s;
            if (i === 0) g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);else g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
          }
          g.close();
          g.fill();
          g.stroke();
          circle(g, x, y, 8 * s, OFFICE.paper, OFFICE.ink, 2 * s);
        } else if (kind === 'shield') {
          g.fillColor = OFFICE.cream;
          g.strokeColor = OFFICE.ink;
          g.lineWidth = 2.5 * s;
          g.moveTo(x - 18 * s, y + 18 * s);
          g.lineTo(x, y + 24 * s);
          g.lineTo(x + 18 * s, y + 18 * s);
          g.quadraticCurveTo(x + 19 * s, y - 13 * s, x, y - 24 * s);
          g.quadraticCurveTo(x - 19 * s, y - 13 * s, x - 18 * s, y + 18 * s);
          g.close();
          g.fill();
          g.stroke();
          g.strokeColor = rgba(30, 157, 90);
          g.lineWidth = 4 * s;
          g.moveTo(x - 10 * s, y);
          g.lineTo(x - 2 * s, y - 8 * s);
          g.lineTo(x + 12 * s, y + 9 * s);
          g.stroke();
        } else {
          rect(g, x - 18 * s, y - 22 * s, 36 * s, 44 * s, 5 * s, OFFICE.paper, OFFICE.ink, 2 * s);
          rect(g, x - 7 * s, y + 17 * s, 14 * s, 8 * s, 3 * s, OFFICE.purple, OFFICE.ink, 1.5 * s);
          for (var _i3 = 0; _i3 < 3; _i3++) {
            rect(g, x - 12 * s, y + (7 - _i3 * 10) * s, 5 * s, 5 * s, s, OFFICE.cream);
            rect(g, x - 2 * s, y + (8 - _i3 * 10) * s, 14 * s, 3 * s, s, OFFICE.purple);
          }
        }
      }
      function officeNotice(g, width, height, icon) {
        if (icon === void 0) {
          icon = 'fish';
        }
        officeRow(g, {
          x: 0,
          y: 0,
          width: width,
          height: height
        }, icon === 'shield');
        rect(g, -width / 2 + 10, -height / 2 + 12, 5, height - 24, 2, icon === 'shield' ? rgba(91, 184, 89) : OFFICE.gold);
      }

      /** A round paper inset with a drawn cross, independent of font baseline/metrics. */
      function officeClose(g, b) {
        var r = Math.min(b.width, b.height) / 2 - 3;
        circle(g, b.x, b.y - 2, r + 1, rgba(130, 78, 63, 110));
        circle(g, b.x, b.y, r, OFFICE.ink);
        circle(g, b.x, b.y, r - 2.5, OFFICE.paper);
        circle(g, b.x, b.y + 1, r - 5, rgba(249, 235, 213));
        g.fillColor = OFFICE.ink;
        var d = r * 0.29;
        for (var _i4 = 0, _arr3 = [-1, 1]; _i4 < _arr3.length; _i4++) {
          var direction = _arr3[_i4];
          var t = 1.8;
          g.moveTo(b.x - d - t, b.y - d * direction + t * direction);
          g.lineTo(b.x - d + t, b.y - d * direction - t * direction);
          g.lineTo(b.x + d + t, b.y + d * direction - t * direction);
          g.lineTo(b.x + d - t, b.y + d * direction + t * direction);
          g.close();
          g.fill();
        }
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/PlatformServices.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameExperience.ts'], function (exports) {
  var _createClass, cclegacy, game, sys, director, Director, AudioClip, Node, AudioSource, PROGRESS_KEY, TUTORIAL_REVISION, settleRun, freshProgress, readProgress;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
      game = module.game;
      sys = module.sys;
      director = module.director;
      Director = module.Director;
      AudioClip = module.AudioClip;
      Node = module.Node;
      AudioSource = module.AudioSource;
    }, function (module) {
      PROGRESS_KEY = module.PROGRESS_KEY;
      TUTORIAL_REVISION = module.TUTORIAL_REVISION;
      settleRun = module.settleRun;
      freshProgress = module.freshProgress;
      readProgress = module.readProgress;
    }],
    execute: function () {
      exports({
        dismissStartupCover: dismissStartupCover,
        notifyStartupLoadingReady: notifyStartupLoadingReady,
        readStartupLoadingProgress: readStartupLoadingProgress,
        readUiViewport: readUiViewport
      });
      cclegacy._RF.push({}, "b661bTRXb1JaZpbtmof9bdX", "PlatformServices", undefined);
      var startupLoading = function startupLoading() {
        var _offworkStartup;
        return (_offworkStartup = game.__offworkStartup) != null ? _offworkStartup : globalThis.__offworkStartup;
      };
      var coverDismissScheduled = false;
      function readStartupLoadingProgress() {
        var _startup$getProgress, _startup$getTarget;
        var startup = startupLoading();
        return {
          value: (_startup$getProgress = startup == null ? void 0 : startup.getProgress()) != null ? _startup$getProgress : 0,
          target: (_startup$getTarget = startup == null ? void 0 : startup.getTarget()) != null ? _startup$getTarget : 0
        };
      }

      /** A DOM cover must survive until the Cocos frame behind it has actually drawn. */
      function dismissStartupCover() {
        var _startupLoading;
        if (!sys.isBrowser || typeof document === 'undefined' || coverDismissScheduled || !document.getElementById('startup-cover')) return;
        coverDismissScheduled = true;
        (_startupLoading = startupLoading()) == null || _startupLoading.freeze == null || _startupLoading.freeze();
        director.once(Director.EVENT_AFTER_DRAW, function () {
          var _startupLoading2, _document$getElementB;
          (_startupLoading2 = startupLoading()) == null || _startupLoading2.end();
          (_document$getElementB = document.getElementById('startup-cover')) == null || _document$getElementB.remove();
          coverDismissScheduled = false;
        });
      }

      /** Hand the WeChat bootstrap poster over after the native loading artwork is drawable. */
      function notifyStartupLoadingReady() {
        if (sys.platform !== sys.Platform.WECHAT_GAME) return;
        game.emit('offwork-loading-frame-ready');
      }

      /** Platform coordinates are converted once on resize; gameplay never calls wx APIs. */
      function readUiViewport(fallbackWidth, fallbackHeight) {
        var platform = globalThis.wx;
        var width = fallbackWidth,
          height = fallbackHeight,
          top = 0,
          bottom = 0;
        try {
          var info = (platform == null || platform.getWindowInfo == null ? void 0 : platform.getWindowInfo()) || (platform == null || platform.getSystemInfoSync == null ? void 0 : platform.getSystemInfoSync());
          if (info != null && info.windowWidth && info != null && info.windowHeight) {
            var _info$safeArea, _info$safeArea$bottom, _info$safeArea2;
            width = info.windowWidth;
            height = info.windowHeight;
            top = Math.max(0, ((_info$safeArea = info.safeArea) == null ? void 0 : _info$safeArea.top) || 0);
            bottom = Math.max(0, height - ((_info$safeArea$bottom = (_info$safeArea2 = info.safeArea) == null ? void 0 : _info$safeArea2.bottom) != null ? _info$safeArea$bottom : height));
            var capsule = platform.getMenuButtonBoundingClientRect == null ? void 0 : platform.getMenuButtonBoundingClientRect();
            if ((capsule == null ? void 0 : capsule.bottom) > 0) top = Math.max(top, capsule.bottom + 8);
          } else if (sys.isBrowser && typeof document !== 'undefined') {
            width = globalThis.innerWidth || width;
            height = globalThis.innerHeight || height;
            var probe = document.createElement('div');
            probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';
            document.body.appendChild(probe);
            var style = getComputedStyle(probe);
            top = parseFloat(style.paddingTop) || 0;
            bottom = parseFloat(style.paddingBottom) || 0;
            probe.remove();
          }
        } catch (_unused) {/* Fixed-width layout remains usable when optional platform metrics fail. */}
        return {
          cssWidth: width,
          safeTop: top * 720 / Math.max(1, width),
          safeBottom: bottom * 720 / Math.max(1, width)
        };
      }

      /** Cocos-backed local services keep platform APIs outside game rules. */
      var ProgressStore = exports('ProgressStore', /*#__PURE__*/function () {
        function ProgressStore() {
          this.profile = freshProgress();
          try {
            this.profile = readProgress(sys.localStorage.getItem(PROGRESS_KEY));
          } catch (_unused2) {/* Memory fallback. */}
        }
        var _proto = ProgressStore.prototype;
        _proto.save = function save() {
          try {
            sys.localStorage.setItem(PROGRESS_KEY, JSON.stringify(this.profile));
          } catch (_unused3) {/* Keep the current session playable. */}
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

      /** Only messages and local scores cross this boundary. Friend data stays in the open data context. */
      var FriendLeaderboardService = exports('FriendLeaderboardService', /*#__PURE__*/function () {
        function FriendLeaderboardService() {
          var _this = this;
          this.context = null;
          this.bestScore = 0;
          this.authorized = false;
          this.authorizing = false;
          this.pendingView = null;
          var platform = globalThis.wx;
          if (sys.platform !== sys.Platform.WECHAT_GAME || !(platform != null && platform.getOpenDataContext)) return;
          try {
            this.context = platform.getOpenDataContext();
          } catch (_unused4) {/* Show the unavailable state. */}
          if (platform.getPrivacySetting) {
            try {
              platform.getPrivacySetting({
                success: function success(result) {
                  if (!result.needAuthorization) {
                    _this.authorized = true;
                    _this.send('sync');
                  }
                }
              });
            } catch (_unused5) {/* Opening the board can retry authorization. */}
          } else this.authorized = !platform.requirePrivacyAuthorize;
        }
        var _proto2 = FriendLeaderboardService.prototype;
        _proto2.sync = function sync(score) {
          if (!Number.isSafeInteger(score) || score < 0) return;
          this.bestScore = Math.max(this.bestScore, score);
          if (this.authorized) this.send('sync');
        };
        _proto2.show = function show(done) {
          var _this2 = this;
          if (!this.available) return 'unavailable';
          var platform = globalThis.wx;
          if (this.authorized || !(platform != null && platform.requirePrivacyAuthorize)) {
            done(this.send('show'));
            return 'opened';
          }
          this.pendingView = done;
          if (!this.authorizing) {
            this.authorizing = true;
            var failed = function failed() {
              _this2.authorizing = false;
              var callback = _this2.pendingView;
              _this2.pendingView = null;
              callback == null || callback(false);
            };
            try {
              platform.requirePrivacyAuthorize({
                success: function success() {
                  _this2.authorizing = false;
                  _this2.authorized = true;
                  _this2.send('sync');
                  var callback = _this2.pendingView;
                  _this2.pendingView = null;
                  if (callback) callback(_this2.send('show'));
                },
                fail: failed
              });
            } catch (_unused6) {
              failed();
            }
          }
          return this.authorizing ? 'pending' : 'opened';
        };
        _proto2.hide = function hide() {
          this.pendingView = null;
          this.send('hide');
        };
        _proto2.send = function send(action) {
          try {
            var _this$context;
            (_this$context = this.context) == null || _this$context.postMessage({
              type: 'offwork-friends',
              action: action,
              bestScore: this.bestScore
            });
            return this.available;
          } catch (_unused7) {
            return false;
          }
        };
        _proto2.share = function share() {
          var platform = globalThis.wx;
          if (!this.available || !(platform != null && platform.shareAppMessage)) return 'unavailable';
          try {
            platform.shareAppMessage({
              title: '来玩摸鱼请走位，看看谁的摸鱼积分更高！'
            });
            return 'opened'; // Opening the sheet is not proof that a share completed.
          } catch (_unused8) {
            return 'unavailable';
          }
        };
        _createClass(FriendLeaderboardService, [{
          key: "available",
          get: function get() {
            return this.context !== null;
          }
        }]);
        return FriendLeaderboardService;
      }());
      var SOUND_NAMES = exports('SOUND_NAMES', ['ui', 'pickup', 'ready', 'shield', 'block', 'hit', 'wave', 'result', 'laugh', 'leave', 'reduce', 'countdown', 'resume', 'grade', 'skill']);
      var GameAudio = exports('GameAudio', /*#__PURE__*/function () {
        function GameAudio(parent) {
          this.source = void 0;
          this.musicSource = void 0;
          this.clips = new Map();
          this.soundEnabled = true;
          this.musicActive = false;
          this.unlocked = false;
          this.musicRunning = false;
          this.alive = true;
          this.lastPlayed = new Map();
          var node = new Node('GameAudio');
          parent.addChild(node);
          this.source = node.addComponent(AudioSource);
          this.source.playOnAwake = false;
          this.source.volume = 0.55;
          var music = new Node('BackgroundMusic');
          parent.addChild(music);
          this.musicSource = music.addComponent(AudioSource);
          this.musicSource.playOnAwake = false;
          this.musicSource.loop = true;
          this.musicSource.volume = 0.6;
        }
        var _proto3 = GameAudio.prototype;
        _proto3.load = function load(bundle) {
          var _this3 = this;
          // The critical art loader owns subpackage download; sound never starts a second one.
          if (!this.alive) return;
          var _loop = function _loop() {
            var name = _SOUND_NAMES[_i];
            bundle.load("audio/" + name, AudioClip, function (clipError, clip) {
              if (!clipError && clip && _this3.alive) _this3.clips.set(name, clip);
            });
          };
          for (var _i = 0, _SOUND_NAMES = SOUND_NAMES; _i < _SOUND_NAMES.length; _i++) {
            _loop();
          }
          bundle.load('audio/bgm', AudioClip, function (clipError, clip) {
            if (clipError || !clip || !_this3.alive) return;
            _this3.musicSource.clip = clip;
            _this3.syncMusic();
          });
        }
        /** Called from a real touch/key handler; loading alone must not autoplay. */;
        _proto3.unlock = function unlock() {
          this.unlocked = true;
          this.syncMusic();
        };
        _proto3.setMusicActive = function setMusicActive(active) {
          this.musicActive = active;
          this.syncMusic();
        };
        _proto3.syncMusic = function syncMusic() {
          var shouldPlay = this.alive && this.enabled && this.unlocked && this.musicActive && !!this.musicSource.clip;
          if (shouldPlay === this.musicRunning) return;
          this.musicRunning = shouldPlay;
          if (shouldPlay) this.musicSource.play();else this.musicSource.pause();
        };
        _proto3.play = function play(name) {
          var _this$lastPlayed$get, _this$lastPlayed$get2;
          var clip = this.clips.get(name);
          if (!this.enabled || !clip || !this.alive) return;
          var now = performance.now();
          var cooldown = name === 'pickup' ? 70 : name === 'block' ? 220 : name === 'skill' || name === 'grade' || name === 'leave' ? 500 : name === 'reduce' ? 240 : 120;
          // A recent rating takes priority over small technique rewards across adjacent frames too.
          if (name === 'skill' && now - ((_this$lastPlayed$get = this.lastPlayed.get('grade')) != null ? _this$lastPlayed$get : -Infinity) < 500) return;
          if (now - ((_this$lastPlayed$get2 = this.lastPlayed.get(name)) != null ? _this$lastPlayed$get2 : -Infinity) < cooldown) return;
          this.lastPlayed.set(name, now);
          this.source.playOneShot(clip, name === 'block' ? 0.35 : name === 'hit' ? 0.65 : name === 'laugh' ? 0.5 : name === 'skill' ? 0.35 : name === 'grade' ? 0.55 : name === 'countdown' ? 0.6 : name === 'reduce' ? 0.65 : name === 'leave' || name === 'resume' ? 0.7 : 0.85);
        };
        _proto3.stop = function stop() {
          this.setMusicActive(false);
          this.source.stop();
        };
        _proto3.destroy = function destroy() {
          this.alive = false;
          this.stop();
        };
        _createClass(GameAudio, [{
          key: "enabled",
          get: function get() {
            return this.soundEnabled;
          },
          set: function set(value) {
            this.soundEnabled = value;
            if (!value) this.source.stop();
            this.syncMusic();
          }
        }]);
        return GameAudio;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/PlayerTrail.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createForOfIteratorHelperLoose, _extends, cclegacy;
  return {
    setters: [function (module) {
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "63ebbhbOU5KirK6+mWWsHiz", "PlayerTrail", undefined);
      var PLAYER_TRAIL = exports('PLAYER_TRAIL', {
        capacity: 48,
        lifetime: 0.48,
        spacing: 4,
        maxLength: 180,
        radius: 18,
        teleportDistance: 220
      });
      /** Bounded particle history, joined into the smooth tapered trail in the reference. */
      var PlayerTrail = exports('PlayerTrail', /*#__PURE__*/function () {
        function PlayerTrail() {
          this.samples = Array.from({
            length: PLAYER_TRAIL.capacity
          }, function () {
            return {
              x: 0,
              y: 0,
              life: 0
            };
          });
          this.previous = void 0;
          this.cursor = 0;
        }
        var _proto = PlayerTrail.prototype;
        _proto.clear = function clear() {
          for (var _iterator = _createForOfIteratorHelperLoose(this.samples), _step; !(_step = _iterator()).done;) {
            var sample = _step.value;
            sample.life = 0;
          }
          this.previous = undefined;
          this.cursor = 0;
        };
        _proto.emit = function emit(x, y, life) {
          Object.assign(this.samples[this.cursor], {
            x: x,
            y: y,
            life: life
          });
          this.cursor = (this.cursor + 1) % this.samples.length;
        };
        _proto.advance = function advance(dt, point) {
          if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
          if (!this.previous) {
            this.previous = {
              x: point.x,
              y: point.y
            };
            return;
          }
          if (!Number.isFinite(dt) || dt <= 0) return;
          var elapsed = Math.min(dt, 0.1);
          for (var _iterator2 = _createForOfIteratorHelperLoose(this.samples), _step2; !(_step2 = _iterator2()).done;) {
            var sample = _step2.value;
            sample.life = Math.max(0, sample.life - elapsed);
          }
          var distance = Math.hypot(point.x - this.previous.x, point.y - this.previous.y);
          if (distance > PLAYER_TRAIL.teleportDistance) {
            this.clear();
            this.previous = {
              x: point.x,
              y: point.y
            };
            return;
          }
          if (distance > 1.2) {
            if (!this.samples.some(function (s) {
              return s.life > 0;
            })) this.emit(this.previous.x, this.previous.y, PLAYER_TRAIL.lifetime - elapsed);
            // Distance sampling keeps quick swipes continuous instead of separate dots.
            var steps = Math.min(this.samples.length - 1, Math.ceil(distance / PLAYER_TRAIL.spacing));
            for (var step = 1; step <= steps; step++) {
              var t = step / steps;
              this.emit(this.previous.x + (point.x - this.previous.x) * t, this.previous.y + (point.y - this.previous.y) * t, PLAYER_TRAIL.lifetime - elapsed * (1 - t));
            }
          }
          this.previous = {
            x: point.x,
            y: point.y
          };
        };
        _proto.ribbon = function ribbon() {
          var points = [];
          for (var offset = 0; offset < this.samples.length; offset++) {
            var sample = this.samples[(this.cursor + offset) % this.samples.length];
            if (sample.life > 0) points.push(_extends({}, sample));
          }
          if (points.length < 2) return [];
          // Clip by travelled distance, including curves and reversals rather than a straight chord.
          var length = 0,
            first = points.length - 1;
          while (first > 0) {
            var a = points[first],
              b = points[first - 1],
              segment = Math.hypot(a.x - b.x, a.y - b.y);
            if (length + segment > PLAYER_TRAIL.maxLength) {
              var t = (PLAYER_TRAIL.maxLength - length) / segment;
              points[first - 1] = {
                x: a.x + (b.x - a.x) * t,
                y: a.y + (b.y - a.y) * t,
                life: a.life + (b.life - a.life) * t
              };
              first--;
              break;
            }
            length += segment;
            first--;
          }
          points = points.slice(first);
          // Corner cutting makes a soft bend without spline overshoot at hairpin turns.
          for (var pass = 0; pass < 2; pass++) {
            var smooth = [points[0]];
            for (var i = 1; i < points.length; i++) {
              var _a = points[i - 1],
                _b = points[i];
              for (var _i = 0, _arr = [0.25, 0.75]; _i < _arr.length; _i++) {
                var _t = _arr[_i];
                smooth.push({
                  x: _a.x + (_b.x - _a.x) * _t,
                  y: _a.y + (_b.y - _a.y) * _t,
                  life: _a.life + (_b.life - _a.life) * _t
                });
              }
            }
            smooth.push(points[points.length - 1]);
            points = smooth;
          }
          var distances = [0];
          for (var _i2 = 1; _i2 < points.length; _i2++) distances.push(distances[_i2 - 1] + Math.hypot(points[_i2].x - points[_i2 - 1].x, points[_i2].y - points[_i2 - 1].y));
          var total = distances[distances.length - 1];
          if (total < 1) return [];
          return points.map(function (p, i) {
            var before = points[Math.max(0, i - 1)],
              after = points[Math.min(points.length - 1, i + 1)];
            var dx = after.x - before.x,
              dy = after.y - before.y;
            if (Math.hypot(dx, dy) < 0.001) {
              dx = after.x - p.x;
              dy = after.y - p.y;
            }
            var magnitude = Math.hypot(dx, dy) || 1;
            var progress = distances[i] / total,
              fade = p.life / PLAYER_TRAIL.lifetime;
            return _extends({}, p, {
              nx: -dy / magnitude,
              ny: dx / magnitude,
              progress: progress,
              radius: PLAYER_TRAIL.radius * Math.pow(progress, 0.72) * Math.pow(fade, 0.45),
              alpha: Math.round(240 * Math.pow(progress, 0.55) * Math.pow(fade, 0.55))
            });
          });
        };
        return PlayerTrail;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/PortraitMotion.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, cclegacy;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "977caacYvJFoK64rzxAiwOb", "PortraitMotion", undefined);
      /** Small, deterministic HUD animation; advancing it never changes gameplay. */
      var PortraitMotion = exports('PortraitMotion', /*#__PURE__*/function () {
        function PortraitMotion() {
          this.workload = 0;
          this.pressure = 0;
          this.clock = 0;
          this.clipClock = 0;
          this.transition = 1;
          this.from = 0;
          this.duration = 0.3;
          this.initialized = false;
        }
        var _proto = PortraitMotion.prototype;
        _proto.reset = function reset() {
          this.workload = this.pressure = this.clock = this.clipClock = this.from = 0;
          this.transition = 1;
          this.initialized = false;
        };
        _proto.advance = function advance(workload, dt) {
          var target = Math.max(0, Math.min(2, Math.floor(workload)));
          if (!this.initialized) {
            this.workload = this.pressure = this.from = target;
            this.initialized = true;
          } else if (target !== this.workload) {
            this.from = this.pressure;
            this.duration = target > this.workload ? 0.3 : 0.5;
            this.workload = target;
            this.clipClock = 0;
            this.transition = 0;
          }
          var elapsed = Math.max(0, dt);
          this.clock += elapsed;
          this.clipClock += elapsed;
          this.transition = Math.min(1, this.transition + elapsed / this.duration);
          var ease = this.transition * this.transition * (3 - 2 * this.transition);
          this.pressure = this.from + (this.workload - this.from) * ease;
        };
        /** Blend complete gestures so changing workload never jumps between oscillators. */
        _proto.blend = function blend(calm, worried, anxious) {
          var p = this.pressure;
          return p < 1 ? calm + (worried - calm) * p : worried + (anxious - worried) * (p - 1);
        };
        _createClass(PortraitMotion, [{
          key: "breath",
          get: function get() {
            var period = this.pressure < 1 ? 2 - this.pressure * 0.6 : 1.4 - (this.pressure - 1) * 0.5;
            return Math.sin(this.clock * Math.PI * 2 / period);
          }
        }, {
          key: "blink",
          get: function get() {
            var phase = this.clock % 4.2;
            var close = function close(at) {
              return Math.max(0, 1 - Math.abs(phase - at) / 0.1);
            };
            return Math.max(close(3.55), this.pressure > 1.5 ? close(3.82) : 0);
          }
        }, {
          key: "glance",
          get: function get() {
            var phase = this.clock % 3.4;
            return this.pressure > 0.1 && phase > 1 && phase < 1.9 ? Math.sin((phase - 1) / 0.9 * Math.PI * 2) * 1.25 * Math.min(1, this.pressure) : 0;
          }
        }, {
          key: "tremble",
          get: function get() {
            return this.pressure > 1.5 && this.clock % 2.6 < 0.32 ? Math.sin(this.clock * 65) * 0.55 * (this.pressure - 1) : 0;
          }
        }, {
          key: "roll",
          get: function get() {
            return this.blend(Math.sin(this.clock * 1.1) * 1.2, Math.sin(this.clock * Math.PI * 2 / 1.8) * 4, Math.sin(this.clock * Math.PI * 2 / 0.85) * 7 + this.tremble * 0.9);
          }
        }, {
          key: "sway",
          get: function get() {
            return this.blend(0, Math.sin(this.clock * Math.PI * 2 / 1.8) * 0.55, Math.sin(this.clock * Math.PI * 2 / 0.85) * 1.1 + this.tremble * 0.4);
          }
        }, {
          key: "bob",
          get: function get() {
            return this.blend(0, Math.sin(this.clock * Math.PI * 2 / 1.3) * 0.45, Math.sin(this.clock * Math.PI * 2 / 0.65) * 0.8);
          }
        }, {
          key: "clipFrame",
          get: function get() {
            return Math.floor(this.clipClock * 12) % 61;
          }
        }]);
        return PortraitMotion;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SpringSprite.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './BodySpring.ts', './GameLayout.ts'], function (exports) {
  var _inheritsLoose, cclegacy, _decorator, UITransform, Sprite, BODY_SPRING, bodySpringWeight, PLAYER_SCALE;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      UITransform = module.UITransform;
      Sprite = module.Sprite;
    }, function (module) {
      BODY_SPRING = module.BODY_SPRING;
      bodySpringWeight = module.bodySpringWeight;
    }, function (module) {
      PLAYER_SCALE = module.PLAYER_SCALE;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "d53c7rGtqlDi4ogTwLhaD39", "SpringSprite", undefined);
      var ccclass = _decorator.ccclass;
      var ROWS = BODY_SPRING.rows;
      var VERTICES = (ROWS + 1) * 2;
      var INDICES = new Uint16Array(ROWS * 6);
      for (var row = 0; row < ROWS; row++) {
        var v = row * 2;
        INDICES.set([v, v + 1, v + 2, v + 1, v + 3, v + 2], row * 6);
      }

      // Cocos 3.8.8 UI assembler adapter. All engine-specific mesh access stays here.
      // Shared row vertices avoid gaps/overlaps from rotating separate image strips.
      var springAssembler = {
        createData: function createData(sprite) {
          var data = sprite.requestRenderData();
          data.dataLength = VERTICES;
          data.resize(VERTICES, INDICES.length);
          data.chunk.setIndexBuffer(INDICES);
          return data;
        },
        updateRenderData: function updateRenderData(sprite) {
          var data = sprite.renderData,
            frame = sprite.spriteFrame;
          if (!data || !frame) return;
          this.updateUVs(sprite);
          var transform = sprite.node.getComponent(UITransform);
          for (var _row = 0; _row <= ROWS; _row++) {
            var y = (_row / ROWS - transform.anchorY) * transform.height;
            var weight = bodySpringWeight(y / PLAYER_SCALE);
            for (var side = 0; side < 2; side++) {
              var vertex = data.data[_row * 2 + side];
              vertex.x = (side - transform.anchorX) * transform.width + sprite.bendX * weight;
              vertex.y = y + sprite.bendY * weight;
            }
          }
          data.updateRenderData(sprite, frame);
        },
        updateUVs: function updateUVs(sprite) {
          var data = sprite.renderData,
            frame = sprite.spriteFrame;
          if (!data || !frame) return;
          // SpriteFrame UV order: bottom-left, bottom-right, top-left, top-right.
          // Interpolation also supports rotated frames and atlas animation cells.
          var uv = frame.uv,
            vb = data.chunk.vb;
          for (var _row2 = 0; _row2 <= ROWS; _row2++) {
            var t = _row2 / ROWS;
            for (var side = 0; side < 2; side++) {
              var offset = (_row2 * 2 + side) * data.floatStride + 3;
              var bottom = side * 2,
                top = bottom + 4;
              vb[offset] = uv[bottom] + (uv[top] - uv[bottom]) * t;
              vb[offset + 1] = uv[bottom + 1] + (uv[top + 1] - uv[bottom + 1]) * t;
            }
          }
        },
        updateColor: function updateColor(sprite) {
          var data = sprite.renderData;
          if (!data) return;
          var vb = data.chunk.vb,
            color = sprite.color;
          for (var i = 0; i < VERTICES; i++) {
            var offset = i * data.floatStride + 5;
            vb[offset] = color.r / 255;
            vb[offset + 1] = color.g / 255;
            vb[offset + 2] = color.b / 255;
            vb[offset + 3] = color.a / 255;
          }
        },
        fillBuffers: function fillBuffers(sprite) {
          var data = sprite.renderData;
          if (!data) return;
          var chunk = data.chunk,
            vb = chunk.vb,
            matrix = sprite.node.worldMatrix;
          for (var i = 0; i < VERTICES; i++) {
            var _data$data$i = data.data[i],
              x = _data$data$i.x,
              y = _data$data$i.y,
              offset = i * data.floatStride;
            var w = matrix.m03 * x + matrix.m07 * y + matrix.m15;
            var inverseW = w ? 1 / w : 1;
            vb[offset] = (matrix.m00 * x + matrix.m04 * y + matrix.m12) * inverseW;
            vb[offset + 1] = (matrix.m01 * x + matrix.m05 * y + matrix.m13) * inverseW;
            vb[offset + 2] = (matrix.m02 * x + matrix.m06 * y + matrix.m14) * inverseW;
          }
          data.vertDirty = false;
          var mesh = chunk.meshBuffer;
          for (var _i = 0; _i < INDICES.length; _i++) mesh.iData[mesh.indexOffset++] = chunk.vertexOffset + INDICES[_i];
        }
      };
      var SpringSprite = exports('SpringSprite', (_dec = ccclass('SpringSprite'), _dec(_class = /*#__PURE__*/function (_Sprite) {
        _inheritsLoose(SpringSprite, _Sprite);
        function SpringSprite() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Sprite.call.apply(_Sprite, [this].concat(args)) || this;
          _this.bendX = 0;
          _this.bendY = 0;
          return _this;
        }
        var _proto = SpringSprite.prototype;
        _proto.setBend = function setBend(x, y) {
          if (this.bendX === x && this.bendY === y) return;
          this.bendX = x;
          this.bendY = y;
          this.markForUpdateRenderData();
        };
        _proto._flushAssembler = function _flushAssembler() {
          if (this._assembler !== springAssembler) {
            this.destroyRenderData();
            this._assembler = springAssembler;
          }
          if (!this.renderData) {
            springAssembler.createData(this);
            var data = this.renderData;
            data.material = this.getRenderMaterial(0);
            this.markForUpdateRenderData();
            springAssembler.updateUVs(this);
            this._updateColor();
          }
        };
        return SpringSprite;
      }(Sprite)) || _class));
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