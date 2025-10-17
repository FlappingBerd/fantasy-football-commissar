# Fantasy Weekly Updates

A dynamic fantasy football analysis platform with multiple AI personas and real-time Sleeper API integration.

## 🏗️ Project Structure

```
fantasy-weekly-updates/
├── frontend/                 # React + Vite frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── lib/             # Utilities (OpenAI, Supabase, personas)
│   │   └── styles/          # CSS and design tokens
│   └── public/              # Static assets
├── backend/                 # Node.js backend services
│   ├── api/                 # API server (server.js)
│   ├── config/              # Configuration files
│   └── supabase/           # Supabase configuration
├── data/                    # All data files and JSON exports
├── scripts/                 # Utility scripts and automation
├── docs/                    # Documentation and guides
└── config/                  # Global configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key
- Supabase account
- Sleeper API access

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd fantasy-weekly-updates
npm install
cd frontend && npm install
```

2. **Environment setup:**
```bash
# Root .env
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SLEEPER_LEAGUE_ID=your_league_id

# Frontend .env
VITE_OPENAI_API_KEY=your_openai_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SLEEPER_LEAGUE_ID=your_league_id
```

3. **Start development servers:**
```bash
# Terminal 1: Backend API server
npm run server

# Terminal 2: Frontend development server
cd frontend && npm run dev
```

## 🎭 Features

### AI Personas (9 Total)
- 🏛️ **The Commissar** - Soviet bureaucrat with dramatic flair
- 🏈 **Coach Analysis** - Former NFL coach with strategic insights
- 🎙️ **Sports Commentator** - ESPN-style energetic analysis
- 📊 **Data Analyst** - Statistical and analytical breakdowns
- 😂 **Fantasy Comedian** - Stand-up comedian roasting managers
- 📚 **Fantasy Historian** - Scholarly academic analysis
- 🎯 **Charlie Kirk** - Conservative political commentator
- 🗽 **Donald Trump** - Bombastic businessman style
- 🚀 **Elon Musk** - Tech entrepreneur visionary

### Analysis Types
- **Weekly Recap** - Previous week's completed games analysis
- **Weekly Projections** - Upcoming week predictions
- **Season Kickoff** - Draft and season preview analysis

### Data Integration
- **Real-time Sleeper API** - Live fantasy football data
- **Supabase Storage** - Save and retrieve analysis reports
- **Week-over-Week Tracking** - Automatic previous week analysis

## 🛠️ Development

### Scripts
```bash
# Development
npm run dev          # Start frontend dev server
npm run server       # Start backend API server
npm run build        # Build for production

# Data Management
npm run fetch-week   # Fetch specific week data
npm run update-names # Update team names
npm run generate     # Generate analysis report
```

### File Organization
- **Frontend**: React components, utilities, and styling
- **Backend**: API server, configuration, and Supabase setup
- **Data**: JSON exports, team names, and weekly summaries
- **Scripts**: Automation and utility scripts
- **Docs**: Documentation, guides, and deployment info

## 📁 Key Directories

- `frontend/src/lib/` - Core utilities (OpenAI, Supabase, personas)
- `backend/api/` - Express server and API endpoints
- `data/` - All JSON data files and exports
- `scripts/` - Utility scripts for data management
- `docs/` - Documentation and deployment guides

## 🔧 Configuration

### Environment Variables
- `OPENAI_API_KEY` - OpenAI API access
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SLEEPER_LEAGUE_ID` - Fantasy league ID

### League Configuration
Update `LEAGUE_ID` in `frontend/src/components/CommissarPanel.jsx` for your league.

## 📊 Data Flow

1. **Sleeper API** → Fetch real-time league data
2. **Persona Selection** → Choose analysis style
3. **OpenAI Processing** → Generate persona-specific analysis
4. **Supabase Storage** → Save reports for future reference

## 🚀 Deployment

See `docs/DEPLOYMENT.md` for detailed deployment instructions.

## 📝 License

MIT License - see `LICENSE` file for details.
