export type ValidationSeverity = 'warning' | 'conflict';

export type ValidationMessage = {
  code: string;
  severity: ValidationSeverity;
  message: string;
};

type Coordinates = {latitude: number; longitude: number};

type Hours = {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  crosses_midnight?: boolean;
};

type SpecialHours = {
  service_date: string;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

type Schedule = {
  starts_at: string;
  ends_at: string;
  status: 'scheduled' | 'cancelled' | 'sold_out' | 'completed' | string;
};

type PriceItem = {
  amount_min: number | string;
  price_unit: 'free' | 'person' | 'group' | 'night' | 'room' | 'activity' | 'item' | string;
  is_estimate: boolean;
};

type PlaceSource = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  publication_status: string;
  recommended_duration_minutes: number | null;
  place_hours?: Hours[];
  place_special_hours?: SpecialHours[];
  price_items?: PriceItem[];
};

type EventSource = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  publication_status: string;
  event_schedules?: Schedule[];
  price_items?: PriceItem[];
};

export type CalculationItemInput = {
  id: string;
  position: number;
  starts_at: string | null;
  ends_at: string | null;
  estimated_cost: number | string | null;
  duration_minutes: number | null;
  is_locked: boolean;
  place?: PlaceSource | PlaceSource[] | null;
  event?: EventSource | EventSource[] | null;
};

export type RouteSegmentResult = {
  fromItemId: string;
  toItemId: string;
  distanceKm: number;
  durationMinutes: number;
  provider: 'haversine';
  confidence: 'estimate';
};

export type ItemCalculation = {
  itemId: string;
  durationMinutes: number | null;
  travelDistanceKm: number | null;
  travelDurationMinutes: number | null;
  estimatedCost: number | null;
  validationStatus: 'valid' | 'warning' | 'conflict';
  validationMessages: ValidationMessage[];
  locked: boolean;
};

export type DayCalculation = {
  items: ItemCalculation[];
  routeSegments: RouteSegmentResult[];
  estimatedTotalCost: number;
  estimatedTravelKm: number;
  estimatedTravelMinutes: number;
  missingPriceCount: number;
  costCoverage: 'complete' | 'partial' | 'missing';
  validationStatus: 'valid' | 'warning' | 'conflict';
};

type CalculationOptions = {
  serviceDate: string | null;
  travelers: number;
  nights: number | null;
  rooms: number | null;
};

const LOCAL_DRIVING_SPEED_KMH = 35;
const THAI_TIME_ZONE = 'Asia/Bangkok';

const asNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const first = <T>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

const coordinateOf = (source: PlaceSource | EventSource | null): Coordinates | null => {
  const latitude = asNumber(source?.latitude);
  const longitude = asNumber(source?.longitude);
  return latitude === null || longitude === null ? null : {latitude, longitude};
};

const dateKeyOf = (value: string): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: THAI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};

const timeMinutesOf = (value: string): number => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: THAI_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(value));
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
};

