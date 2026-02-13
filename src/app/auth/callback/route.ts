import { NextResponse } from 'next/server'
import { createBrowserSupabaseClient } from '@/lib/supabase'

/**
 * OAuth callback handler.
 * Supabase redirects here after Google login with a `code` param.
 * We exchange the code for a session, then redirect to home.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = createBrowserSupabaseClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // If something went wrong, redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
