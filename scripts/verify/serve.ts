// Minimal static server for the tests (started and stopped inside the test command).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.ics': 'text/calendar; charset=utf-8', '.webmanifest': 'application/manifest+json' };
export async function serve(dir = 'dist', prefix = '/tlm-kalendar'): Promise<{ url: string; close: () => Promise<void> }> {
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent((req.url ?? '/').split('?')[0]); if (!u.startsWith(prefix)) { res.writeHead(404); res.end(); return; }
    u = u.slice(prefix.length) || '/'; const f = path.join(root, u.endsWith('/') ? u + 'index.html' : u);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    // text files are gzip-compressed, as every static host (GitHub Pages included) does
    const head: Record<string, string> = { 'content-type': types[path.extname(f)] ?? 'application/octet-stream', 'cache-control': 'max-age=600' };
    if (/\.(html|js|css|svg|ics|webmanifest)$/.test(f) && /gzip/.test(String(req.headers['accept-encoding'] ?? ''))) { res.writeHead(200, { ...head, 'content-encoding': 'gzip' }); fs.createReadStream(f).pipe(zlib.createGzip()).pipe(res); }
    else { res.writeHead(200, head); fs.createReadStream(f).pipe(res); }
  });
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${(server.address() as any).port}${prefix}/`, close: () => new Promise(r => server.close(() => r())) };
}
