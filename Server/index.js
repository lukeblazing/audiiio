const express = require("express");
const https = require('https');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to force HTTPS
// app.use((req, res, next) => {
//     if (req.headers['x-forwarded-proto'] !== 'https') {
//         return res.redirect('https://' + req.headers.host + req.url);
//     }
//     next();
// });

app.use(express.static(path.join(__dirname, 'public/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/build/index.html'));
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
    console.log(`Server is running on https://localhost:${PORT}`);
});
