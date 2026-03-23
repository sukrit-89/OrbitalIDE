# Feature Status Matrix

## Yellow Belt Focus Areas

- Multi-wallet integration: Partial
  - Implemented: Freighter, Albedo, WalletConnect, LOBSTR connect paths in wallet abstraction.
  - Pending: xBull and Rabet remain scaffold placeholders.
- Smart contract deployment to testnet: Implemented
- Calling contract functions from frontend: Implemented
- Read/write contract interaction: Implemented
- Error handling categories: Implemented (`NOT_INSTALLED`, `USER_REJECTED`, `INSUFFICIENT_BALANCE`, `NETWORK_ERROR`, `UNKNOWN`)
- Event listening and synchronization: Implemented via contract-event polling and cursor persistence
- Transaction status tracking: Implemented in deploy/call status states and history panel

## Orange Belt Focus Areas

- Loading states and progress indicators: Implemented
- Basic caching: Implemented (API key, deployed contract, transaction history, event cursor)
- Automated tests: Implemented baseline (wallet/compiler/cache/event normalization)
- README quality: Implemented and maintained
- Demo video: Pending

## Known Gaps

- Contract ABI/function discovery is still placeholder (`getContractFunctions` returns empty array).
- Local backend compile may fail on hardened Windows environments due Application Control restrictions on executing build artifacts in temp directories.
- Large frontend bundles trigger Vite chunk-size warnings.
