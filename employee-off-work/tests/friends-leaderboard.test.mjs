import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { packageFriends } from '../scripts/package-friends.mjs';
const require = createRequire(import.meta.url);
const { SCORE_KEY, readRecord, rankFriends } = require('../build-templates/wechatgame/openDataContext/ranking.js');
const { createController } = require('../build-templates/wechatgame/openDataContext/controller.js');
const record = (score, tag = 'player_12345678', time = 1) => ({ version: 1, score, playerTag: tag, achievedAt: time });
const items = value => [{ key: SCORE_KEY, value: JSON.stringify(value) }];
const user = (id, score, tag = 'tag_' + id.padStart(12, '0'), time = 1) => ({ openid: id, nickname: '好友' + id, KVDataList: items(record(score, tag, time)) });
const show = { type: 'offwork-friends', action: 'show', bestScore: 0 };
const sync = bestScore => ({ type: 'offwork-friends', action: 'sync', bestScore });
function platformService(overrides = {}) {
  const sent = []; let consent;
  const source = readFileSync(new URL('../assets/scripts/PlatformServices.ts', import.meta.url), 'utf8');
  const fragment = source.slice(source.indexOf('export class FriendLeaderboardService'), source.indexOf('export const SOUND_NAMES')).replace('export class', 'class');
  const sandbox = { sys: { platform: 'wechat', Platform: { WECHAT_GAME: 'wechat' } }, wx: {
    getOpenDataContext: () => ({ postMessage: message => sent.push(message) }),
    getPrivacySetting: o => o.success({ needAuthorization: true }),
    requirePrivacyAuthorize: o => { consent = o; }, ...overrides,
  } };
  const service = vm.runInNewContext(stripTypeScriptTypes(fragment) + '\nnew FriendLeaderboardService()', sandbox);
  return { service, sent, consent: () => consent };
}

test('unconfirmed privacy keeps startup local, then consent synchronizes the newest score', () => {
  const h = platformService(); h.service.sync(120); assert.equal(h.sent.length, 0);
  const shown = []; assert.equal(h.service.show(ok => shown.push(ok)), 'pending');
  h.service.sync(250); assert.equal(h.sent.length, 0); h.consent().success();
  assert.deepEqual(shown, [true]); assert.deepEqual(h.sent.map(m => [m.action, m.bestScore]), [['sync', 250], ['show', 250]]);
});

test('privacy refusal permits retry and closing cancels reopening after later consent', () => {
  const h = platformService(); const shown = [];
  h.service.show(ok => shown.push(ok)); h.consent().fail(); assert.deepEqual(shown, [false]);
  h.service.show(ok => shown.push(ok)); h.service.hide(); h.consent().success();
  assert.deepEqual(shown, [false]); assert.equal(h.sent.some(m => m.action === 'show'), false);
  h.service.show(ok => shown.push(ok)); assert.deepEqual(shown, [false, true]);
});

test('privacy API errors and synchronous callbacks leave a resolved UI state', () => {
  const h = platformService({ requirePrivacyAuthorize: () => { throw new Error('unsupported'); } });
  let accepted = true; assert.equal(h.service.show(ok => { accepted = ok; }), 'opened'); assert.equal(accepted, false);
  const ready = platformService({ requirePrivacyAuthorize: o => o.success() });
  assert.equal(ready.service.show(() => {}), 'opened'); assert.equal(ready.sent.at(-1).action, 'show');
});

test('previously confirmed users automatically sync best scores', () => {
  const h = platformService({ getPrivacySetting: o => o.success({ needAuthorization: false }) });
  h.service.sync(100); h.service.sync(80);
  assert.equal(h.sent.at(-1).bestScore, 100); assert.equal(h.service.show(() => {}), 'opened');
});
function harness(overrides = {}) {
  let remote = [], writes = [], views = [];
  const api = {
    getUserCloudStorage: options => queueMicrotask(() => options.success({ KVDataList: remote })),
    setUserCloudStorage: options => queueMicrotask(() => { remote = options.KVDataList; writes.push(readRecord(remote)); options.success({}); }),
    getFriendCloudStorage: options => queueMicrotask(() => options.success({ data: [] })), ...overrides,
  };
  const controller = createController(api, data => views.push(data), { timeoutMs: 40, now: () => 100, createTag: () => 'player_created_123' });
  return { controller, views, writes, api, setRemote: value => { remote = items(value); } };
}

test('ranking discards corrupt/invalid/zero records, deduplicates users and keeps ten rows with shared ranks', () => {
  const data = Array.from({ length: 14 }, (_, i) => user(String(i), i < 2 ? 2000 : 1800 - i * 30));
  data.push(user('0', 100), user('invalid', -1), { openid: 'broken', KVDataList: [{ key: SCORE_KEY, value: '{' }] }, user('zero', 0));
  const ranked = rankFriends(data, record(1000));
  assert.equal(ranked.top.length, 10); assert.equal(ranked.total, 15);
  assert.equal(ranked.top[0].score, 2000); assert.equal(ranked.top[0].rank, 1); assert.equal(ranked.top[1].rank, 1);
  assert.equal(ranked.top[2].rank, 3); assert.equal(ranked.self.rank, 15);
  for (const value of [NaN, Infinity, -4, '20', 1.5, Number.MAX_SAFE_INTEGER + 1]) assert.equal(readRecord(items(record(value))), null);
});

