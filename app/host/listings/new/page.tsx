import { HostListingForm } from '@/components/host/HostListingForm';

export default function NewHostListingPage() {
  return (
    <main className="page">
      <div className="container section">
        <div className="section-head">
          <div>
            <p className="muted">Host Dashboard</p>
            <h1>เพิ่มที่พักใหม่</h1>
            <p className="muted" style={{ marginTop: 6 }}>
              สร้าง Listing ใหม่สำหรับที่พักของคุณบน GepPao
            </p>
          </div>
        </div>
        <HostListingForm />
      </div>
    </main>
  );
}
