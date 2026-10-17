/** Right-button panning only: normal primary clicks, touch and page scrolling remain native. */
export function bindMapRightDrag(svg:SVGSVGElement,onPan:(dx:number,dy:number)=>void){
 const host=svg.ownerDocument.defaultView!;
 let drag:{id:number;x:number;y:number}|null=null;
 function stop(){const previous=drag;drag=null;svg.removeAttribute('data-map-panning');if(previous&&svg.hasPointerCapture(previous.id))svg.releasePointerCapture(previous.id)}
 function down(e:PointerEvent){
  if(e.pointerType!=='mouse'||e.button!==2||drag)return;
  e.preventDefault();drag={id:e.pointerId,x:e.clientX,y:e.clientY};svg.setAttribute('data-map-panning','true');
  // Window listeners also finish the gesture if the pointer is released outside the map.
  try{svg.setPointerCapture(e.pointerId)}catch{/* Capture can be unavailable for a detached pointer. */}
 }
 function move(e:PointerEvent){
  if(!drag||e.pointerId!==drag.id)return;
  if(!(e.buttons&2)){stop();return}
  e.preventDefault();const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
  const matrix=svg.getScreenCTM();if(!matrix)return;
  const inverse=matrix.inverse();onPan(inverse.a*dx+inverse.c*dy,inverse.b*dx+inverse.d*dy);
 }
 function up(e:PointerEvent){if(drag&&e.pointerId===drag.id)stop()}
 function context(e:Event){e.preventDefault()}
 // Do not activate a province/district/POI if buttons are chorded during a right drag.
 function click(e:Event){if(drag){e.preventDefault();e.stopPropagation()}}
 svg.addEventListener('pointerdown',down);svg.addEventListener('lostpointercapture',up);
 svg.addEventListener('contextmenu',context);svg.addEventListener('click',click,true);
 host.addEventListener('pointermove',move,{passive:false});host.addEventListener('pointerup',up);host.addEventListener('pointercancel',up);host.addEventListener('blur',stop);
 return()=>{stop();svg.removeEventListener('pointerdown',down);svg.removeEventListener('lostpointercapture',up);svg.removeEventListener('contextmenu',context);svg.removeEventListener('click',click,true);host.removeEventListener('pointermove',move);host.removeEventListener('pointerup',up);host.removeEventListener('pointercancel',up);host.removeEventListener('blur',stop)};
}