const clockMinutesOf = (value: string | null): number | null => {
  if (!value) return null;
  const match = value.slice(0, 5).match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const dayOfWeekOf = (serviceDate: string): number =>
  new Date(`${serviceDate}T00:00:00.000Z`).getUTCDay();

const isWithinHours = (time: number, hours: Hours | SpecialHours): boolean => {
  if (hours.is_closed) return false;
  const open = clockMinutesOf(hours.open_time);
  const close = clockMinutesOf(hours.close_time);
  if (open === null || close === null) return false;
  if (open <= close) return time >= open && time <= close;
  return time >= open || time <= close;
};

const haversineKm = (from: Coordinates, to: Coordinates): number => {
  const earthRadiusKm = 6371;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(to.latitude - from.latitude);
  const dLon = radians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const routeEstimate = (from: Coordinates, to: Coordinates) => {
  const distanceKm = Number(haversineKm(from, to).toFixed(2));
  const durationMinutes = Math.ceil((distanceKm / LOCAL_DRIVING_SPEED_KMH) * 60);
  return {distanceKm, durationMinutes};
};

const sourceName = (source: PlaceSource | EventSource | null) => source?.name ?? 'รายการนี้';

const priceFor = (
  source: PlaceSource | EventSource,
  travelers: number,
  nights: number | null,
  rooms: number | null,
): {cost: number | null; messages: ValidationMessage[]} => {
  const price = [...(source.price_items ?? [])].sort(
    (a, b) => Number(a.amount_min) - Number(b.amount_min),
  )[0];
  if (!price) {
    return {
      cost: null,
      messages: [{code: 'missing_price', severity: 'warning', message: `${sourceName(source)} ยังไม่มีราคา`}],
    };
  }

  const amount = asNumber(price.amount_min);
  if (amount === null) {
    return {
      cost: null,
      messages: [{code: 'invalid_price', severity: 'warning', message: `${sourceName(source)} มีข้อมูลราคาไม่สมบูรณ์`}],
    };
  }

  let quantity: number | null = 1;
  switch (price.price_unit) {
    case 'free':
      quantity = 0;
      break;
    case 'person':
    case 'activity':
      quantity = Math.max(1, travelers);
      break;
    case 'night':
      quantity = nights && nights > 0 ? nights : null;
      break;
    case 'room':
      quantity = rooms && rooms > 0 ? rooms : null;
      break;
    case 'group':
    case 'item':
      quantity = 1;
      break;
    default:
      quantity = null;
  }

  if (quantity === null) {
    return {
      cost: null,
      messages: [{code: 'missing_price_quantity', severity: 'warning', message: `${sourceName(source)} ต้องระบุจำนวนคืนหรือจำนวนห้องก่อนคำนวณราคา`}],
    };
  }

  const messages = price.is_estimate
    ? [{code: 'estimated_price', severity: 'warning' as const, message: `${sourceName(source)} ใช้ราคาโดยประมาณ`}]
    : [];
  return {cost: Number((amount * quantity).toFixed(2)), messages};
};

const validatePlaceHours = (
  source: PlaceSource,
  serviceDate: string | null,
  startsAt: string | null,
  endsAt: string | null,
): ValidationMessage[] => {
  if (!serviceDate) {
    return [{code: 'missing_service_date', severity: 'warning', message: `${sourceName(source)} ยังไม่มีวันที่ให้ตรวจเวลาเปิด–ปิด`}];
  }
  const special = (source.place_special_hours ?? []).find((item) => item.service_date === serviceDate);
  const hours = special ?? (source.place_hours ?? []).find((item) => item.day_of_week === dayOfWeekOf(serviceDate));
  if (!hours) {
    return [{code: 'missing_hours', severity: 'warning', message: `${sourceName(source)} ยังไม่มีข้อมูลเวลาเปิด–ปิด`}];
  }
  if (hours.is_closed) {
    return [{code: 'closed', severity: 'conflict', message: `${sourceName(source)} ปิดให้บริการในวันที่เลือก`}];
  }
  if (!startsAt) {
    return [{code: 'missing_schedule_time', severity: 'warning', message: `ยังไม่มีเวลาเข้าชม ${sourceName(source)} จึงตรวจช่วงเวลาได้ไม่ครบ`}];
  }
  const startTime = timeMinutesOf(startsAt);
  const endTime = endsAt ? timeMinutesOf(endsAt) : startTime;
  const messages: ValidationMessage[] = [];
  if (!isWithinHours(startTime, hours) || !isWithinHours(endTime, hours)) {
    messages.push({code: 'outside_hours', severity: 'conflict', message: `${sourceName(source)} อยู่นอกเวลาเปิดให้บริการ`});
  }
  return messages;
};

const validateEventSchedule = (
  source: EventSource,
  serviceDate: string | null,
  startsAt: string | null,
  endsAt: string | null,
): ValidationMessage[] => {
  if (!serviceDate) {
    return [{code: 'missing_service_date', severity: 'warning', message: `${sourceName(source)} ยังไม่มีวันที่ให้ตรวจรอบงาน`}];
  }
  const schedules = (source.event_schedules ?? []).filter((schedule) => dateKeyOf(schedule.starts_at) === serviceDate);
  const available = schedules.filter((schedule) => schedule.status === 'scheduled');
  if (!available.length) {
    return [{code: 'event_unavailable', severity: 'conflict', message: `${sourceName(source)} ไม่มีรอบที่เปิดให้บริการในวันที่เลือก`}];
  }
  if (!startsAt) {
    return [{code: 'missing_schedule_time', severity: 'warning', message: `ยังไม่มีเวลาเริ่มสำหรับ ${sourceName(source)}`}];
  }
  const itemStart = new Date(startsAt).getTime();
  const itemEnd = new Date(endsAt ?? startsAt).getTime();
  const fitsSchedule = available.some((schedule) => {
    const start = new Date(schedule.starts_at).getTime();
    const end = new Date(schedule.ends_at).getTime();
    return itemStart >= start && itemEnd <= end;
  });
  return fitsSchedule
    ? []
    : [{code: 'outside_event_schedule', severity: 'conflict', message: `${sourceName(source)} อยู่นอกช่วงเวลาของ Event`}];
};

const statusOf = (messages: ValidationMessage[]): ItemCalculation['validationStatus'] => {
  if (messages.some((message) => message.severity === 'conflict')) return 'conflict';
  if (messages.length) return 'warning';
  return 'valid';
};

export function calculateTripDay(
  inputItems: CalculationItemInput[],
  options: CalculationOptions,
): DayCalculation {
  const items = [...inputItems].sort((a, b) => a.position - b.position);
  const routeSegments: RouteSegmentResult[] = [];
  const results: ItemCalculation[] = [];
  let previousCoordinates: Coordinates | null = null;
  let previousItem: CalculationItemInput | null = null;
  let estimatedTotalCost = 0;
  let estimatedTravelKm = 0;
  let estimatedTravelMinutes = 0;
  let missingPriceCount = 0;

  for (const item of items) {
    const source = first(item.place) ?? first(item.event);
    const isEvent = Boolean(first(item.event));
    const messages: ValidationMessage[] = [];
    const currentCoordinates = coordinateOf(source);
    const durationMinutes = asNumber(first(item.place)?.recommended_duration_minutes) ?? item.duration_minutes;
    let travelDistanceKm: number | null = null;
    let travelDurationMinutes: number | null = null;

    if (!source) {
      messages.push({code: 'missing_source', severity: 'conflict', message: 'ไม่พบข้อมูล Place หรือ Event ของรายการนี้'});
    } else if (source.publication_status !== 'published') {
      messages.push({code: 'unpublished_source', severity: 'conflict', message: `${sourceName(source)} ยังไม่อยู่ในสถานะ Published`});
    }

    if (source && durationMinutes === null) {
      messages.push({code: 'missing_duration', severity: 'warning', message: `${sourceName(source)} ยังไม่มี Recommended Duration`});
    }

    if (source && previousCoordinates && currentCoordinates && previousItem) {
      const estimate = routeEstimate(previousCoordinates, currentCoordinates);
      travelDistanceKm = estimate.distanceKm;
      travelDurationMinutes = estimate.durationMinutes;
      estimatedTravelKm += estimate.distanceKm;
      estimatedTravelMinutes += estimate.durationMinutes;
      routeSegments.push({
        fromItemId: previousItem.id,
        toItemId: item.id,
        distanceKm: estimate.distanceKm,
        durationMinutes: estimate.durationMinutes,
        provider: 'haversine',
        confidence: 'estimate',
      });
    } else if (source && !currentCoordinates) {
      messages.push({code: 'missing_coordinates', severity: 'warning', message: `${sourceName(source)} ยังไม่มีพิกัด จึงคำนวณเส้นทางไม่ได้`});
    }

    if (source) {
      const scheduleMessages = isEvent
        ? validateEventSchedule(first(item.event) as EventSource, options.serviceDate, item.starts_at, item.ends_at)
        : validatePlaceHours(first(item.place) as PlaceSource, options.serviceDate, item.starts_at, item.ends_at);
      messages.push(...scheduleMessages);
      const price = priceFor(source, options.travelers, options.nights, options.rooms);
      messages.push(...price.messages);
      if (price.cost === null) missingPriceCount += 1;
      else estimatedTotalCost += price.cost;

      if (previousItem?.ends_at && item.starts_at && travelDurationMinutes !== null) {
        const previousEnd = new Date(previousItem.ends_at).getTime();
        const arrival = previousEnd + travelDurationMinutes * 60 * 1000;
        if (arrival > new Date(item.starts_at).getTime()) {
          messages.push({code: 'arrival_after_start', severity: 'conflict', message: `เวลาเดินทางทำให้ไปถึง ${sourceName(source)} ไม่ทันเวลาเริ่ม`});
        }
      }
    } else {
      missingPriceCount += 1;
    }

    if (previousItem?.starts_at && previousItem.ends_at && item.starts_at) {
      if (new Date(item.starts_at).getTime() < new Date(previousItem.ends_at).getTime()) {
        messages.push({code: 'overlap', severity: 'conflict', message: 'รายการนี้มีเวลาทับซ้อนกับรายการก่อนหน้า'});
      }
    }

    const result: ItemCalculation = {
      itemId: item.id,
      durationMinutes,
      travelDistanceKm,
      travelDurationMinutes,
      estimatedCost: source ? priceFor(source, options.travelers, options.nights, options.rooms).cost : null,
      validationStatus: statusOf(messages),
      validationMessages: messages,
      locked: item.is_locked,
    };
    results.push(result);
    previousCoordinates = currentCoordinates;
    previousItem = item;
  }

  const validationStatus = results.some((item) => item.validationStatus === 'conflict')
    ? 'conflict'
    : results.some((item) => item.validationStatus === 'warning')
      ? 'warning'
      : 'valid';

  return {
    items: results,
    routeSegments,
    estimatedTotalCost: Number(estimatedTotalCost.toFixed(2)),
    estimatedTravelKm: Number(estimatedTravelKm.toFixed(2)),
    estimatedTravelMinutes,
    missingPriceCount,
    costCoverage: missingPriceCount === 0 ? 'complete' : estimatedTotalCost > 0 ? 'partial' : 'missing',
    validationStatus,
  };
}
