// Rebuilds only the application shell (script, page, styles, fonts, offline worker) into dist/, keeping the data files of the
// last full build:  npx tsx scripts/build/site-only.ts
import buildSite from './site';
await buildSite(process.argv[2] ?? 'dist');
