> 📍 **ITEX 320** › **Unit 2** › [**2.1 Backend Foundations: Concepts**](README.md) › RESTful API Design & Best Practices

# 🧭 RESTful API Design & Best Practices

### C.1 REST in one paragraph

**REST** (Representational State Transfer, Roy Fielding, 2000) is an architectural style, not a protocol. You model your domain as **resources** (nouns) identified by **URIs**, and manipulate them through a **uniform interface** (HTTP methods). Every request is **stateless**: it carries everything the server needs (e.g. a token), so any server instance can handle it. That's exactly what lets Nginx load-balance freely across Node processes.

| REST Constraint | What it means for your Express API |
|-----------------|-----------------------------------|
| Client–server | The React SPA (Unit 1) and the API evolve independently |
| **Stateless** | No per-user memory on the server between requests; auth travels in each request |
| Cacheable | Responses declare cacheability (`Cache-Control`, `ETag`) |
| **Uniform interface** | Same verbs, status codes and error shape everywhere |
| Layered system | Client can't tell if it hits Nginx, a CDN or Node, which makes proxies transparent |
| Code on demand *(optional)* | Server may send executable code (rarely used in APIs) |

### C.2 Resource naming

| ✅ Do | ❌ Don't | Rule |
|------|---------|------|
| `GET /api/v1/books` | `GET /api/v1/getAllBooks` | Nouns, not verbs: the HTTP method *is* the verb |
| `GET /api/v1/books/42` | `GET /api/v1/book?id=42` | Plural collections; identity in the path |
| `GET /api/v1/authors/7/books` | `GET /api/v1/booksByAuthor/7` | Nest to express ownership (max ~2 levels deep) |
| `GET /api/v1/books?author=kleppmann&sort=-year` | `GET /api/v1/books/sortedByYearDesc` | Filtering, sorting and paging go in the query string |
| `POST /api/v1/orders/9/cancellation` | `POST /api/v1/cancelOrder/9` | Model actions as sub-resources when you can |
| `/api/v1/order-items` | `/api/v1/OrderItems`, `/api/v1/order_items` | lowercase **kebab-case** in URLs |

### C.3 HTTP methods: safety & idempotency

| Method | Purpose | **Safe**¹ | **Idempotent**² | Request body | Typical success |
|--------|---------|:---:|:---:|:---:|---|
| `GET` | Read resource(s) | ✅ | ✅ | ❌ | `200 OK` |
| `HEAD` | Same as GET, headers only | ✅ | ✅ | ❌ | `200 OK` |
| `OPTIONS` | Discover allowed methods (CORS preflight) | ✅ | ✅ | ❌ | `204 No Content` |
| `POST` | Create / trigger processing | ❌ | ❌ | ✅ | `201 Created` + `Location` |
| `PUT` | **Replace** a resource entirely | ❌ | ✅ | ✅ | `200 OK` / `204` |
| `PATCH` | **Partially** update a resource | ❌ | ❌³ | ✅ | `200 OK` |
| `DELETE` | Remove a resource | ❌ | ✅ | ❌ | `204 No Content` |

¹ **Safe**: does not change server state. Crawlers and prefetchers may call it freely.
² **Idempotent**: calling it N times has the same effect as calling it once. Safe to **retry** after a network timeout.
³ `PATCH` *can* be idempotent (e.g. `{ "year": 2018 }`) but isn't guaranteed to be (e.g. `{ "op": "increment" }`).

> ⚠️ **Security Warning:** **Never** change state in a `GET` handler (e.g. `GET /users/5/delete`). Browsers prefetch links, crawlers follow them, and an `<img src="https://bank.com/transfer?to=attacker">` tag makes a victim's browser send an authenticated GET. That's the classic CSRF vector covered in Topic 2.5.

### C.4 Status codes you'll actually use

