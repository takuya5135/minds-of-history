import { createClient } from '@/utils/supabase/server'
import { LogOut } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function WaitlistPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-black text-center">
            <div className="max-w-md space-y-6 bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Review in Progress</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    あなたのアカウントは現在承認待ちです。<br />
                    管理者が承認するまで、しばらくお待ちください。
                </p>
                <div className="pt-4">
                    <form action="/auth/signout" method="post">
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-500"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
