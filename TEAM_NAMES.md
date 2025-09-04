# Team Name Management

The Fantasy Football Commissar system automatically handles team name changes to ensure accuracy.

## How It Works

### 1. **Automatic Detection**
- The system fetches team names directly from Sleeper's API
- Uses `user.metadata.team_name` as the primary source (most up-to-date)
- Falls back to `display_name` or `username` if no team name is set
- Automatically detects and logs team name changes

### 2. **Team Name Priority**
```
1. user.metadata.team_name (from Sleeper - most current)
2. user.display_name (fallback)
3. user.username (fallback)
4. "Unknown Team" (final fallback)
```

### 3. **Change Monitoring**
- Compares current team names with previous data
- Logs all changes to `team_name_changes.json`
- Displays changes in console output
- Saves current team names to `current_team_names.json`

## Commands

### Check Current Team Names
```bash
node scripts/check_team_names.js --league YOUR_LEAGUE_ID
```

### Fetch Latest Data (includes team name monitoring)
```bash
node scripts/fetch_sleeper_week.js --league YOUR_LEAGUE_ID
```

### Fetch Draft Data (with current team names)
```bash
node scripts/fetch_draft_data.js --league YOUR_LEAGUE_ID
```

## Files Generated

- `current_team_names.json` - Current team names snapshot
- `team_name_changes.json` - Log of all team name changes
- `weekly_summaries/latest.json` - Latest data with current team names

## Example Output

```
🔍 Checking current team names...

📊 League: Internet Football League (2025)
👥 Total Users: 14

🏈 CURRENT TEAM NAMES:
============================================================
 1. His Royal Highness and Supreme Commissioner | Call em Stalin
 2. Riky                      | Ricky's Raging Kodiaks 
 3. Tio                       | Shake Zula The Mic Rula
...

🔄 COMPARING WITH PREVIOUS DATA:
============================================================
🔄 His Royal Highness and Supreme Commissioner: "Loading please wait… " → "Call em Stalin"
```

## Benefits

- ✅ **Always Accurate**: Uses live data from Sleeper
- ✅ **Automatic Updates**: No manual intervention needed
- ✅ **Change Tracking**: Logs all team name changes
- ✅ **Fallback System**: Handles missing team names gracefully
- ✅ **Consistent**: Same system across all scripts

## Notes

- Team names are fetched fresh every time data is pulled
- No manual configuration needed for team name changes
- The system will automatically use the most current team names
- All analysis will reflect the latest team names from Sleeper
