export const HOST_PREPARATION_ITEMS = ['identity', 'location', 'capacity', 'photos', 'description', 'amenities', 'price', 'contact'] as const;
export type HostPreparationItem = typeof HOST_PREPARATION_ITEMS[number];
export function preparationCount(values:readonly string[]) {
  return HOST_PREPARATION_ITEMS.filter(item=>values.includes(item)).length;
}
export function hostEntryHref(locale:'th'|'en', destination:'onboarding'|'places'='onboarding') {
  const next=destination==='places'?'/business/places':'/business/onboarding';
  return `/host/login?${new URLSearchParams({next,lang:locale})}`;
}
