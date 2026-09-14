import { NextResponse } from 'next/server';
import { listings } from '@/data';
import { prepareAgentContext } from '@/lib/ai/agent';
export async function POST(req:Request){const {input=''}=await req.json();const context=prepareAgentContext(listings,{});return NextResponse.json({status:'mock',message:'AI adapter ready. Connect a server-side model provider using env vars before production.',input,recommendedCandidates:context.slice(0,3).map(x=>({id:x.id,name:x.name,tier:x.tier,score:x.score}))});}
