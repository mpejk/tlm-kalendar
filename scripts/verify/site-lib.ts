// Shared by the site checks (site-url, site-layout, site-keys, font-render): a static server whose folder can be switched
// while it runs, and the list of browser engines that are installed.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium, firefox, webkit, BrowserType } from 'playwright';

const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.ics': 'text/calendar; charset=utf-8', '.webmanifest': 'application/manifest+json' };
/** Serves a folder under /tlm-kalendar/ (a sub-path, as on GitHub Pages) with the cache lifetime GitHub Pages sends. */
export async function serveSwitchable(dir: string) {
  const state = { root: path.resolve(dir) };
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent((req.url ?? '/').split('?')[0]); const prefix = '/tlm-kalendar';
    if (!u.startsWith(prefix)) { res.writeHead(404); res.end(); return; }
    u = u.slice(prefix.length) || '/'; const f = path.join(state.root, u.endsWith('/') ? u + 'index.html' : u);
    if (!f.startsWith(state.root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream', 'cache-control': 'max-age=600' }); res.end(fs.readFileSync(f));
  });
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${(server.address() as any).port}/tlm-kalendar/`, use: (d: string) => { state.root = path.resolve(d); }, close: () => new Promise<void>(r => { server.closeAllConnections?.(); server.close(() => r()); }) };
}
/** The engines to test with. An engine that is not installed is reported and skipped (never silently). */
export async function engines(): Promise<{ name: string; type: BrowserType }[]> {
  const out: { name: string; type: BrowserType }[] = [];
  const want = (process.env.ENGINES ?? 'chromium,webkit,firefox').split(',');
  for (const [name, type] of [['chromium', chromium], ['webkit', webkit], ['firefox', firefox]] as const) {
    if (!want.includes(name)) continue;
    if (!fs.existsSync(type.executablePath())) { skipped.push(`${name}: not installed (npx playwright install ${name})`); continue; }
    // an engine that is installed but cannot start on this machine is skipped too, and named in the result
    try { const b = await type.launch(); await b.close(); out.push({ name, type }); }
    catch (e) { skipped.push(`${name}: does not start here (${(String(e).match(/\[err\] (?!\*\*\*)(.*)/)?.[1] ?? String(e).split('\n')[0]).slice(0, 90)})`); }
  }
  for (const s of skipped) console.log('ENGINE SKIPPED — ' + s);
  if (!out.length) { console.log('no browser engine available'); process.exit(1); }
  return out;
}
/** Engines that could not be used in this run (reported in every result). */
export const skipped: string[] = [];
export const distDir = () => path.resolve(process.env.DIST ?? 'dist');
export const fileBase = () => 'file://' + path.join(distDir(), 'index.html');
export const ready = (page: any, timeout = 8000) => page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready, null, { timeout });
