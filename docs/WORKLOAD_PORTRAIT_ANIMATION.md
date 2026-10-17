# 工作负荷猫猫头像动画

2026-10-14 修订：移除右上角头像外围的五格蓄力环，保留最外侧圆框，猫猫头像扩大到整个圆形内部。负荷 0 播放轻松动画，负荷 1／2 分别播放担心／焦急动画与摇头、起伏动作；头像仍不能点击免疫。

## 原角色与圆框

- 原 `assets/art/hud/workload.png` 保留标题、三个负荷格和最外侧圆框。五格环是图片中印制的元素，由扩大的不透明圆形背景覆盖，原资源文件不改动。
- `FinalArtHud.ts` 播放 `character/workload-expression-0/1/2` 三张透明 PNG 图集，每档 61 帧、12fps，每帧 128×128。源文件是 `美术/猫猫表情-Seedance/透明动画` 中对应头像 APNG，与已交付的 GIF 动作一致；APNG 保留半透明边缘。
- `scripts/prepare-portrait-atlases.py` 生成 1056×1056 PNG 图集，8 列、每格 2 像素透明间隔，避免相邻帧采样串色；不生成或修改 `.meta`。Cocos Creator 自动导入并维护 UUID。
- 在新图集加载前，仍能使用 `character/approved-idle-sheet` 的原头像作为后备。图集加载完成后关闭旧 Graphics 表情叠层，避免重复眉毛和汗滴。场上的角色待机图集保持原样。
- `PortraitAvatarMask` 使用 Cocos 圆形遮罩，直径 70 逻辑像素，覆盖原五格环。头像节点为 70×70，图集放大 1.35 倍以减少透明留白；角色贴图、表情细节、呼吸和轻颤都在遮罩内，最外侧圆框固定。
- 原 PNG、场景和 Prefab 不手工修改；资源切片由 TypeScript 创建并在销毁时释放。

## 动态状态

`PortraitMotion.ts` 读取工作负荷 0／1／2，升档用 0.3 秒、降档用 0.5 秒平滑切换；第三次受击仍按原游戏规则结算。

| 负荷 | 圈内表现 |
| --- | --- |
| 0 | 放松、慢眨眼和微笑；约 ±1.2° 小幅歪头和轻柔呼吸 |
| 1 | 担忧、左右看、单侧汗滴；约 ±4° 摇头，周期 1.8 秒，横向偏移不超过 0.55、额外起伏不超过 0.45 逻辑像素 |
| 2 | 更明显的担忧眉、双侧汗滴和连续眨眼；约 ±7° 摇头，周期 0.85 秒，横向偏移约 ±1.1、额外起伏约 ±0.8 逻辑像素，间歇叠加小抖动 |

升降负荷时混合各档的摇头动作，避免切换时突然改变角度。每次换档从该表情序列首帧开始。暂停和结算不推进序列帧与动作时钟；重新开局重置为负荷 0。角色继续使用参考猫的灰白虎斑、大蓝眼睛和蓝色毛衣造型；生成视频存在细节重绘。

## 操作变更

删除 `GameMain.ts` 中头像 pendingAction、单击释放免疫、第二指头像触摸事件及 avatarTouches。头像区域只展示状态，不进入拖动或双击手势，单击和连续点击头像都不消耗能量或启动免疫。拖动角色时，第二指点击头像不会中断第一指拖动。

战场双击释放免疫、桌面空格、原 3 秒免疫逻辑和角色上方能量条保留。教学不再提示“点击猫猫头像”。

## 验证入口

```powershell
cd F:\下班下班\employee-off-work
npm test
npm run test:soak
npm run build:web
npm run build:wechat
# Web 需本地服务 7456 和支持触摸的 Chrome 调试端口 9334
npm run qa
npm run qa:wechat
node scripts/qa-portrait-art.mjs
node scripts/qa-portrait-art.mjs --wechat
```

头像专项读取实际 Cocos 运行时：校验每档加载 61 帧、选择正确的表情图集、外圆框保留、头像覆盖五格环、表情节点都在圆形遮罩内、负荷 0 的轻松序列实际推进、两档摇头和序列帧实际变化、暂停冻结、降负荷缓动、重开重置、头像单击和连续点击不放盾、战场双击仍放盾。Chrome 调试端口可通过 `CDP_PORT` 指定，专项结果目录可通过 `PORTRAIT_QA_OUT` 指定。

