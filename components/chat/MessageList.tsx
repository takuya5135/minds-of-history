import { useRef, useEffect } from 'react'
import { Message, Character } from '@/types/chat'
import { CHARACTERS } from '@/lib/characters'
import { cn } from '@/lib/utils'
import { User, Bot } from 'lucide-react'

// Simple fade-in animation style
const fadeInStyle = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`

interface MessageListProps {
    messages: Message[]
    character: Character
}

export function MessageList({ messages, character }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    return (
        <div className="flex-1 overflow-y-auto p-4 pt-8 space-y-4 bg-[#7494C0] dark:bg-zinc-900">
            {messages.map((message, index) => {
                const isUser = message.role === 'user'

                // Group Chat: Split message by [Name] tags
                // Pattern: [Name]\nContent...
                const parts = []
                if (!isUser && character.id === 'group') {
                    const regex = /\[(.*?)\]\n([\s\S]*?)(?=\n\[|$)/g
                    let match
                    while ((match = regex.exec(message.content)) !== null) {
                        parts.push({
                            name: match[1],
                            content: match[2].trim()
                        })
                    }
                }

                if (parts.length > 0) {
                    // Render split messages for group chat
                    const isLastMessage = index === messages.length - 1

                    return (
                        <div key={message.id} className="flex flex-col gap-4">
                            <style>{fadeInStyle}</style>
                            {parts.map((part, partIndex) => {
                                // Find character for avatar
                                const matchedCharacter = CHARACTERS.find(c => c.name === part.name || c.id === part.name)
                                const avatarUrl = matchedCharacter?.avatar_url

                                // Apply delay only if it's the last message context and it's not the first part
                                const shouldDelay = isLastMessage && partIndex > 0
                                const animationStyle = shouldDelay ? {
                                    opacity: 0,
                                    animation: `fadeIn 0.8s ease-out ${2.5 * partIndex}s forwards`
                                } : {}

                                return (
                                    <div
                                        key={`${message.id}-${partIndex}`}
                                        className="flex w-full items-start gap-2 justify-start mb-2 last:mb-0"
                                        style={animationStyle}
                                    >
                                        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-white dark:bg-zinc-800 border overflow-hidden">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt={part.name} className="h-full w-full rounded-full object-cover" />
                                            ) : (
                                                <div className="text-[10px] font-bold text-center leading-none px-1 text-gray-600 dark:text-gray-300">
                                                    {part.name.substring(0, 2)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col max-w-[80%]">
                                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100 ml-1 mb-1">{part.name}</span>
                                            <div className={cn(
                                                "relative rounded-2xl px-4 py-2 text-sm shadow-sm",
                                                "bg-white text-black dark:bg-zinc-800 dark:text-white rounded-tl-none after:absolute after:-left-2 after:top-0 after:border-[8px] after:border-transparent after:border-t-white after:border-r-white dark:after:border-t-zinc-800 dark:after:border-r-zinc-800 after:content-['']"
                                            )}>
                                                <div className="whitespace-pre-wrap">{part.content}</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                }

                // Normal rendering for user or non-group messages
                return (
                    <div
                        key={message.id}
                        className={cn(
                            "flex w-full gap-3",
                            isUser ? "justify-end" : "justify-start"
                        )}
                    >
                        {/* AI Avatar (Left) */}
                        {!isUser && (
                            <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-800 mt-1">
                                {character.avatar_url ? (
                                    <img src={character.avatar_url} alt={character.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-gray-500">
                                        {character.name.substring(0, 1)}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={cn("flex flex-col max-w-[80%]", isUser ? "items-end" : "items-start")}>
                            {!isUser && (
                                <span className={cn(
                                    "mb-1 text-xs ml-1 font-medium",
                                    "text-gray-900 dark:text-gray-100"
                                )}>
                                    {character.name}
                                </span>
                            )}

                            <div
                                className={cn(
                                    "rounded-2xl px-4 py-2 text-sm shadow-sm md:text-base whitespace-pre-wrap",
                                    isUser
                                        ? "bg-indigo-600 text-white rounded-tr-none"
                                        : "bg-white dark:bg-zinc-800 text-black dark:text-white border border-gray-100 dark:border-zinc-700 rounded-tl-none"
                                )}
                            >
                                <div className="whitespace-pre-wrap">{message.content}</div>
                            </div>
                        </div>

                        {isUser && (
                            <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 overflow-hidden">
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">You</span>
                            </div>
                        )}
                    </div>
                )
            })}
            <div ref={bottomRef} />
        </div >
    )
}
