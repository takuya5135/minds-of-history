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
`
            }
        }

        let systemInstruction = character.system_instruction + '\n' + userProfileInfo

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
