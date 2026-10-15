'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {useLocale} from '@/components/i18n/LocaleProvider';
import {HOST_PREPARATION_ITEMS,hostEntryHref,preparationCount,type HostPreparationItem} from '@/lib/host/preparation';
import {hostCopy} from './hostCopy';
import landing from './HostLanding.module.css';
import styles from './HostPreparation.module.css';
export function HostPreparation(){
 const{locale}=useLocale(),t=hostCopy[locale];
 const[step,setStep]=useState(0),[ready,setReady]=useState<HostPreparationItem[]>([]);
 const title=useRef<HTMLHeadingElement>(null),previousStep=useRef(0);
 useEffect(()=>{if(previousStep.current!==step){title.current?.focus();previousStep.current=step}},[step]);
 const items=step===0?HOST_PREPARATION_ITEMS.slice(0,3):HOST_PREPARATION_ITEMS.slice(3);
 const count=preparationCount(ready),missing=HOST_PREPARATION_ITEMS.filter(item=>!ready.includes(item));
 const toggle=(item:HostPreparationItem)=>setReady(current=>current.includes(item)?current.filter(value=>value!==item):[...current,item]);
 return <main className={styles.page}><div className={styles.wrap}>
  <Link className={styles.back} href={`/host?lang=${locale}`}>← {t.back}</Link>
  <header className={styles.header}><p className={landing.eyebrow}>{t.label}</p><h1>{t.prepTitle}</h1><p>{t.prepIntro}</p></header>
  <nav className={styles.steps} aria-label={locale==='en'?'Preparation steps':'ขั้นเตรียมลงประกาศ'}><ol>{t.prepSteps.map((label,index)=><li key={label}><button type="button" aria-current={step===index?'step':undefined} onClick={()=>setStep(index)}><span aria-hidden="true">{index+1}</span>{label}</button></li>)}</ol></nav>
  <div className={styles.layout}><section className={styles.panel} aria-labelledby="preparation-step-title">
   <h2 id="preparation-step-title" ref={title} tabIndex={-1}>{t.prepSteps[step]}</h2><p className={styles.help}>{step===0?t.aboutHelp:step===1?t.detailsHelp:t.reviewHelp}</p>
   {step<2?<fieldset className={styles.checklist}><legend>{t.prepSteps[step]}</legend>{items.map(item=><label key={item}><input type="checkbox" checked={ready.includes(item)} onChange={()=>toggle(item)}/><span>{t.checklist[item]}</span></label>)}</fieldset>:<div className={styles.review}><p className={styles.count}><strong>{count}</strong> {t.countUnit}</p><h3>{t.ready}</h3>{ready.length>0?<ul>{HOST_PREPARATION_ITEMS.filter(item=>ready.includes(item)).map(item=><li key={item}>{t.checklist[item]}</li>)}</ul>:<p>{t.readinessNote}</p>}{missing.length>0?<><h3>{t.missing}</h3><ul>{missing.map(item=><li key={item}>{t.checklist[item]}</li>)}</ul></>:<p>{t.allReady}</p>}</div>}
   <p className={styles.sessionNote}>{t.sessionNote}</p>
   <div className={styles.actions}>{step>0&&<button className={landing.secondary} type="button" onClick={()=>setStep(step-1)}>{t.previous}</button>}{step<2?<button className={landing.primary} type="button" onClick={()=>setStep(step+1)}>{t.next}<span aria-hidden="true">→</span></button>:<Link className={landing.primary} href={hostEntryHref(locale)}>{t.continue}<span aria-hidden="true">→</span></Link>}</div>
  </section><aside className={styles.aside}><span className={styles.free}>{t.free}</span><h2>{t.after}</h2><ol>{t.afterSteps.map(item=><li key={item}>{item}</li>)}</ol><p>{t.noBooking}</p><Link href={hostEntryHref(locale)}>{t.skip} →</Link><Link href={`/contact?lang=${locale}`}>{t.contact} →</Link><Link href={`/privacy?lang=${locale}`}>{locale==='en'?'Privacy':'ความเป็นส่วนตัว'}</Link><Link href={`/terms?lang=${locale}`}>{locale==='en'?'Terms':'ข้อกำหนด'}</Link></aside></div>
 </div></main>;
}
