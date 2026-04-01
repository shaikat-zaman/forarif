import React, { useState } from 'react';
import axios from 'axios';
import './Signup.css'; // Import the updated CSS styles

function Signup() {
  const [fullName, setFullName] = useState('');  // Full Name state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/signup', {
        fullName,  // Send full name to backend
        email,
        password,
      });

      alert('Signup successful! Please proceed to the Login page.');
      window.location.href = 'http://localhost:3000/student-login'; // Redirect to login page
    } catch (error) {
      console.error('Error during signup:', error);
      setErrorMessage(error.response?.data?.message || 'Error signing up user');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2 className="signup-title">Sign Up As Student</h2>
        <form onSubmit={handleSubmit} className="signup-form">
          <input
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input-field"
            required
          />
          <input
            type="email"
            placeholder="Enter your Varsity Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            required
          />
          <input
            type="password"
            placeholder="Enter a new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            required
          />
          <button type="submit" className="submit-btn">Sign Up</button>
        </form>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
  );
}

export default Signup;
