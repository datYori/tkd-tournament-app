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
app.use(bodyParser.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT"]
  }
});

mongoose.connect('mongodb://localhost/tournament', { useNewUrlParser: true, useUnifiedTopology: true });

const ParticipantSchema = new mongoose.Schema({
  name: String,
  weightCategory: String,
  ageCategory: String,
  kupCategory: String,
  gender: String,
});
const Participant = mongoose.model('Participant', ParticipantSchema);

const MatchSchema = new mongoose.Schema({
  id: Number,
  participant: String,
  opponent: String,
  nextMatch: Number,
  result: {
    winner: String  // Store the winner's name.
  },
  round: Number
});

const TournamentSchema = new mongoose.Schema({
  weightCategory: String,
  ageCategory: String,
  gender: String,
  kupCategory: String,
  matches: [MatchSchema],
  startDate: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' }
});
const Tournament = mongoose.model('Tournament', TournamentSchema);

// API to get all participants
app.get('/api/participants', async (req, res) => {
  try {
    const participants = await Participant.find();
    res.status(200).send(participants);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching participants', error: error });
  }
});

// API to add a new participant
app.post('/api/participants', async (req, res) => {
  const participant = new Participant(req.body);
  await participant.save();
  res.status(201).send(participant);
});

// API to delete a participant
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

// POST API to generate a tournament bracket
app.post('/api/tournaments', async (req, res) => {
  const { weightCategory, ageCategory, gender, kupCategory } = req.body;
  try {
    const participants = await Participant.find({ weightCategory, ageCategory, gender, kupCategory }).lean();
    if (participants.length < 2) {
      return res.status(400).send({ message: 'Not enough participants for a tournament' });
    }
    const shuffledParticipants = shuffleParticipants(participants);
    const tournamentTree = createTournamentTree(shuffledParticipants, weightCategory, ageCategory, gender, kupCategory);
    const newTournament = new Tournament({ weightCategory, ageCategory, gender, kupCategory, matches: tournamentTree.matches });
    await newTournament.save();
    res.status(201).send(newTournament);
  } catch (error) {
    res.status(500).send({ message: 'Error generating bracket', error: error });
  }
});

// GET API to retrieve tournament state
app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).send({ message: 'Tournament not found' });
    }
    res.status(200).send(tournament);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching tournament', error: error });
  }
});

function shuffleParticipants(participants) {
  for (let i = participants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }
  return participants;
}

function createTournamentTree(participants, weightCategory, ageCategory, gender, kupCategory) {
  const rounds = Math.ceil(Math.log2(participants.length));
  const matches = [];
  let matchId = 1;
  let currentRound = 1;

  while (participants.length > 1) {
    const roundMatches = [];
    for (let i = 0; i < participants.length; i += 2) {
      if (i + 1 < participants.length) {
        roundMatches.push({
          id: matchId++,
          participant: participants[i].name,
          opponent: participants[i + 1].name,
          nextMatch: Math.floor(matchId / 2),
          round: currentRound,
          result: {} // Empty result initially
        });
      }
    }
    matches.push(...roundMatches);
    currentRound++;
    participants = roundMatches.map(match => ({ name: `Winner of Match ${match.id}` })); // Placeholder for winners
  }

  return { matches };
}

app.put('/api/tournaments/:tournamentId', async (req, res) => {
  const { tournamentId } = req.params;
  const { matches } = req.body;

  try {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).send({ message: 'Tournament not found' });
    }

    // Update matches
    tournament.matches = matches;
    await tournament.save();

    res.status(200).send(tournament); // Ensure updated tournament is sent back
  } catch (error) {
    res.status(500).send({ message: 'Error updating tournament', error });
  }
});

// API to update a participant
app.put('/api/participants/:id', async (req, res) => {
  const { id } = req.params;
  const { name, weightCategory, ageCategory, kupCategory, gender } = req.body;

  try {
    const participant = await Participant.findByIdAndUpdate(
      id,
      { name, weightCategory, ageCategory, kupCategory, gender },
      { new: true }
    );
    if (!participant) {
      return res.status(404).send({ message: 'Participant not found' });
    }
    res.status(200).send(participant);
  } catch (error) {
    res.status(500).send({ message: 'Error updating participant', error: error });
  }
});



server.listen(3000, () => {
  console.log('Server running on port 3000');
});
