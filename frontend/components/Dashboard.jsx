'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useConnect } from 'wagmi'
import { CONTRACT_ADDRESSES, SALE_MANAGER_ABI, TICKET_NFT_ABI, formatEther, parseEther } from '../utils/web3'

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // State
  const [selectedEventId, setSelectedEventId] = useState(1)
  const [mintAmount, setMintAmount] = useState(1)
  const [userTickets, setUserTickets] = useState([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [chainId, setChainId] = useState(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get chainId only after mounting
  useEffect(() => {
    if (mounted && typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_chainId' }).then((id) => {
        setChainId(parseInt(id, 16))
      })
    }
  }, [mounted])

  // Mock events data (in real app, this would come from contract)
  const events = [
    {
      id: 1,
      name: "Monad Blockchain Conference 2024",
      description: "The future of blockchain technology",
      date: "2024-12-15",
      location: "San Francisco, CA",
      price: "0.01",
      cap: 1000,
      sold: 150
    },
    {
      id: 2,
      name: "NFT Art Gallery Opening",
      description: "Digital art exhibition",
      date: "2024-12-20",
      location: "New York, NY",
      price: "0.005",
      cap: 500,
      sold: 75
    },
    {
      id: 3,
      name: "Crypto Music Festival",
      description: "Blockchain meets music",
      date: "2024-12-25",
      location: "Miami, FL",
      price: "0.02",
      cap: 2000,
      sold: 800
    },
    {
      id: 4,
      name: "DeFi Summit 2024",
      description: "Decentralized Finance Conference",
      date: "2025-01-10",
      location: "London, UK",
      price: "0.015",
      cap: 1500,
      sold: 300
    }
  ]

  // Mock sale info (in real app, this would come from contract)
  const getMockSaleInfo = (eventId) => {
    const event = events.find(e => e.id === eventId)
    if (!event) return null
    
    return {
      eventId: eventId,
      price: parseEther(event.price),
      cap: event.cap,
      sold: event.sold,
      start: Math.floor(Date.now() / 1000) - 86400, // Started 1 day ago
      end: Math.floor(Date.now() / 1000) + (30 * 86400), // Ends in 30 days
      perWalletCap: 5,
      cooldownBlocks: 1,
      active: true
    }
  }
  
  const saleInfo = getMockSaleInfo(selectedEventId)

  // Load user tickets
  const loadUserTickets = async () => {
    if (!address || !isConnected) return
    
    setIsLoadingTickets(true)
    try {
      // In a real implementation, you would query the contract for user's tickets
      // For now, we'll use mock data
      const mockTickets = [
        {
          tokenId: (selectedEventId << 128) | 1,
          eventId: selectedEventId,
          seatSerial: 1,
          eventName: events.find(e => e.id === selectedEventId)?.name || 'Unknown Event',
          used: false
        }
      ]
      setUserTickets(mockTickets)
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setIsLoadingTickets(false)
    }
  }

  useEffect(() => {
    loadUserTickets()
  }, [address, isConnected, selectedEventId])

  // Mock mint function (simulates ticket purchase)
  const handleMint = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      const selectedEvent = events.find(e => e.id === selectedEventId)
      if (!selectedEvent) return

      // Simulate loading
      setIsLoadingTickets(true)
      
      // Mock delay to simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create mock tickets
      const newTickets = []
      for (let i = 0; i < mintAmount; i++) {
        const seatSerial = selectedEvent.sold + i + 1
        const tokenId = (BigInt(selectedEventId) << 128n) | BigInt(seatSerial)
        
        newTickets.push({
          tokenId: tokenId.toString(),
          eventId: selectedEventId,
          seatSerial: seatSerial,
          eventName: selectedEvent.name,
          eventDate: selectedEvent.date,
          eventLocation: selectedEvent.location,
          price: selectedEvent.price,
          used: false,
          mintedAt: new Date().toISOString()
        })
      }
      
      // Add to existing tickets
      setUserTickets(prev => [...prev, ...newTickets])
      
      // Update event sold count
      selectedEvent.sold += mintAmount
      
      alert(`Successfully minted ${mintAmount} ticket(s) for ${selectedEvent.name}!`)
      
    } catch (error) {
      console.error('Mint error:', error)
      alert('Error minting tickets. Please try again.')
    } finally {
      setIsLoadingTickets(false)
    }
  }

  // Check if user can mint
  const canMint = saleInfo && saleInfo.active && 
    saleInfo.sold + mintAmount <= saleInfo.cap &&
    new Date() >= new Date(Number(saleInfo.start) * 1000) &&
    new Date() <= new Date(Number(saleInfo.end) * 1000) &&
    mintAmount > 0 &&
    mintAmount <= saleInfo.perWalletCap

  // Check if connected to Monad network
  const isMonadNetwork = mounted && chainId === 10143

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Network Warning */}
        {mounted && isConnected && !isMonadNetwork && (
          <div className="bg-red-900/50 border border-red-600 text-red-300 px-4 py-3 rounded mb-6">
            <strong>Wrong Network!</strong> Please switch to Monad Testnet (Chain ID: 10143)
          </div>
        )}
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">Delphi NFT Ticketing</h1>
          
          {!mounted ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Loading...</p>
            </div>
          ) : !isConnected ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Please connect your wallet to continue</p>
              <button 
                onClick={() => connect({ connector: connectors[0] })}
                disabled={isConnecting}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Mint Section */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-white">Mint Tickets</h2>
                
                {/* Event Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Event
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(Number(e.target.value))}
                    className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.name} - {formatEther(event.price)} ETH
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Event Info */}
                {saleInfo && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900">
                      {events.find(e => e.id === selectedEventId)?.name}
                    </h3>
                    <p className="text-sm text-blue-700">
                      Price: {formatEther(saleInfo.price)} ETH per ticket
                    </p>
                    <p className="text-sm text-blue-700">
                      Available: {Number(saleInfo.cap) - Number(saleInfo.sold)} / {Number(saleInfo.cap)}
                    </p>
                    <p className="text-sm text-blue-700">
                      Status: {saleInfo.active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                )}

                {/* Amount Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Tickets
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(Number(e.target.value))}
                    className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Total Cost */}
                {saleInfo && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      Total Cost: {formatEther(saleInfo.price * BigInt(mintAmount))} ETH
                    </p>
                  </div>
                )}

                {/* Mint Button */}
                <button
                  onClick={handleMint}
                  disabled={!canMint || isLoadingTickets}
                  className={`w-full py-3 px-4 rounded-lg font-medium ${
                    canMint && !isLoadingTickets
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoadingTickets ? 'Minting Tickets...' : 'Mint Tickets'}
                </button>

                {/* Status Messages */}
                {!canMint && saleInfo && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      {saleInfo.sold + mintAmount > saleInfo.cap ? 'Not enough tickets available' :
                       mintAmount > saleInfo.perWalletCap ? `Maximum ${saleInfo.perWalletCap} tickets per wallet` :
                       !saleInfo.active ? 'Sale is not active' :
                       'Cannot mint tickets'}
                    </p>
                  </div>
                )}
              </div>

              {/* My Tickets Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">My Tickets</h2>
                
                {isLoadingTickets ? (
                  <div className="text-center py-4">
                    <p className="text-gray-400">Loading tickets...</p>
                  </div>
                ) : userTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No tickets found</p>
                    <p className="text-sm text-gray-500">Mint some tickets to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userTickets.map((ticket, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">{ticket.eventName}</h3>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">📍 {ticket.eventLocation}</p>
                              <p className="text-sm text-gray-400">📅 {ticket.eventDate}</p>
                              <p className="text-sm text-gray-400">🎫 Seat #{ticket.seatSerial}</p>
                              <p className="text-sm text-gray-400">💰 {ticket.price} ETH</p>
                              <p className="text-xs text-gray-500">Token ID: {ticket.tokenId}</p>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              ticket.used 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {ticket.used ? 'Used' : 'Valid'}
                            </span>
                          </div>
                        </div>
                        
                        {!ticket.used && (
                          <div className="mt-4 flex space-x-2">
                            <Link 
                              href={`/qr-scanner?tokenId=${ticket.tokenId}&eventId=${ticket.eventId}&seatSerial=${ticket.seatSerial}`}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 inline-block text-center"
                            >
                              Generate QR Code
                            </Link>
                            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
                              Check In
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}