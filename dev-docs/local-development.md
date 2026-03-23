# Local Development

## Prerequisites

- Node.js 18+
- Rust toolchain
- Rust target: `wasm32-unknown-unknown`
- Optional: `stellar-cli` for optimization

## Install

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd server
npm install
```

## Run

### Frontend

```bash
cd client
npm run dev
```

### Backend compiler

```bash
cd server
npm start
```

### Full stack via Docker

```bash
docker compose up
```

## Test and Build

### Frontend tests

```bash
cd client
npm test
```

### Frontend production build

```bash
cd client
npm run build
```

## WalletConnect Configuration

For WalletConnect and LOBSTR provider paths:

Create `client/.env` with:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

Without this value, those providers may fail to initialize.
