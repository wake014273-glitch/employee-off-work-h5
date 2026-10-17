// Keep this file name for existing QA imports; checks exercise direct finger dragging.
export const JOYSTICK_FIXTURE = `(() => {
  const g = window.__gm, m = g.model;
  g.restart(); g.guide.start(false); m.practiceProtected = false;
  m.bullets.length = m.walls.length = m.skillOrbs.length = 0;
  m.messageTimer = m.requirementTimer = m.wallTimer = m.skillTimer = 999;
  m.invulnerableTime = 999; m.movePlayer(360, 300);
  const start = {...m.player};
  g.press({x:150,y:270}, 100);
  const atPress = {...m.player};
  g.drag({x:250,y:310});
  const forward = {...m.player};
  g.drag({x:210,y:280});
  const reverse = {...m.player};
  g.release({x:210,y:280}, 101);
  for(let i=0;i<30;i++) g.update(1/60);
  const stopped = {...m.player};
  const result = {start,atPress,forward,reverse,stopped,dragging:g.dragging,
    joystickRemoved:!('joystick' in g)&&!('joystickArt' in g)};
  g.goHome();g.draw();return result;
})()`;

export const joystickChecks = s => ({
  drag_preserves_initial_finger_offset: s.atPress.x===s.start.x&&s.atPress.y===s.start.y,
  drag_tracks_finger_one_to_one: Math.abs(s.forward.x-s.start.x-100)<0.01&&Math.abs(s.forward.y-s.start.y-40)<0.01,
  drag_reverses_immediately: Math.abs(s.reverse.x-s.forward.x+40)<0.01&&Math.abs(s.reverse.y-s.forward.y+30)<0.01,
  release_stops_without_drift: s.stopped.x===s.reverse.x&&s.stopped.y===s.reverse.y&&!s.dragging,
  joystick_removed: s.joystickRemoved,
});
