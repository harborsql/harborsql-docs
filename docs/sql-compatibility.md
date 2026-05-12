---
title: SQL Compatibility Notes
---

# SQL Compatibility Notes

HarborSQL executes SQL with Apache DataFusion. Most scalar SQL functions follow
DataFusion behavior, which can differ from Databricks SQL Warehouse for edge
cases. This page records known differences and recommended workarounds.

## `REGEXP_REPLACE` and Embedded Line Breaks

A ClickBench Q29 validation mismatch isolated a difference in this expression:

```sql
REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '$1')
```

The pattern extracts a domain-like key from a URL. The compatibility gap is the
unflagged dot in the suffix:

```regex
.*$
```

DataFusion uses Rust regex semantics: `.` does not match `\n` unless DOTALL mode
is enabled. For strings like this:

```text
http://example.com/path<LF>more text
```

DataFusion does not match the full pattern, so `REGEXP_REPLACE` returns the
original multi-line string. Databricks SQL Warehouse grouped the affected
ClickBench table-column values under `example.com`, so aggregate `COUNT(*)`
values changed.

### Workaround

Make DOTALL behavior explicit in the pattern:

```sql
REGEXP_REPLACE(Referer, '(?s)^https?://(?:www\.)?([^/]+)/.*$', '$1')
```

or use an explicit any-character class:

```sql
REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/[\s\S]*$', '$1')
```

The `(?s)` form is preferred. It keeps the grouping-key extraction compatible
for values with embedded line breaks without changing other expressions such as
`length(Referer)`.

### Runtime configuration

There is no HarborSQL or DataFusion runtime configuration setting that turns
DOTALL on globally for `REGEXP_REPLACE`. DOTALL is a regex-pattern option, so
opt in by rewriting the query pattern when this behavior is desired.

HarborSQL intentionally does not rewrite user regexes automatically. Applying
DOTALL broadly can change valid queries where newlines are meant to be
boundaries.
