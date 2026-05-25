---
title: Databricks JDBC Driver
---

# Databricks JDBC Driver

HarborSQL supports the Databricks JDBC driver over the same
Thrift-over-HTTP protocol surface used by Databricks SQL clients. The driver
authenticates to Databricks, sends the resulting token to HarborSQL, and
HarborSQL forwards that token to Unity Catalog when resolving table metadata
and temporary file credentials.

## Supported Versions

| Driver line | HarborSQL status | Smoke-tested version | Notes |
| --- | --- | --- | --- |
| Databricks JDBC 2.6.40+ legacy Simba line | Supported for PAT and bearer-token requests | `2.6.40` | OAuth M2M has a driver hostname gate; see [2.6.40 OAuth Hostname Behavior](#2640-oauth-hostname-behavior). |
| Databricks JDBC 3.x driver | Supported for PAT, bearer-token requests, and OAuth M2M | `3.3.3` | This is the recommended line for service-principal client credentials. |

The current HarborSQL smoke suite covers `2.6.40` and `3.x`. Driver `4.x` is
not part of the documented compatibility target.

## Required JDBC Shape

Use the HarborSQL HTTPS hostname as the JDBC `server-hostname`, keep the
Databricks-style `httpPath`, and force the driver onto the Thrift result path:

```text
jdbc:databricks://sql.example.com:443/default;
transportMode=http;
ssl=1;
httpPath=/sql/1.0/warehouses/harborsql;
UseThriftClient=1;
EnableArrow=0;
EnableQueryResultDownload=0;
EnableDirectResults=0;
EnableSQLExecDirectResults=0;
UseNativeQuery=1;
ConnCatalog=workspace;
ConnSchema=default;
...
```

For local, plain-HTTP protocol testing, use `ssl=0` and the local host and
port:

```text
jdbc:databricks://127.0.0.1:1992/default;transportMode=http;ssl=0;httpPath=/sql/1.0/warehouses/local;...
```

Production deployments should expose HarborSQL over HTTPS, or behind a
TLS-terminating ingress.

## Authentication Matrix

| Auth option | JDBC properties | 2.6.40 | 3.x | HarborSQL behavior |
| --- | --- | --- | --- | --- |
| Personal access token | `AuthMech=3`, `UID=token`, `PWD=<token>` | Supported and smoke-tested | Supported and smoke-tested | The driver may send `Authorization: Basic ...` with `token:<token>` credentials. HarborSQL extracts the password and forwards it as the Databricks bearer token. |
| OAuth token pass-through | `AuthMech=11`, `Auth_Flow=0`, `Auth_AccessToken=<token>` | Supported when the driver sends a bearer token | Supported when the driver sends a bearer token | HarborSQL accepts `Authorization: Bearer <token>` and forwards it to Unity Catalog. The token must already be accepted by Databricks Unity Catalog; HarborSQL does not exchange external IdP JWTs. |
| OAuth M2M client credentials | `AuthMech=11`, `Auth_Flow=1`, `OAuth2ClientId=<client-id>`, `OAuth2Secret=<client-secret>` | Not generally usable with an arbitrary HarborSQL hostname | Supported and smoke-tested | The driver obtains a Databricks OAuth token from the configured Databricks OAuth endpoint, then sends HarborSQL a bearer token. |
| OAuth U2M browser flow | `AuthMech=11`, `Auth_Flow=2` | Not a HarborSQL compatibility target | Not a HarborSQL compatibility target | Browser-based auth is intended for local interactive clients. HarborSQL only sees the resulting bearer token if the driver completes the flow. |

Databricks documents the upstream JDBC auth properties in the
[Databricks JDBC authentication settings](https://docs.databricks.com/aws/en/integrations/jdbc-oss/authentication)
and the legacy Simba
[JDBC authentication settings](https://docs.databricks.com/gcp/en/integrations/jdbc/authentication).

## PAT Example

Use this shape for Databricks personal access token testing:

```text
jdbc:databricks://sql.example.com:443/default;
transportMode=http;
ssl=1;
AuthMech=3;
UID=token;
PWD=<databricks-personal-access-token>;
httpPath=/sql/1.0/warehouses/harborsql;
UseThriftClient=1;
EnableArrow=0;
EnableQueryResultDownload=0;
EnableDirectResults=0;
EnableSQLExecDirectResults=0;
UseNativeQuery=1;
ConnCatalog=workspace;
ConnSchema=default
```

The same PAT must belong to a principal with the Unity Catalog permissions
documented in [Configuration](./configuration#unity-catalog-permissions).

## OAuth M2M Example

For service-principal client credentials, use the 3.x driver and configure the
driver to mint a Databricks OAuth access token:

```text
jdbc:databricks://sql.example.com:443/default;
transportMode=http;
ssl=1;
AuthMech=11;
Auth_Flow=1;
OAuth2ClientId=<service-principal-application-id>;
OAuth2Secret=<service-principal-oauth-secret>;
httpPath=/sql/1.0/warehouses/harborsql;
UseThriftClient=1;
EnableArrow=0;
EnableQueryResultDownload=0;
EnableDirectResults=0;
EnableSQLExecDirectResults=0;
UseNativeQuery=1;
ConnCatalog=workspace;
ConnSchema=default
```

When the JDBC hostname is the HarborSQL ingress instead of the Databricks
workspace hostname, configure the driver's OAuth token or discovery endpoint
properties to point at the Databricks workspace OAuth endpoint. Otherwise the
driver may try to fetch OAuth tokens from the HarborSQL hostname. Keep the
client ID and secret out of URLs and logs when your JDBC tool supports
separate sensitive connection properties.

The service principal needs the same Unity Catalog permissions as any other
caller, including `EXTERNAL USE SCHEMA` on the schemas queried through
HarborSQL.

## 2.6.40 OAuth Hostname Behavior

The `2.6.40` legacy driver checks the JDBC host before attempting OAuth M2M.
The host must end with one of these Databricks suffixes:

- `.databricks.com`
- `.gcp.databricks.com`
- `.azuredatabricks.net`
- `.databricks.azure.cn`
- `.databricks.azure.us`

If HarborSQL is exposed as a normal HTTPS ingress such as
`sql.example.com`, the driver fails before it contacts the OAuth token
endpoint. The observed driver error is:

```text
(500663) OAuth2 is currently supported on AWS, Azure, and GPC platforms.
```

Because of that driver-side hostname gate, use PAT or bearer-token
pass-through for `2.6.40`, or use the Databricks JDBC `3.x` driver for OAuth
M2M with a HarborSQL ingress hostname.
