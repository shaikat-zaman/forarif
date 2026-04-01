import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';

function StudentDashboard() {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookedSeatsCount, setBookedSeatsCount] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const [bookingDetails, setBookingDetails] = useState({
    email: '',
    route: '',
    seats: [],
    departureTime: '',
    ticketNumber: ''
  });
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [showBookedSeatsPopup, setShowBookedSeatsPopup] = useState(false);
  const [ticketDetails, setTicketDetails] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/buses');
        setBuses(response.data);
      } catch (error) {
        console.error('Error fetching buses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBuses();

    const email = localStorage.getItem('userEmail');
    if (email) {
      setUserEmail(email);
      fetchBookedSeats(email);
      fetchTicketDetails(email);
    }
  }, []);

  const fetchSeats = async (busId) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/seats/${busId}`);
      setSeats(response.data);
    } catch (error) {
      console.error('Error fetching seats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedSeats = async (email) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/booked-seats/${email}`);
      setBookedSeats(response.data || []);
    } catch (error) {
      console.error('Error fetching booked seats:', error);
      setBookedSeats([]);
    }
  };

  const fetchTicketDetails = async (email) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/ticket-details/${email}`);
      setTicketDetails(response.data || []);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      setTicketDetails([]);
    }
  };

  const handleSeatBookingOrCancellation = async (seatId, currentStatus, seatNumber, routeName, departureTime) => {
    if (currentStatus === 'booked') {
      try {
        const response = await axios.post('http://localhost:5000/api/cancel-seat', { seatId, email: userEmail, seatNumber });
        alert(response.data.message);
        setBookedSeatsCount(bookedSeatsCount - 1);
        fetchSeats(selectedBus.id);
        fetchBookedSeats(userEmail);
        fetchTicketDetails(userEmail);
        setBookingDetails((prevState) => ({
          ...prevState,
          seats: prevState.seats.filter((seat) => seat !== seatNumber)
        }));
      } catch (error) {
        console.error('canceling the seat:', error);
        alert('canceling the seat');
      }
    } else if (bookedSeatsCount >= 2) {
      alert('You have already booked the maximum number of seats (2).');
    } else {
      try {
        const ticketNumber = `DIU_T${Math.floor(Math.random() * 1000000)}`;
        
        const response = await axios.post('http://localhost:5000/api/book-seat', {
          seatId,
          email: userEmail,
          routeName,
          seatNumber,
          departureTime,
          ticketNumber
        });
        
        alert(response.data.message);
        setBookedSeatsCount(bookedSeatsCount + 1);
        fetchSeats(selectedBus.id);
        fetchBookedSeats(userEmail);
        fetchTicketDetails(userEmail);

        setBookingDetails((prevState) => ({
          ...prevState,
          seats: [...prevState.seats, seatNumber],
          email: prevState.email || userEmail,
          route: prevState.route || routeName,
          departureTime: prevState.departureTime || departureTime,
          ticketNumber: ticketNumber
        }));
      } catch (error) {
        console.error('You have reached your limit:', error);
        alert('You have reached your limit');
      }
    }
  };

  return (
    <div className="student-dashboard-container">
      <header className="dashboard-header">
        <div className="user-info">
          <p>Account: {userEmail || "Not logged in"}</p>
        </div>
        <button className="logout-btn" onClick={() => navigate('/')}>Log Out</button>
      </header>

      <button className="show-booked-seats-btn" onClick={() => setShowBookedSeatsPopup(true)}>
        Booking History
      </button>

      {showBookedSeatsPopup && (
        <div className="booked-seats-popup">
          <div className="popup-content">
            <h3>Your Booked Seats</h3>
            
            {ticketDetails.length > 0 ? (
              ticketDetails.map((ticket) => (
                <div key={ticket.id} className="booked-seat-item">
                  <p><strong>Ticket Number:</strong> {ticket.ticket_number}</p>
                  <p><strong>Seats:</strong> {ticket.SeatBooked}</p>
                  <p><strong>Bus:</strong> {ticket.BusDetails}</p>
                  {bookedSeats
                    .filter(seat => ticket.SeatBooked.includes(seat.seat_number))
                    .map(seat => (
                      <button
                        key={seat.id}
                        className="cancel-seat-btn"
                        onClick={() => handleSeatBookingOrCancellation(
                          seat.id, 
                          'booked', 
                          seat.seat_number, 
                          seat.route_name, 
                          seat.departure_time
                        )}
                      >
                        Cancel Seat {seat.seat_number}
                      </button>
                    ))
                  }
                </div>
              ))
            ) : (
              <p>No seats booked.</p>
            )}

            <button 
              className="close-popup-btn" 
              onClick={() => setShowBookedSeatsPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <h2 className="welcome-title">Welcome to Smart Transport Portal</h2>
      <h3 className="select-bus-title">Select Your Desired Bus⤵️</h3>

      {loading ? (
        <p className="loading-message">Loading buses...</p>
      ) : (
        <div className="bus-list">
          {buses.map((bus) => (
            <div key={bus.id} className="bus-item" onClick={() => {
              setSelectedBus(bus);
              fetchSeats(bus.id);
            }}>
              <h3>{bus.route_name}</h3>
              <p>Route: {bus.route_name}</p>
              <p>Departure Time: {bus.departure_time}</p>
              <button className="book-seat-btn">Book Seat</button>
            </div>
          ))}
        </div>
      )}

      {selectedBus && (
        <div>
          <h3 className="seat-title">Seats for Bus ~ {selectedBus.route_name}</h3>
          {loading ? (
            <p className="loading-message">Loading seats...</p>
          ) : (
            <div className="seats-grid">
              {seats.length > 0 ? (
                seats.map((seat) => {
                  const isBookedByCurrentUser = seat.status === 'booked' && bookingDetails.seats.includes(seat.seat_number);
                  return (
                    <button
                      key={seat.id}
                      className={`seat ${seat.status === 'booked' ? 'booked' : 'available'}`}
                      disabled={seat.status === 'booked' && !isBookedByCurrentUser}
                      onClick={() => handleSeatBookingOrCancellation(seat.id, seat.status, seat.seat_number, selectedBus.route_name, selectedBus.departure_time)}
                    >
                      {seat.seat_number}
                    </button>
                  );
                })
              ) : (
                <p>No seats available.</p>
              )}
            </div>
          )}
        </div>
      )}

      <button className="booking-details-btn" onClick={() => setShowBookingDetails(!showBookingDetails)}>
        Collect your ticket
      </button>

      {showBookingDetails && bookingDetails.seats && bookingDetails.seats.length > 0 && (
        <div className="ticket-container">
          <div className="ticket">
            {/* Left Sidebar - Transport Office */}
            <div className="ticket-sidebar">
              <p>OFFICE OF THE TRANSPORT</p>
            </div>

            {/* Middle Section - Passenger Ticket Details */}
            <div className="ticket-main">
              <h4>Passenger Email</h4>
              <p><strong>{bookingDetails.email}</strong></p>
              <hr />
              
              <h4>Departure Time:</h4>
              <p><strong>{bookingDetails.departureTime}</strong> &nbsp; From &nbsp; <strong>DSC</strong></p>
              <hr />

              <h4>Seats Booked:</h4>
              <p><strong>{bookingDetails.seats.join(', ')}</strong></p>
              <hr />

              <h4>Ticket Number:</h4>
              <p><strong>{bookingDetails.ticketNumber}</strong></p>
            </div>

            {/* Right Section - DIU Branding */}
            <div className="ticket-right">
              <h3>DAFFODIL INTERNATIONAL UNIVERSITY "Service by SHAIKAT"</h3>
              <p>Take a screenshot and save it for a seamless experience.</p>
            </div>

            {/* Rightmost Passenger Details */}
            <div className="ticket-passenger">
              <h4>Passenger Email</h4>
              <p><strong>{bookingDetails.email}</strong></p>
              <hr />

              <h4>Departure Time:</h4>
              <p><strong>{bookingDetails.departureTime}</strong></p>

              <h4>Seats Booked:</h4>
              <p><strong>{bookingDetails.seats.join(', ')}</strong></p>

              <h4>BUS DETAILS:</h4>
              <p className="route-info">({bookingDetails.route})</p>

              <h4>Ticket Number:</h4>
              <p><strong>{bookingDetails.ticketNumber}</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;