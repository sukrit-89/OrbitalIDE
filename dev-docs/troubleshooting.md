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

- Build chunk warnings were mitigated by vendor chunk isolation in Vite.
- If warnings reappear after dependency changes, review `client/vite.config.js` manual chunk rules.

## `npm` fails with `ENOENT` for `package.json`

Symptoms:

- `npm ERR! enoent Could not read package.json`
- Path points to repo root (`Dojo/`) instead of `Dojo/client` or `Dojo/server`

Cause:

- Command was run from the wrong working directory.

Fix:

1. Check current location:
  - `Get-Location`
2. Move to the correct package folder:
  - Frontend: `Set-Location "f:\StellarMonthly\Dojo\client"`
  - Backend: `Set-Location "f:\StellarMonthly\Dojo\server"`
3. Re-run the command.

## Contract function discovery fallback appears

Symptoms:

- Interact panel shows `Example metadata fallback`.

Cause:

- On-chain spec discovery failed for this contract (transient RPC issue or unsupported shape).

Fix:

1. Click `Retry Discovery` in the Interact panel.
2. Use `Raw Call Mode` for manual function name and JSON args when metadata is incomplete.

## Backend smoke check fails

Symptoms:

- `\scripts\backend-smoke.ps1` fails on `/health` or `/compile`.

Fix:

1. Ensure backend is running:
  - `Set-Location "f:\StellarMonthly\Dojo\server"`
  - `npm start`
2. Re-run smoke check from repo root:
  - `Set-Location "f:\StellarMonthly\Dojo"`
  - `\scripts\backend-smoke.ps1`
3. If compile still fails with `os error 4551`, use Docker compiler path (`docker compose up`).
