---
title: HarborSQL Engineering Articles
description: Technical articles about HarborSQL architecture, Databricks SQL protocol compatibility, Unity Catalog, DataFusion, benchmarks, and design trade-offs.
slug: /category/articles
sidebar_label: Article overview
keywords:
  - harborsql articles
  - databricks sql protocol
  - unity catalog datafusion
  - rust sql engine
---

# HarborSQL Engineering Articles

HarborSQL is a read-only SQL engine for querying Unity Catalog Delta tables
without sending every compatible workload through a Databricks SQL Warehouse.
These articles explain why the project exists and how its protocol, catalog,
query, and result layers fit together.

The writing is aimed at engineers evaluating HarborSQL or building similar
systems with Rust, Apache Arrow, DataFusion, `delta-rs`, and Unity Catalog. Each
article documents the boundary between the focused open-source runtime and the
broader managed Databricks platform.

## Start with the product decision

[Seven Databricks alternatives for SQL analytics](/articles/databricks-alternatives-sql-analytics)
compares HarborSQL with Dremio, MotherDuck, ClickHouse, Trino, Snowflake, and
BigQuery. It starts from the workload boundary instead of treating every option
as a complete replacement for the Databricks platform.

[Why I built HarborSQL](/articles/why-i-built-harborsql) explains the workload that
motivated the project: interactive, read-only queries that keep Databricks
identity and Unity Catalog governance but do not require distributed Spark
compute. It also covers the trade-off behind running a smaller self-managed
engine.

Use the [Databricks SQL Warehouse alternative](../databricks-sql-warehouse-alternative)
guide for a capability-by-capability comparison. It identifies the workloads
that fit HarborSQL and the managed warehouse features that HarborSQL does not
try to reproduce.

Use the [Databricks SQL Warehouse pricing guide](../databricks-sql-warehouse-pricing)
to calculate DBU, infrastructure, runtime, and self-hosting costs without
treating one benchmark assumption as a universal list price.

## Read the implementation deep dive

[Building a Databricks SQL-compatible server with Rust and DataFusion](/articles/building-databricks-sql-compatible-server)
follows a query across the full system. It covers Thrift over HTTP, sessions,
asynchronous operations, Unity Catalog authorization, temporary credentials,
lazy Delta table loading, DataFusion execution, Arrow results, and real-driver
compatibility tests.

The implementation is intentionally narrow. HarborSQL supports tested Python
connector and JDBC paths, returns explicit errors for unsupported behavior, and
does not claim full Databricks SQL compatibility.

## Verify the claims

The [benchmark page](/benchmarks) publishes static headline results,
methodology, hardware, datasets, limitations, and links to the raw benchmark
artifacts. The [SQL compatibility notes](../sql-compatibility) and
[result-type documentation](../result-types) define the current functional
surface.

For code-level detail, review the
[HarborSQL source](https://github.com/harborsql/harborsql) and the
[reproducible benchmark repository](https://github.com/harborsql/harborsql-bench).
