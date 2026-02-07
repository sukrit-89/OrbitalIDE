import { useState, useEffect } from 'react'
import './App.css'
import { connectWallet, disconnectWallet, checkConnection } from './wallet'
import { getBalance, sendPayment, isValidAddress, getTransactionUrl } from './stellar'

function App() {
  const [publicKey, setPublicKey] = useState('')
  const [balance, setBalance] = useState('')
  const [loading, setLoading] = useState(false)
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('')
  const [txStatus, setTxStatus] = useState(null) // { type: 'success'|'error', message: '', hash: '' }

  // Check if wallet is already connected on mount
  useEffect(() => {
    const init = async () => {
      const connected = await checkConnection()
      if (connected) {
        // Auto-connect if previously connected
        handleConnect()
      }
    }
    init()
  }, [])

  // Fetch balance whenever publicKey changes
  useEffect(() => {
    if (publicKey) {
      fetchBalance()
    }
  }, [publicKey])

  const handleConnect = async () => {
    try {
      setLoading(true)
      setTxStatus(null)
      const key = await connectWallet()
      setPublicKey(key)
    } catch (error) {
      setTxStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
    setPublicKey('')
    setBalance('')
    setDestination('')
    setAmount('')
    setTxStatus(null)
  }

  const fetchBalance = async () => {
    if (!publicKey) return

    try {
      setLoading(true)
      const bal = await getBalance(publicKey)
      setBalance(bal)
    } catch (error) {
      setTxStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()

    // Clear previous status
    setTxStatus(null)

    // Validate inputs
    if (!destination.trim()) {
      setTxStatus({ type: 'error', message: 'Please enter a destination address' })
      return
    }

    if (!isValidAddress(destination)) {
      setTxStatus({ type: 'error', message: 'Invalid Stellar address format' })
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setTxStatus({ type: 'error', message: 'Please enter a valid amount' })
      return
    }

    try {
      setLoading(true)
      const result = await sendPayment(publicKey, destination, amount)

      setTxStatus({
        type: 'success',
        message: result.message,
        hash: result.hash
      })

      // Clear form and refresh balance
      setDestination('')
      setAmount('')

      // Refresh balance after a short delay
      setTimeout(() => {
        fetchBalance()
      }, 2000)

    } catch (error) {
      setTxStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stellar-app">
      <div className="grain-overlay"></div>

      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <img src="/DojoPay.png" alt="Dojo" />
          </div>
          <h1 className="brand-title">
            <span className="brand-name">Dojo</span>
            <span className="brand-type">Pay</span>
          </h1>
        </div>
        <div className="network-badge">TESTNET</div>
      </header>

      <main className="app-main">
        {!publicKey ? (
          <section className="connect-section">
            <div className="connect-card">
              <h2 className="section-title">Connect Wallet</h2>
              <p className="section-desc">
                Connect your Freighter wallet to send and receive XLM on Stellar Testnet
              </p>

              <button
                onClick={handleConnect}
                disabled={loading}
                className="btn btn-primary btn-large"
              >
                {loading ? 'Connecting...' : 'Connect Freighter'}
              </button>

              <div className="help-text">
                Don't have Freighter?
                <a
                  href="https://www.freighter.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  Install it here
                </a>
              </div>
            </div>
          </section>
        ) : (
          <div className="wallet-container">
            <section className="account-section">
              <div className="section-header">
                <h2 className="section-title">Account</h2>
                <button
                  onClick={handleDisconnect}
                  className="btn btn-ghost btn-small"
                >
                  Disconnect
                </button>
              </div>

              <div className="account-card">
                <div className="account-field">
                  <label className="field-label">Public Key</label>
                  <div className="key-display">
                    <code className="key-text">{publicKey}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(publicKey)}
                      className="btn btn-icon"
                      title="Copy address"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="account-field">
                  <label className="field-label">Balance</label>
                  <div className="balance-display">
                    <span className="balance-amount">{balance || '—'}</span>
                    <span className="balance-currency">XLM</span>
                    <button
                      onClick={fetchBalance}
                      disabled={loading}
                      className="btn btn-icon"
                      title="Refresh balance"
                    >
                      🔄
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="payment-section">
              <h2 className="section-title">Send Payment</h2>

              <form onSubmit={handleSend} className="payment-form">
                <div className="form-field">
                  <label htmlFor="destination" className="field-label">
                    Destination Address
                  </label>
                  <input
                    id="destination"
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="G..."
                    className="input input-mono"
                    disabled={loading}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="amount" className="field-label">
                    Amount (XLM)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="0.0000001"
                    min="0.0000001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="input"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !destination || !amount}
                  className="btn btn-primary btn-large"
                >
                  {loading ? 'Sending...' : 'Send XLM'}
                </button>
              </form>
            </section>

            {txStatus && (
              <section className={`feedback-section feedback-${txStatus.type}`}>
                <div className="feedback-content">
                  <div className="feedback-icon">
                    {txStatus.type === 'success' ? '✓' : '✕'}
                  </div>
                  <div className="feedback-message">
                    <p className="feedback-text">{txStatus.message}</p>
                    {txStatus.hash && (
                      <a
                        href={getTransactionUrl(txStatus.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tx-link"
                      >
                        View transaction →
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p className="footer-text">
          Stellar Testnet ·
          <a
            href="https://laboratory.stellar.org/#?network=test"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Laboratory
          </a> ·
          <a
            href="https://friendbot.stellar.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Get Test XLM
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
