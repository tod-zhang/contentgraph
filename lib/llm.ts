import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export type LLMProvider = 'anthropic' | 'deepseek'

const PROVIDER_CONFIG = {
  anthropic: {
    model: 'claude-sonnet-4-20250514',
  },
  deepseek: {
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
} as const

export async function chatCompletion(
  provider: LLMProvider,
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 8192,
): Promise<string> {
  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: PROVIDER_CONFIG.anthropic.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })
    return message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
  }

  // DeepSeek (OpenAI-compatible)
  const client = new OpenAI({
    apiKey,
    baseURL: PROVIDER_CONFIG.deepseek.baseURL,
  })
  const response = await client.chat.completions.create({
    model: PROVIDER_CONFIG.deepseek.model,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  })
  return response.choices[0]?.message?.content ?? ''
}
