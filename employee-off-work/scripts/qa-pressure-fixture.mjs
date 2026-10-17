// Run against the built GameMain in Chrome and the WeChat simulator.
export const PRESSURE_FIXTURE = `(() => {
  const g = window.__gm, m = g.model;
  const reset=()=>{g.restart();g.guide.start(false);g.shieldCoach.reset(true);m.practiceProtected=false;m.paused=false;};
  reset(); m.wave = 2; m.waveTimer = 0; m.invulnerableTime = 999;
  m.messageTimer = m.requirementTimer = m.wallTimer = 0; m.skillTimer = 999;
  let redInSecond = false, yellowInSecond = false;
  for (let frame = 0; frame < 319; frame++) {
    m.update(0.05);
    redInSecond ||= m.bullets.some(b => b.kind === 'message');
    yellowInSecond ||= m.folderWalls.length > 0;
  }
  const second = {red:redInSecond,yellow:yellowInSecond,wave:m.wave,duration:m.config.duration};
  m.waveTimer = 15.99; m.update(0.02); g.consumeEvents();
  const entry = {wave:m.wave,interval:m.config.messageInterval,homing:m.config.maxHoming,
    messageDelay:m.messageTimer,wallDelay:m.wallTimer};
  const locks = [];
  for (const [wave,time] of [[3,12],[5,59],[6,12],[12,0],[12,12]]) {
    reset(); m.wave=wave; m.waveTimer=time; m.invulnerableTime=999;
    m.bullets.length=0; m.skillOrbs.length=0;
    m.requirementTimer=m.wallTimer=m.skillTimer=999;
    for (let i=0;i<6;i++) {m.messageTimer=0;m.spawn(0,m.config);}
    m.messageTimer=999;
    m.bullets.forEach((b,i)=>{b.x=m.player.x+100+i*10;b.y=m.player.y;b.vx=0;b.vy=-10;});
    m.update(0.01);
    locks.push(m.bullets.filter(b=>b.state==='homing').length);
  }
  reset(); m.wave=3; m.waveTimer=44.99; m.invulnerableTime=999;
  m.bullets.length=0; m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  // Simulated pressure jumps must also clear the real-clock audio debounce.
  g.audio.lastPlayed.delete('wave');
  const soundCalls = [], originalSound = g.audio.source.playOneShot;
  g.audio.source.playOneShot = function(clip,volume) {soundCalls.push(clip.name);return originalSound.call(this,clip,volume);};
  m.update(0.02); g.consumeEvents(); g.draw();
  const notice = {removed:!g.node.getChildByName('WaveNotice')&&!g.node.getChildByName('WaveFolderNote'),tier:m.difficultyTier,
    bonus:m.bonusScore,start:m.config.messageInterval};
  for(let frame=0;frame<240;frame++)m.update(0.05);
  g.consumeEvents();g.draw();
  notice.peak=m.config.messageInterval;
  notice.waveSound=soundCalls.includes('wave');
  g.audio.source.playOneShot=originalSound;
  m.paused=true;m.waveTimer=41;m.wallTimer=0;m.messageTimer=m.requirementTimer=0.3;m.skillTimer=1;
  m.paused=false;m.update(0.05);m.paused=true;
  const breathing={paused:false,timer:m.messageTimer,wall:m.folderWalls.length,fishTimer:m.skillTimer};
  reset();m.invulnerableTime=999;
  let redBeforeUnlock=false,peakThreats=0,peakLocks=0;
  for(let frame=0;frame<4200&&m.elapsed<204;frame++){m.update(0.05);m.takeEvents();
    if(m.wave<3)redBeforeUnlock ||= m.bullets.some(b=>b.kind==='message');
    else {peakThreats=Math.max(peakThreats,m.bullets.filter(b=>b.kind!=='folder').length);
      peakLocks=Math.max(peakLocks,m.bullets.filter(b=>b.kind==='message'&&b.state==='homing').length);}}
  const longRun={redBeforeUnlock,peakThreats,peakLocks,elapsed:m.elapsed,over:m.gameOver};
  const late=[];
  for(const seconds of [282,312,342,372,432]){
    reset();m.wave=3+Math.floor(seconds/60);m.waveTimer=seconds%60;
    late.push({tier:m.difficultyTier,cap:m.config.maxThreats});
  }
  const middle=[];
  for(const seconds of [147,192,237,270,276,282]){
    reset();m.wave=3+Math.floor(seconds/60);m.waveTimer=seconds%60;
    middle.push({message:m.config.messageInterval,requirement:m.config.requirementInterval,speed:m.config.speedScale});
  }
  reset();m.wave=60;m.waveTimer=12;m.invulnerableTime=999;
  const final={config:{...m.config},peakThreats:0,peakLocks:0,peakWalls:0,finite:true};
  for(let frame=0;frame<2400;frame++){
    m.update(0.05);m.takeEvents();
    final.peakThreats=Math.max(final.peakThreats,m.bullets.filter(b=>b.kind!=='folder').length);
    final.peakLocks=Math.max(final.peakLocks,m.bullets.filter(b=>b.kind==='message'&&b.state==='homing').length);
    final.peakWalls=Math.max(final.peakWalls,m.folderWalls.length);
    final.finite &&= m.bullets.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y));
  }
  final.over=m.gameOver;g.draw();g.syncArt();
  return {second,entry,locks,notice,breathing,longRun,late,middle,final};
})()`;

