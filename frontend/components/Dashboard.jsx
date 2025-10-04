import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../utils/web3';

const Dashboard = () => {
  const { account, provider, signer } = useWeb3();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (account && provider) {
      loadUserTickets();
    }
  }, [account, provider]);

  const loadUserTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implement ticket loading logic
      // This would query the TicketNFT contract for user's tickets
      // and decode the metadata
      
      console.log('Loading tickets for account:', account);
      
      // Placeholder data
      setTickets([
        {
          id: 1,
          eventName: "Monad Blockchain Conference 2024",
          seatNumber: "A-101",
          date: "2024-12-15",
          location: "San Francisco, CA",
          qrCode: "placeholder-qr-code",
          used: false
        }
      ]);
      
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = (ticketId) => {
    // TODO: Implement QR code generation
    // This would generate a QR code containing the ticket ID
    // for check-in purposes
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketId}`;
  };

  if (!account) {
    return (
      <div className="dashboard">
        <div className="connect-wallet">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your wallet to view your tickets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Tickets</h1>
        <p>Welcome back, {account.slice(0, 6)}...{account.slice(-4)}</p>
      </div>

      {loading && (
        <div className="loading">
          <p>Loading your tickets...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={loadUserTickets}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="tickets-grid">
          {tickets.length === 0 ? (
            <div className="no-tickets">
              <h3>No tickets found</h3>
              <p>You don't have any tickets yet. Check out our events!</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <h3>{ticket.eventName}</h3>
                  <span className={`status ${ticket.used ? 'used' : 'active'}`}>
                    {ticket.used ? 'Used' : 'Active'}
                  </span>
                </div>
                
                <div className="ticket-details">
                  <div className="detail">
                    <label>Seat:</label>
                    <span>{ticket.seatNumber}</span>
                  </div>
                  <div className="detail">
                    <label>Date:</label>
                    <span>{ticket.date}</span>
                  </div>
                  <div className="detail">
                    <label>Location:</label>
                    <span>{ticket.location}</span>
                  </div>
                </div>

                {!ticket.used && (
                  <div className="ticket-qr">
                    <img 
                      src={generateQRCode(ticket.id)} 
                      alt="Ticket QR Code"
                      className="qr-code"
                    />
                    <p className="qr-note">Show this QR code at the event entrance</p>
                  </div>
                )}

                {ticket.used && (
                  <div className="ticket-used">
                    <p>This ticket has been used</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
