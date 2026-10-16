import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {demoEnabled} from '@/lib/demo/stays';
import {AdminWorkspace} from '@/components/admin/AdminWorkspace';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'DEMO · GepPao Admin',robots:{index:false,follow:false}};
export default function DemoAdminLayout({children}:{children:React.ReactNode}){if(!demoEnabled(process.env.VERCEL_ENV,process.env.NODE_ENV))notFound();return <AdminWorkspace demo>{children}</AdminWorkspace>}
