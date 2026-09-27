"use client";

import Link from "next/link";
import type { MapZone } from "@/lib/map-zones";

interface ZonePanelProps {
  zone: MapZone;
  onClose: () => void;
}

export function ZonePanel({ zone, onClose }: ZonePanelProps) {
  return (
    <aside id="zone-panel" className="map-zone-panel" aria-label={zone.name}>
      <button className="map-panel-close" onClick={onClose} aria-label="ปิด">
        ×
      </button>

      <span className={`zone-type zone-type-${zone.type}`}>{zone.eyebrow}</span>
      <h2>{zone.name}</h2>
      <p className="map-panel-description">{zone.description}</p>

      <div className="map-panel-section">
        <span className="map-panel-label">WHAT TO DISCOVER</span>
        <div className="map-highlight-list">
          {zone.highlights.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>

      <div className="map-panel-actions">
        <Link href={`/explore?zone=${zone.id}`} className="btn btn-primary">
          Explore
        </Link>
        <Link href={`/planner?zone=${zone.id}`} className="btn btn-rust">
          ✨ Plan My Trip
        </Link>
        <Link href={`/explore?zone=${zone.id}&type=stay`} className="btn btn-sage">
          🏡 View Villas
        </Link>
      </div>
    </aside>
  );
}
