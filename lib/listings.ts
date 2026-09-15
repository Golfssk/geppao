import type { Listing } from '@/types/listing';

type ListingRow = {
  id: string;
  slug: string;
  name: string;
  location: string;
  price: number;
  price_unit: string;
  capacity: number;
  category: string;
  vibe: string[] | null;
  amenities: string[] | null;
  pet_friendly: boolean;
  party_friendly: boolean;
  description: string | null;
  images?: string[] | null;
  status?: string | null;
};

export function mapListing(row: ListingRow): Listing {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    price: row.price,
    priceUnit: row.price_unit,
    capacity: row.capacity,
    category: row.category,
    vibe: row.vibe ?? [],
    amenities: row.amenities ?? [],
    petFriendly: row.pet_friendly,
    partyFriendly: row.party_friendly,
    description: row.description ?? undefined,
    images: row.images ?? undefined,
    status: row.status ?? undefined,
  };
}
