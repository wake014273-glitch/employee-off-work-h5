# 《摸鱼请走位》竖屏可玩版本

Cocos Creator 3.8.8 + TypeScript 项目。唯一主场景为 `assets/scenes/Main.scene`；`GameMain` 在运行时创建背景、角色、弹幕与 HUD 节点，美术资源位于 Creator 资源管理器的 `assets/art` 文件夹。

当前画面按 1080×2400 参考图构建，使用 `../美术/美术资产确认版` 的办公室背景、三类弹幕、咸鱼、三块 HUD 与 50 帧猫猫待机序列。逻辑宽度固定 720，高度随屏幕比例变化；背景等比例铺满，顶部 UI 保持完整。猫猫节点为 144×144，碰撞贴合头部与躯干胶囊；猫猫和弹幕带加深投影，小鱼带绿色光晕与环绕亮点。右上角保留原圆框，头像直接复用场上角色贴图，按工作负荷 0／1／2 展示放松、紧张、焦急表情。每条鱼增加 1 格角色上方能量条，5 格满后双击屏幕启动约 3 秒免疫；头像只展示状态，点击不触发免疫。

2026-10-12 新增首次分步引导、头像单击放盾、短音效和成绩单。引导完成状态、音效开关及个人纪录保存于本机；首页可重新进入教学。实现与验证见 `../docs/EXPERIENCE_POLISH.md`。

细节完善包含：获得蓄力时绿光飞向对应格并在到达时闪亮，满格仍然消耗碰到的小鱼；受伤时猫猫轻微压缩、新增工作格弹跳，猫猫与阴影同步闪烁，免疫挡伤使用绿色星点与独立轻音；暂停／后台返回后点击继续显示 3–2–1，期间整个战场冻结；追踪中的红消息带短尾迹、紫需求表在转向后倾斜、文件夹缺口描边，三类弹幕的瞳孔会看向玩家并错开眯眼。八种短音效都可静音。

最新教程与操作（2026-10-16）：开局为 2 格工作负荷、4 格护盾充能。先拖动躲开附近弹幕（碰撞负荷 +1，满 3 格失败；练习中会提示并重试当前步骤），随后沿虚线拾取小鱼充满护盾。虚拟手指演示双击，玩家松手双击后获得真实的 3 秒免疫。免疫结束后 Agent 从屏幕边缘入场，沿虚线拾取可降低 2 格负荷。每一步都有夸奖反馈，完成页确认后才记录教程完成，以零负荷、零充能开始正式游戏。教程不计时、不计分。

上方消息与文件夹墙从屏幕外进入，出生位置在顶部外 48 逻辑像素，连阴影也保持在画面外。弹幕显示层按整个屏幕裁剪，穿过办公室顶部时持续可见，HUD 面板按原层级覆盖。角色上限按 HUD 最低边缘 + 10 像素间距 + 可见耳朵高度单独计算，比原上限多出约 20.3 逻辑像素；资源生成位置仍使用 280 像素安全区，模态遮罩覆盖整个视口。波次短提示在 HUD 上方。

微信扫码停在 Cocos 标志页的启动兼容问题已修复（2026-10-13）：构建补丁在适配器创建 document 后才绑定它；每次微信构建增加 iOS／Android 新全局环境触控检查。资源加载支持进度、超时重连和点击重试，音效在画面资源后加载。详见 `../docs/WECHAT_STARTUP_FIX.md`。

## 修改美术与脚本

- 在 Creator 左下角「资源管理器」展开 `assets/art/background`、`character`、`bullets`、`pickups`，可查看并替换对应 PNG。替换同名图片时保留 Creator 生成的 `.meta` 文件，让已有资源引用保持有效。
- 玩法与画面脚本在 `assets/scripts/GameMain.ts`，波次、碰撞、分数和道具规则在 `assets/scripts/model/GameModel.ts`。保存后使用 Creator 顶部「预览」看实际画面。场景编辑器中只显示基础 Canvas；角色和弹幕会在运行时生成。
- `assets/art` 被 Creator 配置为 Asset Bundle；Web 构建直接加载，微信小游戏构建进入 `subpackages/art/`。新增图片后先在 Creator 中等待导入完成，再构建。

## 试玩

