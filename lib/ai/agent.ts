import type { Listing } from '@/types/listing';
import { rankListings, type RankingContext } from '@/lib/ranking/score';

export type TripPlan = {
  input: string;
  summary: {
    destination: string;
    guests?: number;
    budgetPerPerson?: number;
    vibes: string[];
    nights?: number;
  };
  recommendedStays: Array<{
    listing: Listing;
    matchScore: number;
    reasons: string[];
  }>;
  itinerary: Array<{
    day: number;
    time: string;
    activity: string;
    note: string;
  }>;
};

const VIBE_KEYWORDS: Record<string, string[]> = {
  party: ['ปาร์ตี้', 'party', 'สังสรรค์', 'เสียงดัง'],
  family: ['ครอบครัว', 'เด็ก', 'family'],
  nature: ['ธรรมชาติ', 'ภูเขา', 'วิว', 'nature'],
  chill: ['ชิล', 'พักผ่อน', 'เงียบ', 'chill'],
  photography: ['ถ่ายรูป', 'รูป', 'photography'],
  minimal: ['มินิมอล', 'minimal'],
  couple: ['คู่รัก', 'แฟน', 'couple'],
  fun: ['สนุก', 'กิจกรรม', 'fun'],
  luxury: ['หรู', 'ไฮเอนด์', 'luxury'],
  cafe: ['คาเฟ่', 'cafe', 'กาแฟ'],
};

function firstNumber(input: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]) return Number(match[1].replace(/,/g, ''));
  }
  return undefined;
}

export function parseTripInput(input: string): RankingContext & { destination: string; nights?: number } {
  const text = input.toLowerCase();
  const vibes = Object.entries(VIBE_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword.toLowerCase())))
    .map(([vibe]) => vibe);

  const guests = firstNumber(input, [
    /(?:ไป|สำหรับ|กับ|จำนวน)\s*(?:ทั้งหมด\s*)?(\d+)\s*(?:คน|ท่าน)/i,
    /(\d+)\s*(?:คน|ท่าน)/i,
  ]);
  const budget = firstNumber(input, [
    /(?:งบ|budget)[^\d]{0,15}(\d[\d,]*)\s*(?:บาท|฿)?\s*(?:\/|ต่อ)?\s*(?:คน)?/i,
    /(\d[\d,]*)\s*บาท\s*\/\s*คน/i,
  ]);
  const nights = firstNumber(input, [
    /(\d+)\s*(?:คืน|night|nights)/i,
  ]);

  const locationMatch = input.match(/(?:ไป|เที่ยว|ที่|แถว|บริเวณ)\s*(เขาใหญ่|ปากช่อง|นครราชสีมา|เชียงใหม่|เชียงราย|พัทยา|หัวหิน|กาญจนบุรี)/i);
  const destination = locationMatch?.[1] || 'เขาใหญ่ / ปากช่อง';

  return {
    vibes,
    guests,
    budget,
    petFriendly: /หมา|สุนัข|แมว|สัตว์เลี้ยง|pet/i.test(input),
    partyFriendly: /ปาร์ตี้|party|สังสรรค์|เสียงดัง/i.test(input),
    location: destination,
    destination,
    nights,
  };
}

export function prepareAgentContext(listings: Listing[], prefs: RankingContext) {
  return rankListings(listings, prefs).slice(0, 10);
}

function reasonsFor(listing: Listing, prefs: RankingContext) {
  const reasons: string[] = [];
  if (prefs.guests && listing.capacity >= prefs.guests) reasons.push(`รองรับ ${listing.capacity} คน`);
  if (prefs.budget && listing.price <= prefs.budget) reasons.push('อยู่ในงบที่ตั้งไว้');
  if (prefs.petFriendly && listing.petFriendly) reasons.push('รองรับสัตว์เลี้ยง');
  if (prefs.partyFriendly && listing.partyFriendly) reasons.push('เหมาะกับทริปปาร์ตี้');
  const matchedVibes = (prefs.vibes || []).filter((vibe) => listing.vibe.includes(vibe));
  if (matchedVibes.length) reasons.push(`ตรงกับสไตล์ ${matchedVibes.join(', ')}`);
  return reasons.length ? reasons : ['ข้อมูลโดยรวมใกล้เคียงกับความต้องการของทริป'];
}

export function buildTripPlan(input: string, listings: Listing[]): TripPlan {
  const prefs = parseTripInput(input);
  const ranked = prepareAgentContext(listings, prefs);
  const selected = ranked.slice(0, 3);
  const nights = prefs.nights || 1;
  const itinerary = [
    { day: 1, time: '10:00', activity: 'เดินทางและแวะคาเฟ่/จุดชมวิวระหว่างทาง', note: 'เลือกจุดที่อยู่ในเส้นทางไปที่พัก' },
    { day: 1, time: '14:00', activity: 'Check-in และพักผ่อน', note: 'ใช้ช่วงบ่ายทำกิจกรรมภายในที่พัก' },
    { day: 1, time: '18:00', activity: prefs.partyFriendly ? 'ปิ้งย่างและสังสรรค์' : 'มื้อเย็นและพักผ่อน', note: 'เลือกกิจกรรมตามกฎของที่พัก' },
    ...Array.from({ length: Math.max(0, nights - 1) }, (_, index) => ({
      day: index + 2,
      time: '09:00',
      activity: 'อาหารเช้าและเที่ยวจุดธรรมชาติใกล้เคียง',
      note: 'ปรับตามเวลาเปิด-ปิดและระยะทางจริงก่อนเดินทาง',
    })),
    { day: nights + 1, time: '11:00', activity: 'Check-out และเดินทางกลับ', note: 'เผื่อเวลาเดินทางและแวะซื้อของฝาก' },
  ];

  return {
    input,
    summary: {
      destination: prefs.destination,
      guests: prefs.guests,
      budgetPerPerson: prefs.budget,
      vibes: prefs.vibes || [],
      nights,
    },
    recommendedStays: selected.map((listing) => ({
      listing,
      matchScore: listing.score || 0,
      reasons: reasonsFor(listing, prefs),
    })),
    itinerary,
  };
}
