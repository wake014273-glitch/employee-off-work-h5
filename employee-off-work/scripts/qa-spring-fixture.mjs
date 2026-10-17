import { PLAYER_BODY, PLAYER_VISUAL_TOP, PLAYER_ENERGY_BAR, playerMirrorSign } from '../assets/scripts/model/GameLayout.ts';
/** The same movement/mesh checks run inside Chrome and WeChat DevTools. */
export const SPRING_FIXTURE = `(() => {
  const g = window.__gm, m = g.model;
  g.restart(); g.guide.start(false); g.shieldCoach.reset(true);
  m.practiceProtected = false; m.invulnerableTime = 0;
  m.bullets.length = m.walls.length = m.skillOrbs.length = m.leaveSlips.length = m.aiPickups.length = 0;
  m.messageTimer = m.requirementTimer = m.wallTimer = m.skillTimer = 999;
  m.movePlayer(300, 650); g.bodySpring.reset(m.player);
  const sample = () => {
    const sprite = g.playerSprite;
    sprite._assembler.updateRenderData(sprite);
    const data = sprite.renderData, vertices = data.data;
    const first = vertices[0], middle = vertices[24], last = vertices[vertices.length - 2];
    return {x:g.bodySpring.x, y:g.bodySpring.y, bendX:sprite.bendX, bendY:sprite.bendY,
      root:{x:m.player.x,y:m.player.y}, feet:{x:first.x,y:first.y},
      waist:{x:first.x+(middle.x-first.x)*Math.sign(sprite.node.scale.x),y:middle.y},
      head:{x:first.x+(last.x-first.x)*Math.sign(sprite.node.scale.x),y:last.y},
      vertices:vertices.length,indices:data.indexCount,frame:sprite.spriteFrame.rect,
      finite:vertices.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)),
      uv:Array.from(data.chunk.vb).every(Number.isFinite)};
  };
  g.update(1/60); const idle = sample();
  g.press({x:300,y:650},1000);
  for(let i=1;i<=16;i++){g.drag({x:300+i*6,y:650});g.update(1/60);}
  const forward = sample();
  const freezeFrame = g.playerSprite.spriteFrame;
  m.paused=true;g.update(0.8);const paused=sample();
  const pauseFrameSame = freezeFrame === g.playerSprite.spriteFrame;
  m.paused=false;
  for(let i=1;i<=16;i++){g.drag({x:396-i*6,y:650+i*3});g.update(1/60);}
  const reverse = sample();
  g.release({x:300,y:698},1001);
  let rebound = false;
  for(let i=0;i<180;i++){g.update(1/60);rebound ||= g.bodySpring.x < -0.1;}
  const settled = sample();
  const verticalStroke = direction => {
    m.movePlayer(360,650);g.bodySpring.reset(m.player);
    g.update(1/60);const start=sample();
    for(let i=1;i<=18;i++){m.movePlayer(360,650+direction*i*3);g.update(1/60);}
    const moving=sample();let rebound=false;
    for(let i=0;i<180;i++){g.update(1/60);rebound ||= g.bodySpring.y*direction>1;}
    return {start,moving,settled:sample(),rebound};
  };
  const upward=verticalStroke(1),downward=verticalStroke(-1);
  const startFrame = g.playerSprite.spriteFrame;
  g.update(0.1);const animated = startFrame !== g.playerSprite.spriteFrame;
  m.movePlayer(360,600);g.bodySpring.reset(m.player);
  for(let i=1;i<=16;i++){m.movePlayer(360+i*6,600);g.update(1/60);}
  m.shieldTime=2;g.syncArt();
  const silhouettes = g.immunityCopies.filter(c=>c.node.active)
    .every(c=>c.bendX===g.playerSprite.bendX&&c.bendY===g.playerSprite.bendY&&c.renderData.dataLength===50);
  const target=m.player.y + ${PLAYER_VISUAL_TOP} + ${PLAYER_ENERGY_BAR.headGap + PLAYER_ENERGY_BAR.height / 2} + g.playerSprite.bendY;
  const energyFollows = Math.abs(g.artHud.energyPoint.x-(m.player.x+${PLAYER_BODY.offsetX}*(-m.playerFacing)+g.bodySpring.x))<0.01
    && Math.abs(g.artHud.energyPoint.y-target)<0.01;
  const result={idle,forward,paused,reverse,settled,upward,downward,rebound,animated,pauseFrameSame,silhouettes,energyFollows};
  // Keep a visible bend on screen for the regression screenshot.
  m.shieldTime=0;m.paused=true;g.visualDt=0;g.draw();g.syncArt();
  g.interface.root.active=false;g.overlay.node.active=false;
  return result;
})()`;

export function springChecks(s) {
  return {
    spring_mesh_is_connected_and_finite: [s.idle,s.forward,s.reverse,s.settled]
      .every(v=>v.vertices===50&&v.indices===144&&v.finite&&v.uv),
    spring_feet_follow_drag_while_head_lags: s.forward.root.x===396&&s.forward.x < -8
      &&s.forward.feet.x===s.idle.feet.x&&s.forward.feet.y===s.idle.feet.y
      &&s.forward.head.x<s.idle.head.x-8&&s.forward.waist.x<s.idle.waist.x,
    spring_reverses_and_handles_vertical_drag: s.reverse.x>8&&s.reverse.y < -3&&s.reverse.root.y===698,
    spring_vertical_motion_pulls_head_and_keeps_feet_anchored: [s.upward,s.downward].every(v=>
      v.moving.x===0&&Math.abs(v.moving.y)>16&&v.moving.feet.x===v.start.feet.x&&v.moving.feet.y===v.start.feet.y
      &&v.moving.finite&&v.moving.uv)
      &&s.upward.moving.head.y<s.upward.start.head.y-16&&s.downward.moving.head.y>s.downward.start.head.y+16,
    spring_vertical_release_rebounds_and_settles: [s.upward,s.downward].every(v=>
      v.rebound&&v.settled.x===0&&v.settled.y===0&&v.settled.root.y===v.moving.root.y),
    spring_freezes_when_paused: s.paused.x===s.forward.x&&s.paused.y===s.forward.y&&s.pauseFrameSame,
    spring_rebounds_then_settles_without_moving_player: s.rebound&&s.settled.x===0&&s.settled.y===0
      &&s.settled.root.x===s.reverse.root.x&&s.settled.root.y===s.reverse.root.y,
    spring_preserves_idle_animation_and_immunity: s.animated&&s.silhouettes,
    spring_energy_bar_follows_head: s.energyFollows,
  };
}
