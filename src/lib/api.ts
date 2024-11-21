export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function chatCompletion(messages: ChatMessage[], signal?: AbortSignal) {
  try {
    console.log('发送请求到 API...')
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
      signal
    })
    
    console.log('API 响应状态:', response.status)
    
    if (response.status === 504) {
      throw new Error(JSON.stringify({
        type: 'TIMEOUT_ERROR',
        status: 504,
        details: '服务器响应超时，请重试'
      }))
    }
    
    const data = await response.json().catch(() => ({ 
      error: '无法解析服务器响应' 
    }))
    
    if (!response.ok) {
      throw new Error(JSON.stringify({
        type: 'API_ERROR',
        status: response.status,
        details: data.error || 'Unknown error'
      }))
    }

    return data
  } catch (error) {
    console.error('API 调用错误:', error)
    throw error
  }
} 