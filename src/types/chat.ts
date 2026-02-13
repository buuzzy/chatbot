export type ModelId = 'deepseek-chat' | 'deepseek-reasoner'

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  userId: string
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  reasoningContent?: string
}