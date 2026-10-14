import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {demoEnabled,demoStays} from '@/lib/demo/stays';
import {parseStayQuery,stayQueryParams} from '@/lib/stays/query';
import {StayDetail} from '@/components/stays/StayDetail';
import {DemoNotice} from '@/components/demo/DemoNotice';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'DEMO · Property detail',robots:{index:false,follow:false}};
export default async function DemoDetail({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 if(!demoEnabled(process.env.VERCEL_ENV,process.env.NODE_ENV))notFound();
 const {slug}=await params,stay=demoStays.find(x=>x.slug===slug);if(!stay)notFound();
 const raw=await searchParams,context=new URLSearchParams();for(const[key,value]of Object.entries(raw))for(const v of Array.isArray(value)?value:value?[value]:[])context.append(key,v);
 let searchContext='';try{searchContext=stayQueryParams(parseStayQuery(context)).toString()}catch{/* Never forward malformed context. */}
 const place={...stay,phone:null,website_url:null,child_friendly:null,reservation_required:false,
  accommodation:{check_in_time:stay.check_in_time,check_out_time:stay.check_out_time,maximum_guests:stay.maximum_guests},
  prices:stay.price===null?[]:[{label:'DEMO · Fictional reference price / ราคาตัวอย่าง',amount_min:stay.price,amount_max:stay.price_max,currency:'THB',price_unit:'night',is_estimate:true}]};
 return <main className="page"><DemoNotice/><StayDetail demo place={place} images={[]} mapUrl={null} searchContext={searchContext}/></main>;
}
