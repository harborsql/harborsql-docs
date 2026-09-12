---
title: Move SQL Warehouse Reads to HarborSQL
description: Test HarborSQL against Databricks SQL Warehouse on the same Unity Catalog Delta table, compare results and metadata, and plan a reversible migration.
slug: /migrate-databricks-sql-warehouse
sidebar_label: SQL Warehouse Migration
keywords:
  - replace databricks sql warehouse keep unity catalog
  - databricks sql warehouse migration
  - unity catalog external sql engine
---

# Move Databricks SQL Warehouse reads to HarborSQL

You can evaluate HarborSQL without copying Delta tables or changing your Unity
Catalog metastore. Run the same read through your existing Databricks SQL
Warehouse and HarborSQL, compare the returned values and metadata, then move
only the workloads that pass your checks.

This walkthrough targets an existing Unity Catalog Delta table on AWS S3 and
the Python Databricks SQL connector. It provides a runnable comparison, not a
claim that your environment has already passed. For the product boundary, read
the [open-source SQL Warehouse alternative guide](./databricks-sql-warehouse-alternative).

## 1. Choose a stable table and record versions

Choose a small Delta table that will not change during the comparison. Concurrent
writes can produce different results even when both engines are correct.
Use a table that the test principal already has permission to read.

Record the HarborSQL release tag, connector version, warehouse configuration,
table schema, and test time. Keep private identifiers in your own evaluation
notes. The repository's Python smoke workflow installs an unpinned connector,
so there is no fixed Python version certification to infer from that workflow.

Use your application's existing connector environment and record its version:

```bash
python -m pip show databricks-sql-connector
```

For a new environment, install the connector version you intend to evaluate:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install 'databricks-sql-connector==<version-to-evaluate>'
```

The documented JDBC smoke versions are `2.6.40` and `3.3.3`. Java applications
should follow the [JDBC guide](./databricks-jdbc) for result-path properties and
authentication details. This Python exercise does not validate ODBC or a BI
application's full behavior.

## 2. Enable external access and verify grants

Have a metastore administrator enable **External data access** in the metastore
settings. Follow the [official external access instructions](https://docs.databricks.com/aws/en/external-access/admin).
The test principal needs these privileges, whether granted directly or, where
supported, inherited:

```sql
GRANT USE CATALOG ON CATALOG <catalog> TO `<principal>`;
GRANT USE SCHEMA ON SCHEMA <catalog>.<schema> TO `<principal>`;
GRANT SELECT ON TABLE <catalog>.<schema>.<table> TO `<principal>`;
GRANT EXTERNAL USE SCHEMA ON SCHEMA <catalog>.<schema> TO `<principal>`;
```

Run grants through an authorized Databricks administrator, not through HarborSQL.
`EXTERNAL USE SCHEMA` requires an explicit grant and is not included in
`ALL PRIVILEGES`. The baseline connection also needs permission to use the
Databricks SQL Warehouse.

HarborSQL uses temporary storage credentials from Unity Catalog. The server
needs network access to the Databricks workspace and the table's S3 storage;
static AWS access keys are not part of this setup.

## 3. Start HarborSQL

Select a published release from [GitHub Releases](https://github.com/harborsql/harborsql/releases),
then replace the placeholders and start the container:

```bash
export HARBORSQL_TAG='<release-tag>'
docker run --rm --name harborsql-evaluation \
  -p 127.0.0.1:1992:1992 \
  -e HARBORSQL_BIND_ADDR=0.0.0.0:1992 \
  -e HARBORSQL_DATABRICKS_HOST='https://<workspace-host>' \
  -e HARBORSQL_AWS_REGION='<table-storage-region>' \
  "ghcr.io/harborsql/harborsql:$HARBORSQL_TAG"
```

The local port is for evaluation on your machine. Serve remote and production
clients through HTTPS with TLS termination. The upstream Databricks workspace
URL must also use HTTPS.

## 4. Compare one query through both endpoints

In another terminal with your Python environment activated, set the connection
inputs. Use the same principal for both connections. Enter its token at the
script's hidden prompt or supply `DATABRICKS_TOKEN` through your secret manager.

```bash
export DATABRICKS_SERVER_HOSTNAME='<workspace-host-without-scheme>'
export DATABRICKS_HTTP_PATH='/sql/1.0/warehouses/<warehouse-id>'
export DATABRICKS_CATALOG='<catalog>'
export DATABRICKS_SCHEMA='<schema>'
export HARBORSQL_TEST_TABLE='<table-name>'
```

Save the following as `compare_warehouse.py`. It quotes the table identifiers,
reads the same row count from each engine, compares every column-description
field and the returned rows, and exits unsuccessfully if either differs.
It does not print the token or table data.

```python
import getpass
import os
from importlib.metadata import version
from time import perf_counter

from databricks import sql


