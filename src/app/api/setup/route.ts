import { NextResponse } from 'next/server'

const SETUP_SQL = `
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text DEFAULT 'New Chat',
  messages jsonb DEFAULT '[]'::jsonb,
  prompt_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chats' AND policyname = 'Users can read own chats'
  ) THEN
    CREATE POLICY "Users can read own chats" ON public.chats
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chats' AND policyname = 'Users can insert own chats'
  ) THEN
    CREATE POLICY "Users can insert own chats" ON public.chats
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chats' AND policyname = 'Users can update own chats'
  ) THEN
    CREATE POLICY "Users can update own chats" ON public.chats
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chats' AND policyname = 'Users can delete own chats'
  ) THEN
    CREATE POLICY "Users can delete own chats" ON public.chats
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public.chats(created_at DESC);

-- Prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  content text NOT NULL DEFAULT '',
  is_preset boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Users can read own prompts'
  ) THEN
    CREATE POLICY "Users can read own prompts" ON public.prompts
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Users can insert own prompts'
  ) THEN
    CREATE POLICY "Users can insert own prompts" ON public.prompts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Users can update own prompts'
  ) THEN
    CREATE POLICY "Users can update own prompts" ON public.prompts
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Users can delete own prompts'
  ) THEN
    CREATE POLICY "Users can delete own prompts" ON public.prompts
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
`

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { status: 'error', message: 'Missing Supabase configuration' },
      { status: 500 }
    )
  }

  try {
    // Use Supabase's pg-meta SQL execution endpoint
    const response = await fetch(`${supabaseUrl}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({ query: SETUP_SQL }),
    })

    if (response.ok) {
      return NextResponse.json({ status: 'ok', message: 'Tables created successfully' })
    }

    // Fallback: try the /rest/v1/rpc endpoint (won't work for DDL but let's try)
    // If pg/query doesn't exist, try the pg endpoint
    const pgResponse = await fetch(`${supabaseUrl}/pg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({ query: SETUP_SQL }),
    })

    if (pgResponse.ok) {
      return NextResponse.json({ status: 'ok', message: 'Tables created successfully' })
    }

    // All methods failed — return SQL for manual execution
    return NextResponse.json({
      status: 'manual_setup_required',
      message: 'Auto-setup not available. Please run the SQL below in Supabase Dashboard → SQL Editor.',
      sql: SETUP_SQL.trim(),
    })
  } catch (err) {
    console.error('Setup error:', err)
    return NextResponse.json({
      status: 'manual_setup_required',
      message: 'Auto-setup failed. Please run the SQL below in Supabase Dashboard → SQL Editor.',
      sql: SETUP_SQL.trim(),
    })
  }
}
