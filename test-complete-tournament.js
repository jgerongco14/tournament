const fetch = require('node-fetch');

async function testCompleteTournament() {
    try {
        console.log('🏆 Testing Complete Tournament Workflow\n');

        // Step 1: Create tournament
        console.log('1. Creating tournament...');
        const createResponse = await fetch('http://localhost:3000/api/tournaments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Champion Test Tournament',
                format: 'single-elimination',
                participants: [
                    { name: 'Alice', seed: 1 },
                    { name: 'Bob', seed: 2 },
                    { name: 'Charlie', seed: 3 },
                    { name: 'Dave', seed: 4 }
                ],
                settings: { seeding: 'manual' }
            })
        });
        
        const tournament = await createResponse.json();
        if (!tournament.success) {
            throw new Error('Failed to create tournament: ' + tournament.error);
        }
        
        const tournamentId = tournament.data.id;
        console.log('✅ Tournament created:', tournament.data.name);

        // Step 2: Generate bracket
        console.log('2. Generating bracket...');
        const bracketResponse = await fetch(`http://localhost:3000/api/tournaments/${tournamentId}/bracket`, {
            method: 'POST'
        });
        
        const bracket = await bracketResponse.json();
        if (!bracket.success) {
            throw new Error('Failed to generate bracket: ' + bracket.error);
        }
        
        console.log('✅ Bracket generated with', bracket.data.rounds.length, 'rounds');
        
        // Display initial bracket
        bracket.data.rounds.forEach(round => {
            console.log(`\n${round.name}:`);
            round.matches.forEach(match => {
                console.log(`  ${match.participant1?.name || 'TBD'} vs ${match.participant2?.name || 'TBD'} [${match.status}]`);
            });
        });

        // Step 3: Play all matches
        console.log('\n3. Playing matches...');
        
        // Get current matches
        let currentBracket = await (await fetch(`http://localhost:3000/api/tournaments/${tournamentId}/bracket`)).json();
        let round = 1;
        
        while (currentBracket.data.tournament.status !== 'completed') {
            const currentRound = currentBracket.data.rounds.find(r => r.round === round);
            if (!currentRound) break;
            
            console.log(`\nRound ${round} (${currentRound.name}):`);
            
            for (const match of currentRound.matches) {
                if (match.status === 'pending' && match.participant1 && match.participant2) {
                    // Simulate match result (higher seed wins for predictability)
                    const score1 = Math.floor(Math.random() * 10) + 10;
                    const score2 = Math.floor(Math.random() * 10) + 10;
                    const winner = match.participant1.seed < match.participant2.seed ? 
                                 match.participant1 : match.participant2;
                    
                    console.log(`  Playing: ${match.participant1.name} vs ${match.participant2.name}`);
                    
                    const resultResponse = await fetch(`http://localhost:3000/api/tournaments/${tournamentId}/matches/${match.id}/result`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            score1: winner === match.participant1 ? score1 : score2,
                            score2: winner === match.participant1 ? score2 : score1,
                            winner: winner.id
                        })
                    });
                    
                    const result = await resultResponse.json();
                    if (result.success) {
                        console.log(`    Result: ${winner.name} wins (${winner === match.participant1 ? score1 : score2}-${winner === match.participant1 ? score2 : score1})`);
                    } else {
                        console.log('    ❌ Failed to submit result:', result.error);
                    }
                }
            }
            
            // Get updated bracket
            currentBracket = await (await fetch(`http://localhost:3000/api/tournaments/${tournamentId}/bracket`)).json();
            round++;
        }

        // Step 4: Check final result
        console.log('\n4. Tournament Results:');
        const finalBracket = await (await fetch(`http://localhost:3000/api/tournaments/${tournamentId}/bracket`)).json();
        
        if (finalBracket.data.tournament.status === 'completed') {
            console.log('✅ Tournament completed!');
            if (finalBracket.data.tournament.champion) {
                console.log('🏆 CHAMPION:', finalBracket.data.tournament.champion.name);
                console.log('👑 Seed:', finalBracket.data.tournament.champion.seed);
            } else {
                console.log('⚠️  Champion not set');
            }
        } else {
            console.log('❌ Tournament not completed');
        }

        // Step 5: Display final bracket
        console.log('\nFinal Bracket:');
        finalBracket.data.rounds.forEach(round => {
            console.log(`\n${round.name}:`);
            round.matches.forEach(match => {
                const p1 = match.participant1?.name || 'TBD';
                const p2 = match.participant2?.name || 'TBD';
                const scores = match.score1 !== null ? ` (${match.score1}-${match.score2})` : '';
                const winner = match.winner ? ` → ${finalBracket.data.participants.find(p => p.id === match.winner)?.name || 'Unknown'}` : '';
                console.log(`  ${p1} vs ${p2}${scores}${winner}`);
            });
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testCompleteTournament();