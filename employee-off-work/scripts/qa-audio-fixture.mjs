// Same playback lifecycle is exercised in Chrome and WeChat DevTools.
export const AUDIO_STEPS = [
  {name:'playing',wait:450,body:`(()=>{const g=window.__gm,m=g.model;g.onGameShow();g.resume.cancel();g.restart();g.guide.start(false);m.bullets.length=m.skillOrbs.length=m.leaveSlips.length=m.aiPickups.length=0;m.invulnerableTime=999;m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;g.audio.enabled=true;g.audio.unlock();g.syncMusic();return true})()`},
  {name:'muted',wait:150,body:'window.__gm.audio.enabled=false;true'},
  {name:'unmuted',wait:200,body:'window.__gm.audio.enabled=true;true'},
  {name:'paused',wait:150,body:'window.__gm.model.paused=true;window.__gm.syncMusic();true'},
  {name:'held',wait:200,body:'true'},
  {name:'resumed',wait:200,body:'window.__gm.model.paused=false;window.__gm.syncMusic();true'},
  {name:'looped',wait:500,body:'window.__gm.audio.musicSource.currentTime=window.__gm.audio.musicSource.duration-0.18;true'},
  {name:'hidden',wait:150,body:'window.__gm.onGameHide();true'},
  {name:'shown',wait:200,body:'window.__gm.onGameShow();window.__gm.syncMusic();true'},
  {name:'manualResume',wait:200,body:'window.__gm.model.paused=false;window.__gm.syncMusic();true'},
  {name:'home',wait:150,body:'window.__gm.goHome();true'},
];
export const AUDIO_SNAPSHOT = `(()=>{const g=window.__gm,a=g.audio,s=a.musicSource;return {
  loaded:!!s.clip,duration:s.duration,loop:s.loop,playing:s.playing,time:s.currentTime,volume:s.volume,
  paused:g.model.paused,visible:g.appVisible,enabled:a.enabled,started:g.model.started,gameOver:g.model.gameOver,
  clips:[...a.clips].map(([name,clip])=>({name,duration:clip.getDuration()}))}})()`;
export function audioChecks(s) {
  return {
    v1_and_supplement_sounds_and_bgm_loaded:s.playing.clips.length===15&&s.playing.clips.every(c=>c.duration>.025)&&Math.abs(s.playing.duration-240/112*16)<.08,
    bgm_plays_and_loops:s.playing.playing&&s.playing.loop&&s.looped.playing&&s.looped.time<1,
    shared_sound_switch_controls_bgm:!s.muted.playing&&!s.muted.enabled&&s.unmuted.playing&&s.unmuted.enabled,
    pause_holds_music_position:!s.paused.playing&&!s.held.playing&&Math.abs(s.paused.time-s.held.time)<.035&&s.resumed.playing,
    background_return_waits_for_resume:!s.hidden.playing&&!s.hidden.visible&&!s.shown.playing&&s.shown.paused&&s.shown.visible&&s.manualResume.playing,
    home_stops_gameplay_bgm:!s.home.playing&&!s.home.started,
  };
}
