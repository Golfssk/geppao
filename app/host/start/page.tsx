import type {Metadata} from 'next';
import {HostPreparation} from '@/components/host/HostPreparation';
export const metadata:Metadata={title:'เตรียมลงประกาศ · Host preparation'};
export default function HostStart(){return <HostPreparation/>;}
