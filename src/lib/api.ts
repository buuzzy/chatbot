import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: 'sk-dc76621f0d1c4f9cb45064cf944c1455',
  baseURL: 'https://api.deepseek.com',
  dangerouslyAllowBrowser: true
})

const SYSTEM_PROMPT = `请以清晰的结构化方式回答问题，遵循以下格式：

# 简要总结
用一到两句话概括核心观点

## 详细说明
### 1. 主要观点
- 具体论述
- 实例说明
- 补充信息

### 2. 次要观点
- 具体论述
- 实例说明
- 补充信息

## 实践建议
1. 关键建议一
   - 操作要点
   - 注意事项

2. 关键建议二
   - 操作要点
   - 注意事项

如果涉及技术实现，请给出代码示例：
\`\`\`language
代码示例
\`\`\`

回答要求：
1. 层次分明，逻辑清晰
2. 重点突出，案例具体
3. 语言精炼，表达准确
4. 理论结合实践
5. 适当使用编号和缩进
6. 确保内容完整，不要因字数限制而突然截断`

type Role = 'user' | 'assistant' | 'system'

export type ChatMessage = {
  role: Role
  content: string
}

export async function chatCompletion(messages: ChatMessage[], _signal?: AbortSignal) {
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