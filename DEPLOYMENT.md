# 🚀 Deployment Guide

This guide will help you deploy the Fantasy Football Commissar project to Supabase and set up automatic deployments.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [GitHub account](https://github.com)
- [Supabase account](https://supabase.com)

## 🔧 Local Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Environment Variables

Copy the example environment file and fill in your values:

```bash
cp env.example .env
```

Edit `.env` with your actual values:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Sleeper API Configuration
SLEEPER_LEAGUE_ID=your_sleeper_league_id_here
```

### 3. Link to Supabase Project

```bash
# List your projects
supabase projects list

# Link to your project (replace with your project ref)
supabase link --project-ref fkmyrnlnodstltxkesfm
```

## 🚀 Deployment Options

### Option 1: Quick Deploy Script

Use the provided deployment script:

```bash
./deploy.sh
```

This script will:
- Install dependencies
- Build the frontend
- Push database changes
- Push storage changes
- Set up storage policies

### Option 2: Manual Deployment

#### Deploy Database Changes

```bash
supabase db push
```

#### Deploy Storage Changes

```bash
supabase storage push
```

#### Build and Deploy Frontend

```bash
cd frontend
npm run build
cd ..
```

### Option 3: GitHub Actions (Automatic)

The project includes a GitHub Actions workflow that automatically deploys when you push to the `main` branch.

#### Setup GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add the following secrets:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_PROJECT_REF=your_project_ref_here
SUPABASE_ACCESS_TOKEN=your_supabase_access_token_here
```

#### Get Supabase Access Token

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
2. Generate a new access token
3. Add it to your GitHub secrets

## 📊 Supabase Dashboard

After deployment, you can access your project at:

- **Dashboard**: https://supabase.com/dashboard/project/fkmyrnlnodstltxkesfm
- **API URL**: https://fkmyrnlnodstltxkesfm.supabase.co
- **Studio**: https://fkmyrnlnodstltxkesfm.supabase.co/app

## 🔍 Verification

### Check Deployment Status

```bash
# Check project status
supabase status

# List projects
supabase projects list
```

### Test the Application

1. Start the development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open http://localhost:5173
3. Test the "Generate Analysis" functionality

## 🛠️ Troubleshooting

### Common Issues

#### 1. Supabase CLI Not Found
```bash
npm install -g supabase
```

#### 2. Docker Not Running
The Supabase CLI requires Docker for local development:
```bash
# macOS
brew install --cask docker

# Start Docker Desktop
open /Applications/Docker.app
```

#### 3. Permission Denied on deploy.sh
```bash
chmod +x deploy.sh
```

#### 4. Environment Variables Not Loading
Make sure your `.env` file is in the root directory and properly formatted.

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Issues](https://github.com/FlappingBerd/fantasy-football-commissar/issues)
- [Supabase Discord](https://discord.supabase.com)

## 🔄 Continuous Deployment

Once set up, your project will automatically deploy when you:

1. Push changes to the `main` branch
2. Create a pull request to `main`

The GitHub Actions workflow will:
- Install dependencies
- Build the frontend
- Deploy to Supabase
- Run tests (if configured)

## 📈 Monitoring

Monitor your deployment:

- **GitHub Actions**: Check the Actions tab in your repository
- **Supabase Dashboard**: Monitor logs and performance
- **Application Logs**: Check browser console for errors

---

**Happy Deploying!** 🏈⚡ 