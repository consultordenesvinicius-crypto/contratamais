const http = require('http');
const url = require('url');
const path = require('path');
const { handleApiRequest, handleWhatsappWebhook } = require('./controllers/api');
const { serveStaticFile } = require('./utils/static');
const { log } = require('./utils/logger');
const { loadEnv } = require('./utils/env');

loadEnv();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;

  log(`Requisição recebida: ${req.method} ${pathname}`);

  if (await handleWhatsappWebhook(req, res, parsedUrl)) {
    return;
  }

  if (pathname.startsWith('/api/')) {
    await handleApiRequest(req, res, parsedUrl);
    return;
  }

  if (req.method === 'GET' && (pathname === '/' || pathname === '/admin')) {
    serveStaticFile(res, path.join(__dirname, '..', 'public', 'admin.html'));
    return;
  }

  if (req.method === 'GET') {
    const filePath = path.join(__dirname, '..', 'public', pathname);
    serveStaticFile(res, filePath);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Rota não encontrada.' }));
});

server.listen(PORT, () => {
  log(`Servidor iniciado na porta ${PORT}`);
});
