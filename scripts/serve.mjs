import http from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const port = process.env.PORT ? Number(process.env.PORT) : 4173;
const indexPath = resolve(process.cwd(), 'public/index.html');

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const html = readFileSync(indexPath, 'utf8');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(port, () => {
  console.log(`CityFunRank running at http://localhost:${port}`);
});
