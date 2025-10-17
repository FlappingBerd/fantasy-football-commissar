# Project Structure Guide

## 📁 Directory Overview

```
fantasy-weekly-updates/
├── frontend/                 # React + Vite frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── CommissarPanel.jsx      # Main analysis component
│   │   │   ├── CommissarPanelFigma.jsx # Figma integration component
│   │   │   ├── ErrorBoundary.jsx       # Error handling component
│   │   │   └── ui/                     # Reusable UI components
│   │   ├── lib/             # Core utilities and services
│   │   │   ├── openai.js               # OpenAI API integration
│   │   │   ├── personas.js             # AI persona definitions
│   │   │   └── supabase.js             # Supabase integration
│   │   ├── styles/          # CSS and design system
│   │   │   ├── design-tokens.css        # Design system tokens
│   │   │   └── figma-integration.css   # Figma-specific styles
│   │   ├── App.jsx          # Main React component
│   │   └── main.jsx         # React entry point
│   ├── public/              # Static assets
│   ├── dist/                # Built frontend files
│   └── package.json         # Frontend dependencies
├── backend/                 # Node.js backend services
│   ├── api/
│   │   └── server.js        # Express API server
│   ├── config/
│   │   ├── config.js        # Backend configuration
│   │   └── prompts.js        # AI prompt templates
│   └── supabase/
│       └── config.toml      # Supabase configuration
├── data/                    # All data files and JSON exports
│   ├── current_team_names.json    # Current team name mappings
│   ├── team_name_changes.json     # Team name change history
│   ├── sample-data.json           # Sample league data
│   ├── latest.json                # Latest week data
│   ├── latest_trimmed.json        # Latest week trimmed data
│   └── week_*.json               # Historical week data
├── scripts/                 # Utility scripts and automation
│   ├── fetch_sleeper_week.js      # Fetch data from Sleeper API
│   ├── update_team_names.js       # Update team name mappings
│   ├── check_team_names.js        # Validate team names
│   ├── generate-recap.js           # Generate analysis reports
│   ├── schedule.js                 # Scheduled tasks
│   ├── deploy.sh                   # Deployment script
│   └── setup-*.js                  # Setup and configuration scripts
├── docs/                    # Documentation and guides
│   ├── DEPLOYMENT.md              # Deployment instructions
│   ├── FIGMA_INTEGRATION_GUIDE.md # Figma integration guide
│   ├── TEAM_NAMES.md              # Team name management
│   ├── WEEK_TRACKING_UPDATE.md   # Week tracking feature
│   └── *.sql                      # Database setup scripts
├── config/                  # Global configuration (future use)
├── package.json            # Root package.json with scripts
├── .env                     # Environment variables
└── README.md               # Project overview
```

## 🎯 Key Directories Explained

### Frontend (`/frontend/`)
- **React + Vite** application for the user interface
- **Components**: Reusable UI components and main analysis panel
- **Lib**: Core utilities for OpenAI, Supabase, and persona management
- **Styles**: Design system and component styling

### Backend (`/backend/`)
- **API Server**: Express.js server for OpenAI proxy and API endpoints
- **Config**: Backend configuration and AI prompt templates
- **Supabase**: Database configuration and setup

### Data (`/data/`)
- **All JSON files** containing league data, team names, and weekly summaries
- **Centralized storage** for all data exports and imports
- **Historical data** for week-over-week analysis

### Scripts (`/scripts/`)
- **Automation scripts** for data fetching and processing
- **Utility scripts** for team name management and validation
- **Deployment scripts** for production setup

### Docs (`/docs/`)
- **Documentation** for deployment, features, and configuration
- **Database scripts** for Supabase setup
- **Integration guides** for external services

## 🔄 Data Flow

1. **Sleeper API** → `scripts/fetch_sleeper_week.js` → `data/`
2. **User Selection** → `frontend/src/components/CommissarPanel.jsx`
3. **Data Processing** → `frontend/src/lib/supabase.js`
4. **AI Analysis** → `frontend/src/lib/openai.js` → `backend/api/server.js`
5. **Storage** → `frontend/src/lib/supabase.js` → Supabase

## 🛠️ Development Workflow

### Starting Development
```bash
# Terminal 1: Backend API server
npm run server

# Terminal 2: Frontend development
npm run dev
```

### Data Management
```bash
# Fetch new week data
npm run fetch

# Update team names
npm run update-names

# Generate analysis
npm run generate
```

### Building for Production
```bash
# Build frontend
npm run build

# Start production server
npm run server
```

## 📦 Dependencies

### Root Dependencies
- **Express**: API server
- **CORS**: Cross-origin requests
- **Dotenv**: Environment variables
- **OpenAI**: AI analysis
- **Supabase**: Database and storage

### Frontend Dependencies
- **React**: UI framework
- **Vite**: Build tool and dev server
- **TailwindCSS**: Styling
- **React Markdown**: Markdown rendering

## 🔧 Configuration Files

- **`.env`**: Environment variables (API keys, URLs)
- **`backend/config/config.js`**: Backend configuration
- **`backend/config/prompts.js`**: AI prompt templates
- **`frontend/vite.config.js`**: Vite configuration
- **`frontend/tailwind.config.js`**: TailwindCSS configuration

## 📊 File Naming Conventions

- **Components**: PascalCase (e.g., `CommissarPanel.jsx`)
- **Utilities**: camelCase (e.g., `openai.js`, `supabase.js`)
- **Data files**: kebab-case (e.g., `week-1.json`, `latest-trimmed.json`)
- **Scripts**: kebab-case (e.g., `fetch-sleeper-week.js`)
- **Documentation**: UPPER_CASE (e.g., `DEPLOYMENT.md`)

## 🚀 Deployment Structure

### Production Build
```
dist/
├── frontend/          # Built React app
├── backend/           # Node.js server
└── data/              # Data files
```

### Environment Setup
- **Development**: Local development with hot reload
- **Staging**: Test environment with production-like setup
- **Production**: Full deployment with optimized builds
