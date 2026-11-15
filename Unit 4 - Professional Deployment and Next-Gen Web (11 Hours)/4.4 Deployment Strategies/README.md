<div align="center">

![Header](https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?auto=format&fit=crop&w=1200&q=80)

# 🚀 Topic 4.4 — Deployment Strategies

### Blue/green · Canary · Rolling updates · Scaling · Health checks

### Assignment 4.4: practise rolling/canary releases with Compose labels + document a blue/green cutover for `users-api`

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_4-Topic_4.4-f97316?style=for-the-badge)

![BlueGreen](https://img.shields.io/badge/Blue%2FGreen-strategy-2563eb?style=flat-square)
![Canary](https://img.shields.io/badge/Canary-releases-eab308?style=flat-square)
![Scale](https://img.shields.io/badge/Horizontal-scaling-16a34a?style=flat-square)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | Strategies compared |
| [A](#part-a-health-and-readiness) | `/healthz` + `/readyz` |
| [B](#part-b-rolling--scale-with-compose) | `docker compose up --scale` |
| [C](#part-c-canary-with-nginx-weights) | Split traffic 90/10 |
| [D](#part-d-bluegreen-runbook) | Written cutover runbook |
| [📤](#-what-to-submit) | Submission and marking |

> ```bash
> cd users-api && git checkout -b assignment-4.4
> ```

---

## 0. Concepts (read first)

| Strategy | How | Risk | Rollback |
|----------|-----|------|----------|
| **Recreate** | Stop old, start new | Downtime | Redeploy old image |
| **Rolling** | Replace instances gradually | Mixed versions briefly | Stop rollout |
| **Blue/green** | Two full stacks; flip gateway | Extra cost | Flip back |
| **Canary** | Send small % to new version | Limited blast radius | Shift traffic to 0% |

**Horizontal scaling:** more replicas behind a load balancer. Needs **stateless** API (your JWTs + Redis sessions already help). Sticky sessions are a smell for APIs.

---

## Part A: Health and readiness

```js
// liveness: process up
app.get('/healthz', (_req, res) => res.status(200).type('text/plain').send('ok'));

// readiness: dependencies reachable
app.get('/readyz', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.status(200).type('text/plain').send('ready');
  } catch {
    res.status(503).type('text/plain').send('not-ready');
  }
});
```

Gateway and K8s probes should use these paths (update 4.1 probes if needed).

---

## Part B: Rolling / scale with Compose

```bash
docker compose up -d --scale api=3 --no-recreate
docker compose ps
curl -s http://127.0.0.1:8080/api/v1/…   # via gateway load-balancing if configured
```

For true LB with multiple `api` replicas, give the gateway an upstream with multiple servers or use Compose DNS (`api:3000` round-robins in some setups — document what you observe).

---

## Part C: Canary with Nginx weights

Run two image tags:

```bash
docker compose up -d api          # stable :blue  → host api_blue:3000
docker compose up -d api_canary   # candidate :green
```

Gateway snippet:

```nginx
upstream users_api {
  server api:3000     weight=9;
  server api_canary:3000 weight=1;
}
```

Hit the gateway 20 times; count `X-App-Version` headers you add in middleware (`process.env.APP_VERSION`).

---

## Part D: Blue/green runbook

Write `docs/BLUE_GREEN.md` with steps:

1. Deploy **green** stack (new image) with its own Compose project name  
2. Run smoke: `/readyz`, login, one CRUD  
3. Flip gateway upstream from blue → green  
4. Watch metrics/error rate 15 minutes  
5. Decommission blue **or** keep as instant rollback  

Include a rollback section (flip upstream back).

---

## 📤 What to submit

1. PR with health endpoints, canary nginx snippet, `BLUE_GREEN.md`  
2. Screenshots: scaled replicas; canary header counts; runbook excerpt  
3. Short answers: rolling vs blue/green; why readiness ≠ liveness; what breaks if the API stores uploads only on local disk when scaling to 3 replicas  

## 🧮 Marking (10)

| Criteria | Marks |
|----------|:-----:|
| `/healthz` + `/readyz` | 2 |
| Scale demo or documented LB behaviour | 2 |
| Canary weights + version header | 3 |
| Blue/green runbook quality | 2 |
| Short answers | 1 |

### ⭐ Bonus (+2)
Automate canary promotion in Actions (manual `workflow_dispatch` that patches nginx config).

---

<div align="center">

⬅️ [Topic 4.3](../4.3%20Monitoring%20and%20Observability/README.md)  ·  **Topic 4.4**  ·  [Topic 4.5 ➡️](../4.5%20PWA%20Fundamentals/README.md)

</div>
