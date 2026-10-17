/** Supporting cues plus approved LMMS v1 imports. Requires FFmpeg for BGM encoding. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { writeEvilLaugh } from './generate-evil-laugh.mjs';
const directory = new URL('../assets/art/audio/', import.meta.url);
mkdirSync(directory, { recursive: true });
const sampleRate = 22050;
const sounds = {
  block: [[1174.7, 0.04], [987.77, 0.055]],
  wave: [[523.25, 0.09], [659.25, 0.1], [783.99, 0.16]],
  result: [[783.99, 0.12], [659.25, 0.12], [523.25, 0.22]],
};
for (const [name, notes] of Object.entries(sounds)) {
  const count = Math.ceil(notes.reduce((sum, note) => sum + note[1], 0) * sampleRate);
  const buffer = Buffer.alloc(44 + count * 2);
  buffer.write('RIFF'); buffer.writeUInt32LE(36 + count * 2, 4); buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write('data', 36); buffer.writeUInt32LE(count * 2, 40);
  let offset = 0;
  for (const [frequency, duration] of notes) {
    const length = Math.floor(duration * sampleRate);
    for (let i = 0; i < length && offset < count; i++, offset++) {
      const t = i / sampleRate, envelope = Math.min(1, t / 0.006) * Math.exp(-t / (duration * 0.45)) * Math.min(1, (duration - t) / 0.025);
      const signal = Math.sin(2 * Math.PI * frequency * t) + 0.17 * Math.sin(2 * Math.PI * frequency * 2 * t);
      buffer.writeInt16LE(Math.round(signal * envelope * 0.36 * 32767), 44 + offset * 2);
    }
  }
  writeFileSync(new URL(`${name}.wav`, directory), buffer);
}

writeEvilLaugh();
console.log(`Generated ${Object.keys(sounds).length} supporting sounds at ${sampleRate} Hz.`);
await import('./import-lmms-audio.mjs');
await import('./import-supplement-audio.mjs');
