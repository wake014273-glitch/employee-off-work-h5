import test from 'node:test';
import assert from 'node:assert/strict';
import { freshProgress, readProgress, ShieldCoach, TutorialGuide, settleRun, TUTORIAL_REVISION } from '../assets/scripts/model/GameExperience.ts';
import { GameModel } from '../assets/scripts/model/GameModel.ts';

test('local progress tolerates missing, corrupt, incompatible and invalid storage', () => {
  for (const raw of [null, '{broken', '{}', '{"version":2,"bestScore":999}']) assert.deepEqual(readProgress(raw),freshProgress());
  const loaded=readProgress(JSON.stringify({version:1,bestScore:12580,bestSeconds:155.4,bestWave:5,runs:8,soundEnabled:false,tutorialCompleted:true}));
  assert.equal(loaded.bestScore,12580);assert.equal(loaded.soundEnabled,false);assert.equal(loaded.tutorialCompleted,true);
  assert.deepEqual(readProgress(JSON.stringify({...freshProgress(),bestScore:-1,bestSeconds:'999',bestWave:null})),freshProgress());
  const corrupt=readProgress(JSON.stringify({...freshProgress(),bestScore:12.5,bestWave:1.5,runs:1e30,bestSeconds:155.4}));
  assert.equal(corrupt.bestScore,0);assert.equal(corrupt.bestWave,0);assert.equal(corrupt.runs,0);assert.equal(corrupt.bestSeconds,155.4);
});

const finishPraise = guide => { for(let i=0;i<12;i++)guide.advance(0.1); };
test('tutorial requires a dodge, a fish, real immunity ending, and an Agent in order', () => {
  const guide=new TutorialGuide();guide.start(true);
  assert.equal(guide.step,'intro');assert.equal(guide.picked(100),false);
  assert.equal(guide.beginPractice(),true);assert.equal(guide.beginPractice(),false);
  assert.equal(guide.picked(100),false);assert.match(guide.text,/满 3 格失败/);
  assert.equal(guide.avoided(),true);assert.equal(guide.feedback,'躲得漂亮！');
  assert.equal(guide.avoided(),false);finishPraise(guide);assert.equal(guide.step,'fish');
  for(const value of [0,80,NaN,Infinity])assert.equal(guide.picked(value),false);
  assert.equal(guide.picked(100),true);assert.equal(guide.feedback,'GOOD!');
  finishPraise(guide);assert.equal(guide.step,'shield');assert.equal(guide.shieldEnded(0),false);
  assert.equal(guide.activatedShield(),true);assert.equal(guide.playing,true);
  assert.equal(guide.feedback,'太棒啦！');finishPraise(guide);assert.equal(guide.step,'shield-active');
  assert.equal(guide.pickedAi('agent',2),false);assert.equal(guide.shieldEnded(0.01),false);
  assert.equal(guide.shieldEnded(NaN),false);assert.equal(guide.shieldEnded(0),true);
  assert.equal(guide.pickedAi('helper',1),false);assert.equal(guide.pickedAi('agent',1),false);
  assert.equal(guide.pickedAi('agent',2),true);assert.equal(guide.feedback,'你学会啦！');
  assert.equal(guide.lowered,2);finishPraise(guide);assert.equal(guide.ready,true);
  guide.start(true);guide.skip();assert.equal(guide.active,false);
});
test('waiting never skips an action, and failed dodge retries only its current step', () => {
  const guide=new TutorialGuide();guide.start(true);guide.beginPractice();
  for(let i=0;i<500;i++)guide.advance(0.1);assert.equal(guide.step,'practice');
  assert.equal(guide.hit(),true);assert.equal(guide.hit(),false);assert.equal(guide.rewarding,false);
  const before=guide.retryRemaining;for(const t of [0,-1,NaN,Infinity])guide.advance(t);
  assert.equal(guide.retryRemaining,before);for(let i=0;i<21;i++)guide.advance(0.1);
  assert.equal(guide.step,'practice');assert.equal(guide.dodged,false);
  guide.avoided();finishPraise(guide);for(let i=0;i<500;i++)guide.advance(0.1);
  assert.equal(guide.step,'fish');guide.picked(100);finishPraise(guide);
  for(let i=0;i<500;i++)guide.advance(0.1);assert.equal(guide.step,'shield');
  guide.activatedShield();finishPraise(guide);for(let i=0;i<500;i++)guide.advance(0.1);
  assert.equal(guide.step,'shield-active');guide.shieldEnded(0);
  for(let i=0;i<500;i++)guide.advance(0.1);assert.equal(guide.step,'agent');
});

