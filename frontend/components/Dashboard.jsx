'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESSES, SALE_MANAGER_ABI, TICKET_NFT_ABI, formatEther, parseEther } from '../utils/web3'

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // State
  const [selectedEventId, setSelectedEventId] = useState(1)
  const [mintAmount, setMintAmount] = useState(1)
  const [userTickets, setUserTickets] = useState([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)

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
    }
  ]

  // Get sale info
  const { data: saleInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.SALE_MANAGER,
    abi: SALE_MANAGER_ABI,
    functionName: 'getSaleInfo',
    args: [selectedEventId],
  })

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

  // Mint function
  const handleMint = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      const selectedEvent = events.find(e => e.id === selectedEventId)
      if (!selectedEvent) return

      const totalCost = parseEther(selectedEvent.price) * BigInt(mintAmount)
      
      await writeContract({
        address: CONTRACT_ADDRESSES.SALE_MANAGER,
        abi: SALE_MANAGER_ABI,
        functionName: 'mint',
        args: [selectedEventId, mintAmount],
        value: totalCost,
      })
    } catch (error) {
      console.error('Mint error:', error)
    }
  }

  // Check if user can mint
  const canMint = saleInfo && saleInfo.active && 
    saleInfo.sold + mintAmount <= saleInfo.cap &&
    new Date() >= new Date(Number(saleInfo.start) * 1000) &&
    new Date() <= new Date(Number(saleInfo.end) * 1000)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Delphi NFT Ticketing</h1>
          
          {!isConnected ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Please connect your wallet to continue</p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Mint Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Mint Tickets</h2>
                
                {/* Event Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Event
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Tickets
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  disabled={!canMint || isPending || isConfirming}
                  className={`w-full py-3 px-4 rounded-lg font-medium ${
                    canMint && !isPending && !isConfirming
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isPending ? 'Confirming...' : isConfirming ? 'Minting...' : 'Mint Tickets'}
                </button>

                {/* Status Messages */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">Error: {error.message}</p>
                  </div>
                )}

                {isConfirmed && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">Tickets minted successfully!</p>
                    <p className="text-xs text-green-600">Transaction: {hash}</p>
                  </div>
                )}
              </div>

              {/* My Tickets Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">My Tickets</h2>
                
                {isLoadingTickets ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600">Loading tickets...</p>
                  </div>
                ) : userTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No tickets found</p>
                    <p className="text-sm text-gray-500">Mint some tickets to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userTickets.map((ticket, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{ticket.eventName}</h3>
                            <p className="text-sm text-gray-600">Seat #{ticket.seatSerial}</p>
                            <p className="text-sm text-gray-600">Token ID: {ticket.tokenId.toString()}</p>
                          </div>
                          <div className="text-right">
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
                          <div className="mt-3">
                            <button className="text-blue-600 text-sm hover:text-blue-800">
                              Generate QR Code
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