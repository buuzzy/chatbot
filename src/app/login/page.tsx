'use client'

import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    const handleGoogleLogin = async () => {
        const supabase = createBrowserSupabaseClient()
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) {
            console.error('Login error:', error)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg)',
            padding: '16px',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center',
            }}>
                {/* Logo */}
                <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: 700,
                    color: '#fff',
                    margin: '0 auto 24px',
                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
                }}>
                    C
                </div>

                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    margin: '0 0 8px',
                    letterSpacing: '-0.02em',
                }}>
                    Chatbot
                </h1>
                <p style={{
                    fontSize: '14px',
                    color: 'var(--color-text-secondary)',
                    margin: '0 0 32px',
                }}>
                    AI 对话助手 · 登录以开始使用
                </p>

                {error && (
                    <div style={{
                        padding: '10px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        marginBottom: '16px',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}>
                        登录失败，请重试
                    </div>
                )}

                {/* Google Login Button */}
                <button
                    onClick={handleGoogleLogin}
                    style={{
                        width: '100%',
                        padding: '12px 24px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-secondary)',
                        color: 'var(--color-text)',
                        fontSize: '15px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        transition: 'all 0.15s ease',
                        boxShadow: 'var(--shadow-sm)',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                        e.currentTarget.style.borderColor = 'var(--color-accent)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                        e.currentTarget.style.borderColor = 'var(--color-border)'
                    }}
                >
                    {/* Google Icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    使用 Google 账号登录
                </button>

                <p style={{
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    marginTop: '24px',
                }}>
                    登录即表示你同意我们的服务条款
                </p>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-bg)',
            }}>
                <div style={{ color: 'var(--color-text-muted)' }}>加载中...</div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}
