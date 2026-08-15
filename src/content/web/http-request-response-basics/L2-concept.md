---
title: "L2 — HTTP request/response basics"
---

## What actually happens between "click" and "page appears"?

```mermaid
sequenceDiagram
    participant C as Client (browser, curl, fetch)
    participant S as Server

    C->>S: Open TCP connection
    C->>S: HTTP request (request line, headers, body?)
    Note over S: Parse request, route to a handler, build a response
    S->>C: HTTP response (status line, headers, body?)
    Note over C,S: Connection may be reused (keep-alive) or closed
```

A request and a response are both just structured text. A request literally looks like this on the wire:

```
GET /articles/42 HTTP/1.1
Host: example.com
Accept: application/json
User-Agent: curl/8.4.0

```

And the response:

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 27

{"id":42,"title":"Hello"}
```

The blank line is not decoration — it's the field separator between headers and body. Miss it and the parser can't tell where headers end (L1's Team A/Team B scenario is a variant of this same "the machinery trusts a signal that turned out to be misleading" problem, one level up: a status code instead of a blank line).

## Why does a load balancer get to send request #1 and request #2 to two completely different, uncoordinated servers?

Because a request carries everything the server needs to answer it (method, path, headers, body) and the server carries everything the client needs to interpret the answer (status, headers, body), **neither side has to remember the other exists** between requests. That single property — statelessness — is why:

- A load balancer can send request #1 to server A and request #2 to server B with no coordination between A and B.
- You can `curl` an endpoint in isolation and get a meaningful answer, without "logging in" to a session first, unless the _application_ layers state on top (cookies, `Authorization` headers, tokens).
- Caching works: a response to `GET /articles/42` can be cached and replayed for anyone, because the request alone determines the response (in principle — real APIs vary by auth, but that's the app opting back into statefulness).

## What is a server actually doing, underneath any framework?

Pseudocode for what a server is conceptually doing for every connection — this is the shape underneath every framework you'll ever use, from a raw socket server to Express to a CDN edge function:

```python
loop forever:
    connection = accept_next_tcp_connection()

    raw_request = read_until_blank_line(connection)
    request_line, headers = parse(raw_request)
    method, path, version = split(request_line)

    if headers contains "Content-Length":
        body = read_exactly(connection, headers["Content-Length"])
    else:
        body = None

    handler = route(method, path)          # e.g. GET /articles/:id -> get_article
    response = handler(method, path, headers, body)

    write(connection, response.status_line)
    write(connection, response.headers)
    write(connection, "\r\n")
    write(connection, response.body)

    if headers["Connection"] == "keep-alive":
        continue on same connection
    else:
        close(connection)
```

Every real HTTP server — Node's `http` module, nginx, a Go `net/http` handler — is a more sophisticated, more concurrent version of exactly this loop. Nothing about `async`, routers, or middleware changes the underlying contract; they just make the "parse → route → handle → write" pipeline easier to compose.

## If a method's semantics are just a convention, what stops someone from breaking it?

Nothing at the network layer — which is exactly the risk worth internalizing. `GET`, `PUT`, and `DELETE` are supposed to be **idempotent** (calling them twice has the same effect as once); `POST` is not. Browsers, proxies, and retry logic lean on this promise to decide what's safe to auto-retry — but the promise only holds if the server's own handler actually honors it.

| Method   | Supposed to be idempotent? | Supposed to be safe (no side effects)? | What breaks if the handler doesn't honor this                                  |
| -------- | -------------------------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| `GET`    | Yes                        | Yes                                    | A prefetching browser or crawler can trigger real damage                       |
| `PUT`    | Yes                        | No                                     | An automatic retry after a timeout can silently "undo" a newer write           |
| `DELETE` | Yes                        | No                                     | A retried delete should be a harmless no-op, not an error or a second deletion |
| `POST`   | No                         | No                                     | Retrying it can create a duplicate (double-charge, double-comment)             |

## Semantics worth internalizing now

- **A status code is a claim, not a fact.** A `200 OK` with a broken JSON body is still, technically, a `200`. Client code — or a monitoring check, per L1's scenario — that only reads the status code and never validates the body is trusting the server's word for it.
- **`Content-Length` (or chunked encoding) is how the receiver knows where the body ends.** TCP is a byte stream with no built-in message boundaries — HTTP has to tell you the body's length explicitly, or stream it in labeled chunks (`Transfer-Encoding: chunked`), or the reader would have no way to know when to stop reading.
