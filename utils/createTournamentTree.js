// Function to shuffle participants
function shuffleParticipants(participants) {
  for (let i = participants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }
  return participants;
}

const createTournamentTree = (participants, weightCategory, ageCategory, gender, kupCategory, combatZone) => {
  const ageGenderCodes = {
    "Poussins Female": 1,
    "Poussins Male": 2,
    "Benjamins Female": 3,
    "Benjamins Male": 4,
    "Minimes Female": 5,
    "Minimes Male": 6,
    "Cadets Female": 7,
    "Cadets Male": 8,
    "Juniors Female": 9,
    "Juniors Male": 10,
    "Seniors Female": 11,
    "Seniors Male": 12
  };

  const getCategoryCode = (ageCategory, gender) => {
    const key = `${ageCategory} ${gender}`;
    return ageGenderCodes[key] || 0; // Default to 0 for unknown categories
  };

  const getNextMatchId = (combatZone, round, ageCategory, gender, sequence) => {
    const categoryCode = getCategoryCode(ageCategory, gender);
    return categoryCode * 1000000 + combatZone * 100000 + round * 10000 + sequence;
  };

  participants = shuffleParticipants(participants);

  if (participants.length < 2) {
    const matches = [{
      homeTeamName: participants[0] ? participants[0].name : 'TBD',
      awayTeamName: 'TBD',
      round: 1,
      matchNumber: getNextMatchId(combatZone, 1, ageCategory, gender, 1),
      matchComplete: false,
      matchAccepted: false,
      homeTeamScore: 0,
      awayTeamScore: 0,
      dummyMatch: !participants[0]
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
  let sequence = 1;
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
          matchNumber: getNextMatchId(combatZone, currentRound, ageCategory, gender, sequence++),
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
