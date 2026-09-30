// Logs one line per request AFTER the response is sent, e.g.
// GET /api/v1/books?page=2 200 3.4ms 5f2c...
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms ${req.id}`);
  });
  next();
}
