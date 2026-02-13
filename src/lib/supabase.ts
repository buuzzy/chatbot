import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

/**
 * 浏览器端 Supabase 客户端（用于 Auth + 数据查询）
 * 使用 ANON_KEY，受 RLS 策略约束
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * 服务端 Admin 客户端（用于自动建表等管理操作）
 * 使用 SERVICE_ROLE_KEY，绕过 RLS
 * ⚠️ 仅在服务端使用（API routes / Server Components）
 */
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
