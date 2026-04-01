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
  database: 'diu_transport', // Database name
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database.');
});

// Admin Login API
app.post('/api/admin-login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT email, password FROM admin WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error querying database', error: err });
    }

    if (results.length === 0 || results[0].password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    return res.status(200).json({ message: 'Admin Login successful', admin: results[0] });
  });
});

// API route to sign up a new student
app.post('/api/signup', (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const checkQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkQuery, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error checking user existence' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const insertQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
  db.query(insertQuery, [fullName, email, password], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error signing up user' });
    }
    res.status(200).json({ message: 'User signed up successfully' });
  });
});
});

// Student Login API
app.post('/api/student-login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error querying database', error: err });
    }

    if (results.length === 0 || results[0].password !== password) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    return res.status(200).json({ message: 'Login successful', user: results[0] });
  });
});

// API route to fetch all buses
app.get('/api/buses', (req, res) => {
  const query = 'SELECT * FROM buses';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching buses' });
    }
    res.json(results);
  });
});

// API route to book a seat
app.post('/api/book-seat', (req, res) => {
  const { seatId, email, routeName, seatNumber, departureTime, ticketNumber } = req.body;

  // Step 1: Check if the user has already booked 2 seats
  const checkSeatCountQuery = 'SELECT COUNT(*) AS seatCount FROM seats WHERE email = ? AND status = "booked"';
  db.query(checkSeatCountQuery, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error checking seat count', error: err });
    }

    const seatCount = results[0].seatCount;
    if (seatCount >= 2) {
      return res.status(400).json({ message: 'You have already booked the maximum number of seats (2).' });
    }

    // Step 2: Check if the seat is available
    const checkSeatQuery = 'SELECT * FROM seats WHERE id = ? AND status = "available"';
    db.query(checkSeatQuery, [seatId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error checking seat availability', error: err });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: 'Seat is already booked or unavailable' });
      }

      // Step 3: Update the seat status and store the email
      const updateSeatQuery = 'UPDATE seats SET status = "booked", email = ? WHERE id = ?';
      db.query(updateSeatQuery, [email, seatId], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error booking the seat', error: err });
        }

        if (result.affectedRows === 0) {
          return res.status(400).json({ message: 'Seat booking failed' });
        }

        // Step 4: Insert into all_history
        const insertHistoryQuery = `
          INSERT INTO all_history (email, bus_details, ticket_number, seat_booked, status)
          VALUES (?, ?, ?, ?, 'booked')
        `;
        db.query(insertHistoryQuery, [email, routeName, ticketNumber, seatNumber], (err) => {
          if (err) {
            console.error('Error inserting into all_history:', err);
          }
        });

        // Step 5: Update or insert ticket details
        const checkTicketQuery = 'SELECT * FROM ticket_details WHERE email = ?';
        db.query(checkTicketQuery, [email], (err, results) => {
          if (err) {
            return res.status(500).json({ message: 'Error checking ticket details', error: err });
          }

          if (results.length > 0) {
            // Update existing ticket details
            const updateTicketQuery = `
              UPDATE ticket_details 
              SET SeatBooked = CONCAT(SeatBooked, ', ', ?), 
                  BusDetails = ?, 
                  ticket_number = CONCAT(ticket_number, ', ', ?) 
              WHERE email = ?
            `;
            db.query(updateTicketQuery, [seatNumber, routeName, ticketNumber, email], (err) => {
              if (err) {
                return res.status(500).json({ message: 'Error updating ticket details', error: err });
              }
              res.json({ message: 'Seat booked successfully', ticketNumber: ticketNumber });
            });
          } else {
            // Insert new ticket details
            const insertTicketQuery = `
              INSERT INTO ticket_details (email, ticket_number, SeatBooked, BusDetails) 
              VALUES (?, ?, ?, ?)
            `;
            db.query(insertTicketQuery, [email, ticketNumber, seatNumber, routeName], (err) => {
              if (err) {
                return res.status(500).json({ message: 'Error inserting ticket details', error: err });
              }
              res.json({ message: 'Seat booked successfully', ticketNumber: ticketNumber });
            });
          }
        });
      });
    });
  });
});

