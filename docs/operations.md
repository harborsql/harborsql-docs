---
title: Operations
---

# Operations

## Observability

HarborSQL emits structured `tracing` spans for:

- HTTP requests
- Thrift RPCs
- Query execution
- Unity Catalog calls
- Delta table opens
- DataFusion planning and execution
- Result materialization
- Fetches
- Operation cancellation

HTTP responses include an `x-request-id`. Callers can provide one or let
HarborSQL generate it.

## Metrics

Prometheus-format metrics are available at `/metrics`.

Expose `/metrics` only on a trusted network or through an authenticated
monitoring proxy.

## Logging

SQL text is not logged by default. Query spans include a stable SQL hash and
length.

Set `HARBORSQL_UNSAFE_LOG_SQL=true` only in controlled debugging environments
to include centrally redacted SQL text.

## Production Notes

- Serve HarborSQL over HTTPS, or behind a TLS-terminating proxy.
- Keep `HARBORSQL_DATABRICKS_HOST` on HTTPS for real Databricks workspaces.
- Do not log or persist bearer tokens.
- Do not log or persist temporary cloud credentials.
- Treat Unity Catalog as the authorization source of truth.
