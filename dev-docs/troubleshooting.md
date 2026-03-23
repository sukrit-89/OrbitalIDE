# Troubleshooting

## Backend compile fails with `os error 4551`

Symptom:

- `POST /compile` fails with messages similar to:
  - `failed to run custom build command`
  - `An Application Control policy has blocked this file. (os error 4551)`

Cause:

- Windows Application Control policy blocks execution of generated Cargo build scripts from temp directories.

Workarounds:

1. Run compiler service in Docker (`docker compose up`) to isolate toolchain execution.
2. Adjust enterprise endpoint policy to allow Cargo build artifacts in temp directories (if permitted by admin).
3. Move compilation to a trusted path and adjust policy accordingly (requires backend change and policy alignment).

## WalletConnect or LOBSTR does not connect

- Ensure `VITE_WALLETCONNECT_PROJECT_ID` is set in `client/.env`.
- Restart frontend dev server after changing env.

## Large chunk warnings during build

- Current build passes, but outputs large chunk warnings.
- Consider route-level code splitting and manual chunk configuration in Vite.

## No contract functions shown for custom deployed contracts

- `getContractFunctions` is currently a placeholder and returns an empty list.
- Use known example ABI metadata or manually invoke function names for now.
