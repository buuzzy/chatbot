'use client'

import { Chat } from '@/types/chat'

interface SidebarProps {
    chats: Chat[]
    currentChatId: string
    onSelectChat: (id: string) => void
    onNewChat: () => void
    onDeleteChat: (id: string) => void
    isLoading: boolean
}

export function Sidebar({
    chats,
    currentChatId,
    onSelectChat,
    onNewChat,
    onDeleteChat,
    isLoading
}: SidebarProps) {
    return (
        <div className="flex flex-col h-full"
            style={{
                background: 'var(--color-bg-sidebar)',
                color: '#e2e8f0',
            }}
        >
            {/* Logo Area */}
            <div style={{ padding: '20px 16px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#fff',
                        flexShrink: 0,
                    }}>
                        C
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '16px', letterSpacing: '-0.02em' }}>Chatbot</span>
                </div>

                <button
                    onClick={onNewChat}
                    style={{
                        width: '100%',
                        padding: '10px 16px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#e2e8f0',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    新对话
                </button>
            </div>

            {/* Chat List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                        <div style={{
                            width: '20px', height: '20px',
                            border: '2px solid rgba(255,255,255,0.1)',
                            borderTopColor: '#6366f1',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                        }} />
                    </div>
                ) : chats.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', padding: '24px 0' }}>
                        暂无对话
                    </div>
                ) : (
                    chats.map(chat => {
                        const isActive = chat.id === currentChatId
                        return (
                            <div key={chat.id} style={{ position: 'relative', marginBottom: '2px' }}>
                                <button
                                    onClick={() => onSelectChat(chat.id)}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '10px 36px 10px 12px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: 'none',
                                        background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                                        color: isActive ? '#c7d2fe' : '#94a3b8',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.15s ease',
                                        display: 'block',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                                        const del = e.currentTarget.parentElement?.querySelector('[data-del]') as HTMLElement
                                        if (del) del.style.opacity = '1'
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) e.currentTarget.style.background = 'transparent'
                                        const del = e.currentTarget.parentElement?.querySelector('[data-del]') as HTMLElement
                                        if (del) del.style.opacity = '0'
                                    }}
                                >
                                    {chat.messages.length === 0 ? '新对话' : chat.title}
                                </button>
                                <button
                                    data-del
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDeleteChat(chat.id)
                                    }}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#64748b',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        opacity: 0,
                                        transition: 'opacity 0.15s, color 0.15s',
                                        lineHeight: 0,
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.opacity = '1' }}
                                    onMouseLeave={e => { e.currentTarget.style.color = '#64748b' }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Footer */}
            <div style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                fontSize: '11px',
                color: '#475569',
                textAlign: 'center',
            }}>
                Powered by DeepSeek
            </div>
        </div>
    )
}
