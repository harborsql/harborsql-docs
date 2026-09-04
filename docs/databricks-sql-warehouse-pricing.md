---
title: Databricks SQL Warehouse Pricing Explained
description: Calculate Databricks SQL Warehouse cost from DBUs, cloud compute, runtime, and workload measurements, then compare it with HarborSQL.
slug: /databricks-sql-warehouse-pricing
sidebar_label: SQL Warehouse Pricing
keywords:
  - databricks sql warehouse pricing
  - databricks sql pricing
  - databricks sql warehouse cost
  - databricks dbu pricing
  - sql warehouse cost comparison
---

# Databricks SQL Warehouse Pricing Explained

Databricks SQL Warehouse cost cannot be reduced to one universal hourly price.
The result depends on the cloud, region, warehouse type and size, active
clusters, runtime, list or contract price, and whether cloud infrastructure is
included in the selected SKU.

The reliable way to compare costs is to calculate each billable layer, then
divide the result by completed work. This page provides that model and applies
it to HarborSQL's published benchmark without presenting the benchmark input as
a current Databricks list price.

## The Databricks SQL Cost Formula

Databricks defines a DBU as a normalized unit of processing power used for
measurement and pricing. The number of DBUs consumed depends on the workload's
processing. Public prices vary by product, cloud, and region, while negotiated
contracts can change the effective rate.

Use this base formula for a warehouse run:

```text
Databricks platform cost
  = DBUs consumed × effective price per DBU

Total warehouse cost
  = platform cost
  + cloud infrastructure not included in the SKU
  + storage, networking, and related service charges
```

For a fixed-rate estimate where the warehouse consumption is expressed in DBUs
per hour:

```text
Platform cost
  = DBUs per hour × active hours × effective price per DBU
```

