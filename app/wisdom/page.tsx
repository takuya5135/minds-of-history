'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Clock } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { CHARACTERS } from '@/lib/characters'

export default function WisdomPage() {
    const [wisdoms, setWisdoms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchWisdoms = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            try {
                const response = await fetch('/api/wisdom')
                if (response.ok) {
                    const data = await response.json()
                    setWisdoms(data.wisdoms || [])
                }
            } catch (error) {
                console.error('Failed to fetch wisdoms:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchWisdoms()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 p-4 md:p-8">
            <header className="max-w-4xl mx-auto mb-8 flex items-center gap-4">
                <button
                    onClick={() => router.push('/')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-2">
                    <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    <h1 className="text-3xl font-bold text-serif">智慧の書</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto space-y-8">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">読み込み中...</div>
                ) : wisdoms.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                        <BookOpen className="h-12 w-12 mx-auto text-gray-300 dark:text-zinc-700 mb-4" />
                        <p className="text-lg text-gray-500">まだ智慧は記されていません。</p>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                        >
                            偉人と対話する
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {wisdoms.map((wisdom) => {
                            const character = CHARACTERS.find(c => c.id === wisdom.character_id)
                            return (
                                <article key={wisdom.id} className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
                                    <div className="p-6 md:p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            {character?.avatar_url ? (
                                                <img src={character.avatar_url} alt={character.name} className="h-10 w-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold">
                                                    {character?.name.substring(0, 2)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-indigo-600 dark:text-indigo-400 text-sm">
                                                    {character?.name}
                                                </div>
                                                <div className="flex items-center text-xs text-gray-500 gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(wisdom.created_at).toLocaleDateString()}.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="prose dark:prose-invert max-w-none">
                                            <ReactMarkdown>{wisdom.summary}</ReactMarkdown>
                                        </div>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
