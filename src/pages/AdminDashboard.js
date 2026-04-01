import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css'; 

function AdminDashboard() {
  const [buses, setBuses] = useState([]);
  const [routeName, setRouteName] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [seatCount, setSeatCount] = useState(40); // Default seat count
  const [showAddBusForm, setShowAddBusForm] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [seats, setSeats] = useState([]);
  const [showBookingHistory, setShowBookingHistory] = useState(false);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [showAuditData, setShowAuditData] = useState(false);
  const [auditData, setAuditData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/buses');
      setBuses(response.data);
    } catch (error) {
      console.error('Error fetching buses:', error);
    }
  };

  const fetchSeats = async (busId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/seats/${busId}`);
      setSeats(response.data);
    } catch (error) {
      console.error('Error fetching seats:', error);
    }
  };

  const fetchBookingHistory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/booking-history');
      setBookingHistory(response.data);
    } catch (error) {
      console.error('Error fetching booking history:', error);
    }
  };

  const fetchAuditData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/all-history');
      setAuditData(response.data);
    } catch (error) {
      console.error('Error fetching audit data:', error);
    }
  };

  const toggleBookingHistory = () => {
    if (!showBookingHistory) {
      fetchBookingHistory();
    }
    setShowBookingHistory(!showBookingHistory);
  };

  const toggleAuditData = () => {
    if (!showAuditData) {
      fetchAuditData();
    }
    setShowAuditData(!showAuditData);
  };

  const handleBusChange = (e) => {
    const busId = e.target.value;
    setSelectedBusId(busId);
    fetchSeats(busId);
  };

  const handleLogout = () => {
    navigate('/'); // Redirect to home page using React Router
  };

  const handleAddBus = async (e) => {
    e.preventDefault();
    if (!routeName || !departureTime || !seatCount) {
      alert('Please fill out all fields');
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/api/add-bus', {
        route_name: routeName,
        departure_time: departureTime,
        seat_count: seatCount,
      });

      if (response.status === 200) {
        setRouteName('');
        setDepartureTime('');
        setSeatCount(40); // Reset to default
        setShowAddBusForm(false);
        fetchBuses();
      }
    } catch (error) {
      console.error('Error adding bus:', error);
      alert('Failed to add bus');
    }
  };

  const handleDeleteBus = async (busId) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/delete-bus/${busId}`);
      if (response.status === 200) {
        alert('Bus deleted successfully');
        fetchBuses();
      }
    } catch (error) {
      console.error('Error deleting bus:', error);
      alert('Failed to delete bus');
    }
  };

  return (
    <div className="admin-dashboard-container">
      <header className="header">
        <div className="header-left">
          <h2 className="dashboard-title">Admin Dashboard</h2>
          <button className="logout-btn" onClick={handleLogout}>Log Out</button>
        </div>
        <div className="right-menu">
          <button className="booking-history-btn" onClick={toggleBookingHistory}>Booking History</button>
          <button className="audit-data-btn" onClick={toggleAuditData}>Audit All Data</button>
        </div>
      </header>

      <div className="add-bus-container">
        <button className="add-bus-btn" onClick={() => setShowAddBusForm(!showAddBusForm)}>
          {showAddBusForm ? 'Cancel' : 'Add New Bus'}
        </button>
        {showAddBusForm && (
          <form className="add-bus-form" onSubmit={handleAddBus}>
            <input
              type="text"
              placeholder="Bus name~Route Name"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="input-field"
            />
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Number of Seats"
              value={seatCount}
              onChange={(e) => setSeatCount(e.target.value)}
              className="input-field"
            />
            <button type="submit" className="submit-btn">Add Bus</button>
          </form>
        )}
      </div>

      <div className="bus-select-container">
        <label htmlFor="bus-select" className="select-label">Pick a Bus to View Seats Details:</label>
        <select id="bus-select" className="bus-select" onChange={handleBusChange}>
          <option value="">--Select Bus--</option>
          {buses.map((bus) => (
            <option key={bus.id} value={bus.id}>
              {bus.route_name} - {bus.departure_time}
            </option>
          ))}
        </select>
      </div>

      {selectedBusId && (
        <div>
          <h3 className="seat-title">Seats for Bus: {selectedBusId}</h3>
          <div className="seats-grid">
            {seats.length === 0 ? (
              <p>No seats available</p>
            ) : (
              seats.map((seat) => (
                <button
                  key={seat.id}
                  className={`seat ${seat.status === 'booked' ? 'booked' : 'available'}`}
                  disabled={seat.status === 'booked'}
                >
                  {seat.seat_number}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <h3 className="all-buses-title">Buses are currently in departure status ⤵️</h3>
      <ul className="buses-list">
        {buses.map((bus) => (
          <li key={bus.id} className="bus-item">
            {bus.route_name} - {bus.departure_time}
            <button className="delete-bus-btn" onClick={() => handleDeleteBus(bus.id)}>
              Stop Booking
            </button>
          </li>
        ))}
      </ul>

      {/* Popup Window for Booking History */}
      {showBookingHistory && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Booking History</h3>
            <button className="close-btn" onClick={toggleBookingHistory}>X</button>
            <table className="booking-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Ticket Numbers</th>
                  <th>Seats</th>
                  <th>Bus Details</th>
                </tr>
              </thead>
              <tbody>
                {bookingHistory.length > 0 ? (
                  bookingHistory.map((record, index) => (
                    <tr key={index}>
                      <td>{record.email}</td>
                      <td>{record.ticket_number}</td>
                      <td>{record.SeatBooked}</td>
                      <td>{record.BusDetails}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No Booking History Found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Popup Window for Audit Data */}
      {showAuditData && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Audit All Data</h3>
            <button className="close-btn" onClick={toggleAuditData}>X</button>
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Bus Details</th>
                  <th>Ticket Number</th>
                  <th>Seat Booked</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {auditData.length > 0 ? (
                  auditData.map((record, index) => (
                    <tr key={index}>
                      <td>{record.email}</td>
                      <td>{record.bus_details}</td>
                      <td>{record.ticket_number}</td>
                      <td>{record.seat_booked}</td>
                      <td>{record.status}</td>
                      <td>{new Date(record.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No Audit Data Found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;