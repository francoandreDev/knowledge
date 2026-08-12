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
