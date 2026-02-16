'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/chat/Sidebar'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { CHARACTERS } from '@/lib/characters'
import { Character, Message } from '@/types/chat'
import { Menu, Send, Bot, User, Loader2, Save, Info, Trash2, FileText, X, Copy, Check } from 'lucide-react'
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
  const [profile, setProfile] = useState<any>(null)
  const [isKarteModalOpen, setIsKarteModalOpen] = useState(false)
  const [karteText, setKarteText] = useState('')
  const [isGeneratingKarte, setIsGeneratingKarte] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Load user and profile
  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single()

        if (profile) {
          setProfile(profile)
        }
      } else {
        router.push('/login')
      }
    }
    getUserAndProfile()
  }, [])

  const selectedChar = CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0]

  const handleSendMessage = async (content: string) => {
    if (loading || !content.trim()) return

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
      // Filter out only the welcome message
      const history = updatedMessages
        .filter(m => m.id !== 'welcome')
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
        console.error('API Error Details:', { status: response.status, data: errorData })
        throw new Error(errorData.error || `APIエラー (${response.status})`)
      }

      const data = await response.json()

      if (data.messages && Array.isArray(data.messages)) {
        // Sequentially add messages with a delay
        for (let i = 0; i < data.messages.length; i++) {
          const msg = data.messages[i]
          if (i === 0) {
            setMessages(prev => [...prev, msg])
          } else {
            // Keep loading true while waiting for the next part
            setLoading(true)
            await new Promise(resolve => setTimeout(resolve, i === 1 ? 1200 : 2000))
            setMessages(prev => [...prev, msg])
          }
        }
      } else if (data.text) {
        const botResponse: Message = {
          id: crypto.randomUUID(),
          role: 'model',
          content: data.text,
          created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, botResponse])
      }
    } catch (error: any) {
      console.error('Failed to send message:', error)

      let errorMessage = `すみません、エラーが発生しました: ${error.message}`
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

  const [lastRefresh, setLastRefresh] = useState(Date.now())

  // Load history when character changes or refresh triggered
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true)
      try {
        const response = await fetchWithRetry(`/api/chat?characterId=${selectedCharId}&t=${lastRefresh}`, {
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
  }, [selectedCharId, user, lastRefresh])

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
        // Trigger re-fetch for all rooms by updating the refresh timestamp
        setLastRefresh(Date.now())
        // Reset current messages immediately for better UX
        setMessages([
          {
            id: 'welcome',
            role: 'model',
            content: `こんにちは。${selectedChar.name}です。新たな対話を始めましょう。`,
            created_at: new Date().toISOString()
          }
        ])
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

  const handleDeleteAllHistory = async () => {
    if (!confirm('全てのチャット記録を削除しますか？\nこの操作は取り消せません。')) return

    try {
      const response = await fetch('/api/chat', { method: 'DELETE' })
      if (response.ok) {
        setMessages([
          {
            id: 'welcome',
            role: 'model',
            content: `全ての履歴を削除しました。新しい対話を始めましょう。`,
            created_at: new Date().toISOString()
          }
        ])
        alert('全ての履歴を削除しました。')
      } else {
        alert('削除に失敗しました。')
      }
    } catch (error) {
      console.error('Failed to delete history:', error)
      alert('エラーが発生しました。')
    }
  }

  const handleCreateKarte = async () => {
    setIsGeneratingKarte(true)
    try {
      const response = await fetch('/api/karte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: selectedCharId })
      })

      if (response.ok) {
        const data = await response.json()
        setKarteText(data.karte)
        setIsKarteModalOpen(true)
      } else {
        const errorData = await response.json()
        alert(`カルテの作成に失敗しました: ${errorData.error || '不明なエラー'}\nもう少し対話を重ねてからお試しください。`)
      }
    } catch (error) {
      console.error('Failed to create karte:', error)
      alert('エラーが発生しました。')
    } finally {
      setIsGeneratingKarte(false)
    }
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(karteText)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
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
        userProfile={profile}
      />

      <div className="flex flex-1 flex-col h-full relative bg-white dark:bg-zinc-950 overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white dark:bg-zinc-950 px-4 shadow-sm z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 md:hidden shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg md:text-xl font-bold truncate">{selectedChar.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateKarte}
              disabled={isGeneratingKarte || messages.length <= 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full disabled:opacity-50 transition-colors"
              title="他の偉人に相談するためのカルテを作成"
            >
              {isGeneratingKarte ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span className="hidden lg:inline">カルテ作成</span>
                </>
              )}
            </button>

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

            <button
              onClick={handleDeleteAllHistory}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-gray-400 hover:text-red-500 transition-colors"
              title="全てのチャット履歴を削除"
            >
              <Trash2 className="h-5 w-5" />
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
          userAvatarUrl={profile?.avatar_url}
          userName={profile?.username}
        />

        <div className="shrink-0 border-t bg-white dark:bg-zinc-950 p-4">
          <MessageInput onSend={handleSendMessage} disabled={loading} />
        </div>
      </div>

      {/* Karte Modal */}
      {isKarteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-bold">偉人に渡すカルテ（要約）</h3>
              </div>
              <button onClick={() => setIsKarteModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                この要約をコピーして、他の偉人とのチャットに貼り付けることで、これまでの相談内容をスムーズに伝えることができます。
              </p>
              <div className="relative group">
                <pre className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border dark:border-zinc-800 text-sm whitespace-pre-wrap leading-relaxed font-sans min-h-[150px]">
                  {karteText}
                </pre>
                <button
                  onClick={handleCopyToClipboard}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-all shadow-lg active:scale-95"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>コピー完了</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>コピーする</span>
                    </>
                  )}
                </button>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => setIsKarteModalOpen(false)}
                  className="w-full p-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl font-medium transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
