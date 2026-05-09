---
title: Benchmarks
---

# Benchmarks

Benchmark harnesses, topology notes, Unity Catalog setup runbooks, generated
results, server logs, and environment-specific datasets live outside the engine
repository.

Keep the HarborSQL runtime repository focused on the runtime and public
compatibility fixtures. In particular, do not commit:

- Generated benchmark result files
- Raw server or client logs
- Private workspace hostnames
- Cloud account identifiers
- Bucket names or object paths
- Temporary credentials or presigned URLs

The release workflow can run a benchmark gate before publishing. For manual
release runs, override `benchmark_command` when the benchmark suite lives in a
separate checkout or needs a custom command. The default benchmark gate is the
repository-local release test command:

```bash
cargo test --release --locked --all-targets
```

If public benchmark summaries are added later, keep them aggregated and
scrubbed so they do not reveal private workspace, storage, credential, or
network topology details.

Public benchmark summaries for the project website should live on
`https://harborsql.com/benchmarks.html`.
