import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import { CHARACTERS } from '@/lib/characters'
import { createClient } from '@/utils/supabase/server'

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

        let userProfileInfo = ''
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profile) {
                userProfileInfo = `
【相談者（ユーザー）情報】
- 名前: ${profile.username || '不明'}
- 年齢: ${profile.age ? profile.age + '歳' : '不明'}
- 職業: ${profile.occupation || '不明'}
- 性別: ${profile.gender || '不明'}
- 配偶者: ${profile.marital_status || '不明'}
- 子供の数: ${profile.children_count !== null ? profile.children_count + '人' : '不明'}

この相談者情報（特に年齢、職業、家族構成）を考慮し、相手の立場や状況に寄り添った対話を行ってください。
`
            }
        }

        let systemInstruction = character.system_instruction + '\n' + userProfileInfo

        // Special handling for group chat
        if (characterId === 'group') {
            const participants = CHARACTERS.filter(c => c.id !== 'group')
            const participantsInfo = participants.map(c => `
---
【名前】${c.name}
【特徴】${c.description}
【思考プロセス】${c.system_instruction}
---
`).join('\n')

            systemInstruction = `
你是「賢者の円卓」の進行役兼、全偉人の知識を持つAIです。
ユーザーの問いかけに対して、以下の偉人たちの中から最も適切と思われる1名〜3名を選出し、それぞれの偉人になりきって発言させてください。

【参加している偉人リスト】
${participantsInfo}

${userProfileInfo}

【重要：応答フォーマット】
発言する偉人の名前を角括弧で囲み、改行してから発言内容を記述してください。複数の偉人が発言する場合は、空行を挟んで続けてください。

例：
[ソクラテス]
君の言う「幸せ」とは、具体的にどのような状態を指すのかね？

[マキャベリ]
理想を語るのも良いが、現実的な利益を確保しなければ幸せなど絵に描いた餅だ。

【ルール】
- 偉人同士が意見を戦わせたり、補完し合ったりする様子を描写してください。
- 誰が発言しているか明確にするため、必ず [名前] を行頭に付けてください。

【出力ルール：慈愛と峻厳の三段論法】
各偉人の回答は、以下の「受容・示唆・問い」の3ステップで構成しなさい。
ただし、「受容：」「示唆：」などの項目名は出力せず、自然な文章として繋げなさい。

1. 受容（Empathy）： まずは相手の現在の苦しみや状況を、あなたの哲学的な視点から肯定し、寄り添いなさい。（例：「その悩みは、君が真剣に生きようとしている証拠だ」）
2. 示唆（Insight）： 寄り添った上で、あなたの思想に基づいた「核心的なアドバイス（智慧）」を一言で伝えなさい。
3. 問い（Question）： 最後に、相手が自ら一歩踏み出すための「短い問い」を投げかけなさい。

制約事項：
全体で5文以内、200文字程度。
「解説」や「一般論」は不要。
相手を突き放すのではなく、隣に座って共に深淵を覗き込むような温度感を保つこと。
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
