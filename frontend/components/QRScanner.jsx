import React, { useState, useRef, useEffect } from 'react';
import { useWeb3 } from '../utils/web3';

const QRScanner = () => {
  const { account, provider, signer } = useWeb3();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // TODO: Implement QR code scanning logic
      // This would use a library like jsQR or qr-scanner
      // to detect and decode QR codes from the video stream
      
      console.log('QR Scanner started');
      
    } catch (err) {
      console.error('Error starting QR scanner:', err);
      setError('Failed to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleQRCodeDetected = async (qrData) => {
    try {
      setScannedData(qrData);
      setError(null);
      
      // TODO: Implement QR code validation and check-in logic
      // This would:
      // 1. Parse the QR code data to extract ticket information
      // 2. Validate the ticket with the smart contract
      // 3. Process the check-in if valid
      
      console.log('QR Code detected:', qrData);
      
      // Simulate check-in process
      const mockResult = {
        success: true,
        ticketId: qrData,
        eventName: "Monad Blockchain Conference 2024",
        seatNumber: "A-101",
        message: "Check-in successful!"
      };
      
      setScanResult(mockResult);
      
      // Stop scanning after successful check-in
      stopScanning();
      
    } catch (err) {
      console.error('Error processing QR code:', err);
      setError('Failed to process QR code. Please try again.');
    }
  };

  const handleManualEntry = () => {
    const ticketId = prompt('Enter ticket ID manually:');
    if (ticketId) {
      handleQRCodeDetected(ticketId);
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setScanResult(null);
    setError(null);
  };

  if (!account) {
    return (
      <div className="qr-scanner">
        <div className="connect-wallet">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your wallet to access the QR scanner</p>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-scanner">
      <div className="scanner-header">
        <h1>QR Code Scanner</h1>
        <p>Scan ticket QR codes for check-in</p>
      </div>

      {!isScanning && !scanResult && (
        <div className="scanner-controls">
          <button 
            className="btn-primary"
            onClick={startScanning}
          >
            Start Scanning
          </button>
          <button 
            className="btn-secondary"
            onClick={handleManualEntry}
          >
            Manual Entry
          </button>
        </div>
      )}

      {isScanning && (
        <div className="scanner-view">
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="camera-feed"
            />
            <div className="scan-overlay">
              <div className="scan-frame"></div>
              <p>Position QR code within the frame</p>
            </div>
          </div>
          
          <div className="scanner-actions">
            <button 
              className="btn-warning"
              onClick={stopScanning}
            >
              Stop Scanning
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={resetScanner}>Try Again</button>
        </div>
      )}

      {scanResult && (
        <div className="scan-result">
          <div className={`result-card ${scanResult.success ? 'success' : 'error'}`}>
            <h3>{scanResult.success ? 'Check-in Successful!' : 'Check-in Failed'}</h3>
            
            {scanResult.success ? (
              <div className="success-details">
                <div className="detail">
                  <label>Event:</label>
                  <span>{scanResult.eventName}</span>
                </div>
                <div className="detail">
                  <label>Seat:</label>
                  <span>{scanResult.seatNumber}</span>
                </div>
                <div className="detail">
                  <label>Ticket ID:</label>
                  <span className="ticket-id">{scanResult.ticketId}</span>
                </div>
                <p className="success-message">{scanResult.message}</p>
              </div>
            ) : (
              <div className="error-details">
                <p>{scanResult.message}</p>
              </div>
            )}
            
            <div className="result-actions">
              <button 
                className="btn-primary"
                onClick={resetScanner}
              >
                Scan Another Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {scannedData && !scanResult && (
        <div className="processing">
          <p>Processing QR code...</p>
          <div className="spinner"></div>
        </div>
      )}

      <div className="scanner-info">
        <h3>How to use:</h3>
        <ol>
          <li>Click "Start Scanning" to activate the camera</li>
          <li>Position the ticket QR code within the scanning frame</li>
          <li>Wait for the system to process the check-in</li>
          <li>View the check-in result</li>
        </ol>
        
        <h3>Tips:</h3>
        <ul>
          <li>Ensure good lighting for better QR code detection</li>
          <li>Hold the ticket steady within the frame</li>
          <li>Use "Manual Entry" if the camera isn't working</li>
        </ul>
      </div>
    </div>
  );
};

export default QRScanner;
