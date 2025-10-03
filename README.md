# 🏈 Fantasy Football Commissar

**Official Fantasy Football League Analysis Terminal** - A satirical, AI-powered fantasy football analysis system featuring the "Commissar of Competitive Balance."

## 🎯 Overview

This project provides automated fantasy football analysis with a unique twist - all analysis is delivered by an AI "Commissar" who speaks like a Soviet-era bureaucrat taking fantasy football way too seriously. The system includes:

- **Weekly Recaps**: Post-game analysis with standings updates
- **Post-Draft Analysis**: Comprehensive draft evaluation
- **Pre-Season Previews**: Season-opening analysis with Week 1 matchups
- **Real-time Data**: Integration with Sleeper API and Supabase storage

## 🚀 Features

### 🤖 AI-Powered Analysis
- **Commissar Persona**: Satirical, over-the-top commentary
- **Multi-Context Prompts**: Different analysis types for different seasons
- **Real Name Integration**: Uses actual manager names from league data
- **Markdown Output**: Rich formatting with headers, bold text, and bullet points

### 📊 Data Integration
- **Sleeper API**: Fetches live fantasy football data
- **Supabase Storage**: Cloud storage for league data and generated recaps
- **Real-time Updates**: Automatic data synchronization
- **Standings Analysis**: Playoff positions, power rankings, and trends

### 🎨 Modern UI
- **Terminal-Style Interface**: Dark, minimalist, monospace design
- **React + Vite**: Fast, modern frontend
- **TailwindCSS**: Beautiful, responsive styling
- **Real-time Generation**: Instant AI analysis generation

## 🛠️ Tech Stack

### Backend
- **Node.js**: Runtime environment
- **Sleeper API**: Fantasy football data source
- **OpenAI API**: GPT-4o for AI analysis
- **Supabase**: Database and storage

### Frontend
- **React**: UI framework
- **Vite**: Build tool and dev server
- **TailwindCSS**: Styling framework
- **React Markdown**: Markdown rendering

## 📁 Project Structure

```
fantasy-weekly-updates/
├── scripts/
│   ├── fetch_sleeper_week.js    # Fetches league data from Sleeper API
│   ├── generate-recap.js        # Command-line recap generation
│   ├── test-openai-headless.js  # Headless OpenAI testing
│   └── fix-supabase-upload.js   # Supabase data upload utility
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── CommissarPanel.jsx  # Main UI component
│   │   ├── lib/
│   │   │   ├── openai.js           # OpenAI integration
│   │   │   └── supabase.js         # Supabase integration
│   │   └── main.jsx
│   └── package.json
├── weekly_summaries/            # Local data storage
├── prompts.js                   # AI prompt definitions
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase account
- OpenAI API key
- Sleeper API access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fantasy-weekly-updates
   ```

2. **Install dependencies**
   ```bash
   # Root dependencies
   npm install
   
   # Frontend dependencies
   cd frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Create .env file in root directory
   cp .env.example .
   
   
   
   # Add your API keys
   OPENAI_API_KEY=your_openai_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SLEEPER_LEAGUE_ID=your_league_id
   ```

4. **Supabase Setup**
   - Create a Supabase project
   - Set up storage buckets: `weekly_summaries` and `recaps`
   - Configure Row Level Security (RLS) policies
   - Add your Supabase credentials to `.env`

### Usage

1. **Fetch League Data**
   ```bash
   npm run fetch
   ```

2. **Generate Analysis (Command Line)**
   ```bash
   # Post-draft analysis
   node generate-recap.js draft
   
   # Pre-season preview
   node generate-recap.js pre-season
   
   # Weekly recap
   node generate-recap.js weekly
   ```

3. **Start Web App**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access the Terminal**
   - Open `http://localhost:5173`
   - Select analysis type from dropdown
   - Click "Generate Analysis"
   - View the Commissar's satirical commentary!

## 📝 Analysis Types

### 🏛️ Post-Draft Analysis
Comprehensive evaluation of draft performance including:
- Draft champions and disasters
- Steals and reaches with specific players
- Positional analysis
- Roster construction evaluation
- Championship contenders

### 🌅 Pre-Season Preview
Season-opening analysis featuring:
- League overview and predictions
- Week 1 matchup previews
- Season-long projections
- Manager expectations

### 📊 Weekly Recaps
Post-game analysis including:
- Game outcomes and highlights
- Best/worst manager decisions
- Standings implications
- Next week's matchup previews
- Power rankings updates

## 🔧 Configuration

### Customizing the Commissar
Edit `prompts.js` to modify the AI persona:
- Adjust the authoritarian tone
- Change analysis focus areas
- Modify formatting preferences

### Data Sources
- **Sleeper API**: Configure league ID in `.env`
- **Supabase**: Update storage bucket names and policies
- **OpenAI**: Adjust model and token limits

## 🎨 Customization

### Styling
The terminal interface uses TailwindCSS classes in `frontend/src/index.css`:
- Dark theme with green terminal colors
- Monospace fonts for authentic terminal feel
- Responsive design for mobile compatibility

### Analysis Focus
Modify prompts in `prompts.js` to:
- Focus on specific managers
- Add new analysis categories
- Change the satirical tone
- Adjust data emphasis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Sleeper API**: For providing comprehensive fantasy football data
- **OpenAI**: For powering the AI analysis
- **Supabase**: For cloud storage and database services
- **React & Vite**: For the modern frontend framework

---

**Long live the Internet Football League!** 🏈⚡ 