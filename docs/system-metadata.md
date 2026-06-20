---
title: System Metadata Tables
---

# System Metadata Tables

HarborSQL supports Databricks-style metadata discovery through virtual system
tables. This is mainly useful for BI tools and JDBC clients that inspect
`system.information_schema` directly instead of using only JDBC metadata calls
or `SHOW` statements.

These virtual tables do not open Delta table storage and do not request Unity
Catalog temporary table credentials.

## Supported Namespaces

HarborSQL recognizes two metadata shapes:

```sql
system.information_schema.<relation>
<catalog>.information_schema.<relation>
```

`system.information_schema` follows the Databricks global information schema
shape. `<catalog>.information_schema` scopes discovery to a single catalog.

For example:

```sql
SELECT table_catalog, table_schema, table_name, table_type
FROM system.information_schema.tables
WHERE table_catalog = 'main'
  AND table_schema = 'analytics';
```

```sql
SELECT table_name
FROM main.information_schema.tables
WHERE table_schema = 'analytics'
ORDER BY table_name;
```

## Populated Relations

HarborSQL populates the common metadata relations from Unity Catalog:

| Relation | Data source |
| --- | --- |
| `catalogs` | Unity Catalog catalog list |
| `schemata` | Unity Catalog schema list |
| `tables` | Unity Catalog table list |
| `columns` | Unity Catalog table details and column metadata |
| `views` | Unity Catalog table list filtered to views |

Other relations under `system.information_schema` can resolve with their
Unity-provided schema, but return empty result sets until HarborSQL implements
row synthesis for them.

## Query Behavior

`system.information_schema` relations are normal DataFusion table providers
after HarborSQL generates the metadata rows. You can use projections, filters,
joins, CTEs, ordering, grouping, and limits.

HarborSQL extracts simple equality filters before generating rows to reduce
Unity Catalog calls:

```sql
WHERE table_catalog = 'main'
  AND table_schema = 'analytics'
  AND table_name = 'orders'
```

More complex predicates still work, but HarborSQL may need to fetch more
metadata before DataFusion applies the full expression.

`LIMIT 0` is optimized for schema probes. HarborSQL returns an empty batch with
the correct columns without enumerating catalogs, schemas, tables, or columns.

## Catalog Scope Validation

`<catalog>.information_schema.catalogs` validates the catalog name through
Unity Catalog. A query such as:

```sql
SELECT *
FROM bogus.information_schema.catalogs;
```

returns no catalog rows unless Unity Catalog lists `bogus` for the caller.

## Authorization

HarborSQL forwards the caller's Databricks bearer token to Unity Catalog for
metadata discovery. The caller sees only metadata that Unity Catalog allows that
identity to access.

HarborSQL does not persist bearer tokens, and metadata queries do not request
temporary cloud credentials.

## Databricks System Tables

Databricks also exposes system schemas such as:

```sql
system.access.audit
system.access.table_lineage
system.billing.usage
```

These are different from `system.information_schema`. Unity Catalog describes
many of them as Databricks-managed Delta Sharing tables rather than externally
readable Delta tables.

HarborSQL can resolve their schema for metadata probes:

```sql
SELECT *
FROM system.access.audit
LIMIT 0;
```

Actual reads from these Databricks system tables are not supported yet:

```sql
SELECT *
FROM system.access.audit
LIMIT 10;
```

That query returns an unsupported SQL error because HarborSQL does not yet have
a system-table or Delta Sharing execution backend.

## Related Metadata Paths

HarborSQL also supports:

- [SHOW statements](./show-statements.md) for common catalog, schema, table, and
  view discovery.
- JDBC/Databricks SQL connector column metadata calls through Unity Catalog.

