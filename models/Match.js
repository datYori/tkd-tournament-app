const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  homeTeamName: String,
  awayTeamName: String,
  round: Number,
  matchNumber: Number,
  matchComplete: { type: Boolean, default: false },
  matchAccepted: { type: Boolean, default: false },
  homeTeamScore: { type: Number, default: 0 },
  awayTeamScore: { type: Number, default: 0 },
  dummyMatch: { type: Boolean, default: false },
});

module.exports = mongoose.model('Match', MatchSchema);
