import QRCode from 'qrcode';

/**
 * QR Code utilities for ticket generation and scanning
 */

// Generate QR code for a ticket
export const generateTicketQR = async (ticketData) => {
  try {
    const qrData = {
      ticketId: ticketData.ticketId,
      eventId: ticketData.eventId,
      seatSerial: ticketData.seatSerial,
      user: ticketData.user,
      timestamp: ticketData.timestamp,
      signature: ticketData.signature // EIP-712 signature for offline verification
    };
    
    const qrString = JSON.stringify(qrData);
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return {
      dataURL: qrCodeDataURL,
      data: qrString,
      ticketData: qrData
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Parse QR code data
export const parseQRData = (qrString) => {
  try {
    const data = JSON.parse(qrString);
    
    // Validate required fields
    if (!data.ticketId || !data.eventId || !data.seatSerial) {
      throw new Error('Invalid QR code data');
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing QR data:', error);
    throw new Error('Invalid QR code format');
  }
};

// Generate EIP-712 signature for offline verification
export const generateOfflineSignature = async (ticketData, signer) => {
  try {
    const domain = {
      name: 'Delphi Ticket System',
      version: '1',
      chainId: 1234, // Monad testnet
      verifyingContract: process.env.NEXT_PUBLIC_TICKET_NFT_ADDRESS
    };
    
    const types = {
      Ticket: [
        { name: 'ticketId', type: 'uint256' },
        { name: 'eventId', type: 'uint256' },
        { name: 'seatSerial', type: 'uint256' },
        { name: 'user', type: 'address' },
        { name: 'timestamp', type: 'uint256' }
      ]
    };
    
    const value = {
      ticketId: ticketData.ticketId,
      eventId: ticketData.eventId,
      seatSerial: ticketData.seatSerial,
      user: ticketData.user,
      timestamp: ticketData.timestamp
    };
    
    const signature = await signer._signTypedData(domain, types, value);
    
    return {
      domain,
      types,
      value,
      signature
    };
  } catch (error) {
    console.error('Error generating offline signature:', error);
    throw new Error('Failed to generate offline signature');
  }
};

// Verify EIP-712 signature
export const verifyOfflineSignature = (ticketData, signature, expectedSigner) => {
  try {
    // TODO: Implement signature verification
    // This would use ethers.js to verify the EIP-712 signature
    // and ensure it was signed by the expected signer
    
    console.log('Verifying signature for:', ticketData);
    console.log('Signature:', signature);
    console.log('Expected signer:', expectedSigner);
    
    // For now, return true (implement actual verification)
    return true;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

// Generate QR code for check-in
export const generateCheckInQR = async (ticketId, eventId, seatSerial) => {
  try {
    const checkInData = {
      type: 'checkin',
      ticketId,
      eventId,
      seatSerial,
      timestamp: Date.now()
    };
    
    const qrString = JSON.stringify(checkInData);
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return {
      dataURL: qrCodeDataURL,
      data: qrString,
      checkInData
    };
  } catch (error) {
    console.error('Error generating check-in QR:', error);
    throw new Error('Failed to generate check-in QR code');
  }
};

// Validate check-in QR code
export const validateCheckInQR = (qrString) => {
  try {
    const data = JSON.parse(qrString);
    
    if (data.type !== 'checkin') {
      throw new Error('Invalid QR code type');
    }
    
    if (!data.ticketId || !data.eventId || !data.seatSerial) {
      throw new Error('Missing required fields');
    }
    
    return {
      valid: true,
      data
    };
  } catch (error) {
    console.error('Error validating check-in QR:', error);
    return {
      valid: false,
      error: error.message
    };
  }
};

// Generate QR code for event sharing
export const generateEventQR = async (eventId, eventName, eventDate) => {
  try {
    const eventData = {
      type: 'event',
      eventId,
      eventName,
      eventDate,
      timestamp: Date.now()
    };
    
    const qrString = JSON.stringify(eventData);
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return {
      dataURL: qrCodeDataURL,
      data: qrString,
      eventData
    };
  } catch (error) {
    console.error('Error generating event QR:', error);
    throw new Error('Failed to generate event QR code');
  }
};

// QR code scanning utilities
export const startQRScanner = (videoElement, onQRDetected) => {
  // TODO: Implement QR code scanning
  // This would use a library like jsQR or qr-scanner
  // to detect QR codes from the video stream
  
  console.log('Starting QR scanner...');
  
  // Placeholder implementation
  return {
    start: () => console.log('QR scanner started'),
    stop: () => console.log('QR scanner stopped'),
    destroy: () => console.log('QR scanner destroyed')
  };
};

// Export QR code as image
export const exportQRAsImage = (qrDataURL, filename = 'ticket-qr.png') => {
  try {
    const link = document.createElement('a');
    link.download = filename;
    link.href = qrDataURL;
    link.click();
  } catch (error) {
    console.error('Error exporting QR code:', error);
    throw new Error('Failed to export QR code');
  }
};

// Print QR code
export const printQR = (qrDataURL) => {
  try {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body { text-align: center; margin: 50px; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <img src="${qrDataURL}" alt="Ticket QR Code" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  } catch (error) {
    console.error('Error printing QR code:', error);
    throw new Error('Failed to print QR code');
  }
};
