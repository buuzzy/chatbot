/**
 * Chat API client — calls /api/chat with model selection.
 * Parses SSE stream, distinguishing reasoning (thinking) vs content events.
 * Supports multi-provider routing via optional apiConfig.
 */

import { ModelId, ApiProvider } from '@/types/chat'

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type StreamCallback = (content: string) => void

export interface ApiConfigPayload {
  provider: ApiProvider
  apiUrl: string
  apiKey: string
}

export async function chatCompletion(
  messages: ChatMessage[],
  model: ModelId,
  systemPrompt?: string | null,
  apiConfig?: ApiConfigPayload | null,
  signal?: AbortSignal,
  onStream?: StreamCallback,
  onReasoningStream?: StreamCallback,
): Promise<{ content: string; reasoningContent: string; role: string }> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, systemPrompt, apiConfig }),
    signal,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(JSON.stringify({
      type: 'API_ERROR',
      details: errorData.details || errorData.error || `HTTP ${response.status}`
    }))
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is null')
  }

  const decoder = new TextDecoder()
  let fullContent = ''
  let fullReasoning = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // Process complete SSE lines
    const lines = buffer.split('\n')
    buffer = lines.pop() || '' // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') continue

      try {
        const parsed = JSON.parse(data)
        if (parsed.type === 'reasoning') {
          fullReasoning += parsed.content
          onReasoningStream?.(fullReasoning)
        } else if (parsed.type === 'content') {
          fullContent += parsed.content
          onStream?.(fullContent)
        }
      } catch {
        // Skip malformed JSON
      }
    }
  }

  return { content: fullContent, reasoningContent: fullReasoning, role: 'assistant' }
}