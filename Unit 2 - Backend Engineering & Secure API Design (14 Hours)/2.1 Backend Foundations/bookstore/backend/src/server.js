import { createApp } from './app.js';
import { config } from './config/env.js';
import { createContainer } from './container.js';
import { seedDatabase } from './data/seed.js';

const container = createContainer();
if (config.seedData) await seedDatabase(container); // top-level await works in ES modules

const app = createApp(container);

const server = app.listen(config.port, config.host, () => {
  console.log(`📚 Bookstore API on http://${config.host}:${config.port} (${config.env}, pid ${process.pid})`);
});

// Must outlive the reverse proxy's idle timeout (Nginx default 60s) to avoid random 502s.
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

// Graceful shutdown: stop accepting new connections, finish in-flight requests, then exit.
function shutdown(signal) {
  console.log(`${signal} received — shutting down`);
  server.close(() => process.exit(0));
  server.closeIdleConnections();
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
