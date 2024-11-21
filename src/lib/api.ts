import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: 'sk-dc76621f0d1c4f9cb45064cf944c1455',
  baseURL: 'https://api.deepseek.com'
})

const SYSTEM_PROMPT = `请以结构化的方式回答问题，遵循以下格式：
# 核心结论
用一句话总结关键点

## 详细分析
1. 第一个要点
   - 具体说明
   - 补充信息

2. 第二个要点
   - 具体说明
   - 补充信息

## 建议方案
- 关键建议1
- 关键建议2`

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function chatCompletion(messages: ChatMessage[], _signal?: AbortSignal) {
  try {
    console.log('发送请求到 Deepseek API...')
    
    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ]

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: formattedMessages,
      temperature: 0.3,
      max_tokens: 200,
      presence_penalty: 0,
      frequency_penalty: 0,
      stream: false
    })

    if (!response.choices[0].message) {
      throw new Error('No response from API')
    }

    return response.choices[0].message
  } catch (error) {
    console.error('API 调用错误:', error)
    throw new Error(JSON.stringify({
      type: 'API_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }))
  }
} 