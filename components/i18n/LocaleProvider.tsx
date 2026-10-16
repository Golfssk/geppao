'use client';
import {useRouter} from 'next/navigation';
import {createContext, useContext, useEffect, useState} from 'react';
type Locale = 'th' | 'en';
type LocaleContextValue = {locale: Locale; setLocale: (locale: Locale) => void};
const LocaleContext = createContext<LocaleContextValue | null>(null);
export function LocaleProvider({children,initialLocale='th'}: {children: React.ReactNode;initialLocale?:Locale}) {
  const router=useRouter();
  const [locale,setLocaleState] = useState<Locale>(initialLocale);
  useEffect(() => {
    function restore() {
      const explicit = new URLSearchParams(window.location.search).get('lang');
      let saved: string | null = null;
      try {saved = window.localStorage.getItem('geppao-locale');} catch {/* Storage may be disabled. */}
      const cookie = document.cookie.match(/(?:^|;\s*)geppao-locale=(th|en)(?:;|$)/)?.[1];
      const next = explicit === 'th' || explicit === 'en' ? explicit : cookie || saved;
      if (next === 'th' || next === 'en') setLocaleState(next);
    }
    restore(); window.addEventListener('popstate',restore);
    return () => window.removeEventListener('popstate',restore);
  },[]);
  function setLocale(next: Locale) {
    setLocaleState(next);
    document.cookie=`geppao-locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol==='https:'?'; Secure':''}`;
    try {window.localStorage.setItem('geppao-locale',next);} catch {/* Locale still works in memory. */}
    const url = new URL(window.location.href);
    url.searchParams.set('lang',next);
    window.history.replaceState(null,'',url.pathname + url.search + url.hash);
    router.refresh();
  }
  useEffect(() => {document.documentElement.lang = locale;},[locale]);
  return <LocaleContext.Provider value={{locale,setLocale}}>{children}</LocaleContext.Provider>;
}
export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside LocaleProvider');
  return value;
}
