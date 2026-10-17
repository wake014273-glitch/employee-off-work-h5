import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// Original v1-style sine/triangle plucks, D major. LMMS owns synthesis/rendering.
const root = dirname(fileURLToPath(import.meta.url));
for (const d of ['projects', 'masters', 'exports']) mkdirSync(join(root,d),{recursive:true});
const cues = [
  {name:'leave',title:'请假获批清屏',notes:[[0,62,.16],[.16,69,.16],[.32,74,.16],[.48,81,.30],[.52,86,.28]],wave:1,decay:.13,release:.10},
  {name:'reduce',title:'AI／Agent 减负',notes:[[0,86,.16],[.24,81,.16],[.48,74,.28]],wave:0,decay:.09,release:.07},
  {name:'countdown',title:'恢复倒计时 3／2／1',notes:[[0,74,.28]],wave:0,decay:.06,release:.04},
  {name:'resume',title:'恢复游戏',notes:[[0,74,.12],[.20,81,.12],[.40,86,.22]],wave:0,decay:.09,release:.06},
  {name:'grade',title:'B／A／S 操作评级',notes:[[0,81,.14],[.20,86,.14],[.40,90,.25]],wave:0,decay:.11,release:.08},
  {name:'skill',title:'穿缝／已读不回技巧成功',notes:[[0,81,.10],[.18,86,.15]],wave:0,decay:.055,release:.035},
];
function instrument(c) {
  return `<instrumenttrack vol="32" pan="0" pitch="0" basenote="57" fxch="0" pitchrange="1" usemasterpitch="1"><instrument name="tripleoscillator"><tripleoscillator vol0="100" vol1="14" vol2="0" wavetype0="${c.wave}" wavetype1="0" wavetype2="0" coarse0="0" coarse1="12" coarse2="0" finel0="0" finer0="0" finel1="0" finer1="0" pan0="0" pan1="0" modalgo1="0" modalgo2="0" modalgo3="0" phoffset0="0" phoffset1="0"/></instrument><eldata fwet="0"><elvol amt="1" pdel="0" att="0.001" hold="0" dec="${c.decay}" sustain="0" rel="${c.release}" lamt="0" lspd="0.1" x100="0"/><elcut amt="0" lamt="0"/><elres amt="0" lamt="0"/></eldata><chordcreator chord-enabled="0"/><arpeggiator arp-enabled="0"/><fxchain enabled="0" numofeffects="0"/></instrumenttrack>`;
}
function readWave(path) {
  const b=readFileSync(path); let fmt,data;
  if(b.toString('ascii',0,4)!=='RIFF')throw Error('Not WAV: '+path);
  for(let p=12;p+8<=b.length;) {
    const id=b.toString('ascii',p,p+4),size=b.readUInt32LE(p+4),s=p+8;
    if(id==='fmt ')fmt={format:b.readUInt16LE(s),channels:b.readUInt16LE(s+2),rate:b.readUInt32LE(s+4),bits:b.readUInt16LE(s+14)};
    if(id==='data')data=b.subarray(s,s+size);p=s+size+(size%2);
  }
  if(!fmt||!data||fmt.bits!==16||fmt.format!==1)throw Error('Expected LMMS PCM16 export');
  return {...fmt,values:Float64Array.from({length:data.length/2},(_,i)=>data.readInt16LE(i*2)/32768)};
}
function writeWave(path,v,channels=2,rate=44100) {
  const b=Buffer.alloc(44+v.length*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(channels,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*channels*2,28);b.writeUInt16LE(channels*2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(v.length*2,40);
  for(let i=0;i<v.length;i++)b.writeInt16LE(Math.round(v[i]*32767),44+i*2);writeFileSync(path,b);
}
const report=[];
const montage=new Float64Array(44100*2*7);
for(const [index,c] of cues.entries()) {
  const notes=c.notes.map(([beat,midi,len],i)=>`<note pos="${Math.round(beat*48)}" key="${midi-12}" len="${Math.round(len*48)}" vol="${78-i*3}" pan="0"/>`).join('');
  const xml=`<?xml version="1.0"?><!DOCTYPE lmms-project><lmms-project creator="LMMS" creatorversion="1.2.2" version="1.0" type="song"><head bpm="160" mastervol="72" masterpitch="0" timesig_numerator="4" timesig_denominator="4"/><song><trackcontainer type="song"><track type="0" name="${c.title}" muted="0" solo="0">${instrument(c)}<pattern name="${c.title}" type="1" steps="16" pos="0" len="192" muted="0">${notes}</pattern></track></trackcontainer><fxmixer><fxchannel num="0" name="Master" volume="1" muted="0"><fxchain enabled="0" numofeffects="0"/></fxchannel></fxmixer><timeline lp0pos="0" lp1pos="192" lpstate="0"/><controllers/></song></lmms-project>`;
  const project=join(root,'projects',c.name+'.mmp'),master=join(root,'masters',c.name+'.wav');writeFileSync(project,xml);
  const r=spawnSync('E:/软件/LMMS/lmms.exe',['render',project,'-o',master,'-s','44100','-x','1'],{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:4e6});
  writeFileSync(join(root,'masters',c.name+'.render.log'),`${r.stdout}\n${r.stderr}\nExit: ${r.status}`);
  if(r.error||r.status!==0)throw Error('LMMS render failed: '+c.name);
  const w=readWave(master),ch=w.channels,rate=w.rate,frames=w.values.length/ch;
  const active=f=>{for(let k=0;k<ch;k++)if(Math.abs(w.values[f*ch+k])>.0008)return true;return false;};
  let start=0,end=frames;while(start<end&&!active(start))start++;while(end>start&&!active(end-1))end--;
  start=Math.max(0,start-Math.round(.003*rate));end=Math.min(frames,end+Math.round(.025*rate));
  if(end-start<rate*.025)throw Error('Silent cue: '+c.name);
  const v=w.values.slice(start*ch,end*ch);let peak=0;for(const s of v)peak=Math.max(peak,Math.abs(s));
  const gain=.60/peak,fade=Math.round(.003*rate);let sum=0,outPeak=0;
  for(let f=0;f<end-start;f++)for(let k=0;k<ch;k++){const at=f*ch+k;v[at]*=gain*Math.min(1,f/fade,(end-start-1-f)/fade);sum+=v[at]**2;outPeak=Math.max(outPeak,Math.abs(v[at]));}
  const output=join(root,'exports',c.name+'.wav');writeWave(output,v,ch,rate);
  const target=resolve(root,'../../../employee-off-work/assets/art/audio',c.name+'.wav');copyFileSync(output,target);
  const offset=Math.round(index*1.1*44100)*2;montage.set(v,offset);
  report.push({name:c.name,title:c.title,seconds:(end-start)/rate,rate,channels:ch,bits:16,peakDb:20*Math.log10(outPeak),rmsDb:20*Math.log10(Math.sqrt(sum/v.length)),clippedSamples:0,sha256:createHash('sha256').update(readFileSync(output)).digest('hex')});
  console.log(JSON.stringify(report.at(-1)));
}
writeWave(join(root,'exports','00-audition.wav'),montage);
const mp3=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',join(root,'exports','00-audition.wav'),'-b:a','160k',join(root,'exports','00-audition.mp3')],{windowsHide:true,encoding:'utf8'});if(mp3.status!==0)throw Error(mp3.stderr);
writeFileSync(join(root,'audio-check.json'),JSON.stringify({original:true,renderer:'LMMS 1.2.2',files:report},null,2)+'\n');
writeFileSync(join(root,'manifest.json'),JSON.stringify({version:1,style:'Approved v1 D-major sine/triangle plucks',cues},null,2)+'\n');
