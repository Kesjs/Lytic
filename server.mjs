import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handler from './.vercel/output/functions/__server.func/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticDir = path.join(__dirname, '.vercel/output/static');

const getContentType = (ext) => {
  const map = {
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2'
  };
  return map[ext] || 'application/octet-stream';
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  const filePath = path.join(staticDir, urlPath);
  
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      res.writeHead(200, { 'Content-Type': getContentType(path.extname(filePath)) });
      fs.createReadStream(filePath).pipe(res);
    } else {
      handler(req, res);
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
