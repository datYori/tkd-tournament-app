const Participant = require('../models/Participant');

exports.getAllParticipants = async (req, res) => {
  try {
    const participants = await Participant.find();
    res.status(200).send(participants);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching participants', error });
  }
};

exports.addParticipant = async (req, res) => {
  const participant = new Participant(req.body);
  await participant.save();
  res.status(201).send(participant);
};

exports.addMultipleParticipants = async (req, res) => {
  try {
    const validParticipants = req.body.filter(participant => {
      return participant.Name && participant["Age Category"] && participant["Weight Category"] && participant.Gender && participant["Kup Category"] && participant.Team;
    });

    if (validParticipants.length === 0) {
      return res.status(400).send({ message: 'No valid participants to add.' });
    }

    // Map the fields to match schema
    const mappedParticipants = validParticipants.map(participant => ({
      name: participant.Name,
      ageCategory: participant["Age Category"],
      weightCategory: participant["Weight Category"],
      gender: participant.Gender,
      kupCategory: participant["Kup Category"],
      team: participant.Team,
    }));

    const participants = await Participant.insertMany(mappedParticipants);
    res.status(201).send(participants);
  } catch (error) {
    res.status(500).send({ message: 'Error adding participants', error });
  }
};

exports.deleteParticipant = async (req, res) => {
  try {
    const result = await Participant.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).send({ message: 'Participant not found' });
    }
    res.status(200).send({ message: 'Participant deleted successfully' });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.updateParticipant = async (req, res) => {
  const { id } = req.params;
  const { name, weightCategory, ageCategory, kupCategory, gender, team } = req.body;

  try {
    const participant = await Participant.findByIdAndUpdate(
      id,
      { name, weightCategory, ageCategory, kupCategory, gender, team },
      { new: true }
    );
    if (!participant) {
      return res.status(404).send({ message: 'Participant not found' });
    }
    res.status(200).send(participant);
  } catch (error) {
    res.status(500).send({ message: 'Error updating participant', error });
  }
};