本次全圆形头像截图与专项报告保存在 `employee-off-work/temp/qa/full-circle-portrait/`，最终截图见 `docs/screenshots/workload-avatar-full-circle-0.png`、`workload-avatar-full-circle-1.png`、`workload-avatar-full-circle-2.png`。构建按 Finished 标记与产物判定；微信验证使用开发者工具实际模拟器，不包含实体手机验证。

此前原图头像版本验证：单元测试 88/88、长时间运行 3/3、TypeScript 检查通过；Web 完整回归 137/137，微信开发者工具完整回归 102/102，两平台构建成功。

此前新增摇头与序列帧版本验证：单元测试 97/97、长时间运行 3/3、TypeScript 检查通过。Web 头像专项 10/10，微信开发者工具头像专项 11/11，运行异常与微信控制台错误为空。两个平台构建均满足 Finished 标记与产物存在判据（CLI 均返回 36）。新增资源 `.meta` 均由 Creator 导入生成。

微信发布包不能假定存在 `window.cc`，验证入口兼容从 System 模块注册表获取引擎。微信 WebGL 画布的直接读回曾得到黑帧，专项截图改为开发者工具官方 `simulator_screenshot`，并检查原生截图有可见颜色，避免把空截图计为视觉验证通过。

此前摇头版本的完整回归为 Web 131/138，未通过项涉及原生触摸拖动、多指头像点击后拖动、倒计时取样和拾取反馈取样；微信完整回归运行中出现 automator 响应超时，没有完整通过报告。构建并行时也曾出现定时回归失败，同项目的另一项微信构建会刷新输出文件。以上保留为历史记录。

实际 Cocos 圆圈头像动画预览：`docs/screenshots/workload-avatar-worried-cocos.gif`、`docs/screenshots/workload-avatar-anxious-cocos.gif`。预览是读取实际 Cocos 节点并导出游戏画布得到的，不是另做的角色动画。原透明 GIF 不变，额外摇头与起伏由引擎运行时产生。

## 全圆形头像修订验证

- 单元测试 102/102、长时间运行 3/3、TypeScript 检查通过。
- Web 头像专项 12/12；微信开发者工具头像专项 13/13，控制台错误和运行异常均为空。测试特别确认负荷 0 的轻松序列实际推进，以及 70 像素头像遮罩覆盖原印制五格环。
- `npm run qa` Web 完整回归 140/140；`npm run qa:wechat` 微信开发者工具完整回归 105/105，控制台无错误。回归原有 42 像素头像断言已同步到新的尺寸。完整报告分别保存在 `employee-off-work/temp/qa/full-circle-web/web-result.json` 和 `temp/qa/full-circle-wechat/wechat-result.json`。
- Web 与微信 release 构建均满足 Finished 日志标记和产物存在判据，日志分别为 `employee-off-work/temp/full-circle-build-web.log`、`full-circle-build-wechat.log`。
- 微信开发者工具曾缓存构建期间缺失的开放数据域文件，报错且无法建立小游戏上下文；实际文件存在。重置项目文件索引与编译缓存后，重新打开当前项目恢复，之后头像专项通过。
- 三档实际 Cocos 动画预览为 `docs/screenshots/workload-avatar-full-circle-relaxed-cocos.gif`、`workload-avatar-full-circle-worried-cocos.gif`、`workload-avatar-full-circle-anxious-cocos.gif`，每档覆盖完整 61 帧。负荷 0 默认播放轻松表情，重开和负荷恢复为 0 时也回到该序列。

## 2026-10-15：圆环与底色

头像圆形遮罩之外增加独立的 `PortraitIllustratedRing`：沿用设置按钮的深梅紫描边、立体下沿、上沿高光及内沿结构，重新使用薰衣草紫主色与浅米色内沿。背景由杏色改为低饱和浅青／雾白渐变，衬出灰色毛发和蓝色衣服。圆环固定在头像中心；70 像素遮罩、三档表情帧、摇头动作和头像点击不放盾规则保持。

真实 Cocos 回归增加圆环位于遮罩之外、与遮罩中心重合、表情动作不带动圆环的检查。Web 头像专项 13/13、微信开发者工具头像专项 14/14，无运行错误；Web 完整回归 145/145。构建及难度回归记录见 `PRESSURE_CURVE_IMPLEMENTATION.md` 的最新修订。

实际 Web 截图：`docs/screenshots/workload-avatar-lavender-ring.png`，局部图：`docs/screenshots/workload-avatar-lavender-ring-detail.png`。微信验证基于实际运行时与开发者工具截图，未包含实体手机。

## 2026-10-15：按设置按钮统一描边