// API route to cancel a seat booking
app.post('/api/cancel-seat', (req, res) => {
  const { seatId, email, seatNumber } = req.body;

  // Step 1: Update seat status to "available" and clear the email
  const updateSeatQuery = 'UPDATE seats SET status = "available", email = NULL WHERE id = ? AND status = "booked"';
  db.query(updateSeatQuery, [seatId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error canceling the seat', error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Seat is not booked or cannot be canceled' });
    }

    // Step 2: Fetch the current ticket details for the user
    const fetchTicketQuery = 'SELECT * FROM ticket_details WHERE email = ?';
    db.query(fetchTicketQuery, [email], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching ticket details', error: err });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: 'No ticket found for this user' });
      }

      const ticket = results[0];

      // Step 3: Insert into all_history
      const insertHistoryQuery = `
        INSERT INTO all_history (email, bus_details, ticket_number, seat_booked, status)
        VALUES (?, ?, ?, ?, 'cancel')
      `;
      db.query(insertHistoryQuery, [email, ticket.BusDetails, ticket.ticket_number, seatNumber], (err) => {
        if (err) {
          console.error('Error inserting into all_history:', err);
        }
      });

      // Step 4: Remove the canceled seat and ticket number from ticket_details
      const currentSeats = ticket.SeatBooked.split(',').map(seat => seat.trim());
      const currentTickets = ticket.ticket_number.split(',').map(ticket => ticket.trim());

      const updatedSeats = currentSeats.filter(seat => seat !== seatNumber);
      const updatedTickets = currentTickets.filter(ticket => !ticket.includes(seatNumber));

      if (updatedSeats.length === 0) {
        // If no seats are left, delete the entire row
        const deleteQuery = 'DELETE FROM ticket_details WHERE email = ?';
        db.query(deleteQuery, [email], (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error deleting ticket details', error: err });
          }
          return res.json({ message: 'Seat canceled successfully. Ticket details deleted.' });
        });
      } else {
        // Update the ticket_details table with the remaining seats and tickets
        const updateTicketQuery = `
          UPDATE ticket_details 
          SET SeatBooked = ?, 
              ticket_number = ? 
          WHERE email = ?`;
        
        db.query(updateTicketQuery, [updatedSeats.join(', '), updatedTickets.join(', '), email], (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error updating ticket details', error: err });
          }
          return res.json({ message: 'Seat canceled successfully' });
        });
      }
    });
  });
});

// API route to verify ticket
app.post('/api/verify-ticket', (req, res) => {
  const { ticketNumber } = req.body;

  const query = `
    SELECT email, SeatBooked, BusDetails 
    FROM ticket_details 
    WHERE FIND_IN_SET(?, REPLACE(ticket_number, ', ', ',')) > 0`;

  db.query(query, [ticketNumber], (err, results) => {
    if (err) {
      console.error('Error verifying ticket:', err);
      return res.status(500).json({ message: 'Server error. Please try again later.' });
    }

    if (results.length > 0) {
      const { email, SeatBooked, BusDetails } = results[0]; // Get ticket details
      res.json({ 
        message: `Account: ${email},\nSeats: ${SeatBooked},\nBus: ${BusDetails}:\n\nCongratulations! Your ticket has been successfully verified and is now confirmed as official.` 
      });
    } else {
      res.json({ message: 'Ticket Verification Failed. Your ticket is not recognized in our system. Please verify the details and try again.' });
    }
  });
});

// API route to delete a bus
app.delete('/api/delete-bus/:busId', (req, res) => {
  const { busId } = req.params;

  db.query('DELETE FROM seats WHERE bus_id = ?', [busId], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to delete seats' });
    }

    db.query('DELETE FROM buses WHERE id = ?', [busId], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to delete bus' });
      }

      res.status(200).json({ message: 'Bus deleted successfully' });
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

// API route to add a bus
app.post('/api/add-bus', (req, res) => {
  const { route_name, departure_time, seat_count } = req.body;

  if (!route_name || !departure_time || !seat_count) {
    return res.status(400).json({ message: 'Route name, departure time, and seat count are required.' });
  }

  const query = 'INSERT INTO buses (route_name, departure_time) VALUES (?, ?)';
  db.query(query, [route_name, departure_time], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to add bus', error: err });
    }

    const busId = results.insertId; // Get the bus ID

    // Insert seats dynamically based on seat_count
    const seatValues = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const cols = Array.from({ length: Math.ceil(seat_count / 10) }, (_, i) => i + 1);

    for (let i = 0; i < seat_count; i++) {
      const row = rows[Math.floor(i / cols.length)];
      const col = cols[i % cols.length];
      seatValues.push(`('${row}${col}', 'available', ${busId})`);
    }

    const seatsQuery = `INSERT INTO seats (seat_number, status, bus_id) VALUES ${seatValues.join(', ')}`;
    db.query(seatsQuery, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to add seats', error: err });
      }
      res.status(200).json({ message: 'Bus and seats added successfully', busId });
    });
  });
});

