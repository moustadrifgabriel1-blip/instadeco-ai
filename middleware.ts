import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    '/',
    // Localized app routes — exclude API, Next internals, static files, blog, OAuth callbacks
    '/((?!api|_next|_vercel|blog|auth|.*\\..*).*)',
  ],
};
