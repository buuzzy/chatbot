import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

const SETUP_SQL = `
-- Create chats table if not exists
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text DEFAULT 'New Chat',
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- RLS policies (use IF NOT EXISTS via DO block)
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

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public.chats(created_at DESC);
`

export async function GET() {
    try {
        const admin = createAdminSupabaseClient()

        // Check if table already exists
        const { data: tables } = await admin
            .from('information_schema.tables' as any)
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_name', 'chats')
            .single()

        if (tables) {
            return NextResponse.json({ status: 'ok', message: 'Tables already exist' })
        }

        // Run setup SQL
        const { error } = await admin.rpc('exec_sql', { sql: SETUP_SQL }).single()

        // If rpc doesn't exist, fall back to direct SQL via REST
        if (error) {
            // Use the admin client's postgrest to run raw SQL
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
                        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
                    },
                    body: JSON.stringify({}),
                }
            )

            // If that also fails, try the SQL endpoint directly
            if (!response.ok) {
                const sqlResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/pg`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
                            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
                        },
                        body: JSON.stringify({ query: SETUP_SQL }),
                    }
                )

                if (!sqlResponse.ok) {
                    // Last resort: inform user to run SQL manually
                    return NextResponse.json(
                        {
                            status: 'manual_setup_required',
                            message: 'Auto-setup failed. Please run the SQL below in Supabase SQL Editor.',
                            sql: SETUP_SQL
                        },
                        { status: 200 }
                    )
                }
            }
        }

        return NextResponse.json({ status: 'ok', message: 'Tables created successfully' })
    } catch (err) {
        console.error('Setup error:', err)
        return NextResponse.json(
            { status: 'error', message: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
