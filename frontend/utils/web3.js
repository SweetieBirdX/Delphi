import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'
import { createPublicClient, createWalletClient, custom } from 'viem'

// Monad chain configuration
const monad = {
  id: parseInt(process.env.NEXT_PUBLIC_MONAD_CHAIN_ID || '1234'),
  name: 'Monad Testnet',
  network: 'monad',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet-explorer.monad.xyz',
    },
  },
  testnet: true,
}

// Wagmi configuration
export const config = createConfig({
  chains: [monad, mainnet, sepolia],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
    }),
  ],
  transports: {
    [monad.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

// Public client for read operations
export const publicClient = createPublicClient({
  chain: monad,
  transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'),
})

// Wallet client for write operations
export const walletClient = createWalletClient({
  chain: monad,
  transport: custom(window.ethereum),
})

// Contract addresses
export const CONTRACT_ADDRESSES = {
  TICKET_NFT: process.env.NEXT_PUBLIC_TICKET_NFT_ADDRESS || '',
  SALE_MANAGER: process.env.NEXT_PUBLIC_SALE_MANAGER_ADDRESS || '',
}

// Contract ABIs (simplified for now)
export const TICKET_NFT_ABI = [
  {
    "inputs": [{"name": "id", "type": "uint256"}],
    "name": "uri",
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "account", "type": "address"},
      {"name": "id", "type": "uint256"}
    ],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "account", "type": "address"},
      {"name": "ids", "type": "uint256[]"}
    ],
    "name": "balanceOfBatch",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
]

export const SALE_MANAGER_ABI = [
  {
    "inputs": [
      {"name": "eventId", "type": "uint256"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "checkIn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "eventId", "type": "uint256"}],
    "name": "getSaleInfo",
    "outputs": [
      {
        "components": [
          {"name": "eventId", "type": "uint256"},
          {"name": "price", "type": "uint256"},
          {"name": "cap", "type": "uint256"},
          {"name": "sold", "type": "uint256"},
          {"name": "start", "type": "uint64"},
          {"name": "end", "type": "uint64"},
          {"name": "perWalletCap", "type": "uint32"},
          {"name": "cooldownBlocks", "type": "uint32"},
          {"name": "active", "type": "bool"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "eventId", "type": "uint256"},
      {"name": "user", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "canMint",
    "outputs": [
      {"name": "canMintResult", "type": "bool"},
      {"name": "reason", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

// Utility functions
export const formatEther = (value) => {
  return (Number(value) / 1e18).toFixed(4)
}

export const parseEther = (value) => {
  return BigInt(Math.floor(Number(value) * 1e18))
}

export const formatTokenId = (eventId, seatSerial) => {
  return (BigInt(eventId) << 128n) | BigInt(seatSerial)
}

export const parseTokenId = (tokenId) => {
  const eventId = Number(tokenId >> 128n)
  const seatSerial = Number(tokenId & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn)
  return { eventId, seatSerial }
}