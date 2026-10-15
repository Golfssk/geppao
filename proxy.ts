import {NextResponse, type NextRequest} from 'next/server';
// A validated preference only; never used as an authorization signal.
export function proxy(request: NextRequest) {
  const explicit = request.nextUrl.searchParams.get('lang');
  const saved = request.cookies.get('geppao-locale')?.value;
  const locale = explicit === 'th' || explicit === 'en' ? explicit : saved === 'en' ? 'en' : 'th';
  const headers = new Headers(request.headers);
  headers.set('x-geppao-locale',locale);
  const response = NextResponse.next({request: {headers}});
  if (explicit === 'th' || explicit === 'en') response.cookies.set('geppao-locale',locale,{path:'/',sameSite:'lax',secure:request.nextUrl.protocol==='https:',maxAge:31536000});
  return response;
}
export const config = {matcher: ['/((?!api|_next/static|_next/image|favicon.ico|brand/).*)']};
