import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../utils/web3';

const OrganizerPanel = () => {
  const { account, provider, signer } = useWeb3();
  const [events, setEvents] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateSale, setShowCreateSale] = useState(false);

  // Form states
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    date: '',
    location: ''
  });

  const [saleForm, setSaleForm] = useState({
    eventId: '',
    price: '',
    cap: '',
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    if (account && provider) {
      loadOrganizerData();
    }
  }, [account, provider]);

  const loadOrganizerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implement data loading from contracts
      // This would query the TicketNFT and SaleManager contracts
      // for events and sales data
      
      console.log('Loading organizer data for account:', account);
      
      // Placeholder data
      setEvents([
        {
          id: 1,
          name: "Monad Blockchain Conference 2024",
          description: "The future of parallel EVM execution",
          date: "2024-12-15",
          location: "San Francisco, CA",
          active: true
        }
      ]);
      
      setSales([
        {
          eventId: 1,
          price: "0.01",
          cap: 1000,
          sold: 250,
          active: true,
          startTime: "2024-11-01",
          endTime: "2024-12-01"
        }
      ]);
      
    } catch (err) {
      console.error('Error loading organizer data:', err);
      setError('Failed to load organizer data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // TODO: Implement event creation
      // This would call the TicketNFT.createEvent function
      
      console.log('Creating event:', eventForm);
      
      // Reset form
      setEventForm({
        name: '',
        description: '',
        date: '',
        location: ''
      });
      setShowCreateEvent(false);
      
      // Reload data
      await loadOrganizerData();
      
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // TODO: Implement sale creation
      // This would call the SaleManager.createSale function
      
      console.log('Creating sale:', saleForm);
      
      // Reset form
      setSaleForm({
        eventId: '',
        price: '',
        cap: '',
        startTime: '',
        endTime: ''
      });
      setShowCreateSale(false);
      
      // Reload data
      await loadOrganizerData();
      
    } catch (err) {
      console.error('Error creating sale:', err);
      setError('Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSale = async (eventId) => {
    try {
      setLoading(true);
      
      // TODO: Implement sale ending
      // This would call the SaleManager.endSale function
      
      console.log('Ending sale for event:', eventId);
      
      // Reload data
      await loadOrganizerData();
      
    } catch (err) {
      console.error('Error ending sale:', err);
      setError('Failed to end sale');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawProceeds = async () => {
    try {
      setLoading(true);
      
      // TODO: Implement proceeds withdrawal
      // This would call the SaleManager.withdrawProceeds function
      
      console.log('Withdrawing proceeds');
      
    } catch (err) {
      console.error('Error withdrawing proceeds:', err);
      setError('Failed to withdraw proceeds');
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="organizer-panel">
        <div className="connect-wallet">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your wallet to access the organizer panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="organizer-panel">
      <div className="panel-header">
        <h1>Organizer Panel</h1>
        <div className="panel-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowCreateEvent(true)}
          >
            Create Event
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setShowCreateSale(true)}
          >
            Create Sale
          </button>
          <button 
            className="btn-success"
            onClick={handleWithdrawProceeds}
            disabled={loading}
          >
            Withdraw Proceeds
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <p>Loading organizer data...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={loadOrganizerData}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Events Section */}
          <div className="section">
            <h2>Events</h2>
            <div className="events-grid">
              {events.map((event) => (
                <div key={event.id} className="event-card">
                  <h3>{event.name}</h3>
                  <p>{event.description}</p>
                  <div className="event-details">
                    <div className="detail">
                      <label>Date:</label>
                      <span>{event.date}</span>
                    </div>
                    <div className="detail">
                      <label>Location:</label>
                      <span>{event.location}</span>
                    </div>
                    <div className="detail">
                      <label>Status:</label>
                      <span className={`status ${event.active ? 'active' : 'inactive'}`}>
                        {event.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Section */}
          <div className="section">
            <h2>Sales</h2>
            <div className="sales-grid">
              {sales.map((sale) => (
                <div key={sale.eventId} className="sale-card">
                  <h3>Sale for Event #{sale.eventId}</h3>
                  <div className="sale-details">
                    <div className="detail">
                      <label>Price:</label>
                      <span>{sale.price} ETH</span>
                    </div>
                    <div className="detail">
                      <label>Cap:</label>
                      <span>{sale.cap} tickets</span>
                    </div>
                    <div className="detail">
                      <label>Sold:</label>
                      <span>{sale.sold} tickets</span>
                    </div>
                    <div className="detail">
                      <label>Progress:</label>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${(sale.sold / sale.cap) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="detail">
                      <label>Status:</label>
                      <span className={`status ${sale.active ? 'active' : 'inactive'}`}>
                        {sale.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="sale-actions">
                    {sale.active && (
                      <button 
                        className="btn-warning"
                        onClick={() => handleEndSale(sale.eventId)}
                      >
                        End Sale
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create New Event</h2>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Event Name:</label>
                <input
                  type="text"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({...eventForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="datetime-local"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location:</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
                <button type="button" onClick={() => setShowCreateEvent(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Sale Modal */}
      {showCreateSale && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create New Sale</h2>
            <form onSubmit={handleCreateSale}>
              <div className="form-group">
                <label>Event ID:</label>
                <input
                  type="number"
                  value={saleForm.eventId}
                  onChange={(e) => setSaleForm({...saleForm, eventId: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Price (ETH):</label>
                <input
                  type="number"
                  step="0.001"
                  value={saleForm.price}
                  onChange={(e) => setSaleForm({...saleForm, price: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Cap (tickets):</label>
                <input
                  type="number"
                  value={saleForm.cap}
                  onChange={(e) => setSaleForm({...saleForm, cap: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Start Time:</label>
                <input
                  type="datetime-local"
                  value={saleForm.startTime}
                  onChange={(e) => setSaleForm({...saleForm, startTime: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Time:</label>
                <input
                  type="datetime-local"
                  value={saleForm.endTime}
                  onChange={(e) => setSaleForm({...saleForm, endTime: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Sale'}
                </button>
                <button type="button" onClick={() => setShowCreateSale(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerPanel;
