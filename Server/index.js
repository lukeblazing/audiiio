require('dotenv').config();
const express = require("express");
const path = require('path');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 3000;

// Use helmet middleware
app.use(helmet());

// Middleware to parse JSON bodies
app.use(express.json());

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
    if (process.env.NODE_ENV === 'development') console.log(`Server is running on http://localhost:${PORT}`);
    else console.log(`Server is running on PORT ${PORT}`);
});
