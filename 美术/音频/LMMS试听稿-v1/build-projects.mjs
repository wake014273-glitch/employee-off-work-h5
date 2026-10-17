import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Original musical sketch. No third-party songs, presets, or sample recordings.
const root = dirname(fileURLToPath(import.meta.url));
for (const dir of ['projects', 'samples', 'exports', 'masters']) mkdirSync(join(root, dir), { recursive: true });
const sr = 44100;
let seed = 20261016;
function noise() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; }
function sample(name, duration, fn) {
  const count = Math.ceil(duration * sr), b = Buffer.alloc(44 + count * 2);
  b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) {
    const t = i / sr;
    const fade = Math.min(1, i / 30, (count - 1 - i) / 100);
    const value = Math.max(-0.95, Math.min(0.95, fn(t, noise()) * fade));
    b.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
  }
  writeFileSync(join(root, 'samples', `${name}.wav`), b);
}
sample('soft-kick', 0.24, (t, n) => 0.76 * Math.sin(2 * Math.PI * (53 * t + 4.8 * (1 - Math.exp(-t * 42)))) * Math.exp(-t * 21) + n * Math.exp(-t * 500) * 0.11);
sample('paper-rim', 0.12, (t, n) => (0.37 * Math.sin(2 * Math.PI * 1640 * t) + 0.25 * Math.sin(2 * Math.PI * 2310 * t)) * Math.exp(-t * 140) + n * Math.exp(-t * 64) * 0.18);
sample('brush-hat', 0.075, (t, n) => n * Math.exp(-t * 88) * 0.42);
sample('office-tick', 0.055, (t, n) => (Math.sin(2 * Math.PI * 2800 * t) * 0.21 + n * 0.14) * Math.exp(-t * 150));

const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const attrs = obj => Object.entries(obj).map(([k,v]) => `${k}="${esc(v)}"`).join(' ');
function synth({vol = 30, pan = 0, wave = 0, second = 0, octave = 12, attack = 0.001, decay = 0.16, sustain = 0.08, release = 0.08, cut = 14000} = {}) {
  return `<instrumenttrack vol="${vol}" pan="${pan}" pitch="0" basenote="57" fxch="0" pitchrange="1" usemasterpitch="1">
    <instrument name="tripleoscillator"><tripleoscillator ${attrs({vol0:100,vol1:second,vol2:0,wavetype0:wave,wavetype1:0,wavetype2:0,coarse0:0,coarse1:octave,coarse2:0,finel0:0,finer0:0,finel1:0,finer1:0,finel2:0,finer2:0,pan0:0,pan1:0,pan2:0,modalgo1:0,modalgo2:0,modalgo3:0,phoffset0:0,phoffset1:0,phoffset2:0,stphdetun0:0,stphdetun1:0,stphdetun2:0})}/></instrument>
    <eldata fwet="${cut < 14000 ? 1 : 0}" ftype="0" fcut="${cut}" fres="0.7"><elvol amt="1" pdel="0" att="${attack}" hold="0" dec="${decay}" sustain="${sustain}" rel="${release}" lamt="0" lspd="0.1" x100="0"/><elcut amt="0" lamt="0"/><elres amt="0" lamt="0"/></eldata>
    <chordcreator chord-enabled="0"/><arpeggiator arp-enabled="0"/><fxchain enabled="0" numofeffects="0"/>
  </instrumenttrack>`;
}
function sampler(name, vol, pan = 0) {
  return `<instrumenttrack vol="${vol}" pan="${pan}" basenote="57" pitch="0" fxch="0"><instrument name="audiofileprocessor"><audiofileprocessor src="${esc(join(root, 'samples', `${name}.wav`).replaceAll('\\','/'))}" amp="100" sframe="0" eframe="1" reversed="0" looped="0" interp="1"/></instrument><eldata fwet="0"><elvol amt="0"/></eldata><fxchain enabled="0" numofeffects="0"/></instrumenttrack>`;
}
const note = (beat, midi, beats, vol = 80, pan = 0) => `<note pos="${Math.round(beat * 48)}" key="${midi - 12}" len="${Math.round(beats * 48)}" vol="${vol}" pan="${pan}"/>`;
const pattern = (name, bar, notes, bars = 1) => `<pattern name="${esc(name)}" type="1" steps="${bars * 16}" pos="${bar * 192}" len="${bars * 192}" muted="0">${notes.join('')}</pattern>`;
const track = (name, instrument, patterns) => `<track type="0" name="${esc(name)}" muted="0" solo="0">${instrument}${patterns.join('')}</track>`;
function project(file, bpm, tracks, bars, notes) {
  const xml = `<?xml version="1.0"?><!DOCTYPE lmms-project>
<lmms-project creator="LMMS" creatorversion="1.2.2" version="1.0" type="song"><head bpm="${bpm}" mastervol="72" masterpitch="0" timesig_numerator="4" timesig_denominator="4"/>
<song><trackcontainer x="5" y="5" width="1400" height="650" visible="1" minimized="0" maximized="0" type="song">${tracks.join('\n')}</trackcontainer>
<fxmixer x="5" y="670" width="600" height="300" visible="0"><fxchannel num="0" name="Master" volume="1" muted="0"><fxchain enabled="0" numofeffects="0"/></fxchannel></fxmixer>
<pianoroll x="20" y="30" width="1000" height="600" visible="0"/>
<projectnotes x="1420" y="5" width="500" height="500" visible="0"><![CDATA[${notes}]]></projectnotes>
<timeline lp0pos="0" lp1pos="${bars * 192}" lpstate="1"/><controllers/></song></lmms-project>`;
  writeFileSync(join(root, 'projects', `${file}.mmp`), xml);
  return { file, bpm, bars, loopSeconds: bars * 240 / bpm, notes };
}

