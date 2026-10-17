import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(process.cwd(), 'build', 'web-mobile');
const port = Number(process.env.GAME_PORT || 7456);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.wasm': 'application/wasm', '.bin': 'application/octet-stream',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.wav': 'audio/wav', '.mp3': 'audio/mpeg' };

export function resolveBuildRequest(directory, url) {
  let name;
  try { name = decodeURIComponent((url || '/').split('?')[0]).replace(/^\/+/, '') || 'index.html'; }
  catch { return { status: 400 }; }
  if (name.includes('\0')) return { status: 400 };
  const file = resolve(directory, name), inside = relative(resolve(directory), file);
  if (inside === '..' || inside.startsWith('..' + sep) || isAbsolute(inside)) return { status: 404 };
  return { file, status: 200 };
}

export function serveBuild(directory = root, listenPort = port) {
  const server = createServer((request, response) => {
    const resolved = resolveBuildRequest(directory, request.url);
    const file = resolved.file;
    let available = false;
    try { available = !!file && existsSync(file) && statSync(file).isFile(); } catch { /* A rebuild may replace a file here. */ }
    if (!available) {
      response.writeHead(resolved.status === 400 ? 400 : 404); response.end('Not found'); return;
    }
    response.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    const stream = createReadStream(file);
    // A navigation can abort an asset request during QA. Close its file handle so
    // the next Creator build can replace the generated output on Windows.
    response.once('close', () => stream.destroy());
    stream.on('error', () => { if (!response.headersSent) response.writeHead(404); response.end(); });
    stream.pipe(response);
  });
  server.listen(listenPort, '127.0.0.1', () => console.log(`http://127.0.0.1:${server.address().port}`));
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) serveBuild();
