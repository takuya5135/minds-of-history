import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import { CHARACTERS } from '@/lib/characters'
import { createClient } from '@/utils/supabase/server'

// Helper to get or create chat session
async function getOrCreateChatId(supabase: any, userId: string, characterId: string) {
    const { data: chat } = await supabase
        .from('chats')
        .select('id')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .single()

    if (chat) return chat.id

    const { data: newChat, error } = await supabase
        .from('chats')
        .insert({ user_id: userId, character_id: characterId })
        .select('id')
        .single()

    if (error) throw error
    return newChat.id
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const characterId = searchParams.get('characterId')

        if (!characterId) {
            return NextResponse.json({ error: 'Character ID required' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: chat } = await supabase
            .from('chats')
            .select('id')
            .eq('user_id', user.id)
            .eq('character_id', characterId)
            .single()

        if (!chat) {
            return NextResponse.json({ messages: [] })
        }

        const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true })

        return NextResponse.json({ messages: messages || [] })
    } catch (error: any) {
        console.error('History API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const { message, history, characterId } = await req.json()
        const character = CHARACTERS.find((c) => c.id === characterId)

        if (!character) {
            return NextResponse.json(
                { error: 'Character not found' },
                { status: 400 }
            )
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key not configured' },
                { status: 500 }
            )
        }

        // Fetch user profile
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // 1. Get or Create Chat Session & Save User Message
        const chatId = await getOrCreateChatId(supabase, user.id, characterId)

        // Save user message (fire and forget or await, better await to ensure order/success)
        await supabase.from('messages').insert({
            chat_id: chatId,
            role: 'user',
            content: message
        })

        let userProfileInfo = ''
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profile) {
                // Calculate age from birthdate
                let ageString = '不明'
                if (profile.birthdate) {
                    const birthDate = new Date(profile.birthdate)
                    const today = new Date()
                    let age = today.getFullYear() - birthDate.getFullYear()
                    const m = today.getMonth() - birthDate.getMonth()
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        age--
                    }
                    ageString = age + '歳'
                }

                userProfileInfo = `
【相談者（ユーザー）情報】
- 名前: ${profile.username || '不明'}
- 年齢: ${ageString}
- 職業: ${profile.occupation || '不明'}
- 性別: ${profile.gender || '不明'}
- 配偶者: ${profile.marital_status || '不明'}
- 子供の数: ${profile.children_count !== null ? profile.children_count + '人' : '不明'}


この相談者情報（特に年齢、職業、家族構成）を考慮し、相手の立場や状況に寄り添った対話を行ってください。

【重要：年齢に合わせた対応】
もし相談者が子供（特に10代前半以下）の場合は、難しい言葉を使わず、その年齢の子でも理解できる平易な言葉で語りかけてください。
大人の場合は、その職業や立場にふさわしい知的な対話を行ってください。
`
            }
        }

        let systemInstruction = character.system_instruction + '\n' + userProfileInfo

        // Inject current turn count if it's the concierge to help them follow the 2-4 turn rule
        if (characterId === 'concierge') {
            const turnCount = (history?.length || 0) / 2 + 1
            systemInstruction += `\n【現在の対話状況】\n現在は相談者との対話の **${Math.floor(turnCount)}回目** の応酬です。\n2〜4回程度の深い対話を行ってから、偉人の紹介の是非を尋ねてください。`
        }

        // Special handling for group chat
        if (characterId === 'group') {
            const concierge = CHARACTERS.find(c => c.id === 'concierge')
            const participants = CHARACTERS.filter(c => c.id !== 'group' && c.id !== 'concierge')
            const participantsInfo = participants.map(c => `
---
【名前】${c.name}
【特徴】${c.description}
【思考プロセス】${c.system_instruction}
---
`).join('\n')

            systemInstruction = `
${concierge?.system_instruction || ''}

【賢者の円卓 進行ルール（絶対遵守）】
1. 進行役: あなたは「コンシェルジュ」として振る舞い、対話の口火を切りなさい。
2. 発言順序:
   ステップ1: [コンシェルジュ]として、ユーザーの悩みを分析し、最も適した偉人を「1名」指名する。
   ステップ2: 【間髪入れずに】、その指名された[偉人名]として回答を出力する。
   
   ※悪い例：コンシェルジュが指名して終了している。
   ※良い例：コンシェルジュが指名し、直後の行でその偉人が喋っている。

3. 禁止事項:
   - コンシェルジュの指名なしに、偉人が勝手に発言すること。
   - 一度に「〇〇さんと××さん」と二人以上を指名すること（必ず一人ずつ）。
   - 偉人のリストにない人物を捏造すること。

【参加している偉人リスト（ここから指名する）】
${participantsInfo}

${userProfileInfo}

【重要：出力フォーマット（必ずこの通りに出力せよ）】
[コンシェルジュ]
（分析と指名 ※「それでは〇〇さん、お願いします」等で結ぶ）

[指名された偉人名]
（回答 ※コンシェルジュの指名を受けて即座に話し始めること）

[コンシェルジュ]
（次の指名 ※必要な場合のみ）

[次の偉人名]
（回答）
`
        }



        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash', // Using 2.0 Flash for speed/cost, or use gemini-1.5-pro
            systemInstruction: systemInstruction
        })

        const chat = model.startChat({
            history: history.map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            })),
        })

        const result = await chat.sendMessage(message)
        const response = await result.response
        const text = response.text()

        // 2. Save Model Response
        await supabase.from('messages').insert({
            chat_id: chatId,
            role: 'model',
            content: text
        })

        return NextResponse.json({ text })
    } catch (error: any) {
        console.error('Chat API Error:', error)

        const status = error.message?.includes('429') ? 429 : 500
        const message = error.message || 'Internal Server Error'

        return NextResponse.json(
            { error: message },
            { status: status }
        )
    }
}

export async function DELETE(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get all chat IDs for this user
        const { data: chats } = await supabase
            .from('chats')
            .select('id')
            .eq('user_id', user.id)

        if (chats && chats.length > 0) {
            const chatIds = chats.map(c => c.id)

            // Delete all messages in these chats
            const { error: deleteError } = await supabase
                .from('messages')
                .delete()
                .in('chat_id', chatIds)

            if (deleteError) throw deleteError
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Delete History Error:', error)
        return NextResponse.json({ error: 'Failed to delete history' }, { status: 500 })
    }
}
