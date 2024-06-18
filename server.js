const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const db = require('./config/db');
const participantRoutes = require('./routes/participants');
const tournamentRoutes = require('./routes/tournaments');

const app = express();
const PORT = process.env.PORT || 3000;

// Get frontend URL and auth token from environment variables
const frontendURL = process.env.FRONTEND_URL;
const adminAuthToken = process.env.AUTH_TOKEN;

// CORS configuration
const corsOptions = {
  origin: [frontendURL, 'http://localhost:3000'], // Add frontend URL and local development URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Auth-Token'],
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Middleware to allow only specific requests
app.use((req, res, next) => {
  const origin = req.get('origin');
  const authToken = req.get('X-Auth-Token');

  if ((origin === frontendURL && req.method === 'GET') || authToken === adminAuthToken) {
    next();
  } else {
    res.status(403).send('Forbidden');
  }
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [frontendURL, 'http://localhost:3000'],
    methods: ["GET", "POST", "PUT"],
  }
});

app.use('/api/participants', participantRoutes);
app.use('/api/tournaments', tournamentRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
