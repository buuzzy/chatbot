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

const SYSTEM_PROMPT = `请简短回答，限制在100字以内。`

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