---
title: Getting Started
---

# Getting Started

## Requirements

HarborSQL assumes you already have a working Databricks workspace with Unity
Catalog Delta tables and users or service principals that can read those
tables.

To migrate that workload to HarborSQL, you need:

- A HarborSQL runtime:
  - Docker image: [`ghcr.io/harborsql/harborsql:<tag>`](https://github.com/orgs/harborsql/packages/container/package/harborsql)
  - Binary archives from [GitHub Releases](https://github.com/harborsql/harborsql/releases) or [`ghcr.io/harborsql/harborsql-binaries:<tag>`](https://github.com/orgs/harborsql/packages/container/package/harborsql-binaries)
- One extra Unity Catalog grant on each schema you want to query from HarborSQL:

```sql
GRANT EXTERNAL USE SCHEMA ON SCHEMA <catalog>.<schema> TO `<principal>`;
```

Your existing Unity Catalog read permissions still apply. HarborSQL does not
need static cloud credentials; Unity Catalog vends temporary table credentials
at query time. See [Unity Catalog Permissions](./configuration#unity-catalog-permissions)
for the full grant model.

## Run with Docker

Use the published image when you do not need to build HarborSQL from source:

```bash
export TAG="<version>"

docker run --rm \
  -p 127.0.0.1:1992:1992 \
  -e HARBORSQL_BIND_ADDR="0.0.0.0:1992" \
  -e HARBORSQL_DATABRICKS_HOST="https://<workspace-host>" \
  ghcr.io/harborsql/harborsql:$TAG
```

Add `HARBORSQL_DEFAULT_CATALOG`, `HARBORSQL_DEFAULT_SCHEMA`, or
`HARBORSQL_AWS_REGION` only when the defaults do not match your workspace.

See [Docker](./docker) for image tags, one-off queries, Compose, and production notes.

## Run the Server

Use Cargo when developing HarborSQL from source:

```bash
export HARBORSQL_DATABRICKS_HOST="https://<workspace-host>"

cargo run -- server
```

The server listens on `127.0.0.1:1992` by default.

Production deployments should serve HarborSQL over HTTPS, or behind a
TLS-terminating proxy. The HarborSQL-to-Databricks and Unity Catalog hop must
use HTTPS for real Databricks workspaces.

## Run a One-Off Query

```bash
export HARBORSQL_DATABRICKS_HOST="https://<workspace-host>"
export DATABRICKS_TOKEN="<token>"

cargo run -- query --sql "SELECT COUNT(*) FROM <catalog>.<schema>.<table>"
```

## Connect a Databricks SQL Client

HarborSQL targets a focused Databricks SQL connector-compatible
Thrift-over-HTTP surface.

### HarborSQL Behind HTTPS

When HarborSQL is exposed through HTTPS, for example behind a TLS-terminating
proxy, keep the existing Databricks SQL connector shape and change only
`server_hostname` to the HarborSQL host:

```python
from databricks import sql
import os

connection = sql.connect(
    server_hostname="sql.example.com",
    http_path="/sql/1.0/warehouses/<warehouse-id>",
    access_token=os.environ["DATABRICKS_TOKEN"],
    catalog="workspace",
    schema="analytics",
)

with connection.cursor() as cursor:
    cursor.execute("SELECT count(*) FROM events")
    print(cursor.fetchone())
```

### Local or Plain HTTP HarborSQL

For a local or plain HTTP HarborSQL endpoint, override the connector's internal
connection URI with the full `http://` URL:

```python
from databricks import sql
import os

uri = "http://127.0.0.1:1992/sql/1.0/warehouses/local"

connection = sql.connect(
    server_hostname="http://127.0.0.1:1992",
    http_path="/sql/1.0/warehouses/local",
    access_token=os.environ["DATABRICKS_TOKEN"],
    catalog="workspace",
    schema="analytics",
    _connection_uri=uri,
)

with connection.cursor() as cursor:
    cursor.execute("SELECT count(*) FROM events")
    print(cursor.fetchone())
```

:::note
The local HTTP endpoint is for local protocol testing. Use HTTPS, or a
TLS-terminating proxy, for production deployments.
:::
