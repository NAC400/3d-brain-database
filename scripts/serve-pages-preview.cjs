const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const root = path.resolve(__dirname, '../frontend/build');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.gltf': 'model/gltf+json', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  let file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) && file !== root) { response.writeHead(403).end(); return; }
  if (file === root || !path.extname(file)) file = path.join(root, 'index.html');
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404).end(); return; }
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': fs.statSync(file).size });
  fs.createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`Pages preview: http://127.0.0.1:${port}`));
