---
title: Advanced Usage
description: Run one-off HarborSQL queries from source or Docker, choose a default Unity Catalog namespace, inspect JSON results, and diagnose access errors.
keywords:
  - harborsql cli
  - query unity catalog from command line
  - datafusion cli query
  - delta lake sql cli
---

# Advanced Usage

HarborSQL's query mode executes SQL without starting the
Databricks-compatible server. It is useful for validating a deployment,
checking Unity Catalog permissions, testing SQL compatibility, and inspecting
the exact result values and metadata returned by the query engine.

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

Query mode prints the result as formatted JSON and exits. It uses the
`DATABRICKS_TOKEN` environment variable as the caller identity, so Unity
Catalog applies that principal's existing catalog, schema, and table grants.
The principal also needs `EXTERNAL USE SCHEMA` for every schema HarborSQL
accesses.

## Choose the Default Namespace

Fully qualified table names work without changing the defaults:

```sql
SELECT COUNT(*) FROM catalog_name.schema_name.table_name
```

For shorter queries, configure the default catalog and schema before running
the command:

```bash
export HARBORSQL_DEFAULT_CATALOG="catalog_name"
export HARBORSQL_DEFAULT_SCHEMA="schema_name"

cargo run -- query --sql "SELECT COUNT(*) FROM table_name"
```

Use [Configuration](./configuration) for the full environment-variable
reference and [SQL Compatibility Notes](./sql-compatibility) before testing a
Databricks-specific expression.

## Diagnose Query Failures

Start with the error returned by the command. Authentication and authorization
failures usually point to the Databricks host, bearer token, Unity Catalog
grants, or the required `EXTERNAL USE SCHEMA` privilege. Table-loading errors
can also indicate an unsupported storage configuration or a problem vending
temporary credentials.

Set `RUST_LOG=harborsql=debug` when you need more runtime detail:

```bash
RUST_LOG=harborsql=debug \
  cargo run -- query --sql "SELECT COUNT(*) FROM table_name"
```

Do not enable unsafe SQL logging in an environment where query text can contain
sensitive values. Review [How It Works](./how-it-works) for the request path
from Unity Catalog resolution through DataFusion execution.
