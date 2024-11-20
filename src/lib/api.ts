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
      signal,
      timeout: 25000
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      if (response.status === 504) {
        throw new Error('API request timeout')
      }
      throw new Error(JSON.stringify(data))
    }
    
    if (data.error) {
      throw new Error(JSON.stringify(data))
    }
    
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
} 