# 第一版风格补充音效

新增 6 个原创 LMMS 合成音效，保留第一版的 D 大调、正弦／三角波短音风格。原 BGM 和五个已确认音效不变。

试听 `exports/00-audition.mp3`，顺序为：请假清屏、AI／Agent 减负、恢复倒计时、恢复游戏、操作评级、技巧成功。每段间隔约 1.1 秒。

`projects/*.mmp` 可直接在 LMMS 1.2.2 中编辑。`masters/` 保存渲染原稿；`exports/` 为裁尾、淡入淡出后的 44.1 kHz、16 bit、立体声 WAV。`audio-check.json` 记录时长、峰值、RMS 和 SHA-256。

运行 `node design-and-render.mjs` 会通过本机 LMMS 重新合成、导出并复制到游戏音频目录；不会修改任何 Cocos 元数据。游戏中的使用位置、冷却与验证记录见工作区根目录 `docs/AUDIO_INTEGRATION.md`。
