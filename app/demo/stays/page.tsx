import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {demoEnabled,demoDestinations,searchDemoStays} from '@/lib/demo/stays';
import {parseStayQuery,bangkokToday,StayValidationError} from '@/lib/stays/query';
import {StayDiscovery} from '@/components/stays/StayDiscovery';
import {DemoNotice} from '@/components/demo/DemoNotice';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'DEMO · Stay discovery',robots:{index:false,follow:false}};
export default async function DemoStays({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 if(!demoEnabled(process.env.VERCEL_ENV,process.env.NODE_ENV))notFound();
 const raw=await searchParams,params=new URLSearchParams();
 for(const[key,value]of Object.entries(raw))for(const v of Array.isArray(value)?value:value?[value]:[])params.append(key,v);
 const today=bangkokToday();let query=parseStayQuery(new URLSearchParams(),today),error:string|null=null;
 try{query=parseStayQuery(params,today)}catch(e){error=e instanceof StayValidationError?e.code:'invalid'}
 return <><DemoNotice/><StayDiscovery demo initialQuery={query} initialResult={error?null:searchDemoStays(query)} initialError={error} destinations={demoDestinations} today={today}/></>;
}
