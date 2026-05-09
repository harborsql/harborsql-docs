---
title: Result Types
---

# Result Type Support

HarborSQL encodes Databricks SQL connector result pages directly from Arrow
arrays. The current Thrift result type matrix is explicit:

| Arrow/DataFusion type | Thrift result representation |
| --- | --- |
| `Boolean` | boolean |
| `Int8`, `Int16`, `Int32` | int |
| `Int64`, `UInt8`, `UInt16`, `UInt32` | bigint |
| `UInt64` | bigint only when the value fits in signed `i64` |
| `Float32`, `Float64` | double |
| `Utf8`, `LargeUtf8` | string |
| `Date32`, `Date64` | date metadata with string values |
| `Timestamp` | timestamp metadata with string values |

Other Arrow types, including decimal, binary, nested, interval, dictionary, and
time-only values, return `UNSUPPORTED_RESULT_TYPE` instead of being coerced.

## Query Surface

The default runtime is intentionally read-only. It targets `SELECT` workloads
against Unity Catalog Delta tables and does not currently provide Cloud Fetch,
durable result storage, streaming result storage, or broad Databricks SQL
protocol coverage.
