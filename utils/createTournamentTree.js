const createTournamentTree = (participants, matchIdSeed) => {
  const shuffleParticipants = (participants) => {
    for (let i = participants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [participants[i], participants[j]] = [participants[j], participants[i]];
    }
    return participants;
  };

  participants = shuffleParticipants(participants);

  const roundsData = [];
  const rounds = Math.ceil(Math.log2(participants.length));
  const totalParticipants = 2 ** rounds;

  let paddedParticipants = [...participants];
  while (paddedParticipants.length < totalParticipants) {
    paddedParticipants.push({ name: '' }); // Fill with empty strings
  }

  for (let round = 1; round <= rounds; round++) {
    let matchNumber = 1;
    const seeds = [];
    for (let i = 0; i < paddedParticipants.length; i += 2) {
      const matchId = `${matchIdSeed}${round}${String(matchNumber++).padStart(2, '0')}`;
      seeds.push({
        id: matchId,
        date: ' ',
        teams: [
          { name: paddedParticipants[i].name },
          { name: paddedParticipants[i + 1].name }
        ],
      });
    }
    roundsData.push({
      title: `Round ${round}`,
      seeds: seeds,
    });
    paddedParticipants = paddedParticipants.slice(0, paddedParticipants.length / 2).map(() => ({ name: '' }));
  }

  return roundsData;
};

module.exports = { createTournamentTree };