| Code | Name | When to return it |
|------|------|-------------------|
| **200** | OK | Successful GET / PUT / PATCH with a body |
| **201** | Created | Successful POST; include a `Location` header |
| **204** | No Content | Successful DELETE, or update with nothing to return |
| **304** | Not Modified | Client's cached `ETag` is still valid |
| **400** | Bad Request | Malformed JSON, validation failure |
| **401** | Unauthorized | Missing or invalid credentials. It really means *unauthenticated* (Topic 2.3) |
| **403** | Forbidden | Authenticated but not allowed (RBAC/ABAC, Topic 2.3) |
| **404** | Not Found | Resource doesn't exist, **or** you want to hide that it exists |
| **409** | Conflict | Duplicate email, version conflict |
| **413** | Content Too Large | Body exceeds limit (Nginx `client_max_body_size` / `express.json({ limit })`) |
| **415** | Unsupported Media Type | Client sent XML to a JSON-only endpoint |
| **422** | Unprocessable Content | Syntactically valid but semantically wrong (alternative to 400 for validation) |
| **429** | Too Many Requests | Rate limit hit; include `Retry-After` (Topic 2.5) |
| **500** | Internal Server Error | Unhandled bug. **Never** leak the stack trace |
| **502 / 503 / 504** | Bad Gateway / Unavailable / Gateway Timeout | Returned by **Nginx** when Node is down, overloaded or too slow |

### C.5 One consistent error format: RFC 9457 Problem Details

Clients should never have to guess the error shape. [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) standardizes it with `Content-Type: application/problem+json`:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Request body failed validation",
  "instance": "/api/v1/books",
  "requestId": "bd66b569-9774-442b-a6bf-0fdd5191a849",
  "errors": [
    { "field": "author", "message": "must be a non-empty string" },
    { "field": "year", "message": "must be a valid integer year" }
  ]
}
```

### C.6 Pagination, filtering, sorting & versioning

| Concern | Recommended convention | Example |
|---------|----------------------|---------|
| **Pagination (offset)** | `page` + `limit`, cap `limit` server-side | `?page=2&limit=20` |
| **Pagination (cursor)** | Opaque `cursor` for large or real-time feeds; avoids skipped or duplicated rows | `?cursor=eyJpZCI6NDJ9&limit=20` |
| **Filtering** | Field name = value | `?author=kleppmann&year=2017` |
| **Sorting** | Field name, `-` prefix for descending, **whitelist allowed fields** | `?sort=-year` |
| **Sparse fields** | Comma list | `?fields=id,title` |
| **Versioning** | URI prefix (simplest, most visible) | `/api/v1/...` → `/api/v2/...` |

> 💡 **Pro-Tip:** Always **whitelist** sortable and filterable fields. Passing `req.query.sort` straight into a database `ORDER BY` is an injection vector, and sorting by `passwordHash` leaks information one comparison at a time.

### C.7 REST vs. GraphQL vs. gRPC

| | **REST** | **GraphQL** | **gRPC** |
|---|---|---|---|
| Transport | HTTP/1.1 or 2, JSON | HTTP, single `POST /graphql` endpoint | HTTP/2, Protocol Buffers (binary) |
| Contract | OpenAPI (optional) | Strongly typed schema (required) | `.proto` files (required) |
| Fetching | Fixed response per endpoint (over-/under-fetching possible) | Client asks for exactly the fields it needs | Fixed RPC messages |
| HTTP caching | ✅ Native (URLs + `ETag`) | ❌ Harder (everything is POST) | ❌ |
| Browser support | ✅ Native | ✅ Native | ⚠️ Needs gRPC-Web proxy |
| Best for | Public APIs, CRUD, cacheable resources | Complex UIs aggregating many resources | Internal service-to-service, low latency |
| Covered in | **This unit** | Unit 3.5 | Unit 3.5 |

---

| [⬅️ 🔄 The Node.js Event Loop](2-Nodejs-Event-Loop.md) | [🏠 2.1 Concepts](README.md) | [✅ Self-Quiz ➡️](4-Self-Quiz.md) |
|:---|:---:|---:|
