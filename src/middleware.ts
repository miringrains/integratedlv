import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  const { data: { user } } = await supabase.auth.getUser()

  // Check if user needs to change password (using temp password)
  if (user) {
    const userMetadata = user.user_metadata || {}
    const passwordChanged = userMetadata.password_changed === true
    
    // If password not changed and trying to access portal (except settings/change-password)
    if (!passwordChanged && 
        request.nextUrl.pathname !== '/settings/change-password' &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/forgot-password') &&
        !request.nextUrl.pathname.startsWith('/reset-password')) {
      const url = request.nextUrl.clone()
      url.pathname = '/settings/change-password'
      return NextResponse.redirect(url)
    }
  }

  // Protect portal routes
  if (!user && request.nextUrl.pathname.startsWith('/home')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Protect all portal routes
  const portalRoutes = ['/home', '/locations', '/hardware', '/sops', '/tickets', '/admin', '/settings']
  const isPortalRoute = portalRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  
  if (!user && isPortalRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  // Allow access to password reset pages without authentication
  // Recovery session is handled via cookies by Supabase
  if (request.nextUrl.pathname === '/forgot-password' || request.nextUrl.pathname === '/reset-password') {
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

