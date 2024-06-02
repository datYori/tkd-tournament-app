const mongoose = require('mongoose');

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

module.exports = mongoose.model('Match', MatchSchema);
