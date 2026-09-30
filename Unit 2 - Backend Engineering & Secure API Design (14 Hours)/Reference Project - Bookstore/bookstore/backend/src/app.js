import express from 'express';
import { config } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { requestId } from './middleware/request-id.js';
import { requestLogger } from './middleware/request-logger.js';
import { createApiRouter } from './routes/index.js';

// Builds the Express app. Does NOT call listen() — server.js does that,
// and tests pass the app straight to Supertest.
export function createApp(container) {
  const app = express();

  app.disable('x-powered-by'); // don't advertise the framework
  app.set('trust proxy', 'loopback'); // trust X-Forwarded-* only from a local proxy (Nginx)

  // ── 1. Pre-route middleware (runs top to bottom for every request) ──
  app.use(requestId);
  if (!config.isTest) app.use(requestLogger); // keep test output clean
  app.use(express.json({ limit: config.bodyLimit }));

  // ── 2. Routes ──
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptimeSec: Math.round(process.uptime()) });
  });
  app.use('/api/v1', createApiRouter(container));

  // ── 3. Fallbacks (order matters: these must be LAST) ──
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
