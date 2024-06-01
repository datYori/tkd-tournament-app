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
  status: { type: String, default: 'Pending' },
  combatZone: Number,
  currentState: {
    previousMatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
    nextMatchId: Number,
    status: String // 'Pending', 'Ongoing', 'Completed'
  }
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
  const { weightCategory, ageCategory, gender, kupCategory, combatZone } = req.body;
  console.log('Received request to create tournament:', req.body);
  try {
    if (!combatZone) {
      throw new Error('Combat Zone is required');
    }

    const participants = await Participant.find({ weightCategory, ageCategory, gender, kupCategory }).lean();
    console.log('Participants found:', participants);

    const tournamentTree = createTournamentTree(participants, weightCategory, ageCategory, gender, kupCategory, combatZone);
    console.log('Tournament tree created:', tournamentTree);

    const initialMatch = tournamentTree.matches.find(match => !match.result.winner);
    const newTournament = new Tournament({
      weightCategory,
      ageCategory,
      gender,
      kupCategory,
      matches: tournamentTree.matches,
      combatZone,
      currentState: {
        previousMatches: [],
        nextMatchId: initialMatch ? initialMatch.id : null,
        status: initialMatch ? 'Ongoing' : 'Completed'
      }
    });
    await newTournament.save();
    console.log('New tournament saved:', newTournament);
    res.status(201).send(newTournament);
  } catch (error) {
    console.error('Error generating bracket:', error.message);
    res.status(500).send({ message: 'Error generating bracket', error: error.message });
  }
});

// GET API to retrieve tournament state
app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id).populate('matches');
    if (!tournament) {
      return res.status(404).send({ message: 'Tournament not found' });
    }
    res.status(200).send(tournament);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching tournament', error: error });
  }
});

// PUT API to update match result and tournament state
app.put('/api/tournaments/:tournamentId/matches/:matchId', async (req, res) => {
  const { tournamentId, matchId } = req.params;
  const { winner } = req.body;

  try {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).send({ message: 'Tournament not found' });
    }

    const match = tournament.matches.id(matchId);
    if (!match) {
      return res.status(404).send({ message: 'Match not found' });
    }

    // Update match result
    match.result.winner = winner;

    // Update tournament state
    const nextMatchId = tournament.currentState.nextMatchId + 1;
    tournament.currentState.previousMatches.push(match._id);
    const nextMatch = tournament.matches.find(m => m.id === nextMatchId);
    tournament.currentState.nextMatchId = nextMatch ? nextMatch.id : null;
    tournament.currentState.status = nextMatch ? 'Ongoing' : 'Completed';

    await tournament.save();

    res.status(200).send(tournament); // Ensure updated tournament is sent back
  } catch (error) {
    res.status(500).send({ message: 'Error updating match result', error });
  }
});

// GET API to list all tournaments
app.get('/api/tournaments', async (req, res) => {
  try {
    const tournaments = await Tournament.find();
    res.status(200).send(tournaments);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching tournaments', error: error });
  }
});

// DELETE API to delete tournament
app.delete('/api/tournaments/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ message: 'Invalid tournament ID' });
  }
  try {
    const result = await Tournament.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).send({ message: 'Tournament not found' });
    }
    res.status(200).send({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
});


function shuffleParticipants(participants) {
  for (let i = participants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }
  return participants;
}

// Function to create the tournament tree
function createTournamentTree(participants, weightCategory, ageCategory, gender, kupCategory, combatZone) {
  if (participants.length < 2) {
    const matches = [{
      id: combatZone * 1000 + 1,
      participant: participants[0] ? participants[0].name : 'BYE',
      opponent: 'BYE',
      nextMatch: null,
      round: 1,
      result: {
        winner: participants[0] ? participants[0].name : 'BYE'
      }
    }];
    return { matches };
  }

  const rounds = Math.ceil(Math.log2(participants.length));
  const totalMatches = 2 ** rounds - 1;
  const totalParticipants = 2 ** rounds;

  let paddedParticipants = [...participants];  // Change to let for reassignment
  while (paddedParticipants.length < totalParticipants) {
    paddedParticipants.push({ name: 'BYE' });
  }

  const matches = [];
  let matchId = combatZone * 1000 + 1;
  let currentRound = 1;

  while (paddedParticipants.length > 1) {
    const roundMatches = [];
    for (let i = 0; i < paddedParticipants.length; i += 2) {
      if (i + 1 < paddedParticipants.length) {
        roundMatches.push({
          id: matchId++,
          participant: paddedParticipants[i].name,
          opponent: paddedParticipants[i + 1].name,
          nextMatch: Math.floor(matchId / 2),
          round: currentRound,
          result: {}
        });
      }
    }
    matches.push(...roundMatches);
    currentRound++;
    paddedParticipants = roundMatches.map(match => ({ name: `Winner of Match ${match.id}` }));
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
