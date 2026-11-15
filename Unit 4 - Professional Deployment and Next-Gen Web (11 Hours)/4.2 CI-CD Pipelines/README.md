<div align="center">

![Header](https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80)

# 🔁 Topic 4.2 — CI/CD Pipelines

### GitHub Actions · Automated tests · Build & push images · IaC (Terraform) basics

### Assignment 4.2: add a GitHub Actions workflow that tests, builds, and (optionally) pushes `users-api`

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_4-Topic_4.2-f97316?style=for-the-badge)

![Actions](https://img.shields.io/badge/GitHub_Actions-CI-2088FF?style=flat-square&logo=githubactions&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-concepts-7B42BC?style=flat-square&logo=terraform&logoColor=white)

</div>

---

## 📑 Contents

| Part | Topic |
|------|-------|
| [0](#0-concepts-read-first) | CI vs CD, pipeline stages, IaC |
| [A](#part-a-github-actions-ci) | Workflow: lint/test on PR |
| [B](#part-b-build-and-push) | Build Docker image on `main` |
| [C](#part-c-terraform-basics) | Tiny Terraform snippet (local / concepts) |
| [📤](#-what-to-submit) | Submission and marking |

> 📌 **Before you start:** Assignment 4.1 merged (Dockerfile exists).
>
> ```bash
> cd users-api
> git checkout -b assignment-4.2
> mkdir -p .github/workflows terraform
> ```

---

## 0. Concepts (read first)

| Term | Meaning |
|------|---------|
| **CI** | Every push/PR: install, test, (lint) automatically |
| **CD** | Deliver artifact / deploy to an environment |
| **Pipeline** | Ordered jobs: test → build → push → deploy |
| **IaC** | Infra defined in code (Terraform, Pulumi, CloudFormation) |

Never store cloud secrets in the repo — use GitHub **Secrets** / OIDC.

---

## Part A: GitHub Actions CI

### A.1 `.github/workflows/ci.yml`

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: users
          POSTGRES_PASSWORD: users
          POSTGRES_DB: users_api_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U users -d users_api_test"
          --health-interval 5s
          --health-retries 10
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
          --health-retries 10
    env:
      DATABASE_URL: postgres://users:users@localhost:5432/users_api_test
      REDIS_URL: redis://localhost:6379
      JWT_SECRET: ci-test-secret-not-for-production
      NODE_ENV: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm test
```

Adjust env var names to match your `env.js`. Mock RabbitMQ in unit tests so CI stays simple.

---

## Part B: Build and push

### B.1 `.github/workflows/image.yml`

```yaml
name: image
on:
  push:
    branches: [main]

jobs:
  docker:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/users-api:latest
            ghcr.io/${{ github.repository_owner }}/users-api:${{ github.sha }}
```

If GHCR push is blocked for the student org, set `push: false` and still show a green build in Actions.

---

## Part C: Terraform basics

### C.1 `terraform/main.tf` (teaching stub)

```hcl
terraform {
  required_version = ">= 1.5"
}

# Concept only for class laptops without cloud keys:
# A real lab would create an ECR repo / Resource Group.
# Document what you WOULD apply:

# provider "aws" { region = "ap-south-1" }
# resource "aws_ecr_repository" "users_api" {
#   name = "users-api"
# }

output "next_step" {
  value = "Wire AWS/GCP credentials via OIDC; never commit access keys."
}
```

```bash
cd terraform && terraform init && terraform plan
```

---

## 📤 What to submit

1. PR with workflows + terraform stub  
2. Screenshot of green GitHub Actions run on your PR  
3. Short answers: CI vs CD; why run Postgres as a service container in Actions; what problem Terraform solves vs clicking in a cloud console  

## 🧮 Marking (10)

| Criteria | Marks |
|----------|:-----:|
| CI workflow runs tests on PR | 4 |
| Image build workflow (push or build-only) | 3 |
| Terraform stub + explanation | 1 |
| Screenshots / short answers | 2 |

### ⭐ Bonus (+2)
Add `npm audit --audit-level=high` as a CI step that fails the job on high vulns.

---

<div align="center">

⬅️ [Topic 4.1](../4.1%20Infrastructure%20and%20Cloud/README.md)  ·  **Topic 4.2**  ·  [Topic 4.3 ➡️](../4.3%20Monitoring%20and%20Observability/README.md)

</div>
