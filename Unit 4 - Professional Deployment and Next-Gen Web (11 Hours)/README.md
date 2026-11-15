# Unit 4 — Professional Deployment and Next-Gen Web (11 Hours)

Takes `users-api` (and a small frontend) from “runs on my laptop” to deployable, observable, and modern-client ready.

| Topic | Focus | Assignment |
|-------|--------|------------|
| [4.1 Infrastructure & Cloud](./4.1%20Infrastructure%20and%20Cloud/README.md) | Docker multi-stage, Compose app services, K8s basics | Containerise API + worker |
| [4.2 CI/CD Pipelines](./4.2%20CI-CD%20Pipelines/README.md) | GitHub Actions, image build, Terraform concepts | CI on PR + image workflow |
| [4.3 Monitoring & Observability](./4.3%20Monitoring%20and%20Observability/README.md) | Logs, Prometheus metrics, Grafana, Sentry | `/metrics` + scrape stack |
| [4.4 Deployment Strategies](./4.4%20Deployment%20Strategies/README.md) | Rolling, canary, blue/green, scaling | Health probes + canary + runbook |
| [4.5 PWA Fundamentals](./4.5%20PWA%20Fundamentals/README.md) | Manifest, service worker, offline | Installable frontend PWA |
| [4.6 Modern Trends](./4.6%20Modern%20Trends/README.md) | Edge, Wasm, WebSockets | Real-time hub + trend labs |

```text
After Unit 4
├── Dockerfile + k8s/
├── .github/workflows/
├── observability/ (Prometheus)
├── gateway/ (canary weights, /ws upgrade)
└── frontend PWA (manifest + sw.js)
```
