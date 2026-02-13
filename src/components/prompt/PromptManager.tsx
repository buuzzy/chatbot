'use client'

import React, { useState } from 'react'
import { SystemPrompt } from '@/types/chat'

interface PromptManagerProps {
    prompts: SystemPrompt[]
    activePromptId: string | null
    onSelect: (id: string | null) => void
    onCreate: (name: string, content: string) => Promise<SystemPrompt | null>
    onUpdate: (id: string, name: string, content: string) => Promise<void>
    onDelete: (id: string) => Promise<void>
    onClose: () => void
}

export function PromptManager({
    prompts,
    activePromptId,
    onSelect,
    onCreate,
    onUpdate,
    onDelete,
    onClose,
}: PromptManagerProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editContent, setEditContent] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [newName, setNewName] = useState('')
    const [newContent, setNewContent] = useState('')

    const startEdit = (p: SystemPrompt) => {
        setEditingId(p.id)
        setEditName(p.name)
        setEditContent(p.content)
    }

    const commitEdit = async () => {
        if (editingId && editName.trim() && editContent.trim()) {
            await onUpdate(editingId, editName.trim(), editContent.trim())
        }
        setEditingId(null)
    }

    const handleCreate = async () => {
        if (newName.trim() && newContent.trim()) {
            await onCreate(newName.trim(), newContent.trim())
            setNewName('')
            setNewContent('')
            setIsCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('确定删除这个 Prompt 吗？')) {
            await onDelete(id)
        }
    }

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 100,
                }}
            />

            {/* Modal */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(520px, 90vw)',
                maxHeight: '80vh',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
                zIndex: 101,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--color-border)',
                }}>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
                        System Prompt 管理
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none', color: 'var(--color-text-muted)',
                            cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '4px',
                        }}
                    >×</button>
                </div>

                {/* Body — scrollable */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
                    {/* "No prompt" option */}
                    <button
                        onClick={() => onSelect(null)}
                        style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1px solid',
                            borderColor: activePromptId === null ? 'var(--color-accent)' : 'var(--color-border)',
                            background: activePromptId === null ? 'rgba(99,102,241,0.08)' : 'transparent',
                            color: 'var(--color-text)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                            marginBottom: '8px',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <span style={{
                            width: '16px', height: '16px', borderRadius: '50%',
                            border: '2px solid',
                            borderColor: activePromptId === null ? 'var(--color-accent)' : 'var(--color-text-muted)',
                            background: activePromptId === null ? 'var(--color-accent)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, fontSize: '10px', color: '#fff',
                        }}>
                            {activePromptId === null && '✓'}
                        </span>
                        不使用 Prompt（自由对话）
                    </button>

                    {/* Prompt list */}
                    {prompts.map(p => {
                        const isActive = activePromptId === p.id
                        const isEditing = editingId === p.id

                        if (isEditing) {
                            return (
                                <div key={p.id} style={{
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--color-accent)',
                                    marginBottom: '8px',
                                    background: 'rgba(99,102,241,0.04)',
                                }}>
                                    <input
                                        autoFocus
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        placeholder="名称"
                                        style={{
                                            width: '100%', padding: '8px 10px', borderRadius: '6px',
                                            border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
                                            color: 'var(--color-text)', fontSize: '13px', fontWeight: 600,
                                            marginBottom: '8px', outline: 'none', fontFamily: 'var(--font-sans)',
                                        }}
                                    />
                                    <textarea
                                        value={editContent}
                                        onChange={e => setEditContent(e.target.value)}
                                        placeholder="Prompt 内容"
                                        rows={4}
                                        style={{
                                            width: '100%', padding: '8px 10px', borderRadius: '6px',
                                            border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
                                            color: 'var(--color-text)', fontSize: '13px', resize: 'vertical',
                                            outline: 'none', lineHeight: '1.5', fontFamily: 'var(--font-sans)',
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            style={{
                                                padding: '6px 14px', borderRadius: '6px',
                                                border: '1px solid var(--color-border)', background: 'transparent',
                                                color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '12px',
                                            }}
                                        >取消</button>
                                        <button
                                            onClick={commitEdit}
                                            style={{
                                                padding: '6px 14px', borderRadius: '6px',
                                                border: 'none', background: 'var(--color-accent)',
                                                color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                                            }}
                                        >保存</button>
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div key={p.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: '1px solid',
                                borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                                background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                                marginBottom: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                                onClick={() => onSelect(p.id)}
                            >
                                {/* Radio */}
                                <span style={{
                                    width: '16px', height: '16px', borderRadius: '50%',
                                    border: '2px solid',
                                    borderColor: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                                    background: isActive ? 'var(--color-accent)' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, fontSize: '10px', color: '#fff',
                                }}>
                                    {isActive && '✓'}
                                </span>

                                {/* Name */}
                                <span style={{
                                    flex: 1, fontSize: '13px', fontWeight: 500,
                                    color: 'var(--color-text)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {p.name}
                                    {p.isPreset && (
                                        <span style={{
                                            marginLeft: '6px', fontSize: '10px',
                                            color: 'var(--color-text-muted)', fontWeight: 400,
                                        }}>预设</span>
                                    )}
                                </span>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}
                                    onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => startEdit(p)}
                                        title="编辑"
                                        style={{
                                            background: 'none', border: 'none',
                                            color: 'var(--color-text-muted)', cursor: 'pointer',
                                            padding: '3px', lineHeight: 0, transition: 'color 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent)' }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        title="删除"
                                        style={{
                                            background: 'none', border: 'none',
                                            color: 'var(--color-text-muted)', cursor: 'pointer',
                                            padding: '3px', lineHeight: 0, transition: 'color 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )
                    })}

                    {/* Create new */}
                    {isCreating ? (
                        <div style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: '1px dashed var(--color-accent)',
                            background: 'rgba(99,102,241,0.04)',
                        }}>
                            <input
                                autoFocus
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Prompt 名称"
                                style={{
                                    width: '100%', padding: '8px 10px', borderRadius: '6px',
                                    border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text)', fontSize: '13px', fontWeight: 600,
                                    marginBottom: '8px', outline: 'none', fontFamily: 'var(--font-sans)',
                                }}
                            />
                            <textarea
                                value={newContent}
                                onChange={e => setNewContent(e.target.value)}
                                placeholder="输入你的 System Prompt 内容..."
                                rows={4}
                                style={{
                                    width: '100%', padding: '8px 10px', borderRadius: '6px',
                                    border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text)', fontSize: '13px', resize: 'vertical',
                                    outline: 'none', lineHeight: '1.5', fontFamily: 'var(--font-sans)',
                                }}
                            />
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => { setIsCreating(false); setNewName(''); setNewContent('') }}
                                    style={{
                                        padding: '6px 14px', borderRadius: '6px',
                                        border: '1px solid var(--color-border)', background: 'transparent',
                                        color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '12px',
                                    }}
                                >取消</button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newName.trim() || !newContent.trim()}
                                    style={{
                                        padding: '6px 14px', borderRadius: '6px',
                                        border: 'none', background: 'var(--color-accent)',
                                        color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                                        opacity: (!newName.trim() || !newContent.trim()) ? 0.5 : 1,
                                    }}
                                >保存</button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            style={{
                                width: '100%', padding: '10px',
                                borderRadius: '10px',
                                border: '1px dashed var(--color-border)',
                                background: 'transparent',
                                color: 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                fontSize: '13px',
                                transition: 'all 0.15s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = 'var(--color-accent)'
                                e.currentTarget.style.color = 'var(--color-accent)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'var(--color-border)'
                                e.currentTarget.style.color = 'var(--color-text-secondary)'
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                            </svg>
                            新建 Prompt
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}
