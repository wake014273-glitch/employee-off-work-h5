import test from 'node:test';
import assert from 'node:assert/strict';
import { GameModel } from '../assets/scripts/model/GameModel.ts';
import { PLAYER_BODY, PLAYER_EDGE_MARGIN, playerEnergyBarPoint, playerMirrorSign } from '../assets/scripts/model/GameLayout.ts';

test('horizontal movement chooses the tail side and vertical movement or release keeps it', () => {
  const game = new GameModel(); game.reset();
  assert.equal(game.playerFacing,-1);
  game.movePlayer(420,400);
  assert.equal(game.playerFacing,1); assert.equal(playerMirrorSign(game.playerFacing),-1);
  game.movePlayer(420,700);game.movePlayer(420,300);
  assert.equal(game.playerFacing,1);
  game.movePlayer(260,300);
  assert.equal(game.playerFacing,-1); assert.equal(playerMirrorSign(game.playerFacing),1);
  game.movePlayer(260,500);game.movePlayer(260,500);
  assert.equal(game.playerFacing,-1);
  game.paused=true;game.movePlayer(650,500);
  assert.equal(game.playerFacing,-1);assert.equal(game.player.x,260);
  game.paused=false;game.movePlayer(420,400);game.reset();
  assert.equal(game.playerFacing,-1);
});

test('the enlarged mirrored collision capsule and energy bar share the body centre', () => {
  const game=new GameModel();game.reset();
  for(const facing of [-1,1]) {
    game.movePlayer(facing===1?420:300,400);
    const centre=game.player.x+PLAYER_BODY.offsetX*playerMirrorSign(facing);
    assert.equal(game.playerFacing,facing);
    assert.equal(game.player.radius,27);
    for(const side of [-1,1]) {
      assert.ok(Math.abs(game.playerClearance({x:centre+side*27,y:400,radius:0}))<1e-9);
      assert.ok(game.playerClearance({x:centre+side*26.9,y:400,radius:0})<0);
      assert.ok(game.playerClearance({x:centre+side*27.1,y:400,radius:0})>0);
    }
    assert.equal(playerEnergyBarPoint(game.player,facing).x,centre);
  }
});

test('collision remains inside both edges after enlargement and blocked drags keep facing', () => {
  const game=new GameModel();game.reset();
  game.movePlayer(9999,400);
  assert.equal(game.player.x,game.width-PLAYER_EDGE_MARGIN);
  assert.equal(game.playerFacing,1);
  assert.ok(game.player.x-PLAYER_BODY.offsetX+game.player.radius<game.width);
  game.movePlayer(9999,600);assert.equal(game.playerFacing,1);
  game.movePlayer(-9999,400);
  assert.equal(game.player.x,PLAYER_EDGE_MARGIN);
  assert.equal(game.playerFacing,-1);
  assert.ok(game.player.x+PLAYER_BODY.offsetX-game.player.radius>0);
});
