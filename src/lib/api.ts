import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: 'sk-dc76621f0d1c4f9cb45064cf944c1455',
  baseURL: 'https://api.deepseek.com',
  dangerouslyAllowBrowser: true
})

const SYSTEM_PROMPT = `请遵循以下要求回答问题：

1. 直接陈述，清晰明了
2. 重点突出，逻辑清晰
3. 语言精炼，避免重复
4. 结论明确，便于理解`

type Role = 'user' | 'assistant' | 'system'

export type ChatMessage = {
  role: Role
  content: string
}

export type StreamCallback = (content: string) => void

export async function chatCompletion(
  messages: ChatMessage[], 
  _signal?: AbortSignal,
  onStream?: StreamCallback
) {
  try {
    console.log('发送请求到 Deepseek API...')
    
    const formattedMessages: { role: Role; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ]

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: formattedMessages as any,
      temperature: 0.7,
      max_tokens: 2000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
      stream: true
    })

    let fullContent = ''
    
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || ''
      fullContent += content
      
      // 每收到新的内容就立即更新UI
      onStream?.(fullContent)
    }

    return { content: fullContent, role: 'assistant' }
  } catch (error) {
    console.error('API 调用错误:', error)
    throw new Error(JSON.stringify({
      type: 'API_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }))
  }
} 