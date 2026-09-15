import Link from 'next/link';
import { HOST_PACKAGES } from '@/lib/marketplace/packages';

export default function Host(){
  return (
    <main className="page">
      <div className="container section">
        <div className="section-head">
          <div>
            <h1>สำหรับเจ้าของที่พัก</h1>
            <p className="muted">เริ่มจากลงประกาศ แล้วใช้ GepPao สร้าง demand จาก Search และ AI Recommendation</p>
          </div>
          <Link href="/host/login" className="btn btn-primary">เข้าสู่ระบบเจ้าของที่พัก</Link>
        </div>

        <div className="host-grid" style={{marginTop:24}}>
          {Object.entries(HOST_PACKAGES).map(([key,p]) => (
            <div className={`plan-card ${key==='premium'?'premium':''}`} key={key}>
              <h2>{p.name}</h2>
              <div className="plan-price">฿{p.price}<span style={{fontSize:'.9rem',fontWeight:400}}>/เดือน</span></div>
              <ul className="list">{p.features.map(f=><li key={f}>{f}</li>)}</ul>
              <Link href="/host/login" className={`btn ${key==='premium'?'btn-sage':'btn-primary'}`}>
                ลงทะเบียนที่พัก
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
