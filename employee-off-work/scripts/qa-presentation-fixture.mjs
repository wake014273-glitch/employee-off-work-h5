import { PLAYER_BODY, PLAYER_ENERGY_BAR, SPRITE_SIZES, ART_SCALE } from '../assets/scripts/model/GameLayout.ts';

export const PRESENTATION_FIXTURE = `(() => {
  const g=window.__gm,m=g.model,h=g.artHud;
  g.interface.friends.hide();g.friends.hide();
  g.restart();g.guide.start(false);g.shieldCoach.reset(true);m.practiceProtected=false;
  m.bullets.length=m.walls.length=m.skillOrbs.length=m.aiPickups.length=m.leaveSlips.length=0;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  m.invulnerableTime=0;m.energy=40;m.movePlayer(300,650);g.bodySpring.reset(m.player);
  // Sync menu hitboxes after restart before beginning the native drag sequence.
  g.draw();g.syncArt();
  // Programmatic restart changes the mode before the next real frame; refresh menu hitboxes.
  g.draw();g.syncArt();
  const sample=()=>{g.draw();g.syncArt();return {facing:m.playerFacing,scale:g.playerSprite.node.scale.x,
    bodyX:m.player.x+${PLAYER_BODY.offsetX}*(-m.playerFacing),
    barX:h.energyPoint.x-g.bodySpring.x,
    bendWorld:g.playerSprite.bendX*Math.sign(g.playerSprite.node.scale.x),springX:g.bodySpring.x,
    radius:m.player.radius,width:g.playerSprite.node.getComponent('cc.UITransform').width};};
  g.press({x:300,y:650},2000);
  for(let i=1;i<=12;i++){g.drag({x:300+i*4,y:650});g.update(1/60);}
  const right=sample();
  g.drag({x:348,y:710});g.update(1/60);const upAfterRight=sample();
  for(let i=1;i<=12;i++){g.drag({x:348-i*4,y:710});g.update(1/60);}
  const left=sample();
  g.drag({x:300,y:650});g.update(1/60);const downAfterLeft=sample();
  g.release({x:300,y:650},2001);for(let i=0;i<180;i++)g.update(1/60);
  // Count actual fish-glyph primitives while drawing every charge state.
  let glyphs=0;const ellipse=h.energyBar.ellipse,circle=h.energyBar.circle;
  h.energyBar.ellipse=function(...args){glyphs++;return ellipse.apply(this,args);};
  h.energyBar.circle=function(...args){glyphs++;return circle.apply(this,args);};
  const charge=[];
  for(let i=0;i<=5;i++){m.energy=i*20;g.draw();charge.push(h.chargeSegments);}
  h.energyBar.ellipse=ellipse;h.energyBar.circle=circle;
  const barWidth=h.energyBar.node.getComponent('cc.UITransform').width;
  const time=m.elapsed;
  g.press({x:67*${ART_SCALE},y:m.height-309*${ART_SCALE}},3000);g.update(0.5);
  const settings={paused:m.paused,frozen:m.elapsed===time,title:g.interface.title.string,
    sound:g.interface.sound.node.active,continue:g.interface.primary.string,
    gear:h.settingsIcon.node.name==='SettingsGear'&&h.settingsIcon.node.activeInHierarchy};
  const gearColors=[],gearFill=h.settingsIcon.fill;
  h.settingsIcon.fill=function(){gearColors.push([this.fillColor.r,this.fillColor.g,this.fillColor.b]);return gearFill.call(this);};
  h.settingsIcon.clear();h.drawSettingsButton(h.settingsIcon,0,0);h.settingsIcon.fill=gearFill;
  g.restart();g.guide.start(false);g.shieldCoach.reset(true);m.practiceProtected=false;
  m.bullets.length=m.walls.length=m.skillOrbs.length=0;m.invulnerableTime=0;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  m.movePlayer(300,650);g.bodySpring.reset(m.player);g.playerTrail.clear();g.update(0);
  const trails=()=>g.playerTrail.ribbon().map(p=>({x:p.x,y:p.y,alpha:p.alpha,radius:p.radius,nx:p.nx,ny:p.ny}));
  g.press({x:300,y:650},4000);
  for(let i=1;i<=16;i++){g.drag({x:300+i*6,y:650});g.update(1/60);}
  const forwardTrail=trails();
  for(let i=1;i<=16;i++){g.drag({x:396-i*6,y:650});g.update(1/60);}
  const reverseTrail=trails();
  m.paused=true;const beforeTrailPause=trails();g.update(0.5);const afterTrailPause=trails();m.paused=false;
  for(let i=1;i<=8;i++){g.drag({x:300,y:650+i*6});g.update(1/60);}
  const verticalTrail=trails();
  const ribbonColors=[],ribbonFill=g.trailArt.fill;
  g.trailArt.fill=function(){ribbonColors.push([this.fillColor.r,this.fillColor.g,this.fillColor.b,this.fillColor.a]);return ribbonFill.call(this);};
  g.drawPlayerTrail();g.trailArt.fill=ribbonFill;
  const ribbonRender={active:g.trailArt.node.active,colors:ribbonColors,
    floorOffset:g.trailArt.node.position.y-g.paintNode.position.y,
    behindCat:g.trailArt.node.getSiblingIndex()<g.playerSprite.node.getSiblingIndex(),
    echoSprites:g.node.children.filter(n=>n.name.startsWith('CatMovementTrail')).length};
  g.release({x:300,y:698},4001);for(let i=0;i<30;i++)g.update(1/60);
  const stoppedTrail=trails();
  m.energy=100;g.tryActivateShield();g.consumeEvents();g.draw();g.syncArt();
  const launch={time:g.shieldReleaseTime,flash:g.immunityArt.node.active,copies:g.immunityCopies.filter(c=>c.node.active).length};
  for(let i=0;i<10;i++)g.update(0.05);
  const steady={flash:g.immunityArt.node.active,time:g.shieldReleaseTime,
    radius:Math.hypot(g.immunityCopies[0].node.position.x-g.playerSprite.node.position.x,
      g.immunityCopies[0].node.position.y-g.playerSprite.node.position.y),alpha:g.immunityCopies[16].color.a};
  g.restart();g.guide.start(false);g.shieldCoach.reset(true);m.practiceProtected=false;
  m.bullets.length=m.walls.length=m.skillOrbs.length=0;
  m.messageTimer=m.requirementTimer=m.wallTimer=m.skillTimer=999;
  m.movePlayer(370,650);m.invulnerableTime=0;m.energy=60;m.paused=true;
  // Overlap every artwork type, then reorder and grow pools to exercise reused slots.
  m.wave=3;m.messageTimer=m.requirementTimer=0;m.spawn(0,m.config);
  m.messageTimer=m.requirementTimer=999;m.spawnWall(m.config);
  const y=m.height*0.55;
  for(const b of m.bullets){if(b.kind!=='folder')b.x=360;b.y=y;}
  m.skillOrbs.push({kind:'skill',x:340,y:y+28,radius:17,alive:true,pulse:0});
  m.leaveSlips.push({x:385,y:y-30,life:10,spin:0});
  m.aiPickups.push({kind:'helper',x:435,y:y,phase:0});
  const layerSample=()=>{g.draw();g.syncArt();return {
    foldersBelow:g.folderLayer.getSiblingIndex()<g.workLayer.getSiblingIndex()&&g.folderLayer.getSiblingIndex()<g.pickupLayer.getSiblingIndex(),
    bulletsCorrect:m.bullets.every((b,i)=>g.bulletSprites[i].node.parent===(b.kind==='folder'?g.folderLayer:g.workLayer)),
    resourcesCorrect:[...g.fishSprites,...g.leaveSprites].filter(s=>s.node.active).every(s=>s.node.parent===g.pickupLayer)&&g.aiSprites.filter(s=>s.node.active).every(s=>s.node.parent===g.pickupLayer),
    noGapBorders:!g.bulletLayer.getChildByName('FolderGapEdges'),
    types:[...new Set(m.bullets.map(b=>b.kind))],resources:[g.fishSprites.some(s=>s.node.active),g.leaveSprites.some(s=>s.node.active),g.aiSprites.some(s=>s.node.active)]};};
  const layerInitial=layerSample();
  m.bullets.reverse();m.bullets.push({...m.bullets.find(b=>b.kind==='folder'),x:425});
  m.skillOrbs.push({kind:'skill',x:435,y:y-28,radius:17,alive:true,pulse:0});
  const layerReused=layerSample();
  g.visualDt=0;g.draw();g.syncArt();g.interface.root.active=false;g.overlay.node.active=false;
  return {right,upAfterRight,left,downAfterLeft,glyphs,charge,barWidth,settings,gearColors,
    forwardTrail,reverseTrail,verticalTrail,beforeTrailPause,afterTrailPause,stoppedTrail,ribbonRender,launch,steady,layerInitial,layerReused};
})()`;

