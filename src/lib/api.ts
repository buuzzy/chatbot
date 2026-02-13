/**
 * Chat API client - calls our own /api/chat route (server-side)
 * instead of directly calling DeepSeek from the browser.
 */

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type StreamCallback = (content: string) => void

export async function chatCompletion(
  messages: ChatMessage[],
  signal?: AbortSignal,
  onStream?: StreamCallback
): Promise<{ content: string; role: string }> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(JSON.stringify({
      type: 'API_ERROR',
      details: errorData.details || errorData.error || `HTTP ${response.status}`
    }))
  }

  // Handle streaming response
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is null')
  }

  const decoder = new TextDecoder()
  let fullContent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    fullContent += chunk
    onStream?.(fullContent)
  }

  return { content: fullContent, role: 'assistant' }
}