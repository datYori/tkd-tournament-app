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
    const tournamentTree = createTournamentTree(participants, weightCategory, ageCategory, gender, kupCategory, combatZone);

    const initialMatch = tournamentTree.matches.find(match => !match.result.winner);
    const newTournament = new Tournament({
      _id: generateTournamentId(weightCategory, ageCategory, gender, kupCategory, combatZone),
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
    res.status(201).send(newTournament);
  } catch (error) {
    res.status(500).send({ message: 'Error generating bracket', error: error.message });
  }
};

exports.getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id).populate('matches');
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
