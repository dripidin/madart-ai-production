const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const ADMIN_DASHBOARD_URL = process.env.ADMIN_DASHBOARD_URL || 'http://localhost:3001';
const SERVE_STATIC_ADMIN =
  process.argv.includes('--static-admin') || process.env.SERVE_STATIC_ADMIN === '1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (_) {
        resolve(raw);
      }
    });
    req.on('error', () => resolve({}));
  });
}

function wrapResponse(res) {
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (payload) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(payload));
    return res;
  };
  return res;
}

function resolveApiHandler(pathname) {
  const rel = pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '');
  const safeRel = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, '');
  const candidates = [
    path.join(ROOT_DIR, 'api', `${safeRel}.js`),
    path.join(ROOT_DIR, 'api', safeRel, 'index.js'),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      return file;
    }
  }
  return null;
}

async function handleApi(req, res, parsedUrl) {
  const handlerPath = resolveApiHandler(parsedUrl.pathname);
  if (!handlerPath) {
    wrapResponse(res).status(404).json({ error: 'API route not found' });
    return;
  }

  req.query = Object.fromEntries(parsedUrl.searchParams.entries());
  req.body = await readBody(req);
  wrapResponse(res);

  try {
    // Load dynamically without stale cache in dev if modified
    delete require.cache[require.resolve(handlerPath)];
    const fn = require(handlerPath);
    const handler = typeof fn === 'function' ? fn : fn.default;
    await handler(req, res);
  } catch (err) {
    console.error(`[dev-server] Error in ${parsedUrl.pathname}:`, err);
    if (!res.writableEnded) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }
}

function serveStatic(req, res, parsedUrl) {
  let reqPath = decodeURIComponent(parsedUrl.pathname);
  if (reqPath === '/') reqPath = '/index.html';

  // Block secret & server internals from public static HTTP access
  const lower = reqPath.toLowerCase();
  if (
    lower.startsWith('/api/') ||
    lower.startsWith('/data/secrets.json') ||
    lower.startsWith('/data/notifications.json') ||
    lower.startsWith('/scripts/') ||
    lower.startsWith('/admin-dashboard/')
  ) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  let target = path.resolve(ROOT_DIR, '.' + reqPath);
  if (target.startsWith(ROOT_DIR) && fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, 'index.html');
  }
  if (!target.startsWith(ROOT_DIR) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  const ext = path.extname(target).toLowerCase();
  res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
  fs.createReadStream(target).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (parsedUrl.pathname === '/admin' || parsedUrl.pathname.startsWith('/admin/')) {
    const hasStaticAdmin = fs.existsSync(path.join(ROOT_DIR, 'admin', 'index.html'));
    if (SERVE_STATIC_ADMIN && hasStaticAdmin) {
      serveStatic(req, res, parsedUrl);
      return;
    }
    res.statusCode = 302;
    res.setHeader('Location', `${ADMIN_DASHBOARD_URL}${parsedUrl.pathname}${parsedUrl.search}`);
    res.end();
    return;
  }

  if (parsedUrl.pathname.startsWith('/api/')) {
    await handleApi(req, res, parsedUrl);
    return;
  }

  serveStatic(req, res, parsedUrl);
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[MadeArt Server] Public site + API running at http://localhost:${PORT}`);
    console.log(`[MadeArt Server] Admin dashboard URL: ${ADMIN_DASHBOARD_URL}`);
  });
}

module.exports = { server, resolveApiHandler };
