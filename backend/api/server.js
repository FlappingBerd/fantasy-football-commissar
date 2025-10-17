import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = express()
const port = 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// OpenAI proxy endpoint
app.post('/api/openai/chat', async (req, res) => {
  try {
    const { messages, model = 'gpt-4o', max_tokens = 4000, temperature = 0.9 } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' })
    }

    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens,
      temperature
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response received from OpenAI')
    }

    res.json({ response })
  } catch (error) {
    console.error('OpenAI API Error:', error)
    res.status(500).json({ 
      error: 'OpenAI API error', 
      message: error.message 
    })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(port, () => {
  console.log(`🚀 OpenAI proxy server running on http://localhost:${port}`)
})
