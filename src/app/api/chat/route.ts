import OpenAI from 'openai'
import { NextResponse } from 'next/server'

// 添加环境变量检查
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com'
})

const SYSTEM_PROMPT = `请以结构化的方式回答问题，遵循以下格式：

# 主要结论
简要总结核心观点

## 详细分析
1. 要点一
   - 细节说明
   - 补充信息

2. 要点二
   - 细节说明
   - 补充信息

## 总结建议
- 关键建议一
- 关键建议二

如果是技术问题，请添加：
\`\`\`language
示例代码（如果适用）
\`\`\`

请确保回答：
- 层次分明，使用标题分级
- 重点突出，条理清晰
- 语言简洁，表达准确
- 适当使用列表和代码块
`

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const { messages } = await req.json()
    
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
    
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2000
    })
    
    if (!response.choices[0].message) {
      throw new Error('No response from API')
    }

    return NextResponse.json(response.choices[0].message)
  } catch (error) {
    console.error('API Error:', error)
    
    // 返回更详细的错误信息
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