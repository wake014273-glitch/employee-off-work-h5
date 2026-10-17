import { PLAYER_BODY, PLAYER_ENERGY_BAR, PLAYER_VISUAL_TOP, HUD_BOTTOM, PLAYER_HUD_GAP, playerMirrorSign } from '../assets/scripts/model/GameLayout.ts';

/** Exercise real pickups, continuous shield countdown, gold outline and immunity status. */
export const ENERGY_FIXTURE = `(() => {
  const g = window.__gm, m = g.model, h = g.artHud;
  g.restart();g.guide.start(false);g.shieldCoach.reset(true);m.practiceProtected=false;
  m.bullets.length=m.walls.length=m.skillOrbs.length=m.aiPickups.length=m.leaveSlips.length=0;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  m.energy=0;m.shieldTime=0;m.invulnerableTime=0;m.movePlayer(360,300);
  const steps=[];g.draw();steps.push(h.chargeSegments);
  for(let i=0;i<5;i++) {
    m.skillOrbs.push({kind:'skill',x:m.player.x,y:m.player.y,radius:16,alive:true,pulse:0});
    m.update(0.01);g.draw();steps.push(h.chargeSegments);
  }
  const follow=[];
  for(const p of [{x:130,y:180},{x:590,y:540},{x:360,y:99999}]) {
    m.movePlayer(p.x,p.y);g.draw();g.syncArt();
    const bar=h.energyRoot.worldPosition,cat=g.playerSprite.node.worldPosition;
    follow.push({dx:bar.x-cat.x,dy:bar.y-cat.y,facing:m.playerFacing,
      topGap:m.height-h.chargePoint(0,m.height).y-${PLAYER_ENERGY_BAR.height / 2}-${HUD_BOTTOM}});
  }
  const targets=Array.from({length:5},(_,i)=>h.chargePoint(i,m.height));
  const glow=[];
  for(let i=0;i<5;i++) {
    h.update(m,true,0.275);const c=h.readyEffects.fillColor;
    glow.push({active:h.readyEffects.node.active,r:c.r,g:c.g,b:c.b,a:c.a});
  }
  m.paused=true;g.visualDt=0;g.draw();const frozen=h.clock;g.update(0.3);
  const pauseFrozen=h.clock===frozen;
  m.paused=false;const activated=m.activateShield();g.draw();g.syncArt();
  const immunity={activated,energy:m.energy,time:m.shieldTime,segments:h.chargeSegments,
    gold:h.readyEffects.node.active,copies:g.immunityCopies.filter(s=>s.node.active).length,
    badgeVisible:g.immunityLabel.node.active,status:g.immunityLabel.string,
    belowPlayer:g.immunityLabel.node.position.y<g.playerSprite.node.position.y-60,
    bar:h.barFraction,avatarCountdown:h.shieldFraction,
    material:!!g.immunityMaterial&&g.immunityCopies.every(c=>c.customMaterial===g.immunityMaterial),
    outline:g.immunityCopies.map(c=>({r:c.color.r,g:c.color.g,b:c.color.b,a:c.color.a}))};
  const countdown=[];
  const sample=()=>{
    const xs=[],bar=h.energyBar,move=bar.moveTo,line=bar.lineTo,fill=bar.fill;let path=[];
    bar.moveTo=function(x,y){path=[x];return move.call(this,x,y);};
    bar.lineTo=function(x,y){path.push(x);return line.call(this,x,y);};
    bar.fill=function(){const c=this.fillColor;if(c.r===73&&c.g===209&&c.b===211)xs.push(...path);return fill.call(this);};
    g.draw();g.syncArt();bar.moveTo=move;bar.lineTo=line;bar.fill=fill;
    return {time:m.shieldTime,bar:h.barFraction,endpoint:xs.length?Math.max(...xs):null,
      copies:g.immunityCopies.filter(c=>c.node.active).length,banner:g.immunityLabel.node.active};};
  countdown.push(sample());
  m.update(0.05);countdown.push(sample());
  for(let i=0;i<29;i++)m.update(0.05);countdown.push(sample());
  m.paused=true;const beforePause=sample();g.update(0.5);const afterPause=sample();m.paused=false;
  const alpha=[];
  for(const t of [0,0.375,0.75,1.125,1.5]){g.animationClock=t;g.syncArt();alpha.push(g.immunityCopies[16].color.a);}
  for(let i=0;i<30;i++)m.update(0.05);countdown.push(sample());
  const expiredDamage=m.hitPlayer();
  g.restart();g.guide.start(false);m.practiceProtected=false;g.draw();
  const reset={energy:m.energy,segments:h.chargeSegments,gold:h.readyEffects.node.active};
  g.goHome();g.draw();const hidden=!h.energyRoot.active;
  // Leave a reproducible full-charge frame for the platform screenshot.
  g.restart();g.guide.start(false);g.shieldCoach.reset(true);m.practiceProtected=false;
  m.bullets.length=m.skillOrbs.length=0;m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  m.movePlayer(360,300);m.energy=100;m.shieldTime=0;m.invulnerableTime=0;m.paused=true;
  g.visualDt=0;h.clock=0.55;g.draw();g.syncArt();g.interface.root.active=false;g.overlay.node.active=false;
  return {steps,follow,targets,glow,pauseFrozen,immunity,countdown,beforePause,afterPause,alpha,expiredDamage,reset,hidden};
})()`;

