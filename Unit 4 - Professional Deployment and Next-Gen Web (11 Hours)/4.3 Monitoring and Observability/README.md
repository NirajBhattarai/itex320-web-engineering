<div align="center">

![Header](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80)

# 📈 Topic 4.3 — Monitoring & Observability

### Logs · Metrics · Tracing · Prometheus / Grafana · Sentry

### Assignment 4.3: add structured logs, a `/metrics` endpoint, and error reporting hooks to `users-api`

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_4-Topic_4.3-f97316?style=for-the-badge)

![Prometheus](https://img.shields.io/badge/Prometheus-metrics-E6522C?style=flat-square&logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-dashboards-F46800?style=flat-square&logo=grafana&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-errors-362D59?style=flat-square&logo=sentry&logoColor=white)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | Three pillars of observability |
| [A](#part-a-structured-logging) | JSON logs + request id |
| [B](#part-b-prometheus-metrics) | `prom-client` + `/metrics` |
| [C](#part-c-errors--sentry) | Capture 5xx (Sentry optional) |
| [D](#part-d-compose-prometheus--grafana) | Scrape & dashboard |
| [📤](#-what-to-submit) | Submission and marking |

> ```bash
> cd users-api && git checkout -b assignment-4.3
> npm install prom-client pino pino-http
> # optional: npm install @sentry/node
> mkdir -p observability
> ```

---

## 0. Concepts (read first)

| Pillar | Question | Example |
|--------|----------|---------|
| **Logs** | What happened? | JSON line with `requestId`, route, status |
| **Metrics** | How is the system? | Request rate, latency histogram, error % |
| **Traces** | Where did time go? | Span across gateway → API → DB |

**Sentry** (or similar) groups exceptions for humans; Prometheus stores time series for graphs/alerts.

---

## Part A: Structured logging

Replace ad-hoc `console.log` request logging with **pino** (or keep console but emit JSON):

```js
// src/observability/logger.js
import pino from 'pino';
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'users-api' },
});
```

Middleware: log method, url, status, duration, `req.id` (your 2.1 request-id).

Never log passwords, tokens, or full Authorization headers.

---

## Part B: Prometheus metrics

```js
// src/observability/metrics.js
import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP latency',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export function metricsHandler(_req, res) {
  res.set('Content-Type', register.contentType);
  register.metrics().then((m) => res.end(m));
}
```

```js
app.get('/metrics', metricsHandler);
// Middleware: start timer → on finish observe labels
```

Protect `/metrics` in production (internal network / basic auth). For class, localhost is fine.

---

## Part C: Errors & Sentry

In the error handler, for `status >= 500`:

```js
logger.error({ err, requestId: req.id }, 'unhandled');
// if (env.sentryDsn) Sentry.captureException(err);
```

Optional: set `SENTRY_DSN` and init `@sentry/node` at boot. If you skip Sentry, implement a `/debug/error` **dev-only** route that throws and show it in logs/metrics.

---

## Part D: Compose Prometheus + Grafana

`observability/prometheus.yml`:

```yaml
global:
  scrape_interval: 5s
scrape_configs:
  - job_name: users-api
    static_configs:
      - targets: ["api:3000"]
```

Add services:

```yaml
  prometheus:
    image: prom/prometheus:v2.54.1
    volumes: ["./observability/prometheus.yml:/etc/prometheus/prometheus.yml:ro"]
    ports: ["9090:9090"]
  grafana:
    image: grafana/grafana:11.2.0
    ports: ["3001:3000"]
```

Open Prometheus targets + Grafana explore `http_request_duration_seconds`.

---

## 📤 What to submit

1. PR with logger, `/metrics`, Compose scrape config  
2. Screenshots: Prometheus target UP, a graph, sample JSON log line with request id  
3. Short answers: log vs metric vs trace; why high-cardinality labels (user id) hurt Prometheus; what Sentry adds beyond logs  

## 🧮 Marking (10)

| Criteria | Marks |
|----------|:-----:|
| Structured request logs with request id | 3 |
| `/metrics` with histogram + defaults | 3 |
| Prometheus (and Grafana) wired in Compose | 2 |
| Screenshots / short answers | 2 |

### ⭐ Bonus (+2)
Add an OpenTelemetry trace export **or** a Grafana dashboard JSON committed to the repo.

---

<div align="center">

⬅️ [Topic 4.2](../4.2%20CI-CD%20Pipelines/README.md)  ·  **Topic 4.3**  ·  [Topic 4.4 ➡️](../4.4%20Deployment%20Strategies/README.md)

</div>
