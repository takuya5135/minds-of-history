export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    avatar_url: string | null
                    is_approved: boolean | null
                    birthdate: string | null
                    occupation: string | null
                    gender: string | null
                    marital_status: string | null
                    children_count: number | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    username?: string | null
                    avatar_url?: string | null
                    is_approved?: boolean | null
                    birthdate?: string | null
                    occupation?: string | null
                    gender?: string | null
                    marital_status?: string | null
                    children_count?: number | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    username?: string | null
                    avatar_url?: string | null
                    is_approved?: boolean | null
                    birthdate?: string | null
                    occupation?: string | null
                    gender?: string | null
                    marital_status?: string | null
                    children_count?: number | null
                    updated_at?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
