import { Character } from '@/types/chat'
import { cn } from '@/lib/utils'
import { Bot, ChevronLeft } from 'lucide-react'

interface SidebarProps {
    characters: Character[]
    selectedId: string
    onSelect: (id: string) => void
    isOpen: boolean
    onClose: () => void
}

export function Sidebar({ characters, selectedId, onSelect, isOpen, onClose }: SidebarProps) {
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
                "fixed inset-y-0 left-0 z-30 w-72 transform bg-white dark:bg-zinc-950 border-r dark:border-zinc-800 transition-transform duration-200 md:relative md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center justify-between px-4 border-b dark:border-zinc-800">
                    <h2 className="text-lg font-bold">偉人リスト</h2>
                    <button onClick={onClose} className="md:hidden p-2">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto h-[calc(100vh-4rem)] p-2 space-y-1">
                    {characters.map((char) => (
                        <button
                            key={char.id}
                            onClick={() => {
                                onSelect(char.id)
                                onClose()
                            }}
                            className={cn(
                                "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                                selectedId === char.id
                                    ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-100"
                                    : "hover:bg-gray-100 dark:hover:bg-zinc-900"
                            )}
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-800">
                                {char.avatar_url ? (
                                    <img src={char.avatar_url} alt={char.name} className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    <Bot className="h-6 w-6 text-gray-500" />
                                )}
                            </div>
                            <div>
                                <div className="font-medium">{char.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{char.description}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </>
    )
}
