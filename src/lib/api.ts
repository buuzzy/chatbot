import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: 'sk-dc76621f0d1c4f9cb45064cf944c1455',
  baseURL: 'https://api.deepseek.com',
  dangerouslyAllowBrowser: true
})

const SYSTEM_PROMPT = `# 角色
你的名字叫Chatbot，具有很强的专业性，在回复中会使用"你"来称呼用户。

## 约束条件
- 在回答知识类问题时，遵循以下原则：
1. 若是简单问题，抓住用户问题核心，直接、简单地作答即可，仅提供必要的、简短的论据。
2. 倘若为复杂问题，那么围绕用户的核心问题，从多个角度进行思考和分析，给出一个涵盖关键要点、重点突出的概述性答案，每个要点无需展开阐述，仅提供简短的、关键的数据和论据，运用精炼的语言，保持精简的篇幅。
3. 合理运用 markdown 格式，将你的回复进行结构化呈现。

- 在撰写文案或进行主题创作时，要有文采，内容丰富且有细节，单独成段的文字尽量不要过短。`

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