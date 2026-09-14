'use client';
import { useMemo, useState } from 'react';
import type { Listing } from '@/types/listing';
import { ListingCard } from '@/components/listing/ListingCard';

const CATEGORY_LABELS:Record<string,string>={'pool-villa':'พูลวิลล่า','camping':'แคมป์ปิ้ง','cafe':'คาเฟ่'};
const VIBE_LABELS:Record<string,string>={party:'ปาร์ตี้',group:'กลุ่มใหญ่',nature:'ธรรมชาติ',chill:'ชิล',cafe:'คาเฟ่',family:'ครอบครัว',couple:'คู่รัก'};
type SortKey='recommended'|'price-asc'|'price-desc';

export function SearchClient({listings,initialVibe}:{listings:Listing[];initialVibe?:string}){
  const regions=useMemo(()=>Array.from(new Set(listings.map(l=>l.region))),[listings]);
  const categories=useMemo(()=>Array.from(new Set(listings.map(l=>l.category))),[listings]);
  const vibes=useMemo(()=>Array.from(new Set(listings.flatMap(l=>l.vibe))),[listings]);
  const maxPrice=useMemo(()=>Math.max(...listings.map(l=>l.price)),[listings]);

  const [region,setRegion]=useState('');
  const [category,setCategory]=useState('');
  const [selectedVibes,setSelectedVibes]=useState<string[]>(initialVibe?[initialVibe]:[]);
  const [guests,setGuests]=useState(0);
  const [priceMax,setPriceMax]=useState(maxPrice);
  const [petFriendly,setPetFriendly]=useState(false);
  const [sort,setSort]=useState<SortKey>('recommended');

  function toggleVibe(v:string){setSelectedVibes(prev=>prev.includes(v)?prev.filter(x=>x!==v):[...prev,v]);}

  const results=useMemo(()=>{
    let r=listings.filter(l=>
      (!region||l.region===region)&&
      (!category||l.category===category)&&
      (selectedVibes.length===0||selectedVibes.some(v=>l.vibe.includes(v)))&&
      (!guests||l.capacity>=guests)&&
      l.price<=priceMax&&
      (!petFriendly||l.petFriendly)
    );
    if(sort==='price-asc')r=[...r].sort((a,b)=>a.price-b.price);
    if(sort==='price-desc')r=[...r].sort((a,b)=>b.price-a.price);
    if(sort==='recommended')r=[...r].sort((a,b)=>(b.tier==='premium'?1:0)-(a.tier==='premium'?1:0));
    return r;
  },[listings,region,category,selectedVibes,guests,priceMax,petFriendly,sort]);

  return <div className="search-layout">
    <aside className="filters">
      <div className="filter-group"><h4>โซน</h4><select value={region} onChange={e=>setRegion(e.target.value)}><option value="">ทั้งหมด</option>{regions.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
      <div className="filter-group"><h4>ประเภทที่พัก</h4><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">ทั้งหมด</option>{categories.map(c=><option key={c} value={c}>{CATEGORY_LABELS[c]||c}</option>)}</select></div>
      <div className="filter-group"><h4>ช่วงราคาสูงสุด</h4><input type="range" min={0} max={maxPrice} value={priceMax} onChange={e=>setPriceMax(Number(e.target.value))}/><div className="muted">฿{priceMax.toLocaleString()}</div></div>
      <div className="filter-group"><h4>จำนวนคน</h4><input type="number" min={0} value={guests||''} placeholder="ไม่ระบุ" onChange={e=>setGuests(Number(e.target.value))}/></div>
      <div className="filter-group"><h4>Vibe</h4><div className="vibe-list">{vibes.map(v=><button key={v} className={`chip-filter ${selectedVibes.includes(v)?'active':''}`} onClick={()=>toggleVibe(v)}>{VIBE_LABELS[v]||v}</button>)}</div></div>
      <div className="filter-group"><label className="checkbox-row"><input type="checkbox" checked={petFriendly} onChange={e=>setPetFriendly(e.target.checked)}/>พาสัตว์เลี้ยงไปได้</label></div>
    </aside>
    <div className="results">
      <div className="results-head"><span className="muted">{results.length} ที่พัก</span><select value={sort} onChange={e=>setSort(e.target.value as SortKey)}><option value="recommended">แนะนำ</option><option value="price-asc">ราคา: ต่ำ-สูง</option><option value="price-desc">ราคา: สูง-ต่ำ</option></select></div>
      <div className="grid">{results.map(l=><ListingCard key={l.id} listing={l}/>)}</div>
      {results.length===0&&<p className="muted">ไม่พบที่พักตามเงื่อนไขที่เลือก ลองปรับตัวกรองดูครับ</p>}
    </div>
  </div>;
}