export const presentationChecks=s=>({
  folder_art_stays_below_other_work_and_all_pickups:[s.layerInitial,s.layerReused].every(v=>v.foldersBelow&&v.bulletsCorrect&&v.resourcesCorrect&&v.types.length===3&&v.resources.every(Boolean)),
  folder_layer_survives_pool_reuse_and_growth:s.layerReused.bulletsCorrect&&s.layerReused.resourcesCorrect,
  folder_gap_border_overlay_removed:s.layerInitial.noGapBorders&&s.layerReused.noGapBorders,
  tail_is_left_on_right_drag_and_right_on_left_drag:s.right.scale<0&&s.left.scale>0,
  vertical_drag_keeps_last_horizontal_tail_side:s.upAfterRight.scale<0&&s.downAfterLeft.scale>0,
  enlarged_cat_and_collision_match:[s.right,s.left].every(v=>v.width===SPRITE_SIZES.player.width&&v.radius===27),
  mirrored_bar_and_spring_match_body:[s.right,s.upAfterRight,s.left,s.downAfterLeft]
    .every(v=>Math.abs(v.bodyX-v.barX)<0.01&&Math.abs(v.bendWorld-v.springX)<0.01),
  longer_charge_bar_has_five_plain_cells:s.barWidth===PLAYER_ENERGY_BAR.width&&s.barWidth>54
    &&JSON.stringify(s.charge)==='[0,1,2,3,4,5]'&&s.glyphs===0,
  gear_opens_settings_and_freezes_play:s.settings.paused&&s.settings.frozen&&s.settings.gear
    &&s.settings.title==='摸鱼设置'&&s.settings.sound&&s.settings.continue==='继续摸鱼',
  gear_uses_lavender_from_original_ui:s.gearColors.some(c=>JSON.stringify(c)==='[186,147,198]')&&
    !s.gearColors.some(c=>JSON.stringify(c)==='[247,194,120]'),
  particle_ribbon_follows_horizontal_turns_and_vertical_route:s.forwardTrail.length>=4&&s.reverseTrail.length>=4&&
    s.forwardTrail.at(-1).x===396&&s.reverseTrail.at(-1).x===300&&
    [...s.forwardTrail,...s.reverseTrail,...s.verticalTrail].every(c=>[c.x,c.y,c.radius,c.nx,c.ny].every(Number.isFinite))&&
    s.verticalTrail.some(c=>c.y>650&&c.y<698),
  particle_ribbon_has_round_head_and_tapered_transparent_tip:[s.forwardTrail,s.reverseTrail,s.verticalTrail].every(p=>
    p.length>0&&p[0].radius===0&&p[0].alpha===0&&p.at(-1).radius>=14&&p.at(-1).alpha>=200),
  particle_ribbon_renders_ui_palette_behind_cat_without_echo:s.ribbonRender.active&&s.ribbonRender.behindCat&&
    s.ribbonRender.echoSprites===0&&s.ribbonRender.floorOffset<-40&&s.ribbonRender.colors.length>100&&
    s.ribbonRender.colors.some(c=>c[0]===111&&c[1]===221&&c[2]===215)&&
    s.ribbonRender.colors.some(c=>c[0]===255&&c[1]===246&&c[2]===221),
  movement_trails_freeze_then_fade_after_release:JSON.stringify(s.beforeTrailPause)===JSON.stringify(s.afterTrailPause)&&
    s.stoppedTrail.length===0,
  shield_release_flashes_then_keeps_bright_wide_outline:s.launch.time===0.45&&s.launch.flash&&s.launch.copies===24&&
    s.steady.time===0&&!s.steady.flash&&s.steady.radius>=15&&s.steady.alpha>=140,
});
