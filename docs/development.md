---
title: Development
---

# Development

Run the core checks from the HarborSQL engine repository:

```bash
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked --all-targets
```

Connector smoke-test setup lives in [Connector Smoke Tests](./connector-smoke-tests).

## Project Docs

- [Connector Smoke Tests](./connector-smoke-tests)
- [Release Publishing](./releases)
- [Benchmark Policy](./benchmarks)
- [Security Policy](./security)

## Documentation Site

Run the documentation site locally from this repository:

```bash
npm install
npm start
```

Build the static site:

```bash
npm run build
```
