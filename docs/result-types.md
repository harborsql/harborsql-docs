---
title: Result Types
---

# Result Type Support

HarborSQL encodes Databricks SQL connector result pages directly from Arrow
arrays. The current Thrift result type matrix is explicit:

| Arrow/DataFusion type | Databricks type metadata | Thrift value representation |
| --- | --- | --- |
| `Boolean` | boolean | boolean |
| `Int8` | tinyint | int |
| `Int16` | smallint | int |
| `Int32` | int | int |
| `Int64`, `UInt8`, `UInt16`, `UInt32` | bigint | bigint |
| `UInt64` | bigint | bigint only when the value fits in signed `i64` |
| `Float32` | float | double |
| `Float64` | double | double |
| `Utf8`, `LargeUtf8`, `Utf8View` | string | string |
| `Date32`, `Date64` | date | string |
| `Timestamp` | timestamp | string |
| `Binary`, `LargeBinary`, `FixedSizeBinary` | binary | binary |
| `Decimal128`, `Decimal256` | decimal with precision/scale qualifiers | string |
| `List`, `LargeList`, `FixedSizeList` | array | string |
| `Map` | map | string |
| `Struct` | struct | string |

Decimal and nested values are rendered in the compact Databricks-style display
form expected by connector compatibility tests. Arrays render as bracketed
values, maps and structs render as JSON-like objects, string values are quoted,
and nested date/timestamp values use Databricks-style textual dates and
timestamps.

Unsupported Arrow types, including interval, dictionary, duration, list views,
and time-only values, return `UNSUPPORTED_RESULT_TYPE` instead of being coerced.

## Query Surface

The default runtime is intentionally read-only. It targets `SELECT` workloads
against Unity Catalog Delta tables and does not currently provide Cloud Fetch,
durable result storage, streaming result storage, or broad Databricks SQL
protocol coverage.
