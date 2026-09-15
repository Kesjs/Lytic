import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as esbuild from 'esbuild';

const root = process.cwd();
const outputDir = join(root, '.vercel', 'output');

console.log('🚀 [1/4] Running Vite build (client + SSR)...');
execSync('npx vite build', { stdio: 'inherit' });

console.log('📦 [2/4] Preparing .vercel/output directory...');
if (existsSync(outputDir)) {
  rmSync(outputDir, { recursive: true, force: true });
}

mkdirSync(join(outputDir, 'static'), { recursive: true });
mkdirSync(join(outputDir, 'functions', '__server.func'), { recursive: true });

console.log('📂 [3/4] Copying assets...');
// Copy client static assets
cpSync(join(root, 'dist', 'client'), join(outputDir, 'static'), { recursive: true });

// Copy server bundle into serverless function
cpSync(join(root, 'dist', 'server'), join(outputDir, 'functions', '__server.func'), { recursive: true });

// Write serverless function entry handler for Node.js
const serverHandler = `import server from './server.js';
import { toNodeListener } from 'h3-v2';

// Utiliser toNodeListener permet de conserver le contexte AsyncLocalStorage (ALS) de h3
// ce qui est indispensable pour que getCookies() fonctionne dans les server functions.
export default toNodeListener(server);
`;

writeFileSync(join(outputDir, 'functions', '__server.func', 'index.mjs'), serverHandler, 'utf8');

console.log('⚡ [3.5/4] Bundling serverless function into a standalone executable...');
await esbuild.build({
  entryPoints: [join(outputDir, 'functions', '__server.func', 'index.mjs')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: join(outputDir, 'functions', '__server.func', 'index.mjs'),
  allowOverwrite: true,
  banner: {
    js: `import { createRequire as __createRequire } from 'node:module';\nif (typeof globalThis.require === 'undefined') { globalThis.require = __createRequire(import.meta.url); }`,
  },
  external: ['node:*'],
});

// Function config for Vercel
const vcConfig = {
  runtime: 'nodejs20.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
  shouldAddHelpers: false,
  supportsResponseStreaming: true,
};

writeFileSync(
  join(outputDir, 'functions', '__server.func', '.vc-config.json'),
  JSON.stringify(vcConfig, null, 2),
  'utf8'
);

console.log('⚙️ [4/4] Writing .vercel/output/config.json...');
const vercelConfig = {
  version: 3,
  routes: [
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/__server' },
  ],
};

writeFileSync(join(outputDir, 'config.json'), JSON.stringify(vercelConfig, null, 2), 'utf8');

console.log('✅ Vercel build output successfully generated in .vercel/output!');