test('current player is identified by their own cloud tag without requesting user information', () => {
  const own = record(400, 'unique_self_123');
  const ranked = rankFriends([user('a', 400, 'unique_self_123'), user('b', 400)], own);
  assert.equal(ranked.total, 2); assert.equal(ranked.self.id, 'a'); assert.equal(ranked.self.rank, 1);
});

test('cloud best survives lower scores and a second device; an improved score retains the identity tag', async () => {
  const h = harness(); h.setRemote(record(1000));
  h.controller.onMessage(sync(300)); await h.controller.idle(); assert.equal(h.writes.length, 0);
  h.controller.onMessage(sync(1100)); await h.controller.idle(); assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0].score, 1100); assert.equal(h.writes[0].playerTag, 'player_12345678');
  h.controller.onMessage(sync(900)); await h.controller.idle(); assert.equal(h.writes.length, 1);
});

test('a new best arriving during upload is serialized and not lost', async () => {
  const h = harness(); const pending = [];
  h.api.setUserCloudStorage = options => pending.push(options);
  h.controller.onMessage(sync(100)); await new Promise(resolve => setImmediate(resolve));
  h.controller.onMessage(sync(300)); assert.equal(pending.length, 1);
  pending[0].success({}); await new Promise(resolve => setImmediate(resolve)); assert.equal(pending.length, 2);
  assert.equal(readRecord(pending[1].KVDataList).score, 300);
  pending[1].success({}); await h.controller.idle();
  h.controller.onMessage(show); await h.controller.idle();
});

test('failed remote reads never overwrite an unknown best; refresh retries and finishes synchronization', async () => {
  const h = harness({ getUserCloudStorage: options => options.fail({ errMsg: 'offline' }) });
  h.controller.onMessage({ ...show, bestScore: 400 }); await h.controller.idle();
  assert.equal(h.writes.length, 0); assert.equal(h.views.at(-1).syncState, 'failed');
  h.api.getUserCloudStorage = options => options.success({ KVDataList: items(record(200)) });
  h.controller.onMessage(show); await h.controller.idle();
  assert.equal(h.writes.at(-1).score, 400); assert.equal(h.views.at(-1).syncState, 'idle');
});

test('friend API failure and timeout display retry states, and closing invalidates late callbacks', async () => {
  const pending = [];
  const h = harness({ getFriendCloudStorage: options => pending.push(options) });
  h.controller.onMessage(show); await h.controller.idle(); assert.equal(h.views.at(-1).state, 'failed');
  h.controller.onMessage(show); await new Promise(resolve => setImmediate(resolve));
  h.controller.onMessage({ type: 'offwork-friends', action: 'hide' });
  const count = h.views.length; pending[1].success({ data: [user('late', 900)] }); await h.controller.idle();
  assert.equal(h.views.length, count);
  h.controller.onMessage(show); await new Promise(resolve => setImmediate(resolve));
  pending[2].success({ data: [] }); await h.controller.idle(); assert.equal(h.views.at(-1).state, 'ready');
});

test('repeated refresh ignores old queries and only the latest list wins', async () => {
  const pending = [];
  const h = harness({ getFriendCloudStorage: options => pending.push(options) });
  h.controller.onMessage(show); h.controller.onMessage(show);
  pending[1].success({ data: [user('new', 800)] }); await h.controller.idle();
  pending[0].success({ data: [user('old', 900)] }); await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.views.at(-1).top[0].id, 'new');
});

test('packaging preserves orientation/subpackages and verifies the open data context entry', () => {
  const testRoot = join(process.cwd(), 'temp'); mkdirSync(testRoot, { recursive: true });
  const output = mkdtempSync(join(testRoot, 'offwork-friends-'));
  try {
    const manifest = { deviceOrientation: 'portrait', subpackages: [{ name: 'art', root: 'subpackages/art/' }] };
    writeFileSync(join(output, 'game.json'), JSON.stringify(manifest));
    packageFriends(process.cwd(), output);
    const applied = JSON.parse(readFileSync(join(output, 'game.json'), 'utf8'));
    assert.deepEqual(applied, { ...manifest, openDataContext: 'openDataContext' });
    assert.ok(existsSync(join(output, 'openDataContext/index.js')));
  } finally { rmSync(output, { recursive: true, force: true }); }
});

test('open-data loading and empty states render on WeChat Canvas without an ellipse API', async () => {
  const texts = []; let receive;
  const context = { setTransform() {}, clearRect() { texts.length = 0; }, save() {}, restore() {}, scale() {}, translate() {},
    beginPath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {}, closePath() {}, fill() {}, stroke() {}, arc() {},
    clip() {}, fillRect() {}, drawImage() {}, fillText(value) { texts.push(String(value)); }, measureText(value) { return { width: value.length * 12 }; } };
  const api = { getSharedCanvas: () => ({ width: 640, height: 960, getContext: () => context }), onMessage: callback => { receive = callback; },
    getUserCloudStorage: options => queueMicrotask(() => options.success({ KVDataList: [] })),
    getFriendCloudStorage: options => queueMicrotask(() => options.success({ data: [] })) };
  const scope = vm.createContext({ wx: api, require: name => require('../build-templates/wechatgame/openDataContext/' + name.replace('./', '') + '.js') });
  vm.runInContext(readFileSync('build-templates/wechatgame/openDataContext/index.js', 'utf8'), scope);
  receive(show); assert.ok(texts.some(text => text.includes('加载中')));
  await vm.runInContext('controller.idle()', scope);
  assert.ok(texts.includes('暂无好友积分排名'));
  assert.ok(texts.includes('暂无纪录'));
  receive({ type: 'offwork-friends', action: 'hide' }); assert.equal(texts.length, 0);
});
