import {redirect} from 'next/navigation';
import {legacyStaySearchHref} from '@/lib/search/query';
export default async function Stays({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  redirect(legacyStaySearchHref(await searchParams));
}
