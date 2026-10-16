'use client';
import {useLocale} from './LocaleProvider';
import styles from './LanguageToggle.module.css';
export function LanguageToggle(){const{locale,setLocale}=useLocale();return <div className={styles.toggle} role="group" aria-label={locale==='en'?'Language':'ภาษา'}><button type="button" className={locale==='th'?styles.active:''} title="ภาษาไทย" lang="th" onClick={()=>setLocale('th')} aria-pressed={locale==='th'}>TH</button><button type="button" className={locale==='en'?styles.active:''} title="English" lang="en" onClick={()=>setLocale('en')} aria-pressed={locale==='en'}>EN</button></div>}
