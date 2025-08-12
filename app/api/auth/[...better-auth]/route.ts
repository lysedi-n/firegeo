import { auth } from '@/lib/auth';
// Import the official Next.js integration from Better Auth.
// Earlier versions exported this helper under `better-auth/nextjs`, but
// the current package exposes it as `better-auth/next-js`.
import { toNextJsHandler } from 'better-auth/next-js';

const { GET, POST } = toNextJsHandler(auth);

export { GET, POST };