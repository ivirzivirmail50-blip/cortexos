// Clerk kaldırıldı - kişisel kullanım için auth gerekmez
// Tüm sayfalar direkt erişilebilir
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // / adresine gelince direkt dashboard'a yönlendir
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
