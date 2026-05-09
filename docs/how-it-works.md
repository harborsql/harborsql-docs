---
title: How It Works
---

# How It Works

For each query, HarborSQL:

1. Reads the bearer token from the Databricks SQL client request.
2. Uses that token to call Unity Catalog.
3. Resolves referenced Delta tables lazily while DataFusion plans the query.
4. Reuses token-scoped cached table providers when fresh temporary credentials are already available.
5. Requests Unity Catalog temporary table credentials on cache misses.
6. Registers Delta table providers in DataFusion.
7. Executes the SQL query locally.
8. Returns rows through the Databricks SQL connector protocol.

Authorization remains anchored in Unity Catalog. HarborSQL does not persist
Databricks bearer tokens or temporary cloud credentials.

Cached table entries are keyed by a process-local HMAC of the caller's bearer
token and expire before Unity temporary credentials expire.

## Runtime Shape

```text
Databricks SQL client
        |
        | Thrift over HTTP
        v
HarborSQL
        |
        | Caller bearer token
        v
Unity Catalog
        |
        | Temporary table credentials
        v
Delta tables on object storage
```

## Query Execution

HarborSQL opens Delta tables with `delta-rs`, registers them with DataFusion,
and executes read-only SQL locally. Result pages are materialized in memory
within configured row and byte limits before being returned through the
Databricks-compatible protocol surface.
