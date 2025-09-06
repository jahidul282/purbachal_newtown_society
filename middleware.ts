import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "pns_token";
const ADMIN_COOKIE = "admin_token";
const AUTH_PAGES = ["/auth/login", "/auth/register"]; // pages users shouldn't see when logged in
const PROTECTED_PAGES = ["/profile"]; // pages that require member auth
const ADMIN_PROTECTED = ["/dashboard"]; // dashboard requires admin auth

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;

  const isAuth = Boolean(token);
  const isAuthPage = AUTH_PAGES.some(p => pathname.startsWith(p));
  const isProtected = PROTECTED_PAGES.some(p => pathname.startsWith(p));
  const isAdminProtected = ADMIN_PROTECTED.some(p => pathname.startsWith(p));

  // If logged in, block access to login/register -> redirect to profile
  if (isAuth && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }

  // If not logged in, block access to protected pages -> redirect to login
  if (!isAuth && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If no admin token, block access to dashboard -> redirect to admin login
  if (!adminToken && isAdminProtected) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Exclude all API routes and Next internals; only run on app pages
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
