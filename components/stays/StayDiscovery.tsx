'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useLocale} from '@/components/i18n/LocaleProvider';
import {stayNights, stayQueryParams, type StayQuery} from '@/lib/stays/query';
import type {StayDestination, StayResult} from '@/lib/stays/types';
import {stayCopy} from './copy';
import styles from './Stays.module.css';
type Props = {initialQuery: StayQuery; initialResult: StayResult | null; initialError: string | null; destinations: StayDestination[]; today: string; demo?: boolean};
export function StayDiscovery({initialQuery: query, initialResult: result, initialError: error, destinations, today, demo=false}: Props) {
  const {locale} = useLocale(), baseCopy = stayCopy[locale];
  const t=demo?{...baseCopy,back:locale==='en'?'Back to demo search':'กลับหน้าค้นหา Demo',placeholder:locale==='en'?'Try Garden, Forest or Valley':'ลองค้นหา Garden, Forest หรือ Valley',found:locale==='en'?'demo properties (synthetic fixtures)':'สถานที่ตัวอย่าง (ข้อมูลจำลอง)',intro:locale==='en'?'Try the stay search UX with clearly labeled synthetic fixtures. Nothing is bookable.':'ลอง UX ค้นหาที่พักด้วยข้อมูลจำลองที่ติดป้ายชัดเจน ไม่มีรายการที่จองได้จริง'}:baseCopy;
  const searchPath=demo?'/demo/stays':'/stays';
  const [mobile,setMobile] = useState(false);
  useEffect(()=>{const media=window.matchMedia('(max-width:760px)');setMobile(media.matches);const update=()=>setMobile(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[]);
  const [busy, setBusy] = useState(false), [checkIn,setCheckIn] = useState(query.checkIn);
  const nights = stayNights(query), totalPages = Math.ceil((result?.total ?? 0) / 12);
  const pageHref = (page: number) => `${searchPath}?${stayQueryParams({...query,page,locale})}`;
  const errorMessage = error && error in t ? t[error as 'invalid' | 'dates' | 'past' | 'length' | 'unavailable'] : t.unavailable;
  return <main className={styles.page}>
    <section className={styles.hero}><div className={styles.wrap}><Link className={styles.back} href={demo?`${searchPath}?lang=${locale}`:"/search"}>← {t.back}</Link><p className={styles.eyebrow}>{t.eyebrow}</p><h1>{t.title}</h1><p className={styles.intro}>{t.intro}</p></div></section>
    <div className={styles.wrap}>
      <form action={searchPath} method="get" onSubmit={() => setBusy(true)} key={stayQueryParams(query).toString()}>
        <input type="hidden" name="lang" value={locale}/>
        <div className={styles.searchPanel}>
          <div className={styles.searchGrid}>
            <label className={styles.query}>{t.search}<input name="q" type="search" maxLength={100} defaultValue={query.q} placeholder={t.placeholder}/></label>
            <label>{t.destination}<select name="destination" defaultValue={query.destination}><option value="">{t.all}</option>{destinations.map(d=><option key={d.slug} value={d.slug}>{d.name}</option>)}</select></label>
            <label>{t.checkIn}<input aria-describedby="date-context" name="checkIn" type="date" min={today} value={checkIn} onChange={e=>setCheckIn(e.target.value)}/></label>
            <label>{t.checkOut}<input aria-describedby="date-context" name="checkOut" type="date" min={checkIn || today} defaultValue={query.checkOut}/></label>
            <label>{t.guests}<input name="guests" type="number" min={1} max={30} required defaultValue={query.guests}/></label>
          </div>
          <div className={styles.searchBottom}><p id="date-context">{t.context}</p><button className={styles.primary} type="submit" disabled={busy}>{busy?t.loading:t.submit} <span aria-hidden>→</span></button></div>
        </div>
        <div className={styles.layout}>
          <aside className={styles.filterPanel}>
            <details open={!mobile}><summary>{t.filters}</summary><div className={styles.filterBody}>
              <fieldset><legend>{t.filters}</legend>{[['pet', t.pet, query.pet],['parking',t.parking,query.parking],['accessible',t.accessible,query.accessible],['verified',t.verified,query.verified]] .map(([name,label,checked])=><label className={styles.checkbox} key={String(name)}><input type="checkbox" name={String(name)} value="1" defaultChecked={Boolean(checked)}/><span>{label}</span></label>)}</fieldset>
              <label className={styles.checkbox}><input type="checkbox" name="capacity" value="1" defaultChecked={query.capacityOnly}/><span>{t.capacity}</span></label><p className={styles.hint}>{t.capacityNote}</p>
              <label className={styles.budget}>{t.budget}<div className={styles.currencyInput}><span>฿</span><input name="maxPrice" type="number" min={0} max={1000000} step="0.01" defaultValue={query.maxPrice ?? ''}/></div></label><p className={styles.hint}>{t.budgetNote}</p>
              <button className={styles.secondary} type="submit" disabled={busy}>{t.apply}</button><Link className={styles.clear} href={`${searchPath}?lang=${locale}`}>{t.reset}</Link>
            </div></details>
          </aside>
          <section className={styles.results} aria-label={t.found}>
            <div className={styles.resultHead}><div><p aria-live="polite">{result?<><strong>{new Intl.NumberFormat(locale).format(result.total)}</strong> {t.found}</>:t.found}</p>{nights!==null&&<small>{nights} {t.nights} · {query.guests} {t.people}</small>}</div><label>{t.sort}<select name="sort" defaultValue={query.sort}><option value="name">{t.name}</option><option value="price_asc">{t.priceAsc}</option><option value="price_desc">{t.priceDesc}</option></select></label></div>
            <p className={styles.sourceNote}>{t.original}</p>
            {error ? <div className={styles.empty} role="alert"><h2>{errorMessage}</h2><Link className={styles.secondary} href={error==='unavailable'?pageHref(query.page):`${searchPath}?lang=${locale}`}>{error==='unavailable'?t.retry:t.reset}</Link></div> : !result?.items.length ? <div className={styles.empty}><h2>{t.empty}</h2><p>{t.emptyHelp}</p><Link href={`${searchPath}?lang=${locale}`} className={styles.secondary}>{t.reset}</Link></div> : <div className={styles.cards}>{result.items.map(stay=>{
              const detailParams = stayQueryParams({...query,locale,page:1});
              const href = `${demo?'/demo/stays':'/places'}/${encodeURIComponent(stay.slug)}?${detailParams}`;
              return <article className={styles.card} key={stay.id}>
                <Link href={href} className={styles.visual} tabIndex={-1} aria-hidden="true">{stay.image_url?<img src={stay.image_url} alt={stay.image_alt||stay.name} loading="lazy"/>:<div className={styles.photoMissing}><span aria-hidden>⌂</span><span>{t.noImage}</span></div>}</Link>
                <div className={styles.cardBody}><div className={styles.badges}><span className={stay.verification_status==='verified'?styles.verified:styles.pending}>{demo?(locale==='en'?'Demo badge · fictional':'ป้ายตัวอย่าง · จำลอง'):stay.verification_status==='verified'?`✓ ${t.verified.replace('เท่านั้น','').replace(' only','')}`:t.pending}</span></div><h2><Link href={href}>{stay.name}</Link></h2><p className={styles.location}>{stay.address||stay.destination_name||t.unknownAddress}</p>{stay.description&&<p className={styles.description}>{stay.description}</p>}<div className={styles.amenities}>{stay.pet_friendly===true&&<span>{t.pet}</span>}{stay.parking_available===true&&<span>{t.parking}</span>}{stay.accessibility_supported===true&&<span>{t.accessible}</span>}</div></div>
                <div className={styles.cardAction}>{stay.price!==null?<><small>{stay.is_estimate?t.estimate:t.reference}</small><p className={styles.price}>{new Intl.NumberFormat(locale==='th'?'th-TH':'en-GB',{style:'currency',currency:'THB',maximumFractionDigits:2}).format(stay.price)} <span>{t.night}</span></p></>:<p className={styles.noPrice}>{t.unknownPrice}</p>}<p className={styles.hint}>{t.contact}</p><Link className={styles.primary} href={href}>{t.view} <span aria-hidden>→</span></Link></div>
              </article>;
            })}</div>}
            {totalPages>1&&<nav className={styles.pagination} aria-label={t.page}>{query.page>1?<Link href={pageHref(query.page-1)}>{t.previous}</Link>:<span/>}<span>{t.page} {query.page} {t.of} {totalPages}</span>{query.page<totalPages&&query.page<500?<Link href={pageHref(query.page+1)}>{t.next}</Link>:<span/>}</nav>}
          </section>
        </div>
      </form>
    </div>
  </main>;
}
