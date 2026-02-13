'use client'

import React from 'react'
import { SystemPrompt } from '@/types/chat'

interface PromptSelectorProps {
    prompts: SystemPrompt[]
    activePromptId: string | null
    onOpenManager: () => void
}

export function PromptSelector({ prompts, activePromptId, onOpenManager }: PromptSelectorProps) {
    const activePrompt = prompts.find(p => p.id === activePromptId)
    const label = activePrompt ? activePrompt.name : '无 Prompt'

    return (
        <button
            onClick={onOpenManager}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: '14px',
                border: '1px solid var(--color-border)',
                background: activePrompt ? 'rgba(99,102,241,0.08)' : 'transparent',
                color: activePrompt ? 'var(--color-accent)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 500,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-accent)'
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
            title={activePrompt ? `当前: ${activePrompt.name}` : '点击管理 System Prompt'}
        >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {label}
        </button>
    )
}
