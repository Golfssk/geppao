import {NextResponse} from 'next/server';
import {parseStayQuery, StayValidationError} from '@/lib/stays/query';
import {searchPublicStays} from '@/lib/stays/server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const headers = {'Cache-Control': 'private, no-store'};
  try {
    const query = parseStayQuery(new URL(request.url).searchParams);
    return NextResponse.json(await searchPublicStays(query), {headers});
  } catch (error) {
    if (error instanceof StayValidationError) return NextResponse.json({error: error.code}, {status: 400, headers});
    return NextResponse.json({error: 'unavailable'}, {status: 503, headers});
  }
}
