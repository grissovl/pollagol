import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session token (needed on every request that reaches the middleware)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // API routes: let them through so they can read the refreshed session,
  // but don't enforce auth redirect (each handler decides its own auth).
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  const authPages = ['/login', '/register', '/forgot-password']
  const isAuthPage = authPages.includes(pathname)

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - _next/static  (Next.js build output)
     *  - _next/image   (image optimization)
     *  - favicon.ico, manifest.json
     *  - /icons/       (PWA icons)
     *  - sw.js, workbox-*.js (service worker files)
     *  - static image/font extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|sw.js|workbox-.*\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
