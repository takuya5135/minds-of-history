import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { CHARACTERS } from '@/lib/characters'

export async function POST(req: Request) {
    try {
        const { characterId } = await req.json()

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Get Chat ID
        const { data: chat } = await supabase
            .from('chats')
            .select('id')
            .eq('user_id', user.id)
            .eq('character_id', characterId)
            .single()

        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
        }

        // 2. Fetch Messages
        const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true })

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

        const conversationText = messages.map(m => `${m.role === 'user' ? '相談者' : characterName}: ${m.content}`).join('\n')

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        const prompt = `
以下の対話ログは、相談者と${characterName}との対話です。
この対話から得られた「智慧」を、後で見返せるように要約してください。

【出力フォーマット（Markdown）】
# [タイトル：相談内容を一言で]

## 💡 相談の核心
（相談者が抱えていた本質的な悩みや課題を簡潔に）

## 🗝️ ${characterName}の教え
（偉人が提示した視点、哲学、アドバイスの要点）

## 🚀 明日へのアクション
（相談者が実行すべきこと、持ち帰るべき心のあり方）

---
【対話ログ】
${conversationText}
`

        const result = await model.generateContent(prompt)
        const summary = result.response.text()

        // Extract title (first line usually) or generate a generic one
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

        // 5. Clear Messages (Archive/Delete)
        // We delete messages to "finish" the conversation and free up the chat for a new topic
        await supabase
            .from('messages')
            .delete()
            .eq('chat_id', chat.id)

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
