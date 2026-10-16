'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {Brand} from '@/components/brand/Brand';
import {Logo} from '@/components/brand/Logo';
import {UserNav} from '@/components/auth/UserNav';
import {LanguageToggle} from '@/components/i18n/LanguageToggle';
import {useLocale} from '@/components/i18n/LocaleProvider';
import styles from './SiteChrome.module.css';
function Icon({name}:{name:string}) {
 const paths:Record<string,string>={home:'M3 10 12 3l9 7v11h-6v-7H9v7H3Z',plan:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',trips:'M6 7h12v14H6ZM9 7V3h6v4',user:'M4 21v-2a8 8 0 0 1 16 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',host:'M3 21V7l9-4 9 4v14ZM9 21v-8h6v8',menu:'M4 6h16M4 12h16M4 18h16',close:'m6 6 12 12M6 18 18 6',collapse:'M9 4v16M4 4h16v16H4Zm7 8 5-4v8Z'};
 return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{name==='search'?<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></>:<path d={paths[name]||paths.home}/>}</svg>;
}
type Props={children:React.ReactNode;name:string;email:string|null;isAdmin:boolean};
export function SiteChrome({children,name,email,isAdmin}:Props){
 const {locale}=useLocale(),pathname=usePathname(),en=locale==='en';
 const [collapsed,setCollapsed]=useState(false),[open,setOpen]=useState(false),[mobile,setMobile]=useState(false);
 const side=useRef<HTMLElement>(null),menu=useRef<HTMLButtonElement>(null);
 const adminWorkspace=pathname==='/admin'||pathname.startsWith('/admin/')||pathname==='/demo/admin'||pathname.startsWith('/demo/admin/');const preparation=pathname==='/host/start'||adminWorkspace;
 useEffect(()=>{const query=window.matchMedia('(max-width: 1023px)');const update=()=>{setMobile(query.matches);setOpen(false)};update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[]);
 useEffect(()=>{setOpen(false)},[pathname]);
 useEffect(()=>{
  if(!mobile||!open)return;
  const previous=document.activeElement as HTMLElement|null,old=document.body.style.overflow;document.body.style.overflow='hidden';
  const focusable=()=>Array.from(side.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')||[]).filter(el=>el.getClientRects().length);
  focusable()[0]?.focus();
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);e.preventDefault()}if(e.key==='Tab'){const nodes=focusable(),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){last?.focus();e.preventDefault()}else if(!e.shiftKey&&document.activeElement===last){first?.focus();e.preventDefault()}}};
  document.addEventListener('keydown',key);return()=>{document.body.style.overflow=old;document.removeEventListener('keydown',key);(previous?.isConnected?previous:menu.current)?.focus()};
 },[mobile,open]);
 const nav=[['/','Home','หน้าหลัก','home'],['/search','Search places','ค้นหาสถานที่','search'],['/planner','Plan a trip','วางแผนทริป','plan'],['/trips','My trips','ทริปของฉัน','trips']];
 const active=(href:string)=>href==='/'?(pathname==='/'||pathname==='/go'||pathname.startsWith('/go/')):pathname===href||pathname.startsWith(href+'/')||(href==='/search'&&pathname==='/stays');
 const current=nav.find(([href])=>active(href));
 return <div className={`${styles.shell} ${collapsed?styles.collapsed:''} ${preparation?styles.focused:''}`}>
  <a className="skipLink" href="#main-content">{en?'Skip to content':'ข้ามไปเนื้อหาหลัก'}</a>
  {!preparation&&<>
   {mobile&&open&&<button tabIndex={-1} className={styles.backdrop} aria-label={en?'Close navigation':'ปิดเมนู'} onClick={()=>setOpen(false)}/>}
   <aside id="site-sidebar" ref={side} className={`${styles.sidebar} ${open?styles.open:''}`} role={mobile&&open?'dialog':undefined} aria-modal={mobile&&open?true:undefined} aria-label={en?'Main menu':'เมนูหลัก'} inert={mobile&&!open}>
    <div className={styles.sidebarHead}><Link href="/" className={styles.brandLink} aria-label="GepPao home">{collapsed&&!mobile?<Logo size={36}/>:<Brand/>}</Link><button className={styles.iconButton} onClick={()=>mobile?setOpen(false):setCollapsed(v=>!v)} aria-label={mobile?(en?'Close navigation':'ปิดเมนู'):(collapsed?(en?'Expand sidebar':'ขยายเมนู'):(en?'Collapse sidebar':'ย่อเมนู'))} aria-expanded={mobile?open:!collapsed}><Icon name={mobile?'close':'collapse'}/></button></div>
    <Link href="/planner" className={styles.newTrip} title={en?'Create a trip':'สร้างทริปใหม่'}><span aria-hidden="true">＋</span><span className={styles.label}>{en?'Create a trip':'สร้างทริปใหม่'}</span></Link>
    <p className={styles.sectionLabel}>{en?'YOUR NEXT JOURNEY':'เริ่มการเดินทาง'}</p>
    <nav className={styles.navigation} aria-label="Primary navigation">{nav.map(([href,eng,th,icon])=><Link href={href} key={href} className={`${styles.navLink} ${active(href)?styles.active:''}`} aria-current={active(href)?'page':undefined} title={en?eng:th}><Icon name={icon}/><span className={styles.label}>{en?eng:th}</span></Link>)}</nav>
    <div className={styles.sidebarBottom}><Link href="/host" className={styles.navLink} title={en?'For local businesses':'สำหรับเจ้าของธุรกิจ'}><Icon name="host"/><span className={styles.label}>{en?'For local businesses':'สำหรับเจ้าของธุรกิจ'}</span></Link><div className={styles.account}><>{collapsed&&!mobile?<button className={styles.iconButton} onClick={()=>setCollapsed(false)} aria-label={en?'Open account menu':'เปิดเมนูบัญชี'} title={en?'Account / sign in':'บัญชี / เข้าสู่ระบบ'}><Icon name="user"/></button>:<UserNav layout="sidebar" name={name} email={email} isAdmin={isAdmin}/>}</></div></div>
   </aside>
  </>}
  <div className={styles.workspace} inert={mobile&&open}>
   <header className={styles.header}><div className={styles.inner}>{!preparation&&<button ref={menu} className={`${styles.iconButton} ${styles.mobileMenu}`} onClick={()=>setOpen(true)} aria-controls="site-sidebar" aria-expanded={open} aria-label={en?'Open navigation':'เปิดเมนู'}><Icon name="menu"/></button>}<Link href="/" className={styles.mobileBrand} aria-label="GepPao home"><Brand/></Link><span className={styles.pageLabel}>{current?(en?current[1]:current[2]):'GepPao'}</span><div className={styles.actions}><LanguageToggle/>{preparation&&<UserNav name={name} email={email} isAdmin={isAdmin}/>}</div></div></header>
   <div id="main-content" tabIndex={-1}>{children}</div>
   {!preparation&&<footer className={styles.footer}><div className={styles.footerInner}><div className={styles.footerGrid}><div><Logo size={42}/><p>{en?'A little curiosity. A practical trip.':'เริ่มจากความอยากไป ให้กลายเป็นทริปของคุณ'}</p></div><div><h4>{en?'Discover':'ค้นพบ'}</h4><p><Link href="/">{en?'Destinations':'เก็บเป๋า ไปไหน?'}</Link></p><p><Link href="/search">{en?'Explore places':'ค้นหาสถานที่'}</Link></p></div><div><h4>{en?'Plan':'วางแผน'}</h4><p><Link href="/planner">Trip Planner</Link></p><p><Link href="/trips">{en?'Saved trips':'ทริปของฉัน'}</Link></p></div><div><h4>{en?'Information':'ข้อมูล'}</h4><p><Link href="/contact">{en?'Contact us':'ติดต่อเรา'}</Link></p><p><Link href="/privacy">{en?'Privacy':'ความเป็นส่วนตัว'}</Link> · <Link href="/terms">{en?'Terms':'ข้อกำหนด'}</Link></p></div></div><div className={styles.footerBottom}>GepPao · {en?'Places worth discovering. Trips worth taking.':'พบที่ที่ชอบ แล้วออกไปในแบบของคุณ'}</div></div></footer>}
  </div>
 </div>;
}
