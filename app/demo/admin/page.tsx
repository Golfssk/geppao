import {AdminOverview} from '@/components/admin/AdminOverview';
import {adminDemoPlaces} from '@/lib/admin/demo';
export default function DemoAdmin(){return <AdminOverview demo metrics={[{id:'pending',count:22,error:false},{id:'events',count:3,error:false},{id:'contacts',count:4,error:false},{id:'published',count:2,error:false}]} places={adminDemoPlaces.slice(0,5)} error={false}/>}
