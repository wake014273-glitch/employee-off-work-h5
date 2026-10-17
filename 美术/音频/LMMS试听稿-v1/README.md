# 《摸鱼请走位》LMMS 试听稿 v1

这是一版供试听定风格的原创草稿：1 段循环 BGM 与 5 个核心音效，不是完整配乐套装。旋律、编排、合成器设置与 4 个鼓采样均在本次制作中编写，未使用第三方歌曲、录音或付费插件。

接入状态更新（2026-10-16）：用户选定本版后，BGM 与 5 个核心音效已接入游戏。当前接入与缺项说明见 `docs/AUDIO_INTEGRATION.md`；下文“本次项目检查”保留的是制作试听稿时的历史记录。

## 试听

- `exports/01-fish-break-preview.mp3`：BGM 便捷试听。MP3 用于预览，循环接入请用 WAV。
- `exports/01-fish-break-loop.wav`：34.285714 秒，112 BPM，4/4，16 小节，D 大调。旋律、切分和弦、贝斯、铃音与四条打击乐轨。
- `exports/00-sfx-audition.wav`：音效连播，依次为按钮 → 拾鱼 → 蓄满 → 开盾 → 受击，中间留空。

| 文件 | 用途 | 时长约 |
| --- | --- | --- |
| `02-ui.wav` | 轻巧按钮反馈 | 0.049 秒 |
| `03-pickup.wav` | 拾鱼，两音上行 | 0.164 秒 |
| `04-ready.wav` | 护盾蓄满，明亮短琶音 | 0.350 秒 |
| `05-shield.wav` | 释放护盾，上升气泡音 | 0.388 秒 |
| `06-hit.wav` | 工作负荷增加，低音下坠 | 0.133 秒 |

## 在 LMMS 中编辑

打开 `projects/01-fish-break-loop.mmp`，空格开始／暂停，方形 Stop 按钮回到起点。双击绿色片段可编辑音符；轨道 VOL／PAN 可调整音量与声像。其他 5 个 `.mmp` 各对应一种音效。

本机实测 LMMS 1.2.2。BGM 已通过 LMMS 界面打开、播放和导出，音效由同一 LMMS 的官方命令行渲染。没有使用其外的音乐生成模型。

采样引用当前文件夹的绝对路径。整体迁移文件夹后，在新位置运行 `node build-projects.mjs` 重建引用；该命令会重写本文件夹内的草稿工程，请先另存你的手动修改。`node render-and-check.mjs` 会渲染缺失的音效母带并重新整理导出文件；BGM 母带从 LMMS 界面导出到 `masters/01-fish-break-loop.wav`。

## 音频检查与限制

- 导出 WAV：44.1 kHz、16 位、双声道；原始 LMMS 母带保留在 `masters/`。
- 6 个独立 WAV 均已检查 RIFF 结构、有效声音、时长与峰值，未出现削波；数值见 `audio-check.json`。
- BGM 已修整为 16 小节的整数采样长度，并在边缘处理约 2 ms 淡入淡出；需要耳听确认音乐衔接是否合适。
- 当前 BGM 音量留有较大余量（RMS 约 -25.5 dBFS），音效的响度尚未在实际游戏中统一。
- 尚待用户试听、手机外放试听，以及后续接入后的音乐／音效混音和微信真机验证。

## 本次项目检查

遵照工作区 AGENTS.md 实际执行：

- `npm test`：110/110 通过。
- `npm run test:soak`：3/3 通过。
- `npm run qa`：真实 Chrome，153 项通过，无失败项；结果为 `employee-off-work/temp/qa/lmms-demo/web-result.json`。
- `npm run build:web`、`npm run build:wechat`：均确认 `build Task (<platform>) Finished` 标记与产物存在；Cocos 返回 36。沙箱内最初启动失败，沙箱外复跑通过。

这些项目检查验证的是现有游戏。本次只新增工作区中的音频制作文件，没有修改游戏代码、场景、Prefab、资源元数据，也没有把试听音频接入微信版。不能把上述检查当作新音频已通过游戏内或微信真机验收。
