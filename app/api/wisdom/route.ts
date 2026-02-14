import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { CHARACTERS } from '@/lib/characters'

export async function POST(req: Request) {
    try {
        const { characterId } = await req.json() // Representative character

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Fetch all chats for the user and their messages
        const { data: userChats } = await supabase
            .from('chats')
            .select('id, character_id')
            .eq('user_id', user.id)

        if (!userChats || userChats.length === 0) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
        }

        const chatIds = userChats.map(c => c.id)

        // 2. Fetch all messages across these chats ordered chronologically
        const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('*, chats(character_id)')
            .in('chat_id', chatIds)
            .order('created_at', { ascending: true })

        if (msgError) throw msgError

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'No messages to summarize' }, { status: 400 })
        }

        // 3. Summarize with Gemini
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
        }

        const character = CHARACTERS.find(c => c.id === characterId)
        const characterName = character ? character.name : '偉人'

        // Construct a comprehensive log
        const conversationText = messages.map(m => {
            const charId = (m.chats as any)?.character_id
            const chatChar = CHARACTERS.find(c => c.id === charId)
            const name = m.role === 'user' ? '相談者' : (chatChar?.name || '偉人')
            return `${name}: ${m.content}`
        }).join('\n')

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }) // Using Pro for better summarization of multi-turn logic

        const prompt = `
あなたは数々の偉人の知恵を編纂する書記官です。
以下の対話ログは、相談者がコンシェルジュや偉人たちと行った一連の対話記録です。
この対話全体を貫く「智慧」を、後で見返せるように要約してください。
特に、偉人たちがどのような解決策や視点を示したかを重視してください。

【出力フォーマット（Markdown）】
# [タイトル：相談内容から導き出された智慧の主題]

## 💡 相談の核心
（相談者が抱えていた本質的な悩みや課題を、一連の対話を踏まえて簡潔に）

## 🗝️ 偉人たちの教え
（対話に登場した各偉人が提示した視点、哲学、アドバイスの要点。誰が何を言ったか明確にすること）

## 🚀 明日へのアクション
（対話を通じて相談者が実行すべきこと、持ち帰るべき心のあり方）

---
【対話ログ】
${conversationText}
`

        const result = await model.generateContent(prompt)
        const summary = result.response.text()

        const titleMatch = summary.match(/^#\s*(.+)$/m)
        const title = titleMatch ? titleMatch[1] : `${characterName}との対話`

        // 4. Save to Wisdoms
        const { error: insertError } = await supabase
            .from('wisdoms')
            .insert({
                user_id: user.id,
                character_id: characterId,
                title: title,
                summary: summary
            })

        if (insertError) throw insertError

        // 5. Clear ALL summarized messages and cleanup chats
        await supabase
            .from('messages')
            .delete()
            .in('chat_id', chatIds)

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Wisdom API Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Auto-cleanup: Delete wisdoms older than 30 days
        const retentionPeriodDays = 30
        const cleanupThreshold = new Date()
        cleanupThreshold.setDate(cleanupThreshold.getDate() - retentionPeriodDays)

        // Fire and forget cleanup (or await if strict consistency is needed, await is safer to ensure user doesn't see old data)
        const { error: cleanupError } = await supabase
            .from('wisdoms')
            .delete()
            .lt('created_at', cleanupThreshold.toISOString())
            .eq('user_id', user.id) // Only delete user's own data to be safe in this scope, though RLS handles it.

        if (cleanupError) {
            console.error('Auto-cleanup error:', cleanupError)
            // Continue fetching, don't block user for cleanup error
        }

        const { data: wisdoms, error } = await supabase
            .from('wisdoms')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ wisdoms })
    } catch (error: any) {
        console.error('Wisdom API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch wisdoms' }, { status: 500 })
    }
}
