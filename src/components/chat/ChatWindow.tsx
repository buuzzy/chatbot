'use client'

import React, { useEffect, useRef } from 'react'
import { Message } from '@/types/chat'
import ReactMarkdown from 'react-markdown'
// @ts-ignore
import remarkGfm from 'remark-gfm'

interface ChatWindowProps {
    messages: Message[]
    isLoading: boolean
    error: { type: string; message?: string } | null
}

export function ChatWindow({ messages, isLoading, error }: ChatWindowProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    if (messages.length === 0) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '16px',
                color: 'var(--color-text-muted)',
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    color: '#fff',
                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.25)',
                }}>
                    C
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        margin: '0 0 6px',
                    }}>
                        你好，有什么可以帮你的？
                    </h2>
                    <p style={{ fontSize: '14px', margin: 0 }}>
                        输入你的问题，开始对话
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 0' }}>
            {messages.map((msg, index) => (
                <div
                    key={msg.id || index}
                    className="animate-fade-in-up"
                    style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        padding: '4px 0',
                    }}
                >
                    <div style={{
                        maxWidth: msg.role === 'user' ? '75%' : '85%',
                        padding: msg.role === 'user' ? '10px 16px' : '12px 16px',
                        borderRadius: msg.role === 'user'
                            ? '18px 18px 4px 18px'
                            : '18px 18px 18px 4px',
                        background: msg.role === 'user'
                            ? 'var(--color-user-bubble)'
                            : 'var(--color-ai-bubble)',
                        color: msg.role === 'user'
                            ? 'var(--color-user-bubble-text)'
                            : 'var(--color-ai-bubble-text)',
                        boxShadow: 'var(--shadow-sm)',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        wordBreak: 'break-word',
                    }}>
                        {msg.role === 'user' ? (
                            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                        ) : (
                            <div className="prose" style={{ maxWidth: 'none', fontSize: '14px' }}>
                                <ReactMarkdown
                                    // @ts-ignore
                                    remarkPlugins={[remarkGfm]}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {isLoading && (
                <div className="animate-fade-in-up" style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    padding: '4px 0',
                }}>
                    <div style={{
                        padding: '14px 20px',
                        borderRadius: '18px 18px 18px 4px',
                        background: 'var(--color-ai-bubble)',
                        boxShadow: 'var(--shadow-sm)',
                    }}>
                        <div className="dot-pulse" style={{ display: 'flex', gap: '6px' }}>
                            <span /><span /><span />
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="animate-fade-in-up" style={{
                    margin: '8px auto',
                    padding: '10px 16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--color-error)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                }}>
                    ⚠ {error.message || '发生了错误'}
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    )
}
