import { InteractiveMap } from "@/components/interactive-map/InteractiveMap";

export function MapHero() {
  return (
    <section className="map-hero">
      <div className="container">
        <div className="map-hero-copy">
          <span className="eyebrow">EXPLORE KHAO YAI · PAK CHONG</span>
          <h2>เขาใหญ่มีอะไรให้เก็บ<br />ก็เก็บไว้ในทริปเดียว</h2>
          <p>
            เลือกโซนที่อยากไป แล้วให้เก็บเป๋าช่วยต่อยอดเป็นสถานที่จริง
            ทริปจริง และที่พักที่เข้ากับแก๊งของคุณ
          </p>
        </div>
        <InteractiveMap />
      </div>
    </section>
  );
}