test('new tutorial revision preserves existing records and does not treat the old one-fish guide as current', () => {
  const old=readProgress(JSON.stringify({version:1,tutorialCompleted:true,bestScore:500,runs:3,soundEnabled:false}));
  assert.equal(old.tutorialRevision,0);assert.equal(old.bestScore,500);assert.equal(old.runs,3);assert.equal(old.soundEnabled,false);
  const twoStep=readProgress(JSON.stringify({...old,tutorialRevision:2}));
  assert.notEqual(twoStep.tutorialRevision,TUTORIAL_REVISION);assert.equal(twoStep.runs,3);
  old.tutorialRevision=TUTORIAL_REVISION;
  assert.equal(readProgress(JSON.stringify(old)).tutorialRevision,TUTORIAL_REVISION);
});

test('nearby practice volley starts with two workloads, four charges and no early resources on every aspect', () => {
  for (const height of [960,1280.64,1558.15,1800]) {
    const game=new GameModel(()=>0.5);game.height=height;game.reset();game.setupPractice();
    assert.equal(game.workload,2);assert.equal(game.energy,80);assert.equal(game.bullets.length,3);
    assert.equal(game.skillOrbs.length,0);assert.equal(game.aiPickups.length,0);
    assert.ok(game.bullets.every(b=>b.y>game.player.y+150&&b.y<game.player.y+250));
    game.update(0);assert.equal(game.workload,2);
    game.movePlayer(100,game.player.y);
    for(let i=0;i<240;i++)game.update(1/60);
    assert.equal(game.workload,2);assert.equal(game.gameOver,false);
    assert.equal(game.takeEvents().filter(e=>e.type==='practice-dodged').length,1);
    assert.equal(game.elapsed,0);assert.equal(game.score,0);assert.equal(game.waveTimer,0);
    game.startPracticeFish();assert.equal(game.skillOrbs.length,1);assert.equal(game.aiPickups.length,0);
    const fish=game.skillOrbs[0];assert.ok(fish.y<height-280&&fish.y>game.player.y);
  }
});
test('standing in the practice volley really fills workload, signals failure once and supports a clean retry', () => {
  const game=new GameModel(()=>0.5);game.reset();game.setupPractice();
  for(let i=0;i<240;i++)game.update(1/60);
  assert.equal(game.workload,3);assert.equal(game.gameOver,false);
  const events=game.takeEvents();assert.equal(events.filter(e=>e.type==='practice-hit').length,1);
  assert.equal(events.some(e=>e.type==='practice-dodged'),false);
  assert.equal(events.filter(e=>e.type==='hit')[0].workload,3);
  assert.equal(game.elapsed,0);assert.equal(game.score,0);
  game.setupPractice();assert.equal(game.workload,2);assert.equal(game.energy,80);
  assert.equal(game.shieldTime,0);assert.equal(game.aiPickups.length,0);
});
test('fish and Agent are gated by lesson, immunity truly runs three seconds, Agent enters from an edge and removes two', () => {
  const game=new GameModel(()=>0.5);game.reset();game.setupPractice();
  game.startPracticeFish();const fish=game.skillOrbs[0];game.movePlayer(fish.x,fish.y);game.update(0.01);
  assert.equal(game.energy,100);assert.equal(game.skillOrbs.length,0);
  assert.equal(game.takeEvents().filter(e=>e.type==='pickup').length,1);
  assert.equal(game.activateShield(),true);game.startPracticeImmunity();
  for(let i=0;i<150;i++)game.update(1/60);
  assert.ok(game.shieldTime>0);assert.equal(game.workload,2);assert.equal(game.aiPickups.length,0);
  assert.ok(game.takeEvents().some(e=>e.type==='shield-block'));
  for(let i=0;i<31;i++)game.update(1/60);assert.equal(game.shieldTime,0);
  game.startPracticeAgent();const agent=game.aiPickups[0];
  assert.equal(agent.kind,'agent');assert.ok(agent.x<0||agent.x>game.width);
  const entry=agent.x;for(let i=0;i<120;i++)game.update(1/60);assert.notEqual(agent.x,entry);
  for(let i=0;i<60*30;i++)game.update(1/60);assert.equal(game.aiPickups.length,1);
  game.movePlayer(agent.x,agent.y);game.update(0.01);assert.equal(game.workload,0);
  assert.equal(game.aiPickups.length,0);assert.equal(game.takeEvents().filter(e=>e.type==='ai-pickup'&&e.removed===2).length,1);
});

