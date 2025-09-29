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
      champion: null, // Will be set when tournament completes
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
    
    // Create match structure with proper ID mapping
    let matchCounter = 1;
    let roundMatchCounts = [];
    
    // Calculate matches per round (working backwards from final)
    for (let round = 1; round <= totalRounds; round++) {
      const participantsInRound = Math.ceil(participants.length / Math.pow(2, round - 1));
      const matchesInRound = Math.ceil(participantsInRound / 2);
      roundMatchCounts.push(matchesInRound);
    }

    // Generate all rounds with proper advancement mapping
    for (let roundNumber = 1; roundNumber <= totalRounds; roundNumber++) {
      const roundMatches = [];
      const matchesInThisRound = roundMatchCounts[roundNumber - 1];
      
      for (let matchIndex = 0; matchIndex < matchesInThisRound; matchIndex++) {
        const matchId = `R${roundNumber}M${matchIndex + 1}`;
        
        // Calculate which next round match this winner advances to
        let nextMatchId = null;
        let nextSlot = null;
        
        if (roundNumber < totalRounds) {
          const nextMatchIndex = Math.floor(matchIndex / 2);
          nextMatchId = `R${roundNumber + 1}M${nextMatchIndex + 1}`;
          nextSlot = matchIndex % 2 === 0 ? 'participant1' : 'participant2';
        }

        const match = {
          id: matchId,
          internalId: uuidv4(), // For database uniqueness
          round: roundNumber,
          matchNumber: matchIndex + 1,
          participant1: null,
          participant2: null,
          score1: null,
          score2: null,
          winner: null,
          status: 'pending',
          isBye: false,
          advancesTo: nextMatchId ? {
            matchId: nextMatchId,
            slot: nextSlot
          } : null
        };

        // For first round, assign actual participants
        if (roundNumber === 1) {
          const p1Index = matchIndex * 2;
          const p2Index = p1Index + 1;
          
          match.participant1 = participants[p1Index] || null;
          match.participant2 = participants[p2Index] || null;
          
          // Handle bye
          if (!match.participant2 && match.participant1) {
            match.isBye = true;
            match.winner = match.participant1;
            match.status = 'completed';
          }
        }

        roundMatches.push(match);
        matches.push(match);
      }

      rounds.push({
        round: roundNumber,
        name: this.getRoundName(roundNumber, totalRounds, participants.length),
        matches: roundMatches,
        participants: roundNumber === 1 ? participants : []
      });
    }

    // Create a match lookup map for easy access
    tournament.matchMap = new Map();
    matches.forEach(match => {
      tournament.matchMap.set(match.id, match);
    });

    tournament.matches = matches;
    tournament.rounds = rounds;
    tournament.updatedAt = new Date();
    this.tournaments.set(tournament.id, tournament);

    console.log('✅ Bracket generated with match advancement mapping:');
    matches.forEach(match => {
      if (match.advancesTo) {
        console.log(`  ${match.id} winner → ${match.advancesTo.matchId} (${match.advancesTo.slot})`);
      }
    });

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
    console.log('Finding match:', matchId, 'in tournament:', tournamentId);
    
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Find match - try both readable ID and internal ID
    let match = tournament.matches.find(m => m.id === matchId || m.internalId === matchId);

    if (!match) {
      console.log('Available matches:', tournament.matches.map(m => ({ id: m.id, internalId: m.internalId })));
      throw new Error(`Match not found: ${matchId}`);
    }

    console.log('Found match:', match.id, 'Status:', match.status);

    if (match.status === 'completed') {
      throw new Error('Match already completed');
    }

    // Validate winner
    if (!match.participant1 || !match.participant2) {
      throw new Error('Match does not have both participants assigned');
    }

    const validWinner = match.participant1.id === result.winner || match.participant2.id === result.winner;
    if (!validWinner) {
      throw new Error('Winner must be one of the match participants');
    }

    // Update match result
    match.score1 = result.score1;
    match.score2 = result.score2;
    match.winner = match.participant1.id === result.winner ? match.participant1 : match.participant2;
    match.status = 'completed';

    console.log('Match updated:', match.id, 'Winner:', match.winner.name);

    // For elimination tournaments, advance winner to next round
    if (tournament.format === 'single-elimination' || tournament.format === 'double-elimination') {
      this.advanceWinner(tournament, match);
    }

    tournament.updatedAt = new Date();
    this.tournaments.set(tournamentId, tournament);

    return tournament;
  }

  advanceWinner(tournament, completedMatch) {
    if (!completedMatch.advancesTo) {
      // This was the final match - tournament is complete!
      tournament.status = 'completed';
      tournament.champion = completedMatch.winner;
      console.log(`🏆 Tournament completed! Champion: ${completedMatch.winner.name}`);
      return;
    }

    // Use the predetermined advancement mapping
    const nextMatchId = completedMatch.advancesTo.matchId;
    const nextSlot = completedMatch.advancesTo.slot;
    
    // Find the next match using our match map
    const nextMatch = tournament.matchMap.get(nextMatchId);
    
    if (!nextMatch) {
      console.error(`❌ Next match ${nextMatchId} not found!`);
      return;
    }

    // Advance winner to the predetermined slot
    nextMatch[nextSlot] = completedMatch.winner;
    
    console.log(`✅ ${completedMatch.winner.name} advances from ${completedMatch.id} to ${nextMatchId} (${nextSlot})`);

    // Update the round's participants array
    const nextRound = tournament.rounds.find(r => r.round === completedMatch.round + 1);
    if (nextRound && !nextRound.participants.find(p => p.id === completedMatch.winner.id)) {
      nextRound.participants.push(completedMatch.winner);
    }

    // Check if the next match is ready to play
    if (nextMatch.participant1 && nextMatch.participant2) {
      console.log(`🎮 Match ${nextMatch.id} is ready: ${nextMatch.participant1.name} vs ${nextMatch.participant2.name}`);
    }

    // Check if current round is complete
    const currentRound = tournament.rounds.find(r => r.round === completedMatch.round);
    const currentRoundComplete = currentRound.matches.every(m => m.status === 'completed');
    if (currentRoundComplete) {
      console.log(`✅ Round ${currentRound.round} (${currentRound.name}) completed`);
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
    if (tournament.status === 'completed' && tournament.champion) {
      champion = tournament.champion;
    } else if (tournament.status === 'completed') {
      // Fallback: find champion from final match if not set
      const finalRound = tournament.rounds[tournament.rounds.length - 1];
      const finalMatch = finalRound?.matches.find(m => m.status === 'completed');
      champion = finalMatch?.winner;
      if (champion) {
        tournament.champion = champion; // Set for future use
      }
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
