import { Ticket, Zap, Shield, Clock, Users, CheckCircle2, Lock, Globe } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/delphilogononbg.png" 
                alt="Delphi Logo" 
                width={40} 
                height={40} 
                className="w-10 h-10" 
              />
              <span className="text-2xl font-bold tracking-tight">DELPHI</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              {/* Navigation links removed */}
            </div>
            <Link href="/dashboard">
              <button className="border border-gray-600 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                Launch App
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 relative overflow-hidden">
        <div className="absolute right-[5%] top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden lg:block">
          <Image
            src="/delphilogononbg.png"
            alt="Delphi Mascot"
            width={400}
            height={400}
            className="w-[400px] h-[400px] animate-float"
          />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[80vh]">
            {/* Main Hero Content */}
            <div className="lg:col-span-8 flex flex-col justify-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-800 text-gray-200 text-sm font-medium">
                    <Ticket className="w-3 h-3 mr-1" />
                    NFT Ticketing on Monad
                  </div>
                  <h1 className="text-6xl lg:text-8xl font-bold tracking-tight text-balance group">
                    Own Your Experience.
                    <span className="text-green-500 block group-hover:scale-105 transition-transform inline-block">
                      Redefine Event Access.
                    </span>
                  </h1>
                  <p className="text-xl text-gray-400 max-w-2xl text-pretty">
                    Delphi brings event ticketing into the Web3 era. Each ticket is a unique ERC-1155 NFT, giving users
                    real ownership, transparency, and instant verification.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/organizer">
                    <button className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-green-700 transition-colors">
                      Create Event
                    </button>
                  </Link>
                  <Link href="/dashboard">
                    <button className="border border-gray-600 bg-gray-800 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-700 transition-colors">
                      Browse Events
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Hero Logo */}
            <div className="lg:col-span-4 flex items-center justify-center">
              <Image
                src="/delphilogononbg.png"
                alt="Delphi Logo"
                width={300}
                height={300}
                className="w-[300px] h-[300px] animate-float"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Powered by Monad Section */}
      <section className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-gray-600 text-gray-200 text-sm font-medium mb-4">
              <Zap className="w-3 h-3 mr-1" />
              Powered by Monad
            </div>
            <h2 className="text-4xl font-bold mb-4">⚡ Lightning-Fast Performance</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto text-balance">
              Built on Monad, Delphi leverages high TPS and parallel execution to enable lightning-fast minting and
              seamless on-chain check-ins.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-8 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-4 px-4 font-semibold">Action</th>
                      <th className="text-left py-4 px-4 font-semibold">Ethereum</th>
                      <th className="text-left py-4 px-4 font-semibold text-green-500">Monad</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700">
                      <td className="py-4 px-4">1000 ticket mints</td>
                      <td className="py-4 px-4 text-gray-400">~120s</td>
                      <td className="py-4 px-4 font-bold text-green-500">~2.3s</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4">Gas cost</td>
                      <td className="py-4 px-4 text-gray-400">30–50 gwei</td>
                      <td className="py-4 px-4 font-bold text-green-500">&lt;1 gwei</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">🔒 Secure. Transparent. Ownable.</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto text-balance">
              Built with security and transparency at its core
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fast</h3>
              <p className="text-gray-400 text-sm">
                Parallel minting powered by Monad for instant ticket creation
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Secure</h3>
              <p className="text-gray-400 text-sm">Verified ownership and anti-bot protections built-in</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Flexible</h3>
              <p className="text-gray-400 text-sm">Works online or offline with QR check-in system</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fair</h3>
              <p className="text-gray-400 text-sm">Transparent and tamper-proof ticket sales on-chain</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">🌐 How It Works</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto text-balance">
              Simple, secure, and transparent event ticketing in four steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Create</h3>
              <p className="text-gray-400">Organizers create and launch events on the platform</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Mint</h3>
              <p className="text-gray-400">Users mint NFT tickets in seconds with low gas fees</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Check-in</h3>
              <p className="text-gray-400">Secure QR scans verify tickets at the venue</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                4
              </div>
              <h3 className="text-xl font-bold mb-2">Track</h3>
              <p className="text-gray-400">Every action is recorded transparently on-chain</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-800/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-6 text-balance">Ready to Transform Your Events?</h2>
          <p className="text-xl text-gray-400 mb-8 text-balance">
            Join the future of event ticketing. Secure, instant, and fair NFT ticketing built on Monad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <button className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-green-700 transition-colors">
                Launch App
              </button>
            </Link>
            <button className="border border-gray-600 bg-gray-800 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-700 transition-colors">
              Read Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800/50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="text-2xl font-bold mb-4">🎟️ DELPHI</div>
              <p className="text-gray-400 mb-6 max-w-md">
                Secure, instant, and fair NFT ticketing built on Monad. Redefining event access for the Web3 era.
              </p>
              <div className="flex gap-4">
                <button className="border border-gray-600 text-gray-400 px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-white transition-colors">
                  Twitter
                </button>
                <button className="border border-gray-600 text-gray-400 px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-white transition-colors">
                  Discord
                </button>
                <button className="border border-gray-600 text-gray-400 px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-white transition-colors">
                  GitHub
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-gray-400">
                <p>Features</p>
                <p>Roadmap</p>
                <p>Documentation</p>
                <p>API</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <div className="space-y-2 text-gray-400">
                <p>About Monad</p>
                <p>Smart Contracts</p>
                <p>Security</p>
                <p>Support</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Delphi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}