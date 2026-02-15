import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // 環境変数が欠落している場合のみダミー値を使用
    const finalUrl = supabaseUrl || 'https://placeholder.supabase.co'
    const finalKey = supabaseKey || 'placeholder'

    const supabase = createServerClient(
        finalUrl,
        finalKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (user) {
        // Fetch profile to check approval and completion status
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        // Waitlist logic
        const isApproved = profile?.is_approved
        const isWaitlistPage = request.nextUrl.pathname === '/waitlist'

        // Profile setup logic
        // Check if mandatory fields are present. Using 'birthdate' as a proxy for completion.
        const isProfileCompleted = profile?.birthdate !== null && profile?.birthdate !== undefined
        const isProfileSetupPage = request.nextUrl.pathname === '/profile/setup'

        // Route types
        const isApiRoute = request.nextUrl.pathname.startsWith('/api')
        const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
        const isStaticAsset = request.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)

        if (!isApiRoute && !isAuthRoute && !isStaticAsset) {
            // 1. Check Waitlist first
            if (!isApproved) {
                if (!isWaitlistPage) {
                    return NextResponse.redirect(new URL('/waitlist', request.url))
                }
                return supabaseResponse
            }

            // 2. Check Profile Completion (only for approved users)
            if (isApproved) {
                if (isWaitlistPage) {
                    // Redirect approved users away from waitlist
                    return NextResponse.redirect(new URL('/', request.url))
                }

                if (!isProfileCompleted) {
                    if (!isProfileSetupPage) {
                        return NextResponse.redirect(new URL('/profile/setup', request.url))
                    }
                }
            }
        }
    } else {
        const isLoginPage = request.nextUrl.pathname === '/login'
        const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
        const isPublicRoute = request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/waitlist' // Allow waitlist to be public-ish if needed, or strictly login

        if (!isLoginPage && !isAuthRoute && !isPublicRoute) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return supabaseResponse
}
