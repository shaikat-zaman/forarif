import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/WelcomeDashboard.css';

function WelcomeDashboard() {
  const [showVerifyBox, setShowVerifyBox] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');

  const handleVerifyTicket = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/verify-ticket', { ticketNumber });
      setVerificationMessage(response.data.message);
    } catch (error) {
      setVerificationMessage('Error verifying the ticket. Please try again.');
    }
  };

  return (
    <div className="welcome-container">
      <button className="ticket-verify-button" onClick={() => setShowVerifyBox(true)}>
        Ticket Verification
      </button>

      {showVerifyBox && (
        <div className="ticket-verification-box">
          <h3>Enter Your Ticket Number</h3>
          <input
            type="text"
            placeholder="Enter Ticket Number"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
          />
          <button className="verify-button" onClick={handleVerifyTicket}>Verify</button>
          <button className="close-button" onClick={() => setShowVerifyBox(false)}>Close</button>
          {verificationMessage && <p>{verificationMessage}</p>}
        </div>
      )}

      <div className="welcome-message">
        <h1>Welcome to DIU Smart Transport Portal</h1>
        <p className="welcome-description">
          A smarter way to manage transportation for students.
        </p>
      </div>

      <div className="auth-options">
        <h2>Please select your desired option</h2>
        <div className="buttons-container">
          <Link to="/admin-login" className="auth-button admin-button">
            Admin Login
          </Link>
          <Link to="/student-login" className="auth-button student-button">
            Student Login
          </Link>
          <Link to="/signup" className="auth-button signup-button">
            Register to Login
          </Link>
        </div>
      </div>

      <footer className="footer">
        <p>Copyright © 2025 Shaikat, Sharthak, Maraj, Masud, Anu. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default WelcomeDashboard;
