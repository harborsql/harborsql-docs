---
title: Building a Databricks SQL-compatible server with Rust and DataFusion
description: How HarborSQL implements the Databricks SQL protocol while using Unity Catalog, delta-rs, and DataFusion for query execution.
---

# Building a Databricks SQL-compatible server with Rust and DataFusion

Running SQL is the easy part of building a SQL server. Convincing an existing client that it is talking to the server it expects is where things get interesting.

The Databricks SQL Connector does not send a SQL string and wait for a JSON response. It opens a session, submits a statement, polls an operation, asks for result metadata, fetches rows, and eventually closes the operation. JDBC drivers add their own metadata calls and setup queries around that flow.

HarborSQL implements enough of this protocol to let supported Databricks clients query Unity Catalog Delta tables through DataFusion. The goal is simple: keep the client, the identity, and the catalog, but replace the query compute.

## What the client actually sends

Databricks SQL clients use Thrift over HTTP. A basic query involves several RPCs:

```text
Databricks SQL client
  -> OpenSession
  -> ExecuteStatement
  -> GetOperationStatus
  -> GetResultSetMetadata
  -> FetchResults
  -> CloseOperation
```

The SQL statement is only one message in the middle of that exchange.

`OpenSession` establishes a default catalog and schema. `ExecuteStatement` returns an operation handle before the query has necessarily finished. The client can then poll that handle, inspect the result schema, and fetch one or more pages of rows.

This means HarborSQL needs to behave like a stateful server even though DataFusion itself can execute a query in a single asynchronous call.

I implemented the Thrift binary reader and writer in Rust and kept the supported surface intentionally small. HarborSQL handles the methods used by the Python connector and the tested JDBC drivers, then returns a clear error for methods it does not support.

Trying to reproduce the complete Databricks SQL protocol would turn the project into a compatibility exercise with no end. The useful target is the smallest surface that supports real read-only workloads.

## Sessions and operations are separate state machines

A session stores the active catalog, schema, creation time, and last access time. An operation stores a running task or its finished result.

When HarborSQL receives `ExecuteStatement`, it creates an operation ID, starts the query in a Tokio task, and immediately returns the operation handle. Later requests use that handle to check the state or retrieve the result.

```text
HTTP and Thrift
  -> session state
  -> operation state
  -> QueryEngine
       -> Unity Catalog
       -> delta-rs
       -> DataFusion
  -> Arrow result
  -> Thrift result pages
```

Operations can be running, finished, failed, or canceled. HarborSQL also limits the number of sessions and operations, expires idle sessions, and removes completed operations after a configurable TTL.

The handles themselves contain an ID and a secret. HarborSQL also binds server-side state to a fingerprint of the bearer token. A client cannot take an operation handle created with one token and use it with another identity.

Cancellation is another detail that looks trivial until it is not. `CancelOperation` must abort a running Tokio task, preserve a terminal canceled state for later polling, and leave an already completed operation alone. Closing an operation removes its retained result instead.

None of this makes a query faster. All of it is required before a normal SQL client behaves correctly.

## Unity Catalog remains the authorization layer

I did not want HarborSQL to maintain a second set of users, grants, or cloud credentials.

The client sends a Databricks bearer token with each request. HarborSQL forwards that token to Unity Catalog when it resolves catalogs, schemas, tables, and temporary table credentials. Unity Catalog therefore answers every metadata request as the caller, not as a shared HarborSQL service account.

The principal needs the usual catalog and table permissions, plus one permission that allows an external engine to request credentials:

```sql
GRANT EXTERNAL USE SCHEMA ON SCHEMA <catalog>.<schema> TO `<principal>`;
```

When DataFusion asks for a table, HarborSQL calls the Unity Catalog table API and requests temporary credentials for that table. It then passes the storage location and credentials to `delta-rs`, which opens the Delta log and creates a DataFusion table provider.

The credentials are short-lived, so the table cache cannot be global or permanent. HarborSQL keys cached providers by the caller identity and table, then expires them before the Unity Catalog credentials expire. Bearer tokens and temporary credentials are never persisted.

This preserves the important part of the Databricks security model. Users only see tables Unity Catalog allows them to see, and HarborSQL does not need static access keys for the object store.

## DataFusion loads Unity Catalog tables lazily

DataFusion normally expects catalogs and schemas to expose their tables through provider traits. Unity Catalog exposes the same hierarchy through an HTTP API.

