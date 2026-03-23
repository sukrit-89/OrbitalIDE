# Backend Compiler Service

## Service Summary

The backend compiler converts Soroban Rust source into WASM for frontend deployment.

- Runtime: Node.js + Express
- Build toolchain: Rust + Cargo + wasm32 target
- Optional optimization: `stellar contract optimize`

## Endpoints

### `GET /health`

Returns toolchain and readiness status.

Example response fields:

- `status`: `ok` or `degraded`
- `ready`: boolean
- `rust`, `cargo`, `stellarCli`
- `wasmTarget`: boolean
- `activeCompilations`: number

### `POST /compile`

Compiles provided Rust source and returns base64 WASM.

Request:

```json
{
  "source": "#![no_std] ..."
}
```

Success response:

```json
{
  "wasm": "<base64>",
  "size": 1234,
  "compiledIn": 5400
}
```

Error response:

```json
{
  "error": "compiler error summary"
}
```

## Runtime Controls

Environment variables (from `server/index.js` and Dockerfile):

- `PORT` (default `3001`)
- `COMPILE_TIMEOUT` (default `120000` ms)
- `MAX_SOURCE_SIZE` (default `102400` bytes)
- `MAX_CONCURRENT` (default `3`)
- `ALLOWED_ORIGINS` (comma-separated CORS origins)

## Operational Notes

- Compiles occur in temporary project directories.
- Compiler service can be run directly or in Docker.
- On locked-down Windows setups, App Control policies may block execution of Cargo build scripts in `%TEMP%` (see troubleshooting).
