import { useState, useEffect } from 'react'
import { chatCompletion } from '@/lib/api'
import { Chat, Message } from '@/types/chat'
// Local User definition to replace Firebase User
interface User {
    uid: string
    email: string | null
    displayName: string | null
    photoURL: string | null
}

// Mock User for local dev
const MOCK_USER: User = {
    uid: 'local-user',
    email: 'local@dev.com',
    displayName: 'Local Developer',
    photoURL: null
}

const STORAGE_KEY = 'local_chats_v1'

export function useChat() {
    const [user] = useState<User | null>(MOCK_USER) // Always logged in as mock user
    const [chats, setChats] = useState<Chat[]>([])
    const [currentChatId, setCurrentChatId] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<{ type: 'error' | 'network-error', message?: string } | null>(null)
    const [isLoadingChats, setIsLoadingChats] = useState(true)

    // Load chats from LocalStorage
    useEffect(() => {
        setIsLoadingChats(true)
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsedChats = JSON.parse(stored)
                setChats(parsedChats)
                if (parsedChats.length > 0) {
                    setCurrentChatId(parsedChats[0].id)
                }
            }
        } catch (err) {
            console.error('Failed to load chats from local storage', err)
        } finally {
            setIsLoadingChats(false)
        }
    }, [])

    // Save chats to LocalStorage whenever they change
    useEffect(() => {
        if (!isLoadingChats) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
        }
    }, [chats, isLoadingChats])

    const handleNewChat = () => {
        const emptyChat = chats.find(chat => chat.messages.length === 0)
        if (emptyChat) {
            setCurrentChatId(emptyChat.id)
            return
        }

        const newChat: Chat = {
            id: `chat_${Date.now()}`,
            title: 'New Chat',
            messages: [],
            createdAt: Date.now(),
            userId: MOCK_USER.uid
        }

        setChats(prev => [newChat, ...prev])
        setCurrentChatId(newChat.id)
    }

    const handleDeleteChat = (chatId: string) => {
        setChats(prev => prev.filter(c => c.id !== chatId))
        if (chatId === currentChatId) {
            const remaining = chats.filter(c => c.id !== chatId)
            setCurrentChatId(remaining[0]?.id || '')
        }
    }

    const handleSendMessage = async (content: string) => {
        if (!content.trim() || isLoading || !currentChatId) return

        const userMessage: Message = {
            id: `user_${Date.now()}`,
            content: content.trim(),
            role: 'user'
        }

        setIsLoading(true)
        setError(null)

        try {
            const chat = chats.find(c => c.id === currentChatId)
            const history = chat?.messages || []
            const apiMessages = [...history.map(({ role, content }) => ({ role, content })), { role: 'user', content: content.trim() }]

            const assistantMessageId = `assistant_${Date.now()}`

            // Add user message + assistant placeholder in one shot
            setChats(prev => prev.map(c =>
                c.id === currentChatId
                    ? { ...c, messages: [...c.messages, userMessage, { id: assistantMessageId, role: 'assistant', content: '' }] }
                    : c
            ))

            const controller = new AbortController()

            const response = await chatCompletion(
                apiMessages.slice(-10) as any,
                controller.signal,
                (streamContent) => {
                    setChats(prev => prev.map(c => {
                        if (c.id === currentChatId) {
                            return {
                                ...c,
                                messages: c.messages.map(m => m.id === assistantMessageId ? { ...m, content: streamContent } : m)
                            }
                        }
                        return c
                    }))
                }
            )

            // Final update
            const finalMessages = [
                ...history,
                userMessage,
                { id: assistantMessageId, role: 'assistant' as const, content: response.content }
            ]

            // Auto-title
            let newTitle = chat?.title
            if (history.length === 0) {
                newTitle = content.slice(0, 30)
            }

            setChats(prev => prev.map(c =>
                c.id === currentChatId ? { ...c, messages: finalMessages, title: newTitle || 'New Chat' } : c
            ))

        } catch (err) {
            console.error(err)
            setError({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
        } finally {
            setIsLoading(false)
        }
    }

    return {
        user, // Always present
        chats,
        currentChatId,
        setCurrentChatId,
        isLoading,
        isLoadingChats,
        error,
        handleNewChat,
        handleDeleteChat,
        handleSendMessage
    }
}
