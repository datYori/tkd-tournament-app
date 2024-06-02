const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  name: String,
  weightCategory: String,
  ageCategory: String,
  kupCategory: String,
  gender: String,
});

module.exports = mongoose.model('Participant', ParticipantSchema);
