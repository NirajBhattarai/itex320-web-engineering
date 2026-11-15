<div align="center">

![Header](https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80)

# ☁️ Topic 4.1 — Infrastructure & Cloud Platforms

### Cloud basics · Docker images · Multi-stage builds · Kubernetes fundamentals

### Assignment 4.1: containerise `users-api` (API + worker) and run the stack with Compose / optional K8s manifests

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_4-Topic_4.1-f97316?style=for-the-badge)

![Docker](https://img.shields.io/badge/Docker-multi--stage-2496ED?style=flat-square&logo=docker&logoColor=white)
![K8s](https://img.shields.io/badge/Kubernetes-fundamentals-326CE5?style=flat-square&logo=kubernetes&logoColor=white)
![Cloud](https://img.shields.io/badge/AWS_GCP_Azure-concepts-FF9900?style=flat-square)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | Cloud shared responsibility, containers vs VMs, K8s mental model |
| [A](#part-a-dockerfile) | Multi-stage `Dockerfile` for `users-api` |
| [B](#part-b-compose-production-shaped) | Compose: api + worker + postgres + redis + rabbitmq + gateway |
| [C](#part-c-kubernetes-fundamentals) | Deployment + Service manifests (minikube/kind optional) |
| [D](#part-d-try-it) | Try it |
| [📤](#-what-to-submit) | Submission and marking |

> 📌 **Before you start:** Unit 3 complete (`users-api` through 3.6). Then:
>
> ```bash
> cd users-api
> git checkout main && git pull
> git checkout -b assignment-4.1
> mkdir -p k8s
> ```

---

## 0. Concepts (read first)

### 0.1 Cloud platforms (AWS / GCP / Azure)

| Idea | Meaning |
|------|---------|
| **IaaS** | VMs, networks, disks (EC2, Compute Engine) |
| **PaaS** | Run containers/apps without managing nodes (ECS/Fargate, Cloud Run, App Service) |
| **CaaS / K8s** | Orchestrate containers (EKS, GKE, AKS) |

**Shared responsibility:** cloud secures the building; you secure the app, secrets, IAM, and data.

### 0.2 Containers vs VMs

| | VM | Container |
|---|---|---|
| Isolation | Full guest OS | Process + namespaces |
| Start time | Minutes | Seconds |
| Image | Disk snapshot | Layers (Dockerfile) |

### 0.3 Kubernetes in one picture

| Object | Job |
|--------|-----|
| **Pod** | One or more containers, smallest deploy unit |
| **Deployment** | Desired replica count + rolling updates |
| **Service** | Stable DNS/IP in front of Pods |
| **Ingress** | HTTP routing from outside (like Nginx gateway) |

---

## Part A: Dockerfile

### A.1 Multi-stage `Dockerfile` (project root)

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY src ./src
COPY openapi ./openapi
COPY proto ./proto
COPY worker ./worker
RUN npx prisma generate

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY package.json ./
COPY prisma ./prisma
COPY src ./src
COPY openapi ./openapi
COPY proto ./proto
COPY worker ./worker
USER app
EXPOSE 3000
CMD ["node", "--env-file-if-exists=.env", "src/server.js"]
```

Build & smoke:

```bash
docker build -t users-api:4.1 .
docker run --rm -p 3000:3000 --env-file .env users-api:4.1
```

Worker image can reuse the same Dockerfile with a different command in Compose.

---

## Part B: Compose (production-shaped)

Move the API **into** Compose (not only DBs on Docker):

```yaml
  api:
    build: .
    image: users-api:4.1
    env_file: .env
    environment:
      DATABASE_URL: postgres://users:users@postgres:5432/users_api
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://users:users@rabbitmq:5672
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }
      rabbitmq: { condition: service_healthy }
    ports:
      - "3000:3000"

  worker:
    image: users-api:4.1
    command: ["node", "--env-file-if-exists=.env", "worker/notifications.worker.js"]
    env_file: .env
    environment:
      RABBITMQ_URL: amqp://users:users@rabbitmq:5672
    depends_on:
      rabbitmq: { condition: service_healthy }
```

Point the gateway `proxy_pass` at `http://api:3000` instead of `host.docker.internal`.

```bash
docker compose up -d --build
curl -s http://127.0.0.1:8080/healthz
curl -s http://127.0.0.1:3000/openapi.json | head
```

---

## Part C: Kubernetes fundamentals

### C.1 `k8s/api-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: users-api
spec:
  replicas: 2
  selector:
    matchLabels: { app: users-api }
  template:
    metadata:
      labels: { app: users-api }
    spec:
      containers:
        - name: api
          image: users-api:4.1
          ports: [{ containerPort: 3000 }]
          envFrom:
            - secretRef: { name: users-api-env }
          readinessProbe:
            httpGet: { path: /openapi.json, port: 3000 }
            initialDelaySeconds: 5
          livenessProbe:
            httpGet: { path: /openapi.json, port: 3000 }
            initialDelaySeconds: 15
---
apiVersion: v1
kind: Service
metadata:
  name: users-api
spec:
  selector: { app: users-api }
  ports:
    - port: 80
      targetPort: 3000
```

Optional local cluster:

```bash
kind create cluster   # or minikube start
kind load docker-image users-api:4.1
kubectl apply -f k8s/
kubectl get pods,svc
```

If you cannot run kind/minikube, still ship the YAML and explain each field in short answers.

---

## Part D: Try it

```bash
docker compose up -d --build
docker compose ps
docker compose logs api --tail=50
```

```bash
git add .
git commit -m "feat(deploy): multi-stage Docker image and K8s Deployment/Service manifests"
git push -u origin assignment-4.1
```

---

## 📤 What to submit

1. PR `assignment-4.1` → `main`
2. Screenshots: `docker compose ps`, successful curl via gateway, `kubectl get pods` **or** annotated YAML walkthrough if no cluster
3. Short answers:
   1. Why multi-stage builds shrink production images?
   2. Deployment vs Service in Kubernetes?
   3. One reason to prefer a managed container platform (Cloud Run / Fargate) over self-managed VMs for this API?

## 🧮 Marking (10)

| Criteria | Marks |
|----------|:-----:|
| Working multi-stage Dockerfile | 3 |
| Compose runs api + worker + deps | 3 |
| K8s Deployment + Service (applied or well-explained) | 2 |
| Screenshots / short answers | 2 |

### ⭐ Bonus (+2)
Push `users-api:4.1` to GHCR or Docker Hub and pull it in Compose by image name.

---

<div align="center">

**Topic 4.1**  ·  [Topic 4.2: CI/CD Pipelines ➡️](../4.2%20CI-CD%20Pipelines/README.md)

</div>
