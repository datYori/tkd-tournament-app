const mongoose = require('mongoose');
const Match = require('./Match');

const TournamentSchema = new mongoose.Schema({
  _id: String, // Use a string ID instead of the default ObjectId
  weightCategory: String,
  ageCategory: String,
  gender: String,
  kupCategory: String,
  matches: [Match.schema],
  startDate: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' },
  combatZone: Number,
  currentState: {
    previousMatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
    nextMatchId: Number,
    status: String // 'Pending', 'Ongoing', 'Completed'
  }
});

module.exports = mongoose.model('Tournament', TournamentSchema);
