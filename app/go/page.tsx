import type {Metadata} from 'next';
import {ThailandExplorer} from '@/components/destinations/ThailandExplorer';
export const metadata:Metadata={title:'เก็บเป๋า ไปไหนดี? | แผนที่ประเทศไทย 77 จังหวัด',description:'สำรวจแผนที่ประเทศไทย เลือกจังหวัดและแลนด์มาร์กที่อยากไป แล้วค้นหาสถานที่และคู่มือจุดหมายกับ GepPao',alternates:{canonical:'https://geppao.vercel.app/go'}};
export default function GoPage(){return <ThailandExplorer/>}
