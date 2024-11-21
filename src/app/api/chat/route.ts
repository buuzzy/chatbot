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
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // 只保留最近的几条消息，减少处理时间
    const recentMessages = messages.slice(-5)
    
    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentMessages
    ]
    
    // 使用流式响应
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: formattedMessages,
      temperature: 0.3,
      max_tokens: 200,
      presence_penalty: 0,
      frequency_penalty: 0,
      stream: true  // 启用流式响应
    })

    // 创建一个 TransformStream 来处理流式响应
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    let counter = 0
    const stream = new TransformStream({
      async transform(chunk, controller) {
        counter++
        if (counter < 2) return // 跳过第一个空消息
        
        const json = decoder.decode(chunk)
        const lines = json.split('\n').filter(line => line.trim() !== '')
        
        for (const line of lines) {
          const message = line.replace(/^data: /, '')
          if (message === '[DONE]') {
            controller.terminate()
            return
          }
          
          try {
            const parsed = JSON.parse(message)
            const text = parsed.choices[0]?.delta?.content || ''
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          } catch (error) {
            console.error('Error parsing chunk:', error)
          }
        }
      }
    })

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 添加 GET 处理以避免 404
export async function GET() {
  return NextResponse.json({ status: 'API is running' })
} 