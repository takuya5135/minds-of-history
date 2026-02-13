import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_approved')
            .eq('id', user.id)
            .single()

        const isApproved = profile?.is_approved
        const isWaitlistPage = request.nextUrl.pathname === '/waitlist'
        const isApiRoute = request.nextUrl.pathname.startsWith('/api')
        const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')

        if (!isApiRoute && !isAuthRoute) {
            if (!isApproved && !isWaitlistPage) {
                return NextResponse.redirect(new URL('/waitlist', request.url))
            }

            if (isApproved && isWaitlistPage) {
                return NextResponse.redirect(new URL('/', request.url))
            }
        }
    } else {
        const isLoginPage = request.nextUrl.pathname === '/login'
        const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
        const isPublicRoute = request.nextUrl.pathname === '/'

        if (!isLoginPage && !isAuthRoute && !isPublicRoute) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return supabaseResponse
}
