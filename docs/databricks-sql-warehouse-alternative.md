---
title: Open Source Databricks SQL Warehouse Alternative
description: Replace supported Databricks SQL Warehouse reads with HarborSQL, an MIT-licensed engine that keeps Unity Catalog, Delta tables, and documented SQL clients.
slug: /databricks-sql-warehouse-alternative
sidebar_label: SQL Warehouse Alternative
keywords:
  - databricks sql warehouse
  - databricks sql warehouse alternative
  - open source databricks alternative
  - open source alternative to databricks sql warehouse
  - unity catalog sql engine
  - delta lake sql engine
---

# An Open Source Alternative to Databricks SQL Warehouse

HarborSQL is an MIT-licensed, self-hosted alternative to Databricks SQL Warehouse
for supported read-only queries over Unity Catalog Delta tables. It keeps the
caller's Databricks identity, Unity Catalog table authorization, and existing
Delta data, and accepts documented Databricks Python connector and JDBC paths.

It keeps Unity Catalog for table discovery, authorization, and temporary
credential vending. HarborSQL replaces the query compute for supported
workloads with a focused runtime built on DataFusion, `delta-rs`, and Arrow.
Existing Databricks SQL clients can connect through HarborSQL's compatible
Thrift-over-HTTP surface.

HarborSQL is not a replacement for the full Databricks platform. It is an
open-source Databricks SQL Warehouse alternative for interactive, read-only
queries that fit on a single self-managed engine.

