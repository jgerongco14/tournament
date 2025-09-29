const fetch = require('node-fetch');

// Example: Create a sample tournament
async function createSampleTournament() {
    try {
        const response = await fetch('http://localhost:3000/api/tournaments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Championship 2024',
                format: 'single-elimination',
                participants: [
                    { name: 'Team Alpha', seed: 1 },
                    { name: 'Team Beta', seed: 2 },
                    { name: 'Team Gamma', seed: 3 },
                    { name: 'Team Delta', seed: 4 },
                    { name: 'Team Echo', seed: 5 },
                    { name: 'Team Foxtrot', seed: 6 },
                    { name: 'Team Golf', seed: 7 },
                    { name: 'Team Hotel', seed: 8 }
                ],
                settings: {
                    seeding: 'manual',
                    allowByes: true
                }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Tournament created successfully!');
            console.log('Tournament ID:', result.data.id);
            console.log('Tournament Name:', result.data.name);
            console.log('Participants:', result.data.participants.length);
            console.log('Format:', result.data.format);
            
            return result.data;
        } else {
            console.error('❌ Error creating tournament:', result.error);
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

// Example: Get tournament bracket
async function getTournamentBracket(tournamentId) {
    try {
        const response = await fetch(`http://localhost:3000/api/tournaments/${tournamentId}/bracket`);
        const result = await response.json();
        
        if (result.success) {
            console.log('\n🏆 Tournament Bracket:');
            console.log('Tournament:', result.data.tournament.name);
            console.log('Format:', result.data.tournament.format);
            console.log('Rounds:', result.data.rounds.length);
            
            result.data.rounds.forEach(round => {
                console.log(`\n📋 ${round.name}:`);
                round.matches.forEach(match => {
                    const p1 = match.participant1?.name || 'TBD';
                    const p2 = match.participant2?.name || 'TBD';
                    const status = match.status;
                    console.log(`  ${p1} vs ${p2} (${status})`);
                });
            });
            
            return result.data;
        } else {
            console.error('❌ Error getting bracket:', result.error);
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

// Example: Submit a match result
async function submitMatchResult(tournamentId, matchId, score1, score2) {
    try {
        // First get the match to determine winner
        const bracketResponse = await fetch(`http://localhost:3000/api/tournaments/${tournamentId}/bracket`);
        const bracketResult = await bracketResponse.json();
        
        if (!bracketResult.success) {
            console.error('❌ Error getting bracket for match details');
            return;
        }
        
        const match = bracketResult.data.matches.find(m => m.id === matchId);
        if (!match) {
            console.error('❌ Match not found');
            return;
        }
        
        const winner = score1 > score2 ? match.participant1 : match.participant2;
        
        const response = await fetch(`http://localhost:3000/api/tournaments/${tournamentId}/matches/${matchId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                score1,
                score2,
                winner: winner.id
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ Match result submitted: ${match.participant1.name} ${score1} - ${score2} ${match.participant2.name}`);
            console.log(`Winner: ${winner.name}`);
        } else {
            console.error('❌ Error submitting result:', result.error);
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

// Run the examples
async function runExamples() {
    console.log('🚀 Tournament System Examples\n');
    
    // Create tournament
    const tournament = await createSampleTournament();
    if (!tournament) return;
    
    // Get bracket
    const bracket = await getTournamentBracket(tournament.id);
    if (!bracket) return;
    
    // Submit some match results (example)
    console.log('\n🎮 Simulating match results...');
    
    // Find first round matches
    const firstRound = bracket.rounds[0];
    if (firstRound && firstRound.matches.length > 0) {
        const firstMatch = firstRound.matches[0];
        if (firstMatch.participant1 && firstMatch.participant2) {
            await submitMatchResult(tournament.id, firstMatch.id, 21, 18);
        }
    }
    
    console.log('\n✅ Examples completed!');
    console.log('🌐 Open http://localhost:3000 in your browser to see the web interface');
}

// Only run if this file is executed directly
if (require.main === module) {
    runExamples().catch(console.error);
}

module.exports = {
    createSampleTournament,
    getTournamentBracket,
    submitMatchResult
};
