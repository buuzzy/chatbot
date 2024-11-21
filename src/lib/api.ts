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
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('API 错误:', errorData)
      throw new Error(JSON.stringify({
        type: 'API_ERROR',
        status: response.status,
        details: errorData.error || 'Unknown error'
      }))
    }

    const data = await response.json()
    console.log('API 响应数据:', data)
    return data
  } catch (error) {
    console.error('API 调用错误:', error)
    throw error
  }
} 