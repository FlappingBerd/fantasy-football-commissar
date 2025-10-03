// Shared configuration for Fantasy Football Commissar
// This file centralizes all configuration to avoid duplication

export const CONFIG = {
  // API Configuration
  OPENAI: {
    MODEL: 'gpt-4-turbo',
    TEMPERATURE: 0.9,
    MAX_TOKENS: {
      SEASON_KICKOFF: 2000,
      DEFAULT: 10000
    }
  },

  // Supabase Configuration
  SUPABASE: {
    BUCKETS: {
      WEEKLY_SUMMARIES: 'weekly_summaries',
      RECAPS: 'recaps'
    }
  },

  // Sleeper API Configuration
  SLEEPER: {
    BASE_URL: 'https://api.sleeper.app/v1',
    DEFAULT_LEAGUE_ID: '1249366852329549824'
  },

  // Analysis Types
  ANALYSIS_TYPES: {
    WEEKLY_RECAP: 'weekly_recap',
    WEEKLY_PROJECTIONS: 'weekly_projections', 
    SEASON_KICKOFF: 'season_kickoff'
  },

  // Error Messages
  ERRORS: {
    MISSING_API_KEY: 'API key not configured. Please check your .env file.',
    MISSING_LEAGUE_DATA: 'No league data provided',
    EMPTY_RESPONSE: 'OpenAI returned an empty response',
    MISSING_ENV_VARS: 'Missing environment variables. Please check your .env file.'
  },

  // Logging
  LOGGING: {
    ENABLED: process.env.NODE_ENV === 'development',
    LEVELS: {
      ERROR: 'error',
      WARN: 'warn', 
      INFO: 'info',
      DEBUG: 'debug'
    }
  }
}

// Helper function to get OpenAI configuration
export function getOpenAIConfig(context = 'weekly') {
  return {
    model: CONFIG.OPENAI.MODEL,
    temperature: CONFIG.OPENAI.TEMPERATURE,
    max_tokens: context === CONFIG.ANALYSIS_TYPES.SEASON_KICKOFF 
      ? CONFIG.OPENAI.MAX_TOKENS.SEASON_KICKOFF 
      : CONFIG.OPENAI.MAX_TOKENS.DEFAULT
  }
}

// Helper function to validate environment variables
export function validateEnvVars() {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_OPENAI_API_KEY'
  ]
  
  const missing = required.filter(key => !import.meta.env[key])
  
  if (missing.length > 0) {
    throw new Error(`${CONFIG.ERRORS.MISSING_ENV_VARS} Missing: ${missing.join(', ')}`)
  }
}
