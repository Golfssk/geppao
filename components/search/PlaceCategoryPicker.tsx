'use client';
import {useId,useState} from 'react';
import {useLocale} from '@/components/i18n/LocaleProvider';
import type {SearchType} from '@/lib/search/query';
import s from './PlaceCategoryPicker.module.css';

const categories: {type:SearchType;th:string;en:string;path:string}[]=[
 {type:'all',th:'ทั้งหมด',en:'Everything',path:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z'},
 {type:'accommodation',th:'ที่พัก',en:'Stays',path:'M3 19V8m18 11V8M3 15h18M3 11h18v4H3zM6 11V6h12v5M8 8h2m4 0h2'},
 {type:'restaurant',th:'ร้านอาหาร',en:'Restaurants',path:'M5 3v6m3-6v6M2 3v6a3 3 0 0 0 6 0M5 12v9M18 3c-3 3-4 7-4 10h4m0-10v18'},
 {type:'cafe',th:'คาเฟ่',en:'Cafes',path:'M4 8h12v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 9h2a3 3 0 0 1 0 6h-2M3 22h16M7 2v3m5-3v3'},
 {type:'attraction',th:'ที่เที่ยว',en:'Attractions',path:'m2 20 7-13 5 8 3-5 5 10H2zM7 11l2 2 2-2M17 3v3m-2-1h4'},
 {type:'activity',th:'กิจกรรม',en:'Activities',path:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM16 8l-2 6-6 2 2-6 6-2Z'},
 {type:'event',th:'อีเวนต์',en:'Events',path:'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM7 2v6m10-6v6M3 11h18m-13 5h2m4 0h2'},
];
type Props={value?:SearchType;onChange?:(value:SearchType)=>void};
export function PlaceCategoryPicker({value,onChange}:Props){
 const {locale}=useLocale(),en=locale==='en',hint=useId();
 const [local,setLocal]=useState<SearchType>('all');
 const selected=value??local;
 return <fieldset className={s.categoryPicker} aria-describedby={hint}>
  <legend className={s.categoryLegend}>{en?'Place category':'ประเภทสถานที่'}</legend>
  <div className={s.categoryRail}>
   {categories.map(c=><label key={c.type} className={s.categoryOption}>
    <input className={s.categoryRadio} type="radio" name="type" value={c.type} checked={selected===c.type} onChange={()=>{setLocal(c.type);onChange?.(c.type);}} onFocus={e=>e.currentTarget.closest('label')?.scrollIntoView({block:'nearest',inline:'nearest'})}/>
    <span className={s.categoryTile}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={c.path}/></svg><span>{en?c.en:c.th}</span></span>
   </label>)}
  </div>
  <p id={hint} className={s.categoryHint}>{en?'Choose a category, then search. Swipe to see more categories.':'เลือกหมวดแล้วกดค้นหา · เลื่อนเพื่อดูหมวดอื่น'}</p>
 </fieldset>;
}
