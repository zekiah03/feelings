/**
 * 匿名ユーザーID Cookie を発行するミドルウェア
 *
 * Server Component は cookies().set() を呼べないため、
 * ミドルウェアでリクエスト/レスポンス双方に anonymous_user_id を注入する。
 */

import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_NAME = 'anonymous_user_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1年

export function middleware(request: NextRequest) {
  const existing = request.cookies.get(COOKIE_NAME)?.value;
  if (existing) return NextResponse.next();

  // Edge runtime なので Web Crypto の randomUUID を使う
  const id = crypto.randomUUID();

  // 同じリクエスト内の cookies() でも読めるようリクエスト側に先に注入
  request.cookies.set(COOKIE_NAME, id);

  const response = NextResponse.next({ request });
  response.cookies.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}

export const config = {
  // Next 内部アセット・画像などを除外してすべてのルートに適用
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