// API route to fetch booking history
app.get('/api/booking-history', (req, res) => {
  const query = 'SELECT * FROM ticket_details';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching booking history:', err);
      return res.status(500).json({ message: 'Error fetching booking history' });
    }
    res.json(results);
  });
});

// API route to fetch booked seats for a user
app.get('/api/booked-seats/:email', (req, res) => {
  const { email } = req.params;
  const query = 'SELECT * FROM seats WHERE email = ? AND status = "booked"';

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error fetching booked seats:', err);
      return res.status(500).json({ message: 'Error fetching booked seats' });
    }
    res.json(results); // Send the list of booked seats as JSON
  });
});

// Fetch all booking and cancellation history
app.get('/api/all-history', (req, res) => {
  const query = 'SELECT * FROM all_history ORDER BY created_at DESC';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching all booking history:', err);
      return res.status(500).json({ message: 'Error fetching all booking history' });
    }
    res.json(results);
  });
});
// API route to fetch all audit data from all_history
app.get('/api/all-history', (req, res) => {
  const query = 'SELECT * FROM all_history ORDER BY created_at DESC';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching all audit data:', err);
      return res.status(500).json({ message: 'Error fetching all audit data' });
    }
    res.json(results);
  });
});// In server.js
app.get('/api/booked-seats/:email', (req, res) => {
  const { email } = req.params;
  const query = `
    SELECT s.*, t.ticket_number 
    FROM seats s
    LEFT JOIN ticket_details t ON s.email = t.email
      AND FIND_IN_SET(s.seat_number, REPLACE(t.SeatBooked, ', ', ',')) > 0
    WHERE s.email = ? AND s.status = "booked"
  `;

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error fetching booked seats:', err);
      return res.status(500).json({ message: 'Error fetching booked seats' });
    }
    console.log('Raw SQL results:', results); 
    res.json(results);
  });
});
app.get('/api/booked-seats/:email', async (req, res) => {
  const { email } = req.params;

  // Fetch seats
  const seatsQuery = `
    SELECT * FROM seats 
    WHERE email = ? AND status = 'booked'
  `;
  
  // Fetch tickets
  const ticketsQuery = `
    SELECT * FROM ticket_details 
    WHERE email = ?
  `;

  try {
    const [seats, tickets] = await Promise.all([
      db.query(seatsQuery, [email]),
      db.query(ticketsQuery, [email]),
    ]);

    // Map seats to their tickets
    const seatsWithTickets = seats.map(seat => {
      const ticket = tickets.find(t => 
        t.SeatBooked && t.SeatBooked.includes(seat.seat_number)
      );
      return {
        ...seat,
        ticket_number: ticket?.ticket_number || 'Awaiting confirmation',
      };
    });

    res.json(seatsWithTickets);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Failed to fetch booked seats' });
  }
});
app.get('/api/booked-seats/:email', (req, res) => {
  const { email } = req.params;
  const query = `
    SELECT 
      s.*, 
      td.ticket_number 
    FROM seats s
    LEFT JOIN ticket_details td ON s.email = td.email
    WHERE s.email = ? AND s.status = "booked"
  `;
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error fetching booked seats:', err);
      return res.status(500).json({ message: 'Error fetching booked seats' });
    }
    res.json(results);
  });
});
app.get('/api/ticket-details/:email', (req, res) => {
  const { email } = req.params;
  const query = 'SELECT * FROM ticket_details WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error fetching ticket details:', err);
      return res.status(500).json({ message: 'Error fetching ticket details' });
    }
    res.json(results);
  });
});
app.get('/api/booking-history/:email', (req, res) => {
  const { email } = req.params;
  const query = `
    SELECT 
      s.id AS seat_id,
      s.seat_number,
      s.bus_id,
      s.status,
      td.ticket_number,
      td.BusDetails,
      td.SeatBooked
    FROM seats s
    LEFT JOIN ticket_details td ON s.email = td.email
    WHERE s.email = ? AND s.status = "booked"
  `;
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error fetching booking history:', err);
      return res.status(500).json({ message: 'Error fetching booking history' });
    }
    res.json(results);
  });
});
// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});