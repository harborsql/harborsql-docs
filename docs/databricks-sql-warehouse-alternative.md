---
title: Open Source Databricks SQL Warehouse Alternative
description: Run read-only SQL on Unity Catalog Delta tables with HarborSQL, a self-hosted Databricks SQL Warehouse alternative powered by DataFusion.
slug: /databricks-sql-warehouse-alternative
sidebar_label: SQL Warehouse Alternative
keywords:
  - databricks sql warehouse
  - databricks sql warehouse alternative
  - open source databricks alternative
  - unity catalog sql engine
  - delta lake sql engine
---

# An Open Source Alternative to Databricks SQL Warehouse

HarborSQL is a self-hosted SQL engine for teams that want to query Unity
Catalog Delta tables without routing every read-only workload through a
Databricks SQL Warehouse.

It keeps Unity Catalog for table discovery, authorization, and temporary
credential vending. HarborSQL replaces the query compute for supported
workloads with a focused runtime built on DataFusion, `delta-rs`, and Arrow.
Existing Databricks SQL clients can connect through HarborSQL's compatible
Thrift-over-HTTP surface.

HarborSQL is not a replacement for the full Databricks platform. It is an
open-source Databricks SQL Warehouse alternative for interactive, read-only
queries that fit on a single self-managed engine.

## HarborSQL vs. Databricks SQL Warehouse

| Capability | HarborSQL | Databricks SQL Warehouse |
| --- | --- | --- |
| Query engine | DataFusion on self-managed compute | Databricks-managed SQL compute |
| Catalog and authorization | Unity Catalog | Unity Catalog |
| Table format | Unity Catalog Delta tables | Delta Lake and other Databricks-supported sources |
| SQL clients | Focused Databricks SQL connector and JDBC compatibility | Full Databricks SQL client and protocol support |
| Workload shape | Interactive, read-only queries | Broad BI, analytics, and data-warehouse workloads |
| Scaling model | Size and operate the HarborSQL runtime yourself | Managed warehouse sizing and autoscaling |
| SQL surface | DataFusion SQL plus documented compatibility rewrites | Databricks SQL |
| Result delivery | Bounded in-memory result materialization | Managed result delivery, including broader result-storage features |
| License | Open source | Proprietary managed service |

Choose HarborSQL when the narrower runtime matches the workload. Keep using a
Databricks SQL Warehouse for queries that require distributed execution, the
complete Databricks SQL surface, Cloud Fetch, durable result storage, or other
managed warehouse features.

## Keep Unity Catalog Governance

HarborSQL does not introduce a second catalog or a separate permission model.
For each query, it:

1. Receives the caller's Databricks bearer token from the SQL client.
2. Uses that identity to resolve tables through Unity Catalog.
3. Requests short-lived credentials for the referenced Delta tables.
4. Opens the Delta data from object storage with `delta-rs`.
5. Executes the query with DataFusion.
6. Returns Databricks-compatible result metadata and rows.

The caller still needs the normal Unity Catalog permissions. HarborSQL also
requires `EXTERNAL USE SCHEMA` on each schema it queries:

```sql
GRANT EXTERNAL USE SCHEMA ON SCHEMA <catalog>.<schema> TO `<principal>`;
```

HarborSQL does not persist bearer tokens or temporary cloud credentials. See
[How It Works](./how-it-works) and
[Unity Catalog Permissions](./configuration#unity-catalog-permissions) for the
complete request and authorization model.

## Reuse Databricks SQL Clients

For a supported Python client, the migration path keeps the existing
`databricks-sql-connector` API and points `server_hostname` at HarborSQL:

```python
from databricks import sql
import os

connection = sql.connect(
    server_hostname="sql.example.com",
    http_path="/sql/1.0/warehouses/harborsql",
    access_token=os.environ["DATABRICKS_TOKEN"],
    catalog="workspace",
    schema="analytics",
)

with connection.cursor() as cursor:
    cursor.execute("SELECT count(*) FROM events")
    print(cursor.fetchone())
```

HarborSQL also supports a documented subset of the Databricks JDBC driver
surface. Review [Getting Started](./getting-started) and
[Databricks JDBC Driver](./databricks-jdbc) before testing a client or BI tool.

## Control the Query Compute

A Databricks SQL Warehouse bundles query compute into a managed service.
HarborSQL lets the infrastructure team choose the host, instance size,
deployment model, and scaling strategy for the query engine.

That control can reduce compute cost for compatible workloads, but it also
transfers operational responsibility to the team running HarborSQL. Capacity,
availability, TLS termination, monitoring, and upgrades are no longer managed
by Databricks.

The public [benchmark dashboard](/benchmarks) compares tested HarborSQL and
Databricks SQL Warehouse configurations across ClickBench, SSB, Delta type
compatibility, and concurrency scenarios. Treat those results as evidence for
the published datasets and topologies, not as a universal cost or performance
guarantee. Benchmark your own queries before moving production traffic.

## Workloads That Fit HarborSQL

HarborSQL is worth evaluating when you have:

- Unity Catalog Delta tables backed by supported object storage.
- Existing Databricks identities and table permissions you want to preserve.
- Read-only SQL from applications, BI tools, or services.
- Queries that fit a single-node execution model.
- Databricks SQL connector-shaped clients that can target another hostname.
- A reason to own the cost, sizing, or deployment of query compute.

It is not currently a fit when you require:

- Writes, DDL, streaming, or data transformation jobs.
- A distributed engine for large or heavily shuffled queries.
- Complete Databricks SQL syntax and protocol compatibility.
- Cloud Fetch, durable result storage, or streaming result storage.
- A fully managed service with warehouse autoscaling and admission control.

HarborSQL is pre-1.0 software. Validate the precise SQL, result types, driver
versions, authentication flows, and concurrency patterns used by your workload.
The [Technical Preview](./technical-preview),
[SQL Compatibility Notes](./sql-compatibility), and
[Result Types](./result-types) define the current surface.

## Evaluate HarborSQL

Start the published Docker image and connect it to your Databricks workspace:

```bash
export TAG="<version>"

docker run --rm \
  -p 127.0.0.1:1992:1992 \
  -e HARBORSQL_BIND_ADDR="0.0.0.0:1992" \
  -e HARBORSQL_DATABRICKS_HOST="https://<workspace-host>" \
  ghcr.io/harborsql/harborsql:$TAG
```

Use [Getting Started](./getting-started) for the full setup, then run the same
representative query against HarborSQL and your Databricks SQL Warehouse.
Compare result values and metadata first, followed by latency, concurrency,
resource use, and total operating cost.
