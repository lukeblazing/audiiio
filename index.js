const express = require("express");
const cors = require("cors");
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// SSL options
const options = {
    // key: fs.readFileSync('path/to/your/private.key'),
    // cert: fs.readFileSync('path/to/your/certificate.crt')
};

// Define the greet endpoint
app.post("/api/greet", (req, res) => {

    console.log("got here luke");

    const { name } = req.body;

    console.log(name);

    if (!name) {
        return res.status(400).json({ message: "Name is required" });
    }

    const greetingMessage = `Hello, ${name}!`;
    res.json({ message: greetingMessage });
});

// Define the greet endpoint
app.get("/healthcheck", (req, res) => {
    res.json({ status: "healthy!"});
});

// Start the server with HTTPS
app.listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}`);
});
