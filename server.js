const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

// CORS options
const corsOptions = {
  origin: '*', // Allow any domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001", // Adjust this to match your frontend's URL if it's different
    methods: ["GET", "POST"]
  }
});

app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/tournament', { useNewUrlParser: true, useUnifiedTopology: true });

const ParticipantSchema = new mongoose.Schema({
  name: String,
  weightCategory: String,
  ageCategory: String
});
const Participant = mongoose.model('Participant', ParticipantSchema);

const MatchSchema = new mongoose.Schema({
  participants: [String],
  winner: String,
});
const Match = mongoose.model('Match', MatchSchema);

app.get('/api/participants', async (req, res) => {
  try {
    const participants = await Participant.find();
    res.status(200).send(participants);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching participants', error: error });
  }
});

app.post('/api/participants', async (req, res) => {
  const participant = new Participant(req.body);
  await participant.save();
  res.status(201).send(participant);
});

app.delete('/api/participants/:id', async (req, res) => {
  try {
    const result = await Participant.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).send({ message: 'Participant not found' });
    }
    res.status(200).send({ message: 'Participant deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
});

app.post('/api/matches', async (req, res) => {
  const match = new Match(req.body);
  await match.save();
  res.status(201).send(match);
});

app.put('/api/matches/:id', async (req, res) => {
  await Match.findByIdAndUpdate(req.params.id, { winner: req.body.winner });
  io.emit('matchUpdated', { matchId: req.params.id, winner: req.body.winner });
  res.send({ success: true });
});

app.get('/api/matches/:weight/:age', async (req, res) => {
  const { weight, age } = req.params;
  try {
    const matches = await Match.find({ weightCategory: weight, ageCategory: age });
    res.json(matches);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching matches', error });
  }
});

// New endpoint to generate and shuffle brackets
app.post('/api/generate-bracket/:weight/:age', async (req, res) => {
  const { weight, age } = req.params;
  try {
    const participants = await Participant.find({ weightCategory: weight, ageCategory: age });
    if (participants.length < 2) {
      return res.status(400).send({ message: 'Not enough participants to generate a bracket.' });
    }

    // Shuffle participants
    const shuffledParticipants = participants.sort(() => 0.5 - Math.random());

    // Pair participants for initial matches
    const matches = [];
    for (let i = 0; i < shuffledParticipants.length; i += 2) {
      if (shuffledParticipants[i + 1]) { // Ensure there's a pair
        const newMatch = new Match({
          participants: [shuffledParticipants[i]._id, shuffledParticipants[i + 1]._id],
          weightCategory: weight,
          ageCategory: age
        });
        await newMatch.save();
        matches.push(newMatch);
      }
    }

    res.status(201).send(matches);
  } catch (error) {
    res.status(500).send({ message: 'Error generating bracket', error });
  }
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