Start with the [migration walkthrough](./migrate-databricks-sql-warehouse)
to compare the same table through both endpoints. The
[source and MIT license](https://github.com/harborsql/harborsql) are public.

## Can I replace SQL Warehouse compute and keep Unity Catalog?

Yes, for HarborSQL's supported read-only workloads. You don't need to migrate
Delta tables to Iceberg or replace Unity Catalog with another metastore.
HarborSQL requests table metadata and temporary credentials using the caller's
Databricks token, then reads the underlying Delta files and executes the SQL.

You still need a Databricks workspace and Unity Catalog. The documented storage
path uses AWS S3 temporary credentials. This is not a standalone replacement
for Databricks governance, and table credential access does not establish
support for every governance feature, such as row filters or column masks.
Validate the policies and table features your workload depends on before moving it.

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

### What HarborSQL replaces

HarborSQL replaces the compute path for a supported read-only query. It accepts
the request, resolves the referenced Unity Catalog tables, reads their Delta
files from object storage, executes the plan with DataFusion, and returns the
result through a Databricks-compatible protocol.

It does not replace your Databricks workspace, Unity Catalog, identity provider,
or storage. That boundary lets you evaluate another query runtime without
copying table metadata or creating a parallel authorization system.

## Keep Unity Catalog Governance

HarborSQL does not introduce a second catalog or a separate permission model.
For each query, it:

1. Receives the caller's Databricks bearer token from the SQL client.
2. Uses that identity to resolve tables through Unity Catalog.
3. Requests short-lived credentials for the referenced Delta tables.
4. Opens the Delta data from object storage with `delta-rs`.
5. Executes the query with DataFusion.
6. Returns Databricks-compatible result metadata and rows.

An administrator must first enable external data access on the metastore, as
described in [Databricks' external access setup](https://docs.databricks.com/aws/en/external-access/admin).
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

Client compatibility is specific to the driver, authentication flow, and result
path. JDBC support does not imply ODBC support or certification for every BI tool.

| Client or capability | Documented evidence | What to validate |
| --- | --- | --- |
| Python `databricks-sql-connector` | Live aggregate and metadata comparison passed with `4.5.0`; CI installs an unpinned connector | Record and pin the version you validate; test rows, metadata, and pagination |
| Databricks JDBC legacy line | Smoke-tested version `2.6.40` | PAT or token pass-through; OAuth M2M has a hostname restriction |
| Databricks JDBC 3.x | Smoke-tested version `3.3.3` | Required Thrift properties and Databricks OAuth endpoint configuration |
| ODBC and JDBC 4.x | No documented compatibility claim here | Require separate evidence before selecting these paths |
| BI applications | Driver support is only one dependency | Test schema discovery, generated SQL, parameters, and result types |

The [connector smoke-test instructions](https://github.com/harborsql/harborsql/blob/main/docs/ci-smoke-tests.md)
separate local protocol checks from opt-in tests against real Unity Catalog
tables. A local protocol pass alone does not prove storage access works.

The [verified migration example](./migrate-databricks-sql-warehouse#verified-live-comparison)
records a live test with HarborSQL `v0.1.9`, connector `4.5.0`, and a serverless
2X-Small warehouse. The same existing Unity Catalog Delta table returned matching
row counts and column metadata through both endpoints.

For a supported Python client, the migration path keeps the existing
`databricks-sql-connector` API and points `server_hostname` at HarborSQL:

```python
from databricks import sql
import os

connection = sql.connect(
    server_hostname="sql.example.com",
    http_path="/sql/1.0/warehouses/harborsql",
    access_token=os.environ["DATABRICKS_TOKEN"],
    use_cloud_fetch=False,
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
For the implementation details, read
[Building a Databricks SQL-compatible server with Rust and DataFusion](./articles/building-databricks-sql-compatible-server).

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

The [Databricks SQL Warehouse pricing guide](./databricks-sql-warehouse-pricing)
explains the DBU calculation, the benchmark's hourly assumptions, and the
operational costs to include in a self-hosted comparison. For products that
replace a broader part of the platform, see the
[Databricks alternatives overview](./articles/databricks-alternatives-sql-analytics).

## HarborSQL or Trino for Unity Catalog Delta tables?

Evaluate HarborSQL when your priority is retaining Databricks clients and the
Unity Catalog credential path for read-only queries that fit a single engine.
Evaluate Trino when you need distributed execution or federation across sources
and can change client connections and configure the catalog and storage layer.

Trino can query Delta Lake. Its
[Delta Lake connector documentation](https://trino.io/docs/current/connector/delta-lake.html)
describes the metastore, storage, and network configuration it needs. Reading
the same table format is distinct from preserving the same client protocol and
per-caller authorization path. Check the exact Trino connector and deployment
you intend to use; don't assume either universal Unity Catalog incompatibility
or automatic equivalence with Databricks SQL Warehouse.

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
[SQL Compatibility Notes](./sql-compatibility) and
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

Use the [migration walkthrough](./migrate-databricks-sql-warehouse) for a
repeatable comparison of values and result metadata, or
[Getting Started](./getting-started) for the basic setup. Run the same
representative query against HarborSQL and your Databricks SQL Warehouse.
Compare result values and metadata first, followed by latency, concurrency,
resource use, and total operating cost.

## Frequently Asked Questions

### Can HarborSQL replace a Databricks SQL Warehouse?

HarborSQL can replace the warehouse compute for supported, read-only queries
over Unity Catalog Delta tables. It cannot replace managed features such as
distributed execution, Cloud Fetch, durable result storage, writes, or the full
Databricks SQL language and protocol surface.

### Does HarborSQL work with Unity Catalog?

Yes. HarborSQL uses the caller's Databricks identity to discover tables and
request temporary table credentials from Unity Catalog. The caller retains the
normal catalog, schema, and table permissions and also needs
`EXTERNAL USE SCHEMA`.

### Can existing Databricks SQL clients connect to HarborSQL?

Supported versions of the Python `databricks-sql-connector` and Databricks JDBC
driver can connect by using the HarborSQL hostname and HTTP path. HarborSQL
implements a focused subset of the Thrift-over-HTTP protocol, so test the exact
driver version and metadata calls used by your application or BI tool.

### Is HarborSQL an open-source Databricks alternative?

HarborSQL is an open-source alternative to Databricks SQL Warehouse compute for
a narrow workload. It is not an open-source replacement for the complete
Databricks platform.
