import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // ビルド（サーバーサイドでのプリレンダリング）時のみ、環境変数がなくてもエラーにならないようダミー値を使用
    if (typeof window === 'undefined' && (!supabaseUrl || !supabaseKey)) {
        return createBrowserClient(
            'https://placeholder.supabase.co',
            'placeholder'
        )
    }

    return createBrowserClient(supabaseUrl!, supabaseKey!)
}