// Dmaj7 – Bm7 – Em7 – A13. Four-bar hook with an answering phrase.
const chords = [[62,66,69,73],[59,62,66,69],[64,67,71,74],[61,67,69,76]];
const roots = [38,35,40,33];
const melody = [
  [[0,78,.45],[.75,81,.25],[1.5,78,.35],[2.25,76,.25],[2.75,74,.65]],
  [[.25,73,.45],[1,74,.25],[1.75,78,.40],[2.5,76,.25],[3.25,73,.40]],
  [[0,76,.45],[.75,79,.25],[1.5,78,.35],[2.25,76,.25],[3,74,.45]],
  [[.25,73,.25],[1,76,.40],[1.75,73,.25],[2.5,71,.25],[3.25,69,.45]],
  [[0,74,.25],[.5,78,.25],[1.25,81,.50],[2.25,78,.25],[3,76,.50]],
  [[.25,78,.25],[1,81,.45],[1.75,78,.25],[2.5,76,.25],[3.25,74,.45]],
  [[0,79,.45],[.75,78,.25],[1.5,76,.35],[2.25,74,.25],[3,71,.45]],
  [[.25,73,.25],[1,76,.25],[1.75,73,.25],[2.5,69,.45],[3.25,73,.25]],
];
const lead=[], keys=[], bass=[], counter=[], kick=[], rim=[], hat=[], tick=[];
for (let bar=0; bar<16; bar++) {
  const c = chords[bar % 4];
  lead.push(pattern(bar < 8 ? 'A - sneaking past work' : 'B - fish break', bar,
    melody[bar % 8].map(([b,m,l],i) => note(b, m + (bar>=12 && i===0 ? 12 : 0), l, 70 + (i%3)*5))));
  const cn=[];
  for (const [b,v] of [[.5,47],[1.75,38],[2.5,44],[3.5,34]]) for (const m of c) cn.push(note(b,m,.23,v));
  keys.push(pattern('Soft offbeat chords',bar,cn));
  bass.push(pattern('Bouncy bass',bar,[[0,roots[bar%4],.58,88],[.75,roots[bar%4]+12,.22,65],[1.5,roots[bar%4]+7,.3,72],[2,roots[bar%4],.58,84],[2.75,roots[bar%4]+12,.2,62],[3.5,roots[(bar+1)%4]+(bar%4===3?0:1),.22,65]].map(a=>note(...a))));
  if(bar%4===1 || bar%4===3) counter.push(pattern('Answering sparkle',bar,[note(2.75,c[1]+12,.17,38),note(3.25,c[2]+12,.17,33),note(3.75,c[3]+12,.15,28)]));
  kick.push(pattern('Light kick',bar,[note(0,69,.25,90),note(1.75,69,.25,62),note(2.5,69,.25,78),...(bar%4===3?[note(3.5,69,.25,55)]:[])]));
  rim.push(pattern('Paper rim',bar,[note(1,69,.2,83),note(3,69,.2,77)]));
  hat.push(pattern('Brushed eighths',bar,Array.from({length:8},(_,i)=>note(i*.5+(i%2?.045:0),69,.1,i%2?43:29))));
  tick.push(pattern('Quiet office ticks',bar,[note(.75,69,.1,32),note(2.75,69,.1,25)]));
}
const manifest = [];
manifest.push(project('01-fish-break-loop',112,[
  track('01 Rubber mallet melody',synth({vol:27,wave:0,second:14,decay:.16,sustain:.025,release:.10,pan:5}),lead),
  track('02 Warm offbeat keys',synth({vol:19,wave:1,second:9,decay:.20,sustain:.07,release:.09,cut:4500,pan:-15}),keys),
  track('03 Round walking bass',synth({vol:36,wave:0,second:13,decay:.18,sustain:.36,release:.06,cut:2600}),bass),
  track('04 Tiny bell replies',synth({vol:17,wave:0,second:22,octave:19,decay:.25,sustain:.015,release:.14,pan:24}),counter),
  track('05 Soft kick',sampler('soft-kick',51),kick),track('06 Paper rim',sampler('paper-rim',39,-7),rim),
  track('07 Brush hats',sampler('brush-hat',24,13),hat),track('08 Office tick',sampler('office-tick',19,-22),tick),
],16,'Fish Break / 摸鱼小步 v1. Original 16-bar sketch, D major, 112 BPM, 4/4. Loop 0–3072 ticks, 34.285714 s. Eight editable tracks. Prototype for review; not installed in the game.'));

