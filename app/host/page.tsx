import type {Metadata} from 'next';
import {HostLanding} from '@/components/host/HostLanding';
export const metadata:Metadata={title:'เจ้าของที่พัก · GepPao for Hosts',description:'Prepare accurate place information, create a draft and submit for review. ลงประกาศสำหรับเจ้าของที่พักและธุรกิจท้องถิ่น'};
export default function Host(){return <HostLanding/>;}
