'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useLocale} from '@/components/i18n/LocaleProvider';
import {STAY_PAGE_SIZE, stayNights, stayQueryParams, type StayQuery} from '@/lib/stays/query';
import type {StayDestination, StayResult} from '@/lib/stays/types';
import {stayCopy} from './copy';
import styles from './Stays.module.css';

type Props = {initialQuery: StayQuery; initialResult: StayResult | null; initialError: string | null; destinations: StayDestination[]; today: string; demo?: boolean};
export function StayDiscovery({initialQuery: query, initialResult: result, initialError: error, destinations, today, demo=false}: Props) {
  const {locale} = useLocale(), baseCopy = stayCopy[locale];
  const t=demo?{...baseCopy,back:locale==='en'?'Back to demo search':'กลับหน้าค้นหา Demo',placeholder:locale==='en'?'Try Garden, Forest or Valley':'ลองค้นหา Garden, Forest หรือ Valley',found:locale==='en'?'demo properties (synthetic fixtures)':'สถานที่ตัวอย่าง (ข้อมูลจำลอง)',intro:locale==='en'?'Try the search with fictional stays. Nothing is bookable.':'ลองค้นหาจากที่พักจำลอง ไม่มีรายการที่จองได้จริง'}:baseCopy;
  const searchPath=demo?'/demo/stays':'/stays';
  const [busy,setBusy]=useState(false), [checkIn,setCheckIn]=useState(query.checkIn), [filtersOpen,setFiltersOpen]=useState(false);
  const nights=stayNights(query), totalPages=Math.ceil((result?.total??0)/STAY_PAGE_SIZE);
  const queryHref=(patch:Partial<StayQuery>)=>`${searchPath}?${stayQueryParams({...query,...patch,locale})}`;
  const pageHref=(page:number)=>queryHref({page});
  const money=(value:number)=>new Intl.NumberFormat(locale==='th'?'th-TH':'en-GB',{style:'currency',currency:'THB',maximumFractionDigits:2}).format(value);
  const chips:{label:string;patch:Partial<StayQuery>}[]=[];
  if(query.q)chips.push({label:query.q,patch:{q:''}});
  if(query.destination)chips.push({label:destinations.find(d=>d.slug===query.destination)?.name??query.destination,patch:{destination:''}});
  for(const[key,label]of [['pet',t.pet],['parking',t.parking],['accessible',t.accessible],['verified',t.verified],['capacityOnly',t.capacity]]as const)if(query[key])chips.push({label,patch:{[key]:false}});
  if(query.maxPrice!==null)chips.push({label:`≤ ${money(query.maxPrice)} ${t.night}`,patch:{maxPrice:null}});
  const errorMessage=error&&error in t?t[error as 'invalid'|'dates'|'past'|'length'|'unavailable']:t.unavailable;
  return <main className={styles.page}>
    <header className={styles.hero}><div className={styles.wrap}>
      <Link className={styles.back} href={demo?`${searchPath}?lang=${locale}`:'/search'}>← {t.back}</Link>
      <div className={styles.titleRow}><div><p className={styles.eyebrow}>{t.eyebrow}</p><h1>{t.title}</h1></div><p className={styles.intro}>{t.intro}</p></div>
    </div></header>
    <div className={styles.wrap}>
      <form action={searchPath} method="get" onSubmit={()=>setBusy(true)} key={stayQueryParams(query).toString()}>
        <input type="hidden" name="lang" value={locale}/>
        <div className={styles.searchPanel}>
          <div className={styles.searchGrid}>
            <label className={styles.query}>{t.search}<input name="q" type="search" maxLength={100} defaultValue={query.q} placeholder={t.placeholder}/></label>
            <label>{t.destination}<select aria-label={t.destination} name="destination" defaultValue={query.destination}><option value="">{t.all}</option>{destinations.map(d=><option key={d.slug} value={d.slug}>{d.name}</option>)}</select></label>
            <button className={styles.primary} type="submit" disabled={busy}>{busy?t.loading:t.submit} <span aria-hidden="true">→</span></button>
          </div>
          <details className={styles.planning} open={Boolean(query.checkIn||query.checkOut||query.capacityOnly||query.guests!==2)}>
            <summary><span>{t.planning}</span><small>{nights!==null?`${nights} ${t.nights} · ${query.guests} ${t.people}`:t.optional}</small><span className={styles.disclosure} aria-hidden="true">+</span></summary>
            <div className={styles.planningGrid}>
              <label>{t.checkIn}<input aria-describedby="date-context" name="checkIn" type="date" min={today} value={checkIn} onChange={e=>setCheckIn(e.target.value)}/></label>
              <label>{t.checkOut}<input aria-describedby="date-context" name="checkOut" type="date" min={checkIn||today} defaultValue={query.checkOut}/></label>
              <label>{t.guests}<input name="guests" type="number" min={1} max={30} required defaultValue={query.guests}/></label>
            </div>
          </details>
          <p id="date-context" className={styles.context}>{t.context}</p>
        </div>
        <div className={styles.layout}>
          <aside className={styles.filterPanel}>
            <h2 className={styles.filterTitle}>{t.filters}</h2>
            <button className={styles.filterToggle} type="button" aria-expanded={filtersOpen} aria-controls="stay-filters" onClick={()=>setFiltersOpen(!filtersOpen)}><span>{t.filters}</span><span className={styles.filterCount}>{chips.length||'+'}</span></button>
            <div id="stay-filters" className={`${styles.filterBody} ${filtersOpen?styles.filterOpen:''}`}>
              <fieldset><legend>{t.filters}</legend>{[['pet',t.pet,query.pet],['parking',t.parking,query.parking],['accessible',t.accessible,query.accessible],['verified',t.verified,query.verified]].map(([name,label,checked])=><label className={styles.checkbox} key={String(name)}><input type="checkbox" name={String(name)} value="1" defaultChecked={Boolean(checked)}/><span>{label}</span></label>)}</fieldset>
              <label className={styles.checkbox}><input type="checkbox" name="capacity" value="1" defaultChecked={query.capacityOnly}/><span>{t.capacity}</span></label><p className={styles.hint}>{t.capacityNote}</p>
              <label className={styles.budget}>{t.budget}<span className={styles.currencyInput}><span aria-hidden="true">฿</span><input name="maxPrice" type="number" min={0} max={1000000} step="0.01" defaultValue={query.maxPrice??''}/></span></label><p className={styles.hint}>{t.budgetNote}</p>
              <button className={styles.secondary} type="submit" disabled={busy}>{t.apply}</button><Link className={styles.clear} href={`${searchPath}?lang=${locale}`}>{t.reset}</Link>
            </div>
          </aside>
          <section className={styles.results} aria-label={t.found}>
            <div className={styles.resultHead}><p aria-live="polite">{result?<><strong>{new Intl.NumberFormat(locale).format(result.total)}</strong> {t.found}</>:t.found}</p><label>{t.sort}<select aria-label={t.sort} name="sort" defaultValue={query.sort} onChange={e=>e.currentTarget.form?.requestSubmit()}><option value="name">{t.name}</option><option value="price_asc">{t.priceAsc}</option><option value="price_desc">{t.priceDesc}</option></select></label></div>
            {chips.length>0&&<nav className={styles.chips} aria-label={t.activeFilters}>{chips.map((chip,index)=><Link key={index} href={queryHref({...chip.patch,page:1})} aria-label={`${t.remove}: ${chip.label}`}>{chip.label}<span aria-hidden="true">×</span></Link>)}</nav>}
            <div className={styles.catalogNote}><p>{t.contact}</p><p>{t.original}</p></div>
            {error?<div className={styles.empty} role="alert"><h2>{errorMessage}</h2><Link className={styles.secondary} href={error==='unavailable'?pageHref(query.page):`${searchPath}?lang=${locale}`}>{error==='unavailable'?t.retry:t.reset}</Link></div>:!result?.items.length?<div className={styles.empty}><h2>{t.empty}</h2><p>{t.emptyHelp}</p><Link href={`${searchPath}?lang=${locale}`} className={styles.secondary}>{t.reset}</Link></div>:<div className={styles.cards}>{result.items.map(stay=>{
              const detailParams=stayQueryParams({...query,locale,page:1});
              const href=`${demo?'/demo/stays':'/places'}/${encodeURIComponent(stay.slug)}?${detailParams}`;
              return <article className={styles.card} key={stay.id}>
                <Link href={href} className={styles.visual} tabIndex={-1} aria-hidden="true">{stay.image_url?<img src={stay.image_url} alt={stay.image_alt||stay.name} loading="lazy"/>:<div className={styles.photoMissing}><span aria-hidden="true">⌂</span><span>{t.noImage}</span></div>}</Link>
                <div className={styles.cardBody}><div className={styles.badges}><span className={stay.verification_status==='verified'?styles.verified:styles.pending}>{demo?(locale==='en'?'Demo badge · fictional':'ป้ายตัวอย่าง · จำลอง'):stay.verification_status==='verified'?`✓ ${t.verified.replace('เท่านั้น','').replace(' only','')}`:t.pending}</span></div><h2><Link href={href}>{stay.name}</Link></h2><p className={styles.location}>{stay.address||stay.destination_name||t.unknownAddress}</p>{stay.description&&<p className={styles.description}>{stay.description}</p>}<div className={styles.amenities}>{stay.pet_friendly===true&&<span>{t.pet}</span>}{stay.parking_available===true&&<span>{t.parking}</span>}{stay.accessibility_supported===true&&<span>{t.accessible}</span>}</div></div>
                <div className={styles.cardAction}><div className={styles.priceBlock}>{stay.price!==null?<><small>{stay.is_estimate?t.estimate:t.reference}</small><p className={styles.price}>{money(stay.price)} <span>{t.night}</span></p></>:<p className={styles.noPrice}>{t.unknownPrice}</p>}</div><Link className={styles.primary} href={href}>{t.view} <span aria-hidden="true">→</span></Link></div>
              </article>;
            })}</div>}
            {totalPages>1&&<nav className={styles.pagination} aria-label={t.page}>{query.page>1?<Link href={pageHref(query.page-1)}>{t.previous}</Link>:<span/>}<span>{t.page} {query.page} {t.of} {totalPages}</span>{query.page<totalPages&&query.page<500?<Link href={pageHref(query.page+1)}>{t.next}</Link>:<span/>}</nav>}
          </section>
        </div>
      </form>
    </div>
  </main>;
}
