import { chromium } from 'playwright';
import { serve } from '../verify/serve';
const srv = await serve(); const browser = await chromium.launch({ args: ['--remote-debugging-port=9334'] });
try { const lighthouse = (await import('lighthouse')).default;
  const r: any = await lighthouse(srv.url + (process.argv[2] ?? '?d=2027-03-28'), { port: 9334, output: 'json', logLevel: 'error', onlyCategories: ['performance'] });
  const a = r.lhr.audits; for (const k of ['first-contentful-paint', 'largest-contentful-paint', 'speed-index', 'total-blocking-time', 'cumulative-layout-shift']) console.log(k, a[k].displayValue, a[k].score);
  console.log('score', r.lhr.categories.performance.score, 'lcp element', JSON.stringify(a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? '').slice(0, 200));
  console.log('shifts', JSON.stringify((a['layout-shifts']?.details?.items ?? []).slice(0, 3).map((x: any) => [x.score, x.node?.snippet?.slice(0, 80)])));
  console.log('render-blocking', JSON.stringify((a['render-blocking-resources']?.details?.items ?? []).map((x: any) => [x.url.split('/').pop(), x.wastedMs])));
} finally { await browser.close(); await srv.close(); }
