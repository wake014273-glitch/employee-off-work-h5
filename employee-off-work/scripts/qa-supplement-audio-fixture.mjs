// Exercise actual GameMain event routing and GameAudio output with decoded engine clips.
export const SUPPLEMENT_AUDIO_FIXTURE = `(()=>{
  const g=window.__gm,a=g.audio,m=g.model;
  g.onGameShow();g.interface.friends.hide();g.friends.hide();g.restart();g.guide.start(false);
  m.paused=true;m.practiceProtected=true;g.syncMusic();a.enabled=true;
  const shots=[],requests=[],originalShot=a.source.playOneShot,originalPlay=a.play;
  a.source.playOneShot=function(clip,volume){shots.push({name:[...a.clips].find(([,c])=>c===clip)?.[0],volume});return originalShot.call(this,clip,volume)};
  const cases={};
  const event=(type,more={})=>({type,x:360,y:400,value:10,count:3,...more});
  const run=(name,events)=>{a.lastPlayed.clear();shots.length=0;m.events=events;g.consumeEvents();cases[name]=shots.map(s=>s.name)};
  try {
    run('clear',[event('leave')]);
    run('helper',[event('ai-pickup',{kind:'helper',removed:1,workload:2})]);
    run('agent',[event('ai-pickup',{kind:'agent',removed:2,workload:0})]);
    run('gap',[event('gap')]);run('break',[event('break')]);
    for(const grade of ['B','A','S'])run(grade,[event('grade',{grade,label:'操作评价'})]);
    run('priority',[event('gap'),event('grade',{grade:'S',label:'操作评价'}),event('break')]);
    run('flood',Array.from({length:20},()=>event('gap')));
    run('evilLaugh',[event('evil-laugh')]);cases.laughGain=shots[0]?.volume;
    cases.laughDuration=a.clips.get('laugh')?.getDuration();
    a.enabled=false;run('muted',[event('leave'),event('ai-pickup',{kind:'agent',removed:2}),event('grade',{grade:'S'})]);a.enabled=true;
    a.enabled=false;run('laughMuted',[event('evil-laugh')]);a.enabled=true;
    // Drive visible game frames deterministically to inspect 3/2/1/go requests,
    // including long frames and a background cancellation. Real output is checked below.
    a.play=function(name){requests.push(name)};
    m.paused=true;g.togglePause();
    for(let i=0;i<32;i++)g.update(.1);
    cases.countdown=requests.slice();cases.resumed=!m.paused;
    requests.length=0;m.paused=true;g.togglePause();g.update(500);
    cases.longFrame=requests.slice();cases.longRemaining=g.resume.remaining;
    g.onGameHide();requests.length=0;g.update(10);g.onGameShow();g.update(.1);
    cases.hidden=requests.slice();cases.hiddenPaused=m.paused&&!g.resume.active;
    a.play=originalPlay;shots.length=0;a.lastPlayed.clear();
    if(window.__qaAudioStarts)window.__qaSupplementAudioStart=window.__qaAudioStarts.length;
    for(const name of ['leave','reduce','countdown','resume','grade','skill','laugh']){a.lastPlayed.clear();a.play(name)}
    cases.decoded=shots.map(s=>s.name);
    cases.expectedDurations=shots.map(s=>a.clips.get(s.name).getDuration());
  } finally {a.play=originalPlay;a.source.playOneShot=originalShot;a.enabled=g.progress.profile.soundEnabled;g.goHome()}
  return cases;
})()`;
export function supplementAudioChecks(s) {
  const eq=(v,w)=>JSON.stringify(v)===JSON.stringify(w);
  return {
    independent_clear_and_both_ai_cues:eq(s.clear,['leave'])&&eq(s.helper,['reduce'])&&eq(s.agent,['reduce']),
    independent_skill_and_all_grades:eq(s.gap,['skill'])&&eq(s.break,['skill'])&&['B','A','S'].every(k=>eq(s[k],['grade'])),
    grade_priority_and_skill_burst_limit:eq(s.priority,['grade'])&&eq(s.flood,['skill']),
    supplemental_cues_obey_mute:eq(s.muted,[]),
    monster_laugh_v3_routed_with_expected_duration_and_gain:eq(s.evilLaugh,['laugh'])&&Math.abs(s.laughDuration-2.65)<.001&&s.laughGain===.5,
    evil_laugh_obeys_mute:eq(s.laughMuted,[]),
    countdown_ticks_once_per_digit_and_resumes:eq(s.countdown,['countdown','countdown','countdown','resume'])&&s.resumed,
    long_frame_and_background_do_not_spam:eq(s.longFrame,['countdown'])&&s.longRemaining>=2.89&&eq(s.hidden,[])&&s.hiddenPaused,
    supplemental_and_laugh_clips_reach_engine_output:eq(s.decoded,['leave','reduce','countdown','resume','grade','skill','laugh']),
    ...(s.buffers?{supplemental_and_laugh_non_silent_buffers_start_in_browser:s.expectedDurations.every(d=>s.buffers.some(b=>Math.abs(b.duration-d)<.001&&b.peak>0))}:{}),
  };
}
