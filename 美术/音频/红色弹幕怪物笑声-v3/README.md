# 红色弹幕怪物笑声 v3

源录音：AntumDeluge — Evil Laugh，2018-02-10。

- 作品页：https://opengameart.org/content/evil-laugh
- 原始文件：https://opengameart.org/sites/default/files/laugh-evil-1_0.ogg
- 许可：CC0-1.0，https://creativecommons.org/publicdomain/zero/1.0/
- 下载日期：2026-10-17；原音和许可页快照在 `source/`。

先前的纯合成笑声因辨识度不足被用户否定。本版使用真实笑声保留笑声节奏和换气，再降调、混入低声叠层与短回声。源录音非本项目原创。

在 Cocos 项目目录执行 `node scripts/generate-evil-laugh.mjs` 可重建导出及游戏 `laugh.wav`；需 FFmpeg。导出 44.1 kHz 单声道 PCM16，2.65 秒，峰值约 −3.35 dBFS。详细参数见脚本，校验值见 `audio-check.json`。

红色消息成功生成、冷却结束时以 35% 概率触发；冷却 12–24 秒。
