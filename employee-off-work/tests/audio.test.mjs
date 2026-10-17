import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { renderEvilLaugh } from '../scripts/generate-evil-laugh.mjs';

function audioHarness() {
  class AudioSource {
    clip=null; playing=false; currentTime=0; plays=0; pauses=0; stops=0; shots=[];
    play() { this.playing=true; this.plays++; }
    pause() { this.playing=false; this.pauses++; }
    stop() { this.playing=false; this.currentTime=0; this.stops++; }
    playOneShot(clip,volume) { this.shots.push({clip,volume}); }
  }
  class Node { addChild() {} addComponent() { return new AudioSource(); } }
  const requests=new Map();
  const source=readFileSync(new URL('../assets/scripts/PlatformServices.ts',import.meta.url),'utf8')
    .replace(/^import .*;\r?\n/gm,'').replace(/\bexport /g,'');
  let now=1000;
  const context={AudioSource,Node,AudioClip:class {},performance:{now:()=>now},assetManager:{},sys:{},console};
  vm.runInNewContext(stripTypeScriptTypes(source)+'\nglobalThis.AudioClass=GameAudio;',context);
  const audio=new context.AudioClass(new Node());
  audio.load({load(path,type,callback) { requests.set(path,callback); }});
  const deliver=(name,error=null)=>requests.get(`audio/${name}`)(error,error?null:{name,getDuration:()=>name==='bgm'?240/112*16:.1});
  return {audio,deliver,advance:ms=>{now+=ms;}};
}

test('music waits for input and late loading, then loops without restarting every update',()=>{
  const {audio,deliver}=audioHarness();
  audio.setMusicActive(true);deliver('bgm');
  assert.equal(audio.musicSource.playing,false);
  audio.unlock();assert.equal(audio.musicSource.playing,true);assert.equal(audio.musicSource.loop,true);
  audio.musicSource.currentTime=12.5;
  for(let i=0;i<60;i++)audio.setMusicActive(true);
  assert.equal(audio.musicSource.plays,1);assert.equal(audio.musicSource.currentTime,12.5);
  audio.setMusicActive(false);assert.equal(audio.musicSource.playing,false);
  audio.setMusicActive(true);assert.equal(audio.musicSource.currentTime,12.5);assert.equal(audio.musicSource.plays,2);
});

test('mute and background stop prevent async music loading from reviving playback',()=>{
  const {audio,deliver}=audioHarness();
  audio.unlock();audio.setMusicActive(true);audio.enabled=false;deliver('bgm');
  assert.equal(audio.musicSource.playing,false);
  audio.enabled=true;assert.equal(audio.musicSource.playing,true);
  audio.stop();assert.equal(audio.musicSource.playing,false);
  audio.enabled=false;audio.enabled=true;assert.equal(audio.musicSource.playing,false);
  audio.setMusicActive(true);audio.destroy();deliver('bgm');audio.unlock();audio.setMusicActive(true);
  assert.equal(audio.musicSource.playing,false);
});

test('sound effects keep cooldowns and volume priorities and obey the shared switch',()=>{
  const {audio,deliver}=audioHarness();
  for(const name of ['pickup','hit','block'])deliver(name);
  audio.play('pickup');audio.play('pickup');audio.play('hit');audio.play('block');
  assert.equal(audio.source.shots.length,3);
  assert.equal(audio.source.shots[1].volume,.65);assert.equal(audio.source.shots[2].volume,.35);
  audio.enabled=false;audio.play('hit');assert.equal(audio.source.shots.length,3);
});

test('failed or destroyed loads leave audio optional and never start music',()=>{
  const {audio,deliver}=audioHarness();
  audio.unlock();audio.setMusicActive(true);deliver('bgm',new Error('offline'));
  assert.equal(audio.musicSource.clip,null);assert.equal(audio.musicSource.playing,false);
  audio.destroy();deliver('pickup');assert.equal(audio.clips.size,0);
});

