import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  console.error('警告: OPENAI_API_KEY 环境变量未设置')
}

const openai = new OpenAI({
  apiKey: apiKey || 'sk-dc76621f0d1c4f9cb45064cf944c1455',
  baseURL: 'https://api.deepseek.com',
  timeout: 15000,
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
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000)

  try {
    console.log('API Key status:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing')
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing API key in environment')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const { messages } = await req.json()
    console.log('Received messages:', messages.length)
    
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format')
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
    const response = await Promise.race([
      openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 2000,
        timeout: 20000,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API Timeout')), 20000)
      )
    ])
    
    clearTimeout(timeoutId)
    
    if (!response.choices[0].message) {
      console.error('No message in API response')
      throw new Error('No response from API')
    }

    console.log('API call successful')
    return NextResponse.json(response.choices[0].message)
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('Detailed API Error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('abort')
    
    return NextResponse.json(
      { 
        error: isTimeout ? 'API request timeout' : 'Failed to get response',
        details: errorMessage
      },
      { status: isTimeout ? 504 : 500 }
    )
  }
}

// 添加 GET 处理以避免 404
export async function GET() {
  return NextResponse.json({ status: 'API is running' })
} 