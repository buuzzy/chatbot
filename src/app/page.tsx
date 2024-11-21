'use client'
import { useState, useEffect } from 'react'
import { chatCompletion } from '@/lib/api'
import type { Chat, Message } from '@/types/chat'
import { MarkdownContent } from '@/components/MarkdownContent'
import { StatusIndicator } from '@/components/StatusIndicator'

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string>('')
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<{type: 'error' | 'network-error', message?: string} | null>(null)

  // 从 localStorage 加载聊天历史
  useEffect(() => {
    const savedChats = localStorage.getItem('chats')
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats)
      setChats(parsedChats)
      if (parsedChats.length > 0) {
        setCurrentChatId(parsedChats[0].id)
      }
    } else {
      // 如果没有保存的对话，自动创建一个新对话
      handleNewChat()
    }
  }, [])

  // 保存聊天历史到 localStorage
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('chats', JSON.stringify(chats))
    }
  }, [chats])

  const currentChat = chats.find(chat => chat.id === currentChatId)

  // 创建新对话
  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      createdAt: Date.now()
    }
    setChats(prev => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    setInput('')
  }

  // 切换对话
  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId)
  }

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentChatId) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user'
    }
    
    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        return {
          ...chat,
          messages: [...chat.messages, userMessage]
        }
      }
      return chat
    }))
    
    const currentInputValue = input.trim()
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const apiMessages = currentChat?.messages.map(({ role, content }) => ({
        role,
        content
      })) || []
      
      apiMessages.push({ role: 'user', content: currentInputValue })
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时
      
      const recentMessages = apiMessages.slice(-5)  // 只保留最近5条消息
      
      const response = await chatCompletion(recentMessages, controller.signal)
      clearTimeout(timeoutId)
      
      if (response?.content) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.content,
          role: 'assistant'
        }
        
        setChats(prev => prev.map(chat => {
          if (chat.id === currentChatId) {
            const title = chat.messages.length === 0 ? 
              currentInputValue.slice(0, 20) + '...' : 
              chat.title
            
            return {
              ...chat,
              title,
              messages: [...chat.messages, aiMessage]
            }
          }
          return chat
        }))
      }
    } catch (error) {
      console.error('Chat error:', error)
      
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message)
          
          if (errorData.type === 'TIMEOUT_ERROR') {
            setError({ 
              type: 'error', 
              message: '服务器响应超时，请稍后重试'
            })
          } else if (!navigator.onLine) {
            setError({ type: 'network-error' })
          } else {
            setError({ 
              type: 'error', 
              message: errorData.details || '服务器响应错误'
            })
          }
        } catch {
          setError({ 
            type: 'error', 
            message: '发生未知错误'
          })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 处理回车发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <main className="flex h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* 左侧边栏 */}
      <aside className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-blue-500 animate-pulse"></div>
          <h1 className="font-semibold text-xl">AI Chat</h1>
        </div>
        
        <button 
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors mb-4"
        >
          <span className="text-sm">新对话</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* 对话历史列表 */}
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                chat.id === currentChatId
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="truncate text-sm">{chat.title}</div>
            </button>
          ))}
        </div>
      </aside>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部栏 */}
        <header className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
          <button className="md:hidden mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="font-medium">新对话</h2>
        </header>

        {/* 聊天内容区 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-2xl mx-auto">
            {!currentChat?.messages.length ? (
              // 欢迎信息
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-blue-500 mx-auto mb-4 animate-pulse"></div>
                <h1 className="text-4xl font-bold mb-4">欢迎使用 AI Chat</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  探索AI的无限可能，开始一场智能对话
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentChat.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <MarkdownContent content={message.content} />
                    </div>
                  </div>
                ))}
                {(isLoading || error) && (
                  <div className="flex justify-start">
                    <StatusIndicator 
                      status={error ? error.type : 'loading'}
                      message={error?.message}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部输入框 */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-2xl mx-auto">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }} 
              className="relative"
            >
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={1}
                placeholder="输入消息..."
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
