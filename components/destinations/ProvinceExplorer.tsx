'use client';
import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {useWheelCamera} from './useWheelCamera';
import {useLocale} from '@/components/i18n/LocaleProvider';
import {provinceData,provinceSearchHref} from '@/lib/destinations/thailand';
import {terrainTiles,zoomViewBox,placeKind,districtLabels,layoutPlacePins,type ProvinceMapData,type MapPlace} from '@/lib/destinations/province-map';
import s from './ProvinceExplorer.module.css';
const cache=new Map<string,ProvinceMapData>();
/** Warm only the clicked province while the country camera flies in. Failures retain the normal retry UI. */
export function preloadProvince(id:string){
 if(cache.has(id))return;
 void fetch(`/maps/provinces/${id}.json`).then(r=>{if(!r.ok)throw new Error('map unavailable');return r.json()}).then((v:ProvinceMapData)=>{if(v.id===id&&v.districts?.length)cache.set(id,v)}).catch(()=>{});
}
export function ProvinceExplorer({provinceId,onBack,onProvince}:{provinceId:string;onBack:()=>void;onProvince:(id:string)=>void}){
 const {locale}=useLocale(),en=locale==='en',uid=useId();
 const province=provinceData.find(p=>p.id===provinceId)!;
 const [data,setData]=useState<ProvinceMapData|null>(cache.get(provinceId)??null);
 const [error,setError]=useState(false),[attempt,setAttempt]=useState(0),[terrain,setTerrain]=useState(true);
 const [failedTiles,setFailedTiles]=useState<string[]>([]),[loadedTiles,setLoadedTiles]=useState<string[]>([]);
 const [district,setDistrict]=useState(''),[place,setPlace]=useState(''),[zoom,setZoom]=useState(1),[center,setCenter]=useState<[number,number]|undefined>();
 const svgRef=useRef<SVGSVGElement>(null);
 useEffect(()=>{
  if(cache.has(provinceId)){setData(cache.get(provinceId)!);return}
  const abort=new AbortController();setError(false);
  fetch(`/maps/provinces/${provinceId}.json`,{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('map unavailable');return r.json()}).then((v:ProvinceMapData)=>{if(v.id!==provinceId||!v.districts?.length)throw new Error('invalid map');cache.set(provinceId,v);setData(v)}).catch(e=>{if(e.name!=='AbortError')setError(true)});
  return ()=>abort.abort();
 },[provinceId,attempt]);
 const tiles=useMemo(()=>data?terrainTiles(data):[],[data]);
 const view=data?zoomViewBox(data.viewBox,zoom,center,.25):[0,0,1000,1000];
 useWheelCamera(svgRef,data?.viewBox??[0,0,1000,1000],view as [number,number,number,number],next=>{if(data){setZoom(data.viewBox[2]/next[2]);setCenter([next[0]+next[2]/2,next[1]+next[3]/2])}},Boolean(data));
 const activePlace=data?.places.find(p=>p.id===place),activeDistrict=data?.districts.find(d=>d.id===district);
 const shownPlaces=data?.places??[];
 const [size,setSize]=useState({width:760,height:540});
 useEffect(()=>{const svg=svgRef.current;if(!svg)return;const observer=new ResizeObserver(entries=>{const r=entries[0].contentRect;setSize({width:r.width,height:r.height})});observer.observe(svg);return()=>observer.disconnect()},[data]);
 const unit=Math.max(view[2]/size.width,view[3]/size.height); // Marker sizes follow the current viewport, not the geographic extent.
 function pickPlace(p:MapPlace){setPlace(p.id);setCenter([p.x,p.y]);setZoom(2)}
 function reset(){setZoom(1);setCenter(undefined);setDistrict('');setPlace('')}
 function pickDistrict(id:string){setDistrict(id);setPlace('');const d=data?.districts.find(d=>d.id===id);if(d){setCenter([d.x,d.y]);setZoom(2)}else{setZoom(1);setCenter(undefined)}}
 function zoomAt(delta:number){setZoom(z=>Math.max(1,Math.min(4,z+delta)))}
 const allTilesFailed=tiles.length>0&&failedTiles.length===tiles.length;
 const terrainVisible=terrain&&!allTilesFailed;
 return <section className={s.provinceView} data-province-view={provinceId} aria-label={en?'Province explorer':'สำรวจจังหวัด'}>
  <div className={s.breadcrumb}><button type="button" onClick={onBack}>← {en?'Thailand':'ประเทศไทย'}</button><span aria-hidden="true">/</span><h2>{en?province.nameEn:province.name}</h2><label className={s.changeProvince}><span className={s.srOnly}>{en?'Change province':'เปลี่ยนจังหวัด'}</span><select aria-label={en?'Change province':'เปลี่ยนจังหวัด'} value={provinceId} onChange={e=>onProvince(e.target.value)}>{[...provinceData].sort((a,b)=>(en?a.nameEn:a.name).localeCompare(en?b.nameEn:b.name,locale)).map(p=><option key={p.id} value={p.id}>{en?p.nameEn:p.name}</option>)}</select></label></div>
  {!data?<div className={s.loading} role="status">{error?<><h3>{en?'This province map could not load':'ยังโหลดแผนที่จังหวัดไม่ได้'}</h3><p>{en?'You can retry or return to the country map.':'ลองใหม่ หรือกลับไปแผนที่ประเทศไทยได้ครับ'}</p><button type="button" onClick={()=>setAttempt(a=>a+1)}>{en?'Retry':'ลองใหม่'}</button></>:<><span className={s.loadingDot}/><p>{en?'Opening districts and places…':'กำลังเปิดเส้นอำเภอและสถานที่…'}</p></>}</div>:<div className={s.layout}>
   <div className={s.mapColumn}>
    <div className={s.mapToolbar}><div><strong>{en?'A closer look':'รู้จักจังหวัดนี้ให้มากขึ้น'}</strong><span>{data.districts.length} {en?(provinceId==='bangkok'?'districts (khet)':'districts'):(provinceId==='bangkok'?'เขต':'อำเภอ')} · {shownPlaces.length} {en?'selected map points':'หมุดแนะนำจากแผนที่'}</span></div><button type="button" className={s.terrainToggle} aria-pressed={terrain} onClick={()=>{if(!terrain){setFailedTiles([]);setLoadedTiles([])}setTerrain(t=>!t)}}>▧ {en?'Terrain':'ภูมิประเทศ'} <span>{terrain?(en?'On':'เปิด'):(en?'Off':'ปิด')}</span></button></div>
    <div className={s.mapFrame}>
     <svg ref={svgRef} role="img" aria-label={en?`${province.nameEn} district boundaries and points of interest. Use the district selector and place list for keyboard access.`:`เส้นแบ่งอำเภอและสถานที่ใน${province.name} ใช้ช่องเลือกอำเภอและรายชื่อสถานที่ได้ด้วยคีย์บอร์ด`} viewBox={view.join(' ')} className={s.map}>
      <defs><clipPath id={`${uid}-clip`}>{data.districts.map(d=><path key={d.id} d={d.d} fillRule="evenodd" clipRule="evenodd"/>)}</clipPath></defs>
      <rect x={data.viewBox[0]-2000} y={data.viewBox[1]-2000} width={data.viewBox[2]+4000} height={data.viewBox[3]+4000} fill="#edf1e5"/>
      <g clipPath={`url(#${uid}-clip)`}>
       <rect x={data.viewBox[0]} y={data.viewBox[1]} width={data.viewBox[2]} height={data.viewBox[3]} fill="#d1dfbe"/>
       {terrainVisible&&<g className={s.terrainImages}>{tiles.map(t=><image key={t.id} href={t.url} x={t.x} y={t.y} width={t.size} height={t.size} preserveAspectRatio="none" onLoad={()=>setLoadedTiles(a=>a.includes(t.id)?a:[...a,t.id])} onError={()=>setFailedTiles(a=>a.includes(t.id)?a:[...a,t.id])}/>)}</g>}
       {data.districts.map(d=><path data-district={d.id} key={d.id} d={d.d} fillRule="evenodd" className={`${s.district} ${district===d.id?s.activeDistrict:''}`} style={{fillOpacity:terrainVisible ? .12 : .25}} onClick={()=>pickDistrict(d.id)}><title>{en?d.nameEn:d.name}</title></path>)}
      </g>
      <g className={s.districtLabels} aria-hidden="true">{districtLabels(data,view,size,en,district).map(d=><text key={d.id} x={d.x} y={d.y} style={{fontSize:11*unit,strokeWidth:3*unit}}>{en?d.nameEn:d.name}</text>)}</g>
      <g aria-hidden="true">{layoutPlacePins(shownPlaces,unit).map(({place:p,x,y},i)=><g key={p.id}><line x1={p.x} y1={p.y} x2={x} y2={y} stroke="#53764f" strokeWidth={unit} pointerEvents="none"/>{(x!==p.x||y!==p.y)&&<circle cx={p.x} cy={p.y} r={2*unit} fill="#53764f"/>}<g data-map-place={p.id} transform={`translate(${x} ${y}) scale(${unit})`} className={s.placePin} onClick={()=>pickPlace(p)}><circle r="19" fill="transparent"/><circle r={place===p.id?12:9} fill={place===p.id?'#a9572c':'#153e2d'} stroke="white" strokeWidth="2"/><text textAnchor="middle" y="3.5">{i+1}</text></g></g>)}</g>
      {activePlace&&<g aria-hidden="true" className={s.pinLabel} transform={`translate(${Math.max(view[0]+100*unit,Math.min(view[0]+view[2]-100*unit,activePlace.x))} ${Math.max(view[1]+35*unit,activePlace.y-28*unit)}) scale(${unit})`}><rect x="-100" y="-21" width="200" height="33" rx="16"/><text textAnchor="middle" y="0">{(en?activePlace.nameEn:activePlace.name).slice(0,32)}</text></g>}
     </svg>
     <div className={s.compass} aria-hidden="true">N<br/>↑</div>
     <div className={s.zoomControls} role="group" aria-label={en?'Map zoom':'ขยายแผนที่'}><button type="button" aria-label={en?'Zoom in':'ขยาย'} disabled={zoom>=4} onClick={()=>zoomAt(.5)}>+</button><button type="button" aria-label={en?'Zoom out':'ย่อ'} disabled={zoom<=1} onClick={()=>zoomAt(-.5)}>−</button><button type="button" className={s.fit} onClick={reset}>{en?'Fit province':'ดูทั้งจังหวัด'}</button></div>
     <div className={s.mapLegend}><i className={s.legendLine}/>{en?'District boundary':'เส้นแบ่งอำเภอ'}<i className={s.legendPin}/>{en?'Place':'สถานที่'}</div>
    </div>
    <div className={s.districtSelector}><label htmlFor={`${uid}-district`}>{en?(provinceId==='bangkok'?'Choose a district (khet)':'Choose a district'):(provinceId==='bangkok'?'เลือกเขต':'เลือกอำเภอ')}</label><select id={`${uid}-district`} value={district} onChange={e=>pickDistrict(e.target.value)}><option value="">{en?'All districts':'ทั้งหมด'}</option>{[...data.districts].sort((a,b)=>(en?a.nameEn:a.name).localeCompare(en?b.nameEn:b.name,locale)).map(d=><option key={d.id} value={d.id}>{en?d.nameEn:d.name}</option>)}</select></div>
    <div className={s.wheelHint}>{en?'Scroll to zoom. Hold the right mouse button and drag to pan. Move outside the map to scroll the page.':'เลื่อนล้อเมาส์เพื่อซูม คลิกขวาค้างแล้วลากเพื่อเลื่อนแผนที่ เลื่อนนอกแผนที่เพื่อเลื่อนหน้า'}</div><div className={s.mapStatus} role="status">{activeDistrict&&<strong>{en?activeDistrict.nameEn:activeDistrict.name} · </strong>}{terrain&&(allTilesFailed?(en?'Terrain unavailable; district map is still usable.':'ภาพภูมิประเทศไม่พร้อมใช้งาน ยังดูเส้นอำเภอและหมุดได้'):failedTiles.length>0?(en?'Some terrain tiles could not load.':'ภาพภูมิประเทศบางส่วนโหลดไม่สำเร็จ'):loadedTiles.length===0?(en?'Loading terrain…':'กำลังโหลดภาพภูมิประเทศ…'):'')}{!terrain&&(en?'District map · terrain hidden':'แผนที่อำเภอ · ปิดภูมิประเทศ')}</div>
   </div>
   <aside className={s.places} aria-labelledby={`${uid}-places`}><p className={s.eyebrow}>{en?'EXPLORE, ONE STOP AT A TIME':'ค่อย ๆ รู้จัก ทีละจุดหมาย'}</p><h3 id={`${uid}-places`}>{en?'Places to begin':'เริ่มสำรวจจากตรงไหนดี?'}</h3><p className={s.hint}>{en?'Tap a number on the map or choose a place below.':'แตะหมายเลขบนแผนที่ หรือเลือกสถานที่จากรายชื่อ'}</p>
    {shownPlaces.length?<ol className={s.placeList}>{shownPlaces.map((p,i)=><li key={p.id}><button type="button" aria-pressed={place===p.id} onClick={()=>pickPlace(p)}><span className={s.number}>{String(i+1).padStart(2,'0')}</span><span><strong>{en?p.nameEn:p.name}</strong><small>{(en?p.locationNoteEn:p.locationNote)||placeKind(p.kind,en)}</small></span><span aria-hidden="true">↗</span></button>{place===p.id&&<div className={s.placeInfo}><p>{p.coordinateType==='area-center'?(en?'Marker is an approximate centre of a mapped area, not its entrance.':'หมุดเป็นจุดกึ่งกลางโดยประมาณของพื้นที่ ไม่ใช่ทางเข้า'):(en?'Point location from OpenStreetMap.':'พิกัดจุดจาก OpenStreetMap')}</p><a href={p.source} target="_blank" rel="noreferrer">{en?'View map source':'ดูข้อมูลต้นทาง'} ↗</a></div>}</li>)}</ol>:<div className={s.noPlaces}>{en?'No sourced map points in this collection yet. District exploration is still available.':'ชุดข้อมูลนี้ยังไม่มีหมุดสถานที่ของจังหวัดนี้ แต่เลือกดูอำเภอได้ครบ'}</div>}
    <a className={s.searchLink} href={provinceSearchHref(province,locale)}>{en?'Find published places':'ค้นหาสถานที่ที่เผยแพร่แล้ว'} →</a><p className={s.honesty}>{en?'Map suggestions are not verified listings. Opening hours, access and availability may change.':'หมุดแผนที่ไม่ใช่ประกาศที่ผ่านการยืนยัน เวลาเปิด ทางเข้าหรือการเข้าชมอาจเปลี่ยนแปลง'}</p>
   </aside>
  </div>}
  <footer className={s.credits}>{en?'Illustrative boundaries (2019), not navigation.':'เส้นเขตประกอบการสำรวจ (ข้อมูลปี 2019) ไม่ใช่แผนที่นำทาง'} <a href="/maps/PROVINCE_MAP_LICENSE.md">{en?'Data & licenses':'ที่มาและสิทธิ์ข้อมูล'}</a>{terrain&&<> · {en?'Hillshade':'ภาพเงาภูมิประเทศ'}: <a href="https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer" target="_blank" rel="noreferrer">Esri &amp; contributors</a></>} · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></footer>
 </section>;
}
