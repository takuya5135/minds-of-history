'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Bot } from 'lucide-react'

export default function ProfileSetupPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        username: '',
        birthdate: '',
        occupation: '',
        gender: '',
        marital_status: '',
        children_count: '0',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setError('ユーザーが見つかりません。再度ログインしてください。')
            setLoading(false)
            return
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                username: formData.username,
                birthdate: formData.birthdate,
                occupation: formData.occupation,
                gender: formData.gender,
                marital_status: formData.marital_status,
                children_count: parseInt(formData.children_count, 10),
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

        if (updateError) {
            setError(updateError.message)
            setLoading(false)
            return
        }

        router.push('/')
        router.refresh()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950">
            <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-lg">
                <div className="flex flex-col items-center space-y-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                        <Bot className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        プロフィール設定
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        より的確なアドバイスを行うため、<br />あなたのことを教えてください。
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                お名前 (ニックネーム可) <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-gray-500"
                                placeholder="例: 歴史 太郎"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    生年月日 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="birthdate"
                                    name="birthdate"
                                    type="date"
                                    required
                                    value={formData.birthdate}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    性別 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="gender"
                                    name="gender"
                                    required
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                >
                                    <option value="">選択してください</option>
                                    <option value="男性">男性</option>
                                    <option value="女性">女性</option>
                                    <option value="トランスジェンダー">トランスジェンダー</option>
                                    <option value="ノンバイナリー">ノンバイナリー</option>
                                    <option value="その他">その他</option>
                                    <option value="回答しない">回答しない</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                職業 <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="occupation"
                                name="occupation"
                                required
                                value={formData.occupation}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            >
                                <option value="">選択してください</option>
                                <option value="会社員">会社員</option>
                                <option value="公務員">公務員</option>
                                <option value="自営業">自営業</option>
                                <option value="学生">学生</option>
                                <option value="パート・アルバイト">パート・アルバイト</option>
                                <option value="主婦・主夫">主婦・主夫</option>
                                <option value="無職">無職</option>
                                <option value="その他">その他</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="marital_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    配偶者 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="marital_status"
                                    name="marital_status"
                                    required
                                    value={formData.marital_status}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                >
                                    <option value="">選択してください</option>
                                    <option value="未婚">未婚</option>
                                    <option value="既婚">既婚</option>
                                    <option value="離別">離別</option>
                                    <option value="死別">死別</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="children_count" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    子供の数 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="children_count"
                                    name="children_count"
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.children_count}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-gray-500"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >
                        {loading ? '保存中...' : 'プロフィールを保存して開始'}
                    </button>
                </form>
            </div>
        </div>
    )
}
