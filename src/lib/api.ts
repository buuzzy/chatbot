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
      const errorData = await response.json()
      throw new Error(JSON.stringify({
        type: 'API_ERROR',
        status: response.status,
        details: errorData.error || 'Unknown error'
      }))
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
} 