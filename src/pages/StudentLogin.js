import React, { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentLogin.css'; // Import the updated CSS styles

function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Send login request to the backend
      const response = await axios.post('http://localhost:5000/api/student-login', {
        email,
        password
      });

      if (response.status === 200) {
        // On successful login, store the email in localStorage
        localStorage.setItem('userEmail', email);

        // Navigate to the student dashboard
        navigate('/student-dashboard');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error logging in');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Login As Student</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter your Registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
          />
          <button type="submit" className="submit-btn">Login</button>
        </form>
      </div>
    </div>
  );
}

export default StudentLogin;
