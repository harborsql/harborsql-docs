# HarborSQL Docs

Documentation site for HarborSQL, built with [Docusaurus](https://docusaurus.io/).

## Installation

```bash
npm install
```

## Local Development

```bash
npm start
```

This starts a local development server with live reload.

## Build

```bash
npm run build
```

The static site is generated into `build`.

## Vercel

Docusaurus builds to static files and works well on Vercel. This repository is
intended for `https://docs.harborsql.com`.

This repository includes `vercel.json` with:

- build command: `npm run build`
- output directory: `build`

When importing the repository in Vercel:

- Framework preset: Docusaurus, or Other if Vercel does not preselect it
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `build`

Recommended domain setup:

- `docs.harborsql.com` points at this Vercel project
- `harborsql.com` points at the marketing Vercel project
- `www.harborsql.com` redirects to `harborsql.com`
- `harborsql.com/docs` redirects to `https://docs.harborsql.com`
- `harborsql.com/docs/getting-started` redirects to `https://docs.harborsql.com/getting-started`

Use separate Vercel projects for the marketing site and documentation site.

## Local Verification

```bash
npm run build
npm run serve
```

The production build emits static files into `build`.

## Source Material

The initial docs were bootstrapped from `../harborsql/README.md` and related project docs in `../harborsql/docs`.
