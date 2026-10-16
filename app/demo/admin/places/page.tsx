import {AdminPlaceQueue} from '@/components/admin/AdminPlaceQueue';
import {parseAdminQuery} from '@/lib/admin/query';
import {searchAdminDemo} from '@/lib/admin/demo';
export default async function DemoAdminPlaces({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const query=parseAdminQuery(await searchParams),result=searchAdminDemo(query);return <AdminPlaceQueue demo query={query} {...result} error={false}/>}
