'use client'
import { useState, useEffect } from 'react'
import { Auth } from '@/components/Auth'
import { auth, db } from '@/lib/firebase'
import { User } from 'firebase/auth'
import { 
  collection, 
  query, 
  where, 
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc 
} from 'firebase/firestore'
import { chatCompletion } from '@/lib/api'
import type { Chat, Message } from '@/types/chat'
import { MarkdownContent } from '@/components/MarkdownContent'
import { StatusIndicator } from '@/components/StatusIndicator'
import { signOut } from 'firebase/auth'

// 生成对话标题的函数
const generateTitle = async (content: string) => {
  try {
    const response = await chatCompletion([{
      role: 'user',
      content: `请用5-10个字概括这段对话的主题："${content}"`
    }])
    return response.content || content.slice(0, 20) + '...'
  } catch (error) {
    console.error('生成标题失败:', error)
    return content.slice(0, 20) + '...'
  }
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string>('')
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<{type: 'error' | 'network-error', message?: string} | null>(null)
  const [isLoadingChats, setIsLoadingChats] = useState(true)

  // 监听认证状态
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser)
    return () => unsubscribe()
  }, [])

  // 从 Firestore 加载聊天历史
  useEffect(() => {
    const loadChats = async () => {
      setIsLoadingChats(true)
      
      if (user) {
        // 从 Firestore 加载
        try {
          const chatsRef = collection(db, 'chats')
          const q = query(
            chatsRef,
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          )

          const snapshot = await getDocs(q)
          const loadedChats = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as Chat[]

          setChats(loadedChats)
          if (loadedChats.length > 0) {
            setCurrentChatId(loadedChats[0].id)
          }
        } catch (error) {
          console.error('Error loading chats:', error)
        }
      } else {
        // 从 localStorage 加载
        const localChats = JSON.parse(localStorage.getItem('anonymousChats') || '[]')
        setChats(localChats)
        if (localChats.length > 0) {
          setCurrentChatId(localChats[0].id)
        }
      }
      
      setIsLoadingChats(false)
    }

    loadChats()
  }, [user])

  const currentChat = chats.find(chat => chat.id === currentChatId)

  // 创建新对话
  const handleNewChat = async () => {
    if (!user) return
    
    // 检查是否已有空对话
    const emptyChat = chats.find(chat => chat.messages.length === 0)
    if (emptyChat) {
      // 如果有空对话，高亮显示它
      setCurrentChatId(emptyChat.id)
      // 添加闪烁动画类
      const chatElement = document.querySelector(`[data-chat-id="${emptyChat.id}"]`)
      chatElement?.classList.add('animate-pulse')
      setTimeout(() => {
        chatElement?.classList.remove('animate-pulse')
      }, 2000)
      return
    }

    // 如果没有空对话，创建新对话
    const newChat: Omit<Chat, 'id'> = {
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      userId: user.uid
    }

    const docRef = await addDoc(collection(db, 'chats'), newChat)
    const chatWithId = { ...newChat, id: docRef.id }
    
    setChats(prev => [chatWithId, ...prev])
    setCurrentChatId(docRef.id)
    setInput('')
  }

  // 切换对话
  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId)
  }

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentChatId || !user) return
    
    const userMessageId = `user_${Date.now()}`
    const userMessage: Message = {
      id: userMessageId,
      content: input.trim(),
      role: 'user'
    }
    
    // 先添加用户消息
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
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const recentMessages = apiMessages.slice(-5)

      // 创建AI回复的临时消息
      const assistantMessageId = `assistant_${Date.now()}`
      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, {
              id: assistantMessageId,
              content: '',
              role: 'assistant'
            }]
          }
        }
        return chat
      }))

      // 处理流式响应
      const response = await chatCompletion(
        recentMessages, 
        controller.signal,
        (content) => {
          setChats(prev => prev.map(chat => {
            if (chat.id === currentChatId) {
              const updatedMessages = chat.messages.map(msg => 
                msg.id === assistantMessageId
                  ? { ...msg, content }
                  : msg
              )
              return {
                ...chat,
                messages: updatedMessages
              }
            }
            return chat
          }))
        }
      )

      clearTimeout(timeoutId)
      
      // 更新最终消息
      if (response?.content) {
        setChats(prev => prev.map(chat => {
          if (chat.id === currentChatId) {
            return {
              ...chat,
              title: chat.messages.length <= 2 ? 
                currentInputValue.slice(0, 20) + '...' : 
                chat.title,
              messages: chat.messages.map(msg => 
                msg.id === assistantMessageId
                  ? { ...msg, content: response.content }
                  : msg
              )
            }
          }
          return chat
        }))
      }

      // 更新 Firestore
      const chatRef = doc(db, 'chats', currentChatId)
      const updatedMessages = currentChat?.messages.concat([
        userMessage,
        {
          id: assistantMessageId,
          content: response?.content || '',
          role: 'assistant'
        }
      ])

      // 如果是第一条消息，生成标题
      if (currentChat?.messages.length === 0) {
        const newTitle = await generateTitle(currentInputValue)
        await updateDoc(chatRef, { 
          messages: updatedMessages,
          title: newTitle
        })
        
        setChats(prev => prev.map(chat => 
          chat.id === currentChatId ? {
            ...chat,
            title: newTitle,
            messages: updatedMessages
          } : chat
        ))
      } else {
        await updateDoc(chatRef, { messages: updatedMessages })
        setChats(prev => prev.map(chat => 
          chat.id === currentChatId ? {
            ...chat,
            messages: updatedMessages
          } : chat
        ))
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

  // 添加删除对话的处理函数
  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发选择对话
    
    if (!user) return
    
    try {
      // 删除 Firestore 文档
      await deleteDoc(doc(db, 'chats', chatId))
      
      // 更新本地状态
      setChats(prev => prev.filter(chat => chat.id !== chatId))
      
      // 如果删除的是当前对话，选择第一个对话或清空当前对话
      if (chatId === currentChatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId)
        setCurrentChatId(remainingChats[0]?.id || '')
      }
    } catch (error) {
      console.error('删除对话失败:', error)
    }
  }

  if (!user) {
    return <Auth />
  }

  return (
    <main className="flex h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* 左侧边栏 */}
      <aside className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 hidden md:block">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 animate-pulse"></div>
            <h1 className="font-semibold text-xl">AI Chat</h1>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            退出
          </button>
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
          {isLoadingChats ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              暂无对话历史
            </div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                className="group relative"
              >
                <button
                  data-chat-id={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    chat.id === currentChatId
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="truncate text-sm">
                    {chat.messages.length === 0 ? '新对话' : chat.title}
                  </div>
                </button>
                {/* 删除按钮 */}
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full
                    ${chat.id === currentChatId ? 'text-white' : 'text-gray-500'}
                    opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900 transition-opacity`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))
          )}
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
