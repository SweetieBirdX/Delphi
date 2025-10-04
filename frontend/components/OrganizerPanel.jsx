'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConnect } from 'wagmi'
import { CONTRACT_ADDRESSES, SALE_MANAGER_ABI, parseEther, formatEther } from '../utils/web3'

export default function OrganizerPanel() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Form state
  const [formData, setFormData] = useState({
    eventId: 1,
    price: '0.01',
    cap: 100,
    startTime: '',
    endTime: '',
    perWalletCap: 5,
    cooldownBlocks: 1
  })

  // Mock events for organizer
  const organizerEvents = [
    {
      id: 1,
      name: "Monad Blockchain Conference 2024",
      description: "The future of blockchain technology",
      date: "2024-12-15",
      location: "San Francisco, CA"
    },
    {
      id: 2,
      name: "NFT Art Gallery Opening",
      description: "Digital art exhibition",
      date: "2024-12-20",
      location: "New York, NY"
    }
  ]

  // Set default times
  const setDefaultTimes = () => {
    const now = new Date()
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
    const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    setFormData(prev => ({
      ...prev,
      startTime: Math.floor(startTime.getTime() / 1000).toString(),
      endTime: Math.floor(endTime.getTime() / 1000).toString()
    }))
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Create sale function
  const handleCreateSale = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.SALE_MANAGER,
        abi: SALE_MANAGER_ABI,
        functionName: 'createSale',
        args: [
          BigInt(formData.eventId),
          parseEther(formData.price),
          BigInt(formData.cap),
          BigInt(formData.startTime),
          BigInt(formData.endTime),
          Number(formData.perWalletCap),
          Number(formData.cooldownBlocks)
        ],
      })
    } catch (error) {
      console.error('Create sale error:', error)
    }
  }

  // Validate form
  const isFormValid = () => {
    return formData.eventId > 0 &&
           parseFloat(formData.price) > 0 &&
           formData.cap > 0 &&
           formData.startTime &&
           formData.endTime &&
           parseInt(formData.startTime) < parseInt(formData.endTime) &&
           formData.perWalletCap > 0 &&
           formData.cooldownBlocks >= 0
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-white mb-6">Organizer Panel</h1>
          
          {!isConnected ? (
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
            <div className="space-y-8">
              {/* Create Sale Form */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Create New Sale</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Event Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event
                    </label>
                    <select
                      name="eventId"
                      value={formData.eventId}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {organizerEvents.map(event => (
                        <option key={event.id} value={event.id}>
                          {event.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (ETH)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.001"
                      min="0"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Cap */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Tickets
                    </label>
                    <input
                      type="number"
                      name="cap"
                      value={formData.cap}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Per Wallet Cap */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Per Wallet Limit
                    </label>
                    <input
                      type="number"
                      name="perWalletCap"
                      value={formData.perWalletCap}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={formData.startTime ? new Date(parseInt(formData.startTime) * 1000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        const timestamp = Math.floor(new Date(e.target.value).getTime() / 1000)
                        setFormData(prev => ({ ...prev, startTime: timestamp.toString() }))
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      value={formData.endTime ? new Date(parseInt(formData.endTime) * 1000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        const timestamp = Math.floor(new Date(e.target.value).getTime() / 1000)
                        setFormData(prev => ({ ...prev, endTime: timestamp.toString() }))
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Cooldown Blocks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cooldown Blocks
                    </label>
                    <input
                      type="number"
                      name="cooldownBlocks"
                      value={formData.cooldownBlocks}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of blocks to wait between mints
                    </p>
                  </div>
                </div>

                {/* Quick Set Times Button */}
                <div className="mt-4">
                  <button
                    onClick={setDefaultTimes}
                    className="text-blue-600 text-sm hover:text-blue-800"
                  >
                    Set default times (24h from now, 7 days duration)
                  </button>
                </div>

                {/* Create Sale Button */}
                <div className="mt-6">
                  <button
                    onClick={handleCreateSale}
                    disabled={!isFormValid() || isPending || isConfirming}
                    className={`w-full py-3 px-4 rounded-lg font-medium ${
                      isFormValid() && !isPending && !isConfirming
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isPending ? 'Confirming...' : isConfirming ? 'Creating Sale...' : 'Create Sale'}
                  </button>
                </div>

                {/* Status Messages */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">Error: {error.message}</p>
                  </div>
                )}

                {isConfirmed && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">Sale created successfully!</p>
                    <p className="text-xs text-green-600">Transaction: {hash}</p>
                  </div>
                )}
              </div>

              {/* Sale Summary */}
              {isFormValid() && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-3">Sale Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Event:</span>
                      <span className="ml-2 text-blue-900">
                        {organizerEvents.find(e => e.id === formData.eventId)?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Price:</span>
                      <span className="ml-2 text-blue-900">{formData.price} ETH</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Total Tickets:</span>
                      <span className="ml-2 text-blue-900">{formData.cap}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Per Wallet:</span>
                      <span className="ml-2 text-blue-900">{formData.perWalletCap}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Start:</span>
                      <span className="ml-2 text-blue-900">
                        {formData.startTime ? new Date(parseInt(formData.startTime) * 1000).toLocaleString() : 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">End:</span>
                      <span className="ml-2 text-blue-900">
                        {formData.endTime ? new Date(parseInt(formData.endTime) * 1000).toLocaleString() : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}