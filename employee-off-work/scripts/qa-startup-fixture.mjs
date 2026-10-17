// Installed before navigation: observe the real bootstrap and scene, rather than injecting percentages.
export const STARTUP_OBSERVER = `(() => {
  window.__qaStartupFrames=[];
  function sample(){
    try{
      const cc=typeof System==='undefined'?null:System.get(System.resolve('cc'));
      const canvas=cc?.director?.getScene()?.getChildByName('Canvas');
      const g=canvas?.components.find(c=>cc.js.getClassName(c)==='GameMain');
      const cover=!!document.getElementById('startup-cover');
      const bootstrap=window.__offworkStartup;
      const progress=cover?bootstrap?.getProgress():g?.loadingProgress.value;
      if(Number.isFinite(progress))window.__qaStartupFrames.push({progress,cover,ready:!!g?.artReady,
        loading:!!g?.interface.loadingRoot.active,menu:!!g?.interface.modal.active,time:performance.now()});
      if(g?.artReady)return;
    }catch{}
    if(window.__qaStartupFrames.length<2400)requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
})();`;

export const startupChecks = frames => ({
  real_loading_progress_advances_before_home: frames.length>2&&frames.some(s=>s.progress>0&&s.progress<0.95)&&frames.at(-1)?.ready,
  loading_progress_never_retreats_at_platform_handoff: frames.every((s,i)=>!i||s.progress+1e-6>=frames[i-1].progress),
  loading_reaches_a_drawn_full_bar_before_home: frames.some(s=>s.loading&&s.progress===1)&&frames.at(-1)?.progress===1,
});

export const LIFECYCLE_FIXTURE = `(() => {
  g.goHome();g.draw();
  const primary={x:360+g.interface.buttons.primary.x,y:m.height/2+g.interface.modal.position.y+g.interface.buttons.primary.y};
  g.press(primary,1);g.activeTouchId=7;
  const pressed=!!g.pendingAction;
  g.onGameHide();g.onGameShow();g.release(primary,1.1);
  const cancelled=pressed&&g.activeTouchId===null&&g.pendingAction===null&&!m.started;
  const clock=g.animationClock;g.update(NaN);g.update(Infinity);
  const finite=Number.isFinite(g.animationClock)&&g.animationClock===clock;
  m.reset();m.workload=2;m.bullets.length=1;
  Object.assign(m.bullets[0],{x:m.player.x,y:m.player.y,vx:0,vy:0,turnTimer:999});
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  m.skillOrbs.push({kind:'skill',x:m.player.x,y:m.player.y,radius:17,alive:true,pulse:0});
  m.aiPickups.push({kind:'agent',x:m.player.x,y:m.player.y,radius:27,vx:0,vy:0,alive:true,life:10,phase:0});
  m.takeEvents();m.update(0.01);
  const lethal=m.gameOver&&m.workload===3&&m.energy===0&&m.takeEvents().every(e=>e.type==='hit');
  g.goHome();g.draw();g.syncArt();
  return {cancelled,finite,lethal};
})()`;

export const lifecycleChecks = state => ({
  menu_touch_is_cancelled_on_background_switch:state.cancelled,
  invalid_frame_times_do_not_corrupt_presentation:state.finite,
  lethal_frame_cannot_collect_or_heal_after_game_over:state.lethal,
});
