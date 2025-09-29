class TournamentApp {
    constructor() {
        this.currentTournament = null;
        this.tournaments = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTournaments();
        this.setupTabNavigation();
    }

    setupEventListeners() {
        // Tournament form
        document.getElementById('tournament-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTournament();
        });

        // Add participant button
        document.getElementById('add-participant').addEventListener('click', () => {
            this.addParticipantInput();
        });

        // Remove participant buttons (delegated)
        document.getElementById('participants-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-participant')) {
                e.target.closest('.participant-input').remove();
            }
        });

        // Input method tabs
        document.querySelectorAll('.input-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchInputMethod(tab.getAttribute('data-method'));
            });
        });

        // Bulk input parsing
        document.getElementById('parse-bulk-input').addEventListener('click', () => {
            this.parseBulkInput();
        });

        // CSV file selection
        document.getElementById('select-csv-file').addEventListener('click', () => {
            document.getElementById('csv-file').click();
        });

        document.getElementById('csv-file').addEventListener('change', (e) => {
            this.handleCSVFileSelect(e);
        });

        document.getElementById('parse-csv').addEventListener('click', () => {
            this.parseCSVFile();
        });

        // Quick generate
        document.getElementById('generate-participants').addEventListener('click', () => {
            this.generateParticipants();
        });

        // Clear participants
        document.getElementById('clear-participants').addEventListener('click', () => {
            this.clearAllParticipants();
        });

        // Remove participant from preview (delegated)
        document.getElementById('participants-preview-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove')) {
                this.removeParticipantFromPreview(e.target.dataset.id);
            }
        });

        // Load bracket button
        document.getElementById('load-bracket').addEventListener('click', () => {
            this.loadBracket();
        });

        // Load statistics button
        document.getElementById('load-statistics').addEventListener('click', () => {
            this.loadStatistics();
        });

        // Match result form
        document.getElementById('match-result-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitMatchResult();
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('match-modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }

    async createTournament() {
        const name = document.getElementById('tournament-name').value;
        const format = document.getElementById('tournament-format').value;
        const seeding = document.getElementById('seeding').value;

        const participants = [];
        document.querySelectorAll('.participant-input').forEach(input => {
            const nameInput = input.querySelector('.participant-name');
            const seedInput = input.querySelector('.participant-seed');
            
            if (nameInput.value.trim()) {
                participants.push({
                    name: nameInput.value.trim(),
                    seed: seedInput.value ? parseInt(seedInput.value) : null
                });
            }
        });

        if (participants.length < 2) {
            alert('Please add at least 2 participants');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/tournaments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    format,
                    participants,
                    settings: {
                        seeding
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Tournament created successfully!');
                this.resetForm();
                this.loadTournaments();
                // Switch to manage tab
                document.querySelector('[data-tab="manage"]').click();
            } else {
                alert('Error creating tournament: ' + result.error);
            }
        } catch (error) {
            alert('Error creating tournament: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async loadTournaments() {
        try {
            const response = await fetch('/api/tournaments');
            const result = await response.json();

            if (result.success) {
                this.tournaments = result.data;
                this.renderTournaments();
                this.updateBracketTournamentSelect();
            }
        } catch (error) {
            console.error('Error loading tournaments:', error);
        }
    }

    renderTournaments() {
        const container = document.getElementById('tournaments-list');
        
        if (this.tournaments.length === 0) {
            container.innerHTML = '<p class="text-center">No tournaments found. Create your first tournament!</p>';
            return;
        }

        container.innerHTML = this.tournaments.map(tournament => `
            <div class="tournament-card">
                <h3>${tournament.name}</h3>
                <div class="format">${tournament.format.replace('-', ' ')}</div>
                <div class="status ${tournament.status}">${tournament.status}</div>
                <div class="participants-count">${tournament.participants.length} participants</div>
                <div class="tournament-actions">
                    <button onclick="app.viewTournament('${tournament.id}')" class="btn-primary">View</button>
                    ${tournament.status === 'pending' ? 
                        `<button onclick="app.startTournament('${tournament.id}')" class="btn-secondary">Start Tournament</button>` : 
                        `<button onclick="app.viewBracket('${tournament.id}')" class="btn-secondary">View Bracket</button>`
                    }
                    <button onclick="app.deleteTournament('${tournament.id}')" class="btn-secondary" style="background: #dc3545; color: white;">Delete</button>
                </div>
            </div>
        `).join('');
    }

    updateBracketTournamentSelect() {
        const select = document.getElementById('bracket-tournament-select');
        select.innerHTML = '<option value="">Select a tournament</option>';
        
        this.tournaments.forEach(tournament => {
            const option = document.createElement('option');
            option.value = tournament.id;
            option.textContent = tournament.name;
            select.appendChild(option);
        });

        // Also update statistics select
        const statsSelect = document.getElementById('stats-tournament-select');
        statsSelect.innerHTML = '<option value="">Select a tournament</option>';
        
        this.tournaments.forEach(tournament => {
            const option = document.createElement('option');
            option.value = tournament.id;
            option.textContent = tournament.name;
            statsSelect.appendChild(option);
        });
    }

    async startTournament(tournamentId) {
        this.showLoading(true);

        try {
            // First generate the bracket
            const bracketResponse = await fetch(`/api/tournaments/${tournamentId}/bracket`, {
                method: 'POST'
            });

            const bracketResult = await bracketResponse.json();

            if (!bracketResult.success) {
                alert('Error generating bracket: ' + bracketResult.error);
                return;
            }

            // Then update tournament status to active
            const response = await fetch(`/api/tournaments/${tournamentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'active'
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Tournament started and bracket generated!');
                this.loadTournaments();
            } else {
                alert('Error starting tournament: ' + result.error);
            }
        } catch (error) {
            alert('Error starting tournament: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async loadBracket() {
        const tournamentId = document.getElementById('bracket-tournament-select').value;
        
        if (!tournamentId) {
            alert('Please select a tournament');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`/api/tournaments/${tournamentId}/bracket`);
            const result = await response.json();

            if (result.success) {
                this.currentTournament = result.data;
                this.renderBracket(result.data);
            } else {
                alert('Error loading bracket: ' + result.error);
            }
        } catch (error) {
            alert('Error loading bracket: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async viewTournament(tournamentId) {
        this.showLoading(true);

        try {
            // Get tournament details
            const tournamentResponse = await fetch(`/api/tournaments/${tournamentId}`);
            const tournamentResult = await tournamentResponse.json();

            if (!tournamentResult.success) {
                alert('Error loading tournament: ' + tournamentResult.error);
                return;
            }

            const tournament = tournamentResult.data;

            // Get tournament statistics
            const statsResponse = await fetch(`/api/tournaments/${tournamentId}/statistics`);
            const statsResult = await statsResponse.json();

            if (!statsResult.success) {
                alert('Error loading statistics: ' + statsResult.error);
                return;
            }

            const stats = statsResult.data;

            // Show tournament details modal
            this.showTournamentDetailsModal(tournament, stats);

        } catch (error) {
            alert('Error loading tournament details: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    showTournamentDetailsModal(tournament, stats) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'tournament-details-modal';
        modal.style.display = 'block';

        modal.innerHTML = `
            <div class="modal-content tournament-details-modal">
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                <div class="tournament-details">
                    <div class="tournament-header">
                        <h2>${tournament.name}</h2>
                        <div class="tournament-meta">
                            <span class="format-badge">${tournament.format.replace('-', ' ')}</span>
                            <span class="status-badge status-${tournament.status}">${tournament.status}</span>
                        </div>
                    </div>

                    <div class="tournament-overview">
                        <div class="overview-grid">
                            <div class="overview-item">
                                <span class="label">Participants:</span>
                                <span class="value">${tournament.participants.length}</span>
                            </div>
                            <div class="overview-item">
                                <span class="label">Total Matches:</span>
                                <span class="value">${stats.tournament.totalMatches}</span>
                            </div>
                            <div class="overview-item">
                                <span class="label">Completed:</span>
                                <span class="value">${stats.tournament.completedMatches}</span>
                            </div>
                            <div class="overview-item">
                                <span class="label">Progress:</span>
                                <span class="value">${Math.round((stats.tournament.completedMatches / stats.tournament.totalMatches) * 100)}%</span>
                            </div>
                        </div>
                    </div>

                    <div class="participants-section">
                        <h3>Participants</h3>
                        <div class="participants-list">
                            ${tournament.participants.map((participant, index) => {
                                const participantStats = stats.participants.find(p => p.participant.id === participant.id);
                                return `
                                    <div class="participant-item ${participantStats?.eliminated ? 'eliminated' : ''}">
                                        <div class="participant-info">
                                            <span class="rank">${index + 1}</span>
                                            <span class="name">${participant.name}</span>
                                            ${participant.seed ? `<span class="seed">Seed ${participant.seed}</span>` : ''}
                                        </div>
                                        <div class="participant-stats">
                                            ${participantStats ? `
                                                <span class="wins">${participantStats.wins}W</span>
                                                <span class="losses">${participantStats.losses}L</span>
                                                <span class="status">${participantStats.eliminated ? 'Eliminated' : 'Active'}</span>
                                            ` : '<span class="status">No matches</span>'}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div class="recent-matches">
                        <h3>Recent Matches</h3>
                        <div class="matches-list">
                            ${tournament.matches.slice(-5).reverse().map(match => `
                                <div class="match-item ${match.status}">
                                    <div class="match-participants">
                                        <span class="participant ${match.winner?.id === match.participant1?.id ? 'winner' : ''}">
                                            ${match.participant1?.name || 'TBD'}
                                        </span>
                                        <span class="vs">vs</span>
                                        <span class="participant ${match.winner?.id === match.participant2?.id ? 'winner' : ''}">
                                            ${match.participant2?.name || 'TBD'}
                                        </span>
                                    </div>
                                    <div class="match-score">
                                        ${match.status === 'completed' ? 
                                            `${match.score1} - ${match.score2}` : 
                                            'Pending'
                                        }
                                    </div>
                                    <div class="match-round">Round ${match.round}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="tournament-actions">
                        <button onclick="app.viewBracket('${tournament.id}')" class="btn-primary">View Bracket</button>
                        <button onclick="app.loadStatisticsForTournament('${tournament.id}')" class="btn-secondary">View Statistics</button>
                        <button onclick="this.closest('.modal').remove()" class="btn-secondary">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async loadStatisticsForTournament(tournamentId) {
        // Close the details modal
        const modal = document.getElementById('tournament-details-modal');
        if (modal) modal.remove();

        // Switch to statistics tab and load data
        document.querySelector('[data-tab="statistics"]').click();
        const select = document.getElementById('stats-tournament-select');
        select.value = tournamentId;
        await this.loadStatistics();
    }

    async viewBracket(tournamentId) {
        // Switch to bracket tab and load the bracket
        document.querySelector('[data-tab="bracket"]').click();
        
        // Set the tournament in the dropdown
        const select = document.getElementById('bracket-tournament-select');
        select.value = tournamentId;
        
        // Load the bracket
        await this.loadBracket();
    }

    renderBracket(bracket) {
        const container = document.getElementById('bracket-visualization');
        const championContainer = document.getElementById('tournament-champion');
        
        if (!bracket.rounds || bracket.rounds.length === 0) {
            container.innerHTML = `
                <div class="no-bracket-message">
                    <h3>No Bracket Generated Yet</h3>
                    <p>This tournament hasn't been started yet. Go to the "Manage Tournaments" tab and click "Start Tournament" to generate the bracket.</p>
                    <button onclick="document.querySelector('[data-tab=\\'manage\\']').click()" class="btn-primary">Go to Manage Tournaments</button>
                </div>
            `;
            championContainer.style.display = 'none';
            return;
        }

        // Display champion if tournament is completed
        if (bracket.tournament.status === 'completed' && bracket.tournament.champion) {
            championContainer.style.display = 'block';
            championContainer.innerHTML = `
                <div class="champion-celebration">
                    <div class="champion-crown">👑</div>
                    <h2 class="champion-title">Tournament Champion</h2>
                    <div class="champion-name">${bracket.tournament.champion.name}</div>
                    <div class="champion-details">
                        <span class="champion-seed">Seed: ${bracket.tournament.champion.seed}</span>
                        <span class="champion-tournament">${bracket.tournament.name}</span>
                    </div>
                    <div class="champion-celebration-text">🎉 Congratulations! 🎉</div>
                </div>
            `;
        } else {
            championContainer.style.display = 'none';
        }

        container.innerHTML = bracket.rounds.map(round => `
            <div class="bracket-round">
                <h3>${round.name}</h3>
                ${round.matches.map(match => this.renderMatch(match)).join('')}
            </div>
        `).join('');
    }

    renderMatch(match) {
        const participant1 = match.participant1;
        const participant2 = match.participant2;
        const isCompleted = match.status === 'completed';
        const isBye = match.isBye;

        return `
            <div class="bracket-match ${match.status}" data-match-id="${match.matchId || match.id}">
                <div class="match-header">
                    <span class="match-id">${match.matchId || 'Match'}</span>
                    ${match.advancesTo ? `<span class="advances-to">Winner → ${match.advancesTo.matchId}</span>` : '<span class="final-match">Final Match</span>'}
                </div>
                <div class="bracket-participant ${match.winner === participant1?.id ? 'winner' : ''}">
                    <span class="bracket-participant-name">${participant1?.name || 'TBD'}</span>
                    <span class="bracket-participant-score">${match.score1 !== null ? match.score1 : ''}</span>
                </div>
                ${!isBye ? `
                    <div class="bracket-participant ${match.winner === participant2?.id ? 'winner' : ''}">
                        <span class="bracket-participant-name">${participant2?.name || 'TBD'}</span>
                        <span class="bracket-participant-score">${match.score2 !== null ? match.score2 : ''}</span>
                    </div>
                ` : ''}
                ${!isCompleted && !isBye && participant1?.name !== 'TBD' && participant2?.name !== 'TBD' ? `
                    <div class="bracket-match-actions">
                        <button onclick="app.openMatchModal('${match.id}', '${participant1?.name || 'TBD'}', '${participant2?.name || 'TBD'}')" class="btn-primary">Submit Result</button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    openMatchModal(matchId, participant1Name, participant2Name) {
        this.currentMatchId = matchId;
        document.getElementById('participant1-name').textContent = participant1Name;
        document.getElementById('participant2-name').textContent = participant2Name;
        document.getElementById('score1').value = '';
        document.getElementById('score2').value = '';
        document.getElementById('match-modal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('match-modal').style.display = 'none';
    }

    async submitMatchResult() {
        const score1 = parseInt(document.getElementById('score1').value);
        const score2 = parseInt(document.getElementById('score2').value);

        if (isNaN(score1) || isNaN(score2)) {
            alert('Please enter valid scores');
            return;
        }

        if (score1 === score2) {
            alert('Scores cannot be equal. Please determine a winner.');
            return;
        }

        // Find the match from the bracket rounds
        let currentMatch = null;
        for (const round of this.currentTournament.rounds) {
            for (const match of round.matches) {
                if (match.id === this.currentMatchId) {
                    currentMatch = match;
                    break;
                }
            }
            if (currentMatch) break;
        }

        if (!currentMatch) {
            alert('Match not found');
            return;
        }

        const winner = score1 > score2 ? currentMatch.participant1 : currentMatch.participant2;

        if (!winner || !winner.id) {
            alert('Error: Unable to determine winner');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`/api/tournaments/${this.currentTournament.tournament.id}/matches/${this.currentMatchId}`, {
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
                alert('Match result submitted successfully!');
                this.closeModal();
                this.loadBracket(); // Reload to show updated bracket
            } else {
                alert('Error submitting result: ' + result.error);
            }
        } catch (error) {
            alert('Error submitting result: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async deleteTournament(tournamentId) {
        if (!confirm('Are you sure you want to delete this tournament?')) {
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`/api/tournaments/${tournamentId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                alert('Tournament deleted successfully!');
                this.loadTournaments();
            } else {
                alert('Error deleting tournament: ' + result.error);
            }
        } catch (error) {
            alert('Error deleting tournament: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    addParticipantInput() {
        const container = document.getElementById('participants-list');
        const input = document.createElement('div');
        input.className = 'participant-input';
        input.innerHTML = `
            <input type="text" placeholder="Participant name" class="participant-name">
            <input type="number" placeholder="Seed (optional)" class="participant-seed" min="1">
            <button type="button" class="remove-participant">Remove</button>
        `;
        container.appendChild(input);
    }

    resetForm() {
        document.getElementById('tournament-form').reset();
        document.getElementById('participants-list').innerHTML = `
            <div class="participant-input">
                <input type="text" placeholder="Participant name" class="participant-name">
                <input type="number" placeholder="Seed (optional)" class="participant-seed" min="1">
                <button type="button" class="remove-participant">Remove</button>
            </div>
        `;
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    // Bulk Input Methods
    switchInputMethod(method) {
        // Update tab buttons
        document.querySelectorAll('.input-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-method="${method}"]`).classList.add('active');

        // Update input methods
        document.querySelectorAll('.input-method').forEach(methodDiv => {
            methodDiv.classList.remove('active');
        });
        document.getElementById(`${method}-input`).classList.add('active');
    }

    parseBulkInput() {
        const textarea = document.getElementById('bulk-participants');
        const autoSeed = document.getElementById('auto-seed').checked;
        const text = textarea.value.trim();

        if (!text) {
            alert('Please enter participant names');
            return;
        }

        const lines = text.split('\n').filter(line => line.trim());
        const participants = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed) {
                participants.push({
                    name: trimmed,
                    seed: autoSeed ? index + 1 : null
                });
            }
        });

        if (participants.length === 0) {
            alert('No valid participant names found');
            return;
        }

        this.addParticipantsToPreview(participants);
        textarea.value = '';
    }

    handleCSVFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            document.getElementById('csv-file-name').textContent = file.name;
            document.getElementById('parse-csv').disabled = false;
        }
    }

    parseCSVFile() {
        const fileInput = document.getElementById('csv-file');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select a CSV file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n').filter(line => line.trim());
                const participants = [];

                lines.forEach((line, index) => {
                    const parts = line.split(',').map(part => part.trim());
                    if (parts[0]) { // Has a name
                        participants.push({
                            name: parts[0],
                            seed: parts[1] ? parseInt(parts[1]) : null
                        });
                    }
                });

                if (participants.length === 0) {
                    alert('No valid participants found in CSV file');
                    return;
                }

                this.addParticipantsToPreview(participants);
                fileInput.value = '';
                document.getElementById('csv-file-name').textContent = 'No file selected';
                document.getElementById('parse-csv').disabled = true;
            } catch (error) {
                alert('Error reading CSV file: ' + error.message);
            }
        };

        reader.readAsText(file);
    }

    generateParticipants() {
        const count = parseInt(document.getElementById('generate-count').value);
        const prefix = document.getElementById('generate-prefix').value || 'Team';
        const start = parseInt(document.getElementById('generate-start').value);
        const autoSeed = document.getElementById('generate-seeds').checked;

        if (count < 2) {
            alert('Please enter at least 2 participants');
            return;
        }

        const participants = [];
        for (let i = 0; i < count; i++) {
            participants.push({
                name: `${prefix} ${start + i}`,
                seed: autoSeed ? i + 1 : null
            });
        }

        this.addParticipantsToPreview(participants);
    }

    addParticipantsToPreview(newParticipants) {
        // Get existing participants from preview
        const existingParticipants = this.getParticipantsFromPreview();
        
        // Add new participants
        const allParticipants = [...existingParticipants, ...newParticipants];
        
        // Update preview
        this.updateParticipantsPreview(allParticipants);
    }

    getParticipantsFromPreview() {
        const previewItems = document.querySelectorAll('.participant-preview-item');
        const participants = [];

        previewItems.forEach(item => {
            const name = item.querySelector('.name').textContent;
            const seedText = item.querySelector('.seed').textContent;
            const seed = seedText === 'Auto' ? null : parseInt(seedText);

            participants.push({
                name: name,
                seed: seed
            });
        });

        return participants;
    }

    updateParticipantsPreview(participants) {
        const preview = document.getElementById('participants-preview');
        const count = document.getElementById('participant-count');
        const list = document.getElementById('participants-preview-list');

        count.textContent = participants.length;
        
        if (participants.length === 0) {
            preview.classList.add('hidden');
            return;
        }

        preview.classList.remove('hidden');
        
        list.innerHTML = participants.map((participant, index) => `
            <div class="participant-preview-item">
                <span class="name">${participant.name}</span>
                <span class="seed">${participant.seed || 'Auto'}</span>
                <button type="button" class="remove" data-id="${index}">×</button>
            </div>
        `).join('');
    }

    removeParticipantFromPreview(index) {
        const participants = this.getParticipantsFromPreview();
        participants.splice(index, 1);
        this.updateParticipantsPreview(participants);
    }

    clearAllParticipants() {
        this.updateParticipantsPreview([]);
    }

    // Override createTournament to use preview participants
    async createTournament() {
        const name = document.getElementById('tournament-name').value;
        const format = document.getElementById('tournament-format').value;
        const seeding = document.getElementById('seeding').value;

        // Get participants from preview if available, otherwise from individual inputs
        let participants = [];
        
        const preview = document.getElementById('participants-preview');
        if (!preview.classList.contains('hidden')) {
            participants = this.getParticipantsFromPreview();
        } else {
            // Fallback to individual inputs
            document.querySelectorAll('.participant-input').forEach(input => {
                const nameInput = input.querySelector('.participant-name');
                const seedInput = input.querySelector('.participant-seed');
                
                if (nameInput.value.trim()) {
                    participants.push({
                        name: nameInput.value.trim(),
                        seed: seedInput.value ? parseInt(seedInput.value) : null
                    });
                }
            });
        }

        if (participants.length < 2) {
            alert('Please add at least 2 participants');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/tournaments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    format,
                    participants,
                    settings: {
                        seeding
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Tournament created successfully!');
                this.resetForm();
                this.loadTournaments();
                // Switch to manage tab
                document.querySelector('[data-tab="manage"]').click();
            } else {
                alert('Error creating tournament: ' + result.error);
            }
        } catch (error) {
            alert('Error creating tournament: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    resetForm() {
        document.getElementById('tournament-form').reset();
        
        // Reset individual inputs
        document.getElementById('participants-list').innerHTML = `
            <div class="participant-input">
                <input type="text" placeholder="Participant name" class="participant-name">
                <input type="number" placeholder="Seed (optional)" class="participant-seed" min="1">
                <button type="button" class="remove-participant">Remove</button>
            </div>
        `;
        
        // Clear bulk inputs
        document.getElementById('bulk-participants').value = '';
        document.getElementById('csv-file').value = '';
        document.getElementById('csv-file-name').textContent = 'No file selected';
        document.getElementById('parse-csv').disabled = true;
        
        // Clear preview
        this.clearAllParticipants();
        
        // Reset to individual input method
        this.switchInputMethod('individual');
    }

    async loadStatistics() {
        const tournamentId = document.getElementById('stats-tournament-select').value;
        
        if (!tournamentId) {
            alert('Please select a tournament');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`/api/tournaments/${tournamentId}/statistics`);
            const result = await response.json();

            if (result.success) {
                this.renderStatistics(result.data);
            } else {
                alert('Error loading statistics: ' + result.error);
            }
        } catch (error) {
            alert('Error loading statistics: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    renderStatistics(stats) {
        const container = document.getElementById('statistics-content');
        
        container.innerHTML = `
            <div class="statistics-overview">
                <h3>Tournament Overview</h3>
                <div class="overview-grid">
                    <div class="overview-item">
                        <span class="label">Format:</span>
                        <span class="value">${stats.tournament.format.replace('-', ' ')}</span>
                    </div>
                    <div class="overview-item">
                        <span class="label">Status:</span>
                        <span class="value status-${stats.tournament.status}">${stats.tournament.status}</span>
                    </div>
                    <div class="overview-item">
                        <span class="label">Participants:</span>
                        <span class="value">${stats.tournament.totalParticipants}</span>
                    </div>
                    <div class="overview-item">
                        <span class="label">Total Matches:</span>
                        <span class="value">${stats.tournament.totalMatches}</span>
                    </div>
                    <div class="overview-item">
                        <span class="label">Completed:</span>
                        <span class="value">${stats.tournament.completedMatches}</span>
                    </div>
                    <div class="overview-item">
                        <span class="label">Progress:</span>
                        <span class="value">${Math.round((stats.tournament.completedMatches / stats.tournament.totalMatches) * 100)}%</span>
                    </div>
                </div>
            </div>

            <div class="participant-statistics">
                <h3>Participant Statistics</h3>
                <div class="stats-table-container">
                    <table class="stats-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Participant</th>
                                <th>Wins</th>
                                <th>Losses</th>
                                <th>Win %</th>
                                <th>Avg Score</th>
                                <th>Total Score</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.participants.map((participant, index) => `
                                <tr class="${participant.eliminated ? 'eliminated' : ''}">
                                    <td>${index + 1}</td>
                                    <td>${participant.participant.name}</td>
                                    <td>${participant.wins}</td>
                                    <td>${participant.losses}</td>
                                    <td>${participant.winPercentage}%</td>
                                    <td>${participant.averageScore}</td>
                                    <td>${participant.totalScore}</td>
                                    <td>
                                        ${participant.eliminated ? 
                                            `<span class="eliminated">Eliminated (Round ${participant.eliminationRound})</span>` : 
                                            '<span class="active">Active</span>'
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="round-statistics">
                <h3>Round Progress</h3>
                <div class="rounds-grid">
                    ${stats.rounds.map(round => `
                        <div class="round-stat">
                            <h4>${round.name}</h4>
                            <div class="round-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${(round.completedMatches / round.totalMatches) * 100}%"></div>
                                </div>
                                <span class="progress-text">${round.completedMatches}/${round.totalMatches} matches</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Initialize the app
const app = new TournamentApp();
