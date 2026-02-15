import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // ブラウザ実行時でも、環境変数が設定されていない場合はクラッシュを防ぐためにダミー値を使用
    // 注: この状態ではログイン機能は動作しません。VercelのEnvironment Variablesを設定してください。
    if (!supabaseUrl || !supabaseKey) {
        console.error('Error: Supabase environment variables are missing! Check your Vercel project settings.')
        return createBrowserClient(
            'https://placeholder.supabase.co',
            'placeholder'
        )
    }

    return createBrowserClient(supabaseUrl, supabaseKey)
}
