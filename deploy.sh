#!/bin/bash

# Fantasy Football Commissar - Deployment Script
# This script deploys the project to Supabase

set -e

echo "🚀 Deploying Fantasy Football Commissar to Supabase..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if we're linked to a project
if ! supabase status &> /dev/null; then
    echo "❌ Error: Not linked to a Supabase project"
    echo "Run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install
cd frontend && npm install && cd ..

echo "🏗️ Building frontend..."
cd frontend
npm run build
cd ..

echo "🗄️ Pushing database changes..."
supabase db push

echo "📁 Pushing storage changes..."
supabase storage push

echo "🔧 Setting up storage policies..."
# Run the storage setup script if it exists
if [ -f "setup-storage-policies.js" ]; then
    echo "📋 Setting up storage policies..."
    node setup-storage-policies.js
fi

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your project is now deployed to Supabase!"
echo "📊 Dashboard: https://supabase.com/dashboard/project/$(supabase status --output json | jq -r '.project_ref')"
echo "🔗 API URL: $(supabase status --output json | jq -r '.api_url')"
echo ""
echo "🎯 Next steps:"
echo "1. Set up your environment variables"
echo "2. Configure your frontend to use the Supabase URL"
echo "3. Test your deployment" 