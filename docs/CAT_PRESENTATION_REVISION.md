# 猫猫朝向、大小与 HUD 调整

- 左移使用原始图集，尾巴在身体右侧；右移水平镜像，尾巴在身体左侧。上下移动、停下和暂停保留最近一次实际横向移动的朝向，重开恢复初始朝向。
- 游戏角色宽高从 144 放大到 162，增加 12.5%；碰撞胶囊的半径从 24 增加到 27，上下端点和横向偏移同比放大。横向边界保留同比放大的余量。
- 镜像时碰撞中心、头顶蓄力条和免疫轮廓同步翻转；弹簧惯性仍按世界坐标响应移动，避免镜像后反向弯曲。继续使用用户设置的刚度 200、阻尼 14、牵引强度 15。
- 头顶蓄力条从 48 加长到 72 个设计单位，保留五格和拾取闪光，删除格内小鱼图标。能量数值、拾取物及免疫功能维持原规则。
- 左上角图标改为八齿齿轮，沿用原有奶油色、梅紫色和金色圆框。点击打开「摸鱼设置」，暂停游戏并提供音效开关、继续摸鱼和返回首页。

布局和碰撞参数集中在 `employee-off-work/assets/scripts/model/GameLayout.ts`；朝向在 `GameModel.movePlayer()` 根据实际位移更新。图集、场景、Prefab 不需要手工修改。

`tests/player-facing.test.mjs` 覆盖方向记忆、镜像碰撞和边界；`scripts/qa-presentation-fixture.mjs` 在浏览器和微信开发者工具中检查实际拖动、显示节点、五格纯色蓄力条，以及齿轮设置入口。完整检查使用项目的 test、test:soak、build:web、qa、build:wechat 和 qa:wechat 命令。

[实际游戏移动预览](screenshots/cat-presentation-preview.gif) 展示左右移动时的尾巴镜像、弹簧身体和三格蓄力条。

微信开发者工具可能在重新打开后继续使用旧编译缓存。本次通过关闭项目、更新生成产物时间戳、重新打开并刷新模拟器解决；回归前从运行中的节点确认宽度 162、碰撞半径 27、蓄力条宽度 72，以及 SettingsGear 节点存在。

2026-10-14 验证结果：单元测试 78/78、长时运行测试 3/3、TypeScript 检查通过；Web 和微信构建均确认 Finished 标记及产物存在；真实 Chrome 回归 117/117、微信开发者工具回归 82/82，均无运行错误。微信使用 AppID `wxcefa299717fbb2da`。

[Web 实际画面](screenshots/cat-presentation-web.png) · [微信实际画面](screenshots/cat-presentation-wechat.png)