test('first full charge coaching persists until activation and appears only once', () => {
  const coach=new ShieldCoach();coach.reset(false);
  for(const energy of [0,20,40,60,80])assert.equal(coach.charged(energy),false);
  assert.equal(coach.active,false);assert.equal(coach.charged(100),true);assert.equal(coach.remaining,6);
  coach.advance(0);assert.equal(coach.remaining,6);coach.advance(200);assert.equal(coach.remaining,6);
  assert.equal(coach.charged(100),false);assert.equal(coach.remaining,6);
  coach.released();assert.equal(coach.active,false);assert.equal(coach.charged(100),false);
  coach.reset(true);assert.equal(coach.charged(100),false);
  coach.reset(false);assert.equal(coach.charged(100),true);coach.advance(6);assert.equal(coach.active,true);
});

test('old progress gains an unseen shield reminder without losing tutorial or records', () => {
  const old=readProgress(JSON.stringify({version:1,tutorialCompleted:true,bestScore:999,soundEnabled:false}));
  assert.equal(old.tutorialCompleted,true);assert.equal(old.bestScore,999);assert.equal(old.soundEnabled,false);assert.equal(old.shieldHintSeen,false);
  old.shieldHintSeen=true;assert.equal(readProgress(JSON.stringify(old)).shieldHintSeen,false);
  old.tutorialRevision=TUTORIAL_REVISION;assert.equal(readProgress(JSON.stringify(old)).shieldHintSeen,true);
});

test('practice protects one pickup and preserves its charge when normal play starts', () => {
  const game=new GameModel();game.reset();game.bullets.length=0;game.practiceProtected=true;
  for(let i=0;i<60*20;i++)game.update(1/60);
  assert.equal(game.elapsed,0);assert.equal(game.score,0);assert.equal(game.wave,1);assert.equal(game.bullets.length,0);
  assert.equal(game.hitPlayer(),false);
  game.practicePhase='fish';game.skillOrbs.push({kind:'skill',x:game.player.x,y:game.player.y,radius:17,alive:true,pulse:0});game.update(0.02);
  assert.equal(game.energy,20);assert.equal(game.takeEvents().filter(e=>e.type==='pickup').length,1);
  game.practiceProtected=false;game.update(0.02);assert.equal(game.elapsed,0.02);
  assert.equal(game.energy,20);assert.equal(game.shieldTime,0);assert.equal(game.workload,0);
  game.reset();assert.equal(game.practiceProtected,false);
});

const stats={elapsed:42,score:500,wave:2,maxCombo:5,gapClears:1,breakLocks:2,leaveSlips:0};
test('settlement preserves independent personal bests and advances run count once per settlement', () => {
  const first=settleRun(freshProgress(),stats,1,0);
  assert.equal(first.result.firstRun,true);assert.equal(first.profile.bestScore,500);assert.equal(first.profile.runs,1);
  const second=settleRun(first.profile,{...stats,score:200,elapsed:80,wave:3},2,0);
  assert.equal(second.result.newRecord,false);assert.equal(second.result.bestScore,500);
  assert.equal(second.profile.bestSeconds,80);assert.equal(second.profile.bestWave,3);assert.equal(second.profile.runs,2);
  const third=settleRun(second.profile,{...stats,score:800},2,0);
  assert.equal(third.result.newRecord,true);assert.equal(third.result.previousBest,500);
  assert.deepEqual(readProgress(JSON.stringify(third.profile)),third.profile);
});

test('next-run goal reflects an unused full shield, next wave or achievable score target', () => {
  assert.match(settleRun(freshProgress(),stats,0,100).result.goal,/双击屏幕/);
  assert.match(settleRun(freshProgress(),{...stats,elapsed:7,wave:1},1,0).result.goal,/1 秒.*第 2 波/);
  assert.match(settleRun(freshProgress(),{...stats,elapsed:10,wave:2},1,0).result.goal,/14 秒.*第 3 波/);
  assert.match(settleRun(freshProgress(),{...stats,elapsed:23,wave:2},1,0).result.goal,/1 秒.*第 3 波/);
  assert.match(settleRun(freshProgress(),{...stats,elapsed:25,wave:3},1,0).result.goal,/600 分/);
  assert.match(settleRun(freshProgress(),{...stats,elapsed:90},1,0).result.goal,/600 分/);
});
