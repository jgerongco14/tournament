const fetch = require('node-fetch');

async function createTestTournament() {
    try {
        const response = await fetch('http://localhost:3000/api/tournaments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Complete Tournament Test',
                format: 'single-elimination',
                participants: [
                    { name: 'Player 1', seed: 1 },
                    { name: 'Player 2', seed: 2 },
                    { name: 'Player 3', seed: 3 },
                    { name: 'Player 4', seed: 4 },
                    { name: 'Player 5', seed: 5 },
                    { name: 'Player 6', seed: 6 },
                    { name: 'Player 7', seed: 7 },
                    { name: 'Player 8', seed: 8 }
                ],
                settings: { seeding: 'manual' }
            })
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('✅ Tournament created:', result.data.name);
            console.log('Tournament ID:', result.data.id);
            console.log('Participants:', result.data.participants.length);
            
            // Generate bracket
            const bracketResponse = await fetch(`http://localhost:3000/api/tournaments/${result.data.id}/bracket`, {
                method: 'POST'
            });
            
            const bracketResult = await bracketResponse.json();
            if (bracketResult.success) {
                console.log('✅ Bracket generated with', bracketResult.data.rounds.length, 'rounds');
                bracketResult.data.rounds.forEach(round => {
                    console.log(`- ${round.name}: ${round.matches.length} matches`);
                });
            } else {
                console.error('❌ Bracket generation failed:', bracketResult.error);
            }
        } else {
            console.error('❌ Tournament creation failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createTestTournament();