const sfx = [
  ['02-ui','UI soft pop',[[0,86,.12,75]],{vol:37,decay:.045,sustain:0,release:.025},1],
  ['03-pickup','Fish pickup',[[0,86,.16,80],[.22,93,.23,73]],{vol:34,second:16,decay:.09,sustain:0,release:.055},1],
  ['04-ready','Shield fully charged',[[0,78,.17,73],[.25,81,.17,78],[.5,86,.38,82],[.56,90,.32,40]],{vol:30,second:12,decay:.15,sustain:.04,release:.08},1],
  ['05-shield','Bubble shield on',[[0,62,.17,78],[.18,69,.17,72],[.36,74,.18,71],[.54,81,.34,70],[.62,86,.28,40]],{vol:30,wave:1,second:15,decay:.12,sustain:.08,release:.12},1],
  ['06-hit','Soft workload bump',[[0,50,.15,88],[.19,43,.23,80]],{vol:40,wave:1,second:17,octave:7,decay:.07,sustain:0,release:.045,cut:1800},1],
];
for(const [file,title,ns,settings,bars] of sfx) manifest.push(project(file,160,[track(title,synth(settings),[pattern(title,0,ns.map(a=>note(...a)),bars)])],bars,title+' / Original synthesized prototype. Trim trailing silence after export.'));
writeFileSync(join(root,'manifest.json'),JSON.stringify({version:1,status:'draft-for-listening',original:true,sampleRate:sr,projects:manifest},null,2)+'\n');
console.log(`Created ${manifest.length} editable LMMS projects and 4 original drum samples at ${root}`);
