'use client'

import { useState, useRef, useEffect } from 'react'
import { SendHorizontal } from 'lucide-react'

interface MessageInputProps {
    onSend: (content: string) => void
    disabled?: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
    const [content, setContent] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!content.trim() || disabled) return
        onSend(content)
        setContent('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
        }
    }, [content])

    return (
        <form onSubmit={handleSubmit} className="border-t bg-white dark:bg-zinc-950 p-4">
            <div className="flex items-end gap-2 max-w-4xl mx-auto">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="メッセージを入力..."
                    rows={1}
                    disabled={disabled}
                    className="flex-1 max-h-32 min-h-[44px] w-full resize-none rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-400"
                />
                <button
                    type="submit"
                    disabled={!content.trim() || disabled}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                    <SendHorizontal className="h-5 w-5" />
                    <span className="sr-only">Send</span>
                </button>
            </div>
        </form>
    )
}
