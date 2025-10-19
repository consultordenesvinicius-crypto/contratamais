import express from 'express';
import cors from 'cors';

import env from './config/env';
import clientsRoute from './routes/clientsRoute';
import healthRoute from './routes/healthRoute';
import messagesRoute from './routes/messagesRoute';
import webhookRoute from './routes/webhookRoute';
import logger from './utils/logger';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

app.use('/api/health', healthRoute);
app.use('/api/clients', clientsRoute);
app.use('/api/messages', messagesRoute);
app.use('/api/webhooks/whatsapp', webhookRoute);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ error }, 'Unhandled error');
  res.status(500).json({ message: 'Internal server error' });
});

export function start() {
  app.listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT}`);
  });
}

export default app;
