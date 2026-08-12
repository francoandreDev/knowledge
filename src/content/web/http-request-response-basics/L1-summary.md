---
title: "L1 — HTTP request/response basics"
---

- The web runs on a strict **request → response** contract: a client sends one request, the server sends back exactly one response. No response arrives unprompted.
- Every request has three parts: a **request line** (method + path + HTTP version), **headers** (metadata as key/value pairs), and an optional **body**.
- Every response mirrors that shape: a **status line** (HTTP version + status code + reason phrase), **headers**, and an optional **body**.
- **Methods** describe intent: `GET` (fetch, no side effects expected), `POST` (create/submit), `PUT`/`PATCH` (replace/update), `DELETE` (remove). This is a convention, not something the network enforces.
- **Status codes** are grouped by their first digit: `2xx` success, `3xx` redirect, `4xx` client made a mistake, `5xx` server made a mistake.
- HTTP is **stateless** by default — the server treats every request as if it's never seen the client before, unless something (a cookie, a token) carries state across requests explicitly.
- HTTP itself is just **text sent over a TCP connection** — there's no magic underneath it, which is exactly why it's readable with nothing but `curl` or `nc`.
- Key terms: request line, status line, header, body, method, status code, statelessness, connection (TCP), `Host` header, `Content-Type`, `Content-Length`.

## Status code ranges at a glance

| Range | Meaning                                                | Typical example                                        |
| ----- | ------------------------------------------------------ | ------------------------------------------------------ |
| `1xx` | Informational — request received, still processing     | `100 Continue`                                         |
| `2xx` | Success — the request worked                           | `200 OK`, `201 Created`                                |
| `3xx` | Redirection — go look somewhere else                   | `301 Moved Permanently`, `304 Not Modified`            |
| `4xx` | Client error — the request itself was the problem      | `404 Not Found`, `401 Unauthorized`                    |
| `5xx` | Server error — the request was fine, the server failed | `500 Internal Server Error`, `503 Service Unavailable` |
