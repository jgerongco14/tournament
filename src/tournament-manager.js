const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');

class TournamentManager {
  constructor() {
    this.tournaments = new Map();
  }

  createTournament(name, format, participants = [], settings = {}) {
    const id = uuidv4();
    const tournament = {
      id,
      name,
      format,
      participants: participants.map((p, index) => ({
        id: p.id || uuidv4(),
        name: p.name,
        seed: p.seed || index + 1,
        eliminated: false
      })),
      settings: {
        allowByes: true,
        seeding: 'random', // 'random', 'manual', 'none'
        ...settings
      },
      matches: [],
      rounds: [],
      status: 'pending', // 'pending', 'active', 'completed'
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tournaments.set(id, tournament);
    return tournament;
  }

  getTournament(id) {
    return this.tournaments.get(id);
  }

  getAllTournaments() {
    return Array.from(this.tournaments.values());
  }

  updateTournament(id, updates) {
    const tournament = this.tournaments.get(id);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    Object.assign(tournament, updates, { updatedAt: new Date() });
    this.tournaments.set(id, tournament);
    return tournament;
  }

  deleteTournament(id) {
    return this.tournaments.delete(id);
  }

  addParticipants(tournamentId, participants) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'pending') {
      throw new Error('Cannot add participants to active or completed tournament');
    }

    const newParticipants = participants.map((p, index) => ({
      id: p.id || uuidv4(),
      name: p.name,
      seed: p.seed || tournament.participants.length + index + 1,
      eliminated: false
    }));

