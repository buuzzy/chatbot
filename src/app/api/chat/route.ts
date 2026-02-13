import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY

if (!apiKey) {
  console.error('警告: DEEPSEEK_API_KEY 或 OPENAI_API_KEY 环境变量未设置')
}

const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key-for-build',
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

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    const recentMessages = messages.slice(-5)

    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentMessages
    ]

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: formattedMessages as any,
      temperature: 0.7,
      max_tokens: 2000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
      stream: true,
    })

    // Create a TransformStream to handle the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            controller.enqueue(new TextEncoder().encode(content))
          }
        }
        controller.close()
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

// 添加 GET 处理以避免 404
export async function GET() {
  return NextResponse.json({ status: 'API is running' })
} 