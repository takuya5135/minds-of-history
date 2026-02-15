import { Suspense } from 'react'

export default function AuthErrorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ErrorContent />
        </Suspense>
    )
}

function ErrorContent() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-black text-center">
            <div className="max-w-md space-y-6 bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800">
                <h1 className="text-3xl font-bold text-red-600">Authentication Error</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    ログイン処理中にエラーが発生しました。<br />
                    恐れ入りますが、もう一度最初からやり直してください。
                </p>
                <div className="pt-4">
                    <a
                        href="/login"
                        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                    >
                        ログインページに戻る
                    </a>
                </div>
            </div>
        </div>
    )
}
