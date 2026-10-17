// Use only the public-trip allowlist. Never serialize the original workspace object.
export function publicTripSummary(publicTrip:any,url:string){
 const trip=publicTrip.trip,days=publicTrip.days??[];
 const lines=[String(trip.title??'Geppao').slice(0,160),`${trip.start_date??''} – ${trip.end_date??''}`,'แผนทริป · อ่านอย่างเดียว'];
 for(const day of days){lines.push(`\nวันที่ ${day.dayNumber} · ${day.serviceDate??''}`);for(const item of day.items??[]){const name=item.place?.name||item.event?.name;if(name)lines.push(`• ${String(name).slice(0,140)}`)}}
 // A short mobile-friendly summary, not an export of all trip details.
 const text=lines.join('\n');return text.slice(0,Math.max(0,1800-url.length))+(text.length>1800-url.length?'\n…':'')+'\n\n'+url;
}
