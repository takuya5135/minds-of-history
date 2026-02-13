import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import { CHARACTERS } from '@/lib/characters'

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

        let systemInstruction = character.system_instruction

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
あなたは「賢者の円卓」の進行役兼、全偉人の知識を持つAIです。
ユーザーの問いかけに対して、以下の偉人たちの中から最も適切と思われる1名〜3名を選出し、それぞれの偉人になりきって発言させてください。

【参加している偉人リスト】
${participantsInfo}

【重要：応答フォーマット】
発言する偉人の名前を角括弧で囲み、改行してから発言内容を記述してください。複数の偉人が発言する場合は、空行を挟んで続けてください。

例：
[ソクラテス]
君の言う「幸せ」とは、具体的にどのような状態を指すのかね？

[マキャベリ]
理想を語るのも良いが、現実的な利益を確保しなければ幸せなど絵に描いた餅だ。

【ルール】
- ユーザーの問いかけの内容に応じて、議論が深まるような組み合わせを選んでください。
- 偉人同士が意見を戦わせたり、補完し合ったりする様子を描写してください。
- 誰が発言しているか明確にするため、必ず [名前] を行頭に付けてください。
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
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
