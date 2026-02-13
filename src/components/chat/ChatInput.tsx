'use client'

import React, { useRef } from 'react'

interface ChatInputProps {
    onSend: (content: string) => void
    isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSubmit = () => {
        if (!textareaRef.current) return
        const content = textareaRef.current.value.trim()
        if (content && !isLoading) {
            onSend(content)
            textareaRef.current.value = ''
            textareaRef.current.style.height = 'auto'
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
        }
    }

    return (
        <div style={{
            maxWidth: '768px',
            margin: '0 auto',
            padding: '12px 16px 20px',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '8px 8px 8px 16px',
                boxShadow: 'var(--shadow-md)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
                onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-light)'
                }}
                onBlur={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }}
            >
                <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder="输入消息..."
                    onKeyDown={handleKeyDown}
                    onChange={adjustHeight}
                    disabled={isLoading}
                    style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        background: 'transparent',
                        color: 'var(--color-text)',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        padding: '6px 0',
                        maxHeight: '160px',
                        fontFamily: 'var(--font-sans)',
                    }}
                />
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        border: 'none',
                        background: isLoading ? 'var(--color-text-muted)' : 'var(--color-accent)',
                        color: '#fff',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background 0.15s ease, transform 0.1s ease',
                    }}
                    onMouseDown={e => { if (!isLoading) e.currentTarget.style.transform = 'scale(0.93)' }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
            <p style={{
                textAlign: 'center',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                marginTop: '8px',
            }}>
                AI 可能产生不准确的信息，请注意甄别
            </p>
        </div>
    )
}