1. 用 Cocos Creator 3.8.8 打开本目录。
2. 打开 `assets/scenes/Main.scene`，点击预览；它也是构建的唯一启动场景。
3. 首次教程：躲避弹幕 → 虚线拾鱼 → 手指演示双击免疫 → 等待护盾结束 → 拾取 Agent 减负 → 完成页确认。教程版本为 6，必须实际完成操作；首页「操作教学」可重学，旧版记录保留。
4. 在战场空白处按下并拖动，角色按手指位移 1:1 移动；按下时保留角色与手指的偏移，不会瞬移，松手即停。最高位置保持耳朵与 HUD 下沿约 10 逻辑像素间隔。正式对局每条鱼增加 1 格，满 5 格后松手双击屏幕（0.30 秒内）释放 3 秒工作免疫；普通对局不会因充能暂停。桌面还可使用空格键；右上角头像只展示表情，单击、双击及拖动中的第二指触摸头像都不会开启免疫。满格仍消耗碰到的小鱼，护盾生效时不拾鱼。
5. 三次受击后显示成绩单：分数、评级、个人纪录、时长、波次、最高连击、穿缝／甩脱次数和下一局目标。点击「再来一局」重开，或「返回首页」。正式对局中确认退出也会保存本局成绩和最高纪录；教学练习不计入。
6. 点击左上角圆形暂停按钮暂停，再点击启动 3–2–1 倒计时，结束后恢复；桌面也可按 Esc。切到后台会暂停，返回后点击继续。倒计时期间不能移动或放盾，重复暂停／再次切到后台会取消倒计时，重新继续时从 3 开始；换波照常连续进行。
7. 首页、暂停页和结算页的「音效 开／关」可切换音效；设置下次打开仍有效。首页「操作教学」可以重学。

参考位置和尺寸集中在 `assets/scripts/model/GameLayout.ts`，HUD 动态数字、三格工作负荷和圆框内的原角色表情动画在 `assets/scripts/FinalArtHud.ts`。UI 的示例数字通过纹理的空白区域覆盖后显示实时数据；弹幕和猫猫序列在运行时切片。为符合微信真机预览的包体限制，58 张美术 PNG 已压缩编码，像素尺寸和资源 UUID 保持不变。详细坐标和验收记录见 `../docs/FINAL_ART_IMPLEMENTATION.md`。

已有 web-mobile 构建时，可在项目目录运行 `node scripts/serve-build.mjs`，浏览器打开 `http://127.0.0.1:7456`。

## 检查

```powershell
npm.cmd test
npm.cmd run test:soak
npm.cmd run build:web
npm.cmd run build:wechat
npm.cmd run audit:size
npm.cmd run qa
npm.cmd run qa:wechat
```

模型测试直接由 Node 22 执行 TypeScript，不需要下载依赖。构建由 `scripts/build.mjs` 包装，以日志标记、产物文件和编译源码指纹判定成功——Cocos CLI 即使成功也会返回退出码 36，不要拿退出码当判据。当前指纹写入 `build/<平台>/build-info.json`；Web／微信 QA 会核对实际运行版本，缓存旧包时直接报错。

微信小游戏使用 release 构建。`game.json` 的 `subpackages` 包含 `art`；具体包体随资源变动，以当前构建的开发者工具预览结果为准，磁盘目录大小不能代替上传包大小。`npm run build:wechat` 已默认 `debug=false`；需要调试版时用 `node scripts/build.mjs wechatgame true`。

导入微信开发者工具前需确认两点：`npm run build:wechat` 使用 `package.json` 指定的体验 AppID `wxcefa299717fbb2da` 并在产物中回读校验（更换账号时用 `node scripts/build.mjs wechatgame false appid=wx...`）；开发者工具的「设置 → 安全设置」需开启服务端口，否则 `cli.bat` 无法调用。

## 浏览器实机回归

`npm run qa` 通过 CDP 驱动真实 Chrome，对构建产物执行首次引导、五次实际拾鱼、头像不触发免疫、双指触摸头像时继续拖动、屏幕双击免疫、音效输出与静音、结算存档和重开，并保留既有波次、碰撞、HUD 与五种屏幕比例检查。前置两步：

```bash
node scripts/serve-build.mjs
"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --touch-events=enabled --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --remote-debugging-port=9334 --user-data-dir=%TEMP%\chrome-game-qa --window-size=720,1280 about:blank
npm run qa
```

脚本会把 `art-start.png`、`shield.png`、`game-over.png`、`natural-spawn.png` 写入 `temp/qa/`，并验证资源包加载、精灵对象数量与浏览器运行错误。可用 `GAME_PORT`、`CDP_PORT`、`QA_OUT` 覆盖默认端口与输出目录。

`npm run qa:wechat` 使用本机微信开发者工具的官方 CLI 自动化接口，前提是该工具已连接并打开 `build/wechatgame`。测试时保持项目窗口显示在前台，避免后台节流导致触摸自动化超时；完成后结果保存在 `temp/qa/`。当前工具的自动截图会返回黑图或旧帧，画面需用真机验收。回归脚本不会上传或发布。

## 微信小游戏验证（2026-09-24 实测通过）

用开发者工具自带的小游戏测试号验证，无需自备 AppID（`get_user_appids --type minigame` 可列出；本机账号下为 `wxcefa299717fbb2da`）：

```bash
node scripts/build.mjs wechatgame false appid=wxcefa299717fbb2da
"C:/Program Files (x86)/Tencent/微信web开发者工具/wechatide.cmd" -c Hermes project_import --project "F:/下班下班/employee-off-work/build/wechatgame"
"C:/Program Files (x86)/Tencent/微信web开发者工具/wechatide.cmd" -c Hermes open_project_window --project "F:/下班下班/employee-off-work/build/wechatgame"
```