HarborSQL connects the two with implementations of DataFusion's `CatalogProviderList`, `CatalogProvider`, and `SchemaProvider`. These providers are lazy. Looking up `analytics.events` does not load every table in the schema. It resolves only the table requested by the query planner.

For each query, HarborSQL creates a DataFusion session with the client's default catalog and schema. It registers the Unity Catalog-backed providers, the object stores associated with opened Delta tables, and a small set of compatibility functions.

DataFusion then parses, plans, and executes the query. Results arrive as a stream of Arrow record batches.

The lazy approach matters because catalog discovery can otherwise add several remote calls before the query even starts. It also keeps temporary credential vending scoped to tables that the query actually touches.

## Databricks SQL and DataFusion SQL are not identical

Supporting the protocol does not make the SQL dialect compatible.

Most common expressions work directly, but the edge cases appear quickly when the same query runs against two different engines. HarborSQL currently applies a focused set of rewrites for differences found in connector tests and benchmarks.

Some examples are:

- Databricks-style names for unaliased expressions and `COUNT(*)` metadata.
- Zero-based `get(array, index)` behavior mapped to DataFusion's one-based array access.
- Binary `length` behavior that counts bytes without trying to decode UTF-8.
- Specific `REGEXP_REPLACE` capture-group shapes.
- Minute extraction and contains-style `LIKE` expressions used by compatibility queries.

I do not want HarborSQL to become a second SQL parser that rewrites everything until the output looks vaguely correct. Each rewrite needs a narrow shape, a known behavioral difference, and a test.

When a difference cannot be handled safely, returning an unsupported SQL error is better than silently changing the meaning of the query.

## Arrow results still need Databricks-shaped metadata

Once DataFusion finishes, HarborSQL has Arrow arrays. The client expects Thrift column values, type descriptors, null bitsets, row offsets, and a flag indicating whether more rows are available.

Primitive types are straightforward until metadata enters the picture. A decimal needs its precision and scale qualifiers. Dates and timestamps need Databricks-compatible text formatting. Binary data needs a binary Thrift column rather than a string conversion.

Nested values are more awkward. Arrays, maps, and structs are returned through Databricks-style display strings because the focused Thrift result surface does not expose them as native nested columns. Strings inside those values need quoting, nulls need the expected representation, and nested dates need the same formatting as top-level dates.

Unsupported Arrow types return `UNSUPPORTED_RESULT_TYPE`. HarborSQL does not coerce an interval or duration into a value that happens to make it across the wire.

Results are currently materialized in bounded memory before clients fetch them. This keeps paging predictable and makes the first implementation manageable, but it is not Cloud Fetch and it is not a durable result store. Large result delivery is one of the places where a managed SQL Warehouse still has a much broader system behind it.

## Real drivers are the compatibility test

Protocol unit tests are useful because they catch incorrect field IDs, operation states, type descriptors, and null bitsets. They do not prove that a real driver will accept the response.

HarborSQL also runs smoke tests against the Python `databricks-sql-connector` and the supported Databricks JDBC driver lines. These tests start the server, connect through the actual client, execute a query, inspect column metadata, fetch rows, and close the resources.

The JDBC tests were particularly useful. JDBC clients ask more metadata questions than a small Python script and make assumptions about result column labels, session setup, and authentication behavior. A server can execute the SQL correctly and still fail before the application receives its first row.

For data correctness, I run the same benchmark and type-compatibility queries through a Databricks SQL Warehouse and HarborSQL. Comparing only execution time would miss the harder class of failures: correct-looking rows with different types, names, null behavior, or nested formatting.

## What HarborSQL still does not pretend to be

HarborSQL is a read-only, single-engine runtime. It does not implement writes, Cloud Fetch, durable result storage, or the complete Databricks SQL protocol. It is also not a distributed replacement for queries that genuinely need a Spark cluster.

There is still compatibility work to do. Every new BI tool or driver version can exercise another metadata method or another corner of the protocol. Admission control and queueing also matter once concurrency exceeds what one process can execute at the same time.

But the narrow version is already useful. If your workload is a set of interactive reads over Unity Catalog Delta tables, the query does not need distributed compute, and your client uses the supported protocol surface, you can move the compute without rebuilding the application or duplicating the catalog.

That is the line HarborSQL is trying to hold: compatible where compatibility has been tested, explicit everywhere else.

You can review the [source code](https://github.com/harborsql/harborsql), follow the [Getting Started](../getting-started) guide, or inspect the current [SQL compatibility notes](../sql-compatibility) before trying one of your own queries.
