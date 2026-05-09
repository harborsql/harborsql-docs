---
title: Configuration
---

# Configuration

HarborSQL reads configuration from environment variables.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `HARBORSQL_DATABRICKS_HOST` or `DATABRICKS_HOST` | yes | none | Databricks workspace URL or host; defaults to `https://` when no scheme is supplied and rejects `http://` unless explicitly allowed |
| `HARBORSQL_UNSAFE_ALLOW_HTTP_DATABRICKS_HOST` | no | `false` | Allows an `http://` Databricks host value for local non-Databricks test endpoints only; do not use with real Databricks bearer tokens |
| `HARBORSQL_BIND_ADDR` | no | `127.0.0.1:1992` | HTTP bind address |
| `HARBORSQL_DEFAULT_CATALOG` or `DATABRICKS_CATALOG` | no | `workspace` | Default catalog for unqualified queries |
| `HARBORSQL_DEFAULT_SCHEMA` or `DATABRICKS_SCHEMA` | no | `default` | Default schema for unqualified queries |
| `HARBORSQL_AWS_REGION` | no | `us-west-2` | AWS region passed to Delta object-store access |
| `HARBORSQL_MAX_RESULT_ROWS` | no | `100000` | Maximum rows HarborSQL will materialize for one query; set to an empty value to disable |
| `HARBORSQL_MAX_RESULT_BYTES` | no | `67108864` | Maximum retained Arrow result page bytes HarborSQL will materialize for one query; set to an empty value to disable |
| `HARBORSQL_UNITY_TIMEOUT_SECONDS` | no | `30` | Timeout for Unity Catalog HTTP requests |
| `HARBORSQL_QUERY_TIMEOUT_SECONDS` | no | `300` | Timeout for each query execution |
| `HARBORSQL_IDLE_SESSION_TIMEOUT_SECONDS` | no | `1800` | Idle timeout for Thrift sessions |
| `HARBORSQL_COMPLETED_OPERATION_TTL_SECONDS` | no | `600` | Retention time for completed Thrift operations and their materialized results |
| `HARBORSQL_CLEANUP_INTERVAL_SECONDS` | no | `60` | Background cleanup interval for expired sessions and operations |
| `HARBORSQL_MAX_SESSIONS` | no | `256` | Maximum concurrent Thrift sessions |
| `HARBORSQL_MAX_OPERATIONS` | no | `512` | Maximum retained Thrift operations |
| `HARBORSQL_REQUEST_BODY_LIMIT_BYTES` | no | `1048576` | Maximum HTTP request body size |
| `HARBORSQL_PARQUET_PUSHDOWN_FILTERS` | no | `true` | Enable DataFusion Parquet filter pushdown and late materialization |
| `HARBORSQL_PARQUET_REORDER_FILTERS` | no | same as `HARBORSQL_PARQUET_PUSHDOWN_FILTERS` | Reorder pushed-down Parquet filters heuristically |
| `HARBORSQL_TARGET_PARTITIONS` | no | max of available CPU parallelism and `32` | DataFusion target partition count |
| `HARBORSQL_SKIP_PARTIAL_AGGREGATION_PROBE_ROWS_THRESHOLD` | no | `10000` | Rows per partition DataFusion samples before bypassing partial aggregation for high-cardinality group keys |
| `HARBORSQL_SKIP_PARTIAL_AGGREGATION_PROBE_RATIO_THRESHOLD` | no | `0.8` | Distinct-groups/input-rows ratio that triggers partial aggregation bypass |
| `HARBORSQL_TABLE_CACHE_TTL_SECONDS` | no | `300` | Maximum lifetime for token-scoped cached table providers; set to `0` to disable |
| `HARBORSQL_TABLE_CACHE_MAX_ENTRIES` | no | `1024` | Maximum token/table/region cache entries; set to `0` to disable |
| `HARBORSQL_UNSAFE_LOG_SQL` | no | `false` | Include redacted SQL text in internal tracing spans for controlled debugging; SQL is omitted from logs by default |
| `DATABRICKS_TOKEN` | query mode only | none | Token used by `harborsql query --sql ...` |

## Safety Defaults

- Real Databricks workspaces must use HTTPS.
- SQL text is not logged by default.
- Result materialization is bounded by row and byte limits.
- Session and operation retention are bounded by count and TTL.
