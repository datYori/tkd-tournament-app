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

// CORS configuration
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Middleware to allow only specific requests
app.use((req, res, next) => {
  const frontendURL = process.env.FRONTEND_HOST;
  const laptopAuthToken = process.env.AUTH_TOKEN;  // Read the token from environment variables

  const origin = req.get('origin');
  const authToken = req.get('X-Auth-Token');

  if ((origin === frontendURL && req.method === 'GET') || authToken === laptopAuthToken) {
    next();
  } else {
    res.status(403).send('Forbidden');
  }
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT"]
  }
});

app.use('/api/participants', participantRoutes);
app.use('/api/tournaments', tournamentRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