export const energyChecks = s => ({
  five_real_fish_light_five_overhead_cells: JSON.stringify(s.steps)==='[0,1,2,3,4,5]',
  capsule_follows_body_without_lag: s.follow.every(p=>Math.abs(p.dx-PLAYER_BODY.offsetX*playerMirrorSign(p.facing))<0.01&&
    Math.abs(p.dy-PLAYER_VISUAL_TOP-PLAYER_ENERGY_BAR.headGap-PLAYER_ENERGY_BAR.height/2)<0.01),
  overhead_capsule_keeps_top_hud_gap: Math.abs(s.follow.at(-1).topGap-PLAYER_HUD_GAP)<0.01,
  pickup_destinations_are_five_equal_left_to_right_cells: s.targets.every((p,i)=>i===0||
    p.y===s.targets[0].y&&Math.abs(p.x-s.targets[i-1].x-(PLAYER_ENERGY_BAR.width-PLAYER_ENERGY_BAR.inset*2)/5)<0.01),
  full_capsule_repeats_visible_gold_glow: s.glow.every(p=>p.active&&p.r===255&&p.g>200&&p.b<200)&&
    Math.max(...s.glow.map(p=>p.a))-Math.min(...s.glow.map(p=>p.a))>100,
  pause_freezes_energy_animation: s.pauseFrozen,
  shield_uses_gold_outline_timer_and_status_below_player: s.immunity.activated&&s.immunity.energy===0&&
    s.immunity.time===3&&s.immunity.segments===0&&!s.immunity.gold&&s.immunity.copies>=4&&
    s.immunity.badgeVisible&&s.immunity.status==='免疫已开启'&&s.immunity.belowPlayer&&
    s.immunity.bar===1&&s.immunity.avatarCountdown===1&&s.immunity.material&&
    s.immunity.copies===24&&s.immunity.outline.every(c=>c.r===255&&c.g>=214&&c.b>=116)&&
    s.immunity.outline.slice(16).every(c=>c.a>=140),
  shield_bar_drains_continuously_and_empty_means_expired:s.countdown.every(v=>Math.abs(v.bar-v.time/3)<1e-9)&&
    s.countdown[1].bar<1&&s.countdown[1].bar>0.98&&Math.abs(s.countdown[2].bar-0.5)<1e-9&&
    s.countdown.at(-1).bar===0&&s.countdown.at(-1).time===0&&s.countdown.at(-1).copies===0&&s.expiredDamage&&
    s.countdown.every(v=>v.banner===(v.time>0)),
  shield_countdown_freezes_during_pause:JSON.stringify(s.beforePause)===JSON.stringify(s.afterPause),
  rendered_original_cyan_fill_matches_remaining_time:s.countdown.every(v=>v.time===0?v.endpoint===null:
    Math.abs(v.endpoint-(-PLAYER_ENERGY_BAR.width/2+PLAYER_ENERGY_BAR.inset+
      (PLAYER_ENERGY_BAR.width-PLAYER_ENERGY_BAR.inset*2)*v.time/3))<0.01),
  gold_outline_breathes_gently:s.alpha[0]===s.alpha[4]&&s.alpha[2]>s.alpha[0]+20,
  restart_and_home_clear_energy_readiness: s.reset.energy===0&&s.reset.segments===0&&!s.reset.gold&&s.hidden,
});
