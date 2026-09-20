'use client';
import {createContext, useContext, useEffect, useState} from 'react';

type Locale='th'|'en';
type LocaleContextValue={locale:Locale;setLocale:(locale:Locale)=>void};
const LocaleContext=createContext<LocaleContextValue|null>(null);
export function LocaleProvider({children}:{children:React.ReactNode}){const[locale,setLocaleState]=useState<Locale>('th');useEffect(()=>{const saved=window.localStorage.getItem('geppao-locale');if(saved==='th'||saved==='en')setLocaleState(saved)},[]);function setLocale(next:Locale){setLocaleState(next);window.localStorage.setItem('geppao-locale',next);document.documentElement.lang=next}useEffect(()=>{document.documentElement.lang=locale},[locale]);return <LocaleContext.Provider value={{locale,setLocale}}>{children}</LocaleContext.Provider>}
export function useLocale(){const value=useContext(LocaleContext);if(!value)throw new Error('useLocale must be used inside LocaleProvider');return value}
