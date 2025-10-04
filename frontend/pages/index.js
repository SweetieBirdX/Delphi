import React from 'react';
import { useWeb3 } from '../utils/web3';

const HomePage = () => {
  const { account, connectWallet, disconnectWallet } = useWeb3();

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Delphi NFT Ticketing</h1>
        <p className="hero-subtitle">
          High-performance NFT ticketing system on Monad blockchain
        </p>
        <p className="hero-description">
          Experience the future of event ticketing with parallel execution, 
          anti-bot protection, and hybrid check-in systems.
        </p>
        
        {!account ? (
          <div className="connect-section">
            <button 
              className="btn-primary btn-large"
              onClick={connectWallet}
            >
              Connect Wallet
            </button>
            <p className="connect-note">
              Connect your wallet to start minting tickets
            </p>
          </div>
        ) : (
          <div className="connected-section">
            <div className="wallet-info">
              <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
              <button 
                className="btn-secondary"
                onClick={disconnectWallet}
              >
                Disconnect
              </button>
            </div>
            
            <div className="quick-actions">
              <a href="/dashboard" className="btn-primary">
                View My Tickets
              </a>
              <a href="/organizer" className="btn-secondary">
                Organizer Panel
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="features-section">
        <h2>Why Choose Delphi?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Parallel Execution</h3>
            <p>
              Leverage Monad's parallel EVM to mint thousands of tickets 
              simultaneously without gas wars or network congestion.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Anti-Bot Protection</h3>
            <p>
              Fair distribution with wallet caps, cooldown periods, and 
              advanced anti-bot mechanisms to ensure equal access.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Hybrid Check-in</h3>
            <p>
              Online QR scanning with offline EIP-712 permits for 
              reliable check-in even without internet connection.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>On-chain Metadata</h3>
            <p>
              Fully transparent and decentralized with all ticket 
              information stored directly on the blockchain.
            </p>
          </div>
        </div>
      </div>

      <div className="performance-section">
        <h2>Performance Comparison</h2>
        <div className="comparison-table">
          <div className="comparison-header">
            <div className="metric">Metric</div>
            <div className="ethereum">Ethereum</div>
            <div className="monad">Monad (Delphi)</div>
          </div>
          
          <div className="comparison-row">
            <div className="metric">1000 Ticket Mint</div>
            <div className="ethereum">~120 seconds</div>
            <div className="monad">~2.3 seconds</div>
          </div>
          
          <div className="comparison-row">
            <div className="metric">Gas Cost</div>
            <div className="ethereum">30-50 gwei</div>
            <div className="monad">&lt;1 gwei</div>
          </div>
          
          <div className="comparison-row">
            <div className="metric">Transaction Type</div>
            <div className="ethereum">Serial</div>
            <div className="monad">Parallel</div>
          </div>
          
          <div className="comparison-row">
            <div className="metric">Network Congestion</div>
            <div className="ethereum">High</div>
            <div className="monad">None</div>
          </div>
        </div>
      </div>

      <div className="getting-started-section">
        <h2>Getting Started</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Connect Your Wallet</h3>
              <p>Connect your Web3 wallet to access the platform</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Browse Events</h3>
              <p>Discover and explore available events</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Mint Tickets</h3>
              <p>Purchase NFT tickets with fast, parallel execution</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Check-in at Event</h3>
              <p>Use QR codes or offline permits for seamless entry</p>
            </div>
          </div>
        </div>
      </div>

      <div className="footer">
        <p>Built on Monad blockchain • Powered by parallel EVM execution</p>
        <div className="footer-links">
          <a href="/dashboard">Dashboard</a>
          <a href="/organizer">Organizer</a>
          <a href="/scanner">QR Scanner</a>
          <a href="/sync">Offline Sync</a>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
