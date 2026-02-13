export type Character = {
    id: string
    name: string
    description: string
    avatar_url?: string
    system_instruction: string
}

export type Message = {
    id: string
    role: 'user' | 'model'
    content: string
    created_at: string
}

export type ChatSession = {
    character_id: string
    messages: Message[]
}
