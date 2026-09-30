> 📍 **ITEX 320** › **Unit 2** › [**2.1 Backend Foundations: Concepts**](README.md) › Self-Quiz

# ✅ Self-Quiz

<details>
<summary><b>1. Why does Node.js handle 10,000 concurrent idle WebSocket connections easily but struggle with 10 concurrent image resizes in pure JS?</b></summary>

Idle connections cost only a small socket handle watched by `epoll`/`kqueue`, with no thread and no CPU. Image resizing in JS is **CPU-bound** and runs on the single main thread, so each one blocks all others. Fix: `worker_threads`, or a native library like Sharp that uses the libuv thread pool (Topic 2.4).
</details>

<details>
<summary><b>2. A client times out on <code>POST /payments</code>. Is it safe to retry automatically? What about <code>PUT /payments/abc</code>?</b></summary>

`POST` is **not idempotent**, so a retry may charge twice. Use an **`Idempotency-Key`** header that the server stores and deduplicates. `PUT` to a known URI **is** idempotent, so retrying produces the same final state.
</details>

<details>
<summary><b>3. In Express behind Nginx, <code>req.ip</code> always shows <code>127.0.0.1</code>. What's wrong, and what's the dangerous "fix"?</b></summary>

`trust proxy` isn't set, so Express ignores `X-Forwarded-For`. The dangerous fix is `app.set('trust proxy', true)` while Node is also reachable directly, because attackers can then spoof their IP. The correct fix is `app.set('trust proxy', 'loopback')` **and** binding Node to `127.0.0.1`.
</details>

<details>
<summary><b>4. What does this print, and why? <code>setTimeout(()=>console.log(1)); Promise.resolve().then(()=>console.log(2)); console.log(3);</code></b></summary>

`3, 2, 1`. Synchronous code runs first, then the microtask queue drains (Promise), and only then does the event loop reach the timers phase.
</details>

<details>
<summary><b>5. Should a request for another user's private order return 403 or 404?</b></summary>

Often **404**. Returning 403 confirms the order exists, which leaks information (an enumeration attack). Use 403 when the resource's existence isn't sensitive.
</details>

---

| [⬅️ 🧭 RESTful API Design & Best Practices](3-RESTful-API-Design.md) | [🏠 2.1 Concepts](README.md) | [🛠️ Now build it: Assignment 2.1 ➡️](../2.1%20Backend%20Foundations/README.md) |
|:---|:---:|---:|
