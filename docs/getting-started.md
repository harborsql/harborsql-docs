---
title: Getting Started
---

# Getting Started

## Requirements

- Rust `1.91+`
- Access to a Databricks workspace with Unity Catalog enabled
- A Unity Catalog Delta table that can vend temporary table credentials to external clients
- Object storage access mediated through Unity Catalog temporary table credentials

## Run the Server

```bash
export HARBORSQL_DATABRICKS_HOST="https://<workspace-host>"
export HARBORSQL_DEFAULT_CATALOG="<catalog>"
export HARBORSQL_DEFAULT_SCHEMA="<schema>"
export HARBORSQL_AWS_REGION="<aws-region>"

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

For local development, point the connector at HarborSQL and disable Cloud Fetch:

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
    use_cloud_fetch=False,
)

with connection.cursor() as cursor:
    cursor.execute("SELECT count(*) FROM events")
    print(cursor.fetchone())
```

:::note
The local HTTP endpoint is for local protocol testing. Use HTTPS, or a
TLS-terminating proxy, for production deployments.
:::
