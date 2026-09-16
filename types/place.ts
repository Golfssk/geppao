export const PLACE_TYPES=['accommodation','restaurant','cafe','attraction','activity'] as const;
export type PlaceType=typeof PLACE_TYPES[number];
export type PublicationStatus='draft'|'pending'|'published'|'rejected'|'archived';
export type VerificationStatus='unverified'|'pending'|'verified'|'rejected'|'stale';
export type PriceUnit='free'|'person'|'group'|'night'|'room'|'activity'|'item';
export type PlaceImage={id:string;imageUrl:string;altText?:string;sortOrder:number;isCover:boolean};
export type PriceItem={id:string;label:string;amountMin:number;amountMax?:number;currency:string;unit:PriceUnit;isEstimate:boolean};
export type Place={id:string;legacyListingId?:string;businessId?:string;destinationId?:string;type:PlaceType;name:string;slug:string;description?:string;address?:string;latitude?:number;longitude?:number;googleMapsUrl?:string;minGroupSize?:number;maxGroupSize?:number;recommendedDurationMinutes?:number;petFriendly?:boolean;childFriendly?:boolean;elderlyFriendly?:boolean;accessibilitySupported?:boolean;parkingAvailable?:boolean;reservationRequired:boolean;weatherSensitive:boolean;publicationStatus:PublicationStatus;verificationStatus:VerificationStatus;lastVerifiedAt?:string;images:PlaceImage[];prices:PriceItem[]};