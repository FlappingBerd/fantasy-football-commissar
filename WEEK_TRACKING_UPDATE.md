# Week-Over-Week Tracking Update

## 🎯 Overview
The Fantasy Football Commissar now supports **week-over-week tracking and historical context** for weekly recaps! This enhancement provides much richer analysis by comparing current performance to previous weeks and tracking season-long trends.

## ✨ New Features

### 📊 Historical Data Storage
- **Week-specific files**: Each week's data is now saved as `week_X.json` and `week_X_trimmed.json`
- **Historical comparison**: Previous weeks' data is automatically loaded for comparison
- **Season context**: Up to 3 previous weeks of data are included for trend analysis

### 🔍 Enhanced Weekly Recaps
The Commissar now provides:
- **Week-over-week movement**: Teams that moved up/down in standings
- **Season trajectory**: Hot streaks, cold streaks, and consistency trends  
- **Playoff positioning**: Clear categorization of teams (playoff/bubble/eliminated)
- **Historical context**: How current performance compares to previous weeks
- **Season narrative**: Multi-week storylines and developing trends

### 🤖 Smarter Analysis
- **Trend identification**: Spots teams on winning/losing streaks
- **Position changes**: Tracks which teams improved or declined
- **Consistency metrics**: Identifies reliable vs volatile performers
- **Season outlook**: Projects playoff implications based on trends

## 🛠️ Technical Implementation

### Data Structure Changes
```json
{
  "week": "2",
  "historical_weeks": {
    "week_1": {
      "week": "1",
      "rosters": [...],
      "matchups": [...],
      "stats": {...}
    }
  },
  // ... current week data
}
```

### Updated Scripts
- **`fetch_sleeper_week.js`**: Now saves week-specific historical files
- **`prompts.js`**: Enhanced prompts emphasize historical comparison
- **`generate-recap.js`**: Updated to pass historical context to AI

## 📈 Usage Examples

### Command Line
```bash
# Fetch current week with historical context
npm run fetch

# Generate weekly recap with week-over-week analysis
node generate-recap.js weekly
```

### Web Interface
1. Visit http://localhost:5173
2. Select "Weekly Recap" from dropdown
3. Click "Generate Analysis" 
4. Enjoy the enhanced Commissar commentary with historical context!

## 🏈 Sample Enhanced Output

The Commissar now provides insights like:
- "FlappingBird maintains his iron grip on first place, extending his winning streak to 2-0!"
- "RenPetschke continues his tragic descent, falling to 0-2 and facing elimination"
- "WhatayaZay bounced back from last week's loss with a dominant 29.6 point victory"
- "The playoff race is heating up with 4 teams still undefeated after Week 2"

## 🚀 Benefits

1. **Richer Storytelling**: Multi-week narratives instead of isolated game recaps
2. **Better Context**: Understanding of how teams are trending over time
3. **Playoff Insights**: Clear picture of who's in contention vs eliminated
4. **Season Tracking**: Perfect for weekly updates throughout the season
5. **Historical Archive**: Complete record of each week for future reference

## 📅 Perfect for Season-Long Use

This update makes the system ideal for your weekly fantasy football updates from now through November playoffs. Each week will build on the previous weeks' context, creating a rich season-long narrative that tracks:

- Team trajectories and momentum
- Playoff race developments  
- Manager performance trends
- Key turning points in the season
- Championship contender emergence

The Commissar is now ready to deliver comprehensive weekly analysis that captures the full drama of your fantasy football season! 🏆

