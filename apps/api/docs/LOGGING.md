# Logging

Structured, low-overhead logging built on [Pino](https://getpino.io). Every
log line is JSON in production and pretty-printed in development. Requests
carry a unique id you can use to trace errors end-to-end.

## Why Pino

- Fast — one of the lowest-overhead JSON loggers in Node.
- Structured — everything is JSON, easy to grep/query/ship.
- Redaction built-in — sensitive fields never hit stdout.
- Child loggers — scope bindings (module, userId, sessionId) without per-line cost.

## Layout

```
src/lib/
  logger.ts        # root pino instance + redaction + serializers
  http-logger.ts   # pino-http middleware (reqId, per-request log line)
```

All other files import from `../lib/logger.js` and create a child logger
named after their module.

## Environment variables

| Var          | Default                     | Purpose                                       |
|--------------|-----------------------------|-----------------------------------------------|
| `LOG_LEVEL`  | `info` (prod), `debug` (dev)| `trace` \| `debug` \| `info` \| `warn` \| `error` \| `fatal` \| `silent` |
| `LOG_PRETTY` | `1` in dev, `0` in prod     | `1` = human-readable colored output; `0` = JSON |

Set in `apps/api/.env`. Examples:

```bash
LOG_LEVEL=debug          # verbose local dev
LOG_LEVEL=warn           # quiet prod
LOG_PRETTY=1             # force pretty even in prod (not recommended)
```

## Using the logger

### In a route / service / agent

```ts
import { logger } from "../lib/logger.js";

const log = logger.child({ module: "routes.auth" });

log.info({ userId }, "signed in");
log.warn({ attempts }, "rate limit approaching");
log.error({ err, email }, "signup failed");
```

Rules of thumb:

1. **First arg is a context object, second is the message.** Pino's fast path
   is `log.info({ ...ctx }, "message")`. Don't string-concatenate.
2. **Pass errors as `err`.** `log.error({ err }, "...")` — the `err`
   serializer extracts `type`, `message`, and `stack` automatically.
3. **Always add identifiers.** Include `userId`, `sessionId`,
   `pipelineRunId`, `projectId` — whatever lets you find this line later.
4. **Don't log secrets.** Redaction catches common names (`password`,
   `apiKey`, `token`, `credential`, `cookie`, `authorization`), but you
   should avoid logging them in the first place.

### Module naming

Use the path-style convention already in the codebase:

| File                                           | Module name                 |
|------------------------------------------------|-----------------------------|
| `routes/auth.routes.ts`                        | `routes.auth`               |
| `services/plugin-mcp-bridge.ts`                | `service.plugin-mcp-bridge` |
| `websocket/server.ts`                          | `ws`                        |
| `websocket/handlers/proceed.handler.ts`        | `ws.handler.proceed`        |
| `agents/orchestrator.agent.ts`                 | `agent.orchestrator`        |

This makes `module="ws.handler.*"` a useful filter.

### In an HTTP handler

`pino-http` attaches a per-request logger to `req.log` that already carries
the reqId and userId. Inside a route you have two options:

```ts
// Module-scoped (preferred for consistent filters)
log.error({ err, userId: req.userId }, "fetch messages failed");

// Request-scoped (automatically carries reqId + userId)
req.log.error({ err }, "fetch messages failed");
```

The global error handler in `src/index.ts` uses `req.log`, so any unhandled
500 is automatically tied to the request that caused it.

### In a WebSocket handler

`src/websocket/server.ts` creates a per-connection child logger (`connLog`)
bound with `sessionId` and `userId`. Handlers imported from
`src/websocket/handlers/` have their own module child — pass identifiers
through the handler's context (`ctx.sessionId`, `ctx.userId`,
`ctx.pipelineRunId`) so every line is correlatable.

## Request correlation (finding where an error came from)

Every incoming request gets an `X-Request-Id`:

1. If the request arrives with an `X-Request-Id` header (e.g. from a proxy
   or another service), we honour it.
2. Otherwise we mint a UUID.
3. Either way, we echo it back in the response's `X-Request-Id` header.

### Tracing a real error

