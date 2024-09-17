require('dotenv').config();
const express = require("express");
const path = require('path');
const helmet = require('helmet');
const app = express();
const cors = require('cors');

const PORT = process.env.PORT || 3000;

// Use helmet middleware
app.use(helmet());

// Middleware to parse JSON bodies
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
    app.use(cors({
        origin: 'http://localhost:8080' // Allow only requests from this origin
    }));
}

// Middleware to force HTTPS
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'development' && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/build/index.html'));
});

// Login
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (email === 'luke' && password === 'hi') {
        res.status(200).json({ 
            success: true, 
            token: "auth token here" 
        });
    } else {
        res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid username or password."
        });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log('We are about to start this server now.');
    if (process.env.NODE_ENV === 'development') console.log(`Server is running on http://localhost:${PORT}`);
    else console.log(`Server is running on PORT ${PORT}`);
});
