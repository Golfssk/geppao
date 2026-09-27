export type MapZoneType = "nature" | "lifestyle" | "local" | "stay";

export interface MapZone {
  id: string;
  name: string;
  type: MapZoneType;
  eyebrow: string;
  description: string;
  polygon: string;
  highlights: string[];
  focusPoint: { x: number; y: number };
  priority: number;
}

export const MAP_ZONES: MapZone[] = [
  {
    id: "nature",
    name: "Khao Yai Nature",
    type: "nature",
    eyebrow: "NATURE & ADVENTURE",
    description: "ป่า น้ำตก จุดชมวิว และกิจกรรมกลางแจ้งรอบเขาใหญ่",
    polygon: "27,10 51,7 66,29 59,52 35,48",
    highlights: ["น้ำตก", "จุดชมวิว", "เส้นทางธรรมชาติ", "กิจกรรม Outdoor"],
    focusPoint: { x: 47, y: 28 },
    priority: 1
  },
  {
    id: "lifestyle",
    name: "Scenic & Lifestyle",
    type: "lifestyle",
    eyebrow: "CAFÉ · FOOD · PHOTO",
    description: "คาเฟ่ ไร่องุ่น ร้านอาหาร และจุดถ่ายรูปสำหรับทริปสายแฮงเอ้าท์",
    polygon: "55,20 82,24 89,51 68,61 53,47",
    highlights: ["Café Hopping", "Vineyards", "Restaurants", "Photo Spots"],
    focusPoint: { x: 70, y: 40 },
    priority: 2
  },
  {
    id: "local",
    name: "Pak Chong Local",
    type: "local",
    eyebrow: "LOCAL EXPERIENCE",
    description: "ตลาด ของกิน Street Food และบรรยากาศปากช่องแบบคนพื้นที่",
    polygon: "18,50 48,52 55,76 30,87 12,70",
    highlights: ["ตลาด", "Street Food", "ของกินท้องถิ่น", "Town Life"],
    focusPoint: { x: 34, y: 66 },
    priority: 3
  },
  {
    id: "stay",
    name: "Stay & Chill",
    type: "stay",
    eyebrow: "VILLA · RESORT · STAY",
    description: "พูลวิลล่า รีสอร์ต และที่พักสำหรับแก๊ง เพื่อน ครอบครัว และสัตว์เลี้ยง",
    polygon: "50,57 76,55 89,76 68,92 48,78",
    highlights: ["Pool Villas", "Resorts", "Group Stays", "Pet Friendly"],
    focusPoint: { x: 68, y: 72 },
    priority: 10
  }
];

export const getMapZone = (id: string | null | undefined) =>
  MAP_ZONES.find((zone) => zone.id === id) ?? null;
