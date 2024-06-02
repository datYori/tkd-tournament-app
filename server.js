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

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT"]
  }
});

app.use('/api/participants', participantRoutes);
app.use('/api/tournaments', tournamentRoutes);

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
