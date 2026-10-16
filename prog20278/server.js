


const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 8920;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.trie': 'application/octet-stream',
  '.data': 'application/octet-stream'
};

const server = http.createServer((req, res) => {
  try {
    let u = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    if (u === '/') u = '/index.html';
    const fp = path.normalize(path.join(ROOT, u));

    if (!fp.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.stat(fp, (e, st) => {
      if (e || !st.isFile()) {
        res.writeHead(404);
        res.end('404 Not Found: ' + u);
        return;
      }
      const ext = path.extname(fp).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Content-Length': st.size,
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(fp).pipe(res);
    });
  } catch (err) {
    res.writeHead(500);
    res.end('Server error: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log('=======================');
  console.log('StudyBuddy local server');
  console.log('Open: http://localhost:' + PORT + '/');
  console.log('Press Ctrl+C to stop.');
  console.log('=======================');
});