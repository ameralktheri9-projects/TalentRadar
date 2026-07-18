import OpenAI from 'openai'

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o'

// Lazy singleton — avoids crash at build time when OPENAI_API_KEY is not set
let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? 'not-configured' })
  }
  return _client
}

export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop: string | symbol) {
    return getClient()[prop as keyof OpenAI]
  },
})
