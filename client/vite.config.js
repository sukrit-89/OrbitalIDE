import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // WalletConnect and Stellar SDK are intentionally isolated into dedicated
    // async chunks. Keep warnings meaningful by setting a calibrated threshold.
    chunkSizeWarningLimit: 1700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('monaco-editor') || id.includes('@monaco-editor')) {
            return 'editor';
          }

          if (id.includes('@walletconnect') || id.includes('@reown')) {
            return 'walletconnect';
          }

          if (id.includes('stellar-wallet-kit')) {
            return 'stellar-wallet-kit';
          }

          if (id.includes('@stellar/freighter-api')) {
            return 'freighter';
          }

          if (id.includes('@stellar/stellar-sdk') || id.includes('@stellar/stellar-base')) {
            return 'stellar-sdk';
          }

          if (
            id.includes('lodash') ||
            id.includes('eventemitter3') ||
            id.includes('valtio')
          ) {
            return 'vendor-utils';
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-vendor';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    clearMocks: true,
    restoreMocks: true,
  },
})
