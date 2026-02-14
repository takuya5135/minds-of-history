'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/chat/Sidebar'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { CHARACTERS } from '@/lib/characters'
import { Character, Message } from '@/types/chat'
import { Menu, MoreHorizontal, Info, BookOpen, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const MAX_RETRIES = 3
const RETRY_DELAY = 1000

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options)
    if (!response.ok && retries > 0 && response.status >= 500) {
      throw new Error(`Server error: ${response.status}`)
    }
    return response
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (MAX_RETRIES - retries + 1)))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}

export default function ChatPage() {
  const [selectedCharId, setSelectedCharId] = useState<string>(CHARACTERS[0].id)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [savingWisdom, setSavingWisdom] = useState(false)
  const [user, setUser] = useState<any>(null)

  const router = useRouter()
  const supabase = createClient()

  // Load user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else {
        router.push('/login')
      }
    }
    getUser()
  }, [])

  const selectedChar = CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0]

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    // Optimistic update
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      // Filter out the welcome message if it exists (id: 'welcome') as it's not part of the conversation history for the API usually
      const history = updatedMessages
        .filter(m => m.id !== 'welcome')
        // Exclude the current message from history because we send it as 'message'
        .slice(0, -1)

      const response = await fetchWithRetry('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          history,
          characterId: selectedChar.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error Details:', errorData)
        throw new Error(errorData.error || `API request failed with status ${response.status}`)
      }

      const data = await response.json()

      const botResponse: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        content: data.text,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, botResponse])
    } catch (error: any) {
      console.error('Failed to send message:', error)

      let errorMessage = 'すみません、エラーが発生しました。もう一度お話しいただけますか？'
      if (error.message.includes('504') || error.message.includes('timeout')) {
        errorMessage = '考え込んでしまってタイムアウトしました。もう一度聞いてみてください。'
      } else if (error.message.includes('429')) {
        errorMessage = '少し混み合っているようです。少し時間を置いてから話しかけてください。'
      }

      const errorResponse: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        content: errorMessage,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setLoading(false)
    }
  }

  // Load history when character changes
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true)
      try {
        const response = await fetchWithRetry(`/api/chat?characterId=${selectedCharId}`, {
          method: 'GET'
        })

        if (response.ok) {
          const data = await response.json()
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages)
          } else {
            // Initial welcome message if no history
            setMessages([
              {
                id: 'welcome',
                role: 'model',
                content: `こんにちは。${selectedChar.name}です。何か悩み事はありますか？`,
                created_at: new Date().toISOString()
              }
            ])
          }
        }
      } catch (error) {
        console.error('Failed to load history:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadHistory()
    }
  }, [selectedCharId, user])

  const handleFinishConversation = async () => {
    if (!confirm('この会話を終了して「智慧の書」に記録しますか？\n現在のチャット履歴はリセットされます。')) return

    setSavingWisdom(true)
    try {
      const response = await fetch('/api/wisdom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: selectedCharId })
      })

      if (response.ok) {
        // Successfully saved wisdom and cleared chat
        alert('智慧の書に記録しました。')
        // Reset messages
        setMessages([
          {
            id: 'welcome',
            role: 'model',
            content: `こんにちは。${selectedChar.name}です。新たな対話を始めましょう。`,
            created_at: new Date().toISOString()
          }
        ])
        // Optional: Redirect to wisdom page or just stay
      } else {
        alert('保存に失敗しました。')
      }
    } catch (error) {
      console.error('Failed to save wisdom:', error)
      alert('エラーが発生しました。')
    } finally {
      setSavingWisdom(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-black overflow-hidden">
      <Sidebar
        characters={CHARACTERS}
        selectedId={selectedCharId}
        onSelect={setSelectedCharId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col h-full w-full relative">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white dark:bg-zinc-950 px-4 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold truncate">{selectedChar.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFinishConversation}
              disabled={savingWisdom || messages.length <= 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="会話を終了して智慧の書に記録する"
            >
              {savingWisdom ? (
                <span className="animate-pulse">記録中...</span>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">記録して終了</span>
                </>
              )}
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full" title={selectedChar.description}>
              <Info className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <MessageList
          messages={messages}
          character={selectedChar}
        />

        {/* Input Area */}
        <div className="w-full bg-white dark:bg-zinc-950">
          <MessageInput onSend={handleSendMessage} disabled={loading} />
        </div>
      </div>
    </div>
  )
}
