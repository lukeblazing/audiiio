// Import the necessary modules using ES module syntax
import 'dotenv/config';  // Replaces require('dotenv').config()
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import { startCronJobs } from './crons/crons.js';  // Use import instead of require
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import AuthController from './authentication/AuthController.js'

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

// Enable cors for development
if (process.env.NODE_ENV === 'development') {
    const corsOptions = {
        origin: 'http://localhost:8080', // dev webpack frontend
        credentials: true,  // Enable sending cookies with requests
    };
    app.use(cors(corsOptions));
    console.log('CORS enabled for development with cookies');
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

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../public/build')));

// Catch-all handler to serve the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/build/index.html'));
});

// Route for handling login
app.post('/login', (req, res) => {
    AuthController.login(req, res);
});

// Route for handling logout
app.post('/logout', (req, res) => {
    AuthController.logout(req, res);
});

// Protected route to test authentication from AuthController
app.get('/protected', AuthController.verifyToken, (req, res) => {
    const userEmail = req.user.email;
    const userRole = req.user.role;

    res.status(200).json({ message: `Welcome ${userEmail}, you are authorized for /protected route as ${userRole}.` });
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
