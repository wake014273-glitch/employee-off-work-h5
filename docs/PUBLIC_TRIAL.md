# 公开网页试玩（2026-10-17）

当前入口：https://wake014273-glitch.github.io/employee-off-work-h5/?v=20261017-5f07a47b3b94efe4

二维码：`docs/screenshots/public-current-20261017-qrcode.png`，600×600。已实际解码，内容与上述链接一致。

用户已选择「直接分享的微信网页试玩二维码」，因此使用项目已有 GitHub Pages 站点分发 web-mobile 构建。无需添加微信体验成员、无需游戏登录或同一 Wi-Fi。它在微信内打开网页游玩；原生微信小游戏构建和原开发预览二维码仍保留。

部署仓库：`wake014273-glitch/employee-off-work-h5`，分支 `main`。网页文件位于仓库根目录，沿用 `.nojekyll` 和现有 Pages 配置。

源码保存于同仓库 `codex/current-source` 分支，包含当前 Cocos Creator 3.8.8 项目、美术与音频资源、脚本、测试、文档及音频测试依赖的原始素材；不包含编辑器、环境文件或生成缓存。当前版本以源码快照保存。

部署提交：`88ae96ebcdee684fa7788213b016b455af2e19fa`。GitHub Pages 状态已确认 `built`，对应此次提交。

本版包含困难 4、5、6 及后期难度上限调整、当前音效，以及加载进度与切换闪屏修复。源码与双端构建指纹均为 `source:5f07a47b3b94efe4`；游戏代码没有因本次分享操作发生变化。

验证：

- 当前工作区 `npm test` 130/130、`npm run test:soak` 5/5、`npm run qa` 180/180，浏览器运行错误为空。
- 从待上传源码快照独立运行 `npm test` 130/130、`npm run test:soak` 5/5，源码指纹保持一致。
- 已从公开站逐项下载全部 240 个分发文件，SHA-256 全部与本地构建一致，包括 `build-info.json`。
- 公网完整回归 175/180，无运行时错误，启动耗时约 38.6 秒；原加载进度、连续交接和满格后进入首页检查均通过。首次综合回归的 5 项触摸检查在新建手机模拟页面独立复验 5/5，并记录到真实 DOM 触摸事件；长距离转向、头像第二指松开后继续拖动均符合预期。联合覆盖全部 180 项，未把首次未通过的报告改写为通过。
- 公网报告：`qa-public/web-result.json` 与 `public-touch-result.json`；文件校验：`public-file-verification.json`，均在下面的记录目录内。

上传与公网验证记录：`employee-off-work/temp/share-current-20261017/`。双端构建、冷启动与微信开发者工具验证详见 `docs/PROJECT_CODE_AUDIT_20261017.md`。

首次打开需要等待下载，速度取决于玩家网络。浏览器回归使用本机 Chrome 手机模拟，不冒称手机微信实机测试。本次沿用网页试玩分发，未进行微信小游戏正式提审或上架。
