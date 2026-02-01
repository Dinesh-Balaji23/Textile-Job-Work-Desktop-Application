const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');
const outDir = path.resolve(__dirname, '../dist/renderer');
const htmlSource = path.resolve(__dirname, '../src/renderer/index.html');
const htmlTarget = path.join(outDir, 'index.html');

function ensureDist() {
  fs.mkdirSync(outDir, { recursive: true });
  fs.copyFileSync(htmlSource, htmlTarget);
}

async function buildRenderer() {
  ensureDist();

  const ctx = await esbuild.context({
    entryPoints: [path.resolve(__dirname, '../src/renderer/index.jsx')],
    outfile: path.join(outDir, 'index.js'),
    bundle: true,
    platform: 'browser',
    format: 'esm',
    sourcemap: true,
    target: ['chrome116'],
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx',
      '.css': 'css'
    }
  });

  if (isWatch) {
    await ctx.watch();
    console.log('Renderer build watching for changes...');
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log('Renderer build complete.');
  }
}

buildRenderer().catch((err) => {
  console.error(err);
  process.exit(1);
});
