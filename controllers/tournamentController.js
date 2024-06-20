const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const Participant = require('../models/Participant');
const { createTournamentTree } = require('../utils/createTournamentTree');

function generateTournamentId(weightCategory, ageCategory, gender, kupCategory, combatZone) {
  const formatCategory = (category) => category.replace(/-/g, 'minus').replace(/\+/g, 'plus').replace(/\s+/g, '_');
  return `${formatCategory(ageCategory)}_${formatCategory(weightCategory)}_${gender}_${kupCategory}_${combatZone}`;
}

exports.createTournament = async (req, res) => {
  const { weightCategory, ageCategory, gender, kupCategory, combatZone } = req.body;
  try {
    if (!combatZone) {
      throw new Error('Combat Zone is required');
    }

    const participants = await Participant.find({ weightCategory, ageCategory, gender, kupCategory }).lean();
    const rounds = createTournamentTree(participants);

    const newTournament = new Tournament({
      _id: generateTournamentId(weightCategory, ageCategory, gender, kupCategory, combatZone),
      weightCategory,
      ageCategory,
      gender,
      kupCategory,
      rounds,
      combatZone,
      currentState: {
        previousMatches: [],
        nextMatchId: rounds[0]?.seeds[0]?.id || null,
        status: 'Pending'
      }
    });
    await newTournament.save();
    res.status(201).send(newTournament);
  } catch (error) {
    res.status(500).send({ message: 'Error generating bracket', error: error.message });
  }
};

exports.getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).send({ message: 'Tournament not found' });
    }

    res.status(200).send(tournament);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching tournament', error });
  }
};

exports.updateMatchResult = async (req, res) => {
  const { tournamentId, matchId } = req.params;
  const { winner } = req.body;

  try {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).send({ message: 'Tournament not found' });
    }

    const match = tournament.matches.find(m => m.id === parseInt(matchId));
    if (!match) {
      return res.status(404).send({ message: 'Match not found' });
    }

    // Update match result
    match.result.winner = winner;
    match.matchComplete = true;
    match.matchAccepted = true;

    // Update next match participant/opponent
    const nextMatch = tournament.matches.find(m => m.id === match.nextMatch);
    if (nextMatch) {
      if (nextMatch.participant === `Winner of Match ${match.id}`) {
        nextMatch.participant = winner;
      } else if (nextMatch.opponent === `Winner of Match ${match.id}`) {
        nextMatch.opponent = winner;
      }

      // Update next match details if both participants are decided
      if (nextMatch.participant !== `Winner of Match ${match.id}` && nextMatch.opponent !== `Winner of Match ${match.id}`) {
        nextMatch.matchComplete = false;
        nextMatch.matchAccepted = false;
      }
    }

    // Update tournament state
    tournament.currentState.previousMatches.push(match._id);
    const ongoingMatch = tournament.matches.find(m => m.participant.startsWith('Winner of') || m.opponent.startsWith('Winner of'));
    tournament.currentState.nextMatchId = ongoingMatch ? ongoingMatch.id : null;
    tournament.currentState.status = ongoingMatch ? 'Ongoing' : 'Completed';

    await tournament.save();
    res.status(200).send(tournament);
  } catch (error) {
    res.status(500).send({ message: 'Error updating match result', error });
  }
};

exports.listTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find();
    res.status(200).send(tournaments);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching tournaments', error });
  }
};

exports.deleteTournament = async (req, res) => {
  const { id } = req.params;
  // Remove the mongoose ObjectId validation
  try {
    const result = await Tournament.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).send({ message: 'Tournament not found' });
    }
    res.status(200).send({ message: 'Tournament deleted successfully' });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.updateTournament = async (req, res) => {
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

    res.status(200).send(tournament);
  } catch (error) {
    res.status(500).send({ message: 'Error updating tournament', error });
  }
};
