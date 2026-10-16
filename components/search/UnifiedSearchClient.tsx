'use client';
import Link from 'next/link';
import {AddToTripButton} from '@/components/trips/AddToTripButton';
import {useEffect,useRef,useState} from 'react';
import {useLocale} from '@/components/i18n/LocaleProvider';
import {trackProductEvent} from '@/lib/analytics/client';
import {EventInterestButton} from '@/components/analytics/EventInterestButton';
import {SEARCH_TYPES,searchQueryParams,type SearchQuery,type SearchType} from '@/lib/search/query';
import {STAY_PAGE_SIZE} from '@/lib/stays/query';
import type {SearchResult} from '@/lib/search/types';
import type {StayDestination} from '@/lib/stays/types';
import styles from './UnifiedSearchClient.module.css';
const labels={th:{all:'ทั้งหมด',restaurant:'ร้านอาหาร',cafe:'คาเฟ่',accommodation:'ที่พัก',attraction:'ที่เที่ยว',activity:'กิจกรรม',event:'อีเวนต์'},en:{all:'Everything',restaurant:'Restaurants',cafe:'Cafes',accommodation:'Stays',attraction:'Attractions',activity:'Activities',event:'Events'}};
type Props={initialQuery:SearchQuery;initialResult:SearchResult|null;initialError:string|null;destinations:StayDestination[];today:string};
export function UnifiedSearchClient({initialQuery:query,initialResult:result,initialError:error,destinations,today}:Props) {
  const {locale}=useLocale(),en=locale==='en',names=labels[locale];
  const [selectedType,setSelectedType]=useState<SearchType>(query.type),[checkIn,setCheckIn]=useState(query.checkIn),[busy,setBusy]=useState(false);
  const lodging=selectedType==='accommodation',lastTracked=useRef('');
  const href=(patch:Partial<SearchQuery>={})=>`/search?${searchQueryParams({...query,...patch,locale})}`;
  const reset=`/search?type=all&lang=${locale}`;
  const pages=Math.ceil((result?.total??0)/STAY_PAGE_SIZE);
  const units:Record<string,string>=en?{night:'night',room:'room',person:'person',group:'group',activity:'activity',item:'item',free:'free'}:{night:'คืน',room:'ห้อง',person:'คน',group:'กลุ่ม',activity:'กิจกรรม',item:'รายการ',free:'ฟรี'};
  const errors:Record<string,string>=en?{unavailable:'We could not load the catalog. Please try again.',invalid:'Invalid search options. Clear the filters and try again.',dates:'Choose both dates, check-out after check-in, up to 30 nights.',past:'Check-in cannot be in the past.',length:'Search terms must be 100 characters or fewer.'}:{unavailable:'ยังโหลดข้อมูลไม่ได้ กรุณาลองใหม่อีกครั้ง',invalid:'เงื่อนไขค้นหาไม่ถูกต้อง กรุณาล้างตัวกรองแล้วลองใหม่',dates:'เลือกวันเข้าและออกให้ครบ วันออกต้องหลังวันเข้า และไม่เกิน 30 คืน',past:'วันเข้าพักต้องไม่อยู่ในอดีต',length:'คำค้นหาต้องไม่เกิน 100 ตัวอักษร'};
  useEffect(()=>{
    if(!result||error)return;
    const key=searchQueryParams(query).toString();if(lastTracked.current===key)return;lastTracked.current=key;
    void trackProductEvent({eventName:'search',metadata:{queryLength:query.q.length,placeType:query.type,resultCount:result.total}});
  },[query,result,error]);
  return <main className={styles.page}>
    <header className={styles.hero}><div className={styles.wrap}><p className={styles.eyebrow}>{en?'ONE SEARCH. YOUR WHOLE TRIP.':'ค้นหาครั้งเดียว ครบทั้งทริป'}</p><h1>{en?'Find your next good place.':'อยากไปไหน เริ่มค้นหาที่นี่'}</h1><p>{en?'Stays, good food and things to do — together in one place.':'ร้านอาหาร คาเฟ่ ที่พัก ที่เที่ยว และกิจกรรม รวมไว้ในที่เดียว'}</p></div></header>
    <div className={styles.wrap}>
      <form action="/search" method="get" className={styles.panel} onSubmit={()=>setBusy(true)}>
        <input type="hidden" name="lang" value={locale}/>
        <div className={styles.searchGrid}>
          <label>{en?'What are you looking for?':'อยากค้นหาอะไร'}<select name="type" value={selectedType} onChange={e=>setSelectedType(e.target.value as SearchType)}>{SEARCH_TYPES.map(type=><option key={type} value={type}>{names[type]}</option>)}</select></label>
          <label className={styles.query}>{en?'Place, area or inspiration':'ชื่อสถานที่ ย่าน หรือสิ่งที่อยากทำ'}<input type="search" name="q" maxLength={100} defaultValue={query.q} placeholder={en?'Try Khao Yai, coffee or a pool villa':'เช่น เขาใหญ่ คาเฟ่ หรือพูลวิลล่า'}/></label>
          <label>{en?'Destination':'จุดหมาย'}<select name="destination" defaultValue={query.destination}><option value="">{en?'All destinations':'ทุกจุดหมาย'}</option>{destinations.map(d=><option key={d.slug} value={d.slug}>{d.name}</option>)}</select></label>
          <button className={styles.primary} type="submit" disabled={busy}>{busy?(en?'Searching…':'กำลังค้นหา…'):(en?'Search':'ค้นหา')} <span aria-hidden="true">↗</span></button>
        </div>
        <details className={styles.filters} open={Boolean(query.pet||query.parking||query.accessible||query.verified||query.capacityOnly||query.checkIn||query.maxPrice!==null||query.sort!=='name')}>
          <summary>{en?'Refine your search':'ตัวกรองเพิ่มเติม'}<span aria-hidden="true">＋</span></summary>
          <div className={styles.filterBody}>
            <fieldset className={styles.amenities}><legend>{en?'Confirmed information only':'เลือกจากข้อมูลที่ยืนยันว่ามี'}</legend>{([['pet',en?'Pets allowed':'รองรับสัตว์เลี้ยง',query.pet],['parking',en?'Parking':'มีที่จอดรถ',query.parking],['accessible',en?'Accessibility supported':'รองรับการเข้าถึง',query.accessible],['verified',en?'Verified information':'ข้อมูลยืนยันแล้ว',query.verified]] as const).map(([name,label,checked])=><label key={name}><input type="checkbox" name={name} value="1" defaultChecked={checked}/>{label}</label>)}</fieldset>
            <fieldset className={styles.lodging} disabled={!lodging} hidden={!lodging}><legend>{en?'Stay planning & reference prices':'วางแผนที่พักและราคาอ้างอิง'}</legend>
              <div className={styles.stayGrid}><label>{en?'Check-in':'วันเข้าพัก'}<input type="date" name="checkIn" aria-describedby="planning-context" min={today} value={checkIn} onChange={e=>setCheckIn(e.target.value)}/></label><label>{en?'Check-out':'วันออกจากที่พัก'}<input type="date" name="checkOut" aria-describedby="planning-context" min={checkIn||today} defaultValue={query.checkOut}/></label><label>{en?'Guests':'ผู้เข้าพัก'}<input type="number" name="guests" min={1} max={30} defaultValue={query.guests}/></label><label>{en?'Maximum THB / night':'ราคาอ้างอิงไม่เกิน (บาท/คืน)'}<input type="number" name="maxPrice" min={0} max={1000000} step="0.01" defaultValue={query.maxPrice??''}/></label></div>
              <div className={styles.stayOptions}><label><input type="checkbox" name="capacity" value="1" defaultChecked={query.capacityOnly}/>{en?'Recorded property capacity fits this group':'กรองความจุที่บันทึกให้รองรับจำนวนคนนี้'}</label><label>{en?'Sort stays by':'เรียงที่พักตาม'}<select name="sort" defaultValue={query.sort}><option value="name">{en?'Name':'ชื่อ'}</option><option value="price_asc">{en?'Reference price: low to high':'ราคาอ้างอิง: ต่ำไปสูง'}</option><option value="price_desc">{en?'Reference price: high to low':'ราคาอ้างอิง: สูงไปต่ำ'}</option></select></label></div>
              <p id="planning-context" className={styles.hint}>{en?'Dates are for planning only, not live availability or date-specific rates. Capacity is for the property, not available rooms.':'วันที่ใช้วางแผนเท่านั้น ไม่ใช่การตรวจห้องว่างหรือราคาตามวัน ความจุคือจำนวนคนที่สถานที่รองรับ ไม่ใช่ห้องว่าง'}</p>
            </fieldset>
            <p className={styles.hint}>{en?'Unknown facts do not match confirmed-amenity filters. Events without amenity data are excluded when these filters are selected.':'ข้อมูลที่ยังไม่ทราบจะไม่ถูกนับว่ารองรับ อีเวนต์ที่ไม่มีข้อมูลสิ่งอำนวยความสะดวกจะไม่ผ่านตัวกรองเหล่านั้น'}</p>
            <button className={styles.secondary} type="submit" disabled={busy}>{en?'Apply filters':'ใช้ตัวกรอง'}</button>
          </div>
        </details>
        <p className={styles.searchNote}>{en?'Choose a category, or search everything together. No separate stay search needed.':'เลือกประเภทที่สนใจ หรือเลือก “ทั้งหมด” เพื่อค้นหารวม โดยไม่ต้องสลับหน้าค้นหา'}</p>
      </form>
      <section className={styles.results} aria-labelledby="catalog-heading">
        <div className={styles.resultsHead}><div><p className={styles.eyebrow}>{en?'YOUR LOCAL DISCOVERY':'ข้อมูลท้องถิ่นสำหรับทริปของคุณ'}</p><h2 id="catalog-heading">{names[query.type]}{query.q?` · “${query.q}”`:''}</h2><p aria-live="polite">{result?`${new Intl.NumberFormat(locale).format(result.total)} ${en?'published results':'ผลลัพธ์ที่เผยแพร่แล้ว'}`:(en?'Published local catalog':'ฐานข้อมูลท้องถิ่นที่เผยแพร่แล้ว')}</p></div><Link className={styles.reset} href={reset}>{en?'Clear filters':'ล้างตัวกรอง'}</Link></div>
        {query.destination&&<p className={styles.destinationNote}>{en?'Destination':'จุดหมาย'}: {destinations.find(d=>d.slug===query.destination)?.name??query.destination}</p>}
        <p className={styles.catalogNote}>{en?'Recorded reference prices, with their original units. Confirm current prices and availability directly.':'ราคาเป็นข้อมูลอ้างอิงพร้อมหน่วย ไม่ใช่ราคาจอง ยืนยันราคาปัจจุบันและความพร้อมกับสถานที่โดยตรง'}</p>
        {error?<div className={styles.empty} role="alert"><h3>{errors[error]||errors.unavailable}</h3><Link className={styles.secondary} href={error==='unavailable'?href():reset}>{error==='unavailable'?(en?'Try again':'ลองใหม่'):(en?'Clear filters':'ล้างตัวกรอง')}</Link></div>:!result?.items.length?<div className={styles.empty}><span aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg></span><h3>{en?'No places match just yet':'ยังไม่พบสถานที่ที่ตรงเงื่อนไข'}</h3><p>{en?'Try another name, a broader category or fewer filters.':'ลองเปลี่ยนคำค้น เลือก “ทั้งหมด” หรือลดตัวกรองดูครับ'}</p><Link className={styles.secondary} href={reset}>{en?'Explore everything':'ค้นหาทั้งหมด'}</Link></div>:<div className={styles.grid}>{result.items.map(item=><article className={styles.card} key={`${item.kind}-${item.id}`}>
          <div className={`${styles.visual} ${item.catalog_level==='directory'?styles.directoryVisual:''}`}>{item.image_url?<img src={item.image_url} alt={item.image_alt||item.name} loading="lazy"/>:<div className={styles.placeholder}><span aria-hidden="true">⌂</span><span>{item.catalog_level==='directory'?(en?'Explore on the map':'ดูสถานที่บนแผนที่'):(en?'No approved photo yet':'ยังไม่มีภาพที่อนุมัติ')}</span></div>}<span className={styles.kind}>{names[item.type]}</span></div>
          <div className={styles.body}>{query.type!=='all'&&item.type!==query.type&&<p className={styles.categoryMatch}>{names[query.type]} · {en?'secondary category':'หมวดรอง'}</p>}<h3>{item.name}</h3>{item.catalog_level==='directory'&&<p className={styles.sourceBadge}>{en?'Imported directory · not owner verified':'ข้อมูลจากไฟล์ · ยังไม่ยืนยันกับเจ้าของ'}</p>}{item.directory_facts?.rating!=null&&<p className={styles.snapshot}>★ {Number(item.directory_facts.rating).toFixed(1)} · {item.directory_facts.review_count==null?(en?'count unknown':'ไม่ทราบจำนวนรีวิว'):new Intl.NumberFormat(locale).format(item.directory_facts.review_count)} {en?'reviews in source file':'รีวิวตามไฟล์'}<small>{en?'Snapshot, not live Google data or Gebpao reviews':'ข้อมูลตามไฟล์ ไม่ใช่ข้อมูลสดหรือรีวิว Gebpao'}</small></p>}<p className={styles.location}>{item.address||item.destination_name||(en?'Address not yet confirmed':'ยังไม่มีที่อยู่ที่ยืนยัน')}</p>{item.description&&<p className={styles.description}>{item.description}</p>}{item.starts_at&&<p className={styles.date}>{new Intl.DateTimeFormat(en?'en-GB':'th-TH',{timeZone:'Asia/Bangkok',dateStyle:'medium',timeStyle:'short'}).format(new Date(item.starts_at))}</p>}
            <div className={styles.footer}><div className={styles.price}>{item.price!==null&&item.price_unit?<><small>{item.is_estimate?(en?'Estimated reference price':'ราคาอ้างอิงโดยประมาณ'):(en?'Recorded reference price':'ราคาอ้างอิงที่บันทึกไว้')}</small><strong>{new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(item.price)} {item.currency} / {units[item.price_unit]||item.price_unit}</strong></>:<span>{item.directory_facts?.price_text?<>{en?'Price in file':'ราคาตามไฟล์'}: {item.directory_facts.price_text}</>:(en?'Price not recorded':'ยังไม่มีราคาอ้างอิง')}</span>}</div>{item.kind==='place'?<Link className={styles.detail} href={`/places/${encodeURIComponent(item.slug)}?${searchQueryParams({...query,locale})}`}>{en?'Details':'ดูรายละเอียด'} <span aria-hidden="true">→</span></Link>:<EventInterestButton eventId={item.id} label={en?"Interested":"สนใจอีเวนต์นี้"} recordedLabel={en?"Interest recorded":"บันทึกความสนใจแล้ว"}/>}</div>
          </div>
        <AddToTripButton sourceId={item.id} kind={item.kind==='event'?'event':'place'}/></article>)}</div>}
        {!error&&pages>1&&<nav className={styles.pagination} aria-label={en?'Search result pages':'หน้าผลการค้นหา'}>{query.page>1?<Link href={href({page:query.page-1})}>{en?'Previous':'ก่อนหน้า'}</Link>:<span/>}<span>{en?'Page':'หน้า'} {query.page} / {pages}</span>{query.page<pages&&query.page<500?<Link href={href({page:query.page+1})}>{en?'Next':'ถัดไป'}</Link>:<span/>}</nav>}
      </section>
    </div>
  </main>;
}
