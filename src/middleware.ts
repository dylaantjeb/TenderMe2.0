import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/tenders/:path*',
    '/settings/:path*',
    '/team/:path*',
    '/api/tenders/:path*',
    '/api/upload/:path*',
  ],
};
