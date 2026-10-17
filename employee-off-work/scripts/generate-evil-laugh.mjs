/** Monster laugh v3: keep a recorded laugh intelligible, then lower and layer its voice. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = new URL('../../美术/音频/红色弹幕怪物笑声-v3/source/laugh-evil-1.ogg', import.meta.url);
export const LAUGH_DURATION = 2.65;

export function renderEvilLaugh() {
  const rate = 44100, count = Math.round(rate * LAUGH_DURATION);
  // AntumDeluge's CC0 recording preserves breathing and irregular laugh syllables.
  const filter = '[0:a]atrim=start=0.03:end=2.50,asetpts=PTS-STARTPTS,asplit=2[voice][monster];'
    + '[voice]asetrate=38808,aresample=44100,atempo=1.136363636,volume=0.88[main];'
    + '[monster]asetrate=31752,aresample=44100,atempo=1.388888889,lowpass=f=1600,volume=0.12[low];'
    + '[main][low]amix=inputs=2:normalize=0,highpass=f=70,lowpass=f=6200,'
    + 'equalizer=f=2500:t=q:w=1:g=1.5,acompressor=threshold=0.08:ratio=4:attack=1:release=90,'
    + 'aecho=0.9:0.9:64:0.08,apad,atrim=duration=2.65,'
    + 'afade=t=in:d=0.008,afade=t=out:st=2.45:d=0.20[out]';
  const result = spawnSync(process.env.FFMPEG ?? 'ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', fileURLToPath(source),
    '-filter_complex', filter, '-map', '[out]', '-ar', String(rate), '-ac', '1', '-f', 'f32le', 'pipe:1',
  ], { windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw result.error ?? new Error(result.stderr.toString());
  if (result.stdout.length !== count * 4) throw new Error('Unexpected monster laugh render length');
  let peak = 0;
  for (let i = 0; i < count; i++) peak = Math.max(peak, Math.abs(result.stdout.readFloatLE(i * 4)));
  if (!(peak > .01)) throw new Error('Monster laugh render is silent');
  const wav = Buffer.alloc(44 + count * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) wav.writeInt16LE(Math.round(result.stdout.readFloatLE(i * 4) / peak * .68 * 32767), 44 + i * 2);
  return wav;
}

export function writeEvilLaugh() {
  const directory = new URL('../assets/art/audio/', import.meta.url);
  const exports = new URL('../../美术/音频/红色弹幕怪物笑声-v3/', import.meta.url);
  mkdirSync(directory, { recursive: true });
  const wav = renderEvilLaugh();
  writeFileSync(new URL('laugh.wav', directory), wav);
  writeFileSync(new URL('monster-laugh-v3.wav', exports), wav);
  writeFileSync(new URL('audio-check.json', exports), JSON.stringify({
    version: 3, duration: LAUGH_DURATION, rate: 44100, channels: 1, bits: 16, bytes: wav.length,
    peakDBFS: 20 * Math.log10(.68),
    source: 'https://opengameart.org/content/evil-laugh', author: 'AntumDeluge', license: 'CC0-1.0',
    sourceSHA256: createHash('sha256').update(readFileSync(source)).digest('hex'),
    outputSHA256: createHash('sha256').update(wav).digest('hex'),
  }, null, 2));
  console.log('Generated monster laugh v3: 2.65 s, 44100 Hz mono PCM16, peak -3.35 dBFS.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) writeEvilLaugh();
