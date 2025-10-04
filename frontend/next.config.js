/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_MONAD_RPC_URL: process.env.NEXT_PUBLIC_MONAD_RPC_URL,
    NEXT_PUBLIC_MONAD_CHAIN_ID: process.env.NEXT_PUBLIC_MONAD_CHAIN_ID,
    NEXT_PUBLIC_TICKET_NFT_ADDRESS: process.env.NEXT_PUBLIC_TICKET_NFT_ADDRESS,
    NEXT_PUBLIC_SALE_MANAGER_ADDRESS: process.env.NEXT_PUBLIC_SALE_MANAGER_ADDRESS,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    return config
  },
  outputFileTracingRoot: process.cwd(),
}

module.exports = nextConfig
