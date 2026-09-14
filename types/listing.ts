export type Tier='standard'|'premium';
export type Listing={id:string;slug:string;name:string;location:string;price:number;priceUnit:string;capacity:number;category:string;vibe:string[];amenities:string[];petFriendly:boolean;partyFriendly:boolean;tier:Tier;description?:string;images?:string[];};
