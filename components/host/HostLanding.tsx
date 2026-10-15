'use client';
import Link from 'next/link';
import {useLocale} from '@/components/i18n/LocaleProvider';
import {hostEntryHref} from '@/lib/host/preparation';
import {hostCopy} from './hostCopy';
import styles from './HostLanding.module.css';
export function HostLanding(){
 const{locale}=useLocale(),t=hostCopy[locale];
 const start=`/host/start?lang=${locale}`;
 return <main className={styles.page}>
  <section className={`${styles.wrap} ${styles.hero}`}>
   <div className={styles.heroCopy}><p className={styles.eyebrow}>{t.label}</p><h1>{t.title}</h1><p className={styles.subtitle}>{t.subtitle}</p><p className={styles.intro}>{t.intro}</p><div className={styles.heroActions}><Link className={styles.primary} href={start}>{t.start}<span aria-hidden="true">→</span></Link><Link className={styles.secondary} href={hostEntryHref(locale,'places')}>{t.manage}</Link></div><p className={styles.feeNote}>{t.free}</p></div>
   <aside className={styles.guide} aria-labelledby="host-process"><span className={styles.guideLabel}>{t.previewLabel}</span><h2 id="host-process">{t.process}</h2><ol>{t.steps.map((step,i)=><li key={step}><span className={styles.stepNumber} aria-hidden="true">0{i+1}</span><div><h3>{step}</h3><p>{t.stepNotes[i]}</p></div></li>)}</ol><p className={styles.guideNote}>{t.processNote}</p></aside>
  </section>
  <section className={`${styles.wrap} ${styles.benefits}`} aria-label={locale==='en'?'Why join GepPao':'เหตุผลที่เริ่มกับ GepPao'}>{t.benefits.map(([title,note])=><article key={title}><h2>{title}</h2><p>{note}</p></article>)}</section>
  <section className={`${styles.wrap} ${styles.section}`} aria-labelledby="host-status-heading"><div className={styles.sectionHeading}><h2 id="host-status-heading">{t.workflow}</h2><p>{t.workflowNote}</p></div><ol className={styles.workflow}>{t.statuses.map((status,i)=><li key={status}><span className={styles.statusMarker} aria-hidden="true">{i+1}</span><div><h3>{status}</h3><p>{t.statusNotes[i]}</p></div></li>)}</ol><p className={styles.boundary}>{t.noBooking}</p></section>
  <section className={`${styles.wrap} ${styles.section}`} aria-labelledby="host-faq"><div className={styles.faqLayout}><div><p className={styles.eyebrow}>{t.free}</p><h2 id="host-faq">{t.faqTitle}</h2><p className={styles.intro}>{t.freeNote}</p></div><div className={styles.faq}>{t.faq.map(([question,answer])=><details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></section>
  <section className={`${styles.wrap} ${styles.section}`}><div className={styles.help}><div><h2>{t.readiness}</h2><p>{t.readinessNote}</p></div><Link className={styles.primary} href={start}>{t.start}<span aria-hidden="true">→</span></Link></div><div className={styles.contact}><p>{t.help} {t.helpNote}</p><Link href={`/contact?lang=${locale}`}>{t.contact} →</Link></div></section>
 </main>;
}
