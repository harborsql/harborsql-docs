---
title: Why I built HarborSQL
description: Why HarborSQL exists as a lighter SQL Warehouse-compatible runtime for Unity Catalog Delta workloads.
---

# Why I built HarborSQL

SQL Warehouses have become the default entry point for exposing data in Databricks.

As DuckDB has shown over the past few years, queries on data lakes are rarely big data queries. Most of them fit in memory. HarborSQL follows that idea by providing a SQL server that does not rely on Spark to execute queries.

The second motivation came from Databricks SQL Warehouses. This is the flagship product for exposing data. Every external tool that wants to access your data goes through a warehouse, whether it is for visualization, an MCP, a business application...

You can even route data transformations through it. From there, SQL Warehouses become a central piece of the Modern Data Stack offered by Databricks. And also a major cost center.

Warehouses are not cheap. The smallest warehouse size, `2XS`, costs `2.8$/h` (`3.6$/h` in Europe) at public pricing. That is the price of an H100 GPU at some providers, and here we are just talking about running SQL.

On top of that, it is relatively limited when it comes to concurrency. A warehouse can only support 10 parallel queries. Without autoscaling, you quickly saturate it and queries get queued.

In [their docs](https://docs.databricks.com/aws/en/compute/sql-warehouse/warehouse-behavior), there is a paragraph about the AWS instances used for the cluster. For `2XS`, you get 2 `i3.2xlarge` machines, priced at `0.62$` per hour.

Those two drawbacks, plus the emergence of non-distributed query engines, got me thinking: what if we had a query server that supported the warehouse protocol, but ran queries on an engine lighter than Spark?

All while keeping Unity Catalog for permission management and data cataloging.

## How it works

For some time now, Unity has supported queries from external engines. You just need to grant the principal that will run the query a new permission:

```sql
GRANT EXTERNAL USE SCHEMA ON SCHEMA <catalog>.<schema> TO `<principal>`;
```

Once that is done, you can ask Unity through the API where the Delta files for your table are, and retrieve temporary credentials to read them.

HarborSQL uses this mechanism, which lets it keep governance entirely on Unity. When a HarborSQL server starts, it does not need any static cloud credentials. You only need to specify the URL of the Unity instance, which in the Databricks case is a workspace.

HarborSQL then exposes an endpoint that accepts SQL queries. This endpoint follows the same path as the Databricks endpoints. And in the same way, for authentication, you pass your PAT token in the `Authorization` header.

HarborSQL parses the query, identifies the requested tables, and uses the token to ask Unity for the tables and temporary credentials. It then opens the Delta tables and hands the query to DataFusion for execution. It waits for the query engine response before materializing the result and sending it back to the client.

## Does it work?

The simplest way to check whether this project works is to mount a Delta table, write code to query it through a Databricks SQL Warehouse, then switch to HarborSQL. It should only be a URL change.

To do that, I used the ClickBench benchmark, which is well known in big data because ClickHouse popularized it. I played a bit with different AWS instance types by deploying HarborSQL in the same region as the S3 bucket containing the data.

With a `c8.2xlarge` instance, HarborSQL is almost 2x faster than the Databricks `2XS` instance while costing `0.44$/h`. In raw compute cost, that gives roughly 94% savings.

This benchmark also validates the correctness of the datasets returned by HarborSQL, both at the metadata level and in the data itself. To go further, I added a benchmark on the types available in Delta and all possible subtype combinations to ensure as much compatibility as possible.

Another benchmark I wanted to run was about concurrency. Warehouses are unfortunately known for accepting only a small number of parallel queries, and my goal was to push HarborSQL concurrency as high as possible.

Using the ClickBench dataset again, I created a performance run with a series of point lookup queries on random IDs from the dataset. The benchmark is made up of 3 runs: one at 10 rps, one at 20 rps and one at 50 rps. The goal is to stress the system and see what it has in the tank.

Right now, HarborSQL responds faster than the `2XS` warehouse, but quite a few queries end in errors. Without a queue in front of it, HarborSQL cannot put queries on hold. This will need to be fixed in a future version.

Benchmark link: https://docs.harborsql.com/benchmarks

## What HarborSQL does not do yet

HarborSQL does not replace the whole surface area of a Databricks SQL Warehouse.

Today, there is no queue or admission control yet. There is also no Cloud Fetch and no durable result storage. And it is not meant to replace heavy SQL jobs that truly need a distributed engine.

The project first targets interactive, read-only workloads that are compatible with Databricks clients and small enough to run on a local engine.

## What are the advantages over Databricks?

As we saw, HarborSQL's main advantage is to provide an open source solution to replace the query engine for workloads that use a SQL Warehouse.

Infrastructure teams can take ownership of this project and more easily replace existing workloads. They can host it themselves on infrastructure they control, with the sizing they want for cost or performance.

SQL Warehouses are one of the last Databricks technologies without a simple open source equivalent. HarborSQL tries to fill that gap for workloads where Spark is heavier than necessary.
