# 🏆 Tournament Bracket System

A comprehensive, self-hosted tournament bracket management system with beautiful visualizations and full API control.

## ✨ Features

### Tournament Formats
- **Single Elimination** - Classic knockout tournament
- **Double Elimination** - Second chance for losers
- **Round Robin** - Everyone plays everyone

### Core Functionality
- ✅ Create and manage tournaments
- ✅ Add/remove participants dynamically
- ✅ Automatic bracket generation
- ✅ Match result submission
- ✅ Real-time bracket visualization
- ✅ Seeding support (random, manual, none)
- ✅ Bye handling for odd numbers
- ✅ Tournament status tracking
- ✅ Beautiful responsive UI

### API Features
- RESTful API with full CRUD operations
- Tournament management endpoints
- Participant management
- Match result submission
- Bracket visualization data
- Tournament status and standings

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or download the project**
   ```bash
   cd tournament
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Development Mode
```bash
npm run dev
```

## 📖 Usage

### Creating a Tournament

1. **Fill out the tournament form:**
   - Enter tournament name
   - Select format (Single Elimination, Double Elimination, Round Robin)
   - Choose seeding method
   - Add participants (name and optional seed)

2. **Start the tournament:**
   - Go to "Manage Tournaments" tab
   - Click "Start" on your tournament
   - The bracket will be automatically generated

3. **View and manage the bracket:**
   - Go to "View Bracket" tab
   - Select your tournament
   - Click "Load Bracket"
   - Submit match results as they complete

### API Endpoints

#### Tournament Management
- `GET /api/tournaments` - List all tournaments
- `POST /api/tournaments` - Create new tournament
- `GET /api/tournaments/:id` - Get tournament details
- `PUT /api/tournaments/:id` - Update tournament
- `DELETE /api/tournaments/:id` - Delete tournament

#### Participant Management
- `POST /api/tournaments/:id/participants` - Add participants
- `DELETE /api/tournaments/:id/participants/:participantId` - Remove participant

#### Match Management
- `GET /api/tournaments/:id/matches` - Get all matches
- `PUT /api/tournaments/:id/matches/:matchId` - Submit match result

#### Bracket Visualization
- `GET /api/tournaments/:id/bracket` - Get bracket data
- `GET /api/tournaments/:id/status` - Get tournament status

### Example API Usage

#### Create Tournament
```javascript
const response = await fetch('/api/tournaments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Championship 2024',
    format: 'single-elimination',
    participants: [
      { name: 'Team Alpha', seed: 1 },
      { name: 'Team Beta', seed: 2 },
      { name: 'Team Gamma', seed: 3 },
      { name: 'Team Delta', seed: 4 }
    ],
    settings: {
      seeding: 'manual',
      allowByes: true
    }
  })
});
```

#### Submit Match Result
```javascript
const response = await fetch('/api/tournaments/tournament-id/matches/match-id', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    score1: 21,
    score2: 18,
    winner: 'participant-id'
  })
});
```

## 🎯 Tournament Formats Explained

### Single Elimination
- Classic knockout format
- One loss = elimination
- Fastest format
- Perfect for large tournaments

### Double Elimination
- Second chance for losers
- Winners bracket + Losers bracket
- More matches, fairer results
- Great for competitive tournaments

### Round Robin
- Everyone plays everyone
- Most matches, most fair
- Perfect for small groups
- Great for league play

## 🔧 Configuration

### Tournament Settings
- **Seeding**: Random, Manual, or None
- **Byes**: Automatically handle odd numbers
- **Participants**: Dynamic add/remove before start

### API Configuration
- Port: Set `PORT` environment variable (default: 3000)
- CORS: Enabled for all origins (configure in server.js)
- Data: In-memory storage (add database for production)

## 🎨 Customization

### Styling
- Modify `public/styles.css` for visual changes
- Responsive design included
- Modern gradient design
- Easy to customize colors and layout

### Functionality
- Extend `TournamentManager` class for custom logic
- Add new tournament formats in `generateBracket()` method
- Customize bracket rendering in `BracketRenderer`

## 🚀 Production Deployment

### Database Integration
Replace in-memory storage with:
- MongoDB
- PostgreSQL
- MySQL
- Redis

### Environment Variables
```bash
PORT=3000
NODE_ENV=production
DATABASE_URL=your_database_url
```

### Security
- Add authentication middleware
- Implement rate limiting
- Add input validation
- Use HTTPS in production

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Test thoroughly
5. Submit pull request

## 📝 License

MIT License - feel free to use in your projects!

## 🆘 Support

For issues and questions:
1. Check the API documentation above
2. Review the code comments
3. Test with the provided examples
4. Create an issue with details

---

**Built with ❤️ for tournament organizers everywhere!**
