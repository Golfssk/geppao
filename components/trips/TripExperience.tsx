'use client';
import {useState} from 'react';
import {useLocale} from '@/components/i18n/LocaleProvider';
import {TripMetadataEditor} from './TripMetadataEditor';
import {TripWorkspace} from './TripWorkspace';
import {TripGroupTools} from './TripGroupTools';
export function TripExperience({trip,candidates,wishlist,canEdit,isOwner,currentUserId}:{trip:any;candidates:any[];wishlist:any[]|null;canEdit:boolean;isOwner:boolean;currentUserId:string}){
 const {locale}=useLocale(),en=locale==='en';const[view,setView]=useState('plan'),[groupTab,setGroupTab]=useState('members');
 return <div className="trip-experience">{isOwner&&<TripMetadataEditor trip={trip}/>}<nav className="trip-view-tabs" aria-label={en?'Trip workspace views':'มุมมองทริป'}>{[['plan','แผน','Plan'],['map','แผนที่','Map'],['money','ค่าใช้จ่าย','Expenses'],['group','เพื่อนและการเตรียมตัว','Group & preparation']].map(([id,th,english])=><button type="button" className="btn" key={id} aria-pressed={view===id} onClick={()=>{window.scrollTo({top:0,behavior:'instant'});setView(id);if(id==='money')setGroupTab('money');else if(id==='group'&&groupTab==='money')setGroupTab('members')}}>{en?english:th}</button>)}</nav>
 <div hidden={view==='money'||view==='group'}><TripWorkspace trip={trip} candidates={candidates} wishlist={wishlist} canEdit={canEdit} isOwner={isOwner} view={view==='map'?'map':'plan'}/></div>
 <div hidden={view==='plan'||view==='map'}><header className="trip-view-context"><p className="eyebrow">{en?'YOUR TRIP':'ทริปของคุณ'}</p><h1>{trip.title}</h1><p className="muted">{trip.start_date} – {trip.end_date}</p></header><TripGroupTools tripId={trip.id} canEdit={canEdit} isOwner={isOwner} currentUserId={currentUserId} activeTab={groupTab} onTabChange={tab=>{setGroupTab(tab);setView(tab==='money'?'money':'group')}}/></div></div>;
}
