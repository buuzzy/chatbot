import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { SystemPrompt } from '@/types/chat'
import type { User } from '@supabase/supabase-js'

const supabase = createBrowserSupabaseClient()

// Presets — inserted once per user on first load
const PRESET_PROMPTS = [
    {
        name: '结构化助手',
        content: `请以结构化的方式回答问题：
- 层次分明，使用标题分级
- 重点突出，条理清晰
- 语言简洁，表达准确
- 适当使用列表和代码块
- 如果涉及代码，请使用代码块`,
    },
    {
        name: '翻译官',
        content: `你是一名专业的中英文互译专家。规则：
- 如果输入是中文，翻译为地道的英文
- 如果输入是英文，翻译为流畅的中文
- 保持原文的语气和风格
- 专业术语提供中英对照
- 不要添加解释，只给出翻译结果`,
    },
    {
        name: '代码审查员',
        content: `你是一名资深代码审查员，请对用户提供的代码进行审查：
- 指出潜在的 bug 和安全隐患
- 提出性能优化建议
- 检查代码风格和可读性
- 建议改进方案并给出示例代码
- 评估错误处理是否充分`,
    },
]

export function usePrompts(user: User | null) {
    const [prompts, setPrompts] = useState<SystemPrompt[]>([])
    const [activePromptId, setActivePromptId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Load prompts
    useEffect(() => {
        if (!user) {
            setPrompts([])
            setActivePromptId(null)
            setIsLoading(false)
            return
        }

        const loadPrompts = async () => {
            setIsLoading(true)
            try {
                const { data, error } = await supabase
                    .from('prompts')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true })

                if (error) throw error

                let loadedPrompts: SystemPrompt[] = (data || []).map(row => ({
                    id: row.id,
                    userId: row.user_id,
                    name: row.name,
                    content: row.content,
                    isPreset: row.is_preset,
                    createdAt: new Date(row.created_at).getTime(),
                }))

                // Insert presets if none exist
                if (loadedPrompts.length === 0) {
                    const presetRows = PRESET_PROMPTS.map(p => ({
                        user_id: user.id,
                        name: p.name,
                        content: p.content,
                        is_preset: true,
                    }))

                    const { data: inserted, error: insertError } = await supabase
                        .from('prompts')
                        .insert(presetRows)
                        .select()

                    if (!insertError && inserted) {
                        loadedPrompts = inserted.map(row => ({
                            id: row.id,
                            userId: row.user_id,
                            name: row.name,
                            content: row.content,
                            isPreset: row.is_preset,
                            createdAt: new Date(row.created_at).getTime(),
                        }))
                    }
                }

                setPrompts(loadedPrompts)
                // Default: no prompt selected (activePromptId stays null)
            } catch (err) {
                console.error('Load prompts failed:', err)
            } finally {
                setIsLoading(false)
            }
        }

        loadPrompts()
    }, [user])

    // Get active prompt content
    const activePrompt = prompts.find(p => p.id === activePromptId) || null

    // Create prompt
    const createPrompt = async (name: string, content: string) => {
        if (!user) return null

        try {
            const { data, error } = await supabase
                .from('prompts')
                .insert({ user_id: user.id, name, content, is_preset: false })
                .select()
                .single()

            if (error) throw error

            const newPrompt: SystemPrompt = {
                id: data.id,
                userId: data.user_id,
                name: data.name,
                content: data.content,
                isPreset: data.is_preset,
                createdAt: new Date(data.created_at).getTime(),
            }

            // Auto-select if it's the user's first non-preset prompt
            const hasCustomPrompts = prompts.some(p => !p.isPreset)

            setPrompts(prev => [...prev, newPrompt])

            if (!hasCustomPrompts) {
                setActivePromptId(newPrompt.id)
            }

            return newPrompt
        } catch (err) {
            console.error('Create prompt failed:', err)
            return null
        }
    }

    // Update prompt
    const updatePrompt = async (id: string, name: string, content: string) => {
        if (!user) return

        try {
            const { error } = await supabase
                .from('prompts')
                .update({ name, content })
                .eq('id', id)

            if (error) throw error

            setPrompts(prev =>
                prev.map(p => p.id === id ? { ...p, name, content } : p)
            )
        } catch (err) {
            console.error('Update prompt failed:', err)
        }
    }

    // Delete prompt
    const deletePrompt = async (id: string) => {
        if (!user) return

        try {
            const { error } = await supabase
                .from('prompts')
                .delete()
                .eq('id', id)

            if (error) throw error

            setPrompts(prev => prev.filter(p => p.id !== id))

            // If deleted prompt was active, reset to none
            if (activePromptId === id) {
                setActivePromptId(null)
            }
        } catch (err) {
            console.error('Delete prompt failed:', err)
        }
    }

    return {
        prompts,
        activePromptId,
        activePrompt,
        setActivePromptId,
        createPrompt,
        updatePrompt,
        deletePrompt,
        isLoading,
    }
}
