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

const SYSTEM_PROMPT = `请简短回答。`

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
    const MAX_RETRIES = 2
    let retryCount = 0

    async function makeRequest() {
      try {
        return await openai.chat.completions.create({
          model: 'deepseek-chat',
          messages: formattedMessages,
          temperature: 0.3,
          max_tokens: 800,
          presence_penalty: 0,
          frequency_penalty: 0,
          stream: false
        })
      } catch (error) {
        if (retryCount < MAX_RETRIES) {
          retryCount++
          console.log(`Retrying request (${retryCount}/${MAX_RETRIES})...`)
          return makeRequest()
        }
        throw error
      }
    }

    const response = await Promise.race([
      makeRequest(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API Timeout')), 20000)
      )
    ]) as { choices: Array<{ message: { content: string } }> }
    
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