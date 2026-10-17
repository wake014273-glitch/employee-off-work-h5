# 公开网页试玩（2026-10-17）

当前入口：https://wake014273-glitch.github.io/employee-off-work-h5/?v=20261017-587580702cd604d5

二维码：`docs/screenshots/loading-fast-public-20261017-qrcode.png`，600×600。已实际解码，内容与上述链接一致。

用户已选择「直接分享的微信网页试玩二维码」，因此使用项目已有 GitHub Pages 站点分发 web-mobile 构建。无需添加微信体验成员、无需游戏登录或同一 Wi-Fi。它在微信内打开网页游玩；原生微信小游戏构建和原开发预览二维码仍保留。

部署仓库：`wake014273-glitch/employee-off-work-h5`，分支 `main`。网页文件位于仓库根目录，沿用 `.nojekyll` 和现有 Pages 配置。

源码保存于同仓库 `codex/current-source` 分支，包含当前 Cocos Creator 3.8.8 项目、美术与音频资源、脚本、测试、文档及音频测试依赖的原始素材；不包含编辑器、环境文件或生成缓存。当前版本以源码快照保存。

部署提交：`357fc12bb8ab90df00737eb42b3af24cb9005c15`。GitHub Pages 状态已确认 `built`，对应此次提交。

本版包含困难 4、5、6 及后期难度上限调整、当前音效、加载进度与切换闪屏修复，并进一步修复绿色末端露出鱼身的问题及精简启动包。源码与双端构建指纹均为 `source:587580702cd604d5`。具体实测见 `docs/LOADING_SPEED_AND_FILL_20261017.md`。

验证：

- 当前工作区 `npm test` 132/132、`npm run test:soak` 5/5、`npm run qa` 180/180，浏览器运行错误为空。
- 从待上传源码快照独立运行 `npm test` 132/132、`npm run test:soak` 5/5，源码指纹保持一致。
- 本地冷启动、缓存启动与三种加载画面像素检查 14/14，菜单布局与重试检查 19/19，微信生命周期及断网恢复 10/10。
- 网页分发总计 233 个文件、13,823,235 字节，全部公网文件 SHA-256 与本地构建一致。
- 直接访问 GitHub Pages 的冷启动、缓存启动及三种加载画面像素检查 14/14，运行错误为空；报告为 `startup-public/startup-result.json`，文件校验为 `public-file-verification.json`。

本次上传与公网验证记录：`employee-off-work/temp/qa/loading-speed-20261017/`。上一次分享记录保留于 `employee-off-work/temp/share-current-20261017/`，其中的旧版触摸复验与完整回归报告仍可追溯。

首次打开需要等待下载，速度取决于玩家网络。浏览器回归使用本机 Chrome 手机模拟，不冒称手机微信实机测试。本次沿用网页试玩分发，未进行微信小游戏正式提审或上架。
