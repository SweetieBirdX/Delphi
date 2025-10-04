# 🎫 Delphi - NFT Ticketing System on Monad

A high-performance NFT-based ticketing system built on Monad blockchain, showcasing parallel execution capabilities and real-world scalability.

## 🚀 Features

- **ERC-1155 NFT Tickets** - Multi-event support with unique seat serials
- **Parallel Minting** - Leverages Monad's high TPS capabilities
- **On-chain Metadata** - Fully transparent and decentralized
- **Anti-bot Protection** - Fair sale mechanisms with wallet caps and cooldowns
- **Hybrid Check-in** - Online QR verification + Offline EIP-712 permits
- **Role-based Access** - Owner, Organizer, Verifier permissions

## 🏗️ Architecture

- **Blockchain**: Monad (EVM-compatible L1)
- **Smart Contracts**: Solidity v0.8.x
- **Frontend**: React/Next.js + ethers.js
- **Security**: OpenZeppelin libraries

## 🧪 Performance Targets

- **Mint Speed**: 1000+ tickets in ~2.3s (vs ~120s on Ethereum)
- **Gas Cost**: <1 gwei (vs 30-50 gwei on Ethereum)
- **Transaction Type**: Parallel execution

## 📁 Project Structure

```
Delphi/
├── contracts/          # Smart contracts
├── scripts/           # Deployment & automation
├── frontend/          # React/Next.js UI
├── test/             # Test suites
└── scripts/          # Auto-commit utilities
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Auto-commit with message
npm run ac "your commit message"

# Deploy contracts (coming soon)
npx hardhat run scripts/deploy.js --network monad
```

## 🔧 Development

This project demonstrates Monad's parallel EVM architecture through real-world ticketing scenarios, proving scalability and cost-effectiveness for high-volume NFT operations.
