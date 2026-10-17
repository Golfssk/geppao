import {NextResponse, type NextRequest} from 'next/server';
import {refreshAuthSession} from '@/lib/supabase/proxy';
// A validated preference only; never used as an authorization signal.
export async function proxy(request: NextRequest) {
  // Stop before async layouts can stream a soft 404. This does not grant access to real admin routes.
  const pathname = request.nextUrl.pathname;
  if ((pathname === '/demo/admin' || pathname.startsWith('/demo/admin/'))
    && process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not found', {status: 404, headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'private, no-store',
    }});
  }
  const explicit = request.nextUrl.searchParams.get('lang');
  const saved = request.cookies.get('geppao-locale')?.value;
  const locale = explicit === 'th' || explicit === 'en' ? explicit : saved === 'en' ? 'en' : 'th';
  const headers = new Headers(request.headers);
  headers.set('x-geppao-locale',locale);
  const response = await refreshAuthSession(request,headers);
  if (explicit === 'th' || explicit === 'en') response.cookies.set('geppao-locale',locale,{path:'/',sameSite:'lax',secure:request.nextUrl.protocol==='https:',maxAge:31536000});
  return response;
}
export const config = {matcher: ['/((?!api|_next/static|_next/image|favicon.ico|brand/).*)']};
