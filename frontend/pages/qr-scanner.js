import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '../utils/web3'
import QRScanner from '../components/QRScanner'
import Link from 'next/link'

const queryClient = new QueryClient()

export default function QRScannerPage() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <Link href="/" className="text-2xl font-bold text-gray-900">
                    Delphi
                  </Link>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600">QR Scanner</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/dashboard"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/organizer"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
                  >
                    Organizer
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* QR Scanner Content */}
          <QRScanner />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
