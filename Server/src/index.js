// Import the necessary modules using ES module syntax
import 'dotenv/config';
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import { startCronJobs } from './crons/crons.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import AuthController from './authentication/AuthController.js'
import db from './database/db.js';

// Create __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Use helmet middleware
app.use(helmet());

// Middleware to parse JSON bodies
app.use(express.json());

// Enable cors for prod url
const corsOptions = {
    origin: process.env.NODE_ENV === 'development'
        ? 'http://localhost:8080'  // Allow dev frontend on localhost
        : 'https://www.lukeblazing.com', // Allow production frontend on myapp.com
    credentials: true,               // Enable sending cookies with requests
};

app.use(cors(corsOptions));

if (process.env.NODE_ENV === 'development') {
    console.log('CORS enabled for development with localhost:8080');
} else {
    console.log('CORS enabled for production with www.lukeblazing.com');
}

// Start the cron jobs
startCronJobs();

// Middleware to force HTTPS
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'development' && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
});

// Sign up: Create a new user
app.post('/api/signUp', async (req, res) => {
    try {
        return await AuthController.createUser(req, res);
    } catch (error) {
        // If there's a server error, return a 500 status code
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred',
            error: error.message
        });
    }
});

// Route for handling login
app.post('/api/login', async (req, res) => {
    try {
        return await AuthController.login(req, res);
    } catch (error) {
        // If there's a server error, return a 500 status code
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred',
            error: error.message
        });
    }
});

// Route for handling logout
app.post('/api/logout', (req, res) => {
    try {
        return AuthController.logout(req, res);
    } catch (error) {
        // If there's a server error, return a 500 status code
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred',
            error: error.message
        });
    }
});

// Protected route to test authentication from AuthController
app.get('/api/authCheck', AuthController.verifyToken, (req, res) => {
    const userEmail = req.user.email;
    const userRole = req.user.role;

    res.status(200).json({ message: `Welcome ${userEmail}, you are authorized for /protected route as ${userRole}.` });
});



