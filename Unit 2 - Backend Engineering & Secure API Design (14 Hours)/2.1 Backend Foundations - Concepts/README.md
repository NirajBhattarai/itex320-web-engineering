<div align="center">

![Header](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80)

# 🧱 Topic 2.1 — Backend Foundations: Concepts

### Web Servers · Reverse Proxies · The Node.js Event Loop · RESTful API Design

![Course](https://img.shields.io/badge/ITEX_320-Web_Engineering-1f6feb?style=for-the-badge)
![Unit](https://img.shields.io/badge/Unit_2-Topic_2.1-8250df?style=for-the-badge)
![Hours](https://img.shields.io/badge/Contact_Hours-~3h-f59e0b?style=for-the-badge)

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22_LTS-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?style=flat-square&logo=nginx&logoColor=white)
![Modules](https://img.shields.io/badge/Modules-ESM-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Security](https://img.shields.io/badge/Security-TLS_at_Edge-success?style=flat-square&logo=letsencrypt&logoColor=white)
![Spec](https://img.shields.io/badge/Errors-RFC_9457-blue?style=flat-square)

<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="56" alt="Node.js" />&nbsp;&nbsp;
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="56" alt="Express" />&nbsp;&nbsp;
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg" width="56" alt="Nginx" />&nbsp;&nbsp;
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" width="56" alt="Linux" />

</div>

## 📂 Read in this order

These pages are the **theory** for Topic 2.1. Read them before (or alongside) the hands-on **[Assignment 2.1](../2.1%20Backend%20Foundations/README.md)**, where you scaffold the `users-api` project.

| # | Page | What's inside | Time |
|:-:|------|---------------|:----:|
| 1 | [🌐 Web Servers vs. Reverse Proxies](1-Web-Servers-and-Reverse-Proxies.md) | Web vs. app servers, reverse proxies, Nginx master/worker model, production `nginx.conf` | ~40 min |
| 2 | [🔄 The Node.js Event Loop](2-Nodejs-Event-Loop.md) | V8 + libuv, loop phases, microtasks vs. macrotasks, blocking the loop & worker threads | ~50 min |
| 3 | [🧭 RESTful API Design & Best Practices](3-RESTful-API-Design.md) | REST constraints, naming, methods, status codes, RFC 9457 errors, pagination, REST vs. GraphQL vs. gRPC | ~40 min |
| 4 | [✅ Self-Quiz](4-Self-Quiz.md) | 5 exam-style questions with hidden answers. Check yourself before the assignment | ~10 min |

**Then build it →** [🛠️ Assignment 2.1: Users REST API](../2.1%20Backend%20Foundations/README.md) (step-by-step scaffold of `users-api`, which Assignments 2.2–2.5 extend).

**Optional, for extra practice →** [📚 Reference Project: Bookstore](../Reference%20Project%20-%20Bookstore/README.md), a larger full-stack example (users + books, 96 tests, React frontend), plus its [Practice Lab](../Reference%20Project%20-%20Bookstore/Practice-Lab.md) with Nginx load balancing.

---

## 🎯 Learning Outcomes

By the end of this topic, you will be able to:

| # | Outcome | Bloom's Level |
|---|---------|---------------|
| 1 | **Differentiate** web servers, application servers, reverse proxies, load balancers and API gateways | Analyze |
| 2 | **Configure** Nginx as a TLS-terminating reverse proxy in front of multiple Node.js processes | Apply |
| 3 | **Predict** the execution order of synchronous code, `process.nextTick`, Promises, timers and `setImmediate` | Analyze |
| 4 | **Diagnose** and **fix** a blocked event loop using `worker_threads` and event-loop-delay metrics | Evaluate |
| 5 | **Design** a resource-oriented REST API with correct methods, status codes, pagination and error format | Create |

---

## 📚 Further Reading

| Resource | Why |
|----------|-----|
| [Node.js: The Event Loop, Timers, and `process.nextTick()`](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick) | Official deep dive on the loop phases |
| [Node.js: Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop) | ReDoS, JSON DoS, partitioning vs. offloading |
| [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html) | Async error handling, path syntax changes |
| [Express behind proxies](https://expressjs.com/en/guide/behind-proxies.html) | `trust proxy` values explained |
| [Nginx: Inside NGINX (architecture)](https://blog.nginx.org/blog/inside-nginx-how-we-designed-for-performance-scale) | Master/worker, event-driven design |
| [Nginx reverse proxy docs](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/) | `proxy_pass`, headers, buffering |
| [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) | Authoritative definitions of methods and status codes |
| [RFC 9457: Problem Details](https://www.rfc-editor.org/rfc/rfc9457) | Standard error format |
| [Fielding, R. (2000), Ch. 5: REST](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) | The original definition of REST |
| Kleppmann, M. (2017). *Designing Data-Intensive Applications*, Ch. 4 | Encoding, REST vs. RPC, evolvability |

---

<div align="center">

**ITEX 320 · Web Engineering · Unit 2: Backend Engineering & Secure API Design**

⬅️ Unit 1: Modern Frontend Engineering  ·  **Topic 2.1 Concepts**  ·  [Assignment 2.1: build the Users API ➡️](../2.1%20Backend%20Foundations/README.md)

</div>
