const TournamentManager = require('./src/tournament-manager-fixed.js');

const tm = new TournamentManager();

const tournament = {
  id: 'test',
  participants: [
    { id: '1', name: 'Player 1', seed: 1 },
    { id: '2', name: 'Player 2', seed: 2 },
    { id: '3', name: 'Player 3', seed: 3 },
    { id: '4', name: 'Player 4', seed: 4 },
    { id: '5', name: 'Player 5', seed: 5 },
    { id: '6', name: 'Player 6', seed: 6 },
    { id: '7', name: 'Player 7', seed: 7 },
    { id: '8', name: 'Player 8', seed: 8 }
  ],
  settings: { seeding: 'manual' }
};

const result = tm.generateSingleEliminationBracket(tournament);
console.log('Rounds:', result.rounds.length);
result.rounds.forEach(round => {
  console.log(`Round ${round.round}: ${round.name} - ${round.matches.length} matches`);
});