def quote_identifier(value):
    return "`" + value.replace("`", "``") + "`"


def read_result(options, statement):
    with sql.connect(**options) as connection:
        with connection.cursor() as cursor:
            started = perf_counter()
            cursor.execute(statement)
            columns = tuple(tuple(column) for column in cursor.description)
            rows = tuple(tuple(row) for row in cursor.fetchall())
            elapsed = perf_counter() - started
    return columns, rows, elapsed


def main():
    token = os.environ.get("DATABRICKS_TOKEN") or getpass.getpass("Databricks token: ")
    catalog = os.environ["DATABRICKS_CATALOG"]
    schema = os.environ["DATABRICKS_SCHEMA"]
    table = os.environ["HARBORSQL_TEST_TABLE"]
    qualified = ".".join(quote_identifier(v) for v in (catalog, schema, table))
    statement = f"SELECT COUNT(*) AS row_count FROM {qualified}"
    shared = dict(access_token=token, catalog=catalog, schema=schema,
                  use_cloud_fetch=False)
    warehouse = dict(shared,
                     server_hostname=os.environ["DATABRICKS_SERVER_HOSTNAME"],
                     http_path=os.environ["DATABRICKS_HTTP_PATH"])
    harbor = dict(shared, server_hostname="http://127.0.0.1:1992",
                  http_path="/sql/1.0/warehouses/local",
                  _connection_uri="http://127.0.0.1:1992/sql/1.0/warehouses/local")
    print("Connector version:", version("databricks-sql-connector"))
    baseline = read_result(warehouse, statement)
    candidate = read_result(harbor, statement)
    if baseline[0] != candidate[0]:
        raise SystemExit("FAIL: column metadata differs; review locally before migration")
    if baseline[1] != candidate[1]:
        raise SystemExit("FAIL: row values differ; check table stability and SQL semantics")
    print("PASS: row count and column metadata match")
    print(f"Warehouse execute/fetch: {baseline[2]:.3f}s")
    print(f"HarborSQL execute/fetch: {candidate[2]:.3f}s")


if __name__ == "__main__":
    main()
```

Run it with:

```bash
python compare_warehouse.py
```

`use_cloud_fetch=False` selects the result path supported by HarborSQL. The
private `_connection_uri` option is needed for this local HTTP example; it can
change between connector versions. For an HTTPS HarborSQL endpoint, remove
that override and use the hostname and path described in
[Getting Started](./getting-started#harborsql-behind-https).

The printed times cover execution and fetching after connection establishment.
One sequential run is not a benchmark: cache state, startup, and network effects
can dominate. The expected PASS line is a check you must obtain in your own
environment, not a published measurement.

## 5. Expand the checks to your application

A matching row count proves only this aggregate and metadata path. Replace the
statement with representative, bounded read-only queries. Use a deterministic
`ORDER BY` with a unique tie-breaker for comparisons of individual rows.
For floating-point results, define a tolerance appropriate to the application;
the script deliberately uses exact equality.

Validate decimal precision, timestamps, nulls, binary values, nested types,
parameters, pagination, and the metadata calls your client makes. Consult
[Result Types](./result-types) and [SQL Compatibility](./sql-compatibility)
when a comparison differs. Test BI schema browsing and generated queries
separately from this Python script.

Also test with a principal that lacks access to the table and verify that the
request is denied. Check any row filters, column masks, views, and Delta table
features against the actual external-access support before including them in
the migration. Keeping table authorization does not prove every policy works.

## 6. Diagnose failures and choose the migration boundary

| Symptom | Check first |
| --- | --- |
| Baseline connection fails | Workspace hostname, HTTP path, token, and permission to use the warehouse |
| HarborSQL cannot obtain table credentials | Metastore external access, explicit external-use grant, and table read privileges |
| S3 redirect or storage access error | Table region and network access from the HarborSQL server |
| Different rows or metadata | Concurrent writes, ordering, SQL semantics, and result-type compatibility |
| Result limit or timeout | Query size and the configured row, byte, and time limits |
| JDBC works but a BI application fails | Driver version, result-path flags, schema discovery, and generated SQL |

Move one supported read-only workload at a time. Keep its previous warehouse
connection configuration so it can be restored if validation or production
behavior differs. HarborSQL does not automatically route failed queries back
to Databricks.

Retain Databricks SQL Warehouse for writes, distributed workloads, unsupported
SQL, or required managed features. Before expanding traffic, measure failures,
latency percentiles, concurrency, idle capacity, and operating cost. Use the
[benchmark methodology](/benchmarks) and [pricing guide](./databricks-sql-warehouse-pricing)
to structure that comparison.

For deeper validation, the repository provides
[connector smoke-test instructions](https://github.com/harborsql/harborsql/blob/main/docs/ci-smoke-tests.md)
for local protocol checks and opt-in tests against real Unity Catalog tables.
