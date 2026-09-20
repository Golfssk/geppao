'use client';
import {useLocale} from './LocaleProvider';
export function LanguageToggle(){const{locale,setLocale}=useLocale();const next=locale==='th'?'en':'th';return <button className="language-toggle" onClick={()=>setLocale(next)} aria-label={locale==='th'?'Switch language to English':'เปลี่ยนภาษาเป็นไทย'}>{locale==='th'?'EN':'TH'}</button>}
