import Link from 'next/link';
import './business.css';
export default function BusinessLayout({children}:{children:React.ReactNode}){return <><header className="business-bar"><div className="business-bar-inner"><Link href="/host/dashboard" className="business-brand"><span>⌂</span><strong>GepPao Business</strong></Link><nav aria-label="Business navigation"><Link href="/business/places">Places</Link><Link href="/business/places/new">เพิ่ม Place</Link><Link href="/business/events">Events</Link><Link href="/business/events/new">เพิ่ม Event</Link></nav></div></header>{children}</>}
