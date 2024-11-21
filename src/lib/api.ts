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

    // 处理流式响应
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let content = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const text = decoder.decode(value)
        content += text
      }
    }

    return { content }
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
} 