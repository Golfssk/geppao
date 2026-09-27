"use client";

import { useState } from "react";
import { MAP_ZONES, getMapZone } from "@/lib/map-zones";
import { ZonePanel } from "./ZonePanel";

function trackMapEvent(event: string, zoneId?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("geppao:analytics", {
      detail: { event, zone_id: zoneId ?? null }
    })
  );
}

export function InteractiveMap() {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  const selectedZone = getMapZone(selectedZoneId);

  const selectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    trackMapEvent("map_zone_selected", zoneId);

    window.requestAnimationFrame(() => {
      document.getElementById("zone-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    });
  };

  return (
    <div className="interactive-map">
      <div className="map-canvas">
        <div className="map-art" role="img" aria-label="แผนที่จำลองปากช่องและเขาใหญ่">
          <div className="map-mountain map-mountain-one" />
          <div className="map-mountain map-mountain-two" />
          <div className="map-road map-road-one" />
          <div className="map-road map-road-two" />
          <div className="map-river" />
          <div className="map-trees map-trees-one" />
          <div className="map-trees map-trees-two" />
          <div className="map-buildings map-buildings-one" />
          <div className="map-buildings map-buildings-two" />
        </div>

        <svg
          viewBox="0 0 100 100"
          className="map-zone-overlay"
          aria-label="เลือกโซนท่องเที่ยว"
          role="group"
        >
          {MAP_ZONES.map((zone) => {
            const active = selectedZoneId === zone.id;
            const hovered = hoveredZoneId === zone.id;

            return (
              <polygon
                key={zone.id}
                points={zone.polygon}
                className={`map-zone zone-${zone.type} ${active ? "is-active" : ""} ${hovered ? "is-hovered" : ""}`}
                tabIndex={0}
                aria-label={zone.name}
                role="button"
                onMouseEnter={() => {
                  setHoveredZoneId(zone.id);
                  trackMapEvent("map_zone_hovered", zone.id);
                }}
                onMouseLeave={() => setHoveredZoneId(null)}
                onFocus={() => setHoveredZoneId(zone.id)}
                onBlur={() => setHoveredZoneId(null)}
                onClick={() => selectZone(zone.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectZone(zone.id);
                  }
                }}
              />
            );
          })}
        </svg>

        <div className="map-zone-labels" aria-hidden="true">
          {MAP_ZONES.map((zone) => (
            <button
              key={zone.id}
              className={`map-zone-label zone-label-${zone.id} ${selectedZoneId === zone.id ? "is-active" : ""}`}
              onClick={() => selectZone(zone.id)}
            >
              <span>{zone.type === "nature" ? "🌲" : zone.type === "lifestyle" ? "☕" : zone.type === "local" ? "🍜" : "🏡"}</span>
              {zone.name}
            </button>
          ))}
        </div>

        <div className="map-legend">
          <span>แตะหรือคลิกบนแผนที่เพื่อสำรวจ</span>
        </div>

        {selectedZone && (
          <ZonePanel
            zone={selectedZone}
            onClose={() => setSelectedZoneId(null)}
          />
        )}
      </div>
    </div>
  );
}