test('supplemental feedback limits bursts, prioritizes grades, and recovers after cooldown',()=>{
  const {audio,deliver,advance}=audioHarness();
  for(const n of ['skill','grade','reduce','leave','countdown','resume'])deliver(n);
  audio.play('grade');audio.play('skill');audio.play('grade');
  assert.deepEqual(audio.source.shots.map(s=>s.clip.name),['grade']);
  advance(501);audio.play('skill');audio.play('skill');
  audio.play('reduce');audio.play('reduce');audio.play('leave');audio.play('leave');
  assert.deepEqual(audio.source.shots.map(s=>s.clip.name),['grade','skill','reduce','leave']);
  assert.equal(audio.source.shots[1].volume,.35);
  advance(1000);audio.play('countdown');advance(1000);audio.play('countdown');audio.play('resume');
  assert.equal(audio.source.shots.length,7);
  audio.enabled=false;advance(1000);
  for(const n of ['skill','grade','reduce','leave','countdown','resume'])audio.play(n);
  assert.equal(audio.source.shots.length,7);
});

test('approved v1 cues are byte exact and every shipped cue contains valid unclipped PCM',()=>{
  const files={ui:'02-ui',pickup:'03-pickup',ready:'04-ready',shield:'05-shield',hit:'06-hit'};
  for(const [name,file] of Object.entries(files)) {
    const shipped=readFileSync(new URL(`../assets/art/audio/${name}.wav`,import.meta.url));
    assert.deepEqual(shipped,readFileSync(new URL(`../../美术/音频/LMMS试听稿-v1/exports/${file}.wav`,import.meta.url)));
  }
  for(const name of [...Object.keys(files),'block','wave','result','laugh','leave','reduce','countdown','resume','grade','skill']) {
    const b=readFileSync(new URL(`../assets/art/audio/${name}.wav`,import.meta.url));
    assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');
    let fmt,data;
    for(let p=12;p+8<=b.length;) {
      const type=b.toString('ascii',p,p+4),size=b.readUInt32LE(p+4),start=p+8;
      assert(start+size<=b.length);
      if(type==='fmt ')fmt={format:b.readUInt16LE(start),channels:b.readUInt16LE(start+2),rate:b.readUInt32LE(start+4),bits:b.readUInt16LE(start+14)};
      if(type==='data')data=b.subarray(start,start+size);
      p=start+size+(size%2);
    }
    assert.equal(fmt.format,1);assert.equal(fmt.bits,16);assert(data.length>0);
    assert(data.length/2/fmt.channels/fmt.rate>.025,name);
    let peak=0;for(let p=0;p<data.length;p+=2)peak=Math.max(peak,Math.abs(data.readInt16LE(p)));
    assert(peak>300&&peak<32767,name);
  }
  const music=statSync(new URL('../assets/art/audio/bgm.mp3',import.meta.url));
  assert(music.size>100000&&music.size<1000000,'music must fit the mini-game package');
});

test('supplementary assets match their editable LMMS exports',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../../美术/音频/LMMS补充音效-v1/audio-check.json',import.meta.url)));
  for(const {name} of manifest.files)assert.deepEqual(
    readFileSync(new URL(`../assets/art/audio/${name}.wav`,import.meta.url)),
    readFileSync(new URL(`../../美术/音频/LMMS补充音效-v1/exports/${name}.wav`,import.meta.url)));
});

test('monster laugh v3 ships the reproducible recorded voice with headroom and silent boundaries',()=>{
  const wav=readFileSync(new URL('../assets/art/audio/laugh.wav',import.meta.url));
  assert.deepEqual(wav,renderEvilLaugh());
  const rate=wav.readUInt32LE(24),count=wav.readUInt32LE(40)/2;
  assert.equal(rate,44100);assert.equal(count/rate,2.65);
  let peak=0,energy=0;
  for(let i=0;i<count;i++){const value=wav.readInt16LE(44+i*2)/32767;peak=Math.max(peak,Math.abs(value));energy+=value*value;}
  assert.ok(peak>.67&&peak<.69);assert.ok(Math.sqrt(energy/count)>.1);
  assert.equal(wav.readInt16LE(44),0);assert.equal(wav.readInt16LE(wav.length-2),0);
});
