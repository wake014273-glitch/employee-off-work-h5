const { SCORE_KEY, validScore, readRecord, improvedRecord, rankFriends } = require('./ranking');

/** Storage updates are serialized and always read the remote best before writing. */
function createController(api, render, options = {}) {
  const timeoutMs = options.timeoutMs || 8000;
  const now = options.now || Date.now;
  const createTag = options.createTag || (() => `p_${now().toString(36)}_${Math.random().toString(36).slice(2, 14)}_${Math.random().toString(36).slice(2, 14)}`);
  let visible = false, generation = 0, localBest = 0, own = null, friends = [];
  let state = 'loading', syncState = 'idle', syncTask = null, friendTask = null;
  const repaint = () => { if (visible) render({ state, syncState, localBest, own, ...rankFriends(friends, own) }); };
  function invoke(name, args) {
    return new Promise((resolve, reject) => {
      let finished = false;
      const complete = (fn, value) => { if (finished) return; finished = true; clearTimeout(timer); fn(value); };
      const timer = setTimeout(() => complete(reject, new Error('timeout')), timeoutMs);
      try {
        if (typeof api[name] !== 'function') throw new Error('unsupported');
        api[name]({ ...args, success: value => complete(resolve, value), fail: error => complete(reject, error) });
      } catch (error) { complete(reject, error); }
    });
  }
  function synchronize() {
    if (syncTask) return syncTask;
    syncState = 'syncing'; repaint();
    syncTask = (async () => {
      try {
        // Refuse to overwrite a record if this read fails (including on a second device).
        const response = await invoke('getUserCloudStorage', { keyList: [SCORE_KEY] });
        own = readRecord(response.KVDataList);
        while (true) {
          const next = improvedRecord(own, localBest, now(), createTag);
          if (next === own) break;
          await invoke('setUserCloudStorage', { KVDataList: [{ key: SCORE_KEY, value: JSON.stringify(next) }] });
          own = next;
        }
        syncState = 'idle';
      } catch { syncState = 'failed'; }
      finally { syncTask = null; repaint(); }
    })();
    return syncTask;
  }
  async function loadFriends() {
    const current = ++generation;
    state = 'loading'; repaint();
    const task = (async () => {
      try {
        const response = await invoke('getFriendCloudStorage', { keyList: [SCORE_KEY] });
        if (current !== generation || !visible) return;
        friends = Array.isArray(response.data) ? response.data : [];
        state = 'ready';
      } catch { if (current === generation && visible) state = 'failed'; }
      repaint();
    })();
    friendTask = task;
    await Promise.all([task, synchronize()]);
  }
  function onMessage(message) {
    if (!message || message.type !== 'offwork-friends') return;
    if (validScore(message.bestScore)) localBest = Math.max(localBest, message.bestScore);
    if (message.action === 'hide') { visible = false; generation++; return; }
    if (message.action === 'sync') { synchronize(); return; }
    if (message.action === 'show') { visible = true; loadFriends(); }
  }
  // The idle hook is used by unit tests; no data or diagnostic messages are sent to the main context.
  return { onMessage, redraw: repaint, idle: async () => { await Promise.all([syncTask, friendTask]); } };
}
module.exports = { createController };
