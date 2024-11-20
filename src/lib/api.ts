export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function chatCompletion(messages: ChatMessage[], signal?: AbortSignal) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
      signal
    })
    
    if (!response.ok) {
      throw new Error('API request failed')
    }
    
    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
} 