已实测：开始界面与 HUD 渲染正常、点击开始、拖动跟随手指（角色从横向 0.47 移到 0.25）、工作负荷 3/3 结算显示「任务堆满，被迫开工」、点击重开；`auto_preview` 推送真机预览成功，包体 2,967,939 字节（2.83 MiB，低于微信主包 4MB 上限）。截图见 `docs/screenshots/wechat-*.jpg`。回退摇杆后复测：手指从 (260,463) 划到 (380,403)（位移 +120,−60）→ 角色位移 (+119,−60)，即按下记录偏移、之后 1:1 跟手。

三个坑：首次打开项目时模拟器可能报「模拟器启动失败 / timeout」（首次编译超过启动超时），执行一次 `simulator_refresh --project <项目>` 即可恢复（跑起来之前截图可能整片黑或停在旧帧，用连续两张截图 md5 不同来确认模拟器在跑逻辑帧）；触摸自动化 `automation_game_action` 坐标默认画布空间，当画布逻辑尺寸小于截图时用 `--coordinate-space image --image-width <截图宽> --image-height <截图高>` 传截图尺寸，落在画布外的触点会被静默忽略；**改代码重新构建后工具可能继续跑旧包**（开窗返回 success、画面正常、计时照常累加，但内容是旧的），先确认产物 bundle 里有新字面量、再看工具编译缓存 `%LOCALAPPDATA%/微信开发者工具/User Data/<hash>/WeappCache/WeappCompileCache` 里有没有它，没有就 `close_project_window` → 触碰产物时间戳 → 重开。

## 玩法范围（2026-09-24 确认后实装）

- 正式开局：简单 8 秒（紫色需求表）→ 一般 16 秒（紫色 + 黄色文件夹，不出现追踪）→ 困难持续加压（加入红色消息）；困难前 270 秒每 45 秒升档，此后每 30 秒升档，均用 12 秒平滑过渡，每档末尾 5 秒降低新攻击频率，顶部提示“工作加码”。计分波次仍每 60 秒结算；全部阶段自动衔接、保留已有弹幕。
- 风险换分：擦弹连击（判定带 24–50px、单颗只计一次、0.4s 冷却、倍率上限 2.00×）、极限穿缝（玩家边缘与最近文件夹边缘余量 0~6px，+50 × 倍率）、甩脱追踪（追踪结束时距离 ≥320px，+30 × 倍率）。
- 请假条：固定在地图上的拾取物，每 28 秒掷骰一次、35% 命中；拾取后清屏、每条弹幕 +10 分，并附加 1 秒无敌。
- AI 工具：有工作负荷时每 15 秒掷骰一次、60% 命中，同屏最多 1 个；普通版减少 1 格，2 格负荷时有 40% 机会出现移动更快的 AI 工具-1，减少 2 格。两种道具的翅膀都会扇动。
- 结算评级：S 摸鱼大师（波 ≥12、≥12000 且至少一次操作评价 S）／A 摸鱼高手（≥9 且 ≥7000）／B 合格摸鱼（≥6 且 ≥3500）／C 打工仔。
- 设计与数值口径见 `../docs/WAVE_SYSTEM.md`、`../docs/SCORING_AND_ITEMS.md` 与 `../docs/GDD.md`（0.15）。
- `npm run qa` 覆盖无暂停换波、五次拾鱼蓄力、五种屏幕比例无黑边、无预警文件夹墙、擦弹连击、请假条清屏及美术显示。

## H5 试玩与分享（2026-09-24）

好友积分排行榜已接入首页及成绩单：按同玩好友历史最高积分显示前十名，同分并列，固定显示自己的纪录和排名。使用微信托管数据与开放数据域，无业务后端；浏览器显示微信专用提示。完整 UI、状态文案和验证方式见 [好友积分排行榜](../docs/FRIENDS_LEADERBOARD.md)。

H5（web-mobile）构建用于不装微信浏览器的测试者。**zip 不是分发方式**：手机解压后点 `index.html` 会因浏览器的 file:// 限制黑屏，必须给一个 HTTP 地址。

- 公开链接（GitHub Pages，release 构建 3.30 MiB）：`https://wake014273-glitch.github.io/employee-off-work-h5/`，仓库 `wake014273-glitch/employee-off-work-h5`。任何人可直接打开；国内访问 `github.io` 可能不稳定。
- 局域网（同一 WiFi，最可靠）：`python -m http.server 7457 --bind 0.0.0.0 --directory build/web-mobile`，手机访问 `http://<本机内网 IP>:7457/`（首次需在 Windows 防火墙放行 python 入站）。
- 部署校验：把线上实际返回的文件与本地构建产物做 sha256 比对（文本文件可能只剩 git 行尾归一化的差异），不要拿"远程浏览器能打开"当唯一证据。
- H5 没有微信运行时特有的触摸/生命周期/分享入口，**手感结论只作参考，以微信版为准**。
- 微信侧要让别人测，走「上传体验版 + 公众平台添加体验成员」；真机预览只推送到开发者本人的微信。
