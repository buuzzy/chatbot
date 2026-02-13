'use client'

import { useState } from 'react'
import { Chat } from '@/types/chat'
import type { User } from '@supabase/supabase-js'

interface SidebarProps {
    chats: Chat[]
    currentChatId: string
    onSelectChat: (id: string) => void
    onNewChat: () => void
    onDeleteChat: (id: string) => void
    onRenameChat: (id: string, newTitle: string) => void
    isLoading: boolean
    user: User | null
    onLogout: () => void
}

export function Sidebar({
    chats,
    currentChatId,
    onSelectChat,
    onNewChat,
    onDeleteChat,
    onRenameChat,
    isLoading,
    user,
    onLogout,
}: SidebarProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')

    const startEditing = (chat: Chat) => {
        setEditingId(chat.id)
        setEditValue(chat.messages.length === 0 ? '' : chat.title)
    }

    const commitEdit = () => {
        if (editingId && editValue.trim()) {
            onRenameChat(editingId, editValue.trim())
        }
        setEditingId(null)
    }

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
                        const isEditing = editingId === chat.id
                        const displayTitle = chat.messages.length === 0 ? '新对话' : chat.title

                        return (
                            <div
                                key={chat.id}
                                style={{ position: 'relative', marginBottom: '2px' }}
                                onMouseEnter={e => {
                                    const actions = e.currentTarget.querySelector('[data-actions]') as HTMLElement
                                    if (actions) actions.style.opacity = '1'
                                }}
                                onMouseLeave={e => {
                                    const actions = e.currentTarget.querySelector('[data-actions]') as HTMLElement
                                    if (actions) actions.style.opacity = '0'
                                }}
                            >
                                {isEditing ? (
                                    <input
                                        autoFocus
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') commitEdit()
                                            if (e.key === 'Escape') setEditingId(null)
                                        }}
                                        onBlur={commitEdit}
                                        style={{
                                            width: '100%',
                                            padding: '9px 12px',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid #6366f1',
                                            background: 'rgba(99,102,241,0.1)',
                                            color: '#e2e8f0',
                                            fontSize: '13px',
                                            outline: 'none',
                                            fontFamily: 'var(--font-sans)',
                                        }}
                                    />
                                ) : (
                                    <button
                                        onClick={() => onSelectChat(chat.id)}
                                        onDoubleClick={() => startEditing(chat)}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '10px 56px 10px 12px',
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
                                        }}
                                        onMouseLeave={e => {
                                            if (!isActive) e.currentTarget.style.background = 'transparent'
                                        }}
                                    >
                                        {displayTitle}
                                    </button>
                                )}

                                {/* Action buttons: rename + delete */}
                                {!isEditing && (
                                    <div
                                        data-actions
                                        style={{
                                            position: 'absolute',
                                            right: '6px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            display: 'flex',
                                            gap: '2px',
                                            opacity: 0,
                                            transition: 'opacity 0.15s',
                                        }}
                                    >
                                        {/* Rename */}
                                        <button
                                            onClick={e => { e.stopPropagation(); startEditing(chat) }}
                                            title="重命名"
                                            style={{
                                                background: 'none', border: 'none', color: '#64748b',
                                                cursor: 'pointer', padding: '4px', lineHeight: 0,
                                                transition: 'color 0.15s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.color = '#6366f1' }}
                                            onMouseLeave={e => { e.currentTarget.style.color = '#64748b' }}
                                        >
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                        {/* Delete */}
                                        <button
                                            onClick={e => { e.stopPropagation(); onDeleteChat(chat.id) }}
                                            title="删除"
                                            style={{
                                                background: 'none', border: 'none', color: '#64748b',
                                                cursor: 'pointer', padding: '4px', lineHeight: 0,
                                                transition: 'color 0.15s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
                                            onMouseLeave={e => { e.currentTarget.style.color = '#64748b' }}
                                        >
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* User Footer */}
            <div style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
            }}>
                {user?.user_metadata?.avatar_url ? (
                    <img
                        src={user.user_metadata.avatar_url}
                        alt=""
                        style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0 }}
                    />
                ) : (
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 600, color: '#fff', flexShrink: 0,
                    }}>
                        {(user?.email || 'U')[0].toUpperCase()}
                    </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.user_metadata?.full_name || user?.email || 'User'}
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    title="退出登录"
                    style={{
                        background: 'none', border: 'none', color: '#64748b',
                        cursor: 'pointer', padding: '4px', lineHeight: 0,
                        transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#64748b' }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
