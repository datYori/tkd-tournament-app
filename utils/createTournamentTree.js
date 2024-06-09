// Function to shuffle participants
function shuffleParticipants(participants) {
  for (let i = participants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }
  return participants;
}

// Function to create the tournament tree
const createTournamentTree = (participants, weightCategory, ageCategory, gender, kupCategory, combatZone) => {
  // Shuffle participants
  participants = shuffleParticipants(participants);

  if (participants.length < 2) {
    const matches = [{
      homeTeamName: participants[0] ? participants[0].name : 'TBD',
      awayTeamName: 'TBD',
      round: 1,
      matchNumber: combatZone * 1000 + 1,
      matchComplete: false,
      matchAccepted: false,
      homeTeamScore: 0,
      awayTeamScore: 0,
      dummyMatch: !participants[0] // If there's no participant, it's a dummy match
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
  let matchNumber = combatZone * 1000 + 1;
  let currentRound = 1;

  while (paddedParticipants.length > 1) {
    const roundMatches = [];
    for (let i = 0; i < paddedParticipants.length; i += 2) {
      if (i + 1 < paddedParticipants.length) {
        const isDummyMatch = paddedParticipants[i].name === 'TBD' || paddedParticipants[i + 1].name === 'TBD';
        roundMatches.push({
          homeTeamName: paddedParticipants[i].name,
          awayTeamName: paddedParticipants[i + 1].name,
          round: currentRound,
          matchNumber: matchNumber++,
          matchComplete: false,
          matchAccepted: false,
          homeTeamScore: 0,
          awayTeamScore: 0,
          dummyMatch: isDummyMatch
        });
      }
    }
    matches.push(...roundMatches);
    currentRound++;
    paddedParticipants = roundMatches.map(match => ({ name: `Winner of Match ${match.matchNumber}` }));
  }

  return { matches };
};

module.exports = { createTournamentTree, shuffleParticipants };
