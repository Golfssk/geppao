import type {Metadata} from 'next';
import {HomePlannerCTA} from '@/components/home/HomePlannerCTA';
import {ThailandExplorer} from '@/components/destinations/ThailandExplorer';
import {TravelTrustBand} from '@/components/home/TravelTrustBand';
import {HostCTA} from '@/components/home/HostCTA';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:{absolute:'GepPao | เก็บเป๋า ไปไหนดี? เริ่มทริปจากที่ที่อยากไป'},description:'สำรวจประเทศไทย 77 จังหวัด ค้นหาที่พัก ร้านอาหาร คาเฟ่ และที่เที่ยว แล้วต่อเป็นแผนทริปของคุณใน GepPao',alternates:{canonical:'https://geppao.vercel.app'}};
export default function Home(){
 return <main>
  <ThailandExplorer/>
  <HomePlannerCTA/>
  <TravelTrustBand/><HostCTA/>
 </main>
}
