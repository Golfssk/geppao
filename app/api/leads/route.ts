import { NextResponse } from 'next/server';
export async function GET(req:Request){const url=new URL(req.url);return NextResponse.json({status:'prototype',message:'Lead endpoint ready for Supabase insert.',listingId:url.searchParams.get('listingId')});}
export async function POST(req:Request){const body=await req.json();return NextResponse.json({status:'prototype',lead:body});}
