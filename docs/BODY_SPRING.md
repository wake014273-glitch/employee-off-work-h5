# 身体弹簧牵引

角色的下半身跟随手指，上半身产生惯性滞后。左右、上下及斜向拖动都会驱动弹簧；快速转向时身体改变弯曲方向，松手后回摆并恢复。脸部作为整体平移，避免拉坏表情。原有 50 帧待机动画继续播放。

## 实现

- `employee-off-work/assets/scripts/model/BodySpring.ts`：与引擎无关的阻尼弹簧，每次逻辑帧更新一次，使用不超过 1/120 秒的积分步长。脚部权重为零，腰部逐渐增大，头部权重为一。横向偏移最多 36，纵向偏移最多 22 个设计单位。
- `employee-off-work/assets/scripts/SpringSprite.ts`：为整张角色图片建立 24 排、50 个顶点的连续网格。相邻排共用顶点，避免分割图片带来的接缝；按当前 SpriteFrame 的 UV 插值，继续使用原始图集和图片。
- `employee-off-work/assets/scripts/GameMain.ts`：角色移动后推进弹簧，显示时应用弯曲。能量条随头部移动，免疫轮廓使用同一弯曲参数。暂停及切后台时冻结，重开、回首页及调整视口时重置。靠近顶部时限制向上的视觉偏移，保留 HUD 间距。

弹簧只影响视觉网格，不改变拖动坐标、碰撞判定或游戏数值。场景和 Prefab 无需手工修改，新增 TypeScript 的 `.meta` 由 Cocos Creator 生成。

## 调节

`BODY_SPRING` 集中提供参数：`stiffness` 增大使身体恢复更快；`damping` 增大减少回摆；`drive` 增大加强拖动产生的惯性；`maxX` / `maxY` 限制最大变形。当前值为 135 / 11 / 18 / 36 / 22。

2026-10-14 调整：刚度由 200 降至 135，阻尼由 14 降至 11，拖动牵引由 15 提高至 18；横向上限由 26 提高至 36，纵向上限由 12 提高至 22。身体滞后和回摆更明显，回摆节奏稍慢。向上拖动时上半身滞后、身体压缩，向下拖动时身体拉长；停下后反向回弹并自然收敛。沿用第三种连续渐细拖尾及薄荷青、奶油白、淡紫配色。

渲染适配层使用 Cocos Creator 3.8.8 的 UI assembler 接口。升级引擎时需要复验该层，尤其是渲染数据分配、顶点格式和索引缓冲提交。

## 验证

`tests/body-spring.test.mjs` 覆盖脚部固定、头部滞后、松手回摆、暂停冻结、反向和竖向移动、30/60/120 FPS 一致性，以及一万次大幅转向和掉帧的有限性。

`scripts/qa-spring-fixture.mjs` 在 Chrome 和微信开发者工具中使用同一组拖动操作，检查实际节点、网格、待机帧、免疫轮廓及能量条。运行 `npm test`、`npm run test:soak`、`npm run build:web`、`npm run qa`、`npm run build:wechat` 和 `npm run qa:wechat`。截图及报告写入忽略的 `employee-off-work/temp/qa/`。

2026-10-14 本次验证：单元测试 85/85、持续运行检查 3/3、TypeScript 检查通过；浏览器实际回归 129/129、微信开发者工具运动专项回归 22/22（`npm run qa:wechat -- --motion`）。微信实测横向偏移 -36，向上拖动偏移 -22，向下拖动偏移 +22；两轴回弹收敛、脚部固定、能量条随头部、护盾轮廓变形一致，控制台无运行错误。Web 和微信构建均具备 Finished 标记和全部产物，微信使用 AppID `wxcefa299717fbb2da`。

[左右和上下弹簧的实际动图](screenshots/cat-particle-spring-preview.gif)。浏览器报告：`employee-off-work/temp/qa/particle-spring-web/web-result.json`；微信专项报告：`employee-off-work/temp/qa/particle-spring-wechat/wechat-motion-result.json`。
