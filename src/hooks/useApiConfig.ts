import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { ApiConfig, ApiProvider } from '@/types/chat'
import type { User } from '@supabase/supabase-js'

const supabase = createBrowserSupabaseClient()

// Default URLs for fixed providers
const PROVIDER_DEFAULTS: Record<string, { url: string; name: string }> = {
    openai: { url: 'https://api.openai.com/v1', name: 'OpenAI' },
    claude: { url: 'https://api.anthropic.com/v1', name: 'Claude' },
    gemini: { url: 'https://generativelanguage.googleapis.com/v1beta/openai/', name: 'Gemini' },
}

export function getProviderDefaults() {
    return PROVIDER_DEFAULTS
}

export function useApiConfig(user: User | null) {
    const [configs, setConfigs] = useState<ApiConfig[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Load configs
    useEffect(() => {
        if (!user) {
            setConfigs([])
            setIsLoading(false)
            return
        }

        const load = async () => {
            setIsLoading(true)
            try {
                const { data, error } = await supabase
                    .from('api_configs')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true })

                if (error) throw error

                setConfigs((data || []).map(row => ({
                    id: row.id,
                    userId: row.user_id,
                    provider: row.provider as ApiProvider,
                    name: row.name,
                    apiUrl: row.api_url,
                    apiKey: row.api_key,
                    isActive: row.is_active,
                    createdAt: new Date(row.created_at).getTime(),
                })))
            } catch (err) {
                console.error('Load api_configs failed:', err)
            } finally {
                setIsLoading(false)
            }
        }

        load()
    }, [user])

    const activeConfig = configs.find(c => c.isActive) || null

    // Create config
    const createConfig = async (provider: ApiProvider, name: string, apiUrl: string, apiKey: string) => {
        if (!user) return null

        try {
            const { data, error } = await supabase
                .from('api_configs')
                .insert({
                    user_id: user.id,
                    provider,
                    name,
                    api_url: apiUrl,
                    api_key: apiKey,
                    is_active: false,
                })
                .select()
                .single()

            if (error) throw error

            const newConfig: ApiConfig = {
                id: data.id,
                userId: data.user_id,
                provider: data.provider,
                name: data.name,
                apiUrl: data.api_url,
                apiKey: data.api_key,
                isActive: data.is_active,
                createdAt: new Date(data.created_at).getTime(),
            }

            setConfigs(prev => [...prev, newConfig])
            return newConfig
        } catch (err) {
            console.error('Create api_config failed:', err)
            return null
        }
    }

    // Update config
    const updateConfig = async (id: string, updates: { name?: string; apiUrl?: string; apiKey?: string }) => {
        if (!user) return

        try {
            const dbUpdates: any = {}
            if (updates.name !== undefined) dbUpdates.name = updates.name
            if (updates.apiUrl !== undefined) dbUpdates.api_url = updates.apiUrl
            if (updates.apiKey !== undefined) dbUpdates.api_key = updates.apiKey

            const { error } = await supabase
                .from('api_configs')
                .update(dbUpdates)
                .eq('id', id)

            if (error) throw error

            setConfigs(prev =>
                prev.map(c => c.id === id ? { ...c, ...updates } : c)
            )
        } catch (err) {
            console.error('Update api_config failed:', err)
        }
    }

    // Delete config
    const deleteConfig = async (id: string) => {
        if (!user) return

        try {
            const { error } = await supabase
                .from('api_configs')
                .delete()
                .eq('id', id)

            if (error) throw error

            setConfigs(prev => prev.filter(c => c.id !== id))
        } catch (err) {
            console.error('Delete api_config failed:', err)
        }
    }

    // Set active config (null = use built-in DeepSeek)
    const setActiveConfig = async (id: string | null) => {
        if (!user) return

        try {
            // Deactivate all first
            await supabase
                .from('api_configs')
                .update({ is_active: false })
                .eq('user_id', user.id)

            // Activate selected
            if (id) {
                await supabase
                    .from('api_configs')
                    .update({ is_active: true })
                    .eq('id', id)
            }

            setConfigs(prev =>
                prev.map(c => ({ ...c, isActive: c.id === id }))
            )
        } catch (err) {
            console.error('Set active config failed:', err)
        }
    }

    return {
        configs,
        activeConfig,
        createConfig,
        updateConfig,
        deleteConfig,
        setActiveConfig,
        isLoading,
    }
}