    tournament.participants.push(...newParticipants);
    tournament.updatedAt = new Date();
    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  removeParticipant(tournamentId, participantId) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'pending') {
      throw new Error('Cannot remove participants from active or completed tournament');
    }

    tournament.participants = tournament.participants.filter(p => p.id !== participantId);
    tournament.updatedAt = new Date();
    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  generateBracket(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.participants.length < 2) {
      throw new Error('Need at least 2 participants to generate bracket');
    }

    tournament.status = 'active';
    tournament.matches = [];
    tournament.rounds = [];

    switch (tournament.format) {
      case 'single-elimination':
        return this.generateSingleEliminationBracket(tournament);
      case 'double-elimination':
        return this.generateDoubleEliminationBracket(tournament);
      case 'round-robin':
        return this.generateRoundRobinBracket(tournament);
      default:
        throw new Error(`Unsupported tournament format: ${tournament.format}`);
    }
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

  generateDoubleEliminationBracket(tournament) {
    // Simplified double elimination - would need more complex logic for full implementation
    const singleElim = this.generateSingleEliminationBracket(tournament);
    
    // Add losers bracket logic here
    // This is a simplified version - full double elimination is more complex
    
    return singleElim;
  }

  generateRoundRobinBracket(tournament) {
    const participants = [...tournament.participants];
    const matches = [];
    const rounds = [];

    // Generate all possible pairings
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const match = {
          id: uuidv4(),
          round: 1, // All matches in one round for round-robin
          participant1: participants[i],
          participant2: participants[j],
          score1: null,
          score2: null,
          winner: null,
          status: 'pending'
        };
        matches.push(match);
      }
    }

    tournament.matches = matches;
    tournament.rounds = [{
      round: 1,
      matches: matches,
      participants: participants
    }];
    tournament.status = 'active';
    tournament.updatedAt = new Date();
    this.tournaments.set(tournament.id, tournament);

    return tournament;
  }

  getMatches(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    return tournament.matches;
  }

  submitMatchResult(tournamentId, matchId, result) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status === 'completed') {
      throw new Error('Match already completed');
    }

    // Update match result
    match.score1 = result.score1;
    match.score2 = result.score2;
    match.winner = result.winner;
    match.status = 'completed';

    // For elimination tournaments, advance winner to next round
    if (tournament.format === 'single-elimination' || tournament.format === 'double-elimination') {
      this.advanceWinner(tournament, match);
    }

    tournament.updatedAt = new Date();
    this.tournaments.set(tournamentId, tournament);

    return tournament;
  }

  advanceWinner(tournament, completedMatch) {
    const currentRound = tournament.rounds.find(r => r.round === completedMatch.round);
    const nextRound = tournament.rounds.find(r => r.round === completedMatch.round + 1);

    if (nextRound) {
      // Find the next match for this winner
      const nextMatch = nextRound.matches.find(m => 
        m.participant1 === null || m.participant2 === null
      );

      if (nextMatch) {
        if (nextMatch.participant1 === null) {
          nextMatch.participant1 = completedMatch.winner;
        } else {
          nextMatch.participant2 = completedMatch.winner;
        }
      }
    }
  }

  getTournamentStatus(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const completedMatches = tournament.matches.filter(m => m.status === 'completed');
    const totalMatches = tournament.matches.length;
    const currentRound = tournament.rounds.find(r => 
      r.matches.some(m => m.status === 'pending')
    );

    let champion = null;
    if (tournament.status === 'completed') {
      const finalMatch = tournament.matches.find(m => m.round === Math.max(...tournament.rounds.map(r => r.round)));
      champion = finalMatch?.winner;
    }

    return {
      status: tournament.status,
      progress: totalMatches > 0 ? (completedMatches.length / totalMatches) * 100 : 0,
      completedMatches: completedMatches.length,
      totalMatches,
      currentRound: currentRound?.round || null,
      champion,
      standings: this.calculateStandings(tournament)
    };
  }

  calculateStandings(tournament) {
    if (tournament.format === 'round-robin') {
      return this.calculateRoundRobinStandings(tournament);
    } else {
      return this.calculateEliminationStandings(tournament);
    }
  }

  getTournamentStatistics(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const stats = {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        format: tournament.format,
        status: tournament.status,
        totalParticipants: tournament.participants.length,
        totalMatches: tournament.matches.length,
        completedMatches: tournament.matches.filter(m => m.status === 'completed').length
      },
      participants: this.calculateParticipantStatistics(tournament),
      standings: this.calculateStandings(tournament),
      rounds: tournament.rounds.map(round => ({
        round: round.round,
        name: round.name,
        totalMatches: round.matches.length,
        completedMatches: round.matches.filter(m => m.status === 'completed').length
      }))
    };

    return stats;
  }

  calculateParticipantStatistics(tournament) {
    const participantStats = new Map();

    // Initialize stats for all participants
    tournament.participants.forEach(participant => {
      participantStats.set(participant.id, {
        participant: participant,
        wins: 0,
        losses: 0,
        totalMatches: 0,
        totalScore: 0,
        totalScoreAgainst: 0,
        averageScore: 0,
        averageScoreAgainst: 0,
        winPercentage: 0,
        eliminated: false,
        eliminationRound: null
      });
    });

    // Calculate stats from matches
    tournament.matches.forEach(match => {
      if (match.status === 'completed' && match.participant1 && match.participant2) {
        const p1Stats = participantStats.get(match.participant1.id);
        const p2Stats = participantStats.get(match.participant2.id);

        if (p1Stats && p2Stats) {
          // Update match counts
          p1Stats.totalMatches++;
          p2Stats.totalMatches++;

          // Update scores
          p1Stats.totalScore += match.score1 || 0;
          p1Stats.totalScoreAgainst += match.score2 || 0;
          p2Stats.totalScore += match.score2 || 0;
          p2Stats.totalScoreAgainst += match.score1 || 0;

          // Update wins/losses
          if (match.winner && match.winner.id === match.participant1.id) {
            p1Stats.wins++;
            p2Stats.losses++;
            p2Stats.eliminated = true;
            p2Stats.eliminationRound = match.round;
          } else if (match.winner && match.winner.id === match.participant2.id) {
            p2Stats.wins++;
            p1Stats.losses++;
            p1Stats.eliminated = true;
            p1Stats.eliminationRound = match.round;
          }
        }
      }
    });

    // Calculate averages and percentages
    participantStats.forEach(stats => {
      if (stats.totalMatches > 0) {
        stats.averageScore = (stats.totalScore / stats.totalMatches).toFixed(2);
        stats.averageScoreAgainst = (stats.totalScoreAgainst / stats.totalMatches).toFixed(2);
        stats.winPercentage = ((stats.wins / stats.totalMatches) * 100).toFixed(1);
      }
    });

    return Array.from(participantStats.values()).sort((a, b) => {
      // Sort by wins first, then by win percentage, then by average score
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
      return b.averageScore - a.averageScore;
    });
  }

  calculateRoundRobinStandings(tournament) {
    const standings = tournament.participants.map(p => ({
      participant: p,
      wins: 0,
      losses: 0,
      points: 0
    }));

    tournament.matches.forEach(match => {
      if (match.status === 'completed') {
        const winner = match.winner;
        const loser = match.participant1 === winner ? match.participant2 : match.participant1;
        
        const winnerStanding = standings.find(s => s.participant.id === winner.id);
        const loserStanding = standings.find(s => s.participant.id === loser.id);
        
        if (winnerStanding) winnerStanding.wins++;
        if (loserStanding) loserStanding.losses++;
      }
    });

    return standings.sort((a, b) => b.wins - a.wins);
  }

  calculateEliminationStandings(tournament) {
    // For elimination tournaments, return participants in order of elimination
    const eliminated = tournament.participants.filter(p => p.eliminated);
    const stillActive = tournament.participants.filter(p => !p.eliminated);
    
    return [...stillActive, ...eliminated];
  }
}

module.exports = TournamentManager;