1. The frontend (or an alert) reports an error. Grab the `X-Request-Id`
   from the failed response's headers.
2. Search logs for that id:
   ```bash
   grep '"reqId":"<id>"' app.log     # JSON prod
   # or in pretty dev output:
   grep '<id>' api.log
   ```
3. You'll see the full request lifecycle: the entry line, anything logged
   during handling, and the error line with `stack`.

## Log severity and HTTP status

`pino-http` picks the level automatically per request:

| Status | Level    | Notes                                                 |
|--------|----------|-------------------------------------------------------|
| 1xx–2xx| `info`   | Normal success                                        |
| 3xx    | `silent` | Redirects don't spam the log                          |
| 4xx    | `warn`   | Client errors (auth, validation, rate limit)          |
| 5xx    | `error`  | Server errors — always surfaced                       |
| thrown | `error`  | Any unhandled throw bubbles through the error handler |

Health endpoints (`/health`, `/ready`, `/favicon.ico`) are skipped entirely
to keep noise low.

## What gets redacted

The following paths are replaced with `[REDACTED]` anywhere they appear:

- `password`, `*.password`
- `token`, `jwt`, `credential`
- `apiKey`, `apiKeys`, `apiKeys.*`
- `settings.apiKeys`, `settings.apiKeys.*`
- `req.body.password`, `req.body.credential`
- `req.body.apiKey`, `req.body.apiKeys`, `req.body.apiKeys.*`
- `req.body.env`, `req.body.env.*`
- `req.body.headers`, `req.body.headers.*`
- `req.headers.cookie`, `req.headers.authorization`, `req.headers["x-api-key"]`
- `res.headers["set-cookie"]`

Redaction paths are compiled once at startup — zero cost per log line
beyond the path check itself.

If you add new sensitive fields, add them to the `redact.paths` array in
`src/lib/logger.ts`.

## Performance

- **Level filtering short-circuits before serialization.** A
  `log.debug(...)` at `LOG_LEVEL=info` costs ~nanoseconds.
- **Child loggers share the parent stream.** Creating one per request or
  per module is free.
- **Stdout writes are non-blocking** for pipes/TTYs.
- **Stream events (`*_stream` from WebSocket agents) are throttled** at
  5s via `STREAM_PERSIST_INTERVAL` in `event-emitter.ts` — chatty events
  don't amplify into logs.
- **Health/readiness/favicon are never logged.**

Don't do synchronous I/O inside custom serializers or `customProps` — it
runs on every matching log line and defeats the point of Pino.

## Examples by severity

```ts
// trace — very chatty; usually off
log.trace({ token: "..." }, "tokenizing input");

// debug — dev/diagnosis only
log.debug({ projectId, keys: Object.keys(snapshot) }, "loaded snapshot");

// info — normal lifecycle events
log.info({ port: PORT }, "server listening");

// warn — something recoverable went wrong
log.warn({ err, pluginId }, "MCP bridge failed during plugin toggle");

// error — something failed that we couldn't handle gracefully
log.error({ err, sessionId: ctx.sessionId }, "frontend agent failed");

// fatal — unrecoverable; process will exit
log.fatal({ err }, "unable to connect to database");
```

## Shipping logs

In production you're writing JSON to stdout. Ship stdout wherever:

- Docker → CloudWatch / Datadog / etc. via the platform's log driver.
- PM2 / systemd → file + log rotation.
- Kubernetes → `kubectl logs` + your cluster's aggregator.

If you need filesystem destinations with async buffering, swap the
transport in `src/lib/logger.ts` to `pino.destination({ dest, sync: false,
minLength: 4096 })`. Don't introduce synchronous file I/O.

## Common pitfalls

1. **`log.info("userId=" + id)`** — no structure; can't filter. Use
   `log.info({ userId: id }, "...")`.
2. **`log.error(err)`** — works but loses context. Prefer
   `log.error({ err, userId }, "what failed")`.
3. **Logging request/response bodies.** Large payloads destroy
   performance and often contain secrets. Log IDs instead.
4. **Creating a child logger inside a hot loop.** Create it once at module
   scope; only create per-request/per-session children when the extra
   bindings actually help you correlate.
