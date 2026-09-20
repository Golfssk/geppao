'use client';
import {useLocale} from './LocaleProvider';
import styles from './LanguageToggle.module.css';
export function LanguageToggle(){const{locale,setLocale}=useLocale();return <div className={styles.toggle} role="group" aria-label="Language"><button type="button" className={locale==='th'?styles.active:''} onClick={()=>setLocale('th')} aria-pressed={locale==='th'}>TH</button><button type="button" className={locale==='en'?styles.active:''} onClick={()=>setLocale('en')} aria-pressed={locale==='en'}>EN</button></div>}
