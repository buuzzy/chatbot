import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const deepseekApiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY

if (!deepseekApiKey) {
  console.error('警告: DEEPSEEK_API_KEY 或 OPENAI_API_KEY 环境变量未设置')
}

// Built-in DeepSeek client
const deepseekClient = new OpenAI({
  apiKey: deepseekApiKey || 'dummy-key-for-build',
  baseURL: 'https://api.deepseek.com'
})

// --- SSE helpers ---
function sseEncode(type: string, content: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ type, content })}\n\n`)
}

function sseDone(): Uint8Array {
  return new TextEncoder().encode('data: [DONE]\n\n')
}

// --- OpenAI-compatible provider stream (DeepSeek / OpenAI / Gemini / Custom) ---
async function streamOpenAICompatible(
  client: OpenAI,
  messages: any[],
  model: string,
  isReasoner: boolean,
) {
  const createParams: any = {
    model,
    messages,
    max_tokens: isReasoner ? 8192 : 2000,
    stream: true,
  }

  if (!isReasoner) {
    createParams.temperature = 0.7
    createParams.presence_penalty = 0.1
    createParams.frequency_penalty = 0.1
  }

  const response = await client.chat.completions.create(createParams) as any

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta
        if (delta?.reasoning_content) {
          controller.enqueue(sseEncode('reasoning', delta.reasoning_content))
        }
        if (delta?.content) {
          controller.enqueue(sseEncode('content', delta.content))
        }
      }
      controller.enqueue(sseDone())
      controller.close()
    },
  })
}

// --- Claude (Anthropic) stream ---
async function streamClaude(
  apiUrl: string,
  apiKey: string,
  messages: any[],
  systemPrompt?: string | null,
) {
  // Anthropic expects system as a top-level param, not in messages
  const systemMessages = messages.filter((m: any) => m.role === 'system')
  const nonSystemMessages = messages.filter((m: any) => m.role !== 'system')
  const systemContent = systemPrompt || systemMessages.map((m: any) => m.content).join('\n') || undefined

  const body: any = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    stream: true,
    messages: nonSystemMessages,
  }
  if (systemContent) {
    body.system = systemContent
  }

  const res = await fetch(`${apiUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown')
    throw new Error(`Claude API error ${res.status}: ${errText}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('Claude response body is null')

  return new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)

            // Claude SSE event types
            if (parsed.type === 'content_block_delta') {
              const delta = parsed.delta
              if (delta?.type === 'text_delta' && delta.text) {
                controller.enqueue(sseEncode('content', delta.text))
              }
              if (delta?.type === 'thinking_delta' && delta.thinking) {
                controller.enqueue(sseEncode('reasoning', delta.thinking))
              }
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      controller.enqueue(sseDone())
      controller.close()
    },
  })
}

// --- Main POST handler ---
export async function POST(req: Request) {
  try {
    const { messages, model = 'deepseek-chat', systemPrompt, apiConfig } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    const recentMessages = messages.slice(-5)
    const cleanMessages = recentMessages.map(({ role, content }: { role: string; content: string }) => ({
      role,
      content,
    }))

    let stream: ReadableStream

    if (apiConfig?.provider === 'claude') {
      // Claude: system prompt handled inside streamClaude
      const messagesWithSystem = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...cleanMessages]
        : cleanMessages

      stream = await streamClaude(apiConfig.apiUrl, apiConfig.apiKey, messagesWithSystem, systemPrompt)
    } else {
      // OpenAI-compatible path: DeepSeek (built-in) / OpenAI / Gemini / Custom
      const isReasoner = model === 'deepseek-reasoner'

      const formattedMessages = [
        ...(!isReasoner && systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...cleanMessages,
      ]

      let client: OpenAI
      let targetModel = model

      if (apiConfig) {
        // User-provided API config (openai / gemini / custom)
        client = new OpenAI({
          apiKey: apiConfig.apiKey,
          baseURL: apiConfig.apiUrl.endsWith('/') ? apiConfig.apiUrl : apiConfig.apiUrl,
        })
        // For user-provided configs, let the provider decide the model
        // We pass the model from the original request; user should set their model on provider side
        targetModel = model
      } else {
        // Built-in DeepSeek
        client = deepseekClient
      }

      stream = await streamOpenAICompatible(client, formattedMessages, targetModel, isReasoner)
    }

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