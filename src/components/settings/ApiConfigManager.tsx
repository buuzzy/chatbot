'use client'

import React, { useState } from 'react'
import { ApiConfig, ApiProvider } from '@/types/chat'
import { getProviderDefaults } from '@/hooks/useApiConfig'

interface ApiConfigManagerProps {
    configs: ApiConfig[]
    activeConfig: ApiConfig | null
    onActivate: (id: string | null) => void
    onCreate: (provider: ApiProvider, name: string, apiUrl: string, apiKey: string) => Promise<ApiConfig | null>
    onUpdate: (id: string, updates: { name?: string; apiUrl?: string; apiKey?: string }) => Promise<void>
    onDelete: (id: string) => Promise<void>
    onClose: () => void
}

const PROVIDERS: { id: ApiProvider; label: string; icon: string }[] = [
    { id: 'openai', label: 'OpenAI', icon: '🤖' },
    { id: 'claude', label: 'Claude', icon: '🟠' },
    { id: 'gemini', label: 'Gemini', icon: '💎' },
    { id: 'custom', label: '自定义', icon: '🔧' },
]

const defaults = getProviderDefaults()

export function ApiConfigManager({
    configs,
    activeConfig,
    onActivate,
    onCreate,
    onUpdate,
    onDelete,
    onClose,
}: ApiConfigManagerProps) {
    const [isCreating, setIsCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Create form state
    const [newProvider, setNewProvider] = useState<ApiProvider>('openai')
    const [newName, setNewName] = useState('')
    const [newUrl, setNewUrl] = useState(defaults.openai.url)
    const [newKey, setNewKey] = useState('')

    // Edit form state
    const [editName, setEditName] = useState('')
    const [editUrl, setEditUrl] = useState('')
    const [editKey, setEditKey] = useState('')

    const handleProviderChange = (p: ApiProvider) => {
        setNewProvider(p)
        if (p !== 'custom' && defaults[p]) {
            setNewUrl(defaults[p].url)
            if (!newName || Object.values(defaults).some(d => d.name === newName)) {
                setNewName(defaults[p].name)
            }
        } else {
            setNewUrl('')
            setNewName('')
        }
    }

    const handleCreate = async () => {
        if (!newName.trim() || !newUrl.trim() || !newKey.trim()) return
        await onCreate(newProvider, newName.trim(), newUrl.trim(), newKey.trim())
        setIsCreating(false)
        setNewName('')
        setNewUrl(defaults.openai.url)
        setNewKey('')
        setNewProvider('openai')
    }

    const startEdit = (c: ApiConfig) => {
        setEditingId(c.id)
        setEditName(c.name)
        setEditUrl(c.apiUrl)
        setEditKey(c.apiKey)
    }

    const commitEdit = async () => {
        if (editingId && editName.trim() && editUrl.trim() && editKey.trim()) {
            await onUpdate(editingId, { name: editName.trim(), apiUrl: editUrl.trim(), apiKey: editKey.trim() })
        }
        setEditingId(null)
    }

    const handleDelete = async (id: string) => {
        if (confirm('确定删除这个 API 配置吗？')) {
            await onDelete(id)
        }
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '8px 10px', borderRadius: '6px',
        border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
        color: 'var(--color-text)', fontSize: '13px', outline: 'none', fontFamily: 'var(--font-sans)',
    }

    return (
        <>
            {/* Backdrop */}
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)', zIndex: 100,
            }} />

            {/* Modal */}
            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(560px, 90vw)', maxHeight: '80vh',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
                zIndex: 101,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
                }}>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
                        API 配置
                    </h2>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', color: 'var(--color-text-muted)',
                        cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '4px',
                    }}>×</button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
                    {/* Built-in DeepSeek option */}
                    <button
                        onClick={() => onActivate(null)}
                        style={{
                            width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: '10px',
                            border: '1px solid',
                            borderColor: !activeConfig ? 'var(--color-accent)' : 'var(--color-border)',
                            background: !activeConfig ? 'rgba(99,102,241,0.08)' : 'transparent',
                            color: 'var(--color-text)', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                            marginBottom: '8px', transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', gap: '8px',
                        }}
                    >
                        <span style={{
                            width: '16px', height: '16px', borderRadius: '50%', border: '2px solid',
                            borderColor: !activeConfig ? 'var(--color-accent)' : 'var(--color-text-muted)',
                            background: !activeConfig ? 'var(--color-accent)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, fontSize: '10px', color: '#fff',
                        }}>
                            {!activeConfig && '✓'}
                        </span>
                        🐋 DeepSeek（内置）
                    </button>

                    {/* User configs */}
                    {configs.map(c => {
                        const isActive = activeConfig?.id === c.id
                        const isEditing = editingId === c.id
                        const providerInfo = PROVIDERS.find(p => p.id === c.provider)

                        if (isEditing) {
                            return (
                                <div key={c.id} style={{
                                    padding: '12px 14px', borderRadius: '10px',
                                    border: '1px solid var(--color-accent)', marginBottom: '8px',
                                    background: 'rgba(99,102,241,0.04)',
                                }}>
                                    <input value={editName} onChange={e => setEditName(e.target.value)}
                                        placeholder="名称" autoFocus
                                        style={{ ...inputStyle, fontWeight: 600, marginBottom: '8px' }}
                                    />
                                    <input value={editUrl} onChange={e => setEditUrl(e.target.value)}
                                        placeholder="API URL"
                                        style={{ ...inputStyle, marginBottom: '8px', fontSize: '12px', fontFamily: 'monospace' }}
                                    />
                                    <input value={editKey} onChange={e => setEditKey(e.target.value)}
                                        placeholder="API Key" type="password"
                                        style={{ ...inputStyle, fontSize: '12px', fontFamily: 'monospace' }}
                                    />
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setEditingId(null)} style={{
                                            padding: '6px 14px', borderRadius: '6px',
                                            border: '1px solid var(--color-border)', background: 'transparent',
                                            color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '12px',
                                        }}>取消</button>
                                        <button onClick={commitEdit} style={{
                                            padding: '6px 14px', borderRadius: '6px', border: 'none',
                                            background: 'var(--color-accent)', color: '#fff',
                                            cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                                        }}>保存</button>
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div key={c.id} onClick={() => onActivate(c.id)} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 14px', borderRadius: '10px',
                                border: '1px solid',
                                borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                                background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                                marginBottom: '8px', cursor: 'pointer', transition: 'all 0.15s',
                            }}>
                                <span style={{
                                    width: '16px', height: '16px', borderRadius: '50%', border: '2px solid',
                                    borderColor: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                                    background: isActive ? 'var(--color-accent)' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, fontSize: '10px', color: '#fff',
                                }}>
                                    {isActive && '✓'}
                                </span>
                                <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {providerInfo?.icon} {c.name}
                                </span>
                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                    <button onClick={() => startEdit(c)} title="编辑" style={{
                                        background: 'none', border: 'none', color: 'var(--color-text-muted)',
                                        cursor: 'pointer', padding: '3px', lineHeight: 0, transition: 'color 0.15s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent)' }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <button onClick={() => handleDelete(c.id)} title="删除" style={{
                                        background: 'none', border: 'none', color: 'var(--color-text-muted)',
                                        cursor: 'pointer', padding: '3px', lineHeight: 0, transition: 'color 0.15s',
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
                            padding: '12px 14px', borderRadius: '10px',
                            border: '1px dashed var(--color-accent)', background: 'rgba(99,102,241,0.04)',
                        }}>
                            {/* Provider pills */}
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                {PROVIDERS.map(p => (
                                    <button key={p.id} onClick={() => handleProviderChange(p.id)} style={{
                                        padding: '4px 12px', borderRadius: '14px',
                                        border: '1px solid',
                                        borderColor: newProvider === p.id ? 'var(--color-accent)' : 'var(--color-border)',
                                        background: newProvider === p.id ? 'var(--color-accent)' : 'transparent',
                                        color: newProvider === p.id ? '#fff' : 'var(--color-text-secondary)',
                                        fontSize: '12px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s',
                                    }}>
                                        {p.icon} {p.label}
                                    </button>
                                ))}
                            </div>

                            <input value={newName} onChange={e => setNewName(e.target.value)}
                                placeholder="配置名称" autoFocus
                                style={{ ...inputStyle, fontWeight: 600, marginBottom: '8px' }}
                            />
                            <input value={newUrl} onChange={e => setNewUrl(e.target.value)}
                                placeholder="API URL"
                                style={{ ...inputStyle, marginBottom: '8px', fontSize: '12px', fontFamily: 'monospace' }}
                            />
                            <input value={newKey} onChange={e => setNewKey(e.target.value)}
                                placeholder="API Key" type="password"
                                style={{ ...inputStyle, fontSize: '12px', fontFamily: 'monospace' }}
                            />

                            <div style={{ display: 'flex', gap: '6px', marginTop: '10px', justifyContent: 'flex-end' }}>
                                <button onClick={() => { setIsCreating(false); setNewKey('') }} style={{
                                    padding: '6px 14px', borderRadius: '6px',
                                    border: '1px solid var(--color-border)', background: 'transparent',
                                    color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '12px',
                                }}>取消</button>
                                <button onClick={handleCreate}
                                    disabled={!newName.trim() || !newUrl.trim() || !newKey.trim()}
                                    style={{
                                        padding: '6px 14px', borderRadius: '6px', border: 'none',
                                        background: 'var(--color-accent)', color: '#fff',
                                        cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                                        opacity: (!newName.trim() || !newUrl.trim() || !newKey.trim()) ? 0.5 : 1,
                                    }}>保存</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsCreating(true)} style={{
                            width: '100%', padding: '10px', borderRadius: '10px',
                            border: '1px dashed var(--color-border)', background: 'transparent',
                            color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '13px',
                            transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                            </svg>
                            添加 API 配置
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}
