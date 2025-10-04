'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESSES, SALE_MANAGER_ABI, formatTokenId, parseTokenId } from '../utils/web3'
import { QRCodeSVG } from 'qrcode.react'

export default function QRScanner() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // State
  const [qrData, setQrData] = useState('')
  const [scannedData, setScannedData] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [checkInResult, setCheckInResult] = useState(null)
  const [ticketInfo, setTicketInfo] = useState(null)

  // Generate QR code for a ticket
  const generateQRCode = (tokenId, eventId, seatSerial) => {
    const qrData = {
      tokenId: tokenId.toString(),
      eventId: eventId,
      seatSerial: seatSerial,
      timestamp: Date.now(),
      signature: null // V2'de signature eklenebilir
    }
    
    setQrData(JSON.stringify(qrData))
  }

  // Load ticket info from URL parameters
  useEffect(() => {
    if (router.isReady) {
      const { tokenId, eventId, seatSerial } = router.query
      if (tokenId && eventId && seatSerial) {
        setTicketInfo({
          tokenId: tokenId.toString(),
          eventId: parseInt(eventId),
          seatSerial: parseInt(seatSerial)
        })
        generateQRCode(tokenId, parseInt(eventId), parseInt(seatSerial))
      }
    }
  }, [router.isReady, router.query])

  // Generate QR code for a ticket
  const handleGenerateQR = () => {
    if (ticketInfo) {
      generateQRCode(ticketInfo.tokenId, ticketInfo.eventId, ticketInfo.seatSerial)
    } else {
      // Fallback for demo
      const eventId = 1
      const seatSerial = 1
      const tokenId = formatTokenId(eventId, seatSerial)
      generateQRCode(tokenId, eventId, seatSerial)
    }
  }

  // Simulate QR code scanning
  const handleScanQR = () => {
    if (!qrData) {
      alert('Please generate a QR code first')
      return
    }
    
    setIsScanning(true)
    setScannedData(qrData)
    
    // Simulate scanning delay
    setTimeout(() => {
      setIsScanning(false)
    }, 1000)
  }

  // Check-in function
  const handleCheckIn = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    if (!scannedData) {
      alert('Please scan a QR code first')
      return
    }

    try {
      const qrData = JSON.parse(scannedData)
      const tokenId = BigInt(qrData.tokenId)
      
      await writeContract({
        address: CONTRACT_ADDRESSES.SALE_MANAGER,
        abi: SALE_MANAGER_ABI,
        functionName: 'checkIn',
        args: [tokenId],
      })
    } catch (error) {
      console.error('Check-in error:', error)
    }
  }

  // Parse scanned data
  const parsedData = scannedData ? JSON.parse(scannedData) : null

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-white mb-6">QR Code Scanner</h1>
          
          {!isConnected ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Please connect your wallet to continue</p>
              <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* QR Code Generation */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Generate QR Code</h2>
                
                {/* Ticket Info */}
                {ticketInfo && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Ticket Information</h3>
                    <p className="text-sm text-blue-700">Token ID: {ticketInfo.tokenId}</p>
                    <p className="text-sm text-blue-700">Event ID: {ticketInfo.eventId}</p>
                    <p className="text-sm text-blue-700">Seat Serial: {ticketInfo.seatSerial}</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <button
                    onClick={handleGenerateQR}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                  >
                    {ticketInfo ? 'Generate QR Code' : 'Generate Demo QR Code'}
                  </button>
                  
                  {qrData && (
                    <div className="text-center">
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                        <QRCodeSVG
                          value={qrData}
                          size={256}
                          level="M"
                          includeMargin={true}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        Scan this QR code to test check-in
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Scanning */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Scan QR Code</h2>
                
                <div className="space-y-4">
                  <button
                    onClick={handleScanQR}
                    disabled={!qrData}
                    className={`w-full py-2 px-4 rounded-lg ${
                      qrData
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isScanning ? 'Scanning...' : 'Scan QR Code'}
                  </button>
                  
                  {scannedData && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Scanned Data:</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-400">Token ID:</span>
                          <span className="ml-2 font-mono">{parsedData?.tokenId}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Event ID:</span>
                          <span className="ml-2">{parsedData?.eventId}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Seat Serial:</span>
                          <span className="ml-2">{parsedData?.seatSerial}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Timestamp:</span>
                          <span className="ml-2">
                            {parsedData?.timestamp ? new Date(parsedData.timestamp).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Check-in Section */}
          {scannedData && (
            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Check-in Ticket</h2>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Ticket Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Event ID:</span>
                      <span className="ml-2 text-blue-900">{parsedData?.eventId}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Seat Serial:</span>
                      <span className="ml-2 text-blue-900">{parsedData?.seatSerial}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Token ID:</span>
                      <span className="ml-2 text-blue-900 font-mono text-xs">{parsedData?.tokenId}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Generated:</span>
                      <span className="ml-2 text-blue-900">
                        {parsedData?.timestamp ? new Date(parsedData.timestamp).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={isPending || isConfirming}
                  className={`w-full py-3 px-4 rounded-lg font-medium ${
                    !isPending && !isConfirming
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isPending ? 'Confirming...' : isConfirming ? 'Checking In...' : 'Check-in Ticket'}
                </button>

                {/* Status Messages */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">Error: {error.message}</p>
                  </div>
                )}

                {isConfirmed && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">Ticket checked in successfully!</p>
                    <p className="text-xs text-green-600">Transaction: {hash}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-yellow-50 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 mb-2">How to Use</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
              <li>Generate a QR code for a ticket</li>
              <li>Scan the QR code to extract ticket information</li>
              <li>Click "Check-in Ticket" to mark the ticket as used</li>
              <li>The transaction will be recorded on the blockchain</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}