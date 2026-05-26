---
title: SHOW Statement Support
---

# SHOW Statement Support

HarborSQL handles supported Databricks `SHOW` statements through a Unity Catalog
metadata path. These statements do not run through Apache DataFusion and do not
open Delta tables.

For each supported `SHOW` statement, HarborSQL forwards the Databricks token
received from the client to Unity Catalog. The caller sees only metadata that
Unity Catalog allows that identity to access.

## Supported Statements

```sql
SHOW CATALOGS [ [ LIKE ] regex_pattern ]
SHOW SCHEMAS [ { FROM | IN } catalog_name ] [ [ LIKE ] regex_pattern ]
SHOW DATABASES [ { FROM | IN } catalog_name ] [ [ LIKE ] regex_pattern ]
SHOW TABLES [ { FROM | IN } schema_name ] [ [ LIKE ] regex_pattern ]
SHOW VIEWS [ { FROM | IN } schema_name ] [ [ LIKE ] regex_pattern ]
SHOW TABLE EXTENDED [ { IN | FROM } schema_name ] LIKE regex_pattern
```

`SHOW SCHEMAS` and `SHOW DATABASES` are treated as aliases.

## Namespace Resolution

If no catalog or schema is specified, HarborSQL uses the catalog and schema from
the active Databricks SQL session. For the JSON query endpoint, it uses the
request catalog and schema, falling back to `HARBORSQL_DEFAULT_CATALOG` and
`HARBORSQL_DEFAULT_SCHEMA`.

For table and view discovery:

- `SHOW TABLES` uses the current catalog and schema.
- `SHOW TABLES IN schema_name` uses the current catalog and the provided schema.
- `SHOW TABLES IN catalog_name.schema_name` uses the provided catalog and schema.

`SHOW VIEWS` and `SHOW TABLE EXTENDED` follow the same namespace rules.

## Pattern Matching

HarborSQL follows Databricks pattern matching for this `SHOW` subset:

- Matching is case-insensitive.
- Leading and trailing blanks in the pattern are trimmed.
- `*` matches zero or more characters.
- `|` separates alternatives.
- Other pattern characters are interpreted as regular expression syntax.

Examples:

```sql
SHOW CATALOGS LIKE 'prod*'
SHOW SCHEMAS IN main LIKE 'sales*|finance*'
SHOW TABLES IN main.analytics LIKE 'fact_[a-z]+'
```

## Result Columns

| Statement | Columns |
| --- | --- |
| `SHOW CATALOGS` | `catalog` |
| `SHOW SCHEMAS` / `SHOW DATABASES` | `databaseName` |
| `SHOW TABLES` | `database`, `tableName`, `isTemporary` |
| `SHOW VIEWS` | `namespace`, `viewName`, `isTemporary` |
| `SHOW TABLE EXTENDED` | `database`, `tableName`, `isTemporary`, `information` |

HarborSQL does not currently create session-local temporary objects, so
`isTemporary` is always `false`.

## Current Limits

`SHOW TABLE EXTENDED ... PARTITION (...)` is parsed but returns an unsupported
SQL error. Partition-specific table metadata requires a separate Delta metadata
design.

These statements are not part of the initial `SHOW` metadata surface:

- `SHOW COLUMNS`
- `SHOW FUNCTIONS`
- `SHOW GRANTS`
- `SHOW TBLPROPERTIES`
- `SHOW CREATE`
- `SHOW PARTITIONS`

Unsupported `SHOW` syntax returns HarborSQL's stable `UNSUPPORTED_SQL` client
error code.
