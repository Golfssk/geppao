import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {createHealthCheck} from '@/lib/health/status';

export const dynamic = 'force-dynamic';
const checkHealth = createHealthCheck({
  isConfigured: () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  probe: async signal => {
    // Explicit anonymous client: health must not depend on the caller's cookies or role.
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
    });
    const results = await Promise.all([
      client.from('destinations').select('id', {head: true}).limit(1).abortSignal(signal),
      client.from('places').select('id', {head: true}).eq('publication_status', 'published').limit(1).abortSignal(signal),
      client.from('events').select('id', {head: true}).eq('publication_status', 'published').limit(1).abortSignal(signal),
    ]);
    // An empty public catalog is still reachable, not a database outage.
    return results.every(result => !result.error);
  },
});
export async function GET() {
  const body = await checkHealth();
  return NextResponse.json(body, {
    status: body.status === 'ok' ? 200 : 503,
    headers: {'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow'},
  });
}
