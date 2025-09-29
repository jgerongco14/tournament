class BracketRenderer {
  generateBracket(tournament) {
    const bracket = {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        format: tournament.format,
        status: tournament.status
      },
      rounds: [],
      participants: tournament.participants,
      matches: tournament.matches
    };

    switch (tournament.format) {
      case 'single-elimination':
        return this.renderSingleEliminationBracket(tournament, bracket);
      case 'double-elimination':
        return this.renderDoubleEliminationBracket(tournament, bracket);
      case 'round-robin':
        return this.renderRoundRobinBracket(tournament, bracket);
      default:
        throw new Error(`Unsupported tournament format: ${tournament.format}`);
    }
  }

  renderSingleEliminationBracket(tournament, bracket) {
    const rounds = [];
    
    // Group matches by round
    const matchesByRound = {};
    tournament.matches.forEach(match => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = [];
      }
      matchesByRound[match.round].push(match);
    });

    // Create round data for visualization
    Object.keys(matchesByRound).forEach(roundNumber => {
      const round = {
        round: parseInt(roundNumber),
        name: this.getRoundName(parseInt(roundNumber), Object.keys(matchesByRound).length, tournament.participants.length),
        matches: matchesByRound[roundNumber].map(match => ({
          id: match.id,
          participant1: {
            id: match.participant1?.id,
            name: match.participant1?.name || 'TBD',
            seed: match.participant1?.seed
          },
          participant2: {
            id: match.participant2?.id,
            name: match.participant2?.name || 'TBD',
            seed: match.participant2?.seed
          },
          score1: match.score1,
          score2: match.score2,
          winner: match.winner?.id,
          status: match.status,
          isBye: match.isBye
        }))
      };
      rounds.push(round);
    });

    bracket.rounds = rounds.sort((a, b) => a.round - b.round);
    return bracket;
  }

  renderDoubleEliminationBracket(tournament, bracket) {
    // Simplified double elimination rendering
    // In a full implementation, this would handle winners and losers brackets
    return this.renderSingleEliminationBracket(tournament, bracket);
  }

  renderRoundRobinBracket(tournament, bracket) {
    const round = {
      round: 1,
      name: 'Round Robin',
      matches: tournament.matches.map(match => ({
        id: match.id,
        participant1: {
          id: match.participant1?.id,
          name: match.participant1?.name,
          seed: match.participant1?.seed
        },
        participant2: {
          id: match.participant2?.id,
          name: match.participant2?.name,
          seed: match.participant2?.seed
        },
        score1: match.score1,
        score2: match.score2,
        winner: match.winner?.id,
        status: match.status
      }))
    };

    bracket.rounds = [round];
    return bracket;
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

  // Generate bracket visualization data for frontend
  generateVisualizationData(tournament) {
    const bracket = this.generateBracket(tournament);
    
    return {
      ...bracket,
      visualization: {
        layout: this.getLayoutForFormat(tournament.format),
        positions: this.calculatePositions(bracket.rounds),
        connections: this.calculateConnections(bracket.rounds)
      }
    };
  }

  getLayoutForFormat(format) {
    const layouts = {
      'single-elimination': 'tree',
      'double-elimination': 'double-tree',
      'round-robin': 'grid'
    };
    return layouts[format] || 'tree';
  }

  calculatePositions(rounds) {
    const positions = {};
    
    rounds.forEach(round => {
      round.matches.forEach((match, index) => {
        const matchId = match.id;
        positions[matchId] = {
          x: round.round * 200,
          y: index * 100,
          width: 150,
          height: 80
        };
      });
    });
    
    return positions;
  }

  calculateConnections(rounds) {
    const connections = [];
    
    for (let i = 0; i < rounds.length - 1; i++) {
      const currentRound = rounds[i];
      const nextRound = rounds[i + 1];
      
      currentRound.matches.forEach(match => {
        const nextMatch = nextRound.matches.find(m => 
          m.participant1?.id === match.winner || m.participant2?.id === match.winner
        );
        
        if (nextMatch) {
          connections.push({
            from: match.id,
            to: nextMatch.id,
            winner: match.winner
          });
        }
      });
    }
    
    return connections;
  }
}

module.exports = BracketRenderer;
