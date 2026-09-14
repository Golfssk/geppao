export const COMMISSION_RATE=0.05;export function calculateCommission(bookingValue:number){return Math.round(bookingValue*COMMISSION_RATE*100)/100;}
