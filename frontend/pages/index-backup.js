import Link from 'next/link'
import { useAccount, useConnect } from 'wagmi'
import { useState, useEffect } from 'react'

export default function Home() {
  const { isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Delphi NFT Ticketing
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            High-performance NFT ticketing system built on Monad blockchain. 
            Experience lightning-fast transactions and seamless event management.
          </p>
          
          {mounted && isConnected ? (
            <div className="space-x-4">
              <Link 
                href="/dashboard"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link 
                href="/organizer"
                className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-700 transition-colors"
              >
                Organizer Panel
              </Link>
            </div>
          ) : mounted ? (
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 mb-6">
                Connect your wallet to start minting tickets and managing events
              </p>
              <button 
                onClick={() => connect({ connector: connectors[0] })}
                disabled={isPending}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {isPending ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Loading...
              </h2>
              <p className="text-gray-600 mb-6">
                Initializing wallet connection
              </p>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600">
              Built on Monad blockchain for high TPS and low latency transactions
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
            <p className="text-gray-600">
              Anti-bot protection and secure check-in system with QR codes
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Management</h3>
            <p className="text-gray-600">
              Simple interface for organizers and seamless experience for users
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Create Event</h3>
              <p className="text-sm text-gray-600">
                Organizers create events and set up ticket sales
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Mint Tickets</h3>
              <p className="text-sm text-gray-600">
                Users mint NFT tickets for their chosen events
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">QR Check-in</h3>
              <p className="text-sm text-gray-600">
                Generate QR codes and check-in at the event
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Enjoy Event</h3>
              <p className="text-sm text-gray-600">
                Access your event with verified NFT tickets
              </p>
            </div>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="mt-16 bg-gray-900 text-white rounded-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            Technical Specifications
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Blockchain</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Monad Testnet</li>
                <li>• EVM Compatible</li>
                <li>• High TPS Support</li>
                <li>• Low Latency</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• ERC-1155 NFT Standard</li>
                <li>• Anti-bot Protection</li>
                <li>• QR Code Check-in</li>
                <li>• On-chain Metadata</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}