const express = require('express');
const cors = require('cors');
const path = require('path');
const TournamentManager = require('./src/tournament-manager');
const BracketRenderer = require('./src/bracket-renderer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize tournament manager
const tournamentManager = new TournamentManager();
const bracketRenderer = new BracketRenderer();

// API Routes

// Tournament Management
app.get('/api/tournaments', (req, res) => {
  try {
    const tournaments = tournamentManager.getAllTournaments();
    res.json({ success: true, data: tournaments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/tournaments', (req, res) => {
  try {
    const { name, format, participants, settings } = req.body;
    const tournament = tournamentManager.createTournament(name, format, participants, settings);
    res.json({ success: true, data: tournament });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/tournaments/:id', (req, res) => {
  try {
    const tournament = tournamentManager.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    res.json({ success: true, data: tournament });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/tournaments/:id', (req, res) => {
  try {
    const tournament = tournamentManager.updateTournament(req.params.id, req.body);
    res.json({ success: true, data: tournament });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/tournaments/:id', (req, res) => {
  try {
    tournamentManager.deleteTournament(req.params.id);
    res.json({ success: true, message: 'Tournament deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Participant Management
app.post('/api/tournaments/:id/participants', (req, res) => {
  try {
    const { participants } = req.body;
    const tournament = tournamentManager.addParticipants(req.params.id, participants);
    res.json({ success: true, data: tournament });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/tournaments/:id/participants/:participantId', (req, res) => {
  try {
    const tournament = tournamentManager.removeParticipant(req.params.id, req.params.participantId);
    res.json({ success: true, data: tournament });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Match Management
app.get('/api/tournaments/:id/matches', (req, res) => {
  try {
    const matches = tournamentManager.getMatches(req.params.id);
    res.json({ success: true, data: matches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/tournaments/:id/matches/:matchId', (req, res) => {
  try {
    const { score1, score2, winner } = req.body;
    const tournament = tournamentManager.submitMatchResult(req.params.id, req.params.matchId, {
      score1, score2, winner
    });
    res.json({ success: true, data: tournament });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Bracket Visualization
app.get('/api/tournaments/:id/bracket', (req, res) => {
  try {
    const tournament = tournamentManager.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    const bracket = bracketRenderer.generateBracket(tournament);
    res.json({ success: true, data: bracket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate Bracket (POST endpoint)
app.post('/api/tournaments/:id/bracket', (req, res) => {
  try {
    const tournament = tournamentManager.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    
    if (tournament.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Cannot generate bracket for completed tournament' });
    }
    
    const updatedTournament = tournamentManager.generateBracket(req.params.id);
    const bracket = bracketRenderer.generateBracket(updatedTournament);
    res.json({ success: true, data: bracket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tournament Status
app.get('/api/tournaments/:id/status', (req, res) => {
  try {
    const status = tournamentManager.getTournamentStatus(req.params.id);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tournament Statistics
app.get('/api/tournaments/:id/statistics', (req, res) => {
  try {
    const stats = tournamentManager.getTournamentStatistics(req.params.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Tournament system running on http://localhost:${PORT}`);
});
