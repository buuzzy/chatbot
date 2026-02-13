export type ModelId = 'deepseek-chat' | 'deepseek-reasoner'

export interface SystemPrompt {
  id: string
  userId: string
  name: string
  content: string
  isPreset: boolean
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