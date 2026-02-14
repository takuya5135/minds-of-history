'use client'

import { Character } from '@/types/chat'
import { cn } from '@/lib/utils'
import { Bot, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SidebarProps {
    characters: Character[]
    selectedId: string
    onSelect: (id: string) => void
    isOpen: boolean
    onClose: () => void
    userProfile?: {
        username: string
        avatar_url: string
    }
}

export function Sidebar({ characters, selectedId, onSelect, isOpen, onClose, userProfile }: SidebarProps) {
    const router = useRouter()
    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 md:hidden"
                    onClick={onClose}
                />
            )}

            <div className={cn(
                "fixed inset-y-0 left-0 z-30 w-72 transform bg-white dark:bg-zinc-950 border-r dark:border-zinc-800 transition-transform duration-200 md:relative md:translate-x-0 h-full flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b dark:border-zinc-800">
                    <h2 className="text-lg font-bold">偉人リスト</h2>
                    <button onClick={onClose} className="md:hidden p-2">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {characters.map((char) => {
                        const isSelected = selectedId === char.id;
                        return (
                            <button
                                key={char.id}
                                onClick={() => {
                                    onSelect(char.id)
                                    onClose()
                                }}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                                    isSelected
                                        ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-100"
                                        : "hover:bg-gray-100 dark:hover:bg-zinc-900"
                                )}
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
                                    {char.avatar_url ? (
                                        <img src={char.avatar_url} alt={char.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="text-xs font-bold text-gray-500">{char.name.substring(0, 1)}</div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium">{char.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{char.description}</div>
                                </div>
                            </button>
                        )
                    })}
                </div>
                <div className="mt-auto border-t dark:border-zinc-800 p-2 space-y-1">
                    {userProfile && (
                        <button
                            onClick={() => {
                                router.push('/profile/setup')
                                onClose()
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors group"
                            title="プロフィールを編集"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden border border-gray-200 dark:border-zinc-700 group-hover:border-indigo-400">
                                {userProfile.avatar_url ? (
                                    <img src={userProfile.avatar_url} alt={userProfile.username} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="text-xs font-bold text-gray-500">{userProfile.username.substring(0, 1)}</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{userProfile.username}</div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400">相談者 (設定変更)</div>
                            </div>
                        </button>
                    )}

                    <div className="px-3 py-1 mb-2">
                        <p className="text-[10px] text-orange-600 dark:text-orange-400 leading-tight">
                            ※ チャット履歴は3日後に消去されます。<br />
                            大切な智慧は智慧の書に記録してください。
                        </p>
                    </div>

                    <a href="/wisdom" className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-zinc-900 text-indigo-600 dark:text-indigo-400">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20">
                            <Bot className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="font-medium">智慧の書</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">要約と記録</div>
                        </div>
                    </a>
                </div>
            </div>
        </>
    )
}
