import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  
import axios from 'axios';  // Import Axios for API calls
import './AdminLogin.css';  

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/admin-login', {
        email,
        password
      });

      if (response.status === 200) {
        navigate('/admin-dashboard');  // Redirect to Admin Dashboard on success
      }
    } catch (error) {
      alert("Invalid credentials. Please try again.");  // Show alert for invalid login
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login as Admin</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter your admin email"
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

export default AdminLogin;
