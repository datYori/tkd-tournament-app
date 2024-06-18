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

app.use((req, res, next) => {
  const frontendURL = process.env.FRONTEND_HOST;
  const adminHostIP = process.env.ADMIN_HOST_IP;

  const origin = req.get('origin');
  const ip = req.ip;

  if ((origin === frontendURL && req.method === 'GET') || ip === adminHostIP) {
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
