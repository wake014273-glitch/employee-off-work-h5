# 《摸鱼请走位》开发工作区

本工作区建立于 2026-09-24，所有游戏开发文件统一位于 `F:\下班下班`。

## 当前分享版本（2026-10-17）

- 公开网页试玩：[点击游玩](https://wake014273-glitch.github.io/employee-off-work-h5/?v=20261017-5f07a47b3b94efe4)。可转发给其他玩家，在手机微信或浏览器内打开。
- GitHub 源码：[codex/current-source 分支](https://github.com/wake014273-glitch/employee-off-work-h5/tree/codex/current-source)；`main` 分支用于 GitHub Pages 网页分发。
- 分享二维码：`docs/screenshots/public-current-20261017-qrcode.png`。当前构建源码指纹：`source:5f07a47b3b94efe4`。
- 本版包含困难 4、5、6 与后期上限调整、当前音效，以及加载进度、画面交接和状态恢复修复。见 [代码审查记录](docs/PROJECT_CODE_AUDIT_20261017.md)。

从源码构建需自行安装 Cocos Creator 3.8.8，并将 `COCOS_EDITOR` 环境变量设为编辑器可执行文件路径；仓库不包含编辑器、缓存与本地构建目录。

## 目录

- `employee-off-work/`：Cocos Creator 3.8.8 2D TypeScript 项目
- `reference/swarm-origin.html`：原始玩法原型，仅作设计与规则参考
- `.hermes/plans/`：开发计划
- `docs/`：后续设计、架构和测试文档
- `tools/CocosCreator/`：Cocos Creator 3.8.8 本地引擎
- `tools/downloads/`：官方引擎安装包

## 已安装工具

- Cocos Dashboard 2.2.2.1515
- Cocos Creator 3.8.8（稳定 LTS，本地安装）
- 微信开发者工具 2.02.2608070
- Git 2.54.0
- Node.js 22.23.1 / npm 10.9.8
- Hermes Agent 0.21.4

> 实现通道：游戏代码、脚本、测试与文档由 Hermes Agent 直接修改，不调用 Codex CLI（其订阅额度也已耗尽）。

## 启动 Cocos 项目

```bat
"F:\下班下班\tools\CocosCreator\CocosCreator.exe" --project "F:\下班下班\employee-off-work"
```

微信开发者工具：

```bat
"C:\Program Files (x86)\Tencent\微信web开发者工具\微信开发者工具.exe"
```

## 游戏定位与角色设定

游戏当前名称为《摸鱼请走位》（历史名称《摸了个鱼》，原开发名《员工，下班！》）。主角是佩戴工牌的银灰美短虎斑猫，身份为不限定岗位的普通公司职员；[角色双姿态设定图](美术/美短虎斑_角色设定_v13_白底正面与左歪头.png)为视觉基准。玩家在办公室躲避消息、文件夹和需求表等工作任务，拾取 5 条鱼后双击屏幕启动一次约 3 秒伤害免疫。完整规则见 [游戏设计文档](docs/GDD.md) 与 [道具规则](docs/SCORING_AND_ITEMS.md)。

**操作与道具更新（2026-10-13）**：恢复保留按下偏移的 1:1 手指拖动；确认版请假条、AI 工具、AI 工具-1 已接入。请假条清屏，AI 分别减少 1 格、2 格工作负荷。拾鱼点成功反馈、首次五鱼工作免疫教学和满格免疫表现继续保留。旧摇杆实验记录见 [实现与验证记录](docs/FLOATING_JOYSTICK_AND_IMMUNITY.md)。

**实施状态（2026-10-12）**：已有三波推进、风险换分、请假条、拾取 5 条咸鱼后双击启动约 3 秒护盾。画面已按 1080×2400 参考图接入 `美术/美术资产确认版`，包含办公室背景、50 帧猫猫待机、三类弹幕、实时 HUD 和暂停按钮。最新修改支持全屏无黑边、头像五格蓄力环、缩小猫猫与投影、自动连续换波。美术与布局验收记录见 [确认版接入记录](docs/FINAL_ART_IMPLEMENTATION.md)。五种资源点模式与九项职场能力仍为后续储备，见 `docs/SKILL_SYSTEM.md`。

## 构建与回归

```bash
cd employee-off-work
npm test            # 模型测试
npm run test:soak   # 压力与回归测试
npm run build:web   # 构建 web-mobile（本地浏览器试玩）
npm run build:wechat # 构建 wechatgame（导入微信开发者工具）
npm run qa          # CDP 驱动真实 Chrome 的实机回归
```

Cocos CLI 即使构建成功也会返回退出码 36，因此脚本以日志标记加产物文件判定成功。

## 当前范围

当前只做游戏本体与微信运行验证，暂不处理备案、软著、广告、登录、支付和正式提审。
