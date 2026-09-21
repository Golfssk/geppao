import Link from 'next/link';
import {OWNER_EARLY_ACCESS} from '@/lib/marketplace/packages';

export function HostCTA(){return <section className="section"><div className="container"><div className="section-head"><div><h2>สำหรับเจ้าของที่พัก</h2><p className="muted">ลงประกาศฟรีเพื่อเริ่มสร้าง demand จากนักเดินทางของ GepPao</p></div></div><div className="host-grid"><div className="plan-card"><span className="eyebrow">EARLY ACCESS · FREE</span><h3>{OWNER_EARLY_ACCESS.name}</h3><div className="plan-price">ฟรี<span style={{fontSize:'.9rem',fontWeight:400}}> ไม่มีค่ารายเดือน</span></div><ul className="list">{OWNER_EARLY_ACCESS.features.map(feature=><li key={feature}>{feature}</li>)}</ul><Link className="btn btn-primary" href="/contact">ลงทะเบียนที่พักฟรี</Link></div></div></div></section>}
