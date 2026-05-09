---
title: Docker
---

# Docker

HarborSQL publishes a Docker image to GitHub Container Registry:

```bash
ghcr.io/harborsql/harborsql:<tag>
```

Use a pinned release tag for repeatable deployments. Non-prerelease releases
may also publish `latest`, but production deployments should prefer an explicit
version tag.

## Run the Server

```bash
export TAG="<version>"

docker pull ghcr.io/harborsql/harborsql:$TAG

docker run --rm \
  --name harborsql \
  -p 127.0.0.1:1992:1992 \
  -e HARBORSQL_BIND_ADDR="0.0.0.0:1992" \
  -e HARBORSQL_DATABRICKS_HOST="https://<workspace-host>" \
  ghcr.io/harborsql/harborsql:$TAG
```

The image entrypoint is the `harborsql` binary and the default command is
`server`.

`HARBORSQL_BIND_ADDR=0.0.0.0:1992` makes HarborSQL listen on the container
interface. The Docker port mapping above still binds the published port to
`127.0.0.1` on the host, so local clients connect to:

```text
http://127.0.0.1:1992
```

Add `HARBORSQL_DEFAULT_CATALOG`, `HARBORSQL_DEFAULT_SCHEMA`, or
`HARBORSQL_AWS_REGION` only when the defaults do not match your workspace.

## Use an Env File

For local runs, you can keep non-secret defaults in an env file:

```bash
cat > .env.harborsql <<'EOF'
HARBORSQL_BIND_ADDR=0.0.0.0:1992
HARBORSQL_DATABRICKS_HOST=https://<workspace-host>
EOF

docker run --rm \
  --name harborsql \
  -p 127.0.0.1:1992:1992 \
  --env-file .env.harborsql \
  ghcr.io/harborsql/harborsql:$TAG
```

Do not bake Databricks bearer tokens or temporary cloud credentials into custom
images. Pass credentials at runtime through your orchestrator's secret
mechanism.

## Docker Compose

```yaml
services:
  harborsql:
    image: ghcr.io/harborsql/harborsql:${HARBORSQL_TAG}
    ports:
      - "127.0.0.1:1992:1992"
    environment:
      HARBORSQL_BIND_ADDR: "0.0.0.0:1992"
      HARBORSQL_DATABRICKS_HOST: "https://<workspace-host>"
```

Run it with:

```bash
export HARBORSQL_TAG="<version>"
docker compose up
```

## Production Notes

- Serve HarborSQL over HTTPS, or behind a TLS-terminating proxy.
- Keep the HarborSQL-to-Databricks hop on HTTPS for real Databricks workspaces.
- Publish container ports only on trusted interfaces.
- Expose `/metrics` only on a trusted network or behind authenticated monitoring.
- Keep Databricks tokens and temporary cloud credentials out of images, logs, and committed env files.
