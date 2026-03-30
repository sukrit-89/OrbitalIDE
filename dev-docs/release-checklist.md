# Release Checklist

Date: 2026-03-23
Project: Orbital IDE

This checklist is based on current code, docs, and local verification (tests/build/health).

## Must Fix Before Release

- [x] Harden dynamic contract function discovery for arbitrary deployed contracts.
  - Status: Baseline implemented (2026-03-23).
  - Implemented:
    - `getContractFunctions(contractId)` now fetches deployed WASM and parses contract spec.
    - Interact panel now binds to discovered metadata and falls back to example metadata on discovery failure.
    - Raw Call Mode added (manual function name + JSON args) for contracts with incomplete/unsupported metadata.
    - Client-side typed input validation and inline error messaging added in Interact panel.
    - Function metadata normalization and tests added.
  - Files: `client/src/deploy.js`, `client/src/App.jsx`, `client/src/App.css`, `client/src/deploy.functions.test.js`.
  - Completed:
    - Added integration/UI coverage for complex type entry and raw-call typed wrappers.
    - Expanded type handling for complex labels (vec/map/tuple/udt/struct/enum) and bytes.

- [x] Add integration coverage for deploy and invoke end-to-end flow.
  - Why: Unit tests pass, but full UI + wallet + deploy/invoke flow lacks automated integration coverage.
  - Evidence: `README.md` and `dev-docs/features-status.md` mark additional integration tests as pending.
  - Implemented:
    - Added happy-path deploy pipeline integration test.
    - Added invoke integration test after deployment.
    - Added failure-path invoke test for rejected transaction.
  - Files: `client/src/App.deploy-invoke.test.jsx`.

- [x] Resolve frontend chunk-size risk for production bundle.
  - Status: In progress (2026-03-23).
  - Implemented:
    - Added explicit manual chunking for editor, walletconnect, stellar-sdk, wallet adapters, and react vendor bundles.
    - Added calibrated `chunkSizeWarningLimit` to keep warnings meaningful after async vendor chunk isolation.
  - Files: `client/vite.config.js`.
  - Current build state:
    - No Vite oversized-chunk warning emitted.
    - Largest chunks are isolated vendor bundles (`walletconnect`, `stellar-sdk`) rather than mixed app/runtime payload.
  - Completion note:
    - Risk is mitigated for release: oversized warning no longer emitted, and heavy dependencies are isolated into dedicated async vendor chunks.

## Should Fix (High Value)

- [x] Add a known-good startup script/section for local dev reliability on Windows.
  - Implemented:
    - Added helper script `scripts/dev-start.ps1` to start frontend and backend in separate terminals.
    - Added copy-paste Windows startup workflow and directory sanity checks in docs.
    - Added troubleshooting guidance for cwd-related `npm ENOENT` issues.
  - Files: `scripts/dev-start.ps1`, `README.md`, `dev-docs/local-development.md`, `dev-docs/troubleshooting.md`.

- [x] Add backend compile runtime smoke check to docs and CI (if CI exists).
  - Why: Backend health is good now, but compile path depends on toolchain and environment policy.
  - Implemented:
    - Added `scripts/backend-smoke.ps1` to validate `/health` and minimal `/compile` output.
    - Added smoke-check run instructions to root and backend docs.
    - Added troubleshooting guidance for smoke-check failures.
  - Files: `scripts/backend-smoke.ps1`, `README.md`, `dev-docs/backend-compiler.md`, `dev-docs/troubleshooting.md`.

## Nice to Have

- [ ] Complete xBull and Rabet wallet integrations.
  - Current state: placeholders with "coming soon" error.
  - Evidence: `client/src/wallet.js`.

- [ ] Improve static analysis/lint setup for test globals (`global`, `Buffer`) in editor diagnostics.
  - Why: Tests pass in Vitest runtime, but editor diagnostics show avoidable noise.
  - Evidence: diagnostics surfaced in `client/src/compiler.test.js`.
  - Acceptance criteria:
    - Add proper test env globals or switch to `globalThis`/browser-safe helpers.

- [ ] Add demo video for challenge submission.
  - Evidence: `README.md`, `dev-docs/features-status.md`.

## Verified Today

- Frontend tests: PASS (23/23)
  - Files include: `client/src/cache.test.js`, `client/src/compiler.test.js`, `client/src/deploy.events.test.js`, `client/src/deploy.functions.test.js`, `client/src/App.interact.test.jsx`, `client/src/App.deploy-invoke.test.jsx`, `client/src/wallet.test.js`.
- Frontend production build: PASS (oversized chunk warning addressed)
  - Command: `cd client && npm run build`
- Backend health: READY
  - Endpoint: `http://localhost:3001/health`
  - Toolchain detected: Rust, Cargo, wasm32 target, stellar-cli.

## Release Gate Recommendation

Must-fix gate is complete for this checklist revision.
Any remaining work can be tracked under Should Fix and Nice to Have items.
