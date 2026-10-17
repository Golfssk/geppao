'use client';
import {useEffect,useRef,type RefObject} from 'react';
import {wheelFactor,zoomCamera,type Camera} from '@/lib/destinations/wheel-camera';
export function useWheelCamera(ref:RefObject<SVGSVGElement|null>,base:Camera,current:Camera,onChange:(camera:Camera)=>void,enabled:boolean,maxZoom=4){
 const latest=useRef({base,current,onChange,maxZoom});latest.current={base,current,onChange,maxZoom};
 useEffect(()=>{const svg=ref.current;if(!svg||!enabled)return;
  function wheel(e:WheelEvent){if(!Number.isFinite(e.deltaY)||e.deltaY===0)return;const matrix=svg!.getScreenCTM();if(!matrix)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());const c=latest.current;
   e.preventDefault();const next=zoomCamera(c.base,c.current,wheelFactor(e.deltaY,e.deltaMode,svg!.clientHeight),[p.x,p.y],c.maxZoom);latest.current={...c,current:next};c.onChange(next);
  }
  svg.addEventListener('wheel',wheel,{passive:false});return()=>svg.removeEventListener('wheel',wheel);
 },[ref,enabled]);
}
