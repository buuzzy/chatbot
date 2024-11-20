export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function chatCompletion(messages: ChatMessage[], signal?: AbortSignal) {
  try {
    const timeoutId = setTimeout(() => {
      if (!signal?.aborted) {
        const controller = new AbortController()
        controller.abort()
      }
    }, 25000)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
        signal
      })
      
      if (response.status === 504) {
        throw new Error('TIMEOUT')
      }

      let data
      if (!response.ok) {
        data = await response.json().catch(() => ({}))
        throw new Error(JSON.stringify({
          type: 'API_ERROR',
          status: response.status,
          details: data?.error || 'Unknown error'
        }))
      }

      data = await response.json()
      
      if (data.error) {
        throw new Error(JSON.stringify({
          type: 'API_ERROR',
          details: data.error
        }))
      }
      
      return data
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    console.error('API Error:', error)
    if (error instanceof Error) {
      if (error.message === 'TIMEOUT') {
        throw new Error(JSON.stringify({
          type: 'TIMEOUT',
          details: '请求超时，请重试'
        }))
      }
      if (error.message === 'PARSE_ERROR') {
        throw new Error(JSON.stringify({
          type: 'PARSE_ERROR',
          details: '服务器响应格式错误'
        }))
      }
    }
    throw error
  }
} 