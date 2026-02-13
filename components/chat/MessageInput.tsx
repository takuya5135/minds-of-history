'use client'

import { useState, useRef, useEffect } from 'react'
import { SendHorizontal, Mic, MicOff } from 'lucide-react'

interface MessageInputProps {
    onSend: (content: string) => void
    disabled?: boolean
}

// Extend Window interface for Web Speech API
declare global {
    interface Window {
        webkitSpeechRecognition: any
        SpeechRecognition: any
    }
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
    const [content, setContent] = useState('')
    const [isListening, setIsListening] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const recognitionRef = useRef<any>(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition()
                recognition.continuous = false // Stop after one sentence/phrase
                recognition.interimResults = true
                recognition.lang = 'ja-JP'

                recognition.onresult = (event: any) => {
                    const transcript = Array.from(event.results)
                        .map((result: any) => result[0])
                        .map((result: any) => result.transcript)
                        .join('')

                    // If focusing on real-time updates, we might want to append or replace.
                    // Here we replace for simplicity as interim results come in.
                    // For better UX with existing text, complex logic is needed, 
                    // but for "voice input" usually dictation mode replaces or appends.
                    // Let's assume appending if not interim, but interim replaces current buffer?
                    // Simpler approach: update content with current transcript specific to this session?
                    // Actually, let's just use the final result to append to avoid overwriting typed text excessively.

                    if (event.results[0].isFinal) {
                        setContent(prev => prev + transcript)
                    }
                }

                recognition.onend = () => {
                    setIsListening(false)
                }

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error)
                    setIsListening(false)
                }

                recognitionRef.current = recognition
            }
        }
    }, [])

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('お使いのブラウザは音声入力をサポートしていません。Chromeなどをご利用ください。')
            return
        }

        if (isListening) {
            recognitionRef.current.stop()
        } else {
            recognitionRef.current.start()
            setIsListening(true)
        }
    }

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
                <button
                    type="button"
                    onClick={toggleListening}
                    disabled={disabled}
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors ${isListening
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                        }`}
                    title="音声入力"
                >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? "聞いています..." : "メッセージを入力..."}
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
