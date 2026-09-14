import { NextResponse } from 'next/server';
import { listings } from '@/data';
export async function GET(){return NextResponse.json(listings);}
