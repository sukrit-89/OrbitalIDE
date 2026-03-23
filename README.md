# Orbital IDE

Orbital IDE is a browser-based development environment for Soroban smart contracts on Stellar testnet. It provides in-browser editing, contract compilation, deployment, interaction, wallet integration, and event synchronization.

## Current Project Status

This repository has implemented the core Yellow Belt workflow and most Orange Belt engineering requirements.

Implemented:

- Smart contract deployment to Stellar testnet
- On-chain contract invocation from frontend
- Transaction status tracking (`pending`, `success`, `error`)
- Wallet error categorization (`NOT_INSTALLED`, `USER_REJECTED`, `INSUFFICIENT_BALANCE`, `NETWORK_ERROR`)
- Event listening via Soroban `getEvents` polling with cursor persistence
- Local caching for deployed contract, transaction history, and event cursors
- Frontend unit tests (Vitest)
- Backend compiler service (Rust to WASM) and Docker workflow

Partially implemented:

- Multi-wallet coverage: Freighter, Albedo, WalletConnect, and LOBSTR paths exist; xBull and Rabet remain placeholders
- Contract function discovery for arbitrary deployed contracts is still a placeholder (`getContractFunctions`)

Pending:

- Demo video for challenge submission
- Additional integration tests for full deploy/invoke UI paths

## Repository Structure

```text
Dojo/
  client/                React + Vite frontend
  server/                Express compiler backend
  dev-docs/              Developer documentation
  docker-compose.yml     Full stack local orchestration
  README.md              Project overview and setup
```

## Quick Start

### Option 1: Local development

Frontend:

```bash
cd client
npm install
npm run dev
```

Backend compiler:

```bash
cd server
npm install
npm start
```

### Option 2: Docker

```bash
docker compose up
```

## Environment

Frontend optional environment variables (`client/.env`):

```env
VITE_COMPILER_URL=http://localhost:3001
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## Backend Prerequisites (non-Docker path)

- Node.js 18+
- Rust toolchain
- Rust wasm target:

```bash
rustup target add wasm32-unknown-unknown
```

- Optional optimizer:

```bash
cargo install --locked stellar-cli --features opt
```

## Testing and Build

Frontend tests:

```bash
cd client
npm test
```

Frontend production build:

```bash
cd client
npm run build
```

## Backend API

`GET /health`

- Returns compiler readiness and toolchain status.

`POST /compile`

Request body:

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

## Known Runtime Constraint

On hardened Windows environments, local compilation may fail due Application Control restrictions on executing Cargo build scripts from temporary directories (`os error 4551`).

Recommended workaround:

- Run compiler via Docker (`docker compose up`) to avoid local policy execution restrictions.

## Developer Documentation

Detailed implementation and operations docs are in `dev-docs/`:

- `dev-docs/README.md`
- `dev-docs/architecture.md`
- `dev-docs/features-status.md`
- `dev-docs/backend-compiler.md`
- `dev-docs/local-development.md`
- `dev-docs/troubleshooting.md`

## Repository Move Notice

The remote currently reports this project has moved to:

- `https://github.com/sukrit-89/OrbitalIDE.git`

Update local `origin` when you are ready to switch remotes.
