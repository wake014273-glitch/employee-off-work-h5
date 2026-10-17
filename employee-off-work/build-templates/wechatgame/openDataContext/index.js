/* Friends, avatar URLs, cloud records and rank calculation stay inside this isolated context. */
const { createController } = require('./controller');
const canvas = wx.getSharedCanvas();
const ctx = canvas.getContext('2d');
const INK = '#300f3b', MUTED = '#6d4a69', CREAM = '#fff5dc', GREEN = '#e8fbdc';
let active = false, current = null;
const avatars = new Map();
function roundRect(x, y, w, h, r, fill, stroke) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}
function text(value, x, y, size = 24, color = INK, align = 'left', bold = false) {
  ctx.fillStyle = color; ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(String(value), x, y);
}
function shorten(value, width) {
  ctx.font = 'bold 32px sans-serif';
  const letters = Array.from(value.replace(/[\r\n\t]/g, ' '));
  if (ctx.measureText(letters.join('')).width <= width) return letters.join('');
  while (letters.length && ctx.measureText(letters.join('') + '…').width > width) letters.pop();
  return letters.join('') + '…';
}
function avatar(row, x, y) {
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = row.isSelf ? '#c7e2ae' : '#e9dce8'; ctx.fillRect(x - 26, y - 26, 52, 52);
  const image = avatars.get(row.avatarUrl);
  if (image && image.ready) ctx.drawImage(image.node, x - 26, y - 26, 52, 52);
  else text(row.isSelf ? '我' : '鱼', x, y, 26, INK, 'center', true);
  ctx.restore();
}
function cacheAvatars(rows) {
  // Keep at most the current visible list; callbacks from an old board cannot redraw a closed board.
  const urls = new Set(rows.map(row => row.avatarUrl).filter(Boolean));
  for (const url of avatars.keys()) if (!urls.has(url)) avatars.delete(url);
  for (const url of urls) {
    if (avatars.has(url) || !/^https:\/\//.test(url)) continue;
    const node = wx.createImage(), entry = { node, ready: false };
    avatars.set(url, entry);
    node.onload = () => { entry.ready = true; if (active && avatars.get(url) === entry) draw(); };
    node.onerror = () => { entry.ready = false; };
    node.src = url;
  }
}
function rowView(row, index) {
  const y = 80 + index * 90;
  const medal = ['#ffca43', '#d7cce8', '#f5bc8c'][index];
  roundRect(8, y, 624, 80, 16, row.isSelf ? GREEN : '#f7e0bd', row.isSelf ? '#a2ce8d' : '#ebc89c');
  roundRect(19, y + 16, 44, 48, 12, medal || '#f4e3c4');
  text(row.rank, 41, y + 40, 30, INK, 'center', true);
  avatar(row, 101, y + 40);
  text(shorten(row.isSelf ? '我' : row.nickname || '摸鱼好友', 252), 140, y + 40, 32, INK, 'left', row.isSelf);
  text(row.score.toLocaleString('en-US'), 612, y + 40, 34, row.isSelf ? '#48763d' : INK, 'right', true);
}
function draw() {
  if (!active || !current || !canvas.width || !canvas.height) return;
  const data = current;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save(); ctx.scale(canvas.width / 640, canvas.height / 1280);
  roundRect(8, 4, 624, 60, 14, '#f4e2bf');
  text('名次', 41, 34, 28, MUTED, 'center'); text('好友', 140, 34, 28, MUTED);
  text('最高分', 612, 34, 28, MUTED, 'right');
  if (data.state === 'ready' && data.top.length) {
    data.top.forEach(rowView);
    if (data.friendCount === 0) {
      text('暂无好友积分排名', 320, 430, 34, INK, 'center', true);
    }
  } else {
    const title = data.state === 'loading' ? '加载中…' : data.state === 'failed' ? '加载失败' : '暂无好友积分排名';
    const subtitle = data.state === 'failed' ? '点“刷新榜单”重试' : '';
    text(title, 320, 320, 34, INK, 'center', true);
    if (subtitle) text(subtitle, 320, 375, 28, MUTED, 'center');
  }
  // Empty/loading/error states keep the personal summary above the fold, even on short screens.
  const recordY = data.state === 'ready' && data.friendCount > 0 ? 1012 : 550;
  const best = Math.max(data.localBest, data.own ? data.own.score : 0);
  const waiting = data.localBest > (data.own ? data.own.score : 0);
  const rank = waiting ? '排名待更新' : data.state === 'ready' && data.self ? '好友第 ' + data.self.rank + ' 名' : best > 0 ? '排名待更新' : '';
  const status = data.syncState === 'failed' ? '同步失败，刷新重试（成绩已保存）'
    : data.syncState === 'syncing' ? '同步中…' : '';
  roundRect(8, recordY, 624, status ? 252 : rank ? 202 : 148, 18, '#f7dfb9', '#ebc89c');
  text('个人最高分', 30, recordY + 42, 30, '#537146', 'left', true);
  text(best > 0 ? best.toLocaleString('en-US') + ' 分' : '暂无纪录', 30, recordY + 96, best > 0 ? 36 : 28, '#3f6534', 'left', true);
  if (rank) text(rank, 30, recordY + 158, 28, INK);
  if (status) text(status, 30, recordY + 212, 28, data.syncState === 'failed' ? '#a04e49' : MUTED);
  ctx.restore();
}
const controller = createController(wx, data => {
  current = data; draw();
  cacheAvatars([...data.top, ...(data.self ? [data.self] : [])]);
});
wx.onMessage(message => {
  if (message && message.type === 'engine') { if (active) controller.redraw(); return; }
  if (!message || message.type !== 'offwork-friends') return;
  if (message.action === 'show') active = true;
  if (message.action === 'hide') { active = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  controller.onMessage(message);
});
