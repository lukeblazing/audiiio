// Import the necessary modules using ES module syntax
import 'dotenv/config';  // Replaces require('dotenv').config()
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import { startCronJobs } from './crons/crons.js';  // Use import instead of require
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

// Start the cron jobs
startCronJobs();

// Middleware to force HTTPS
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'development' && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../public/build')));

// Catch-all handler to serve the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/build/index.html'));
});

// Define the greet endpoint
app.post("/api/greet", (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Name is required" });
    }
    const greetingMessage = `Hello, ${name}!`;
    res.json({ message: greetingMessage });
});

// Healthcheck endpoint
app.get("/healthcheck", (req, res) => {
    res.json({ status: "healthy!" });
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
