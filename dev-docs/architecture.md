# Architecture

## Overview

Orbital IDE is a full-stack Soroban development environment with a React frontend and an optional Rust-backed compilation service.

## Components

- Frontend (`client/`): React + Vite application with Monaco editor, wallet connection, deployment and interaction UI.
- Compiler backend (`server/`): Express service that compiles Rust Soroban contracts to WASM (`POST /compile`).
- Stellar network: Soroban RPC and Horizon testnet endpoints for simulation, signing, submission, and confirmation.

## Frontend Modules

- `client/src/App.jsx`: Main application shell, deploy and interaction flows, event synchronization, transaction history.
- `client/src/compiler.js`: Client compilation orchestration (precompiled examples + backend fallback).
- `client/src/deploy.js`: Upload WASM, deploy instance, invoke contract functions, poll contract events.
- `client/src/wallet.js`: Wallet abstraction with Freighter and adapter-backed wallet-kit providers.
- `client/src/cache.js`: Browser localStorage persistence for deployed contract, transactions, and event cursors.

## Backend Modules

- `server/index.js`: Express routes, input validation, temp project creation, Cargo build execution, optional optimization.
- `server/templates/Cargo.toml`: Contract project template used per compilation request.
- `server/build-examples.js`: Utility to precompile curated examples into `client/public/wasm`.

## Core Data Flows

### Compile and Deploy Flow

1. User edits or generates contract source in Monaco.
2. Frontend attempts example WASM lookup (`/wasm/<example>.wasm`) for known examples.
3. If missing or custom source, frontend calls backend compiler (`POST /compile`).
4. Frontend receives WASM bytes, uploads to Soroban, deploys contract instance.
5. Contract ID and transaction links are saved in local cache and shown in UI.

### Interaction Flow

1. User chooses function and enters params.
2. Frontend converts params to ScVal and simulates transaction.
3. User signs via connected wallet.
4. Frontend submits to Soroban and waits for confirmation.
5. Result is parsed and appended to transaction history.

### Event Synchronization Flow

1. After deployment, frontend starts polling Soroban `getEvents` for deployed contract.
2. Cursor is persisted per contract in localStorage.
3. New events are normalized and merged into transaction history.
4. UI shows live sync status and latest ledger marker.
