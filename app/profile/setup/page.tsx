'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Bot } from 'lucide-react'

const OCCUPATION_OPTIONS = [
    "公務員",
    "会社員（一般事務・管理）",
    "会社員（技術・開発）",
    "会社員（営業・マーケティング）",
    "会社員（企画・専門職）",
    "経営者・役員",
    "自営業・フリーランス",
    "専門職（医師・弁護士等）",
    "教育・研究職",
    "医療・福祉・介護",
    "運輸・配送・物流",
    "サービス・飲食・小売",
    "建設・土木・農林水産",
    "製造・生産工程",
    "学生",
    "主婦・主夫",
    "パート・アルバイト",
    "無職・家政手伝い",
    "その他"
]

export default function ProfileSetupPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isCustomOccupation, setIsCustomOccupation] = useState(false)

    const [formData, setFormData] = useState({
        username: '',
        birthdate: '',
        occupation: '',
        gender: '',
        marital_status: '',
        children_count: '0',
        avatar_url: '/avatars/human_1.png', // Default
    })

    const [birthYear, setBirthYear] = useState('')
    const [birthMonth, setBirthMonth] = useState('')
    const [birthDay, setBirthDay] = useState('')

    useEffect(() => {
        const loadProfile = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    const initialData = {
                        username: profile.username || '',
                        birthdate: profile.birthdate || '',
                        occupation: profile.occupation || '',
                        gender: profile.gender || '',
                        marital_status: profile.marital_status || '',
                        children_count: String(profile.children_count || 0),
                        avatar_url: profile.avatar_url || '/avatars/human_1.png',
                    }

                    if (profile.birthdate) {
                        const [y, m, d] = profile.birthdate.split('-')
                        setBirthYear(y)
                        setBirthMonth(m.replace(/^0+/, ''))
                        setBirthDay(d.replace(/^0+/, ''))
                    }

                    setFormData(initialData)

                    // Custom occupation check
                    if (profile.occupation && !OCCUPATION_OPTIONS.includes(profile.occupation)) {
                        setIsCustomOccupation(true)
                    } else if (profile.occupation === 'その他') {
                        setIsCustomOccupation(true)
                        initialData.occupation = ''
                    }

                }
            }
        }
        loadProfile()
    }, [])

    useEffect(() => {
        if (birthYear && birthMonth && birthDay) {
            setFormData(prev => ({
                ...prev,
                birthdate: `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
            }))
        }
    }, [birthYear, birthMonth, birthDay])

    const humanAvatars = Array.from({ length: 8 }, (_, i) => `/avatars/human_${i + 1}.png`)
    const animalAvatars = Array.from({ length: 8 }, (_, i) => `/avatars/animal_${i + 1}.png`)

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
                avatar_url: formData.avatar_url,
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

    const selectAvatar = (url: string) => {
        setFormData(prev => ({ ...prev, avatar_url: url }))
    }

    // 生年月日選択用のオプション生成
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
    const months = Array.from({ length: 12 }, (_, i) => i + 1)

    // 選択された年月から日数を計算
    const getDaysInMonth = (year: string, month: string) => {
        if (!year || !month) return 31
        return new Date(parseInt(year), parseInt(month), 0).getDate()
    }
    const days = Array.from({ length: getDaysInMonth(birthYear, birthMonth) }, (_, i) => i + 1)

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
                    {/* アイコン選択セクション */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            自分のアイコンを選択してください
                        </label>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-2">人物</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {humanAvatars.map((url) => (
                                        <button
                                            key={url}
                                            type="button"
                                            onClick={() => selectAvatar(url)}
                                            className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all ${formData.avatar_url === url
                                                ? 'border-indigo-600 ring-2 ring-indigo-600 ring-offset-2'
                                                : 'border-transparent grayscale hover:grayscale-0'
                                                }`}
                                        >
                                            <img src={url} alt="avatar" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 mb-2">動物</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {animalAvatars.map((url) => (
                                        <button
                                            key={url}
                                            type="button"
                                            onClick={() => selectAvatar(url)}
                                            className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all ${formData.avatar_url === url
                                                ? 'border-indigo-600 ring-2 ring-indigo-600 ring-offset-2'
                                                : 'border-transparent grayscale hover:grayscale-0'
                                                }`}
                                        >
                                            <img src={url} alt="avatar" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                生年月日 <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2 mt-1">
                                <select
                                    required
                                    value={birthYear}
                                    onChange={(e) => setBirthYear(e.target.value)}
                                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                >
                                    <option value="">年</option>
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <select
                                    required
                                    value={birthMonth}
                                    onChange={(e) => setBirthMonth(e.target.value)}
                                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                >
                                    <option value="">月</option>
                                    {months.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    required
                                    value={birthDay}
                                    onChange={(e) => setBirthDay(e.target.value)}
                                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                >
                                    <option value="">日</option>
                                    {days.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
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

                        <div>
                            <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                職業 <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-2">
                                <select
                                    id="occupation"
                                    name="occupation"
                                    required
                                    value={isCustomOccupation ? 'その他' : formData.occupation}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === 'その他') {
                                            setIsCustomOccupation(true);
                                            setFormData(prev => ({ ...prev, occupation: '' }));
                                        } else {
                                            setIsCustomOccupation(false);
                                            setFormData(prev => ({ ...prev, occupation: value }));
                                        }
                                    }}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                >
                                    <option value="">選択してください</option>
                                    {OCCUPATION_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                {isCustomOccupation && (
                                    <input
                                        type="text"
                                        required
                                        value={formData.occupation}
                                        onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                                        placeholder="職業を入力してください"
                                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-gray-500 animate-in fade-in slide-in-from-top-2 duration-200"
                                    />
                                )}
                            </div>
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
