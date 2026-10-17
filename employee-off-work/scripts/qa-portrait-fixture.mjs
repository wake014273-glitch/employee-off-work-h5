export const PORTRAIT_FIXTURE = `(() => {
  const g=window.__gm,m=g.model,h=g.artHud;
  g.onGameShow();g.restart();g.guide.start(false);g.shieldCoach.reset(true);m.practiceProtected=false;
  m.workload=m.energy=0;
  m.bullets.length=m.walls.length=m.skillOrbs.length=m.aiPickups.length=m.leaveSlips.length=0;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  const face=h.portraitMotion;
  const sample=()=>({workload:face.workload,pressure:face.pressure,clock:face.clock,
    x:h.portrait.node.position.x,y:h.portrait.node.position.y,
    angle:h.portrait.node.angle,scale:h.portrait.node.scale.y,frame:face.clipFrame,
    ringX:h.portraitRing.node.position.x,ringY:h.portraitRing.node.position.y,ringAngle:h.portraitRing.node.angle});
  const states=[];
  for(const load of [0,1,2]) {
    m.workload=load;g.update(0.3);states.push(sample());
  }
  const sequenceFrames=h.expressionFrames.map(frames=>frames.length);
  const correctTexture=h.portrait.spriteFrame.texture===g.art.get('portrait2').texture;
  const moving=[];
  for(const load of [0,1,2]) {
    m.workload=load;g.update(0.5);const start=sample();g.update(0.17);
    moving.push({start,end:sample(),frameChanged:h.portrait.spriteFrame!==h.expressionFrames[load][start.frame]});
  }
  const before=sample();m.paused=true;g.update(0.5);const after=sample();
  m.paused=false;m.workload=0;g.update(0.25);const recoveryMid=sample();
  g.update(0.25);const recoveryEnd=sample();
  m.energy=100;const point=h.avatarPoint(m.height);
  g.press(point,100);g.release(point,100.1);g.press(point,100.2);g.release(point,100.3);
  const avatarTap={energy:m.energy,shield:m.shieldTime,dragging:g.dragging};
  g.press({x:200,y:400},101);g.release({x:200,y:400},101.05);
  g.press({x:200,y:400},101.2);g.release({x:200,y:400},101.25);g.draw();
  const immunity={activated:m.shieldTime>0,shield:m.shieldTime,bar:h.barFraction};
  g.restart();g.guide.start(false);g.shieldCoach.reset(true);m.practiceProtected=false;
  // This fixture exercises a clean formal replay, without tutorial workload or volley.
  m.workload=m.energy=0;
  m.bullets.length=m.walls.length=m.skillOrbs.length=m.aiPickups.length=m.leaveSlips.length=0;g.update(0);
  const reset=sample();
  return {states,before,after,recoveryMid,recoveryEnd,immunity,reset,avatarTap,
    circleRetained:!!h.root.getChildByName('PortraitAvatarMask')&&h.panels.workload.sprite.node.parent===h.root,
    ringOutsideMask:h.portraitRing.node.parent===h.root&&h.portraitRing.node.getSiblingIndex()>h.portraitMask.getSiblingIndex(),
    ringCentered:h.portraitRing.node.position.equals(h.portraitMask.position),
    originalSettingsRing:h.portraitRing.spriteFrame.texture===g.art.get('timeUI').texture,
    ringRecolorEffect:h.portraitRing.customMaterial?.effectAsset?.name,
    ringWidth:h.portraitRing.node.getComponent('cc.UITransform').width,
    settingsRingWidth:410*h.panels.time.sprite.node.getComponent('cc.UITransform').width/h.panels.time.crop.width,
    noReplacementPanel:!h.root.getChildByName('WorkloadArtworkWithoutRing')&&!h.root.getChildByName('WorkloadFolderExtension'),
    approvedTexture:h.portrait.spriteFrame.texture===g.art.get('portrait0').texture,
    sequenceFrames,correctTexture,moving,
    detailsInsideCircle:h.portraitDetails.node.parent===h.portrait.node&&h.portrait.node.parent===h.portraitMask,
    size:h.portrait.node.getComponent('cc.UITransform').width,
    maskDiameter:h.portraitMask.getComponent('cc.UITransform').width,
    backdropDiameter:h.portraitMask.getChildByName('OriginalPortraitBackdrop').getComponent('cc.UITransform').width,
    hitbox:h.containsAvatar(point,m.height)&&!h.containsAvatar({x:point.x+47,y:point.y},m.height)};
})()`;

export const portraitChecks=s=>({
  three_loads_select_three_portrait_expressions:s.states.every((v,i)=>v.workload===i&&Math.abs(v.pressure-i)<1e-9),
  portrait_animation_freezes_during_pause:JSON.stringify(s.before)===JSON.stringify(s.after),
  lowering_workload_relaxes_over_half_second:Math.abs(s.recoveryMid.pressure-1)<1e-9&&s.recoveryEnd.pressure===0,
  original_circle_and_panel_retained:s.circleRetained&&s.noReplacementPanel,
  illustrated_ring_stays_centered_and_fixed_outside_expression_mask:s.ringOutsideMask&&s.ringCentered&&s.states.every(v=>v.ringX===s.reset.ringX&&v.ringY===s.reset.ringY&&v.ringAngle===0),
  portrait_reuses_settings_source_art_at_same_scale_with_recolor:s.originalSettingsRing&&s.ringRecolorEffect?.endsWith('settings-ring-recolor')&&Math.abs(s.ringWidth-s.settingsRingWidth)<0.001,
  portrait_uses_generated_reference_cat_sequences:s.approvedTexture&&s.correctTexture&&s.detailsInsideCircle&&s.sequenceFrames.every(n=>n===61),
  portrait_fills_original_settings_ring_opening:s.size===56&&s.maskDiameter===56&&s.backdropDiameter===56,
  workload_zero_plays_relaxed_animation:s.moving[0].start.workload===0&&s.moving[0].end.workload===0&&s.moving[0].frameChanged&&s.moving[0].start.angle!==s.moving[0].end.angle,
  worried_and_anxious_portraits_sway_inside_fixed_circle:s.moving.slice(1).every(v=>v.start.angle!==v.end.angle&&v.start.y!==v.end.y&&v.frameChanged&&Math.abs(v.end.x)<1.4&&Math.abs(v.end.angle)<7.6),
  avatar_single_and_double_taps_do_not_activate_immunity:s.avatarTap.energy===100&&s.avatarTap.shield===0&&!s.avatarTap.dragging,
  gameplay_double_tap_still_activates_immunity:s.immunity.activated&&s.immunity.shield===3&&s.immunity.bar===1,
  replay_resets_portrait_stress_and_animation:s.reset.workload===0&&s.reset.pressure===0&&s.reset.clock===0,
});
