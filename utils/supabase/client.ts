import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // Vercelビルド時に環境変数がなくてもエラーにならないようにダミー値を使用
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

    return createBrowserClient(
        supabaseUrl,
        supabaseKey
    )
}
