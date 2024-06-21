const mongoose = require('mongoose');

const TournamentSchema = new mongoose.Schema({
  _id: String,
  weightCategory: String,
  ageCategory: String,
  gender: String,
  kupCategory: String,
  rounds: [
    {
      title: String,
      seeds: [
        {
          id: Number,
          date: String,
          teams: [
            { name: String },
            { name: String },
          ],
        },
      ],
    },
  ],
  combatZone: String,
  currentState: {
    previousMatches: Array,
    nextMatchId: Number,
    status: String,
  },
  startDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Tournament', TournamentSchema);
