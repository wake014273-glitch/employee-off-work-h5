/* CommonJS is required by WeChat's isolated open data context. No friend data leaves this module. */
const SCORE_KEY = 'offwork_best_v1';
const validScore = value => Number.isSafeInteger(value) && value >= 0;
function readRecord(items) {
  try {
    const item = (items || []).find(entry => entry.key === SCORE_KEY);
    const value = JSON.parse(item.value);
    if (value.version !== 1 || !validScore(value.score) || !Number.isSafeInteger(value.achievedAt) || value.achievedAt < 0 ||
      typeof value.playerTag !== 'string' || !/^[a-zA-Z0-9_-]{8,96}$/.test(value.playerTag)) return null;
    return { version: 1, score: value.score, achievedAt: value.achievedAt, playerTag: value.playerTag };
  } catch { return null; }
}
function improvedRecord(previous, score, now, createTag) {
  if (!validScore(score) || score <= 0 || (previous && previous.score >= score)) return previous;
  return { version: 1, score, achievedAt: Math.floor(now), playerTag: previous ? previous.playerTag : createTag() };
}
function rankFriends(data, own) {
  const byId = new Map();
  for (const user of data || []) {
    const record = readRecord(user.KVDataList);
    if (!record || record.score <= 0 || typeof user.openid !== 'string' || !user.openid) continue;
    const isSelf = !!own && record.playerTag === own.playerTag;
    const row = { ...record, id: user.openid, nickname: typeof user.nickname === 'string' ? user.nickname : '摸鱼好友',
      avatarUrl: typeof user.avatarUrl === 'string' ? user.avatarUrl : '', isSelf };
    const older = byId.get(row.id);
    if (!older || row.score > older.score) byId.set(row.id, row);
  }
  let rows = [...byId.values()];
  if (own && own.score > 0) {
    const self = rows.find(row => row.isSelf);
    if (self) Object.assign(self, own);
    else rows.push({ ...own, id: '_self', nickname: '我', avatarUrl: '', isSelf: true });
  }
  rows.sort((a, b) => b.score - a.score || a.achievedAt - b.achievedAt || a.id.localeCompare(b.id));
  rows = rows.map((row, index) => ({ ...row, rank: index && row.score === rows[index - 1].score ? 0 : index + 1 }));
  for (let index = 1; index < rows.length; index++) if (rows[index].rank === 0) rows[index].rank = rows[index - 1].rank;
  return { top: rows.slice(0, 10), self: rows.find(row => row.isSelf) || null, total: rows.length,
    friendCount: rows.filter(row => !row.isSelf).length };
}
module.exports = { SCORE_KEY, validScore, readRecord, improvedRecord, rankFriends };
