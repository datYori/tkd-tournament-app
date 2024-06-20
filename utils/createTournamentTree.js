const createTournamentTree = (participants, weightCategory, ageCategory, gender, kupCategory, combatZone) => {
  const shuffleParticipants = (participants) => {
    for (let i = participants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [participants[i], participants[j]] = [participants[j], participants[i]];
    }
    return participants;
  };

  participants = shuffleParticipants(participants);

  const matches = [];

  for (let i = 0; i < participants.length; i += 2) {
    matches.push({
      homeTeamName: participants[i] ? participants[i].name : 'TBD',
      awayTeamName: participants[i + 1] ? participants[i + 1].name : 'TBD',
      round: 1,
      matchNumber: (i / 2) + 1,
      matchComplete: false,
      homeTeamScore: 0,
      awayTeamScore: 0,
      dummyMatch: participants[i] ? !participants[i + 1] : true,
    });
  }

  return { matches };
};

module.exports = { createTournamentTree };
