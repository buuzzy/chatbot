'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Message } from '@/types/chat'
import ReactMarkdown from 'react-markdown'
// @ts-ignore
import remarkGfm from 'remark-gfm'
import hljs from 'highlight.js/lib/core'
// Register common languages to keep bundle small
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import sql from 'highlight.js/lib/languages/sql'
import markdown from 'highlight.js/lib/languages/markdown'
import 'highlight.js/styles/github-dark.css'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('tsx', typescript)
hljs.registerLanguage('jsx', javascript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)

interface ChatWindowProps {
    messages: Message[]
    isLoading: boolean
    error: { type: string; message?: string } | null
}

function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
    const [copied, setCopied] = useState(false)
    const code = String(children).replace(/\n$/, '')
    const langMatch = className?.match(/language-(\w+)/)
    const lang = langMatch?.[1]

    let highlighted: string
    if (lang && hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(code, { language: lang }).value
    } else {
        highlighted = hljs.highlightAuto(code).value
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', margin: '8px 0' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 12px',
                background: '#1e1e2e',
                fontSize: '11px',
                color: '#888',
            }}>
                <span>{lang || 'code'}</span>
                <button
                    onClick={handleCopy}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: copied ? '#4ade80' : '#888',
                        cursor: 'pointer',
                        fontSize: '11px',
                        padding: '2px 6px',
                        transition: 'color 0.15s',
                    }}
                >
                    {copied ? '✓ 已复制' : '复制'}
                </button>
            </div>
            <pre style={{
                margin: 0,
                padding: '12px',
                background: '#0d1117',
                overflowX: 'auto',
                fontSize: '13px',
                lineHeight: '1.5',
            }}>
                <code
                    className={`hljs ${lang ? `language-${lang}` : ''}`}
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                />
            </pre>
        </div>
    )
}
function ThinkingBlock({ content, isStreaming }: { content: string; isStreaming: boolean }) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div style={{
            marginBottom: '8px',
            borderRadius: '12px',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            background: 'rgba(139, 92, 246, 0.04)',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#8b5cf6',
                    textAlign: 'left',
                }}
            >
                <span style={{
                    transition: 'transform 0.2s',
                    transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    display: 'inline-block',
                    fontSize: '10px',
                }}>
                    ▼
                </span>
                <span>🧠 思考过程</span>
                {isStreaming && (
                    <span style={{
                        display: 'inline-block',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#8b5cf6',
                        animation: 'pulse-dot 1.2s ease-in-out infinite',
                        marginLeft: '4px',
                    }} />
                )}
            </button>

            {/* Content */}
            {!collapsed && (
                <div style={{
                    padding: '0 12px 10px',
                    fontSize: '13px',
                    lineHeight: '1.7',
                    color: 'var(--color-text-secondary)',
                    fontStyle: 'italic',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '400px',
                    overflowY: 'auto',
                }}>
                    {content}
                </div>
            )}
        </div>
    )
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
            {messages.map((msg, index) => {
                const isLastAssistant = msg.role === 'assistant' && index === messages.length - 1

                return (
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
                                <>
                                    {/* Thinking process */}
                                    {msg.reasoningContent && (
                                        <ThinkingBlock
                                            content={msg.reasoningContent}
                                            isStreaming={isLastAssistant && isLoading && !msg.content}
                                        />
                                    )}

                                    {/* Final answer */}
                                    <div className="prose" style={{ maxWidth: 'none', fontSize: '14px' }}>
                                        <ReactMarkdown
                                            // @ts-ignore
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code({ className, children, ...props }: any) {
                                                    const isInline = !className && typeof children === 'string' && !children.includes('\n')
                                                    if (isInline) {
                                                        return <code style={{
                                                            background: 'rgba(110,118,129,0.2)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.9em',
                                                        }} {...props}>{children}</code>
                                                    }
                                                    return <CodeBlock className={className}>{children}</CodeBlock>
                                                },
                                                pre({ children }: any) {
                                                    return <>{children}</>
                                                },
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )
            })}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
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
