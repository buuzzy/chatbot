export type ModelId = 'deepseek-chat' | 'deepseek-reasoner'

export type ApiProvider = 'openai' | 'claude' | 'gemini' | 'custom'

export interface SystemPrompt {
  id: string
  userId: string
  name: string
  content: string
  isPreset: boolean
  createdAt: number
}

export interface ApiConfig {
  id: string
  userId: string
  provider: ApiProvider
  name: string
  apiUrl: string
  apiKey: string
  isActive: boolean
  createdAt: number
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  userId: string
  promptId?: string | null
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  reasoningContent?: string
}