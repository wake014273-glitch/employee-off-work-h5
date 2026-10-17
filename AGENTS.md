# Agent 工作规则

## 项目边界

- 工作区根目录：`F:\下班下班`
- Cocos 项目：`F:\下班下班\employee-off-work`
- 技术栈：Cocos Creator 3.8.8 + TypeScript + 2D + 竖屏
- 当前目标：先完成可玩的微信小游戏版本；不上架、不接广告、不接登录、不建后端。
- 主角身份：普通公司员工，不限定设计、程序、销售等具体职业；所有剧情和工作弹幕必须保持跨职业可理解。

## 文件修改规则

- 核心游戏逻辑禁止直接调用 `wx.*`，微信能力必须通过平台服务层隔离。
- 不手工编造、批量修改或删除 Cocos `.meta`、`.scene`、`.prefab` 文件。
- 场景、Prefab、资源 UUID 优先由 Cocos Creator 编辑器生成和维护。
- 多个 Agent 不得同时修改同一个场景或 Prefab。
- Agent 优先修改 TypeScript、JSON、Markdown、测试和构建脚本。
- 弹幕集中更新并使用对象池；不要给每颗弹幕配置复杂独立 `update()`。
- 不把 `tools/`、`library/`、`temp/`、`local/`、`build/`、`profiles/`、`node_modules/` 提交到 Git。

## 实现通道

- 本项目由 Hermes Agent 直接实现：直接修改 TypeScript、脚本、测试和文档，**不调用 Codex CLI 或其他外部编码代理**。
- 每次改动后必须实际运行：`npm test`、`npm run test:soak`、`npm run qa`（实机回归，需先起服务和调试端口 Chrome），以及对应平台构建 `npm run build:web` / `npm run build:wechat`。
- 构建成功判据是「日志标记 `build Task (<platform>) Finished` + 产物文件存在」，不要用 Cocos CLI 退出码判断；成功构建也可能返回 36。

## 验证要求

任何任务完成前必须实际运行对应检查；不能只创建文件后宣称完成。微信平台功能必须在微信开发者工具中复验。
