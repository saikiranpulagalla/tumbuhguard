import { createReadStream, promises as fs } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT ?? process.argv[2] ?? 4173);
const mime = new Map([
  ['.css', 'text/css; charset=utf-8'], ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'], ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'], ['.webmanifest', 'application/manifest+json; charset=utf-8'],
]);

function insideRoot(candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

async function fileFor(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return { status: 400 }; }
  const requested = decoded === '/' ? '/index.html' : decoded;
  const candidate = path.resolve(root, `.${requested}`);
  if (!insideRoot(candidate)) return { status: 403 };
  try {
    if ((await fs.stat(candidate)).isFile()) return { file: candidate };
  } catch { /* Navigation fallback is handled below. */ }
  if (path.extname(requested)) return { status: 404 };
  return { file: path.join(root, 'index.html') };
}

const server = http.createServer(async (request, response) => {
  if (!request.url || !['GET', 'HEAD'].includes(request.method ?? '')) { response.writeHead(405).end(); return; }
  const { pathname } = new URL(request.url, 'http://127.0.0.1');
  const resolved = await fileFor(pathname);
  if (!resolved.file) { response.writeHead(resolved.status ?? 404).end(); return; }
  const headers = { 'Content-Type': mime.get(path.extname(resolved.file)) ?? 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' };
  response.writeHead(200, headers);
  if (request.method === 'HEAD') { response.end(); return; }
  createReadStream(resolved.file).pipe(response);
});

server.listen(port, '127.0.0.1', () => console.log(`READY http://127.0.0.1:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
