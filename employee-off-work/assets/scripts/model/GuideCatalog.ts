export type GuidePage = 'controls' | 'bullets' | 'resources';
export const GUIDE_PAGES: Record<GuidePage, { footer: string; rows: { icon: string; title: string; body: string }[] }> = {
  controls: {
    footer: '',
    rows: [
      { icon: '', title: '拖动走位', body: '按住并拖动屏幕，躲开工作弹幕。' },
      { icon: '', title: '双击免疫', body: '满 5 条小鱼，松手双击免疫 3 秒。' },
      { icon: '', title: '工作负荷', body: '碰撞 +1 格，满 3 格结束。' },
    ],
  },
  bullets: {
    footer: '注意躲避',
    rows: [
      { icon: 'requirement', title: '需求表', body: '会突然转向，注意避让。' },
      { icon: 'folder', title: '文件夹', body: '成排推进，穿缝加分。' },
      { icon: 'message', title: '消息', body: '短暂追踪，甩开可加分。' },
    ],
  },
  resources: {
    footer: '均可拾取',
    rows: [
      { icon: 'fish', title: '小鱼', body: '能量 +1；免疫时不拾取。' },
      { icon: 'leave', title: '请假条', body: '清屏保护 1 秒，不减负。' },
      { icon: 'helper', title: 'AI', body: '拾取减少 1 格工作负荷。' },
      { icon: 'agent', title: 'Agent', body: '拾取减少 2 格工作负荷。' },
    ],
  },
};