// GET /api/calendar/getAllEventsForUser
// Retrieve all events from any calendar associated with the user.
// This includes calendars owned by the user and those where they are added.
app.get('/api/calendar/getAllEventsForUser', AuthController.verifyToken, async (req, res) => {
  if (!req?.user?.role) {
    return res.status(401).json({ message: 'Access denied. User does not have sufficient permissions provided.' });
  }
  if (!req?.user?.email) {
    return res.status(401).json({ message: 'Access denied. No email provided.' });
  }
  const userEmail = req.user.email;
  try {
    const query = `
      SELECT e.*
      FROM events e
      JOIN calendars c ON e.calendar_id = c.id
      WHERE c.owner_id = $1
         OR c.id IN (SELECT calendar_id FROM calendar_users WHERE user_id = $1)
    `;
    const result = await db.query(query, [userEmail]);
    return res.status(200).json({ events: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// --------------------------------------------------------------------
// POST /api/calendar/event
// Create an event in a particular calendar.
app.post('/api/calendar/event', AuthController.verifyToken, async (req, res) => {
  console.log("hello there!")
  if (!req?.user?.role) {
    return res.status(401).json({ message: 'Access denied. User does not have sufficient permissions provided.' });
  }
  console.log("hello2")
  if (!req?.user?.email) {
    return res.status(401).json({ message: 'Access denied. No email provided.' });
  }
  console.log("hello3")
  const event = req.body.event;
  if (!event || !event.calendar_id || !event.title || !event.start || !event.end_time) {
    return res.status(400).json({ message: 'Missing required event fields.' });
  }
  console.log("hello4")
  try {
    const query = `
      INSERT INTO events (calendar_id, category_id, title, description, start, end_time, all_day, recurrence_rule)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      event.calendar_id,
      event.category_id || null,
      event.title,
      event.description || null,
      event.start,
      event.end_time,
      event.all_day || false,
      event.recurrence_rule || null
    ];
    const result = await db.query(query, values);
    return res.status(201).json({ event: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// --------------------------------------------------------------------
// DELETE /api/calendar/event
// Delete a specified event.
app.delete('/api/calendar/event', AuthController.verifyToken, async (req, res) => {
  if (!req?.user?.role) {
    return res.status(401).json({ message: 'Access denied. User does not have sufficient permissions provided.' });
  }
  if (!req?.user?.email) {
    return res.status(401).json({ message: 'Access denied. No email provided.' });
  }
  const event = req.body.event;
  if (!event || !event.id) {
    return res.status(400).json({ message: 'Event id is required for deletion.' });
  }
  try {
    const query = `DELETE FROM events WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [event.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    return res.status(200).json({ message: 'Event deleted successfully.', event: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// --------------------------------------------------------------------
// POST /api/calendar/calendar
// Create a new calendar. The authenticated user becomes the owner.
app.post('/api/calendar/calendar', AuthController.verifyToken, async (req, res) => {
  if (!req?.user?.role) {
    return res.status(401).json({ message: 'Access denied. User does not have sufficient permissions provided.' });
  }
  if (!req?.user?.email) {
    return res.status(401).json({ message: 'Access denied. No email provided.' });
  }
  const calendar = req.body.calendar;
  if (!calendar || !calendar.name) {
    return res.status(400).json({ message: 'Calendar name is required.' });
  }
  try {
    const query = `
      INSERT INTO calendars (name, description, owner_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [calendar.name, calendar.description || null, req.user.email];
    const result = await db.query(query, values);
    return res.status(201).json({ calendar: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// --------------------------------------------------------------------
// DELETE /api/calendar/calendar
// Delete a calendar. Only the owner is allowed to delete it.
app.delete('/api/calendar/calendar', AuthController.verifyToken, async (req, res) => {
  if (!req?.user?.role) {
    return res.status(401).json({ message: 'Access denied. User does not have sufficient permissions provided.' });
  }
  if (!req?.user?.email) {
    return res.status(401).json({ message: 'Access denied. No email provided.' });
  }
  const calendar = req.body.calendar;
  if (!calendar || !calendar.id) {
    return res.status(400).json({ message: 'Calendar id is required for deletion.' });
  }
  try {
    // Check that the authenticated user is the owner of the calendar.
    const checkQuery = `SELECT * FROM calendars WHERE id = $1 AND owner_id = $2`;
    const checkResult = await db.query(checkQuery, [calendar.id, req.user.email]);
    if (checkResult.rowCount === 0) {
      return res.status(404).json({ message: 'Calendar not found or you are not the owner.' });
    }
    const deleteQuery = `DELETE FROM calendars WHERE id = $1 RETURNING *`;
    const result = await db.query(deleteQuery, [calendar.id]);
    return res.status(200).json({ message: 'Calendar deleted successfully.', calendar: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * deprecated
 */
app.get('/api/calendar/events', (req, res) => {
    console.log("luke got a request for events")
    res.status(200).json([
        {
          "id": 1,
          "title": "Morning Meeting",
          "start": "2025-02-10T09:00:00Z",
          "end": "2025-02-10T10:00:00Z",
          "description": "A daily stand-up meeting to discuss ongoing projects and tasks."
        },
        {
          "id": 2,
          "title": "Team Lunch",
          "start": "2025-02-10T12:00:00Z",
          "end": "2025-02-10T13:00:00Z",
          "description": "Casual lunch with the team to catch up and discuss non-work topics."
        },
        {
          "id": 3,
          "title": "Daily Briefing",
          "start": "2025-02-11T08:30:00Z",
          "end": "2025-02-11T09:00:00Z",
          "description": "Quick morning check-in to align on priorities for the day."
        },
        {
          "id": 4,
          "title": "Project Kickoff",
          "start": "2025-02-12T09:00:00Z",
          "end": "2025-02-12T10:00:00Z",
          "description": "Initial meeting to outline project goals, timelines, and responsibilities."
        },
        {
          "id": 5,
          "title": "Client Presentation",
          "start": "2025-02-12T10:30:00Z",
          "end": "2025-02-12T11:30:00Z",
          "description": "A detailed presentation showcasing our latest project to potential clients."
        },
        {
          "id": 6,
          "title": "Workshop Session",
          "start": "2025-02-12T12:00:00Z",
          "end": "2025-02-12T13:00:00Z",
          "description": "Hands-on workshop focused on team collaboration and skill-building."
        },
        {
          "id": 7,
          "title": "Strategy Discussion",
          "start": "2025-02-12T14:00:00Z",
          "end": "2025-02-12T15:00:00Z",
          "description": "A brainstorming session to plan the company’s long-term strategy."
        },
        {
          "id": 8,
          "title": "Marketing Brainstorm",
          "start": "2025-02-12T15:30:00Z",
          "end": "2025-02-12T16:30:00Z",
          "description": "A creative session to generate ideas for upcoming marketing campaigns."
        },
        {
          "id": 9,
          "title": "Product Demo",
          "start": "2025-02-12T17:00:00Z",
          "end": "2025-02-12T18:00:00Z",
          "description": "Demonstration of the new product features to internal stakeholders."
        },
        {
          "id": 10,
          "title": "Team Sync-Up",
          "start": "2025-02-13T09:00:00Z",
          "end": "2025-02-13T09:30:00Z",
          "description": "A quick meeting to align on the status of ongoing tasks and blockers."
        },
        {
          "id": 11,
          "title": "Client Call",
          "start": "2025-02-14T11:00:00Z",
          "end": "2025-02-14T12:00:00Z",
          "description": "A scheduled call with a client to discuss their requirements and feedback."
        },
        {
          "id": 12,
          "title": "Wrap-Up Meeting",
          "start": "2025-02-15T16:00:00Z",
          "end": "2025-02-15T17:00:00Z",
          "description": "Final meeting of the week to summarize progress and set next steps."
        },
        {
          "id": 13,
          "title": "Review Session",
          "start": "2025-02-16T14:00:00Z",
          "end": "2025-02-16T15:00:00Z",
          "description": "A detailed review of completed tasks and areas for improvement."
        }
      ])
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../public/build')));

// Catch-all handler to serve the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/build/index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log('We are about to start this server now.');
    if (process.env.NODE_ENV === 'development') {
        console.log(`Server is running on http://localhost:${PORT}`);
    } else {
        console.log(`Server is running on PORT ${PORT}`);
    }
});
