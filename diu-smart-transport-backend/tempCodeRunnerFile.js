const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Initialize the Express app
const app = express();
const port = 5000; // Port for the backend

app.use(cors());
app.use(express.json());

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // MySQL username
  password: '', // MySQL password (empty by default)
  database: 'diu_transport', // Your database name
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database.');
});

// Admin Login API (Plain Text Password Comparison)
app.post('/api/admin-login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ? AND role = "admin"';
  db.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error querying database', error: err });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = results[0];

    if (password === user.password) {
      return res.status(200).json({ message: 'Admin Login successful' });
    } else {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  });
});

// API route to add a new bus and automatically add 40 seats
app.post('/api/add-bus', (req, res) => {
  const { route_name, departure_time } = req.body;

  // Validate the request
  if (!route_name || !departure_time) {
    return res.status(400).json({ message: 'Route name and departure time are required.' });
  }

  // Insert the bus into the buses table
  const query = 'INSERT INTO buses (route_name, departure_time) VALUES (?, ?)';
  db.query(query, [route_name, departure_time], (err, results) => {
    if (err) {
      console.error('Error adding bus:', err);
      return res.status(500).json({ message: 'Failed to add bus', error: err });
    }

    const busId = results.insertId; // Get the bus ID of the newly inserted bus

    // Insert 40 seats for the newly added bus
    const seatsQuery = 'INSERT INTO seats (seat_number, status, bus_id) VALUES ';
    const seatValues = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']; // Rows A-J
    const cols = [1, 2, 3, 4]; // Columns 1-4

    // Generate seat values for all 40 seats
    rows.forEach(row => {
      cols.forEach(col => {
        const seatNumber = `${row}${col}`;
        seatValues.push(`('${seatNumber}', 'available', ${busId})`);
      });
    });

    // Run the query to insert the seats
    db.query(seatsQuery + seatValues.join(','), (err, results) => {
      if (err) {
        console.error('Error adding seats:', err);
        return res.status(500).json({ message: 'Failed to add seats', error: err });
      }

      res.status(200).json({ message: 'Bus and seats added successfully', busId });
    });
  });
});

// API route to fetch seats for a specific bus
app.get('/api/seats/:busId', (req, res) => {
  const { busId } = req.params;
  const query = 'SELECT * FROM seats WHERE bus_id = ?';
  db.query(query, [busId], (err, results) => {
    if (err) {
      console.error('Error fetching seats:', err);
      return res.status(500).json({ message: 'Error fetching seats' });
    }
    res.json(results); // Send the list of seats as JSON
  });
});

// API to book a seat
app.post('/api/book-seat', (req, res) => {
  const { seatId } = req.body; // Seat ID from the frontend

  const query = 'UPDATE seats SET status = "booked" WHERE id = ? AND status = "available"';
  db.query(query, [seatId], (err, result) => {
    if (err) {
      console.error('Error booking the seat:', err);
      return res.status(500).json({ message: 'Error booking the seat' });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Seat already booked or unavailable' });
    }

    res.json({ message: 'Seat booked successfully' });
  });
});

// API route to fetch all buses
app.get('/api/buses', (req, res) => {
  const query = 'SELECT * FROM buses'; // Get all buses
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching buses:', err);
      return res.status(500).json({ message: 'Error fetching buses' });
    }
    res.json(results); // Send the list of buses as JSON
  });
});

// Student Login API (Plain Text Password Comparison)
app.post('/api/student-login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ? AND role = "student"';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ message: 'Error querying database', error: err });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = results[0];

    if (password === user.password) {
      return res.status(200).json({ message: 'Student Login successful' });
    } else {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  });
});
app.post('/api/signup', (req, res) => {
  const { email, password, role } = req.body;

  // Check if all fields are provided
  if (!email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Check if the user already exists
  const checkQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkQuery, [email], (err, results) => {
    if (err) {
      console.error('Error checking user existence:', err);
      return res.status(500).json({ message: 'Error checking user existence' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Insert new user into the database
    const insertQuery = 'INSERT INTO users (email, password, role) VALUES (?, ?, ?)';
    db.query(insertQuery, [email, password, role], (err, result) => {
      if (err) {
        console.error('Error signing up user:', err);
        return res.status(500).json({ message: 'Error signing up user' });
      }
      res.status(200).json({ message: 'User signed up successfully' });
    });
  });
});
// API route to delete a bus
app.delete('/api/delete-bus/:busId', (req, res) => {
  const { busId } = req.params;

  // First, delete the seats associated with the bus
  db.query('DELETE FROM seats WHERE bus_id = ?', [busId], (err) => {
    if (err) {
      console.error('Error deleting seats:', err);
      return res.status(500).json({ message: 'Failed to delete seats' });
    }

    // Then, delete the bus itself
    db.query('DELETE FROM buses WHERE id = ?', [busId], (err) => {
      if (err) {
        console.error('Error deleting bus:', err);
        return res.status(500).json({ message: 'Failed to delete bus' });
      }

      res.status(200).json({ message: 'Bus deleted successfully' });
    });
  });
});
// API to get the count of booked seats for the current student
app.get('/api/booked-seats-count', (req, res) => {
  const studentEmail = req.body.email;  // Assuming you have a way to identify the student (e.g., email or userID)
  
  const query = 'SELECT COUNT(*) AS count FROM bookings WHERE student_email = ?';  // Adjust to match your database schema
  
  db.query(query, [studentEmail], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching booked seats count' });
    }
    res.json({ count: results[0].count });  // Send back the count of booked seats
  });
});
// Backend route to cancel a seat booking
app.post('/api/cancel-seat', (req, res) => {
  const { seatId } = req.body;

  const query = 'UPDATE seats SET status = "available" WHERE id = ? AND status = "booked"';
  db.query(query, [seatId], (err, result) => {
    if (err) {
      console.error('Error canceling the seat:', err);
      return res.status(500).json({ message: 'Error canceling the seat' });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Seat is not booked or cannot be canceled' });
    }

    res.json({ message: 'Seat canceled successfully' });
  });
});
// Previous backend code remains unchanged

// Add this new endpoint for student bookings:

app.get('/api/student-bookings', (req, res) => {
  const studentEmail = req.query.email; // Get email from query params

  const query = 'SELECT b.route_name, b.departure_time, s.seat_number, s.status ' +
                'FROM bookings AS bk ' +
                'JOIN seats AS s ON bk.seat_id = s.id ' +
                'JOIN buses AS b ON s.bus_id = b.id ' +
                'WHERE bk.student_email = ?';

  db.query(query, [studentEmail], (err, results) => {
    if (err) {
      console.error('Error fetching student bookings:', err);
      return res.status(500).json({ message: 'Error fetching bookings' });
    }

    res.json(results);  // Send back the list of booking details
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
