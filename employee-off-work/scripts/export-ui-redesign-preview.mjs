import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const target = resolve('../美术/界面风格统一/重新设计版'); mkdirSync(target, { recursive: true });
const entries = [
  ['office-ui/web-settings', '01-设置暂停', '设置指南'],
  ['office-ui/web-help', '02-指南-操作', '设置指南'],
  ['office-ui/web-help-bullets', '03-指南-全部工作弹幕', '设置指南'],
  ['office-ui/web-help-resources', '04-指南-全部资源道具', '设置指南'],
  ['office-ui/web-tutorial-intro', '05-新手教学开场', '教程反馈'],
  ['office-ui/web-tutorial-ready', '06-新手教学完成', '教程反馈'],
  ['office-ui/web-practice-guide', '07-练习说明条', '教程反馈'],
  ['office-ui/web-good-unframed', '08-GOOD无底框', '教程反馈'],
  ['office-ui/web-resume-3', '09-纯数字恢复倒计时', '教程反馈'],
  ['office-ui/web-friends-from-settings', '10-好友榜默认空状态', '排行榜'],
  ['friends/ui-preview-top10', '11-好友榜列表-测试数据', '排行榜'],
  ['friends/ui-preview-empty', '12-好友榜空榜', '排行榜'],
  ['friends/ui-preview-loading', '13-好友榜加载中', '排行榜'],
  ['friends/ui-preview-failed', '14-好友榜读取失败', '排行榜'],
  ['friends/ui-preview-sync-failed', '15-好友榜同步失败-测试数据', '排行榜'],
  ['friends/ui-preview-privacy-wait', '16-好友榜隐私等待', '排行榜'],
  ['friends/ui-preview-privacy-declined', '17-好友榜隐私未确认', '排行榜'],
  ['office-ui/web-leave-notice', '18-请假清屏提示', '教程反馈'],
  ['office-ui/web-immunity-notice', '19-免疫操作提示', '教程反馈'],
  ['office-ui/web-loading-retry', '20-加载失败重试', '教程反馈'],
  ['office-ui/web-settings-360x640', '21-短屏设置布局', '设置指南'],
  ['office-ui/web-settings-430x932', '22-长屏设置布局', '设置指南'],
  ['office-ui/web-help-resources-bottom', '23-紧凑屏资源指南底部', '设置指南'],
  ['friends/ui-preview-top10-bottom', '24-排行榜滑动到底部-测试数据', '排行榜'],
  ['office-ui/web-exit-confirmation', '25-返回首页确认', '设置指南'],
  ['office-ui/web-settings-safe-area', '26-平台安全区适配', '设置指南'],
];
for (const [source, name] of entries) copyFileSync(resolve('temp/qa/' + source + '.png'), resolve(target, name + '.png'));
for (const name of ['office-panel-paper-v3', 'settings-icons-v2', 'green-button-v2'])
  copyFileSync(resolve('assets/art/menus/' + name + '.png'), resolve(target, name + '.png'));
const cards = entries.map(([, name, group]) => `<figure data-group="${group}"><button class="image" aria-label="放大${name}"><img loading="lazy" src="${name}.png" alt="${name}"></button><figcaption>${name}</figcaption></figure>`).join('');
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>摸鱼请走位 · 界面重新设计</title>
<style>*{box-sizing:border-box}body{margin:0;padding:32px;background:#fff5dc;color:#300f3b;font-family:system-ui}header{max-width:1000px;margin-bottom:26px}h1{font-size:28px}p{line-height:1.8;color:#6d4a69}nav{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}button{cursor:pointer;font:inherit;color:inherit;border:1px solid #eac596;background:#f7ddb2;border-radius:13px;padding:10px 18px}nav button.active{background:#daf4c6;border-color:#aad195;font-weight:bold}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,310px));gap:24px}figure{margin:0;padding:12px;border:1px solid #eac596;border-radius:20px;background:#f9e6c7}.image{display:block;padding:0;border:0;width:100%;background:none}img{width:100%;display:block;border-radius:12px}figcaption{margin:12px 4px 4px;font-size:14px;font-weight:bold}dialog{padding:14px;border:0;border-radius:18px;background:#fff5dc;max-width:95vw}dialog::backdrop{background:#211326bb}dialog img{width:auto;max-width:90vw;max-height:86vh}dialog button{float:right;margin-bottom:10px}[hidden]{display:none!important}</style>
<header><h1>摸鱼请走位 · 暖橙纸质面板</h1><p>设置、指南、好友榜和加载重试采用宽暖橙包边、奶油纸面与紫色夹扣，减少细碎边线，让内容更清楚。</p><p>以下为实际 Web 游戏截图，点击放大。排行榜列表使用测试数据；验证说明见同目录文档。</p></header><nav>${['全部','设置指南','教程反馈','排行榜'].map((g,i)=>`<button ${i===0?'class="active"':''} data-filter="${g}">${g}</button>`).join('')}</nav><main>${cards}</main><dialog><button aria-label="关闭预览">×</button><img alt="放大界面预览"></dialog><script>const dialog=document.querySelector('dialog');document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('figure').forEach(f=>f.hidden=b.dataset.filter!=='全部'&&f.dataset.group!==b.dataset.filter)});document.querySelectorAll('.image').forEach(b=>b.onclick=()=>{dialog.querySelector('img').src=b.querySelector('img').src;dialog.showModal()});dialog.querySelector('button').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog)dialog.close()};</script></html>`;
writeFileSync(resolve(target, '界面预览.html'), html);
const previous = resolve('../美术/界面风格统一/已接入界面预览/界面预览.html');
writeFileSync(previous, html.replaceAll('src="', 'src="../重新设计版/'));
const web = JSON.parse(readFileSync('temp/qa/office-ui/web-result.json','utf8'));
const friend = JSON.parse(readFileSync('temp/qa/friends/web-result.json','utf8'));
console.log(JSON.stringify({target, screenshots:entries.length, webPassed:web.passed, friendsPassed:friend.passed}));
