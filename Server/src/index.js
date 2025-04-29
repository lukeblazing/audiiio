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
import webpush from 'web-push';

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

// Configure VAPID details
webpush.setVapidDetails(
  'mailto:lukeblazing@yahoo.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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

    // temporarily disable sign up
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      error: error.message
    });

    //return await AuthController.createUser(req, res);
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
  const userName = req.user.name;

  res.status(200).json({ message: `Welcome ${userEmail}, you are authorized for /protected route as ${userRole}.`, user: req.user });
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

  const allowedEmails = ['lukeblazing@yahoo.com', 'chelsyjohnson1234@gmail.com'];
  if (!allowedEmails.includes(req.user.email)) {
    return res.status(200).json({ events: [] }); // return empty list if not approved
  }

  try {
    const query = `
      SELECT *
      FROM events
    `;
    const result = await db.query(query);
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
  if (!req?.user?.role) {
    return res.status(401).json({ message: 'Access denied. User does not have sufficient permissions provided.' });
  }
  if (!req?.user?.email) {
    return res.status(401).json({ message: 'Access denied. No email provided.' });
  }
  const event = req.body.event;
  if (!event || !event.title || !event.start) {
    return res.status(400).json({ message: 'Missing required event fields.' });
  }
  try {
    const query = `
      INSERT INTO events (calendar_id, category_id, title, description, start, end_time, all_day, recurrence_rule, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      event.calendar_id || null,
      event.category_id || null,
      event.title,
      event.description || null,
      new Date(event.start).toISOString(),   // sanitize
      event.end_time ? new Date(event.end_time).toISOString() : null,  // sanitize
      event.all_day || false,
      event.recurrence_rule || null,
      req.user.email,                        // always use auth token email as created_by
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

// GET /api/calendar/getCalendarsForUser
// Retrieve all calendars that the user owns or is added to.
app.get('/api/calendar/getCalendarsForUser', AuthController.verifyToken, async (req, res) => {
  if (!req?.user?.email) {
    return res.status(401).json({ message: 'Access denied. No email provided.' });
  }
  try {
    const query = `
      SELECT * FROM calendars
    `;
    const result = await db.query(query);
    return res.status(200).json({ calendars: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/api/calendar/events', async (req, res) => {
  console.log("Received a request for events");
  try {
    // Query the events table. Adjust the SELECT statement if you need to filter or join data.
    const result = await db.query(`
      SELECT 
        id, 
        title, 
        description, 
        start, 
        end_time, 
        all_day, 
        recurrence_rule 
      FROM events
    `);

    // Map the returned rows to match the expected JSON format,
    // renaming end_time to end for client-side compatibility.
    const events = result.rows.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: event.start,
      end: event.end_time,
      // Optional: Include additional fields if needed
      allDay: event.all_day,
      recurrenceRule: event.recurrence_rule
    }));

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/calendar/categories
// Retrieve all categories for a given calendar.
app.get('/api/calendar/categories', AuthController.verifyToken, async (req, res) => {
  if (!req?.user?.email) {
    return res.status(401).json({ message: 'Access denied. No email provided.' });
  }
  const { calendar_id } = req.query;
  if (!calendar_id) {
    return res.status(400).json({ message: 'calendar_id query parameter is required.' });
  }
  try {
    const query = 'SELECT id, calendar_id, name, color FROM categories WHERE calendar_id = $1';
    const result = await db.query(query, [calendar_id]);
    return res.status(200).json({ categories: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ------------------------------
// Push Notification Endpoints
// ------------------------------

// POST /api/subscribe
// Registers a push subscription for the authenticated user.
app.post('/api/subscribe', AuthController.verifyToken, async (req, res) => {
  console.log("/api/subscribe");
  const subscription = req.body.subscription;
  if (!subscription) {
    return res.status(400).json({ message: 'Subscription object is required.' });
  }
  try {
    // Use an upsert query to insert or update the subscription for the user.
    await db.query(
      `
      INSERT INTO push_subscriptions (user_email, subscription)
      VALUES ($1, $2)
      ON CONFLICT (user_email)
      DO UPDATE SET subscription = $2, created_at = now()
      `,
      [req.user.email, subscription]
    );
    console.log(`Stored subscription for user: ${req.user.email}`);
    return res.status(201).json({ message: 'Subscription registered.' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/unsubscribe
// Removes the push subscription for the authenticated user.
app.post('/api/unsubscribe', AuthController.verifyToken, async (req, res) => {
  console.log("/api/unsubscribe");
  try {
    // Delete the subscription record from the database for the authenticated user.
    await db.query(
      `DELETE FROM push_subscriptions WHERE user_email = $1`,
      [req.user.email]
    );
    console.log(`Removed subscription for user: ${req.user.email}`);
    return res.status(200).json({ message: 'Subscription removed.' });
  } catch (error) {
    console.error('Error removing subscription:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/sendNotification
// Sends a push notification to a target user.
// Expects { targetEmail, title, body, url } in the request body.
app.post('/api/sendNotification', AuthController.verifyToken, async (req, res) => {
  const { targetEmail, title, body: messageBody, url } = req.body;
  if (!targetEmail || !messageBody) {
    return res.status(400).json({ message: 'targetEmail and message body are required.' });
  }
  try {
    // Retrieve the subscription from the database for the target user.
    const result = await db.query(
      'SELECT subscription FROM push_subscriptions WHERE user_email = $1',
      [targetEmail]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No subscription found for target user.' });
    }
    const subscription = result.rows[0].subscription;
    const payload = JSON.stringify({
      title: req.user.name,
      body: messageBody,
      icon: '/icon.png', // Update with your icon path if needed
      url: url || '/',   // URL to open when the notification is clicked
    });
    await webpush.sendNotification(subscription, payload);
    return res.status(200).json({ message: 'Notification sent.' });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ message: 'Failed to send notification', error: error.message });
  }
});

// GET /api/availableUsers
app.get('/api/availableUsers', AuthController.verifyToken, async (req, res) => {
  try {
    const result = await db.query('SELECT user_email FROM push_subscriptions');
    // Map the result into a format suitable for your select box.
    const users = result.rows.map(row => ({
      id: row.user_email,
      email: row.user_email,
    }));
    return res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ------------------------------
// End Push Notification Endpoints
// ------------------------------


// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../public/build')));

// Catch-all handler to serve the React app
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../public/build/index.html'));
// });

// Start the server
app.listen(PORT, () => {
  console.log('We are about to start this server now.');
  if (process.env.NODE_ENV === 'development') {
    console.log(`Server is running on http://localhost:${PORT}`);
  } else {
    console.log(`Server is running on PORT ${PORT}`);
  }
});
