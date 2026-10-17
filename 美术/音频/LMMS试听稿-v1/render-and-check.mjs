import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const executable = 'E:/软件/LMMS/lmms.exe';
const report = { status: 'draft-for-listening', files: [] };

function readWave(path) {
  const b=readFileSync(path);
  if(b.toString('ascii',0,4)!=='RIFF' || b.toString('ascii',8,12)!=='WAVE') throw Error(`Invalid WAV: ${path}`);
  let fmt, data;
  for(let at=12;at+8<=b.length;) {
    const id=b.toString('ascii',at,at+4), size=b.readUInt32LE(at+4), start=at+8;
    if(id==='fmt ') fmt={format:b.readUInt16LE(start),channels:b.readUInt16LE(start+2),rate:b.readUInt32LE(start+4),bits:b.readUInt16LE(start+14)};
    if(id==='data') data=b.subarray(start,Math.min(start+size,b.length));
    at=start+size+(size%2);
  }
  if(!fmt || !data?.length || ![16,24,32].includes(fmt.bits)) throw Error(`Unsupported WAV: ${path}`);
  const bytes=fmt.bits/8, values=new Float64Array(Math.floor(data.length/bytes));
  for(let i=0;i<values.length;i++) values[i]=fmt.format===3?data.readFloatLE(i*bytes):fmt.bits===24?data.readIntLE(i*bytes,3)/8388608:fmt.bits===16?data.readInt16LE(i*bytes)/32768:data.readInt32LE(i*bytes)/2147483648;
  return {...fmt,values,frames:Math.floor(values.length/fmt.channels)};
}
function writeWave(path, values, channels, rate) {
  const b=Buffer.alloc(44+values.length*2);
  b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);
  b.writeUInt16LE(1,20);b.writeUInt16LE(channels,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*channels*2,28);
  b.writeUInt16LE(channels*2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(values.length*2,40);
  for(let i=0;i<values.length;i++) b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,values[i]))*32767),44+i*2);
  writeFileSync(path,b);
}
for(const [index,p] of manifest.projects.entries()) {
  const master=join(root,'masters',p.file+'.wav');
  if(!existsSync(master) || statSync(master).size<1000) {
    if(index===0) throw Error('BGM must first be exported from the LMMS GUI.');
    console.log(`Rendering ${p.file} in LMMS...`);
    const r=spawnSync(executable,['render',join(root,'projects',p.file+'.mmp'),'-o',master,'-s','44100','-x','1'],{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:4*1024*1024});
    writeFileSync(join(root,'masters',p.file+'.render.log'),`${r.stdout??''}\n${r.stderr??''}\nExit: ${r.status}; error: ${r.error?.message??''}\n`);
    if(r.error || r.status!==0 || !existsSync(master)) throw Error(`LMMS render failed: ${p.file}: ${r.error?.message??r.status}`);
  }
  const wav=readWave(master), {channels,rate}=wav;
  let start=0,end=wav.frames;
  if(index>0) {
    const active=frame=>{for(let c=0;c<channels;c++) if(Math.abs(wav.values[frame*channels+c])>0.0008) return true;return false;};
    while(start<end && !active(start)) start++;
    while(end>start && !active(end-1)) end--;
    start=Math.max(0,start-Math.round(.003*rate));end=Math.min(wav.frames,end+Math.round(.04*rate));
  } else end=Math.round(p.loopSeconds*rate);
  if(end-start<rate*.025) throw Error(`Silent or incomplete export: ${p.file}`);
  const values=new Float64Array((end-start)*channels);
  for(let f=start;f<Math.min(end,wav.frames);f++) for(let c=0;c<channels;c++) values[(f-start)*channels+c]=wav.values[f*channels+c];
  let peak=0;for(const v of values) peak=Math.max(peak,Math.abs(v));
  if(peak<0.0001) throw Error(`Silent file: ${p.file}`);
  const gain=(index===0?0.50:0.63)/peak;
  const fade=Math.round(rate*(index===0?.002:.003)),frames=values.length/channels;
  let sum=0,outPeak=0;
  for(let f=0;f<frames;f++) for(let c=0;c<channels;c++) {
    const at=f*channels+c;
    values[at]*=gain*Math.min(1,f/fade,(frames-1-f)/fade);
    outPeak=Math.max(outPeak,Math.abs(values[at]));sum+=values[at]**2;
  }
  const name=p.file+'.wav';writeWave(join(root,'exports',name),values,channels,rate);
  const info={file:name,seconds:frames/rate,rate,channels,bits:16,peakDb:20*Math.log10(outPeak),rmsDb:20*Math.log10(Math.sqrt(sum/values.length)),clippedSamples:0,sourceFrames:wav.frames,loop:index===0};
  report.files.push(info);console.log(JSON.stringify(info));
}
writeFileSync(join(root,'audio-check.json'),JSON.stringify(report,null,2)+'\n');
// Audition order: UI, pickup, ready, shield, hit. Silence separates the cues.
const montage=new Float64Array(Math.round(5.5*44100)*2);
for(const [i,p] of manifest.projects.slice(1).entries()) {
  const w=readWave(join(root,'exports',p.file+'.wav'));
  const offset=Math.round([0,.8,1.8,3,4.2][i]*44100)*2;
  for(let n=0;n<w.values.length && offset+n<montage.length;n++) montage[offset+n]=w.values[n];
}
writeWave(join(root,'exports','00-sfx-audition.wav'),montage,2,44100);
console.log('All six exported files contain valid, non-silent PCM audio. Listening review still required.');
