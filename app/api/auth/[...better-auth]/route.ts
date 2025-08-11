// app/api/auth/[...better-auth]/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/auth';

export const { GET, POST } = toNextJsHandler(auth);