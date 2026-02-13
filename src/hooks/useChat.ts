import { useState, useEffect, useCallback, useRef } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { chatCompletion } from '@/lib/api'
import { Chat, Message, ModelId } from '@/types/chat'
import type { User } from '@supabase/supabase-js'

const supabase = createBrowserSupabaseClient()

export function useChat() {
    const [user, setUser] = useState<User | null>(null)
    const [chats, setChats] = useState<Chat[]>([])
    const [currentChatId, setCurrentChatId] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<{ type: 'error' | 'network-error'; message?: string } | null>(null)
    const [isLoadingChats, setIsLoadingChats] = useState(true)
    const [currentModel, setCurrentModel] = useState<ModelId>('deepseek-chat')
    const abortControllerRef = useRef<AbortController | null>(null)

    // Auth listener
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    // Load chats from Supabase
    const loadChats = useCallback(async () => {
        if (!user) {
            setChats([])
            setCurrentChatId('')
            setIsLoadingChats(false)
            return
        }

        setIsLoadingChats(true)
        try {
            const { data, error: fetchError } = await supabase
                .from('chats')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError

            const loadedChats: Chat[] = (data || []).map((row: any) => ({
                id: row.id,
                title: row.title,
                messages: row.messages || [],
                createdAt: new Date(row.created_at).getTime(),
                userId: row.user_id,
            }))

            setChats(loadedChats)
            if (loadedChats.length > 0 && !currentChatId) {
                setCurrentChatId(loadedChats[0].id)
            }
        } catch (err) {
            console.error('Failed to load chats:', err)
        } finally {
            setIsLoadingChats(false)
        }
    }, [user, currentChatId])

    useEffect(() => {
        loadChats()
    }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

    // Create new chat
    const handleNewChat = async () => {
        if (!user) return

        // Reuse empty chat if exists
        const emptyChat = chats.find(chat => chat.messages.length === 0)
        if (emptyChat) {
            setCurrentChatId(emptyChat.id)
            return
        }

        try {
            const { data, error: insertError } = await supabase
                .from('chats')
                .insert({ user_id: user.id, title: 'New Chat', messages: [] })
                .select()
                .single()

            if (insertError) throw insertError

            const newChat: Chat = {
                id: data.id,
                title: data.title,
                messages: [],
                createdAt: new Date(data.created_at).getTime(),
                userId: data.user_id,
            }

            setChats(prev => [newChat, ...prev])
            setCurrentChatId(newChat.id)
        } catch (err) {
            console.error('Create chat failed:', err)
        }
    }

    // Delete chat
    const handleDeleteChat = async (chatId: string) => {
        if (!user) return

        try {
            const { error: deleteError } = await supabase
                .from('chats')
                .delete()
                .eq('id', chatId)

            if (deleteError) throw deleteError

            setChats(prev => prev.filter(c => c.id !== chatId))
            if (chatId === currentChatId) {
                const remaining = chats.filter(c => c.id !== chatId)
                setCurrentChatId(remaining[0]?.id || '')
            }
        } catch (err) {
            console.error('Delete chat failed:', err)
        }
    }

    // Rename chat
    const handleRenameChat = async (chatId: string, newTitle: string) => {
        if (!user || !newTitle.trim()) return

        try {
            const { error: updateError } = await supabase
                .from('chats')
                .update({ title: newTitle.trim() })
                .eq('id', chatId)

            if (updateError) throw updateError

            setChats(prev =>
                prev.map(c => c.id === chatId ? { ...c, title: newTitle.trim() } : c)
            )
        } catch (err) {
            console.error('Rename chat failed:', err)
        }
    }

    // Send message
    const handleSendMessage = async (content: string, systemPrompt?: string | null) => {
        if (!content.trim() || isLoading || !currentChatId || !user) return

        const userMessage: Message = {
            id: `user_${Date.now()}`,
            content: content.trim(),
            role: 'user',
        }

        setIsLoading(true)
        setError(null)

        try {
            const chat = chats.find(c => c.id === currentChatId)
            const history = chat?.messages || []
            const apiMessages = [
                ...history.map(({ role, content }) => ({ role, content })),
                { role: 'user', content: content.trim() },
            ]

            const assistantMessageId = `assistant_${Date.now()}`

            // Add user message + assistant placeholder in one shot
            setChats(prev =>
                prev.map(c =>
                    c.id === currentChatId
                        ? {
                            ...c,
                            messages: [
                                ...c.messages,
                                userMessage,
                                { id: assistantMessageId, role: 'assistant' as const, content: '' },
                            ],
                        }
                        : c
                )
            )

            const controller = new AbortController()
            abortControllerRef.current = controller

            const response = await chatCompletion(
                apiMessages.slice(-10) as any,
                currentModel,
                systemPrompt,
                controller.signal,
                (streamContent) => {
                    setChats(prev =>
                        prev.map(c => {
                            if (c.id === currentChatId) {
                                return {
                                    ...c,
                                    messages: c.messages.map(m =>
                                        m.id === assistantMessageId ? { ...m, content: streamContent } : m
                                    ),
                                }
                            }
                            return c
                        })
                    )
                },
                (reasoningContent) => {
                    setChats(prev =>
                        prev.map(c => {
                            if (c.id === currentChatId) {
                                return {
                                    ...c,
                                    messages: c.messages.map(m =>
                                        m.id === assistantMessageId ? { ...m, reasoningContent } : m
                                    ),
                                }
                            }
                            return c
                        })
                    )
                }
            )

            // Build final messages
            const finalMessages: Message[] = [
                ...history,
                userMessage,
                {
                    id: assistantMessageId,
                    role: 'assistant' as const,
                    content: response.content,
                    ...(response.reasoningContent ? { reasoningContent: response.reasoningContent } : {}),
                },
            ]

            // Auto-title
            let newTitle = chat?.title
            if (history.length === 0) {
                newTitle = content.slice(0, 30)
            }

            // Save to Supabase
            const { error: updateError } = await supabase
                .from('chats')
                .update({ messages: finalMessages, title: newTitle })
                .eq('id', currentChatId)

            if (updateError) console.error('Save failed:', updateError)

            setChats(prev =>
                prev.map(c =>
                    c.id === currentChatId
                        ? { ...c, messages: finalMessages, title: newTitle || 'New Chat' }
                        : c
                )
            )
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                // User stopped generation — save partial content
                const chat = chats.find(c => c.id === currentChatId)
                if (chat) {
                    const currentMessages = chat.messages
                    await supabase
                        .from('chats')
                        .update({ messages: currentMessages })
                        .eq('id', currentChatId)
                }
            } else {
                console.error(err)
                setError({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
            }
        } finally {
            abortControllerRef.current = null
            setIsLoading(false)
        }
    }

    // Stop generation
    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
    }

    // Logout
    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setChats([])
        setCurrentChatId('')
        window.location.href = '/login'
    }

    return {
        user,
        chats,
        currentChatId,
        setCurrentChatId,
        currentModel,
        setCurrentModel,
        isLoading,
        isLoadingChats,
        error,
        handleNewChat,
        handleDeleteChat,
        handleRenameChat,
        handleSendMessage,
        handleStopGeneration,
        handleLogout,
    }
}
