// Minimal static server for the Rune Zero DB site (no deps).
// Run from the wiki/ folder:  node tools/serve.js   ->  http://localhost:8731
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 8731;
const TYPES = { '.html':'text/html', '.json':'application/json', '.js':'text/javascript', '.css':'text/css',
  '.gif':'image/gif', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml' };

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const file = path.join(ROOT, path.normalize(rel));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (e, d) => {
    if (e) { res.writeHead(404); res.end('Not found'); }
    else { res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); res.end(d); }
  });
}).listen(PORT, () => console.log(`Rune Zero DB → http://localhost:${PORT}`));