Use the [official Databricks pricing page](https://www.databricks.com/product/pricing)
or your contract for the effective rate. Databricks states that its pricing is
compute-based, that storage and networking vary by service and cloud provider,
and that prices can differ by region. For actual consumption, use the account
billing records rather than an estimate based only on configured warehouse
size.

## Warehouse Type Changes the Bill

Databricks SQL supports
[serverless, pro, and classic warehouses](https://docs.databricks.com/aws/en/compute/sql-warehouse/warehouse-types).
They do not have the same infrastructure boundary:

| Warehouse type | Compute location | Cost detail to verify |
| --- | --- | --- |
| Serverless | Managed in the Databricks account | Check the serverless SKU rate and what it includes |
| Pro | Runs in the customer's cloud account | Add applicable cloud infrastructure to the Databricks charge |
| Classic | Runs in the customer's cloud account | Add applicable cloud infrastructure to the Databricks charge |

Serverless also starts and scales differently from pro and classic. Databricks
documents typical serverless startup of 2 to 6 seconds, while pro and classic
typically take about four minutes to start. Startup, minimum cluster settings,
autoscaling, and auto-stop behavior can therefore affect how long compute stays
billable.

## A Worked Estimate

Assume a warehouse consumes 4 DBUs per hour, runs for 100 active hours, and the
account's effective rate is $0.90 per DBU:

```text
4 DBU/hour × 100 hours × $0.90/DBU = $360
```

That is a calculation example, not a current universal Databricks price. Add
any cloud infrastructure, storage, networking, taxes, support, or other product
charges that apply to the account.

The same distinction applies to HarborSQL's benchmark. Its Databricks
2X-Small row uses **$3.60 per hour as a benchmark assumption**, derived from
4 DBUs per hour at $0.90 per DBU. It is not labeled as Databricks' current list
price. Replace both inputs with your billing data before estimating savings.

## HarborSQL Benchmark Cost Comparison

The current public ClickBench result uses 43 analytical queries, three runs per
query, an S3-backed optimized table, and a client in the same AWS region. The
published compute-only results are:

| System | Configuration | Assumed hourly compute | Best total time | Modeled best-run cost |
| --- | --- | ---: | ---: | ---: |
| HarborSQL v0.1.9 | `c8i.2xlarge` | $0.4454 | 91.351 seconds | $0.0113 |
| Databricks SQL v2026.10 | 2X-Small, without Cloud Fetch | $3.60 | 170.3 seconds | $0.1703 |
| Databricks SQL v2026.10 | 2X-Small, with Cloud Fetch | $3.60 | 165.7 seconds | $0.1657 |

The modeled cost is simply:

```text
run cost = hourly compute price × elapsed seconds ÷ 3,600
```

For the published configurations, HarborSQL's best run was about 46 percent
shorter than the Databricks run without Cloud Fetch, and its modeled
compute-only cost was about 93 percent lower. Those percentages describe this
test, not a general price or performance guarantee.

Review the [benchmark methodology and raw results](/benchmarks) before using the
numbers. The benchmark excludes engineering labor, storage, networking,
control-plane services, and idle time. The HarborSQL point-lookup concurrency
test also records failed requests, which is why cost per successful request
matters more than a low instance rate.

## How HarborSQL Cost Is Calculated

HarborSQL does not charge DBUs. Its direct query-compute estimate starts with
the infrastructure you choose:

```text
HarborSQL compute cost
  = instance hourly price × provisioned hours × instance count
```

That simpler line item does not mean the total cost is only the virtual
machine. A production estimate should include:

- Load balancing and TLS termination.
- Monitoring, logs, and retained telemetry.
- Data transfer and object-store requests.
- Standby capacity, redundancy, and idle time.
- Deployment, upgrades, incident response, and on-call labor.
- Any Databricks and Unity Catalog charges that remain in the architecture.

HarborSQL exchanges managed warehouse operations for infrastructure control. A
team with a stable, compatible workload and existing operational capacity may
save money. A team that needs managed autoscaling, distributed execution, full
SQL compatibility, or strict availability targets may get better total value
from Databricks SQL.

## Compare Cost per Completed Workload

Use the same measurement window for both systems and calculate:

```text
cost per successful query
  = total cost during the window ÷ successful queries

cost per benchmark run
  = total cost during the window ÷ completed runs
```

Track latency percentiles and failures beside cost. A cheaper engine that
queues, times out, or returns incompatible results is not cheaper for the
application using it.

A practical evaluation looks like this:

1. Export the actual Databricks SKU usage and effective rates for the workload.
2. Capture representative SQL, result sizes, daily active periods, and peak
   concurrency.
3. Run the same requests against a right-sized HarborSQL deployment.
4. Validate values, column metadata, client behavior, failures, and latency.
5. Add shared infrastructure and engineering cost to both sides.
6. Compare monthly cost per successful workload, not hourly sticker price.

## When the Comparison Is Valid

HarborSQL is a candidate only for its supported boundary: interactive,
read-only SQL over Unity Catalog Delta tables that fits a single engine. It
does not replace distributed execution, writes, full Databricks SQL semantics,
Cloud Fetch, durable result storage, or the rest of the Databricks platform.

Start with the [capability comparison](./databricks-sql-warehouse-alternative)
and [SQL compatibility notes](./sql-compatibility). If the workload crosses
those limits, keep it on Databricks SQL or test a broader
[Databricks alternative](./articles/databricks-alternatives-sql-analytics).

## Frequently Asked Questions

### How much does a Databricks SQL Warehouse cost per hour?

There is no single rate. Calculate DBU consumption at the applicable cloud,
region, warehouse type, SKU, and contract price, then add infrastructure and
related charges that are not included.

### Is the $3.60 hourly benchmark figure a Databricks list price?

No. It is a transparent benchmark assumption based on 4 DBUs per hour at
$0.90 per DBU. Use the official price list and your contract for a current
estimate.

### Is self-hosting HarborSQL always cheaper?

No. The direct instance price can be lower for compatible workloads, but the
team takes responsibility for capacity, availability, monitoring, upgrades,
and support. Compare total cost per successful workload.

### Can HarborSQL replace every Databricks SQL Warehouse?

No. HarborSQL targets a narrow read-only workload. It should be evaluated
alongside Databricks rather than treated as a complete platform replacement.
