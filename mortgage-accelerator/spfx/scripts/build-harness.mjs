// Bundles harness/main.tsx into one self-contained dist/index.html (no server needed).
import { build, context } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
const opts = {
  entryPoints: ['harness/main.tsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2018',
  outfile: 'dist/harness.js',
  define: { 'process.env.NODE_ENV': '"production"' },
  jsx: 'transform',
  logLevel: 'info'
};

function inline() {
  const js = readFileSync('dist/harness.js', 'utf8').replace(/<\/script/g, '<\\/script');
  writeFileSync('dist/index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mortgage Accelerator (harness)</title><style>html,body{margin:0;background:#fff}</style></head><body><div id="root"></div><script>${js}</script></body></html>`);
}

if (process.argv.includes('--serve')) {
  const ctx = await context({ ...opts, minify: false, plugins: [{ name: 'inline', setup(b) { b.onEnd(inline); } }] });
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: 'dist', port: 4173 });
  console.log('Harness: http://localhost:' + port + '/index.html');
} else {
  await build(opts);
  inline();
  console.log('Wrote dist/index.html');
}
