# 手机结算与好友榜布局修复

2026-10-16，对应手机截图中的两个问题。

- 结算原图为 1218 像素宽，但纸面及「再来一局」按钮的中心在原图 x=558.5。结算布局统一使用这一水平原点，图片、补片、动态文字、印章、好友榜按钮和点击区域一起校正；首页继续使用原有坐标。
- 好友榜滚动内容保留顶部锚点，在其中增加居中的 520×1040 绘制节点，中心位于 y=-520，避免 Cocos `SubContextView` 的居中子贴图有一半落在遮罩外。
- 在绘制节点尚未激活、`SubContextView.onLoad` 尚未初始化贴图前，将其设计尺寸设为 640×1280，与开放数据域画布布局保持一致，避免默认 640×960 导致纵向压缩。
- 不改动场景、Prefab、Meta 或微信能力隔离层；好友数据继续留在开放数据域。

验证：

- `npm test`：最终复验 112 项通过。
- `npm run test:soak`：3 项通过。
- `npm run qa`：153 项通过。
- Web、微信构建均确认 `build Task (<platform>) Finished` 和必要产物，指纹为 `source:5d75ffdf9ad9215a`。
- 独立服务和 Chrome 会话中，菜单专项 19 项、好友榜专项 19 项通过，无运行错误。好友榜覆盖 390×844、360×640、430×932 和 402×874（DPR 3）。
- 截图：`employee-off-work/temp/qa/ui-fix/menu/web-result.png`、`employee-off-work/temp/qa/friends/ui-preview-top10.png`。好友榜截图使用显式测试数据。

微信工具复验增加了真实 `SubContextView` 子贴图顶部与纵横比例断言，但本次未通过工具端验收：原项目未加载小游戏运行上下文；独立项目重开后仍返回 `timeout waiting for automator response`。日志为 `employee-off-work/temp/ui-fix-qa-wechat-isolated.log`。额外重复构建因长时间无进展被停止，标准微信构建目录已恢复为此前成功生成的同指纹快照。手机实机观感仍需使用修复后的构建复核。
