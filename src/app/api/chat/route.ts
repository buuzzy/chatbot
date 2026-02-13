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


export async function POST(req: Request) {
  try {
    const { messages, model = 'deepseek-chat', systemPrompt } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    const isReasoner = model === 'deepseek-reasoner'
    const recentMessages = messages.slice(-5)

    // Strip reasoning_content from messages to avoid 400 error
    const cleanMessages = recentMessages.map(({ role, content }: { role: string; content: string }) => ({
      role,
      content,
    }))

    const formattedMessages = [
      // Use client-provided systemPrompt if available; skip for reasoner
      ...(!isReasoner && systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...cleanMessages,
    ]

    // Reasoner: no temperature/top_p/penalty params
    const createParams: any = {
      model,
      messages: formattedMessages,
      max_tokens: isReasoner ? 8192 : 2000,
      stream: true,
    }

    if (!isReasoner) {
      createParams.temperature = 0.7
      createParams.presence_penalty = 0.1
      createParams.frequency_penalty = 0.1
    }

    const response = await openai.chat.completions.create(createParams) as any

    // SSE stream: differentiate reasoning_content vs content
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        for await (const chunk of response) {
          const delta = chunk.choices[0]?.delta

          // Reasoning content (thinking chain)
          if (delta?.reasoning_content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'reasoning', content: delta.reasoning_content })}\n\n`)
            )
          }

          // Final content
          if (delta?.content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`)
            )
          }
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
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

export async function GET() {
  return NextResponse.json({ status: 'API is running' })
}