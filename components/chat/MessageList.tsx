import { useRef, useEffect } from 'react'
import { Message, Character } from '@/types/chat'
import { cn } from '@/lib/utils'
import { User, Bot } from 'lucide-react'

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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#7494C0] dark:bg-zinc-900">
            {messages.map((message) => {
                const isUser = message.role === 'user'
                return (
                    <div
                        key={message.id}
                        className={cn(
                            "flex w-full items-start gap-2",
                            isUser ? "justify-end" : "justify-start"
                        )}
                    >
                        {!isUser && (
                            <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-white dark:bg-zinc-800 border">
                                {character.avatar_url ? (
                                    <img src={character.avatar_url} alt={character.name} className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    <Bot className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                )}
                            </div>
                        )}

                        <div className={cn(
                            "relative max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                            isUser
                                ? "bg-[#8DE055] text-black dark:bg-[#5fc22a] rounded-tr-none after:absolute after:-right-2 after:top-0 after:border-[8px] after:border-transparent after:border-t-[#8DE055] after:border-l-[#8DE055] dark:after:border-t-[#5fc22a] dark:after:border-l-[#5fc22a] after:content-['']"
                                : "bg-white text-black dark:bg-zinc-800 dark:text-white rounded-tl-none after:absolute after:-left-2 after:top-0 after:border-[8px] after:border-transparent after:border-t-white after:border-r-white dark:after:border-t-zinc-800 dark:after:border-r-zinc-800 after:content-['']"
                        )}>
                            <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>

                        {isUser && (
                            <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-700">
                                <User className="h-5 w-5 text-gray-500" />
                            </div>
                        )}
                    </div>
                )
            })}
            <div ref={bottomRef} />
        </div>
    )
}
