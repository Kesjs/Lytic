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

export default async function handler(req, res) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const url = \`\${protocol}://\${host}\${req.url}\`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else {
          headers.set(key, value);
        }
      }
    }

    const init = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = req;
      init.duplex = 'half';
    }

    const webRequest = new Request(url, init);
    const webResponse = await server.fetch(webRequest);

    res.statusCode = webResponse.status;
    webResponse.headers.forEach((val, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        const cookies = webResponse.headers.getSetCookie ? webResponse.headers.getSetCookie() : [val];
        res.setHeader(key, cookies);
      } else {
        res.setHeader(key, val);
      }
    });

    if (!webResponse.body) {
      res.end();
      return;
    }

    const reader = webResponse.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err) {
    console.error('Server error:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}
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
  external: ['node:*', 'puppeteer-core', '@sparticuz/chromium-min'],
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
