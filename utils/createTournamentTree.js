function createTournamentTree(participants, weightCategory, ageCategory, gender, kupCategory, combatZone) {
  if (participants.length < 2) {
    const matches = [{
      id: combatZone * 1000 + 1,
      participant: participants[0] ? participants[0].name : 'TBD',
      opponent: 'TBD',
      nextMatch: null,
      round: 1,
      result: {
        winner: participants[0] ? participants[0].name : 'TBD'
      }
    }];
    return { matches };
  }

  const rounds = Math.ceil(Math.log2(participants.length));
  const totalMatches = 2 ** rounds - 1;
  const totalParticipants = 2 ** rounds;

  let paddedParticipants = [...participants];
  while (paddedParticipants.length < totalParticipants) {
    paddedParticipants.push({ name: 'TBD' });
  }

  const matches = [];
  let matchId = combatZone * 1000 + 1;
  let currentRound = 1;

  while (paddedParticipants.length > 1) {
    const roundMatches = [];
    for (let i = 0; i < paddedParticipants.length; i += 2) {
      if (i + 1 < paddedParticipants.length) {
        roundMatches.push({
          id: matchId++,
          participant: paddedParticipants[i].name,
          opponent: paddedParticipants[i + 1].name,
          nextMatch: Math.floor(matchId / 2),
          round: currentRound,
          result: {}
        });
      }
    }
    matches.push(...roundMatches);
    currentRound++;
    paddedParticipants = roundMatches.map(match => ({ name: `Winner of Match ${match.id}` }));
  }

  return { matches };
}

module.exports = { createTournamentTree };
