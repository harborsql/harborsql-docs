---
title: Advanced Usage
---

# Advanced Usage

## Run a One-Off Query

HarborSQL can execute a single query without starting the Databricks SQL
connector-compatible server.

From source:

```bash
export HARBORSQL_DATABRICKS_HOST="https://<workspace-host>"
export DATABRICKS_TOKEN="<token>"

cargo run -- query --sql "SELECT COUNT(*) FROM <catalog>.<schema>.<table>"
```

With Docker:

```bash
export TAG="<version>"

docker run --rm \
  -e HARBORSQL_DATABRICKS_HOST="https://<workspace-host>" \
  -e DATABRICKS_TOKEN="<token>" \
  ghcr.io/harborsql/harborsql:$TAG \
  query --sql "SELECT COUNT(*) FROM <catalog>.<schema>.<table>"
```

Add `HARBORSQL_DEFAULT_CATALOG`, `HARBORSQL_DEFAULT_SCHEMA`, or
`HARBORSQL_AWS_REGION` only when the defaults do not match your workspace.
