import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  console.error('警告: OPENAI_API_KEY 环境变量未设置')
}

const openai = new OpenAI({
  apiKey: apiKey || 'sk-dc76621f0d1c4f9cb45064cf944c1455',
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
- 关键建议2

如果涉及代码，请使用代码块：
\`\`\`language
代码示例
\`\`\`

要求：
- 层次分明，使用标题分级
- 重点突出，条理清晰
- 语言简洁，表达准确
- 适当使用列表和代码块
- 总字数控制在300字以内`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    console.log('Received messages:', messages.length)
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ]
    
    console.log('Calling Deepseek API...')
    
    // 使用 Promise.race 来处理超时
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 8000)
    })

    const responsePromise = openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: formattedMessages,
      temperature: 0.3,     // 降低创造性，加快响应
      max_tokens: 200,      // 进一步限制回答长度
      presence_penalty: 0,
      frequency_penalty: 0
    })

    const response = await Promise.race([responsePromise, timeoutPromise]) as Awaited<typeof responsePromise>
    
    if (!response.choices[0].message) {
      throw new Error('No response from API')
    }

    console.log('API call successful')
    return NextResponse.json(response.choices[0].message)
  } catch (error) {
    console.error('API Error:', error)
    const isTimeout = error instanceof Error && error.message === 'Request timeout'
    
    return NextResponse.json(
      { 
        error: isTimeout ? 'Request timeout' : 'Failed to get response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: isTimeout ? 504 : 500 }
    )
  }
}

// 添加 GET 处理以避免 404
export async function GET() {
  return NextResponse.json({ status: 'API is running' })
} 