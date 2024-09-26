// Import the necessary modules using ES module syntax
import 'dotenv/config';
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

// Sign up: Create a new user
app.post('/api/signUp', async (req, res) => {
    try {
        // Call the createUser function and wait for its response
        const newUser = await AuthController.createUser(req, res);

        // If user creation was successful, return a 200 status code with the response
        if (newUser.success) {
            return res.status(200).json(newUser);
        }

        // If there was an error (e.g., email already in use), return a 400 status code
        return res.status(400).json({
            success: false,
            message: newUser.message
        });

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
app.post('/api/login', (req, res) => {
    AuthController.login(req, res);
});

// Route for handling logout
app.post('/api/logout', (req, res) => {
    AuthController.logout(req, res);
});

// Protected route to test authentication from AuthController
app.get('/api/protected', AuthController.verifyToken, (req, res) => {
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
