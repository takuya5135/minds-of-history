import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
    try {
        const { characterId, characterName } = await req.json()

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
        }

        // Fetch the conversation history for this character
        const { data: chat, error: chatError } = await supabase
            .from('chats')
            .select('id')
            .eq('user_id', user.id)
            .eq('character_id', characterId)
            .single()

        if (chatError || !chat) {
            console.error('Karte API: Chat not found for', { userId: user.id, characterId, chatError })
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
        }

        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('role, content')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true })

        if (messagesError || !messages || messages.length === 0) {
            console.error('Karte API: No messages found', { chatId: chat.id, messagesError })
            return NextResponse.json({ error: 'No messages to summarize' }, { status: 400 })
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        const chatContent = messages
            .map((m) => `${m.role === 'user' ? '相談者' : '偉人'}: ${m.content}`)
            .join('\n')

        const prompt = `
以下の相談内容と対話の履歴を読み取り、別の専門家（偉人）に相談するための要約を作成してください。
相談者はこのテキストをコピーして別の偉人に貼り付けることで、これまでの経緯を手短に説明できるようにしたいと考えています。

【ルール】
- 冒頭のタイトルは必ず「## カルテ（${characterName || '偉人'}との相談要約）」としてください。
- 相談者の現在の悩み、背景、これまでに得られた気づきを簡潔にまとめてください。
- 150文字〜300文字程度で、要点を絞って記述してください。
- 相談者がそのままコピペして使えるような、三人称または客観的な視点でのまとめにしてください。
- 「〜という状況です」「〜について気づきを得ています」といった丁寧な日本語で出力してください。

【対話履歴】
${chatContent}
`

        const result = await model.generateContent(prompt)
        const karte = result.response.text()

        return NextResponse.json({ karte })
    } catch (error: any) {
        console.error('Karte API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