export const pressureChecks = states => ({
  second_phase_has_yellow_tasks_and_no_red_messages: !states.second.red&&states.second.yellow&&states.second.wave===2&&states.second.duration===16,
  third_phase_enters_with_one_lock_and_staggered_arrivals: states.entry.wave===3&&states.entry.interval===3.4&&states.entry.homing===1&&states.entry.messageDelay>=3.39&&states.entry.wallDelay>=4.99,
  homing_caps_unlock_third_lock_only_after_late_ramp: JSON.stringify(states.locks)==='[1,1,2,2,3]',
  pressure_advances_without_banner_or_extra_reward: states.notice.removed&&states.notice.tier===2&&states.notice.bonus===0&&states.notice.waveSound,
  pressure_ramps_over_twelve_seconds_in_built_runtime: states.notice.start>3.39&&Math.abs(states.notice.peak-3.1)<0.001,
  breathing_reduces_new_spawns_without_freezing_fish: states.breathing.timer>0.27&&states.breathing.wall===0&&states.breathing.fishTimer===0.95,
  natural_first_three_hard_minutes_keep_threat_and_lock_budget:!states.longRun.redBeforeUnlock&&!states.longRun.over&&states.longRun.elapsed>=204&&states.longRun.peakThreats<=11&&states.longRun.peakLocks<=1,
  late_pressure_uses_thirty_second_tiers_and_revised_caps: JSON.stringify(states.late)==='[{"tier":7,"cap":13},{"tier":8,"cap":14},{"tier":9,"cap":14},{"tier":10,"cap":15},{"tier":12,"cap":16}]',
  tiers_four_five_six_use_slightly_stronger_targets: JSON.stringify(states.middle.slice(0,3))===
    '[{"message":2.4,"requirement":2,"speed":1.11},{"message":2.15,"requirement":1.95,"speed":1.13},{"message":1.9,"requirement":1.9,"speed":1.15}]',
  late_handoff_never_eases_the_strengthened_sixth_tier: states.middle.slice(3).every((sample,index)=>{
    const previous=states.middle[index+2];
    return sample.message<=previous.message&&sample.requirement<=previous.requirement&&sample.speed>=previous.speed;
  }),
  final_pressure_reaches_higher_bounded_targets: states.final.config.messageInterval===1&&states.final.config.requirementInterval===1.4&&
    states.final.config.wallInterval===6&&states.final.config.speedScale===1.36&&states.final.config.maxThreats===20&&
    states.final.config.gapWidth===128&&states.final.config.maxHoming===3,
  final_pressure_runtime_stays_finite_and_within_budgets: states.final.finite&&!states.final.over&&states.final.peakThreats>0&&
    states.final.peakThreats<=20&&states.final.peakLocks<=3&&states.final.peakWalls>0&&states.final.peakWalls<=2,
});
