const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');

class TournamentManager {
  constructor() {
    this.tournaments = new Map();
  }

  generateSingleEliminationBracket(tournament) {
    const participants = [...tournament.participants];
    
    // Apply seeding
    if (tournament.settings.seeding === 'random') {
      participants.sort(() => Math.random() - 0.5);
    } else if (tournament.settings.seeding === 'manual') {
      participants.sort((a, b) => a.seed - b.seed);
    }

    const matches = [];
    const rounds = [];
    
    // Calculate total rounds needed
    const totalRounds = Math.ceil(Math.log2(participants.length));
    
    // Generate all rounds upfront
    let currentParticipants = participants;
    
    for (let roundNumber = 1; roundNumber <= totalRounds; roundNumber++) {
      const roundMatches = [];
      
      // Create matches for this round
      for (let i = 0; i < currentParticipants.length; i += 2) {
        const match = {
          id: uuidv4(),
          round: roundNumber,
          participant1: currentParticipants[i],
          participant2: currentParticipants[i + 1] || null, // Bye if odd number
          score1: null,
          score2: null,
          winner: null,
          status: 'pending',
          isBye: !currentParticipants[i + 1]
        };

        if (match.isBye) {
          match.winner = match.participant1;
          match.status = 'completed';
        }

        roundMatches.push(match);
      }

      matches.push(...roundMatches);
      rounds.push({
        round: roundNumber,
        name: this.getRoundName(roundNumber, totalRounds, participants.length),
        matches: roundMatches,
        participants: currentParticipants
      });

      // Calculate participants for next round (half of current)
      currentParticipants = currentParticipants.slice(0, Math.ceil(currentParticipants.length / 2));
    }

    tournament.matches = matches;
    tournament.rounds = rounds;
    tournament.updatedAt = new Date();
    this.tournaments.set(tournament.id, tournament);

    return tournament;
  }

  getRoundName(roundNumber, totalRounds, totalParticipants) {
    // Calculate how many participants are in this round
    const participantsInRound = Math.ceil(totalParticipants / Math.pow(2, roundNumber - 1));
    
    if (roundNumber === totalRounds) {
      return 'Final';
    } else if (roundNumber === totalRounds - 1) {
      return 'Semi-Final';
    } else if (roundNumber === totalRounds - 2) {
      return 'Quarter-Final';
    } else if (participantsInRound === 16) {
      return 'Round of 16';
    } else if (participantsInRound === 32) {
      return 'Round of 32';
    } else if (participantsInRound === 64) {
      return 'Round of 64';
    } else {
      return `Round ${roundNumber} (${participantsInRound} players)`;
    }
  }
}

module.exports = TournamentManager;