根据用户最新参考，头像圆环改用设置按钮原图 `assets/art/hud/time.png` 的偏暖梅紫描边：外描边色 RGB(74,39,65)，内描边色 RGB(54,20,49)。按时间面板的实际裁切缩放，外描边取原图 14 像素、内描边 7 像素，对应游戏设计坐标约 2.69／1.35 像素，替换上一版偏冷、偏细的外边和米白内边。

圆环主色改为蜂蜜金 RGB(239,184,104)，下沿为琥珀棕、上沿为浅金高光，呼应顶部纸卡和分数框。70 像素猫猫遮罩、浅青底色、三档表情与圈内动作保持原实现；仅修改 `FinalArtHud.ts` 的圆环绘制，不改原 PNG 或 Creator 资源元数据。

本轮基础验证：单元测试 104/104、稳定性检查 3/3、TypeScript 检查通过；Web 头像专项 13/13。Web 与微信构建均有 Finished 标记且核心产物存在，日志为 `employee-off-work/temp/honey-ring-build-web.log`、`honey-ring-build-wechat.log`。

已实际运行 `npm run qa`，首次完整回归在旧用例读取 `GameMain.waveNotice.string` 时中断。工作区的相关 UI 与回归用例随后更新，复跑结果为 144/145，无运行错误；唯一未通过项是 `intro_uses_requested_copy_and_freezes_scene`，运行时教学标题／副文案与该用例预期不一致。本轮保留这些 UI 修改，没有改变教学文案或放宽断言，未将完整回归计为全部通过。最终报告为 `employee-off-work/temp/qa/honey-ring-web-current/web-result.json`。

实际 Web 圆环画面：`docs/screenshots/workload-avatar-honey-ring.png`；局部图：`docs/screenshots/workload-avatar-honey-ring-detail.png`。头像专项报告为 `employee-off-work/temp/qa/honey-ring-portrait-web/web-result.json`。

微信开发者工具头像专项最终 14/14，通过三档帧动画、固定圆环、遮罩、暂停冻结、圈内动作和头像点击不放盾检查，控制台错误为空。初次自动化连接超时，读取空错误日志并刷新当前项目后复验通过。最终报告为 `employee-off-work/temp/qa/honey-ring-portrait-wechat/wechat-result.json`。
## 2026-10-15：直接复用设置按钮原画圆环

根据最新反馈，头像圆环改为运行时裁切 `assets/art/hud/time.png` 中设置按钮的原画，不再使用 Graphics 近似重画。与左侧设置按钮使用相同的原图缩放，保留原有宽环面、内外深梅色描边、手绘高光和阴影。`settings-ring-recolor.effect` 仅对亮部紫色环面换成蜂蜜金，并移除中心暂停符号及相邻纸板；深色描边保持源图色彩。裁切帧禁止动态合图，确保换色材质的源图坐标稳定。

猫猫头像和浅雾薄荷背景填满原画内圈（56 逻辑像素），圆环绘制在头像遮罩上方，避免动画覆盖内圈描边。三档表情及动作、暂停冻结、点击头像不触发护盾的行为保持一致。

验证：单元测试 104/104、长时间模拟 3/3、TypeScript 检查通过；完整 Web 回归 146/146，Web 头像专项 14/14，微信开发者工具头像专项 15/15，运行时错误为空。头像专项先显式恢复前台状态，避免模拟器后台暂停影响动画检查。两平台构建均有 Finished 标记且核心产物存在。报告见 `employee-off-work/temp/qa/source-ring-web-verified/web-result.json`、`source-ring-portrait-web/web-result.json`、`source-ring-portrait-wechat-final/wechat-result.json`（后两者也位于同一 temp/qa 目录）。实际游戏 HUD 对比截图：`docs/screenshots/workload-avatar-original-settings-ring.png`。

## 2026-10-15：圆环改为雾蓝青色

根据新的配色反馈，环面由蜂蜜金改为雾蓝青色。保留设置按钮原画的明暗层次，以冷浅蓝作为高光、低饱和青蓝作为主体、深青作为阴影，与猫猫蓝毛衣和办公室背景协调；原有深梅色描边、尺寸和三档表情动画保持一致。修改仅涉及 `settings-ring-recolor.effect` 的环面换色。

本次验证：单元测试 104/104、长时间模拟 3/3、Web 完整回归 146/146、Web 头像专项 14/14、微信头像专项 15/15，控制台无错误。Web 与微信构建均有 Finished 标记且产物存在。实际 HUD 配色对比见 `docs/screenshots/workload-avatar-mist-blue-ring.png`；日志及回归报告使用 `mist-blue-ring-` 前缀保存在 `employee-off-work/temp` 中。

