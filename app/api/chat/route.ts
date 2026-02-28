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
                // Check for first-time tutorial
                if (characterId === 'concierge' && !profile.has_seen_tutorial) {
                    userProfileInfo += `
【重要：初回ユーザーへの対応（First Interaction）】
これはユーザーの初回の訪問です。通常の挨拶は省略し、以下の手順で親身に案内を行ってください。
1. **歓迎**: 「Minds of Historyへようこそ。私はあなたの案内人を務めるコンシェルジュです」と名乗る。
2. **目的**: このアプリが「先人の知恵と共に生きる」ための場所であることを簡潔に伝える。
3. **機能紹介**:
   - **カルテ**: 「カルテを作成すれば、他の偉人にもスムーズに相談を引き継げます」と伝える。
   - **智慧の書**: 「対話の結論は『智慧の書』に保存して、いつでも読み返せます」と伝える。
4. **開始**: 「それでは、まずはあなたのことについて少し教えていただけますか？」と優しく問いかける。
`
                    // Update flag immediately to prevent repeated tutorial
                    await supabase.from('profiles').update({ has_seen_tutorial: true }).eq('id', user.id)
                }

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

                userProfileInfo += `
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

                // Secret Context Injection
                if (profile.secret_context) {
                    userProfileInfo += `
##################################################
【極秘：相談者の深層背景（Secret Context）】
管理者のみが知る、相談者の隠された背景情報です。
内容: ${profile.secret_context}

【絶対遵守の制約事項（Strict Rules）】
1. 上記の「秘密のコンテキスト」に含まれる単語や具体的な病名・カテゴリ名を、**絶対に対話中で使用してはなりません**。
   （例：「あなたは〇〇ですね」といった指摘や診断は厳禁です。）
2. 相談者自身がそのことに触れていない限り、絶対にその話題を振らないでください。

【行動指針（Deep Empathy）】
1. 言葉には出さずとも、この背景から推測される「生きづらさ」「苦悩」「独自の感性」を深く理解してください。
2. 表面的な慰めではなく、その「隠された痛み」や「特性」を、偉人としての歴史的経験や哲学を用いて肯定し、エンパワーメントしてください。
   （例：孤独を感じているなら、それを「孤高の精神」として称賛するなど）
##################################################
`
                }
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
   **1回の回答（出力）の中に、必ず以下の2つのセクションを両方含めてください。**
   
   セクション1: [コンシェルジュ]として、ユーザーの悩みを分析し、最も適した偉人を「1名」具体的に指名する。
   セクション2: その直後に、指名された[偉人名]になりきって、深みのある回答を出力する。
   
   ※「コンシェルジュが指名して終わり」にするのは絶対に禁止です。必ずその後に偉人の発言を続けてください。

3. 禁止事項:
   - コンシェルジュの指名なしに、偉人が勝手に発言すること。
   - 一度に「〇〇さんと××さん」と二人以上を指名すること（必ず一人ずつ）。
   - 偉人のリストにない人物を捏造すること。
4. 「深掘り」と「カルテ案内」の禁止:
   - あなた（コンシェルジュ）一人で2〜4回も対話を続ける必要はありません。最初の返答からすぐに適切な偉人を指名し、議論を始めてください。
   - 対話の進行中に「カルテ作成」の案内や、「そろそろお勧めの偉人を紹介しましょうか？」といった意思確認を行うことは、議論の流れを遮るため**厳禁**です。

5. 言語制約（重要）:
   - 出力はすべて「自然な日本語」で行うこと。
   - 英語、ロシア語（キリル文字）などの外国語の混入は**システムエラー**とみなされます。絶対に使用しないでください。

【参加している偉人リスト（ここから指名する）】
${participantsInfo}

${userProfileInfo}

【重要：出力フォーマット（必ず一つの回答内にこれらを記述せよ）】
[コンシェルジュ]
（分析した上で「それでは、〇〇さん、お願いします」等で指名）

[指名された偉人名]
（指名された偉人として、知恵を授ける回答を行う）
`
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
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
        // For group chat, we split the response into separate messages per character
        let messageParts: string[] = []
        if (characterId === 'group') {
            // More robust regex: handle optional spaces and different newline characters
            const regex = /\[([^\]]+)\]\s*?\n?([\s\S]*?)(?=\s*?\n?\[|$)/g
            let match
            while ((match = regex.exec(text)) !== null) {
                const fullMatch = match[0].trim()
                if (fullMatch) {
                    messageParts.push(fullMatch)
                }
            }
        }

        // Fallback: if splitting failed or not a group chat, save as one
        if (messageParts.length === 0) {
            messageParts = [text]
        }

        const savedMessages = []
        for (const part of messageParts) {
            if (!part.trim()) continue;

            const { data: savedMsg, error: insertError } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    role: 'model',
                    content: part.trim()
                })
                .select()
                .single()

            if (insertError) throw insertError
            savedMessages.push(savedMsg)
        }

        return NextResponse.json({
            text, // Keep for backward compatibility if needed
            messages: savedMessages
        })
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
